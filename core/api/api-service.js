// Servicio unificado de API
export class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.headers = {
            'Content-Type': 'application/json'
        };
    }
    
    setOrganization(orgId) {
        this.headers['X-Organization-Id'] = orgId;
    }
    
    async request(method, endpoint, data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: { ...this.headers }
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(error.message || `Error ${response.status}`);
            }
            
            // Algunos endpoints no devuelven JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
            
        } catch (error) {
            console.error(`API Error (${method} ${endpoint}):`, error);
            throw error;
        }
    }
    
    get(endpoint) {
        return this.request('GET', endpoint);
    }
    
    post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }
    
    put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    }
    
    delete(endpoint) {
        return this.request('DELETE', endpoint);
    }
    
    // Método para subir archivos
    async upload(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Agregar datos adicionales
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'X-Organization-Id': this.headers['X-Organization-Id']
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `Error ${response.status}`);
        }
        
        return await response.json();
    }
}