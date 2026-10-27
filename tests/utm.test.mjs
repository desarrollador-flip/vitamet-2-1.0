import assert from 'node:assert/strict';
import { beforeEach, after, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { getFormUtm } from '../src/utils/formUtm.ts';

const dom = new JSDOM('', { url: 'https://vitamet.test/' });
globalThis.window = dom.window;
beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, '', '/');
});
after(() => { dom.window.close(); delete globalThis.window; });

test('sin UTM devuelve un objeto vacío y no persiste datos de la URL', () => {
  assert.deepEqual(getFormUtm('?email=private@example.com&formSource=otro'), {});
  assert.equal(window.localStorage.length, 0);
});

test('captura UTM habituales y futuros y persiste solo atribución válida', () => {
  const utm = getFormUtm('?utm_source=blog&utm_medium=email&utm_campaign=+Verano+&utm_term=seguros&utm_content=cta&utm_id=123&utm_future_2027=future&email=private@example.com');
  assert.deepEqual(utm, { utm_campaign: 'Verano', utm_source: 'blog', utm_medium: 'email', utm_term: 'seguros', utm_content: 'cta', utm_id: '123', utm_future_2027: 'future' });
  assert.deepEqual(getFormUtm(''), utm);
  assert.ok(!window.localStorage.getItem('vitamet:utm').includes('private@example.com'));
});

test('la última atribución reemplaza a la anterior sin mezclar campañas', () => {
  getFormUtm('?utm_source=anterior&utm_campaign=anterior');
  assert.deepEqual(getFormUtm('?utm_source=nuevo'), { utm_source: 'nuevo' });
  assert.deepEqual(getFormUtm(''), { utm_source: 'nuevo' });
});

test('conserva exactamente 15 días sin renovar la fecha al consultar lo guardado', (t) => {
  let now = 1800000000000;
  t.mock.method(Date, 'now', () => now);
  getFormUtm('?utm_campaign=verano');
  const expiresAt = JSON.parse(window.localStorage.getItem('vitamet:utm')).expiresAt;
  assert.equal(expiresAt, now + 15 * 86400000);
  now += 14 * 86400000;
  assert.deepEqual(getFormUtm(''), { utm_campaign: 'verano' });
  assert.equal(JSON.parse(window.localStorage.getItem('vitamet:utm')).expiresAt, expiresAt);
  now = expiresAt;
  assert.deepEqual(getFormUtm(''), {});
  assert.equal(window.localStorage.getItem('vitamet:utm'), null);
});

test('aplica límites de cantidad y da prioridad a la campaña', () => {
  const params = new URLSearchParams(Array.from({ length: 25 }, (_, i) => [`utm_future_${i}`, 'x']));
  params.set('utm_campaign', 'campaña');
  const utm = getFormUtm('?' + params);
  assert.equal(Object.keys(utm).length, 20);
  assert.equal(utm.utm_campaign, 'campaña');
});

test('respeta longitudes y caracteres de backend sin truncar valores inválidos', () => {
  const params = new URLSearchParams([
    ['utm_' + 'x'.repeat(60), 'x'.repeat(256)], ['utm_' + 'x'.repeat(61), 'x'],
    ['utm_campaign', 'x'.repeat(257)], ['utm_source', 'bad\nvalue'], ['utm_', 'bad'],
    ['UTM_MEDIUM', 'bad'], ['utm_future', '0'], ['utm_empty', '   '], ['__proto__', 'bad'],
    ['utm_emoji', '😀'.repeat(129)],
  ]);
  assert.deepEqual(getFormUtm('?' + params), { ['utm_' + 'x'.repeat(60)]: 'x'.repeat(256), utm_future: '0' });
});

test('UTM inválidos o vacíos no borran la última atribución válida', () => {
  getFormUtm('?utm_source=blog');
  assert.deepEqual(getFormUtm('?utm_campaign=%00&other=x'), { utm_source: 'blog' });
});

for (const raw of ['invalid-json', 'null', '[]', '{"utm":[],"expiresAt":9999999999999}', '{"utm":{},"expiresAt":"future"}']) {
  test(`almacenamiento corrupto no bloquea el formulario: ${raw}`, () => {
    window.localStorage.setItem('vitamet:utm', raw);
    assert.deepEqual(getFormUtm(''), {});
  });
}

test('storage bloqueado permite usar UTM actuales y enviar orgánico sin UTM', (t) => {
  t.mock.method(dom.window.Storage.prototype, 'setItem', () => { throw new Error('blocked'); });
  t.mock.method(dom.window.Storage.prototype, 'getItem', () => { throw new Error('blocked'); });
  assert.deepEqual(getFormUtm('?utm_campaign=actual'), { utm_campaign: 'actual' });
  assert.deepEqual(getFormUtm(''), {});
});
