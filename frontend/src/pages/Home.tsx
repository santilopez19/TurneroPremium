import { Link } from 'react-router-dom'
import SocialBar from '../components/SocialBar'
import LocationCard from '../components/LocationCard'

export default function Home() {
  return (
    <div>
      <section className="hero hero-solid">
        <div className="container hero-inner">
          <img src="/image-removebg-preview (6).png" alt="Logo Barbería" className="hero-logo" />
          <h1 className="brand-title"><span className="eco">BAR</span>BERÍA</h1>
          <p>Cortes profesionales y estilos únicos. Reservá tu turno en minutos.</p>
          <div className="hero-cta">
            <Link to="/turnos" className="btn btn-primary">Sacar turno</Link>
            <a href="#servicios" className="btn btn-secondary">Conocer más</a>
          </div>
        </div>
      </section>

      <section id="servicios" className="section">
        <div className="container grid-3">
          <div className="card">
            <h3>Corte Clásico</h3>
            <p>Cortes tradicionales con técnicas modernas. Cuidamos tu estilo.</p>
          </div>
          <div className="card">
            <h3>Barba y Bigote</h3>
            <p>Arreglo y diseño de barba con navaja. Perfilado y mantenimiento profesional.</p>
          </div>
          <div className="card">
            <h3>Estilos Modernos</h3>
            <p>Tendencias actuales, degradados y cortes creativos para un look único.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container cta-inner">
          <h2>¿Listo para renovar tu estilo?</h2>
          <Link to="/turnos" className="btn btn-primary btn-lg">Reservar ahora</Link>
        </div>
      </section>
      
      <section className="section">
        <div className="container">
          <SocialBar whatsapp="3513118673" instagram="Barberia.va" />
        </div>
      </section>
      
      <section className="section">
        <div className="container">
          <LocationCard mapsUrl="https://maps.app.goo.gl/SwDDanPtfydrRJdb6" />
        </div>
      </section>

      {/* Botón de soporte flotante */}
      <div className="floating-support">
        <Link to="/soporte" className="floating-support-btn">
          🆘 Soporte
        </Link>
      </div>
    </div>
  )
}


