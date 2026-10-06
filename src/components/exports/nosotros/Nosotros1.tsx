import image from '../../../assets/images/nosotros/nosotros-section-1-fondo.png';
import styles from '../../../styles/modules/nosotros/nosotros1.module.css';
import { Link } from 'react-router-dom';

export function Nosotros1() {
  return (
    <section className={styles.hero} aria-labelledby="nosotros-title">
      <img className={styles.heroImage} src={image} alt="" />
      <div className={styles.content}>
        <p className={styles.eyebrow}>NUESTRA HISTORIA</p>
        <h1 id="nosotros-title">Liderando el Futuro del Bienestar y la Seguridad</h1>
        <p>Más de 25 años acompañando a las personas en las decisiones que protegen su bienestar y construyen su futuro.</p>
        <div className={styles.actions}>
          <Link to="/" className="boton-1">Conoce al Equipo</Link>
          <a href="#nosotros-hitos" className={styles.secondary}>Ver Logros</a>
        </div>
      </div>
    </section>
  );
}
