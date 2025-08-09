import { Link } from 'react-router-dom'
import SocialBar from '../components/SocialBar'
import LocationCard from '../components/LocationCard'

export default function Home() {
  return (
    <div>
      <section className="hero hero-solid">
        <div className="container hero-inner">
          <img src="/assets/Component 1.ico" alt="Logo Ecolavado" className="hero-logo" />
          <h1 className="brand-title"><span className="eco">ECO</span>LAVADO</h1>
          <p>Lavado profesional y rápido. Reservá tu turno en minutos.</p>
          <div className="hero-cta">
            <Link to="/turnos" className="btn btn-primary">Sacar turno</Link>
            <a href="#servicios" className="btn btn-secondary">Conocer más</a>
          </div>
        </div>
      </section>

      <section id="servicios" className="section">
        <div className="container grid-3">
          <div className="card">
            <h3>Lavado Exterior</h3>
            <p>Espuma activa, enjuague y secado a mano. Cuidamos tu pintura.</p>
          </div>
          <div className="card">
            <h3>Interiores</h3>
            <p>Aspirado profundo y acondicionamiento de paneles y tapizados.</p>
          </div>
          <div className="card">
            <h3>Detailing</h3>
            <p>Tratamientos especiales para un acabado superior y duradero.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container cta-inner">
          <h2>¿Listo para que tu auto brille?</h2>
          <Link to="/turnos" className="btn btn-primary btn-lg">Reservar ahora</Link>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SocialBar whatsapp="3513118673" instagram="Ecolavado.va" />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <LocationCard mapsUrl="https://maps.app.goo.gl/SwDDanPtfydrRJdb6" />
        </div>
      </section>
    </div>
  )
}


