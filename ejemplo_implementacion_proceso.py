#!/usr/bin/env python3
"""
Ejemplo de implementación de un proceso de Transferencia de Responsabilidad
"""

from datetime import datetime
import uuid

class ProcesoTransferencia:
    """Proceso de transferencia de responsabilidad de un activo"""
    
    def __init__(self, activo_id, responsable_actual, nuevo_responsable, solicitante, motivo):
        self.proceso = {
            "id": str(uuid.uuid4()),
            "tipo": "TRANSFERENCIA_RESPONSABILIDAD",
            "estado": "INICIADO",
            "activo_id": activo_id,
            "solicitante": solicitante,
            "fecha_solicitud": datetime.now().isoformat(),
            "datos_especificos": {
                "responsable_anterior": responsable_actual,
                "responsable_nuevo": nuevo_responsable,
                "motivo": motivo,
                "verificaciones": {
                    "activo_existe": False,
                    "nuevo_responsable_valido": False,
                    "aceptacion_nuevo_responsable": False,
                    "verificacion_estado_activo": False
                }
            },
            "historial": [{
                "fecha": datetime.now().isoformat(),
                "accion": "Proceso iniciado",
                "usuario": solicitante,
                "detalles": f"Solicitud de transferencia de {responsable_actual} a {nuevo_responsable}"
            }]
        }
    
    def validar_activo(self, activo):
        """Validar que el activo existe y está activo"""
        if activo and activo.get('estado') == 'Activo':
            self.proceso['datos_especificos']['verificaciones']['activo_existe'] = True
            self._agregar_historial("Activo validado", "Sistema", 
                                   f"Activo {activo.get('nombre')} verificado")
            return True
        return False
    
    def validar_nuevo_responsable(self, usuarios_activos):
        """Validar que el nuevo responsable existe y está activo"""
        if self.proceso['datos_especificos']['responsable_nuevo'] in usuarios_activos:
            self.proceso['datos_especificos']['verificaciones']['nuevo_responsable_valido'] = True
            self._agregar_historial("Responsable validado", "Sistema", 
                                   "Nuevo responsable verificado en el sistema")
            return True
        return False
    
    def solicitar_aceptacion(self):
        """Enviar notificación al nuevo responsable"""
        self.proceso['estado'] = "ESPERANDO_ACEPTACION"
        self._agregar_historial("Notificación enviada", "Sistema", 
                               f"Solicitud de aceptación enviada a {self.proceso['datos_especificos']['responsable_nuevo']}")
        
        # Aquí se enviaría email/notificación real
        return {
            "tipo": "NOTIFICACION",
            "destinatario": self.proceso['datos_especificos']['responsable_nuevo'],
            "asunto": "Solicitud de transferencia de activo",
            "mensaje": f"Se le ha asignado la responsabilidad del activo {self.proceso['activo_id']}"
        }
    
    def aceptar_transferencia(self, usuario_aceptante, comentarios=""):
        """El nuevo responsable acepta la transferencia"""
        if usuario_aceptante != self.proceso['datos_especificos']['responsable_nuevo']:
            return {"error": "Solo el nuevo responsable puede aceptar"}
        
        self.proceso['datos_especificos']['verificaciones']['aceptacion_nuevo_responsable'] = True
        self.proceso['datos_especificos']['comentarios_aceptacion'] = comentarios
        self.proceso['estado'] = "ACEPTADO"
        
        self._agregar_historial("Transferencia aceptada", usuario_aceptante, 
                               f"Aceptación confirmada. Comentarios: {comentarios}")
        return {"success": True}
    
    def rechazar_transferencia(self, usuario, motivo):
        """Rechazar la transferencia"""
        self.proceso['estado'] = "RECHAZADO"
        self.proceso['fecha_resolucion'] = datetime.now().isoformat()
        
        self._agregar_historial("Transferencia rechazada", usuario, 
                               f"Motivo: {motivo}")
        return {"success": True}
    
    def verificar_estado_activo(self, verificador, estado_actual, observaciones=""):
        """Verificar el estado físico/lógico del activo antes de transferir"""
        self.proceso['datos_especificos']['verificaciones']['verificacion_estado_activo'] = True
        self.proceso['datos_especificos']['estado_verificado'] = {
            "verificador": verificador,
            "fecha": datetime.now().isoformat(),
            "estado": estado_actual,
            "observaciones": observaciones
        }
        
        self._agregar_historial("Estado verificado", verificador, 
                               f"Estado: {estado_actual}. {observaciones}")
        return {"success": True}
    
    def completar_transferencia(self):
        """Completar el proceso si todas las validaciones pasan"""
        verificaciones = self.proceso['datos_especificos']['verificaciones']
        
        if not all(verificaciones.values()):
            pendientes = [k for k, v in verificaciones.items() if not v]
            return {"error": f"Verificaciones pendientes: {pendientes}"}
        
        self.proceso['estado'] = "COMPLETADO"
        self.proceso['fecha_resolucion'] = datetime.now().isoformat()
        
        self._agregar_historial("Transferencia completada", "Sistema", 
                               "Todas las verificaciones completadas. Activo transferido.")
        
        # Retornar los cambios a aplicar al activo
        return {
            "success": True,
            "cambios_activo": {
                "responsable": self.proceso['datos_especificos']['responsable_nuevo'],
                "fecha_ultima_transferencia": datetime.now().isoformat()
            },
            "notificaciones": [
                {
                    "destinatario": self.proceso['datos_especificos']['responsable_anterior'],
                    "mensaje": "La transferencia del activo ha sido completada"
                },
                {
                    "destinatario": self.proceso['datos_especificos']['responsable_nuevo'],
                    "mensaje": "Ahora es responsable del activo"
                }
            ]
        }
    
    def _agregar_historial(self, accion, usuario, detalles):
        """Agregar entrada al historial del proceso"""
        self.proceso['historial'].append({
            "fecha": datetime.now().isoformat(),
            "accion": accion,
            "usuario": usuario,
            "detalles": detalles
        })

# Ejemplo de uso
if __name__ == "__main__":
    # Crear proceso de transferencia
    proceso = ProcesoTransferencia(
        activo_id="12345",
        responsable_actual="Juan Martínez",
        nuevo_responsable="María García",
        solicitante="Laura Fernández",
        motivo="Cambio de departamento"
    )
    
    # Flujo del proceso
    print("1. Proceso iniciado:", proceso.proceso['estado'])
    
    # Validaciones
    proceso.validar_activo({"nombre": "Laptop Dell", "estado": "Activo"})
    proceso.validar_nuevo_responsable(["María García", "Carlos López"])
    
    # Solicitar aceptación
    notificacion = proceso.solicitar_aceptacion()
    print("2. Notificación enviada:", notificacion)
    
    # Aceptar
    proceso.aceptar_transferencia("María García", "De acuerdo, acepto la responsabilidad")
    
    # Verificar estado
    proceso.verificar_estado_activo("Carlos López", "Bueno", "Equipo en perfectas condiciones")
    
    # Completar
    resultado = proceso.completar_transferencia()
    print("3. Proceso completado:", resultado)
    
    # Ver historial completo
    print("\n4. Historial del proceso:")
    for evento in proceso.proceso['historial']:
        print(f"   - {evento['fecha']}: {evento['accion']} ({evento['usuario']})")