import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Globe, Save, Mail, Edit2, Check, X, FileText, Plus, Clock, Trash2 } from 'lucide-react'
import { OUTCOME_CONFIG } from '../data'
import { supabase } from '../supabase'

export default function ClientDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [client, setClient]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  // Notes
  const [noteHistory, setNoteHistory] = useState([])
  const [newNote, setNewNote]         = useState('')
  const [savingNote, setSavingNote]   = useState(false)
  const [editingNoteIndex, setEditingNoteIndex] = useState(null)
  const [editingNoteText, setEditingNoteText]   = useState('')

  // Other editable fields
  const [status, setStatus]     = useState('')
  const [followUp, setFollowUp] = useState('')
  const [called, setCalled]     = useState(false)
  const [reviewed, setReviewed] = useState(false)

  // Inline editing — header fields
  const [editName, setEditName]   = useState(false)
  const [editPhone, setEditPhone] = useState(false)
  const [nameVal, setNameVal]     = useState('')
  const [phoneVal, setPhoneVal]   = useState('')

  // Inline editing — client info fields
  const [editField, setEditField] = useState(null) // which field is being edited
  const [editVal, setEditVal]     = useState('')

  useEffect(() => { fetchClient() }, [id])

  async function fetchClient() {
    const { data } = await supabase.from('clients').select('*').eq('id', id).single()
    if (data) {
      setClient(data)
      setStatus(data.outcome || 'unknown')
      setFollowUp(data.follow_up || '')
      setCalled(data.called || false)
      setReviewed(data.reviewed || false)
      setNameVal(data.name || '')
      setPhoneVal(data.phone || '')

      if (data.note_history) {
        try { setNoteHistory(JSON.parse(data.note_history)) } catch { setNoteHistory([]) }
      } else if (data.notes) {
        setNoteHistory([{ text: data.notes, date: data.updated_at || new Date().toISOString() }])
      }
    }
    setLoading(false)
  }

  async function persistNotes(updated) {
    await supabase.from('clients').update({
      note_history: JSON.stringify(updated),
      notes: updated[0]?.text || ''
    }).eq('id', id)
  }

  async function handleSaveNote() {
    if (!newNote.trim()) return
    setSavingNote(true)
    const entry = { text: newNote.trim(), date: new Date().toISOString() }
    const updated = [entry, ...noteHistory]
    await persistNotes(updated)
    setNoteHistory(updated)
    setNewNote('')
    setSavingNote(false)
  }

  async function handleDeleteNote(index) {
    const updated = noteHistory.filter((_, i) => i !== index)
    await persistNotes(updated)
    setNoteHistory(updated)
  }

  async function handleSaveEditedNote(index) {
    if (!editingNoteText.trim()) return
    const updated = noteHistory.map((entry, i) =>
      i === index ? { ...entry, text: editingNoteText.trim() } : entry
    )
    await persistNotes(updated)
    setNoteHistory(updated)
    setEditingNoteIndex(null)
    setEditingNoteText('')
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('clients').update({
      outcome:   status,
      follow_up: followUp || null,
      called,
      reviewed,
      priority: status === 'preapproval' ? 'fire' :
                ['denied','incomplete'].includes(status) ? 'warm' :
                status === 'closed' ? 'archive' : 'unknown',
    }).eq('id', id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function saveName() {
    await supabase.from('clients').update({ name: nameVal }).eq('id', id)
    setClient(prev => ({ ...prev, name: nameVal }))
    setEditName(false)
  }

  async function savePhone() {
    await supabase.from('clients').update({ phone: phoneVal }).eq('id', id)
    setClient(prev => ({ ...prev, phone: phoneVal }))
    setEditPhone(false)
  }

  async function saveField(field) {
    await supabase.from('clients').update({ [field]: editVal || null }).eq('id', id)
    setClient(prev => ({ ...prev, [field]: editVal }))
    setEditField(null)
    setEditVal('')
  }

  function getDropboxWebUrl(dropboxPath) {
    if (!dropboxPath) return null
    return `https://www.dropbox.com/home${dropboxPath}`
  }

  if (loading) return <div className="p-10 text-center text-forest-400">Loading...</div>
  if (!client) return (
    <div className="p-10 text-center text-forest-400">
      Client not found. <button onClick={() => navigate('/clients')} className="underline">Go back</button>
    </div>
  )

  const dropboxUrl = getDropboxWebUrl(client.dropbox_path)

  // Editable info field component
  const EditableField = ({ label, fieldKey, value, type = 'text' }) => (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-xs font-medium text-forest-500/60 uppercase tracking-wider">{label}</p>
        {editField !== fieldKey && (
          <button onClick={() => { setEditField(fieldKey); setEditVal(value || '') }}
            className="text-forest-300 hover:text-forest-500 transition-colors">
            <Edit2 size={11} />
          </button>
        )}
      </div>
      {editField === fieldKey ? (
        <div className="flex items-center gap-1.5">
          <input
            type={type}
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            className="input py-1 px-2 text-sm flex-1"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') saveField(fieldKey); if (e.key === 'Escape') { setEditField(null); setEditVal('') } }}
          />
          <button onClick={() => saveField(fieldKey)} className="text-forest-500 hover:text-forest-700"><Check size={14}/></button>
          <button onClick={() => { setEditField(null); setEditVal('') }} className="text-rust-400 hover:text-rust-600"><X size={14}/></button>
        </div>
      ) : (
        <p className="text-sm font-medium text-forest-700">{value || '—'}</p>
      )}
    </div>
  )

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto animate-fade-up">
      <button onClick={() => navigate('/clients')} className="btn-ghost mb-6 -ml-2 text-forest-500/70">
        <ArrowLeft size={15} /> Back to clients
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display text-2xl flex-shrink-0 ${client.priority === 'fire' ? 'bg-rust-400/15 text-rust-500' : 'bg-forest-400/10 text-forest-600'}`}>
            {client.name?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {editName ? (
                <div className="flex items-center gap-2">
                  <input value={nameVal} onChange={e => setNameVal(e.target.value)}
                    className="input text-xl font-display py-1 px-2 w-48" autoFocus />
                  <button onClick={saveName} className="text-forest-500 hover:text-forest-700"><Check size={16}/></button>
                  <button onClick={() => { setEditName(false); setNameVal(client.name) }} className="text-rust-400 hover:text-rust-600"><X size={16}/></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-3xl text-forest-700">{client.name}</h1>
                  {client.spanish && <span className="flex items-center gap-1 text-xs bg-forest-400/10 text-forest-500 border border-forest-400/20 px-2 py-1 rounded-full"><Globe size={10}/> Español</span>}
                  <button onClick={() => setEditName(true)} className="text-forest-400 hover:text-forest-600"><Edit2 size={13}/></button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {editPhone ? (
                <div className="flex items-center gap-2">
                  <input value={phoneVal} onChange={e => setPhoneVal(e.target.value)}
                    className="input py-1 px-2 text-sm w-40" autoFocus />
                  <button onClick={savePhone} className="text-forest-500 hover:text-forest-700"><Check size={14}/></button>
                  <button onClick={() => { setEditPhone(false); setPhoneVal(client.phone) }} className="text-rust-400 hover:text-rust-600"><X size={14}/></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-forest-600 font-medium">{client.phone || 'No phone'}</p>
                  <button onClick={() => setEditPhone(true)} className="text-forest-400 hover:text-forest-600"><Edit2 size={12}/></button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {dropboxUrl && (
            <a href={dropboxUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <FileText size={14} /> View PDF
            </a>
          )}
          {client.phone && (
            <a href={`mailto:?subject=Mortgage Follow Up - ${client.name}&body=Hi ${client.name?.split(' ')[0]},`}
              className="btn-secondary">
              <Mail size={14} /> Send Email
            </a>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Client info — all editable */}
          <div className="card p-6">
            <h2 className="font-display text-xl text-forest-700 mb-5">Client Information</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <EditableField label="Credit Score"  fieldKey="credit_score" value={client.credit_score} />
              <EditableField label="Annual Income" fieldKey="income"       value={client.income} />
              <EditableField label="Loan Amount"   fieldKey="loan_amount"  value={client.loan_amount} />
              <EditableField label="Address"       fieldKey="address"      value={client.address} />
              <EditableField label="Applied"       fieldKey="app_date"     value={client.app_date ? new Date(client.app_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null} />
              <div>
                <p className="text-xs font-medium text-forest-500/60 uppercase tracking-wider mb-1">Language</p>
                <p className="text-sm font-medium text-forest-700">{client.spanish ? 'Spanish preferred' : 'English'}</p>
              </div>
            </div>
            {client.denial_reason && (
              <div className="mt-5 p-3 bg-gold-400/10 border border-gold-300/30 rounded-xl">
                <p className="text-xs font-medium text-gold-500 uppercase tracking-wide mb-1">Denial Reason</p>
                <p className="text-sm text-forest-700">{client.denial_reason}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card p-6">
            <h2 className="font-display text-xl text-forest-700 mb-4">Notes</h2>
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                rows={3}
                placeholder="Add a new note — call outcomes, next steps, anything relevant..."
                className="input resize-none mb-2"
              />
              <button
                onClick={handleSaveNote}
                disabled={savingNote || !newNote.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-forest-600 hover:bg-forest-700 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors">
                <Plus size={14} />
                {savingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>

            {noteHistory.length > 0 && (
              <div className="space-y-2.5 border-t border-cream-200 pt-4">
                <p className="text-xs font-medium text-forest-500/60 uppercase tracking-wider">Previous Notes</p>
                {noteHistory.map((entry, i) => (
                  <div key={i} className="bg-cream-50 border border-cream-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-forest-400">
                        <Clock size={11} />
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </div>
                      {editingNoteIndex !== i && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditingNoteIndex(i); setEditingNoteText(entry.text) }}
                            className="text-forest-400 hover:text-forest-600 transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDeleteNote(i)}
                            className="text-forest-400 hover:text-rust-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingNoteIndex === i ? (
                      <div>
                        <textarea
                          value={editingNoteText}
                          onChange={e => setEditingNoteText(e.target.value)}
                          rows={3}
                          className="input resize-none mb-2 text-sm"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleSaveEditedNote(i)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-600 hover:bg-forest-700 text-white text-xs font-medium rounded-lg transition-colors">
                            <Check size={12} /> Save
                          </button>
                          <button onClick={() => { setEditingNoteIndex(null); setEditingNoteText('') }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-cream-200 hover:bg-cream-300 text-forest-600 text-xs font-medium rounded-lg transition-colors">
                            <X size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-forest-700 whitespace-pre-wrap">{entry.text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Called toggle */}
          <div className="card p-5">
            <h3 className="text-xs font-medium text-forest-500/60 uppercase tracking-wider mb-3">Contact Status</h3>
            <button onClick={() => setCalled(!called)}
              className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-all ${called ? 'bg-forest-500 text-white border-forest-500' : 'bg-white text-forest-600 border-cream-200 hover:border-forest-300'}`}>
              {called ? '✓ Called' : 'Mark as Called'}
            </button>
          </div>

          {/* Reviewed toggle */}
          <div className="card p-5">
            <h3 className="text-xs font-medium text-forest-500/60 uppercase tracking-wider mb-3">Review Status</h3>
            <button onClick={() => setReviewed(!reviewed)}
              className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-all ${reviewed ? 'bg-forest-500 text-white border-forest-500' : 'bg-white text-forest-600 border-cream-200 hover:border-forest-300'}`}>
              {reviewed ? '✓ Reviewed' : 'Mark as Reviewed'}
            </button>
          </div>

          {/* Status */}
          <div className="card p-5">
            <h3 className="text-xs font-medium text-forest-500/60 uppercase tracking-wider mb-3">Status</h3>
            <div className="space-y-2">
              {Object.entries(OUTCOME_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => setStatus(key)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition-all ${status === key ? 'bg-forest-500 text-white border-forest-500' : 'bg-white text-forest-600 border-cream-200 hover:border-forest-300'}`}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Follow up */}
          <div className="card p-5">
            <h3 className="text-xs font-medium text-forest-500/60 uppercase tracking-wider mb-3">Follow-up Date</h3>
            <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)}
              className="input text-sm" />
            {followUp && (
              <p className="text-xs text-forest-500 mt-2">
                Reminder set for {new Date(followUp).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving}
            className={`w-full py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${saved ? 'bg-forest-500 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}>
            <Save size={14} />
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
