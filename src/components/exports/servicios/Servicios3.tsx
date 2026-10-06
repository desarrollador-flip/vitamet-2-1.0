import image from '../../../assets/images/servicios/servicios-section-3-1.png';
import asesoria from '../../../assets/images/servicios/servicio-cliente.svg';
import digital from '../../../assets/images/servicios/dispositivos.svg';
import claims from '../../../assets/images/servicios/escudo-check.svg';
import styles from '../../../styles/modules/servicios/servicios3.module.css';

const benefits = [
  { title: 'Asesoría Personalizada', text: 'Un experto te ayuda a encontrar una solución acorde a tus objetivos.', image: asesoria },
  { title: 'Herramientas Digitales', text: 'Consulta y gestiona tu protección con herramientas prácticas.', image: digital },
  { title: 'Acompañamiento en Reclamaciones', text: 'Te orientamos durante los procesos en los que necesitas apoyo.', image: claims },
];

export function Servicios3() {
  return <section className={styles.section}><div className={styles.copy}><p className={styles.eyebrow}>EL RESPALDO QUE MERECES</p><h2>¿Por qué elegir a VitaMet?</h2><p>Creemos que protegerte es un trabajo compartido. Estamos contigo para explicarte tus opciones y acompañarte cuando lo necesitas.</p><div className={styles.benefits}>{benefits.map((benefit) => <article key={benefit.title}><img src={benefit.image} alt="" /><div><h3>{benefit.title}</h3><p>{benefit.text}</p></div></article>)}</div></div><img className={styles.photo} src={image} alt="Equipo de VitaMet celebra un logro en conjunto" /></section>;
}
