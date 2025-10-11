import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Task, TaskFilters } from '@/features/tasks/types';

interface TaskState {
  // Task data
  tasks: Task[];
  selectedTask: Task | null;
  
  // UI state
  focusMode: boolean;
  filters: TaskFilters;
  viewMode: 'list' | 'kanban' | 'calendar';
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setSelectedTask: (task: Task | null) => void;
  
  // UI actions
  setFocusMode: (enabled: boolean) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;
  setViewMode: (mode: 'list' | 'kanban' | 'calendar') => void;
  
  // Loading actions
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  
  // Computed getters
  getTaskById: (id: string) => Task | undefined;
  getFilteredTasks: () => Task[];
  getTaskStats: () => {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    dueToday: number;
  };
}

const defaultFilters: TaskFilters = {
  status: 'pending',
  search: '',
  task_type: undefined,
  energy_required: undefined,
  // requires_deep_focus: undefined, // Removed - not in database schema
  due_date_range: undefined,
  sort_by: 'due_date',
  sort_order: 'asc'
};

export const useTaskStore = create<TaskState>()()
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tasks: [],
        selectedTask: null,
        focusMode: false,
        filters: defaultFilters,
        viewMode: 'list',
        isLoading: false,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,

        // Task actions
        setTasks: (tasks) => set({ tasks }, false, 'setTasks'),
        
        addTask: (task) => set(
          (state) => ({ tasks: [task, ...state.tasks] }),
          false,
          'addTask'
        ),
        
        updateTask: (id, updates) => set(
          (state) => ({
            tasks: state.tasks.map(task => 
              task.id === id ? { ...task, ...updates } : task
            ),
            selectedTask: state.selectedTask?.id === id 
              ? { ...state.selectedTask, ...updates }
              : state.selectedTask
          }),
          false,
          'updateTask'
        ),
        
        removeTask: (id) => set(
          (state) => ({
            tasks: state.tasks.filter(task => task.id !== id),
            selectedTask: state.selectedTask?.id === id ? null : state.selectedTask
          }),
          false,
          'removeTask'
        ),
        
        setSelectedTask: (task) => set({ selectedTask: task }, false, 'setSelectedTask'),

        // UI actions
        setFocusMode: (enabled) => set({ focusMode: enabled }, false, 'setFocusMode'),
        
        setFilters: (newFilters) => set(
          (state) => ({ filters: { ...state.filters, ...newFilters } }),
          false,
          'setFilters'
        ),
        
        resetFilters: () => set({ filters: defaultFilters }, false, 'resetFilters'),
        
        setViewMode: (mode) => set({ viewMode: mode }, false, 'setViewMode'),

        // Loading actions
        setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),
        setCreating: (creating) => set({ isCreating: creating }, false, 'setCreating'),
        setUpdating: (updating) => set({ isUpdating: updating }, false, 'setUpdating'),
        setDeleting: (deleting) => set({ isDeleting: deleting }, false, 'setDeleting'),

        // Computed getters
        getTaskById: (id) => {
          const { tasks } = get();
          return tasks.find(task => task.id === id);
        },
        
        getFilteredTasks: () => {
          const { tasks, filters } = get();
          let filteredTasks = [...tasks];

          // Filtra per status
          if (filters.status) {
            filteredTasks = filteredTasks.filter(task => task.status === filters.status);
          }

          // Filtra per ricerca testuale
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filteredTasks = filteredTasks.filter(task => 
              task.title.toLowerCase().includes(searchLower) ||
              task.description?.toLowerCase().includes(searchLower) ||
              task.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
          }

          // Filtra per tipo
          if (filters.task_type) {
            filteredTasks = filteredTasks.filter(task => task.task_type === filters.task_type);
          }

          // Filtra per energia
          if (filters.energy_required) {
            filteredTasks = filteredTasks.filter(task => task.energy_required === filters.energy_required);
          }

          // Filtra per focus
          // Deep focus filter removed - requires_deep_focus not in database schema
    // if (filters.requires_deep_focus !== undefined) {
    //   filteredTasks = filteredTasks.filter(task => task.requires_deep_focus === filters.requires_deep_focus);
    // }

          // Filtra per data di scadenza
          if (filters.due_date_range) {
            const { start, end } = filters.due_date_range;
            filteredTasks = filteredTasks.filter(task => {
              if (!task.due_date) return false;
              const dueDate = new Date(task.due_date);
              return dueDate >= start && dueDate <= end;
            });
          }

          // Ordina
          filteredTasks.sort((a, b) => {
            const { sort_by, sort_order } = filters;
            let comparison = 0;

            switch (sort_by) {
              case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
              case 'created_at':
                comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                break;
              case 'due_date':
                if (!a.due_date && !b.due_date) comparison = 0;
                else if (!a.due_date) comparison = 1;
                else if (!b.due_date) comparison = -1;
                else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                break;
              case 'priority':
                // Ordina per energia richiesta come proxy per priorità
                const energyOrder = ['molto_bassa', 'bassa', 'media', 'alta', 'molto_alta'];
                comparison = energyOrder.indexOf(a.energy_required) - energyOrder.indexOf(b.energy_required);
                break;
              case 'xp_reward':
                comparison = a.xp_reward - b.xp_reward;
                break;
              default:
                comparison = 0;
            }

            return sort_order === 'desc' ? -comparison : comparison;
          });

          return filteredTasks;
        },
        
        getTaskStats: () => {
          const { tasks } = get();
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

          return {
            total: tasks.length,
            completed: tasks.filter(task => task.status === 'completed').length,
            pending: tasks.filter(task => task.status === 'pending' || task.status === 'in_progress').length,
            overdue: tasks.filter(task => {
              if (!task.due_date || task.status === 'completed') return false;
              return new Date(task.due_date) < today;
            }).length,
            dueToday: tasks.filter(task => {
              if (!task.due_date || task.status === 'completed') return false;
              const dueDate = new Date(task.due_date);
              return dueDate >= today && dueDate < tomorrow;
            }).length
          };
        }
      }),
      {
        name: 'tsunami-task-store',
        partialize: (state) => ({
          focusMode: state.focusMode,
          filters: state.filters,
          viewMode: state.viewMode
        })
      }
    ),
    {
      name: 'TaskStore'
    }
  );

// Selettori per ottimizzare le performance
export const useTaskSelectors = () => {
  const tasks = useTaskStore(state => state.tasks);
  const filteredTasks = useTaskStore(state => state.getFilteredTasks());
  const taskStats = useTaskStore(state => state.getTaskStats());
  const selectedTask = useTaskStore(state => state.selectedTask);
  const focusMode = useTaskStore(state => state.focusMode);
  const filters = useTaskStore(state => state.filters);
  const viewMode = useTaskStore(state => state.viewMode);
  const isLoading = useTaskStore(state => state.isLoading);
  
  return {
    tasks,
    filteredTasks,
    taskStats,
    selectedTask,
    focusMode,
    filters,
    viewMode,
    isLoading
  };
};

// Actions selectors
export const useTaskActions = () => {
  const setTasks = useTaskStore(state => state.setTasks);
  const addTask = useTaskStore(state => state.addTask);
  const updateTask = useTaskStore(state => state.updateTask);
  const removeTask = useTaskStore(state => state.removeTask);
  const setSelectedTask = useTaskStore(state => state.setSelectedTask);
  const setFocusMode = useTaskStore(state => state.setFocusMode);
  const setFilters = useTaskStore(state => state.setFilters);
  const resetFilters = useTaskStore(state => state.resetFilters);
  const setViewMode = useTaskStore(state => state.setViewMode);
  const setLoading = useTaskStore(state => state.setLoading);
  const getTaskById = useTaskStore(state => state.getTaskById);
  
  return {
    setTasks,
    addTask,
    updateTask,
    removeTask,
    setSelectedTask,
    setFocusMode,
    setFilters,
    resetFilters,
    setViewMode,
    setLoading,
    getTaskById
  };
};