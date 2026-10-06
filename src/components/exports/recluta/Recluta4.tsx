import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../../styles/modules/recluta/recluta4.module.css';

const baseJobs = [
  { category: 'Ventas & Asesoría', title: 'Asesor Profesional de Seguros', type: 'Remoto / Híbrido', place: 'Tiempo Completo', openings: 10 },
  { category: 'Liderazgo', title: 'Gerente de Desarrollo de Negocios', type: 'CDMX / Presencial', place: 'Tiempo Completo', openings: 2 },
  { category: 'Administración', title: 'Analista de Cartera y Cobranza', type: 'Querétaro', place: 'Tiempo Completo', openings: 3 },
];
const jobs = [...baseJobs, ...baseJobs, ...baseJobs];

export function Recluta4() {
  const [page, setPage] = useState(0);
  const visibleJobs = jobs.slice(page * 3, page * 3 + 3);

  return <section id="recluta4" className={styles.section} aria-labelledby="jobs-title"><div className={styles.heading}><h2 id="jobs-title">Posiciones Disponibles</h2><p>Encuentra el rol que mejor se adapte a tus habilidades y ambiciones.<br />Estamos en búsqueda constante de líderes.</p></div><div className={styles.jobs}>{visibleJobs.map((job, index) => <article className={styles.job} key={`${job.title}-${index}`}><div><p className={styles.category}>{job.category}</p><h3>{job.title}</h3><p className={styles.meta}>{job.type}<span aria-hidden="true">·</span>{job.place}</p></div><div className={styles.apply}><span>{job.openings} Vacantes</span><Link to="/contacto">Aplicar Ahora</Link></div></article>)}</div><nav className={styles.pagination} aria-label="Páginas de vacantes"><button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0} aria-label="Página anterior">←</button><span>Página {page + 1} de 3</span><button type="button" onClick={() => setPage((current) => Math.min(2, current + 1))} disabled={page === 2} aria-label="Página siguiente">→</button></nav><p className={styles.cv}>¿No encuentras lo que buscas? Envíanos tu CV y te contactaremos. <Link to="/contacto">Carga tu Currículum aquí</Link></p></section>;
}
