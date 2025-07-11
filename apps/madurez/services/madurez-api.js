// Servicio API específico para el módulo de Madurez
export class MadurezApiService {
    constructor(baseApiService) {
        this.api = baseApiService;
    }
    
    // Templates
    async getTemplates() {
        return await this.api.get('/madurez/templates');
    }
    
    async getTemplate(templateId) {
        return await this.api.get(`/madurez/templates/${templateId}`);
    }
    
    // Assessments
    async getAssessments(filtros = {}) {
        const params = new URLSearchParams(filtros);
        return await this.api.get(`/madurez/assessments?${params}`);
    }
    
    async getAssessment(assessmentId) {
        return await this.api.get(`/madurez/assessments/${assessmentId}`);
    }
    
    async createAssessment(data) {
        return await this.api.post('/madurez/assessments', data);
    }
    
    async updateAssessment(assessmentId, data) {
        return await this.api.put(`/madurez/assessments/${assessmentId}`, data);
    }
    
    async completeAssessment(assessmentId, respuestas) {
        return await this.api.post(`/madurez/assessments/${assessmentId}/complete`, { respuestas });
    }
    
    async signAssessment(assessmentId, firmante) {
        return await this.api.post(`/madurez/assessments/${assessmentId}/sign`, { firmante });
    }
    
    // Dashboard y visualizaciones
    async getDashboardData(assessmentId) {
        return await this.api.get(`/madurez/dashboard/${assessmentId}`);
    }
    
    async getHistory() {
        return await this.api.get('/madurez/history');
    }
    
    // Utilidades
    async exportResults(assessmentId, format = 'pdf') {
        // TODO: Implementar exportación de resultados
        throw new Error('Exportación en desarrollo');
    }
    
    async compareAssessments(assessmentIds) {
        // TODO: Implementar comparación entre evaluaciones
        throw new Error('Comparación en desarrollo');
    }
}