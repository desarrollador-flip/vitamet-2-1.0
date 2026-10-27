import { datosContacto } from '../../utils/datosContacto';
import locationIcon from '../../../assets/images/recluta/ubicacion.svg';
import phoneIcon from '../../../assets/images/contacto/telefono.svg';
import styles from '../../../styles/modules/contacto/contacto3.module.css';

export function Contacto3() {
  const offices = [
    { name: 'Monterrey (Sede Central)', address: datosContacto.direccion.title },
    { name: 'Cuernavaca', address: 'Paseo del Conquistador 45, Lomas de Cortés' },
    { name: 'Tijuana', address: 'Blvd. Sánchez Taboada, Zona Río' },
  ];

  return (
    <section className={styles.section} aria-labelledby="office-title">
      <div className={styles.inner}>
        <div className={styles.details}>
          <h2 id="office-title">Nuestras Oficinas</h2>
          <p className={styles.address}>Contamos con presencia nacional para estar siempre cerca de ti cuando más nos necesitas.</p>
          <ul>
            {offices.map((office) => (
              <li key={office.name}>
                <span className={styles.icon}><img src={locationIcon} alt="" /></span>
                <div className={styles.officeText}><strong>{office.name}</strong><span>{office.address}</span></div>
              </li>
            ))}
          </ul>
          <a className={styles.phone} href="tel:+527778852380">
            <span className={styles.icon}><img src={phoneIcon} alt="" /></span>
            <div className={styles.officeText}><strong>Llámanos</strong><span>{datosContacto.telefono.title}</span></div>
          </a>
        </div>
        <div className={styles.map}>
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(datosContacto.direccion.title)}&output=embed`}
            title={`Ubicación de la sede central VitaMet: ${datosContacto.direccion.title}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
