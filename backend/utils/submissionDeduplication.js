const { createHash } = require('node:crypto');

// Protección local de desarrollo: sin datos personales ni archivos en las claves.
// Una operación pendiente nunca expira; solo se cachea su respuesta pública.
const submissions = new Map();
const retentionMs = 10 * 60 * 1000;
const maxEntries = 1000;

async function submitOnce(scope, fields, file, operation) {
    const now = Date.now();
    for (const [key, entry] of submissions) {
        if (entry.expiresAt <= now) submissions.delete(key);
    }
    const key = createHash('sha256').update(scope).update(JSON.stringify(fields)).update(file || '').digest('hex');
    if (submissions.has(key)) return submissions.get(key).promise;
    if (submissions.size >= maxEntries) {
        return { status: 503, body: { success: false, message: 'El servicio no está disponible temporalmente.' } };
    }

    const entry = { expiresAt: Infinity, promise: null };
    entry.promise = Promise.resolve().then(operation).catch(() => {
        console.error('[submissions] Error interno durante el envío.');
        return { status: 500, body: { success: false, message: 'No se pudo confirmar el registro. No repitas el envío automáticamente.' } };
    }).then((result) => {
        entry.expiresAt = Date.now() + retentionMs;
        return result;
    });
    submissions.set(key, entry);
    return entry.promise;
}

module.exports = { submitOnce };
