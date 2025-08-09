import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Booking from './pages/Booking'
import AdminLogin from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import History from './pages/admin/History'
import Cancel from './pages/Cancel'

export default function App() {
  return (
    <div className="app-container">
      <Header />
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/turnos" element={<Booking />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/turnos" element={<Dashboard />} />
          <Route path="/admin/historial" element={<History />} />
          <Route path="/cancelar/:token" element={<Cancel />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}


