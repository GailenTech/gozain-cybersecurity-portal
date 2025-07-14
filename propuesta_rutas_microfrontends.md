# Propuesta: URLs Recargables para Microfrontends

## Problema Actual
- Las rutas como `/#/inventario` no son recargables
- Al recargar, se pierde el contexto y vuelve a la home
- No hay persistencia del estado de navegación

## Solución Propuesta

### 1. Estructura de URLs
```
/app/{module}/{route}

Ejemplos:
- /app/inventario/dashboard
- /app/inventario/lista
- /app/inventario/activo/123
- /app/impactos/dashboard
- /app/madurez/evaluacion
```

### 2. Cambios en el Backend

#### A. Nuevo endpoint catch-all
```python
@app.route('/app/<module>/')
@app.route('/app/<module>/<path:subpath>')
def handle_app_route(module, subpath=''):
    """Maneja todas las rutas de aplicaciones y devuelve el shell"""
    # Verificar que el módulo existe
    if module not in ['inventario', 'impactos', 'madurez']:
        abort(404)
    
    # Devolver el shell HTML con metadata
    return render_template('shell.html', 
        initial_module=module,
        initial_route=subpath
    )
```

#### B. Modificar el shell para aceptar rutas iniciales
```javascript
// En app.js
class GozainApp {
    async init() {
        // ... código existente ...
        
        // Verificar si hay una ruta inicial
        const initialModule = window.INITIAL_MODULE;
        const initialRoute = window.INITIAL_ROUTE;
        
        if (initialModule && selectedOrg) {
            // Cargar directamente el módulo con la ruta
            await this.loadApplication(initialModule, {
                route: initialRoute
            });
        }
    }
}
```

### 3. Cambios en los Módulos

#### A. Actualizar el router de cada módulo
```javascript
// En router/index.js
export function createInventarioRouter() {
    const router = createRouter({
        // Usar history mode en lugar de hash
        history: createWebHistory('/app/inventario/'),
        routes: [
            {
                path: '/',
                redirect: '/dashboard'
            },
            {
                path: '/dashboard',
                name: 'dashboard',
                component: DashboardPage
            },
            {
                path: '/lista',
                name: 'inventario',
                component: InventarioPage
            },
            {
                path: '/activo/:id?',
                name: 'activo',
                component: ActivoDetailPage
            }
        ]
    });
    
    return router;
}
```

#### B. Actualizar la navegación
```javascript
// Usar rutas completas
this.$router.push('/app/inventario/lista');

// O nombres de rutas
this.$router.push({ name: 'inventario' });
```

### 4. Configuración de Nginx/Apache (Producción)

Para que funcione en producción, necesitamos configurar el servidor web:

```nginx
# Nginx
location /app {
    try_files $uri $uri/ /index.html;
}
```

### 5. Ventajas de esta Solución

1. **URLs Semánticas**: `/app/inventario/activo/123` es más claro que `/#/activo/123`
2. **Recargables**: El servidor puede manejar cualquier URL directamente
3. **SEO Friendly**: Aunque no es crítico para una app interna
4. **Compartibles**: Los usuarios pueden compartir links directos
5. **Historial Real**: El navegador mantiene historial completo

### 6. Plan de Implementación

1. **Fase 1**: Actualizar backend con catch-all route
2. **Fase 2**: Modificar shell para manejar rutas iniciales
3. **Fase 3**: Migrar módulo inventario a history mode
4. **Fase 4**: Actualizar tests para nuevas URLs
5. **Fase 5**: Documentar y desplegar

### 7. Consideraciones

- **Compatibilidad**: Mantener soporte temporal para URLs con hash
- **Estado**: Guardar estado en sessionStorage para persistencia
- **Auth**: Verificar autenticación en todas las rutas
- **Performance**: Precarga de módulos comunes

## Alternativa Más Simple (Corto Plazo)

Si queremos una solución más rápida sin cambiar el backend:

1. Usar `localStorage` para guardar la última ruta visitada
2. Al cargar la app, verificar si hay una ruta guardada
3. Navegar automáticamente a esa ruta

```javascript
// Guardar ruta actual
router.afterEach((to) => {
    localStorage.setItem('lastRoute', {
        module: 'inventario',
        path: to.fullPath
    });
});

// Restaurar al cargar
const lastRoute = localStorage.getItem('lastRoute');
if (lastRoute) {
    router.push(lastRoute.path);
}
```

Esta alternativa es menos elegante pero funciona sin cambios en el backend.