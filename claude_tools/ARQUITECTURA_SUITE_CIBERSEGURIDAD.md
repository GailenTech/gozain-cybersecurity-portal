# Arquitectura de Suite de Ciberseguridad - Micro-frontends

## Visión General

Suite integrada de soluciones orientadas a la ciberseguridad para digitalizar procesos asociados a la seguridad de la información, cumplimiento normativo y gestión de riesgos.

## Opciones de Arquitectura

### Opción 1: Arquitectura de Micro-frontends

Cada aplicación es un módulo independiente que se carga bajo demanda:

```
cyber-suite/
├── core/                    # Núcleo compartido
│   ├── auth/               # Autenticación común
│   ├── navigation/         # Shell de navegación
│   ├── shared-components/  # Componentes reutilizables
│   └── services/           # APIs compartidas
│
├── apps/
│   ├── inventario/         # App de inventario ISO 27001
│   ├── impactos/          # App de impactos de negocio
│   ├── vulnerabilidades/   # Nueva app de gestión de vulns
│   ├── incidentes/        # App de respuesta a incidentes
│   └── compliance/        # App de cumplimiento normativo
│
└── shell/                  # Aplicación contenedora
    └── index.html         # Punto de entrada único
```

#### Implementación con Module Federation:

```javascript
// shell/config.js
const apps = {
    inventario: {
        name: 'Inventario ISO 27001',
        icon: 'bi-box-seam',
        path: '/inventario',
        module: () => import('../apps/inventario/main.js'),
        permissions: ['inventory.view']
    },
    impactos: {
        name: 'Impactos de Negocio',
        icon: 'bi-lightning-charge',
        path: '/impactos',
        module: () => import('../apps/impactos/main.js'),
        permissions: ['impacts.view']
    },
    vulnerabilidades: {
        name: 'Gestión de Vulnerabilidades',
        icon: 'bi-shield-exclamation',
        path: '/vulnerabilidades',
        module: () => import('../apps/vulnerabilidades/main.js'),
        permissions: ['vulns.view']
    }
};
```

### Opción 2: Arquitectura de Plugins

Sistema donde cada aplicación es un plugin que se registra dinámicamente:

```javascript
// core/plugin-system.js
class CyberSuiteCore {
    constructor() {
        this.plugins = new Map();
        this.navigation = new NavigationManager();
        this.auth = new AuthManager();
        this.api = new APIManager();
    }
    
    registerPlugin(plugin) {
        // Validar que implemente la interfaz requerida
        if (!plugin.id || !plugin.routes || !plugin.initialize) {
            throw new Error('Plugin inválido');
        }
        
        this.plugins.set(plugin.id, plugin);
        
        // Registrar rutas
        plugin.routes.forEach(route => {
            this.navigation.addRoute(route);
        });
        
        // Agregar al menú
        this.navigation.addMenuItem({
            id: plugin.id,
            name: plugin.name,
            icon: plugin.icon,
            path: plugin.basePath
        });
    }
}

// apps/vulnerabilidades/plugin.js
export default {
    id: 'vulnerabilidades',
    name: 'Gestión de Vulnerabilidades',
    icon: 'bi-shield-exclamation',
    basePath: '/vulnerabilidades',
    routes: [
        { path: '/vulnerabilidades', component: DashboardVulns },
        { path: '/vulnerabilidades/scan', component: ScanView },
        { path: '/vulnerabilidades/:id', component: VulnDetail }
    ],
    
    initialize(core) {
        // Acceso a servicios compartidos
        this.api = core.api;
        this.auth = core.auth;
        
        // Registrar endpoints específicos
        this.api.registerEndpoint('/api/vulns', VulnsAPI);
    }
};
```

### Opción 3: Monorepo con Workspaces

Estructura todo como un monorepo con espacios de trabajo independientes:

```yaml
# pnpm-workspace.yaml o lerna.json
packages:
  - 'packages/core'
  - 'packages/shared'
  - 'apps/*'
```

```json
// apps/inventario/package.json
{
  "name": "@cybersuite/inventario",
  "dependencies": {
    "@cybersuite/core": "workspace:*",
    "@cybersuite/shared": "workspace:*"
  }
}
```

## Arquitectura Propuesta (Híbrida)

Combinación práctica y escalable de las opciones anteriores:

### 1. Estructura de Proyecto

```
cybersuite/
├── docker-compose.yml       # Para desarrollo local
├── deploy/                  # Scripts de despliegue
│
├── core/                    # Paquete npm compartido
│   ├── auth/               # Autenticación y autorización
│   ├── api/                # Cliente API común
│   ├── components/         # Componentes UI compartidos
│   ├── navigation/         # Sistema de navegación
│   └── utils/              # Utilidades comunes
│
├── apps/
│   ├── shell/              # App contenedora
│   │   ├── index.html
│   │   ├── app.js         # Carga y orquesta los módulos
│   │   └── router.js      # Enrutamiento principal
│   │
│   ├── inventario/         # App actual de inventario
│   │   ├── package.json
│   │   ├── src/
│   │   └── manifest.json   # Metadatos del módulo
│   │
│   ├── impactos/
│   │   ├── package.json
│   │   ├── src/
│   │   └── manifest.json
│   │
│   └── vulnerabilidades/   # Nueva app
│       ├── package.json
│       ├── src/
│       └── manifest.json
│
└── services/               # Microservicios backend (opcional)
    ├── auth-service/
    ├── inventory-service/
    └── vulnerability-service/
```

### 2. Manifest de Cada App

```json
// apps/vulnerabilidades/manifest.json
{
  "id": "vulnerabilidades",
  "name": "Gestión de Vulnerabilidades",
  "version": "1.0.0",
  "description": "Gestión integral de vulnerabilidades y análisis de riesgos",
  "icon": "bi-shield-exclamation",
  "color": "#dc3545",
  "permissions": ["vulns.view", "vulns.edit", "vulns.scan"],
  "navigation": {
    "main": {
      "path": "/vulnerabilidades",
      "label": "Vulnerabilidades",
      "badge": "getBadgeCount"  // Función que retorna número de vulns críticas
    },
    "submenu": [
      { "path": "/vulnerabilidades/dashboard", "label": "Dashboard" },
      { "path": "/vulnerabilidades/scan", "label": "Escanear" },
      { "path": "/vulnerabilidades/reportes", "label": "Reportes" }
    ]
  },
  "settings": {
    "scanners": ["nmap", "openvas", "qualys"],
    "severity_levels": ["critical", "high", "medium", "low", "info"]
  }
}
```

### 3. Sistema de Carga Dinámica

```javascript
// shell/app.js
class CyberSuite {
    async loadApp(appId) {
        // Cargar manifest
        const manifest = await fetch(`/apps/${appId}/manifest.json`).then(r => r.json());
        
        // Verificar permisos
        if (!this.auth.hasPermissions(manifest.permissions)) {
            throw new Error('Sin permisos para esta aplicación');
        }
        
        // Cargar módulo
        const module = await import(`/apps/${appId}/index.js`);
        
        // Inicializar
        const app = new module.default({
            core: this.core,
            container: document.getElementById('app-container')
        });
        
        // Registrar en navegación
        this.navigation.registerApp(manifest);
        
        return app;
    }
}
```

### 4. Navegación Unificada

```html
<!-- Shell principal -->
<nav class="cyber-suite-nav">
    <div class="nav-header">
        <h1>CyberSuite</h1>
        <span class="org-name">{{ organization }}</span>
    </div>
    
    <div class="nav-apps">
        <!-- Generado dinámicamente desde los manifests -->
        <a href="/inventario" class="nav-app">
            <i class="bi bi-box-seam"></i>
            <span>Inventario</span>
        </a>
        <a href="/impactos" class="nav-app">
            <i class="bi bi-lightning"></i>
            <span>Impactos</span>
            <span class="badge">3</span>
        </a>
        <a href="/vulnerabilidades" class="nav-app">
            <i class="bi bi-shield-exclamation"></i>
            <span>Vulnerabilidades</span>
            <span class="badge critical">5</span>
        </a>
    </div>
    
    <div class="nav-footer">
        <a href="/settings">Configuración</a>
        <a href="/help">Ayuda</a>
    </div>
</nav>
```

### 5. Servicios Compartidos

```javascript
// core/services/notification.service.js
export class NotificationService {
    notify(app, message, type = 'info') {
        // Notificación en la UI
        this.showToast(message, type);
        
        // Registro en el sistema
        this.api.post('/api/notifications', {
            app: app.id,
            message,
            type,
            timestamp: new Date()
        });
        
        // Actualizar badges si es necesario
        if (type === 'critical') {
            this.navigation.updateBadge(app.id);
        }
    }
}

// core/services/security.service.js
export class SecurityService {
    async scanAsset(assetId) {
        // Servicio compartido para escaneos de seguridad
        const asset = await this.api.get(`/api/assets/${assetId}`);
        const scanResults = await this.performScan(asset);
        
        // Notificar a las apps interesadas
        this.eventBus.emit('asset:scanned', { asset, results: scanResults });
        
        return scanResults;
    }
}
```

### 6. Integración entre Apps

```javascript
// Desde vulnerabilidades, crear un impacto automáticamente
class VulnerabilityManager {
    async createImpactFromVuln(vuln) {
        // Verificar si el módulo de impactos está disponible
        const impactosApp = await this.core.getApp('impactos');
        
        if (impactosApp) {
            // Llamar a la API de impactos
            const impacto = await impactosApp.createImpact({
                tipo: 'vulnerabilidad_critica',
                titulo: `Vulnerabilidad crítica: ${vuln.title}`,
                descripcion: vuln.description,
                activos_afectados: vuln.affected_assets,
                severidad: vuln.severity,
                origen: {
                    app: 'vulnerabilidades',
                    id: vuln.id
                }
            });
            
            // Notificar
            this.core.notify(
                `Impacto creado desde vulnerabilidad ${vuln.id}`,
                'success'
            );
        }
    }
}

// Desde inventario, verificar vulnerabilidades de un activo
class AssetManager {
    async checkVulnerabilities(asset) {
        const vulnsApp = await this.core.getApp('vulnerabilidades');
        
        if (vulnsApp) {
            const vulns = await vulnsApp.getVulnerabilitiesForAsset(asset.id);
            
            // Mostrar indicador en el inventario
            if (vulns.critical > 0) {
                this.showAssetWarning(asset, `${vulns.critical} vulnerabilidades críticas`);
            }
        }
    }
}
```

## Ventajas de esta Arquitectura

1. **Escalabilidad**: Agregar nuevas apps es tan simple como crear una nueva carpeta
2. **Independencia**: Cada app puede tener su propio stack tecnológico
3. **Reutilización**: Componentes y servicios compartidos
4. **Consistencia**: UI y UX unificados
5. **Seguridad**: Control centralizado de permisos
6. **Integración**: Las apps pueden comunicarse entre sí
7. **Despliegue flexible**: Puedes desplegar todas juntas o por separado

## Implementación Gradual

### Fase 1: Estructura Base
- Crear shell y sistema de navegación
- Migrar inventario actual
- Establecer servicios compartidos básicos

### Fase 2: Separación de Módulos
- Extraer impactos como módulo independiente
- Implementar sistema de carga dinámica
- Crear primeros componentes compartidos

### Fase 3: Nuevas Aplicaciones
- Desarrollar app de vulnerabilidades
- Agregar gestión de incidentes
- Implementar módulo de compliance

### Fase 4: Integración Avanzada
- Comunicación entre módulos
- Workflows automatizados
- Dashboard unificado

## Tecnologías Recomendadas

### Stack Base Genérico
- **Build**: Vite o Webpack 5 con Module Federation
- **Framework**: Vue 3, React o framework agnóstico
- **Estado**: Pinia/Vuex o Redux Toolkit
- **Comunicación**: EventBus o RxJS
- **Testing**: Vitest o Jest con Testing Library
- **CI/CD**: GitHub Actions o GitLab CI
- **Monorepo**: pnpm workspaces o Lerna

### Stack Recomendado con Single-spa

Después de evaluar diferentes opciones, la recomendación específica es usar **Single-spa** como framework de micro-frontends por su madurez, flexibilidad y ecosistema establecido.

```json
{
  "architecture": {
    "microFrontends": "single-spa",
    "bundler": "Vite",
    "framework": "Vue 3 (principal) / React (opcional)",
    "state": "Pinia + shared state pattern",
    "communication": "RxJS + EventBus",
    "styling": "CSS Modules + Design Tokens",
    "testing": "Vitest + Playwright",
    "monorepo": "pnpm workspaces"
  }
}
```

#### Ventajas de Single-spa:
1. **Madurez**: Probado en producción por empresas grandes
2. **Framework agnóstico**: Permite mezclar Vue, React, Angular
3. **Lazy loading**: Carga apps solo cuando se necesitan
4. **Ecosistema**: Herramientas como single-spa Inspector
5. **Migración gradual**: Integración con apps existentes

## Consideraciones de Seguridad

1. **Aislamiento**: Cada app ejecuta en su propio contexto
2. **Permisos**: Control granular por módulo y función
3. **Auditoría**: Todas las acciones inter-módulo se registran
4. **Sanitización**: Validación de datos entre módulos
5. **CSP**: Content Security Policy estricta por módulo

## Implementación con Single-spa

### Estructura del Proyecto

```bash
cybersuite/
├── packages/
│   ├── root-config/          # Aplicación root de single-spa
│   │   ├── src/
│   │   │   ├── index.html
│   │   │   ├── root-config.js
│   │   │   └── index.js
│   │   └── package.json
│   │
│   ├── shared/               # Dependencias y utilidades compartidas
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── api/
│   │   │   ├── utils/
│   │   │   └── event-bus.js
│   │   └── package.json
│   │
│   └── ui-kit/               # Sistema de diseño compartido
│       ├── src/
│       │   ├── components/
│       │   ├── tokens/
│       │   └── styles/
│       └── package.json
│
├── apps/
│   ├── inventario/           # Aplicación Vue 3
│   │   ├── src/
│   │   │   ├── main.js
│   │   │   └── set-public-path.js
│   │   ├── vite.config.js
│   │   └── package.json
│   │
│   ├── impactos/            # Aplicación Vue 3
│   │   └── ...
│   │
│   └── vulnerabilities/     # Aplicación React (ejemplo)
│       └── ...
│
├── pnpm-workspace.yaml
└── package.json
```

### Configuración Root (Shell)

```javascript
// packages/root-config/src/root-config.js
import { registerApplication, start } from 'single-spa';
import { constructApplications, constructRoutes, constructLayoutEngine } from 'single-spa-layout';

// Definir rutas y aplicaciones
const routes = constructRoutes(document.querySelector('#single-spa-layout'));
const applications = constructApplications({
  routes,
  loadApp({ name }) {
    return System.import(name);
  },
});

// Configuración de aplicaciones
const apps = [
  {
    name: '@cybersuite/inventario',
    app: () => System.import('@cybersuite/inventario'),
    activeWhen: ['/inventario'],
    customProps: {
      authService: () => import('@cybersuite/shared').then(m => m.authService),
      eventBus: () => import('@cybersuite/shared').then(m => m.eventBus),
    }
  },
  {
    name: '@cybersuite/impactos',
    app: () => System.import('@cybersuite/impactos'),
    activeWhen: ['/impactos'],
    customProps: {
      authService: () => import('@cybersuite/shared').then(m => m.authService),
      eventBus: () => import('@cybersuite/shared').then(m => m.eventBus),
    }
  },
  {
    name: '@cybersuite/vulnerabilities',
    app: () => System.import('@cybersuite/vulnerabilities'),
    activeWhen: ['/vulnerabilities'],
    customProps: {
      authService: () => import('@cybersuite/shared').then(m => m.authService),
      eventBus: () => import('@cybersuite/shared').then(m => m.eventBus),
    }
  }
];

// Registrar aplicaciones
apps.forEach(registerApplication);

// Layout engine para manejar el layout
const layoutEngine = constructLayoutEngine({ routes, applications });
layoutEngine.activate();

start();
```

### Layout HTML

```html
<!-- packages/root-config/src/index.html -->
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>CyberSuite</title>
  <meta name="importmap-type" content="systemjs-importmap" />
  
  <!-- Import maps para desarrollo -->
  <script type="systemjs-importmap">
    {
      "imports": {
        "single-spa": "https://cdn.jsdelivr.net/npm/single-spa@5/lib/system/single-spa.min.js",
        "vue": "https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js",
        "react": "https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js",
        "react-dom": "https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js",
        "@cybersuite/root-config": "/root-config.js",
        "@cybersuite/inventario": "//localhost:4201/main.js",
        "@cybersuite/impactos": "//localhost:4202/main.js",
        "@cybersuite/vulnerabilities": "//localhost:4203/main.js",
        "@cybersuite/shared": "//localhost:4200/shared.js"
      }
    }
  </script>
  
  <script src="https://cdn.jsdelivr.net/npm/systemjs/dist/system.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/systemjs/dist/extras/amd.js"></script>
</head>
<body>
  <template id="single-spa-layout">
    <single-spa-router>
      <nav class="cyber-suite-nav">
        <application name="@cybersuite/navbar"></application>
      </nav>
      
      <main class="cyber-suite-main">
        <route default>
          <application name="@cybersuite/dashboard"></application>
        </route>
        
        <route path="inventario">
          <application name="@cybersuite/inventario"></application>
        </route>
        
        <route path="impactos">
          <application name="@cybersuite/impactos"></application>
        </route>
        
        <route path="vulnerabilities">
          <application name="@cybersuite/vulnerabilities"></application>
        </route>
      </main>
    </single-spa-router>
  </template>
  
  <script>
    System.import('@cybersuite/root-config');
  </script>
</body>
</html>
```

### Aplicación Vue 3 (Inventario)

```javascript
// apps/inventario/src/main.js
import { createApp, h } from 'vue';
import { createPinia } from 'pinia';
import singleSpaVue from 'single-spa-vue';
import App from './App.vue';
import router from './router';

// Lifecycle functions para single-spa
const vueLifecycles = singleSpaVue({
  createApp,
  appOptions: {
    render() {
      return h(App, {
        authService: this.authService,
        eventBus: this.eventBus,
      });
    },
  },
  handleInstance(app, props) {
    // Compartir servicios con la app Vue
    app.use(createPinia());
    app.use(router);
    app.provide('authService', props.authService);
    app.provide('eventBus', props.eventBus);
  },
});

export const bootstrap = vueLifecycles.bootstrap;
export const mount = vueLifecycles.mount;
export const unmount = vueLifecycles.unmount;
```

```javascript
// apps/inventario/vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 4201,
  },
  build: {
    rollupOptions: {
      input: 'src/main.js',
      output: {
        format: 'system',
        entryFileNames: 'main.js',
      },
      external: ['vue', 'vue-router', 'single-spa'],
    },
  },
});
```

### Comunicación entre Aplicaciones

```javascript
// packages/shared/src/event-bus.js
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

class EventBus {
  constructor() {
    this.events$ = new Subject();
  }
  
  emit(event, data) {
    this.events$.next({ event, data });
  }
  
  on(event) {
    return this.events$.pipe(
      filter(e => e.event === event)
    );
  }
}

export const eventBus = new EventBus();

// Ejemplo de uso desde Vulnerabilities app
eventBus.emit('vulnerability:critical', {
  id: 'CVE-2024-001',
  asset: 'server-01',
  severity: 'critical'
});

// Escuchar desde Inventario app
eventBus.on('vulnerability:critical').subscribe(({ data }) => {
  console.log('Vulnerabilidad crítica detectada:', data);
  // Actualizar UI del inventario
});
```

### Servicios Compartidos

```javascript
// packages/shared/src/auth/auth.service.js
export class AuthService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.permissions = new Set();
  }
  
  async login(credentials) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    this.token = data.token;
    this.permissions = new Set(data.permissions);
    localStorage.setItem('auth_token', this.token);
    
    // Notificar a todas las apps
    eventBus.emit('auth:login', { user: data.user });
  }
  
  hasPermission(permission) {
    return this.permissions.has(permission);
  }
  
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }
}

export const authService = new AuthService();
```

### Scripts de Desarrollo

```json
// package.json root
{
  "name": "@cybersuite/root",
  "private": true,
  "scripts": {
    "start": "concurrently \"pnpm run start:*\"",
    "start:root": "cd packages/root-config && pnpm dev",
    "start:shared": "cd packages/shared && pnpm dev",
    "start:inventario": "cd apps/inventario && pnpm dev",
    "start:impactos": "cd apps/impactos && pnpm dev",
    "start:vulnerabilities": "cd apps/vulnerabilities && pnpm dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### Despliegue

```nginx
# nginx.conf para producción
server {
  listen 80;
  server_name cybersuite.example.com;
  
  # Root config
  location / {
    root /usr/share/nginx/html;
    try_files $uri /index.html;
  }
  
  # Import map para producción
  location /importmap.json {
    alias /usr/share/nginx/html/importmap.prod.json;
  }
  
  # Proxy para APIs
  location /api {
    proxy_pass http://api-gateway:8080;
  }
}
```

## Próximos Pasos

1. Crear POC con single-spa + inventario actual
2. Migrar impactos como micro-frontend separado
3. Establecer patrones de comunicación
4. Implementar shared UI kit
5. Definir estrategia de testing E2E