import image from '../../../assets/images/blog/blog-section-1-fondo.png';
import styles from '../../../styles/modules/blog/blog1.module.css';

export function Blog1() {
  return <section className={styles.hero} aria-label="Bienestar financiero y familiar"><img className={styles.image} src={image} alt="" width={1282} height={641} /></section>;
}
