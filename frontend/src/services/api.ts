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

// Nuevas funciones para gestión de configuración del negocio
export async function getBusinessConfig(token: string) {
  const res = await fetch(`${API_URL}/api/admin/business-config`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al cargar configuración')
  return res.json()
}

export async function updateBusinessConfig(token: string, config: {
  openTime: string
  closeTime: string
  slotDuration: number
  maxAppointmentsPerSlot: number
}) {
  const res = await fetch(`${API_URL}/api/admin/business-config`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(config)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || 'Error al actualizar configuración')
  }
  return res.json()
}

// Funciones para gestión de fechas bloqueadas
export async function getBlockedDates(token: string, from?: string, to?: string) {
  const url = new URL('/api/admin/blocked-dates', API_URL)
  if (from) url.searchParams.set('from', from)
  if (to) url.searchParams.set('to', to)
  
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al cargar fechas bloqueadas')
  return res.json()
}

export async function blockDate(token: string, date: string, reason?: string) {
  const res = await fetch(`${API_URL}/api/admin/blocked-dates`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ date, reason })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || 'Error al bloquear fecha')
  }
  return res.json()
}

export async function unblockDate(token: string, date: string) {
  const res = await fetch(`${API_URL}/api/admin/blocked-dates/${date}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al desbloquear fecha')
  return res.json()
}

// Funciones para gestión de horarios bloqueados
export async function getBlockedTimeSlots(token: string, date?: string) {
  const url = new URL('/api/admin/blocked-time-slots', API_URL)
  if (date) url.searchParams.set('date', date)
  
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al cargar horarios bloqueados')
  return res.json()
}

export async function blockTimeSlot(token: string, date: string, time: string, reason?: string) {
  const res = await fetch(`${API_URL}/api/admin/blocked-time-slots`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ date, time, reason })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || 'Error al bloquear horario')
  }
  return res.json()
}

export async function unblockTimeSlot(token: string, date: string, time: string) {
  const res = await fetch(`${API_URL}/api/admin/blocked-time-slots/${date}/${time}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al desbloquear horario')
  return res.json()
}

// Función para obtener disponibilidad futura (admin)
export async function getAdminAvailability(token: string, from: string, to: string) {
  const url = new URL('/api/admin/availability', API_URL)
  url.searchParams.set('from', from)
  url.searchParams.set('to', to)
  
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al cargar disponibilidad')
  return res.json()
}

// Funciones para gestión de soporte
export async function sendSupportMessage(data: {
  category: string
  priority: string
  name?: string
  email?: string
  phone?: string
  message: string
}) {
  const res = await fetch(`${API_URL}/api/support`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || 'Error al enviar mensaje de soporte')
  }
  return res.json()
}

export async function getSupportMessages(token: string, filters?: {
  status?: string
  priority?: string
  category?: string
}) {
  const url = new URL('/api/admin/support-messages', API_URL)
  if (filters?.status) url.searchParams.set('status', filters.status)
  if (filters?.priority) url.searchParams.set('priority', filters.priority)
  if (filters?.category) url.searchParams.set('category', filters.category)
  
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Error al cargar mensajes de soporte')
  return res.json()
}

export async function updateSupportMessage(token: string, id: string, data: {
  status?: string
  response?: string
}) {
  const res = await fetch(`${API_URL}/api/admin/support-messages/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || 'Error al actualizar mensaje de soporte')
  }
  return res.json()
}


