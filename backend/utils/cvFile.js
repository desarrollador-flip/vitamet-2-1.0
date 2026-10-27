const path = require('node:path');
const yauzl = require('yauzl');
const { FormInputError, requireInput } = require('./formValidation');

// Airtable documenta hasta 5 MB; se usa la interpretación decimal conservadora.
const maxCvBytes = 5_000_000;
const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const invalidFile = 'El CV debe ser un archivo PDF o DOCX válido, sin cifrado.';

async function validateDocx(buffer) {
    const zip = await yauzl.fromBufferPromise(buffer, { lazyEntries: true, strictFileNames: true });
    const parts = new Map();
    const names = new Set();
    let totalSize = 0;
    try {
        for await (const entry of zip.eachEntry()) {
            requireInput(names.size < 256 && !names.has(entry.fileName), invalidFile);
            names.add(entry.fileName);
            totalSize += entry.uncompressedSize;
            requireInput(totalSize <= 20_000_000 && !(entry.generalPurposeBitFlag & 1)
                && !/vbaProject\.bin$/i.test(entry.fileName), invalidFile);
            const keep = ['[Content_Types].xml', '_rels/.rels', 'word/document.xml'].includes(entry.fileName);
            if (keep) requireInput(entry.uncompressedSize <= 2_000_000, invalidFile);
            const chunks = [];
            let size = 0;
            const stream = await zip.openReadStreamPromise(entry);
            for await (const chunk of stream) {
                size += chunk.length;
                requireInput(size <= entry.uncompressedSize && size <= 20_000_000, invalidFile);
                if (keep) chunks.push(chunk);
            }
            if (keep) parts.set(entry.fileName, Buffer.concat(chunks).toString('utf8'));
        }
    } finally {
        zip.close();
    }

    const types = parts.get('[Content_Types].xml') || '';
    const relations = parts.get('_rels/.rels') || '';
    const document = parts.get('word/document.xml') || '';
    requireInput([...parts.values()].every((xml) => !/<!DOCTYPE|<!ENTITY/i.test(xml)), invalidFile);
    requireInput(/<Override\b[^>]*\bPartName=["']\/word\/document\.xml["'][^>]*>/i.test(types)
        && types.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'), invalidFile);
    requireInput(/<Relationship\b[^>]*\bTarget=["']\/?word\/document\.xml["'][^>]*>/i.test(relations)
        && /\/officeDocument["']/.test(relations), invalidFile);
    requireInput(/<(?:[\w.-]+:)?document\b/.test(document) && /<(?:[\w.-]+:)?body(?:\s|>)/.test(document)
        && /(?:schemas\.openxmlformats\.org\/wordprocessingml\/2006\/main|purl\.oclc\.org\/ooxml\/wordprocessingml\/main)/.test(document), invalidFile);
}

async function validateCv(file) {
    requireInput(file && Buffer.isBuffer(file.buffer) && file.buffer.length > 0, 'Adjunta un CV en PDF o DOCX.');
    requireInput(file.buffer.length <= maxCvBytes, 'El CV supera el límite de 5.000.000 bytes.', 413);
    const extension = path.extname(file.originalname || '').toLowerCase();
    requireInput(['.pdf', '.docx'].includes(extension), invalidFile);

    try {
        if (extension === '.pdf') {
            const header = file.buffer.subarray(0, 16).toString('latin1');
            const tail = file.buffer.subarray(-1024).toString('latin1');
            requireInput(/^%PDF-(?:1\.[0-7]|2\.0)(?:\r|\n)/.test(header) && /%%EOF\s*$/.test(tail), invalidFile);
        } else {
            requireInput(file.buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])), invalidFile);
            await validateDocx(file.buffer);
        }
    } catch {
        throw new FormInputError(invalidFile);
    }
    // No conservar rutas o nombres del equipo del candidato, ni confiar en el MIME declarado.
    return { filename: `cv${extension}`, contentType: extension === '.pdf' ? 'application/pdf' : docxMime };
}

module.exports = { validateCv, maxCvBytes };
