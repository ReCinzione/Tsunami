import { 
  AutomationRule, 
  SmartSuggestion, 
  Pattern, 
  UserEvent, 
  NotificationConfig,
  PatternTrigger,
  AutomationAction,
  SuggestionAction,
  AUTOMATION_TYPES,
  SUGGESTION_TYPES,
  NOTIFICATION_TYPES
} from '../types/patterns';
import { TaskType, EnergyLevel, Task } from '../types';
import PatternMiningEngine from './PatternMiningEngine';

export interface AutomationContext {
  currentTasks: Task[];
  recentEvents: UserEvent[];
  currentEnergyLevel: EnergyLevel;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  deviceType: 'mobile' | 'desktop' | 'tablet';
}

export class SmartAutomationManager {
  private automationRules: Map<string, AutomationRule> = new Map();
  private activeSuggestions: Map<string, SmartSuggestion> = new Map();
  private patternEngine: PatternMiningEngine;
  private notificationCallbacks: Map<string, (notification: any) => void> = new Map();

  constructor(patternEngine: PatternMiningEngine) {
    this.patternEngine = patternEngine;
    this.initializeDefaultAutomations();
  }

  // Automation Management
  public createAutomationRule(
    name: string,
    trigger: PatternTrigger,
    actions: AutomationAction[],
    config?: Partial<AutomationRule>
  ): AutomationRule {
    const rule: AutomationRule = {
      id: `automation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: config?.description || `Automation: ${name}`,
      type: config?.type || AUTOMATION_TYPES.TASK_MANAGEMENT,
      trigger,
      actions,
      isActive: config?.isActive ?? true,
      createdAt: new Date(),
      lastTriggered: null,
      triggerCount: 0,
      successRate: 1.0,
      conditions: config?.conditions || [],
      cooldownMinutes: config?.cooldownMinutes || 60
    };

    this.automationRules.set(rule.id, rule);
    return rule;
  }

  public async processAutomations(context: AutomationContext): Promise<{
    executedAutomations: string[];
    generatedSuggestions: SmartSuggestion[];
    notifications: any[];
  }> {
    const executedAutomations: string[] = [];
    const generatedSuggestions: SmartSuggestion[] = [];
    const notifications: any[] = [];

    // Process automation rules
    for (const [ruleId, rule] of this.automationRules) {
      if (!rule.isActive) continue;

      // Check cooldown
      if (rule.lastTriggered && rule.cooldownMinutes) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
        if (timeSinceLastTrigger < rule.cooldownMinutes * 60 * 1000) {
          continue;
        }
      }

      // Check if trigger conditions are met
      if (await this.shouldTriggerAutomation(rule, context)) {
        try {
          const results = await this.executeAutomation(rule, context);
          executedAutomations.push(ruleId);
          generatedSuggestions.push(...results.suggestions);
          notifications.push(...results.notifications);

          // Update rule statistics
          rule.lastTriggered = new Date();
          rule.triggerCount++;
        } catch (error) {
          console.error(`Failed to execute automation ${ruleId}:`, error);
          rule.successRate = Math.max(0, rule.successRate - 0.1);
        }
      }
    }

    // Generate pattern-based suggestions
    const patternSuggestions = this.patternEngine.generateSmartSuggestions(context);
    generatedSuggestions.push(...patternSuggestions);

    // Store active suggestions
    generatedSuggestions.forEach(suggestion => {
      this.activeSuggestions.set(suggestion.id, suggestion);
    });

    return {
      executedAutomations,
      generatedSuggestions,
      notifications
    };
  }

  private async shouldTriggerAutomation(rule: AutomationRule, context: AutomationContext): Promise<boolean> {
    const { trigger } = rule;

    // Check pattern-based triggers
    if (trigger.patternId) {
      const patterns = this.patternEngine.getPatterns();
      const pattern = patterns.find(p => p.id === trigger.patternId);
      if (!pattern || !pattern.isActive) return false;

      // Check if pattern conditions match current context
      return this.patternMatchesContext(pattern, context);
    }

    // Check event-based triggers
    if (trigger.eventType && context.recentEvents.length > 0) {
      const recentEvent = context.recentEvents[context.recentEvents.length - 1];
      if (recentEvent.type !== trigger.eventType) return false;

      // Check additional conditions
      if (trigger.conditions) {
        return trigger.conditions.every(condition => 
          this.evaluateCondition(condition, context, recentEvent)
        );
      }
      return true;
    }

    // Check time-based triggers
    if (trigger.timeConditions) {
      return trigger.timeConditions.every(condition => {
        switch (condition.type) {
          case 'time_of_day':
            return context.timeOfDay === condition.value;
          case 'day_of_week':
            return context.dayOfWeek === condition.value;
          case 'energy_level':
            return this.mapEnergyToNumber(context.currentEnergyLevel) >= condition.value;
          default:
            return false;
        }
      });
    }

    return false;
  }

  private async executeAutomation(rule: AutomationRule, context: AutomationContext): Promise<{
    suggestions: SmartSuggestion[];
    notifications: any[];
  }> {
    const suggestions: SmartSuggestion[] = [];
    const notifications: any[] = [];

    for (const action of rule.actions) {
      switch (action.type) {
        case 'create_suggestion':
          const suggestion = this.createSuggestionFromAction(action, rule, context);
          if (suggestion) suggestions.push(suggestion);
          break;

        case 'reorder_tasks':
          const reorderSuggestion = this.createTaskReorderSuggestion(action, context);
          if (reorderSuggestion) suggestions.push(reorderSuggestion);
          break;

        case 'schedule_break':
          const breakSuggestion = this.createBreakSuggestion(action, context);
          if (breakSuggestion) suggestions.push(breakSuggestion);
          break;

        case 'energy_optimization':
          const energySuggestion = this.createEnergyOptimizationSuggestion(action, context);
          if (energySuggestion) suggestions.push(energySuggestion);
          break;

        case 'send_notification':
          const notification = this.createNotification(action, rule, context);
          if (notification) notifications.push(notification);
          break;

        case 'auto_postpone':
          const postponeSuggestion = this.createPostponeSuggestion(action, context);
          if (postponeSuggestion) suggestions.push(postponeSuggestion);
          break;

        default:
          console.warn(`Unknown automation action type: ${action.type}`);
      }
    }

    return { suggestions, notifications };
  }

  private createSuggestionFromAction(
    action: AutomationAction, 
    rule: AutomationRule, 
    context: AutomationContext
  ): SmartSuggestion | null {
    const baseId = `suggestion_${rule.id}_${Date.now()}`;
    
    return {
      id: baseId,
      type: SUGGESTION_TYPES.AUTOMATION_TRIGGERED,
      title: action.parameters?.title || `Smart suggestion from ${rule.name}`,
      description: action.parameters?.description || rule.description,
      confidence: 0.8,
      actions: [{
        type: action.parameters?.actionType || 'generic_action',
        label: action.parameters?.actionLabel || 'Apply suggestion',
        parameters: action.parameters || {}
      }],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (action.parameters?.expirationHours || 24) * 60 * 60 * 1000),
      isActive: true
    };
  }

  private createTaskReorderSuggestion(action: AutomationAction, context: AutomationContext): SmartSuggestion | null {
    if (context.currentTasks.length < 2) return null;

    const criteria = action.parameters?.criteria || 'energy_match';
    const reorderedTasks = this.reorderTasksByCriteria(context.currentTasks, criteria, context);
    
    if (JSON.stringify(reorderedTasks) === JSON.stringify(context.currentTasks)) {
      return null; // No reordering needed
    }

    return {
      id: `reorder_${Date.now()}`,
      type: SUGGESTION_TYPES.TASK_REORDERING,
      title: 'Optimize your task order',
      description: `Based on your patterns, reordering tasks could improve your productivity`,
      confidence: 0.75,
      actions: [{
        type: 'reorder_tasks',
        label: 'Apply new order',
        parameters: {
          newOrder: reorderedTasks.map(t => t.id),
          criteria
        }
      }],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
      isActive: true
    };
  }

  private createBreakSuggestion(action: AutomationAction, context: AutomationContext): SmartSuggestion | null {
    const workingSince = action.parameters?.workingSince;
    const breakDuration = action.parameters?.breakDuration || 15;
    
    return {
      id: `break_${Date.now()}`,
      type: SUGGESTION_TYPES.BREAK_REMINDER,
      title: 'Time for a break!',
      description: `You've been working hard. A ${breakDuration}-minute break could help you recharge.`,
      confidence: 0.9,
      actions: [{
        type: 'schedule_break',
        label: `Take ${breakDuration}min break`,
        parameters: {
          duration: breakDuration,
          type: action.parameters?.breakType || 'short_break'
        }
      }],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      isActive: true
    };
  }

  private createEnergyOptimizationSuggestion(action: AutomationAction, context: AutomationContext): SmartSuggestion | null {
    const currentEnergyNum = this.mapEnergyToNumber(context.currentEnergyLevel);
    const optimalTasks = context.currentTasks.filter(task => {
      const taskEnergyRequirement = this.getTaskEnergyRequirement(task.type);
      return Math.abs(taskEnergyRequirement - currentEnergyNum) <= 1;
    });

    if (optimalTasks.length === 0) return null;

    return {
      id: `energy_opt_${Date.now()}`,
      type: SUGGESTION_TYPES.ENERGY_OPTIMIZATION,
      title: 'Energy-matched tasks available',
      description: `These tasks match your current energy level (${context.currentEnergyLevel})`,
      confidence: 0.8,
      actions: [{
        type: 'prioritize_tasks',
        label: 'Focus on these tasks',
        parameters: {
          taskIds: optimalTasks.map(t => t.id),
          reason: 'energy_match'
        }
      }],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      isActive: true
    };
  }

  private createPostponeSuggestion(action: AutomationAction, context: AutomationContext): SmartSuggestion | null {
    const lowEnergyTasks = context.currentTasks.filter(task => {
      const taskEnergyRequirement = this.getTaskEnergyRequirement(task.type);
      const currentEnergyNum = this.mapEnergyToNumber(context.currentEnergyLevel);
      return taskEnergyRequirement > currentEnergyNum + 1;
    });

    if (lowEnergyTasks.length === 0) return null;

    return {
      id: `postpone_${Date.now()}`,
      type: SUGGESTION_TYPES.TASK_POSTPONEMENT,
      title: 'Consider postponing demanding tasks',
      description: `Some tasks might be too demanding for your current energy level`,
      confidence: 0.7,
      actions: [{
        type: 'postpone_tasks',
        label: 'Postpone demanding tasks',
        parameters: {
          taskIds: lowEnergyTasks.map(t => t.id),
          reason: 'energy_mismatch',
          suggestedTime: this.suggestOptimalTime(lowEnergyTasks[0].type)
        }
      }],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
      isActive: true
    };
  }

  private createNotification(action: AutomationAction, rule: AutomationRule, context: AutomationContext): any {
    return {
      id: `notification_${Date.now()}`,
      type: action.parameters?.notificationType || NOTIFICATION_TYPES.INFO,
      title: action.parameters?.title || rule.name,
      message: action.parameters?.message || rule.description,
      priority: action.parameters?.priority || 'medium',
      createdAt: new Date(),
      automationRuleId: rule.id
    };
  }

  // Suggestion Management
  public applySuggestion(suggestionId: string, context: AutomationContext): Promise<boolean> {
    const suggestion = this.activeSuggestions.get(suggestionId);
    if (!suggestion || !suggestion.isActive) {
      return Promise.resolve(false);
    }

    // Mark as applied
    suggestion.isActive = false;
    
    // Execute suggestion actions
    suggestion.actions.forEach(action => {
      this.executeSuggestionAction(action, context);
    });

    return Promise.resolve(true);
  }

  public dismissSuggestion(suggestionId: string): boolean {
    const suggestion = this.activeSuggestions.get(suggestionId);
    if (!suggestion) return false;

    suggestion.isActive = false;
    return true;
  }

  public getActiveSuggestions(): SmartSuggestion[] {
    const now = new Date();
    return Array.from(this.activeSuggestions.values())
      .filter(s => s.isActive && s.expiresAt > now)
      .sort((a, b) => b.confidence - a.confidence);
  }

  // Utility Methods
  private patternMatchesContext(pattern: Pattern, context: AutomationContext): boolean {
    return pattern.conditions.every(condition => {
      switch (condition.field) {
        case 'context.timeOfDay':
          return context.timeOfDay === condition.value;
        case 'context.energyLevel':
          return this.mapEnergyToNumber(context.currentEnergyLevel) === condition.value;
        case 'context.dayOfWeek':
          return context.dayOfWeek === condition.value;
        case 'context.deviceType':
          return context.deviceType === condition.value;
        default:
          return false;
      }
    });
  }

  private evaluateCondition(condition: any, context: AutomationContext, event?: UserEvent): boolean {
    const value = this.getContextValue(condition.field, context, event);
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'contains':
        return Array.isArray(value) && value.includes(condition.value);
      default:
        return false;
    }
  }

  private getContextValue(field: string, context: AutomationContext, event?: UserEvent): any {
    const parts = field.split('.');
    let value: any = context;
    
    if (parts[0] === 'event' && event) {
      value = event;
      parts.shift();
    }
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value;
  }

  private reorderTasksByCriteria(tasks: Task[], criteria: string, context: AutomationContext): Task[] {
    const tasksCopy = [...tasks];
    
    switch (criteria) {
      case 'energy_match':
        const currentEnergyNum = this.mapEnergyToNumber(context.currentEnergyLevel);
        return tasksCopy.sort((a, b) => {
          const aEnergyReq = this.getTaskEnergyRequirement(a.type);
          const bEnergyReq = this.getTaskEnergyRequirement(b.type);
          const aDiff = Math.abs(aEnergyReq - currentEnergyNum);
          const bDiff = Math.abs(bEnergyReq - currentEnergyNum);
          return aDiff - bDiff;
        });
        
      case 'time_optimal':
        return tasksCopy.sort((a, b) => {
          const aOptimal = this.isOptimalTimeForTask(a.type, context.timeOfDay);
          const bOptimal = this.isOptimalTimeForTask(b.type, context.timeOfDay);
          return (bOptimal ? 1 : 0) - (aOptimal ? 1 : 0);
        });
        
      case 'completion_likelihood':
        return tasksCopy.sort((a, b) => {
          const aLikelihood = this.getCompletionLikelihood(a, context);
          const bLikelihood = this.getCompletionLikelihood(b, context);
          return bLikelihood - aLikelihood;
        });
        
      default:
        return tasksCopy;
    }
  }

  private executeSuggestionAction(action: SuggestionAction, context: AutomationContext): void {
    // Emit events for suggestion actions
    const callbacks = this.notificationCallbacks.get(action.type);
    if (callbacks) {
      callbacks({
        type: 'suggestion_applied',
        action,
        context,
        timestamp: new Date()
      });
    }
  }

  private mapEnergyToNumber(energy: EnergyLevel): number {
    const mapping = { 'very-low': 1, 'low': 2, 'medium': 3, 'high': 4, 'very-high': 5 };
    return mapping[energy] || 3;
  }

  private getTaskEnergyRequirement(taskType: TaskType): number {
    // Map task types to energy requirements (1-5 scale)
    const energyMap: Record<TaskType, number> = {
      'quick-win': 2,
      'deep-work': 5,
      'admin': 2,
      'creative': 4,
      'learning': 4,
      'social': 3,
      'physical': 3,
      'maintenance': 2
    };
    return energyMap[taskType] || 3;
  }

  private isOptimalTimeForTask(taskType: TaskType, timeOfDay: string): boolean {
    const optimalTimes: Record<TaskType, string[]> = {
      'deep-work': ['morning'],
      'creative': ['morning', 'evening'],
      'admin': ['afternoon'],
      'social': ['afternoon', 'evening'],
      'learning': ['morning', 'afternoon'],
      'physical': ['morning', 'evening'],
      'quick-win': ['morning', 'afternoon', 'evening'],
      'maintenance': ['afternoon', 'evening']
    };
    return optimalTimes[taskType]?.includes(timeOfDay) || false;
  }

  private getCompletionLikelihood(task: Task, context: AutomationContext): number {
    let likelihood = 0.5; // Base likelihood
    
    // Energy match bonus
    const energyReq = this.getTaskEnergyRequirement(task.type);
    const currentEnergy = this.mapEnergyToNumber(context.currentEnergyLevel);
    const energyMatch = 1 - Math.abs(energyReq - currentEnergy) / 4;
    likelihood += energyMatch * 0.3;
    
    // Time optimality bonus
    if (this.isOptimalTimeForTask(task.type, context.timeOfDay)) {
      likelihood += 0.2;
    }
    
    return Math.min(1, Math.max(0, likelihood));
  }

  private suggestOptimalTime(taskType: TaskType): string {
    const optimalTimes: Record<TaskType, string[]> = {
      'deep-work': ['morning'],
      'creative': ['morning', 'evening'],
      'admin': ['afternoon'],
      'social': ['afternoon', 'evening'],
      'learning': ['morning', 'afternoon'],
      'physical': ['morning', 'evening'],
      'quick-win': ['morning'],
      'maintenance': ['afternoon']
    };
    
    const times = optimalTimes[taskType] || ['morning'];
    return times[0];
  }

  // Default Automations Setup
  private initializeDefaultAutomations(): void {
    // Energy-based task reordering
    this.createAutomationRule(
      'Energy-based Task Optimization',
      {
        eventType: 'energy_level_changed',
        conditions: [{
          field: 'context.energyLevel',
          operator: 'less_than',
          value: 3
        }]
      },
      [{
        type: 'reorder_tasks',
        parameters: {
          criteria: 'energy_match',
          title: 'Optimize tasks for your energy level',
          description: 'Reorder tasks to match your current energy'
        }
      }],
      {
        type: AUTOMATION_TYPES.ENERGY_MANAGEMENT,
        description: 'Automatically suggests task reordering based on energy levels',
        cooldownMinutes: 30
      }
    );

    // Break reminders
    this.createAutomationRule(
      'Smart Break Reminder',
      {
        timeConditions: [{
          type: 'working_duration',
          operator: 'greater_than',
          value: 90 // 90 minutes
        }]
      },
      [{
        type: 'schedule_break',
        parameters: {
          breakDuration: 15,
          breakType: 'short_break',
          title: 'Time for a break!',
          description: 'You\'ve been focused for a while. A short break will help you recharge.'
        }
      }],
      {
        type: AUTOMATION_TYPES.WELLNESS,
        description: 'Suggests breaks based on work duration',
        cooldownMinutes: 60
      }
    );

    // Evening wind-down
    this.createAutomationRule(
      'Evening Wind-down',
      {
        timeConditions: [{
          type: 'time_of_day',
          value: 'evening'
        }]
      },
      [{
        type: 'create_suggestion',
        parameters: {
          title: 'Wind down for the day',
          description: 'Consider switching to lighter tasks or planning for tomorrow',
          actionType: 'suggest_light_tasks',
          actionLabel: 'Show light tasks'
        }
      }],
      {
        type: AUTOMATION_TYPES.ROUTINE_OPTIMIZATION,
        description: 'Suggests lighter tasks in the evening',
        cooldownMinutes: 180 // 3 hours
      }
    );
  }

  // Event Handlers
  public onNotification(type: string, callback: (notification: any) => void): void {
    this.notificationCallbacks.set(type, callback);
  }

  public removeNotificationHandler(type: string): void {
    this.notificationCallbacks.delete(type);
  }

  // Public Getters
  public getAutomationRules(): AutomationRule[] {
    return Array.from(this.automationRules.values());
  }

  public getAutomationRule(id: string): AutomationRule | undefined {
    return this.automationRules.get(id);
  }

  public updateAutomationRule(id: string, updates: Partial<AutomationRule>): boolean {
    const rule = this.automationRules.get(id);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }

  public deleteAutomationRule(id: string): boolean {
    return this.automationRules.delete(id);
  }
}

export default SmartAutomationManager;