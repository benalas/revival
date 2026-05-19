import { useState, useEffect } from 'react'
import { Leaf, CheckCircle } from 'lucide-react'

const STEPS = [
  { label: 'Connecting to Dropbox',              duration: 1200 },
  { label: 'Reading folder: HBCL First Initial App...', duration: 1000 },
  { label: 'Discovered 247 client folders',      duration: 800  },
  { label: 'Processing PDFs with AI vision',     duration: 2500 },
  { label: 'Extracting names, phones, income',   duration: 1500 },
  { label: 'Identifying outcomes & priorities',  duration: 1200 },
  { label: 'Flagging Spanish-speaking clients',  duration: 800  },
  { label: 'Building your client database',      duration: 1000 },
]

export default function Processing({ onComplete }) {
  const [step, setStep]       = useState(0)
  const [done, setDone]       = useState(false)
  const [pct, setPct]         = useState(0)

  useEffect(() => {
    let current = 0
    let elapsed = 0
    const total = STEPS.reduce((a, s) => a + s.duration, 0)

    function runStep(i) {
      if (i >= STEPS.length) {
        setDone(true)
        setPct(100)
        setTimeout(onComplete, 1200)
        return
      }
      setStep(i)
      const timer = setTimeout(() => {
        elapsed += STEPS[i].duration
        setPct(Math.round((elapsed / total) * 100))
        runStep(i + 1)
      }, STEPS[i].duration)
      return timer
    }
    runStep(0)
  }, [])

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
        <p className="text-sm text-forest-500/70 mb-8">
          {done ? '247 clients extracted and categorized.' : 'AI is reading every PDF in your Dropbox — sit tight.'}
        </p>

        {/* Progress bar */}
        <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-forest-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs font-mono text-forest-400 mb-8">{pct}% complete</p>

        {/* Steps */}
        <div className="card p-5 text-left space-y-3">
          {STEPS.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${i < step ? 'text-forest-500' : i === step ? 'text-forest-700 font-medium' : 'text-forest-400/40'}`}>
              <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                i < step ? 'bg-forest-500' : i === step ? 'bg-forest-300 animate-pulse' : 'bg-cream-200'
              }`}>
                {i < step && <svg width="8" height="8" viewBox="0 0 8 8" fill="white"><path d="M1 4l2 2 4-4"/></svg>}
              </div>
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
