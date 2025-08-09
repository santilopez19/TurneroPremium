const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000'

export async function fetchAvailability(dateIso: string): Promise<string[]> {
  const url = new URL('/api/availability', API_URL)
  url.searchParams.set('date', dateIso)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Error al cargar disponibilidad')
  const data = await res.json()
  return data?.slots || []
}

export async function createAppointment(input: { firstName: string, lastName: string, phone: string, date: string, time: string }) {
  const res = await fetch(`${API_URL}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || 'No se pudo crear el turno')
  }
  return res.json()
}

export async function adminLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) throw new Error('Credenciales inválidas')
  const data = await res.json()
  return data.token as string
}

export async function getAdminAppointments(token: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/api/admin/appointments`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al cargar turnos')
  return res.json()
}

export async function getAdminAppointmentsRange(token: string, from?: string, to?: string): Promise<any[]> {
  const url = new URL('/api/admin/appointments', API_URL)
  if (from) url.searchParams.set('from', from)
  if (to) url.searchParams.set('to', to)
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al cargar turnos')
  return res.json()
}

export async function markReady(id: string, token: string) {
  const res = await fetch(`${API_URL}/api/admin/appointments/${id}/ready`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('No se pudo marcar como listo')
  return res.json()
}

export async function runReminders(token: string) {
  const res = await fetch(`${API_URL}/api/admin/run-reminders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('No se pudo ejecutar los recordatorios')
  return res.json()
}


