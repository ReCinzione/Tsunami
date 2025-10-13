import React, { useState, useMemo, useCallback } from 'react';
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
  /** Mostra solo task completate se true, solo attive se false */
  showCompleted?: boolean;
  /** ID utente */
  userId?: string;
  /** Callback quando una task viene completata */
  onTaskComplete?: () => void;
  /** Classe CSS aggiuntiva */
  className?: string;
}

/**
 * Container che gestisce la logica di business per la lista delle task
 * Separa la logica di stato/fetch dalla presentazione
 */
export const TaskListContainer: React.FC<TaskListContainerProps> = ({
  focusMode = false,
  initialFilters = {},
  onTaskSelect,
  maxTasks,
  showCompleted,
  userId,
  onTaskComplete,
  className
}) => {
  // State locale per UI
  const [filters, setFilters] = useState<TaskFilters>(() => {
    // Determina il filtro di stato basato su showCompleted
    let statusFilter: string[] | undefined = undefined;
    if (showCompleted === true) {
      statusFilter = ['completed'];
    } else if (showCompleted === false) {
      statusFilter = ['pending'];
    }
    // Se showCompleted è undefined, mostra tutte le task
    
    return {
      status: statusFilter,
      search: '',
      task_type: undefined,
      energy_required: undefined,
      // requires_deep_focus: undefined, // Removed - not in database schema
      due_date_range: undefined,
      sort_by: 'due_date',
      sort_order: 'asc',
      ...initialFilters
    };
  });
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Hooks per gestione errori e notifiche
  const { handleError, showSuccess } = useErrorHandler();
  const { toast } = useToast();

  // Hooks per dati e mutazioni
  const { 
    tasks: allTasks = [], 
    loading: isLoading, 
    error,
    refetch 
  } = focusMode ? useFocusTasks() : useTasks(filters);
  
  const { data: taskStats } = useTaskStats();
  
  const {
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    isAnyLoading
  } = useTaskMutations();

  // Gestione errori di fetch
  React.useEffect(() => {
    if (error) {
      handleError(error, {
        context: 'caricamento task',
        showToast: true,
        retryAction: refetch
      });
    }
  }, [error, handleError, refetch]);

  // Filtra e ordina le task (il filtraggio principale avviene nell'hook useTasks)
  const filteredTasks = useMemo(() => {
    let tasks = [...allTasks];

    // Applica limite se specificato
    if (maxTasks && tasks.length > maxTasks) {
      tasks = tasks.slice(0, maxTasks);
    }

    return tasks;
  }, [allTasks, maxTasks]);

  // Callbacks per azioni sulle task
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    onTaskSelect?.(task);
  }, [onTaskSelect]);

  const handleTaskComplete = useCallback(async (taskId: string) => {
    try {
      await completeTask.mutateAsync(taskId);
      // Chiama il callback se fornito
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

  const handleFiltersChange = useCallback((newFilters: Record<string, any>) => {
    // Converte i filtri dal formato del componente TaskFilters al formato TaskFilters
    const convertedFilters: Partial<TaskFilters> = {};
    
    if (newFilters.status && newFilters.status.length > 0) {
      convertedFilters.status = newFilters.status;
    }
    
    if (newFilters.energy && newFilters.energy.length > 0) {
      convertedFilters.energy_required = newFilters.energy;
    }
    
    if (newFilters.tags && newFilters.tags.length > 0) {
      convertedFilters.tags = newFilters.tags;
    }
    
    if (newFilters.due && newFilters.due.length > 0) {
      // Gestione filtri scadenza - convertiamo in date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (newFilters.due.includes('today')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        convertedFilters.due_date_from = today.toISOString().split('T')[0];
        convertedFilters.due_date_to = tomorrow.toISOString().split('T')[0];
      } else if (newFilters.due.includes('overdue')) {
        convertedFilters.due_date_to = today.toISOString().split('T')[0];
      } else if (newFilters.due.includes('this_week')) {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        convertedFilters.due_date_from = today.toISOString().split('T')[0];
        convertedFilters.due_date_to = weekEnd.toISOString().split('T')[0];
      } else if (newFilters.due.includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        convertedFilters.due_date_from = tomorrow.toISOString().split('T')[0];
        convertedFilters.due_date_to = dayAfter.toISOString().split('T')[0];
      }
    }
    
    setFilters(prev => ({ ...prev, ...convertedFilters }));
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
    toast({
      title: "Lista aggiornata",
      description: "Le task sono state ricaricate",
      duration: 2000
    });
  }, [refetch, toast]);

  // Determina se ci sono operazioni in corso
  const isAnyOperationLoading = isLoading || isAnyLoading;

  return (
    <>
      <TaskListView
        tasks={filteredTasks}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onTaskClick={handleTaskClick}
        onTaskComplete={handleTaskComplete}
        onTaskEdit={handleTaskEdit}
        onTaskDelete={handleTaskDelete}
        onCreateTask={handleCreateTask}
        onRefresh={handleRefresh}
        isLoading={isAnyOperationLoading}
        focusMode={focusMode}
        taskStats={taskStats}
        selectedTaskId={selectedTask?.id}
        className={className}
      />

      {/* Dialog per form task */}
      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Modifica Task' : 'Crea Nuova Task'}
            </DialogTitle>
            <DialogDescription>
              {editingTask 
                ? 'Modifica i dettagli della task esistente' 
                : 'Compila i campi per creare una nuova task'
              }
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={editingTask ? updateTask.loading : createTask.loading}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};