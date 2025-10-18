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
}

/**
 * Container che gestisce la logica di business per la lista delle task
 * Separa la logica di stato/fetch dalla presentazione
 */
export const TaskListContainer: React.FC<TaskListContainerProps> = ({
  focusMode = false,
  initialFilters = {},
  onTaskSelect,
  maxTasks
}) => {
  // State locale per UI
  const [filters, setFilters] = useState<TaskFilters>({
    status: undefined, // Mostra tutte le task per default
    search: '',
    task_type: undefined,
    energy_required: undefined,
    // requires_deep_focus: undefined, // Removed - not in database schema
    due_date_range: undefined,
    sort_by: 'due_date',
    sort_order: 'asc',
    ...initialFilters
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

  // Filtra e ordina le task
  const filteredTasks = useMemo(() => {
    console.log('🔄 TaskListContainer - Filtraggio task:', {
      allTasksCount: allTasks.length,
      maxTasks,
      focusMode,
      filters,
      timestamp: new Date().toISOString()
    });

    let tasks = [...allTasks];

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
  }, [allTasks, maxTasks, focusMode, filters]);

  // Callbacks per azioni sulle task
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    onTaskSelect?.(task);
  }, [onTaskSelect]);

  const handleTaskComplete = useCallback(async (taskId: string) => {
    try {
      await completeTask.mutateAsync(taskId);
    } catch (error) {
      // Errore già gestito nel hook
    }
  }, [completeTask]);

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

  const handleFiltersChange = useCallback((newFilters: Partial<TaskFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
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