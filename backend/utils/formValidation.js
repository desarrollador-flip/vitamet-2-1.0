// Reglas de la etapa Email, compartidas por los nuevos endpoints sin modificarla.
const controlCharacters = /[\u0000-\u001f\u007f]/;

class FormInputError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

function requireInput(condition, message, status) {
    if (!condition) throw new FormInputError(message, status);
}

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

function classifyUtm(utm) {
    if (utm === undefined) return 'organico';
    requireInput(utm && typeof utm === 'object' && !Array.isArray(utm), 'Los parámetros UTM deben ser un objeto.');
    const entries = Object.entries(utm);
    requireInput(entries.length <= 20 && entries.every(([key, value]) => (
        key.length <= 64 && /^utm_[a-z0-9_]+$/.test(key)
        && typeof value === 'string' && value.length <= 256 && !controlCharacters.test(value)
    )), 'Los parámetros UTM no son válidos.');
    return entries.some(([, value]) => value.trim()) ? utm.utm_campaign?.trim() || 'sin_campana' : 'organico';
}

function validateEnvelope(body, allowedFields, source, multipart = false) {
    requireInput(body && typeof body === 'object' && !Array.isArray(body)
        && Object.keys(body).every((key) => allowedFields.includes(key)), 'El cuerpo del formulario no es válido.');
    requireInput(body.website === undefined || (typeof body.website === 'string' && body.website.length <= 512), 'El campo website no es válido.');
    if (body.website?.trim()) return { isBot: true };
    requireInput(body.formSource === source, 'El origen del formulario no es válido.');

    let utm = body.utm;
    if (multipart && utm !== undefined) {
        requireInput(typeof utm === 'string' && Buffer.byteLength(utm) <= 16 * 1024, 'El campo utm debe contener un objeto JSON serializado.');
        try {
            utm = JSON.parse(utm);
        } catch {
            throw new FormInputError('El campo utm debe contener un objeto JSON serializado.');
        }
    }
    return { isBot: false, source, sourceUtm: classifyUtm(utm) };
}

function normalizeName(value) {
    requireInput(typeof value === 'string' && value.length <= 120 && !controlCharacters.test(value), 'El nombre debe contener entre 2 y 120 caracteres.');
    const name = value.trim().replace(/\s+/g, ' ');
    requireInput(name.length >= 2, 'El nombre debe contener entre 2 y 120 caracteres.');
    return name;
}

module.exports = { FormInputError, requireInput, normalizeEmail, classifyUtm, validateEnvelope, normalizeName };
