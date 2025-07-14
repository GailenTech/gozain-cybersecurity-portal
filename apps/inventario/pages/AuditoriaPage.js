/**
 * Página de Auditoría
 */
export const AuditoriaPage = {
    name: 'AuditoriaPage',
    
    render() {
        const { h } = window.Vue;
        
        return h('div', { class: 'p-4' }, [
            h('h2', { class: 'mb-4' }, 'Auditoría'),
            h('div', { class: 'alert alert-info' }, [
                h('i', { class: 'bi bi-info-circle me-2' }),
                'Módulo de auditoría en desarrollo'
            ])
        ]);
    }
};