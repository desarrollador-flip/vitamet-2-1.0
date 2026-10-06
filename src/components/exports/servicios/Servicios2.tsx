import { Link } from 'react-router-dom';
import styles from '../../../styles/modules/servicios/servicios2.module.css';
import escudo from '../../../assets/images/servicios/escudo.svg';
import cerdito from '../../../assets/images/servicios/cerdito.svg';
import graduado from '../../../assets/images/servicios/graduado.svg';
import anciano from '../../../assets/images/servicios/anciano.svg';
import empresa from '../../../assets/images/servicios/empresa.svg';

const solutions = [
  { title: 'Seguro de Gastos Médicos Mayores', image: escudo, text: 'Atención y respaldo para cuidar de tu salud y la de quienes más quieres.' },
  { title: 'Seguro de Ahorro', image: cerdito, text: 'Construye un patrimonio con objetivos claros y acompañamiento experto.' },
  { title: 'Seguro de Retiro', image: anciano, text: 'Planea una etapa de retiro con mayor tranquilidad financiera.' },
  { title: 'Seguro de Educación', image: graduado, text: 'Prepara hoy los recursos para las metas educativas de tu familia.' },
  { title: 'Seguro de Empresas', image: empresa, text: 'Protección para fortalecer el bienestar de tu organización.' },
];

export function Servicios2() {
  return <section id="portafolio" className={styles.section} aria-labelledby="portfolio-title"><div className={styles.heading}><p className={styles.eyebrow}>NUESTRO PORTAFOLIO</p><h2 id="portfolio-title">Portafolio de Soluciones</h2><p>Diseñamos coberturas a la medida para garantizar tu tranquilidad financiera y el bienestar de tus seres queridos.</p></div><div className={styles.grid}>{solutions.map((solution) => <article className={styles.card} key={solution.title}><div className={styles.icon}><img src={solution.image} alt="" /></div><h3>{solution.title}</h3><p>{solution.text}</p><Link to="/" className={styles.more}>Leer más <span aria-hidden="true">›</span></Link></article>)}<article className={styles.custom}><h3>¿Necesitas algo a medida?</h3><p>Nuestros asesores pueden diseñar un plan híbrido que cubra todas tus necesidades específicas.</p><Link to="/contacto" className="boton-1">Contactar Asesor</Link></article></div></section>;
}
