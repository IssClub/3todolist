import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TODAY  = () => new Date().toISOString().split('T')[0]
const EMOJIS = ['🎉', '✨', '⭐', '🔥', '💫', '🎯', '🙌']

function haptic(pattern = [30, 20, 60]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern)
}

// ── SWIPEABLE TASK CARD ─────────────────────────────────────

function TaskCard({ task, index, onComplete, onSkip }) {
  const [deltaX,   setDeltaX]   = useState(0)
  const [exiting,  setExiting]  = useState(null) // 'right' | 'left' | null
  const startX = useRef(null)
  const startY = useRef(null)
  const locked = useRef(false)

  const THRESHOLD = 72

  const onTouchStart = (e) => {
    if (locked.current) return
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
  }

  const onTouchMove = (e) => {
    if (locked.current || startX.current === null) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current
    if (Math.abs(dy) > Math.abs(dx) + 10) { startX.current = null; return }
    e.preventDefault()
    setDeltaX(dx)
  }

  const onTouchEnd = () => {
    if (locked.current) return
    if (deltaX > THRESHOLD) trigger('right')
    else if (deltaX < -THRESHOLD) trigger('left')
    else setDeltaX(0)
    startX.current = null
  }

  const trigger = (dir) => {
    locked.current = true
    haptic(dir === 'right' ? [40, 20, 80] : [20])
    setExiting(dir)
    setTimeout(() => {
      if (dir === 'right') onComplete(task)
      else onSkip(task)
    }, 320)
  }

  const completion = Math.min(Math.abs(deltaX) / THRESHOLD, 1)
  const isRight    = deltaX > 0

  const bgColor = exiting === 'right' ? 'bg-emerald-500/20 border-emerald-500/40'
                : exiting === 'left'  ? 'bg-slate-800 border-slate-700'
                : deltaX > 20         ? `bg-emerald-950/60 border-emerald-800/50`
                : deltaX < -20        ? `bg-slate-800/80 border-slate-700`
                : 'bg-slate-900 border-slate-800'

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ animation: `slideInUp 0.35s ease both`, animationDelay: `${index * 80}ms` }}
    >
      {/* Background hint */}
      <div className={`absolute inset-0 flex items-center justify-between px-5 rounded-2xl transition-colors duration-150 ${bgColor}`}>
        <span className="text-emerald-400 text-xl font-bold" style={{ opacity: isRight ? completion : 0 }}>✓</span>
        <span className="text-slate-500 text-lg" style={{ opacity: !isRight ? completion : 0 }}>→</span>
      </div>

      {/* Card */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`relative border rounded-2xl px-5 py-4 flex items-center gap-3 select-none transition-colors duration-150 ${bgColor}`}
        style={{
          transform: `translateX(${deltaX}px)`,
          transition: deltaX === 0 && !exiting ? 'transform 0.25s ease' : exiting ? `animation: slideOut${exiting === 'right' ? 'Right' : 'Left'} 0.3s ease forwards` : 'none',
          animation: exiting ? `slideOut${exiting === 'right' ? 'Right' : 'Left'} 0.32s ease forwards` : undefined,
        }}
      >
        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors duration-150 ${
          deltaX > 20 ? 'border-emerald-400' : 'border-slate-600'
        }`} />
        <p className="text-slate-200 text-sm flex-1 text-right">{task.title}</p>
      </div>
    </div>
  )
}

// ── FLOATING EMOJI ──────────────────────────────────────────

function Floaters({ items }) {
  return items.map(f => (
    <span
      key={f.id}
      className="pointer-events-none fixed text-4xl z-50"
      style={{ left: `${f.left}%`, top: '45%', animation: 'floatUp 0.85s ease-out forwards' }}
    >
      {f.emoji}
    </span>
  ))
}

// ── MAIN ────────────────────────────────────────────────────

export default function EveningFlow({ session }) {
  const [tasks,     setTasks]     = useState([])
  const [floaters,  setFloaters]  = useState([])
  const [step,      setStep]      = useState('loading')
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

  const spawnEmoji = () => {
    const id   = Date.now() + Math.random()
    const item = { id, emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)], left: 20 + Math.random() * 60 }
    setFloaters(p => [...p, item])
    setTimeout(() => setFloaters(p => p.filter(f => f.id !== id)), 900)
  }

  const completeTask = useCallback(async (task) => {
    spawnEmoji()
    const updated = tasks.filter(t => t.id !== task.id)
    setTasks(updated)
    setDoneCount(c => c + 1)
    const today = TODAY()
    const days  = Math.floor((new Date(today) - new Date(task.created_at)) / 86400000)
    await supabase.from('tasks').update({ completed_at: today, days_to_complete: days }).eq('id', task.id)
    if (updated.length === 0) setTimeout(() => setStep('final'), 400)
  }, [tasks])

  const skipTask = useCallback((task) => {
    setTasks(p => p.filter(t => t.id !== task.id))
    if (tasks.length <= 1) setTimeout(() => setStep('final'), 400)
  }, [tasks])

  // ── LOADING ───────────────────────────────────────────────
  if (step === 'loading') return (
    <div className="min-h-dvh bg-slate-950 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
    </div>
  )

  // ── FINAL ─────────────────────────────────────────────────
  if (step === 'final') {
    const big  = doneCount === 0 ? '💙' : doneCount >= 3 ? '🏆' : '💪'
    const msg  = doneCount === 0 ? 'בסדר — מחר יום חדש!' :
                 doneCount === 1 ? 'כל הכבוד! סגרת משימה אחת' :
                                   `כל הכבוד! סגרת ${doneCount} משימות`
    return (
      <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center px-8 text-center">
        <div className="space-y-5" style={{ animation: 'popIn 0.4s ease both' }}>
          <p className="text-6xl">{big}</p>
          <div>
            <h1 className="text-slate-100 text-2xl font-semibold">{msg}</h1>
            <p className="text-slate-500 text-sm mt-2">לילה טוב 🌙</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-slate-100 text-slate-950 rounded-2xl py-4 text-base font-medium active:scale-95 transition-all"
          >
            סגור
          </button>
        </div>
      </div>
    )
  }

  // ── REVIEW ────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <Floaters items={floaters} />

      <div className="w-full max-w-xs space-y-5">
        <div className="text-center" style={{ animation: 'slideInUp 0.3s ease both' }}>
          <p className="text-4xl mb-2">🌙</p>
          <h1 className="text-slate-100 text-xl font-semibold">ערב טוב!</h1>
          <p className="text-slate-500 text-xs mt-1">החלק ימינה להשלמה · שמאלה לדלג</p>
        </div>

        <div className="space-y-2">
          {tasks.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              index={i}
              onComplete={completeTask}
              onSkip={skipTask}
            />
          ))}
        </div>

        <button
          onClick={() => setStep('final')}
          className="w-full text-slate-500 text-sm py-2 active:text-slate-400 transition-colors"
          style={{ animation: `slideInUp 0.35s ease both`, animationDelay: `${tasks.length * 80 + 50}ms` }}
        >
          סיום היום
        </button>
      </div>
    </div>
  )
}
