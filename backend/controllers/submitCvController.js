const { requireInput, normalizeName, validateEnvelope } = require('../utils/formValidation');
const { validateCv } = require('../utils/cvFile');
const { getConfig, createRecord, postAirtable, recordError, logProviderError, unavailable } = require('../utils/airtableForms');
const { submitOnce } = require('../utils/submissionDeduplication');

exports.submitCv = async (req, res) => {
    const common = validateEnvelope(req.body, ['name', 'phone', 'location', 'formSource', 'utm', 'website'], 'cv_contacto', true);
    const accepted = { success: true, partial: false, message: 'Solicitud recibida correctamente.' };
    if (common.isBot) return res.status(200).json(accepted);

    const name = normalizeName(req.body.name);
    const rawPhone = req.body.phone;
    requireInput(typeof rawPhone === 'string' && rawPhone.length <= 40 && /^\+?[0-9 ().-]+$/.test(rawPhone.trim()), 'Ingresa un teléfono válido de 8 a 15 dígitos.');
    const phone = rawPhone.trim().replace(/[ ().-]/g, '');
    requireInput(/^\+?\d{8,15}$/.test(phone), 'Ingresa un teléfono válido de 8 a 15 dígitos.');
    requireInput(['monterrey', 'nacional'].includes(req.body.location), 'La ubicación no es válida.');
    const file = await validateCv(req.file);
    const config = getConfig('CV');
    if (!config) return res.status(unavailable.status).json(unavailable.body);

    const fields = { name, phone, state: req.body.location, source: common.source, source_utm: common.sourceUtm };
    const result = await submitOnce('cv', fields, req.file.buffer, async () => {
        let record;
        try {
            record = await createRecord(config, fields);
        } catch (error) {
            return recordError('cv', error);
        }

        // El registro ya está guardado. No borrarlo ni volver a crearlo si falla el adjunto.
        const partial = {
            status: 200,
            body: {
                success: true,
                partial: true,
                code: 'CV_ATTACHMENT_FAILED',
                message: 'Tus datos se guardaron, pero no pudimos confirmar el CV. No repitas la postulación.',
            },
        };
        const recordId = record.data?.id;
        if (typeof recordId !== 'string' || !/^rec[a-zA-Z0-9]{14}$/.test(recordId)) {
            logProviderError('cv', 'record_response');
            return partial;
        }

        try {
            const uploaded = await postAirtable(
                `https://content.airtable.com/v0/${encodeURIComponent(config.baseId)}/${encodeURIComponent(recordId)}/attachment/uploadAttachment`,
                { contentType: file.contentType, file: req.file.buffer.toString('base64'), filename: file.filename },
                config,
                15000,
            );
            const values = uploaded.data?.fields;
            const confirmed = uploaded.data?.id === recordId && values && typeof values === 'object'
                && Object.values(values).some((value) => Array.isArray(value) && value.some((attachment) => (
                    typeof attachment?.id === 'string' && /^att[a-zA-Z0-9]{14}$/.test(attachment.id)
                    && attachment.filename === file.filename && attachment.size === req.file.buffer.length
                )));
            if (!confirmed) {
                logProviderError('cv', 'attachment_response');
                return partial;
            }
            return { status: 200, body: accepted };
        } catch (error) {
            logProviderError('cv', 'upload_attachment', error);
            return partial;
        }
    });
    return res.status(result.status).json(result.body);
};
