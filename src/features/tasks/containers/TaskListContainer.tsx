import React, { useState, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import { TaskListView } from '../components/TaskListView';
import { TaskForm } from '../components/TaskForm';
import { useTasks, useFocusTasks, useTaskStats } from '../hooks/useTasks';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { useErrorHandler } from '@/hooks/common/useErrorHandler';
import { Task, TaskFilters, TaskFormData } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface TaskListContainerProps {
  /** Modalità focus per ridurre distrazioni */
  focusMode?: boolean;
  /** Filtri iniziali */
  initialFilters?: Partial<TaskFilters>;
  /** Callback quando una task viene selezionata */
  onTaskSelect?: (task: Task) => void;
  /** Limite massimo di task da mostrare */
  maxTasks?: number;
  /** Mostra task completate */
  showCompleted?: boolean;
  /** User ID per le query */
  userId?: string;
  /** Callback quando una task viene completata */
  onTaskComplete?: () => void;
  /** Callback per il breakdown AI di una task */
  onTaskBreakdown?: (task: Task) => void;
  /** Callback per attivare Ultra Focus Mode */
  onUltraFocus?: (task: Task) => void;
  /** Classe CSS aggiuntiva */
  className?: string;
}

/**
 * Container ottimizzato che gestisce la logica di business per la lista delle task
 * Utilizza React.memo, useCallback e useMemo per ottimizzare le performance
 */
export const TaskListContainer = React.memo(forwardRef<
  { handleCreateTask: () => void; handleRefresh: () => void },
  TaskListContainerProps
>((
  {
    focusMode = false,
    initialFilters = {},
    onTaskSelect,
    maxTasks,
    showCompleted = false,
    userId,
    onTaskComplete,
    onTaskBreakdown,
    onUltraFocus,
    className
  },
  ref
) => {

  // State locale per UI (memoizzato)
  const [filters, setFilters] = useState<TaskFilters>(() => ({
    status: showCompleted ? ['completed'] : ['pending', 'in_progress'],
    search: '',
    task_type: undefined,
    energy_required: undefined,
    due_date_range: undefined,
    sort_by: 'due_date',
    sort_order: 'asc',
    ...initialFilters
  }));
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Hooks per gestione errori e notifiche
  const { handleError, showSuccess } = useErrorHandler();
  const { toast } = useToast();

  // Hooks per dati e mutazioni (memoizzati)
  const tasksQuery = focusMode ? useFocusTasks() : useTasks({ filters });
  const { 
    tasks: allTasks = [], 
    loading: isLoading, 
    error,
    refetch 
  } = tasksQuery;
  
  const { data: taskStats } = useTaskStats();
  
  const {
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    isAnyLoading
  } = useTaskMutations();

  // Gestione errori di fetch (memoizzata)
  React.useEffect(() => {
    if (error) {
      handleError(error, {
        context: 'caricamento task',
        showToast: true,
        retryAction: refetch
      });
    }
  }, [error, handleError, refetch]);

  // Filtra e ordina le task (ottimizzato con useMemo)
  const filteredTasks = useMemo(() => {
    console.log('🔄 TaskListContainer - Filtraggio task:', {
      allTasksCount: allTasks.length,
      maxTasks,
      focusMode,
      filters,
      timestamp: new Date().toISOString()
    });

    let tasks = allTasks;

    // Applica limite se specificato
    if (maxTasks && tasks.length > maxTasks) {
      tasks = tasks.slice(0, maxTasks);
    }

    console.log('✅ TaskListContainer - Task filtrate:', {
      filteredCount: tasks.length,
      firstTaskTitle: tasks[0]?.title,
      timestamp: new Date().toISOString()
    });

    return tasks;
  }, [allTasks, maxTasks]);

  // Callbacks memoizzati per azioni sulle task
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    onTaskSelect?.(task);
  }, [onTaskSelect]);

  const handleTaskComplete = useCallback(async (taskId: string) => {
    try {
      await completeTask.mutateAsync(taskId);
      onTaskComplete?.();
    } catch (error) {
      // Errore già gestito nel hook
    }
  }, [completeTask, onTaskComplete]);

  const handleTaskEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  }, []);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
    } catch (error) {
      // Errore già gestito nel hook
    }
  }, [deleteTask]);

  const handleCreateTask = useCallback(() => {
    setEditingTask(null);
    setShowTaskForm(true);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Espone le funzioni al componente padre
  useImperativeHandle(ref, () => ({
    handleCreateTask,
    handleRefresh
  }), [handleCreateTask, handleRefresh]);

  const handleFormSubmit = useCallback(async (formData: TaskFormData) => {
    try {
      if (editingTask) {
        await updateTask.mutateAsync({
          id: editingTask.id,
          data: formData
        });
        showSuccess(`Task "${formData.title}" aggiornata! ✨`);
      } else {
        await createTask.mutateAsync(formData);
        showSuccess(`Task "${formData.title}" creata con successo! 🎉`);
      }
      
      // Chiudi il form dopo il successo
      setShowTaskForm(false);
      setEditingTask(null);
      
      // Forza il refetch delle task
      refetch();
    } catch (error) {
      handleError(error, {
        context: editingTask ? 'aggiornamento task' : 'creazione task',
        showToast: true
      });
    }
  }, [editingTask, updateTask, createTask, showSuccess, handleError, refetch]);

  const handleFormCancel = useCallback(() => {
    setShowTaskForm(false);
    setEditingTask(null);
  }, []);

  const handleFiltersChange = useCallback((newFilters: Partial<TaskFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleTaskBreakdown = useCallback((task: Task) => {
    onTaskBreakdown?.(task);
  }, [onTaskBreakdown]);

  const handleUltraFocus = useCallback((task: Task) => {
    onUltraFocus?.(task);
  }, [onUltraFocus]);

  // Props memoizzate per TaskListView
  const taskListViewProps = useMemo(() => ({
    tasks: filteredTasks,
    loading: isLoading,
    error,
    focusMode,
    focusTaskCount: 3,
    onCreateTask: handleCreateTask,
    onUpdateTask: updateTask.mutateAsync,
    onDeleteTask: handleTaskDelete,
    onTaskComplete: handleTaskComplete,
    onTaskClick: handleTaskClick,
    onTaskEdit: handleTaskEdit,
    onTaskBreakdown: handleTaskBreakdown,
    onUltraFocus: handleUltraFocus,
    filters,
    onFiltersChange: handleFiltersChange,
    onRefresh: handleRefresh,
    isLoading: isAnyLoading,
    taskStats,
    selectedTaskId: selectedTask?.id
  }), [
    filteredTasks,
    isLoading,
    error,
    focusMode,
    handleCreateTask,
    updateTask.mutateAsync,
    handleTaskDelete,
    handleTaskComplete,
    handleTaskClick,
    handleTaskEdit,
    handleTaskBreakdown,
    handleUltraFocus,
    filters,
    handleFiltersChange,
    handleRefresh,
    isAnyLoading,
    taskStats,
    selectedTask?.id
  ]);

  return (
    <div className={className}>
      <TaskListView {...taskListViewProps} />
      
      {/* Dialog per creazione/modifica task */}
      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Modifica Task' : 'Crea Nuova Task'}
            </DialogTitle>
            <DialogDescription>
              {editingTask 
                ? 'Modifica i dettagli della task esistente.'
                : 'Compila i campi per creare una nuova task. I campi con * sono obbligatori.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <TaskForm
            initialData={editingTask || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={createTask.isPending || updateTask.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}));

TaskListContainer.displayName = 'TaskListContainer';