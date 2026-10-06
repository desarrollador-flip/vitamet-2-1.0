import styles from '../../../styles/modules/recluta/recluta2.module.css';
import growth from '../../../assets/images/recluta/avion-despegando.svg';
import wellbeing from '../../../assets/images/recluta/escudo-mas.svg';
import travel from '../../../assets/images/recluta/reloj.svg';
import collaboration from '../../../assets/images/recluta/grupo-usuarios.svg';
import teamPhoto from '../../../assets/images/recluta/recluta-section-2-1.png';

const reasons: { title: string; text: string; image: string; className: string; photo?: string }[] = [
  { title: 'Crecimiento sin límites', text: 'Desarrolla tus habilidades y construye una carrera a tu ritmo.', image: growth, className: 'growth' },
  { title: 'Bienestar Total', text: 'Forma parte de una cultura que cuida de las personas.', image: wellbeing, className: 'wellbeing' },
  { title: 'Premios y Viajes', text: 'Celebra tus logros y comparte nuevas experiencias.', image: travel, className: 'travel' },
  { title: 'Cultura de Colaboración', text: 'Crece en equipo con asesoría, acompañamiento y comunidad.', image: collaboration, className: 'collaboration', photo: teamPhoto },
];

export function Recluta2() {
  return <section className={styles.section} aria-labelledby="reasons-title"><div className={styles.heading}><p className={styles.eyebrow}>TU CARRERA, TU FUTURO</p><h2 id="reasons-title">¿Por qué elegir VitaMet?</h2></div><div className={styles.grid}>{reasons.map((reason) => <article key={reason.title} className={`${styles.card} ${styles[reason.className]}`}>{reason.photo && <img className={styles.teamPhoto} src={reason.photo} alt="Equipo de VitaMet colaborando" />}<img className={styles.reasonIcon} src={reason.image} alt="" /><div><h3>{reason.title}</h3><p>{reason.text}</p></div></article>)}</div></section>;
}
