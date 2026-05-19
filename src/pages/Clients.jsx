import { useState, useEffect } from 'react'
import { Search, Phone, Globe, ChevronRight } from 'lucide-react'
import { OUTCOME_CONFIG } from '../data'
import { supabase } from '../supabase'
import { useNavigate, useSearchParams } from 'react-router-dom'

const FILTERS = [
  { key: 'all',      label: 'All Clients' },
  { key: 'fire',     label: '🔥 Priority' },
  { key: 'warm',     label: '🟡 Follow Up' },
  { key: 'archive',  label: '✅ Closed' },
  { key: 'spanish',  label: '🇪🇸 Spanish' },
]

export default function Clients() {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [searchParams]          = useSearchParams()
  const navigate                = useNavigate()

  useEffect(() => {
    const f = searchParams.get('filter')
    if (f) setFilter(f)
    fetchClients()
  }, [])

  async function fetchClients() {
    setLoading(true)
    const { data, error } = await supabase.from('clients').select('*').order('priority')
    if (error) console.error(error)
    setClients(data || [])
    setLoading(false)
  }

  const filtered = clients.filter(c => {
    const matchSearch = 
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.address?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all'     ? true :
      filter === 'fire'    ? c.priority === 'fire' :
      filter === 'warm'    ? c.priority === 'warm' :
      filter === 'archive' ? c.outcome === 'closed' :
      filter === 'spanish' ? c.spanish : true
    return matchSearch && matchFilter
  })

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-4xl text-forest-700">Client Database</h1>
          <p className="text-sm text-forest-500/70 mt-1">{clients.length} clients in database</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-up animate-delay-100">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, or address..."
            className="input pl-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === f.key
                  ? 'bg-forest-500 text-white shadow-sm'
                  : 'bg-white/80 text-forest-600 border border-cream-200 hover:border-forest-300'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden animate-fade-up animate-delay-200">
        <div className="hidden lg:grid grid-cols-[2.5fr_1fr_1fr_1.2fr_1fr_0.8fr] gap-4 px-6 py-3 bg-cream-100/60 border-b border-cream-200">
          {['Client','Credit Score','Income','Outcome','Applied','Action'].map(h => (
            <span key={h} className="text-xs font-medium text-forest-500/60 uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {loading && (
          <div className="py-20 text-center text-sm text-forest-400">Loading clients...</div>
        )}

        {!loading && clients.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-forest-700 mb-2">No clients yet</p>
            <p className="text-xs text-forest-400">Process your Dropbox files to populate your database</p>
          </div>
        )}

        {!loading && filtered.length === 0 && clients.length > 0 && (
          <div className="py-20 text-center text-sm text-forest-400">No clients match this search.</div>
        )}

        {!loading && filtered.map(client => {
          const outcome = OUTCOME_CONFIG[client.outcome] || OUTCOME_CONFIG.unknown
          return (
            <div key={client.id}
              onClick={() => navigate(`/clients/${client.id}`)}
              className="grid lg:grid-cols-[2.5fr_1fr_1fr_1.2fr_1fr_0.8fr] gap-4 px-6 py-4 border-b border-cream-100 last:border-0 hover:bg-cream-50/80 cursor-pointer transition-colors items-center">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-display text-sm ${client.priority === 'fire' ? 'bg-rust-400/15 text-rust-500' : 'bg-forest-400/10 text-forest-600'}`}>
                  {client.name?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-forest-700">{client.name}</span>
                    {client.spanish && <span className="text-xs bg-forest-400/10 text-forest-500 border border-forest-400/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Globe size={9}/> ES</span>}
                  </div>
                  <p className="text-xs text-forest-500/50 truncate">{client.phone}</p>
                </div>
              </div>
              <div>
                <span className={`text-sm font-medium ${client.credit_score >= 660 ? 'text-forest-600' : client.credit_score >= 620 ? 'text-gold-500' : 'text-rust-500'}`}>
                  {client.credit_score || '—'}
                </span>
              </div>
              <div className="hidden lg:block text-sm text-forest-600">{client.income || '—'}</div>
              <div className="hidden lg:block">
                <span className={outcome.badge}>{outcome.label}</span>
              </div>
              <div className="hidden lg:block text-xs text-forest-500/60">
                {client.app_date ? new Date(client.app_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <a href={`tel:${client.phone}`}
                  className="w-8 h-8 bg-forest-500 hover:bg-forest-600 rounded-lg flex items-center justify-center text-white transition-colors shadow-sm flex-shrink-0">
                  <Phone size={13} />
                </a>
                <ChevronRight size={14} className="text-forest-400/40 hidden lg:block" />
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-center text-forest-400/50 mt-4">
        Showing {filtered.length} of {clients.length} clients
      </p>
    </div>
  )
}
