"""
Rutas para consultar logs de auditoría
"""
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
from .audit_service import AuditService
from .auth_middleware import require_auth, require_role

audit_bp = Blueprint('audit', __name__, url_prefix='/api/audit')

@audit_bp.route('/logs', methods=['GET'])
@require_auth(['audit:read'])
def get_audit_logs():
    """Obtener logs de auditoría"""
    try:
        from flask import g
        org_id = g.organization_id
        
        audit_service = AuditService(current_app.config.get('DATA_DIR', 'data'))
        
        # Filtros opcionales
        filtros = {
            'usuario_id': request.args.get('usuario_id'),
            'modulo': request.args.get('modulo'),
            'accion': request.args.get('accion'),
            'fecha_desde': request.args.get('fecha_desde'),
            'fecha_hasta': request.args.get('fecha_hasta'),
            'resultado': request.args.get('resultado'),
            'limit': int(request.args.get('limit', 100))
        }
        
        # Remover filtros vacíos
        filtros = {k: v for k, v in filtros.items() if v is not None}
        
        logs = audit_service.get_logs(org_id, filtros)
        
        # Convertir a diccionarios
        logs_data = [log.to_dict() for log in logs]
        
        return jsonify({
            'logs': logs_data,
            'total': len(logs_data),
            'filtros': filtros
        })
    
    except Exception as e:
        current_app.logger.error(f"Error obteniendo logs de auditoría: {e}")
        return jsonify({'error': 'Error obteniendo logs de auditoría'}), 500

@audit_bp.route('/search', methods=['GET'])
@require_auth(['audit:read'])
def search_audit_logs():
    """Buscar en logs de auditoría"""
    try:
        from flask import g
        org_id = g.organization_id
        
        query = request.args.get('q', '')
        limit = int(request.args.get('limit', 100))
        
        if not query:
            return jsonify({'error': 'Parámetro de búsqueda requerido'}), 400
        
        audit_service = AuditService(current_app.config.get('DATA_DIR', 'data'))
        logs = audit_service.search_logs(org_id, query, limit)
        
        logs_data = [log.to_dict() for log in logs]
        
        return jsonify({
            'logs': logs_data,
            'total': len(logs_data),
            'query': query
        })
    
    except Exception as e:
        current_app.logger.error(f"Error buscando logs de auditoría: {e}")
        return jsonify({'error': 'Error buscando logs de auditoría'}), 500

@audit_bp.route('/user/<user_id>/activity', methods=['GET'])
@require_auth(['audit:read'])
def get_user_activity(user_id):
    """Obtener actividad de un usuario específico"""
    try:
        from flask import g
        org_id = g.organization_id
        
        dias = int(request.args.get('dias', 30))
        
        audit_service = AuditService(current_app.config.get('DATA_DIR', 'data'))
        activity = audit_service.get_user_activity(user_id, org_id, dias)
        
        return jsonify(activity)
    
    except Exception as e:
        current_app.logger.error(f"Error obteniendo actividad del usuario: {e}")
        return jsonify({'error': 'Error obteniendo actividad del usuario'}), 500

@audit_bp.route('/organization/activity', methods=['GET'])
@require_auth(['audit:read'])
def get_organization_activity():
    """Obtener actividad de la organización"""
    try:
        from flask import g
        org_id = g.organization_id
        
        dias = int(request.args.get('dias', 30))
        
        audit_service = AuditService(current_app.config.get('DATA_DIR', 'data'))
        activity = audit_service.get_organization_activity(org_id, dias)
        
        return jsonify(activity)
    
    except Exception as e:
        current_app.logger.error(f"Error obteniendo actividad de la organización: {e}")
        return jsonify({'error': 'Error obteniendo actividad de la organización'}), 500

@audit_bp.route('/stats', methods=['GET'])
@require_auth(['audit:read'])
def get_audit_stats():
    """Obtener estadísticas de auditoría"""
    try:
        from flask import g
        org_id = g.organization_id
        
        audit_service = AuditService(current_app.config.get('DATA_DIR', 'data'))
        
        # Obtener estadísticas básicas
        all_logs = audit_service.get_logs(org_id, {'limit': 10000})
        
        # Calcular estadísticas
        total_logs = len(all_logs)
        
        # Contar por módulo
        modulos = {}
        acciones = {}
        usuarios = {}
        errores = 0
        
        for log in all_logs:
            # Por módulo
            if log.modulo not in modulos:
                modulos[log.modulo] = 0
            modulos[log.modulo] += 1
            
            # Por acción
            if log.accion not in acciones:
                acciones[log.accion] = 0
            acciones[log.accion] += 1
            
            # Por usuario
            if log.usuario_email not in usuarios:
                usuarios[log.usuario_email] = 0
            usuarios[log.usuario_email] += 1
            
            # Errores
            if log.resultado == 'error':
                errores += 1
        
        # Ordenar por cantidad
        modulos_ordenados = sorted(modulos.items(), key=lambda x: x[1], reverse=True)
        acciones_ordenadas = sorted(acciones.items(), key=lambda x: x[1], reverse=True)
        usuarios_ordenados = sorted(usuarios.items(), key=lambda x: x[1], reverse=True)
        
        stats = {
            'total_logs': total_logs,
            'total_errores': errores,
            'tasa_error': (errores / total_logs * 100) if total_logs > 0 else 0,
            'usuarios_unicos': len(usuarios),
            'modulos': dict(modulos_ordenados),
            'acciones': dict(acciones_ordenadas),
            'usuarios_mas_activos': dict(usuarios_ordenados[:10])
        }
        
        return jsonify(stats)
    
    except Exception as e:
        current_app.logger.error(f"Error obteniendo estadísticas de auditoría: {e}")
        return jsonify({'error': 'Error obteniendo estadísticas de auditoría'}), 500

@audit_bp.route('/export', methods=['GET'])
@require_auth(['audit:read'])
@require_role('admin')
def export_audit_logs():
    """Exportar logs de auditoría"""
    try:
        from flask import g
        org_id = g.organization_id
        
        formato = request.args.get('format', 'json')
        dias = int(request.args.get('dias', 30))
        
        audit_service = AuditService(current_app.config.get('DATA_DIR', 'data'))
        
        # Obtener logs
        filtros = {
            'limit': 10000,
            'fecha_desde': (datetime.utcnow() - timedelta(days=dias)).isoformat()
        }
        
        logs = audit_service.get_logs(org_id, filtros)
        
        if formato == 'json':
            from flask import jsonify
            logs_data = [log.to_dict() for log in logs]
            return jsonify({
                'logs': logs_data,
                'exported_at': datetime.utcnow().isoformat(),
                'organization': org_id,
                'period_days': dias
            })
        
        elif formato == 'csv':
            import csv
            from io import StringIO
            from flask import make_response
            
            output = StringIO()
            writer = csv.writer(output)
            
            # Headers
            writer.writerow([
                'Timestamp', 'Usuario', 'Email', 'Módulo', 'Acción', 
                'Recurso', 'Resultado', 'IP', 'User Agent', 'Detalles'
            ])
            
            # Datos
            for log in logs:
                writer.writerow([
                    log.timestamp.isoformat(),
                    log.usuario_id,
                    log.usuario_email,
                    log.modulo,
                    log.accion,
                    log.recurso,
                    log.resultado,
                    log.ip or '',
                    log.user_agent or '',
                    str(log.detalles)
                ])
            
            output.seek(0)
            response = make_response(output.getvalue())
            response.headers['Content-Type'] = 'text/csv'
            response.headers['Content-Disposition'] = f'attachment; filename=audit_logs_{org_id}_{dias}days.csv'
            
            return response
        
        else:
            return jsonify({'error': 'Formato no soportado'}), 400
    
    except Exception as e:
        current_app.logger.error(f"Error exportando logs de auditoría: {e}")
        return jsonify({'error': 'Error exportando logs de auditoría'}), 500

@audit_bp.route('/cleanup', methods=['POST'])
@require_auth(['audit:admin'])
@require_role('admin')
def cleanup_old_logs():
    """Limpiar logs antiguos"""
    try:
        data = request.get_json()
        dias_antiguedad = data.get('days', 365)
        
        audit_service = AuditService(current_app.config.get('DATA_DIR', 'data'))
        logs_eliminados = audit_service.cleanup_old_logs(dias_antiguedad)
        
        return jsonify({
            'message': f'Limpieza completada',
            'logs_eliminados': logs_eliminados,
            'dias_antiguedad': dias_antiguedad
        })
    
    except Exception as e:
        current_app.logger.error(f"Error limpiando logs antiguos: {e}")
        return jsonify({'error': 'Error limpiando logs antiguos'}), 500