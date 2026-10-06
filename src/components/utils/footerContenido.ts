import type { NavItem } from '../../types/navigation';

export const enlacesRapidos: NavItem[] = [
    {
        id: 'nosotros',
        to: '/nosotros',
        label: '¿Quiénes somos?',
        title: 'Conoce mas sobre nosotros',
        dataLink: 'footer-nosotros-link',
        type: 'route',
    },
    {
        id: 'servicios',
        to: '/servicios',
        label: 'Nuestros Servicios',
        title: 'Conoce los servicios de Vitamet',
        dataLink: 'footer-servicios-link',
        type: 'route',
    },
    {
        id: 'bolsa',
        to: '/recluta',
        label: 'Bolsa de Trabajo',
        title: 'Conoce las oportunidades de trabajo en Vitamet',
        dataLink: 'footer-bolsa-link',
        type: 'route',
    },
    {
        id: 'blog',
        to: '/blog',
        label: 'Blog',
        title: 'Lee nuestros artículos',
        dataLink: 'footer-blog-link',
        type: 'route',
    },
    {
        id: 'contacto',
        to: '/contacto',
        label: 'Contacto',
        title: 'Contactate con Vitamet',
        dataCta: 'footer-contacto-link',
        type: 'route',
    },
];

export const legal: NavItem[] = [
    {
        id: 'privacidad',
        to: '/politica-privacidad',
        label: 'Aviso de Privacidad',
        title: 'Ver el aviso de privacidad',
        dataLink: 'footer-privacidad-link',
        type: 'route',
    },
    {
        id: 'terminos',
        to: '/terminos-condiciones',
        label: 'Términos de Servicio',
        title: 'Conoce los terminos y condiciones de Vitamet',
        dataLink: 'footer-terminos-link',
        type: 'route',
    },
    {
        id: 'sostenibilidad',
        to: '/sostenibilidad',
        label: 'Sostenibilidad',
        title: 'Enterate de la sostenibilidad que ofrece Vitamet',
        dataLink: 'footer-sostenibilidad-link',
        type: 'route',
    },
    {
        id: 'carrera',
        to: '/carrera',
        label: 'Portal de Carrera Global',
        title: 'Mira nuestro portal de carreras globales',
        dataLink: 'footer-carrera-link',
        type: 'route',
    },
];
