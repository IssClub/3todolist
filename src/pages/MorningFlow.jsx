import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const MAX   = 3
const TODAY = () => new Date().toISOString().split('T')[0]

function Screen({ children }) {
  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col items-center justify-center px-8 text-center">
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

function TaskPill({ title, index }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3 text-right">
      <span className="text-slate-700 text-xs w-4 flex-shrink-0">{index + 1}</span>
      <p className="text-slate-200 text-sm flex-1">{title}</p>
    </div>
  )
}

export default function MorningFlow({ session }) {
  const [tasks,   setTasks]   = useState([])
  const [step,    setStep]    = useState('loading')
  const [input,   setInput]   = useState('')
  const [adding,  setAdding]  = useState(false)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('tasks').select('*')
      .eq('user_id', session.user.id)
      .is('completed_at', null)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setTasks(data || [])
        setStep('overview')
      })
  }, [session.user.id])

  useEffect(() => {
    if (step === 'adding') setTimeout(() => inputRef.current?.focus(), 150)
  }, [step])

  const addTask = async () => {
    const title = input.trim()
    if (!title || adding) return
    setAdding(true)
    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: session.user.id, title, created_at: TODAY() })
      .select().single()
    if (!error && data) {
      const updated = [...tasks, data]
      setTasks(updated)
      setInput('')
      setStep(updated.length >= MAX ? 'final' : 'overview')
    }
    setAdding(false)
  }

  const goFinal = () => setStep(tasks.length > 0 ? 'final' : 'overview')
  const closeApp = () => navigate('/')

  // ── LOADING ─────────────────────────────────────────────
  if (step === 'loading') return (
    <Screen>
      <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin mx-auto" />
    </Screen>
  )

  // ── OVERVIEW ────────────────────────────────────────────
  if (step === 'overview') {
    const remaining = MAX - tasks.length
    const canAdd = remaining > 0
    return (
      <Screen>
        <p className="text-5xl">☀️</p>
        <div>
          <h1 className="text-slate-100 text-2xl font-semibold">בוקר טוב!</h1>
          {tasks.length > 0 && (
            <p className="text-slate-500 text-sm mt-1">
              {tasks.length === 1 ? 'משימה אחת פתוחה' : `${tasks.length} משימות פתוחות`}
            </p>
          )}
        </div>

        {tasks.length > 0 && (
          <div className="space-y-2 text-right">
            {tasks.map((t, i) => <TaskPill key={t.id} title={t.title} index={i} />)}
          </div>
        )}

        {canAdd && (
          <p className="text-slate-600 text-sm">
            {tasks.length === 0
              ? 'אין משימות — תרצה להוסיף?'
              : `יש מקום ל-${remaining} משימ${remaining === 1 ? 'ה' : 'ות'} נוספ${remaining === 1 ? 'ת' : 'ות'}`}
          </p>
        )}

        <div className="space-y-2 pt-2">
          {canAdd && <BigBtn onClick={() => setStep('adding')}>+ הוסף משימה</BigBtn>}
          <BigBtn secondary onClick={canAdd ? () => { if (tasks.length > 0) setStep('final'); else navigate('/') } : () => setStep('final')}>
            {canAdd
              ? (tasks.length > 0 ? 'מתחיל את היום ←' : 'אחר כך')
              : 'יאללה! 🚀'}
          </BigBtn>
        </div>
      </Screen>
    )
  }

  // ── ADDING ──────────────────────────────────────────────
  if (step === 'adding') return (
    <Screen>
      <p className="text-5xl">➕</p>
      <h1 className="text-slate-100 text-xl font-semibold">איזו משימה תרצה להוסיף?</h1>

      <input
        ref={inputRef}
        type="text"
        placeholder="שם המשימה..."
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && addTask()}
        maxLength={80}
        className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-4 text-slate-100 placeholder-slate-600 text-base text-center focus:outline-none focus:border-slate-500 transition-colors"
      />

      <div className="space-y-2">
        <BigBtn onClick={addTask} disabled={!input.trim() || adding}>
          {adding ? '...' : 'הוסף'}
        </BigBtn>
        <BigBtn secondary onClick={() => setStep(tasks.length > 0 ? 'overview' : 'overview')}>
          דלג
        </BigBtn>
      </div>
    </Screen>
  )

  // ── FINAL ───────────────────────────────────────────────
  if (step === 'final') return (
    <Screen>
      <p className="text-5xl">💪</p>
      <div>
        <h1 className="text-slate-100 text-2xl font-semibold">בהצלחה היום!</h1>
        <p className="text-slate-500 text-sm mt-1">המשימות שלך</p>
      </div>

      <div className="space-y-2 text-right">
        {tasks.map((t, i) => <TaskPill key={t.id} title={t.title} index={i} />)}
      </div>

      <BigBtn onClick={closeApp}>סגור 🚀</BigBtn>
    </Screen>
  )

  return null
}
