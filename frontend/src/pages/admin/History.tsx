import { useEffect, useState } from 'react'
import { getAdminAppointmentsRange } from '../../services/api'

type Appt = {
  id: string
  firstName: string
  lastName: string
  phone: string
  licensePlate: string
  dateTime: string
}

export default function History() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<Appt[]>([])
  const [csv, setCsv] = useState('')

  const load = async () => {
    const token = localStorage.getItem('admintoken') || ''
    const list = await getAdminAppointmentsRange(token, from || undefined, to || undefined)
    const q = query.trim().toLowerCase()
    const filtered = !q ? list : list.filter((a: Appt) =>
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
      a.licensePlate.toLowerCase().includes(q)
    )
    setItems(filtered)
    // CSV simple
    const header = 'Fecha,Hora,Cliente,WhatsApp,Patente\n'
    const rows = filtered.map(a => {
      const d = new Date(a.dateTime)
      const fecha = d.toLocaleDateString('es-AR')
      const hora = d.toTimeString().slice(0,5)
      const cliente = `${a.firstName} ${a.lastName}`
      return `${fecha},${hora},${cliente},${a.phone},${a.licensePlate}`
    }).join('\n')
    setCsv(header + rows)
  }

  useEffect(() => { load() }, [])

  return (
    <section className="section">
      <div className="container">
        <h2>Historial de turnos</h2>
        <div className="card" style={{display:'grid', gap:12}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:12}}>
            <label>Desde
              <input type="datetime-local" value={from} onChange={e=>setFrom(e.target.value)} />
            </label>
            <label>Hasta
              <input type="datetime-local" value={to} onChange={e=>setTo(e.target.value)} />
            </label>
            <label>Búsqueda (nombre o patente)
              <input type="text" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ej: Juan o AA123BB" />
            </label>
          </div>
          <div>
            <button className="btn btn-primary" onClick={load}>Buscar</button>
            <a className="btn btn-secondary" style={{marginLeft:8}} href="/admin/turnos">Volver</a>
            <button className="btn btn-secondary" style={{marginLeft:8}} onClick={() => downloadCsv(csv)}>Exportar CSV</button>
          </div>
        </div>

        <div className="card" style={{marginTop: 16}}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>WhatsApp</th>
                <th>Patente</th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => {
                const d = new Date(a.dateTime)
                const fecha = d.toLocaleDateString('es-AR')
                const hora = d.toTimeString().slice(0,5)
                return (
                  <tr key={a.id} className="table-row">
                    <td className="td-fecha">{fecha}</td>
                    <td className="td-hora">{hora}</td>
                    <td className="td-cliente">{a.firstName} {a.lastName}</td>
                    <td className="td-wa">{a.phone}</td>
                    <td className="td-patente">{a.licensePlate}</td>
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

function downloadCsv(content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'historial_turnos.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}


