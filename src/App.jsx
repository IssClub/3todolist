import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Home from './pages/Home'
import History from './pages/History'
import Settings from './pages/Settings'
import MorningFlow from './pages/MorningFlow'
import EveningFlow from './pages/EveningFlow'

function RequireAuth({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-dvh bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-700 border-t-slate-300 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={
        <RequireAuth session={session}>
          <Home session={session} />
        </RequireAuth>
      } />
      <Route path="/history" element={
        <RequireAuth session={session}>
          <History session={session} />
        </RequireAuth>
      } />
      <Route path="/evening" element={
        <RequireAuth session={session}>
          <EveningFlow session={session} />
        </RequireAuth>
      } />
      <Route path="/morning" element={
        <RequireAuth session={session}>
          <MorningFlow session={session} />
        </RequireAuth>
      } />
      <Route path="/settings" element={
        <RequireAuth session={session}>
          <Settings session={session} />
        </RequireAuth>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
