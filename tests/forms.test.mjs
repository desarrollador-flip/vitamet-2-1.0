import assert from 'node:assert/strict';
import { after, afterEach, beforeEach, mock, test } from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://vitamet.test/contacto' });
for (const name of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement', 'Event', 'File', 'FormData']) {
  globalThis[name] = name === 'window' ? dom.window : dom.window[name];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import('react-dom/client');
const { EmailCaptureForm } = await import('../src/components/form/EmailCaptureForm.tsx');
const { GeneralInquiryForm } = await import('../src/components/form/GeneralInquiryForm.tsx');
const { JoinTeamForm } = await import('../src/components/form/JoinTeamForm.tsx');
const { getFormEndpoint, submitForm } = await import('../src/utils/formSubmission.ts');
const { hasFormControlCharacters, isValidFormEmail, isValidFormName } = await import('../src/utils/formValidation.ts');
const production = await import('../src/utils/formSubmission.ts?production');
const { default: viteConfig } = await import('../vite.config.ts');
const fetchMock = mock.method(globalThis, 'fetch', async () => { throw new Error('External requests disabled in tests'); });
const { act } = React;
let root;
let container;

const fullSuccess = { success: true, message: 'Solicitud recibida correctamente.' };
function reply(data = fullSuccess, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
beforeEach(() => {
  window.history.replaceState({}, '', '/contacto');
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  fetchMock.mock.resetCalls();
  fetchMock.mock.mockImplementation(async () => { throw new Error('External requests disabled in tests'); });
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
after(() => { mock.restoreAll(); dom.window.close(); });

async function render(element) { await act(async () => root.render(element)); }
async function change(name, value) {
  const control = container.querySelector(`[name="${name}"]`);
  assert.ok(control, `Control ${name} exists`);
  const prototype = control instanceof HTMLSelectElement ? HTMLSelectElement.prototype
    : control instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(control, value);
    control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  });
}
async function selectFile(file) {
  const control = container.querySelector('[name="cv"]');
  await act(async () => {
    Object.defineProperty(control, 'files', { configurable: true, value: file ? [file] : [] });
    control.dispatchEvent(new Event('change', { bubbles: true }));
  });
}
async function submit(times = 1) {
  await act(async () => {
    for (let i = 0; i < times; i++) container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}
const kinds = ['email', 'con', 'cv'];
async function mount(kind, source = 'newsletter_blog') {
  await render(kind === 'email' ? React.createElement(EmailCaptureForm, { id: 'capture', label: 'Correo', buttonText: 'Suscribirse', variant: 'light', formSource: source })
    : React.createElement(kind === 'con' ? GeneralInquiryForm : JoinTeamForm));
}
async function fill(kind) {
  if (kind !== 'email') await change('name', 'María Pérez');
  if (kind !== 'cv') await change('email', 'Person@Example.COM');
  if (kind === 'con') { await change('subject', 'asesoria'); await change('message', 'Quiero información sobre sus servicios.'); }
  if (kind === 'cv') {
    await change('phone', '+52 (81) 1234-5678'); await change('location', 'monterrey');
    await selectFile(new File(['%PDF-1.7\ncontent\n%%EOF'], 'candidate.pdf', { type: 'application/pdf' }));
  }
}
function succeed(kind) {
  fetchMock.mock.mockImplementation(async () => reply(kind === 'cv' ? { ...fullSuccess, partial: false } : fullSuccess));
}

test('selector de endpoints en desarrollo y producción para los tres formularios', () => {
  for (const kind of kinds) {
    assert.equal(getFormEndpoint(kind), `/api/submit-${kind}`);
    assert.equal(production.getFormEndpoint(kind), `/backend/submit-${kind}.php`);
  }
});

test('proxy Vite limitado a las nuevas rutas, sin capturar GET de agentes u otras rutas', () => {
  const rules = Object.entries(viteConfig.server.proxy);
  assert.equal(rules.length, 3);
  for (const kind of kinds) {
    assert.equal(rules.filter(([pattern]) => new RegExp(pattern).test(`/api/submit-${kind}`)).length, 1);
    assert.equal(rules.filter(([pattern]) => new RegExp(pattern).test(`/api/submit-${kind}?x=1`)).length, 1);
  }
  for (const path of ['/api/agentes', '/api/agente/slug', '/api/submit', '/api/submit-email-other', '/api/submit-con/extra']) {
    assert.ok(rules.every(([pattern]) => !new RegExp(pattern).test(path)));
  }
  assert.ok(rules.every(([, options]) => options.target === 'http://127.0.0.1:5000'));
});

for (const kind of kinds) {
  test(`${kind}: honeypot accesible solo a bots, sin required ni foco normal`, async () => {
    await mount(kind);
    const input = container.querySelector('[name="website"]');
    assert.equal(input.tabIndex, -1); assert.equal(input.autocomplete, 'off'); assert.equal(input.required, false);
    assert.equal(input.parentElement.getAttribute('aria-hidden'), 'true');
    assert.equal(container.querySelector(`label[for="${input.id}"]`).textContent, 'Sitio web');
  });

  test(`${kind}: valida por campo, relaciones ARIA y limpia el error al editar`, async () => {
    await mount(kind); await submit();
    assert.equal(fetchMock.mock.callCount(), 0);
    const field = container.querySelector(`[name="${kind === 'email' ? 'email' : 'name'}"]`);
    assert.equal(field.getAttribute('aria-invalid'), 'true');
    assert.ok(document.getElementById(field.getAttribute('aria-describedby')));
    assert.ok(container.querySelector('[role="alert"]'));
    await change(field.name, kind === 'email' ? 'valid@example.com' : 'Nombre válido');
    assert.equal(field.getAttribute('aria-invalid'), 'false');
  });

  test(`${kind}: payload exacto, UTM, honeypot y reset solo tras éxito completo`, async (t) => {
    await mount(kind); await fill(kind); await change('website', 'bot-content');
    window.history.replaceState({}, '', '/contacto?utm_campaign=verano&utm_future_2027=future');
    const reset = t.mock.method(container.querySelector('form'), 'reset');
    succeed(kind); await submit();
    assert.equal(fetchMock.mock.callCount(), 1);
    const [url, options] = fetchMock.mock.calls[0].arguments;
    assert.equal(url, `/api/submit-${kind}`); assert.equal(options.method, 'POST'); assert.equal(options.redirect, 'error');
    const utm = { utm_campaign: 'verano', utm_future_2027: 'future' };
    if (kind === 'cv') {
      assert.ok(options.body instanceof FormData);
      assert.equal(options.headers['Content-Type'], undefined);
      assert.deepEqual(Array.from(options.body.keys()).sort(), ['name', 'phone', 'location', 'cv', 'formSource', 'utm', 'website'].sort());
      assert.equal(options.body.get('formSource'), 'cv_contacto');
      assert.equal(options.body.get('website'), 'bot-content'); assert.deepEqual(JSON.parse(options.body.get('utm')), utm);
      assert.ok(options.body.get('cv') instanceof File); assert.equal(options.body.get('cv').name, 'candidate.pdf');
      assert.equal(options.body.get('cv').size, new TextEncoder().encode('%PDF-1.7\ncontent\n%%EOF').length);
      assert.equal(container.querySelector('#join-cv-selected').textContent, '');
    } else {
      assert.equal(options.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(options.body), kind === 'email'
        ? { email: 'person@example.com', formSource: 'newsletter_blog', utm, website: 'bot-content' }
        : { name: 'María Pérez', email: 'person@example.com', subject: 'asesoria', message: 'Quiero información sobre sus servicios.', formSource: 'consulta_contacto', utm, website: 'bot-content' });
    }
    assert.equal(reset.mock.callCount(), 1);
    assert.equal(container.querySelector(`[name="${kind === 'email' ? 'email' : 'name'}"]`).value, '');
    assert.equal(container.querySelector('[name="website"]').value, '');
    assert.equal(container.querySelector('[type="submit"]').disabled, false);
    assert.match(container.querySelector('p[role="status"]').textContent, /recibida/);
  });

  test(`${kind}: loading, Spinner y bloqueo del doble envío en el mismo ciclo`, async () => {
    await mount(kind); await fill(kind);
    const pending = deferred(); fetchMock.mock.mockImplementation(() => pending.promise);
    await submit(2);
    assert.equal(fetchMock.mock.callCount(), 1);
    assert.equal(container.querySelector('form').getAttribute('aria-busy'), 'true');
    assert.equal(container.querySelector('[type="submit"]').disabled, true);
    assert.ok(container.querySelector('button svg'));
    await act(async () => pending.resolve(reply(kind === 'cv' ? { ...fullSuccess, partial: false } : fullSuccess)));
    assert.equal(container.querySelector('form').getAttribute('aria-busy'), 'false');
  });

  test(`${kind}: rechazo confirmado conserva datos y permite un intento manual`, async () => {
    await mount(kind); await fill(kind);
    fetchMock.mock.mockImplementation(async () => reply({ success: false, message: 'Rejected' }, 400));
    await submit();
    const value = container.querySelector(`[name="${kind === 'email' ? 'email' : 'name'}"]`).value;
    assert.ok(value); assert.equal(container.querySelector('[type="submit"]').disabled, false);
    if (kind === 'cv') assert.match(container.querySelector('#join-cv-selected').textContent, /candidate.pdf/);
    succeed(kind); await submit();
    assert.equal(fetchMock.mock.callCount(), 2);
  });

  for (const scenario of ['network', 'timeout', 'invalid-json', 'malformed-200', 'false-200', 'server-502', 'server-504']) {
    test(`${kind}: ${scenario} conserva datos y bloquea reenvíos inciertos`, async (t) => {
      await mount(kind); await fill(kind);
      if (scenario === 'timeout') {
        t.mock.method(window, 'setTimeout', (callback) => { queueMicrotask(callback); return 1; });
        fetchMock.mock.mockImplementation((url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true })));
      } else fetchMock.mock.mockImplementation(async () => {
        if (scenario === 'network') throw new Error('private-marker');
        if (scenario === 'invalid-json') return { ok: true, status: 200, json: async () => { throw new Error('private-marker'); } };
        if (scenario === 'malformed-200') return reply({ message: 'private-marker' });
        if (scenario === 'false-200') return reply({ success: false, message: 'private-marker' });
        return reply({ success: false, message: 'private-marker' }, scenario === 'server-502' ? 502 : 504);
      });
      await submit(); await submit();
      assert.equal(fetchMock.mock.callCount(), 1); assert.equal(container.querySelector('[type="submit"]').disabled, true);
      assert.ok(container.querySelector(`[name="${kind === 'email' ? 'email' : 'name'}"]`).value);
      assert.ok(!container.textContent.includes('private-marker'));
      assert.match(container.querySelector('[role="alert"]').textContent, /No pudimos confirmar/);
      // Editar no desbloquea una solicitud cuyo resultado sigue siendo incierto.
      await change(kind === 'email' ? 'email' : 'name', kind === 'email' ? 'other@example.com' : 'Otro nombre');
      await submit(); assert.equal(fetchMock.mock.callCount(), 1);
    });
  }
}

test('email mantiene dos instancias independientes con orígenes explícitos', async () => {
  await render(React.createElement(React.Fragment, null,
    React.createElement(EmailCaptureForm, { id: 'newsletter', label: 'Newsletter', buttonText: 'Enviar', variant: 'dark', formSource: 'newsletter_blog' }),
    React.createElement(EmailCaptureForm, { id: 'advisor', label: 'Asesoría', buttonText: 'Enviar', variant: 'light', formSource: 'asesoria_contacto' })));
  succeed('email');
  const inputs = container.querySelectorAll('[name="email"]');
  await act(async () => {
    for (const input of inputs) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'person@example.com');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  for (const form of container.querySelectorAll('form')) await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  assert.deepEqual(fetchMock.mock.calls.map((call) => JSON.parse(call.arguments[1].body).formSource), ['newsletter_blog', 'asesoria_contacto']);
});

test('CV parcial mantiene campos y archivo y nunca reenvía ni muestra éxito completo', async () => {
  await mount('cv'); await fill('cv');
  fetchMock.mock.mockImplementation(async () => reply({ success: true, partial: true, code: 'CV_ATTACHMENT_FAILED', message: 'private-marker' }));
  await submit(); await submit();
  assert.equal(fetchMock.mock.callCount(), 1); assert.equal(container.querySelector('[type="submit"]').disabled, true);
  assert.equal(container.querySelector('[name="name"]').value, 'María Pérez');
  assert.match(container.querySelector('#join-cv-selected').textContent, /candidate.pdf/);
  assert.match(container.querySelector('.feedback[role="status"]').textContent, /no pudimos confirmar el CV/);
  assert.ok(!container.textContent.includes('Solicitud recibida correctamente.'));
});

test('CV exige partial:false para considerar completo un HTTP 200', async () => {
  await mount('cv'); await fill('cv'); succeed('email'); await submit();
  assert.equal(container.querySelector('[type="submit"]').disabled, true);
  assert.ok(container.querySelector('[name="name"]').value);
  assert.match(container.querySelector('[role="alert"]').textContent, /No pudimos confirmar/);
});

for (const size of [0, 5_000_001]) {
  test(`CV rechaza archivo de ${size} bytes sin hacer POST`, async () => {
    await mount('cv'); await fill('cv');
    await selectFile(new File([new Uint8Array(size)], 'cv.pdf', { type: 'application/pdf' }));
    await submit(); assert.equal(fetchMock.mock.callCount(), 0);
    assert.equal(container.querySelector('[name="cv"]').getAttribute('aria-invalid'), 'true');
  });
}
test('CV acepta máximo inclusivo de 5.000.000 bytes', async () => {
  await mount('cv'); await fill('cv'); succeed('cv');
  await selectFile(new File([new Uint8Array(5_000_000)], 'cv.pdf', { type: 'application/pdf' }));
  await submit(); assert.equal(fetchMock.mock.callCount(), 1);
  assert.equal(fetchMock.mock.calls[0].arguments[1].body.get('cv').size, 5_000_000);
});

test('helper de producción usa PHP y mantiene el boundary automático en FormData', async () => {
  fetchMock.mock.mockImplementation(async () => reply({ ...fullSuccess, partial: false }));
  const body = new FormData(); body.append('cv', new File(['file'], 'cv.pdf'));
  assert.equal((await production.submitForm('cv', body)).status, 'success');
  assert.equal(fetchMock.mock.calls[0].arguments[0], '/backend/submit-cv.php');
  assert.equal(fetchMock.mock.calls[0].arguments[1].headers['Content-Type'], undefined);
});

test('una respuesta parcial inconsistente nunca se convierte en error reintentable', async () => {
  fetchMock.mock.mockImplementation(async () => reply({ success: false, partial: true, code: 'CV_ATTACHMENT_FAILED', message: 'partial' }, 400));
  assert.equal((await submitForm('cv', new FormData())).status, 'uncertain');
});

test('las validaciones compartidas respetan emails, Unicode y controles de backend', () => {
  for (const email of ['Person+Tag@example.com', 'a.b@example.co', "o'connor@example.com"]) assert.equal(isValidFormEmail(email), true);
  for (const email of ['.a@example.com', 'a..b@example.com', 'a@-example.com', 'a@example..com', 'a\n@example.com', 'a'.repeat(65) + '@example.com']) assert.equal(isValidFormEmail(email), false);
  assert.equal(isValidFormName('😀'.repeat(60)), true);
  assert.equal(isValidFormName('😀'.repeat(61)), false);
  assert.equal(hasFormControlCharacters('Mensaje\ncon\ttabulación\r\ny saltos.', true), false);
  for (const code of [0, 8, 11, 12, 14, 31, 127]) assert.equal(hasFormControlCharacters('texto' + String.fromCharCode(code), true), true);
});

test('un JSON que supera 16 KiB se rechaza localmente antes de efectuar un POST', async () => {
  const result = await submitForm('con', { message: '😀'.repeat(2500), utm: { utm_campaign: '😀'.repeat(128),
    ...Object.fromEntries(Array.from({ length: 19 }, (_, i) => [`utm_${i}`, '😀'.repeat(128)])) } });
  assert.equal(result.status, 'error');
  assert.equal(fetchMock.mock.callCount(), 0);
});

for (const file of [new File(['file'], 'cv.exe'), new File(['file'], 'cv.pdf', { type: 'image/png' })]) {
  test(`CV rechaza tipo/extensión no compatible: ${file.name}/${file.type}`, async () => {
    await mount('cv'); await fill('cv'); await selectFile(file); await submit();
    assert.equal(fetchMock.mock.callCount(), 0);
    assert.equal(container.querySelector('[name="cv"]').getAttribute('aria-invalid'), 'true');
  });
}

test('contacto conserva validación de asunto y mensaje antes de efectuar el POST', async () => {
  await mount('con'); await fill('con'); await change('subject', ''); await change('message', 'corto'); await submit();
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.equal(container.querySelector('[name="subject"]').getAttribute('aria-invalid'), 'true');
  assert.equal(container.querySelector('[name="message"]').getAttribute('aria-invalid'), 'true');
});
