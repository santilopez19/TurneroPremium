import { useState } from 'react'

type SupportForm = {
  category: string
  priority: string
  name: string
  email: string
  phone: string
  message: string
}

export default function Support() {
  const [form, setForm] = useState<SupportForm>({
    category: 'General',
    priority: 'Media',
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFormChange = (field: keyof SupportForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.message.trim()) {
      setMessage('Por favor, describe tu problema o consulta')
      return
    }
    
    setLoading(true)
    setMessage('')
    
    try {
      // Aquí podrías integrar con un servicio de email o API
      // Por ahora simulamos el envío
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage('Mensaje enviado exitosamente. Te responderemos pronto.')
      setForm({
        category: 'General',
        priority: 'Media',
        name: '',
        email: '',
        phone: '',
        message: ''
      })
    } catch (error) {
      setMessage('Error al enviar el mensaje. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="support-header">
          <h1>🆘 Soporte al Desarrollador</h1>
          <p>Contacta al desarrollador para soporte técnico y mejoras</p>
        </div>

        <div className="support-grid">
          {/* Información de contacto */}
          <div className="card support-card">
            <h2>📞 Información de Contacto</h2>
            
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div className="contact-details">
                  <h4>Email Principal</h4>
                  <a href="mailto:desarrollador@fabrica-ropa.com" className="contact-link">
                    desarrollador@fabrica-ropa.com
                  </a>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">📱</div>
                <div className="contact-details">
                  <h4>WhatsApp</h4>
                  <a href="https://wa.me/5491112345678" className="contact-link" target="_blank" rel="noopener noreferrer">
                    +54 9 11 1234-5678
                  </a>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">💬</div>
                <div className="contact-details">
                  <h4>Telegram</h4>
                  <a href="https://t.me/desarrollador_fabrica" className="contact-link" target="_blank" rel="noopener noreferrer">
                    @desarrollador_fabrica
                  </a>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">🌐</div>
                <div className="contact-details">
                  <h4>Sitio Web</h4>
                  <a href="https://www.desarrollador.com" className="contact-link" target="_blank" rel="noopener noreferrer">
                    www.desarrollador.com
                  </a>
                </div>
              </div>
            </div>

            <div className="response-time">
              <h3>⚡ Respuesta Rápida</h3>
              <p>Tiempo de respuesta promedio: <strong>2-4 horas</strong></p>
            </div>
          </div>

          {/* Formulario de soporte */}
          <div className="card support-card">
            <h2>📝 Enviar Mensaje de Soporte</h2>
            
            {message && (
              <p className={`form-message ${message.includes('Error') ? 'error' : 'success'}`}>
                {message}
              </p>
            )}
            
            <form onSubmit={handleSubmit} className="support-form">
              <div className="form-row">
                <label>
                  Categoría del Problema
                  <select
                    value={form.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                  >
                    <option value="General">General</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Funcionalidad">Funcionalidad</option>
                    <option value="Personalización">Personalización</option>
                    <option value="Facturación">Facturación</option>
                    <option value="Otro">Otro</option>
                  </select>
                </label>
                
                <label>
                  Prioridad
                  <select
                    value={form.priority}
                    onChange={(e) => handleFormChange('priority', e.target.value)}
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </label>
              </div>
              
              <div className="form-row">
                <label>
                  Tu Nombre (Opcional)
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Tu nombre"
                  />
                </label>
                
                <label>
                  Tu Email (Opcional)
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="tu@email.com"
                  />
                </label>
              </div>
              
              <div className="form-row">
                <label>
                  Tu Teléfono (Opcional)
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                  />
                </label>
              </div>
              
              <label>
                Mensaje *
                <textarea
                  value={form.message}
                  onChange={(e) => handleFormChange('message', e.target.value)}
                  placeholder="Describe tu problema, solicitud o consulta..."
                  rows={5}
                  required
                />
              </label>
              
              <button 
                type="submit" 
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading ? '📤 Enviando...' : '📤 Enviar Mensaje de Soporte'}
              </button>
            </form>
          </div>
        </div>

        {/* Información adicional */}
        <div className="card support-info">
          <h3>💡 ¿Cómo podemos ayudarte?</h3>
          <div className="help-categories">
            <div className="help-item">
              <h4>🔧 Soporte Técnico</h4>
              <p>Problemas de funcionamiento, errores, configuración</p>
            </div>
            <div className="help-item">
              <h4>🎨 Personalización</h4>
              <p>Cambios de diseño, colores, logos, textos</p>
            </div>
            <div className="help-item">
              <h4>📱 Funcionalidades</h4>
              <p>Nuevas características, mejoras, integraciones</p>
            </div>
            <div className="help-item">
              <h4>📊 Reportes</h4>
              <p>Análisis de uso, estadísticas, métricas</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
