# Instrumentación Google Tracking v1.0

Implementación para React 18 + TypeScript + Vite 5 y React Router 7. Puntos de entrada: `index.html`, `src/main.tsx` y `src/App.tsx`.

## GTM

Se conserva íntegramente la instalación existente de `GTM-WD5NRH4X` en `index.html`, tanto el script como el fallback noscript. No se instalaron dependencias, otras etiquetas ni contenedores; no se hicieron cambios en GTM/GA4/Ads, commits ni despliegues.

La configuración remota y las conversiones activas no se pueden deducir del repositorio. No se encontraron emisores propios equivalentes antes de esta tarea. Preview, DebugView y validación de producción quedan pendientes.

## Eventos y privacidad

| Evento | Parámetros |
| --- | --- |
| `click_link` | `click_id`, `page_path`, `link_url` cuando existe un destino público permitido |
| `click_cta` | `click_id`, `page_path`, `link_url` cuando existe un destino público permitido |
| `formulario_enviado` | `form_id`, `page_path` |

`useClickTracking`, montado en App, instala un listener delegado en captura y lo elimina al desmontarse. Esto registra la ruta de origen antes de que los handlers de React naveguen o cierren el menú. Se usa el elemento etiquetado más cercano; CTA tiene prioridad. No se interfiere con `preventDefault`, propagación ni handlers. StrictMode y re-render no añaden vías de emisión adicionales. La capa existente se conserva mediante `window.dataLayer = window.dataLayer || []`.

Los botones de navegación exponen su destino mediante `data-tracking-url`; los anchors de NavItems también lo exponen cuando su handler navega a Home desde otra página. Estos atributos no cambian los destinos reales.

Solo entran en `link_url` rutas internas públicas incluidas en la lista explícita de `src/utils/tracking.ts`. Se eliminan todos los queries y los fragmentos no permitidos. Los anchors permitidos son `#portafolio`, `#nosotros-hitos` y `#recluta4`. Se omiten tel, mailto, WhatsApp, blob, credenciales en URLs y destinos externos o desconocidos. Los clics correspondientes sí se cuentan por su ID. Cuando no hay destino seguro, `link_url` se establece a `undefined` para limpiar el valor anterior en el modelo de datos de GTM; no se envía una URL ficticia.

`page_path` se toma al hacer clic o al confirmar el envío. Las páginas estáticas conservan su pathname. Para evitar transmitir nombres de agentes, `/agentes/<slug>` se registra como `/agentes/:slug`; los paths desconocidos como `/:path`. Esto solo afecta al payload de analytics. La lista de rutas y anchors seguros debe revisarse cuando se añadan páginas.

No se copian texto visible, campos, emails, teléfonos, nombres, CV, mensajes, UTM, tokens, queries ni hashes libres a dataLayer. Esta garantía se refiere a los tres eventos propios; debe revisarse por separado qué recopilan las etiquetas remotas y los parámetros automáticos de GA4.

## Formularios

| `form_id` / `data-form-id` | Componente | Ubicación | Integración conservada |
| --- | --- | --- | --- |
| `consulta_contacto` | GeneralInquiryForm | `/contacto` | submit-con |
| `cv_contacto` | JoinTeamForm | `/contacto` | submit-cv |
| `newsletter_blog` | EmailCaptureForm | `/blog` | submit-email |
| `asesoria_contacto` | EmailCaptureForm | `/contacto` | submit-email |

Se distinguen las dos acciones de captura de email por instrucción explícita del proyecto. Los IDs coinciden con los formSource existentes, sin modificar lo enviado al backend.

La emisión está en la rama `result.status === 'success'` de cada hook, después del helper que verifica HTTP y cuerpo JSON, y antes del reset. Se excluye el honeypot con el valor capturado en ese envío (`website.trim()`). El backend mantiene su respuesta de éxito aparente para bots. No emiten validación local, click en submit, loading, errores, timeouts, red fallida, resultados inciertos ni CV parcial. CV sigue exigiendo `partial: false` para éxito completo. Se preservan locks, validación, loading, reset, payloads, endpoints, UTM y backend. Una nueva solicitud válida y confirmada es una interacción distinta.

## Inventario de clics

44 identificadores `data-link` y 19 identificadores `data-cta`, contando una vez los IDs compartidos y las copias de carrusel. Los IDs del burger se derivan de los datos del menú con ubicación `burger`.

Se conservan todos los valores de ID preexistentes, incluidas las excepciones de nomenclatura `home-btn-2` y `home-unete-btn-1`. `navbar-contacto-link` y `footer-contacto-link` pasan de CTA a enlace ordinario porque representan navegación de menú. El menú móvil deja de usar los IDs de escritorio y deriva cinco `burger-*`. Los botones Únete y las acciones existentes de agente mantienen sus CTA, incluida la acción compartir/copiar tarjeta.

Las tarjetas de Home conservan `home-nosotros-link`; se etiqueta también su enlace exterior. El ID sigue siendo agregado y no distingue productos ni sección. Se conservan los enlaces anidados preexistentes; el listener elige solo el más cercano. Las listas de servicios, artículos y vacantes guardan IDs estáticos en sus datos originales; los clones no generan IDs aleatorios.

| Ubicación | `data-link` | `data-cta` |
| --- | --- | --- |
| Navbar | `navbar-blog-link`, `navbar-contacto-link`, `navbar-inicio-link`, `navbar-logo-btn`, `navbar-nosotros-link`, `navbar-servicios-link` | `navbar-unete-btn` |
| Burger | `burger-blog-link`, `burger-contacto-link`, `burger-inicio-link`, `burger-nosotros-link`, `burger-servicios-link` | `burger-unete-btn` |
| Footer | `footer-blog-link`, `footer-bolsa-link`, `footer-carrera-link`, `footer-contacto-link`, `footer-logo-btn`, `footer-nosotros-link`, `footer-politica-link`, `footer-privacidad-link`, `footer-servicios-link`, `footer-sostenibilidad-link`, `footer-terminos-link` | — |
| Home | `home-nosotros-link` | `home-btn-2`, `home-unete-btn-1` |
| Nosotros | `nosotros-contacto-link`, `nosotros-hitos-btn`, `nosotros-inicio-btn` | `nosotros-contacto-agente-btn`, `nosotros-contacto-asesoria-btn` |
| Servicios | `servicios-inicio-ahorro-link`, `servicios-inicio-casos-btn`, `servicios-inicio-educacion-link`, `servicios-inicio-empresas-link`, `servicios-inicio-gastos-medicos-link`, `servicios-inicio-metodologia-btn`, `servicios-inicio-retiro-link`, `servicios-portafolio-btn` | `servicios-contacto-asesor-btn`, `servicios-contacto-consultoria-btn` |
| Blog | `blog-inicio-destacado-link`, `blog-inicio-educacion-link`, `blog-inicio-presupuesto-link`, `blog-inicio-viajes-link`, `blog-privacidad-link` | — |
| Recluta | `recluta-nosotros-btn` | `recluta-contacto-analista-link`, `recluta-contacto-asesor-link`, `recluta-contacto-cv-link`, `recluta-contacto-gerente-link`, `recluta-recluta4-btn` |
| Contacto | — | `contacto-telefono-link` |
| Privacidad | `privacidad-contacto-link`, `privacidad-email-link`, `privacidad-inicio-btn`, `privacidad-inicio-link` | — |
| Agentes | — | `agente-correo-btn`, `agente-guardar-btn`, `agente-llamar-btn`, `agente-shared-btn`, `agente-whatsapp-btn` |

Se excluyen controles de formularios y envío, burger toggle, paginación, carruseles, elementos sin identificación y controles deshabilitados. Teléfono/correo del footer son texto; no se convierten en enlaces. Los controles del iframe de Maps son externos y no se instrumentan desde este documento.

## Archivos

Creados:

- `src/utils/tracking.ts`: payloads tipados, filtrado de URLs y emisión.
- `src/hooks/useClickTracking.ts`: ciclo de vida del listener global.
- `tests/tracking.test.mjs`: clics, DOM, navegación, ciclo de vida y privacidad.
- `TRACKING.md`: inventario e instrucciones.

Modificados:

- `src/App.tsx`
- `src/hooks/useEmailCaptureForm.ts`
- `src/hooks/useGeneralInquiryForm.ts`
- `src/hooks/useJoinTeamForm.ts`
- `src/utils/SmartLink.tsx`
- `src/components/common/BurgerMenu.tsx`
- `src/components/common/Footer.tsx`
- `src/components/form/EmailCaptureForm.tsx`
- `src/components/form/GeneralInquiryForm.tsx`
- `src/components/form/JoinTeamForm.tsx`
- `src/components/utils/BotonNav.tsx`
- `src/components/utils/footerContenido.ts`
- `src/components/utils/navbarMenu.ts`
- `src/components/utils/NavItems.tsx`
- `src/components/exports/blog/Blog2.tsx`
- `src/components/exports/blog/Blog3.tsx`
- `src/components/exports/blog/Blog4.tsx`
- `src/components/exports/contacto/Contacto3.tsx`
- `src/components/exports/home/SectionHp5.tsx`
- `src/components/exports/nosotros/Nosotros1.tsx`
- `src/components/exports/nosotros/Nosotros2.tsx`
- `src/components/exports/nosotros/Nosotros5.tsx`
- `src/components/exports/politicaPrivacidad/PoliticaPrivacidad1.tsx`
- `src/components/exports/recluta/Recluta1.tsx`
- `src/components/exports/recluta/Recluta4.tsx`
- `src/components/exports/servicios/Servicios1.tsx`
- `src/components/exports/servicios/Servicios2.tsx`
- `src/components/exports/servicios/Servicios4.tsx`
- `tests/forms.test.mjs`
- `package.json`

No se eliminaron archivos. No se modificaron index.html, main.tsx, estilos, backend, validadores, formSubmission ni formUtm. Los cambios locales que ya existían se conservaron.

## Verificación

Pruebas añadidas e integradas en `npm test` usando node:test, React DOM y jsdom ya existentes, con fetch simulado:

- Un evento por clic en hijos/SVG, CTA prioritario y elementos etiquetados anidados.
- StrictMode, re-render, desmontaje, remontaje y conservación/inicialización de dataLayer.
- Navegación real, preventDefault, anchors, origen antes de navegar, botones con destino explícito y cierre del burger.
- Atributos reales y cobertura de enlaces en las siete páginas estáticas, navbar, burger, footer y perfil de agente.
- Datos generados por map y clones con identificadores estables.
- Exclusión de controles internos, submit y elementos deshabilitados.
- Exclusión de PII, query/hash libre y destinos sensibles; rutas de agentes anonimizadas.
- Cuatro form_id distintos: éxito, doble submit, errores, validación, red fallida, parcial y honeypot. Las pruebas existentes también comprueban timeout, HTTP 200 con error y resultados inciertos.
- Ruta actual al confirmar y conservación de reset/navegación si analytics lanza un error.

Resultados en este entorno:

| Comprobación | Resultado |
| --- | --- |
| `npm run lint` | Bloqueado antes de iniciar: WSL 1 is not supported / Could not determine Node.js install directory |
| `npm run build` | Mismo bloqueo de Node/WSL |
| `npm test` | Mismo bloqueo de Node/WSL; suites no ejecutadas |
| Sintaxis de los dos archivos de tests | Compilación sintáctica JavaScript sin ejecutar, excluyendo imports estáticos; correcta |
| Revisión estática de enlaces y diferencias | Completada; no se encontraron enlaces sin atributos en las definiciones revisadas |
| GTM, backend y estilos frente a captura inicial | Contenido idéntico |
| `git -c core.whitespace=cr-at-eol diff --check` | Sin errores; se respetaron los finales CRLF preexistentes |
| GTM Preview / GA4 DebugView | Pendientes; no se verificó producción |

No se afirma que lint, TypeScript, build o suites de pruebas hayan pasado. Ejecutar los tres comandos en un entorno Node compatible antes de integrar los cambios.

## Configuración manual en GTM/GA4

1. Abrir el contenedor existente `GTM-WD5NRH4X`. Inventariar primero etiquetas, activadores, conversiones y Enhanced Measurement. No migrar eventos previos ni duplicar un hecho mediante activadores automáticos equivalentes.
2. Reutilizar la Google tag de GA4 si ya existe. Si falta, crearla con el Measurement ID real `G-...` y el activador apropiado al consentimiento del sitio. No añadir gtag ni otra instalación en el frontend.
3. Crear variables de capa de datos para `click_id`, `page_path`, `link_url` y `form_id`, con esos nombres de clave exactos.
4. Crear tres activadores de tipo Evento personalizado con coincidencia exacta: `click_link`, `click_cta` y `formulario_enviado`.
5. Crear una etiqueta Google Analytics: GA4 Event por evento, asociada a la Google tag y con el mismo nombre. En las dos de clic, mapear `click_id`, `page_path` y `link_url` a sus variables. En formulario, mapear solo `form_id` y `page_path`.
6. En GA4, registrar las dimensiones personalizadas de alcance Evento necesarias para los informes, especialmente `click_id` y `form_id`; añadir `page_path` si se necesita como parámetro personalizado y evitar duplicar dimensiones nativas.
7. En Preview/Tag Assistant comprobar un evento y una etiqueta por clic, ruta de origen y ausencia de PII. Confirmar que un clic sensible posterior no hereda link_url del clic anterior. Verificar los cuatro formularios y que ningún fallo, parcial o honeypot active conversión.
8. En DebugView comprobar los tres nombres y sus parámetros antes de publicar cualquier configuración. Revisar por separado páginas vistas SPA y posibles parámetros automáticos con datos personales; no se añadieron eventos page_view ni se modificó su configuración.

Referencias: [eventos GA4 con GTM](https://support.google.com/tagmanager/answer/13034206), [activadores personalizados](https://support.google.com/tagmanager/answer/7679219), [dimensiones personalizadas](https://support.google.com/analytics/answer/14240153).

No se añadió consentimiento, cookies ni banner ficticio. Si corresponde gestionar consentimiento, resolverlo aparte antes de activar etiquetas en producción. No se establecen conversiones en Ads ni se cambia la definición de conversiones existente.

## Problemas pendientes fuera del tracking

- Footer enlaza a `/terminos-condiciones`, `/sostenibilidad` y `/carrera` sin rutas registradas.
- Varios Leer más, Conoce al Equipo, Nuestra Metodología y Ver Casos de Éxito apuntan a `/`; las soluciones de Home apuntan a `/nosotros`. Se conservan los destinos provisionales y los IDs nuevos describen el destino real.
- Home mantiene enlaces anidados y un ID compartido que impide distinguir cada tarjeta; corregir estructura o granularidad requiere una tarea aparte.
- No se comprobó la disponibilidad real de endpoints/Airtable ni se hicieron envíos reales. La cobertura de tests usa respuestas simuladas.
- Configuración remota, duplicados, conversiones, consentimiento y recepción real en GA4 pendientes de revisión externa.
