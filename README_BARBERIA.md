# Sistema de Turnos para Barbería

Este proyecto contiene un sistema completo de turnos online para una barbería, con backend en Node.js (Express + TypeScript + Prisma/SQLite) y frontend en Vite + React.

## Características

- **Reserva de turnos online**: Los clientes pueden reservar turnos desde el sitio web
- **Panel de administración**: Los barberos pueden gestionar turnos, marcar como listos y ver historial
- **Recordatorios automáticos**: Envío automático de recordatorios por WhatsApp 30 minutos antes
- **Gestión de servicios**: Diferentes tipos de servicios (Corte Clásico, Moderno, Barba, etc.)
- **Horarios flexibles**: Configuración de horarios de trabajo y capacidad por turno
- **Cancelación online**: Los clientes pueden cancelar turnos desde un enlace seguro

## Servicios Disponibles

- Corte Clásico
- Corte Moderno
- Barba y Bigote
- Corte + Barba
- Degradado
- Otros servicios personalizados

## Requisitos

- Node.js 18+
- npm
- Base de datos SQLite (incluida)

## Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd TurneroBarberiaPremium
```

### 2. Configurar el Backend
```bash
cd backend
npm install

# Crear archivo .env
cp .env.example .env
# Editar .env con tus configuraciones
```

Variables de entorno necesarias:
```env
PORT=4000
TIMEZONE=America/Argentina/Buenos_Aires
JWT_SECRET=tu_clave_secreta_aqui
ADMIN_EMAIL=admin@tubarberia.com
ADMIN_PASSWORD=tu_contraseña_segura
DATABASE_URL="file:./dev.db"
REMINDER_WEBHOOK_KEY=clave_para_webhooks
# Opcional: Twilio para WhatsApp
TWILIO_ACCOUNT_SID=tu_sid
TWILIO_AUTH_TOKEN=tu_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 3. Configurar la Base de Datos
```bash
npm run prisma:generate
npm run prisma:push
npm run seed  # Opcional: crear datos de prueba
```

### 4. Configurar el Frontend
```bash
cd ../frontend
npm install

# Crear archivo .env (opcional)
echo "VITE_API_URL=http://localhost:4000" > .env
```

## Uso

### Desarrollo

#### Backend
```bash
cd backend
npm run dev
# Servidor corriendo en http://localhost:4000
```

#### Frontend
```bash
cd frontend
npm run dev
# Sitio corriendo en http://localhost:5173
```

### Producción

#### Backend
```bash
cd backend
npm run build
npm start
```

#### Frontend
```bash
cd frontend
npm run build
# Los archivos se generan en frontend/dist
```

## Estructura del Proyecto

```
├── backend/                 # API y lógica de negocio
│   ├── prisma/             # Esquema de base de datos
│   ├── src/                # Código fuente
│   │   ├── index.ts        # Servidor principal
│   │   ├── twilio.ts       # Integración WhatsApp
│   │   └── seed.ts         # Datos de prueba
│   └── package.json
├── frontend/               # Interfaz de usuario
│   ├── src/
│   │   ├── pages/          # Páginas principales
│   │   ├── components/      # Componentes reutilizables
│   │   ├── services/        # Cliente de API
│   │   └── shared/          # Componentes compartidos
│   └── package.json
└── README.md
```

## API Endpoints

### Públicos
- `GET /api/availability?date=YYYY-MM-DD` - Obtener horarios disponibles
- `POST /api/appointments` - Crear turno
- `GET /api/appointments/cancel/:token` - Ver turno para cancelar
- `POST /api/appointments/cancel/:token` - Cancelar turno

### Administrativos (requieren JWT)
- `POST /api/auth/login` - Iniciar sesión admin
- `GET /api/admin/appointments` - Listar turnos
- `POST /api/admin/appointments/:id/ready` - Marcar como listo
- `POST /api/admin/run-reminders` - Ejecutar recordatorios

## Configuración de WhatsApp

Para habilitar recordatorios automáticos por WhatsApp:

1. Crear cuenta en [Twilio](https://www.twilio.com/)
2. Activar WhatsApp Sandbox
3. Configurar variables de entorno en `.env`
4. Descomentar envíos en `backend/src/index.ts`

## Personalización

### Cambiar Horarios
Editar en `backend/src/index.ts`:
```typescript
const OPEN_START = { hour: 8, minute: 30 }
const CLOSE_END = { hour: 18, minute: 30 }
```

### Agregar Servicios
Editar en `frontend/src/pages/Booking.tsx`:
```typescript
<option value="Nuevo Servicio">Nuevo Servicio</option>
```

### Cambiar Capacidad
Editar en `backend/src/index.ts`:
```typescript
if (count >= 2) // Cambiar 2 por la capacidad deseada
```

## Soporte

Para soporte técnico o consultas sobre el sistema, contactar al desarrollador.

## Licencia

Este proyecto es de uso interno para la barbería.


