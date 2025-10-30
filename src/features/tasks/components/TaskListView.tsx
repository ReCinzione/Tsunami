import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Focus, Filter, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TaskListViewProps } from '../types';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { EmptyTaskState } from './EmptyTaskState';
import { TaskFilters } from './TaskFilters';
import { cn } from '@/lib/utils';

// Componente memoizzato per le statistiche
const TaskStats = React.memo<{
  stats: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
  };
}>(({ stats }) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
    <div className="text-center p-2 bg-gray-50 rounded-lg">
      <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
      <div className="text-xs text-gray-600">Totali</div>
    </div>
    <div className="text-center p-2 bg-green-50 rounded-lg">
      <div className="text-lg font-semibold text-green-700">{stats.completed}</div>
      <div className="text-xs text-green-600">Completate</div>
    </div>
    <div className="text-center p-2 bg-yellow-50 rounded-lg">
      <div className="text-lg font-semibold text-yellow-700">{stats.pending}</div>
      <div className="text-xs text-yellow-600">In attesa</div>
    </div>
    <div className="text-center p-2 bg-blue-50 rounded-lg">
      <div className="text-lg font-semibold text-blue-700">{stats.inProgress}</div>
      <div className="text-xs text-blue-600">In corso</div>
    </div>
    {stats.overdue > 0 && (
      <div className="text-center p-2 bg-red-50 rounded-lg">
        <div className="text-lg font-semibold text-red-700">{stats.overdue}</div>
        <div className="text-xs text-red-600">In ritardo</div>
      </div>
    )}
  </div>
));

TaskStats.displayName = 'TaskStats';



// Componente memoizzato per la lista delle task con virtualizzazione semplice
const TaskList = React.memo<{
  tasks: any[];
  onTaskComplete: (taskId: string) => void;
  onTaskClick: (task: any) => void;
  onTaskEdit: (task: any) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskBreakdown?: (task: any) => void;
  selectedTaskId?: string;
  focusMode: boolean;
}>(({ 
  tasks, 
  onTaskComplete, 
  onTaskClick, 
  onTaskEdit, 
  onDeleteTask, 
  onTaskBreakdown, 
  selectedTaskId, 
  focusMode 
}) => {
  // Implementazione semplice di virtualizzazione per liste lunghe
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 20 });
  const [containerRef, setContainerRef] = React.useState<HTMLDivElement | null>(null);
  
  // Aggiorna il range visibile quando si scrolla
  React.useEffect(() => {
    if (!containerRef || tasks.length <= 20) return;
    
    const handleScroll = () => {
      const scrollTop = containerRef.scrollTop;
      const itemHeight = 120; // Altezza approssimativa di una task
      const containerHeight = containerRef.clientHeight;
      
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(start + Math.ceil(containerHeight / itemHeight) + 5, tasks.length);
      
      setVisibleRange({ start, end });
    };
    
    containerRef.addEventListener('scroll', handleScroll, { passive: true });
    return () => containerRef.removeEventListener('scroll', handleScroll);
  }, [containerRef, tasks.length]);
  
  const visibleTasks = tasks.length > 20 ? tasks.slice(visibleRange.start, visibleRange.end) : tasks;
  const paddingTop = tasks.length > 20 ? visibleRange.start * 120 : 0;
  const paddingBottom = tasks.length > 20 ? (tasks.length - visibleRange.end) * 120 : 0;
  
  return (
    <div 
      ref={setContainerRef}
      className="space-y-3 max-h-[600px] overflow-y-auto"
      style={{ paddingTop, paddingBottom }}
    >
      {visibleTasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onClick={onTaskClick}
          onComplete={onTaskComplete}
          onEdit={onTaskEdit}
          onDelete={onDeleteTask}
          onBreakdown={onTaskBreakdown}
          showDetails={!focusMode}
          focusMode={focusMode}
          isSelected={selectedTaskId === task.id}
        />
      ))}
    </div>
  );
});

TaskList.displayName = 'TaskList';

/**
 * Componente presentational per la visualizzazione della lista task
 * Ottimizzato per performance con React.memo e virtualizzazione
 */
export const TaskListView = React.memo<TaskListViewProps>(({ 
  tasks, 
  loading, 
  error, 
  focusMode = false,
  focusTaskCount = 3,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onTaskComplete,
  onTaskClick,
  onTaskEdit,
  onTaskBreakdown,
  filters,
  onFiltersChange,
  onRefresh,
  isLoading,
  taskStats,
  selectedTaskId
}) => {
  const [showFilters, setShowFilters] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Memoizza il callback per la ricerca con debouncing
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState('');
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Memoizza i callback per evitare re-render non necessari
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Filtra e ordina le task per la visualizzazione (ottimizzato)
  const displayTasks = useMemo(() => {
    console.log('🎨 TaskListView - Inizio rendering task:', {
      tasksCount: tasks.length,
      searchQuery: debouncedSearchQuery,
      focusMode,
      loading,
      timestamp: new Date().toISOString()
    });

    let filteredTasks = tasks;

    // Applica ricerca testuale solo se necessario
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filteredTasks = tasks.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    // In modalità focus, mostra solo le task prioritarie
    if (focusMode) {
      filteredTasks = filteredTasks
        .filter(task => task.status !== 'completed')
        .slice(0, focusTaskCount);
    }

    return filteredTasks;
  }, [tasks, debouncedSearchQuery, focusMode, focusTaskCount]);

  // Statistiche rapide (memoizzate)
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => 
      t.status !== 'completed' && 
      t.due_date && 
      new Date(t.due_date) < new Date()
    ).length;

    return { total, completed, pending, inProgress, overdue };
  }, [tasks]);

  // Gestione errori
  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Si è verificato un problema nel caricamento delle task. 
              Riprova tra qualche momento.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(
      "w-full space-y-4 transition-all duration-300 relative",
      focusMode ? "w-full px-0" : "max-w-none"
    )}>
      {/* Header con modalità focus */}
      {focusMode && (
        <div className="fixed top-4 right-4 z-50">
          <Badge variant="secondary" className="animate-pulse bg-blue-100 text-blue-800">
            🎯 Modalità Focus Attiva
          </Badge>
        </div>
      )}

      {/* Statistiche rapide - nascoste in modalità focus */}
      {!focusMode && <TaskStats stats={stats} />}

      {/* Header con modalità focus */}
      {focusMode && (
        <div className="flex items-center gap-2 mb-4">
          <Focus className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Le tue {focusTaskCount} task prioritarie</h2>
        </div>
      )}
      
      {/* Barra degli strumenti senza Card */}
      {!focusMode && (
        <div className="space-y-3 mb-4">
          {/* Riga 1: Ricerca e Filtri */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                 type="text"
                 placeholder="Cerca"
                 value={searchQuery}
                 onChange={(e) => handleSearchChange(e.target.value)}
                 className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
               />
            </div>
            <Button
              variant="outline"
              onClick={handleToggleFilters}
              className="px-4 py-2.5 h-auto border-gray-200 hover:border-purple-300 hover:bg-purple-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Nascondi Filtri' : 'Filtri'}
            </Button>
          </div>
          
          {/* Riga 2: Azioni principali */}
          <div className="flex items-center gap-3">
            <Button
               onClick={onCreateTask}
               className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 h-auto font-medium"
             >
               Nuova Attività
             </Button>
          </div>
          
          {/* Spazio per future funzionalità */}
           <div className="h-12">
             {/* Spazio riservato */}
           </div>
          
          {/* Filtri espandibili */}
          {showFilters && (
            <div className="mt-4">
              <TaskFilters
                filters={filters}
                onFiltersChange={onFiltersChange}
              />
            </div>
          )}
        </div>
      )}

      {/* Lista delle task senza contenitore */}
      <div className="w-full">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : displayTasks.length === 0 ? (
          <EmptyTaskState onCreateTask={onCreateTask} />
        ) : (
          <TaskList
            tasks={displayTasks}
            onTaskComplete={onTaskComplete}
            onTaskClick={onTaskClick}
            onTaskEdit={onTaskEdit}
            onDeleteTask={onDeleteTask}
            onTaskBreakdown={onTaskBreakdown}
            selectedTaskId={selectedTaskId}
            focusMode={focusMode}
          />
        )}
      </div>


    </div>
  );
});

TaskListView.displayName = 'TaskListView';