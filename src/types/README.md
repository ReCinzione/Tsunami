# 🏗️ TypeScript Types per TSUNAMI ADHD App

Questa directory contiene le definizioni dei tipi TypeScript centralizzate per garantire type safety e consistenza nell'applicazione.

## 📁 Struttura Files

### `chatbot.ts`
**Scopo**: Tipi per funzionalità del chatbot e interazioni utente

#### **Interfacce Principali**

```typescript
// Messaggio di chat con metadati
interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  mood?: MoodType;
  quickActions?: QuickAction[];
  metadata?: Record<string, any>;
}

// Azione rapida interattiva
interface QuickAction {
  id: string;
  label: string;
  action: ChatbotAction;
  icon?: string;
  priority: 'high' | 'medium' | 'low';
}

// Contesto conversazione per continuità
interface ConversationContext {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  topics: string[];
  currentMood?: MoodType;
  energyLevel?: EnergyLevel;
}
```

#### **Tipi Enumerativi**

```typescript
// Azioni possibili del chatbot
type ChatbotAction = 
  | 'create_task' 
  | 'set_reminder' 
  | 'start_focus_session'
  | 'take_break' 
  | 'mood_check' 
  | 'show_calendar'
  | 'open_mental_inbox';

// Intenti riconosciuti nei messaggi
type MessageIntent = 
  | 'greeting' 
  | 'task_help' 
  | 'emotional_support'
  | 'focus_help' 
  | 'overwhelm_help' 
  | 'break_suggestion'
  | 'list_creation';
```

### `adhd.ts`
**Scopo**: Tipi specializzati per gestione ADHD e task management

#### **Interfacce Core**

```typescript
// Task con metadati ADHD-specifici
interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedDuration?: number;
  energyRequired: EnergyLevel;
  focusRequired: 'low' | 'medium' | 'high';
  deadline?: Date;
  tags: string[];
  moodBoost?: number; // 1-10
  overwhelmRisk?: number; // 1-10
}

// Profilo ADHD personalizzato
interface ADHDProfile {
  userId: string;
  diagnosis: {
    type: 'inattentive' | 'hyperactive' | 'combined';
    severity: 'mild' | 'moderate' | 'severe';
    diagnosisDate?: Date;
  };
  challenges: ADHDChallenge[];
  strengths: string[];
  copingStrategies: CopingStrategy[];
  medications?: MedicationSchedule[];
  energyPatterns: EnergyPattern[];
  preferences: {
    focus: FocusPreferences;
    sensory: SensoryPreferences;
    communication: 'direct' | 'gentle' | 'encouraging';
  };
}
```

#### **Pattern Comportamentali**

```typescript
// Pattern energia giornaliera
interface EnergyPattern {
  timeOfDay: string; // "09:00"
  averageEnergy: EnergyLevel;
  focusQuality: 'poor' | 'fair' | 'good' | 'excellent';
  bestFor: TaskType[];
  notes?: string;
}

// Sessione di focus tracking
interface FocusSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  plannedDuration: number;
  actualDuration?: number;
  taskId?: string;
  interruptions: Interruption[];
  productivity: 1 | 2 | 3 | 4 | 5;
  mood: {
    before: MoodType;
    after?: MoodType;
  };
}
```

#### **Tipi Specializzati**

```typescript
// Tipi di task ottimizzati per ADHD
type TaskType = 
  | 'creative' 
  | 'analytical' 
  | 'routine' 
  | 'physical' 
  | 'social' 
  | 'learning';

// Livelli energia per matching task
type EnergyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Stati umore specifici ADHD
type MoodType = 
  | 'congelato' 
  | 'disorientato' 
  | 'in_flusso' 
  | 'ispirato' 
  | 'sopraffatto' 
  | 'iperfocus';
```

## 🎯 Vantaggi Type Safety

### 1. **Prevenzione Errori**
- Errori rilevati a compile-time
- IntelliSense migliorato
- Refactoring sicuro

### 2. **Documentazione Vivente**
- Tipi come documentazione del codice
- Contratti chiari tra componenti
- Onboarding sviluppatori facilitato

### 3. **Manutenibilità**
- Modifiche propagate automaticamente
- Breaking changes evidenziati
- Evoluzione controllata API

### 4. **Performance**
- Ottimizzazioni TypeScript compiler
- Tree shaking più efficace
- Bundle size ottimizzato

## 🔧 Utilizzo Pratico

### Importazione Tipi
```typescript
// Import specifici
import type { ChatMessage, QuickAction } from '@/types/chatbot';
import type { Task, ADHDProfile } from '@/types/adhd';

// Import multipli
import type {
  MoodType,
  EnergyLevel,
  TaskType
} from '@/types/adhd';
```

### Type Guards
```typescript
// Verifica tipo runtime
function isChatMessage(obj: any): obj is ChatMessage {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.text === 'string' &&
    ['user', 'bot'].includes(obj.sender);
}

// Uso con type narrowing
if (isChatMessage(data)) {
  // TypeScript sa che data è ChatMessage
  console.log(data.timestamp);
}
```

### Utility Types
```typescript
// Partial per aggiornamenti
type TaskUpdate = Partial<Pick<Task, 'title' | 'description' | 'priority'>>;

// Omit per creazione
type NewTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

// Union discriminata
type TaskAction = 
  | { type: 'CREATE'; payload: NewTask }
  | { type: 'UPDATE'; payload: { id: string; updates: TaskUpdate } }
  | { type: 'DELETE'; payload: { id: string } };
```

## 🚀 Best Practices

### 1. **Naming Conventions**
- Interfacce: PascalCase (`ChatMessage`)
- Tipi: PascalCase (`MoodType`)
- Proprietà: camelCase (`energyLevel`)
- Costanti: UPPER_SNAKE_CASE (`MAX_TASKS`)

### 2. **Organizzazione**
- Un file per dominio logico
- Export named per riusabilità
- Documentazione JSDoc per tipi complessi

### 3. **Evoluzione**
- Versioning per breaking changes
- Deprecation warnings per transizioni
- Migration guides per aggiornamenti

## 🔄 Roadmap Tipi

### Fase 1 ✅ (Completata)
- Tipi base chatbot e ADHD
- Interfacce core task management
- Enumerazioni stati e azioni

### Fase 2 🚧 (In Corso)
- Tipi per analytics e metriche
- Interfacce integrazione calendar
- Tipi per preferenze utente avanzate

### Fase 3 📋 (Pianificata)
- Tipi per machine learning
- Interfacce wearables integration
- Tipi per team collaboration

## 📚 Riferimenti

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Utility Types Reference](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [ADHD Research Types](../docs/ADHD_RESEARCH.md)
- [API Documentation](../docs/API.md)