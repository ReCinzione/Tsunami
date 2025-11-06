import { 
  UserEvent, 
  EventSequence, 
  Pattern, 
  PatternRule, 
  AutomationRule, 
  SmartSuggestion, 
  TaskCluster, 
  TaskFeatures, 
  PatternMiningConfig, 
  PatternAnalytics, 
  PatternMiningState,
  EventType,
  PATTERN_TYPES,
  AUTOMATION_TYPES,
  SUGGESTION_TYPES
} from '../types/patterns';
import { TaskType, EnergyLevel } from '../types';

export class PatternMiningEngine {
  private config: PatternMiningConfig;
  private state: PatternMiningState;
  private patterns: Map<string, Pattern> = new Map();
  private automationRules: Map<string, AutomationRule> = new Map();
  private taskClusters: TaskCluster[] = [];

  constructor(config: Partial<PatternMiningConfig> = {}) {
    this.config = {
      minPatternFrequency: 3,
      minSequenceLength: 2,
      maxSequenceLength: 5,
      timeWindowHours: 24,
      confidenceThreshold: 0.7,
      enableAutomations: true,
      enableSuggestions: true,
      maxSuggestions: 5,
      ...config
    };

    this.state = {
      isProcessing: false,
      lastProcessedAt: null,
      totalPatternsFound: 0,
      activeAutomations: 0,
      processingErrors: []
    };
  }

  // Pattern Detection
  public async detectPatterns(events: UserEvent[]): Promise<Pattern[]> {
    this.state.isProcessing = true;
    const detectedPatterns: Pattern[] = [];

    try {
      // 1. Temporal Patterns
      const temporalPatterns = this.detectTemporalPatterns(events);
      detectedPatterns.push(...temporalPatterns);

      // 2. Sequential Patterns
      const sequentialPatterns = this.detectSequentialPatterns(events);
      detectedPatterns.push(...sequentialPatterns);

      // 3. Context-based Patterns
      const contextPatterns = this.detectContextPatterns(events);
      detectedPatterns.push(...contextPatterns);

      // 4. Energy-based Patterns
      const energyPatterns = this.detectEnergyPatterns(events);
      detectedPatterns.push(...energyPatterns);

      // Store patterns
      detectedPatterns.forEach(pattern => {
        this.patterns.set(pattern.id, pattern);
      });

      this.state.totalPatternsFound = this.patterns.size;
      this.state.lastProcessedAt = new Date();

    } catch (error) {
      this.state.processingErrors.push({
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'detectPatterns'
      });
    } finally {
      this.state.isProcessing = false;
    }

    return detectedPatterns;
  }

  private detectTemporalPatterns(events: UserEvent[]): Pattern[] {
    const patterns: Pattern[] = [];
    const timeGroups = this.groupEventsByTime(events);

    Object.entries(timeGroups).forEach(([timeSlot, slotEvents]) => {
      if (slotEvents.length >= this.config.minPatternFrequency) {
        const eventTypes = slotEvents.map(e => e.type);
        const mostCommon = this.getMostCommonEventType(eventTypes);

        if (mostCommon.frequency >= this.config.minPatternFrequency) {
          patterns.push({
            id: `temporal_${timeSlot}_${mostCommon.type}`,
            type: PATTERN_TYPES.TEMPORAL,
            name: `${mostCommon.type} pattern at ${timeSlot}`,
            description: `User tends to ${mostCommon.type} during ${timeSlot}`,
            frequency: mostCommon.frequency,
            confidence: mostCommon.frequency / slotEvents.length,
            conditions: [{
              field: 'context.timeOfDay',
              operator: 'equals',
              value: timeSlot
            }],
            actions: [{
              type: 'suggest_task_timing',
              parameters: {
                preferredTime: timeSlot,
                taskType: mostCommon.type
              }
            }],
            createdAt: new Date(),
            lastTriggered: null,
            isActive: true
          });
        }
      }
    });

    return patterns;
  }

  private detectSequentialPatterns(events: UserEvent[]): Pattern[] {
    const patterns: Pattern[] = [];
    const sequences = this.extractEventSequences(events);
    const sequenceFrequency = new Map<string, number>();

    // Count sequence frequencies
    sequences.forEach(seq => {
      const key = seq.events.map(e => e.type).join('->');
      sequenceFrequency.set(key, (sequenceFrequency.get(key) || 0) + 1);
    });

    // Create patterns for frequent sequences
    sequenceFrequency.forEach((frequency, sequenceKey) => {
      if (frequency >= this.config.minPatternFrequency) {
        const eventTypes = sequenceKey.split('->');
        patterns.push({
          id: `sequential_${sequenceKey.replace(/[^a-zA-Z0-9]/g, '_')}`,
          type: PATTERN_TYPES.SEQUENTIAL,
          name: `Sequential pattern: ${sequenceKey}`,
          description: `User often follows ${eventTypes[0]} with ${eventTypes.slice(1).join(', then ')}`,
          frequency,
          confidence: frequency / sequences.length,
          conditions: eventTypes.slice(0, -1).map((type, index) => ({
            field: 'previousEvents',
            operator: 'contains',
            value: type
          })),
          actions: [{
            type: 'suggest_next_action',
            parameters: {
              suggestedAction: eventTypes[eventTypes.length - 1],
              sequence: eventTypes
            }
          }],
          createdAt: new Date(),
          lastTriggered: null,
          isActive: true
        });
      }
    });

    return patterns;
  }

  private detectContextPatterns(events: UserEvent[]): Pattern[] {
    const patterns: Pattern[] = [];
    const contextGroups = this.groupEventsByContext(events);

    Object.entries(contextGroups).forEach(([contextKey, contextEvents]) => {
      if (contextEvents.length >= this.config.minPatternFrequency) {
        const taskTypes = contextEvents
          .filter(e => e.type.includes('task'))
          .map(e => e.metadata?.taskType)
          .filter(Boolean);

        if (taskTypes.length > 0) {
          const mostCommonTask = this.getMostCommonValue(taskTypes);
          if (mostCommonTask.frequency >= this.config.minPatternFrequency) {
            patterns.push({
              id: `context_${contextKey}_${mostCommonTask.value}`,
              type: PATTERN_TYPES.CONTEXTUAL,
              name: `${mostCommonTask.value} tasks in ${contextKey}`,
              description: `User prefers ${mostCommonTask.value} tasks when ${contextKey}`,
              frequency: mostCommonTask.frequency,
              confidence: mostCommonTask.frequency / contextEvents.length,
              conditions: this.parseContextConditions(contextKey),
              actions: [{
                type: 'suggest_task_type',
                parameters: {
                  taskType: mostCommonTask.value,
                  context: contextKey
                }
              }],
              createdAt: new Date(),
              lastTriggered: null,
              isActive: true
            });
          }
        }
      }
    });

    return patterns;
  }

  private detectEnergyPatterns(events: UserEvent[]): Pattern[] {
    const patterns: Pattern[] = [];
    const energyGroups = this.groupEventsByEnergy(events);

    Object.entries(energyGroups).forEach(([energyLevel, energyEvents]) => {
      if (energyEvents.length >= this.config.minPatternFrequency) {
        const completedTasks = energyEvents.filter(e => e.type === 'task_completed');
        const taskTypes = completedTasks.map(e => e.metadata?.taskType).filter(Boolean);

        if (taskTypes.length > 0) {
          const mostSuccessful = this.getMostCommonValue(taskTypes);
          patterns.push({
            id: `energy_${energyLevel}_${mostSuccessful.value}`,
            type: PATTERN_TYPES.ENERGY_BASED,
            name: `${mostSuccessful.value} tasks at ${energyLevel} energy`,
            description: `User completes ${mostSuccessful.value} tasks most successfully at ${energyLevel} energy level`,
            frequency: mostSuccessful.frequency,
            confidence: mostSuccessful.frequency / completedTasks.length,
            conditions: [{
              field: 'context.energyLevel',
              operator: 'equals',
              value: energyLevel
            }],
            actions: [{
              type: 'suggest_optimal_timing',
              parameters: {
                taskType: mostSuccessful.value,
                optimalEnergyLevel: energyLevel
              }
            }],
            createdAt: new Date(),
            lastTriggered: null,
            isActive: true
          });
        }
      }
    });

    return patterns;
  }

  // Smart Suggestions
  public generateSmartSuggestions(currentContext: any): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const activePatterns = Array.from(this.patterns.values()).filter(p => p.isActive);

    activePatterns.forEach(pattern => {
      if (this.patternMatchesContext(pattern, currentContext)) {
        const suggestion = this.createSuggestionFromPattern(pattern, currentContext);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    });

    // Sort by confidence and limit
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxSuggestions);
  }

  // Task Clustering
  public clusterTasks(events: UserEvent[]): TaskCluster[] {
    const taskEvents = events.filter(e => e.type.includes('task'));
    const taskFeatures = taskEvents.map(e => this.extractTaskFeatures(e));

    // Bucketing pre-clustering to reduce pairwise comparisons
    const buckets = new Map<string, number[]>();
    taskFeatures.forEach((f, idx) => {
      const key = `${f.taskType}|${f.timeOfDay}`;
      const list = buckets.get(key) || [];
      list.push(idx);
      buckets.set(key, list);
    });

    const clusters: TaskCluster[] = [];
    const globallyProcessed = new Set<number>();

    // Cluster within each bucket
    buckets.forEach((indices, bucketKey) => {
      const processed = new Set<number>();

      indices.forEach((index) => {
        if (processed.has(index) || globallyProcessed.has(index)) return;

        const features = taskFeatures[index];
        const cluster: TaskCluster = {
          id: `cluster_${clusters.length}`,
          name: `Task cluster ${clusters.length + 1}`,
          tasks: [features],
          centroid: features,
          characteristics: this.analyzeClusterCharacteristics([features]),
          createdAt: new Date()
        };

        // Compare only within the same bucket
        indices.forEach((otherIndex) => {
          if (otherIndex !== index && !processed.has(otherIndex) && !globallyProcessed.has(otherIndex)) {
            const otherFeatures = taskFeatures[otherIndex];
            const similarity = this.calculateTaskSimilarity(features, otherFeatures);
            if (similarity > 0.7) {
              cluster.tasks.push(otherFeatures);
              processed.add(otherIndex);
              globallyProcessed.add(otherIndex);
            }
          }
        });

        if (cluster.tasks.length >= 2) {
          cluster.centroid = this.calculateClusterCentroid(cluster.tasks);
          cluster.characteristics = this.analyzeClusterCharacteristics(cluster.tasks);
          clusters.push(cluster);
        }

        processed.add(index);
        globallyProcessed.add(index);
      });
    });

    this.taskClusters = clusters;
    return clusters;
  }

  // Utility methods
  private groupEventsByTime(events: UserEvent[]): Record<string, UserEvent[]> {
    const groups: Record<string, UserEvent[]> = {};
    
    events.forEach(event => {
      const timeOfDay = event.context.timeOfDay;
      if (!groups[timeOfDay]) groups[timeOfDay] = [];
      groups[timeOfDay].push(event);
    });

    return groups;
  }

  private groupEventsByContext(events: UserEvent[]): Record<string, UserEvent[]> {
    const groups: Record<string, UserEvent[]> = {};
    
    events.forEach(event => {
      const contextKey = `${event.context.timeOfDay}_${event.context.deviceType}_energy${event.context.energyLevel}`;
      if (!groups[contextKey]) groups[contextKey] = [];
      groups[contextKey].push(event);
    });

    return groups;
  }

  private groupEventsByEnergy(events: UserEvent[]): Record<string, UserEvent[]> {
    const groups: Record<string, UserEvent[]> = {};
    
    events.forEach(event => {
      const energyKey = `level_${event.context.energyLevel}`;
      if (!groups[energyKey]) groups[energyKey] = [];
      groups[energyKey].push(event);
    });

    return groups;
  }

  private getMostCommonEventType(eventTypes: string[]): { type: string; frequency: number } {
    const frequency = new Map<string, number>();
    eventTypes.forEach(type => {
      frequency.set(type, (frequency.get(type) || 0) + 1);
    });

    let maxFreq = 0;
    let mostCommon = '';
    frequency.forEach((freq, type) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mostCommon = type;
      }
    });

    return { type: mostCommon, frequency: maxFreq };
  }

  private getMostCommonValue(values: any[]): { value: any; frequency: number } {
    const frequency = new Map<any, number>();
    values.forEach(value => {
      frequency.set(value, (frequency.get(value) || 0) + 1);
    });

    let maxFreq = 0;
    let mostCommon = null;
    frequency.forEach((freq, value) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mostCommon = value;
      }
    });

    return { value: mostCommon, frequency: maxFreq };
  }

  private extractEventSequences(events: UserEvent[]): EventSequence[] {
    const sequences: EventSequence[] = [];
    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (let i = 0; i < sortedEvents.length - this.config.minSequenceLength + 1; i++) {
      for (let len = this.config.minSequenceLength; len <= this.config.maxSequenceLength && i + len <= sortedEvents.length; len++) {
        const sequenceEvents = sortedEvents.slice(i, i + len);
        const timeSpan = sequenceEvents[sequenceEvents.length - 1].timestamp.getTime() - sequenceEvents[0].timestamp.getTime();
        
        if (timeSpan <= this.config.timeWindowHours * 60 * 60 * 1000) {
          sequences.push({
            id: `seq_${i}_${len}`,
            events: sequenceEvents,
            startTime: sequenceEvents[0].timestamp,
            endTime: sequenceEvents[sequenceEvents.length - 1].timestamp,
            duration: timeSpan
          });
        }
      }
    }

    return sequences;
  }

  private parseContextConditions(contextKey: string): any[] {
    const parts = contextKey.split('_');
    const conditions = [];

    if (parts[0]) {
      conditions.push({
        field: 'context.timeOfDay',
        operator: 'equals',
        value: parts[0]
      });
    }

    if (parts[1]) {
      conditions.push({
        field: 'context.deviceType',
        operator: 'equals',
        value: parts[1]
      });
    }

    if (parts[2]) {
      conditions.push({
        field: 'context.energyLevel',
        operator: 'equals',
        value: parseInt(parts[2].replace('energy', ''))
      });
    }

    return conditions;
  }

  private patternMatchesContext(pattern: Pattern, context: any): boolean {
    return pattern.conditions.every(condition => {
      const fieldValue = this.getNestedValue(context, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'greater_than':
          return fieldValue > condition.value;
        case 'less_than':
          return fieldValue < condition.value;
        case 'contains':
          return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
        default:
          return false;
      }
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private createSuggestionFromPattern(pattern: Pattern, context: any): SmartSuggestion | null {
    const action = pattern.actions[0];
    if (!action) return null;

    return {
      id: `suggestion_${pattern.id}_${Date.now()}`,
      type: SUGGESTION_TYPES.TASK_OPTIMIZATION,
      title: `Smart suggestion based on your patterns`,
      description: pattern.description,
      confidence: pattern.confidence,
      actions: [{
        type: action.type,
        label: this.generateActionLabel(action),
        parameters: action.parameters
      }],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isActive: true
    };
  }

  private generateActionLabel(action: any): string {
    switch (action.type) {
      case 'suggest_task_timing':
        return `Try ${action.parameters.taskType} tasks during ${action.parameters.preferredTime}`;
      case 'suggest_next_action':
        return `Consider ${action.parameters.suggestedAction} next`;
      case 'suggest_task_type':
        return `${action.parameters.taskType} tasks work well in this context`;
      case 'suggest_optimal_timing':
        return `Best time for ${action.parameters.taskType} is at ${action.parameters.optimalEnergyLevel} energy`;
      default:
        return 'Smart suggestion available';
    }
  }

  private extractTaskFeatures(event: UserEvent): TaskFeatures {
    return {
      taskType: event.metadata?.taskType || 'unknown',
      energyLevel: event.context.energyLevel,
      timeOfDay: event.context.timeOfDay,
      dayOfWeek: event.context.dayOfWeek,
      deviceType: event.context.deviceType,
      duration: event.metadata?.duration || 0,
      completed: event.type === 'task_completed'
    };
  }

  private calculateTaskSimilarity(task1: TaskFeatures, task2: TaskFeatures): number {
    let similarity = 0;
    let factors = 0;

    // Task type similarity (most important)
    if (task1.taskType === task2.taskType) {
      similarity += 0.4;
    }
    factors += 0.4;

    // Energy level similarity
    const energyDiff = Math.abs(task1.energyLevel - task2.energyLevel);
    similarity += (0.2 * (1 - energyDiff / 4)); // Max diff is 4
    factors += 0.2;

    // Time of day similarity
    if (task1.timeOfDay === task2.timeOfDay) {
      similarity += 0.2;
    }
    factors += 0.2;

    // Device type similarity
    if (task1.deviceType === task2.deviceType) {
      similarity += 0.1;
    }
    factors += 0.1;

    // Day of week similarity
    const dayDiff = Math.abs(task1.dayOfWeek - task2.dayOfWeek);
    similarity += (0.1 * (1 - dayDiff / 6)); // Max diff is 6
    factors += 0.1;

    return similarity / factors;
  }

  private calculateClusterCentroid(tasks: TaskFeatures[]): TaskFeatures {
    const avgEnergy = tasks.reduce((sum, t) => sum + t.energyLevel, 0) / tasks.length;
    const avgDay = tasks.reduce((sum, t) => sum + t.dayOfWeek, 0) / tasks.length;
    const avgDuration = tasks.reduce((sum, t) => sum + t.duration, 0) / tasks.length;
    
    const mostCommonTaskType = this.getMostCommonValue(tasks.map(t => t.taskType)).value;
    const mostCommonTimeOfDay = this.getMostCommonValue(tasks.map(t => t.timeOfDay)).value;
    const mostCommonDeviceType = this.getMostCommonValue(tasks.map(t => t.deviceType)).value;

    return {
      taskType: mostCommonTaskType,
      energyLevel: Math.round(avgEnergy),
      timeOfDay: mostCommonTimeOfDay,
      dayOfWeek: Math.round(avgDay),
      deviceType: mostCommonDeviceType,
      duration: Math.round(avgDuration),
      completed: tasks.filter(t => t.completed).length > tasks.length / 2
    };
  }

  private analyzeClusterCharacteristics(tasks: TaskFeatures[]): Record<string, any> {
    const completionRate = tasks.filter(t => t.completed).length / tasks.length;
    const avgDuration = tasks.reduce((sum, t) => sum + t.duration, 0) / tasks.length;
    const energyDistribution = tasks.reduce((dist, t) => {
      dist[t.energyLevel] = (dist[t.energyLevel] || 0) + 1;
      return dist;
    }, {} as Record<number, number>);

    return {
      completionRate,
      avgDuration,
      energyDistribution,
      size: tasks.length,
      dominantTaskType: this.getMostCommonValue(tasks.map(t => t.taskType)).value
    };
  }

  // Public getters
  public getPatterns(): Pattern[] {
    return Array.from(this.patterns.values());
  }

  public getAutomationRules(): AutomationRule[] {
    return Array.from(this.automationRules.values());
  }

  public getTaskClusters(): TaskCluster[] {
    return this.taskClusters;
  }

  public getAnalytics(): PatternAnalytics {
    const patterns = this.getPatterns();
    const automations = this.getAutomationRules();
    
    return {
      totalPatterns: patterns.length,
      activePatterns: patterns.filter(p => p.isActive).length,
      patternsByType: patterns.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalAutomations: automations.length,
      activeAutomations: automations.filter(a => a.isActive).length,
      avgPatternConfidence: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length || 0,
      lastAnalysisAt: new Date()
    };
  }

  public getState(): PatternMiningState {
    return { ...this.state };
  }
}

export default PatternMiningEngine;
