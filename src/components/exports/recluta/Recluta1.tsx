import { Link } from 'react-router-dom';
import image from '../../../assets/images/recluta/recluta-section-1-1.png';
import styles from '../../../styles/modules/recluta/recluta1.module.css';

export function Recluta1() {
  return <section className={styles.hero} aria-labelledby="recluta-title"><div className={styles.content}><p className={styles.eyebrow}>ÚNETE AL EQUIPO</p><h1 id="recluta-title">Tu mejor carrera profesional comienza hoy.</h1><p>Forma parte de la promotora más ganadora en la historia de MetLife México. En VitaMet, no solo buscamos talento, buscamos socios para construir un futuro de libertad.</p><div className={styles.actions}><a className={styles.primary} href="#recluta4">Ver Posiciones Abiertas</a><Link className={styles.secondary} to="/nosotros">Saber más sobre nosotros</Link></div></div><div className={styles.photo}><img src={image} alt="Equipo de asesores VitaMet durante una celebración" /><span><strong>Líder en MetLife</strong><small>9 Años Consecutivos de Éxito</small></span></div></section>;
}
