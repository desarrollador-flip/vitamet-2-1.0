import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { getFormUtm } from './utils/formUtm';
import { useClickTracking } from './hooks/useClickTracking';

import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './components/pages/HomePage';
import { NosotrosPage } from './components/pages/NosotrosPage';
import { ServiciosPage } from './components/pages/ServiciosPage';
import { BlogPage } from './components/pages/BlogPage';
import { ContactoPage } from './components/pages/ContactoPage';
import { ReclutaPage } from './components/pages/ReclutaPage';
import { PoliticaPrivacidadPage } from './components/pages/PoliticaPrivacidadPage';

import { Cargando } from './components/utils/Cargando';
import { ScrollToTop } from './utils/scrollToTop';
import { TitleSEO } from './utils/TitleSEO';

const AgentePage = lazy(() => import('./components/pages/AgentePage'));

function App() {
  useClickTracking();
  const { search } = useLocation();
  useEffect(() => { getFormUtm(search); }, [search]);

  return (
    <>
      <ScrollToTop />
      <TitleSEO
        title="Vitamet"
        description="Te brindamos asesoramiento financiero y patrimonial a medida. Descubre cómo optimizar tus inversiones y asegurar tu estabilidad económica. ¡Contáctanos hoy!"
      />

      <Navbar />

      <Suspense
        fallback={
          <main className="cargando">
            <Cargando />
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/nosotros" element={<NosotrosPage />} />
          <Route path="/servicios" element={<ServiciosPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/contacto" element={<ContactoPage />} />
          <Route path="/recluta" element={<ReclutaPage />} />
          <Route path="/politica-privacidad" element={<PoliticaPrivacidadPage />} />
          <Route path="/agentes/:slug" element={<AgentePage />}></Route>
        </Routes>
      </Suspense>

      <Footer />
    </>
  );
}

export default App;
