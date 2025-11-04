---
status: Draft
updated: 2025-10-31
owner: fra
source_path: DATABASE_MODIFICATIONS_TODO.md
cues: "todo"
---
# 🗄️ DATABASE MODIFICATIONS TODO

## Modifiche al Database per Funzionalità Progetti e Rielaborazione Testi

### 1. 🔗 **Relazione Task → Progetti**

```sql
-- Aggiungere colonna project_id alla tabella tasks
ALTER TABLE tasks ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Creare indice per performance
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
```

### 2. 📊 **Metadati Progetti**

```sql
-- Aggiungere colonne per statistiche automatiche
ALTER TABLE projects ADD COLUMN task_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN completion_percentage DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE projects ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE projects ADD COLUMN project_type TEXT DEFAULT 'general';
ALTER TABLE projects ADD COLUMN tags TEXT[];
```

### 3. 🧠 **Tabella Mental Inbox Enhancement**

```sql
-- Aggiungere colonne per analisi semantica
ALTER TABLE mental_inbox ADD COLUMN keywords TEXT[];
ALTER TABLE mental_inbox ADD COLUMN suggested_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE mental_inbox ADD COLUMN processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'analyzed', 'converted', 'archived'));
ALTER TABLE mental_inbox ADD COLUMN extracted_actions TEXT[];
```

### 4. 📝 **Nuova Tabella: Text Processing History**

```sql
-- Tabella per tracciare le rielaborazioni di testo
CREATE TABLE public.text_processing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  processed_text TEXT NOT NULL,
  processing_type TEXT NOT NULL CHECK (processing_type IN ('simplify', 'extract_actions', 'reorganize', 'summarize', 'categorize')),
  source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual', 'mental_inbox', 'task', 'project')),
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.text_processing_history ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their text processing history" 
ON public.text_processing_history 
FOR ALL
USING (auth.uid() = user_id);
```

### 5. 🎯 **Nuova Tabella: Project Suggestions**

```sql
-- Tabella per suggerimenti di progetti generati dall'AI
CREATE TABLE public.project_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggested_name TEXT NOT NULL,
  suggested_description TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  based_on_tasks UUID[] DEFAULT '{}',
  based_on_notes UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'modified')),
  created_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.project_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their project suggestions" 
ON public.project_suggestions 
FOR ALL
USING (auth.uid() = user_id);
```

### 6. 🔄 **Trigger per Aggiornamenti Automatici**

```sql
-- Trigger per aggiornare statistiche progetti quando cambiano i task
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna il progetto del task modificato/creato
  IF NEW.project_id IS NOT NULL THEN
    UPDATE projects 
    SET 
      task_count = (SELECT COUNT(*) FROM tasks WHERE project_id = NEW.project_id),
      completion_percentage = (
        SELECT COALESCE(
          (COUNT(*) FILTER (WHERE status = 'completato') * 100.0 / NULLIF(COUNT(*), 0)), 
          0
        )
        FROM tasks WHERE project_id = NEW.project_id
      ),
      last_activity = now()
    WHERE id = NEW.project_id;
  END IF;
  
  -- Se il task è stato spostato da un altro progetto
  IF TG_OP = 'UPDATE' AND OLD.project_id IS NOT NULL AND OLD.project_id != NEW.project_id THEN
    UPDATE projects 
    SET 
      task_count = (SELECT COUNT(*) FROM tasks WHERE project_id = OLD.project_id),
      completion_percentage = (
        SELECT COALESCE(
          (COUNT(*) FILTER (WHERE status = 'completato') * 100.0 / NULLIF(COUNT(*), 0)), 
          0
        )
        FROM tasks WHERE project_id = OLD.project_id
      )
    WHERE id = OLD.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applicare il trigger
CREATE TRIGGER update_project_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_stats();
```

### 7. 📋 **Viste per Query Ottimizzate**

```sql
-- Vista per progetti con statistiche
CREATE VIEW projects_with_stats AS
SELECT 
  p.*,
  COALESCE(t.task_count, 0) as actual_task_count,
  COALESCE(t.completed_tasks, 0) as completed_tasks,
  COALESCE(t.pending_tasks, 0) as pending_tasks,
  CASE 
    WHEN COALESCE(t.task_count, 0) = 0 THEN 0
    ELSE ROUND((t.completed_tasks * 100.0 / t.task_count), 2)
  END as actual_completion_percentage
FROM projects p
LEFT JOIN (
  SELECT 
    project_id,
    COUNT(*) as task_count,
    COUNT(*) FILTER (WHERE status = 'completato') as completed_tasks,
    COUNT(*) FILTER (WHERE status != 'completato') as pending_tasks
  FROM tasks 
  GROUP BY project_id
) t ON p.id = t.project_id;

-- Vista per note con suggerimenti progetti
CREATE VIEW mental_inbox_with_suggestions AS
SELECT 
  mi.*,
  p.title as suggested_project_name,
  p.description as suggested_project_description
FROM mental_inbox mi
LEFT JOIN projects p ON mi.suggested_project_id = p.id;
```

### 8. 🔍 **Indici per Performance**

```sql
-- Indici per migliorare le performance delle query
CREATE INDEX idx_mental_inbox_processing_status ON mental_inbox(processing_status);
CREATE INDEX idx_mental_inbox_user_created ON mental_inbox(user_id, created_at DESC);
CREATE INDEX idx_text_processing_user_type ON text_processing_history(user_id, processing_type);
CREATE INDEX idx_project_suggestions_user_status ON project_suggestions(user_id, status);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
```

### 9. 🛡️ **Funzioni di Sicurezza**

```sql
-- Funzione per verificare che l'utente possa accedere al progetto
CREATE OR REPLACE FUNCTION user_can_access_project(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 10. 📊 **Dati di Test (Opzionale)**

```sql
-- Inserire alcuni progetti di esempio per testing
-- NOTA: Eseguire solo in ambiente di sviluppo
/*
INSERT INTO projects (user_id, title, description, status, project_type, tags) VALUES
(auth.uid(), 'Sviluppo App', 'Progetto principale di sviluppo applicazione', 'in_progress', 'development', ARRAY['coding', 'react', 'typescript']),
(auth.uid(), 'Fitness 2024', 'Obiettivi di salute e benessere', 'idea', 'personal', ARRAY['health', 'exercise', 'wellness']),
(auth.uid(), 'Casa e Organizzazione', 'Miglioramenti domestici e organizzazione', 'idea', 'home', ARRAY['organization', 'home', 'productivity']);
*/
```

---

## ✅ **Checklist Implementazione**

### Database (DA FARE)
- [ ] 1. Aggiungere relazione task → progetti
- [ ] 2. Estendere tabella progetti con metadati
- [ ] 3. Migliorare tabella mental_inbox
- [ ] 4. Creare tabella text_processing_history
- [ ] 5. Creare tabella project_suggestions
- [ ] 6. Implementare trigger per aggiornamenti automatici
- [ ] 7. Creare viste ottimizzate
- [ ] 8. Aggiungere indici per performance
- [ ] 9. Implementare funzioni di sicurezza
- [ ] 10. Testare tutte le modifiche

### Codice (GIÀ IMPLEMENTATO ✅)
- [x] Aggiunto database risposte per riorganizzazione progetti
- [x] Aggiunto database risposte per rielaborazione testi
- [x] Implementati pattern di intent per nuovi comandi
- [x] Aggiunta funzione `analyzeProjectOpportunities`
- [x] Aggiunta funzione `extractCommonKeywords`
- [x] Aggiunta funzione `analyzeMentalInboxForProjects`
- [x] Aggiunta funzione `extractActionsFromText`
- [x] Aggiunta funzione `simplifyTextForADHD`
- [x] Integrazione con sistema di insights proattivi
- [x] Gestione comandi di rielaborazione testi
- [x] Migliorato context awareness
- [x] Aumentato limite insights da 2 a 3

### File Creati
- [x] `CHATBOT_USAGE_EXAMPLES.md` - Esempi pratici di utilizzo
- [x] `DATABASE_MODIFICATIONS_TODO.md` - Questo file

---

## 🚀 **Note Implementazione**

1. **Ordine di esecuzione**: Seguire l'ordine numerato per evitare errori di dipendenze
2. **Backup**: Fare sempre backup prima di modifiche strutturali
3. **Testing**: Testare ogni modifica in ambiente di sviluppo
4. **Performance**: Monitorare le performance dopo l'aggiunta degli indici
5. **RLS**: Verificare che le policy RLS funzionino correttamente

**Nota**: Il chatbot è già completamente funzionale con le nuove capacità! Dopo aver completato le modifiche al database, avrà accesso anche ai dati storici per analisi ancora più precise. 🎉