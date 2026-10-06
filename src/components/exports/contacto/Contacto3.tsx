import { datosContacto } from '../../utils/datosContacto';
import styles from '../../../styles/modules/contacto/contacto3.module.css';

export function Contacto3() {
  return <section className={styles.section} aria-labelledby="office-title"><div className={styles.inner}><div className={styles.details}><h2 id="office-title">Nuestras Oficinas</h2><p className={styles.address}>Contamos con presencia nacional para estar siempre cerca de ti cuando más nos necesitas.</p><ul><li><strong>CDMX (Sede Central)</strong><span>{datosContacto.direccion.title}</span></li><li><strong>Cuernavaca</strong><span>Paseo del Conquistador 45, Lomas de Cortés</span></li><li><strong>Tijuana</strong><span>Blvd. Sánchez Taboada, Zona Río</span></li></ul><a className={styles.phone} href="tel:+527778852380"><strong>Llámanos</strong><span>{datosContacto.telefono.title}</span></a></div><div className={styles.map} role="img" aria-label="Mapa de ubicación de las oficinas VitaMet"><span className={styles.mapMarker}>●</span><strong>VitaMet Seguros</strong></div></div></section>;
}
