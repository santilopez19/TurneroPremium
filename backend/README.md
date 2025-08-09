# Turnero Premium – Backend

Backend en Node.js (Express + TypeScript) con Prisma (SQLite), JWT para admin y recordatorios por WhatsApp (Twilio opcional).

## Requisitos
- Node 18+
- npm

## Instalación y ejecución
```bash
# instalar deps
npm install

# preparar base de datos (SQLite)
cp .env.example .env   # crea tu .env si no existe
npm run prisma:generate
npm run prisma:push    # crea tablas según schema
npm run seed           # opcional: usuarios/admin de prueba

# desarrollo
npm run dev            # http://localhost:4000

# build + start
npm run build
npm start
```

## Variables de entorno (.env)
```ini
# Server
PORT=4000
TIMEZONE=America/Argentina/Buenos_Aires
JWT_SECRET=super_secreto

# Admin por ENV (opcional, además de los de DB)
ADMIN_EMAIL=admin@ecolavado.local
ADMIN_PASSWORD=admin1234

# Prisma / SQLite
DATABASE_URL="file:./dev.db"

# Twilio (opcional para WhatsApp)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Webhook público para cron externo
REMINDER_WEBHOOK_KEY=alguna_clave_segura
```

## Scripts npm
- `dev`: ejecuta con ts-node-dev
- `build`: compila TypeScript
- `start`: levanta desde `dist`
- `prisma:generate`: genera cliente Prisma
- `prisma:migrate`: crea una migración (entorno local)
- `prisma:push`: sincroniza schema con la DB (dev)
- `seed`: si tenés `src/seed.ts` poblá datos iniciales
- `test`: corre Jest

## Modelo de datos (resumen)
- `Appointment`: turno con `dateTime`, `status` (confirmed | ready | done | canceled), `cancelToken`, flags de recordatorio, etc.
- `AdminUser`: admins para login via DB (alternativo a `ADMIN_EMAIL/PASSWORD`).

Base: `backend/prisma/schema.prisma` (SQLite por defecto). El archivo de DB está en `backend/prisma/dev.db`.

## Reglas de negocio (actuales)
- Horarios por día: 08:30, 09:30, …, 18:30 (1 hora entre turnos, empezando en y30)
- Capacidad: 2 turnos por horario
- Límite por WhatsApp: máx 2 turnos por día por número
- Día actual: oculta horarios de la hora actual hacia atrás
- Recordatorios: cada 5 minutos se marcan como enviados a los turnos que ocurren en los próximos 30 minutos (Twilio opcional)
- Cierre nocturno: a medianoche se marcan como `done` los turnos anteriores al día actual

## API
Base URL por defecto: `http://localhost:4000`

- Salud
  - `GET /health` → `{ ok: true }`

- Disponibilidad
  - `GET /api/availability?date=YYYY-MM-DD`
  - Respuesta: `{ date, slots: string[] }`

- Crear turno
  - `POST /api/appointments`
  - Body JSON:
    ```json
    {
      "firstName": "Juan",
      "lastName": "Pérez",
      "phone": "+5493511111111",
      "licensePlate": "ABC123",
      "date": "2025-08-10",
      "time": "10:30"
    }
    ```
  - Errores frecuentes: `400` datos inválidos, `409` sin cupo o límite por WhatsApp

- Auth admin (JWT)
  - `POST /api/auth/login` → `{ token }`
  - Acepta credenciales de ENV (`ADMIN_EMAIL/ADMIN_PASSWORD`) o de tabla `AdminUser`

- Panel admin (requiere `Authorization: Bearer <token>`)
  - `GET /api/admin/appointments` → lista desde hoy por defecto
  - `GET /api/admin/appointments?from=ISO&to=ISO` → rango
  - `POST /api/admin/appointments/:id/ready` → marca como `ready` y `attended`
  - `POST /api/admin/run-reminders` → ejecuta recordatorios manualmente

- Cancelación por link seguro
  - `GET /api/appointments/cancel/:token` → datos del turno
  - `POST /api/appointments/cancel/:token` → marca `canceled`

- Webhook público (para cron-job.org u otros)
  - `GET /api/run-reminders?key=REMINDER_WEBHOOK_KEY` → ejecuta recordatorios

### Ejemplos con curl
```bash
# disponibilidad
curl "http://localhost:4000/api/availability?date=2025-08-10"

# crear turno
curl -X POST http://localhost:4000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Juan","lastName":"Pérez","phone":"+5493511111111",
    "licensePlate":"ABC123","date":"2025-08-10","time":"10:30"
  }'

# login admin
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecolavado.local","password":"admin1234"}' | jq -r .token)

# listar admin
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/admin/appointments
```

## Twilio (WhatsApp)
Configurar variables `TWILIO_*` y descomentar envíos en `src/index.ts`/`src/twilio.ts` si querés enviar mensajes reales.

## Tests
```bash
npm test
```

## Deploy
- Sugerido: contenedores o servicio con Node 18+
- Configurar `.env`, base de datos y cron externo (opcional) llamando `GET /api/run-reminders?key=...`
- Exponer sólo el puerto HTTP/HTTPS del backend
