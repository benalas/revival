import { useState, useEffect } from 'react'
import { Flame, TrendingUp, Archive, Globe, ChevronRight, Phone, Clock } from 'lucide-react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import { OUTCOME_CONFIG } from '../data'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const [clients, setClients] = useState([])
  const [newNotesAlert, setNewNotesAlert] = useState([])
  const [dismissedAlert, setDismissedAlert] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchClients()
    checkNewNotes()
  }, [])

  async function checkNewNotes() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get last login time from user metadata
    const lastLogin = user.last_sign_in_at

    // Find all clients with notes added after last login by someone else
    const { data: allClients } = await supabase
      .from('clients')
      .select('id, name, note_history')
      .not('note_history', 'is', null)

    if (!allClients) return

    const newNotes = []
    for (const client of allClients) {
      try {
        const history = JSON.parse(client.note_history)
        const recentByOther = history.filter(n =>
          n && n.date && n.author &&
          n.author !== user.email &&
          n.notify === user.email
        )
        if (recentByOther.length > 0) {
          newNotes.push({
            clientId: client.id,
            clientName: client.name,
            author: recentByOther[0].author,
            count: recentByOther.length
          })
        }
      } catch { continue }
    }
    setNewNotesAlert(newNotes)
  }

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

  const fireCalled    = fire.filter(c => c.called).length
  const fireRemaining = fire.length - fireCalled
  const firePercent   = fire.length ? Math.round((fireCalled / fire.length) * 100) : 0

  // Follow-ups due today or overdue
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueTodayOrOverdue = clients.filter(c => {
    if (!c.follow_up) return false
    const d = new Date(c.follow_up)
    d.setHours(0, 0, 0, 0)
    return d <= today
  }).sort((a, b) => new Date(a.follow_up) - new Date(b.follow_up))

  // Recent activity — clients with notes, sorted by most recent note date
  const recentActivity = clients
    .filter(c => c.note_history)
    .map(c => {
      try {
        const history = JSON.parse(c.note_history)
        const lastNote = Array.isArray(history) ? history.find(n => n && n.date && n.text) : null
        if (!lastNote) return null
        return { ...c, _lastNote: lastNote }
      } catch { return null }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b._lastNote.date) - new Date(a._lastNote.date))
    .slice(0, 5)

  const stats = [
    {
      label: 'Priority Leads',
      value: fire.length,
      icon: Flame,
      color: 'text-rust-500',
      bg: 'bg-rust-400/10',
      border: 'border-rust-400/20',
      filter: 'fire',
    },
    {
      label: 'Follow Up',
      value: warm.length,
      icon: TrendingUp,
      color: 'text-gold-500',
      bg: 'bg-gold-400/10',
      border: 'border-gold-300/20',
      filter: 'warm',
    },
    {
      label: 'Closed — Archive',
      value: archive.length,
      icon: Archive,
      color: 'text-forest-500',
      bg: 'bg-forest-400/10',
      border: 'border-forest-400/20',
      filter: 'archive',
    },
    {
      label: 'Spanish Speaking',
      value: spanish.length,
      icon: Globe,
      color: 'text-forest-500',
      bg: 'bg-forest-400/10',
      border: 'border-forest-400/20',
      filter: 'spanish',
    },
  ]

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div className="animate-fade-up">
          <p className="text-xs font-medium text-forest-400 uppercase tracking-widest mb-1">{getGreeting()}</p>
          <h1 className="font-display text-4xl text-forest-700">Benjamin Alas</h1>
          <p className="text-forest-500/70 mt-1 text-sm">Nationwide Mortgage Bankers · Long Island, NY</p>
        </div>
        <button onClick={() => navigate('/clients')} className="btn-primary animate-fade-up animate-delay-100">
          View All Clients <ChevronRight size={14} />
        </button>
      </div>

      {/* New notes alert banner */}
      {!dismissedAlert && newNotesAlert.length > 0 && (
        <div className="mb-6 bg-forest-500/10 border border-forest-400/30 rounded-2xl p-4 flex items-start justify-between gap-4 animate-fade-up">
          <div>
            <p className="text-sm font-medium text-forest-700 mb-1">📝 New notes while you were away</p>
            <div className="space-y-1">
              {newNotesAlert.map((n, i) => (
                <button key={i} onClick={() => navigate(`/clients/${n.clientId}`)}
                  className="block text-xs text-forest-600 hover:text-forest-800 hover:underline text-left">
                  {n.author} left {n.count === 1 ? 'a note' : `${n.count} notes`} on <span className="font-medium">{n.clientName}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setDismissedAlert(true)}
            className="text-forest-400 hover:text-forest-600 flex-shrink-0 text-lg leading-none">×</button>
        </div>
      )}

      {/* Clickable stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <button key={s.label}
              onClick={() => navigate(`/clients?filter=${s.filter}`)}
              className="card p-5 animate-fade-up text-left hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-3`}>
                <Icon size={16} className={s.color} />
              </div>
              <p className="text-3xl font-display text-forest-700">{loading ? '—' : s.value}</p>
              <p className="text-xs text-forest-500/70 mt-1">{s.label}</p>
            </button>
          )
        })}
      </div>

      {/* Priority progress bar */}
      {!loading && fire.length > 0 && (
        <div className="card p-5 mb-8 animate-fade-up animate-delay-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-forest-700">🔥 Priority Lead Progress</p>
              <p className="text-xs text-forest-500/60 mt-0.5">
                {fireCalled} called · {fireRemaining} remaining · {firePercent}% done
              </p>
            </div>
            <span className="text-2xl font-display text-forest-700">{firePercent}%</span>
          </div>
          <div className="w-full bg-cream-200 rounded-full h-2">
            <div
              className="bg-forest-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${firePercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">

        {/* Due today / overdue follow-ups */}
        <div className="animate-fade-up animate-delay-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl text-forest-700">📅 Follow-ups Due</h2>
              <p className="text-xs text-forest-500/70 mt-0.5">
                {dueTodayOrOverdue.length === 0 ? 'Nothing due today' : `${dueTodayOrOverdue.length} client${dueTodayOrOverdue.length > 1 ? 's' : ''} need attention`}
              </p>
            </div>
          </div>
          <div className="card overflow-hidden">
            {loading && <div className="py-10 text-center text-sm text-forest-400">Loading...</div>}
            {!loading && dueTodayOrOverdue.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-forest-700 mb-1">All caught up! 🎉</p>
                <p className="text-xs text-forest-400">No follow-ups due today</p>
              </div>
            )}
            {!loading && dueTodayOrOverdue.slice(0, 5).map(client => {
              const due = new Date(client.follow_up)
              due.setHours(0, 0, 0, 0)
              const isOverdue = due < today
              return (
                <div key={client.id} onClick={() => navigate(`/clients/${client.id}`)}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-cream-100 last:border-0 hover:bg-cream-50/80 cursor-pointer transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-display text-sm ${isOverdue ? 'bg-rust-400/15 text-rust-500' : 'bg-gold-400/15 text-gold-600'}`}>
                    {client.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-forest-700">{client.name}</p>
                    <p className="text-xs text-forest-500/60">{client.phone || 'No phone'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-medium ${isOverdue ? 'text-rust-500' : 'text-gold-500'}`}>
                      {isOverdue ? 'Overdue' : 'Today'}
                    </p>
                    <p className="text-xs text-forest-400">
                      {new Date(client.follow_up).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-forest-400/40 flex-shrink-0" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div className="animate-fade-up animate-delay-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl text-forest-700">🕐 Recent Activity</h2>
              <p className="text-xs text-forest-500/70 mt-0.5">Last clients you added notes to</p>
            </div>
          </div>
          <div className="card overflow-hidden">
            {loading && <div className="py-10 text-center text-sm text-forest-400">Loading...</div>}
            {!loading && recentActivity.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-forest-700 mb-1">No activity yet</p>
                <p className="text-xs text-forest-400">Notes you add will appear here</p>
              </div>
            )}
            {!loading && recentActivity.map(client => (
              <div key={client.id} onClick={() => navigate(`/clients/${client.id}`)}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-cream-100 last:border-0 hover:bg-cream-50/80 cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-full bg-forest-400/10 flex items-center justify-center flex-shrink-0 font-display text-forest-600 text-sm">
                  {client.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-forest-700">{client.name}</p>
                  <p className="text-xs text-forest-500/60 truncate">{client._lastNote.text}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-forest-400">
                    {new Date(client._lastNote.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <ChevronRight size={14} className="text-forest-400/40 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
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
                    {client.called && <span className="text-xs bg-forest-400/10 text-forest-500 border border-forest-400/20 px-1.5 py-0.5 rounded-full">✓ Called</span>}
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
