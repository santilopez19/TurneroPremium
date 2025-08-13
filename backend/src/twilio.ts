import 'dotenv/config'
import Twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID || ''
const authToken = process.env.TWILIO_AUTH_TOKEN || ''
const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

export async function sendWhatsApp(to: string, body: string) {
  if (!accountSid || !authToken) {
    console.warn('Twilio no configurado. Mensaje simulado:', { to, body })
    return
  }
  const client = Twilio(accountSid, authToken)
  await client.messages.create({ from, to: `whatsapp:${to}`, body })
}

export function buildReminderMessage(name: string, date: Date) {
  const hora = date.toTimeString().slice(0,5)
  return `¡Hola ${name}! Te recordamos tu turno en Barbería a las ${hora}. Te esperamos.`
}

export function buildReadyMessage(name: string) {
  return `¡Hola ${name}! Tu corte ya está listo en Barbería. Podés pasar a retirarte. ¡Gracias!`
}


