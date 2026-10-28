export type TrackingFormId = 'consulta_contacto' | 'cv_contacto' | 'newsletter_blog' | 'asesoria_contacto';

type TrackingEvent = {
  event: 'click_link' | 'click_cta';
  click_id: string;
  page_path: string;
  link_url?: string;
} | {
  event: 'formulario_enviado';
  form_id: TrackingFormId;
  page_path: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// Only public, static routes may enter analytics. Keep agent names and arbitrary
// URL segments out of the payload, including on unknown/provisional routes.
const publicPaths = new Set([
  '/', '/nosotros', '/servicios', '/blog', '/contacto', '/recluta',
  '/politica-privacidad', '/terminos-condiciones', '/sostenibilidad', '/carrera',
]);
const publicAnchors = new Set(['#portafolio', '#nosotros-hitos', '#recluta4']);

function getPagePath(): string {
  const path = window.location.pathname;
  if (publicPaths.has(path)) return path;
  return path.startsWith('/agentes/') ? '/agentes/:slug' : '/:path';
}

function getLinkUrl(element: Element): string | undefined {
  const destination = element.getAttribute('data-tracking-url') ?? element.getAttribute('href');
  if (!destination) return undefined;

  // tel:, mailto:, WhatsApp paths/messages and blob: URLs contain personal or
  // temporary data. Never collect them, query strings or arbitrary fragments.
  try {
    const url = new URL(destination, window.location.href);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== window.location.origin
      || url.username || url.password || !publicPaths.has(url.pathname)) return undefined;
    const hash = publicAnchors.has(url.hash) ? url.hash : '';
    return destination.startsWith('#') && hash ? hash : url.pathname + hash;
  } catch {
    return undefined;
  }
}

function pushEvent(event: TrackingEvent): void {
  if (typeof window === 'undefined') return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);
  } catch {
    // Analytics must not interrupt navigation or a confirmed form reset.
  }
}

export function trackClick(event: MouseEvent): void {
  if (event.button !== 0) return;
  const target = event.target instanceof Element ? event.target
    : event.target instanceof Node ? event.target.parentElement : null;
  if (!target || target.closest(':disabled, [aria-disabled="true"], [inert], input, select, textarea')) return;
  const element = target.closest('[data-cta], [data-link]');
  if (!element) return;
  if (element instanceof HTMLButtonElement && element.form && element.type === 'submit') return;

  const cta = element.getAttribute('data-cta');
  const clickId = cta || element.getAttribute('data-link');
  if (!clickId) return;
  const linkUrl = getLinkUrl(element);
  pushEvent({
    event: cta ? 'click_cta' : 'click_link',
    click_id: clickId,
    page_path: getPagePath(),
    // Clear a previous destination in GTM's data model when this action has none.
    link_url: linkUrl,
  });
}

// Call only in the confirmed-success branch, after excluding the honeypot.
export function trackFormSuccess(formId: TrackingFormId): void {
  if (typeof window === 'undefined') return;
  pushEvent({ event: 'formulario_enviado', form_id: formId, page_path: getPagePath() });
}
