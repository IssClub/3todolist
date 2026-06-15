import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lwcnfvwoupwzqlnlxchl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Y25mdndvdXB3enFsbmx4Y2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTEyMDEsImV4cCI6MjA5NzEyNzIwMX0.KZ2ixzCDbbwAbuzzbTHgnN0E-xDxMlWP6SUty3US000'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
