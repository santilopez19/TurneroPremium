"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const zod_1 = require("zod");
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
// Eliminamos dependencias de date-fns-tz para simplificar: trabajamos en hora local del servidor
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const TZ = process.env.TIMEZONE || 'America/Argentina/Buenos_Aires';
const JWT_SECRET = process.env.JWT_SECRET || 'barberia_dev_secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@barberia.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';
const REMINDER_WEBHOOK_KEY = process.env.REMINDER_WEBHOOK_KEY || 'dev_key';
// Helpers (hora local)
function buildLocalDate(dateIso, timeHHmm) {
    const [y, m, d] = dateIso.split('-').map(Number);
    const [hh, mm] = timeHHmm.split(':').map(Number);
    return new Date(y, (m - 1), d, hh, mm, 0, 0);
}
function pad(n) { return String(n).padStart(2, '0'); }
function cryptoRandom() { return crypto_1.default.randomBytes(12).toString('hex'); }
// Business rules
// Horario: 08:30 a 18:30, capacidad 2 por horario
const OPEN_START = { hour: 8, minute: 30 };
const CLOSE_END = { hour: 18, minute: 30 };
const SLOT_MINUTES = 60;
function generateDailySlots(dateIso) {
    // Horas: 08:30, 09:30, ..., 18:30
    const slots = [];
    for (let h = OPEN_START.hour; h <= CLOSE_END.hour; h++) {
        const hh = String(h).padStart(2, '0');
        const mm = h === OPEN_START.hour ? OPEN_START.minute : 30;
        const display = `${hh}:${String(mm).padStart(2, '0')}`;
        slots.push(display);
    }
    return slots;
}
// Endpoints
app.get('/api/availability', async (req, res) => {
    const dateIso = String(req.query.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso))
        return res.status(400).json({ message: 'Fecha inválida' });
    const all = generateDailySlots(dateIso);
    // Calcular inicio y fin del día en hora local
    const [y, m, d] = dateIso.split('-').map(Number);
    const startLocal = new Date(y, (m - 1), d, 0, 0, 0, 0);
    const endLocal = new Date(y, (m - 1), d, 23, 59, 59, 999);
    const busy = await prisma.appointment.findMany({
        where: {
            dateTime: {
                gte: startLocal,
                lt: endLocal,
            }
        },
        select: { dateTime: true }
    });
    // Contar reservas por horario local
    const countByTime = new Map();
    for (const b of busy) {
        const hh = pad(new Date(b.dateTime).getHours());
        const mm = pad(new Date(b.dateTime).getMinutes());
        const key = `${hh}:${mm}`;
        countByTime.set(key, (countByTime.get(key) || 0) + 1);
    }
    // Disponibles si hay menos de 2 reservas en ese horario
    let free = all.filter(s => (countByTime.get(s) || 0) < 2);
    // Si es el día de hoy, ocultar horarios de la hora actual hacia atrás (ej.: a las 12 no mostrar 12:30)
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    if (dateIso === todayIso) {
        const nowHour = now.getHours();
        free = free.filter(t => parseInt(t.slice(0, 2), 10) > nowHour);
    }
    res.json({ date: dateIso, slots: free });
});
const CreateAppointment = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(8),
    service: zod_1.z.string().min(3).max(50),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
});
app.post('/api/appointments', async (req, res) => {
    const parsed = CreateAppointment.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ message: 'Datos inválidos' });
    const { firstName, lastName, phone, service, date, time } = parsed.data;
    const dateTimeUtc = buildLocalDate(date, time);
    try {
        // Capacidad 2 por horario
        const count = await prisma.appointment.count({ where: { dateTime: dateTimeUtc } });
        if (count >= 2)
            return res.status(409).json({ message: 'No hay cupo para ese horario' });
        // Restricción: máximo 2 turnos por día por número de WhatsApp
        const startDay = new Date(dateTimeUtc);
        startDay.setHours(0, 0, 0, 0);
        const endDay = new Date(dateTimeUtc);
        endDay.setHours(23, 59, 59, 999);
        const perDayByPhone = await prisma.appointment.count({
            where: { phone, dateTime: { gte: startDay, lte: endDay } }
        });
        if (perDayByPhone >= 2)
            return res.status(409).json({ message: 'Máximo 2 turnos por día por WhatsApp' });
        const created = await prisma.appointment.create({
            data: { firstName, lastName, phone, service, dateTime: dateTimeUtc, cancelToken: cryptoRandom() }
        });
        res.json(created);
    }
    catch (e) {
        res.status(500).json({ message: 'Error al crear turno' });
    }
});
// Auth simple para admin
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password)
        return res.status(400).json({ message: 'Credenciales requeridas' });
    // Permitir login con env o con usuario en DB
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const token = jsonwebtoken_1.default.sign({ sub: 'env-admin', email }, JWT_SECRET, { expiresIn: '12h' });
        return res.json({ token });
    }
    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user || user.password !== password)
        return res.status(401).json({ message: 'Credenciales inválidas' });
    const token = jsonwebtoken_1.default.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token });
});
function auth(req, res, next) {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token)
        return res.status(401).json({ message: 'No autorizado' });
    try {
        jsonwebtoken_1.default.verify(token, JWT_SECRET);
        next();
    }
    catch {
        return res.status(401).json({ message: 'Token inválido' });
    }
}
app.get('/api/admin/appointments', auth, async (req, res) => {
    const from = String(req.query.from || '');
    const to = String(req.query.to || '');
    const where = {};
    if (from || to) {
        where.dateTime = {};
        if (from)
            where.dateTime.gte = new Date(from);
        if (to)
            where.dateTime.lte = new Date(to);
    }
    else {
        // Por defecto, devolver sólo turnos desde hoy (00:00) en adelante
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        where.dateTime = { gte: t };
    }
    const list = await prisma.appointment.findMany({ where, orderBy: { dateTime: 'asc' } });
    res.json(list);
});
async function runReminders() {
    const now = new Date();
    const inThirty = new Date(now.getTime() + 30 * 60 * 1000);
    const pending = await prisma.appointment.findMany({
        where: {
            reminderSent: false,
            status: { not: 'canceled' },
            dateTime: { gte: now, lte: inThirty },
        }
    });
    for (const appt of pending) {
        try {
            // En producción, mandar WhatsApp con Twilio
            // await sendWhatsApp(appt.phone, buildReminderMessage(appt.firstName, appt.dateTime))
            await prisma.appointment.update({ where: { id: appt.id }, data: { reminderSent: true, reminderSentAt: new Date() } });
            console.log('Recordatorio marcado como enviado para', appt.id);
        }
        catch (e) {
            console.error('Fallo recordatorio', appt.id, e);
        }
    }
}
// Cron de recordatorios cada 5 minutos (30 min antes)
node_cron_1.default.schedule('*/5 * * * *', () => { runReminders().catch(() => { }); }, { timezone: TZ });
// Cron nocturno: archiva (status=done) todos los turnos anteriores a hoy
node_cron_1.default.schedule('5 0 * * *', async () => {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    await prisma.appointment.updateMany({
        where: { dateTime: { lt: startToday }, status: { not: 'done' } },
        data: { status: 'done' }
    });
    console.log('Archivo de turnos anterior a hoy completado');
}, { timezone: TZ });
app.get('/health', (_req, res) => res.json({ ok: true }));
// Endpoint para ejecutar recordatorios manualmente (admin)
app.post('/api/admin/run-reminders', auth, async (_req, res) => {
    await runReminders();
    res.json({ ok: true });
});
// Endpoint público con key para cron-job.org
app.get('/api/run-reminders', async (req, res) => {
    const key = String(req.query.key || '');
    if (key !== REMINDER_WEBHOOK_KEY)
        return res.status(401).json({ message: 'Unauthorized' });
    await runReminders();
    res.json({ ok: true });
});
// Marcar cliente como listo y notificar
app.post('/api/admin/appointments/:id/ready', auth, async (req, res) => {
    const { id } = req.params;
    try {
        const appt = await prisma.appointment.update({ where: { id }, data: { status: 'ready', readyAt: new Date(), attended: true } });
        // await sendWhatsApp(appt.phone, buildReadyMessage(appt.firstName))
        res.json(appt);
    }
    catch (e) {
        res.status(404).json({ message: 'Turno no encontrado' });
    }
});
// Cancelar turno por link seguro
app.get('/api/appointments/cancel/:token', async (req, res) => {
    const { token } = req.params;
    const appt = await prisma.appointment.findUnique({ where: { cancelToken: token } });
    if (!appt)
        return res.status(404).json({ message: 'Enlace inválido' });
    res.json({
        id: appt.id,
        dateTime: appt.dateTime,
        firstName: appt.firstName,
        lastName: appt.lastName,
        service: appt.service,
        phone: appt.phone,
        status: appt.status,
    });
});
app.post('/api/appointments/cancel/:token', async (req, res) => {
    const { token } = req.params;
    const appt = await prisma.appointment.findUnique({ where: { cancelToken: token } });
    if (!appt)
        return res.status(404).json({ message: 'Enlace inválido' });
    if (appt.status === 'canceled')
        return res.json(appt);
    const updated = await prisma.appointment.update({ where: { id: appt.id }, data: { status: 'canceled' } });
    res.json(updated);
});
app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
});
