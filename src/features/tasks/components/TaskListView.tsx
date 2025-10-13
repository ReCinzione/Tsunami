import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Focus, Filter, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TaskListViewProps } from '../types';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { EmptyTaskState } from './EmptyTaskState';
import { TaskFilters } from './TaskFilters';
import { cn } from '@/lib/utils';

/**
 * Componente presentational per la visualizzazione della lista task
 * Non contiene logica di business, solo UI pura
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
  filters,
  onFiltersChange,
  onRefresh,
  isLoading,
  taskStats,
  selectedTaskId
}) => {
  // Rimosso showCreateForm - gestito dal container
  const [showFilters, setShowFilters] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filtra e ordina le task per la visualizzazione
  const displayTasks = useMemo(() => {
    let filteredTasks = [...tasks];

    // Applica ricerca testuale (solo ricerca locale, i filtri principali sono gestiti dal container)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
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
  }, [tasks, searchQuery, focusMode, focusTaskCount]);

  // Statistiche rapide
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
      "w-full space-y-4 transition-all duration-300",
      focusMode && "max-w-4xl mx-auto"
    )}>
      {/* Header con modalità focus */}
      {focusMode && (
        <div className="fixed top-4 right-4 z-50">
          <Badge variant="secondary" className="animate-pulse bg-blue-100 text-blue-800">
            🎯 Modalità Focus Attiva
          </Badge>
        </div>
      )}

      {/* Statistiche rapide */}
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

      {/* Barra degli strumenti */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              {focusMode ? (
                <>
                  <Focus className="h-5 w-5 text-blue-600" />
                  Le tue {focusTaskCount} task prioritarie
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Le tue task
                </>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {!focusMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Filtri
                  </Button>
                  
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cerca task..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              
              <Button
                onClick={onCreateTask}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nuova Task
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Filtri espandibili */}
        {showFilters && !focusMode && (
          <CardContent className="pt-0">
            <TaskFilters
              onFiltersChange={onFiltersChange}
              initialFilters={filters || {}}
            />
          </CardContent>
        )}
      </Card>

      {/* Lista task */}
      <div className="space-y-3">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : displayTasks.length === 0 ? (
          // Stato vuoto
          <EmptyTaskState 
            hasFilters={searchQuery.trim().length > 0 || (filters && Object.keys(filters).some(key => filters[key] && (Array.isArray(filters[key]) ? filters[key].length > 0 : filters[key])))}
            focusMode={focusMode}
            onCreateTask={onCreateTask}
          />
        ) : (
          // Lista task
          displayTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onClick={onTaskClick}
              onComplete={(taskId, newStatus) => onTaskComplete?.(taskId, newStatus)}
              onEdit={onTaskEdit}
              onDelete={onDeleteTask}
              showDetails={!focusMode}
              focusMode={focusMode}
            />
          ))
        )}
      </div>

      {/* Suggerimento per modalità focus */}
      {!focusMode && displayTasks.length > 5 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Focus className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium">
                  Troppe task? Prova la modalità focus!
                </p>
                <p className="text-xs text-blue-600">
                  Concentrati solo sulle {focusTaskCount} task più importanti.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => {
                  // Questa logica dovrebbe essere gestita dal container
                  console.log('Attiva modalità focus');
                }}
              >
                Attiva Focus
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form gestito dal container tramite Dialog */}
    </div>
  );
});

TaskListView.displayName = 'TaskListView';