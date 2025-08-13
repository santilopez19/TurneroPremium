import { useEffect, useState } from 'react'
import { 
  getBusinessConfig, 
  updateBusinessConfig, 
  getBlockedDates, 
  blockDate, 
  unblockDate,
  getBlockedTimeSlots,
  blockTimeSlot,
  unblockTimeSlot,
  getAdminAvailability
} from '../../services/api'

type BusinessConfig = {
  id: string
  openTime: string
  closeTime: string
  slotDuration: number
  maxAppointmentsPerSlot: number
}

type BlockedDate = {
  id: string
  date: string
  reason?: string
}

type BlockedTimeSlot = {
  id: string
  date: string
  time: string
  reason?: string
}

type AvailabilityDay = {
  date: string
  blocked: boolean
  reason?: string
  slots: string[]
  totalSlots: number
  blockedSlots: number
  bookedSlots: number
}

export default function Availability() {
  const [config, setConfig] = useState<BusinessConfig | null>(null)
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [blockedTimeSlots, setBlockedTimeSlots] = useState<BlockedTimeSlot[]>([])
  const [availability, setAvailability] = useState<AvailabilityDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Estados para formularios
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [newBlockedDateReason, setNewBlockedDateReason] = useState('')
  const [newBlockedTimeSlot, setNewBlockedTimeSlot] = useState('')
  const [newBlockedTimeSlotTime, setNewBlockedTimeSlotTime] = useState('')
  const [newBlockedTimeSlotReason, setNewBlockedTimeSlotReason] = useState('')
  
  // Estados para configuración
  const [editingConfig, setEditingConfig] = useState(false)
  const [configForm, setConfigForm] = useState({
    openTime: '08:30',
    closeTime: '18:30',
    slotDuration: 60,
    maxAppointmentsPerSlot: 2
  })

  const token = localStorage.getItem('admintoken') || ''

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [configData, blockedDatesData, blockedTimeSlotsData] = await Promise.all([
        getBusinessConfig(token),
        getBlockedDates(token),
        getBlockedTimeSlots(token)
      ])
      
      setConfig(configData)
      setConfigForm({
        openTime: configData.openTime,
        closeTime: configData.closeTime,
        slotDuration: configData.slotDuration,
        maxAppointmentsPerSlot: configData.maxAppointmentsPerSlot
      })
      setBlockedDates(blockedDatesData)
      setBlockedTimeSlots(blockedTimeSlotsData)
      
      // Cargar disponibilidad para los próximos 30 días
      const from = new Date().toISOString().split('T')[0]
      const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const availabilityData = await getAdminAvailability(token, from, to)
      setAvailability(availabilityData)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateConfig = async () => {
    try {
      const updatedConfig = await updateBusinessConfig(token, configForm)
      setConfig(updatedConfig)
      setEditingConfig(false)
      await loadData() // Recargar disponibilidad con nueva configuración
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleBlockDate = async () => {
    if (!newBlockedDate) return
    
    try {
      await blockDate(token, newBlockedDate, newBlockedDateReason)
      setNewBlockedDate('')
      setNewBlockedDateReason('')
      await loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUnblockDate = async (date: string) => {
    try {
      await unblockDate(token, date)
      await loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleBlockTimeSlot = async () => {
    if (!newBlockedTimeSlot || !newBlockedTimeSlotTime) return
    
    try {
      await blockTimeSlot(token, newBlockedTimeSlot, newBlockedTimeSlotTime, newBlockedTimeSlotReason)
      setNewBlockedTimeSlot('')
      setNewBlockedTimeSlotTime('')
      setNewBlockedTimeSlotReason('')
      await loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUnblockTimeSlot = async (date: string, time: string) => {
    try {
      await unblockTimeSlot(token, date, time)
      await loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <p>Cargando...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container">
        <h2>Gestión de Disponibilidad</h2>
        
        {error && <p className="form-message error">{error}</p>}
        
        {/* Configuración del Negocio */}
        <div className="card">
          <h3>Configuración del Negocio</h3>
          {editingConfig ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Hora de Apertura:</label>
                  <input
                    type="time"
                    value={configForm.openTime}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, openTime: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                </div>
                <div>
                  <label>Hora de Cierre:</label>
                  <input
                    type="time"
                    value={configForm.closeTime}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, closeTime: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Duración del Turno (minutos):</label>
                  <input
                    type="number"
                    min="15"
                    max="120"
                    value={configForm.slotDuration}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                </div>
                <div>
                  <label>Capacidad por Horario:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={configForm.maxAppointmentsPerSlot}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, maxAppointmentsPerSlot: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary" onClick={handleUpdateConfig}>
                  Guardar Cambios
                </button>
                <button className="btn btn-secondary" onClick={() => setEditingConfig(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p><strong>Horario:</strong> {config?.openTime} - {config?.closeTime}</p>
              <p><strong>Duración del turno:</strong> {config?.slotDuration} minutos</p>
              <p><strong>Capacidad por horario:</strong> {config?.maxAppointmentsPerSlot} turnos</p>
              <button className="btn btn-primary" onClick={() => setEditingConfig(true)}>
                Editar Configuración
              </button>
            </div>
          )}
        </div>

        {/* Bloquear Fechas */}
        <div className="card">
          <h3>Bloquear Fechas Completas</h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'end' }}>
            <div>
              <label>Fecha:</label>
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
            <div>
              <label>Motivo (opcional):</label>
              <input
                type="text"
                placeholder="Ej: Feriado, Cierre por mantenimiento"
                value={newBlockedDateReason}
                onChange={(e) => setNewBlockedDateReason(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleBlockDate}>
              Bloquear Fecha
            </button>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Motivo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {blockedDates.map((bd) => (
                  <tr key={bd.id}>
                    <td>{new Date(bd.date).toLocaleDateString('es-AR')}</td>
                    <td>{bd.reason || '-'}</td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleUnblockDate(bd.date)}
                      >
                        Desbloquear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bloquear Horarios Específicos */}
        <div className="card">
          <h3>Bloquear Horarios Específicos</h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'end' }}>
            <div>
              <label>Fecha:</label>
              <input
                type="date"
                value={newBlockedTimeSlot}
                onChange={(e) => setNewBlockedTimeSlot(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
            <div>
              <label>Hora:</label>
              <input
                type="time"
                value={newBlockedTimeSlotTime}
                onChange={(e) => setNewBlockedTimeSlotTime(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
            <div>
              <label>Motivo (opcional):</label>
              <input
                type="text"
                placeholder="Ej: Personal reducido"
                value={newBlockedTimeSlotReason}
                onChange={(e) => setNewBlockedTimeSlotReason(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleBlockTimeSlot}>
              Bloquear Horario
            </button>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Motivo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {blockedTimeSlots.map((bts) => (
                  <tr key={bts.id}>
                    <td>{new Date(bts.date).toLocaleDateString('es-AR')}</td>
                    <td>{bts.time}</td>
                    <td>{bts.reason || '-'}</td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleUnblockTimeSlot(bts.date, bts.time)}
                      >
                        Desbloquear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vista de Disponibilidad Futura */}
        <div className="card">
          <h3>Vista de Disponibilidad (Próximos 30 días)</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Horarios Disponibles</th>
                  <th>Total Horarios</th>
                  <th>Horarios Bloqueados</th>
                  <th>Turnos Reservados</th>
                </tr>
              </thead>
              <tbody>
                {availability.map((day) => (
                  <tr key={day.date}>
                    <td>{new Date(day.date).toLocaleDateString('es-AR')}</td>
                    <td>
                      {day.blocked ? (
                        <span style={{ color: 'red' }}>BLOQUEADO</span>
                      ) : (
                        <span style={{ color: 'green' }}>DISPONIBLE</span>
                      )}
                    </td>
                    <td>
                      {day.blocked ? (
                        <span style={{ color: 'red' }}>{day.reason || 'Fecha bloqueada'}</span>
                      ) : (
                        <span>{day.slots.length} horarios</span>
                      )}
                    </td>
                    <td>{day.totalSlots || '-'}</td>
                    <td>{day.blockedSlots || '-'}</td>
                    <td>{day.bookedSlots || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
