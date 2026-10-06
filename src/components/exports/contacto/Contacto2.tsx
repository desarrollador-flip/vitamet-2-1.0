import { GeneralInquiryForm } from '../../form/GeneralInquiryForm';
import { JoinTeamForm } from '../../form/JoinTeamForm';
import styles from '../../../styles/modules/contacto/contacto2.module.css';
import chatIcon from '../../../assets/images/contacto/cuadro-dialogo.svg';
import portfolioIcon from '../../../assets/images/contacto/maletin.svg';

export function Contacto2() {
  return <section className={styles.section} aria-label="Formularios de contacto"><div className={styles.cards}><article className={styles.card}><div className={styles.cardHeading}><img src={chatIcon} alt="" /><div><h3>Consultas Generales</h3></div></div><GeneralInquiryForm /></article><article className={styles.card}><div className={styles.cardHeading}><img src={portfolioIcon} alt="" /><div><h3>Únete a nuestro Equipo</h3><p>Buscamos talento para la mejor carrera del mundo. Sube tu CV y comienza tu futuro hoy.</p></div></div><JoinTeamForm /></article></div></section>;
}
