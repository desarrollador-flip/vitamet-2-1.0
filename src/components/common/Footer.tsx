import { SmartLink } from '../../utils/SmartLink';

import { enlacesRapidos, legal } from '../utils/footerContenido';
import { datosContacto } from '../utils/datosContacto';
import { NavItems } from '../utils/NavItems';

import logo from '../../assets/images/common/logo-blanco.svg';

export function Footer() {
    return (
        <footer className="footer">
            <div className="footer-contenido">
                <SmartLink to="/" aria-label="Ir a la página de inicio" dataLink="footer-logo-btn">
                    <img src={logo} alt="Logotipo de Vitamet en el pie de página" loading="lazy" decoding="async" />
                </SmartLink>

                <div className="footer-info">
                    <div className="info">
                        <p>
                            Somos un grupo de expertos con más de 25 años en el sector asegurador, líderes reconocidos por la industria (ASPRO-GAMA).
                        </p>

                        <img src="" alt="" />
                        <img src="" alt="" />
                    </div>

                    <div className="info">
                        <h2>Enlaces Rápidos</h2>

                        <ul>
                            {enlacesRapidos.map((enlace) => (
                                <li key={enlace.id}>
                                    <NavItems item={enlace} />
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="info">
                        <h2>Oficina Central</h2>

                        <div className="datos-contacto-footer">
                            <p>{datosContacto.direccion.title}</p>

                            <div className="datos-footer">
                                <h3>Llámanos:</h3>
                                <p>{datosContacto.telefono.title}</p>
                            </div>

                            <div className="datos-footer">
                                <h3>Email:</h3>
                                <p>{datosContacto.email.title}</p>
                            </div>
                        </div>
                    </div>

                    <div className="info">
                        <h2>Legal</h2>

                        <ul>
                            {legal.map((legal) => (
                                <li key={legal.id}>
                                    <NavItems item={legal} />
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <hr />

                <div className="policy-container">
                    <p>© 2026 VitaMet. All rights reserved.</p>

                    <SmartLink to="/politica-privacidad" title="Ver el aviso de privacidad" dataLink="footer-politica-link">
                        Privacy Policy
                    </SmartLink>
                </div>
            </div>
        </footer>
    );
}
