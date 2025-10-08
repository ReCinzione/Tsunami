# 📝 CHANGELOG - TSUNAMI ADHD Task Manager

## [Unreleased]

### Added
- **Piano Miglioramenti UX 2025**: Roadmap completa per ottimizzazioni basate su analisi dettagliata
  - 9 aree di miglioramento identificate con priorità e tempi stimati
  - Focus su automazione, personalizzazione e riduzione friction
  - Documentazione completa in `PROGRESS_ADHD_OPTIMIZATION.md`
- **Integrazione Google Calendar**: Sincronizzazione automatica task con Google Calendar
  - Servizio `googleCalendar.ts` per gestione OAuth 2.0 e API calls
  - Componente `GoogleCalendarAuth.tsx` per autenticazione utente
  - Pagina Impostazioni con gestione connessione Google Calendar
  - Checkbox "Sincronizza con Google Calendar" nel form creazione task
  - Documentazione completa in `GOOGLE_CALENDAR_SETUP.md`

- **✅ Filtri Dinamici TaskManager**: Sistema intelligente di filtri basato su mood e energia
  - Filtri per livello di energia (molto_bassa, bassa, media, alta, molto_alta)
  - Suggerimenti intelligenti basati sul mood giornaliero:
    - Congelato: task a energia molto bassa/bassa
    - Disorientato: task a energia bassa/media  
    - In flusso: task a energia media/alta/molto alta
    - Ispirato: task a energia alta/molto alta
  - Interfaccia utente con controlli per "Suggeriti per oggi" e filtri manuali
  - Statistiche in tempo reale (task mostrati vs totali)
  - Integrazione con sistema mood giornaliero esistente
  - Funzione reset filtri per tornare alla vista completa

- **Focus Mode Personalizzabile**: Controllo granulare del numero di task visualizzati
  - Slider personalizzabile da 1 a 5 task (invece di fisso a 3)
  - Badge dinamico che mostra il numero di task selezionati
  - Interfaccia intuitiva integrata nella barra Focus Mode

- **Suggerimenti Intelligenti Nota→Task**: AI-powered per conversione automatica
  - Analisi automatica del contenuto delle note nella Mental Inbox
  - Suggerimenti per tipo di task, energia richiesta, urgenza e titolo ottimizzato
  - Anteprima espandibile con livello di confidenza AI
  - Calcolo automatico XP reward e scadenze per task urgenti
  - Interfaccia collapsible con icone e badge informativi

- **Template/Wizard Guidati**: Sistema di template ADHD-friendly
  - 6 template predefiniti: Quick Win, Pomodoro Focus, Brain Dump, Comunicazione Difficile, Progetto Creativo, Organizza Spazio
  - Interfaccia wizard con anteprima e descrizioni dettagliate
  - Pre-compilazione automatica di tutti i campi del task
  - Design responsive con grid layout e badge informativi

### Changed
- `TaskManager.tsx`: Aggiunta logica filtri dinamici e interfaccia utente
- `getDisplayTasks()`: Ora utilizza `filteredTasks` invece di `tasks` direttamente
- Aggiornato `PROGRESS_ADHD_OPTIMIZATION.md` con implementazione completata
- **TaskManager.tsx**: Implementato Focus Mode personalizzabile con parametro `focusTaskCount`
- **TaskManager.tsx**: Aggiunto sistema di template e wizard guidati
- **MentalInbox.tsx**: Implementati suggerimenti intelligenti con analisi AI del contenuto
- **Index.tsx**: Aggiunto controllo slider per Focus Mode personalizzabile

### Planned (Priorità Alta)
- **Suggerimenti Intelligenti Nota→Task**: Analisi automatica contenuto per conversione smart
- **Focus Mode Personalizzabile**: Slider 1-5 task invece di fisso a 3

### Planned (Priorità Media)
- **Template e Wizard Guidati**: Libreria template per task, routine e progetti
- **Sistema Undo/Redo**: Gestione annullamento azioni principali
- **Onboarding Interattivo**: Tour guidato e tooltips contestuali

### Planned (Priorità Bassa)
- **Routine Auto-Attivate**: Trigger automatici basati su contesto
- **Notifiche Granulari**: Configurazione avanzata reminder e snooze
- **Associazioni Task-Progetti**: Drag & drop e suggerimenti automatici

### Changed
- Aggiornato `TaskManager.tsx` con funzionalità di sincronizzazione
- Modificati tipi database per supportare token Google Calendar
- Aggiunto pulsante "Impostazioni" nell'header principale

### Fixed
- Risolto errore `process is not defined` sostituendo con `import.meta.env`
- Corretti riferimenti alle variabili d'ambiente per compatibilità Vite

### Known Issues
- **Sincronizzazione Google Calendar**: Funziona solo alla creazione task, non per modifiche
- **Requisiti sincronizzazione**: Richiede autenticazione Google e data di scadenza
- **Sincronizzazione unidirezionale**: Solo da TSUNAMI → Google Calendar
- **Gestione errori**: Messaggi di errore potrebbero non essere chiari per l'utente

### Technical Debt
- Implementare sincronizzazione bidirezionale Google Calendar ↔ TSUNAMI
- Aggiungere indicatori visivi stato sincronizzazione per ogni task
- Migliorare UX per gestione errori di sincronizzazione
- Implementare auto-sync per modifiche task esistenti

## [1.2.0] - 2024-12-19

### Added
- **LocalChatBot**: Assistente ADHD completamente locale e privacy-first
  - Pattern matching per 7+ intenti ADHD (overwhelm, focus, procrastination, etc.)
  - Database di 200+ risposte evidence-based specifiche per ADHD
  - Context awareness integrato con stato app (Focus Mode, energia, task attivi)
  - Azioni integrate: attivazione Focus Mode, suggerimenti Pomodoro, filtering task
  - Interfaccia chat ottimizzata per ridurre distrazioni cognitive
  - Indicatori di contesto in tempo reale (Focus Mode, energia, task count)
  - Animazioni di typing per feedback naturale
  - Supporto completo offline - zero data collection
- Documentazione tecnica completa in `docs/LOCAL_CHATBOT.md`
- Architettura estensibile per future integrazioni TensorFlow.js

### Changed
- Quick Add Button spostato in basso a sinistra per fare spazio al ChatBot
- Integrazione ChatBot con sistema di azioni dell'app principale
- Context ADHD condiviso tra componenti per coerenza UX

### Technical
- Nuovo componente `LocalChatBot.tsx` con architettura modulare
- Pattern matching engine con regex ottimizzate per linguaggio italiano
- Sistema di personalizzazione risposte basato su contesto temporale
- Action suggestion system per integrazione seamless con app
- Memory management ottimizzato per performance su dispositivi low-end

### Privacy & Security
- Implementazione completamente client-side
- Nessun dato inviato a server esterni
- Conversazioni memorizzate solo localmente (opzionale)
- GDPR e HIPAA compliant by design

## [1.1.0] - 2024-12-19

### Added
- Focus Mode toggle per ridurre cognitive overload
- Algoritmo di priorità intelligente per task (scadenza + energia + XP)
- Floating Quick Add button per accesso rapido
- Messaggi contestuali per Focus Mode
- Indicatori di stato per task prioritari

### Changed
- Ridotti tab principali da 8 a 4 (Casa, Attività, Note, Routine)
- TaskManager ora supporta modalità focus con limite di 3 task
- UI semplificata per ridurre overwhelm
- Navigazione ottimizzata per utenti ADHD

### Fixed
- Cognitive overload da troppi tab simultanei
- Difficoltà nel focus sui task prioritari
- Accesso complesso per aggiunta rapida task

### Removed
- Tab "Personality" e "Projects" dalla navigazione principale
- Sezioni ridondanti nell'interfaccia utente

---

## [1.1.0] - 2024-12-19

### Added
- Focus Mode con algoritmo di priorità intelligente
- Floating Quick Add button sempre accessibile
- Sistema di filtraggio task prioritari (top 3)
- Messaggi contestuali per modalità focus
- Indicatori visivi per task prioritari

### Changed
- Interfaccia semplificata: 4 tab invece di 8
- TaskManager ottimizzato per focus mode
- Navigazione ridotta per minimizzare cognitive load
- UX migliorata per utenti ADHD

### Technical
- Implementato `calculateTaskPriority()` function
- Aggiunto `getDisplayTasks()` per filtraggio intelligente
- Modificato Index.tsx per nuova struttura tab
- Ottimizzato TaskManager.tsx per focus mode

## [2025-01-20] - Initial Analysis & Planning

### ✅ Added
- **PROGRESS_ADHD_OPTIMIZATION.md**: Documento completo di analisi e roadmap
  - Analisi dettagliata di tutti i componenti (Dashboard, TaskManager, MentalInbox, RoutineManager, ProjectManager, ArchetypeSystem)
  - Identificazione di 8 tab troppo numerosi per utenti ADHD
  - Roadmap in 3 fasi: Quick Wins (1-2 settimane), Core Features (3-6 settimane), AI & Advanced (7-12 settimane)
  - Strategie ottimizzazione costi Supabase
  - Metriche di successo specifiche per ADHD

### 🔍 Analyzed
- **Frontend Architecture**: React + TypeScript + Vite + Supabase
- **Database Structure**: 8 tabelle principali con RLS policies
- **Component Structure**: 6 componenti principali analizzati
- **ADHD Compatibility**: Identificati punti critici per cognitive load

### 📋 Identified Issues
- **UI Overwhelm**: 8 tab troppi per utenti ADHD
- **Missing Focus Mode**: Nessuna modalità concentrazione
- **No Time Estimates**: Impossibile pianificare realisticamente
- **No Pomodoro Timer**: Tecnica fondamentale per ADHD assente
- **Limited Mobile Optimization**: PWA non completamente implementata

### 🎯 Planned Improvements
- **Fase 1 (Quick Wins)**: Riduzione tab, Focus Mode, Quick Add button, stime tempo
- **Fase 2 (Core Features)**: Timer Pomodoro, algoritmi smart, ottimizzazione mobile
- **Fase 3 (Advanced)**: AI integration, funzionalità cliniche, multi-platform

### 📊 Metrics Defined
- **UX Targets**: Time to First Task <30s, Task Completion Rate >70%
- **ADHD-Specific**: Overwhelm Events <1/week, Focus Sessions >3/day
- **Clinical**: Therapist Adoption >50 psicologi
- **Technical**: Page Load <2s, Mobile Performance >90 Lighthouse

---

## 📅 Prossimi Aggiornamenti

### 🔥 Fase 1 - Quick Wins (Settimana 1-2)
- [ ] Riduzione tab da 8 a 4
- [ ] Implementazione Focus Mode
- [ ] Quick Add floating button
- [ ] Stime tempo per task
- [ ] Voice input Mental Inbox

### ⚡ Fase 2 - Core Features (Settimana 3-6)
- [ ] Timer Pomodoro integrato
- [ ] Algoritmo prioritizzazione smart
- [ ] PWA completa
- [ ] Offline functionality

### 🧠 Fase 3 - AI & Advanced (Settimana 7-12)
- [ ] AI categorization
- [ ] Funzionalità cliniche
- [ ] App mobile native

---

## 📝 Note di Versioning

**Formato**: [YYYY-MM-DD] - Descrizione Release

**Categorie**:
- ✅ **Added**: Nuove funzionalità
- 🔧 **Changed**: Modifiche a funzionalità esistenti
- 🐛 **Fixed**: Bug fix
- ❌ **Removed**: Funzionalità rimosse
- 🔒 **Security**: Miglioramenti sicurezza
- 📊 **Analysis**: Analisi e documentazione
- 🎯 **Planning**: Pianificazione e roadmap

**Priorità**:
- 🔥 **Critical**: Blocca l'uso dell'app
- ⚡ **High**: Impatta significativamente UX
- 📋 **Medium**: Miglioramento importante
- 💡 **Low**: Nice to have

---

*Ultimo aggiornamento: 2025-01-20 alle ore 15:30*
*Prossimo aggiornamento previsto: Dopo completamento Fase 1*