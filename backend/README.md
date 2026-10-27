# Backend de desarrollo: captura de email

Iniciar desde la raíz con `node backend/index.js` o desde `backend` con
`node index.js`. Dotenv carga siempre `backend/.env` mediante una ruta absoluta,
sin sobrescribir variables ya definidas en el proceso.

Se reutilizan `AIRTABLE_API_KEY`, `AIRTABLE_POST_FORM_MAIL` (base) y
`AIRTABLE_POST_TABLE_MAIL` (tabla newsletter). No se necesitan variables nuevas.

## Contrato de POST /api/submit-email

Content-Type: `application/json`, opcionalmente con charset UTF-8.
Límite del cuerpo: **16 KiB**. No se aceptan cuerpos comprimidos ni propiedades
adicionales en el objeto raíz.

```json
{
  "email": "persona@example.com",
  "formSource": "newsletter_blog",
  "utm": {
    "utm_source": "newsletter",
    "utm_campaign": "verano"
  },
  "website": ""
}
```

| Campo | Contrato |
| --- | --- |
| `email` | Obligatorio, string de hasta 254 caracteres antes de normalizar; se recortan espacios exteriores y se convierte a minúsculas. Dirección ASCII sin caracteres de control, local de hasta 64 caracteres y dominio con al menos dos etiquetas válidas. |
| `formSource` | Obligatorio; exactamente `newsletter_blog` o `asesoria_contacto`. |
| `utm` | Opcional; objeto de hasta 20 parámetros, incluidos estándares y futuros. Claves minúsculas que cumplan `^utm_[a-z0-9_]+$`, máximo 64 caracteres. Valores string, máximo 256 caracteres cada uno, sin caracteres de control. No admite arrays, null ni objetos anidados. |
| `website` | Honeypot opcional, string de hasta 512 caracteres, normalmente vacío. Si contiene texto tras recortar espacios, responde éxito sin escribir. Se comprueban antes la estructura raíz y el tipo/límite del honeypot; no se exige completar los demás campos a un bot. |

Solo se envían a Airtable estos campos:

- `email`: dirección validada y normalizada.
- `source`: el `formSource` validado.
- `source_utm`: `utm_campaign` recortado si contiene texto; `sin_campana` si
  existe otro UTM con texto; `organico` si no existen UTM con texto.

Los UTM vacíos o compuestos únicamente por espacios se consideran ausentes.
No se crean columnas ni se guardan los restantes UTM. El esquema y los permisos
de la tabla deben estar preparados en Airtable; las pruebas no los comprueban.

## Respuestas

Éxito real o aparente (honeypot): HTTP **200**.

```json
{ "success": true, "message": "Solicitud recibida correctamente." }
```

Todos los errores utilizan `{ "success": false, "message": "..." }`, sin
reflejar el payload, las credenciales ni detalles del proveedor.

| HTTP | Situación |
| --- | --- |
| 400 | JSON, estructura o campos inválidos/ausentes. |
| 405 | Método distinto de POST; incluye `Allow: POST`. HEAD responde sin cuerpo por semántica HTTP. |
| 413 | Cuerpo mayor a 16 KiB. |
| 415 | Content-Type, charset o compresión no admitidos. |
| 500 | Error interno inesperado. |
| 502 | Error de conexión o respuesta fallida de Airtable. |
| 503 | Configuración de Airtable incompleta. |
| 504 | Timeout de Airtable (8 segundos). |

El middleware CORS global existente conserva su preflight OPTIONS (204);
ningún preflight escribe en Airtable. Las solicitudes fallidas no se reintentan
automáticamente para evitar escrituras duplicadas tras un timeout incierto.
Los logs técnicos solo contienen categorías fijas y, cuando existe, el código
HTTP del proveedor. No se registra el error de Axios completo.

## Pruebas sin Airtable real

Con Node y las dependencias existentes instalados:

```sh
npm --prefix backend test
```

Se usa `node:test`, HTTP local y mocks de Axios/dotenv. Las pruebas no leen el
`.env` real y bloquean el adaptador HTTP externo de Axios. Cubren validación,
mapping, límites, métodos, honeypot, configuración, errores y timeout del
proveedor, y ausencia de filtraciones en respuestas y logs.

El POST antiguo `/api/submit` se conserva temporalmente. El GET de agentes,
su caché, PHP y frontend mantienen su implementación existente.
