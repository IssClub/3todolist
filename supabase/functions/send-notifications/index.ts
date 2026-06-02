import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ONESIGNAL_APP_ID = '07ae49fb-8e2b-4741-9561-fcee2ecd2b00'
const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')!
const CRON_SECRET     = Deno.env.get('CRON_SECRET')!
const APP_URL         = 'https://IssClub.github.io/3todolist/'

function nowIsrael(): string {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).slice(0, 5)
}

function todayIsrael(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' })
}

async function push(playerIds: string[], title: string, body: string) {
  if (!playerIds.length) return
  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { he: title, en: title },
      contents: { he: body,  en: body  },
      url: APP_URL,
    }),
  })
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  if (url.searchParams.get('secret') !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const time  = nowIsrael()
  const today = todayIsrael()

  /* ─── MORNING ─── */
  const { data: morningUsers } = await supabase
    .from('profiles')
    .select('id, onesignal_player_id')
    .eq('morning_time', time)
    .eq('notifications_enabled', true)
    .not('onesignal_player_id', 'is', null)

  for (const u of morningUsers ?? []) {
    const { data: open } = await supabase
      .from('tasks').select('title')
      .eq('user_id', u.id).is('completed_at', null)

    const n = open?.length ?? 0
    const body = n === 0
      ? '📝 אין לך משימות פתוחות — רוצה להוסיף אחת?'
      : n === 1
        ? `משימה אחת פתוחה: "${open![0].title}"`
        : `יש לך ${n} משימות פתוחות: ${open!.map(t => `"${t.title}"`).join(', ')}`

    await push([u.onesignal_player_id], '☀️ בוקר טוב', body)
  }

  /* ─── EVENING ─── */
  const { data: eveningUsers } = await supabase
    .from('profiles')
    .select('id, onesignal_player_id')
    .eq('evening_time', time)
    .eq('notifications_enabled', true)
    .not('onesignal_player_id', 'is', null)

  for (const u of eveningUsers ?? []) {
    const [{ data: done }, { data: open }] = await Promise.all([
      supabase.from('tasks').select('title').eq('user_id', u.id).eq('completed_at', today),
      supabase.from('tasks').select('title').eq('user_id', u.id).is('completed_at', null),
    ])

    const doneN = done?.length ?? 0
    const openN = open?.length ?? 0

    const body =
      doneN > 0 && openN === 0 ? `🎉 כל הכבוד! סגרת ${doneN} משימ${doneN === 1 ? 'ה' : 'ות'} היום` :
      doneN > 0 && openN > 0  ? `✅ סגרת ${doneN} היום — עוד ${openN} ממתינ${openN === 1 ? 'ה' : 'ות'}` :
      openN > 0               ? `יש ${openN} משימ${openN === 1 ? 'ה' : 'ות'} פתוח${openN === 1 ? 'ה' : 'ות'} — מה עם להשלים אחת? 💪` :
                                'לא היו לך משימות היום — מחר תתחיל עם אחת! 🌙'

    await push([u.onesignal_player_id], '🌙 ערב טוב', body)
  }

  return new Response(JSON.stringify({ ok: true, time }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
