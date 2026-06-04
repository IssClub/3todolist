import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TODAY   = () => new Date().toISOString().split('T')[0]
const EMOJIS  = ['🎉', '✨', '⭐', '🔥', '💫', '🎯', '🙌']

function haptic() {
  if ('vibrate' in navigator) navigator.vibrate([30, 20, 60, 20, 40])
}

function Screen({ children }) {
  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center px-8 text-center relative overflow-hidden">
      <div className="w-full max-w-xs space-y-6">
        {children}
      </div>
    </div>
  )
}

function BigBtn({ onClick, children, secondary }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl py-4 text-base font-medium active:scale-95 transition-all ${
        secondary
          ? 'text-slate-400 bg-transparent'
          : 'bg-slate-100 text-slate-950'
      }`}
    >
      {children}
    </button>
  )
}

export default function EveningFlow({ session }) {
  const [tasks,    setTasks]    = useState([])
  const [floaters, setFloaters] = useState([])
  const [step,     setStep]     = useState('loading')
  const [doneCount, setDoneCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('tasks').select('*')
      .eq('user_id', session.user.id)
      .is('completed_at', null)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setTasks(data || [])
        setStep(data?.length ? 'review' : 'final')
      })
  }, [session.user.id])

  const completeTask = useCallback(async (task) => {
    haptic()

    // Floating emoji
    const id    = Date.now() + Math.random()
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
    const left  = 20 + Math.random() * 60
    setFloaters(prev => [...prev, { id, emoji, left }])
    setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 900)

    const updated = tasks.filter(t => t.id !== task.id)
    setTasks(updated)
    setDoneCount(c => c + 1)

    const today = TODAY()
    const days  = Math.floor((new Date(today) - new Date(task.created_at)) / 86400000)
    await supabase.from('tasks').update({ completed_at: today, days_to_complete: days }).eq('id', task.id)

    if (updated.length === 0) setTimeout(() => setStep('final'), 600)
  }, [tasks])

  // ── LOADING ─────────────────────────────────────────────
  if (step === 'loading') return (
    <Screen>
      <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin mx-auto" />
    </Screen>
  )

  // ── FINAL ───────────────────────────────────────────────
  if (step === 'final') {
    const emoji = doneCount === 0 ? '💙' : '🏆'
    const msg   = doneCount === 0
      ? 'בסדר — מחר יום חדש!'
      : doneCount === 1
        ? 'כל הכבוד! סגרת משימה אחת היום'
        : `כל הכבוד! סגרת ${doneCount} משימות היום`

    return (
      <Screen>
        <p className="text-6xl">{emoji}</p>
        <div>
          <h1 className="text-slate-100 text-2xl font-semibold">{msg}</h1>
          <p className="text-slate-500 text-sm mt-2">לילה טוב 🌙</p>
        </div>
        <BigBtn onClick={() => navigate('/')}>סגור</BigBtn>
      </Screen>
    )
  }

  // ── REVIEW ──────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center px-8 text-center relative overflow-hidden">

      {/* Floating emojis */}
      {floaters.map(f => (
        <span
          key={f.id}
          className="pointer-events-none absolute text-4xl"
          style={{ left: `${f.left}%`, top: '48%', zIndex: 50, animation: 'floatUp 0.85s ease-out forwards' }}
        >
          {f.emoji}
        </span>
      ))}

      <div className="w-full max-w-xs space-y-6">
        <p className="text-5xl">🌙</p>
        <div>
          <h1 className="text-slate-100 text-2xl font-semibold">ערב טוב!</h1>
          <p className="text-slate-500 text-sm mt-1">לחץ על משימה שסיימת</p>
        </div>

        <div className="space-y-2 text-right">
          {tasks.map(task => (
            <button
              key={task.id}
              onClick={() => completeTask(task)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4 flex items-center gap-3 active:scale-95 transition-all hover:border-slate-700"
            >
              <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex-shrink-0" />
              <p className="text-slate-200 text-sm flex-1 text-right">{task.title}</p>
            </button>
          ))}
        </div>

        <BigBtn secondary onClick={() => setStep('final')}>
          סיום היום
        </BigBtn>
      </div>
    </div>
  )
}
