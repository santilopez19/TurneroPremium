import { Link, NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          <img src="/image-removebg-preview (6).png" alt="Logo Barbería" className="brand-logo" />
          <span className="brand-accent">Bar</span>bería
        </Link>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Inicio
          </NavLink>
          <NavLink to="/turnos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Sacar turno
          </NavLink>
          <a href="/admin" className="nav-link">Admin</a>
          <Link to="/soporte" className="nav-link support-link">
            🆘 Soporte
          </Link>
        </nav>
      </div>
    </header>
  )
}


