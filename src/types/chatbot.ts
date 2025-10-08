// TypeScript types for chatbot functionality
// Centralized type definitions for better maintainability

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  intent?: string;
  confidence?: number;
  quickActions?: QuickAction[];
  showTextInput?: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  action: string;
  icon?: string;
  context?: 'low_energy' | 'high_energy' | 'overwhelmed' | 'focused' | 'general';
  category?: 'energy' | 'tasks' | 'focus' | 'progress' | 'quick';
}

export interface ADHDContext {
  currentMood?: string;
  energyLevel?: number;
  focusMode?: boolean;
  activeTasks?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  workingMemoryLoad?: number;
  distractionLevel?: number;
  lastCompletedTask?: string;
  sessionStartTime?: Date;
  todayMood?: MoodContext;
}

export interface MoodContext {
  mood: 'congelato' | 'disorientato' | 'in_flusso' | 'ispirato';
  suggested_ritual: string;
  date: Date;
}

export interface UserBehaviorPattern {
  preferredTaskTypes: string[];
  peakEnergyHours: number[];
  averageTaskDuration: number;
  procrastinationTriggers: string[];
  successfulStrategies: string[];
  completionRate: number;
  lastActiveTime?: Date;
  sessionCount?: number;
  averageSessionDuration?: number;
}

export interface ChatbotResponse {
  content: string;
  intent: string;
  confidence: number;
  quickActions?: QuickAction[];
  suggestions?: string[];
  moodEnhanced?: boolean;
}

export interface IntentClassification {
  intent: string;
  confidence: number;
  entities?: Record<string, any>;
}

export interface ConversationContext {
  lastIntent?: string;
  conversationFlow?: string[];
  userPreferences?: UserPreferences;
  sessionMetrics?: SessionMetrics;
}

export interface UserPreferences {
  preferredResponseStyle: 'concise' | 'detailed' | 'encouraging';
  enableQuickActions: boolean;
  showMoodSuggestions: boolean;
  reminderFrequency: 'low' | 'medium' | 'high';
}

export interface SessionMetrics {
  startTime: Date;
  messageCount: number;
  tasksCreated: number;
  tasksCompleted: number;
  moodChanges: number;
  focusSessionsStarted: number;
}

// Action types for chatbot interactions
export type ChatbotAction = 
  | 'navigate_to_tasks'
  | 'open_mental_inbox'
  | 'enable_focus_mode'
  | 'create_quick_list'
  | 'start_micro_timer'
  | 'suggest_easy_task'
  | 'suggest_environment_change'
  | 'start_focus_timer'
  | 'enable_dnd_mode'
  | 'manage_energy'
  | 'organize_tasks'
  | 'improve_focus'
  | 'view_progress'
  | 'quick_action'
  | 'break_task'
  | 'prioritize_tasks'
  | 'change_environment'
  | 'take_break'
  | 'show_achievements'
  | 'suggest_strategy'
  | 'quick_capture'
  | 'create_project'
  | 'show_mood_selector'
  | 'start_pomodoro'
  | 'take_break';

// Intent types for message classification
export type MessageIntent = 
  | 'greeting'
  | 'task_help'
  | 'emotional_state'
  | 'overwhelm_support'
  | 'focus_request'
  | 'break_request'
  | 'mood_update'
  | 'strategy_request'
  | 'progress_check'
  | 'app_help'
  | 'understanding_check'
  | 'why_suggestion';

// Mood types
export type MoodType = 'congelato' | 'disorientato' | 'in_flusso' | 'ispirato';

// Energy levels
export type EnergyLevel = 'molto_bassa' | 'bassa' | 'media' | 'alta' | 'molto_alta';

// Task types
export type TaskType = 'azione' | 'riflessione' | 'comunicazione' | 'creativita' | 'organizzazione';