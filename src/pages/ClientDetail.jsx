import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Globe, Save, ExternalLink } from 'lucide-react'
import { OUTCOME_CONFIG } from '../data'
import { supabase } from '../supabase'

export default function ClientDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [client, setClient] = useState(null)
  const [notes, setNotes]   = useState('')
  const [status, setStatus] = useState('')
  const [saved, setSaved]   = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchClient() }, [id])

  async function fetchClient() {
    const { data } = await supabase.from('clients').select('*').eq('id', id).single()
    if (data) { setClient(data); setNotes(data.notes || ''); setStatus(data.outcome || 'unknown') }
    setLoading(false)
  }

  async function handleSave() {
    await supabase.from('clients').update({ notes, outcome: status }).eq('id', id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="p-10 text-center text-forest-400">Loading...</div>
  if (!client) return <div className="p-10 text-center text-forest-400">Client not found. <button onClick={() => navigate('/clients')} className="underline">Go back</button></div>

  const outcome = OUTCOME_CONFIG[status] || OUTCOME_CONFIG.unknown

  const Field = ({ label, value }) => (
    <div>
      <p className="text-xs font-medium text-forest-500/60 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-forest-700">{value || '—'}</p>
    </div>
  )

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto animate-fade-up">
      <button onClick={() => navigate('/clients')} className="btn-ghost mb-6 -ml-2 text-forest-500/70">
        <ArrowLeft size={15} /> Back to clients
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display text-2xl flex-shrink-0 ${client.priority === 'fire' ? 'bg-rust-400/15 text-rust-500' : 'bg-forest-400/10 text-forest-600'}`}>
            {client.name?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-3xl text-forest-700">{client.name}</h1>
              {client.spanish && (
                <span className="flex items-center gap-1 text-xs bg-forest-400/10 text-forest-500 border border-forest-400/20 px-2 py-1 rounded-full">
                  <Globe size={10} /> Español
                </span>
              )}
            </div>
            <p className="text-sm text-forest-500/60 mt-0.5">{client.address}</p>
          </div>
        </div>
        <a href={`tel:${client.phone}`} className="btn-primary">
          <Phone size={14} /> {client.phone}
        </a>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <h2 className="font-display text-xl text-forest-700 mb-5">Extracted from File</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Field label="Credit Score"  value={client.credit_score} />
              <Field label="Annual Income" value={client.income} />
              <Field label="Loan Amount"   value={client.loan_amount} />
              <Field label="Applied"       value={client.app_date ? new Date(client.app_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null} />
              <Field label="Folder"        value={client.folder_name} />
              <Field label="Language"      value={client.spanish ? 'Spanish preferred' : 'English'} />
            </div>
            {client.denial_reason && (
              <div className="mt-5 p-3 bg-gold-400/10 border border-gold-300/30 rounded-xl">
                <p className="text-xs font-medium text-gold-500 uppercase tracking-wide mb-1">Denial Reason</p>
                <p className="text-sm text-forest-700">{client.denial_reason}</p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-display text-xl text-forest-700 mb-4">Call Notes</h2>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              placeholder="Log what happened when you called, next steps, details..."
              className="input resize-none mb-3" />
            <button onClick={handleSave} className={`btn-primary transition-colors ${saved ? 'bg-forest-600' : ''}`}>
              <Save size={14} /> {saved ? 'Saved ✓' : 'Save Notes'}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="text-xs font-medium text-forest-500/60 uppercase tracking-wider mb-3">Current Status</h3>
            <span className={outcome.badge}>{outcome.label}</span>
            <p className="text-xs text-forest-500/60 mt-2">{outcome.description}</p>
          </div>

          <div className="card p-5">
            <h3 className="text-xs font-medium text-forest-500/60 uppercase tracking-wider mb-3">Update Status</h3>
            <div className="space-y-2">
              {['preapproval','denied','incomplete','closed','unknown'].map(key => (
                <button key={key} onClick={() => setStatus(key)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition-all ${
                    status === key ? 'bg-forest-500 text-white border-forest-500' : 'bg-white text-forest-600 border-cream-200 hover:border-forest-300'
                  }`}>
                  {OUTCOME_CONFIG[key].label}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full card p-4 flex items-center gap-3 hover:bg-cream-50 transition-colors text-left">
            <div className="w-8 h-8 rounded-lg bg-forest-500/10 flex items-center justify-center flex-shrink-0">
              <ExternalLink size={14} className="text-forest-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-forest-700">Push to LoanPulse</p>
              <p className="text-xs text-forest-500/60">Move to active pipeline</p>
            </div>
          </button>

          <div className="card p-5">
            <h3 className="text-xs font-medium text-forest-500/60 uppercase tracking-wider mb-3">Follow-up Reminder</h3>
            <input type="datetime-local" className="input text-xs" />
            <button className="btn-secondary w-full justify-center mt-3 text-xs">Set Reminder</button>
          </div>
        </div>
      </div>
    </div>
  )
}
