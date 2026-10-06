import { EmailCaptureForm } from '../../form/EmailCaptureForm';
import styles from '../../../styles/modules/blog/blog4.module.css';

export function Blog4() {
  return <section className={styles.section}><div><p className={styles.eyebrow}>NEWSLETTER</p><h2>Ideas para cuidar tu futuro</h2><p>Recibe información y consejos de bienestar directamente en tu correo.</p></div><EmailCaptureForm id="newsletter-email" label="Correo electrónico" buttonText="Suscribirme" variant="dark" /></section>;
}
