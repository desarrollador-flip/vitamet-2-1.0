const storageKey = 'vitamet:utm';
const attributionLifetime = 15 * 24 * 60 * 60 * 1000;

function sanitize(entries: Iterable<[string, unknown]>): Record<string, string> {
  const utm: Record<string, string> = {};
  // La campaña tiene prioridad si la URL contiene más de veinte parámetros.
  const ordered = Array.from(entries).sort(([a], [b]) => Number(b === 'utm_campaign') - Number(a === 'utm_campaign'));
  for (const [key, value] of ordered) {
    if (Object.keys(utm).length >= 20) break;
    if (key.length > 64 || !/^utm_[a-z0-9_]+$/.test(key) || Object.prototype.hasOwnProperty.call(utm, key)) continue;
    if (typeof value !== 'string' || value.length > 256 || hasFormControlCharacters(value) || !value.trim()) continue;
    utm[key] = value.trim();
  }
  return utm;
}

export function getFormUtm(search?: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const now = Date.now();
  const current = sanitize(new URLSearchParams(search ?? window.location.search));
  if (Object.keys(current).length) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ utm: current, expiresAt: now + attributionLifetime }));
    } catch {
      // La URL sigue siendo utilizable aunque el navegador bloquee localStorage.
    }
    return current;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const saved: unknown = JSON.parse(raw);
    if (saved && typeof saved === 'object' && 'expiresAt' in saved && 'utm' in saved
      && typeof saved.expiresAt === 'number' && saved.expiresAt > now && saved.expiresAt <= now + attributionLifetime
      && saved.utm && typeof saved.utm === 'object' && !Array.isArray(saved.utm)) {
      return sanitize(Object.entries(saved.utm));
    }
    window.localStorage.removeItem(storageKey);
  } catch {
    // Datos corruptos, almacenamiento lleno o modo privado no bloquean el formulario.
  }
  return {};
}
import { hasFormControlCharacters } from './formValidation';

