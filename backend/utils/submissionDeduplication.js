const { createHash } = require('node:crypto');

// Protección local de desarrollo: sin datos personales ni archivos en las claves.
// Una operación pendiente nunca expira; solo se cachea su respuesta pública.
const submissions = new Map();
const retentionMs = 10 * 60 * 1000;
const maxEntries = 1000;

function isConfirmedNoWrite(result) {
    // recordCreated es metadato interno de operation, nunca un campo del body HTTP.
    // Solo false explícito confirma que no hubo creación; no inferirlo de success
    // ni del status, pues un error puede ocurrir después de guardar el candidato.
    return result?.recordCreated === false
        && Number.isInteger(result.status) && result.status >= 400 && result.status <= 599
        && ![408, 504].includes(result.status)
        && result.body?.success === false
        && (result.body.partial === undefined || result.body.partial === false)
        && result.body.code !== 'CV_ATTACHMENT_FAILED';
}

// Limitación actual: recordError normaliza rechazos y fallos de transporte a
// 502/504 y no transmite recordCreated. Esos resultados siguen siendo inciertos
// y se conservan 10 minutos, incluso si originalmente Airtable rechazó el POST.
// Solo un llamador que pueda confirmar la ausencia de escritura debe incluir
// recordCreated: false. No inspeccionar logs, mensajes ni errores Axios para
// adivinarlo. Los timeouts y los CV parciales conservan siempre la protección.
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
        if (isConfirmedNoWrite(result)) {
            // Liberar solo al terminar: los concurrentes ya comparten este resultado.
            // Una nueva operación requiere otra llamada; nunca reintentar aquí.
            submissions.delete(key);
        } else {
            entry.expiresAt = Date.now() + retentionMs;
        }
        return result;
    });
    submissions.set(key, entry);
    return entry.promise;
}

module.exports = { submitOnce };
