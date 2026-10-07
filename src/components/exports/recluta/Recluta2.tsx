import styles from '../../../styles/modules/recluta/recluta2.module.css';
import growth from '../../../assets/images/recluta/flecha-grafico.svg';
import wellbeing from '../../../assets/images/recluta/escudo-mas.svg';
import travel from '../../../assets/images/recluta/avion-despegando.svg';
import collaboration from '../../../assets/images/recluta/grupo-usuarios.svg';
import teamPhoto from '../../../assets/images/recluta/recluta-section-2-1.png';
import { IconoCheck } from '../../../assets/icons/Check';

const reasons: { title: string; text: string; image: string; className: string; photo?: string; bullets?: string[] }[] = [
  { title: 'Crecimiento sin límites', text: 'Contamos con un plan de carrera estructurado que te permite escalar desde agente hasta director de tu propia promotoría. Tu esfuerzo es el único límite.', image: growth, className: 'growth', bullets: ['Capacitación continua de alto nivel', 'Mentoría con líderes de la industria'] },
  { title: 'Bienestar Total', text: 'Seguro de gastos médicos mayores, vida y planes de retiro exclusivos.', image: wellbeing, className: 'wellbeing' },
  { title: 'Premios y Viajes', text: 'Convenciones internacionales y bonos de productividad que recompensan tu excelencia cada trimestre.', image: travel, className: 'travel' },
  { title: 'Cultura de Colaboración', text: 'No competimos, colaboramos. Nuestro factor secreto es el acompañamiento y el éxito compartido entre todos los miembros.', image: collaboration, className: 'collaboration', photo: teamPhoto },
];

export function Recluta2() {
  return (
    <section className={styles.section} aria-labelledby="reasons-title">
      <div className={styles.heading}>
        <p className={styles.eyebrow}>TU CARRERA, TU FUTURO</p>
        <h2 id="reasons-title">¿Por qué elegir VitaMet?</h2>
        <p>Ofrecemos más que un empleo; ofrecemos una plataforma para el crecimiento exponencial y el bienestar integral.</p>
      </div>
      <div className={styles.grid}>
        {reasons.map((reason) => (
          <article key={reason.title} className={`${styles.card} ${styles[reason.className]}`}>
            {reason.photo && <img className={styles.teamPhoto} src={reason.photo} alt="Equipo de VitaMet colaborando" />}
            <img className={styles.reasonIcon} src={reason.image} alt="" />
            <div>
              <h3>{reason.title}</h3>
              <p>{reason.text}</p>
              {reason.bullets && (
                <ul className={styles.bullets}>
                  {reason.bullets.map((bullet) => (
                    <li key={bullet}><span aria-hidden="true"><IconoCheck className={styles.check} /></span>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
