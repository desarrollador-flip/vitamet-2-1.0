import styles from '../../../styles/modules/nosotros/nosotros2.module.css';
import coverageIcon from '../../../assets/images/nosotros/bandera.svg';
import awardIcon from '../../../assets/images/nosotros/medalla.svg';

const metrics = [
  { value: '+25', label: 'años de éxito' },
  { value: '7', label: 'campeonatos nac.' },
  { value: '13K+', label: 'clientes protegidos' },
];

export function Nosotros2() {
  return (
    <section className={styles.section} aria-labelledby="liderazgo-title">
      <div className={styles.leadership}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>QUIÉNES SOMOS</p>
          <h2 id="liderazgo-title">La Promotoría #1 de MetLife</h2>
          <p>Consolidamos nuestro liderazgo como socios estratégicos de MetLife México. Nuestra trayectoria está definida por la pasión de nuestros consultores y la confianza de miles de familias.</p>
        </div>
        <div className={styles.metrics}>
          {metrics.map((metric) => (
            <article className={styles.metric} key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>
      </div>
      <div className={styles.partners}>
        <article><span className={styles.partnerIcon}><img src={coverageIcon} alt="" /></span><div><h3>Cobertura Nacional</h3><p>Una red presente en todo México.</p></div></article>
        <article><span className={styles.partnerIcon}><img src={awardIcon} alt="" /></span><div><h3>ASPRO-GAMA</h3><p>Reconocidos por nuestra excelencia en la industria.</p></div></article>
      </div>
    </section>
  );
}
