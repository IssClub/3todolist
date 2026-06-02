import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import TaskCard from '../components/TaskCard'

const MAX_TASKS = 3

const TODAY = () => new Date().toISOString().split('T')[0]

function registerPushIfNeeded(userId) {
  if (!window.OneSignal) return
  window.OneSignalDeferred = window.OneSignalDeferred || []
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.Notifications.requestPermission()
      const playerId = await OneSignal.User.PushSubscription.id
      if (!playerId) return
      await supabase.from('profiles').update({ onesignal_player_id: playerId }).eq('id', userId)
    } catch (_) {}
  })
}

export default function Home({ session }) {
  const [tasks, setTasks] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const navigate = useNavigate()

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', session.user.id)
      .is('completed_at', null)
      .order('created_at', { ascending: true })
    setTasks(data || [])
    setLoading(false)
  }, [session.user.id])

  useEffect(() => {
    fetchTasks()
    registerPushIfNeeded(session.user.id)
  }, [fetchTasks, session.user.id])

  const addTask = async () => {
    const title = newTitle.trim()
    if (!title || tasks.length >= MAX_TASKS || adding) return
    setAdding(true)
    const { data, error } = await supabase.from('tasks').insert({
      user_id: session.user.id,
      title,
      created_at: TODAY(),
    }).select().single()
    if (!error && data) {
      setTasks(prev => [...prev, data])
      setNewTitle('')
      if (tasks.length + 1 >= MAX_TASKS) setShowInput(false)
    }
    setAdding(false)
  }

  const completeTask = async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const today = TODAY()
    const created = new Date(task.created_at)
    const now = new Date(today)
    const days = Math.floor((now - created) / 86400000)

    await supabase.from('tasks').update({
      completed_at: today,
      days_to_complete: days,
    }).eq('id', id)

    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const deleteTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const canAdd = tasks.length < MAX_TASKS

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'בוקר טוב' : hour < 17 ? 'צהריים טובים' : 'ערב טוב'

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-14 pb-6">
        <div>
          <p className="text-slate-500 text-xs mb-0.5">{greeting}</p>
          <h1 className="text-slate-100 text-lg font-medium">המשימות שלי</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/history')}
            className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
          >
            היסטוריה
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
          >
            הגדרות
          </button>
          <button
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-400 transition-colors text-xs"
          >
            יציאה
          </button>
        </div>
      </header>

      {/* Tasks */}
      <main className="flex-1 px-6 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-16">
            <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center pt-16">
            <p className="text-slate-600 text-sm">אין משימות פתוחות</p>
            <p className="text-slate-700 text-xs mt-1">הוסף עד {MAX_TASKS} משימות</p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={completeTask}
              onDelete={deleteTask}
            />
          ))
        )}

        {/* Counter */}
        {!loading && (
          <div className="flex justify-center pt-2">
            <div className="flex gap-1.5">
              {Array.from({ length: MAX_TASKS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    i < tasks.length ? 'bg-slate-300' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Add task input */}
        {canAdd && !loading && (
          <div className="pt-2">
            {showInput ? (
              <div className="flex gap-2 animate-slide-in">
                <input
                  autoFocus
                  type="text"
                  placeholder="שם המשימה..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTask()
                    if (e.key === 'Escape') { setShowInput(false); setNewTitle('') }
                  }}
                  maxLength={80}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-slate-500 transition-colors"
                />
                <button
                  onClick={addTask}
                  disabled={!newTitle.trim() || adding}
                  className="bg-slate-100 text-slate-950 rounded-xl px-4 text-sm font-medium disabled:opacity-40 transition-opacity active:scale-95"
                >
                  הוסף
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowInput(true)}
                className="w-full border border-dashed border-slate-800 hover:border-slate-700 rounded-2xl py-3.5 text-slate-600 hover:text-slate-500 text-sm transition-colors"
              >
                + משימה חדשה
              </button>
            )}
          </div>
        )}
      </main>

      {/* Bottom safe area */}
      <div className="safe-bottom" />
    </div>
  )
}
