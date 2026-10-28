import type { NavItem } from '../../types/navigation';

export const navbarMenu: NavItem[] = [
    {
        id: 'inicio',
        to: '/',
        label: 'Inicio',
        title: 'Ir al inicio',
        dataLink: 'navbar-inicio-link',
        type: 'route',
    },
    {
        id: 'nosotros',
        to: '/nosotros',
        label: 'Nosotros',
        title: 'Conoce Vitamet',
        dataLink: 'navbar-nosotros-link',
        type: 'route',
    },
    {
        id: 'servicios',
        to: '/servicios',
        label: 'Servicios',
        title: 'Conoce los servicios de Vitamet',
        dataLink: 'navbar-servicios-link',
        type: 'route',
    },
    {
        id: 'blog',
        to: '/blog',
        label: 'Blog',
        title: 'Lee nuestros artículos',
        dataLink: 'navbar-blog-link',
        type: 'route',
    },
    {
        id: 'contacto',
        to: '/contacto',
        label: 'Contacto',
        title: 'Contactate con Vitamet',
        dataLink: 'navbar-contacto-link',
        type: 'route',
    },
];
