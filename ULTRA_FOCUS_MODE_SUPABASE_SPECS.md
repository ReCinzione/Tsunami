# Ultra Focus Mode - Specifiche Supabase

## Panoramica
Questo documento fornisce le specifiche complete per il supporto del sistema Ultra Focus Mode in Supabase, incluse le query ottimizzate per le subtask e le funzioni di supporto.

## Schema Database

### Tabella Tasks
La tabella `tasks` supporta già le subtask tramite il campo `parent_task_id`:

```sql
-- Struttura esistente con supporto subtask
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  energy_required energy_level NOT NULL DEFAULT 'media',
  task_type task_type NOT NULL DEFAULT 'personale',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  postponed_count INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 10,
  status TEXT DEFAULT 'pending',
  google_calendar_event_id TEXT,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE, -- Supporto subtask
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}'
);
```

### Indici per Performance
```sql
-- Indice per query subtask (già esistente)
CREATE INDEX idx_tasks_parent_task_id ON public.tasks(parent_task_id);

-- Indici aggiuntivi per Ultra Focus Mode
CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX idx_tasks_user_due_date ON public.tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_user_energy ON public.tasks(user_id, energy_required);
```

## Query Ottimizzate per Ultra Focus Mode

### 1. Recuperare Task con Subtask per Ultra Focus
```sql
-- Query per ottenere una task con tutte le sue subtask e statistiche
CREATE OR REPLACE FUNCTION get_ultra_focus_task(task_id UUID, requesting_user_id UUID)
RETURNS TABLE (
  -- Task principale
  id UUID,
  title TEXT,
  description TEXT,
  energy_required energy_level,
  task_type task_type,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  xp_reward INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  
  -- Statistiche subtask
  total_subtasks INTEGER,
  completed_subtasks INTEGER,
  progress_percentage NUMERIC,
  
  -- Subtask (JSON array)
  subtasks JSONB
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH task_data AS (
    SELECT t.*
    FROM tasks t
    WHERE t.id = task_id 
      AND t.user_id = requesting_user_id
  ),
  subtask_stats AS (
    SELECT 
      COUNT(*) as total_subtasks,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_subtasks,
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*)), 2)
      END as progress_percentage
    FROM tasks 
    WHERE parent_task_id = task_id
  ),
  subtask_list AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'title', title,
          'description', description,
          'status', status,
          'energy_required', energy_required,
          'due_date', due_date,
          'created_at', created_at,
          'completed_at', completed_at
        ) ORDER BY created_at
      ), 
      '[]'::jsonb
    ) as subtasks
    FROM tasks 
    WHERE parent_task_id = task_id
  )
  SELECT 
    td.id,
    td.title,
    td.description,
    td.energy_required,
    td.task_type,
    td.due_date,
    td.status,
    td.xp_reward,
    td.created_at,
    COALESCE(ss.total_subtasks, 0)::INTEGER,
    COALESCE(ss.completed_subtasks, 0)::INTEGER,
    COALESCE(ss.progress_percentage, 0),
    sl.subtasks
  FROM task_data td
  CROSS JOIN subtask_stats ss
  CROSS JOIN subtask_list sl;
$$;
```

### 2. Creare Subtask Ottimizzata
```sql
-- Funzione per creare subtask con validazione
CREATE OR REPLACE FUNCTION create_subtask(
  parent_id UUID,
  subtask_title TEXT,
  subtask_description TEXT DEFAULT '',
  subtask_energy energy_level DEFAULT 'bassa',
  subtask_due_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  requesting_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_subtask_id UUID;
  parent_task_exists BOOLEAN;
BEGIN
  -- Verifica che la task padre esista e appartenga all'utente
  SELECT EXISTS(
    SELECT 1 FROM tasks 
    WHERE id = parent_id 
      AND user_id = requesting_user_id
  ) INTO parent_task_exists;
  
  IF NOT parent_task_exists THEN
    RAISE EXCEPTION 'Task padre non trovata o non autorizzata';
  END IF;
  
  -- Crea la subtask
  INSERT INTO tasks (
    user_id,
    title,
    description,
    energy_required,
    task_type,
    due_date,
    parent_task_id,
    xp_reward
  ) VALUES (
    requesting_user_id,
    subtask_title,
    subtask_description,
    subtask_energy,
    (SELECT task_type FROM tasks WHERE id = parent_id),
    subtask_due_date,
    parent_id,
    5 -- XP ridotto per subtask
  )
  RETURNING id INTO new_subtask_id;
  
  RETURN new_subtask_id;
END;
$$;
```

### 3. Aggiornare Progresso Task Principale
```sql
-- Trigger per aggiornare automaticamente il progresso della task principale
CREATE OR REPLACE FUNCTION update_parent_task_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se è una subtask (ha parent_task_id)
  IF NEW.parent_task_id IS NOT NULL THEN
    -- Aggiorna il timestamp della task principale quando una subtask cambia
    UPDATE tasks 
    SET updated_at = NOW()
    WHERE id = NEW.parent_task_id;
    
    -- Se tutte le subtask sono completate, suggerisci il completamento della task principale
    -- (questo potrebbe essere gestito lato client per dare controllo all'utente)
  END IF;
  
  RETURN NEW;
END;
$$;

-- Applica il trigger
DROP TRIGGER IF EXISTS trigger_update_parent_progress ON tasks;
CREATE TRIGGER trigger_update_parent_progress
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_task_progress();
```

### 4. Query per Statistiche Ultra Focus
```sql
-- Funzione per ottenere statistiche della sessione Ultra Focus
CREATE OR REPLACE FUNCTION get_ultra_focus_stats(
  user_id_param UUID,
  date_from TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '30 days'),
  date_to TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_focus_sessions INTEGER,
  total_focus_time_minutes INTEGER,
  tasks_completed_in_focus INTEGER,
  subtasks_completed_in_focus INTEGER,
  average_session_duration NUMERIC,
  most_productive_hour INTEGER
)
LANGUAGE sql
AS $$
  -- Nota: Questa query assume che si tenga traccia delle sessioni focus
  -- Per ora restituisce statistiche basate sui completamenti delle task
  SELECT 
    COUNT(DISTINCT DATE(completed_at))::INTEGER as total_focus_sessions,
    0::INTEGER as total_focus_time_minutes, -- Da implementare con tracking sessioni
    COUNT(CASE WHEN parent_task_id IS NULL THEN 1 END)::INTEGER as tasks_completed_in_focus,
    COUNT(CASE WHEN parent_task_id IS NOT NULL THEN 1 END)::INTEGER as subtasks_completed_in_focus,
    0::NUMERIC as average_session_duration, -- Da implementare
    EXTRACT(HOUR FROM completed_at)::INTEGER as most_productive_hour
  FROM tasks
  WHERE user_id = user_id_param
    AND completed_at BETWEEN date_from AND date_to
    AND status = 'completed';
$$;
```

### 5. Query per Suggerimenti Task Ultra Focus
```sql
-- Funzione per suggerire task ottimali per Ultra Focus Mode
CREATE OR REPLACE FUNCTION suggest_ultra_focus_tasks(
  user_id_param UUID,
  energy_level_param energy_level DEFAULT 'media',
  limit_param INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  energy_required energy_level,
  task_type task_type,
  due_date TIMESTAMP WITH TIME ZONE,
  subtask_count INTEGER,
  urgency_score NUMERIC
)
LANGUAGE sql
AS $$
  WITH task_scores AS (
    SELECT 
      t.*,
      COALESCE(st.subtask_count, 0) as subtask_count,
      -- Calcola punteggio urgenza basato su scadenza e energia
      CASE 
        WHEN t.due_date IS NULL THEN 1
        WHEN t.due_date < NOW() THEN 10 -- Scaduta
        WHEN t.due_date < NOW() + INTERVAL '1 day' THEN 8 -- Scade oggi
        WHEN t.due_date < NOW() + INTERVAL '3 days' THEN 6 -- Scade presto
        WHEN t.due_date < NOW() + INTERVAL '7 days' THEN 4 -- Scade questa settimana
        ELSE 2
      END +
      CASE t.energy_required
        WHEN 'bassa' THEN 1
        WHEN 'media' THEN 2
        WHEN 'alta' THEN 3
      END as urgency_score
    FROM tasks t
    LEFT JOIN (
      SELECT 
        parent_task_id,
        COUNT(*) as subtask_count
      FROM tasks 
      WHERE parent_task_id IS NOT NULL
      GROUP BY parent_task_id
    ) st ON t.id = st.parent_task_id
    WHERE t.user_id = user_id_param
      AND t.status = 'pending'
      AND t.parent_task_id IS NULL -- Solo task principali
      AND (energy_level_param IS NULL OR t.energy_required = energy_level_param)
  )
  SELECT 
    ts.id,
    ts.title,
    ts.description,
    ts.energy_required,
    ts.task_type,
    ts.due_date,
    ts.subtask_count,
    ts.urgency_score
  FROM task_scores ts
  ORDER BY ts.urgency_score DESC, ts.created_at ASC
  LIMIT limit_param;
$$;
```

## Politiche RLS (Row Level Security)

Le politiche RLS esistenti già coprono l'accesso alle subtask, ma ecco le specifiche:

```sql
-- Politiche per accesso sicuro alle task e subtask
CREATE POLICY "Users can access their tasks and subtasks" ON public.tasks
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() = (SELECT user_id FROM tasks WHERE id = parent_task_id)
  );
```

## Query di Esempio per l'Applicazione

### Avviare Ultra Focus Mode
```typescript
// TypeScript/JavaScript per l'app
const startUltraFocusMode = async (taskId: string) => {
  const { data, error } = await supabase
    .rpc('get_ultra_focus_task', {
      task_id: taskId,
      requesting_user_id: user.id
    });
    
  if (error) throw error;
  return data[0];
};
```

### Creare Subtask durante Ultra Focus
```typescript
const createSubtaskInFocus = async (parentId: string, title: string, description?: string) => {
  const { data, error } = await supabase
    .rpc('create_subtask', {
      parent_id: parentId,
      subtask_title: title,
      subtask_description: description || ''
    });
    
  if (error) throw error;
  return data;
};
```

### Ottenere Suggerimenti per Ultra Focus
```typescript
const getUltraFocusSuggestions = async (energyLevel?: string) => {
  const { data, error } = await supabase
    .rpc('suggest_ultra_focus_tasks', {
      user_id_param: user.id,
      energy_level_param: energyLevel,
      limit_param: 5
    });
    
  if (error) throw error;
  return data;
};
```

## Ottimizzazioni Performance

### 1. Indici Compositi
```sql
-- Indice per query frequenti in Ultra Focus Mode
CREATE INDEX idx_tasks_user_status_parent ON public.tasks(user_id, status, parent_task_id);
CREATE INDEX idx_tasks_parent_status ON public.tasks(parent_task_id, status) WHERE parent_task_id IS NOT NULL;
```

### 2. Materialized View per Statistiche (Opzionale)
```sql
-- Vista materializzata per statistiche veloci (da aggiornare periodicamente)
CREATE MATERIALIZED VIEW task_statistics AS
SELECT 
  user_id,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN parent_task_id IS NOT NULL THEN 1 END) as total_subtasks,
  AVG(CASE WHEN completed_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (completed_at - created_at))/3600 
  END) as avg_completion_hours
FROM tasks
GROUP BY user_id;

-- Indice sulla vista materializzata
CREATE UNIQUE INDEX idx_task_stats_user ON task_statistics(user_id);
```

## Monitoraggio e Logging

### Query per Monitorare Performance
```sql
-- Query per identificare task con molte subtask (potenziali problemi di performance)
SELECT 
  t.id,
  t.title,
  COUNT(st.id) as subtask_count
FROM tasks t
LEFT JOIN tasks st ON st.parent_task_id = t.id
WHERE t.parent_task_id IS NULL
GROUP BY t.id, t.title
HAVING COUNT(st.id) > 20
ORDER BY subtask_count DESC;
```

## Note di Implementazione

1. **Gestione Transazioni**: Tutte le operazioni che coinvolgono task e subtask dovrebbero essere eseguite in transazioni per garantire consistenza.

2. **Caching**: Considera l'implementazione di caching lato client per le statistiche delle subtask per ridurre le query al database.

3. **Paginazione**: Per task con molte subtask, implementa la paginazione nelle query.

4. **Backup**: Le subtask sono collegate tramite foreign key con CASCADE DELETE, quindi la cancellazione di una task principale eliminerà automaticamente tutte le subtask.

5. **Validazione**: Implementa validazione lato client e server per prevenire cicli nelle relazioni parent-child.

## Migrazione Esistente

Il sistema è già configurato con la migrazione `20250101000000_add_parent_task_support.sql`. Non sono necessarie ulteriori migrazioni per supportare l'Ultra Focus Mode.