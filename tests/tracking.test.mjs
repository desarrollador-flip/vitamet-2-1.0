import assert from 'node:assert/strict';
import { after, afterEach, beforeEach, mock, test } from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://vitamet.test/', pretendToBeVisual: true,
});
for (const name of ['window', 'document', 'Node', 'Element', 'HTMLElement', 'HTMLButtonElement', 'Event', 'MouseEvent']) {
  globalThis[name] = name === 'window' ? dom.window : dom.window[name];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
window.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
window.scrollTo = () => {};
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
const { createRoot } = await import('react-dom/client');
const { MemoryRouter, BrowserRouter, Routes, Route } = await import('react-router-dom');
const { HelmetProvider } = await import('react-helmet-async');
const { useClickTracking } = await import('../src/hooks/useClickTracking.ts');
const { SmartLink } = await import('../src/utils/SmartLink.tsx');
const { BotonNav } = await import('../src/components/utils/BotonNav.tsx');
const { NavItems } = await import('../src/components/utils/NavItems.tsx');
const { Navbar } = await import('../src/components/common/Navbar.tsx');
const { BurgerMenu } = await import('../src/components/common/BurgerMenu.tsx');
const { Footer } = await import('../src/components/common/Footer.tsx');
const { HomePage } = await import('../src/components/pages/HomePage.tsx');
const { SectionHp5 } = await import('../src/components/exports/home/SectionHp5.tsx');
const { NosotrosPage } = await import('../src/components/pages/NosotrosPage.tsx');
const { ServiciosPage } = await import('../src/components/pages/ServiciosPage.tsx');
const { BlogPage } = await import('../src/components/pages/BlogPage.tsx');
const { ContactoPage } = await import('../src/components/pages/ContactoPage.tsx');
const { ReclutaPage } = await import('../src/components/pages/ReclutaPage.tsx');
const { PoliticaPrivacidadPage } = await import('../src/components/pages/PoliticaPrivacidadPage.tsx');
const { default: AgentePage } = await import('../src/components/pages/AgentePage.tsx');
const { act } = React;
const h = React.createElement;
const fetchMock = mock.method(globalThis, 'fetch', async () => { throw new Error('External requests disabled'); });
let container;
let root;

function Tracker() { useClickTracking(); return null; }
function preventDefault(event) { event.preventDefault(); }
function tracked(children, Router = MemoryRouter) {
  return h(React.StrictMode, null, h(Router, null,
    h(HelmetProvider, null, h(Tracker), children)));
}
async function render(element) { await act(async () => root.render(element)); }
async function click(element, options = {}) {
  assert.ok(element, 'Click target exists');
  await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...options })));
}
function assertTaggedLinks() {
  assert.equal(container.querySelectorAll('a a').length, 0, 'Links must not contain other links');
  const links = container.querySelectorAll('a, button[data-tracking-url]');
  assert.ok(links.length > 0);
  for (const link of links) {
    assert.equal(Number(link.hasAttribute('data-link')) + Number(link.hasAttribute('data-cta')), 1, link.outerHTML);
    assert.ok(!link.hasAttribute('dataLink') && !link.hasAttribute('dataCta'), link.outerHTML);
  }
  for (const control of container.querySelectorAll('button:not([data-tracking-url]), input, select, textarea')) {
    // The agent's existing share action is deliberately preserved as a CTA.
    if (control.getAttribute('data-cta') === 'agente-shared-btn') continue;
    assert.ok(!control.hasAttribute('data-link') && !control.hasAttribute('data-cta'), control.outerHTML);
  }
}

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  window.dataLayer = [];
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  document.addEventListener('click', preventDefault);
  fetchMock.mock.resetCalls();
  fetchMock.mock.mockImplementation(async () => { throw new Error('External requests disabled'); });
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  document.removeEventListener('click', preventDefault);
});
after(() => { mock.restoreAll(); dom.window.close(); });

test('StrictMode, re-render y remontaje conservan un evento por clic y limpian el listener', async () => {
  const existingLayer = [{ event: 'gtm.js' }];
  window.dataLayer = existingLayer;
  const fixture = tracked(h(SmartLink, { to: '/contacto', dataLink: 'home-contacto-link' }, h('span', null, 'Contacto')));
  await render(fixture);
  await click(container.querySelector('span'));
  assert.equal(window.dataLayer, existingLayer);
  assert.deepEqual(window.dataLayer[1], {
    event: 'click_link', click_id: 'home-contacto-link', page_path: '/', link_url: '/contacto',
  });
  await render(fixture);
  await click(container.querySelector('span'));
  assert.equal(window.dataLayer.length, 3);
  await render(null);
  const external = document.createElement('a');
  external.dataset.link = 'home-contacto-link'; external.href = '/contacto'; document.body.append(external);
  await click(external);
  assert.equal(window.dataLayer.length, 3);
  external.remove();
  await render(fixture);
  await click(container.querySelector('span'));
  assert.equal(window.dataLayer.length, 4);
});

test('closest elige el elemento más cercano y CTA tiene prioridad sin doble evento', async () => {
  await render(tracked(h('div', { 'data-link': 'home-inicio-link' },
    h('a', { href: '/contacto', 'data-cta': 'home-contacto-btn', 'data-link': 'ignored' },
      h('svg', null, h('path', { d: 'M0 0' }))))));
  await click(container.querySelector('path'));
  assert.deepEqual(window.dataLayer, [{ event: 'click_cta', click_id: 'home-contacto-btn', page_path: '/', link_url: '/contacto' }]);
});

test('SmartLink y BotonNav escriben solo el atributo prioritario en el DOM', async () => {
  await render(tracked(h(React.Fragment, null,
    h(SmartLink, { to: '/contacto', dataLink: 'ignored', dataCta: 'home-contacto-btn' }, 'Contacto'),
    h(BotonNav, { to: '/contacto', dataLink: 'ignored', dataCta: 'navbar-unete-btn' }, 'Únete'))));
  assertTaggedLinks();
  await click(container.querySelector('button'));
  assert.deepEqual(window.dataLayer, [{ event: 'click_cta', click_id: 'navbar-unete-btn', page_path: '/', link_url: '/contacto' }]);
});

test('la navegación real conserva el destino y mide la ruta anterior a navigate', async () => {
  await render(tracked(h(NavItems, { item: { id: 'contacto', type: 'route', to: '/contacto', label: 'Contacto', dataLink: 'navbar-contacto-link' } }), BrowserRouter));
  await click(container.querySelector('a'));
  assert.equal(window.location.pathname, '/contacto');
  assert.equal(window.dataLayer.length, 1);
  assert.equal(window.dataLayer[0].page_path, '/');
});

test('anchors de NavItems propagan atributos HTML reales y mantienen preventDefault y scroll', async (t) => {
  const scroll = t.mock.method(window, 'scrollTo');
  await render(tracked(h(React.Fragment, null,
    h('section', { id: 'portafolio' }),
    h(NavItems, { item: { id: 'portafolio', type: 'anchor', to: '#portafolio', label: 'Portafolio', dataLink: 'home-portafolio-link' } }))));
  assertTaggedLinks();
  await click(container.querySelector('a'));
  assert.equal(window.location.hash, '#portafolio');
  assert.equal(scroll.mock.callCount(), 1);
  assert.deepEqual(window.dataLayer, [{ event: 'click_link', click_id: 'home-portafolio-link', page_path: '/', link_url: '#portafolio' }]);
});

test('botones de navegación a anchors exponen el destino efectivo desde otras páginas', async () => {
  window.history.replaceState({}, '', '/nosotros');
  await render(h(MemoryRouter, { initialEntries: ['/nosotros'] }, h(Tracker),
    h(BotonNav, { to: '#portafolio', dataLink: 'nosotros-portafolio-btn' }, 'Portafolio')));
  const button = container.querySelector('button');
  assert.equal(button.getAttribute('data-tracking-url'), '/#portafolio');
  await click(button);
  assert.deepEqual(window.dataLayer, [{ event: 'click_link', click_id: 'nosotros-portafolio-btn', page_path: '/nosotros', link_url: '/#portafolio' }]);
});

test('NavItems mide el destino de anchors hacia Home desde otra ruta', async () => {
  window.history.replaceState({}, '', '/servicios');
  await render(h(MemoryRouter, { initialEntries: ['/servicios'] }, h(Tracker),
    h(NavItems, { item: { id: 'portafolio', type: 'anchor', to: '#portafolio', label: 'Portafolio', dataLink: 'servicios-portafolio-link' } })));
  assert.equal(container.querySelector('a').getAttribute('href'), '#portafolio');
  await click(container.querySelector('a'));
  assert.deepEqual(window.dataLayer, [{ event: 'click_link', click_id: 'servicios-portafolio-link', page_path: '/servicios', link_url: '/#portafolio' }]);
});

test('sin GTM inicializa dataLayer; navegación repetida a la misma ruta sigue contando una vez', async () => {
  delete window.dataLayer;
  await render(tracked(h(SmartLink, { to: '/', dataLink: 'navbar-inicio-link' }, 'Inicio')));
  await click(container.querySelector('a'));
  await click(container.querySelector('a'), { detail: 0 }); // keyboard activation
  assert.equal(window.dataLayer.length, 2);
  assert.ok(window.dataLayer.every((entry) => entry.event === 'click_link'));
});

test('controles internos, submit, deshabilitados y elementos sin etiqueta no emiten', async () => {
  await render(tracked(h(React.Fragment, null,
    h('button', { type: 'button' }, 'Menú'),
    h('button', { type: 'button', disabled: true, 'data-cta': 'disabled' }, 'Disabled'),
    h('a', { 'aria-disabled': true, 'data-link': 'disabled' }, 'Disabled link'),
    h('form', null, h('button', { type: 'submit', 'data-cta': 'submit' }, 'Enviar')),
    h('input', { 'data-link': 'input' }))));
  for (const element of container.querySelectorAll('button, a, input')) await click(element);
  assert.deepEqual(window.dataLayer, []);
});

test('no transmite PII, queries, fragmentos libres ni URLs de contacto/descarga', async () => {
  window.history.replaceState({}, '', '/agentes/private-name?email=private@example.com');
  const destinations = ['/contacto?email=private@example.com#private-name', 'tel:+521234567890',
    'mailto:private@example.com', 'https://wa.me/521234567890?text=private-name',
    'blob:https://vitamet.test/private-token', '/agentes/private-name', '/private-token',
    'javascript:alert(1)', 'https://user:password@vitamet.test/contacto'];
  await render(tracked(h('div', null, destinations.map((href, index) =>
    h('a', { key: index, href, 'data-cta': 'agente-whatsapp-btn' }, 'Contactar')))));
  for (const link of container.querySelectorAll('a')) await click(link);
  assert.equal(window.dataLayer.length, destinations.length);
  assert.equal(window.dataLayer[0].link_url, '/contacto');
  assert.ok(window.dataLayer.slice(1).every((entry) => entry.link_url === undefined));
  assert.ok(window.dataLayer.every((entry) => entry.page_path === '/agentes/:slug'));
  assert.ok(!/private|1234567890|password/.test(JSON.stringify(window.dataLayer)));
  window.history.replaceState({}, '', '/private-token');
  await click(container.querySelector('a'));
  assert.equal(window.dataLayer.at(-1).page_path, '/:path');
});

test('un fallo de analytics no bloquea handlers de navegación', async () => {
  await render(tracked(h(NavItems, { item: { id: 'contacto', type: 'route', to: '/contacto', label: 'Contacto', dataLink: 'navbar-contacto-link' } }), BrowserRouter));
  window.dataLayer = { push() { throw new Error('Blocked analytics'); } };
  await click(container.querySelector('a'));
  assert.equal(window.location.pathname, '/contacto');
});

for (const [path, Page] of [
  ['/', HomePage], ['/nosotros', NosotrosPage], ['/servicios', ServiciosPage], ['/blog', BlogPage],
  ['/contacto', ContactoPage], ['/recluta', ReclutaPage], ['/politica-privacidad', PoliticaPrivacidadPage],
]) {
  test(`${path}: todos los enlaces reales tienen un único atributo y los controles quedan excluidos`, async () => {
    window.history.replaceState({}, '', path);
    await render(tracked(h(Page)));
    assertTaggedLinks();
    assert.deepEqual(window.dataLayer, []);
  });
}

test('navbar desktop, burger y footer conservan IDs y propagan atributos hasta el DOM', async () => {
  await render(tracked(h(React.Fragment, null, h(Navbar), h(BurgerMenu), h(Footer))));
  assertTaggedLinks();
  for (const id of ['navbar-logo-btn', 'navbar-contacto-link', 'navbar-unete-btn',
    'burger-inicio-link', 'burger-contacto-link', 'burger-unete-btn', 'footer-logo-btn', 'footer-politica-link']) {
    assert.equal(container.querySelectorAll(`[data-link="${id}"], [data-cta="${id}"]`).length, 1, id);
  }
  const toggle = container.querySelector('[aria-controls="mobile-menu"]');
  await click(toggle);
  assert.deepEqual(window.dataLayer, []);
  await click(container.querySelector('[data-link="burger-servicios-link"]'));
  assert.equal(window.dataLayer.length, 1);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
});

test('los datos de listas y clones conservan IDs estables y un único evento por interacción', async () => {
  await render(tracked(h(BlogPage)));
  const links = container.querySelectorAll('[data-link="blog-inicio-presupuesto-link"]');
  assert.ok(links.length > 1);
  await click(links[0].querySelector('span'));
  assert.equal(window.dataLayer.length, 1);
  assert.equal(window.dataLayer[0].click_id, 'blog-inicio-presupuesto-link');
});

test('Home conserva un único enlace por tarjeta, sin enlaces anidados ni eventos duplicados', async () => {
  await render(tracked(h(SectionHp5), BrowserRouter));
  assertTaggedLinks();
  const cards = container.querySelectorAll('a');
  assert.equal(cards.length, 3, 'One semantic link for each solution card');
  for (const card of cards) {
    assert.equal(card.getAttribute('href'), '/nosotros');
    assert.equal(card.getAttribute('data-link'), 'home-nosotros-link');
    assert.equal(card.querySelectorAll('a, button').length, 0);
    assert.match(card.getAttribute('aria-label'), /leer más sobre/);
    const readMore = card.querySelector('span');
    assert.match(readMore.textContent, /Leer más/);
    assert.equal(readMore.hasAttribute('data-link'), false);
    assert.equal(readMore.hasAttribute('data-cta'), false);
    for (const target of [card.querySelector('img'), card.querySelector('h3'), readMore]) {
      const sourcePath = window.location.pathname;
      window.dataLayer = [];
      await click(target);
      assert.equal(window.location.pathname, '/nosotros');
      assert.deepEqual(window.dataLayer, [{ event: 'click_link', click_id: 'home-nosotros-link', page_path: sourcePath, link_url: '/nosotros' }]);
    }
  }
});

test('tarjeta de agente: atributos reales, clic externo único y perfil sin datos personales', async (t) => {
  const agent = { nombre: 'Private Name', path: 'private-name', cargo: 'Asesor', foto: '/photo.webp',
    telefono: '521234567890', whatsapp: '521234567890', correo: 'private@example.com', exp: 10, clientes: 100, status: 'Activo' };
  fetchMock.mock.mockImplementation(async () => ({ ok: true, json: async () => ({ success: true, data: agent }) }));
  t.mock.method(URL, 'createObjectURL', () => 'blob:https://vitamet.test/private-token');
  t.mock.method(URL, 'revokeObjectURL', () => {});
  window.history.replaceState({}, '', '/agentes/private-name');
  await render(h(MemoryRouter, { initialEntries: ['/agentes/private-name'] }, h(HelmetProvider, null,
    h(Tracker), h(Routes, null, h(Route, { path: '/agentes/:slug', element: h(AgentePage) })))));
  assertTaggedLinks();
  for (const id of ['agente-guardar-btn', 'agente-llamar-btn', 'agente-whatsapp-btn', 'agente-correo-btn']) {
    await click(container.querySelector(`[data-cta="${id}"]`));
    assert.equal(window.dataLayer.at(-1).click_id, id);
    assert.equal(window.dataLayer.at(-1).link_url, undefined);
  }
  assert.equal(window.dataLayer.length, 4);
  assert.ok(!/private|1234567890/.test(JSON.stringify(window.dataLayer)));
});
