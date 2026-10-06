import { Link } from 'react-router-dom';
import image from '../../../assets/images/blog/blog-section-2-1.png';
import styles from '../../../styles/modules/blog/blog2.module.css';

export function Blog2() {
  return <section className={styles.section} aria-labelledby="featured-title"><img className={styles.image} src={image} alt="Espacio de trabajo preparado para planear y analizar" /><div className={styles.content}><span className={styles.badge}>Artículo Reciente</span><h2 id="featured-title">Decisiones financieras para cuidar tu futuro</h2><p>Una buena planeación comienza con objetivos claros y asesoría que te ayude a elegir con confianza.</p><div className={styles.meta}><span>Equipo VitaMet</span><time dateTime="2026-03-12">12 de marzo de 2026</time><span>5 min de lectura</span></div><Link to="/" className={styles.more}>Leer más <span aria-hidden="true">→</span></Link></div></section>;
}
