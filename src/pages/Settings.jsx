import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{ direction: 'ltr' }}
      className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 ${
        value ? 'bg-slate-200' : 'bg-slate-700'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${
        value ? 'translate-x-6 bg-slate-900' : 'translate-x-0 bg-slate-500'
      }`} />
    </button>
  )
}

function Row({ emoji, title, subtitle, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-slate-100 text-sm font-medium">{emoji} {title}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default function Settings({ session }) {
  const [morningTime, setMorningTime] = useState('08:00')
  const [eveningTime, setEveningTime] = useState('20:00')
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const navigate = useNavigate()

  const [pushStatus, setPushStatus] = useState('') // '', 'granted', 'denied', 'requesting'

  useEffect(() => {
    supabase
      .from('profiles')
      .select('morning_time, evening_time, notifications_enabled')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          if (data.morning_time) setMorningTime(data.morning_time)
          if (data.evening_time) setEveningTime(data.evening_time)
          if (data.notifications_enabled != null) setEnabled(data.notifications_enabled)
        }
        setLoading(false)
      })

    // Check current permission status
    if ('Notification' in window) {
      const perm = Notification.permission
      setPushStatus(perm)
      // Permission already granted (e.g. from before) — silently sync the player id
      if (perm === 'granted') syncPlayerId()
    }
  }, [session.user.id])

  const syncPlayerId = () => {
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      const playerId = await OneSignal.User.PushSubscription.id
      if (playerId) {
        await supabase.from('profiles').update({ onesignal_player_id: playerId }).eq('id', session.user.id)
      }
    })
  }

  const requestPush = async () => {
    setPushStatus('requesting')
    try {
      window.OneSignalDeferred = window.OneSignalDeferred || []
      window.OneSignalDeferred.push(async (OneSignal) => {
        await OneSignal.Notifications.requestPermission()
        const playerId = await OneSignal.User.PushSubscription.id
        if (playerId) {
          await supabase.from('profiles').update({ onesignal_player_id: playerId }).eq('id', session.user.id)
        }
        setPushStatus(Notification.permission)
      })
    } catch (_) {
      setPushStatus('denied')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ morning_time: morningTime, evening_time: eveningTime, notifications_enabled: enabled })
      .eq('id', session.user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col">
      <header className="flex items-center gap-4 px-6 pt-14 pb-6">
        <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-300 transition-colors">
          ← חזרה
        </button>
        <h1 className="text-slate-100 text-lg font-medium">הגדרות</h1>
      </header>

      {loading ? (
        <div className="flex justify-center pt-16">
          <div className="w-5 h-5 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
        </div>
      ) : (
        <main className="px-6 space-y-3">
          <Row emoji="🔔" title="התראות" subtitle="קבל תזכורות יומיות">
            <Toggle value={enabled} onChange={setEnabled} />
          </Row>

          {enabled && (
            <>
              <Row emoji="☀️" title="התראת בוקר" subtitle="משימות פתוחות + הוספה">
                <input
                  type="time"
                  value={morningTime}
                  onChange={e => setMorningTime(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-slate-500 transition-colors"
                />
              </Row>

              <Row emoji="🌙" title="התראת ערב" subtitle="סיכום יום + משימות שנסגרו">
                <input
                  type="time"
                  value={eveningTime}
                  onChange={e => setEveningTime(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-slate-500 transition-colors"
                />
              </Row>
            </>
          )}

          {/* Push permission button */}
          <button
            onClick={requestPush}
            disabled={pushStatus === 'granted' || pushStatus === 'requesting'}
            className={`w-full rounded-xl py-3.5 text-sm font-medium transition-all active:scale-95 disabled:opacity-60 border ${
              pushStatus === 'granted'
                ? 'border-emerald-700 text-emerald-400 bg-transparent'
                : 'border-slate-700 text-slate-300 bg-transparent'
            }`}
          >
            {pushStatus === 'granted'   ? '✓ התראות מופעלות' :
             pushStatus === 'denied'    ? '⚠️ חסומות בהגדרות הטלפון' :
             pushStatus === 'requesting' ? '...' :
             '🔔 הפעל התראות על המכשיר'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full rounded-xl py-3.5 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 ${
              saved ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-950'
            }`}
          >
            {saving ? '...' : saved ? '✓ נשמר' : 'שמור'}
          </button>
        </main>
      )}
    </div>
  )
}
