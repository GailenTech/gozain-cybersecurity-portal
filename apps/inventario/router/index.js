/**
 * Vue Router configuración para el módulo de inventario
 */
import { DashboardPage } from '../pages/DashboardPage.js';
import { InventarioPage } from '../pages/InventarioPage.js';
import { ReportesPage } from '../pages/ReportesPage.js';
import { AuditoriaPage } from '../pages/AuditoriaPage.js';

export function createInventarioRouter() {
    const { createRouter, createWebHashHistory } = window.VueRouter;
    
    const routes = [
        {
            path: '/',
            redirect: '/dashboard'
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: DashboardPage
        },
        {
            path: '/inventario',
            name: 'inventario',
            component: InventarioPage
        },
        {
            path: '/reportes',
            name: 'reportes',
            component: ReportesPage
        },
        {
            path: '/auditoria',
            name: 'auditoria',
            component: AuditoriaPage
        }
    ];
    
    const router = createRouter({
        history: createWebHashHistory(),
        routes
    });
    
    // Manejar la ruta inicial si viene con hash específico
    router.isReady().then(() => {
        const currentHash = window.location.hash;
        if (currentHash && currentHash !== '#/') {
            // La ruta ya está en el hash, el router la manejará automáticamente
            console.log('Initial route from hash:', currentHash);
        } else {
            // Verificar si hay una ruta guardada
            const lastRouteStr = localStorage.getItem('gozain_last_route');
            if (lastRouteStr) {
                try {
                    const lastRoute = JSON.parse(lastRouteStr);
                    if (lastRoute.module === 'inventario' && lastRoute.path) {
                        // Navegar a la última ruta visitada
                        const path = lastRoute.path.replace('#', '');
                        if (path && path !== '/') {
                            router.push(path);
                        }
                    }
                } catch (e) {
                    console.error('Error restaurando ruta del módulo:', e);
                }
            }
        }
    });
    
    return router;
}