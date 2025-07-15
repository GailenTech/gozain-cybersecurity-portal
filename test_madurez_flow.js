/**
 * Test completo del flujo de madurez
 * Ejecutar con: node test_madurez_flow.js
 */

const BASE_URL = 'http://localhost:8080';
const ORG_ID = 'e2e_test_organization';

async function testAPI(endpoint, options = {}) {
    const url = `${BASE_URL}/api${endpoint}`;
    const headers = {
        'X-Organization-Id': ORG_ID,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error(`❌ Error en ${endpoint}:`, data);
            return null;
        }
        
        console.log(`✅ ${options.method || 'GET'} ${endpoint} - OK`);
        return data;
    } catch (error) {
        console.error(`❌ Error en ${endpoint}:`, error.message);
        return null;
    }
}

async function runTests() {
    console.log('🚀 Iniciando tests del módulo de madurez...\n');
    
    // 1. Verificar estadísticas
    console.log('1. Verificando estadísticas...');
    const stats = await testAPI('/madurez/estadisticas');
    if (stats) {
        console.log(`   Total: ${stats.total}, Completadas: ${stats.completadas}, En progreso: ${stats.progreso}`);
        console.log(`   Puntuación promedio: ${stats.puntuacion || 'N/A'}`);
    }
    
    // 2. Listar assessments
    console.log('\n2. Listando assessments...');
    const assessments = await testAPI('/madurez/assessments');
    if (assessments) {
        console.log(`   Encontrados: ${assessments.length} assessments`);
        assessments.forEach(a => {
            console.log(`   - ${a.nombre} (${a.estado}) - ID: ${a.id}`);
        });
    }
    
    // 3. Obtener template
    console.log('\n3. Verificando template...');
    const templates = await testAPI('/madurez/templates');
    if (templates && templates.length > 0) {
        console.log(`   Templates disponibles: ${templates.length}`);
        const template = await testAPI('/madurez/templates/cuestionario_ciberplan_v1');
        if (template) {
            console.log(`   Template cargado: ${template.nombre}`);
            console.log(`   Dominios: ${template.dominios.length}`);
        }
    }
    
    // 4. Crear nueva evaluación
    console.log('\n4. Creando nueva evaluación...');
    const newAssessment = await testAPI('/madurez/assessments', {
        method: 'POST',
        body: JSON.stringify({
            nombre: `Test Automatizado ${new Date().toLocaleString()}`,
            descripcion: 'Evaluación creada por test automatizado',
            objetivo_6meses: 2.5,
            objetivo_1año: 3.0,
            objetivo_2años: 4.0
        })
    });
    
    if (newAssessment) {
        console.log(`   Creada con ID: ${newAssessment.id}`);
        
        // 5. Simular respuestas
        console.log('\n5. Simulando respuestas del cuestionario...');
        const respuestas = {
            // Protección de acceso
            'pa_1': { respuesta: 'Sí', valor: 3, comentario: 'Test automatizado' },
            'pa_2': { respuesta: 'Parcialmente', valor: 2, comentario: 'En proceso' },
            'pa_3': { respuesta: 'Sí', valor: 3, comentario: 'Implementado' },
            // Seguridad dispositivos
            'sd_1': { respuesta: 'Avanzado', valor: 4, comentario: 'Excelente' },
            'sd_2': { respuesta: 'Sí', valor: 3, comentario: 'OK' },
            'sd_3': { respuesta: 'Sí', valor: 3, comentario: 'Seguro' },
            // Protección datos
            'pd_1': { respuesta: 'Sí', valor: 3, comentario: 'Backups diarios' },
            'pd_2': { respuesta: 'Sí', valor: 3, comentario: 'Cifrado activo' },
            'pd_3': { respuesta: 'Parcialmente', valor: 2, comentario: 'Mejorando' },
            // Prevención amenazas
            'pa_am_1': { respuesta: 'Sí', valor: 3, comentario: 'Capacitación trimestral' },
            'pa_am_2': { respuesta: 'Sí', valor: 3, comentario: 'Protocolos establecidos' },
            'pa_am_3': { respuesta: 'No', valor: 1, comentario: 'En evaluación' },
            // Gestión accesos
            'ga_1': { respuesta: 'Sí', valor: 3, comentario: 'Sistema IAM' },
            'ga_2': { respuesta: 'Sí', valor: 3, comentario: 'Control estricto' },
            'ga_3': { respuesta: 'Parcialmente', valor: 2, comentario: 'En implementación' },
            // Respuesta incidentes
            'ri_1': { respuesta: 'Sí', valor: 3, comentario: 'Plan documentado' },
            'ri_2': { respuesta: 'Sí', valor: 3, comentario: 'Equipo definido' },
            'ri_3': { respuesta: 'Sí', valor: 3, comentario: 'Sistema de tickets' },
            // Procesos críticos
            'pc_1': { respuesta: 'Sí', valor: 3, comentario: 'Inventario actualizado' },
            'pc_2': { respuesta: 'Sí', valor: 3, comentario: 'BIA completado' },
            'pc_3': { respuesta: 'Parcialmente', valor: 2, comentario: 'En proceso' },
            'pc_4': { respuesta: 'Sí', valor: 3, comentario: 'Monitoreo 24/7' }
        };
        
        // 6. Completar evaluación
        console.log('\n6. Completando evaluación...');
        const completed = await testAPI(`/madurez/assessments/${newAssessment.id}/complete`, {
            method: 'POST',
            body: JSON.stringify({ respuestas })
        });
        
        if (completed) {
            console.log(`   Puntuación total: ${completed.resultados.puntuacion_total}/4.0`);
            
            // 7. Verificar dashboard
            console.log('\n7. Verificando dashboard...');
            const dashboard = await testAPI(`/madurez/dashboard/${newAssessment.id}`);
            if (dashboard) {
                console.log('   Dashboard disponible con:');
                console.log(`   - Métricas: ${JSON.stringify(dashboard.metricas)}`);
                console.log(`   - Datos para radar: ${dashboard.radar_data ? 'Sí' : 'No'}`);
                console.log(`   - Datos para gaps: ${dashboard.gaps_data ? 'Sí' : 'No'}`);
                console.log(`   - Timeline: ${dashboard.timeline_data ? 'Sí' : 'No'}`);
            }
            
            // 8. Verificar historial
            console.log('\n8. Verificando historial...');
            const history = await testAPI('/madurez/history');
            if (history) {
                console.log(`   Assessments en historial: ${history.assessments.length}`);
                console.log(`   Evolución registrada: ${history.evolution ? history.evolution.length : 0} puntos`);
            }
        }
    }
    
    console.log('\n✅ Tests completados!');
}

// Ejecutar tests
runTests().catch(console.error);