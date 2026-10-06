import image from '../../../assets/images/nosotros/nosotros-section-3-1.png';
import styles from '../../../styles/modules/nosotros/nosotros3.module.css';

const values = [
  { title: '01. Integridad', description: 'Transparencia en cada acción.' },
  { title: '02. Pasión', description: 'Entrega total al cliente.' },
];

export function Nosotros3() {
  return (
    <section className={styles.section} aria-label="Misión, visión y valores">
      <div className={styles.photoWrap}>
        <span className={styles.photoFrame} aria-hidden="true" />
        <img src={image} alt="Equipo de VitaMet reunido en un evento" />
        <div className={styles.photoBadge}>Más de 25 años creciendo contigo</div>
      </div>
      <div className={styles.copy}>
        <article><p className={styles.eyebrow}>NUESTRA MISIÓN</p><h2>Proteger el bienestar de las personas</h2><p>Brindamos asesoría cercana y soluciones de protección que ayudan a cada familia a vivir con mayor tranquilidad.</p></article>
        <article><p className={styles.eyebrow}>NUESTRA VISIÓN</p><h2>Impulsar un futuro con más bienestar</h2><p>Ser el aliado de confianza que acompaña a las personas en cada etapa de su vida.</p></article>
        <ul className={styles.values}>{values.map((value) => <li key={value.title}><strong>{value.title}</strong><span>{value.description}</span></li>)}</ul>
      </div>
    </section>
  );
}
