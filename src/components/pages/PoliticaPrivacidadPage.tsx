import { TitleSEO } from '../../utils/TitleSEO';
import { PoliticaPrivacidad1 } from '../exports/politicaPrivacidad/PoliticaPrivacidad1';

export function PoliticaPrivacidadPage() {
  return (
    <main>
      <TitleSEO
        title="VitaMet | Política de Privacidad"
        description="Conoce cómo VitaMet recopila, utiliza y protege la información proporcionada a través de sus formularios y servicios digitales."
        canonical="https://www.vitamet.com.mx/politica-privacidad"
      />
      <PoliticaPrivacidad1 />
    </main>
  );
}
