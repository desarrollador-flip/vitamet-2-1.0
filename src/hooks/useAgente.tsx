import { useEffect, useState } from 'react';

import type { agente } from '../types/agente';

type ApiResponse = {
  success: boolean;
  data: agente;
};

export function useAgente(slug?: string) {
  const [agente, setAgente] = useState<agente | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const fetchAgente = async () => {
      try {
        setAgente(null);
        setError(false);

        /* fetch(`http://localhost:5000/api/agente/${slug}`) fetch(`/api/agente/${slug}`)*/
        const response = await fetch(`/api/agente/${slug}`);

        if (!response.ok) {
          throw new Error();
        }

        const result: ApiResponse = await response.json();

        if (!result.success) {
          throw new Error();
        }

        setAgente(result.data);
      } catch {
        setError(true);
      }
    };

    fetchAgente();
  }, [slug]);

  return { agente, error };
}
