---
status: Golden
updated: 2025-01-21
owner: fra
---
# 🏗️ ARCHITECTURE REFERENCE - Tsunami Application

**Versione Database**: 2.0  
**Data Aggiornamento**: 2025-01-21  
**DBMS**: PostgreSQL (Supabase)  

---

## 🔧 Tipi Custom (ENUM)

```sql
CREATE TYPE archetype_type AS ENUM (
  'visionario', 'costruttore', 'sognatore', 'silenzioso', 'combattente'
);

CREATE TYPE energy_level AS ENUM (
  'bassa', 'media', 'alta', 'molto_bassa', 'molto_alta'
);

CREATE TYPE task_type AS ENUM (
  'azione', 'riflessione', 'comunicazione', 'creativita', 'organizzazione'
);

CREATE TYPE daily_mood AS ENUM (
  'congelato', 'disorientato', 'in_flusso', 'ispirato'
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
  recurrence_pattern text,
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
```

### 3. **xp_transactions** - Tracking XP

```sql
CREATE TABLE xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  amount int4 NOT NULL,
  source text NOT NULL CHECK (length(source) > 0),
  source_id uuid,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
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
  priority_score int4 DEFAULT 0,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
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
  UNIQUE(user_id, date)
);
```

### 6. **projects** - Gestione Progetti

```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL CHECK (length(name) > 0),
  description text,
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## 🔐 Row Level Security (RLS)

### Policies Principali
- **SELECT**: `auth.uid() = user_id`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id`

### Policies Speciali
- **test_questions/answers**: Lettura pubblica, scrittura privata
- **xp_transactions**: SELECT utente, INSERT sistema
- **archetype_levels**: Lettura pubblica

### Totale Policies: 23 attive
Tutte le tabelle sensibili hanno `rowsecurity = true`

---

## 📊 Riepilogo Statistiche

- **16 tabelle principali** dettagliate
- **3 funzioni SQL** visibili (1 MANCANTE: add_xp_to_profile)
- **Trigger attivi** su 7 tabelle per updated_at
- **23 policies RLS** basate su auth.uid() = user_id
- **4 tipi ENUM** custom per business logic

---

## 🚨 AZIONE RICHIESTA

**È necessario creare la funzione `add_xp_to_profile` mancante per risolvere l'errore 404 nell'assegnazione XP.**

---

**📝 Ultima modifica**: 21 Gennaio 2025  
**✅ Versione**: 2.0  
**🎯 Stato**: Golden - Pronto per l'uso

---

*Questo documento è parte della documentazione ufficiale del progetto Tsunami ADHD App.*