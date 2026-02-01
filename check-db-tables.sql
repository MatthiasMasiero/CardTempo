-- Run this in Supabase SQL Editor to check if tables exist
-- https://supabase.com/dashboard/project/YOUR_PROJECT/editor

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('payment_reminders', 'reminder_preferences');

-- If this returns 0 rows, you need to run the migration!
