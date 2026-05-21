import { useState, useEffect, useRef } from 'react'
import { Leaf, CheckCircle, AlertCircle } from 'lucide-react'
import { listClientFolders, listFilesInFolder, downloadFileAsBase64 } from '../dropbox'
import { supabase } from '../supabase'

const TEST_LIMIT = 50 // Process only first 50 folders for test run

export default function Processing({ onComplete }) {
  const [steps, setSteps]         = useState([])
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState(null)
  const [pct, setPct]             = useState(0)
  const [total, setTotal]         = useState(0)
  const [processed, setProcessed] = useState(0)
  const [saved, setSaved]         = useState(0)
  const [skipped, setSkipped]     = useState(0)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    runProcessing()
  }, [])

  function addStep(msg) {
    setSteps(prev => [...prev.slice(-20), msg]) // Keep last 20 steps
  }

  async function extractWithAI(base64Pdf) {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Pdf }),
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return await response.json()
  }

  async function runProcessing() {
    try {
      addStep('Connecting to Dropbox...')
      const allFolders = await listClientFolders()

      // Get existing folder names from Supabase to skip already processed
      const { data: existing } = await supabase
        .from('clients')
        .select('folder_name')
      const existingNames = new Set((existing || []).map(c => c.folder_name))

      // Filter out already processed, limit to TEST_LIMIT
      const newFolders = allFolders
        .filter(f => !existingNames.has(f.name))
        .slice(0, TEST_LIMIT)

      const totalFolders = newFolders.length
      setTotal(totalFolders)

      if (totalFolders === 0) {
        addStep('All folders already processed — nothing new to add')
        setDone(true)
        setPct(100)
        setTimeout(onComplete, 1500)
        return
      }

      addStep(`Found ${allFolders.length} total folders · Processing ${totalFolders} new ones`)
      setPct(5)

      let savedCount = 0
      let skippedCount = 0

      for (let i = 0; i < newFolders.length; i++) {
        const folder = newFolders[i]
        const folderName = folder.name
        setProcessed(i + 1)
        setPct(Math.round(5 + ((i / totalFolders) * 90)))

        try {
          // Get PDFs in folder
          const files = await listFilesInFolder(folder.path_lower)
          if (files.length === 0) {
            addStep(`⚠ No PDFs: ${folderName}`)
            skippedCount++
            setSkipped(skippedCount)
            continue
          }

          // Download first PDF
          const firstFile = files[0]
          const base64 = await downloadFileAsBase64(firstFile.path_lower)

          // Extract with AI via serverless function
          const extracted = await extractWithAI(base64)

          if (!extracted || extracted.error) {
            addStep(`⚠ Skipped: ${folderName}`)
            skippedCount++
            setSkipped(skippedCount)
            continue
          }

          // Determine priority
          let priority = 'unknown'
          if (extracted.outcome === 'preapproval') priority = 'fire'
          else if (['denied', 'incomplete'].includes(extracted.outcome)) priority = 'warm'
          else if (extracted.outcome === 'closed') priority = 'archive'

          // Save to Supabase
          const { error: insertError } = await supabase.from('clients').insert({
            name: extracted.name || folderName,
            phone: extracted.phone || null,
            address: extracted.address || null,
            income: extracted.income || null,
            credit_score: typeof extracted.credit_score === 'number' ? extracted.credit_score : null,
            loan_amount: extracted.loan_amount || null,
            app_date: extracted.app_date || null,
            outcome: extracted.outcome || 'unknown',
            denial_reason: extracted.denial_reason || null,
            spanish: extracted.spanish || false,
            notes: '',
            called: false,
            priority,
            follow_up: null,
            folder_name: folderName,
          })

          if (insertError) {
            addStep(`⚠ Save failed: ${folderName}`)
            skippedCount++
            setSkipped(skippedCount)
          } else {
            addStep(`✓ ${folderName}`)
            savedCount++
            setSaved(savedCount)
          }

        } catch (folderError) {
          addStep(`⚠ Error: ${folderName}`)
          skippedCount++
          setSkipped(skippedCount)
        }

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200))
      }

      setPct(100)
      setDone(true)
      addStep(`✓ Complete — ${savedCount} saved · ${skippedCount} skipped`)
      setTimeout(onComplete, 2000)

    } catch (err) {
      setError(err.message)
    }
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center card p-8">
        <AlertCircle size={32} className="text-rust-500 mx-auto mb-4" />
        <h2 className="font-display text-2xl text-forest-700 mb-2">Something went wrong</h2>
        <p className="text-sm text-forest-500 mb-4 font-mono">{error}</p>
        <p className="text-xs text-forest-400">Check that your Dropbox token and Anthropic API key are valid in Vercel.</p>
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
            ? `${saved} clients saved · ${skipped} skipped`
            : `Reading Dropbox folders with AI — do not close this window`
          }
        </p>

        {!done && total > 0 && (
          <div className="flex justify-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-lg font-display text-forest-700">{processed}/{total}</p>
              <p className="text-xs text-forest-400">processed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display text-forest-600">{saved}</p>
              <p className="text-xs text-forest-400">saved</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-display text-gold-500">{skipped}</p>
              <p className="text-xs text-forest-400">skipped</p>
            </div>
          </div>
        )}

        <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-forest-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs font-mono text-forest-400 mb-6">{pct}% complete</p>

        <div className="card p-5 text-left space-y-1.5 max-h-64 overflow-y-auto">
          {steps.length === 0 && (
            <p className="text-sm text-forest-400">Starting...</p>
          )}
          {steps.map((s, i) => (
            <div key={i} className={`text-sm ${
              s.startsWith('✓') ? 'text-forest-500' :
              s.startsWith('⚠') ? 'text-gold-500' :
              'text-forest-700 font-medium'
            }`}>
              {s}
            </div>
          ))}
        </div>

        {!done && (
          <p className="text-xs text-forest-400/60 mt-4">
            Test run — first {TEST_LIMIT} new folders only
          </p>
        )}
      </div>
    </div>
  )
}
