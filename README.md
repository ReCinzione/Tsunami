# 🌊 TSUNAMI - ADHD Task Manager

Un task manager gamificato progettato specificamente per persone con ADHD, che combina gestione delle attività, routine personalizzate e un sistema di progressione basato su archetipi cognitivi.

## 🎯 Caratteristiche Principali

### 📋 Gestione Task Intelligente
- **Task Manager** con prioritizzazione automatica
- **Mental Inbox** per catturare rapidamente pensieri e idee
- **Quick Actions** per azioni rapide e frequenti
- **Smart Suggestions** basate su pattern comportamentali

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
   Modifica il file `.env` con le tue credenziali Supabase e Google Calendar.

4. **Avvia il server di sviluppo**
   ```bash
   npm run dev
   # oppure
   bun dev
   ```

5. **Apri l'applicazione**
   Naviga su `http://localhost:8080` nel tuo browser.

## 🔧 Configurazione Database

Il progetto utilizza Supabase come backend. Le migrazioni del database si trovano nella cartella `supabase/migrations/`.

### Setup Supabase
1. Crea un nuovo progetto su [Supabase](https://supabase.com)
2. Copia l'URL e la chiave API nel file `.env`
3. Esegui le migrazioni dal dashboard Supabase

## 📱 Integrazione Google Calendar

Per abilitare la sincronizzazione con Google Calendar:

1. Segui la guida in `GOOGLE_CALENDAR_SETUP.md`
2. Configura le credenziali OAuth nel file `.env`
3. Autorizza l'applicazione dal pannello impostazioni

## 🏗️ Architettura del Progetto

```
src/
├── components/          # Componenti React riutilizzabili
├── pages/              # Pagine principali dell'applicazione
├── hooks/              # Custom hooks React
├── utils/              # Utility e helper functions
├── types/              # Definizioni TypeScript
├── services/           # Servizi per API esterne
└── integrations/       # Integrazioni con servizi esterni
```

### Componenti Principali
- **TaskManager**: Gestione completa delle attività
- **InventorySystem**: Sistema gamificato di oggetti e achievement
- **RoutineManager**: Gestione routine quotidiane
- **CharacterSheet**: Profilo utente e progressi
- **MentalInbox**: Cattura rapida di pensieri e idee

## 🧠 Ottimizzazioni ADHD

Il progetto è specificamente progettato per supportare persone con ADHD attraverso:

- **Riduzione del Carico Cognitivo**: Interface semplici e intuitive
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
