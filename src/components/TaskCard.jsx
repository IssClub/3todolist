import { useState } from 'react'

const DAY_LABELS = {
  0: 'היום', 1: 'יום', 2: 'יומיים',
}

function daysOpen(createdAt) {
  const created = new Date(createdAt)
  const today = new Date()
  created.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.floor((today - created) / 86400000)
}

function DaysLabel({ days }) {
  if (days === 0) return <span className="text-slate-500 text-xs">נפתחה היום</span>
  if (days === 1) return <span className="text-slate-500 text-xs">יום אחד פתוחה</span>
  if (days === 2) return <span className="text-amber-500/70 text-xs">יומיים פתוחה</span>
  return <span className="text-red-400/70 text-xs">{days} ימים פתוחה</span>
}

export default function TaskCard({ task, onComplete, onDelete }) {
  const [completing, setCompleting] = useState(false)
  const [done, setDone] = useState(false)
  const days = daysOpen(task.created_at)

  const handleComplete = async () => {
    if (completing || done) return

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([40, 20, 60])

    setCompleting(true)
    await new Promise(r => setTimeout(r, 350)) // wait for animation
    setDone(true)
    await new Promise(r => setTimeout(r, 400)) // fade out
    onComplete(task.id)
  }

  return (
    <div className={`
      group relative bg-slate-900 border border-slate-800 rounded-2xl p-4
      transition-all duration-300
      ${done ? 'animate-fade-out pointer-events-none' : 'animate-slide-in'}
    `}>
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <button
          onClick={handleComplete}
          className={`
            flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200
            flex items-center justify-center
            ${completing
              ? 'border-emerald-400 bg-emerald-400 animate-check-pop'
              : 'border-slate-600 hover:border-slate-400 active:scale-90'
            }
          `}
        >
          {completing && (
            <svg className="w-3.5 h-3.5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug transition-all ${completing ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
            {task.title}
          </p>
          <DaysLabel days={days} />
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all text-lg leading-none pb-0.5"
        >
          ×
        </button>
      </div>
    </div>
  )
}
