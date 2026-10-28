import { useEffect } from 'react';
import { trackClick } from '../utils/tracking';

export function useClickTracking(): void {
  useEffect(() => {
    // Capture the source route before React navigation or menu cleanup runs.
    // preventDefault is part of the existing navigation and does not cancel tracking.
    document.addEventListener('click', trackClick, true);
    return () => document.removeEventListener('click', trackClick, true);
  }, []);
}
