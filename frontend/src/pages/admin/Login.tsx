import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../../services/api'

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@ecolavado.local')
  const [password, setPassword] = useState('admin1234')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      const token = await adminLogin(email, password)
      localStorage.setItem('admintoken', token)
      navigate('/admin/turnos')
    } catch (e: any) {
      setMsg(e?.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <h2>Ingreso Administrador</h2>
        <form className="form" onSubmit={onSubmit}>
          <label>Email
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" />
          </label>
          <label>Contraseña
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" />
          </label>
          {msg && <p className="form-message">{msg}</p>}
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Ingresando...' : 'Entrar'}</button>
        </form>
      </div>
    </section>
  )
}


