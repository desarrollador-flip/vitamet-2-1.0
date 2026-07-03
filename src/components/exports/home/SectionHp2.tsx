import styles from '../../../styles/modules/home/sectionHp2.module.css';

import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useScrollReveal } from '../../../hooks/useScrollReveal';

import { palomasSectionHp2 } from '../../utils/home/palomasSectionHp2';
import { imgsSectionHp2 } from '../../utils/home/imgsSectionHp2';
import { Counter } from '../../utils/Counter';

export const SectionHp2 = () => {
  const isMovile = useMediaQuery('(max-width: 767px)');
  const { ref, isVisible } = useScrollReveal({ threshold: 0.5 });

  return (
    <section className={styles.sectionContainer}>
      <div>
        <header>
          <h2>LA ASEGURADORA #1 DE MÉXICO YA CONFÍA EN NOSOTROS</h2>

          {!isMovile && (
            <p>
              Somos una empresa líder comprometida con tu bienestar integral en colaboración con MetLife México, con más de 25 años transformando
              vidas a través de la asesoría experta.
            </p>
          )}
        </header>

        <div className={styles.palomas}>
          {palomasSectionHp2.map((paloma) => (
            <div key={paloma.id} className={styles.paloma}>
              <div>
                <img src={paloma.img} alt={paloma.titulo} />
              </div>

              <div>
                <h3>{paloma.titulo}</h3>

                <p>{paloma.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.imgs}>
        {imgsSectionHp2.map((img, index) => (
          <div key={img.id} className={styles[`imagen${index + 1}`]}>
            {!isMovile && <img src={img.img} alt={img.texto} />}

            <div className={styles[`containerImg${index + 1}`]}>
              <h3 ref={ref}>
                <Counter end={img.titulo} duration={1200} isVisible={isVisible} />
              </h3>

              <p>{img.texto}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
