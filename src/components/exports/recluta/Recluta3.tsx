import { useViewportCarousel } from '../../../hooks/useViewportCarousel';
import personOne from '../../../assets/images/recluta/recluta-section-3-1.png';
import personTwo from '../../../assets/images/recluta/recluta-section-3-2.png';
import personThree from '../../../assets/images/recluta/recluta-section-3-3.png';
import styles from '../../../styles/modules/recluta/recluta3.module.css';

const baseStories = [
  { image: personOne, name: 'Brenda Lara', role: 'Director de Unidad', quote: 'Llevo 5 años en VitaMet y mi vida ha dado un giro de 180 grados. No solo por los ingresos, sino por la satisfacción de ayudar a familias a proteger su futuro.' },
  { image: personTwo, name: 'Alfredo Arellano', role: 'Agente Élite', quote: 'La capacitación que recibí fue de clase mundial. Empecé sin saber nada de seguros y hoy soy uno de los agentes con más premios en la región.' },
  { image: personThree, name: 'Andrea Viridiana', role: 'Asesor Financiero Senior', quote: 'Lo que más valoro es el tiempo que tengo ahora para mi familia. Aquí el equilibrio entre vida y trabajo es una realidad, no solo una promesa.' },
];
const stories = [...baseStories, ...baseStories, ...baseStories];

export function Recluta3() {
  const carousel = useViewportCarousel({ itemCount: stories.length, cycleLength: baseStories.length, maxVisible: 3 });

  return <section ref={carousel.sectionRef} className={styles.section} aria-labelledby="stories-title"><div className={styles.heading}><div><h2 id="stories-title">Historias de Éxito</h2><p>Conoce a las personas que han transformado su vida profesional y personal con nosotros.</p></div><div className={styles.controls}><button type="button" onClick={carousel.previous} aria-label="Historia anterior">←</button><button type="button" onClick={carousel.next} aria-label="Historia siguiente">→</button></div></div><div className={styles.viewport} onPointerDown={carousel.handlePointerDown} onPointerUp={carousel.handlePointerUp} onPointerCancel={carousel.handlePointerCancel} onWheel={carousel.handleWheel}><div className={styles.track} onTransitionEnd={carousel.handleTransitionEnd} style={{ transform: carousel.transform, transition: carousel.transitionEnabled ? undefined : 'none' }}>{carousel.trackItems.map((itemIndex, index) => { const story = stories[itemIndex]; return <article className={styles.card} key={`${story.role}-${index}`}><div className={styles.person}><img src={story.image} alt="Integrante del equipo VitaMet" /><span><strong>{story.name}</strong><small>{story.role}</small></span></div><p className={styles.stars} role="img" aria-label="5 de 5 estrellas">★★★★★</p><blockquote>{story.quote}</blockquote></article>; })}</div></div></section>;
}
