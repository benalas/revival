import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { supabase } from './supabase'
import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Clients      from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Sidebar      from './components/Sidebar'

export default function App() {
  const [session, setSession]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-forest-400 text-sm">Loading...</div>
    </div>
  )

  if (!session) return <Login />

  return (
    <BrowserRouter>
      <div className="min-h-screen flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          user={session.user}
        />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
          <header className="lg:hidden sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-cream-200 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-forest-500 hover:bg-cream-100 transition-colors">
              <Menu size={18} />
            </button>
            <span className="font-display text-forest-700 text-lg">Revival</span>
          </header>
          <main className="flex-1">
            <Routes>
              <Route path="/"            element={<Dashboard />} />
              <Route path="/clients"     element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="*"            element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
