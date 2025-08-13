"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsApp = sendWhatsApp;
exports.buildReminderMessage = buildReminderMessage;
exports.buildReadyMessage = buildReadyMessage;
require("dotenv/config");
const twilio_1 = __importDefault(require("twilio"));
const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
async function sendWhatsApp(to, body) {
    if (!accountSid || !authToken) {
        console.warn('Twilio no configurado. Mensaje simulado:', { to, body });
        return;
    }
    const client = (0, twilio_1.default)(accountSid, authToken);
    await client.messages.create({ from, to: `whatsapp:${to}`, body });
}
function buildReminderMessage(name, date) {
    const hora = date.toTimeString().slice(0, 5);
    return `¡Hola ${name}! Te recordamos tu turno en Barbería a las ${hora}. Te esperamos.`;
}
function buildReadyMessage(name) {
    return `¡Hola ${name}! Tu corte ya está listo en Barbería. Podés pasar a retirarte. ¡Gracias!`;
}
