import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/taskService';
import { Task, TaskFormData, TaskMutationCallbacks } from '../types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/common/useErrorHandler';
import { progressionService } from '@/services/ProgressionService';
import { useState } from 'react';

interface UseTaskMutationsReturn {
  createTask: {
    mutate: (data: TaskFormData, callbacks?: TaskMutationCallbacks) => void;
    mutateAsync: (data: TaskFormData) => Promise<Task>;
    loading: boolean;
    error: Error | null;
  };
  updateTask: {
    mutate: (params: { id: string; data: Partial<TaskFormData> }, callbacks?: TaskMutationCallbacks) => void;
    mutateAsync: (params: { id: string; data: Partial<TaskFormData> }) => Promise<Task>;
    loading: boolean;
    error: Error | null;
  };
  deleteTask: {
    mutate: (id: string, callbacks?: TaskMutationCallbacks) => void;
    mutateAsync: (id: string) => Promise<void>;
    loading: boolean;
    error: Error | null;
  };
  completeTask: {
    mutate: (id: string, callbacks?: TaskMutationCallbacks) => void;
    mutateAsync: (id: string) => Promise<{ task: Task; xpGained: number }>;
    loading: boolean;
    error: Error | null;
  };
  isAnyLoading: boolean;
}

/**
 * Hook per gestire tutte le mutazioni delle task
 */
export const useTaskMutations = (): UseTaskMutationsReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();
  const [levelUpData, setLevelUpData] = useState<{
    isVisible: boolean;
    newLevel: number;
    archetype?: string;
    xpGained: number;
  }>({ isVisible: false, newLevel: 1, xpGained: 0 });

  // Funzione per invalidare le query correlate
  const invalidateTaskQueries = () => {
    // Invalida tutte le query delle task (incluse quelle con filtri)
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    // Invalida specificamente le query delle task dell'utente corrente
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['tasks', user.id] });
    }
    queryClient.invalidateQueries({ queryKey: ['profiles'] });
  };

  // Mutazione per creare task
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (!user?.id) {
        throw new Error('Utente non autenticato');
      }
      return taskService.createTask(user.id, data);
    },
    onSuccess: (task, variables, context) => {
      invalidateTaskQueries();
      toast({
        title: "✨ Task creata con successo!",
        description: `"${task.title}" è stata aggiunta alla tua lista.`,
        duration: 3000
      });
    },
    onError: (error, variables, context) => {
      handleError(error, 'Creazione task');
    }
  });

  // Mutazione per aggiornare task
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData> }) => {
      return taskService.updateTask(id, data);
    },
    onMutate: async ({ id, data }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      const previousTasks = queryClient.getQueryData(['tasks', user?.id]);
      
      queryClient.setQueryData(['tasks', user?.id], (old: Task[] | undefined) => {
        if (!old) return [];
        return old.map(task => 
          task.id === id ? { ...task, ...data } : task
        );
      });
      
      return { previousTasks };
    },
    onSuccess: (task) => {
      invalidateTaskQueries();
      toast({
        title: "📝 Task aggiornata",
        description: `"${task.title}" è stata modificata con successo.`,
        duration: 2000
      });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', user?.id], context.previousTasks);
      }
      handleError(error, 'Aggiornamento task');
    },
    onSettled: () => {
      invalidateTaskQueries();
    }
  });

  // Mutazione per eliminare task
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return taskService.deleteTask(id);
    },
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      const previousTasks = queryClient.getQueryData(['tasks', user?.id]);
      
      queryClient.setQueryData(['tasks', user?.id], (old: Task[] | undefined) => {
        if (!old) return [];
        return old.filter(task => task.id !== id);
      });
      
      return { previousTasks, deletedTaskId: id };
    },
    onSuccess: (_, deletedId, context) => {
      invalidateTaskQueries();
      toast({
        title: "🗑️ Task eliminata",
        description: "La task è stata rimossa dalla tua lista.",
        duration: 2000,
        action: (
          <button
            onClick={() => {
              // Implementa undo se necessario
              console.log('Undo delete for task:', deletedId);
            }}
            className="text-sm underline"
          >
            Annulla
          </button>
        )
      });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', user?.id], context.previousTasks);
      }
      handleError(error, 'Eliminazione task');
    },
    onSettled: () => {
      invalidateTaskQueries();
    }
  });

  // Mutazione per completare task
  const completeTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return taskService.completeTask(id);
    },
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      const previousTasks = queryClient.getQueryData(['tasks', user?.id]);
      
      queryClient.setQueryData(['tasks', user?.id], (old: Task[] | undefined) => {
        if (!old) return [];
        return old.map(task => 
          task.id === id 
            ? { ...task, status: 'completed' as const, completed_at: new Date().toISOString() }
            : task
        );
      });
      
      return { previousTasks };
    },
    onSuccess: ({ task, xpGained }, taskId) => {
      invalidateTaskQueries();
      
      // Mostra notifica di completamento con XP
      toast({
        title: "🎉 Task completata!",
        description: `Hai guadagnato ${xpGained} XP completando "${task.title}".`,
        duration: 4000
      });

      // Controlla se c'è stato un level up
      checkForLevelUp(xpGained);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', user?.id], context.previousTasks);
      }
      handleError(error, 'Completamento task');
    },
    onSettled: () => {
      invalidateTaskQueries();
    }
  });

  // Funzione per controllare il level up
  const checkForLevelUp = async (xpGained: number) => {
    try {
      // Recupera il profilo aggiornato per controllare il livello
      const { data: profile } = await queryClient.fetchQuery({
        queryKey: ['profiles', user?.id],
        staleTime: 0 // Forza il refresh
      });

      if (profile) {
        const currentLevel = progressionService.calculateLevelFromXP(profile.total_xp - xpGained);
        const newLevel = progressionService.calculateLevelFromXP(profile.total_xp);
        
        if (newLevel > currentLevel) {
          setLevelUpData({
            isVisible: true,
            newLevel,
            archetype: profile.dominant_archetype,
            xpGained
          });
        }
      }
    } catch (error) {
      console.error('Errore nel controllo level up:', error);
    }
  };



  const isAnyLoading = 
    createTaskMutation.isPending ||
    updateTaskMutation.isPending ||
    deleteTaskMutation.isPending ||
    completeTaskMutation.isPending;

  return {
    createTask: {
      mutate: (data: TaskFormData, callbacks?: TaskMutationCallbacks) => {
        createTaskMutation.mutate(data, {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError
        });
      },
      mutateAsync: createTaskMutation.mutateAsync,
      loading: createTaskMutation.isPending,
      error: createTaskMutation.error
    },
    updateTask: {
      mutate: (params: { id: string; data: Partial<TaskFormData> }, callbacks?: TaskMutationCallbacks) => {
        updateTaskMutation.mutate(params, {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError
        });
      },
      mutateAsync: updateTaskMutation.mutateAsync,
      loading: updateTaskMutation.isPending,
      error: updateTaskMutation.error
    },
    deleteTask: {
      mutate: (id: string, callbacks?: TaskMutationCallbacks) => {
        deleteTaskMutation.mutate(id, {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError
        });
      },
      mutateAsync: deleteTaskMutation.mutateAsync,
      loading: deleteTaskMutation.isPending,
      error: deleteTaskMutation.error
    },
    completeTask: {
      mutate: (id: string, callbacks?: TaskMutationCallbacks) => {
        completeTaskMutation.mutate(id, {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError
        });
      },
      mutateAsync: completeTaskMutation.mutateAsync,
      loading: completeTaskMutation.isPending,
      error: completeTaskMutation.error
    },
    isAnyLoading
  };
};

/**
 * Hook semplificato per operazioni rapide sulle task
 */