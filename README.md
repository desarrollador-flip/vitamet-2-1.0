# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json', './tsconfig.app.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list


## Formularios React

Los tres formularios conservan hooks específicos: `useEmailCaptureForm`,
`useGeneralInquiryForm` y `useJoinTeamForm`. El selector de
`src/utils/formSubmission.ts` usa `import.meta.env.DEV`:

| Formulario | Desarrollo | Producción |
| --- | --- | --- |
| Email | `/api/submit-email` | `/backend/submit-email.php` |
| Contacto | `/api/submit-con` | `/backend/submit-con.php` |
| CV | `/api/submit-cv` | `/backend/submit-cv.php` |

Vite envía únicamente esas tres rutas a Express en el puerto 5000. No se
configura un proxy general `/api` ni se cambia el GET de agentes. Express debe
iniciarse por separado con `node backend/index.js`; no realizar envíos reales
hasta la etapa de pruebas conjuntas autorizadas.

`EmailCaptureForm` requiere un `formSource` explícito: `newsletter_blog` en Blog
y `asesoria_contacto` en Contacto. Consulta usa `consulta_contacto` y CV usa
`cv_contacto`. CV envía el archivo real en `FormData`, sin fijar Content-Type
manualmente, y serializa el campo `utm` como JSON. El límite frontend del archivo
es exactamente 5.000.000 bytes; el backend valida su contenido.

### Atribución y estados

`src/utils/formUtm.ts` captura los UTM al cambiar el query de la navegación y al
enviar los formularios. Esto conserva campañas de entrada incluso si la página
no contiene un formulario. Guarda en `localStorage`, bajo `vitamet:utm`, solo los
parámetros válidos y una fecha de expiración a 15 días. La última atribución con
valores válidos reemplaza completamente a la anterior; visitas sin UTM recuperan
lo guardado y no renuevan su expiración. Si no existe una atribución vigente,
se envía `{}` y el backend aplica `organico`.

Se admiten los habituales y futuros `utm_*`, en minúsculas: máximo 20 claves,
64 caracteres por clave y 256 por valor, sin controles. Se recortan espacios,
se omiten valores vacíos/inválidos y se prioriza `utm_campaign` si hay más de
20 parámetros. No se guardan correos ni el resto del query. Si el navegador
bloquea localStorage, siguen funcionando los UTM de la URL actual; no se puede
persistir la atribución al abandonar esa URL. No se toca Analytics ni GTM.

Los hooks manejan validación por campo, loading con el Spinner existente,
éxito, rechazo corregible, parcial e incertidumbre. El JSON completo se limita
a 16 KiB antes del POST, también cuando cada campo individual es válido. Un bloqueo por referencia
impide dos POST en el mismo ciclo, antes de que React actualice el botón.
Los campos se deshabilitan durante la solicitud. Solo un éxito JSON confirmado
reinicia campos, honeypot y archivo nativo; HTTP 200 por sí solo no basta.

Un rechazo HTTP 4xx conocido permite corregir y reenviar manualmente. Los fallos
de red, timeout de cliente (35 s), 5xx o JSON inesperado conservan los datos y
bloquean nuevos envíos de esa instancia. CV requiere `partial: false` para un
éxito completo; `partial: true` con `CV_ATTACHMENT_FAILED` muestra que se
recibieron los datos pero no se confirmó el archivo, sin borrar lo introducido
ni permitir repetir la postulación. No hay reintentos automáticos. El bloqueo
es de esa instancia montada, no una garantía de idempotencia tras recargar o
navegar fuera. Ante incertidumbre o parcial se indica contactar para verificar.

El honeypot compartido sigue el patrón de `mircomania-1-1.0`: contenedor fuera
de pantalla, `aria-hidden`, `tabIndex={-1}` y `autoComplete="off"`; no es requerido
y su valor se envía al backend.

### Pruebas locales sin Airtable

```sh
npm test
npm run lint
npm run build
npm --prefix backend test
```

La única dependencia nueva, autorizada, es `jsdom` 29 como devDependency,
compatible con Node 20.19+ o Node 22.13+. Se usa React DOM con `node:test`.
`tests/register.mjs` y su loader emplean el TypeScript ya existente para cargar
TS/TSX y sustituir assets/CSS solo en tests. Los tests verifican ambos modos
del selector de endpoints, UTM/TTL/storage, payloads, honeypot, validación,
loading, doble envío, resets y bloqueo tras parcial o incertidumbre. Fetch está
simulado por defecto; no se inicia el backend ni se hacen pruebas de producción.
