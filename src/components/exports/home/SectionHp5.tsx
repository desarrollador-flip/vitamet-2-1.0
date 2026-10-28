import styles from '../../../styles/modules/home/sectionHp5.module.css';

import icono1 from '../../../assets/images/home/flecha-derecha.svg';

import { rutasSectionHp5 } from '../../utils/home/rutasSectionHp5';

import { SmartLink } from '../../../utils/SmartLink';

export const SectionHp5 = () => {
  return (
    <section className={styles.sectionContainer}>
      <header>
        <h2>SOLUCIONES INTEGRALES</h2>

        <h3>PROTEGEMOS LO MÁS IMPORTANTE PARA TI</h3>
      </header>

      <div className={styles.rutasContainer}>
        {rutasSectionHp5.map((ruta, index) => (
          <SmartLink to={ruta.link} dataLink={ruta.dataLink} key={ruta.id} ariaLabel={`leer más sobre ${ruta.titulo}`} className={`${styles.ruta} ${styles[`ruta${index + 1}`]}`}>
            <div className={styles.rutaHeader}>
              <img src={ruta.img} alt={ruta.titulo} />

              <img src={ruta.icono} alt={ruta.titulo} />
            </div>

            <div className={styles.rutasContenido}>
              <h3>{ruta.titulo}</h3>

              <p>{ruta.texto}</p>

              <span className={styles.link}>
                Leer más <img src={icono1} alt="" />
              </span>
            </div>
          </SmartLink>
        ))}
      </div>
    </section>
  );
};
