# 🌊 Tsunami - ADHD-Optimized Productivity App

**Versione**: 2.0  
**Stato**: Produzione  
**Ultimo Aggiornamento**: 21 Gennaio 2025  

---

## 🎯 Panoramica

**Tsunami** è un'applicazione web di produttività personale progettata specificamente per persone con ADHD. Utilizza un sistema di gamificazione basato su archetipi di personalità per personalizzare l'esperienza utente e migliorare l'engagement attraverso meccaniche di gioco, gestione dell'energia e focus mode.

### ✨ Caratteristiche Principali

- 🎭 **Sistema Archetipi**: 5 personalità uniche (Visionario, Costruttore, Sognatore, Silenzioso, Combattente)
- 🎮 **Gamificazione**: XP, livelli, achievement e ricompense personalizzate
- 🧠 **Mental Inbox**: Cattura rapida di idee con conversione automatica in task
- 🎯 **Focus Mode**: Riduzione distrazioni con limite task visibili
- 📊 **Mood Tracking**: Tracciamento umore giornaliero con rituali suggeriti
- ⚡ **Gestione Energia**: Matching task con livello energetico utente
- 🔄 **Routine Intelligenti**: Sistema abitudini con pattern mining
- 📱 **Responsive Design**: Ottimizzato per desktop e mobile

---

## 🏗️ Architettura Tecnica

### Stack Tecnologico
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query + Zustand
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Package Manager**: npm

### Struttura Progetto
```
tsunami/
├── src/
│   ├── components/          # Componenti riutilizzabili
│   │   ├── ui/             # Componenti UI base (shadcn)
│   │   ├── TaskManager.tsx # Gestione attività
│   │   ├── MentalInbox.tsx # Inbox mentale
│   │   ├── ArchetypeTest.tsx # Test personalità
│   │   ├── ProjectManager.tsx # Gestione progetti
│   │   ├── RoutineManager.tsx # Gestione routine
│   │   └── LocalChatBot.tsx # Chatbot ADHD
│   ├── pages/              # Pagine principali
│   │   ├── Index.tsx       # Dashboard principale
│   │   ├── Auth.tsx        # Autenticazione
│   │   └── Settings.tsx    # Impostazioni
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities e configurazioni
│   ├── types/              # Definizioni TypeScript
│   └── App.tsx             # Componente root
├── supabase/               # Configurazione database
│   ├── migrations/         # Migrazioni SQL
│   └── seed.sql           # Dati iniziali
├── public/                 # Asset statici
└── docs/                   # Documentazione
```

---

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+
- npm o yarn
- Account Supabase
- Git

### Installazione

1. **Clone del repository**
```bash
git clone https://github.com/your-username/tsunami.git
cd tsunami
```

2. **Installazione dipendenze**
```bash
npm install
```

3. **Configurazione ambiente**
```bash
cp .env.example .env.local
```

Modifica `.env.local` con le tue credenziali:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

4. **Setup database**
```bash
# Installa Supabase CLI
npm install -g @supabase/cli

# Login a Supabase
supabase login

# Link al progetto
supabase link --project-ref your-project-ref

# Applica migrazioni
supabase db push
```

5. **Avvio sviluppo**
```bash
npm run dev
```

L'app sarà disponibile su `http://localhost:5173`

---

## 🗄️ Database Schema

### Tabelle Principali
- **profiles**: Profili utente con archetipi e XP
- **tasks**: Gestione attività con gamificazione
- **xp_transactions**: Tracking guadagni XP
- **mental_inbox**: Inbox mentale per cattura idee
- **daily_moods**: Tracciamento umore giornaliero
- **projects**: Gestione progetti a lungo termine
- **routines**: Sistema routine e abitudini
- **test_questions/answers**: Sistema test archetipi

### Funzioni SQL Critiche
- `add_xp_to_profile(user_id, xp_amount)`: Gestione XP e level up
- `calculate_xp_for_level(level)`: Calcolo XP richiesti per livello
- `handle_new_user()`: Trigger creazione profilo automatica

**📚 Documentazione Completa**: Vedi `DATABASE_REFERENCE.md` per schema dettagliato

---

## 🎮 Funzionalità Implementate

### ✅ Sistema di Autenticazione
- Registrazione/Login con Supabase Auth
- Creazione automatica profilo utente
- Protezione route con RLS policies

### ✅ Test Archetipi
- 5 archetipi di personalità ADHD-optimized
- Test di 20+ domande con pesi personalizzati
- Personalizzazione UI basata su risultati

### ✅ Task Management
- Creazione/modifica/eliminazione task
- Sistema XP e ricompense
- Task ricorrenti con pattern personalizzabili
- Categorizzazione per energia richiesta
- Integrazione Google Calendar (preparata)

### ✅ Mental Inbox
- Cattura rapida idee e pensieri
- Conversione automatica note → task
- Analisi intelligente contenuto
- Supporto OCR per immagini (preparato)

### ✅ Mood Tracking
- Selezione umore giornaliero
- Rituali suggeriti per ogni mood
- Tracking andamento nel tempo

### ✅ Focus Mode
- Riduzione distrazioni UI
- Limite task visibili (1-5)
- Timer Pomodoro integrato (preparato)

### ✅ Sistema Progetti
- Gestione progetti a lungo termine
- Stati: Idea → Planning → In Corso → Completato
- Classificazione per energia richiesta

### ✅ Sistema Routine
- Routine giornaliere/settimanali/mensili
- Categorizzazione per area vita
- Tracking streak e completamenti
- Pattern mining per suggerimenti

### ✅ Gamificazione
- Sistema XP e livelli (1-100)
- Transazioni XP trackate
- Achievement e badge (preparati)
- Statistiche dettagliate

### ✅ Local ChatBot
- Assistente ADHD-aware
- Contesto personalizzato (mood, energia, task)
- Suggerimenti adattivi
- Supporto motivazionale

---

## 🔧 Configurazione Avanzata

### Variabili Ambiente
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Integration
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Optional: Analytics
VITE_GA_TRACKING_ID=your-ga-id

# Optional: Sentry Error Tracking
VITE_SENTRY_DSN=your-sentry-dsn

# Development
VITE_DEV_MODE=true
```

### Scripts Disponibili
```bash
# Sviluppo
npm run dev          # Avvia dev server
npm run build        # Build produzione
npm run preview      # Preview build locale

# Testing
npm run test         # Esegue test
npm run test:watch   # Test in watch mode
npm run test:coverage # Coverage report

# Linting
npm run lint         # ESLint check
npm run lint:fix     # Fix automatico
npm run type-check   # TypeScript check

# Database
npm run db:push      # Applica migrazioni
npm run db:reset     # Reset database
npm run db:seed      # Popola dati test
```

---

## 🧪 Testing

### Setup Testing
```bash
# Installa dipendenze test
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Esegui test
npm run test
```

### Struttura Test
```
src/
├── __tests__/          # Test globali
├── components/
│   └── __tests__/      # Test componenti
└── hooks/
    └── __tests__/      # Test custom hooks
```

---

## 📦 Deploy

### Vercel (Raccomandato)
```bash
# Installa Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Build
npm run build

# Deploy cartella dist/
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

---

## 🔍 Troubleshooting

### Problemi Comuni

#### ❌ Errore "add_xp_to_profile function not found"
**Soluzione**: Applica migrazione mancante
```bash
supabase db push
# oppure esegui manualmente la migrazione SQL
```

#### ❌ RLS Policy Errors
**Causa**: Policies Row Level Security non configurate
**Soluzione**: Verifica policies nel database
```sql
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

#### ❌ Build Errors TypeScript
**Soluzione**: Controlla tipi e importazioni
```bash
npm run type-check
```

#### ❌ Supabase Connection Issues
**Soluzione**: Verifica variabili ambiente e URL
```bash
# Test connessione
curl -H "apikey: YOUR_ANON_KEY" "YOUR_SUPABASE_URL/rest/v1/"
```

### Debug Mode
```bash
# Abilita debug dettagliato
VITE_DEBUG=true npm run dev

# Log SQL queries
VITE_LOG_SQL=true npm run dev
```

---

## 🤝 Contribuire

### Workflow Contribuzione
1. Fork del repository
2. Crea branch feature (`git checkout -b feature/amazing-feature`)
3. Commit modifiche (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Apri Pull Request

### Coding Standards
- **TypeScript**: Strict mode abilitato
- **ESLint**: Configurazione React + TypeScript
- **Prettier**: Formattazione automatica
- **Conventional Commits**: Per messaggi commit

### Pre-commit Hooks
```bash
# Installa husky
npm install --save-dev husky lint-staged

# Setup hooks
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

---

## 📊 Performance

### Metriche Target
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3s

### Ottimizzazioni Implementate
- Code splitting con React.lazy
- Lazy loading componenti
- Memoization con React.memo
- Debouncing input utente
- Caching React Query
- Compressione asset Vite

---

## 🔐 Sicurezza

### Misure Implementate
- **Row Level Security**: Tutte le tabelle utente
- **Input Sanitization**: Validazione client e server
- **HTTPS Only**: Forzato in produzione
- **Environment Variables**: Secrets non committati
- **CORS**: Configurato per domini autorizzati

### Security Checklist
- [ ] Variabili ambiente configurate
- [ ] RLS policies attive
- [ ] Input validation implementata
- [ ] Error handling sicuro
- [ ] Logging configurato

---

## 📈 Roadmap

### 🚀 Versione 2.1 (Q2 2025)
- [ ] Mobile app (React Native)
- [ ] Integrazione Notion/Obsidian
- [ ] AI Assistant avanzato
- [ ] Offline mode
- [ ] Team collaboration

### 🎯 Versione 2.2 (Q3 2025)
- [ ] Advanced analytics
- [ ] Plugin system
- [ ] API pubblica
- [ ] White-label solution
- [ ] Enterprise features

---

## 📚 Risorse

### Documentazione
- [📖 Documentazione Completa](./TSUNAMI_APPLICATION_DOCUMENTATION.md)
- [🗄️ Database Reference](./DATABASE_REFERENCE.md)
- [🎨 Design System](./docs/design-system.md)
- [🔧 API Reference](./docs/api-reference.md)

### Link Utili
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### Community
- [Discord Server](https://discord.gg/tsunami-adhd)
- [GitHub Discussions](https://github.com/your-username/tsunami/discussions)
- [Twitter](https://twitter.com/tsunami_adhd)

---

## 📄 Licenza

MIT License - vedi [LICENSE](./LICENSE) per dettagli.

---

## 👥 Team

**Sviluppato con ❤️ per la community ADHD**

- **Lead Developer**: [Your Name](https://github.com/your-username)
- **UI/UX Design**: [Designer Name](https://github.com/designer)
- **ADHD Consultant**: [Consultant Name](https://linkedin.com/consultant)

---

## 🙏 Ringraziamenti

Grazie a tutti i beta tester, contributor e alla community ADHD che ha reso possibile questo progetto.

**Tsunami** - *Trasforma il caos in produttività* 🌊

---

**📝 Ultimo aggiornamento**: 21 Gennaio 2025  
**🔄 Versione README**: 2.0  
**✅ Stato**: Produzione Ready
