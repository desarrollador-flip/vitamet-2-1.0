const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { after, before, beforeEach, mock, test } = require('node:test');
const axios = require('axios');
const dotenv = require('dotenv');

const testEnv = {
    AIRTABLE_API_KEY: 'test-only-key',
    AIRTABLE_POST_FORM_MAIL: 'test-only-base',
    AIRTABLE_POST_TABLE_MAIL: 'test-only-table',
};
const originalEnv = Object.fromEntries(Object.keys(testEnv).map((key) => [key, process.env[key]]));
Object.assign(process.env, testEnv);

// No leer credenciales reales ni permitir conexiones externas, incluso si se omite un mock.
const dotenvMock = mock.method(dotenv, 'config', () => ({}));
const originalAdapter = axios.defaults.adapter;
axios.defaults.adapter = async () => { throw new Error('External HTTP disabled in tests'); };
const postMock = mock.method(axios, 'post', async () => ({ status: 200, data: {} }));
const errorMock = mock.method(console, 'error', () => {});
const app = require('../index');
const validBody = { email: 'person@example.com', formSource: 'newsletter_blog' };
let server;

before(async () => {
    await new Promise((resolve, reject) => {
        server = app.listen(0, '127.0.0.1', resolve);
        server.once('error', reject);
    });
});

beforeEach(() => {
    Object.assign(process.env, testEnv);
    postMock.mock.resetCalls();
    postMock.mock.mockImplementation(async () => ({ status: 200, data: {} }));
    errorMock.mock.resetCalls();
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

function request({ method = 'POST', body = validBody, raw, contentType = 'application/json', headers = {} } = {}) {
    const data = raw === undefined ? JSON.stringify(body) : raw;
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: server.address().port,
            path: '/api/submit-email',
            method,
            headers: {
                ...(contentType ? { 'Content-Type': contentType } : {}),
                'Content-Length': Buffer.byteLength(data),
                ...headers,
            },
        }, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('error', reject);
            res.on('end', () => {
                const text = Buffer.concat(chunks).toString();
                try {
                    resolve({ status: res.statusCode, headers: res.headers, text, body: text ? JSON.parse(text) : null });
                } catch (error) {
                    reject(error);
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(3000, () => req.destroy(new Error('Local test request timed out')));
        req.end(data);
    });
}

function assertJson(result, status, success) {
    assert.equal(result.status, status);
    assert.match(result.headers['content-type'], /^application\/json\b/);
    assert.deepEqual(Object.keys(result.body).sort(), ['message', 'success']);
    assert.equal(result.body.success, success);
    assert.equal(typeof result.body.message, 'string');
}

test('dotenv utiliza backend/.env desde la raíz y desde backend, sin abrir un servidor al importar', () => {
    const originalCwd = process.cwd();
    try {
        for (const cwd of [path.resolve(__dirname, '../..'), path.resolve(__dirname, '..')]) {
            process.chdir(cwd);
            delete require.cache[require.resolve('../index')];
            require('../index');
            const options = dotenvMock.mock.calls[dotenvMock.mock.callCount() - 1].arguments[0];
            assert.equal(options.path, path.resolve(__dirname, '../.env'));
            assert.equal(options.quiet, true);
        }
    } finally {
        process.chdir(originalCwd);
    }
});

for (const formSource of ['newsletter_blog', 'asesoria_contacto']) {
    test(`POST válido normaliza email y mapea únicamente los tres campos: ${formSource}`, async () => {
        const result = await request({ body: { email: '  Person+Tag@Example.COM  ', formSource } });
        assertJson(result, 200, true);
        assert.equal(postMock.mock.callCount(), 1);
        const [url, data, options] = postMock.mock.calls[0].arguments;
        assert.equal(url, 'https://api.airtable.com/v0/test-only-base/test-only-table');
        assert.deepEqual(data, { fields: { email: 'person+tag@example.com', source: formSource, source_utm: 'organico' } });
        assert.equal(options.headers.Authorization, 'Bearer test-only-key');
        assert.equal(options.headers['Content-Type'], 'application/json');
        assert.equal(options.timeout, 8000);
        assert.equal(options.maxRedirects, 0);
    });
}

const invalidBodies = [
    {}, { formSource: 'newsletter_blog' }, { email: 'person@example.com' },
    { ...validBody, email: '' }, { ...validBody, email: null }, { ...validBody, email: 42 },
    { ...validBody, email: [] }, { ...validBody, email: {} },
    { ...validBody, email: 'a'.repeat(255) },
    ...['invalid', 'a@b', 'a@@example.com', '.a@example.com', 'a..b@example.com', 'a@-example.com', 'a@example..com', 'a\r\n@example.com', 'a'.repeat(65) + '@example.com'].map((email) => ({ ...validBody, email })),
    ...['arbitrary', ' newsletter_blog ', null, 1, [], {}].map((formSource) => ({ ...validBody, formSource })),
    { ...validBody, source: 'newsletter_blog' },
    { ...validBody, website: null }, { ...validBody, website: 1 }, { ...validBody, website: 'x'.repeat(513) },
    null, [], 'string', 123,
];
invalidBodies.forEach((body, index) => {
    test(`rechaza campos ausentes, tipos, correos o estructura inválidos (${index + 1})`, async () => {
        assertJson(await request({ body }), 400, false);
        assert.equal(postMock.mock.callCount(), 0);
    });
});

for (const method of ['GET', 'PUT', 'PATCH', 'DELETE', 'HEAD']) {
    test(`rechaza el método ${method} sin enviar a Airtable`, async () => {
        const result = await request({ method });
        assert.equal(result.status, 405);
        assert.equal(result.headers.allow, 'POST');
        if (method === 'HEAD') assert.equal(result.text, '');
        else assertJson(result, 405, false);
        assert.equal(postMock.mock.callCount(), 0);
    });
}

test('conserva el preflight OPTIONS del middleware CORS existente', async () => {
    const result = await request({ method: 'OPTIONS', headers: { Origin: 'http://localhost', 'Access-Control-Request-Method': 'POST' } });
    assert.equal(result.status, 204);
    assert.equal(postMock.mock.callCount(), 0);
});

for (const contentType of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', 'application/ld+json', null]) {
    test(`rechaza contenido que no sea application/json: ${contentType}`, async () => {
        assertJson(await request({ contentType }), 415, false);
        assert.equal(postMock.mock.callCount(), 0);
    });
}

test('acepta application/json con charset UTF-8', async () => {
    assertJson(await request({ contentType: 'application/json; charset=utf-8' }), 200, true);
});

for (const [options, status] of [
    [{ raw: '{"email":' }, 400],
    [{ raw: '' }, 400],
    [{ raw: JSON.stringify({ ...validBody, website: 'x'.repeat(17 * 1024) }) }, 413],
    [{ contentType: 'application/json; charset=iso-8859-1' }, 415],
    [{ headers: { 'Content-Encoding': 'gzip' } }, 415],
]) {
    test(`errores del parser responden JSON seguro con HTTP ${status}: ${JSON.stringify(Object.keys(options))}`, async () => {
        assertJson(await request(options), status, false);
        assert.equal(postMock.mock.callCount(), 0);
    });
}

test('honeypot relleno produce el mismo éxito aparente sin escribir, incluso sin campos reales', async () => {
    const normal = await request();
    postMock.mock.resetCalls();
    for (const body of [{ ...validBody, website: 'https://bot.example' }, { website: 'bot' }]) {
        const result = await request({ body });
        assertJson(result, 200, true);
        assert.deepEqual(result.body, normal.body);
    }
    assert.equal(postMock.mock.callCount(), 0);
});

for (const [utm, expected] of [
    [{ utm_campaign: '  Verano  ', utm_source: 'email' }, 'Verano'],
    [{ utm_campaign: 'sin_campana' }, 'sin_campana'],
    [{ utm_source: 'email', utm_medium: 'newsletter' }, 'sin_campana'],
    [{ utm_future_2027: 'future' }, 'sin_campana'],
    [{ utm_campaign: '', utm_term: 'seguros' }, 'sin_campana'],
    [{ utm_campaign: '   ', utm_source: '' }, 'organico'],
    [{}, 'organico'],
    [Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`utm_future_${i}`, 'x'.repeat(256)])), 'sin_campana'],
    [{ ['utm_' + 'x'.repeat(60)]: 'future' }, 'sin_campana'],
]) {
    test(`clasifica UTM como ${expected} sin almacenar campos adicionales (${JSON.stringify(Object.keys(utm))})`, async () => {
        assertJson(await request({ body: { ...validBody, utm } }), 200, true);
        assert.deepEqual(postMock.mock.calls[0].arguments[1], {
            fields: { email: validBody.email, source: validBody.formSource, source_utm: expected },
        });
    });
}

const invalidUtms = [
    null, [], 'campaign', 1, { source: 'email' }, { utm_: 'email' }, { UTM_SOURCE: 'email' },
    { utm_campaign: null }, { utm_campaign: 1 }, { utm_campaign: [] }, { utm_campaign: {} },
    { utm_campaign: 'x'.repeat(257) }, { utm_campaign: 'bad\nvalue' },
    { ['utm_' + 'x'.repeat(61)]: 'email' },
    Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`utm_future_${i}`, 'value'])),
    JSON.parse('{"__proto__":{"utm_campaign":"injected"}}'),
];
invalidUtms.forEach((utm, index) => {
    test(`rechaza UTM fuera de contrato (${index + 1})`, async () => {
        assertJson(await request({ body: { ...validBody, utm } }), 400, false);
        assert.equal(postMock.mock.callCount(), 0);
    });
});

test('rechaza propiedades reservadas en el payload', async () => {
    const raw = '{"email":"person@example.com","formSource":"newsletter_blog","__proto__":{"source":"injected"}}';
    assertJson(await request({ raw }), 400, false);
    assert.equal(postMock.mock.callCount(), 0);
});

for (const name of Object.keys(testEnv)) {
    test(`configuración ausente produce 503 sin escritura: ${name}`, async () => {
        delete process.env[name];
        assertJson(await request(), 503, false);
        assert.equal(postMock.mock.callCount(), 0);
        assert.equal(errorMock.mock.callCount(), 1);
    });
}

for (const [code, upstreamStatus, expected] of [
    ['ECONNABORTED', undefined, 504], ['ETIMEDOUT', undefined, 504],
    ['ERR_BAD_REQUEST', 422, 502], ['ERR_BAD_RESPONSE', 500, 502],
    ['ERR_BAD_REQUEST', 429, 502], ['ERR_NETWORK', undefined, 502],
]) {
    test(`error/timeout de Airtable ${code}/${upstreamStatus} produce ${expected} sin filtraciones`, async () => {
        const sensitive = 'private-upstream-marker';
        postMock.mock.mockImplementation(async () => {
            const error = new Error(sensitive);
            error.code = code;
            error.response = { status: upstreamStatus, data: { secret: sensitive } };
            error.config = { headers: { Authorization: sensitive }, url: sensitive };
            throw error;
        });
        const result = await request();
        assertJson(result, expected, false);
        assert.equal(postMock.mock.callCount(), 1);
        assert.equal(errorMock.mock.callCount(), 1);
        const output = result.text + JSON.stringify(errorMock.mock.calls.map((call) => call.arguments));
        for (const value of [sensitive, ...Object.values(testEnv), 'Authorization', 'stack']) {
            assert.equal(output.includes(value), false);
        }
    });
}
