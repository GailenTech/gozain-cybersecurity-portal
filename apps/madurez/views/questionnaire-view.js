// Vista del Cuestionario de Madurez
export default class QuestionnaireView {
    constructor(container, apiService) {
        this.container = container;
        this.api = apiService;
        this.assessment = null;
        this.template = null;
        this.respuestas = {};
        this.dominioActual = 0;
    }
    
    async render(assessmentId) {
        try {
            // Cargar assessment y template
            this.assessment = await this.api.get(`/madurez/assessments/${assessmentId}`);
            this.template = await this.api.get(`/madurez/templates/${this.assessment.cuestionario_id}`);
            
            // Verificar que esté abierto
            if (this.assessment.estado !== 'abierto') {
                throw new Error('Esta evaluación ya fue completada');
            }
            
            // Renderizar la interfaz del cuestionario
            this.renderQuestionnaire();
            
        } catch (error) {
            console.error('Error cargando cuestionario:', error);
            this.container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-circle"></i> 
                    Error: ${error.message}
                </div>
            `;
        }
    }
    
    renderQuestionnaire() {
        const dominio = this.template.dominios[this.dominioActual];
        const progreso = Math.round(((this.dominioActual + 1) / this.template.dominios.length) * 100);
        
        this.container.innerHTML = `
            <div class="questionnaire-view fade-in">
                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 class="mb-0">
                            <i class="bi bi-clipboard-check text-primary"></i>
                            ${this.assessment.nombre}
                        </h4>
                        <small class="text-muted">Evaluación de Madurez en Ciberseguridad</small>
                    </div>
                    <button class="btn btn-outline-secondary" id="btnVolver">
                        <i class="bi bi-arrow-left"></i> Volver
                    </button>
                </div>
                
                <!-- Progreso -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0">Dominio ${this.dominioActual + 1} de ${this.template.dominios.length}</h6>
                            <span class="badge bg-primary">${progreso}%</span>
                        </div>
                        <div class="progress mb-2">
                            <div class="progress-bar" style="width: ${progreso}%"></div>
                        </div>
                        <div class="row">
                            ${this.template.dominios.map((d, i) => `
                                <div class="col-auto">
                                    <span class="badge ${i === this.dominioActual ? 'bg-primary' : i < this.dominioActual ? 'bg-success' : 'bg-light text-dark'}">
                                        ${i + 1}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Dominio actual -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-shield-check"></i>
                            ${dominio.nombre}
                        </h5>
                        <p class="text-muted mb-0">${dominio.descripcion}</p>
                    </div>
                    <div class="card-body">
                        <div id="preguntasContainer">
                            ${this.renderPreguntas(dominio)}
                        </div>
                    </div>
                </div>
                
                <!-- Navegación -->
                <div class="d-flex justify-content-between">
                    <button class="btn btn-outline-secondary" id="btnAnterior" 
                            ${this.dominioActual === 0 ? 'disabled' : ''}>
                        <i class="bi bi-chevron-left"></i> Anterior
                    </button>
                    
                    <div class="btn-group">
                        <button class="btn btn-outline-primary" id="btnGuardarBorrador">
                            <i class="bi bi-save"></i> Guardar Borrador
                        </button>
                        ${this.dominioActual === this.template.dominios.length - 1 ? 
                            `<button class="btn btn-success" id="btnFinalizar">
                                <i class="bi bi-check-circle"></i> Finalizar Evaluación
                            </button>` :
                            `<button class="btn btn-primary" id="btnSiguiente">
                                Siguiente <i class="bi bi-chevron-right"></i>
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `;
        
        // Configurar navegación cada vez que se renderiza
        this.setupNavigation();
    }
    
    renderPreguntas(dominio) {
        return dominio.preguntas.map(pregunta => `
            <div class="pregunta-container mb-4" data-pregunta-id="${pregunta.id}">
                <div class="row">
                    <div class="col-md-8">
                        <h6 class="pregunta-texto">${pregunta.texto}</h6>
                    </div>
                    <div class="col-md-4">
                        <div class="respuesta-opciones">
                            ${pregunta.opciones.map((opcion, index) => `
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" 
                                           name="pregunta_${pregunta.id}" 
                                           value="${pregunta.valores[index]}"
                                           id="opcion_${pregunta.id}_${index}"
                                           ${this.respuestas[pregunta.id]?.valor === pregunta.valores[index] ? 'checked' : ''}>
                                    <label class="form-check-label" for="opcion_${pregunta.id}_${index}">
                                        <span class="badge bg-${this.getScoreBadgeClass(pregunta.valores[index])} me-2">
                                            ${pregunta.valores[index]}
                                        </span>
                                        ${opcion}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="row mt-2">
                    <div class="col-12">
                        <div class="form-floating">
                            <textarea class="form-control comentario-input" 
                                      placeholder="Comentario opcional..."
                                      id="comentario_${pregunta.id}"
                                      style="height: 60px">${this.respuestas[pregunta.id]?.comentario || ''}</textarea>
                            <label for="comentario_${pregunta.id}">Comentario (opcional)</label>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    getScoreBadgeClass(valor) {
        switch(valor) {
            case 1: return 'danger';
            case 2: return 'warning';
            case 3: return 'success';
            case 4: return 'primary';
            default: return 'secondary';
        }
    }
    
    setupNavigation() {
        // Volver
        this.container.querySelector('#btnVolver').addEventListener('click', () => {
            this.volverALista();
        });
        
        // Navegación entre dominios
        const btnAnterior = this.container.querySelector('#btnAnterior');
        if (btnAnterior) {
            btnAnterior.addEventListener('click', () => {
                this.guardarRespuestasDominio();
                this.dominioActual--;
                this.renderQuestionnaire();
            });
        }
        
        const btnSiguiente = this.container.querySelector('#btnSiguiente');
        if (btnSiguiente) {
            btnSiguiente.addEventListener('click', () => {
                if (this.validarDominioActual()) {
                    this.guardarRespuestasDominio();
                    this.dominioActual++;
                    this.renderQuestionnaire();
                }
            });
        }
        
        // Finalizar
        const btnFinalizar = this.container.querySelector('#btnFinalizar');
        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', () => {
                this.finalizarEvaluacion();
            });
        }
        
        // Guardar borrador
        this.container.querySelector('#btnGuardarBorrador').addEventListener('click', () => {
            this.guardarBorrador();
        });
        
        // Listeners para cambios en respuestas
        this.container.querySelectorAll('input[type="radio"]').forEach(input => {
            input.addEventListener('change', () => {
                this.guardarRespuestasDominio();
            });
        });
        
        this.container.querySelectorAll('.comentario-input').forEach(textarea => {
            textarea.addEventListener('blur', () => {
                this.guardarRespuestasDominio();
            });
        });
    }
    
    validarDominioActual() {
        const dominio = this.template.dominios[this.dominioActual];
        let todasRespondidas = true;
        
        dominio.preguntas.forEach(pregunta => {
            const respuesta = this.container.querySelector(`input[name="pregunta_${pregunta.id}"]:checked`);
            if (!respuesta) {
                todasRespondidas = false;
            }
        });
        
        if (!todasRespondidas) {
            this.mostrarError('Por favor responde todas las preguntas antes de continuar');
            return false;
        }
        
        return true;
    }
    
    guardarRespuestasDominio() {
        const dominio = this.template.dominios[this.dominioActual];
        
        dominio.preguntas.forEach(pregunta => {
            const inputRespuesta = this.container.querySelector(`input[name="pregunta_${pregunta.id}"]:checked`);
            const comentario = this.container.querySelector(`#comentario_${pregunta.id}`);
            
            if (inputRespuesta) {
                const opcionSeleccionada = pregunta.opciones[pregunta.valores.indexOf(parseInt(inputRespuesta.value))];
                
                this.respuestas[pregunta.id] = {
                    valor: parseInt(inputRespuesta.value),
                    respuesta: opcionSeleccionada,
                    comentario: comentario ? comentario.value : ''
                };
            }
        });
    }
    
    async guardarBorrador() {
        try {
            this.guardarRespuestasDominio();
            
            // Guardar estado actual (opcional: podríamos implementar esto en el backend)
            localStorage.setItem(`assessment_draft_${this.assessment.id}`, JSON.stringify({
                respuestas: this.respuestas,
                dominioActual: this.dominioActual
            }));
            
            this.mostrarExito('Borrador guardado correctamente');
            
        } catch (error) {
            console.error('Error guardando borrador:', error);
            this.mostrarError('Error al guardar el borrador');
        }
    }
    
    async finalizarEvaluacion() {
        if (!this.validarDominioActual()) {
            return;
        }
        
        this.guardarRespuestasDominio();
        
        // Validar que todas las preguntas estén respondidas
        const totalPreguntas = this.template.dominios.reduce((acc, d) => acc + d.preguntas.length, 0);
        const preguntasRespondidas = Object.keys(this.respuestas).length;
        
        if (preguntasRespondidas < totalPreguntas) {
            this.mostrarError('Faltan preguntas por responder. Por favor completa toda la evaluación.');
            return;
        }
        
        if (!confirm('¿Está seguro de finalizar la evaluación? Una vez finalizada no podrá modificar las respuestas.')) {
            return;
        }
        
        try {
            await this.api.post(`/madurez/assessments/${this.assessment.id}/complete`, {
                respuestas: this.respuestas
            });
            
            // Limpiar borrador
            localStorage.removeItem(`assessment_draft_${this.assessment.id}`);
            
            this.mostrarExito('Evaluación completada correctamente');
            
            // Volver a la lista después de un momento
            setTimeout(() => {
                this.volverALista();
            }, 2000);
            
        } catch (error) {
            console.error('Error finalizando evaluación:', error);
            this.mostrarError('Error al finalizar la evaluación');
        }
    }
    
    volverALista() {
        // Retornar a la aplicación principal
        if (window.gozainApp && window.gozainApp.navigation) {
            const app = window.gozainApp.navigation.getCurrentApp();
            if (app && typeof app.mostrarVistaLista === 'function') {
                app.mostrarVistaLista();
            }
        }
    }
    
    cargarBorrador() {
        const borrador = localStorage.getItem(`assessment_draft_${this.assessment.id}`);
        if (borrador) {
            try {
                const data = JSON.parse(borrador);
                this.respuestas = data.respuestas || {};
                this.dominioActual = data.dominioActual || 0;
            } catch (error) {
                console.error('Error cargando borrador:', error);
            }
        }
    }
    
    mostrarExito(mensaje) {
        this.mostrarToast(mensaje, 'success');
    }
    
    mostrarError(mensaje) {
        this.mostrarToast(mensaje, 'error');
    }
    
    mostrarToast(mensaje, tipo = 'success') {
        const iconos = {
            success: 'bi-check-circle',
            error: 'bi-exclamation-circle',
            info: 'bi-info-circle',
            warning: 'bi-exclamation-triangle'
        };
        const clases = {
            success: 'text-bg-success',
            error: 'text-bg-danger',
            info: 'text-bg-info',
            warning: 'text-bg-warning'
        };
        
        const html = `
            <div class="toast align-items-center ${clases[tipo]} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="${iconos[tipo]} me-2"></i>${mensaje}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        // Crear contenedor si no existe
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(container);
        }
        
        // Agregar toast
        container.insertAdjacentHTML('beforeend', html);
        const toast = container.lastElementChild;
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Eliminar después de ocultar
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}