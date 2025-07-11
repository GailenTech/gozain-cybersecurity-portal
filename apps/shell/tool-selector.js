// Selector de Herramientas
export default class ToolSelector {
    constructor(container, tools, onToolSelect) {
        this.container = container;
        this.tools = tools;
        this.onToolSelect = onToolSelect;
    }
    
    render() {
        const html = `
            <div class="tool-selector-container">
                <div class="text-center mb-5">
                    <h1 class="display-4 mb-3">Portal de Ciberseguridad</h1>
                    <p class="lead text-muted">Seleccione una herramienta para comenzar</p>
                </div>
                
                <div class="tools-grid">
                    ${this.tools.map(tool => this.renderToolCard(tool)).join('')}
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        this.setupEventListeners();
    }
    
    renderToolCard(tool) {
        // Determinar el color según el módulo
        const colors = {
            'inventario': 'primary',
            'impactos': 'warning',
            'madurez': 'info'
        };
        
        const color = colors[tool.id] || 'secondary';
        const iconClass = tool.config?.icon || 'bi-box';
        
        return `
            <div class="tool-card" data-tool-id="${tool.id}">
                <div class="tool-card-inner bg-${color} bg-gradient">
                    <div class="tool-icon">
                        <i class="${iconClass}"></i>
                    </div>
                    <h3 class="tool-name">${tool.config?.name || tool.name}</h3>
                    <p class="tool-description">${tool.config?.description || ''}</p>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        this.container.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', () => {
                const toolId = card.dataset.toolId;
                const tool = this.tools.find(t => t.id === toolId);
                if (tool && this.onToolSelect) {
                    this.onToolSelect(tool);
                }
            });
        });
    }
}