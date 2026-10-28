import type { MouseEvent } from 'react';
import { useLocation } from 'react-router-dom';

import { useNavActions } from '../../hooks/useNavActions';

import { SmartLink } from '../../utils/SmartLink';

import type { NavItem } from '../../types/navigation';

interface NavItemsProps {
    item: NavItem;
    dataLink?: string;
    dataCta?: string;
    onAfterNavigate?: () => void;
}

export const NavItems = ({ item, onAfterNavigate }: NavItemsProps) => {
    const { handleNavigation, isAnchorActive } = useNavActions();
    const { pathname } = useLocation();

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        handleNavigation(e, item);
        onAfterNavigate?.();
    };

    const commonProps = {
        title: item.title,
        ...(item.dataLink && { dataLink: item.dataLink }),
        ...(item.dataCta && { dataCta: item.dataCta }),
        onClick: handleClick,
    };

    if (item.type === 'anchor') {
        return (
            <a
                href={item.to}
                data-tracking-url={pathname === '/' ? item.to : `/${item.to}`}
                /* activar solo si todas las rutas son anchors */
                /* className={isAnchorActive(item) ? 'active' : ''} */
                aria-current={isAnchorActive(item) ? 'page' : undefined}
                title={item.title}
                onClick={handleClick}
                data-cta={item.dataCta}
                data-link={!item.dataCta ? item.dataLink : undefined}
            >
                {item.label}
            </a>
        );
    }

    return (
        <SmartLink to={item.to} {...commonProps}>
            {item.label}
        </SmartLink>
    );
};
