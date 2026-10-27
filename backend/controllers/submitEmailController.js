const axios = require('axios');

const allowedFields = new Set(['email', 'formSource', 'utm', 'website']);
const allowedSources = new Set(['newsletter_blog', 'asesoria_contacto']);
const successResponse = { success: true, message: 'Solicitud recibida correctamente.' };
const controlCharacters = /[\u0000-\u001f\u007f]/;

function normalizeEmail(value) {
    if (typeof value !== 'string' || value.length > 254 || controlCharacters.test(value)) return null;

    const email = value.trim().toLowerCase();
    const parts = email.split('@');
    if (parts.length !== 2) return null;

    const [local, domain] = parts;
    if (local.length > 64 || !/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/.test(local)) return null;

    const labels = domain.split('.');
    if (labels.length < 2 || !/^[a-z][a-z0-9-]*[a-z0-9]$/.test(labels[labels.length - 1])) return null;
    if (labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;

    return email;
}

exports.submitEmail = async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !allowedFields.has(key))) {
        return res.status(400).json({ success: false, message: 'El cuerpo del formulario no es válido.' });
    }

    const { email: rawEmail, formSource, utm, website } = body;
    if (website !== undefined && (typeof website !== 'string' || website.length > 512)) {
        return res.status(400).json({ success: false, message: 'El campo website no es válido.' });
    }

    // Un bot recibe la misma respuesta que un envío aceptado, sin consultar Airtable.
    if (website?.trim()) return res.status(200).json(successResponse);

    const email = normalizeEmail(rawEmail);
    if (!email) {
        return res.status(400).json({ success: false, message: 'Ingresa un correo electrónico válido de hasta 254 caracteres.' });
    }
    if (typeof formSource !== 'string' || !allowedSources.has(formSource)) {
        return res.status(400).json({ success: false, message: 'El origen del formulario no es válido.' });
    }

    let sourceUtm = 'organico';
    if (utm !== undefined) {
        if (!utm || typeof utm !== 'object' || Array.isArray(utm)) {
            return res.status(400).json({ success: false, message: 'Los parámetros UTM deben ser un objeto.' });
        }

        const entries = Object.entries(utm);
        if (entries.length > 20 || entries.some(([key, value]) => (
            key.length > 64 || !/^utm_[a-z0-9_]+$/.test(key)
            || typeof value !== 'string' || value.length > 256 || controlCharacters.test(value)
        ))) {
            return res.status(400).json({ success: false, message: 'Los parámetros UTM no son válidos.' });
        }

        // Los valores vacíos se consideran ausentes; solo se persiste la clasificación.
        if (entries.some(([, value]) => value.trim())) {
            sourceUtm = utm.utm_campaign?.trim() || 'sin_campana';
        }
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_POST_FORM_MAIL;
    const table = process.env.AIRTABLE_POST_TABLE_MAIL;
    if (![apiKey, baseId, table].every((value) => typeof value === 'string' && value.trim())) {
        console.error('[submit-email] Configuración de Airtable incompleta.');
        return res.status(503).json({ success: false, message: 'El servicio no está disponible temporalmente.' });
    }

    try {
        await axios.post(
            `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}`,
            { fields: { email, source: formSource, source_utm: sourceUtm } },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 8000,
                maxRedirects: 0,
                maxContentLength: 16 * 1024,
            },
        );

        return res.status(200).json(successResponse);
    } catch (error) {
        const timedOut = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT';
        const status = error?.response?.status;
        // Nunca registrar el error de Axios completo: contiene URL, headers y credenciales.
        console.error('[submit-email] Falló la solicitud a Airtable.', {
            type: timedOut ? 'timeout' : 'upstream_error',
            status: Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
        });
        return res.status(timedOut ? 504 : 502).json({
            success: false,
            message: 'No se pudo procesar la solicitud. Inténtalo más tarde.',
        });
    }
};
