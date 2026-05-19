import { useState } from 'react'
import { Eye, EyeOff, Leaf } from 'lucide-react'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    if (email === 'balas@nmbnow.com' && password === 'Revival2024!') {
      onLogin()
    } else {
      setError('Invalid email or password.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-forest-500 shadow-lg mb-5">
            <Leaf size={24} className="text-cream-50" />
          </div>
          <h1 className="font-display text-4xl text-forest-700 mb-1">Revival</h1>
          <p className="text-sm text-forest-500/70">Client Intelligence · Nationwide Mortgage Bankers</p>
        </div>

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-forest-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="balas@nmbnow.com"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-forest-600 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="input pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-400 hover:text-forest-600">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rust-500 bg-rust-400/10 border border-rust-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full btn-primary justify-center py-3 mt-2 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-cream-200">
            <p className="text-xs text-center text-forest-400">
              Demo credentials:<br/>
              <span className="font-mono text-forest-500">balas@nmbnow.com</span> · <span className="font-mono text-forest-500">Revival2024!</span>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-forest-400/60 mt-6">
          Protected under GLBA · Data never leaves your account
        </p>
      </div>
    </div>
  )
}
