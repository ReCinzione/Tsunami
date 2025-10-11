# Database Schema Reference - Tsunami ADHD App

## 📦 Schema Completo delle Tabelle

### Tabelle Principali

1. **archetype_levels** - Livelli degli archetipi con dettagli
2. **daily_moods** - Tracciamento dell'umore giornaliero
3. **imaginal_objects** - Oggetti immaginali sbloccati dagli utenti
4. **mental_inbox** - Inbox mentale per pensieri e idee
5. **profiles** - Profili utente con archetipi e XP
6. **projects** - Progetti degli utenti
7. **routine_goals** - Obiettivi delle routine
8. **routine_items** - Elementi delle routine
9. **routines** - Routine degli utenti
10. **task_interventions** - Interventi sulle task
11. **tasks** - Task principali del sistema
12. **test_answers** - Risposte del test degli archetipi
13. **test_questions** - Domande del test degli archetipi
14. **traces** - Tracce di progresso (valorizza il processo)
15. **user_test_responses** - Risposte degli utenti ai test
16. **xp_transactions** - Transazioni XP per tracking

### Schema Dettagliato Tabella `tasks`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | |
| title | text | NO | |
| description | text | YES | |
| energy_required | energy_level | YES | 'media' |
| task_type | task_type | YES | 'azione' |
| is_recurring | boolean | YES | false |
| recurrence_pattern | text | YES | |
| due_date | timestamptz | YES | |
| completed_at | timestamptz | YES | |
| postponed_count | int4 | YES | 0 |
| xp_reward | int4 | YES | 10 |
| status | text | YES | 'pending' |
| google_calendar_event_id | text | YES | |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| tags | text[] | YES | |

### Schema Dettagliato Tabella `profiles`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | |
| display_name | text | YES | |
| avatar_url | text | YES | |
| dominant_archetype | archetype_type | YES | |
| visionario_percentage | int4 | YES | 0 |
| costruttore_percentage | int4 | YES | 0 |
| sognatore_percentage | int4 | YES | 0 |
| silenzioso_percentage | int4 | YES | 0 |
| combattente_percentage | int4 | YES | 0 |
| current_level | int4 | YES | 1 |
| total_xp | int4 | YES | 0 |
| test_completed | boolean | YES | false |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

### Schema Dettagliato Tabella `xp_transactions`

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO | |
| amount | int4 | NO | |
| source | text | NO | |
| source_id | uuid | YES | |
| description | text | YES | |
| created_at | timestamptz | NO | now() |

## 💡 Funzioni SQL Esistenti

### 1. `calculate_xp_for_level(level_num integer) returns integer`
- **Scopo**: Calcola il totale di XP necessario per ciascun livello
- **Logica**: Progressione semi-logaritmica custom
- **Livelli**: Da 1 a 10 con XP crescente

### 2. `handle_new_user() returns trigger`
- **Scopo**: Trigger per creazione automatica profilo
- **Attivazione**: AFTER INSERT su auth.users
- **Azione**: Crea record in tabella profiles

### 3. `update_updated_at_column() returns trigger`
- **Scopo**: Aggiorna automaticamente il campo updated_at
- **Attivazione**: BEFORE UPDATE su varie tabelle
- **Azione**: Imposta updated_at = now()

## ⚠️ PROBLEMA IDENTIFICATO: Funzione `add_xp_to_profile` MANCANTE

**Il codice chiama una funzione che NON ESISTE nel database:**
```sql
supabase.rpc('add_xp_to_profile', { user_id, xp_amount })
```

**Questa funzione dovrebbe:**
1. Aggiornare `profiles.total_xp`
2. Ricalcolare `profiles.current_level`
3. Creare record in `xp_transactions`
4. Gestire atomicamente le transazioni

## ⚡ Trigger Attivi

### Trigger `update_updated_at_column`
Attivo su tutte le tabelle con campo `updated_at`:
- profiles
- projects
- routine_goals
- routine_items
- routines
- task_interventions
- tasks

**Esempio:**
```sql
TRIGGER update_tasks_updated_at 
BEFORE UPDATE ON tasks 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();
```

## 🛡️ Policies RLS (Row Level Security)

### Pattern Standard per Tabelle Utente
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

## 📊 Riepilogo Statistiche

- **16 tabelle principali** dettagliate
- **3 funzioni SQL** visibili (1 MANCANTE: add_xp_to_profile)
- **Trigger attivi** su 7 tabelle per updated_at
- **23 policies RLS** basate su auth.uid() = user_id
- **4 tipi ENUM** custom per business logic

## 🚨 AZIONE RICHIESTA

**È necessario creare la funzione `add_xp_to_profile` mancante per risolvere l'errore 404 nell'assegnazione XP.**