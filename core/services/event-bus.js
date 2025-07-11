// Sistema de eventos para comunicación entre módulos
export class EventBus {
    constructor() {
        this.events = {};
        this.eventHistory = [];
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        
        // Retornar función para desuscribirse
        return () => {
            this.off(event, callback);
        };
    }
    
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, data) {
        // Guardar en historial
        this.eventHistory.push({
            event,
            data,
            timestamp: new Date()
        });
        
        // Limitar historial a últimos 100 eventos
        if (this.eventHistory.length > 100) {
            this.eventHistory.shift();
        }
        
        // Ejecutar callbacks
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en callback de evento ${event}:`, error);
                }
            });
        }
    }
    
    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }
    
    getHistory(event = null) {
        if (event) {
            return this.eventHistory.filter(e => e.event === event);
        }
        return this.eventHistory;
    }
    
    clear() {
        this.events = {};
        this.eventHistory = [];
    }
}