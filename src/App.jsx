import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Login       from './pages/Login'
import Processing  from './pages/Processing'
import Dashboard   from './pages/Dashboard'
import Clients     from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Sidebar     from './components/Sidebar'

export default function App() {
  const [auth, setAuth]           = useState(false)
  const [processed, setProcessed] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleLogin() { setAuth(true); setProcessing(true) }
  function handleProcessed() { setProcessing(false); setProcessed(true) }
  function handleLogout() { setAuth(false); setProcessed(false) }
  function handleReprocess() { setProcessing(true); setProcessed(false) }

  if (!auth) return <Login onLogin={handleLogin} />
  if (processing) return <Processing onComplete={handleProcessed} />

  return (
    <BrowserRouter>
      <div className="min-h-screen flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
          {/* Mobile header */}
          <header className="lg:hidden sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-cream-200 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-forest-500 hover:bg-cream-100 transition-colors">
              <Menu size={18} />
            </button>
            <span className="font-display text-forest-700 text-lg">Revival</span>
          </header>
          <main className="flex-1">
            <Routes>
              <Route path="/"           element={<Dashboard onProcess={handleReprocess} />} />
              <Route path="/clients"    element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
