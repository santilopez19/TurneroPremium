export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>© {new Date().getFullYear()} Lavadero. Todos los derechos reservados.</p>
        <p className="made-with">Hecho con ❤ en negro, verde y blanco.</p>
        <a href="/admin" className="btn-ghost footer-login">Login admin</a>
      </div>
      <div className="container login-admin">
        <a href="/admin" className="btn-ghost">Login admin</a>
      </div>
    </footer>
  )
}


