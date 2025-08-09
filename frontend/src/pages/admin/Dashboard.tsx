import { useEffect, useMemo, useState } from 'react'
import { getAdminAppointments, getAdminAppointmentsRange, markReady, runReminders } from '../../services/api'

type Appt = {
  id: string
  firstName: string
  lastName: string
  phone: string
  licensePlate: string
  dateTime: string
  status?: string
}

export default function Dashboard() {
  const [items, setItems] = useState<Appt[]>([])
  const [error, setError] = useState('')
  const [todayCount, setTodayCount] = useState(0)
  const [q, setQ] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('admintoken') || ''
    getAdminAppointments(token)
      .then(setItems)
      .catch(() => setError('No se pudieron cargar los turnos'))
    // Contador de hoy
    const today = new Date()
    const start = new Date(today); start.setHours(0,0,0,0)
    const end = new Date(today); end.setHours(23,59,59,999)
    getAdminAppointmentsRange(token, start.toISOString(), end.toISOString())
      .then(list => setTodayCount(list.length))
      .catch(() => {})
  }, [])

  return (
    <section className="section">
      <div className="container">
        <h2>Turnos agendados</h2>
        <p className="form-message">Tenés {todayCount} turnos para hoy</p>
        <div style={{display:'flex', gap:12, margin:'12px 0', alignItems:'center', flexWrap:'wrap'}}>
          <input placeholder="Buscar por nombre o patente" value={q} onChange={e=>setQ(e.target.value)} style={{padding:'8px', borderRadius:8, border:'1px solid var(--border)', background:'#0f1517', color:'var(--text)'}} />
          <a className="btn btn-secondary" href="/admin/historial">Ver historial</a>
        </div>
        {error && <p className="form-message">{error}</p>}
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>WhatsApp</th>
                <th>Patente</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.filter(a => {
                const text = `${a.firstName} ${a.lastName} ${a.licensePlate}`.toLowerCase()
                return text.includes(q.trim().toLowerCase())
              }).map(a => {
                const d = new Date(a.dateTime)
                const fecha = d.toLocaleDateString('es-AR')
                const hora = d.toTimeString().slice(0,5)
                const onReady = async () => {
                  const token = localStorage.getItem('admintoken') || ''
                  await markReady(a.id, token)
                  // Optimista: actualizar status localmente
                  setItems(prev => prev.map(p => p.id === a.id ? { ...p, status: 'ready' as any } : p))
                }
                return (
                  <tr key={a.id} className="table-row">
                    <td className="td-fecha">{fecha}</td>
                    <td className="td-hora">{hora}</td>
                    <td className="td-cliente">{a.firstName} {a.lastName}</td>
                    <td className="td-wa">{a.phone}</td>
                    <td className="td-patente">{a.licensePlate}</td>
                    <td>
                      <button className={a.status === 'ready' ? 'btn btn-muted' : 'btn btn-primary'} onClick={onReady} disabled={a.status === 'ready'}>
                        {a.status === 'ready' ? 'Listo' : 'Marcar listo'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}


