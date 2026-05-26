import { useState, useEffect } from 'react'
import { Flame, TrendingUp, Archive, Globe, ChevronRight } from 'lucide-react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import { OUTCOME_CONFIG } from '../data'

export default function Dashboard() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*')
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
        <button onClick={() => navigate('/clients')} className="btn-primary animate-fade-up animate-delay-100">
          View All Clients <ChevronRight size={14} />
        </button>
      </div>

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

      {/* Priority clients */}
      <div className="animate-fade-up animate-delay-300">
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
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-forest-700 mb-1">No priority leads yet</p>
              <p className="text-xs text-forest-400">Run the Python script to populate your database</p>
            </div>
          )}
          {!loading && fire.slice(0, 6).map(client => {
            const outcome = OUTCOME_CONFIG[client.outcome] || OUTCOME_CONFIG.unknown
            return (
              <div key={client.id} onClick={() => navigate(`/clients/${client.id}`)}
                className="flex items-center gap-4 px-6 py-4 border-b border-cream-100 last:border-0 hover:bg-cream-50/80 cursor-pointer transition-colors">
                <div className="w-9 h-9 rounded-full bg-rust-400/15 flex items-center justify-center flex-shrink-0 font-display text-rust-500 text-sm">
                  {client.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-forest-700">{client.name}</span>
                    {client.spanish && <span className="text-xs bg-forest-400/10 text-forest-500 border border-forest-400/20 px-1.5 py-0.5 rounded-full">ES</span>}
                  </div>
                  <p className="text-xs text-forest-500/60 mt-0.5">{client.phone || client.address || 'No contact info'}</p>
                </div>
                <div className="hidden sm:block text-right flex-shrink-0">
                  <p className="text-xs text-forest-500/60">Applied</p>
                  <p className="text-xs font-medium text-forest-600">
                    {client.app_date ? new Date(client.app_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                  </p>
                </div>
                <ChevronRight size={14} className="text-forest-400/40 flex-shrink-0" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
