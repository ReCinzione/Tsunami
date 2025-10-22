import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  SmartSuggestion, 
  Pattern, 
  AutomationRule, 
  UserEvent, 
  PatternAnalytics,
  TaskCluster
} from '../types/patterns';
import { Task, EnergyLevel } from '../types';
import PatternMiningEngine from '../utils/PatternMiningEngine';
import SmartAutomationManager, { AutomationContext } from '../utils/SmartAutomationManager';
import { AnalyticsManager } from '../utils/analytics';

interface UsePatternMiningOptions {
  enableAutomations?: boolean;
  enableSuggestions?: boolean;
  maxSuggestions?: number;
  processingInterval?: number; // minutes
}

interface PatternMiningState {
  isInitialized: boolean;
  isProcessing: boolean;
  lastProcessedAt: Date | null;
  error: string | null;
}

export const usePatternMining = (userId: string, options: UsePatternMiningOptions = {}) => {
  const {
    enableAutomations = true,
    enableSuggestions = true,
    maxSuggestions = 5,
    processingInterval = 30 // 30 minutes
  } = options;

  // State
  const [state, setState] = useState<PatternMiningState>({
    isInitialized: false,
    isProcessing: false,
    lastProcessedAt: null,
    error: null
  });

  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [taskClusters, setTaskClusters] = useState<TaskCluster[]>([]);
  const [analytics, setAnalytics] = useState<PatternAnalytics | null>(null);

  // Refs for engines
  const patternEngineRef = useRef<PatternMiningEngine | null>(null);
  const automationManagerRef = useRef<SmartAutomationManager | null>(null);
  const analyticsManagerRef = useRef<AnalyticsManager | null>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize engines
  useEffect(() => {
    const initializeEngines = async () => {
      try {
        setState(prev => ({ ...prev, isProcessing: true, error: null }));

        // Initialize Pattern Mining Engine
        patternEngineRef.current = new PatternMiningEngine({
          enableAutomations,
          enableSuggestions,
          maxSuggestions
        });

        // Initialize Automation Manager
        automationManagerRef.current = new SmartAutomationManager(
          patternEngineRef.current
        );

        // Get existing analytics manager instance
        analyticsManagerRef.current = AnalyticsManager.getInstance();

        // Load initial data
        await loadInitialData();

        setState(prev => ({
          ...prev,
          isInitialized: true,
          isProcessing: false,
          lastProcessedAt: new Date()
        }));

        // Set up periodic processing
        if (processingInterval > 0) {
          processingIntervalRef.current = setInterval(
            processPatterns,
            processingInterval * 60 * 1000
          );
        }

      } catch (error) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: error instanceof Error ? error.message : 'Failed to initialize pattern mining'
        }));
      }
    };

    initializeEngines();

    // Cleanup
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [enableAutomations, enableSuggestions, maxSuggestions, processingInterval]);

  // Load initial data from analytics
  const loadInitialData = useCallback(async () => {
    if (!patternEngineRef.current || !analyticsManagerRef.current) return;

    try {
      // Get recent events from analytics
      const eventLogger = analyticsManagerRef.current.getEventLogger();
      const recentEvents = eventLogger.getRecentEvents(1000);

      if (recentEvents.length > 0) {
        // Process patterns
        const detectedPatterns = await patternEngineRef.current.detectPatterns(recentEvents);
        setPatterns(detectedPatterns);

        // Cluster tasks
        const clusters = patternEngineRef.current.clusterTasks(recentEvents);
        setTaskClusters(clusters);

        // Get automation rules
        if (automationManagerRef.current) {
          const rules = automationManagerRef.current.getAutomationRules();
          setAutomationRules(rules);
        }

        // Update analytics
        const patternAnalytics = patternEngineRef.current.getAnalytics();
        setAnalytics(patternAnalytics);
      }
    } catch (error) {
      console.error('Failed to load initial pattern data:', error);
    }
  }, []);

  // Process patterns and generate suggestions
  const processPatterns = useCallback(async () => {
    if (!patternEngineRef.current || !automationManagerRef.current || !analyticsManagerRef.current) {
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Get recent events
      const eventLogger = analyticsManagerRef.current.getEventLogger();
      const recentEvents = eventLogger.getRecentEvents(500);

      if (recentEvents.length === 0) {
        setState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      // Detect new patterns
      const detectedPatterns = await patternEngineRef.current.detectPatterns(recentEvents);
      setPatterns(detectedPatterns);

      // Update task clusters
      const clusters = patternEngineRef.current.clusterTasks(recentEvents);
      setTaskClusters(clusters);

      // Update analytics
      const patternAnalytics = patternEngineRef.current.getAnalytics();
      setAnalytics(patternAnalytics);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        lastProcessedAt: new Date()
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Pattern processing failed'
      }));
    }
  }, []);

  // Generate suggestions for current context
  const generateSuggestions = useCallback(async (context: {
    currentTasks: Task[];
    currentEnergyLevel: EnergyLevel;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  }) => {
    if (!automationManagerRef.current || !analyticsManagerRef.current) {
      return [];
    }

    try {
      // Get recent events for context
      const eventLogger = analyticsManagerRef.current.getEventLogger();
      const recentEvents = eventLogger.getRecentEvents(50);

      // Determine time of day if not provided
      const now = new Date();
      const hour = now.getHours();
      let timeOfDay = context.timeOfDay;
      if (!timeOfDay) {
        if (hour >= 6 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
        else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
        else timeOfDay = 'night';
      }

      // Create automation context
      const automationContext: AutomationContext = {
        currentTasks: context.currentTasks,
        recentEvents,
        currentEnergyLevel: context.currentEnergyLevel,
        timeOfDay,
        dayOfWeek: now.getDay(),
        deviceType: detectDeviceType()
      };

      // Process automations and get suggestions
      const result = await automationManagerRef.current.processAutomations(automationContext);
      
      // Update suggestions state
      setSuggestions(result.generatedSuggestions);
      
      return result.generatedSuggestions;

    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }, []);

  // Apply a suggestion
  const applySuggestion = useCallback(async (suggestionId: string, action: any) => {
    if (!automationManagerRef.current) return false;

    try {
      // Create context for applying suggestion
      const context: AutomationContext = {
        currentTasks: [], // This should be provided by the caller
        recentEvents: [],
        currentEnergyLevel: 'medium',
        timeOfDay: getCurrentTimeOfDay(),
        dayOfWeek: new Date().getDay(),
        deviceType: detectDeviceType()
      };

      const success = await automationManagerRef.current.applySuggestion(suggestionId, context);
      
      if (success) {
        // Remove applied suggestion from state
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        
        // Track the application
        if (analyticsManagerRef.current) {
          analyticsManagerRef.current.getEventLogger().logEvent({
            type: 'suggestion_applied',
            userId: analyticsManagerRef.current.getUserId(),
            context: {
              energyLevel: 3,
              timeOfDay: getCurrentTimeOfDay(),
              dayOfWeek: new Date().getDay(),
              deviceType: detectDeviceType()
            },
            metadata: {
              suggestionId,
              actionType: action.type
            }
          });
        }
      }
      
      return success;
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      return false;
    }
  }, []);

  // Dismiss a suggestion
  const dismissSuggestion = useCallback((suggestionId: string) => {
    if (!automationManagerRef.current) return false;

    const success = automationManagerRef.current.dismissSuggestion(suggestionId);
    
    if (success) {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      
      // Track the dismissal
      if (analyticsManagerRef.current) {
        analyticsManagerRef.current.getEventLogger().logEvent({
          type: 'suggestion_dismissed',
          userId: analyticsManagerRef.current.getUserId(),
          context: {
            energyLevel: 3,
            timeOfDay: getCurrentTimeOfDay(),
            dayOfWeek: new Date().getDay(),
            deviceType: detectDeviceType()
          },
          metadata: {
            suggestionId
          }
        });
      }
    }
    
    return success;
  }, []);

  // Create custom automation rule
  const createAutomationRule = useCallback((rule: Omit<AutomationRule, 'id' | 'createdAt' | 'lastTriggered' | 'triggerCount' | 'successRate'>) => {
    if (!automationManagerRef.current) return null;

    const newRule = automationManagerRef.current.createAutomationRule(
      rule.name,
      rule.trigger,
      rule.actions,
      rule
    );

    // Update state
    setAutomationRules(prev => [...prev, newRule]);
    
    return newRule;
  }, []);

  // Get active suggestions
  const getActiveSuggestions = useCallback(() => {
    if (!automationManagerRef.current) return [];
    return automationManagerRef.current.getActiveSuggestions();
  }, []);

  // Force pattern processing
  const forceProcessing = useCallback(async () => {
    await processPatterns();
  }, [processPatterns]);

  // Export pattern data
  const exportPatternData = useCallback(() => {
    if (!patternEngineRef.current || !analyticsManagerRef.current) return null;

    const eventLogger = analyticsManagerRef.current.getEventLogger();
    
    return {
      patterns: patternEngineRef.current.getPatterns(),
      automationRules: automationManagerRef.current?.getAutomationRules() || [],
      taskClusters: patternEngineRef.current.getTaskClusters(),
      analytics: patternEngineRef.current.getAnalytics(),
      recentEvents: eventLogger.getRecentEvents(1000),
      exportedAt: new Date()
    };
  }, []);

  // Funzione per loggare le interazioni del chatbot
  const logChatbotInteraction = useCallback((interaction: {
    actionType: string;
    actionLabel: string;
    context: any;
  }) => {
    if (analyticsManagerRef.current) {
      analyticsManagerRef.current.trackChatbotInteraction(
        interaction.actionType,
        interaction.actionLabel,
        interaction.context
      );
    }
  }, []);

  // Funzione per loggare le interazioni delle task
  const logTaskInteraction = useCallback((actionType: string, context: any) => {
    if (analyticsManagerRef.current) {
      analyticsManagerRef.current.getEventLogger().logEvent({
        type: actionType,
        userId: analyticsManagerRef.current.getUserId(),
        context: {
          energyLevel: 3,
          timeOfDay: getCurrentTimeOfDay(),
          dayOfWeek: new Date().getDay(),
          deviceType: detectDeviceType(),
          ...context
        },
        metadata: context
      });
    }
  }, []);

  // Versione semplificata di generateSuggestions per compatibilità con TaskManager
  const generateSuggestionsSimple = useCallback(async (context: {
    recentAction?: string;
    timestamp?: Date;
    taskComplexity?: string;
  }) => {
    console.log('🔍 generateSuggestionsSimple called with context:', context);
    console.log('🔧 automationManagerRef.current:', !!automationManagerRef.current);
    console.log('📊 analyticsManagerRef.current:', !!analyticsManagerRef.current);
    
    if (!automationManagerRef.current || !analyticsManagerRef.current) {
      console.log('⚠️ Managers not ready, generating mock suggestions');
      // Genera suggerimenti mock per testing
      const mockSuggestions: SmartSuggestion[] = [
        {
          id: 'mock-1',
          type: 'task_optimization',
          title: 'Ottimizza la tua produttività',
          description: 'Considera di raggruppare task simili per aumentare l\'efficienza',
          confidence: 0.8,
          priority: 'medium',
          category: 'productivity',
          isActive: true,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          actions: [{
            type: 'group_tasks',
            label: 'Raggruppa task simili',
            parameters: {}
          }],
          metadata: {
            source: 'pattern_analysis',
            trigger: context.recentAction || 'component_mounted'
          }
        },
        {
          id: 'mock-2',
          type: 'time_management',
          title: 'Pianifica una pausa',
          description: 'Dopo aver lavorato intensamente, una pausa di 10 minuti può migliorare la concentrazione',
          confidence: 0.7,
          priority: 'low',
          category: 'wellness',
          isActive: true,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
          actions: [{
            type: 'schedule_break',
            label: 'Pianifica pausa',
            parameters: { duration: 10 }
          }],
          metadata: {
            source: 'wellness_analysis',
            trigger: context.recentAction || 'component_mounted'
          }
        }
      ];
      
      console.log('✅ Mock suggestions generated:', mockSuggestions.length);
      setSuggestions(mockSuggestions);
      return mockSuggestions;
    }

    try {
      console.log('🚀 Generating suggestions with full automation manager');
      // Log dell'azione per il pattern mining
      logTaskInteraction('suggestion_request', context);
      
      // Genera suggerimenti basati sul contesto semplificato
      const automationContext: AutomationContext = {
        currentTasks: [],
        recentEvents: analyticsManagerRef.current.getEventLogger().getRecentEvents(50),
        currentEnergyLevel: 'medium',
        timeOfDay: getCurrentTimeOfDay(),
        dayOfWeek: new Date().getDay(),
        deviceType: detectDeviceType()
      };

      const result = await automationManagerRef.current.processAutomations(automationContext);
      console.log('📋 Generated suggestions:', result.generatedSuggestions.length);
      setSuggestions(result.generatedSuggestions);
      
      return result.generatedSuggestions;
    } catch (error) {
      console.error('❌ Failed to generate suggestions:', error);
      return [];
    }
  }, [logTaskInteraction]);

  return {
    // State
    state,
    patterns,
    suggestions,
    automationRules,
    taskClusters,
    analytics,
    
    // Actions
    generateSuggestions: generateSuggestionsSimple,
    applySuggestion,
    dismissSuggestion,
    createAutomationRule,
    processPatterns: forceProcessing,
    logChatbotInteraction,
    logTaskInteraction,
    acceptSuggestion: applySuggestion,
    
    // Getters
    getActiveSuggestions,
    exportPatternData,
    
    // Computed
    isReady: state.isInitialized && !state.isProcessing,
    hasError: !!state.error,
    totalPatterns: patterns.length,
    activeSuggestions: suggestions.filter(s => s.isActive && s.expiresAt > new Date()).length
  };
};

// Utility functions
function getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  const userAgent = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

export default usePatternMining;