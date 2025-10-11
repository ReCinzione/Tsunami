# 📚 Documentazione Completa Applicazione Tsunami

**Versione**: 2.0  
**Data Aggiornamento**: 2025-01-21  
**Stato**: Funzionale e Operativa  

---

## 🎯 Panoramica dell'Applicazione

**Tsunami** è un'applicazione web per la gestione della produttività personale ottimizzata per persone con ADHD. L'app utilizza un sistema di gamificazione basato su archetipi di personalità per personalizzare l'esperienza utente e migliorare l'engagement.

### 🏗️ Architettura Tecnica

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query + Zustand
- **Routing**: React Router

---

## 🗄️ Schema Database e Tabelle

### 📊 Tabelle Principali

#### 1. **profiles** - Profili Utente
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  display_name text,
  avatar_url text,
  dominant_archetype archetype_type,
  visionario_percentage int4 DEFAULT 0,
  costruttore_percentage int4 DEFAULT 0,
  sognatore_percentage int4 DEFAULT 0,
  silenzioso_percentage int4 DEFAULT 0,
  combattente_percentage int4 DEFAULT 0,
  current_level int4 DEFAULT 1,
  total_xp int4 DEFAULT 0,
  test_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 2. **tasks** - Gestione Attività
```sql
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  description text,
  energy_required energy_level DEFAULT 'media',
  task_type task_type DEFAULT 'azione',
  is_recurring boolean DEFAULT false,
  recurrence_pattern text,
  due_date timestamptz,
  completed_at timestamptz,
  postponed_count int4 DEFAULT 0,
  xp_reward int4 DEFAULT 10,
  status text DEFAULT 'pending',
  google_calendar_event_id text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 3. **xp_transactions** - Tracking XP
```sql
CREATE TABLE xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  amount int4 NOT NULL,
  source text NOT NULL,
  source_id uuid,
  description text,
  created_at timestamptz DEFAULT now()
);
```

#### 4. **mental_inbox** - Inbox Mentale
```sql
CREATE TABLE mental_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  content text NOT NULL,
  content_type text DEFAULT 'text',
  is_processed boolean DEFAULT false,
  converted_to_task boolean DEFAULT false,
  task_id uuid REFERENCES tasks(id),
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
```

#### 5. **daily_moods** - Tracciamento Umore
```sql
CREATE TABLE daily_moods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  mood daily_mood NOT NULL,
  suggested_ritual text,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

#### 6. **projects** - Gestione Progetti
```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'idea',
  energy_required energy_level DEFAULT 'media',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 7. **routines** - Sistema Routine
```sql
CREATE TABLE routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  start_time time,
  end_time time,
  days_of_week text[],
  day_of_month int4,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 🔧 Funzioni SQL Critiche

#### 1. **add_xp_to_profile** - Gestione XP
```sql
CREATE OR REPLACE FUNCTION add_xp_to_profile(
  user_id uuid,
  xp_amount integer
) RETURNS json
```
**Funzionalità**:
- Aggiorna `profiles.total_xp`
- Ricalcola `profiles.current_level` usando `calculate_xp_for_level`
- Crea record in `xp_transactions`
- Rileva level up automaticamente
- Gestione errori atomica

#### 2. **calculate_xp_for_level** - Calcolo Livelli
```sql
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level_num integer) RETURNS integer
```
**Logica**: Progressione semi-logaritmica per livelli 1-10

#### 3. **handle_new_user** - Creazione Profilo
```sql
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger
```
**Trigger**: Crea automaticamente profilo su registrazione utente

---

## 🎮 Funzionalità dell'Applicazione

### 🏠 Dashboard Principale (`Index.tsx`)

**Componenti Principali**:
- **Header con Profilo**: Mostra livello, XP, tipo di personalità
- **Mood Tracker**: Selezione umore giornaliero con rituali suggeriti
- **Focus Mode**: Modalità concentrazione con limite task visibili
- **Quick Stats**: Statistiche rapide (livello, XP, tipo dominante)
- **Navigation Tabs**: Casa, Attività, Note, Routine

**Flusso di Autenticazione**:
1. `AuthPage` → Login/Registrazione
2. `ArchetypeTest` → Test personalità (se non completato)
3. `DailyMoodSelector` → Selezione umore (se non fatto oggi)
4. Dashboard principale

### 📋 Sistema Task Management

**Componente**: `TaskManager.tsx`  
**Tabelle**: `tasks`, `xp_transactions`, `profiles`

**Funzionalità**:
- ✅ **Creazione Task**: Titolo, descrizione, energia richiesta, tipo, XP reward
- 🎯 **Completamento**: Assegnazione XP automatica via `add_xp_to_profile`
- 🔄 **Task Ricorrenti**: Pattern di ricorrenza personalizzabili
- 🏷️ **Tag System**: Categorizzazione con array di tag
- 📊 **Statistiche**: Task completati, attivi, streak, XP totali
- 🎮 **Gamificazione**: Ricompense XP, level up, achievement

**Integrazione Google Calendar**:
- Campo `google_calendar_event_id` per sincronizzazione
- Gestione eventi esterni

### 🧠 Mental Inbox System

**Componente**: `MentalInbox.tsx`  
**Tabella**: `mental_inbox`

**Funzionalità**:
- 📝 **Cattura Rapida**: Input veloce di idee e pensieri
- 🔄 **Conversione Task**: Trasformazione automatica note → task
- 🏷️ **Categorizzazione**: Analisi intelligente del contenuto
- 📷 **OCR Integration**: Estrazione testo da immagini
- ✅ **Processamento**: Marcatura note come elaborate

**Analisi Intelligente**:
- Rilevamento parole chiave per suggerimenti
- Categorizzazione automatica per tipo di contenuto
- Suggerimenti di conversione in task

### 🎭 Sistema Archetipi

**Componente**: `ArchetypeTest.tsx`  
**Tabelle**: `test_questions`, `test_answers`, `user_test_responses`, `profiles`

**Archetipi Disponibili**:
1. **🔮 Visionario**: Traccia mappe simboliche, visioni future
2. **🏗️ Costruttore**: Azione concreta, trasformazione step-by-step
3. **🌙 Sognatore**: Mondo interiore, bellezza, immaginazione
4. **🤫 Silenzioso**: Osservazione, ascolto, presenza sottile
5. **⚔️ Combattente**: Sfide, energia, determinazione

**Personalizzazione**:
- Test di 20+ domande con risposte multiple
- Calcolo percentuali per ogni archetipo
- Determinazione tipo dominante
- Adattamento UI e suggerimenti basati su personalità

### 💡 Sistema Progetti

**Componente**: `ProjectManager.tsx`  
**Tabella**: `projects`

**Stati Progetto**:
- 💡 **Idea**: Concetto iniziale
- 🚀 **In Corso**: Sviluppo attivo
- ⏸️ **In Pausa**: Temporaneamente sospeso
- ✅ **Completato**: Finalizzato
- ❌ **Abbandonato**: Non più perseguito

**Gestione Energia**:
- Classificazione per livello energetico richiesto
- Matching con energia utente corrente
- Suggerimenti basati su disponibilità

### ⏰ Sistema Routine

**Componente**: `RoutineManager.tsx`  
**Tabelle**: `routines`, `routine_items`, `routine_goals`

**Tipi di Routine**:
- 📅 **Giornaliere**: Ripetizione quotidiana
- 📆 **Settimanali**: Giorni specifici della settimana
- 🗓️ **Mensili**: Giorno specifico del mese
- 🎯 **Custom**: Pattern personalizzati

**Categorie**:
- 🧘 Benessere
- 💪 Fitness  
- 📚 Studio
- 💼 Lavoro
- 🎨 Creatività
- ❤️ Relazioni
- 🏠 Casa
- ✨ Altro

**Pattern Mining Integration**:
- Analisi comportamenti utente
- Suggerimenti routine personalizzate
- Ottimizzazione automatica orari

### 🤖 Local ChatBot

**Componente**: `LocalChatBot.tsx`

**Contesto ADHD**:
- Modalità focus attiva/inattiva
- Livello energia corrente
- Numero task attivi
- Momento della giornata
- Umore del giorno

**Azioni Supportate**:
- Attivazione/disattivazione focus mode
- Suggerimenti task basati su energia
- Consigli per gestione tempo
- Supporto motivazionale personalizzato

---

## 🔐 Sistema di Sicurezza (RLS)

### Row Level Security Policies

**Pattern Standard** per tutte le tabelle utente:
```sql
-- SELECT Policy
CREATE POLICY "Users can view own records" ON table_name
FOR SELECT USING (auth.uid() = user_id);

-- INSERT Policy  
CREATE POLICY "Users can insert own records" ON table_name
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy
CREATE POLICY "Users can update own records" ON table_name
FOR UPDATE USING (auth.uid() = user_id);

-- DELETE Policy
CREATE POLICY "Users can delete own records" ON table_name
FOR DELETE USING (auth.uid() = user_id);
```

**Eccezioni Speciali**:
- `test_questions`, `test_answers`: Lettura pubblica
- `archetype_levels`: Lettura pubblica
- `xp_transactions`: Solo SELECT per utenti, INSERT per sistema

---

## 🎨 Interfaccia Utente

### Design System
- **Framework**: Tailwind CSS
- **Componenti**: shadcn/ui
- **Tema**: Dark/Light mode support
- **Responsive**: Mobile-first design
- **Accessibilità**: ARIA labels, keyboard navigation

### Navigazione
```
/ → Dashboard principale
/personalita → Esplorazione archetipi
/progetti → Gestione progetti
/routine → Gestione routine
/impostazioni → Configurazioni utente
/personaggio → Scheda personaggio RPG-style
```

### Componenti UI Riutilizzabili
- `ErrorBoundary`: Gestione errori React
- `FocusMode`: Modalità concentrazione
- `StatsSkeleton`: Loading states
- `SmartSuggestionsPanel`: Suggerimenti AI

---

## 🔄 Flussi di Dati Critici

### 1. Completamento Task
```
1. User clicca "Completa" su task
2. TaskManager → useTaskMutations.completeTask()
3. UPDATE tasks SET completed_at = now(), status = 'completed'
4. CALL add_xp_to_profile(user_id, xp_reward)
5. Funzione SQL:
   - UPDATE profiles SET total_xp += xp_amount
   - Calcola nuovo livello
   - INSERT xp_transactions
   - RETURN JSON con risultati
6. Frontend mostra notifica level up (se applicabile)
7. Refresh statistiche e profilo
```

### 2. Creazione Nuovo Utente
```
1. Registrazione via Supabase Auth
2. TRIGGER handle_new_user() attivato
3. INSERT profiles con valori default
4. Redirect a ArchetypeTest
5. Completamento test → UPDATE profiles con risultati
6. Redirect a DailyMoodSelector
7. Selezione mood → INSERT daily_moods
8. Accesso a dashboard principale
```

### 3. Sincronizzazione Google Calendar
```
1. OAuth Google Calendar
2. Fetch eventi da Google API
3. Conversione eventi → task con google_calendar_event_id
4. Sincronizzazione bidirezionale
5. Gestione conflitti e aggiornamenti
```

---

## 🚀 Ottimizzazioni ADHD

### Focus Mode
- Limita task visibili (1-5)
- Riduce distrazioni UI
- Prioritizzazione automatica
- Timer Pomodoro integrato

### Gamificazione
- Sistema XP e livelli
- Achievement e badge
- Streak tracking
- Ricompense personalizzate per archetipo

### Gestione Energia
- Classificazione task per energia richiesta
- Matching con livello energia utente
- Suggerimenti adattivi
- Prevenzione burnout

### Pattern Mining
- Analisi comportamenti utente
- Suggerimenti routine ottimali
- Identificazione pattern produttivi
- Adattamento automatico interfaccia

---

## 🔧 Configurazione e Deploy

### Variabili Ambiente
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Build e Deploy
```bash
# Installazione dipendenze
npm install

# Sviluppo locale
npm run dev

# Build produzione
npm run build

# Deploy Supabase
supabase db push
```

---

## 📈 Metriche e Analytics

### KPI Tracciati
- Task completati per giorno/settimana/mese
- Streak di completamento
- Distribuzione energia task
- Utilizzo archetipi
- Engagement routine
- Tempo in focus mode

### Tabelle Analytics
- `xp_transactions`: Tracking guadagni XP
- `daily_moods`: Andamento umore
- `traces`: Eventi di progresso
- Task completion rates per categoria

---

## 🛠️ Manutenzione e Troubleshooting

### Problemi Comuni

1. **Errore 404 add_xp_to_profile**
   - ✅ **Risolto**: Migrazione `20250121000000_add_xp_to_profile_function.sql`
   - Verifica: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'add_xp_to_profile';`

2. **Missing queryFn React Query**
   - Causa: Tentativo di query senza queryFn definita
   - Soluzione: Uso diretto Supabase client invece di React Query per profili

3. **RLS Policy Errors**
   - Verifica policies attive: `SELECT * FROM pg_policies WHERE tablename = 'table_name';`
   - Controllo auth.uid() in query

### Backup e Recovery
- Backup automatico Supabase
- Export dati utente via dashboard
- Migrazione database con versioning
- Rollback procedure documentate

---

## 🔮 Roadmap Futura

### Funzionalità Pianificate
- [ ] Integrazione Notion/Obsidian
- [ ] AI Assistant avanzato
- [ ] Collaborative workspaces
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Advanced analytics dashboard
- [ ] Plugin system per estensioni

### Ottimizzazioni Tecniche
- [ ] Performance monitoring
- [ ] Caching strategies
- [ ] Database indexing optimization
- [ ] Real-time collaboration
- [ ] Progressive Web App features

---

**📝 Nota**: Questa documentazione è aggiornata al 21 gennaio 2025 e riflette lo stato attuale dell'applicazione dopo la risoluzione del bug `add_xp_to_profile`. Mantenere aggiornata con ogni modifica significativa.