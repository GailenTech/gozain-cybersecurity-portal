/**
 * Servicio de Notificaciones Común
 * Gestiona las notificaciones toast para todas las aplicaciones
 */
export class NotificationService {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.toastContainer = null;
        this.toastCounter = 0;
        this.initializeContainer();
    }

    /**
     * Inicializa el contenedor de toast si no existe
     */
    initializeContainer() {
        if (!this.toastContainer) {
            this.toastContainer = document.getElementById('toast-container');
            if (!this.toastContainer) {
                this.toastContainer = document.createElement('div');
                this.toastContainer.id = 'toast-container';
                this.toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
                this.toastContainer.style.zIndex = '9999';
                document.body.appendChild(this.toastContainer);
            }
        }
    }

    /**
     * Muestra un toast de éxito
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en ms (default: 3000)
     */
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    /**
     * Muestra un toast de error
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en ms (default: 5000)
     */
    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    }

    /**
     * Muestra un toast de información
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en ms (default: 3000)
     */
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }

    /**
     * Muestra un toast de advertencia
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en ms (default: 4000)
     */
    warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
    }

    /**
     * Muestra un toast con tipo personalizado
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de toast ('success', 'error', 'info', 'warning')
     * @param {number} duration - Duración en ms
     */
    show(message, type = 'info', duration = 3000) {
        this.initializeContainer();
        
        const toastId = `toast-${++this.toastCounter}`;
        const toast = this.createToastElement(toastId, message, type);
        
        this.toastContainer.appendChild(toast);
        
        // Crear el toast de Bootstrap
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: duration
        });
        
        // Mostrar el toast
        bsToast.show();
        
        // Remover el elemento del DOM después de ocultarse
        toast.addEventListener('hidden.bs.toast', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    /**
     * Crea el elemento HTML del toast
     * @param {string} id - ID único del toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de toast
     * @returns {HTMLElement} Elemento DOM del toast
     */
    createToastElement(id, message, type) {
        const iconMap = {
            'success': 'bi-check-circle-fill',
            'error': 'bi-x-circle-fill',
            'info': 'bi-info-circle-fill',
            'warning': 'bi-exclamation-triangle-fill'
        };

        const colorMap = {
            'success': 'text-success',
            'error': 'text-danger',
            'info': 'text-info',
            'warning': 'text-warning'
        };

        const bgMap = {
            'success': 'bg-success',
            'error': 'bg-danger',
            'info': 'bg-info',
            'warning': 'bg-warning'
        };

        const toastElement = document.createElement('div');
        toastElement.className = 'toast';
        toastElement.id = id;
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', 'assertive');
        toastElement.setAttribute('aria-atomic', 'true');

        toastElement.innerHTML = `
            <div class="toast-header ${bgMap[type]} text-white">
                <i class="bi ${iconMap[type]} me-2"></i>
                <strong class="me-auto">${this.getTypeLabel(type)}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

        return toastElement;
    }

    /**
     * Obtiene la etiqueta del tipo de toast
     * @param {string} type - Tipo de toast
     * @returns {string} Etiqueta localizada
     */
    getTypeLabel(type) {
        const labels = {
            'success': 'Éxito',
            'error': 'Error',
            'info': 'Información',
            'warning': 'Advertencia'
        };
        return labels[type] || 'Notificación';
    }

    /**
     * Emite un evento de toast através del EventBus
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de toast
     * @param {number} duration - Duración en ms
     */
    emit(message, type = 'info', duration = 3000) {
        if (this.eventBus) {
            this.eventBus.emit('shell:showToast', {
                message,
                type,
                duration
            });
        }
    }
}

// Función helper para crear la instancia del servicio
export function createNotificationService(eventBus) {
    return new NotificationService(eventBus);
}