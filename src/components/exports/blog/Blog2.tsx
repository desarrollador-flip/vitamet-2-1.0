import { Link } from 'react-router-dom';
import image from '../../../assets/images/blog/blog-section-2-1.png';
import styles from '../../../styles/modules/blog/blog2.module.css';

export function Blog2() {
  return (
    <section className={styles.section} aria-labelledby="featured-title">
      <img className={styles.image} src={image} alt="Espacio de trabajo preparado para planear y analizar" />
      <div className={styles.content}>
        <span className={styles.badge}>Artículo Reciente</span>
        <h2 id="featured-title">Cómo planificar tu retiro en 2024: Estrategias de élite</h2>
        <p>Descubre los pilares fundamentales para asegurar un futuro próspero. Analizamos las nuevas normativas fiscales y las oportunidades de inversión más sólidas para el próximo año en el...</p>
        <div className={styles.meta}>
          <span className={styles.avatar} aria-hidden="true">VM</span>
          <div className={styles.author}>
            <strong>VitaMet Editorial</strong>
            <span><time dateTime="2023-10-24">Oct 24, 2023</time> • 8 min read</span>
          </div>
          <Link to="/" className={styles.more}>Leer más <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </section>
  );
}
