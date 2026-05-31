import { useState } from 'react'
import { supabase } from '../lib/supabase'

const toEmail = (username) => `${username.toLowerCase().trim()}@todolist.app`

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) return setError('נא למלא את כל השדות')
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return setError('שם משתמש יכול להכיל אותיות באנגלית, מספרים וקו תחתון בלבד')

    setLoading(true)
    const email = toEmail(username)

    if (mode === 'register') {
      const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })
      if (signUpErr) { setError(signUpErr.message); setLoading(false); return }

      // Create profile with username
      const { error: profileErr } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: username.toLowerCase().trim(),
      })
      if (profileErr) { setError('שם המשתמש כבר תפוס'); setLoading(false); return }
    } else {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) { setError('שם משתמש או סיסמה שגויים'); setLoading(false); return }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 mb-4">
            <span className="text-3xl font-light text-slate-100">3</span>
          </div>
          <h1 className="text-xl font-medium text-slate-100">3 משימות</h1>
          <p className="text-sm text-slate-500 mt-1">מקסימום שלוש. לא יותר.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="שם משתמש"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-slate-600 transition-colors"
          />
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-slate-600 transition-colors"
          />

          {error && (
            <p className="text-red-400 text-xs text-center pt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-100 text-slate-950 rounded-xl py-3.5 text-sm font-medium mt-2 disabled:opacity-50 transition-opacity active:scale-95 transition-transform"
          >
            {loading ? '...' : mode === 'login' ? 'כניסה' : 'הרשמה'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          className="w-full text-center text-slate-500 text-xs mt-6 hover:text-slate-400 transition-colors"
        >
          {mode === 'login' ? 'אין לך חשבון? הרשמה' : 'יש לך חשבון? כניסה'}
        </button>
      </div>
    </div>
  )
}
