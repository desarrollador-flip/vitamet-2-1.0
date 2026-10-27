const assert = require('node:assert/strict');
const http = require('node:http');
const { deflateRawSync } = require('node:zlib');
const { after, before, beforeEach, mock, test } = require('node:test');
const axios = require('axios');
const dotenv = require('dotenv');

const testEnv = {
    AIRTABLE_API_KEY: 'test-only-key',
    AIRTABLE_POST_FORM_CON: 'test-only-con-base', AIRTABLE_POST_TABLE_CON: 'test-only-con-table',
    AIRTABLE_POST_FORM_CV: 'test-only-cv-base', AIRTABLE_POST_TABLE_CV: 'test-only-cv-table',
};
const originalEnv = Object.fromEntries(Object.keys(testEnv).map((key) => [key, process.env[key]]));
Object.assign(process.env, testEnv);
mock.method(dotenv, 'config', () => ({}));
const originalAdapter = axios.defaults.adapter;
axios.defaults.adapter = async () => { throw new Error('External HTTP disabled in tests'); };
const recordId = 'rec00000000000000';
const attachmentId = 'att00000000000000';
async function providerSuccess(url, data) {
    if (url.startsWith('https://api.airtable.com/')) return { data: { id: recordId } };
    assert.ok(url.startsWith('https://content.airtable.com/'));
    return { data: { id: recordId, fields: { fldAttachment: [{ id: attachmentId, filename: data.filename, size: Buffer.from(data.file, 'base64').length }] } } };
}
const postMock = mock.method(axios, 'post', providerSuccess);
const deleteMock = mock.method(axios, 'delete', async () => { throw new Error('Deletion forbidden'); });
const logMock = mock.method(console, 'error', () => {});
const app = require('../index');
let server;
let sequence = 0;
const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 0 /Kids [] >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n');
const defaultFile = { name: 'candidate.pdf', mime: 'application/pdf', bytes: pdf };

function contactFields() {
    return { name: `Persona ${++sequence}`, email: 'Person@Example.COM', subject: 'asesoria', message: 'Necesito información sobre sus servicios.', formSource: 'consulta_contacto' };
}
function cvFields() {
    return { name: `Persona ${++sequence}`, phone: '+52 (81) 1234-5678', location: 'monterrey', formSource: 'cv_contacto' };
}

// ZIPs pequeños y deterministas para probar documentos reales y estructuras manipuladas.
function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
}
function zip(entries, flags = 0) {
    const locals = [];
    const central = [];
    let offset = 0;
    for (const [name, text] of entries) {
        const filename = Buffer.from(name);
        const bytes = Buffer.from(text);
        const compressed = deflateRawSync(bytes);
        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(flags, 6); local.writeUInt16LE(8, 8);
        local.writeUInt32LE(crc32(bytes), 14); local.writeUInt32LE(compressed.length, 18); local.writeUInt32LE(bytes.length, 22); local.writeUInt16LE(filename.length, 26);
        locals.push(local, filename, compressed);
        const header = Buffer.alloc(46);
        header.writeUInt32LE(0x02014b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(20, 6); header.writeUInt16LE(flags, 8); header.writeUInt16LE(8, 10);
        header.writeUInt32LE(crc32(bytes), 16); header.writeUInt32LE(compressed.length, 20); header.writeUInt32LE(bytes.length, 24); header.writeUInt16LE(filename.length, 28); header.writeUInt32LE(offset, 42);
        central.push(header, filename);
        offset += local.length + filename.length + compressed.length;
    }
    const directory = Buffer.concat(central);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
    return Buffer.concat([...locals, directory, end]);
}
const docxEntries = [
    ['[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
    ['_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ['word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Mi CV</w:t></w:r></w:p></w:body></w:document>'],
];
const docx = zip(docxEntries);

before(async () => {
    await new Promise((resolve, reject) => {
        server = app.listen(0, '127.0.0.1', resolve);
        server.once('error', reject);
    });
});
beforeEach(() => {
    Object.assign(process.env, testEnv);
    postMock.mock.resetCalls(); postMock.mock.mockImplementation(providerSuccess);
    logMock.mock.resetCalls(); deleteMock.mock.resetCalls();
});
after(async () => {
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
    axios.defaults.adapter = originalAdapter;
    mock.restoreAll();
    for (const [key, value] of Object.entries(originalEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
});

function request(endpoint, data, { method = 'POST', contentType = 'application/json', headers = {}, chunked = false } = {}) {
    const bytes = Buffer.isBuffer(data) ? data : Buffer.from(JSON.stringify(data));
    return new Promise((resolve, reject) => {
        const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path: `/api/submit-${endpoint}`, method,
            headers: { ...(contentType ? { 'Content-Type': contentType } : {}), ...(chunked ? { 'Transfer-Encoding': 'chunked' } : { 'Content-Length': bytes.length }), ...headers },
        }, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk)); res.on('error', reject);
            res.on('end', () => {
                const text = Buffer.concat(chunks).toString();
                try { resolve({ status: res.statusCode, headers: res.headers, text, body: text ? JSON.parse(text) : null }); }
                catch (error) { reject(error); }
            });
        });
        req.on('error', reject); req.setTimeout(5000, () => req.destroy(new Error('Local test request timed out'))); req.end(bytes);
    });
}
function multipart(fields, file = defaultFile, extras = []) {
    const boundary = 'vitamet-test-boundary';
    const chunks = [];
    for (const [name, value] of Array.isArray(fields) ? fields : Object.entries(fields)) {
        chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
    }
    for (const item of [file, ...extras].filter(Boolean)) {
        chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${item.field || 'cv'}"; filename="${item.name}"\r\nContent-Type: ${item.mime || 'application/octet-stream'}\r\n\r\n`), item.bytes, Buffer.from('\r\n'));
    }
    chunks.push(Buffer.from(`--${boundary}--\r\n`));
    return { bytes: Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
}
function requestCv(fields = cvFields(), file = defaultFile, options = {}) {
    const body = multipart(fields, file, options.extras);
    return request('cv', body.bytes, { contentType: body.contentType, ...options });
}
function check(result, status, success) {
    assert.equal(result.status, status);
    assert.match(result.headers['content-type'], /^application\/json\b/);
    assert.equal(result.body.success, success);
    assert.equal(typeof result.body.message, 'string');
}
function noWrite() { assert.equal(postMock.mock.callCount(), 0); assert.equal(deleteMock.mock.callCount(), 0); }

test('contacto: normalización y mapping exacto de consulta', async () => {
    const fields = { ...contactFields(), name: '  María   Pérez  ', message: '  Mi consulta\r\ncon detalles.  ' };
    check(await request('con', fields), 200, true);
    const [url, data, config] = postMock.mock.calls[0].arguments;
    assert.equal(url, 'https://api.airtable.com/v0/test-only-con-base/test-only-con-table');
    assert.deepEqual(data.fields, { name: 'María Pérez', email: 'person@example.com', subject: 'asesoria', text: 'Mi consulta\ncon detalles.', source: 'consulta_contacto', source_utm: 'organico' });
    assert.equal(config.timeout, 8000); assert.equal(config.maxRedirects, 0);
    assert.equal(config.headers.Authorization, 'Bearer test-only-key');
});
for (const subject of ['asesoria', 'servicios', 'otro']) {
    test(`contacto admite subject ${subject}`, async () => check(await request('con', { ...contactFields(), subject }), 200, true));
}
const invalidCon = [
    ...['name', 'email', 'subject', 'message', 'formSource'].map((key) => [key, undefined]),
    ['name', 'x'], ['name', 'x'.repeat(121)], ['name', {}], ['name', 'Nombre\nInyectado'],
    ['email', 'invalid'], ['email', null], ['email', 'a'.repeat(255)],
    ['subject', 'admin'], ['subject', []], ['message', 'corto'], ['message', 'x'.repeat(5001)],
    ['message', null], ['message', 'Mensaje con\u0000control'], ['formSource', 'newsletter_blog'], ['formSource', []],
    ['website', null], ['website', 'x'.repeat(513)], ['extra', 'forbidden'],
];
invalidCon.forEach(([key, value], index) => test(`contacto rechaza datos inválidos ${index + 1}`, async () => {
    const body = { ...contactFields(), [key]: value };
    check(await request('con', body), 400, false); noWrite();
}));

for (const endpoint of ['con', 'cv']) {
    for (const method of ['GET', 'PUT', 'PATCH', 'DELETE', 'HEAD']) {
        test(`${endpoint}: método ${method} rechazado`, async () => {
            const result = await request(endpoint, {}, { method });
            assert.equal(result.status, 405); assert.equal(result.headers.allow, 'POST');
            if (method !== 'HEAD') check(result, 405, false);
            noWrite();
        });
    }
    for (const contentType of ['text/plain', 'application/x-www-form-urlencoded', null, endpoint === 'con' ? 'multipart/form-data' : 'application/json']) {
        test(`${endpoint}: formato incorrecto ${contentType}`, async () => { check(await request(endpoint, {}, { contentType }), 415, false); noWrite(); });
    }
    test(`${endpoint}: mantiene OPTIONS de CORS sin escritura`, async () => {
        assert.equal((await request(endpoint, {}, { method: 'OPTIONS' })).status, 204); noWrite();
    });
    test(`${endpoint}: honeypot sin datos reales ni escrituras`, async () => {
        const result = endpoint === 'con' ? await request('con', { website: 'bot' }) : await requestCv({ website: 'bot' }, null);
        check(result, 200, true);
        if (endpoint === 'cv') assert.equal(result.body.partial, false);
        noWrite();
    });
    test(`${endpoint}: rechaza compresión`, async () => {
        const result = endpoint === 'con' ? await request('con', contactFields(), { headers: { 'Content-Encoding': 'gzip' } }) : await requestCv(cvFields(), defaultFile, { headers: { 'Content-Encoding': 'gzip' } });
        check(result, 415, false); noWrite();
    });
}
test('contacto: JSON malformado, primitivos, array y cuerpo vacío', async () => {
    for (const body of [Buffer.from('{"secret":"private-marker"'), null, [], 1, Buffer.from('')]) {
        const result = await request('con', body); check(result, 400, false); assert.ok(!result.text.includes('private-marker'));
    }
    noWrite();
});
test('contacto: límite JSON también con transferencia chunked', async () => {
    for (const chunked of [false, true]) check(await request('con', { ...contactFields(), message: 'x'.repeat(17000) }, { chunked }), 413, false);
    noWrite();
});
test('contacto: charset no admitido', async () => { check(await request('con', contactFields(), { contentType: 'application/json; charset=iso-8859-1' }), 415, false); noWrite(); });

for (const [utm, classification] of [
    [{ utm_campaign: '  Campaña  ', utm_source: 'blog' }, 'Campaña'],
    [{ utm_source: 'blog' }, 'sin_campana'], [{ utm_future_2027: 'future' }, 'sin_campana'],
    [{ utm_campaign: '', utm_medium: 'social' }, 'sin_campana'],
    [{ utm_campaign: '  ' }, 'organico'], [{}, 'organico'],
    [Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`utm_future_${i}`, 'x'.repeat(256)])), 'sin_campana'],
    [{ ['utm_' + 'x'.repeat(60)]: 'future' }, 'sin_campana'],
]) {
    for (const endpoint of ['con', 'cv']) {
        test(`${endpoint}: clasificación UTM ${classification}/${Object.keys(utm)[0]}`, async () => {
            const result = endpoint === 'con' ? await request('con', { ...contactFields(), utm }) : await requestCv({ ...cvFields(), utm: JSON.stringify(utm) });
            check(result, 200, true); assert.equal(postMock.mock.calls[0].arguments[1].fields.source_utm, classification);
        });
    }
}
for (const utm of [null, [], 'string', 1, { other: 'x' }, { utm_: 'x' }, { utm_campaign: null }, { utm_campaign: {} }, { utm_campaign: 'x'.repeat(257) }, { utm_source: 'bad\nvalue' }, { ['utm_' + 'x'.repeat(61)]: 'x' }, Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`utm_${i}`, 'x']))]) {
    for (const endpoint of ['con', 'cv']) test(`${endpoint}: rechaza UTM ${JSON.stringify(utm).slice(0, 60)}`, async () => {
        const result = endpoint === 'con' ? await request('con', { ...contactFields(), utm }) : await requestCv({ ...cvFields(), utm: JSON.stringify(utm) });
        check(result, 400, false); noWrite();
    });
}

for (const [file, type] of [[defaultFile, 'application/pdf'], [{ name: 'CV.DOCX', mime: 'text/plain', bytes: docx }, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']]) {
    test(`CV válido ${file.name}: crea primero Lead y luego confirma attachment`, async () => {
        const fields = cvFields();
        const result = await requestCv(fields, file); check(result, 200, true); assert.equal(result.body.partial, false);
        assert.equal(postMock.mock.callCount(), 2);
        const [url, data] = postMock.mock.calls[0].arguments;
        assert.equal(url, 'https://api.airtable.com/v0/test-only-cv-base/test-only-cv-table');
        assert.deepEqual(data.fields, { name: fields.name, phone: '+528112345678', state: 'monterrey', source: 'cv_contacto', source_utm: 'organico' });
        const [uploadUrl, attachment, config] = postMock.mock.calls[1].arguments;
        assert.equal(uploadUrl, `https://content.airtable.com/v0/test-only-cv-base/${recordId}/attachment/uploadAttachment`);
        assert.deepEqual(attachment, { contentType: type, file: file.bytes.toString('base64'), filename: file.name.toLowerCase().endsWith('.pdf') ? 'cv.pdf' : 'cv.docx' });
        assert.equal(config.timeout, 15000); assert.equal(config.maxRedirects, 0);
        assert.equal(deleteMock.mock.callCount(), 0);
    });
}
test('CV: ubicación nacional, teléfono nacional y todos los campos opcionales', async () => {
    check(await requestCv({ ...cvFields(), phone: '81 1234 5678', location: 'nacional', website: '', utm: '{}' }), 200, true);
    assert.equal(postMock.mock.calls[0].arguments[1].fields.phone, '8112345678');
    assert.equal(postMock.mock.calls[0].arguments[1].fields.state, 'nacional');
});
const invalidCv = [
    ...['name', 'phone', 'location', 'formSource'].map((key) => [key, undefined]),
    ['name', 'x'], ['name', 'x'.repeat(121)], ['phone', '123'], ['phone', '1'.repeat(16)], ['phone', 'invalid'],
    ['phone', '12345678 ext123'], ['location', 'other'], ['formSource', 'newsletter_blog'], ['website', 'x'.repeat(513)], ['extra', 'no'], ['utm', '{'],
];
invalidCv.forEach(([key, value], i) => test(`CV: datos inválidos ${i + 1}`, async () => {
    const fields = cvFields(); if (value === undefined) delete fields[key]; else fields[key] = value;
    check(await requestCv(fields), 400, false); noWrite();
}));
test('CV: archivo obligatorio', async () => { check(await requestCv(cvFields(), null), 400, false); noWrite(); });
for (const file of [
    { ...defaultFile, bytes: Buffer.alloc(0) }, { ...defaultFile, name: 'cv.exe' },
    { ...defaultFile, bytes: Buffer.from('not a pdf') }, { ...defaultFile, bytes: pdf.subarray(0, -10) },
    { ...defaultFile, name: 'cv.docx' }, { name: 'cv.pdf', bytes: docx },
    { name: 'cv.docx', bytes: Buffer.from('PK\x03\x04not a zip') },
    { name: 'cv.docx', bytes: zip([['other.txt', 'not a Word document']]) },
    { name: 'cv.docx', bytes: docx.subarray(0, -10) },
    { name: 'cv.docx', bytes: zip([...docxEntries, docxEntries[2]]) },
    { name: 'cv.docx', bytes: zip(docxEntries, 1) },
    { name: 'cv.docx', bytes: zip([...docxEntries, ['word/vbaProject.bin', 'macro']]) },
    { name: 'cv.docx', bytes: zip(docxEntries.map(([name, text]) => [name, name === 'word/document.xml' ? '<not-word/>' : text])) },
    { name: 'cv.docx', bytes: zip(docxEntries.map(([name, text]) => [name, name === 'word/document.xml' ? '<!DOCTYPE bad>' + text : text])) },
    { name: 'cv.docx', bytes: zip([...docxEntries, ['word/huge.bin', 'x'.repeat(20_000_001)]]) },
    { name: 'cv.docx', bytes: zip(docxEntries.map(([name, text]) => [name, name === 'word/document.xml' ? 'x'.repeat(2_000_001) : text])) },
    { name: 'cv.docx', bytes: zip([...docxEntries, ...Array.from({ length: 254 }, (_, i) => [`word/${i}.txt`, 'x'])]) },
    { name: 'cv.docx', bytes: zip([...docxEntries, ['../outside', 'x']]) },
]) {
    test(`CV: rechaza archivo falso, corrupto o fuera de límites (${file.name}/${file.bytes.length})`, async () => {
        check(await requestCv(cvFields(), file), 400, false); noWrite();
    });
}
test('CV: acepta máximo inclusivo de 5.000.000 bytes', async () => {
    const bytes = Buffer.concat([pdf.subarray(0, -6), Buffer.alloc(5_000_000 - pdf.length, 32), pdf.subarray(-6)]);
    const result = await requestCv(cvFields(), { ...defaultFile, bytes }); check(result, 200, true); assert.equal(result.body.partial, false);
});
test('CV: rechaza más de 5.000.000 bytes, incluido chunked', async () => {
    for (const chunked of [false, true]) check(await requestCv(cvFields(), { ...defaultFile, bytes: Buffer.alloc(5_000_001) }, { chunked }), 413, false);
    noWrite();
});
test('CV: límite total de solicitud', async () => { check(await requestCv(cvFields(), { ...defaultFile, bytes: Buffer.alloc(5_150_001) }), 413, false); noWrite(); });
test('CV: rechaza archivo extra o campo de archivo incorrecto', async () => {
    for (const [file, extras] of [[defaultFile, [defaultFile]], [{ ...defaultFile, field: 'other' }, []]]) {
        const result = await requestCv(cvFields(), file, { extras }); assert.ok([400, 413].includes(result.status)); assert.equal(result.body.success, false);
    }
    noWrite();
});
test('CV: campos duplicados, utm anidado y valores demasiado largos', async () => {
    const fields = cvFields();
    for (const entries of [[...Object.entries(fields), ['name', 'duplicate']], [...Object.entries(fields), ['utm[utm_campaign]', 'nested']], [...Object.entries(fields), ['utm', 'x'.repeat(17000)]]]) {
        const result = await requestCv(entries); assert.ok([400, 413].includes(result.status)); assert.equal(result.body.success, false);
    }
    noWrite();
});
test('CV: multipart sin boundary o truncado', async () => {
    check(await request('cv', Buffer.from('invalid'), { contentType: 'multipart/form-data' }), 400, false);
    const body = multipart(cvFields());
    check(await request('cv', body.bytes.subarray(0, -30), { contentType: body.contentType }), 400, false); noWrite();
});

for (const endpoint of ['con', 'cv']) {
    test(`${endpoint}: solicitudes concurrentes y repetidas comparten una sola operación`, async () => {
        const fields = endpoint === 'con' ? contactFields() : cvFields();
        let release;
        const gate = new Promise((resolve) => { release = resolve; });
        let started;
        const start = new Promise((resolve) => { started = resolve; });
        postMock.mock.mockImplementation(async (url, data) => { started(); await gate; return providerSuccess(url, data); });
        const send = () => endpoint === 'con' ? request('con', fields) : requestCv(fields);
        const first = send(); const second = send(); await start; release();
        const [a, b] = await Promise.all([first, second]); check(a, 200, true); assert.deepEqual(a.body, b.body);
        assert.deepEqual((await send()).body, a.body); assert.equal(postMock.mock.callCount(), endpoint === 'con' ? 1 : 2);
    });
    for (const key of ['AIRTABLE_API_KEY', `AIRTABLE_POST_FORM_${endpoint.toUpperCase()}`, `AIRTABLE_POST_TABLE_${endpoint.toUpperCase()}`]) {
        test(`${endpoint}: configuración ausente ${key}`, async () => {
            delete process.env[key]; const result = endpoint === 'con' ? await request('con', contactFields()) : await requestCv();
            check(result, 503, false); noWrite();
        });
    }
    for (const code of ['ECONNABORTED', 'ETIMEDOUT', 'ERR_BAD_REQUEST', 'ERR_NETWORK']) {
        test(`${endpoint}: fallo al crear ${code}, sin reintentos ni filtraciones`, async () => {
            const marker = 'private-upstream-marker';
            postMock.mock.mockImplementation(async () => { throw Object.assign(new Error(marker), { code, response: { status: 422, data: marker }, config: { headers: { Authorization: marker }, url: marker } }); });
            const fields = endpoint === 'con' ? contactFields() : cvFields();
            const send = () => endpoint === 'con' ? request('con', fields) : requestCv(fields);
            const result = await send(); check(result, code.startsWith('E') && ['ECONNABORTED', 'ETIMEDOUT'].includes(code) ? 504 : 502, false);
            assert.deepEqual((await send()).body, result.body); assert.equal(postMock.mock.callCount(), 1); assert.equal(deleteMock.mock.callCount(), 0);
            const output = result.text + JSON.stringify(logMock.mock.calls.map((call) => call.arguments));
            for (const secret of [marker, ...Object.values(testEnv), 'Authorization', recordId, 'stack']) assert.ok(!output.includes(secret));
        });
    }
}
for (const kind of ['error', 'timeout', 'missing_id', 'empty_attachment', 'wrong_record', 'wrong_size']) {
    test(`CV: éxito parcial ${kind}, conserva registro y no duplica ni reintenta`, async () => {
        postMock.mock.mockImplementation(async (url, data) => {
            if (url.startsWith('https://api.airtable.com/')) return { data: kind === 'missing_id' ? {} : { id: recordId } };
            if (['error', 'timeout'].includes(kind)) throw Object.assign(new Error('private-marker'), { code: kind === 'timeout' ? 'ECONNABORTED' : 'ERR_BAD_REQUEST', response: { data: 'private-marker' } });
            const result = await providerSuccess(url, data);
            if (kind === 'empty_attachment') result.data.fields = {};
            if (kind === 'wrong_record') result.data.id = 'wrong';
            if (kind === 'wrong_size') result.data.fields.fldAttachment[0].size = 1;
            return result;
        });
        const fields = cvFields(); const result = await requestCv(fields);
        check(result, 200, true); assert.equal(result.body.partial, true); assert.equal(result.body.code, 'CV_ATTACHMENT_FAILED');
        assert.deepEqual((await requestCv(fields)).body, result.body);
        assert.equal(postMock.mock.callCount(), kind === 'missing_id' ? 1 : 2); assert.equal(deleteMock.mock.callCount(), 0);
        const output = result.text + JSON.stringify(logMock.mock.calls.map((call) => call.arguments));
        for (const secret of ['private-marker', ...Object.values(testEnv), recordId, attachmentId, 'Authorization']) assert.ok(!output.includes(secret));
    });
}
