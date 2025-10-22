// Pattern Mining & Event Tracking Types

// Tipi base per eventi utente avanzati
export interface UserEvent {
  id: string;
  type: 'task_created' | 'task_completed' | 'task_postponed' | 'task_deleted' | 
        'routine_activated' | 'routine_completed' | 'note_processed' | 
        'chatbot_interaction' | 'quick_action' | 'mood_change' | 'focus_session';
  timestamp: Date;
  sessionId: string;
  userId?: string;
  context: EventContext;
  metadata: Record<string, any>;
}

export interface EventContext {
  energyLevel: number; // 1-5
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number; // 0-6
  previousAction?: string;
  currentMood?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  location?: 'home' | 'work' | 'other';
}

// Sequenze di eventi per pattern detection
export interface EventSequence {
  id: string;
  events: UserEvent[];
  pattern: string; // es. "task_created→routine_activated→task_completed"
  frequency: number;
  lastOccurrence: Date;
  confidence: number; // 0-1
  avgTimeBetweenEvents: number; // millisecondi
  contexts: EventContext[]; // contesti in cui si verifica il pattern
}

// Pattern identificati dal mining
export interface Pattern {
  id: string;
  type: 'sequence' | 'temporal' | 'contextual' | 'behavioral';
  name: string;
  description: string;
  rule: PatternRule;
  frequency: number;
  confidence: number;
  support: number; // percentuale di sessioni in cui appare
  lastDetected: Date;
  metadata: {
    avgDuration?: number;
    successRate?: number;
    energyCorrelation?: number;
    timeCorrelation?: string[];
    triggers?: string[];
  };
}

export interface PatternRule {
  conditions: PatternCondition[];
  action: PatternAction;
  threshold: number;
}

export interface PatternCondition {
  field: string; // es. 'type', 'context.energyLevel', 'context.timeOfDay'
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
  weight?: number;
}

export interface PatternAction {
  type: 'suggest' | 'automate' | 'notify' | 'reorder';
  payload: {
    suggestion?: string;
    automation?: AutomationRule;
    notification?: NotificationConfig;
    reorderCriteria?: ReorderCriteria;
  };
}

// Automazioni basate su pattern
export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: PatternTrigger;
  action: AutomationAction;
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
  successRate: number;
}

export interface PatternTrigger {
  patternId: string;
  conditions: PatternCondition[];
  cooldown?: number; // millisecondi tra trigger
}

export interface AutomationAction {
  type: 'create_task' | 'suggest_routine' | 'reorder_list' | 'send_notification' | 'adjust_priority';
  parameters: Record<string, any>;
}

// Suggerimenti intelligenti
export interface SmartSuggestion {
  id: string;
  type: 'next_action' | 'routine_optimization' | 'task_grouping' | 'timing_suggestion';
  title: string;
  description: string;
  confidence: number;
  basedOnPattern: string; // pattern ID
  action: SuggestionAction;
  expiresAt?: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface SuggestionAction {
  type: 'create' | 'modify' | 'delete' | 'reorder' | 'schedule';
  target: 'task' | 'routine' | 'note' | 'automation';
  payload: Record<string, any>;
}

// Clustering e categorizzazione
export interface TaskCluster {
  id: string;
  name: string;
  tasks: string[]; // task IDs
  centroid: TaskFeatures;
  similarity: number; // similarità media interna
  category: 'work' | 'personal' | 'health' | 'learning' | 'maintenance' | 'creative';
  patterns: string[]; // pattern IDs associati
}

export interface TaskFeatures {
  titleWords: string[];
  estimatedDuration: number;
  priority: number;
  energyRequired: number;
  timeOfDayPreference: string[];
  tags: string[];
  complexity: number;
}

// Buffer circolare per eventi recenti
export interface EventBuffer {
  events: UserEvent[];
  maxSize: number;
  currentIndex: number;
  isFull: boolean;
}

// Configurazioni e impostazioni
export interface PatternMiningConfig {
  enabled: boolean;
  minSupport: number; // soglia minima per pattern (0-1)
  minConfidence: number; // soglia minima confidenza (0-1)
  maxPatternLength: number; // lunghezza massima sequenze
  slidingWindowSize: number; // dimensione buffer eventi
  miningInterval: number; // millisecondi tra sessioni mining
  pruningThreshold: number; // soglia per eliminare pattern rari
}

export interface NotificationConfig {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
}

export interface ReorderCriteria {
  by: 'frequency' | 'success_rate' | 'energy_match' | 'time_preference';
  direction: 'asc' | 'desc';
  groupBy?: 'category' | 'energy_level' | 'time_of_day';
}

// Analytics e metriche per pattern
export interface PatternAnalytics {
  totalPatternsDetected: number;
  activePatterns: number;
  suggestionAccuracy: number; // % suggerimenti accettati
  automationUsage: number; // % automazioni utilizzate
  userEngagement: number; // interazioni con suggerimenti
  performanceMetrics: {
    miningTime: number; // ms medio per sessione mining
    memoryUsage: number; // MB utilizzati
    cacheHitRate: number; // % hit cache pattern
    eventProcessingRate: number; // eventi/secondo
  };
  patternDistribution: {
    sequence: number;
    temporal: number;
    contextual: number;
    behavioral: number;
  };
}

// Stato del sistema di pattern mining
export interface PatternMiningState {
  isActive: boolean;
  lastMiningSession: Date;
  eventsProcessed: number;
  patternsDetected: number;
  suggestionsGenerated: number;
  automationsTriggered: number;
  config: PatternMiningConfig;
  buffer: EventBuffer;
  cache: Map<string, Pattern[]>;
}

// Tipi per export/import dati
export interface PatternDataExport {
  version: string;
  exportedAt: Date;
  userId?: string;
  patterns: Pattern[];
  automations: AutomationRule[];
  analytics: PatternAnalytics;
  config: PatternMiningConfig;
}

// Utility types
export type PatternType = Pattern['type'];
export type EventType = UserEvent['type'];
export type SuggestionType = SmartSuggestion['type'];
export type AutomationType = AutomationAction['type'];

// Costanti per i tipi di pattern
export const PATTERN_TYPES = {
  SEQUENCE: 'sequence' as const,
  TEMPORAL: 'temporal' as const,
  CONTEXTUAL: 'contextual' as const,
  BEHAVIORAL: 'behavioral' as const,
  ENERGY_BASED: 'energy_based' as const
};

// Costanti per i tipi di automazione
export const AUTOMATION_TYPES = {
  TASK_CREATION: 'task_creation' as const,
  ROUTINE_ACTIVATION: 'routine_activation' as const,
  NOTIFICATION: 'notification' as const,
  SUGGESTION: 'suggestion' as const,
  MOOD_ADJUSTMENT: 'mood_adjustment' as const
};

// Costanti per i tipi di suggerimenti
export const SUGGESTION_TYPES = {
  TASK_OPTIMIZATION: 'task_optimization' as const,
  ROUTINE_IMPROVEMENT: 'routine_improvement' as const,
  ENERGY_MANAGEMENT: 'energy_management' as const,
  TIME_BLOCKING: 'time_blocking' as const,
  FOCUS_ENHANCEMENT: 'focus_enhancement' as const,
  AUTOMATION_TRIGGERED: 'automation_triggered' as const,
  TASK_REORDERING: 'task_reordering' as const,
  BREAK_REMINDER: 'break_reminder' as const,
  ENERGY_OPTIMIZATION: 'energy_optimization' as const,
  TASK_POSTPONEMENT: 'task_postponement' as const,
  TIME_MANAGEMENT: 'time_management' as const
};

// Costanti per i tipi di notifica
export const NOTIFICATION_TYPES = {
  INFO: 'info' as const,
  SUCCESS: 'success' as const,
  WARNING: 'warning' as const,
  ERROR: 'error' as const,
  REMINDER: 'reminder' as const,
  SUGGESTION: 'suggestion' as const
};

// Costanti di configurazione
export const DEFAULT_PATTERN_CONFIG: PatternMiningConfig = {
  enabled: true,
  minSupport: 0.1, // 10% delle sessioni
  minConfidence: 0.6, // 60% confidenza
  maxPatternLength: 5,
  slidingWindowSize: 1000,
  miningInterval: 300000, // 5 minuti
  pruningThreshold: 0.05 // 5% soglia eliminazione
};

export const EVENT_BUFFER_SIZE = 1000;
export const PATTERN_CACHE_TTL = 3600000; // 1 ora
export const MAX_SUGGESTIONS_PER_SESSION = 5;
export const AUTOMATION_COOLDOWN = 60000; // 1 minuto