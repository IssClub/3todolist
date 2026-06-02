import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TODAY = () => new Date().toISOString().split('T')[0]
const EMOJIS = ['🎉', '✨', '⭐', '🔥', '💫', '🎯', '🙌']

function haptic() {
  if ('vibrate' in navigator) navigator.vibrate([30, 20, 60, 20, 40])
}

function LoadingScreen() {
  return (
    <div className="min-h-dvh bg-slate-950 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
    </div>
  )
}

function SummaryScreen({ total, completedCount, onDone }) {
  const emoji  = completedCount === 0 ? '💙' : completedCount === total ? '🏆' : '💪'
  const title  = completedCount === 0
    ? 'בסדר, יהיה מחר'
    : completedCount === total
      ? 'כל הכבוד! סיימת הכל!'
      : `סגרת ${completedCount} מתוך ${total} — לא רע!`

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-5 text-center">
        <p className="text-6xl">{emoji}</p>
        <div>
          <h1 className="text-slate-100 text-xl font-medium">{title}</h1>
          <p className="text-slate-500 text-sm mt-2">מחר יום חדש — לילה טוב 🌙</p>
        </div>
        <button
          onClick={onDone}
          className="w-full bg-slate-100 text-slate-950 rounded-xl py-3.5 text-sm font-medium active:scale-95 transition-all"
        >
          לילה טוב 🌙
        </button>
      </div>
    </div>
  )
}

export default function EveningFlow({ session }) {
  const [tasks,     setTasks]     = useState([])
  const [completed, setCompleted] = useState(new Set())
  const [floaters,  setFloaters]  = useState([])
  const [step,      setStep]      = useState('loading')
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', session.user.id)
      .is('completed_at', null)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setTasks(data || [])
        setStep(data?.length ? 'review' : 'done')
      })
  }, [session.user.id])

  const completeTask = useCallback(async (task) => {
    if (completed.has(task.id)) return

    haptic()

    // Floating emoji burst
    const id    = Date.now() + Math.random()
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
    const left  = 20 + Math.random() * 60
    setFloaters(prev => [...prev, { id, emoji, left }])
    setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 900)

    const updatedTasks = tasks.filter(t => t.id !== task.id)
    setCompleted(prev => new Set([...prev, task.id]))
    setTasks(updatedTasks)
    if (updatedTasks.length === 0) setTimeout(() => window.close(), 700)

    const today   = TODAY()
    const days    = Math.floor((new Date(today) - new Date(task.created_at)) / 86400000)
    await supabase.from('tasks').update({ completed_at: today, days_to_complete: days }).eq('id', task.id)
  }, [completed])

  if (step === 'loading') return <LoadingScreen />

  if (step === 'summary') {
    return <SummaryScreen total={tasks.length} completedCount={completed.size} onDone={() => navigate('/')} />
  }

  const allDone = completed.size === tasks.length

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col relative overflow-hidden">

      {/* Floating emojis */}
      {floaters.map(f => (
        <span
          key={f.id}
          className="pointer-events-none absolute text-4xl"
          style={{ left: `${f.left}%`, top: '50%', zIndex: 50, animation: 'floatUp 0.85s ease-out forwards' }}
        >
          {f.emoji}
        </span>
      ))}

      <div className="flex flex-col items-center justify-center flex-1 px-6">
        <div className="w-full max-w-sm space-y-5">

          {/* Header */}
          <div className="text-center">
            <p className="text-4xl mb-3">🌙</p>
            <h1 className="text-slate-100 text-xl font-medium">ערב טוב!</h1>
            <p className="text-slate-500 text-sm mt-1">סמן את המשימות שסיימת היום</p>
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            {tasks.map(task => {
              const isDone = completed.has(task.id)
              return (
                <button
                  key={task.id}
                  onClick={() => completeTask(task)}
                  className={`w-full text-right flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-200 active:scale-95 ${
                    isDone
                      ? 'bg-emerald-950/40 border-emerald-800/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                    isDone ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'
                  }`}>
                    {isDone && (
                      <svg className="w-3 h-3 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <p className={`text-sm transition-all duration-200 ${isDone ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {task.title}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Progress */}
          {completed.size > 0 && (
            <p className="text-center text-slate-500 text-xs">
              {allDone ? '✨ כל המשימות הושלמו!' : `${completed.size} מתוך ${tasks.length} הושלמו`}
            </p>
          )}

          {/* Done button */}
          <button
            onClick={() => window.close()}
            className="w-full bg-slate-100 text-slate-950 rounded-xl py-3.5 text-sm font-medium active:scale-95 transition-all"
          >
            {allDone ? 'מדהים! סיום 🎉' : 'סיום היום'}
          </button>

        </div>
      </div>
    </div>
  )
}
