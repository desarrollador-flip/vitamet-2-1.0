import { Link } from 'react-router-dom';
import styles from '../../../styles/modules/nosotros/nosotros5.module.css';

export function Nosotros5() {
  return <section className={styles.section}><div><h2>¿Listo para asegurar tu futuro con los mejores?</h2><p>Únete a un equipo de élite o permite que nuestros expertos diseñen un plan a tu medida. El momento es ahora.</p></div><div className={styles.actions}><Link className="boton-1" to="/contacto">Quiero ser Agente</Link><Link className="boton-2" to="/contacto">Solicitar Asesoría</Link></div></section>;
}
