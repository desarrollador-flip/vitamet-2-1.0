import { useViewportCarousel } from '../../../hooks/useViewportCarousel';
import { Link } from 'react-router-dom';
import imageOne from '../../../assets/images/blog/blog-section-3-1.png';
import imageTwo from '../../../assets/images/blog/blog-section-3-2.png';
import imageThree from '../../../assets/images/blog/blog-section-3-3.png';
import styles from '../../../styles/modules/blog/blog3.module.css';

const recentCycle = [
  { image: imageOne, category: 'Finanzas', title: '¿Cómo hacer un presupuesto en pareja?', summary: 'La comunicación es la clave. Aprende métodos probados para unificar metas financieras sin perder la autonomía individual.', date: 'Oct 20, 2023', reading: '4 min de lectura' },
  { image: imageTwo, category: 'Protección', title: '¿Qué seguro elegir para viajar este año?', summary: 'No todos los seguros son iguales. Comparamos las coberturas internacionales más robustas para ejecutivos y nómadas digitales.', date: 'Oct 15, 2023', reading: '5 min de lectura' },
  { image: imageThree, category: 'Bienestar', title: 'Tips para el ahorro educativo anticipado', summary: 'La educación es la mejor inversión. Guía práctica sobre fondos universitarios y cómo empezar a construir el legado de tus hijos.', date: 'Oct 12, 2023', reading: '3 min de lectura' },
];
const recent = [...recentCycle, ...recentCycle, ...recentCycle];

export function Blog3() {
  const carousel = useViewportCarousel({ itemCount: recent.length, cycleLength: recentCycle.length, maxVisible: 3 });
  const page = ((carousel.position - 3) % recentCycle.length + recentCycle.length) % recentCycle.length + 1;

  return <section ref={carousel.sectionRef} className={styles.section} aria-labelledby="recent-title"><div className={styles.heading}><div><h2 id="recent-title">Publicaciones Recientes</h2><p>Profundizando en los temas que mueven el mercado.</p></div></div><div className={styles.viewport} onPointerDown={carousel.handlePointerDown} onPointerUp={carousel.handlePointerUp} onPointerCancel={carousel.handlePointerCancel} onWheel={carousel.handleWheel}><div className={styles.track} onTransitionEnd={carousel.handleTransitionEnd} style={{ transform: carousel.transform, transition: carousel.transitionEnabled ? undefined : 'none' }}>{carousel.trackItems.map((itemIndex, index) => { const article = recent[itemIndex]; return <article className={styles.card} key={`${article.title}-${index}`}><img src={article.image} alt="" /><div className={styles.cardContent}><p className={styles.category}>{article.category}</p><time className={styles.date}>{article.date}</time><h3>{article.title}</h3><p className={styles.summary}>{article.summary}</p><Link to="/" className={styles.more}>Leer más <span aria-hidden="true">→</span></Link></div></article>; })}</div></div><div className={styles.controls}><button type="button" onClick={carousel.previous} aria-label="Artículo anterior">←</button><span>Página {page} de {recentCycle.length}</span><button type="button" onClick={carousel.next} aria-label="Artículo siguiente">→</button></div></section>;
}
