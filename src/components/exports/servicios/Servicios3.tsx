import image from '../../../assets/images/servicios/servicios-section-3-1.png';
import asesoria from '../../../assets/images/servicios/usuario-lupa.svg';
import digital from '../../../assets/images/servicios/dispositivos.svg';
import claims from '../../../assets/images/servicios/servicio-cliente.svg';
import styles from '../../../styles/modules/servicios/servicios3.module.css';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

const benefits = [
  {
    title: 'Asesoría Personalizada',
    text: 'No creemos en soluciones genéricas. Cada cliente recibe un análisis profundo de su situación financiera actual.',
    image: asesoria,
  },
  {
    title: 'Herramientas Digitales',
    text: 'Gestiona tus pólizas, realiza pagos y sigue tus trámites desde nuestra plataforma intuitiva 24/7.',
    image: digital,
  },
  {
    title: 'Acompañamiento en Reclamaciones',
    text: 'En los momentos difíciles, estamos contigo. Gestionamos tus siniestros de manera ágil y transparente.',
    image: claims,
  },
];

export function Servicios3() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <section className={styles.section}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>EL RESPALDO QUE MERECES</p>
        <h2>¿Por qué elegir a VitaMet?</h2>
        <p>Nuestra diferencia radica en el compromiso inquebrantable con la excelencia y la empatía en cada interacción.</p>
        <div className={styles.benefits}>
          {benefits.map((benefit) => (
            <article key={benefit.title}>
              <img src={benefit.image} alt="" />
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      {!isMobile && <img className={styles.photo} src={image} alt="Equipo de VitaMet celebra un logro en conjunto" />}
    </section>
  );
}
