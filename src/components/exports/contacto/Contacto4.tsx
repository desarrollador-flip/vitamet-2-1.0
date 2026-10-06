import { Link } from 'react-router-dom';
import { EmailCaptureForm } from '../../form/EmailCaptureForm';
import styles from '../../../styles/modules/contacto/contacto4.module.css';

export function Contacto4() {
  return <section className={styles.section}><div className={styles.panel}><div><h2>Recibe asesoría personalizada</h2><p>Déjanos tu correo y un agente experto te contactará en menos de 24 horas.</p></div><div className={styles.formArea}><EmailCaptureForm id="advisor-email" label="Correo electrónico" buttonText="Suscribirse" variant="light" /><Link to="/contacto">También puedes escribirnos en el formulario</Link></div></div></section>;
}
