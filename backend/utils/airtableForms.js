const axios = require('axios');

function getConfig(suffix) {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env[`AIRTABLE_POST_FORM_${suffix}`];
    const table = process.env[`AIRTABLE_POST_TABLE_${suffix}`];
    if (![apiKey, baseId, table].every((value) => typeof value === 'string' && value.trim())) {
        console.error(`[submit-${suffix.toLowerCase()}] Configuración de Airtable incompleta.`);
        return null;
    }
    return { apiKey, baseId, table };
}

function postAirtable(url, data, config, timeout = 8000) {
    return axios.post(url, data, {
        headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        timeout,
        maxRedirects: 0,
        maxContentLength: 1024 * 1024,
        maxBodyLength: 7 * 1024 * 1024,
    });
}

function createRecord(config, fields) {
    return postAirtable(`https://api.airtable.com/v0/${encodeURIComponent(config.baseId)}/${encodeURIComponent(config.table)}`, { fields }, config);
}

function logProviderError(scope, stage, error) {
    const status = error?.response?.status;
    console.error(`[submit-${scope}] Falló la operación de Airtable.`, {
        stage,
        type: ['ECONNABORTED', 'ETIMEDOUT'].includes(error?.code) ? 'timeout' : 'upstream_error',
        status: Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
    });
}

function recordError(scope, error) {
    logProviderError(scope, 'create_record', error);
    return {
        status: ['ECONNABORTED', 'ETIMEDOUT'].includes(error?.code) ? 504 : 502,
        body: { success: false, message: 'No se pudo confirmar el registro. No repitas el envío automáticamente.' },
    };
}

const unavailable = { status: 503, body: { success: false, message: 'El servicio no está disponible temporalmente.' } };

module.exports = { getConfig, postAirtable, createRecord, logProviderError, recordError, unavailable };
