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

## Etapa 2: contacto y CV

Los tres endpoints mantienen rutas y controladores independientes. Las utilidades
de validación, HTTP, Airtable y deduplicación se comparten entre contacto y CV.
El controlador, ruta y pruebas de email no se modifican; las reglas comunes
replican su contrato de email, UTM y honeypot.

### POST /api/submit-con

Solo `application/json`, máximo 16 KiB, sin compresión ni propiedades extra.

```json
{
  "name": "María Pérez",
  "email": "persona@example.com",
  "subject": "asesoria",
  "message": "Quisiera información sobre sus servicios.",
  "formSource": "consulta_contacto",
  "utm": { "utm_campaign": "verano" },
  "website": ""
}
```

- `name`: obligatorio, 2–120 caracteres; recorte exterior y espacios internos
  consecutivos unificados. No se admiten caracteres de control.
- `email`: obligatorio, mismas reglas de la etapa email.
- `subject`: obligatorio, exactamente `asesoria`, `servicios` u `otro`, según
  `GeneralInquiryForm`.
- `message`: obligatorio, 10–5000 caracteres; recorte exterior y saltos CRLF/CR
  normalizados a LF. Se admiten párrafos y tabulaciones, no otros controles.
- `formSource`: obligatorio, exactamente `consulta_contacto`.
- `utm` y `website`: opcionales, con los mismos límites y clasificación de email.

Reutiliza `AIRTABLE_API_KEY`, `AIRTABLE_POST_FORM_CON` y
`AIRTABLE_POST_TABLE_CON`. La tabla `consulta` recibe exclusivamente:
`name`, `email`, `subject`, `text` (desde `message`), `source` y `source_utm`.

### POST /api/submit-cv

Solo `multipart/form-data`, con boundary. Un archivo llamado `cv` y hasta seis
campos de texto, todos únicos. No usar claves con corchetes ni campos adicionales.

| Parte | Contrato |
| --- | --- |
| `name` | Obligatorio, mismas reglas que contacto. |
| `phone` | Obligatorio, máximo 40 caracteres de entrada; se admiten dígitos, espacios, paréntesis, puntos, guiones y un `+` inicial. Se normaliza a 8–15 dígitos con `+` opcional. |
| `location` | Obligatorio, exactamente `monterrey` o `nacional`, según `JoinTeamForm`. |
| `cv` | Archivo obligatorio, no vacío, extensión PDF o DOCX, máximo inclusivo de **5.000.000 bytes**. |
| `formSource` | Obligatorio, exactamente `cv_contacto`. |
| `utm` | Opcional; un único string JSON serializado, por ejemplo `{"utm_campaign":"verano"}`. Se valida con las mismas reglas que email. |
| `website` | Honeypot opcional, normalmente vacío, máximo 512 caracteres. |

El límite de solicitud declarado es 5.150.000 bytes; para solicitudes chunked
se aplican igualmente los límites por archivo, campo y número de partes. Cada
campo de texto puede ocupar hasta 16 KiB antes de aplicar su validación específica.
No se admiten cuerpos comprimidos. Un honeypot con texto recibe éxito aparente
tras validar formato/límites de transporte, estructura raíz y tipo del honeypot;
no requiere los demás datos ni un archivo válido y nunca escribe en Airtable.

Se comprueba la extensión y el contenido, sin confiar en el MIME del navegador:

- PDF: firma y versión de cabecera y terminador `%%EOF`.
- DOCX: ZIP legible, partes `[Content_Types].xml`, `_rels/.rels` y
  `word/document.xml`, tipo principal y estructura XML de Word. Se rechazan ZIP
  cifrados, macros VBA, nombres duplicados, rutas inválidas y declaraciones
  DOCTYPE/ENTITY en las partes inspeccionadas. Máximo 256 entradas, 20 MB
  descomprimidos en total y 2 MB por cada parte XML inspeccionada. Se leen las
  entradas de forma secuencial y acotada, sin extraerlas al disco.

Estas comprobaciones identifican el formato; no son un renderizador completo de
PDF/Word ni un análisis antivirus. Los archivos se mantienen temporalmente en
memoria y se suben con nombre fijo `cv.pdf` o `cv.docx` y MIME derivado del formato.

Reutiliza `AIRTABLE_API_KEY`, `AIRTABLE_POST_FORM_CV` y
`AIRTABLE_POST_TABLE_CV`. Primero crea el candidato en `Lead`, con exclusivamente
`name`, `phone`, `state` (desde `location`), `source` y `source_utm`. Después usa
el record ID recibido para subir el archivo al campo existente `attachment`:

```text
POST https://content.airtable.com/v0/{baseId}/{recordId}/attachment/uploadAttachment
JSON: { contentType, file: bytes_en_base64, filename }
```

Se revisó la [documentación oficial de uploadAttachment](https://airtable.com/developers/web/api/upload-attachment)
el 27 de octubre de 2026: límite 5 MB, cuerpo Base64, permiso `data.records:write`
y rol editor de base. Se eligió la interpretación decimal conservadora del límite.
No se crea ninguna columna nueva. El timeout de creación es 8 s y el de adjunto
15 s; no hay redirecciones ni reintentos automáticos.

### Éxito completo, parcial y prevención de duplicados

Contacto responde HTTP 200 con `{ "success": true, "message": "..." }`.
CV responde HTTP 200 con `partial: false` al confirmar el adjunto en la respuesta
de Airtable; el honeypot devuelve el mismo éxito aparente.

Si el registro ya se guardó y falla la subida, se agota su timeout, no llega un
record ID utilizable o la respuesta no confirma el adjunto, el registro se conserva
y CV devuelve HTTP 200 con este contrato explícito de éxito parcial:

```json
{
  "success": true,
  "partial": true,
  "code": "CV_ATTACHMENT_FAILED",
  "message": "Tus datos se guardaron, pero no pudimos confirmar el CV. No repitas la postulación."
}
```

La futura integración frontend debe comprobar `partial` antes de considerar
completada la postulación. No se elimina el registro, no se reintenta el adjunto
y no se vuelve a crear el candidato. Tampoco se devuelve su record ID.

Los errores siguen `{ "success": false, "message": "..." }`: 400 para datos
inválidos, 405 para métodos incorrectos (Allow: POST), 413 para tamaños/cantidades,
415 para formatos y compresión, 500 para errores inesperados, 502 para fallos del
proveedor, 503 para configuración ausente o capacidad local agotada y 504 para
timeout al crear el registro. OPTIONS conserva el preflight CORS existente.
Ante un fallo al crear, no se puede descartar que Airtable ya haya guardado el
registro: la respuesta indica que no se repita el envío automáticamente.

Contacto y CV comparten una protección local que agrupa solicitudes idénticas
normalizadas mediante SHA-256 (incluyendo bytes del CV), y devuelve la misma
respuesta para solicitudes concurrentes o repetidas durante 10 minutos tras
terminar. Retiene también errores inciertos y éxitos parciales; almacena como
máximo 1000 huellas/respuestas, sin conservar los archivos en la caché. Es una
protección por proceso para desarrollo: no persiste tras reinicios ni coordina
varias instancias. Tras expirar, una nueva solicitud puede crear otro registro.

### Validación y pendientes

`npm --prefix backend test` ejecuta las pruebas existentes de email y las nuevas
de contacto/CV con `node:test`, mocks de dotenv/Axios y adaptador externo bloqueado.
No se lee el `.env` real, no se escriben registros ni se borran candidatos.
Las fixtures PDF y DOCX se generan en memoria y no contienen datos reales.

Dependencias añadidas: Multer 2.5 para multipart y yauzl 3.4 para lectura ZIP
acotada. No se añaden variables de entorno.

Pendiente para las etapas posteriores: adoptar estos contratos en React y PHP,
verificar los tipos/opciones de campos y permisos de las tablas reales, y ejecutar
las pruebas reales de los tres formularios conjuntamente con autorización.
La recuperación de un CV con éxito parcial y la idempotencia persistente para
producción necesitan definir su flujo; no forman parte de esta etapa Node local.
