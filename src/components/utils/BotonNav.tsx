import { useLocation, useNavigate } from 'react-router-dom';

interface BotonNavProps {
    to: string;
    children: React.ReactNode;
    ariaLabel?: string;
    className?: string;
    title?: string;
    dataCta?: string;
    dataLink?: string;
}

export const BotonNav = ({ to, ariaLabel, className, title, children, dataCta, dataLink }: BotonNavProps) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        const esAncla = to.startsWith('#');
        const idDestino = to.replace('#', '');

        if (location.pathname === '/' && esAncla) {
            const targetElement = document.getElementById(idDestino);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth',
                });
            }
        } else if (esAncla) {
            navigate(`/#${idDestino}`);
        } else {
            navigate(to);
        }
    };

    return (
        <button
            onClick={handleClick}
            data-tracking-url={to.startsWith('#') && location.pathname !== '/' ? `/${to}` : to}
            className={className}
            title={title}
            aria-label={ariaLabel}
            {...(dataCta ? { 'data-cta': dataCta } : {})}
            {...(!dataCta && dataLink ? { 'data-link': dataLink } : {})}
        >
            {children}
        </button>
    );
};
