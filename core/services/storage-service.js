// Servicio de almacenamiento local
export class StorageService {
    constructor() {
        this.prefix = 'gozain_';
    }
    
    set(key, value) {
        try {
            const data = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, data);
        } catch (error) {
            console.error('Error guardando en storage:', error);
        }
    }
    
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error leyendo de storage:', error);
            return defaultValue;
        }
    }
    
    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }
    
    clear() {
        // Limpiar solo las claves de gozain
        Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .forEach(key => localStorage.removeItem(key));
    }
    
    // Métodos específicos para sesión
    setSession(key, value) {
        try {
            const data = JSON.stringify(value);
            sessionStorage.setItem(this.prefix + key, data);
        } catch (error) {
            console.error('Error guardando en session:', error);
        }
    }
    
    getSession(key, defaultValue = null) {
        try {
            const data = sessionStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error leyendo de session:', error);
            return defaultValue;
        }
    }
}