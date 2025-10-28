# 🎯 Development Best Practices - Tsunami ADHD App

**Versione**: 1.0  
**Data**: 21 Gennaio 2025  
**Scopo**: Linee guida per sviluppo sicuro, performante e maintainabile

---

## 📋 Indice

1. [🔒 Sicurezza](#-sicurezza)
2. [⚡ Performance](#-performance)
3. [🎨 UI/UX Guidelines](#-uiux-guidelines)
4. [🔄 State Management](#-state-management)
5. [🧪 Testing](#-testing)
6. [📱 Responsive Design](#-responsive-design)
7. [♿ Accessibilità](#-accessibilità)
8. [🚨 Error Handling](#-error-handling)
9. [📊 Monitoring](#-monitoring)
10. [🔧 Code Quality](#-code-quality)

---

## 🔒 Sicurezza

### Input Validation

```typescript
// ✅ CORRETTO: Validazione completa
interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
}

const validateTaskInput = (input: CreateTaskInput): string[] => {
  const errors: string[] = [];
  
  if (!input.title?.trim()) {
    errors.push('Titolo richiesto');
  }
  
  if (input.title && input.title.length > 500) {
    errors.push('Titolo troppo lungo (max 500 caratteri)');
  }
  
  if (input.description && input.description.length > 2000) {
    errors.push('Descrizione troppo lunga (max 2000 caratteri)');
  }
  
  const validPriorities = ['low', 'medium', 'high'];
  if (input.priority && !validPriorities.includes(input.priority)) {
    errors.push('Priorità non valida');
  }
  
  return errors;
};

const createTask = async (input: CreateTaskInput) => {
  const errors = validateTaskInput(input);
  if (errors.length > 0) {
    throw new Error(`Errori di validazione: ${errors.join(', ')}`);
  }
  
  // Sanitizzazione
  const sanitizedInput = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    priority: input.priority || 'medium'
  };
  
  const { data, error } = await supabase
    .from('tasks')
    .insert(sanitizedInput);
    
  if (error) throw error;
  return data;
};
```

### RLS Policies

```sql
-- ✅ CORRETTO: Policy sicura per tasks
CREATE POLICY "Users can only see their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- ✅ CORRETTO: Policy per inserimento
CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ❌ SBAGLIATO: Policy troppo permissiva
CREATE POLICY "Allow all" ON tasks
  FOR ALL USING (true); -- PERICOLOSO!
```

### Environment Variables

```typescript
// ✅ CORRETTO: Validazione env vars
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
] as const;

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(
    key => !import.meta.env[key]
  );
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

// Chiama all'avvio dell'app
validateEnvironment();
```

---

## ⚡ Performance

### Database Queries

```typescript
// ✅ CORRETTO: Query ottimizzata
const fetchTasks = async (userId: string, page = 0, limit = 20) => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      completed,
      priority,
      created_at
    `) // Solo campi necessari
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);
    
  if (error) throw error;
  return data;
};

// ❌ SBAGLIATO: Query inefficiente
const fetchAllTasks = async () => {
  const { data } = await supabase
    .from('tasks')
    .select('*'); // Tutti i campi, tutti gli utenti
  return data;
};
```

### React Query Optimization

```typescript
// ✅ CORRETTO: Configurazione ottimizzata
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minuti
      cacheTime: 10 * 60 * 1000, // 10 minuti
      retry: (failureCount, error) => {
        // Non retry per errori 4xx
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
  },
});

// ✅ CORRETTO: Prefetching intelligente
const useTasks = (userId: string) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['tasks', userId],
    queryFn: () => fetchTasks(userId),
    onSuccess: (data) => {
      // Prefetch task details per le prime 5 task
      data.slice(0, 5).forEach(task => {
        queryClient.prefetchQuery({
          queryKey: ['task', task.id],
          queryFn: () => fetchTaskDetails(task.id),
        });
      });
    },
  });
};
```

### Code Splitting

```typescript
// ✅ CORRETTO: Lazy loading componenti
import { lazy, Suspense } from 'react';

const TaskManager = lazy(() => import('./components/TaskManager'));
const MentalInbox = lazy(() => import('./components/MentalInbox'));
const ArchetypeTest = lazy(() => import('./components/ArchetypeTest'));

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/tasks" element={
          <Suspense fallback={<TasksSkeleton />}>
            <TaskManager />
          </Suspense>
        } />
        <Route path="/inbox" element={
          <Suspense fallback={<InboxSkeleton />}>
            <MentalInbox />
          </Suspense>
        } />
      </Routes>
    </Router>
  );
};
```

---

## 🎨 UI/UX Guidelines

### Loading States

```typescript
// ✅ CORRETTO: Loading states informativi
const TaskList = () => {
  const { data: tasks, isLoading, error } = useTasks();
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Errore nel caricamento delle task</p>
        <button 
          onClick={() => refetch()}
          className="btn btn-primary"
        >
          Riprova
        </button>
      </div>
    );
  }
  
  return (
    <div>
      {tasks?.map(task => <TaskItem key={task.id} task={task} />)}
    </div>
  );
};
```

### ADHD-Friendly Design

```typescript
// ✅ CORRETTO: Design per ADHD
const TaskItem = ({ task }: { task: Task }) => {
  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all duration-200",
      "hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500",
      // Colori basati su priorità per visual cues
      task.priority === 'high' && "border-red-200 bg-red-50",
      task.priority === 'medium' && "border-yellow-200 bg-yellow-50",
      task.priority === 'low' && "border-green-200 bg-green-50",
      task.completed && "opacity-60 line-through"
    )}>
      <div className="flex items-center gap-3">
        {/* Checkbox grande per facilità di click */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => toggleTask(task.id)}
          className="w-5 h-5 rounded focus:ring-2 focus:ring-blue-500"
          aria-label={`Segna come ${task.completed ? 'non completata' : 'completata'}`}
        />
        
        {/* Testo con contrasto alto */}
        <span className="text-gray-900 font-medium">
          {task.title}
        </span>
        
        {/* Visual indicator per urgenza */}
        {task.priority === 'high' && (
          <span className="text-red-500 text-sm font-bold">!</span>
        )}
      </div>
    </div>
  );
};
```

---

## 🔄 State Management

### Optimistic Updates

```typescript
// ✅ CORRETTO: Optimistic update con rollback
const useToggleTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', taskId);
        
      if (error) throw error;
    },
    
    onMutate: async ({ taskId, completed }) => {
      // Cancella query in corso
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      // Snapshot dello stato precedente
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      // Aggiorna ottimisticamente
      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
        return old?.map(task => 
          task.id === taskId 
            ? { ...task, completed }
            : task
        ) || [];
      });
      
      return { previousTasks };
    },
    
    onError: (err, variables, context) => {
      // Rollback in caso di errore
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      
      toast.error('Errore nell\'aggiornamento della task');
    },
    
    onSettled: () => {
      // Invalida e refetch per sincronizzare
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
```

---

## 🧪 Testing Strategy Completa

### Piramide di Testing

#### 1. Unit Tests (70%)
```typescript
// ✅ CORRETTO: Test completi
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { TaskItem } from './TaskItem';
import TaskForm from '../TaskForm';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('TaskItem', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    completed: false,
    priority: 'medium' as const,
    user_id: 'user-1',
    created_at: new Date().toISOString(),
  };
  
  it('renders task title correctly', () => {
    render(<TaskItem task={mockTask} />, { wrapper: createWrapper() });
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
  
  it('toggles task completion on checkbox click', async () => {
    const mockToggle = vi.fn();
    render(
      <TaskItem task={mockTask} onToggle={mockToggle} />, 
      { wrapper: createWrapper() }
    );
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledWith(mockTask.id, true);
    });
  });
  
  it('has proper accessibility attributes', () => {
    render(<TaskItem task={mockTask} />, { wrapper: createWrapper() });
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-label', expect.stringContaining('Segna come'));
  });
});

// Test TaskForm
const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should submit valid task data', async () => {
    render(
      <TaskForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );
    
    const titleInput = screen.getByLabelText(/titolo/i);
    const submitButton = screen.getByRole('button', { name: /salva/i });
    
    fireEvent.change(titleInput, { target: { value: 'Test Task' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Test Task',
        description: '',
        priority: 'medium'
      });
    });
  });

  it('should show validation errors', async () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const submitButton = screen.getByRole('button', { name: /salva/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/titolo richiesto/i)).toBeInTheDocument();
    });
  });
});
```

#### 2. Integration Tests (20%)
```typescript
// ✅ CORRETTO: Test di integrazione
import { renderHook, waitFor } from '@testing-library/react';
import { useTasks } from './useTasks';
import { createSupabaseMock } from '../test-utils/supabase-mock';

describe('useTasks Integration', () => {
  beforeEach(() => {
    createSupabaseMock();
  });
  
  it('fetches and caches tasks correctly', async () => {
    const { result } = renderHook(() => useTasks('user-1'), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data?.[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      user_id: 'user-1',
    });
  });
});

// Test integrazione TaskManager + TaskForm
describe('Task Management Integration', () => {
  it('should create task end-to-end', async () => {
    const { user } = renderWithProviders(<TaskManager />);
    
    // Apri form creazione
    await user.click(screen.getByText('Nuova Task'));
    
    // Compila form
    await user.type(screen.getByLabelText(/titolo/i), 'Integration Test Task');
    await user.selectOptions(screen.getByLabelText(/priorità/i), 'high');
    
    // Submit
    await user.click(screen.getByText('Salva'));
    
    // Verifica task creata
    await waitFor(() => {
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument();
    });
  });
});
```

#### 3. E2E Tests (10%)
```typescript
// Playwright E2E
import { test, expect } from '@playwright/test';

test('complete task workflow', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Login
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  
  // Crea task
  await page.click('[data-testid="new-task-button"]');
  await page.fill('[data-testid="task-title"]', 'E2E Test Task');
  await page.click('[data-testid="save-task"]');
  
  // Verifica task visibile
  await expect(page.locator('[data-testid="task-item"]')).toContainText('E2E Test Task');
});
```

### Test di Regressione

#### Visual Regression Testing
```typescript
// Chromatic per visual testing
import { Meta, StoryObj } from '@storybook/react';
import TaskForm from './TaskForm';

const meta: Meta<typeof TaskForm> = {
  title: 'Components/TaskForm',
  component: TaskForm,
  parameters: {
    chromatic: { 
      viewports: [320, 768, 1200],
      delay: 300
    }
  }
};

export const Default: StoryObj = {
  args: {
    onSubmit: () => {},
    onCancel: () => {}
  }
};

export const WithValidationErrors: StoryObj = {
  args: {
    ...Default.args,
    initialErrors: { title: 'Titolo richiesto' }
  }
};
```

#### Performance Testing
```typescript
// Performance benchmarks
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  it('should render TaskList under 100ms', async () => {
    const start = performance.now();
    
    render(<TaskList tasks={generateMockTasks(100)} />);
    
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });
  
  it('should handle 1000 tasks without memory leaks', () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    const { unmount } = render(<TaskList tasks={generateMockTasks(1000)} />);
    unmount();
    
    // Force garbage collection
    global.gc?.();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
  });
});
```

### Accessibility Testing
```typescript
// axe-core per a11y testing
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should support keyboard navigation', async () => {
    render(<TaskForm onSubmit={() => {}} onCancel={() => {}} />);
    
    const titleInput = screen.getByLabelText(/titolo/i);
    const submitButton = screen.getByRole('button', { name: /salva/i });
    
    // Tab navigation
    titleInput.focus();
    fireEvent.keyDown(titleInput, { key: 'Tab' });
    
    expect(submitButton).toHaveFocus();
  });
});
```

---

## 📱 Responsive Design

### Mobile-First Approach

```css
/* ✅ CORRETTO: Mobile-first CSS */
.task-grid {
  /* Mobile (default) */
  @apply grid grid-cols-1 gap-4 p-4;
}

/* Tablet */
@media (min-width: 768px) {
  .task-grid {
    @apply grid-cols-2 gap-6 p-6;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .task-grid {
    @apply grid-cols-3 gap-8 p-8;
  }
}

/* Large screens */
@media (min-width: 1280px) {
  .task-grid {
    @apply grid-cols-4;
  }
}
```

### Touch-Friendly Interactions

```typescript
// ✅ CORRETTO: Touch targets appropriati
const MobileTaskItem = ({ task }: { task: Task }) => {
  return (
    <div className="touch-manipulation">
      {/* Minimum 44px touch target */}
      <button
        className="min-h-[44px] min-w-[44px] p-3 rounded-lg"
        onClick={() => toggleTask(task.id)}
        aria-label={`Toggle ${task.title}`}
      >
        <CheckIcon className="w-6 h-6" />
      </button>
      
      {/* Swipe gestures per mobile */}
      <div 
        className="swipe-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {task.title}
      </div>
    </div>
  );
};
```

---

## ♿ Accessibilità

### ARIA Labels e Semantic HTML

```typescript
// ✅ CORRETTO: Accessibilità completa
const TaskForm = () => {
  const [title, setTitle] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  
  return (
    <form 
      onSubmit={handleSubmit}
      role="form"
      aria-labelledby="task-form-title"
    >
      <h2 id="task-form-title" className="sr-only">
        Crea nuova task
      </h2>
      
      <div className="form-group">
        <label 
          htmlFor="task-title"
          className="block text-sm font-medium text-gray-700"
        >
          Titolo della task *
        </label>
        
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-required="true"
          aria-invalid={errors.length > 0}
          aria-describedby={errors.length > 0 ? "task-title-error" : undefined}
          className={cn(
            "mt-1 block w-full rounded-md border-gray-300",
            "focus:border-blue-500 focus:ring-blue-500",
            errors.length > 0 && "border-red-500"
          )}
        />
        
        {errors.length > 0 && (
          <div 
            id="task-title-error" 
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.join(', ')}
          </div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={!title.trim()}
        aria-describedby="submit-help"
        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Crea Task
      </button>
      
      <div id="submit-help" className="sr-only">
        Premi Invio o clicca per creare la task
      </div>
    </form>
  );
};
```

### Keyboard Navigation

```typescript
// ✅ CORRETTO: Navigazione da tastiera
const TaskList = ({ tasks }: { tasks: Task[] }) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          Math.min(prev + 1, tasks.length - 1)
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggleTask(tasks[focusedIndex].id);
        break;
        
      case 'Delete':
        e.preventDefault();
        deleteTask(tasks[focusedIndex].id);
        break;
    }
  };
  
  return (
    <div 
      role="listbox"
      aria-label="Lista delle task"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {tasks.map((task, index) => (
        <div
          key={task.id}
          role="option"
          aria-selected={index === focusedIndex}
          className={cn(
            "task-item",
            index === focusedIndex && "bg-blue-50 ring-2 ring-blue-500"
          )}
        >
          {task.title}
        </div>
      ))}
    </div>
  );
};
```

---

## 🚨 Error Handling

### Error Boundaries

```typescript
// ✅ CORRETTO: Error Boundary completo
import { ErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) => {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Error Boundary caught:', error);
    
    if (import.meta.env.PROD) {
      // Send to Sentry or similar
      Sentry.captureException(error);
    }
  }, [error]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
          <h1 className="text-lg font-semibold text-gray-900">
            Oops! Qualcosa è andato storto
          </h1>
        </div>
        
        <p className="text-gray-600 mb-4">
          Si è verificato un errore inaspettato. Il nostro team è stato notificato.
        </p>
        
        {import.meta.env.DEV && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-gray-500">
              Dettagli tecnici (solo in sviluppo)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={resetErrorBoundary}
            className="btn btn-primary flex-1"
          >
            Riprova
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="btn btn-secondary flex-1"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Uso nell'app
const App = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('App Error:', error, errorInfo);
      }}
      onReset={() => {
        // Reset app state
        window.location.reload();
      }}
    >
      <Router>
        <Routes>
          {/* ... routes */}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};
```

### Graceful Error Handling

```typescript
// ✅ CORRETTO: Gestione errori graceful
const useTaskMutations = () => {
  const queryClient = useQueryClient();
  
  const createTask = useMutation({
    mutationFn: async (taskData: CreateTaskInput) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData);
        
      if (error) {
        // Categorizza gli errori
        if (error.code === '23505') {
          throw new Error('Una task con questo titolo esiste già');
        }
        
        if (error.code === 'PGRST116') {
          throw new Error('Non hai i permessi per creare questa task');
        }
        
        // Errore generico
        throw new Error('Errore nella creazione della task. Riprova.');
      }
      
      return data;
    },
    
    onError: (error) => {
      // Toast user-friendly
      toast.error(error.message);
      
      // Log per debugging
      console.error('Create task error:', error);
    },
    
    onSuccess: () => {
      toast.success('Task creata con successo!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
  
  return { createTask };
};
```

---

## 📊 Monitoring

### Performance Monitoring

```typescript
// ✅ CORRETTO: Performance tracking
const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
    
    // Custom metrics
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.log('Page Load Time:', navEntry.loadEventEnd - navEntry.fetchStart);
        }
        
        if (entry.entryType === 'measure') {
          console.log(`${entry.name}: ${entry.duration}ms`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation', 'measure'] });
    
    return () => observer.disconnect();
  }, []);
};

// Misura operazioni critiche
const measureOperation = async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
  performance.mark(`${name}-start`);
  
  try {
    const result = await operation();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    return result;
  } catch (error) {
    performance.mark(`${name}-error`);
    performance.measure(`${name}-error`, `${name}-start`, `${name}-error`);
    throw error;
  }
};
```

### Error Tracking

```typescript
// ✅ CORRETTO: Error tracking completo
interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

const errorTracker = {
  captureException: (error: Error, context?: ErrorContext) => {
    // Console log per sviluppo
    console.error('Error captured:', error, context);
    
    // Produzione: invia a Sentry
    if (import.meta.env.PROD && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: context?.component,
          action: context?.action,
        },
        user: context?.userId ? { id: context.userId } : undefined,
        extra: context?.metadata,
      });
    }
    
    // Analytics personalizzati
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          component: context?.component,
          action: context?.action,
        },
      });
    }
  },
  
  captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    console[level]('Message captured:', message);
    
    if (import.meta.env.PROD && window.Sentry) {
      window.Sentry.captureMessage(message, level);
    }
  },
};

// Hook per error tracking
const useErrorTracking = (component: string) => {
  return {
    trackError: (error: Error, action?: string, metadata?: Record<string, any>) => {
      errorTracker.captureException(error, {
        component,
        action,
        metadata,
      });
    },
    
    trackMessage: (message: string, level?: 'info' | 'warning' | 'error') => {
      errorTracker.captureMessage(message, level);
    },
  };
};
```

---

## 🔧 Code Quality

### TypeScript Best Practices

```typescript
// ✅ CORRETTO: Types sicuri e descrittivi
interface Task {
  readonly id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: readonly string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Utility types
type CreateTaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
type UpdateTaskInput = Partial<Pick<Task, 'title' | 'description' | 'completed' | 'priority' | 'tags'>>;

// Type guards
const isValidPriority = (value: string): value is Task['priority'] => {
  return ['low', 'medium', 'high'].includes(value);
};

// Generic utilities
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

const createApiHook = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>
): (() => ApiResponse<T>) => {
  return () => {
    const { data, error, isLoading } = useQuery({
      queryKey,
      queryFn,
    });
    
    return {
      data: data ?? null,
      error: error?.message ?? null,
      loading: isLoading,
    };
  };
};
```

### Custom Hooks Pattern

```typescript
// ✅ CORRETTO: Custom hooks riutilizzabili
const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  return [storedValue, setValue];
};

// Hook per debouncing
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Hook per previous value
const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
};
```

---

## 📚 Risorse Aggiuntive

### Documentazione Ufficiale
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/reusing-styles)

### Tools Consigliati
- **ESLint**: Linting JavaScript/TypeScript
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **lint-staged**: Pre-commit linting
- **TypeScript**: Type checking
- **Vitest**: Unit testing
- **Playwright**: E2E testing

### Configurazione Consigliata

```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "jsx-a11y/anchor-is-valid": "error"
  }
}
```

```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx,css,md}",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "e2e": "playwright test"
  }
}
```

---

**📝 Ultima modifica**: 21 Gennaio 2025  
**✅ Versione**: 1.0  
**🎯 Stato**: Completo e pronto per l'uso

---

*Questo documento è parte della documentazione ufficiale del progetto Tsunami ADHD App. Per suggerimenti o miglioramenti, apri una issue su GitHub.*