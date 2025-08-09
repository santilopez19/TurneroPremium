# Turnero Premium – Frontend

Frontend en Vite + React + React Router. Consume la API del backend premium.

## Requisitos
- Node 18+
- npm

## Instalación y ejecución
```bash
npm install
npm run dev        # http://localhost:5173

# build de producción
npm run build
npm run preview    # previsualización local
```

## Variables de entorno
Crear `.env` (o `.env.local`) con:
```ini
VITE_API_URL=http://localhost:4000
```
Si no se define, por defecto usa `http://localhost:4000`.

## Estructura relevante
- `src/App.tsx`: rutas principales
- `src/pages/Home.tsx`: landing
- `src/pages/Booking.tsx`: sacar turno
- `src/pages/admin/Login.tsx`: login admin
- `src/pages/admin/Dashboard.tsx`: administrar turnos actuales
- `src/pages/admin/History.tsx`: historial de turnos
- `src/pages/Cancel.tsx`: cancelar turno por token
- `src/services/api.ts`: funciones para consumir la API (`availability`, `appointments`, `auth`, `admin`)
- `src/components/*`: Header, Footer, SocialBar, LocationCard, etc.
- `src/style.css` y `src/theme.css`: estilos base

## Flujo de uso
1. Usuario ingresa a Home y navega a “Sacar turno”
2. El formulario consulta `GET /api/availability?date=YYYY-MM-DD`
3. Envía `POST /api/appointments` con los datos del turno
4. Puede cancelar desde un enlace (vista `Cancel`) que valida y confirma cancelación
5. Admin inicia sesión (`/api/auth/login`) y gestiona turnos desde Dashboard/History

## Scripts npm
- `dev`: servidor de desarrollo con Vite
- `build`: compila TypeScript y genera bundle de producción
- `preview`: sirve el build para pruebas locales

## Integración con Backend
- Asegurate de que el backend esté corriendo y accesible
- Configurá `VITE_API_URL` para apuntar al backend

## Deploy
- Salida de build en `dist/`
- Servir `dist` detrás de un servidor estático (Nginx, Vercel, Netlify, etc.)
- Configurar `VITE_API_URL` en el entorno de build/deploy
