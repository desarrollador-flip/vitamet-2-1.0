import { Link } from 'react-router-dom';
import image from '../../../assets/images/servicios/servicios-section-1-fondo.png';
import styles from '../../../styles/modules/servicios/servicios1.module.css';
import arrow from '../../../assets/images/home/flecha-derecha.svg';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

export function Servicios1() {
  const isMobile = useMediaQuery('(max-width: 575px)');

  return (
    <section className={styles.hero} aria-labelledby="servicios-title">
      <div className={styles.heroInner}>
        {!isMobile && <img className={styles.image} src={image} alt="" width={1268} height={634} />}
        <div className={styles.content}>
          <p className={styles.eyebrow}>BIENESTAR INTEGRAL</p>
          <h1 id="servicios-title">Soluciones de Protección y Bienestar</h1>
          <p>
            En VitaMet, transformamos la incertidumbre en seguridad. Nuestro equipo de expertos brinda asesoría personalizada para proteger lo que más
            valoras en cada etapa de tu vida.
          </p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#portafolio">
              Explorar Servicios <img src={arrow} alt="" width={16} height={16} />
            </a>
            <Link className={styles.secondary} to="/">
              Nuestra Metodología
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
