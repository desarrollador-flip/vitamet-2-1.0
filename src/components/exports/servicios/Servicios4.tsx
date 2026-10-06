import { Link } from 'react-router-dom';
import shield from '../../../assets/images/servicios/escudo.svg';
import shieldEmpty from '../../../assets/images/servicios/escudo-vacio.svg';
import shieldCheck from '../../../assets/images/servicios/escudo-check.svg';
import styles from '../../../styles/modules/servicios/servicios4.module.css';

export function Servicios4() {
  return <section className={styles.section}><div className={styles.card}><p className={styles.eyebrow}>DA EL SIGUIENTE PASO</p><h2>Asegura tu futuro hoy mismo</h2><p>No dejes al azar lo que más importa. Agenda una consultoría gratuita con nuestros expertos y descubre el plan perfecto para ti.</p><div className={styles.actions}><Link className="boton-1" to="/contacto">Agendar Consultoría</Link><Link className={styles.secondary} to="/">Ver Casos de Éxito</Link></div><div className={styles.trustMarks} aria-hidden="true"><img src={shield} alt="" /><img src={shieldEmpty} alt="" /><img src={shieldCheck} alt="" /></div></div></section>;
}
