# 🏗️ TYPES REFERENCE - Tsunami

**Status**: Golden  
**Versione**: 1.0  
**Data**: 2025-01-21  
**Scopo**: Definizioni consolidate di tutti i tipi ed enum del progetto  

---

## 🎯 DATABASE ENUMS (Authoritative Source)

### Core Business Logic Enums
```sql
-- Archetipi ADHD per personalizzazione UX
CREATE TYPE archetype_type AS ENUM (
  'visionario',    -- Grandi idee, visione d'insieme
  'costruttore',   -- Implementazione pratica, step-by-step
  'sognatore',     -- Creatività, brainstorming
  'silenzioso',    -- Riflessione, analisi profonda
  'combattente'    -- Azione diretta, problem solving
);

-- Livelli di energia per task matching
CREATE TYPE energy_level AS ENUM (
  'molto_bassa',   -- Energia minima, task semplici
  'bassa',         -- Energia ridotta, task leggeri
  'media',         -- Energia normale, task standard
  'alta',          -- Energia elevata, task complessi
  'molto_alta'     -- Energia massima, task sfidanti
);

-- Tipologie di task per categorizzazione
CREATE TYPE task_type AS ENUM (
  'azione',        -- Task pratici, implementazione
  'riflessione',   -- Task di analisi, pianificazione
  'comunicazione', -- Task sociali, interazione
  'creativita',    -- Task creativi, brainstorming
  'organizzazione' -- Task di strutturazione, cleanup
);

-- Stati dell'umore giornaliero
CREATE TYPE daily_mood AS ENUM (
  'congelato',     -- Blocco mentale, difficoltà a iniziare
  'disorientato',  -- Confusione, mancanza di focus
  'in_flusso',     -- Stato di flow, produttività alta
  'ispirato'       -- Creatività elevata, motivazione alta
);
```

---

## 🔧 TYPESCRIPT INTERFACES

### Task System Types
```typescript
// Definizione principale del task
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  
  // ADHD-specific fields
  energy_required: 'molto_bassa' | 'bassa' | 'media' | 'alta' | 'molto_alta';
  task_type: 'azione' | 'riflessione' | 'comunicazione' | 'creativita' | 'organizzazione';
  archetype: 'visionario' | 'costruttore' | 'sognatore' | 'silenzioso' | 'combattente';
  
  // XP System
  xp_reward?: number;
  completion_time?: number;
  
  // Hierarchy
  parent_task_id?: string;
  subtasks?: Task[];
}

// Filtri per task
interface TaskFilters {
  status?: Task['status'][];
  priority?: Task['priority'][];
  task_type?: Task['task_type'][];
  energy_required?: Task['energy_required'][];
  archetype?: Task['archetype'][];
  due_date_range?: {
    start?: string;
    end?: string;
  };
}

// Dati per creazione task
interface CreateTaskData {
  title: string;
  description?: string;
  priority: Task['priority'];
  due_date?: string;
  energy_required: Task['energy_required'];
  task_type: Task['task_type'];
  archetype: Task['archetype'];
  parent_task_id?: string;
}
```

### Profile & User Types
```typescript
// Profilo utente ADHD
interface Profile {
  id: string;
  user_id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  
  // ADHD Configuration
  dominant_archetype: 'visionario' | 'costruttore' | 'sognatore' | 'silenzioso' | 'combattente';
  energy_patterns?: Record<string, number>;
  preferred_task_types?: Task['task_type'][];
  
  // XP System
  total_xp: number;
  current_level: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Mood tracking
interface DailyMood {
  id: string;
  user_id: string;
  date: string;
  mood: 'congelato' | 'disorientato' | 'in_flusso' | 'ispirato';
  energy_level: number; // 1-10 scale
  notes?: string;
  created_at: string;
}
```

### ADHD-Specific Types
```typescript
// Archetipi con caratteristiche
interface ArchetypeConfig {
  id: 'visionario' | 'costruttore' | 'sognatore' | 'silenzioso' | 'combattente';
  name: string;
  description: string;
  strengths: string[];
  challenges: string[];
  preferredTaskTypes: Task['task_type'][];
  optimalEnergyLevels: Task['energy_required'][];
  cognitiveLoadTolerance: 'low' | 'medium' | 'high';
}

// Tema mood-based
interface MoodTheme {
  mood: DailyMood['mood'];
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  description: string;
}

// Configurazione accessibilità
interface AccessibilityConfig {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  focusIndicators: boolean;
  cognitiveLoadReduction: boolean;
}
```

### UI Component Types
```typescript
// Notifiche ADHD-friendly
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actionable?: {
    label: string;
    action: () => void;
  };
}

// Props per timer Pomodoro
interface PomodoroTimerProps {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  onSessionComplete: (type: 'work' | 'break' | 'longBreak') => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

// Messaggio chat
interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  metadata?: {
    taskId?: string;
    actionType?: string;
    confidence?: number;
  };
}

// Azione rapida
interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  archetype?: Task['archetype'][];
  energyLevel?: Task['energy_required'][];
}
```

---

## 🎨 THEME & STYLING TYPES

### Color System
```typescript
// Sistema colori basato su archetipi
interface ArchetypeColors {
  visionario: {
    primary: '#8B5CF6';    // Purple - visione e innovazione
    secondary: '#A78BFA';
    accent: '#C4B5FD';
  };
  costruttore: {
    primary: '#059669';    // Green - crescita e costruzione
    secondary: '#10B981';
    accent: '#6EE7B7';
  };
  sognatore: {
    primary: '#EC4899';    // Pink - creatività e sogni
    secondary: '#F472B6';
    accent: '#FBCFE8';
  };
  silenzioso: {
    primary: '#6366F1';    // Indigo - riflessione e profondità
    secondary: '#818CF8';
    accent: '#C7D2FE';
  };
  combattente: {
    primary: '#DC2626';    // Red - azione e determinazione
    secondary: '#EF4444';
    accent: '#FCA5A5';
  };
}

// Tema mood-based
interface MoodColors {
  congelato: {
    primary: '#64748B';    // Slate - calma e pausa
    background: '#F8FAFC';
  };
  disorientato: {
    primary: '#F59E0B';    // Amber - attenzione e focus
    background: '#FFFBEB';
  };
  in_flusso: {
    primary: '#10B981';    // Emerald - energia e flow
    background: '#ECFDF5';
  };
  ispirato: {
    primary: '#8B5CF6';    // Purple - creatività e ispirazione
    background: '#FAF5FF';
  };
}
```

---

## 🔄 VALIDATION SCHEMAS

### Zod Schemas per Runtime Validation
```typescript
import { z } from 'zod';

// Schema per archetype_type
export const ArchetypeSchema = z.enum([
  'visionario',
  'costruttore', 
  'sognatore',
  'silenzioso',
  'combattente'
]);

// Schema per energy_level
export const EnergyLevelSchema = z.enum([
  'molto_bassa',
  'bassa',
  'media',
  'alta',
  'molto_alta'
]);

// Schema per task_type
export const TaskTypeSchema = z.enum([
  'azione',
  'riflessione',
  'comunicazione',
  'creativita',
  'organizzazione'
]);

// Schema per daily_mood
export const DailyMoodSchema = z.enum([
  'congelato',
  'disorientato',
  'in_flusso',
  'ispirato'
]);

// Schema completo per Task
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().datetime().optional(),
  energy_required: EnergyLevelSchema,
  task_type: TaskTypeSchema,
  archetype: ArchetypeSchema,
  user_id: z.string().uuid(),
  parent_task_id: z.string().uuid().optional(),
  xp_reward: z.number().min(0).max(1000).optional(),
  completion_time: z.number().min(0).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});
```

---

## 📊 CONSTANTS & MAPPINGS

### Business Logic Constants
```typescript
// Moltiplicatori XP per tipo di task
export const XP_TYPE_MULTIPLIERS: Record<Task['task_type'], number> = {
  'azione': 1.0,
  'riflessione': 1.2,
  'comunicazione': 1.1,
  'creativita': 1.3,
  'organizzazione': 0.9
};

// Moltiplicatori XP per livello energia
export const XP_ENERGY_MULTIPLIERS: Record<Task['energy_required'], number> = {
  'molto_bassa': 0.5,
  'bassa': 0.7,
  'media': 1.0,
  'alta': 1.3,
  'molto_alta': 1.5
};

// Mapping archetipi -> task types preferiti
export const ARCHETYPE_TASK_PREFERENCES: Record<Task['archetype'], Task['task_type'][]> = {
  'visionario': ['creativita', 'riflessione'],
  'costruttore': ['azione', 'organizzazione'],
  'sognatore': ['creativita', 'riflessione'],
  'silenzioso': ['riflessione', 'organizzazione'],
  'combattente': ['azione', 'comunicazione']
};

// Mapping mood -> energy levels suggeriti
export const MOOD_ENERGY_MAPPING: Record<DailyMood['mood'], Task['energy_required'][]> = {
  'congelato': ['molto_bassa', 'bassa'],
  'disorientato': ['bassa', 'media'],
  'in_flusso': ['media', 'alta'],
  'ispirato': ['alta', 'molto_alta']
};
```

---

## 🎯 USAGE GUIDELINES

### Type Safety Best Practices
1. **Always use TypeScript types** - Mai usare `any`
2. **Validate at boundaries** - Usa Zod schemas per API input/output
3. **Consistent naming** - Segui convenzioni database per enum values
4. **Null safety** - Gestisci sempre optional fields
5. **Generic constraints** - Usa type constraints per funzioni generiche

### Integration Points
- **Database**: Enum values devono matchare esattamente
- **API**: Usa Zod schemas per validation
- **UI**: Type-safe props per tutti i componenti
- **Store**: State tipizzato con TypeScript strict mode

### Performance Considerations
- **Enum lookups**: Usa Record types per mapping veloci
- **Type guards**: Implementa type guards per runtime checks
- **Lazy loading**: Carica types solo quando necessari
- **Bundle size**: Evita type bloat in production

---

**🎯 Questo file è la fonte autorevole per tutti i tipi del progetto. Ogni modifica deve essere sincronizzata con database schema e codice TypeScript.**