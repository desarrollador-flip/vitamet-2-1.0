import image from '../../../assets/images/nosotros/nosotros-section-1-fondo.png';
import styles from '../../../styles/modules/nosotros/nosotros1.module.css';
import { Link } from 'react-router-dom';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

export function Nosotros1() {
  const isMobile = useMediaQuery('(max-width: 575px)');

  return (
    <section className={styles.hero} aria-labelledby="nosotros-title">
      <div className={styles.heroInner}>
        {!isMobile && <img className={styles.heroImage} src={image} alt="" width={1280} height={600} />}
        <div className={styles.content}>
          <p className={styles.eyebrow}>NUESTRA HISTORIA</p>
          <h1 id="nosotros-title">Liderando el Futuro del Bienestar y la Seguridad</h1>
          <p>Más de 25 años transformando la industria aseguradora a través de la innovación, el compromiso humano y una visión inquebrantable de excelencia corporativa.</p>
          <div className={styles.actions}>
            <Link to="/" className={styles.primary}>Conoce al Equipo</Link>
            <a href="#nosotros-hitos" className={styles.secondary}>Ver Logros</a>
          </div>
        </div>
      </div>
    </section>
  );
}
