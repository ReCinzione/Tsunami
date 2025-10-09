# 🏗️ TSUNAMI Frontend Refactoring Plan

## 🚨 **AGGIORNAMENTO POST-BUG FIX** (2025-01-21)

### ✅ **Correzioni Critiche Applicate**
- **Bug Supabase risolto**: Parametri `undefined` in `useTaskStats` (TaskManager.tsx)
- **Stabilità migliorata**: Eliminato errore `400 Bad Request` critico
- **Priorità aggiornate**: Focus su error handling e type safety

## 📋 Analisi Situazione Attuale

### Problemi Identificati - PRIORITÀ AGGIORNATE
1. **🔥 CRITICO - Error Handling**: Mancanza di gestione errori centralizzata (causa bug Supabase)
2. **🔥 CRITICO - Type Safety**: Chiamate hook con parametri errati non rilevate
3. **TaskManager monolitico** (1396 righe) - mescola logica di business, UI e state management
4. **Prop drilling** - passaggio di props attraverso multipli livelli
5. **Hook monolitici** - usePatternMining gestisce troppi side effects
6. **Mancanza di lazy loading** - tutte le pagine caricate insieme
7. **Performance non ottimizzata** - mancano React.memo, useMemo, useCallback
8. **State management frammentato** - useState sparsi senza coordinamento

## 🎯 Obiettivi di Refactoring - PRIORITÀ AGGIORNATE

### 🔥 **PRIORITÀ CRITICA - Stabilità e Type Safety**
- **Error Handling Centralizzato**: Prevenire bug critici come quello Supabase
- **Type Safety Rigorosa**: TypeScript strict mode e validazione parametri
- **Service Layer Robusto**: Retry logic, circuit breaker, fallback
- **Logging e Monitoring**: Tracciamento errori e performance

### 1. Modularità e Separazione delle Responsabilità
- Separare container e presentational components
- Creare custom hooks specifici per dominio
- Implementare error boundary e error handling centralizzato
- **NUOVO**: Validazione parametri negli hooks

### 2. Performance e UX
- Lazy loading per route e componenti pesanti
- Virtual scrolling per liste lunghe
- Ottimizzazioni React (memo, useMemo, useCallback)
- Focus mode e UI ADHD-friendly
- **NUOVO**: Micro-feedback e loading states pervasivi

### 3. State Management
- Valutare migrazione a Zustand per state globale
- Modularizzare state per dominio (tasks, routines, gamification)
- Migliorare integrazione con TanStack Query
- **NUOVO**: Selettori memoizzati e middleware per persistenza

## 📁 Nuova Struttura Proposta

```
src/
├── components/
│   ├── common/           # Componenti riutilizzabili
│   ├── layout/           # Layout e navigazione
│   └── ui/               # Design system (esistente)
├── features/             # Feature-based organization
│   ├── tasks/
│   │   ├── components/   # TaskList, TaskItem, TaskForm
│   │   ├── containers/   # TaskListContainer
│   │   ├── hooks/        # useTasks, useTaskMutations
│   │   ├── services/     # taskService
│   │   └── types/        # task-specific types
│   ├── routines/
│   ├── gamification/
│   ├── mental-inbox/
│   └── patterns/
├── hooks/
│   ├── common/           # useErrorHandler, useLocalStorage
│   └── api/              # API-specific hooks
├── services/             # API services
├── store/                # State management (Zustand)
├── utils/
└── types/
```

## 🔧 Piano di Implementazione - AGGIORNATO

### 🚨 **Fase 0: Stabilizzazione Critica (IMMEDIATA)**

#### 0.1 Error Handling Centralizzato
```typescript
// components/ErrorBoundary.tsx - PRIORITÀ MASSIMA
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log centralizzato per debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Report per monitoring (future)
    // errorReportingService.report(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Oops! Qualcosa è andato storto</h2>
          <p>Non preoccuparti, i tuoi dati sono al sicuro.</p>
          <button onClick={() => window.location.reload()}>
            Ricarica la pagina
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

#### 0.2 Hook Parameter Validation
```typescript
// hooks/common/useParameterValidation.ts
export const useParameterValidation = () => {
  const validateHookParams = useCallback((hookName: string, params: any, schema: any) => {
    try {
      // Validazione runtime dei parametri
      if (params === undefined && schema.required) {
        throw new Error(`${hookName}: Required parameter is undefined`);
      }
      return true;
    } catch (error) {
      console.error(`Parameter validation failed for ${hookName}:`, error);
      throw error;
    }
  }, []);
  
  return { validateHookParams };
};

// Esempio di uso in useTaskStats
export const useTaskStats = (dateRange?: DateRange) => {
  const { validateHookParams } = useParameterValidation();
  
  // Validazione parametri prima dell'uso
  useEffect(() => {
    if (dateRange !== undefined) {
      validateHookParams('useTaskStats', dateRange, {
        from: { required: true, type: 'string' },
        to: { required: true, type: 'string' }
      });
    }
  }, [dateRange, validateHookParams]);
  
  return useQuery({
    queryKey: ['taskStats', dateRange],
    queryFn: () => taskService.getTaskStats(user.id, dateRange),
    enabled: !!user.id
  });
};
```

### Fase 1: Refactoring TaskManager (Priorità Alta)

#### 1.1 Separazione Container/Presentational
```typescript
// features/tasks/containers/TaskListContainer.tsx
export const TaskListContainer = () => {
  const { tasks, loading, error } = useTasks();
  const { createTask, updateTask, deleteTask } = useTaskMutations();
  
  return (
    <TaskListView
      tasks={tasks}
      loading={loading}
      error={error}
      onCreateTask={createTask}
      onUpdateTask={updateTask}
      onDeleteTask={deleteTask}
    />
  );
};

// features/tasks/components/TaskListView.tsx
export const TaskListView = React.memo(({ tasks, loading, error, ...handlers }) => {
  // Solo UI, nessuna logica di business
});
```

#### 1.2 Custom Hooks Specifici
```typescript
// features/tasks/hooks/useTasks.ts
export const useTasks = (filters?: TaskFilters) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskService.getTasks(filters),
    staleTime: 5 * 60 * 1000, // 5 minuti
  });
};

// features/tasks/hooks/useTaskMutations.ts
export const useTaskMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  
  const createTask = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast({ title: "Task creato con successo" });
    },
    onError: handleError,
  });
  
  return { createTask, updateTask, deleteTask };
};
```

### Fase 2: Error Handling Centralizzato

```typescript
// hooks/common/useErrorHandler.ts
export const useErrorHandler = () => {
  const { toast } = useToast();
  
  const handleError = useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context}:`, error);
    
    // Messaggi gentili per ADHD
    const friendlyMessage = getFriendlyErrorMessage(error);
    
    toast({
      title: "Qualcosa è andato storto",
      description: friendlyMessage,
      variant: "destructive",
      action: <Button onClick={() => window.location.reload()}>Riprova</Button>
    });
  }, [toast]);
  
  return { handleError };
};
```

### Fase 3: Performance Optimizations

#### 3.1 Lazy Loading
```typescript
// App.tsx
const ArchetypesPage = lazy(() => import('./pages/ArchetypesPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const RoutinesPage = lazy(() => import('./pages/RoutinesPage'));

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route path="/personalita" element={<ArchetypesPage />} />
      {/* ... */}
    </Routes>
  </Suspense>
);
```

#### 3.2 Virtual Scrolling per Task List
```typescript
// features/tasks/components/VirtualTaskList.tsx
import { FixedSizeList as List } from 'react-window';

export const VirtualTaskList = React.memo(({ tasks, onTaskClick }) => {
  const Row = useCallback(({ index, style }) => (
    <div style={style}>
      <TaskItem task={tasks[index]} onClick={onTaskClick} />
    </div>
  ), [tasks, onTaskClick]);
  
  return (
    <List
      height={600}
      itemCount={tasks.length}
      itemSize={80}
      itemData={tasks}
    >
      {Row}
    </List>
  );
});
```

### Fase 4: State Management con Zustand

```typescript
// store/taskStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TaskState {
  tasks: Task[];
  focusMode: boolean;
  focusTaskCount: number;
  setTasks: (tasks: Task[]) => void;
  toggleFocusMode: () => void;
  setFocusTaskCount: (count: number) => void;
}

export const useTaskStore = create<TaskState>()(devtools((set) => ({
  tasks: [],
  focusMode: false,
  focusTaskCount: 3,
  setTasks: (tasks) => set({ tasks }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  setFocusTaskCount: (count) => set({ focusTaskCount: count }),
})));
```

### Fase 5: UI/UX ADHD-Friendly

#### 5.1 Focus Mode Component
```typescript
// components/common/FocusMode.tsx
export const FocusMode = ({ children, isActive }) => {
  return (
    <div className={cn(
      "transition-all duration-300",
      isActive && "bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
    )}>
      {isActive && (
        <div className="fixed top-4 right-4 z-50">
          <Badge variant="secondary" className="animate-pulse">
            🎯 Modalità Focus Attiva
          </Badge>
        </div>
      )}
      <div className={cn(
        "transition-all duration-300",
        isActive && "max-w-4xl mx-auto px-4"
      )}>
        {children}
      </div>
    </div>
  );
};
```

#### 5.2 Gentle Error Messages
```typescript
// utils/friendlyMessages.ts
export const getFriendlyErrorMessage = (error: Error): string => {
  const messages = {
    network: "Sembra che ci sia un problema di connessione. Nessun problema, riprova tra un momento! 🌐",
    validation: "Alcuni dettagli hanno bisogno di essere sistemati. Dai un'occhiata e riprova! ✨",
    server: "I nostri server stanno facendo una pausa. Torna tra qualche minuto! ☕",
    default: "Qualcosa è andato storto, ma non è colpa tua! Proviamo di nuovo insieme. 💪"
  };
  
  // Logic to categorize error types
  return messages.default;
};
```

### Fase 6: Testing Strategy

```typescript
// features/tasks/components/__tests__/TaskListView.test.tsx
import { render, screen } from '@testing-library/react';
import { TaskListView } from '../TaskListView';

describe('TaskListView', () => {
  it('renders empty state when no tasks', () => {
    render(<TaskListView tasks={[]} loading={false} error={null} />);
    expect(screen.getByText(/nessun task/i)).toBeInTheDocument();
  });
  
  it('shows loading spinner when loading', () => {
    render(<TaskListView tasks={[]} loading={true} error={null} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

## 📊 Metriche di Successo

### Performance
- [ ] Riduzione bundle size del 20%
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1

### Code Quality
- [ ] Test coverage ≥ 80% sui moduli core
- [ ] Riduzione complessità ciclomatica
- [ ] Zero prop drilling > 3 livelli
- [ ] Tutti i componenti < 200 righe

### UX ADHD-Friendly
- [ ] Tempo di risposta UI < 100ms
- [ ] Feedback visivo su ogni azione
- [ ] Modalità focus implementata
- [ ] Messaggi di errore gentili
- [ ] Accessibilità WCAG 2.1 AA

## 🚀 Timeline di Implementazione

### Settimana 1-2: Fase 1 (TaskManager Refactoring)
- Separazione container/presentational
- Custom hooks specifici
- Testing dei nuovi componenti

### Settimana 3: Fase 2 (Error Handling)
- useErrorHandler centralizzato
- Messaggi gentili
- Error boundaries

### Settimana 4: Fase 3 (Performance)
- Lazy loading
- React.memo ottimizzazioni
- Virtual scrolling

### Settimana 5: Fase 4 (State Management)
- Setup Zustand
- Migrazione state critico
- Testing integrazione

### Settimana 6: Fase 5-6 (UX e Testing)
- Focus mode
- UI improvements
- Test suite completa

## 📝 Note di Implementazione

1. **Backward Compatibility**: Mantenere API esistenti durante la transizione
2. **Gradual Migration**: Implementare feature per feature, non tutto insieme
3. **User Feedback**: Testare ogni fase con utenti ADHD reali
4. **Documentation**: Aggiornare documentazione ad ogni fase
5. **Performance Monitoring**: Monitorare metriche durante tutto il processo

Questo piano garantisce un refactoring sistematico che migliora modularità, performance e UX mantenendo la stabilità del sistema esistente.