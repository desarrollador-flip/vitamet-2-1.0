import { SmartLink } from '../../../utils/SmartLink';
import { datosContacto } from '../../utils/datosContacto';
import styles from '../../../styles/modules/politicaPrivacidad/politicaPrivacidad1.module.css';

const formularios = [
  {
    title: 'Correo electrónico: newsletter y asesoría',
    description: 'Al suscribirte al newsletter del Blog o solicitar asesoría mediante el formulario de correo de Contacto, proporcionas únicamente tu correo electrónico. Estos formularios no solicitan nombre ni teléfono.',
  },
  {
    title: 'Consultas generales',
    description: 'Cuando envías una consulta general, recopilamos tu nombre, correo electrónico, asunto y mensaje para atender tu solicitud.',
  },
  {
    title: 'Postulación y envío de CV',
    description: 'Al postularte para formar parte del equipo, recopilamos tu nombre, teléfono, ubicación de interés y el archivo de tu currículum vitae (CV), que puedes adjuntar en formato PDF o DOCX.',
  },
];

const finalidades = [
  'Responder consultas y gestionar solicitudes de contacto.',
  'Proporcionar la información o asesoría solicitada y contactar a personas interesadas en los servicios de VitaMet.',
  'Gestionar postulaciones y procesos de reclutamiento, así como recibir y revisar CV.',
  'Gestionar suscripciones y comunicaciones solicitadas a través de los formularios de correo.',
  'Comprender la procedencia de los envíos y las campañas mediante información de atribución.',
];

export function PoliticaPrivacidad1() {
  return (
    <article className={styles.policy} aria-labelledby="privacy-title">
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 id="privacy-title">Política de Privacidad</h1>
          <p>
            En <SmartLink dataLink="privacidad-inicio-link" to="/">VitaMet</SmartLink> reconocemos la importancia de cuidar tu información personal.
            Esta política explica qué datos recibimos a través de los formularios del sitio, para qué los utilizamos
            y cómo puedes contactarnos en relación con su tratamiento.
          </p>
        </header>

        <section aria-labelledby="privacy-information">
          <h2 id="privacy-information">1. Información que recopilamos</h2>
          <p>La información que proporcionas depende del formulario que utilices:</p>
          {formularios.map((formulario) => (
            <div className={styles.formDescription} key={formulario.title}>
              <h3>{formulario.title}</h3>
              <p>{formulario.description}</p>
            </div>
          ))}
          <p>
            En los tres casos también se registra el origen del formulario y, cuando existen,
            los parámetros de atribución UTM asociados al envío.
          </p>
        </section>

        <section aria-labelledby="privacy-purposes">
          <h2 id="privacy-purposes">2. Cómo utilizamos la información</h2>
          <p>Según el tipo de solicitud, utilizamos la información para:</p>
          <ul>
            {finalidades.map((finalidad) => <li key={finalidad}>{finalidad}</li>)}
          </ul>
        </section>

        <section aria-labelledby="privacy-attribution">
          <h2 id="privacy-attribution">3. Información de atribución</h2>
          <p>
            Cuando llegas al sitio desde una dirección que incluye parámetros utm_*, podemos recoger esos datos
            de campaña y relacionarlos con el formulario que envíes. Esto nos ayuda a conocer la procedencia
            de las solicitudes; no necesitamos esta información para identificarte personalmente.
          </p>
          <p>
            Estos parámetros pueden conservarse temporalmente en el almacenamiento local de tu navegador
            (localStorage), con una vigencia de hasta 15 días. Si vuelves a llegar con parámetros de campaña,
            se actualizan los datos guardados y su vigencia. Puedes eliminar esta información desde las
            opciones de almacenamiento de tu navegador.
          </p>
        </section>

        <section aria-labelledby="privacy-spam">
          <h2 id="privacy-spam">4. Prevención de spam y abuso</h2>
          <p>
            Los formularios incorporan mecanismos técnicos destinados a detectar spam, abuso o envíos
            automatizados, con el fin de favorecer la recepción de solicitudes legítimas.
          </p>
        </section>

        <section aria-labelledby="privacy-protection">
          <h2 id="privacy-protection">5. Uso y protección de la información</h2>
          <p>
            Procuramos tratar la información con cuidado y adoptar medidas orientadas a protegerla frente
            al acceso no autorizado, la alteración, la divulgación y el uso indebido. Estas medidas buscan
            reducir los riesgos asociados al tratamiento de datos, sin que sea posible garantizar una
            seguridad absoluta en los servicios digitales.
          </p>
        </section>

        <section aria-labelledby="privacy-providers">
          <h2 id="privacy-providers">6. Proveedores y terceros</h2>
          <p>
            VitaMet no vende la información personal proporcionada por sus usuarios. Para operar los
            formularios y gestionar la información recibida, los datos pueden ser procesados mediante
            servicios y proveedores necesarios para esas actividades y para atender las solicitudes descritas
            en esta política.
          </p>
        </section>

        <section aria-labelledby="privacy-recruitment">
          <h2 id="privacy-recruitment">7. CV y procesos de reclutamiento</h2>
          <p>
            La información de tu postulación se utiliza para gestionar procesos de reclutamiento y revisar
            tu perfil. Además de los datos del formulario, puede incluir la información que incorpores
            voluntariamente en tu CV.
          </p>
          <p>
            Incluye únicamente la información que desees proporcionar para ese proceso. Si necesitas aclarar
            o actualizar los datos de tu postulación, puedes utilizar los medios de contacto indicados en
            esta página.
          </p>
        </section>

        <section aria-labelledby="privacy-communications">
          <h2 id="privacy-communications">8. Comunicaciones solicitadas</h2>
          <p>
            Al suscribirte al newsletter o solicitar asesoría mediante los formularios de correo,
            proporcionas voluntariamente tu dirección de email para recibir la comunicación o el contacto
            solicitado. Si deseas dejar de recibir estas comunicaciones o consultar tus preferencias,
            puedes contactarnos por los medios indicados a continuación.
          </p>
        </section>

        <section aria-labelledby="privacy-contact">
          <h2 id="privacy-contact">9. Derechos y contacto</h2>
          <p>
            Para solicitar el acceso, la rectificación, la cancelación o la oposición al tratamiento de tus
            datos personales, o para resolver dudas sobre el uso de tu información, escríbenos a{' '}
            <a data-link="privacidad-email-link" href={`mailto:${datosContacto.email.title}`}>{datosContacto.email.title}</a>.
            También puedes ponerte en contacto con nuestro equipo desde la página de{' '}
            <SmartLink dataLink="privacidad-contacto-link" to="/contacto">Contacto</SmartLink>.
          </p>
        </section>

        <section aria-labelledby="privacy-updates">
          <h2 id="privacy-updates">10. Cambios en esta política</h2>
          <p>
            VitaMet puede actualizar esta política cuando cambien sus prácticas o servicios.
            Las modificaciones se reflejarán en esta misma página, donde podrás consultar la versión vigente.
          </p>
        </section>

        <SmartLink dataLink="privacidad-inicio-btn" to="/" className={styles.backLink}>Volver al inicio</SmartLink>
      </div>
    </article>
  );
}
