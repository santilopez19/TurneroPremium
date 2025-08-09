import { Link, NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          <span className="brand-accent">Eco</span>lavado
        </Link>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Inicio
          </NavLink>
          <NavLink to="/turnos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Sacar turno
          </NavLink>
        </nav>
      </div>
    </header>
  )
}


