/**
 * Página de Reportes
 */
export const ReportesPage = {
    name: 'ReportesPage',
    
    render() {
        const { h } = window.Vue;
        
        return h('div', { class: 'p-4' }, [
            h('h2', { class: 'mb-4' }, 'Reportes'),
            h('div', { class: 'alert alert-info' }, [
                h('i', { class: 'bi bi-info-circle me-2' }),
                'Módulo de reportes en desarrollo'
            ])
        ]);
    }
};