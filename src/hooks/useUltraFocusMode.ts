import { useState, useCallback } from 'react';
import { Task } from '@/features/tasks/types';
import { useTaskStore } from '@/store/taskStore';

interface UltraFocusModeState {
  isActive: boolean;
  currentTask: Task | null;
}

export function useUltraFocusMode() {
  const [state, setState] = useState<UltraFocusModeState>({
    isActive: false,
    currentTask: null
  });

  const { getTaskById, updateTask } = useTaskStore();

  // Start Ultra Focus Mode with a specific task
  const startUltraFocus = useCallback((task: Task) => {
    setState({
      isActive: true,
      currentTask: task
    });
  }, []);

  // Exit Ultra Focus Mode
  const exitUltraFocus = useCallback(() => {
    setState({
      isActive: false,
      currentTask: null
    });
  }, []);

  // Handle task completion in Ultra Focus Mode
  const completeCurrentTask = useCallback(async () => {
    if (!state.currentTask) return;

    try {
      await updateTask(state.currentTask.id, { status: 'completed' });
      
      // Exit focus mode after task completion
      exitUltraFocus();
      
      return true;
    } catch (error) {
      console.error('Error completing task in Ultra Focus Mode:', error);
      return false;
    }
  }, [state.currentTask, updateTask, exitUltraFocus]);

  // Refresh current task data
  const refreshCurrentTask = useCallback(() => {
    if (!state.currentTask) return;

    const updatedTask = getTaskById(state.currentTask.id);
    if (updatedTask) {
      setState(prev => ({
        ...prev,
        currentTask: updatedTask
      }));
    }
  }, [state.currentTask, getTaskById]);

  return {
    isActive: state.isActive,
    currentTask: state.currentTask,
    startUltraFocus,
    exitUltraFocus,
    completeCurrentTask,
    refreshCurrentTask
  };
}