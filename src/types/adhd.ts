// TypeScript types for ADHD-specific functionality
// Specialized types for ADHD task management and support

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  task_type: TaskType;
  energy_required: EnergyLevel;
  xp_reward: number;
  created_at?: Date;
  updated_at?: Date;
  completed_at?: Date;
  // estimated_duration removed - not in database schema
  actual_duration?: number; // in minutes
  // difficulty_level removed
  tags?: string[];
  parent_task_id?: string;
  subtasks?: Task[];
  context_switching_cost?: 'low' | 'medium' | 'high';
  // requires_deep_focus?: boolean; // Removed - not in database schema
  can_be_interrupted?: boolean;
}

export interface ADHDProfile {
  userId: string;
  diagnosis_type?: 'inattentive' | 'hyperactive' | 'combined';
  primary_challenges: ADHDChallenge[];
  coping_strategies: CopingStrategy[];
  medication_schedule?: MedicationSchedule;
  energy_patterns: EnergyPattern[];
  focus_preferences: FocusPreferences;
  sensory_preferences: SensoryPreferences;
  created_at: Date;
  updated_at: Date;
}

export interface ADHDChallenge {
  type: 'time_management' | 'organization' | 'focus' | 'emotional_regulation' | 'working_memory' | 'executive_function';
  severity: 1 | 2 | 3 | 4 | 5;
  triggers?: string[];
  impact_areas: string[];
}

export interface CopingStrategy {
  name: string;
  type: 'environmental' | 'behavioral' | 'cognitive' | 'technological';
  effectiveness: 1 | 2 | 3 | 4 | 5;
  context: string[];
  description: string;
  last_used?: Date;
  success_rate?: number;
}

export interface MedicationSchedule {
  medications: Medication[];
  peak_effectiveness_hours: number[];
  side_effects?: string[];
  notes?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  timing: string[];
  duration_hours: number;
}

export interface EnergyPattern {
  time_of_day: 'morning' | 'late_morning' | 'afternoon' | 'evening' | 'night';
  typical_energy_level: 1 | 2 | 3 | 4 | 5;
  focus_quality: 'poor' | 'fair' | 'good' | 'excellent';
  best_for_tasks: TaskType[];
  notes?: string;
}

export interface FocusPreferences {
  optimal_session_length: number; // in minutes
  break_frequency: number; // minutes between breaks
  break_duration: number; // minutes
  environment_type: 'quiet' | 'background_noise' | 'music' | 'nature_sounds';
  lighting_preference: 'bright' | 'dim' | 'natural';
  temperature_preference: 'cool' | 'warm' | 'neutral';
  distraction_tolerance: 'very_low' | 'low' | 'medium' | 'high';
}

export interface SensoryPreferences {
  sound_sensitivity: 1 | 2 | 3 | 4 | 5;
  light_sensitivity: 1 | 2 | 3 | 4 | 5;
  texture_preferences: string[];
  fidget_tools: string[];
  calming_activities: string[];
  stimulating_activities: string[];
}

export interface FocusSession {
  id: string;
  start_time: Date;
  end_time?: Date;
  planned_duration: number; // minutes
  actual_duration?: number; // minutes
  task_id?: string;
  session_type: 'pomodoro' | 'deep_work' | 'quick_burst' | 'maintenance';
  interruptions: Interruption[];
  productivity_rating?: 1 | 2 | 3 | 4 | 5;
  mood_before: MoodType;
  mood_after?: MoodType;
  energy_before: 1 | 2 | 3 | 4 | 5;
  energy_after?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface Interruption {
  timestamp: Date;
  type: 'internal' | 'external';
  source: string;
  duration: number; // seconds
  handled_well: boolean;
  notes?: string;
}

export interface DailyMoodEntry {
  date: Date;
  mood: MoodType;
  energy_level: 1 | 2 | 3 | 4 | 5;
  focus_quality: 1 | 2 | 3 | 4 | 5;
  stress_level: 1 | 2 | 3 | 4 | 5;
  sleep_quality?: 1 | 2 | 3 | 4 | 5;
  medication_taken?: boolean;
  significant_events?: string[];
  suggested_ritual: string;
  ritual_completed?: boolean;
  notes?: string;
}

export interface OverwhelmIndicator {
  timestamp: Date;
  trigger_type: 'task_overload' | 'time_pressure' | 'decision_fatigue' | 'sensory_overload' | 'emotional_dysregulation';
  severity: 1 | 2 | 3 | 4 | 5;
  context: string;
  coping_strategy_used?: string;
  resolution_time?: number; // minutes
  effectiveness?: 1 | 2 | 3 | 4 | 5;
}

export interface HyperfocusSession {
  id: string;
  start_time: Date;
  end_time?: Date;
  task_id: string;
  duration: number; // minutes
  productivity_outcome: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  physical_impact: 'none' | 'mild_fatigue' | 'exhaustion' | 'physical_discomfort';
  emotional_impact: 'energized' | 'satisfied' | 'neutral' | 'drained' | 'frustrated';
  recovery_time?: number; // minutes
  notes?: string;
}

// Type aliases for commonly used types
export type TaskType = 'azione' | 'riflessione' | 'comunicazione' | 'creativita' | 'organizzazione';
export type EnergyLevel = 'molto_bassa' | 'bassa' | 'media' | 'alta' | 'molto_alta';
export type MoodType = 'congelato' | 'disorientato' | 'in_flusso' | 'ispirato';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Utility types for task management
export interface TaskFilter {
  status?: TaskStatus[];
  task_type?: TaskType[];
  energy_required?: EnergyLevel[];
  due_date_range?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  // difficulty_level removed
}

export interface TaskSort {
  field: 'due_date' | 'created_at' | 'xp_reward' | 'energy_required';
  direction: 'asc' | 'desc';
}

export interface SmartTaskSuggestion {
  task: Task;
  score: number;
  reasoning: string[];
  optimal_time?: string;
  estimated_success_rate: number;
  energy_match_score: number;
  mood_compatibility: number;
}