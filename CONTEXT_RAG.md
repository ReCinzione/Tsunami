# 🧠 CONTEXT RAG - Tsunami ADHD App

**Versione**: 1.0  
**Data Creazione**: 2025-01-21  
**Scopo**: Knowledge Base centralizzata per Context Engineering  

---

## 🎯 PANORAMICA PROGETTO

**Tsunami** è un'applicazione web di produttività per persone con ADHD che utilizza:
- **Gamificazione** basata su archetipi di personalità
- **Gestione energia** e mood tracking
- **🎤 Input vocale** integrato nel Mental Inbox
- **♻️ Reset automatico** routine giornaliere
- **Chatbot locale** specializzato ADHD
- **Focus mode migliorato** e task management intelligente

### Stack Tecnologico Core
```
Frontend: React 18 + TypeScript + Vite
Backend: Supabase (PostgreSQL + Auth + RLS)
Styling: Tailwind CSS + shadcn/ui
State: React Query + Zustand
Routing: React Router v6
```

---

## 🏗️ ARCHITETTURA SISTEMA

### Struttura Directory Principale
```
src/
├── components/          # Componenti riutilizzabili
│   ├── LocalChatBot.tsx # Chatbot ADHD locale
│   ├── TaskManager.tsx  # Gestione task
│   ├── MentalInbox.tsx  # Cattura idee rapide
│   └── ui/              # Componenti base shadcn
├── pages/               # Pagine principali
│   └── Index.tsx        # Dashboard principale
├── features/tasks/      # Feature task management
├── store/               # State management (Zustand)
├── types/               # Definizioni TypeScript
├── utils/               # Utility functions
└── hooks/               # Custom hooks
```

### Componenti Critici

#### 1. LocalChatBot.tsx
- **Scopo**: Assistente ADHD completamente locale
- **Funzioni**: Pattern matching, risposte contestuali, azioni suggerite
- **Integrazione**: onActionSuggested callback con Index.tsx
- **Stato**: isOpen, chatMessages, currentQuickActions

#### 2. MentalInbox.tsx (Enhanced)
- **Scopo**: Cattura rapida idee con input vocale integrato
- **🎤 Voice Input**: Tasto microfono per trascrizione automatica
- **Funzioni**: Cattura idee, conversione in task, voice commands
- **Integrazione**: VoiceInput component per riconoscimento vocale
- **UX**: Zero friction, interfaccia minimale per ridurre cognitive load

#### 3. RoutineManager.tsx (Enhanced)
- **Scopo**: Gestione routine con reset automatico giornaliero
- **♻️ Reset Automatico**: useEffect per controllo e reset checklist
- **Funzioni**: resetDailyRoutineFlags, tracking localStorage
- **Gestione**: Routine daily/weekly/monthly con logica intelligente
- **Persistenza**: Ultimo reset salvato per evitare reset multipli

#### 4. Index.tsx (Dashboard)
- **Scopo**: Orchestratore principale dell'app
- **Gestisce**: Tabs, callbacks, state globale
- **Callback chiave**: onActionSuggested per azioni chatbot

#### 5. TaskStore (Zustand)
- **Funzioni**: addTask, updateTask, removeTask
- **Stato**: tasks[], selectedTask, filters

---

## 🗄️ SCHEMA DATABASE

### Tabelle Principali

#### profiles
```sql
id: uuid PRIMARY KEY
user_id: uuid REFERENCES auth.users
dominant_archetype: archetype_type
current_level: int4 DEFAULT 1
total_xp: int4 DEFAULT 0
```

#### tasks
```sql
id: uuid PRIMARY KEY
user_id: uuid REFERENCES auth.users
title: text NOT NULL
energy_required: energy_level DEFAULT 'media'
task_type: task_type DEFAULT 'azione'
status: text DEFAULT 'pending'
xp_reward: int4 DEFAULT 10
tags: text[]
```

#### mental_inbox
```sql
id: uuid PRIMARY KEY
user_id: uuid REFERENCES auth.users
content: text NOT NULL
is_processed: boolean DEFAULT false
converted_to_task: boolean DEFAULT false
```

---

## 🎭 SISTEMA ARCHETIPI ADHD

### 5 Archetipi Principali
1. **Visionario** - Idee grandi, esecuzione difficile
2. **Costruttore** - Ama completare, strutturato
3. **Sognatore** - Creativo, distraibile
4. **Silenzioso** - Introverso, focus profondo
5. **Combattente** - Energico, impulsivo

### Personalizzazione per Archetipo
- **XP rewards** diversi per tipo task
- **Quick actions** specifiche
- **Messaggi motivazionali** personalizzati

---

## 🤖 CHATBOT LOCALE - PATTERN ADHD

### Intent Supportati
```typescript
const INTENT_PATTERNS = {
  overwhelm: /sopraffatt|troppo|caos|confus|stress/i,
  focus: /concentr|focus|distraz|attenz/i,
  procrastination: /procrastin|rimand|dopo|pigriz/i,
  energy_low: /stanc|esaust|energia.*bass|sposs/i,
  task_creation: /crea|aggiungi|nuovo.*task/i
};
```

### Azioni Concrete
- `create_task` → Crea task nel TaskStore
- `manage_energy` → Filtra task per energia
- `improve_focus` → Attiva focus mode
- `organize_tasks` → Riorganizza per priorità

---

## ⚡ GESTIONE ENERGIA & MOOD

### Livelli Energia
```typescript
type EnergyLevel = 'molto_bassa' | 'bassa' | 'media' | 'alta' | 'molto_alta';
```

### Stati Mood ADHD
- **🧊 Congelato**: Paralisi decisionale
- **⚡ Disorientato**: Energia senza direzione
- **🌊 In Flusso**: Stato di flow ottimale
- **✨ Ispirato**: Creatività alta

### Matching Intelligente
- Task energia bassa quando utente stanco
- Task creative quando ispirato
- Micro-task quando congelato

---

## 🎯 TASK MANAGEMENT ADHD-SPECIFIC

### Tipi Task
```typescript
type TaskType = 'azione' | 'riflessione' | 'comunicazione' | 'creativita' | 'organizzazione';
```

### Proprietà Critiche
- **energy_required**: Matching con energia utente
- **can_be_interrupted**: Per gestire distrazioni
- **xp_reward**: Gamificazione motivazionale
- **context_switching_cost**: Minimizza cambio contesto

### Focus Mode
- Limita task visibili (default: 3)
- Nasconde distrazioni UI
- Prioritizza task alta energia quando attivo

---

## 🔄 PATTERN COMUNI SVILUPPO

### Callback Pattern (Index.tsx)
```typescript
const onActionSuggested = (action: string, params: any) => {
  switch (action) {
    case 'create_task':
      const addTask = useTaskStore.getState().addTask;
      const newTask = { /* task object */ };
      addTask(newTask);
      break;
  }
};
```

### State Management Pattern
```typescript
// Zustand store pattern
const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      addTask: (task) => set((state) => ({ 
        tasks: [task, ...state.tasks] 
      }))
    })
  )
);
```

### Component Integration Pattern
```typescript
// Componente con context ADHD
interface ComponentProps {
  adhdContext: {
    energyLevel: number;
    focusMode: boolean;
    currentMood: MoodType;
  };
  onActionSuggested?: (action: string, params?: any) => void;
}
```

---

## 🚨 PROBLEMI COMUNI & SOLUZIONI

### 1. Chatbot si chiude dopo messaggio
**Causa**: Mancanza persistenza stato `isOpen`
**Soluzione**: Aggiungere `setIsOpen(true)` in `handleSendMessage`

### 2. Task non viene creata dal chatbot
**Causa**: Callback `onActionSuggested` non integrato con TaskStore
**Soluzione**: Usare `useTaskStore.getState().addTask` nel callback

### 3. Quick Actions non funzionano
**Causa**: Mancanza controllo `isOpen` in `handleQuickActionClick`
**Soluzione**: Aggiungere check apertura chatbot

---

## 📋 CHECKLIST SVILUPPO

### Prima di modificare componenti:
- [ ] Controllare integrazione con TaskStore
- [ ] Verificare callback onActionSuggested
- [ ] Testare con diversi archetipi
- [ ] Validare accessibilità ADHD

### Prima di aggiungere feature:
- [ ] Documentare in questo RAG
- [ ] Aggiungere tipi TypeScript
- [ ] Considerare impatto energia/mood
- [ ] Testare con focus mode attivo

---

## 🎨 DESIGN PRINCIPLES ADHD

### UI/UX Guidelines
- **Ridurre cognitive load**: Max 3 azioni visibili
- **Feedback immediato**: Toast per ogni azione
- **Colori calmanti**: Evitare rosso/arancione per stress
- **Micro-interactions**: Celebrare piccoli successi

### Gamificazione Etica
- **XP per effort**, non solo risultati
- **Ricompense immediate** per dopamina
- **Progress visibile** per motivazione
- **Fallimenti come learning** (no punizioni)

---

## 🔧 UTILITY FUNCTIONS CHIAVE

### Mood Enhancement (108 righe)
```typescript
// src/utils/moodEnhancements.ts
export interface MoodContext {
  mood: 'congelato' | 'disorientato' | 'in_flusso' | 'ispirato';
  suggested_ritual: string;
  date: Date;
}

// Funzioni principali:
enhanceResponseWithMoodContext(response: string, mood: MoodContext)
getMoodQuickActions(mood: string)
getMoodBasedQuickActions(mood: string, tasks: Task[])
```

### Task Suggestions (192 righe)
```typescript
// src/utils/taskSuggestions.ts
// Funzioni principali:
calculateMoodTaskScore(task: Task, mood: string, energyLevel: number)
calculateBaseTaskScore(task: Task, energyLevel: number)
predictOptimalTasksWithMood(tasks: Task[], mood: string, energyLevel: number)
getMoodBasedStrategicSuggestion(mood: string, tasks: Task[])
getContextualSuggestions(tasks: Task[], userBehavior: UserBehaviorPattern)
```

### Chatbot Responses (224 righe)
```typescript
// src/utils/chatbotResponses.ts
// Template di risposta:
responseTemplates: {
  greeting, emotional_state, task_help,
  overwhelm_support, focus_encouragement, break_suggestion
}

// Quick Actions per mood:
quickActions: { disorientato, congelato, in_flusso, ispirato }

// Funzioni principali:
generateContextualHelp(input: string, context: ADHDContext)
needsImmediateAction(input: string)
getImmediateActionSuggestions(input: string)
```

---

## 📚 RIFERIMENTI RAPIDI

### File Documentazione
- `README.md` - Setup e panoramica
- `TSUNAMI_APPLICATION_DOCUMENTATION.md` - Schema DB
- `docs/LOCAL_CHATBOT.md` - Architettura chatbot
- `src/types/README.md` - Tipi TypeScript
- `src/utils/README.md` - Utility functions
- `CONTEXT_RAG.md` - **FONTE PRIMARIA** per context engineering
- `CONTEXT_ENGINEERING.md` - Metodologia e workflow
- `AI_CONTEXT_CONFIG.md` - Configurazione AI per RAG

### Comandi Sviluppo
```bash
npm run dev          # Avvia dev server
npm run build        # Build produzione
npm run test         # Esegui test
supabase start       # Avvia DB locale
```

---

## 🏗️ ARCHITETTURA DETTAGLIATA

### Componenti Principali

#### TaskForm (`src/features/tasks/components/TaskForm.tsx`)
**Props Interface**:
```typescript
interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}
```
**Stati Critici**: validation, loading, form data
**Dipendenze**: useTaskStore, validation schemas

#### TaskListContainer (`src/features/tasks/components/TaskListContainer.tsx`)
**State Management**:
```typescript
const [editingTask, setEditingTask] = useState<Task | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
```
**Flussi Critici**: CRUD operations, filtering, sorting

#### LocalChatBot (`src/components/LocalChatBot.tsx`)
**Context Integration**:
```typescript
interface ADHDContext {
  currentMood: MoodType;
  energyLevel: number;
  dominantArchetype: ArchetypeType;
  recentTasks: Task[];
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}
```

### Flussi di Dati Critici

#### Creazione Task
```
TaskForm → validateInput() → taskStore.createTask() → Supabase → UI Update
```

#### Modifica Task
```
TaskItem.onEdit → setEditingTask → TaskForm(edit mode) → taskStore.updateTask
```

#### Error Propagation
```
Supabase Error → Service Layer → Store → UI Error State → User Feedback
```

### UI Components Mapping

#### Button Variants
```typescript
type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
```
**Utilizzi Critici**:
- `destructive`: Eliminazioni (Elimina Task)
- `default`: Azioni principali (Crea Task, Salva)
- `ghost`: Azioni secondarie (Annulla, Chiudi)

#### Form States
```typescript
interface FormState {
  isValid: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
  isSubmitting: boolean;
}
```

### Checklist Pre-Modifica

#### ⚠️ OBBLIGATORIO prima di ogni modifica:
1. **Props Consistency**: Verificare interfacce props
2. **State Management**: Controllare dipendenze store
3. **Error Handling**: Implementare gestione errori
4. **Type Safety**: Validare tipi TypeScript
5. **ADHD UX**: Considerare impatto cognitivo
6. **Testing**: Aggiungere test per nuove funzionalità

#### Pattern di Riferimento Comuni:

**Callback Pattern**:
```typescript
interface ComponentProps {
  onSuccess: (data: T) => void;
  onError: (error: Error) => void;
  onCancel?: () => void;
}
```

**Loading States**:
```typescript
const [isLoading, setIsLoading] = useState(false);
const handleAction = async () => {
  setIsLoading(true);
  try {
    await action();
  } finally {
    setIsLoading(false);
  }
};
```

**Error Boundaries**:
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

### File Critici da Non Modificare Senza Attenzione

1. **`src/integrations/supabase/`** - Configurazione database
2. **`src/store/taskStore.ts`** - State management centrale
3. **`src/types/`** - Definizioni TypeScript core
4. **`src/hooks/useAuth.tsx`** - Autenticazione
5. **`src/components/TaskManager.tsx`** - Componente monolitico (1396 righe)

### Errori Comuni da Evitare

1. **Parametri undefined in hook Supabase** (causa 400 Bad Request)
2. **Props drilling eccessivo** (usare context o store)
3. **Mancanza di loading states** (UX ADHD critica)
4. **Validazione input insufficiente** (sicurezza)
5. **State mutations dirette** (usare immutable updates)
6. **Missing error boundaries** (crash dell'app)
7. **Inconsistent naming conventions** (confusione)

---

**🎯 Questo RAG è la fonte di verità per tutto il progetto Tsunami. Aggiornalo sempre quando aggiungi nuove feature o risolvi problemi!**