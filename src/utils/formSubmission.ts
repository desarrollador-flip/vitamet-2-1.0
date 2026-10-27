export type FormEndpoint = 'email' | 'con' | 'cv';
export type EmailFormSource = 'newsletter_blog' | 'asesoria_contacto';
export type SubmissionStatus = 'idle' | 'loading' | 'success' | 'error' | 'partial' | 'uncertain';
export interface FormSubmissionState {
  status: SubmissionStatus;
  message: string;
}

export function getFormEndpoint(form: FormEndpoint): string {
  return import.meta.env.DEV ? `/api/submit-${form}` : `/backend/submit-${form}.php`;
}

export function isSubmissionBlocked(status: SubmissionStatus): boolean {
  return status === 'loading' || status === 'partial' || status === 'uncertain';
}

const uncertain: FormSubmissionState = {
  status: 'uncertain',
  message: 'No pudimos confirmar si recibimos tus datos. No vuelvas a enviarlos para evitar duplicados; contáctanos para verificarlo.',
};

export async function submitForm(form: FormEndpoint, body: Record<string, unknown> | FormData): Promise<FormSubmissionState> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 35000);
  const multipart = body instanceof FormData;
  try {
    const requestBody = multipart ? body : JSON.stringify(body);
    if (typeof requestBody === 'string' && new TextEncoder().encode(requestBody).byteLength > 16 * 1024) {
      return { status: 'error', message: 'El envío supera 16 KiB. Reduce el mensaje antes de enviarlo nuevamente.' };
    }
    const response = await fetch(getFormEndpoint(form), {
      method: 'POST',
      headers: multipart ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: requestBody,
      credentials: 'same-origin',
      redirect: 'error',
      signal: controller.signal,
    });
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('success' in data) || !('message' in data) || typeof data.message !== 'string') return uncertain;
    const partial = 'partial' in data ? data.partial : undefined;
    const code = 'code' in data ? data.code : undefined;
    if (response.ok && form === 'cv' && data.success === true && partial === true && code === 'CV_ATTACHMENT_FAILED') {
      return { status: 'partial', message: 'Recibimos tus datos, pero no pudimos confirmar el CV. No repitas la postulación; contáctanos para verificar el archivo.' };
    }
    if (response.ok && data.success === true && code === undefined
      && (form === 'cv' ? partial === false : partial === undefined || partial === false)) {
      return { status: 'success', message: 'Solicitud recibida correctamente.' };
    }
    // Un rechazo explícito de validación/formato permite corregir y enviar manualmente.
    // 5xx, transporte, JSON inesperado o parcial ambiguo no confirman ausencia de escritura.
    if (!response.ok && data.success === false && (partial === undefined || partial === false) && code === undefined
      && [400, 401, 403, 404, 405, 413, 415, 422, 429].includes(response.status)) {
      return { status: 'error', message: response.status === 413
        ? 'El envío supera el tamaño permitido. Revisa los datos y el archivo antes de enviarlo de nuevo.'
        : 'No se pudo enviar el formulario. Revisa los datos e inténtalo nuevamente cuando el servicio esté disponible.' };
    }
    return uncertain;
  } catch {
    return uncertain;
  } finally {
    window.clearTimeout(timeout);
  }
}
