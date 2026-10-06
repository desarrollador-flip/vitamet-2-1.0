import { useViewportCarousel } from '../../../hooks/useViewportCarousel';
import styles from '../../../styles/modules/nosotros/nosotros4.module.css';

const milestoneCycle = [
  { year: '1998', title: 'Fundación', description: 'VitaMet inicia operaciones con una visión clara: revolucionar el servicio de consultoría patrimonial en México.' },
  { year: '2005', title: 'Alianza Estratégica', description: 'Nos consolidamos como socios principales de MetLife, expandiendo nuestra capacidad de respuesta nacional.' },
  { year: '2015', title: 'Multicampeones', description: 'Iniciamos la racha histórica de campeonatos nacionales que nos posiciona como líderes.' },
  { year: '2024', title: 'Innovación Digital', description: 'Lanzamiento de nuestra plataforma omnicanal para brindar soporte 24/7 a todos nuestros clientes.' },
];
const milestones = [...milestoneCycle, ...milestoneCycle];

export function Nosotros4() {
  const carousel = useViewportCarousel({ itemCount: milestones.length, cycleLength: milestoneCycle.length, maxVisible: 4 });

  return (
    <section ref={carousel.sectionRef} id="nosotros-hitos" className={styles.section} aria-labelledby="milestones-title">
      <div className={styles.heading}><p className={styles.eyebrow}>NUESTRA TRAYECTORIA</p><h2 id="milestones-title">Hitos de Excelencia</h2></div>
      <div className={styles.timelineViewport} onPointerDown={carousel.handlePointerDown} onPointerUp={carousel.handlePointerUp} onPointerCancel={carousel.handlePointerCancel} onWheel={carousel.handleWheel}>
        <div className={styles.timelineTrack} onTransitionEnd={carousel.handleTransitionEnd} style={{ transform: carousel.transform, transition: carousel.transitionEnabled ? undefined : 'none' }}>
          {carousel.trackItems.map((itemIndex, index) => {
            const milestone = milestones[itemIndex];
            return <article className={styles.milestone} key={`${milestone.year}-${index}`}><span className={styles.dot} aria-hidden="true" /><strong>{milestone.year}</strong><h3>{milestone.title}</h3><p>{milestone.description}</p></article>;
          })}
        </div>
      </div>
      <div className={styles.controls}>
        <button type="button" onClick={carousel.previous} aria-label="Hito anterior">←</button>
        <button type="button" onClick={carousel.next} aria-label="Hito siguiente">→</button>
      </div>
    </section>
  );
}
