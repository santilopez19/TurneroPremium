# 🚗 Sistema de Gestión de Disponibilidad - Turnero Lavadero Premium

## ✨ Nueva Funcionalidad Implementada

Se ha agregado un sistema completo de gestión de disponibilidad que permite al administrador del negocio controlar de manera autogestiva:

- **Horarios de atención** (apertura y cierre)
- **Duración de los turnos** (en minutos)
- **Capacidad por horario** (número máximo de turnos por slot)
- **Bloqueo de fechas completas** (feriados, cierres por mantenimiento)
- **Bloqueo de horarios específicos** (personal reducido, etc.)

## 🎯 Características Principales

### 1. **Configuración del Negocio**
- **Hora de Apertura**: Configurable (ej: 08:30)
- **Hora de Cierre**: Configurable (ej: 18:30)
- **Duración del Turno**: 15-120 minutos (ej: 60 minutos)
- **Capacidad por Horario**: 1-10 turnos (ej: 2 turnos)

### 2. **Gestión de Fechas Bloqueadas**
- Bloquear fechas completas (ej: feriados, cierres)
- Agregar motivo del bloqueo (opcional)
- Desbloquear fechas cuando sea necesario

### 3. **Gestión de Horarios Bloqueados**
- Bloquear horarios específicos en fechas específicas
- Útil para personal reducido o mantenimiento parcial
- Agregar motivo del bloqueo (opcional)

### 4. **Vista de Disponibilidad Futura**
- Visualización de los próximos 30 días
- Estado de cada fecha (disponible/bloqueada)
- Conteo de horarios disponibles, bloqueados y reservados

## 🚀 Cómo Usar

### **Acceso a la Gestión de Disponibilidad**

1. Iniciar sesión como administrador en `/admin`
2. Ir a `/admin/disponibilidad` o hacer clic en "Gestionar Disponibilidad" desde el Dashboard

### **Configurar el Negocio**

1. En la sección "Configuración del Negocio", hacer clic en "Editar Configuración"
2. Ajustar:
   - **Hora de Apertura**: Cuándo abre el negocio
   - **Hora de Cierre**: Cuándo cierra el negocio
   - **Duración del Turno**: Cuánto dura cada turno
   - **Capacidad por Horario**: Cuántos turnos se pueden reservar por horario
3. Hacer clic en "Guardar Cambios"

### **Bloquear una Fecha Completa**

1. En "Bloquear Fechas Completas":
   - Seleccionar la fecha a bloquear
   - Opcionalmente agregar un motivo
   - Hacer clic en "Bloquear Fecha"

### **Bloquear un Horario Específico**

1. En "Bloquear Horarios Específicos":
   - Seleccionar la fecha
   - Seleccionar la hora específica
   - Opcionalmente agregar un motivo
   - Hacer clic en "Bloquear Horario"

### **Desbloquear Fechas/Horarios**

1. En las tablas correspondientes, hacer clic en "Desbloquear"
2. Los cambios se aplican inmediatamente

## 🔧 Configuración Técnica

### **Base de Datos**
- Nuevas tablas: `BusinessConfig`, `BlockedDate`, `BlockedTimeSlot`
- Configuración por defecto: 08:30-18:30, 60 min por turno, 2 turnos por horario

### **API Endpoints**
- `GET /api/admin/business-config` - Obtener configuración
- `PUT /api/admin/business-config` - Actualizar configuración
- `GET /api/admin/blocked-dates` - Obtener fechas bloqueadas
- `POST /api/admin/blocked-dates` - Bloquear fecha
- `DELETE /api/admin/blocked-dates/:date` - Desbloquear fecha
- `GET /api/admin/blocked-time-slots` - Obtener horarios bloqueados
- `POST /api/admin/blocked-time-slots` - Bloquear horario
- `DELETE /api/admin/blocked-time-slots/:date/:time` - Desbloquear horario
- `GET /api/admin/availability` - Obtener disponibilidad futura

### **Frontend**
- Nueva página: `/admin/disponibilidad`
- Componente: `Availability.tsx`
- Servicios actualizados en `api.ts`

## 📱 Interfaz de Usuario

### **Secciones Principales**

1. **Configuración del Negocio**
   - Vista y edición de parámetros básicos
   - Formulario de edición con validaciones

2. **Bloquear Fechas Completas**
   - Formulario para agregar fechas bloqueadas
   - Tabla con fechas bloqueadas actuales
   - Acciones para desbloquear

3. **Bloquear Horarios Específicos**
   - Formulario para agregar horarios bloqueados
   - Tabla con horarios bloqueados actuales
   - Acciones para desbloquear

4. **Vista de Disponibilidad**
   - Tabla con los próximos 30 días
   - Estado de cada fecha
   - Estadísticas de disponibilidad

## 🎨 Estilos y UX

- **Diseño consistente** con el resto de la aplicación
- **Formularios intuitivos** con validaciones
- **Tablas organizadas** para fácil gestión
- **Botones de acción** claros y accesibles
- **Mensajes de error** informativos
- **Estados de carga** para mejor experiencia

## 🔒 Seguridad

- **Autenticación requerida** para todas las operaciones
- **Validación de datos** en frontend y backend
- **Sanitización de inputs** para prevenir inyecciones
- **Tokens JWT** para sesiones seguras

## 🚀 Beneficios para el Negocio

1. **Flexibilidad Total**: Control completo sobre horarios y disponibilidad
2. **Ahorro de Tiempo**: No más llamadas para consultar disponibilidad
3. **Mejor Planificación**: Vista clara de la agenda futura
4. **Gestión de Personal**: Bloquear horarios cuando hay menos personal
5. **Mantenimiento**: Bloquear fechas para trabajos de mantenimiento
6. **Feriados**: Configurar automáticamente días no laborables

## 📋 Casos de Uso Comunes

### **Feriados y Cierres**
- Bloquear fechas completas con motivo "Feriado Nacional"
- Bloquear fechas con motivo "Cierre por mantenimiento"

### **Personal Reducido**
- Bloquear horarios específicos con motivo "Personal reducido"
- Útil para días de semana con menos empleados

### **Mantenimiento Parcial**
- Bloquear horarios específicos con motivo "Mantenimiento equipos"
- Mantener el negocio abierto pero con horarios limitados

### **Eventos Especiales**
- Bloquear fechas para eventos corporativos
- Bloquear horarios para limpieza profunda

## 🔄 Flujo de Trabajo Recomendado

1. **Configuración Inicial**: Establecer horarios y capacidad del negocio
2. **Planificación Mensual**: Revisar y bloquear fechas conocidas (feriados, etc.)
3. **Gestión Semanal**: Ajustar horarios según disponibilidad de personal
4. **Monitoreo Diario**: Revisar disponibilidad y hacer ajustes si es necesario

## 🆘 Soporte y Mantenimiento

- **Logs del sistema** para debugging
- **Validaciones robustas** para prevenir errores
- **Manejo de errores** con mensajes claros
- **Backup automático** de la base de datos

---

**¡El sistema está listo para usar!** 🎉

Para comenzar, accede a `/admin/disponibilidad` y configura tu negocio según tus necesidades.
