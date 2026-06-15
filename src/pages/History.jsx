import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function DurationBadge({ days }) {
  if (days === 0) return <span className="text-emerald-400 text-xs">נסגרה ביום הפתיחה</span>
  if (days === 1) return <span className="text-emerald-400/80 text-xs">יום אחד</span>
  if (days <= 3) return <span className="text-amber-400/80 text-xs">{days} ימים</span>
  return <span className="text-red-400/70 text-xs">{days} ימים</span>
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
}

export default function History({ session }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(50)
      setTasks(data || [])
      setLoading(false)
    }
    fetch()
  }, [session.user.id])

  const deleteTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  // Group by completed_at date
  const grouped = tasks.reduce((acc, task) => {
    const key = task.completed_at
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col">
      <header className="flex items-center gap-4 px-6 pt-14 pb-6">
        <button
          onClick={() => navigate('/')}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← חזרה
        </button>
        <h1 className="text-slate-100 text-lg font-medium">היסטוריה</h1>
      </header>

      <main className="flex-1 px-6 pb-10">
        {loading ? (
          <div className="flex justify-center pt-16">
            <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-center text-slate-600 text-sm pt-16">עוד אין משימות שהושלמו</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dateTasks]) => (
              <div key={date}>
                <p className="text-slate-500 text-xs mb-2 font-medium">{formatDate(date)}</p>
                <div className="space-y-2">
                  {dateTasks.map(task => (
                    <div
                      key={task.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-slate-400 text-sm line-through">{task.title}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <DurationBadge days={task.days_to_complete ?? 0} />
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                          aria-label="מחק"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
