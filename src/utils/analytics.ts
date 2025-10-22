import { MoodType, EnergyLevel, TaskType } from '../types/adhd';
import { MessageIntent, ChatbotAction } from '../types/chatbot';
import { 
  UserEvent, 
  EventContext, 
  EventSequence, 
  EventBuffer, 
  PatternMiningConfig,
  DEFAULT_PATTERN_CONFIG,
  EVENT_BUFFER_SIZE 
} from '../types/patterns';

// Interfacce per eventi analytics
interface BaseEvent {
  timestamp: Date;
  sessionId: string;
  userId?: string;
}

interface ChatbotInteractionEvent extends BaseEvent {
  type: 'chatbot_interaction';
  data: {
    messageIntent: MessageIntent;
    responseTime: number;
    userSatisfaction?: 1 | 2 | 3 | 4 | 5;
    quickActionUsed?: boolean;
    mood?: MoodType;
    energyLevel?: EnergyLevel;
  };
}

interface QuickActionEvent extends BaseEvent {
  type: 'quick_action';
  data: {
    action: ChatbotAction;
    mood: MoodType;
    priority: 'high' | 'medium' | 'low';
    completed: boolean;
  };
}

interface MoodTrackingEvent extends BaseEvent {
  type: 'mood_tracking';
  data: {
    previousMood?: MoodType;
    newMood: MoodType;
    energyLevel: EnergyLevel;
    triggers?: string[];
    context?: 'manual' | 'automatic' | 'chatbot_suggested';
  };
}

interface TaskInteractionEvent extends BaseEvent {
  type: 'task_interaction';
  data: {
    action: 'create' | 'complete' | 'postpone' | 'delete' | 'modify';
    taskType: TaskType;
    estimatedDuration?: number;
    actualDuration?: number;
    mood?: MoodType;
    energyLevel?: EnergyLevel;
    source: 'manual' | 'chatbot_suggestion' | 'quick_action';
  };
}

interface FocusSessionEvent extends BaseEvent {
  type: 'focus_session';
  data: {
    duration: number;
    plannedDuration: number;
    interruptions: number;
    productivity: 1 | 2 | 3 | 4 | 5;
    mood: {
      before: MoodType;
      after: MoodType;
    };
    energyLevel: {
      before: EnergyLevel;
      after: EnergyLevel;
    };
  };
}

interface ErrorEvent extends BaseEvent {
  type: 'error';
  data: {
    component: string;
    errorMessage: string;
    errorStack?: string;
    userAction?: string;
    recovered: boolean;
  };
}

type AnalyticsEvent = 
  | ChatbotInteractionEvent 
  | QuickActionEvent 
  | MoodTrackingEvent 
  | TaskInteractionEvent 
  | FocusSessionEvent 
  | ErrorEvent;

// EventLogger avanzato per pattern mining
class EventLogger {
  private eventBuffer: EventBuffer;
  private sequences: EventSequence[] = [];
  private config: PatternMiningConfig;
  private sessionId: string;

  constructor(config: PatternMiningConfig = DEFAULT_PATTERN_CONFIG) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.eventBuffer = {
      events: [],
      maxSize: EVENT_BUFFER_SIZE,
      currentIndex: 0,
      isFull: false
    };
    this.loadPersistedData();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadPersistedData(): void {
    try {
      const savedBuffer = localStorage.getItem('tsunami_event_buffer');
      if (savedBuffer) {
        const parsed = JSON.parse(savedBuffer);
        this.eventBuffer = {
          ...this.eventBuffer,
          ...parsed,
          events: parsed.events.map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp)
          }))
        };
      }

      const savedSequences = localStorage.getItem('tsunami_event_sequences');
      if (savedSequences) {
        const parsed = JSON.parse(savedSequences);
        this.sequences = parsed.map((s: any) => ({
          ...s,
          lastOccurrence: new Date(s.lastOccurrence),
          events: s.events.map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp)
          }))
        }));
      }
    } catch (error) {
      console.warn('Failed to load persisted event data:', error);
    }
  }

  private persistData(): void {
    try {
      localStorage.setItem('tsunami_event_buffer', JSON.stringify(this.eventBuffer));
      localStorage.setItem('tsunami_event_sequences', JSON.stringify(this.sequences));
    } catch (error) {
      console.warn('Failed to persist event data:', error);
    }
  }

  public logEvent(event: Omit<UserEvent, 'id' | 'timestamp' | 'sessionId'>): void {
    if (!this.config.enabled) return;

    const fullEvent: UserEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sessionId: this.sessionId,
      ...event
    };

    this.addToBuffer(fullEvent);
    this.updateSequences(fullEvent);
    this.persistData();

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Event Logged:', fullEvent);
    }
  }

  private addToBuffer(event: UserEvent): void {
    if (this.eventBuffer.isFull) {
      // Sovrascrivi l'evento più vecchio
      this.eventBuffer.events[this.eventBuffer.currentIndex] = event;
    } else {
      this.eventBuffer.events.push(event);
    }

    this.eventBuffer.currentIndex = (this.eventBuffer.currentIndex + 1) % this.eventBuffer.maxSize;
    
    if (this.eventBuffer.events.length >= this.eventBuffer.maxSize) {
      this.eventBuffer.isFull = true;
    }
  }

  private updateSequences(newEvent: UserEvent): void {
    const recentEvents = this.getRecentEvents(10); // Ultimi 10 eventi
    
    // Cerca sequenze di lunghezza 2-5
    for (let length = 2; length <= Math.min(this.config.maxPatternLength, recentEvents.length); length++) {
      if (recentEvents.length < length) continue;
      
      const sequence = recentEvents.slice(-length);
      const pattern = sequence.map(e => e.type).join('→');
      
      this.recordSequence(sequence, pattern);
    }
  }

  private recordSequence(events: UserEvent[], pattern: string): void {
    const existingSequence = this.sequences.find(s => s.pattern === pattern);
    
    if (existingSequence) {
      existingSequence.frequency++;
      existingSequence.lastOccurrence = new Date();
      existingSequence.events = events; // Aggiorna con gli eventi più recenti
      
      // Calcola tempo medio tra eventi
      const timeDiffs = events.slice(1).map((e, i) => 
        e.timestamp.getTime() - events[i].timestamp.getTime()
      );
      existingSequence.avgTimeBetweenEvents = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
      
      // Aggiorna confidenza basata su frequenza
      existingSequence.confidence = Math.min(existingSequence.frequency / 10, 1);
    } else {
      const newSequence: EventSequence = {
        id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        events,
        pattern,
        frequency: 1,
        lastOccurrence: new Date(),
        confidence: 0.1,
        avgTimeBetweenEvents: 0,
        contexts: events.map(e => e.context)
      };
      
      this.sequences.push(newSequence);
    }
    
    // Pruning: rimuovi sequenze rare
    this.pruneRareSequences();
  }

  private pruneRareSequences(): void {
    const threshold = this.config.pruningThreshold;
    const totalSequences = this.sequences.length;
    
    this.sequences = this.sequences.filter(seq => {
      const relativeFrequency = seq.frequency / totalSequences;
      return relativeFrequency >= threshold || seq.frequency >= 3; // Mantieni almeno 3 occorrenze
    });
  }

  public getRecentEvents(count: number = 50): UserEvent[] {
    if (!this.eventBuffer.isFull) {
      return this.eventBuffer.events.slice(-count);
    }
    
    // Buffer circolare pieno - ricostruisci ordine cronologico
    const events = [
      ...this.eventBuffer.events.slice(this.eventBuffer.currentIndex),
      ...this.eventBuffer.events.slice(0, this.eventBuffer.currentIndex)
    ];
    
    return events.slice(-count);
  }

  public getEventSequences(): EventSequence[] {
    return [...this.sequences].sort((a, b) => b.frequency - a.frequency);
  }

  public getFrequentPatterns(minFrequency: number = 3): EventSequence[] {
    return this.sequences.filter(seq => seq.frequency >= minFrequency);
  }

  public clearOldData(olderThanDays: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    // Rimuovi eventi vecchi dal buffer
    this.eventBuffer.events = this.eventBuffer.events.filter(
      event => event.timestamp > cutoffDate
    );
    
    // Rimuovi sequenze vecchie
    this.sequences = this.sequences.filter(
      seq => seq.lastOccurrence > cutoffDate
    );
    
    this.persistData();
  }

  public getAnalytics() {
    const recentEvents = this.getRecentEvents();
    const eventTypes = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: this.eventBuffer.events.length,
      totalSequences: this.sequences.length,
      frequentPatterns: this.getFrequentPatterns().length,
      eventTypes,
      bufferUtilization: this.eventBuffer.events.length / this.eventBuffer.maxSize,
      avgSequenceLength: this.sequences.reduce((acc, seq) => acc + seq.events.length, 0) / this.sequences.length || 0
    };
  }
}

// Classe principale per analytics (estesa)
export class AnalyticsManager {
  private static instance: AnalyticsManager;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean = true;
  private eventLogger: EventLogger;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.eventLogger = new EventLogger();
    this.loadSettings();
  }

  public static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadSettings(): void {
    // Carica impostazioni privacy da localStorage
    const settings = localStorage.getItem('tsunami_analytics_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.isEnabled = parsed.enabled ?? true;
      this.userId = parsed.userId;
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
    this.saveSettings();
  }

  public getUserId(): string | undefined {
    return this.userId;
  }

  public getEventLogger(): EventLogger {
    return this.eventLogger;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.saveSettings();
    
    if (!enabled) {
      this.clearLocalData();
    }
  }

  private saveSettings(): void {
    const settings = {
      enabled: this.isEnabled,
      userId: this.userId
    };
    localStorage.setItem('tsunami_analytics_settings', JSON.stringify(settings));
  }

  private clearLocalData(): void {
    this.events = [];
    localStorage.removeItem('tsunami_analytics_events');
  }

  public track(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId' | 'userId'>): void {
    if (!this.isEnabled) return;

    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.userId
    } as AnalyticsEvent;

    this.events.push(fullEvent);
    this.persistEvents();
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', fullEvent);
    }
  }

  private persistEvents(): void {
    // Mantieni solo gli ultimi 1000 eventi per evitare overflow
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
    
    localStorage.setItem('tsunami_analytics_events', JSON.stringify(this.events));
  }

  public getInsights(): AnalyticsInsights {
    return new AnalyticsInsights(this.events);
  }

  public exportData(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      userId: this.userId,
      events: this.events,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Metodi di convenienza per eventi comuni
  public trackChatbotInteraction(
    messageIntent: MessageIntent,
    responseTime: number,
    options?: {
      userSatisfaction?: 1 | 2 | 3 | 4 | 5;
      quickActionUsed?: boolean;
      mood?: MoodType;
      energyLevel?: EnergyLevel;
    }
  ): void {
    this.track({
      type: 'chatbot_interaction',
      data: {
        messageIntent,
        responseTime,
        ...options
      }
    });
  }

  public trackQuickAction(
    action: ChatbotAction,
    mood: MoodType,
    priority: 'high' | 'medium' | 'low',
    completed: boolean = false
  ): void {
    this.track({
      type: 'quick_action',
      data: { action, mood, priority, completed }
    });
  }

  public trackMoodChange(
    newMood: MoodType,
    energyLevel: EnergyLevel,
    options?: {
      previousMood?: MoodType;
      triggers?: string[];
      context?: 'manual' | 'automatic' | 'chatbot_suggested';
    }
  ): void {
    this.track({
      type: 'mood_tracking',
      data: {
        newMood,
        energyLevel,
        context: 'manual',
        ...options
      }
    });
  }

  public trackTaskInteraction(
    action: 'create' | 'complete' | 'postpone' | 'delete' | 'modify',
    taskType: TaskType,
    options?: {
      estimatedDuration?: number;
      actualDuration?: number;
      energyLevel?: EnergyLevel;
      source?: 'manual' | 'chatbot_suggestion' | 'quick_action';
    }
  ): void {
    // Track nel sistema analytics esistente
    this.track({
      type: 'task_interaction',
      data: {
        action,
        taskType,
        ...options
      }
    });

    // Track nel nuovo EventLogger per pattern mining
    this.eventLogger.logEvent({
      type: action === 'create' ? 'task_created' : 
            action === 'complete' ? 'task_completed' : 
            action === 'postpone' ? 'task_postponed' : 'task_deleted',
      userId: this.userId,
      context: this.getCurrentContext(options?.energyLevel),
      metadata: {
        taskType,
        source: options?.source || 'manual',
        estimatedDuration: options?.estimatedDuration,
        actualDuration: options?.actualDuration
      }
    });
  }

  public trackRoutineActivation(
    routineId: string,
    completed: boolean = false,
    options?: {
      energyLevel?: EnergyLevel;
      duration?: number;
    }
  ): void {
    // Track nel nuovo EventLogger
    this.eventLogger.logEvent({
      type: completed ? 'routine_completed' : 'routine_activated',
      userId: this.userId,
      context: this.getCurrentContext(options?.energyLevel),
      metadata: {
        routineId,
        duration: options?.duration
      }
    });
  }

  public trackNoteProcessing(
    noteId: string,
    action: 'created' | 'converted_to_task' | 'archived',
    options?: {
      energyLevel?: EnergyLevel;
      wordCount?: number;
    }
  ): void {
    this.eventLogger.logEvent({
      type: 'note_processed',
      userId: this.userId,
      context: this.getCurrentContext(options?.energyLevel),
      metadata: {
        noteId,
        action,
        wordCount: options?.wordCount
      }
    });
  }

  private getCurrentContext(energyLevel?: EnergyLevel): EventContext {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    return {
      energyLevel: energyLevel ? this.mapEnergyToNumber(energyLevel) : 3,
      timeOfDay,
      dayOfWeek: now.getDay(),
      deviceType: this.detectDeviceType()
    };
  }

  private mapEnergyToNumber(energy: EnergyLevel): number {
    const mapping = { 'very-low': 1, 'low': 2, 'medium': 3, 'high': 4, 'very-high': 5 };
    return mapping[energy] || 3;
  }

  private detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  // Metodi per accedere all'EventLogger
  public getEventLogger(): EventLogger {
    return this.eventLogger;
  }

  public getRecentEvents(count?: number) {
    return this.eventLogger.getRecentEvents(count);
  }

  public getEventSequences() {
    return this.eventLogger.getEventSequences();
  }

  public getFrequentPatterns(minFrequency?: number) {
    return this.eventLogger.getFrequentPatterns(minFrequency);
  }

  public getPatternAnalytics() {
    return this.eventLogger.getAnalytics();
  }

  public trackError(
    component: string,
    error: Error,
    userAction?: string,
    recovered: boolean = false
  ): void {
    this.track({
      type: 'error',
      data: {
        component,
        errorMessage: error.message,
        errorStack: error.stack,
        userAction,
        recovered
      }
    });
  }
}

// Classe per analisi e insights
class AnalyticsInsights {
  constructor(private events: AnalyticsEvent[]) {}

  public getMoodPatterns(): {
    mostCommonMood: MoodType;
    moodDistribution: Record<MoodType, number>;
    moodTransitions: Array<{ from: MoodType; to: MoodType; count: number }>;
  } {
    const moodEvents = this.events.filter(e => e.type === 'mood_tracking') as MoodTrackingEvent[];
    
    const distribution: Record<string, number> = {};
    const transitions: Record<string, number> = {};
    
    let previousMood: MoodType | undefined;
    
    moodEvents.forEach(event => {
      const mood = event.data.newMood;
      distribution[mood] = (distribution[mood] || 0) + 1;
      
      if (previousMood) {
        const transition = `${previousMood}->${mood}`;
        transitions[transition] = (transitions[transition] || 0) + 1;
      }
      
      previousMood = mood;
    });
    
    const mostCommonMood = Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as MoodType || 'disorientato';
    
    const moodTransitions = Object.entries(transitions)
      .map(([transition, count]) => {
        const [from, to] = transition.split('->');
        return { from: from as MoodType, to: to as MoodType, count };
      })
      .sort((a, b) => b.count - a.count);
    
    return {
      mostCommonMood,
      moodDistribution: distribution as Record<MoodType, number>,
      moodTransitions
    };
  }

  public getChatbotEffectiveness(): {
    averageResponseTime: number;
    averageSatisfaction: number;
    mostCommonIntents: Array<{ intent: MessageIntent; count: number }>;
    quickActionUsageRate: number;
  } {
    const chatbotEvents = this.events.filter(e => e.type === 'chatbot_interaction') as ChatbotInteractionEvent[];
    
    if (chatbotEvents.length === 0) {
      return {
        averageResponseTime: 0,
        averageSatisfaction: 0,
        mostCommonIntents: [],
        quickActionUsageRate: 0
      };
    }
    
    const totalResponseTime = chatbotEvents.reduce((sum, e) => sum + e.data.responseTime, 0);
    const satisfactionRatings = chatbotEvents
      .filter(e => e.data.userSatisfaction)
      .map(e => e.data.userSatisfaction!);
    
    const intentCounts: Record<string, number> = {};
    let quickActionUsed = 0;
    
    chatbotEvents.forEach(event => {
      const intent = event.data.messageIntent;
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      
      if (event.data.quickActionUsed) {
        quickActionUsed++;
      }
    });
    
    const mostCommonIntents = Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent: intent as MessageIntent, count }))
      .sort((a, b) => b.count - a.count);
    
    return {
      averageResponseTime: totalResponseTime / chatbotEvents.length,
      averageSatisfaction: satisfactionRatings.length > 0 
        ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length 
        : 0,
      mostCommonIntents,
      quickActionUsageRate: (quickActionUsed / chatbotEvents.length) * 100
    };
  }

  public getProductivityMetrics(): {
    averageFocusSessionDuration: number;
    focusSessionCompletionRate: number;
    averageProductivityRating: number;
    bestFocusTimes: string[];
  } {
    const focusEvents = this.events.filter(e => e.type === 'focus_session') as FocusSessionEvent[];
    
    if (focusEvents.length === 0) {
      return {
        averageFocusSessionDuration: 0,
        focusSessionCompletionRate: 0,
        averageProductivityRating: 0,
        bestFocusTimes: []
      };
    }
    
    const totalDuration = focusEvents.reduce((sum, e) => sum + e.data.duration, 0);
    const completedSessions = focusEvents.filter(e => e.data.duration >= e.data.plannedDuration * 0.8);
    const totalProductivity = focusEvents.reduce((sum, e) => sum + e.data.productivity, 0);
    
    // Analizza i migliori orari per il focus
    const hourlyProductivity: Record<number, { total: number; count: number }> = {};
    
    focusEvents.forEach(event => {
      const hour = event.timestamp.getHours();
      if (!hourlyProductivity[hour]) {
        hourlyProductivity[hour] = { total: 0, count: 0 };
      }
      hourlyProductivity[hour].total += event.data.productivity;
      hourlyProductivity[hour].count += 1;
    });
    
    const bestFocusTimes = Object.entries(hourlyProductivity)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        avgProductivity: data.total / data.count
      }))
      .sort((a, b) => b.avgProductivity - a.avgProductivity)
      .slice(0, 3)
      .map(item => `${item.hour}:00-${item.hour + 1}:00`);
    
    return {
      averageFocusSessionDuration: totalDuration / focusEvents.length,
      focusSessionCompletionRate: (completedSessions.length / focusEvents.length) * 100,
      averageProductivityRating: totalProductivity / focusEvents.length,
      bestFocusTimes
    };
  }
}

// Istanza singleton
export const analytics = new AnalyticsManager();

// Hook React per analytics
export const useAnalytics = () => {
  return {
    track: analytics.track.bind(analytics),
    trackChatbotInteraction: analytics.trackChatbotInteraction.bind(analytics),
    trackQuickAction: analytics.trackQuickAction.bind(analytics),
    trackMoodChange: analytics.trackMoodChange.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    getInsights: analytics.getInsights.bind(analytics),
    setEnabled: analytics.setEnabled.bind(analytics),
    exportData: analytics.exportData.bind(analytics)
  };
};

// Note: AnalyticsDashboard component moved to separate .tsx file to avoid JSX in .ts file