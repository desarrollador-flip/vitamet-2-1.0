# VitaMet 2 — QA Node de desarrollo

Fecha: 27 de octubre de 2026. Referencia: `qa_node_20261027_a43071`.

**Estado: PENDIENTE de autorización para escrituras reales.** No se han creado
registros ni adjuntos reales. No se han borrado registros ni cambiado tablas,
automatizaciones, PHP, Neubox, GET de agentes, analytics o SEO.

## Preparación

- Leídos AGENTS.md y contratos frontend/Node.
- Cambios locales previos conservados. Ningún archivo existente cambió durante QA.
- Frontend: **64/64 pruebas aprobadas** mediante `npm test`.
- Backend Node: **290/290 pruebas aprobadas**, con Axios simulado.
- Lint: aprobado. Build completo TypeScript/Vite: aprobado.
- `backend/.env` accesible. Están presentes y no vacías `AIRTABLE_API_KEY` y los
  pares `AIRTABLE_POST_FORM_*` / `AIRTABLE_POST_TABLE_*` de MAIL, CON y CV.
  Las tres bases POST coinciden y las tablas son distintas. No se muestran valores.
- Express activo en puerto 5000; Vite en `http://127.0.0.1:5173`.
- Express lleva un preload temporal fuera del repositorio que bloquea tráfico
  externo. Sigue activo hasta que se autoricen y preparen las pruebas reales.
- Chrome headless con perfil temporal, sin perfil personal, recursos externos
  bloqueados. No se cargan servicios externos de analytics durante el QA.

## Pruebas reales del frontend sin escritura

**26 comprobaciones en Chrome aprobadas.** Las respuestas de éxito/error/parcial
se simularon en la capa de red del navegador. Los honeypots sí recorrieron
React → Vite → Express con el bloqueo externo activo.

| Flujo | Validaciones y estados simulados | Honeypot real por proxy | Registro en Airtable |
| --- | --- | --- | --- |
| newsletter_blog | Aprobado: requerido/formato, loading/Spinner, doble envío, éxito/reset, error/datos conservados, incertidumbre/bloqueo. | HTTP 200; cero intentos externos. | No creado; pendiente. |
| asesoria_contacto | Aprobado: requerido/formato, loading/Spinner, doble envío, éxito/reset, error/datos conservados, incertidumbre/bloqueo. | HTTP 200; cero intentos externos. | No creado; pendiente. |
| consulta_contacto | Aprobado: requeridos/formato, loading/Spinner, doble envío, éxito/reset, error/datos conservados, incertidumbre/bloqueo. | HTTP 200; cero intentos externos. | No creado; pendiente. |
| cv_contacto | Aprobado: requeridos/formato, archivo incorrecto o >5.000.000 rechazado sin POST, PDF/DOCX, loading, doble envío, éxito/reset y errores. Parcial conserva datos/archivo y bloquea reenvío. | HTTP 200, partial:false; cero intentos externos. | No creado; adjunto pendiente. |

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

## Lecturas reales de Airtable, sin escrituras

- Lecturas filtradas por estas campañas QA en los tres destinos configurados:
  HTTP 200, cero coincidencias previas; se solicitaron solo los campos del contrato.
- Lecturas por nombres `newsletter`, `consulta` y `Lead`: HTTP 200, cero
  coincidencias previas. Esto permitirá contrastar por nombre y por destino
  configurado los mismos registros después de un envío autorizado.
- Metadata/esquema: HTTP 403. El token no permite inspeccionar tipos/opciones
  mediante ese recurso. No se cambiaron permisos ni se repitió la petición.
- Ningún registro ni archivo ha sido confirmado como creado. No se declara
  aprobado el recorrido completo hasta verificar los cuatro envíos y el adjunto.

## Envíos preparados para autorización

Se proponen **cuatro registros**: dos en newsletter, uno en consulta y uno en Lead.
Como el adjunto requiere otra llamada, serán **cinco POST como máximo**:
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
propone un quinto registro ni una segunda postulación real.

Los correos se introducirán con mayúsculas y los nombres/teléfono con espacios
para comprobar normalización. Los valores esperados en Airtable son los de la
tabla anterior. `website` estará vacío. Se utilizará la campaña indicada en cada
URL y se enviarán únicamente los campos del contrato.

Después de autorizar: envíos individuales desde React por Vite/Express; lectura
filtrada del destino configurado y de la tabla por nombre para comprobar identidad,
campos, source, campaña y normalización. Para CV, comprobar metadatos del adjunto
y, si la descarga está disponible, tamaño y SHA-256 del PDF original.

Si aparece un 502, 504, timeout, parcial o falta de verificación, detener nuevos
POST, conservar registros y diagnosticar mediante lecturas. No repetir ni borrar.
Si una comprobación no puede realizarse directamente, documentar qué debe
revisarse manualmente y mantener el estado pendiente.

## Cambios y pendientes

Único archivo creado en el repositorio: este informe. Scripts, fixtures y perfil
de QA son temporales, fuera del código de la aplicación. No hay correcciones de
código propuestas por la fase sin escritura; el único límite detectado es el
403 de metadata, que no impidió leer registros ni tablas por nombre.

Pendiente: autorización de los cuatro registros/cinco POST, ejecución y comprobación
real de datos y adjunto. PHP y Neubox quedan fuera de esta etapa.
