const { requireInput, normalizeEmail, normalizeName, validateEnvelope } = require('../utils/formValidation');
const { getConfig, createRecord, recordError, unavailable } = require('../utils/airtableForms');
const { submitOnce } = require('../utils/submissionDeduplication');

exports.submitCon = async (req, res) => {
    const common = validateEnvelope(req.body, ['name', 'email', 'subject', 'message', 'formSource', 'utm', 'website'], 'consulta_contacto');
    const accepted = { success: true, message: 'Solicitud recibida correctamente.' };
    if (common.isBot) return res.status(200).json(accepted);

    const name = normalizeName(req.body.name);
    const email = normalizeEmail(req.body.email);
    requireInput(email, 'Ingresa un correo electrónico válido de hasta 254 caracteres.');
    requireInput(['asesoria', 'servicios', 'otro'].includes(req.body.subject), 'El asunto no es válido.');
    const rawMessage = req.body.message;
    requireInput(typeof rawMessage === 'string' && rawMessage.length <= 5000
        && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(rawMessage), 'El mensaje debe contener entre 10 y 5000 caracteres.');
    const message = rawMessage.replace(/\r\n?/g, '\n').trim();
    requireInput(message.length >= 10, 'El mensaje debe contener entre 10 y 5000 caracteres.');

    const config = getConfig('CON');
    if (!config) return res.status(unavailable.status).json(unavailable.body);
    const fields = { name, email, subject: req.body.subject, text: message, source: common.source, source_utm: common.sourceUtm };
    const result = await submitOnce('con', fields, null, async () => {
        try {
            await createRecord(config, fields);
            return { status: 200, body: accepted };
        } catch (error) {
            return recordError('con', error);
        }
    });
    return res.status(result.status).json(result.body);
};
