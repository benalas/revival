import { useState, useEffect, useRef } from 'react'
import { Leaf, CheckCircle, AlertCircle } from 'lucide-react'
import { listClientFolders, listFilesInFolder, downloadFileAsBase64 } from '../dropbox'
import { supabase } from '../supabase'

export default function Processing({ onComplete }) {
  const [steps, setSteps]       = useState([])
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState(null)
  const [pct, setPct]           = useState(0)
  const [current, setCurrent]   = useState('')
  const [total, setTotal]       = useState(0)
  const [processed, setProcessed] = useState(0)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    runProcessing()
  }, [])

  function addStep(msg) {
    setSteps(prev => [...prev, msg])
    setCurrent(msg)
  }

  async function extractWithClaude(base64Pdf, folderName) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Pdf,
                },
              },
              {
                type: 'text',
                text: `Extract the following information from this mortgage document and return ONLY a JSON object with no markdown or explanation:
{
  "name": "full name of applicant",
  "phone": "phone number",
  "address": "full address",
  "income": "annual income as string like $65,000",
  "credit_score": 650,
  "loan_amount": "loan amount as string like $380,000",
  "app_date": "date in YYYY-MM-DD format",
  "outcome": "one of: preapproval, denied, closed, incomplete, unknown",
  "denial_reason": "reason if denied, otherwise null",
  "spanish": true or false based on Spanish surname or language in document
}
If a field cannot be found, use null. For outcome: if you see a preapproval letter with no closing docs use preapproval, if denied letter use denied, if closing/HUD docs use closed, if incomplete application use incomplete, otherwise unknown.`,
              },
            ],
          }],
        }),
      })
      const data = await response.json()
      const text = data.content?.[0]?.text || '{}'
      const clean = text.replace(/```json|```/g, '').trim()
      return JSON.parse(clean)
    } catch (e) {
      return null
    }
  }

  async function runProcessing() {
    try {
      // Step 1 — Connect to Dropbox
      addStep('Connecting to Dropbox...')
      const folders = await listClientFolders()
      setTotal(folders.length)
      addStep(`Found ${folders.length} client folders`)
      setPct(5)

      // Clear existing non-closed clients
      await supabase.from('clients').delete().neq('id', 0)

      // Step 2 — Process each folder
      for (let i = 0; i < folders.length; i++) {
        const folder = folders[i]
        const folderName = folder.name
        setCurrent(`Processing: ${folderName}`)
        setProcessed(i + 1)
        setPct(Math.round(5 + ((i / folders.length) * 90)))

        try {
          // Get PDFs in folder
          const files = await listFilesInFolder(folder.path_lower)
          if (files.length === 0) continue

          // Process first PDF (most likely the application)
          const firstFile = files[0]
          const base64 = await downloadFileAsBase64(firstFile.path_lower)

          // Extract data with Claude AI
          const extracted = await extractWithClaude(base64, folderName)
          if (!extracted) continue

          // Determine priority
          let priority = 'unknown'
          if (extracted.outcome === 'preapproval') priority = 'fire'
          else if (['denied', 'incomplete'].includes(extracted.outcome)) priority = 'warm'
          else if (extracted.outcome === 'closed') priority = 'archive'

          // Save to Supabase
          await supabase.from('clients').insert({
            name: extracted.name || folderName,
            phone: extracted.phone,
            address: extracted.address,
            income: extracted.income,
            credit_score: extracted.credit_score,
            loan_amount: extracted.loan_amount,
            app_date: extracted.app_date,
            outcome: extracted.outcome || 'unknown',
            denial_reason: extracted.denial_reason,
            spanish: extracted.spanish || false,
            notes: '',
            called: false,
            priority,
            follow_up: null,
            folder_name: folderName,
          })
          addStep(`✓ ${folderName}`)
        } catch (folderError) {
          addStep(`⚠ Skipped: ${folderName}`)
        }
      }

      setPct(100)
      setDone(true)
      addStep(`Complete — ${folders.length} clients processed`)
      setTimeout(onComplete, 1500)

    } catch (err) {
      setError(err.message)
    }
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center card p-8">
        <AlertCircle size={32} className="text-rust-500 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-forest-700 mb-2">Something went wrong</h2>
        <p className="text-sm text-forest-500 mb-4">{error}</p>
        <p className="text-xs text-forest-400">Check that your Dropbox token is valid and the folder name matches exactly.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg transition-colors duration-500 ${done ? 'bg-forest-500' : 'bg-forest-600'}`}>
          {done
            ? <CheckCircle size={28} className="text-cream-50" />
            : <Leaf size={28} className="text-cream-50 animate-pulse-slow" />
          }
        </div>

        <h2 className="font-display text-3xl text-forest-700 mb-2">
          {done ? 'All done.' : 'Processing your files'}
        </h2>
        <p className="text-sm text-forest-500/70 mb-2">
          {done
            ? `${total} clients extracted and categorized.`
            : `Reading your Dropbox folders with AI — this may take a few minutes.`
          }
        </p>
        {!done && total > 0 && (
          <p className="text-xs text-forest-400 mb-6">{processed} of {total} folders processed</p>
        )}

        <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-forest-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs font-mono text-forest-400 mb-6">{pct}% complete</p>

        <div className="card p-5 text-left space-y-2 max-h-64 overflow-y-auto">
          {steps.length === 0 && (
            <p className="text-sm text-forest-400">Starting...</p>
          )}
          {steps.map((s, i) => (
            <div key={i} className={`text-sm ${s.startsWith('✓') ? 'text-forest-500' : s.startsWith('⚠') ? 'text-gold-500' : 'text-forest-700'}`}>
              {s}
            </div>
          ))}
        </div>

        {!done && (
          <p className="text-xs text-forest-400/60 mt-4">Do not close this window while processing</p>
        )}
      </div>
    </div>
  )
}
