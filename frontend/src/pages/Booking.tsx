import { useEffect, useMemo, useState } from 'react'
import { fetchAvailability, createAppointment } from '../services/api'
import TimeSlotPicker from '../shared/TimeSlotPicker'
import LocationCard from '../components/LocationCard'

export default function Booking() {
  const today = useMemo(() => new Date(), [])
  const [date, setDate] = useState<string>(formatLocalDate(today))
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    let mounted = true
    setSelectedSlot('')
    fetchAvailability(date)
      .then(list => { if (mounted) setSlots(list) })
      .catch(() => setSlots([]))
    return () => { mounted = false }
  }, [date])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) { setMessage('Seleccioná un horario.'); return }
    if (!firstName || !lastName || !phone || !licensePlate) { setMessage('Completá tus datos.'); return }
    setLoading(true)
    setMessage('')
    try {
      await createAppointment({ firstName, lastName, phone, licensePlate, date, time: selectedSlot } as any)
      setMessage('¡Listo! Tu turno fue reservado. Te recordaremos 2 horas antes por WhatsApp.')
      setFirstName(''); setLastName(''); setPhone(''); setLicensePlate(''); setSelectedSlot('')
    } catch (err: any) {
      setMessage(err?.message || 'No se pudo reservar el turno. Intentá nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <h2>Reservá tu turno</h2>
        <form className="form" onSubmit={onSubmit}>
          <div className="form-row">
            <label>Seleccioná el día</label>
            <DayStrip selectedDate={date} onSelect={setDate} baseDate={today} />
          </div>
          <div className="form-row">
            <label>Horario disponible</label>
            <TimeSlotPicker slots={slots} selected={selectedSlot} onSelect={setSelectedSlot} />
          </div>
          <div className="form-grid">
            <label>Nombre
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nombre" />
            </label>
            <label>Apellido
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Apellido" />
            </label>
          </div>
          <div className="form-row">
            <label>WhatsApp
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej: +54911XXXXXXXX" />
            </label>
            <label>Patente
              <input type="text" value={licensePlate} onChange={e => setLicensePlate(e.target.value.toUpperCase())} placeholder="Ej: AA123BB" />
            </label>
            <small>Usá formato E.164 (ej: +54911...) para recibir el recordatorio.</small>
          </div>
          {message && <p className="form-message">{message}</p>}
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Reservando...' : 'Confirmar turno'}</button>
        </form>
        <div style={{ marginTop: 16 }}>
          <LocationCard mapsUrl="https://maps.app.goo.gl/SwDDanPtfydrRJdb6" />
        </div>
      </div>
    </section>
  )
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('es-AR', { weekday: 'long' }).replace(/^(.)/, (m) => m.toUpperCase())
}

function DayStrip({ selectedDate, onSelect, baseDate }: { selectedDate: string, onSelect: (iso: string) => void, baseDate: Date }) {
  const items: { label: string, iso: string }[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(baseDate, i)
    // Omitir domingo (0)
    if (d.getDay() === 0) continue
    const iso = formatLocalDate(d)
    items.push({ label: `${formatDayLabel(d)} ${d.getDate()}`, iso })
  }
  return (
    <div className="slots">
      {items.map(it => (
        <button key={it.iso} type="button" className={it.iso === selectedDate ? 'slot selected' : 'slot'} onClick={() => onSelect(it.iso)}>
          {it.label}
        </button>
      ))}
    </div>
  )
}


