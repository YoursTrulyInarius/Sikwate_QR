import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

// Import Pages
import Launcher from './pages/Launcher'
import Login from './pages/Login'
import CustomerDashboard from './pages/CustomerDashboard'
import KitchenDashboard from './pages/KitchenDashboard'
import ServiceDashboard from './pages/ServiceDashboard'
import CashierDashboard from './pages/CashierDashboard'
import QRPrintPage from './pages/QRPrintPage'

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen w-full relative">
        <Routes>
          <Route path="/" element={<Launcher />} />
          <Route path="/login" element={<Login />} />
          <Route path="/order" element={<CustomerDashboard />} />
          <Route path="/kitchen" element={<KitchenDashboard />} />
          <Route path="/service" element={<ServiceDashboard />} />
          <Route path="/cashier" element={<CashierDashboard />} />
          <Route path="/print-qr" element={<QRPrintPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
