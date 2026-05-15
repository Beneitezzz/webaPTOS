import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Mapa from './pages/Mapa'
import Perfil from './pages/Perfil'
import DetalleComercio from './pages/DetalleComercio'
import RegistroComercio from './pages/RegistroComercio'
import AdminPanel from './pages/AdminPanel'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/comercio/:id" element={<DetalleComercio />} />
            <Route path="/registro-comercio" element={<RegistroComercio />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AppProvider>
  )
}
