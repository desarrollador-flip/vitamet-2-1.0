# Backend PHP de producción

Los endpoints nuevos son `backend/submit-email.php`, `backend/submit-con.php` y
`backend/submit-cv.php`. Comparten únicamente validación/HTTP y acceso a Airtable
en `utils/submitCommon.php` y `utils/airtablePost.php`. No incluyen ni modifican
`agentes.php`, `helpers.php` ni configuración del GET. No requieren Composer.

## Configuración privada en cPanel

Estructura confirmada por el responsable del despliegue:

```text
/home/compraru/
├── env-vitamet.php          ← crear MANUALMENTE; fuera de la carpeta pública
└── VITAMET/                ← carpeta pública del sitio
    └── backend/
        ├── submit-email.php
        ├── submit-con.php
        ├── submit-cv.php
        ├── utils/
        │   ├── submitCommon.php
        │   └── airtablePost.php
        ├── agentes.php     ← implementación existente, sin cambios
        └── helpers.php     ← implementación existente, sin cambios
```

Cada endpoint calcula la ruta con `__DIR__ . '/../../env-vitamet.php'`. No utiliza
el directorio de trabajo, rutas URL, `.env` de Node, variables GET ni un PAT
incrustado. La ruta absoluta del esquema anterior sirve para describir el
despliegue confirmado; no está fijada en el cargador.

1. En el administrador de archivos de cPanel, crear **manualmente** el archivo
   `/home/compraru/env-vitamet.php`, al mismo nivel que `VITAMET/`.
2. Copiar la estructura de [env-vitamet.example.php](../env-vitamet.example.php).
   Debe devolver un array PHP mediante `return [...]`, sin salida ni cierre `?>`.
3. Sustituir los placeholders de forma privada. La base de los tres formularios
   es compartida; sus tablas son distintas. El token necesita permiso de escritura
   de registros y acceso a esa base.
4. Limitar la lectura al usuario PHP de la cuenta (por ejemplo, permisos 0600 si
   PHP se ejecuta como ese usuario). Verificar propietario y permisos en Neubox.
5. Subir únicamente los tres endpoints y sus dos utilidades nuevas. No subir
   `tests/`, el ejemplo de configuración, dependencias Node ni `.env` como parte
   de este backend PHP. Los GET existentes mantienen su despliegue actual.

Claves del array privado:

| Clave | Uso |
| --- | --- |
| `AIRTABLE_API_KEY` | PAT para los POST. |
| `AIRTABLE_POST_FORM_MAIL` | Base compartida para email. |
| `AIRTABLE_POST_TABLE_MAIL` | Tabla `newsletter`. |
| `AIRTABLE_POST_FORM_CON` | Base compartida para contacto. |
| `AIRTABLE_POST_TABLE_CON` | Tabla `consulta`. |
| `AIRTABLE_POST_FORM_CV` | Base compartida para postulaciones. |
| `AIRTABLE_POST_TABLE_CV` | Tabla `Lead`. |

No se crea el archivo real desde el repositorio. `.gitignore` protege cualquier
copia local llamada `env-vitamet.php`. El cargador comprueba que la ruta resuelta
no quede dentro de la carpeta pública ni de `DOCUMENT_ROOT`, tampoco mediante
un enlace simbólico. Si falta, no es legible o está mal configurada, falla con
JSON y HTTP 503 antes de escribir. Descarta cualquier salida accidental de la
inclusión y no registra credenciales ni rutas del archivo privado.

## Contratos y mapping

Los valores, límites de longitud y clasificación UTM siguen los contratos Node
documentados en [README.md](README.md). Los strings UTF-8 se cuentan como unidades
UTF-16 para conservar los límites de JavaScript, incluidos emojis y whitespace.

| Endpoint PHP | Entrada | Campos Airtable |
| --- | --- | --- |
| `submit-email.php` | JSON: `email`, `formSource`; opcionales `utm`, `website`. Orígenes `newsletter_blog`, `asesoria_contacto`. | `email`, `source`, `source_utm`. |
| `submit-con.php` | JSON: `name`, `email`, `subject`, `message`, `formSource=consulta_contacto`; opcionales `utm`, `website`. | `name`, `email`, `subject`, `text`, `source`, `source_utm`. |
| `submit-cv.php` | Multipart: `name`, `phone`, `location`, archivo `cv`, `formSource=cv_contacto`; opcionales `utm` como string JSON y `website`. | Primero `name`, `phone`, `state`, `source`, `source_utm`; después el archivo en `attachment`. |

- JSON: máximo 16 KiB, objeto raíz, sin propiedades adicionales. UTF-8; no
  cuerpos comprimidos. Contacto admite asuntos `asesoria`, `servicios`, `otro`.
- Nombre 2–120 caracteres; email máximo 254; mensaje 10–5000; teléfono de 8–15
  dígitos con `+` opcional tras normalizar. Ubicación `monterrey` o `nacional`.
- UTM: hasta 20 parámetros `utm_*`, clave de hasta 64 caracteres y string de
  hasta 256. Campaña con texto → campaña; otro UTM con texto → `sin_campana`;
  sin texto UTM → `organico`. No se crean columnas ni se guarda el objeto UTM.
- Honeypot `website`: máximo 512 caracteres; si tiene texto después del recorte,
  responde el mismo éxito aparente sin cargar credenciales ni escribir.
- CV: máximo inclusivo 5.000.000 bytes y solicitud declarada de hasta 5.150.000
  bytes; seis campos de texto de hasta 16 KiB y solo un archivo llamado `cv`.
  Se utiliza `$_POST`, `$_FILES`, `is_uploaded_file`, tamaño real y `finfo`.
  No se confía en el MIME declarado por el navegador.
- PDF: MIME real `application/pdf`, versión/firma y terminador `%%EOF`.
  DOCX: MIME Word/ZIP, ZIP consistente, partes XML de Word, sin cifrado/VBA,
  rutas inseguras, entradas duplicadas ni DOCTYPE/ENTITY. Se comprueban tamaños y
  CRC mientras se leen las entradas; no se extrae el ZIP al disco. Máximos:
  256 entradas, 20 MB descomprimidos y 2 MB por parte XML inspeccionada.
  Son comprobaciones estructurales, no renderizado completo ni antivirus.

El archivo temporal nativo se utiliza solo durante la petición y no se mueve a
una carpeta pública. Airtable recibe Base64, nombre fijo `cv.pdf`/`cv.docx` y MIME
derivado del formato. Se sigue el [endpoint oficial uploadAttachment](https://airtable.com/developers/web/api/upload-attachment),
con record ID validado y campo existente `attachment`.

Éxito: HTTP 200, `{ "success": true, "message": "..." }`; CV completo incluye
`partial: false`. Si el candidato ya se guardó y el adjunto falla o no se confirma:

```json
{
  "success": true,
  "partial": true,
  "code": "CV_ATTACHMENT_FAILED",
  "message": "Tus datos se guardaron, pero no pudimos confirmar el CV. No repitas la postulación."
}
```

Este parcial conserva HTTP 200 y el registro existente. No lo borra ni crea otro.
Los errores siguen `{ "success": false, "message": "..." }`: 400 datos/formato
inválidos; 405 método incorrecto con `Allow: POST`; 413 tamaño excedido; 415 tipo,
charset o compresión no admitidos; 500 error interno; 502 fallo del proveedor;
503 configuración/capacidades no disponibles; 504 timeout de creación. HEAD
omite el cuerpo y OPTIONS responde 204 sin acceso a Airtable.

No se emite `Access-Control-Allow-Origin: *` ni se habilita CORS: frontend y PHP
comparten dominio. No se agregan rewrites ni se modifican rutas del sitio.
No hay caché de deduplicación ni reintentos automáticos. Un nuevo POST manual es
un nuevo intento; tras un timeout incierto o parcial no se debe repetir
automáticamente. La futura integración React debe distinguir `partial`.

## Requisitos y comprobaciones en Neubox

Antes de habilitar estos endpoints, comprobar en el perfil PHP de **este dominio**:

- PHP **8.2 o superior**; JSON y hash disponibles.
- Extensión **mbstring**, usada para validar UTF-8 y longitudes UTF-16.
- Extensión **curl**, HTTPS/TLS y certificados CA válidos. Conexión saliente a
  `api.airtable.com:443` y `content.airtable.com:443`. No desactivar verificación
  TLS: los POST la exigen y no siguen redirecciones.
- **fileinfo** (`finfo`) y **zip** (`ZipArchive`, `getStreamIndex`) para CV.
  No se crea el candidato si faltan las capacidades necesarias para su archivo.
  Véase el [manual de ZipArchive](https://www.php.net/manual/en/class.ziparchive.php).
- `file_uploads=On`, `upload_max_filesize=5M` o superior, `post_max_size=6M` o
  superior, `memory_limit=128M` o superior y tiempo de ejecución al menos 30 s.
  El límite propio del archivo sigue siendo 5.000.000 bytes.
- Directorio temporal de uploads accesible/escribible, sin permisos públicos.
- `max_input_vars` suficiente para seis campos; límites de multipart y archivos
  que permitan al script recibir y rechazar entradas extra, sin truncarlas antes.
- `open_basedir`, permisos y `DOCUMENT_ROOT` compatibles con leer el archivo
  privado confirmado. Revisar el perfil FPM/Apache real y los límites del proxy
  o ModSecurity: pueden rechazar la petición antes de ejecutar PHP.
- `display_errors=Off` también en el INI del dominio: errores de recepción de
  uploads pueden ocurrir antes de que el script lo desactive. Logs privados y
  accesibles al responsable del hosting. No publicar `phpinfo()`.

Las configuraciones de subida se aplican en cPanel/INI, no mediante cambios en
el frontend ni `ini_set` después de recibir el archivo. Véase el
[manual oficial de uploads](https://www.php.net/manual/en/features.file-upload.post-method.php).
Los timeouts de cURL son 8 s al crear y 15 s al subir; no se registran respuestas,
correos, archivos, tokens ni identificadores internos.

**Limitación nativa multipart:** PHP procesa el cuerpo antes del script y puede
normalizar nombres/sobrescribir campos escalares duplicados. Se rechazan arrays,
campos desconocidos y archivos extra visibles en `$_POST`/`$_FILES`, pero no se
pueden recuperar duplicados ya descartados, a diferencia de Multer. Tampoco
puede garantizarse JSON si el servidor bloquea el cuerpo antes de ejecutar PHP.
Estos casos y los límites globales/chunked deben verificarse en Neubox. No se
añade un parser multipart alternativo ni configuración de producción al repo.

## Validación local sin Airtable real

Con PHP y las extensiones anteriores disponibles:

```sh
php -l backend/submit-email.php
php -l backend/submit-con.php
php -l backend/submit-cv.php
php -l backend/utils/submitCommon.php
php -l backend/utils/airtablePost.php
python3 backend/tests/test_php_endpoints.py
```

Si PHP no está en PATH, `VITAMET_TEST_PHP` permite indicar un CLI/launcher solo para
las pruebas. La suite arranca HTTP en `127.0.0.1` y crea una copia temporal de
estos cinco archivos, con configuración ficticia fuera de su document root.
**Deshabilita `curl_exec` nativo** y usa `tests/php/mock-airtable.php` mediante
`auto_prepend_file`: las llamadas simuladas no pueden enviar solicitudes reales.
Los mocks/flags de prueba no se cargan desde los endpoints ni se despliegan.

Se cubren contratos, tipos, UTM, honeypot, mapping, MIME/contenido, límites PDF y
ZIP, tamaño máximo inclusivo, privacidad del config, TLS, errores/timeouts,
respuestas parciales, falta de caché de 10 minutos y ausencia de filtraciones.

En el workspace se preparó PHP 8.3 aislado en `/tmp` con paquetes oficiales de
Ubuntu, sin instalar paquetes en el sistema. La disponibilidad local no confirma
el perfil de Neubox. No se ha creado un archivo con secretos ni se han realizado
conexiones o POST reales a Airtable. Quedan pendientes las comprobaciones del
hosting y las pruebas conjuntas autorizadas tras integrar React.
