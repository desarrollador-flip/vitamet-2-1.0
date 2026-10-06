import { useEffect, useRef, useState, type PointerEvent } from 'react';
import styles from '../../../styles/modules/home/sectionHp4.module.css';
import testimonialImage from '../../../assets/images/home/sectionHp4/home-section-4-1.png';

const testimonials = [
  {
    image: testimonialImage,
    quote:
      'Estoy a punto de cumplir 2 años con mi plan de ahorro y estoy muy satisfecho. El servicio, la asesoría y el acompañamiento de mi agente y la tranquilidad que me brinda la compañía han sido totalmente de mi agrado. Recomiendo ampliamente a VitaMet.',
    author: 'Sergio de la Cajiga López',
    subtitle: 'Metalife Retiro 2020',
  },
  {
    image: testimonialImage,
    quote:
      'Estoy a punto de cumplir 2 años con mi plan de ahorro y estoy muy satisfecho. El servicio, la asesoría y el acompañamiento de mi agente y la tranquilidad que me brinda la compañía han sido totalmente de mi agrado. Recomiendo ampliamente a VitaMet.',
    author: 'Sergio de la Cajiga López',
    subtitle: 'Metalife Retiro 2020',
  },
  {
    image: testimonialImage,
    quote:
      'Estoy a punto de cumplir 2 años con mi plan de ahorro y estoy muy satisfecho. El servicio, la asesoría y el acompañamiento de mi agente y la tranquilidad que me brinda la compañía han sido totalmente de mi agrado. Recomiendo ampliamente a VitaMet.',
    author: 'Sergio de la Cajiga López',
    subtitle: 'Metalife Retiro 2020',
  },
];

const carouselItems = [testimonials[testimonials.length - 1], ...testimonials, testimonials[0]];

export function SectionHp4() {
  const sectionRef = useRef<HTMLElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayReset, setAutoplayReset] = useState(0);
  const [position, setPosition] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, { threshold: 0.2 });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((index) => (index + 1) % testimonials.length);
      setPosition((currentPosition) => currentPosition + 1);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [activeIndex, autoplayReset, isInView]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
    setPosition(index + 1);
    setAutoplayReset((value) => value + 1);
  };

  const handleTransitionEnd = () => {
    if (position !== 0 && position !== testimonials.length + 1) return;

    setTransitionEnabled(false);
    setPosition(position === 0 ? testimonials.length : 1);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setTransitionEnabled(true));
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    const nextIndex = (activeIndex + (deltaX < 0 ? 1 : -1) + testimonials.length) % testimonials.length;
    goToSlide(nextIndex);
  };

  return (
    <section ref={sectionRef} className={styles.sectionContainer} aria-labelledby="testimonials-title">
      <div className={styles.imageColumn}>
        <span className={styles.imageAccent} aria-hidden="true" />
        <img className={styles.testimonialImage} src={testimonials[activeIndex].image} alt="Un asesor conversa con una pareja durante una reunión" />
        <span className={styles.quoteMark} aria-hidden="true">“</span>
      </div>

      <div className={styles.content}>
        <p className={styles.eyebrow}>TESTIMONIALES</p>
        <h2 id="testimonials-title">LO QUE OPINAN NUESTROS CLIENTES</h2>

        <div
          className={styles.carouselViewport}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { pointerStart.current = null; }}
        >
          <div
            className={styles.carouselTrack}
            onTransitionEnd={handleTransitionEnd}
            style={{
              transform: `translateX(-${position * 100}%)`,
              transition: transitionEnabled ? undefined : 'none',
            }}
            aria-live="polite"
          >
            {carouselItems.map((testimonial, index) => {
              const isClone = index === 0 || index === carouselItems.length - 1;
              const testimonialIndex = (index - 1 + testimonials.length) % testimonials.length;

              return (
                <article
                  key={`${testimonial.author}-${index}`}
                  className={styles.slide}
                  aria-hidden={isClone || testimonialIndex !== activeIndex}
                >
                  <blockquote>{testimonial.quote}</blockquote>
                  <div className={styles.author}>
                    <span className={styles.authorIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24" focusable="false">
                        <circle cx="12" cy="8" r="3.5" />
                        <path d="M4.5 20c.5-4 3.2-6 7.5-6s7 2 7.5 6" />
                      </svg>
                    </span>
                    <span>
                      <strong>{testimonial.author}</strong>
                      <small>{testimonial.subtitle}</small>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <nav className={styles.indicators} aria-label="Navegación de testimoniales">
          {testimonials.map((testimonial, index) => (
            <button
              key={`${testimonial.author}-indicator-${index}`}
              type="button"
              className={index === activeIndex ? styles.activeIndicator : styles.indicator}
              aria-label={`Mostrar testimonio ${index + 1}`}
              aria-pressed={index === activeIndex}
              onClick={() => goToSlide(index)}
            />
          ))}
        </nav>
      </div>
    </section>
  );
}
