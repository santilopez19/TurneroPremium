import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>© {new Date().getFullYear()} Barbería. Todos los derechos reservados.</p>
        <div className="footer-links">
          <Link to="/soporte" className="footer-link">🆘 Soporte</Link>
          <span className="made-with">Hecho con ❤ en negro, azul y rojo.</span>
        </div>
      </div>
    </footer>
  )
}


