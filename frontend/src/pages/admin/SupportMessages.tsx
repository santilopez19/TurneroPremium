import { useEffect, useState } from 'react'
import { getSupportMessages, updateSupportMessage } from '../../services/api'

type SupportMessage = {
  id: string
  category: string
  priority: string
  name?: string
  email?: string
  phone?: string
  message: string
  status: string
  response?: string
  respondedAt?: string
  createdAt: string
}

export default function SupportMessages() {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null)
  const [responseText, setResponseText] = useState('')

  const token = localStorage.getItem('admintoken') || ''

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const data = await getSupportMessages(token)
      setMessages(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMessage = async (id: string, data: { status?: string; response?: string }) => {
    try {
      await updateSupportMessage(token, id, data)
      await loadMessages()
      setSelectedMessage(null)
      setResponseText('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <p>Cargando mensajes de soporte...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container">
        <h2>📨 Mensajes de Soporte ({messages.length})</h2>
        
        {error && <p className="form-message error">{error}</p>}
        
        {messages.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', padding: '2rem' }}>
              No hay mensajes de soporte pendientes.
            </p>
          </div>
        ) : (
          <div className="card">
            {messages.map((msg) => (
              <div key={msg.id} style={{ 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                padding: '1rem',
                marginBottom: '1rem',
                background: msg.status === 'nuevo' ? 'var(--bg-secondary)' : 'var(--bg)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      color: 'white',
                      background: msg.priority === 'urgente' ? '#dc2626' : 
                                 msg.priority === 'alta' ? '#ef4444' : 
                                 msg.priority === 'media' ? '#f59e0b' : '#10b981'
                    }}>
                      {msg.priority.toUpperCase()}
                    </span>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      color: 'white',
                      background: msg.status === 'nuevo' ? '#3b82f6' : 
                                 msg.status === 'en_proceso' ? '#f59e0b' : 
                                 msg.status === 'resuelto' ? '#10b981' : '#6b7280'
                    }}>
                      {msg.status === 'nuevo' ? 'NUEVO' : 
                       msg.status === 'en_proceso' ? 'EN PROCESO' : 
                       msg.status === 'resuelto' ? 'RESUELTO' : 'CERRADO'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(msg.createdAt).toLocaleString('es-AR')}
                  </div>
                </div>

                {(msg.name || msg.email || msg.phone) && (
                  <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {msg.name && <div><strong>Nombre:</strong> {msg.name}</div>}
                    {msg.email && <div><strong>Email:</strong> {msg.email}</div>}
                    {msg.phone && <div><strong>Teléfono:</strong> {msg.phone}</div>}
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <strong>Mensaje:</strong>
                  <div style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.75rem', 
                    background: 'var(--bg-secondary)', 
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.message}
                  </div>
                </div>

                {msg.response && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Respuesta:</strong>
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.75rem', 
                      background: '#f0f9ff', 
                      borderRadius: '4px',
                      border: '1px solid #0ea5e9'
                    }}>
                      {msg.response}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {msg.status === 'nuevo' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setSelectedMessage(msg)}
                    >
                      📝 Responder
                    </button>
                  )}
                  
                  <select
                    value={msg.status}
                    onChange={(e) => handleUpdateMessage(msg.id, { status: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px' }}
                  >
                    <option value="nuevo">Nuevo</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Respuesta */}
        {selectedMessage && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{ maxWidth: '600px', width: '90%' }}>
              <h3>📝 Responder Mensaje</h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <strong>Mensaje del cliente:</strong>
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.75rem', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '4px'
                }}>
                  {selectedMessage.message}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Tu Respuesta:
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  placeholder="Escribe tu respuesta aquí..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedMessage(null)
                    setResponseText('')
                  }}
                >
                  Cancelar
                </button>
                
                <button
                  className="btn btn-primary"
                  onClick={() => handleUpdateMessage(selectedMessage.id, { 
                    response: responseText.trim(),
                    status: 'resuelto'
                  })}
                  disabled={!responseText.trim()}
                >
                  Enviar Respuesta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
