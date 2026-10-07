import image from '../../../assets/images/nosotros/nosotros-section-3-1.png';
import styles from '../../../styles/modules/nosotros/nosotros3.module.css';
import missionIcon from '../../../assets/images/nosotros/bandera.svg';
import visionIcon from '../../../assets/images/nosotros/ojo.svg';

const values = [
  { title: '01. Integridad', description: 'Transparencia en cada acción.' },
  { title: '02. Pasión', description: 'Entrega total al cliente.' },
];

export function Nosotros3() {
  return (
    <section className={styles.section} aria-label="Misión, visión y valores">
      <div className={styles.photoWrap}>
        <span className={styles.photoFrame} aria-hidden="true" />
        <img src={image} alt="Equipo de VitaMet reunido en un evento" />
        <div className={styles.photoBadge}>"Nuestra visión es ser el referente de estabilidad y crecimiento para cada profesional en el sector."</div>
      </div>
      <div className={styles.copy}>
        <article>
          <h2><img src={missionIcon} alt="" width={23} height={26} />Nuestra Misión</h2>
          <p>Empoderar a profesionales para que alcancen su máximo potencial, brindando soluciones de protección financiera que garanticen la tranquilidad de las familias mexicanas. Transformamos vidas a través del asesoramiento ético y experto.</p>
        </article>
        <article>
          <h2><img src={visionIcon} alt="" width={33} height={23} />Nuestra Visión</h2>
          <p>Ser la organización líder y más admirada en el sector asegurador, reconocida por su excelencia operativa, su cultura de alto rendimiento y su compromiso inquebrantable con el bienestar humano y social.</p>
        </article>
        <ul className={styles.values}>{values.map((value) => <li key={value.title}><strong>{value.title}</strong><span>{value.description}</span></li>)}</ul>
      </div>
    </section>
  );
}
