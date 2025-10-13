# 🌊 Tsunami - ADHD-Optimized Productivity App

**Versione**: 2.0.1  
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

## 🎯 Best Practices

### 🔒 Sicurezza
```typescript
// ✅ CORRETTO: Validazione input
const createTask = async (title: string) => {
  if (!title?.trim()) {
    throw new Error('Titolo richiesto');
  }
  if (title.length > 500) {
    throw new Error('Titolo troppo lungo');
  }
  // ... resto della logica
};

// ❌ SBAGLIATO: Input non validato
const createTask = async (title: string) => {
  const { data } = await supabase
    .from('tasks')
    .insert({ title }); // Vulnerabile a injection
};
```

### ⚡ Performance
```typescript
// ✅ CORRETTO: Paginazione e filtri
const { data: tasks } = await supabase
  .from('tasks')
  .select('id, title, completed')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .range(0, 49); // Limita a 50 risultati

// ❌ SBAGLIATO: Carica tutto
const { data: tasks } = await supabase
  .from('tasks')
  .select('*'); // Carica tutti i campi di tutti gli utenti
```

### 🔄 State Management
```typescript
// ✅ CORRETTO: Ottimistic updates
const toggleTask = useMutation({
  mutationFn: async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', taskId);
    if (error) throw error;
  },
  onMutate: async (taskId) => {
    // Aggiorna UI immediatamente
    queryClient.setQueryData(['tasks'], (old) => 
      old?.map(t => t.id === taskId ? {...t, completed: !t.completed} : t)
    );
  },
  onError: (err, taskId, context) => {
    // Rollback in caso di errore
    queryClient.setQueryData(['tasks'], context.previousTasks);
  }
});
```

### 🎨 UI/UX Guidelines
- **Accessibilità**: Usa `aria-labels`, contrasto colori, navigazione keyboard
- **Loading States**: Mostra sempre feedback durante operazioni async
- **Error Boundaries**: Gestisci errori gracefully senza crash
- **Mobile First**: Design responsive da mobile a desktop
- **Performance**: Lazy loading, code splitting, image optimization

---

## 🚨 Troubleshooting

### Problemi Comuni

#### 🔐 "Task non visibili dopo login"
```sql
-- Verifica RLS policies
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tasks';

-- Dovrebbe restituire: rowsecurity = true
```
**Soluzione**: Vedi `TAGS_MIGRATION_INSTRUCTIONS.md`

#### ⚡ "App lenta con molte task"
```typescript
// Implementa paginazione
const TASKS_PER_PAGE = 20;
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['tasks'],
  queryFn: ({ pageParam = 0 }) => 
    supabase
      .from('tasks')
      .select('*')
      .range(pageParam, pageParam + TASKS_PER_PAGE - 1)
});
```

#### 🔄 "Errori di sincronizzazione"
```typescript
// Implementa retry logic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minuti
    },
  },
});
```

#### 🎯 "Focus Mode non funziona"
```typescript
// Verifica localStorage
const focusMode = localStorage.getItem('focusMode');
if (focusMode === 'true') {
  // Applica filtri UI
  const visibleTasks = tasks.slice(0, focusLimit);
}
```

### 🔧 Debug Tools

```typescript
// Abilita debug mode
if (import.meta.env.DEV) {
  window.supabase = supabase;
  window.queryClient = queryClient;
  
  // Debug RLS
  window.testRLS = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');
    console.log('RLS Test:', { data, error });
  };
}
```

### 📊 Monitoring

```typescript
// Error tracking
const errorHandler = (error: Error, errorInfo: any) => {
  console.error('App Error:', error, errorInfo);
  
  // Invia a servizio monitoring (es. Sentry)
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      contexts: { errorInfo },
      tags: { component: 'TaskManager' }
    });
  }
};

// Performance monitoring
const measurePerformance = (name: string, fn: Function) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
};
```

---

## 🔗 Link Esterni Utili

### 📚 Documentazione Tecnica
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Components](https://tailwindui.com/components)
- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)

### 🎨 Design & UX
- [ADHD-Friendly Design Principles](https://www.additudemag.com/adhd-friendly-web-design/)
- [Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Mobile-First Design](https://www.uxpin.com/studio/blog/mobile-first-design/)

### 🧠 ADHD Research
- [ADHD & Productivity Research](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6379245/)
- [Gamification for ADHD](https://www.frontiersin.org/articles/10.3389/fpsyg.2019.01565/full)
- [Executive Function Tools](https://www.understood.org/en/articles/executive-function-strategies-for-adults)

### 🛠️ Development Tools
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [TypeScript Error Translator](https://ts-error-translator.vercel.app/)

### 🚀 Deployment & Hosting
- [Vercel Deployment Guide](https://vercel.com/docs/concepts/deployments)
- [Netlify React Guide](https://docs.netlify.com/frameworks/react/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [GitHub Actions CI/CD](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs)

### 📈 Analytics & Monitoring
- [Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4)
- [Sentry Error Tracking](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Vercel Analytics](https://vercel.com/docs/concepts/analytics)
- [Web Vitals](https://web.dev/vitals/)

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

### Community & Support
- [🎮 Discord Server](https://discord.gg/tsunami-adhd) - Chat in tempo reale
- [💬 GitHub Discussions](https://github.com/your-username/tsunami/discussions) - Q&A e feature requests
- [🐦 Twitter](https://twitter.com/tsunami_adhd) - Aggiornamenti e tips
- [📺 YouTube Channel](https://youtube.com/@tsunami-adhd) - Tutorial e demo
- [📝 Blog](https://blog.tsunami-adhd.com) - Articoli su ADHD e produttività
- [🎯 Reddit Community](https://reddit.com/r/TsunamiADHD) - Discussioni community

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
