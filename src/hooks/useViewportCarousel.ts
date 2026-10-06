import { useCallback, useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react';

interface UseViewportCarouselOptions {
  itemCount: number;
  cycleLength: number;
  maxVisible: number;
  interval?: number;
}

export function useViewportCarousel({ itemCount, cycleLength, maxVisible, interval = 5500 }: UseViewportCarouselOptions) {
  const sectionRef = useRef<HTMLElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const lastWheelStep = useRef(0);
  const [position, setPosition] = useState(maxVisible);
  const [isInView, setIsInView] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window === 'undefined') return 1;
    return window.innerWidth >= 992 ? maxVisible : window.innerWidth >= 576 ? Math.min(2, maxVisible) : 1;
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const prefix = maxVisible;
  const trackLength = prefix + itemCount + prefix;
  const trackItems = Array.from({ length: trackLength }, (_, index) => (index - prefix + itemCount) % itemCount);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      setVisibleCount(width >= 992 ? maxVisible : width >= 576 ? Math.min(2, maxVisible) : 1);
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, [maxVisible]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (!isInView || prefersReducedMotion) return;

    const timer = window.setTimeout(() => {
      setPosition((current) => current + 1);
      setTransitionEnabled(true);
    }, interval);

    return () => window.clearTimeout(timer);
  }, [interval, isInView, position, prefersReducedMotion]);

  const next = useCallback(() => {
    setTransitionEnabled(true);
    setPosition((current) => current + 1);
  }, []);

  const previous = useCallback(() => {
    setTransitionEnabled(true);
    setPosition((current) => current - 1);
  }, []);

  const handleTransitionEnd = () => {
    if (position >= prefix + cycleLength) {
      setTransitionEnabled(false);
      setPosition(prefix);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setTransitionEnabled(true)));
    } else if (position < prefix) {
      setTransitionEnabled(false);
      setPosition(prefix + cycleLength - 1);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setTransitionEnabled(true)));
    }
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

    if (deltaX < 0) next();
    else previous();
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) < 30 || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    if (Date.now() - lastWheelStep.current < 450) return;
    lastWheelStep.current = Date.now();
    if (event.deltaX > 0) next();
    else previous();
  };

  const transform = `translateX(calc(-${position * (100 / visibleCount)}% - ${position * (24 / visibleCount)}px))`;

  return {
    sectionRef,
    position,
    visibleCount,
    trackItems,
    transitionEnabled,
    transform,
    next,
    previous,
    handleTransitionEnd,
    handlePointerDown,
    handlePointerUp,
    handleWheel,
    handlePointerCancel: () => { pointerStart.current = null; },
  };
}
