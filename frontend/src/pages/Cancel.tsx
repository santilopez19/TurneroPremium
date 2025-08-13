import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

type Info = {
  id: string
  firstName: string
  lastName: string
  service: string
  phone: string
  dateTime: string
  status: string
}

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000'

export default function Cancel() {
  const { token } = useParams()
  const [info, setInfo] = useState<Info | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/appointments/cancel/${token}`)
      .then(r => r.json())
      .then(setInfo)
      .catch(() => setMessage('Enlace inválido'))
  }, [token])

  const onCancel = async () => {
    const res = await fetch(`${API_URL}/api/appointments/cancel/${token}`, { method: 'POST' })
    if (res.ok) setMessage('Tu turno fue cancelado correctamente.')
    else setMessage('No se pudo cancelar el turno.')
  }

  if (!info) return (
    <section className="section"><div className="container"><p>{message || 'Cargando...'}</p></div></section>
  )

  const d = new Date(info.dateTime)
  const fecha = d.toLocaleDateString('es-AR')
  const hora = d.toTimeString().slice(0,5)

  return (
    <section className="section">
      <div className="container">
        <h2>Cancelar turno</h2>
        <div className="card">
          <p><b>Cliente:</b> {info.firstName} {info.lastName}</p>
          <p><b>Fecha:</b> {fecha} <b>Hora:</b> {hora}</p>
          <p><b>Servicio:</b> {info.service}</p>
          <p><b>Estado:</b> {info.status}</p>
          <button className="btn btn-primary" onClick={onCancel}>Cancelar turno</button>
          {message && <p className="form-message" style={{marginTop:12}}>{message}</p>}
        </div>
      </div>
    </section>
  )
}


