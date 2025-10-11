import { useQuery, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/taskService';
import { Task, TaskFilters } from '../types';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

interface UseTasksOptions {
  filters?: TaskFilters;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
}

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  isStale: boolean;
}

/**
 * Hook per recuperare e gestire la lista delle task
 */
export const useTasks = (options: UseTasksOptions = {}): UseTasksReturn => {
  const { user } = useAuth();
  const {
    filters,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minuti
    refetchInterval
  } = options;

  const queryKey = useMemo(() => [
    'tasks',
    user?.id,
    filters
  ], [user?.id, filters]);

  const {
    data: tasks = [],
    isLoading: loading,
    error,
    refetch,
    isStale
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Utente non autenticato');
      }
      console.log('🔄 useTasks queryFn - user.id:', user.id, 'filters:', filters);
      return taskService.getTasks(user.id, filters);
    },
    enabled: enabled && !!user?.id,
    staleTime,
    refetchInterval,
    retry: (failureCount, error) => {
      // Retry solo per errori di rete, non per errori di autenticazione
      if (error.message.includes('autenticato')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Debug log per il risultato finale
  console.log('📊 useTasks result - tasks:', tasks?.length || 0, 'loading:', loading, 'error:', error);
  
  return {
    tasks,
    loading,
    error: error as Error | null,
    refetch,
    isStale
  };
};

/**
 * Hook per recuperare task specifiche per la modalità focus
 */
export const useFocusTasks = (taskCount: number = 3): UseTasksReturn => {
  const { user } = useAuth();
  
  const filters: TaskFilters = {
    status: ['pending', 'in_progress']
  };

  const { tasks, loading, error, refetch, isStale } = useTasks({ filters });

  // Prioritizza task in base a scadenza, energia e importanza
  const focusTasks = useMemo(() => {
    if (!tasks.length) return [];

    const prioritizedTasks = [...tasks]
      .sort((a, b) => {
        // Prima le task in progress
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;

        // Poi per scadenza
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;

        // Infine per data di creazione
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(0, taskCount);

    return prioritizedTasks;
  }, [tasks, taskCount]);

  return {
    tasks: focusTasks,
    loading,
    error,
    refetch,
    isStale
  };
};

/**
 * Hook per recuperare task in scadenza
 */
export const useUpcomingTasks = (days: number = 7): UseTasksReturn => {
  const { user } = useAuth();

  const {
    data: tasks = [],
    isLoading: loading,
    error,
    refetch,
    isStale
  } = useQuery({
    queryKey: ['tasks', 'upcoming', user?.id, days],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Utente non autenticato');
      }
      return taskService.getUpcomingTasks(user.id, days);
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minuti
    retry: 2
  });

  // Debug log per il risultato finale
  console.log('📊 useTasks result - tasks:', tasks?.length || 0, 'loading:', loading, 'error:', error);
  
  return {
    tasks,
    loading,
    error: error as Error | null,
    refetch,
    isStale
  };
};

/**
 * Hook per recuperare task consigliate basate sull'energia attuale
 */
export const useRecommendedTasks = (
  currentEnergy: Task['energy_required'],
  limit: number = 5
): UseTasksReturn => {
  const { user } = useAuth();

  const {
    data: tasks = [],
    isLoading: loading,
    error,
    refetch,
    isStale
  } = useQuery({
    queryKey: ['tasks', 'recommended', user?.id, currentEnergy, limit],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Utente non autenticato');
      }
      return taskService.getRecommendedTasks(user.id, currentEnergy, limit);
    },
    enabled: !!user?.id && !!currentEnergy,
    staleTime: 15 * 60 * 1000, // 15 minuti
    retry: 2
  });

  // Debug log per il risultato finale
  console.log('📊 useTasks result - tasks:', tasks?.length || 0, 'loading:', loading, 'error:', error);
  
  return {
    tasks,
    loading,
    error: error as Error | null,
    refetch,
    isStale
  };
};

/**
 * Hook per recuperare una singola task
 */
export const useTask = (taskId: string | undefined) => {
  const { tasks, loading, error } = useTasks();
  
  const task = useMemo(() => {
    if (!taskId || !tasks.length) return null;
    return tasks.find(t => t.id === taskId) || null;
  }, [taskId, tasks]);

  return {
    task,
    loading,
    error,
    exists: !!task
  };
};

/**
 * Hook per statistiche delle task
 */
export const useTaskStats = (dateRange?: { from: string; to: string }) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', 'stats', user?.id, dateRange],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Utente non autenticato');
      }
      return taskService.getTaskStats(user.id, dateRange);
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000, // 30 minuti
    retry: 2
  });
};

/**
 * Hook per invalidare cache delle task
 */
export const useInvalidateTasks = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const invalidateUserTasks = () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['tasks', user.id] });
    }
  };

  const invalidateStats = () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'stats', user.id] });
    }
  };

  return {
    invalidateAll,
    invalidateUserTasks,
    invalidateStats
  };
};