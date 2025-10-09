# 🌊 TSUNAMI - ADHD Task Manager

Un task manager gamificato progettato specificamente per persone con ADHD, che combina gestione delle attività, routine personalizzate e un sistema di progressione basato su archetipi cognitivi.

## 🎯 Caratteristiche Principali

### 📋 Gestione Task Intelligente
- **Task Manager** con prioritizzazione automatica
- **Mental Inbox** per catturare rapidamente pensieri e idee
- **Quick Actions** per azioni rapide e frequenti
- **Smart Suggestions** basate su pattern comportamentali
- **Tag System**: Organizza tasks con tag multipli (array PostgreSQL text[])

### 🎮 Sistema Gamificato
- **Sistema di Livelli** con progressione personalizzata
- **Inventario Digitale** con oggetti sbloccabili
- **Archetipi Cognitivi** (Esploratore, Costruttore, Guerriero, Saggio)
- **Achievement e Ricompense** per mantenere la motivazione

### 🔄 Routine e Automazione
- **Routine Manager** per abitudini quotidiane
- **Pattern Mining** per identificare comportamenti ricorrenti
- **Automazione Intelligente** basata sui dati storici
- **Integrazione Google Calendar** per sincronizzazione eventi

### 📊 Monitoraggio e Analytics
- **Mood Tracking** quotidiano
- **Analytics Comportamentali** per insight personalizzati
- **Scheda Personaggio** con progressi e statistiche
- **Gestione Progetti** con timeline e milestone

## 🚀 Installazione e Setup

### Prerequisiti
- Node.js (versione 18 o superiore)
- npm o bun
- Account Supabase (per il database)

### Installazione

1. **Clona il repository**
   ```bash
   git clone https://github.com/ReCinzione/Tsunami.git
   cd Tsunami
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   # oppure
   bun install
   ```

3. **Configura le variabili d'ambiente**
   ```bash
   cp .env.example .env
   ```
   Compila il file `.env` con:
   - `VITE_SUPABASE_URL`: URL del tuo progetto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Chiave anonima di Supabase
   - Altre variabili opzionali per Google Calendar

4. **Applica le migration del database**
   ```bash
   # Se usi Supabase CLI
   supabase db push
   
   # Oppure applica manualmente le migration dalla cartella supabase/migrations
   ```

5. **Avvia il server di sviluppo**
   ```bash
   npm run dev
   # oppure
   bun dev
   ```

## 🗄️ Schema Database

### Tabella Tasks

La tabella `tasks` è il cuore del sistema e include i seguenti campi principali:

- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to auth.users)
- `title`: text (Titolo del task)
- `description`: text (Descrizione dettagliata)
- `status`: text (stato del task: 'pending', 'in_progress', 'completed')
- `priority`: integer (livello di priorità)
- `due_date`: timestamp (data di scadenza)
- **`tags`**: **text[]** (Array di tag per organizzazione e filtering)
  - Tipo: PostgreSQL array standard (`text[]`)
  - Default: array vuoto `'{}'::text[]`
  - Utilizzo: Per categorizzare e filtrare tasks in modo flessibile
  - Esempi: `['work', 'urgent']`, `['personal', 'health']`
- `created_at`: timestamp
- `updated_at`: timestamp

### Row Level Security (RLS)

Tutte le tabelle implementano RLS policies per garantire sicurezza:

- **SELECT**: Gli utenti possono visualizzare solo i propri tasks (incluso campo `tags`)
- **INSERT**: Gli utenti possono creare tasks solo per se stessi
- **UPDATE**: Gli utenti possono modificare solo i propri tasks (incluso campo `tags`)
- **DELETE**: Gli utenti possono eliminare solo i propri tasks

Le policies RLS sono state aggiornate nella migration `20251009131700_add_tags_to_tasks.sql` per assicurare piena compatibilità e visibilità del campo tags.

### Migration Database

Le migration sono in `supabase/migrations/` e includono:

1. `20250115000000_add_google_calendar_fields.sql` - Integrazione Google Calendar
2. `20250720101120-43df3953-9555-42ee-825d-4ac661ed2ee2.sql` - Schema iniziale tasks
3. `20250723130225-322a3b43-da33-4c7b-b96b-56071082cde2.sql` - Updates vari
4. `20250725062638-abc58715-53de-4dce-979f-a9a35754e95e.sql` - Routine e pattern
5. `20250910090041_042c3ff9-a5b5-4948-b420-24d533d67f97.sql` - Gamification
6. **`20251009131700_add_tags_to_tasks.sql`** - **Aggiunta colonna tags con RLS updates**

## 🧠 Principi ADHD-Friendly

L'applicazione è progettata con principi specifici per ADHD:

- **Feedback Immediato**: Notifiche e ricompense istantanee
- **Flessibilità**: Adattamento ai diversi stili cognitivi
- **Gamificazione**: Elementi di gioco per mantenere l'engagement
- **Pattern Recognition**: Identificazione automatica di abitudini

## 🤖 Chatbot Locale

Il progetto include un chatbot locale per assistenza e supporto:

- Risposte contestuali basate sui dati utente
- Suggerimenti personalizzati per task e routine
- Supporto emotivo e motivazionale

## 📈 Roadmap

- [ ] App mobile con Capacitor
- [ ] Integrazione con altri calendar (Outlook, Apple)
- [ ] Sistema di condivisione e collaborazione
- [ ] AI avanzata per suggerimenti predittivi
- [ ] Integrazione con dispositivi wearable
- [ ] Plugin per browser e desktop

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## 👥 Team

- **ReCinzione** - Sviluppatore principale

## 🆘 Supporto

Per supporto e domande:

- Apri una issue su GitHub
- Consulta la documentazione nella cartella `docs/`
- Controlla i file di progresso: `PROGRESS_ADHD_OPTIMIZATION.md` e `PROGRESS_COGNITIVE_OPTIMIZATION.md`

---

*TSUNAMI è più di un task manager - è un compagno digitale progettato per aiutare le menti neurodivergenti a prosperare in un mondo organizzato.*
