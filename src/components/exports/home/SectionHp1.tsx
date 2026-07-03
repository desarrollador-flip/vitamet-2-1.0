import styles from '../../../styles/modules/home/sectionHp1.module.css';
import imgFondo from '../../../assets/images/home/sectionHp1/fondo-home.png';
import imgFlecha from '../../../assets/images/home/flecha-derecha.svg';

import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { BotonNav } from '../../utils/BotonNav';

export const SectionHp1 = () => {
  const isMobile = useMediaQuery('(max-width: 575px)');

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.sectionContenido}>
        {!isMobile && <img src={imgFondo} className={styles.imgFondo} alt="Fondo de la sección" />}

        <div className={styles.contenido}>
          <p>OPORTUNIDAD DE CARRERA</p>

          <h1>¡ÚNETE A LA MEJOR CARRERA DEL MUNDO!</h1>

          <p>Vive con libertad, construye tu futuro y cambia tu vida. Somos los socios comerciales más importantes de MetLife México.</p>

          <BotonNav to="/unete" className="boton-1" dataCta="home-unete-btn-1">
            APLICAR AHORA <img src={imgFlecha} alt="Flecha en dirección hacia la derecha" />
          </BotonNav>
        </div>
      </div>
    </section>
  );
};
