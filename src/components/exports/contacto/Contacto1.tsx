import image from '../../../assets/images/contacto/contacto-section-1-fondo.png';
import styles from '../../../styles/modules/contacto/contacto1.module.css';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

export function Contacto1() {
  const isMobile = useMediaQuery('(max-width: 575px)');

  return (
    <section className={styles.hero} aria-labelledby="contact-title">
      {!isMobile && <img src={image} alt="" className={styles.image} />}
      <div className={styles.content}>
        <h1 id="contact-title">Estamos aquí para escucharte</h1>
        <p>Contáctanos para servicios de consultoría o para formar parte de la promotoría más ganadora de México.</p>
      </div>
    </section>
  );
}
