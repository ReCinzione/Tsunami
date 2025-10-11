// Task-specific types and interfaces

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  task_type: 'azione' | 'riflessione' | 'comunicazione' | 'creativita' | 'organizzazione';
  energy_required: 'molto_bassa' | 'bassa' | 'media' | 'alta' | 'molto_alta';
  xp_reward: number;
  created_at: string;
  completed_at?: string;
  google_calendar_event_id?: string;
  actual_duration?: number;
  // estimated_duration removed - not in database schema
  tags?: string[];
  parent_task_id?: string;
  context_switching_cost?: 'low' | 'medium' | 'high';
  // requires_deep_focus?: boolean; // Removed - not in database schema
  can_be_interrupted?: boolean;
}

export interface TaskFilters {
  status?: Task['status'][];
  task_type?: Task['task_type'][];
  energy_required?: Task['energy_required'][];
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
  tags?: string[];
  // requires_deep_focus?: boolean; // Removed - not in database schema
}

export interface TaskFormData {
  title: string;
  description?: string;
  task_type: Task['task_type'];
  energy_required: Task['energy_required'];
  due_date?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  // estimated_duration removed - not in database schema
  tags?: string[];
  // requires_deep_focus?: boolean; // Removed - not in database schema
  can_be_interrupted?: boolean;
}

export interface TaskMutationCallbacks {
  onSuccess?: (task: Task) => void;
  onError?: (error: Error) => void;
}

export interface TaskListViewProps {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
  focusMode?: boolean;
  focusTaskCount?: number;
  onCreateTask: (data: TaskFormData) => void;
  onUpdateTask: (id: string, data: Partial<TaskFormData>) => void;
  onDeleteTask: (id: string) => void;
  onTaskComplete: (id: string, newStatus?: boolean) => void;
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  filters?: TaskFilters;
  onFiltersChange?: (filters: Partial<TaskFilters>) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  taskStats?: TaskStats;
  selectedTaskId?: string;
}

export interface TaskItemProps {
  task: Task;
  onClick?: (task: Task) => void;
  onComplete: (id: string, newStatus?: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  showDetails?: boolean;
  focusMode?: boolean;
}

export interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  in_progress: number;
  overdue: number;
  completion_rate: number;
  avg_completion_time: number;
  total_xp_earned: number;
}

export interface TaskIntervention {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
}

// ADHD-specific task enhancements
export interface ADHDTaskEnhancements {
  break_down_suggestion?: string;
  focus_tips?: string[];
  energy_matching_score?: number;
  procrastination_risk?: 'low' | 'medium' | 'high';
  recommended_time_blocks?: number[];
  context_switching_penalty?: number;
}