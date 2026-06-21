import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import Navbar from './views/components/Navbar'
import PrivateRoute from './views/components/PrivateRoute'
import AdminRoute from './views/components/AdminRoute'
import Home from './views/pages/Home'
import Mapa from './views/pages/Mapa'
import Perfil from './views/pages/Perfil'
import DetalleComercio from './views/pages/DetalleComercio'
import RegistroComercio from './views/pages/RegistroComercio'
import MiComercio from './views/pages/MiComercio'
import AdminPanel from './views/pages/AdminPanel'
import Login from './views/pages/Login'
import Register from './views/pages/Register'
import SelectRol from './views/pages/SelectRol'
import Politicas from './views/pages/Politicas'

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route path="/comercio/:id" element={<DetalleComercio />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register/tipo" element={<SelectRol />} />
              <Route path="/register" element={<Register />} />
              <Route path="/politicas" element={<Politicas />} />
              <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
              <Route path="/registro-comercio" element={<PrivateRoute><RegistroComercio /></PrivateRoute>} />
              <Route path="/mi-comercio" element={<PrivateRoute><MiComercio /></PrivateRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            </Routes>
          </main>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  )
}
