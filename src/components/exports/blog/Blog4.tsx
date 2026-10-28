import { EmailCaptureForm } from '../../form/EmailCaptureForm';
import { SmartLink } from '../../../utils/SmartLink';
import styles from '../../../styles/modules/blog/blog4.module.css';

export function Blog4() {
  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <div>
          <p className={styles.eyebrow}>NEWSLETTER</p>
          <h2>Suscríbete a nuestra Newsletter</h2>
          <p>Recibe semanalmente los mejores insights sobre finanzas personales, bienestar corporativo y protección familiar directo en tu bandeja de entrada.</p>
        </div>
        <EmailCaptureForm id="newsletter-email" label="Tu correo electrónico" buttonText="Suscribirse ahora" variant="dark" formSource="newsletter_blog" />
        <p className={styles.legal}>Al suscribirte, aceptas nuestra <SmartLink to="/politica-privacidad">Política de Privacidad</SmartLink> y el uso de tus datos para fines informativos.</p>
      </div>
    </section>
  );
}
