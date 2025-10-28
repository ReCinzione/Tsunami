# 🗄️ Database Reference - Tsunami Application

**Versione Database**: 2.0  
**Data Aggiornamento**: 2025-01-21  
**DBMS**: PostgreSQL (Supabase)  

---

## 📋 Schema Completo Database

### 🔧 Enums e Tipi Personalizzati

```sql
-- Tipi di Archetipo
CREATE TYPE archetype_type AS ENUM (
  'visionario',
  'costruttore', 
  'sognatore',
  'silenzioso',
  'combattente'
);

-- Livelli di Energia
CREATE TYPE energy_level AS ENUM (
  'bassa',
  'media',
  'alta'
);

-- Tipi di Task
CREATE TYPE task_type AS ENUM (
  'azione',
  'riflessione',
  'creativita',
  'sociale',
  'manutenzione'
);

-- Umore Giornaliero
CREATE TYPE daily_mood AS ENUM (
  'energico',
  'calmo',
  'ansioso',
  'motivato',
  'stanco',
  'confuso',
  'ispirato'
);
```

---

## 📊 Tabelle Principali

### 1. **profiles** - Profili Utente

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  dominant_archetype archetype_type,
  visionario_percentage int4 DEFAULT 0 CHECK (visionario_percentage >= 0 AND visionario_percentage <= 100),
  costruttore_percentage int4 DEFAULT 0 CHECK (costruttore_percentage >= 0 AND costruttore_percentage <= 100),
  sognatore_percentage int4 DEFAULT 0 CHECK (sognatore_percentage >= 0 AND sognatore_percentage <= 100),
  silenzioso_percentage int4 DEFAULT 0 CHECK (silenzioso_percentage >= 0 AND silenzioso_percentage <= 100),
  combattente_percentage int4 DEFAULT 0 CHECK (combattente_percentage >= 0 AND combattente_percentage <= 100),
  current_level int4 DEFAULT 1 CHECK (current_level >= 1),
  total_xp int4 DEFAULT 0 CHECK (total_xp >= 0),
  test_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indici
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_dominant_archetype ON profiles(dominant_archetype);
CREATE INDEX idx_profiles_level ON profiles(current_level);
```

### 2. **tasks** - Gestione Attività

```sql
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL CHECK (length(title) > 0),
  description text,
  energy_required energy_level DEFAULT 'media',
  task_type task_type DEFAULT 'azione',
  is_recurring boolean DEFAULT false,
  recurrence_pattern text, -- JSON string per pattern complessi
  due_date timestamptz,
  completed_at timestamptz,
  postponed_count int4 DEFAULT 0 CHECK (postponed_count >= 0),
  xp_reward int4 DEFAULT 10 CHECK (xp_reward > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  google_calendar_event_id text,
  tags text[] DEFAULT '{}',
  priority int4 DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  estimated_duration_minutes int4,
  actual_duration_minutes int4,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indici
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX idx_tasks_energy_required ON tasks(energy_required);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
```

### 3. **xp_transactions** - Tracking XP

```sql
CREATE TABLE xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  amount int4 NOT NULL,
  source text NOT NULL CHECK (length(source) > 0),
  source_id uuid, -- ID dell'entità che ha generato l'XP (task, routine, etc.)
  description text,
  metadata jsonb DEFAULT '{}', -- Dati aggiuntivi per analytics
  created_at timestamptz DEFAULT now()
);

-- Indici
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_source ON xp_transactions(source);
CREATE INDEX idx_xp_transactions_created_at ON xp_transactions(created_at);
CREATE INDEX idx_xp_transactions_metadata ON xp_transactions USING GIN(metadata);
```

### 4. **mental_inbox** - Inbox Mentale

```sql
CREATE TABLE mental_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  content text NOT NULL CHECK (length(content) > 0),
  content_type text DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'audio', 'link')),
  is_processed boolean DEFAULT false,
  converted_to_task boolean DEFAULT false,
  task_id uuid REFERENCES tasks(id),
  priority_score int4 DEFAULT 0, -- Score automatico per prioritizzazione
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}', -- OCR results, AI analysis, etc.
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Indici
CREATE INDEX idx_mental_inbox_user_id ON mental_inbox(user_id);
CREATE INDEX idx_mental_inbox_is_processed ON mental_inbox(is_processed);
CREATE INDEX idx_mental_inbox_converted_to_task ON mental_inbox(converted_to_task);
CREATE INDEX idx_mental_inbox_tags ON mental_inbox USING GIN(tags);
```

### 5. **daily_moods** - Tracciamento Umore

```sql
CREATE TABLE daily_moods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  mood daily_mood NOT NULL,
  suggested_ritual text,
  energy_level int4 CHECK (energy_level >= 1 AND energy_level <= 10),
  notes text,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date) -- Un solo mood per giorno per utente
);

-- Indici
CREATE INDEX idx_daily_moods_user_id ON daily_moods(user_id);
CREATE INDEX idx_daily_moods_date ON daily_moods(date);
CREATE INDEX idx_daily_moods_mood ON daily_moods(mood);
```

### 6. **projects** - Gestione Progetti

```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL CHECK (length(title) > 0),
  description text,
  status text DEFAULT 'idea' CHECK (status IN ('idea', 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  energy_required energy_level DEFAULT 'media',
  priority int4 DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  estimated_duration_days int4,
  actual_duration_days int4,
  start_date date,
  target_completion_date date,
  actual_completion_date date,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indici
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_tags ON projects USING GIN(tags);
```

### 7. **routines** - Sistema Routine

```sql
CREATE TABLE routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL CHECK (length(name) > 0),
  type text NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'custom')),
  category text NOT NULL CHECK (category IN ('benessere', 'fitness', 'studio', 'lavoro', 'creativita', 'relazioni', 'casa', 'altro')),
  start_time time,
  end_time time,
  days_of_week text[] DEFAULT '{}', -- ['monday', 'tuesday', ...]
  day_of_month int4 CHECK (day_of_month >= 1 AND day_of_month <= 31),
  is_active boolean DEFAULT true,
  streak_count int4 DEFAULT 0,
  best_streak int4 DEFAULT 0,
  total_completions int4 DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indici
CREATE INDEX idx_routines_user_id ON routines(user_id);
CREATE INDEX idx_routines_type ON routines(type);
CREATE INDEX idx_routines_category ON routines(category);
CREATE INDEX idx_routines_is_active ON routines(is_active);
```

### 8. **routine_items** - Elementi delle Routine

```sql
CREATE TABLE routine_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL CHECK (length(name) > 0),
  description text,
  order_index int4 NOT NULL DEFAULT 0,
  is_completed boolean DEFAULT false,
  estimated_duration_minutes int4,
  created_at timestamptz DEFAULT now()
);

-- Indici
CREATE INDEX idx_routine_items_routine_id ON routine_items(routine_id);
CREATE INDEX idx_routine_items_order ON routine_items(order_index);
```

**🔄 Reset Automatico Implementato**:
- **Sistema Client-Side**: Reset automatico giornaliero dei flag `is_completed`
- **Logica**: Implementata in `RoutineManager.tsx` con `useEffect`
- **Tracking**: Ultimo reset salvato in `localStorage` come `lastRoutineReset`
- **Gestione Intelligente**: Reset basato su tipo routine (daily/weekly/monthly)
- **Prevenzione Duplicati**: Controllo data per evitare reset multipli nella stessa giornata

### 9. **routine_goals** - Obiettivi delle Routine

```sql
CREATE TABLE routine_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
  goal_text text NOT NULL CHECK (length(goal_text) > 0),
  target_value int4,
  current_value int4 DEFAULT 0,
  unit text, -- 'minutes', 'reps', 'pages', etc.
  is_achieved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  achieved_at timestamptz
);

-- Indici
CREATE INDEX idx_routine_goals_routine_id ON routine_goals(routine_id);
CREATE INDEX idx_routine_goals_is_achieved ON routine_goals(is_achieved);
```

### 10. **test_questions** - Domande Test Archetipo

```sql
CREATE TABLE test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL CHECK (length(question_text) > 0),
  question_order int4 NOT NULL,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indici
CREATE INDEX idx_test_questions_order ON test_questions(question_order);
CREATE INDEX idx_test_questions_is_active ON test_questions(is_active);
```

### 11. **test_answers** - Risposte Test Archetipo

```sql
CREATE TABLE test_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES test_questions(id) ON DELETE CASCADE NOT NULL,
  answer_text text NOT NULL CHECK (length(answer_text) > 0),
  visionario_weight int4 DEFAULT 0,
  costruttore_weight int4 DEFAULT 0,
  sognatore_weight int4 DEFAULT 0,
  silenzioso_weight int4 DEFAULT 0,
  combattente_weight int4 DEFAULT 0,
  answer_order int4 NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Indici
CREATE INDEX idx_test_answers_question_id ON test_answers(question_id);
CREATE INDEX idx_test_answers_order ON test_answers(answer_order);
```

### 12. **user_test_responses** - Risposte Utenti al Test

```sql
CREATE TABLE user_test_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  question_id uuid REFERENCES test_questions(id) NOT NULL,
  answer_id uuid REFERENCES test_answers(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, question_id) -- Una risposta per domanda per utente
);

-- Indici
CREATE INDEX idx_user_test_responses_user_id ON user_test_responses(user_id);
CREATE INDEX idx_user_test_responses_question_id ON user_test_responses(question_id);
```

---

## 🔧 Funzioni SQL Critiche

### 1. **add_xp_to_profile** - Gestione XP e Livelli

```sql
CREATE OR REPLACE FUNCTION add_xp_to_profile(
  user_id uuid,
  xp_amount integer
) RETURNS json
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  current_profile profiles%ROWTYPE;
  old_level integer;
  new_level integer;
  level_up boolean := false;
  xp_for_next_level integer;
BEGIN
  -- Recupera il profilo corrente
  SELECT * INTO current_profile
  FROM profiles
  WHERE profiles.user_id = add_xp_to_profile.user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profilo non trovato per user_id: %', user_id;
  END IF;
  
  -- Salva il livello attuale
  old_level := current_profile.current_level;
  
  -- Aggiorna l'XP totale
  UPDATE profiles
  SET 
    total_xp = total_xp + xp_amount,
    updated_at = now()
  WHERE profiles.user_id = add_xp_to_profile.user_id
  RETURNING current_level INTO new_level;
  
  -- Calcola il nuovo livello basato sull'XP totale
  SELECT calculate_level_from_xp(current_profile.total_xp + xp_amount) INTO new_level;
  
  -- Aggiorna il livello se necessario
  IF new_level > old_level THEN
    UPDATE profiles
    SET current_level = new_level
    WHERE profiles.user_id = add_xp_to_profile.user_id;
    
    level_up := true;
  END IF;
  
  -- Registra la transazione XP
  INSERT INTO xp_transactions (user_id, amount, source, description)
  VALUES (
    add_xp_to_profile.user_id,
    xp_amount,
    'task_completion',
    format('XP guadagnati: %s', xp_amount)
  );
  
  -- Calcola XP necessari per il prossimo livello
  SELECT calculate_xp_for_level(new_level + 1) INTO xp_for_next_level;
  
  -- Restituisce il risultato
  RETURN json_build_object(
    'success', true,
    'old_level', old_level,
    'new_level', new_level,
    'level_up', level_up,
    'total_xp', current_profile.total_xp + xp_amount,
    'xp_gained', xp_amount,
    'xp_for_next_level', xp_for_next_level
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
```

### 2. **calculate_xp_for_level** - Calcolo XP per Livello

```sql
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level_num integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  -- Formula progressiva: livello^2 * 100 + (livello-1) * 50
  -- Livello 1: 100 XP
  -- Livello 2: 450 XP (100 + 350)
  -- Livello 3: 950 XP (450 + 500)
  -- etc.
  
  IF level_num <= 1 THEN
    RETURN 100;
  END IF;
  
  RETURN (level_num * level_num * 100) + ((level_num - 1) * 50);
END;
$$;
```

### 3. **calculate_level_from_xp** - Calcolo Livello da XP

```sql
CREATE OR REPLACE FUNCTION calculate_level_from_xp(total_xp integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  level_check integer := 1;
  xp_required integer;
BEGIN
  -- Trova il livello massimo raggiungibile con l'XP corrente
  LOOP
    xp_required := calculate_xp_for_level(level_check + 1);
    
    IF total_xp < xp_required THEN
      EXIT;
    END IF;
    
    level_check := level_check + 1;
    
    -- Limite di sicurezza
    IF level_check > 100 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN level_check;
END;
$$;
```

### 4. **handle_new_user** - Trigger Nuovo Utente

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log dell'errore ma non bloccare la registrazione
    RAISE WARNING 'Errore nella creazione del profilo per %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### 5. **get_user_stats** - Statistiche Utente

```sql
CREATE OR REPLACE FUNCTION get_user_stats(user_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  stats json;
BEGIN
  SELECT json_build_object(
    'total_tasks', COUNT(*),
    'completed_tasks', COUNT(*) FILTER (WHERE completed_at IS NOT NULL),
    'pending_tasks', COUNT(*) FILTER (WHERE completed_at IS NULL AND status = 'pending'),
    'total_xp', COALESCE(SUM(xp_reward) FILTER (WHERE completed_at IS NOT NULL), 0),
    'current_streak', calculate_current_streak(user_id),
    'best_streak', calculate_best_streak(user_id),
    'avg_completion_time', AVG(actual_duration_minutes) FILTER (WHERE actual_duration_minutes IS NOT NULL),
    'most_productive_hour', get_most_productive_hour(user_id),
    'favorite_task_type', get_favorite_task_type(user_id)
  ) INTO stats
  FROM tasks
  WHERE tasks.user_id = get_user_stats.user_id;
  
  RETURN stats;
END;
$$;
```

---

## 🔐 Row Level Security (RLS) Policies

### Template Standard per Tabelle Utente

```sql
-- Abilita RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Policy SELECT
CREATE POLICY "Users can view own records" ON table_name
FOR SELECT USING (auth.uid() = user_id);

-- Policy INSERT
CREATE POLICY "Users can insert own records" ON table_name
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy UPDATE
CREATE POLICY "Users can update own records" ON table_name
FOR UPDATE USING (auth.uid() = user_id);

-- Policy DELETE
CREATE POLICY "Users can delete own records" ON table_name
FOR DELETE USING (auth.uid() = user_id);
```

### Policies Specifiche

#### Profiles
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Solo il sistema può inserire profili (via trigger)
CREATE POLICY "System can insert profiles" ON profiles
FOR INSERT WITH CHECK (true);
```

#### Test Questions/Answers (Lettura Pubblica)
```sql
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read test questions" ON test_questions
FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can read test answers" ON test_answers
FOR SELECT USING (true);
```

#### XP Transactions (Solo Lettura per Utenti)
```sql
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp transactions" ON xp_transactions
FOR SELECT USING (auth.uid() = user_id);

-- Solo il sistema può inserire transazioni XP
CREATE POLICY "System can insert xp transactions" ON xp_transactions
FOR INSERT WITH CHECK (true);
```

---

## 📊 Query Utili per Analytics

### 1. Statistiche Completamento Task
```sql
-- Task completati per giorno negli ultimi 30 giorni
SELECT 
  DATE(completed_at) as completion_date,
  COUNT(*) as tasks_completed,
  SUM(xp_reward) as total_xp_earned
FROM tasks 
WHERE 
  user_id = $1 
  AND completed_at >= NOW() - INTERVAL '30 days'
  AND completed_at IS NOT NULL
GROUP BY DATE(completed_at)
ORDER BY completion_date DESC;
```

### 2. Distribuzione Task per Energia
```sql
-- Distribuzione task per livello di energia richiesta
SELECT 
  energy_required,
  COUNT(*) as total_tasks,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_tasks,
  ROUND(COUNT(*) FILTER (WHERE completed_at IS NOT NULL) * 100.0 / COUNT(*), 2) as completion_rate
FROM tasks 
WHERE user_id = $1
GROUP BY energy_required
ORDER BY 
  CASE energy_required 
    WHEN 'bassa' THEN 1 
    WHEN 'media' THEN 2 
    WHEN 'alta' THEN 3 
  END;
```

### 3. Andamento Umore
```sql
-- Andamento umore negli ultimi 30 giorni
SELECT 
  date,
  mood,
  energy_level,
  LAG(mood) OVER (ORDER BY date) as previous_mood
FROM daily_moods 
WHERE 
  user_id = $1 
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### 4. Performance Routine
```sql
-- Performance delle routine attive
SELECT 
  r.name,
  r.category,
  r.streak_count,
  r.best_streak,
  r.total_completions,
  ROUND(r.total_completions * 100.0 / 
    GREATEST(DATE_PART('day', NOW() - r.created_at), 1), 2) as completion_rate
FROM routines r
WHERE 
  r.user_id = $1 
  AND r.is_active = true
ORDER BY r.streak_count DESC;
```

### 5. XP Trends
```sql
-- Trend XP negli ultimi 7 giorni
SELECT 
  DATE(created_at) as date,
  SUM(amount) as daily_xp,
  COUNT(*) as transactions_count,
  AVG(amount) as avg_xp_per_transaction
FROM xp_transactions 
WHERE 
  user_id = $1 
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🔧 Manutenzione Database

### Backup e Restore
```sql
-- Backup completo utente
CREATE OR REPLACE FUNCTION backup_user_data(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  backup_data json;
BEGIN
  SELECT json_build_object(
    'profile', (SELECT row_to_json(p) FROM profiles p WHERE p.user_id = target_user_id),
    'tasks', (SELECT json_agg(row_to_json(t)) FROM tasks t WHERE t.user_id = target_user_id),
    'projects', (SELECT json_agg(row_to_json(pr)) FROM projects pr WHERE pr.user_id = target_user_id),
    'routines', (SELECT json_agg(row_to_json(r)) FROM routines r WHERE r.user_id = target_user_id),
    'mental_inbox', (SELECT json_agg(row_to_json(mi)) FROM mental_inbox mi WHERE mi.user_id = target_user_id),
    'daily_moods', (SELECT json_agg(row_to_json(dm)) FROM daily_moods dm WHERE dm.user_id = target_user_id),
    'xp_transactions', (SELECT json_agg(row_to_json(xt)) FROM xp_transactions xt WHERE xt.user_id = target_user_id),
    'test_responses', (SELECT json_agg(row_to_json(tr)) FROM user_test_responses tr WHERE tr.user_id = target_user_id)
  ) INTO backup_data;
  
  RETURN backup_data;
END;
$$;
```

### Pulizia Dati
```sql
-- Pulizia task completati oltre 1 anno fa
DELETE FROM tasks 
WHERE 
  completed_at < NOW() - INTERVAL '1 year'
  AND status = 'completed';

-- Pulizia mental inbox processati oltre 6 mesi fa
DELETE FROM mental_inbox 
WHERE 
  is_processed = true 
  AND processed_at < NOW() - INTERVAL '6 months';

-- Pulizia daily moods oltre 2 anni fa
DELETE FROM daily_moods 
WHERE date < CURRENT_DATE - INTERVAL '2 years';
```

### Ottimizzazione Performance
```sql
-- Analisi performance query
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Rebuild indici se necessario
REINDEX TABLE tasks;
REINDEX TABLE xp_transactions;

-- Aggiorna statistiche tabelle
ANALYZE;
```

---

## 🚨 Troubleshooting

### Query Diagnostiche

```sql
-- Verifica funzioni esistenti
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Verifica policies RLS
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verifica trigger
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Controllo integrità referenziale
SELECT 
  conname,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint 
WHERE contype = 'f'
ORDER BY table_name;
```

---

**📝 Nota**: Questo riferimento database è aggiornato al 21 gennaio 2025 e include tutte le modifiche post-risoluzione del bug `add_xp_to_profile`. Mantenere sincronizzato con ogni modifica dello schema.