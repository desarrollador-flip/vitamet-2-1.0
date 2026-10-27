const multer = require('multer');
const { FormInputError } = require('./formValidation');

function requirePost(mediaType, maxBytes) {
    return (req, res, next) => {
        if (req.method !== 'POST') {
            res.set('Allow', 'POST');
            return res.status(405).json({ success: false, message: 'Método no permitido.' });
        }
        if ((req.get('Content-Type') || '').split(';')[0].trim().toLowerCase() !== mediaType) {
            return res.status(415).json({ success: false, message: `Se requiere Content-Type ${mediaType}.` });
        }
        if (req.get('Content-Encoding') && req.get('Content-Encoding').toLowerCase() !== 'identity') {
            return res.status(415).json({ success: false, message: 'No se admiten cuerpos comprimidos.' });
        }
        if (Number(req.get('Content-Length')) > maxBytes) {
            return res.status(413).json({ success: false, message: 'La solicitud supera el límite permitido.' });
        }
        return next();
    };
}

function formErrorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);
    let status = 500;
    let message = 'No se pudo procesar la solicitud.';
    if (error instanceof FormInputError) {
        status = error.status;
        message = error.message;
    } else if (error instanceof multer.MulterError) {
        status = ['LIMIT_FILE_SIZE', 'LIMIT_FIELD_VALUE', 'LIMIT_FIELD_COUNT', 'LIMIT_FILE_COUNT', 'LIMIT_PART_COUNT'].includes(error.code) ? 413 : 400;
        message = 'El archivo o los campos multipart no cumplen los límites permitidos.';
    } else if (error.type === 'entity.too.large') {
        status = 413;
        message = 'La solicitud supera el límite permitido.';
    } else if (['encoding.unsupported', 'charset.unsupported'].includes(error.type)) {
        status = 415;
        message = 'El formato de la solicitud no es compatible.';
    } else if (['entity.parse.failed', 'request.aborted', 'request.size.invalid'].includes(error.type)
        || (req.is('multipart/form-data') && /^(Multipart: |Unexpected end of |Malformed part header)/.test(error.message || ''))) {
        status = 400;
        message = 'El cuerpo de la solicitud no es válido.';
    } else {
        console.error('[submissions] Error interno procesando la solicitud.');
    }
    return res.status(status).json({ success: false, message });
}

module.exports = { requirePost, formErrorHandler };
