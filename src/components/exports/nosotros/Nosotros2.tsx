import styles from '../../../styles/modules/nosotros/nosotros2.module.css';
import awardIcon from '../../../assets/images/nosotros/medalla.svg';
import arrowIcon from '../../../assets/images/home/flecha-derecha.svg';
import { Link } from 'react-router-dom';

const metrics = [
  { value: '+25', label: 'años de éxito' },
  { value: '7', label: 'campeonatos nac.' },
  { value: '13k+', label: 'clientes protegidos' },
];

export function Nosotros2() {
  return (
    <section className={styles.section} aria-labelledby="liderazgo-title">
      <div className={styles.leadership}>
        <div className={styles.intro}>
          <img className={styles.awardIcon} src={awardIcon} alt="" width={24} height={32} />
          <h2 id="liderazgo-title">La Promotoría #1 de MetLife</h2>
          <p>Consolidamos nuestro liderazgo como socios estratégicos más importantes de MetLife México por 9 años consecutivos. Nuestra trayectoria está definida por la pasión de nuestros consultores y la confianza de miles de familias.</p>
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
        <article>
          <h3>Cobertura Nacional</h3>
          <p>Presencia en las principales ciudades de la República Mexicana con atención personalizada.</p>
          <Link to="/contacto" className={styles.offices}>Nuestras Oficinas <img src={arrowIcon} alt="" width={16} height={16} /></Link>
        </article>
        <article>
          <h3>ASPRO-GAMA</h3>
          <p>Reconocidos internacionalmente por los más altos estándares de calidad en la industria.</p>
        </article>
      </div>
    </section>
  );
}
