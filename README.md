# 3 משימות (3ToDoList)

אפליקציית To-Do מינימליסטית: מקסימום 3 משימות פתוחות בו-זמנית. React + Vite + Tailwind, עם Supabase לדאטהבייס/אימות, OneSignal להתראות Push, ופריסה ל-GitHub Pages.

## כתובת האפליקציה

https://IssClub.github.io/3todolist/

מומלץ להוסיף למסך הבית (Add to Home Screen) כדי שהתראות Push יעבדו ב-iOS.

## מבנה כללי

- **Frontend**: React 18 + Vite 5 + Tailwind, נתיבים עם `react-router-dom`
  - `/` — מסך הבית (עד 3 משימות)
  - `/history` — היסטוריית משימות שהושלמו
  - `/settings` — הגדרות (שעות התראה, הפעלת Push)
  - `/morning`, `/evening` — מסכי "בחירה" אינטראקטיביים שנפתחים מההתראות
  - `/login` — הרשמה/כניסה (שם משתמש + סיסמה, מומר למייל סינתטי `username@todolist.app`)
- **Backend**: Supabase (Postgres + Auth + Edge Functions)
  - טבלאות: `profiles`, `tasks` — סכמה מלאה ב-[supabase/schema.sql](supabase/schema.sql)
  - RLS: כל משתמש רואה/עורך רק את הנתונים שלו
  - Edge Function `send-notifications` — רץ כל דקה (דרך cron-job.org), שולח התראות בוקר/ערב ב-Asia/Jerusalem
- **Push**: OneSignal Web Push SDK v16 (מאותחל ב-`index.html`)
- **פריסה**: GitHub Actions (`.github/workflows/deploy.yml`) → GitHub Pages, בכל push ל-`main`

## פרויקט Supabase

האפליקציה רצה על פרויקט Supabase בשם `3todolist`, תחת **חשבון Supabase נפרד** (לא חשבון ה-Supabase ה"רגיל"):

- **חשבון**: `issgpt+todolist@gmail.com` (alias של Gmail — מתועל לתיבת `issgpt@gmail.com`)
- **ארגון**: `IssOrg`
- **Project URL**: `https://lwcnfvwoupwzqlnlxchl.supabase.co`
- ה-`anon key` מוגדר ב-[src/lib/supabase.js](src/lib/supabase.js)

**למה חשבון נפרד?** Supabase מגביל 2 פרויקטים חינמיים *לכל חשבון* (לא לכל ארגון). שני הפרויקטים החינמיים האחרים תפוסים על `issgpt@gmail.com`, אז נפתח חשבון Supabase נוסף עם alias של Gmail כדי לקבל עוד 2 סלוטים חינמיים, ייעודיים לאפליקציה הזו.

אם בעתיד תצטרך לעבור לפרויקט Supabase נוסף — אותה שיטה: `issgpt+<שם-חדש>@gmail.com`.

### הגדרות נדרשות בפרויקט Supabase (כבר מוגדרות)

- **Authentication → Sign In / Providers → Email**: "Confirm email" כבוי, "Allow new users to sign up" דלוק
- **Edge Functions → send-notifications**: "Enforce JWT Verification" כבוי
- **Edge Functions → Secrets**: `CRON_SECRET`, `ONESIGNAL_REST_API_KEY` (ראה Edge Function settings בדשבורד)

## התראות Push (OneSignal + cron-job.org)

- אפליקציית OneSignal: App ID `07ae49fb-8e2b-4741-9561-fcee2ecd2b00`
- **cron-job.org**: cron job בשם "3ToDoList", רץ כל דקה, קורא ל-Edge Function עם `?secret=...` (חייב להיות "Enable job" דלוק — cron-job.org מכבה אוטומטית אחרי כשלים חזרים)
- ה-Edge Function בודק לכל משתמש את `morning_time`/`evening_time` (טבלת `profiles`) מול השעה הנוכחית בישראל, ושולח Push מתאים

## עדכון הקוד

כל שינוי בקוד → commit + push ל-`main` → GitHub Actions בונה ופורס אוטומטית (כ-2 דקות).
