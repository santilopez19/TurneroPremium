import { useState } from 'react'
import { sendSupportMessage } from '../../services/api'

type SupportCategory = 'general' | 'tecnico' | 'facturacion' | 'mejoras' | 'bug' | 'otro'
type Priority = 'baja' | 'media' | 'alta' | 'urgente'

type SupportMessage = {
  category: SupportCategory
  priority: Priority
  name?: string
  email?: string
  phone?: string
  message: string
}

export default function Support() {
  const [formData, setFormData] = useState<SupportMessage>({
    category: 'general',
    priority: 'media',
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (field: keyof SupportMessage, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.message.trim()) {
      setError('El mensaje es obligatorio')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Enviar mensaje real a la API
      await sendSupportMessage(formData)
      
      setSubmitSuccess(true)
      setFormData({
        category: 'general',
        priority: 'media',
        name: '',
        email: '',
        phone: '',
        message: ''
      })
      
      // Resetear mensaje de éxito después de 5 segundos
      setTimeout(() => setSubmitSuccess(false), 5000)
      
    } catch (err: any) {
      setError(err.message || 'Error al enviar el mensaje. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryLabels = {
    general: 'General',
    tecnico: 'Técnico',
    facturacion: 'Facturación',
    mejoras: 'Sugerencias/Mejoras',
    bug: 'Reporte de Error',
    otro: 'Otro'
  }

  const priorityLabels = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    urgente: 'Urgente'
  }

  const priorityColors = {
    baja: '#10b981',
    media: '#f59e0b',
    alta: '#ef4444',
    urgente: '#dc2626'
  }

  return (
    <section className="section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🆘 Soporte</h1>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>
            Soporte al Desarrollador
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            Contacta al desarrollador para soporte técnico y mejoras
          </p>
        </div>

        {submitSuccess && (
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, #10b981, #059669)', 
            color: 'white',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>✅ Mensaje Enviado Exitosamente</h3>
            <p>Tu mensaje de soporte ha sido enviado. Te responderemos en las próximas 2-4 horas.</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Botón para ver mensajes de soporte (solo para desarrollador) */}
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginBottom: '1rem' }}>
            <a 
              href="/admin/mensajes-soporte" 
              className="btn btn-primary"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '1.1rem'
              }}
            >
              📨 Ver Mensajes de Soporte Recibidos
            </a>
          </div>
          {/* Información de Contacto */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📞 Información de Contacto
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📧</span>
                <div>
                  <strong>Email Principal</strong>
                  <div style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
                    desarrollador@fabrica-ropa.com
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📱</span>
                <div>
                  <strong>WhatsApp</strong>
                  <div style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
                    +54 9 11 1234-5678
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>💬</span>
                <div>
                  <strong>Telegram</strong>
                  <div style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
                    @desarrollador_fabrica
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🌐</span>
                <div>
                  <strong>Sitio Web</strong>
                  <div style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
                    www.desarrollador.com
                  </div>
                </div>
              </div>
            </div>

            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: 'var(--bg-secondary)', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>⚡ Respuesta Rápida</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Tiempo de respuesta promedio: <strong>2-4 horas</strong>
              </div>
            </div>
          </div>

          {/* Formulario de Soporte */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📝 Enviar Mensaje de Soporte
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Categoría del Problema
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Prioridad
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Tu Nombre <span style={{ color: 'var(--text-secondary)' }}>(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Tu Email <span style={{ color: 'var(--text-secondary)' }}>(Opcional)</span>
                </label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Tu Teléfono <span style={{ color: 'var(--text-secondary)' }}>(Opcional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+54 9 11 1234-5678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Mensaje <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <textarea
                  placeholder="Describe tu problema, solicitud o consulta..."
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    resize: 'vertical'
                  }}
                />
              </div>

              {error && (
                <div style={{ 
                  padding: '0.75rem', 
                  background: '#fee2e2', 
                  color: '#dc2626', 
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ 
                  padding: '1rem', 
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isSubmitting ? (
                  <>
                    <span>⏳</span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    Enviar Mensaje de Soporte
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>ℹ️ Información Adicional</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>🕒 Horarios de Soporte</h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                Lunes a Viernes: 9:00 - 18:00<br />
                Sábados: 9:00 - 13:00<br />
                Domingo: Cerrado
              </p>
            </div>
            
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>📋 Tipos de Soporte</h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                • Soporte técnico<br />
                • Consultas de facturación<br />
                • Sugerencias y mejoras<br />
                • Reporte de errores
              </p>
            </div>
            
            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>🚀 Respuesta Garantizada</h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                • Respuesta en 2-4 horas<br />
                • Soporte prioritario para clientes<br />
                • Seguimiento hasta resolución
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
