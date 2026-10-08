import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './components/pages/HomePage';
import { NosotrosPage } from './components/pages/NosotrosPage';
import { ContactoPage } from './components/pages/ContactoPage';

/*import { ServiciosPage } from './components/pages/ServiciosPage';
import { ReclutaPage } from './components/pages/ReclutaPage';
import { BlogPage } from './components/pages/BlogPage';
 */

import { Cargando } from './components/utils/Cargando';
import { ScrollToTop } from './utils/scrollToTop';

const AgentePage = lazy(() => import('./components/pages/AgentePage'));

function App() {
  return (
    <>
      <ScrollToTop />

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
          <Route path="/contacto" element={<ContactoPage />} />

          {/* <Route path="/politica-privacidad" element={<HomePage />} />
                    <Route path="/servicios" element={<ServiciosPage />} />
                    <Route path="/recluta" element={<ReclutaPage />} />
                    
                    <Route path="/blog" element={<BlogPage />} />
                     */}
          <Route path="/agentes/:slug" element={<AgentePage />}></Route>
        </Routes>
      </Suspense>

      <Footer />
    </>
  );
}

export default App;
