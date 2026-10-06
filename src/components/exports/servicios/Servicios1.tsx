import { Link } from 'react-router-dom';
import image from '../../../assets/images/servicios/servicios-section-1-fondo.png';
import styles from '../../../styles/modules/servicios/servicios1.module.css';

export function Servicios1() {
  return <section className={styles.hero} aria-labelledby="servicios-title">
    <img className={styles.image} src={image} alt="" />
    <div className={styles.content}><p className={styles.eyebrow}>BIENESTAR INTEGRAL</p><h1 id="servicios-title">Soluciones de Protección y Bienestar</h1><p>Opciones para cuidar tu salud, proteger a tu familia y planear cada etapa de tu futuro.</p><div className={styles.actions}><a className="boton-1" href="#portafolio">Explorar Servicios</a><Link className={styles.secondary} to="/">Nuestra Metodología</Link></div></div>
  </section>;
}
