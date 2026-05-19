import { useState, useEffect } from 'react'
import { Flame, TrendingUp, Archive, Globe, RefreshCw, ChevronRight, Phone, Inbox } from 'lucide-react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

export default function Dashboard({ onProcess }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.from('clients').select('*')
    if (error) { setError(error.message); setLoading(false); return }
    setClients(data || [])
    setLoading(false)
  }

  const fire    = clients.filter(c => c.priority === 'fire')
  const warm    = clients.filter(c => c.priority === 'warm')
  const archive = clients.filter(c => c.outcome === 'closed')
  const spanish = clients.filter(c => c.spanish)

  const stats = [
    { label: 'Priority Leads',   value: fire.length,    icon: Flame,      color: 'text-rust-500',   bg: 'bg-rust-400/10',   border: 'border-rust-400/20' },
    { label: 'Follow Up',        value: warm.length,    icon: TrendingUp, color: 'text-gold-500',   bg: 'bg-gold-400/10',   border: 'border-gold-300/20' },
    { label: 'Closed — Archive', value: archive.length, icon: Archive,    color: 'text-forest-500', bg: 'bg-forest-400/10', border: 'border-forest-400/20' },
    { label: 'Spanish Speaking', value: spanish.length, icon: Globe,      color: 'text-forest-500', bg: 'bg-forest-400/10', border: 'border-forest-400/20' },
  ]

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div className="animate-fade-up">
          <p className="text-xs font-medium text-forest-400 uppercase tracking-widest mb-1">Good morning</p>
          <h1 className="font-display text-4xl text-forest-700">Benjamin Alas</h1>
          <p className="text-forest-500/70 mt-1 text-sm">Nationwide Mortgage Bankers · Long Island, NY</p>
        </div>
        <div className="flex gap-2 animate-fade-up animate-delay-100">
          <button onClick={onProcess} className="btn-secondary">
            <RefreshCw size={14} /> Process Dropbox Files
          </button>
          <button onClick={() => navigate('/clients')} className="btn-primary">
            View All Clients <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rust-400/10 border border-rust-400/20 rounded-xl text-sm text-rust-500">
          Database error: {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card p-5 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-3`}>
                <Icon size={16} className={s.color} />
              </div>
              <p className="text-3xl font-display text-forest-700">{loading ? '—' : s.value}</p>
              <p className="text-xs text-forest-500/70 mt-1">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="mb-8 animate-fade-up animate-delay-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl text-forest-700">🔥 Priority Outreach</h2>
            <p className="text-xs text-forest-500/70 mt-0.5">Preapprovals that never closed — call these first</p>
          </div>
          <button onClick={() => navigate('/clients?filter=fire')} className="btn-ghost text-xs">
            See all <ChevronRight size={13} />
          </button>
        </div>
        <div className="card overflow-hidden">
          {loading && <div className="py-12 text-center text-sm text-forest-400">Loading...</div>}
          {!loading && fire.length === 0 && (
            <div className="py-16 flex flex-col items-center justify-center text-center px-6">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <Inbox size={20} className="text-forest-400" />
              </div>
              <p className="text-sm font-medium text-forest-700 mb-1">No clients yet</p>
              <p className="text-xs text-forest-400 max-w-xs">Process your Dropbox files to populate your database with real clients</p>
              <button onClick={onProcess} className="btn-primary mt-4 text-xs">
                <RefreshCw size={13} /> Process Dropbox Files
              </button>
            </div>
          )}
          {!loading && fire.slice(0, 5).map(client => (
            <div key={client.id}
              onClick={() => navigate(`/clients/${client.id}`)}
              className="flex items-center gap-4 px-6 py-4 border-b border-cream-100 last:border-0 hover:bg-cream-50/80 cursor-pointer transition-colors">
              <div className="w-9 h-9 rounded-full bg-forest-500/10 flex items-center justify-center flex-shrink-0 font-display text-forest-600 text-sm">
                {client.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-forest-700">{client.name}</span>
                  {client.spanish && <span className="text-xs bg-forest-400/10 text-forest-500 border border-forest-400/20 px-1.5 py-0.5 rounded-full">ES</span>}
                </div>
                <p className="text-xs text-forest-500/60 mt-0.5">{client.address} · Score {client.credit_score}</p>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs text-forest-500/60">Applied</p>
                <p className="text-xs font-medium text-forest-600">
                  {client.app_date ? new Date(client.app_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
              <a href={`tel:${client.phone}`} onClick={e => e.stopPropagation()}
                className="flex-shrink-0 w-8 h-8 bg-forest-500 hover:bg-forest-600 rounded-lg flex items-center justify-center text-white transition-colors shadow-sm">
                <Phone size={13} />
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 animate-fade-up animate-delay-400">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0061FF"><path d="M6 2L0 6l6 4-6 4 6 4 6-4-6-4 6-4zm12 0l-6 4 6 4-6 4 6 4 6-4-6-4 6-4z"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-forest-700">Dropbox</p>
            <p className="text-xs text-forest-500/70 mt-0.5">Reading from: <span className="font-mono text-forest-600">HBCL First Initial App.../</span></p>
            <p className="text-xs text-forest-400 mt-2">{clients.length} clients in database · Click "Process Dropbox Files" to sync</p>
          </div>
          <button onClick={onProcess} className="btn-secondary text-xs flex-shrink-0">
            <RefreshCw size={12} /> Sync
          </button>
        </div>
      </div>
    </div>
  )
}
