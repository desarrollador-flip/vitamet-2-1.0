const express = require('express');
const { submitEmail } = require('../controllers/submitEmailController');

const router = express.Router();

router.all('/submit-email', (req, res, next) => {
    if (req.method !== 'POST') {
        res.set('Allow', 'POST');
        return res.status(405).json({ success: false, message: 'Método no permitido.' });
    }
    const contentType = req.get('Content-Type') || '';
    if (contentType.split(';')[0].trim().toLowerCase() !== 'application/json') {
        return res.status(415).json({ success: false, message: 'Se requiere Content-Type application/json.' });
    }
    return next();
});

router.post('/submit-email', express.json({ limit: '16kb', inflate: false }), submitEmail);

router.use('/submit-email', (error, _req, res, next) => {
    if (res.headersSent) return next(error);

    if (error.type === 'entity.too.large') {
        return res.status(413).json({ success: false, message: 'La solicitud supera el límite de 16 KiB.' });
    }
    if (error.type === 'encoding.unsupported' || error.type === 'charset.unsupported') {
        return res.status(415).json({ success: false, message: 'El formato de la solicitud no es compatible.' });
    }
    if (['entity.parse.failed', 'request.aborted', 'request.size.invalid'].includes(error.type)) {
        return res.status(400).json({ success: false, message: 'El cuerpo JSON no es válido.' });
    }

    console.error('[submit-email] Error interno procesando la solicitud.');
    return res.status(500).json({ success: false, message: 'No se pudo procesar la solicitud.' });
});

module.exports = router;
