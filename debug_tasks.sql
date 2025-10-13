-- Query per diagnosticare il problema delle task

-- 1. Controllare se ci sono task nel database
SELECT COUNT(*) as total_tasks FROM public.tasks;

-- 2. Controllare se ci sono task per utenti specifici
SELECT user_id, COUNT(*) as task_count 
FROM public.tasks 
GROUP BY user_id;

-- 3. Controllare le RLS policies per la tabella tasks
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'tasks';

-- 4. Controllare se RLS è abilitata sulla tabella tasks
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'tasks';

-- 5. Controllare gli utenti autenticati
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Controllare i profili utente
SELECT user_id, display_name, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Testare l'accesso alle task con un utente specifico (sostituire con ID reale)
-- SELECT * FROM public.tasks WHERE user_id = 'USER_ID_HERE';

-- 8. Controllare se ci sono task recenti
SELECT id, user_id, title, status, created_at 
FROM public.tasks 
ORDER BY created_at DESC 
LIMIT 10;