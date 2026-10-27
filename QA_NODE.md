# VitaMet 2 — QA Node de desarrollo

Fecha: 27 de octubre de 2026. Referencia: `qa_node_20261027_a43071`.

**Estado: APROBADO para los cuatro flujos Node de desarrollo.** Se confirmaron
cuatro registros reales y un PDF adjunto, con exactamente **5 de 5 POST** a
Airtable y sin reintentos. No se han borrado registros ni cambiado tablas,
automatizaciones, PHP, Neubox, GET de agentes, analytics o SEO.

## Preparación

- Leídos AGENTS.md y contratos frontend/Node.
- Cambios locales previos conservados. Ningún archivo de aplicación cambió durante QA.
- Frontend: **64/64 pruebas aprobadas** mediante `npm test`.
- Backend Node: **290/290 pruebas aprobadas**, con Axios simulado.
- Lint: aprobado. Build completo TypeScript/Vite: aprobado.
- Estos resultados corresponden a la preparación ya aprobada. No se repitieron
  tests, lint ni build durante la ejecución real: no hubo cambios de aplicación.
- `backend/.env` accesible. Están presentes y no vacías `AIRTABLE_API_KEY` y los
  pares `AIRTABLE_POST_FORM_*` / `AIRTABLE_POST_TABLE_*` de MAIL, CON y CV.
  Las tres bases POST coinciden y las tablas son distintas. No se muestran valores.
- Vite en `http://127.0.0.1:5173`. Express ya no escuchaba en 5000 al comenzar
  la ejecución autorizada; se levantó nuevamente en ese puerto y se cerró al
  finalizar las comprobaciones. No se alteró su código ni el proxy.
- En la preparación, Express utilizó un preload temporal que bloqueaba tráfico
  externo. Para los envíos autorizados se usó otro control temporal fuera del
  repositorio, que permitió solo los payloads exactos y destinos de creación
  de Airtable y `uploadAttachment`, con presupuesto máximo de cinco POST y
  bloqueo de repeticiones. Al terminar se desarmó el control y se cerró ese
  proceso Express. La descarga del adjunto usó un único GET a su URL de Airtable,
  sin enviar el PAT al host de descarga.
- Chrome headless con perfil temporal, sin perfil personal, recursos externos
  bloqueados. No se cargan servicios externos de analytics durante el QA.

## Pruebas reales del frontend sin escritura

**26 comprobaciones en Chrome aprobadas.** Las respuestas de éxito/error/parcial
se simularon en la capa de red del navegador. Los honeypots sí recorrieron
React → Vite → Express con el bloqueo externo activo.

| Flujo | Validaciones y estados simulados | Honeypot real por proxy | Airtable durante esa fase |
| --- | --- | --- | --- |
| newsletter_blog | Aprobado: requerido/formato, loading/Spinner, doble envío, éxito/reset, error/datos conservados, incertidumbre/bloqueo. | HTTP 200; cero intentos externos. | Sin escritura. |
| asesoria_contacto | Aprobado: requerido/formato, loading/Spinner, doble envío, éxito/reset, error/datos conservados, incertidumbre/bloqueo. | HTTP 200; cero intentos externos. | Sin escritura. |
| consulta_contacto | Aprobado: requeridos/formato, loading/Spinner, doble envío, éxito/reset, error/datos conservados, incertidumbre/bloqueo. | HTTP 200; cero intentos externos. | Sin escritura. |
| cv_contacto | Aprobado: requeridos/formato, archivo incorrecto o >5.000.000 rechazado sin POST, PDF/DOCX, loading, doble envío, éxito/reset y errores. Parcial conserva datos/archivo y bloquea reenvío. | HTTP 200, partial:false; cero intentos externos. | Sin escritura. |

UTM: captura desde URL, futuros `utm_*`, persistencia al navegar de Blog a Contacto,
expiración a **15 días**, lectura sin renovar fecha y eliminación al expirar,
comprobados en Chrome. Los límites y storage bloqueado también quedan cubiertos
por los tests automáticos. Ancho móvil de 390 px: sin overflow horizontal.

Proxy: solo coinciden `/api/submit-email`, `/api/submit-con` y `/api/submit-cv`.
Las tres rutas respondieron 405 + `Allow: POST` a GET, desde Express instrumentado.
`/api/submit` y una ruta ajena no llegaron a Express; Vite devolvió HTML sin la
cabecera de instrumentación. No se llamó al GET de agentes.

El guard registró cuatro POST honeypot y **cero intentos de conexión externa**.
Los 502 y parciales de esta fase fueron simulados, sin fallos reales de creación.
Captura de CV parcial: `/tmp/vitamet-node-qa/cv-partial-desktop.png`.

## Lecturas previas de Airtable, sin escrituras

- Lecturas filtradas por estas campañas QA en los tres destinos configurados:
  HTTP 200, cero coincidencias previas; se solicitaron solo los campos del contrato.
- Lecturas por nombres `newsletter`, `consulta` y `Lead`: HTTP 200, cero
  coincidencias previas. Esto permitirá contrastar por nombre y por destino
  configurado los mismos registros después de un envío autorizado.
- Metadata/esquema: HTTP 403. El token no permite inspeccionar tipos/opciones
  mediante ese recurso. No se cambiaron permisos ni se repitió la petición.
- En esa fase todavía no había registros ni archivos de QA creados. La
  comprobación posterior de los envíos autorizados se detalla más abajo.

## Datos exactos autorizados y utilizados

Están autorizados **cuatro registros**: dos en newsletter, uno en consulta y uno en Lead.
Como el adjunto requiere otra llamada, el límite autorizado fue **cinco POST**:
cuatro creaciones y una subida de PDF. Sin carga, sin reintentos automáticos.

| Flujo / tabla | Identificación ficticia | source_utm |
| --- | --- | --- |
| `newsletter_blog` / newsletter | `qa_node_20261027_a43071_newsletter@example.com` | `qa_node_20261027_a43071_newsletter` |
| `asesoria_contacto` / newsletter | `qa_node_20261027_a43071_asesoria@example.com` | `qa_node_20261027_a43071_asesoria` |
| `consulta_contacto` / consulta | Nombre `QA Node Consulta 20261027_a43071`; correo `qa_node_20261027_a43071_consulta@example.com` | `qa_node_20261027_a43071_consulta` |
| `cv_contacto` / Lead | Nombre `QA Node CV 20261027_a43071`; teléfono `00000000`; ubicación `monterrey` | `qa_node_20261027_a43071_cv` |

Consulta: subject `otro`; message `Prueba controlada Node qa_node_20261027_a43071. Datos completamente ficticios.`.
CV: `qa_node_20261027_a43071_cv.pdf`, PDF válido de **621 bytes**, sin datos personales;
el backend lo guardará como `cv.pdf`. SHA-256:
`4d38ae220b67cbc5bb9ac3e3870021147709ff1233d28c25d908fe97fa4b83b0`.
Hay un DOCX ficticio adicional solo para las comprobaciones sin escritura; no se
creó un quinto registro ni una segunda postulación real.

Los correos se introdujeron con mayúsculas y los nombres/teléfono con espacios
para comprobar normalización en el recorrido completo. Los valores leídos en
Airtable coinciden con los de la tabla anterior. `website` estuvo vacío. Se utilizó
la campaña indicada en cada URL y se enviaron únicamente los campos del contrato.

Los envíos se ejecutaron individualmente desde los formularios React montados en
Chrome, por Vite y Express, sin simular las respuestas de esta fase. Después de
cada envío se leyó el destino configurado y la tabla por nombre, con filtro de
campaña y origen, para comprobar identidad, campos y normalización. El siguiente
flujo comenzó después de confirmar el anterior. Para CV se comprobaron también
los metadatos y el SHA-256 del archivo descargado.

Se mantuvo la regla de detener nuevos POST ante 502, 504, timeout, parcial o falta
de verificación, sin repetir ni borrar registros. Ningún envío real presentó esos
escenarios.

## Cambios y autorización

Único archivo creado en el repositorio durante la preparación y actualizado en
esta fase: este informe. Scripts, fixtures y perfil
de QA son temporales, fuera del código de la aplicación. No hay correcciones de
código propuestas por este QA. El 403 previo de metadata no impidió leer
registros ni tablas por nombre y no se repitió durante esta ejecución.

### Condición previa resuelta

El usuario autorizó los datos exactos anteriores, **máximo cinco POST a Airtable**,
sin reintentos, eliminaciones ni cambios de código, tablas o automatizaciones.
Exigió comprobar **antes de escribir** que no se desencadenen acciones externas
indeseadas. Si hay 502/504, timeout, parcial o incertidumbre, se detienen los POST
siguientes y se investiga sin reenviar.

El usuario confirmó personalmente que `newsletter`, `consulta` y `Lead` son
tablas nuevas **sin automatizaciones ni integraciones activas**, tanto al crear
registros como al actualizar attachments en `Lead`. Indicó expresamente que esta
confirmación satisface la condición pendiente y renovó la autorización para los
cinco POST máximos. Se aceptó esa confirmación antes de habilitar las escrituras;
no se modificaron automatizaciones ni se solicitó otra confirmación.

## Resultados reales confirmados

Ejecución del 27 de octubre de 2026, entre **23:32:26 y 23:32:59 UTC**.
Los cuatro POST del navegador recorrieron React → Vite → Express. Las respuestas
del servidor incluyeron la marca del control temporal, y el registro de transporte
confirmó exactamente **cinco solicitudes POST externas**: cuatro creaciones y una
subida de PDF. Cero intentos externos bloqueados o adicionales, cero reintentos.

| Flujo / tabla | HTTP Express / Airtable | Comprobación posterior por lectura | Estado |
| --- | --- | --- | --- |
| `newsletter_blog` / newsletter | 200 / 200 | Un registro; email normalizado, source y source_utm exactos. | **APROBADO** |
| `asesoria_contacto` / newsletter | 200 / 200 | Un registro; email normalizado, source y source_utm exactos. | **APROBADO** |
| `consulta_contacto` / consulta | 200 / 200 | Un registro; name, email, subject, text, source y source_utm exactos. | **APROBADO** |
| `cv_contacto` / Lead | 200 / 200 creación + 200 adjunto | Un registro; name, phone, state, source y source_utm exactos; PDF confirmado. | **APROBADO** |

Para cada flujo, las dos lecturas (destino configurado y nombre de tabla)
respondieron HTTP 200, devolvieron exactamente un registro y coincidieron en su
identidad y campos. No se incluyen identificadores reales en este informe.

Email y contacto respondieron exactamente:

```json
{ "success": true, "message": "Solicitud recibida correctamente." }
```

CV respondió exactamente:

```json
{ "success": true, "partial": false, "message": "Solicitud recibida correctamente." }
```

Las cuatro interfaces mostraron el mensaje de éxito, terminaron loading,
rehabilitaron el botón y limpiaron sus campos; CV también limpió el archivo.
Las respuestas públicas no incluyeron credenciales, identificadores ni errores
internos. Cada payload incluyó el formSource previsto y únicamente su campaña
documentada, sin UTM residuales de las pruebas previas.

### PDF confirmado

El campo `attachment` de `Lead` contiene exactamente un adjunto con nombre
`cv.pdf`, MIME `application/pdf` y **621 bytes**, con identidad coincidente en las
dos lecturas. La descarga única respondió HTTP 200, devolvió 621 bytes y su SHA-256
coincidió con el original documentado:
`4d38ae220b67cbc5bb9ac3e3870021147709ff1233d28c25d908fe97fa4b83b0`.

### Incidencias y alcance final

No hubo 502/504, timeout, éxito parcial ni resultados inciertos en los envíos
reales. No se requirieron correcciones de código. El límite previo de acceso a
metadata sigue existiendo, pero el mapping de los cuatro registros y el PDF se
verificaron directamente mediante lecturas.

Se conservaron los cuatro registros y el adjunto. Las huellas de los archivos
confirmaron que no se modificó código de aplicación, `.env`, PHP ni otros archivos
existentes durante la ejecución; únicamente se actualizó este informe. Evidencia
temporal sin secretos ni identificadores de Airtable:
`/tmp/vitamet-node-qa/real-results.json` y
`/tmp/vitamet-node-qa/real-post-ledger.json`.

**Estado final de Node local: APROBADO en los cuatro flujos.** El presupuesto de
cinco POST quedó consumido y cerrado. PHP y Neubox no se probaron ni modificaron;
su validación de producción corresponde a una etapa posterior.
