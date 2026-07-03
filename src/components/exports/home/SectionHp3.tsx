import styles from '../../../styles/modules/home/sectionHp3.module.css';

import { pasosSectionHp3 } from '../../utils/home/pasosSectionHp3';

import { SmartLink } from '../../../utils/SmartLink';
import { BotonNav } from '../../utils/BotonNav';

export const SectionHp3 = () => {
  return (
    <section className={styles.sectionContainer}>
      <header>
        <h2>¿POR QUÉ ELEGIRNOS?</h2>

        <h3>LOS DETALLES HACEN LA DIFERENCIA</h3>
      </header>

      <div className={styles.pasosContainer}>
        {pasosSectionHp3.map((paso, index) => (
          <div key={paso.id} className={styles[`paso${index + 1}`]}>
            <div>
              {paso.numero && <h4>{paso.numero}</h4>}
              <h3>{paso.titulo}</h3>
              <p>{paso.texto}</p>
            </div>

            {paso.link && (
              <SmartLink to={paso.link} dataLink={paso.dataLink} ariaLabel={paso.linkText} className={styles.link}>
                {paso.linkText} <img src={paso.img} alt={paso.linkText} />
              </SmartLink>
            )}

            {paso.boton && (
              <BotonNav to={paso.boton} dataCta={paso.dataCta} ariaLabel={paso.botonText} className="boton-2">
                {paso.botonText}
              </BotonNav>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
