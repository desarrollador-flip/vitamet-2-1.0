import styles from '../../styles/modules/agentePage.module.css';

import imgLlamada from '../../assets/images/agente/llamada.webp';
import imgEmail from '../../assets/images/agente/correo.webp';

import { Spinner } from '../../assets/icons/Spinner';
import { IconoCompartir } from '../../assets/icons/Compartir';
import { IconoCopiar } from '../../assets/icons/Copiar';
import { IconoWhatsApp } from '../../assets/icons/Whatsapp';
import { IconoCheck } from '../../assets/icons/Check';

import { useParams } from 'react-router-dom';

import { TitleSEO } from '../../utils/TitleSEO';
import { ErrorCarga } from '../utils/ErrorCarga';
import { WhatsAppButton } from '../utils/WhatsAppButton';
import { DownloadContact } from '../utils/DownloadContact';
import { palomasAgentes } from '../utils/palomasAgente';

import { useAgente } from '../../hooks/useAgente';
import { useShare } from '../../hooks/useShare';

function AgentePage() {
    const { slug } = useParams();

    const { agente, error } = useAgente(slug);
    const { copyLink, compartir, canShare } = useShare(agente);

    if (error) {
        return (
            <div className="cargando">
                <ErrorCarga />
            </div>
        );
    }

    if (!agente) {
        return (
            <div className="cargando">
                <Spinner />
            </div>
        );
    }

    return (
        <main className={styles.fondo}>
            <TitleSEO
                title={`${agente.nombre} | Vitamet`}
                description="Los mejores agentes del mundo"
                canonical={`https://vitamet.com.mx/agentes/${agente.path}`}
            />

            <div className={styles.sectionContainer}>
                <section className={styles.cardContainer} aria-labelledby="agente-name">
                    <button
                        type="button"
                        className={styles.botonShared}
                        onClick={canShare ? compartir : copyLink}
                        aria-label={canShare ? 'Compartir tarjeta digital' : 'Copiar enlace de la tarjeta digital'}
                        data-cta="agente-shared-btn"
                    >
                        <span aria-hidden="true">
                            {canShare ? <IconoCompartir className={styles.iconoShared} /> : <IconoCopiar className={styles.iconoShared} />}
                        </span>
                    </button>

                    <div className={styles.agenteContainer}>
                        <span className={styles.cargo}>{agente.cargo}</span>
                        <h1 id="agente-name">{agente.nombre}</h1>
                    </div>

                    <img className={styles.foto} src={agente.foto} loading="lazy" alt={`Foto de ${agente.nombre}`} />

                    <div className={styles.infoContainer}>
                        <DownloadContact className={styles.vcard} agente={agente} filename={agente.path} dataCta="agente-guardar-btn" />

                        <dl className={styles.experienciaContainer}>
                            <div className={styles.expDetail}>
                                <dt>EXPERIENCIA</dt>
                                <dd>+{agente.exp} Años</dd>
                            </div>

                            <div className={styles.expDetail}>
                                <dt>CLIENTES</dt>
                                <dd>+{agente.clientes}</dd>
                            </div>

                            <div className={styles.expDetail}>
                                <dt>ESTATUS</dt>
                                <dd>{agente.status}</dd>
                            </div>
                        </dl>
                    </div>
                </section>

                <section className={styles.canalesContainer} aria-labelledby="agente-canales-title">
                    <h2 id="agente-canales-title">CANALES DE ATENCIÓN</h2>

                    <div className={styles.contactoContainer}>
                        <a href={`tel:${agente.telefono}`} className={styles.contactoDetail} data-cta="agente-llamar-btn">
                            <img src={imgLlamada} alt="" />

                            <div>
                                <p>Llamar Ahora</p>
                                <span className={styles.channelAction}>Llamar</span>
                            </div>
                        </a>

                        <WhatsAppButton
                            className={styles.contactoDetail}
                            phone={agente.whatsapp}
                            message={`Hola ${agente.nombre}, vi tu tarjeta digital y quiero información.`}
                            dataCta="agente-whatsapp-btn"
                        >
                            <span className={styles.whatsappIcon} aria-hidden="true"><IconoWhatsApp className={styles.botonWhatsapp} /></span>

                            <div>
                                <p>Mensaje directo</p>
                                <span className={styles.channelAction}>WhatsApp</span>
                            </div>
                        </WhatsAppButton>

                        <a href={`mailto:${agente.correo}`} className={styles.contactoDetail} data-cta="agente-correo-btn">
                            <img src={imgEmail} alt="" />

                            <div>
                                <p>Enviar correo</p>
                                <span className={styles.channelAction}>Email</span>
                            </div>
                        </a>
                    </div>
                </section>

                <section className={styles.perfilContainer} aria-labelledby="agente-perfil-title">
                    <h2 id="agente-perfil-title">Perfil Profesional</h2>

                    <p>
                        Especialista en la planeación financiera y protección del patrimonio a través de seguros de vida y gastos médicos mayores. Mi
                        enfoque está en analizar cada situación de forma personalizada para ofrecer soluciones que brinden seguridad, estabilidad y
                        respaldo ante cualquier imprevisto.
                    </p>

                    <p>
                        Acompaño a cada cliente en la elección del plan adecuado, asegurando claridad en cada detalle y construyendo estrategias que
                        protejan su futuro y el de su familia.
                    </p>

                    <ul className={styles.palomas}>
                        {palomasAgentes.map((paloma) => (
                            <li key={paloma.id} className={styles.paloma}>
                                <span aria-hidden="true"><IconoCheck className={styles.check} /></span>

                                <p>{paloma.texto}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </main>
    );
}

export default AgentePage;
