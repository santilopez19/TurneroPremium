import { useEffect, useState } from 'react'
import { getAdminAppointments, updateBusinessConfig, getBusinessConfig } from '../../services/api'

type BusinessConfig = {
  openDays: number[] // 0=domingo, 1=lunes, etc.
  openStart: string // "08:30"
  openEnd: string // "18:30"
  slotDuration: number // minutos
  maxSlotsPerTime: number // capacidad por horario
  blockedDates: string[] // fechas bloqueadas
  blockedTimes: string[] // horarios bloqueados
}

type DayConfig = {
  date: string
  dayName: string
  isBlocked: boolean
  availableSlots: string[]
  blockedSlots: string[]
}

export default function Configuration() {
  const [config, setConfig] = useState<BusinessConfig>({
    openDays: [1, 2, 3, 4, 5, 6], // lunes a sábado
    openStart: "08:30",
    openEnd: "18:30",
    slotDuration: 60,
    maxSlotsPerTime: 2,
    blockedDates: [],
    blockedTimes: []
  })
  
  const [nextDays, setNextDays] = useState<DayConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadConfig()
    generateNextDays()
  }, [])

  const loadConfig = async () => {
    try {
      const token = localStorage.getItem('admintoken') || ''
      const savedConfig = await getBusinessConfig(token)
      if (savedConfig) {
        setConfig(savedConfig)
      }
    } catch (error) {
      console.log('Usando configuración por defecto')
    }
  }

  const generateNextDays = () => {
    const days: DayConfig[] = []
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      const dayOfWeek = date.getDay()
      const isOpenDay = config.openDays.includes(dayOfWeek)
      const isBlocked = config.blockedDates.includes(date.toISOString().split('T')[0])
      
      if (isOpenDay && !isBlocked) {
        const slots = generateTimeSlots(config.openStart, config.openEnd, config.slotDuration)
        days.push({
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }),
          isBlocked: false,
          availableSlots: slots,
          blockedSlots: []
        })
      }
    }
    
    setNextDays(days)
  }

  const generateTimeSlots = (start: string, end: string, duration: number): string[] => {
    const slots: string[] = []
    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)
    
    let currentHour = startHour
    let currentMin = startMin
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
      slots.push(timeStr)
      
      currentMin += duration
      if (currentMin >= 60) {
        currentMin = 0
        currentHour++
      }
    }
    
    return slots
  }

  const handleConfigChange = (field: keyof BusinessConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleDayToggle = (dayOfWeek: number) => {
    const newOpenDays = config.openDays.includes(dayOfWeek)
      ? config.openDays.filter(d => d !== dayOfWeek)
      : [...config.openDays, dayOfWeek].sort()
    
    handleConfigChange('openDays', newOpenDays)
  }

  const handleDateBlock = (date: string) => {
    const newBlockedDates = config.blockedDates.includes(date)
      ? config.blockedDates.filter(d => d !== date)
      : [...config.blockedDates, date]
    
    handleConfigChange('blockedDates', newBlockedDates)
    generateNextDays() // Regenerar días disponibles
  }

  const handleTimeBlock = (time: string) => {
    const newBlockedTimes = config.blockedTimes.includes(time)
      ? config.blockedTimes.filter(t => t !== time)
      : [...config.blockedTimes, time]
    
    handleConfigChange('blockedTimes', newBlockedTimes)
  }

  const saveConfig = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const token = localStorage.getItem('admintoken') || ''
      await updateBusinessConfig(config, token)
      setMessage('Configuración guardada exitosamente')
      generateNextDays()
    } catch (error) {
      setMessage('Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  return (
    <section className="section">
      <div className="container">
        <h2>Configuración del Negocio</h2>
        
        {message && <p className="form-message">{message}</p>}
        
        <div className="config-grid">
          {/* Configuración básica */}
          <div className="card">
            <h3>Configuración General</h3>
            <div className="form-grid">
              <label>
                Días de trabajo
                <div className="days-selector">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`day-btn ${config.openDays.includes(index) ? 'active' : ''}`}
                      onClick={() => handleDayToggle(index)}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </label>
              
              <label>
                Horario de apertura
                <input
                  type="time"
                  value={config.openStart}
                  onChange={(e) => handleConfigChange('openStart', e.target.value)}
                />
              </label>
              
              <label>
                Horario de cierre
                <input
                  type="time"
                  value={config.openEnd}
                  onChange={(e) => handleConfigChange('openEnd', e.target.value)}
                />
              </label>
              
              <label>
                Duración del turno (minutos)
                <select
                  value={config.slotDuration}
                  onChange={(e) => handleConfigChange('slotDuration', Number(e.target.value))}
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1.5 horas</option>
                  <option value={120}>2 horas</option>
                </select>
              </label>
              
              <label>
                Capacidad por horario
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.maxSlotsPerTime}
                  onChange={(e) => handleConfigChange('maxSlotsPerTime', Number(e.target.value))}
                />
              </label>
            </div>
            
            <button 
              className="btn btn-primary" 
              onClick={saveConfig}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>

          {/* Horarios bloqueados */}
          <div className="card">
            <h3>Horarios Bloqueados</h3>
            <div className="blocked-times">
              {config.blockedTimes.length > 0 ? (
                config.blockedTimes.map(time => (
                  <div key={time} className="blocked-time-item">
                    <span>{time}</span>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleTimeBlock(time)}
                    >
                      Desbloquear
                    </button>
                  </div>
                ))
              ) : (
                <p>No hay horarios bloqueados</p>
              )}
            </div>
          </div>
        </div>

        {/* Próximos días disponibles */}
        <div className="card" style={{marginTop: 16}}>
          <h3>Próximos Días Disponibles</h3>
          <p>Días y horarios que verán tus clientes. Puedes bloquear días completos.</p>
          
          <div className="days-grid">
            {nextDays.map(day => (
              <div key={day.date} className="day-card">
                <div className="day-header">
                  <h4>{day.dayName}</h4>
                  <button
                    type="button"
                    className={`btn ${day.isBlocked ? 'btn-primary' : 'btn-danger'}`}
                    onClick={() => handleDateBlock(day.date)}
                  >
                    {day.isBlocked ? 'Desbloquear' : 'Bloquear'}
                  </button>
                </div>
                
                {!day.isBlocked && (
                  <div className="day-slots">
                    <h5>Horarios disponibles:</h5>
                    <div className="slots-grid">
                      {day.availableSlots.map(slot => (
                        <span key={slot} className="time-slot">
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
