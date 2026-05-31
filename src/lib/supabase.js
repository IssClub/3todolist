import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qvxudlxhchfdjmjvojyn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2eHVkbHhoY2hmZGptanZvanluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTkyMDIsImV4cCI6MjA5NTgzNTIwMn0.5tpTqa8oJP68_yTCc75vK-hf_WDiDvj865eYR7CHq74'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
