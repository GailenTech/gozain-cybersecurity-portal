"""
Servicio de auditoría para registrar acciones de usuarios
"""
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict

@dataclass
class AuditLog:
    """Modelo de registro de auditoría"""
    id: str
    timestamp: datetime
    usuario_id: str
    usuario_email: str
    organizacion_id: str
    modulo: str
    accion: str
    recurso: str
    detalles: Dict[str, Any]
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    resultado: str = 'success'  # success, error, warning
    
    def to_dict(self) -> Dict:
        """Convertir a diccionario para JSON"""
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data

class AuditService:
    """Servicio para gestión de auditoría"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.audit_file = os.path.join(data_dir, 'audit_logs.json')
        self.logs = self._load_logs()
    
    def _load_logs(self) -> List[AuditLog]:
        """Cargar logs de auditoría desde archivo"""
        if os.path.exists(self.audit_file):
            try:
                with open(self.audit_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    logs = []
                    for log_data in data:
                        log = AuditLog(**log_data)
                        log.timestamp = datetime.fromisoformat(log_data['timestamp'])
                        logs.append(log)
                    return logs
            except Exception as e:
                print(f"Error cargando logs de auditoría: {e}")
                return []
        return []
    
    def _save_logs(self):
        """Guardar logs de auditoría en archivo"""
        os.makedirs(self.data_dir, exist_ok=True)
        
        data = [log.to_dict() for log in self.logs]
        
        with open(self.audit_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def log_action(self, usuario_id: str, usuario_email: str, organizacion_id: str,
                   modulo: str, accion: str, recurso: str, detalles: Dict[str, Any] = None,
                   ip: str = None, user_agent: str = None, resultado: str = 'success') -> str:
        """Registrar una acción en el log de auditoría"""
        import secrets
        
        log_id = f"audit_{secrets.token_urlsafe(8)}"
        
        audit_log = AuditLog(
            id=log_id,
            timestamp=datetime.utcnow(),
            usuario_id=usuario_id,
            usuario_email=usuario_email,
            organizacion_id=organizacion_id,
            modulo=modulo,
            accion=accion,
            recurso=recurso,
            detalles=detalles or {},
            ip=ip,
            user_agent=user_agent,
            resultado=resultado
        )
        
        self.logs.append(audit_log)
        
        # Mantener solo los últimos 10000 logs para evitar archivos muy grandes
        if len(self.logs) > 10000:
            self.logs = self.logs[-10000:]
        
        self._save_logs()
        
        return log_id
    
    def get_logs(self, organizacion_id: str, filtros: Dict[str, Any] = None) -> List[AuditLog]:
        """Obtener logs de auditoría con filtros"""
        filtered_logs = [log for log in self.logs if log.organizacion_id == organizacion_id]
        
        if not filtros:
            return filtered_logs[:100]  # Últimos 100 por defecto
        
        # Aplicar filtros
        if filtros.get('usuario_id'):
            filtered_logs = [log for log in filtered_logs 
                           if log.usuario_id == filtros['usuario_id']]
        
        if filtros.get('modulo'):
            filtered_logs = [log for log in filtered_logs 
                           if log.modulo == filtros['modulo']]
        
        if filtros.get('accion'):
            filtered_logs = [log for log in filtered_logs 
                           if log.accion == filtros['accion']]
        
        if filtros.get('fecha_desde'):
            fecha_desde = datetime.fromisoformat(filtros['fecha_desde'])
            filtered_logs = [log for log in filtered_logs 
                           if log.timestamp >= fecha_desde]
        
        if filtros.get('fecha_hasta'):
            fecha_hasta = datetime.fromisoformat(filtros['fecha_hasta'])
            filtered_logs = [log for log in filtered_logs 
                           if log.timestamp <= fecha_hasta]
        
        if filtros.get('resultado'):
            filtered_logs = [log for log in filtered_logs 
                           if log.resultado == filtros['resultado']]
        
        # Ordenar por timestamp descendente
        filtered_logs.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Limitar resultados
        limit = filtros.get('limit', 100)
        return filtered_logs[:limit]
    
    def get_user_activity(self, usuario_id: str, organizacion_id: str, 
                         dias: int = 30) -> Dict[str, Any]:
        """Obtener resumen de actividad de un usuario"""
        from datetime import timedelta
        
        fecha_limite = datetime.utcnow() - timedelta(days=dias)
        
        user_logs = [log for log in self.logs 
                    if (log.usuario_id == usuario_id and 
                        log.organizacion_id == organizacion_id and 
                        log.timestamp >= fecha_limite)]
        
        # Estadísticas
        total_acciones = len(user_logs)
        acciones_por_modulo = {}
        acciones_por_tipo = {}
        acciones_por_dia = {}
        
        for log in user_logs:
            # Por módulo
            if log.modulo not in acciones_por_modulo:
                acciones_por_modulo[log.modulo] = 0
            acciones_por_modulo[log.modulo] += 1
            
            # Por tipo de acción
            if log.accion not in acciones_por_tipo:
                acciones_por_tipo[log.accion] = 0
            acciones_por_tipo[log.accion] += 1
            
            # Por día
            dia = log.timestamp.date().isoformat()
            if dia not in acciones_por_dia:
                acciones_por_dia[dia] = 0
            acciones_por_dia[dia] += 1
        
        return {
            'total_acciones': total_acciones,
            'acciones_por_modulo': acciones_por_modulo,
            'acciones_por_tipo': acciones_por_tipo,
            'acciones_por_dia': acciones_por_dia,
            'periodo_dias': dias
        }
    
    def get_organization_activity(self, organizacion_id: str, 
                                dias: int = 30) -> Dict[str, Any]:
        """Obtener resumen de actividad de la organización"""
        from datetime import timedelta
        
        fecha_limite = datetime.utcnow() - timedelta(days=dias)
        
        org_logs = [log for log in self.logs 
                   if (log.organizacion_id == organizacion_id and 
                       log.timestamp >= fecha_limite)]
        
        # Estadísticas
        total_acciones = len(org_logs)
        usuarios_activos = len(set(log.usuario_id for log in org_logs))
        
        acciones_por_usuario = {}
        acciones_por_modulo = {}
        acciones_por_tipo = {}
        errores = []
        
        for log in org_logs:
            # Por usuario
            if log.usuario_id not in acciones_por_usuario:
                acciones_por_usuario[log.usuario_id] = {
                    'email': log.usuario_email,
                    'count': 0
                }
            acciones_por_usuario[log.usuario_id]['count'] += 1
            
            # Por módulo
            if log.modulo not in acciones_por_modulo:
                acciones_por_modulo[log.modulo] = 0
            acciones_por_modulo[log.modulo] += 1
            
            # Por tipo de acción
            if log.accion not in acciones_por_tipo:
                acciones_por_tipo[log.accion] = 0
            acciones_por_tipo[log.accion] += 1
            
            # Errores
            if log.resultado == 'error':
                errores.append({
                    'timestamp': log.timestamp.isoformat(),
                    'usuario': log.usuario_email,
                    'modulo': log.modulo,
                    'accion': log.accion,
                    'detalles': log.detalles
                })
        
        return {
            'total_acciones': total_acciones,
            'usuarios_activos': usuarios_activos,
            'acciones_por_usuario': acciones_por_usuario,
            'acciones_por_modulo': acciones_por_modulo,
            'acciones_por_tipo': acciones_por_tipo,
            'total_errores': len(errores),
            'errores_recientes': errores[:10],  # Últimos 10 errores
            'periodo_dias': dias
        }
    
    def search_logs(self, organizacion_id: str, query: str, 
                   limit: int = 100) -> List[AuditLog]:
        """Buscar en logs de auditoría"""
        query = query.lower()
        
        matched_logs = []
        for log in self.logs:
            if log.organizacion_id != organizacion_id:
                continue
            
            # Buscar en diferentes campos
            if (query in log.usuario_email.lower() or 
                query in log.modulo.lower() or 
                query in log.accion.lower() or 
                query in log.recurso.lower() or 
                query in str(log.detalles).lower()):
                matched_logs.append(log)
            
            if len(matched_logs) >= limit:
                break
        
        return matched_logs
    
    def cleanup_old_logs(self, dias_antiguedad: int = 365):
        """Limpiar logs antiguos"""
        from datetime import timedelta
        
        fecha_limite = datetime.utcnow() - timedelta(days=dias_antiguedad)
        
        logs_nuevos = [log for log in self.logs if log.timestamp >= fecha_limite]
        
        if len(logs_nuevos) < len(self.logs):
            self.logs = logs_nuevos
            self._save_logs()
            return len(self.logs)
        
        return 0