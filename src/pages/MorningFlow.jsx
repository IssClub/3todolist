import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const MAX_TASKS = 3
const TODAY = () => new Date().toISOString().split('T')[0]

function TaskRow({ task, index }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 flex items-center gap-3">
      <span className="text-slate-600 text-xs w-4">{index + 1}</span>
      <p className="text-slate-200 text-sm">{task.title}</p>
    </div>
  )
}

// ─── SCREENS ───────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-dvh bg-slate-950 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
    </div>
  )
}

function OverviewScreen({ tasks, onAdd, onDone }) {
  const canAdd = tasks.length < MAX_TASKS
  const remaining = MAX_TASKS - tasks.length
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב'

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <p className="text-4xl mb-3">☀️</p>
          <h1 className="text-slate-100 text-xl font-medium">{greeting}!</h1>
          <p className="text-slate-500 text-sm mt-1">
            {tasks.length === 0
              ? 'אין משימות פתוחות'
              : tasks.length === 1
                ? 'משימה אחת פתוחה'
                : `${tasks.length} משימות פתוחות`}
          </p>
        </div>

        {tasks.length > 0 && (
          <div className="space-y-2">
            {tasks.map((t, i) => <TaskRow key={t.id} task={t} index={i} />)}
          </div>
        )}

        {canAdd && (
          <p className="text-center text-slate-600 text-xs">
            {`יש לך מקום ל-${remaining} משימ${remaining === 1 ? 'ה' : 'ות'} נוספ${remaining === 1 ? 'ת' : 'ות'}`}
          </p>
        )}

        <div className="space-y-2 pt-1">
          {canAdd && (
            <button
              onClick={onAdd}
              className="w-full bg-slate-100 text-slate-950 rounded-xl py-3.5 text-sm font-medium active:scale-95 transition-all"
            >
              + הוסף משימה
            </button>
          )}
          <button
            onClick={onDone}
            className={`w-full rounded-xl py-3.5 text-sm transition-all active:scale-95 ${
              canAdd
                ? 'text-slate-500 hover:text-slate-400'
                : 'bg-slate-100 text-slate-950 font-medium'
            }`}
          >
            {canAdd ? (tasks.length > 0 ? 'מתחיל את היום ←' : 'אחר כך') : 'יאללה! 🚀'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddingScreen({ onConfirm, onSkip, adding }) {
  const [title, setTitle] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [])

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-3">
        <div className="text-center mb-6">
          <p className="text-3xl mb-3">➕</p>
          <h1 className="text-slate-100 text-lg font-medium">איזו משימה תרצה להוסיף?</h1>
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder="שם המשימה..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && title.trim() && onConfirm(title.trim())}
          maxLength={80}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-slate-500 transition-colors"
        />

        <button
          onClick={() => title.trim() && onConfirm(title.trim())}
          disabled={!title.trim() || adding}
          className="w-full bg-slate-100 text-slate-950 rounded-xl py-3.5 text-sm font-medium disabled:opacity-40 active:scale-95 transition-all"
        >
          {adding ? '...' : 'הוסף'}
        </button>

        <button onClick={onSkip} className="w-full text-slate-500 text-sm py-2">
          דלג
        </button>
      </div>
    </div>
  )
}

function SummaryScreen({ tasks, onDone }) {
  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <p className="text-4xl mb-3">💪</p>
          <h1 className="text-slate-100 text-xl font-medium">המשימות שלך להיום</h1>
        </div>

        <div className="space-y-2">
          {tasks.map((t, i) => <TaskRow key={t.id} task={t} index={i} />)}
        </div>

        <button
          onClick={onDone}
          className="w-full bg-slate-100 text-slate-950 rounded-xl py-3.5 text-sm font-medium active:scale-95 transition-all"
        >
          יאללה! 🚀
        </button>
      </div>
    </div>
  )
}

// ─── MAIN ──────────────────────────────────────────────────

export default function MorningFlow({ session }) {
  const [tasks, setTasks]   = useState([])
  const [step, setStep]     = useState('loading')
  const [adding, setAdding] = useState(false)
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
        setStep('overview')
      })
  }, [session.user.id])

  const addTask = async (title) => {
    setAdding(true)
    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: session.user.id, title, created_at: TODAY() })
      .select().single()
    if (!error && data) {
      const updated = [...tasks, data]
      setTasks(updated)
      setStep(updated.length >= MAX_TASKS ? 'summary' : 'overview')
    }
    setAdding(false)
  }

  const goHome = () => navigate('/')

  if (step === 'loading')  return <LoadingScreen />
  if (step === 'adding')   return <AddingScreen onConfirm={addTask} onSkip={() => setStep(tasks.length > 0 ? 'summary' : 'overview')} adding={adding} />
  if (step === 'summary')  return <SummaryScreen tasks={tasks} onDone={goHome} />

  return (
    <OverviewScreen
      tasks={tasks}
      onAdd={() => setStep('adding')}
      onDone={() => tasks.length > 0 ? setStep('summary') : goHome()}
    />
  )
}
