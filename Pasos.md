# Preparar proyecto web para cliente
_Exported on 8/9/2025 at 11:19:25 GMT-3 from Cursor (1.4.3)_

---

**User**

Decime que es lo que tengo qeu hacer para dejar funcional todo listo andando par que lo empiece a usar el cliente, donde compro el dominio, donde hosteo la pagina, como creo la base de datos en mongo, como configuro whats app, l oque haga falta.

---

**Cursor**

Voy a revisar rápidamente el código del backend y configuraciones (Prisma, Twilio, server) para darte una guía precisa de despliegue, variables de entorno y opciones de hosting y dominio alineadas a este proyecto. Luego te paso un checklist paso a paso.

Voy a abrir los archivos clave del backend (`index.ts`, `twilio.ts`, `seed.ts`) para entender cómo arranca el servidor, qué variables de entorno usa y cómo integra WhatsApp/Twilio. Luego te armo el checklist y opciones de hosting/dominio alineadas a esto.

Voy a revisar el cliente (`frontend/src/services/api.ts`) y un par de páginas para ver cómo llaman a la API (URL base, envs) y así darte el plan de deploy coherente entre front y back.

Voy a darte un checklist claro, con la "ruta recomendada" para poner esto online rápido y estable. También te dejo alternativas (VPS con SQLite, o Postgres) por si preferís otra base.

### Ruta recomendada (rápida y estable)
- Backend: Render (Node service)
- Base de datos: MongoDB Atlas (gratuita)
- Frontend: Vercel (o Netlify)
- Dominio: Namecheap (o NIC.ar para .com.ar)
- WhatsApp: Twilio (Sandbox para pruebas, Business para producción)

### 1) Comprar dominio
- Opciones:
  - Namecheap (fácil y barato, .com/.com.ar via terceros)
  - NIC.ar (si querés `.com.ar`)
- Luego vas a apuntar:
  - `www.tudominio.com` → Frontend (Vercel/Netlify via CNAME)
  - `api.tudominio.com` → Backend (Render via CNAME)

### 2) Crear la base de datos en MongoDB Atlas
- Crear cuenta en `https://www.mongodb.com/atlas`
- Crear "Shared Cluster" (M0, gratis)
- Crear usuario de DB (user/pass) y habilitar IP Access (0.0.0.0/0 o IP de tu backend)
- Obtener la cadena de conexión `mongodb+srv://.../turneros?retryWrites=true&w=majority`
- Vas a usarla en `DATABASE_URL` del backend

Nota importante: hoy tu backend está en Prisma con SQLite. Para usar Mongo, deberías cambiar el datasource en `prisma/schema.prisma` a `mongodb` y adaptar los IDs. A alto nivel:
- `provider = "mongodb"`
- En cada modelo, `id String @id @default(auto()) @map("_id") @db.ObjectId`
- Ejecutar: `npx prisma generate` y luego `npx prisma db push`

Ejemplo de `Appointment` adaptado (referencia para tu dev):
```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model Appointment {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  firstName      String
  lastName       String
  phone          String
  service        String
  dateTime       DateTime
  status         String   @default("confirmed")
  reminderSent   Boolean  @default(false)
  reminderSentAt DateTime?
  readyAt        DateTime?
  attended       Boolean  @default(false)
  cancelToken    String?  @unique
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([dateTime])
}

model AdminUser {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
}
```

### 3) Backend en Render
- Conectá el repo a Render como "Web Service"
- Build command (Render → Build Command):
  - `npm ci && npx prisma generate && npm run build`
- Start command:
  - `npm run start`
- Variables de entorno (Render → Environment):
```ini
PORT=4000
TIMEZONE=America/Argentina/Buenos_Aires
JWT_SECRET=colocá_uno_largo_y_unico
ADMIN_EMAIL=admin@tusitio.com
ADMIN_PASSWORD=definí_uno_fuerte
DATABASE_URL=mongodb+srv://user:pass@cluster/turneros?retryWrites=true&w=majority
REMINDER_WEBHOOK_KEY=clave_unica_para_webhook
# Twilio (opcional para WhatsApp real)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```
- Primer despliegue: tras el build, corré una vez "Shell" o "Job" con:
  - `npx prisma db push`
  - (opcional) crear admin en DB si no usás `ADMIN_EMAIL/ADMIN_PASSWORD`

- Recordatorios:
  - Tu backend ya corre cron cada 5 minutos. Si el hosting duerme en free tier, creá un cron externo en `https://cron-job.org` que pegue cada 5 min:
    - `GET https://api.tudominio.com/api/run-reminders?key=REMINDER_WEBHOOK_KEY`

- WhatsApp real (opcional):
  - En `backend/src/index.ts` descomentá los envíos donde corresponde.
```startLine:endLine:backend/src/index.ts
// ... existing code ...
      // En producción, mandar WhatsApp con Twilio
      // await sendWhatsApp(appt.phone, buildReminderMessage(appt.firstName, appt.dateTime))
      await prisma.appointment.update({ where: { id: appt.id }, data: { reminderSent: true, reminderSentAt: new Date() } })
// ... existing code ...
```
```startLine:endLine:backend/src/index.ts
// ... existing code ...
    const appt = await prisma.appointment.update({ where: { id }, data: { status: 'ready', readyAt: new Date(), attended: true } })
    // await sendWhatsApp(appt.phone, buildReadyMessage(appt.firstName))
    res.json(appt)
// ... existing code ...
```
  - Asegurate de mandar teléfonos en formato E.164, ej: `+5493511234567`

### 4) Frontend en Vercel (o Netlify)
- Conectá el repo (carpeta `frontend`)
- Variables de entorno del build:
```ini
VITE_API_URL=https://api.tudominio.com
```
- Deploy
- En Vercel agregá tu dominio y apuntá `www.tudominio.com` (y/o raíz) a Vercel. Seguí el asistente para los DNS.

### 5) DNS del dominio
- Panel de tu registrador (Namecheap/NIC.ar/Cloudflare):
  - `www` (CNAME) → tu proyecto de Vercel (CNAME que te da Vercel)
  - `api` (CNAME) → tu servicio de Render (CNAME que te da Render)
  - Opcional: redirigir raíz a `www` (URL redirect) o usar Vercel para el apex
- SSL: Vercel y Render emiten certificados automáticamente cuando el dominio apunta bien.

### 6) Configurar WhatsApp con Twilio
- Crear cuenta en `https://www.twilio.com/`
- Activar WhatsApp Sandbox:
  - Te dan un número `+14155238886` y un código. Enviar ese código desde tu WhatsApp para habilitar el sandbox
  - Usar `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`
- En producción (sin Sandbox):
  - Necesitás WhatsApp Business API aprobada (Facebook Business + Twilio). Cuando Twilio te asigne un número WA, cambiás `TWILIO_WHATSAPP_FROM` a ese.
- Finalmente, descomentá los `sendWhatsApp(...)` en el backend para enviar mensajes reales.

### 7) Pruebas finales
- Front: visitar `https://www.tudominio.com` → "Sacar turno":
  - Seleccionar día/hora → crear turno
- Admin:
  - Login con `ADMIN_EMAIL/ADMIN_PASSWORD`
  - Ver Dashboard e Historia, marcar "listo"
- Cancelación:
  - Probar `/cancel/:token` desde el front
- Recordatorios:
  - Hacer un turno dentro de 30' y verificar que se marque `reminderSent` y que llegue WhatsApp si está habilitado.

### 8) Alternativas y notas
- Si NO querés Mongo ahora:
  - VPS con SQLite (rápido): un servidor (Hetzner/Contabo), Nginx + Node (PM2) + `dev.db` en disco persistente. Es lo más simple.
  - Render/Fly con volumen persistente para SQLite (más técnico, pero sirve).
- Si preferís Postgres gestionado:
  - Neon o Supabase. Cambiás `provider = "postgresql"` en Prisma y corrés migraciones. Excelente para escalar.
- Seguridad:
  - Elegí `JWT_SECRET` y `REMINDER_WEBHOOK_KEY` únicos y largos
  - Restringí CORS si querés (ahora está abierto con `cors()`)

### Variables de entorno (resumen mínimo)
```ini
# Backend
PORT=4000
TIMEZONE=America/Argentina/Buenos_Aires
JWT_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
DATABASE_URL=mongodb+srv://...
REMINDER_WEBHOOK_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Frontend
VITE_API_URL=https://api.tudominio.com
```

- Si querés, te preparo yo la conversión de Prisma a Mongo y te dejo el backend listo para Render con los env; decime si avanzamos por esta ruta o preferís SQLite en VPS.

- Cambios clave que harías vos:
  - Ajustar Prisma a Mongo (o confirmar que seguimos con SQLite)
  - Descomentar envíos WhatsApp si vas a usarlos
  - Cargar envs en Render y Vercel
  - Configurar DNS del dominio

- Entregables para tu cliente:
  - URL pública del front
  - URL del panel admin + usuario/contraseña inicial
  - Dominio y certificados instalados
  - WhatsApp en pruebas o producción (según el estado de Twilio)

- ¿Querés que te lo deje publicado ya con Mongo Atlas + Render + Vercel y dominio? Pasame el dominio elegido y si usamos Twilio Sandbox o vamos directo a Business.

- En cuanto confirmes Mongo vs SQLite y el registrador de dominio, te paso los comandos exactos y procedo con los cambios necesarios.

```plaintext
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model Appointment {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  firstName      String
  lastName       String
  phone          String
  service        String
  dateTime       DateTime
  status         String   @default("confirmed")
  reminderSent   Boolean  @default(false)
  reminderSentAt DateTime?
  readyAt        DateTime?
  attended       Boolean  @default(false)
  cancelToken    String?  @unique
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([dateTime])
}

model AdminUser {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
}
```

```ini
PORT=4000
TIMEZONE=America/Argentina/Buenos_Aires
JWT_SECRET=colocá_uno_largo_y_unico
ADMIN_EMAIL=admin@tusitio.com
ADMIN_PASSWORD=definí_uno_fuerte
DATABASE_URL=mongodb+srv://user:pass@cluster/turneros?retryWrites=true&w=majority
REMINDER_WEBHOOK_KEY=clave_unica_para_webhook
# Twilio (opcional para WhatsApp real)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

```typescript
// ... existing code ...
      // En producción, mandar WhatsApp con Twilio
      // await sendWhatsApp(appt.phone, buildReminderMessage(appt.firstName, appt.dateTime))
      await prisma.appointment.update({ where: { id: appt.id }, data: { reminderSent: true, reminderSentAt: new Date() } })
// ... existing code ...
```

```typescript
// ... existing code ...
    const appt = await prisma.appointment.update({ where: { id }, data: { status: 'ready', readyAt: new Date(), attended: true } })
    // await sendWhatsApp(appt.phone, buildReadyMessage(appt.firstName))
    res.json(appt)
// ... existing code ...
```

```ini
VITE_API_URL=https://api.tudominio.com
```

```ini
# Backend
PORT=4000
TIMEZONE=America/Argentina/Buenos_Aires
JWT_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
DATABASE_URL=mongodb+srv://...
REMINDER_WEBHOOK_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Frontend
VITE_API_URL=https://api.tudominio.com
```

---

**User**

en Namecheap, tengo que comprar el dominio y ademas hostear?

---

**Cursor**

No. En Namecheap solo comprás el dominio (y opcionalmente usás su DNS). El hosting (donde corre tu app) va aparte.

Lo recomendado para tu caso:
- Frontend: Vercel (hosting del sitio)
- Backend: Render (hosting de la API)
- Dominio: Namecheap (solo registro + DNS)

Cómo conectarlos:
- En Vercel: agrega tu dominio. Te va a indicar qué registros crear en Namecheap.
  - `A @ -> 76.76.21.21` (apex)
  - `CNAME www -> cname.vercel-dns.com`
- En Render: copia el "External URL" de tu servicio (ej. `tu-api.onrender.com`).
  - `CNAME api -> tu-api.onrender.com`
- En el frontend (Vercel) setea `VITE_API_URL=https://api.tudominio.com`

Notas:
- Namecheap también vende hosting, pero no lo necesitás si usás Vercel/Render.
- SSL se emite automático en Vercel y Render cuando los DNS apuntan bien.
- Email es otro servicio aparte (Namecheap Email, Google Workspace, etc.), si lo necesitás.

Resumen
- **Dominio**: Namecheap
- **Hosting**: Vercel (front) + Render (API)
- **DNS** en Namecheap: `A @ 76.76.21.21`, `CNAME www cname.vercel-dns.com`, `CNAME api tu-api.onrender.com`

