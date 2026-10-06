import image from '../../../assets/images/contacto/contacto-section-1-fondo.png';
import styles from '../../../styles/modules/contacto/contacto1.module.css';

export function Contacto1() {
  return <section className={styles.hero} aria-labelledby="contact-title"><img src={image} alt="" className={styles.image} /><div className={styles.content}><h1 id="contact-title">Estamos aquí para escucharte</h1><p>Contáctanos para servicios de consultoría o para formar parte de la promotora más ganadora de México.</p></div></section>;
}
