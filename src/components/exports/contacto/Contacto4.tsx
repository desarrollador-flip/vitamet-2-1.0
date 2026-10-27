import { EmailCaptureForm } from '../../form/EmailCaptureForm';
import styles from '../../../styles/modules/contacto/contacto4.module.css';

export function Contacto4() {
  return (
    <section className={styles.section} aria-labelledby="advisor-title">
      <div className={styles.panel}>
        <h2 id="advisor-title">Recibe asesoría personalizada</h2>
        <p>Déjanos tu correo y un agente experto te contactará en menos de 24 horas.</p>
        <div className={styles.formArea}>
          <EmailCaptureForm id="advisor-email" label="Correo electrónico" buttonText="Suscribirse" variant="light" formSource="asesoria_contacto" />
        </div>
      </div>
    </section>
  );
}
