import React, { useRef, useState } from 'react';
import { TaskListContainer } from '../features/tasks/containers/TaskListContainer';

import { useUltraFocusMode } from '../hooks/useUltraFocusMode';
import { UltraFocusMode } from './UltraFocusMode';
import { useUIStore } from '../store/uiStore';
import { useTaskStats } from '../features/tasks/hooks/useTasks';
import { usePatternMining } from '../hooks/usePatternMining';
import { SmartSuggestionsPanel } from './SmartSuggestionsPanel';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart3, 
  Settings, 
  Target, 
  Zap, 
  CheckCircle2,
  Clock,
  TrendingUp,
  Lightbulb
} from 'lucide-react';
import { cn } from '../lib/utils';
import { StatsSkeleton } from './common/Skeleton';
import { ErrorBoundary } from './common/ErrorBoundary';
import { createAIService, isAISupported } from '../lib/AIService';
import { AnalyticsManager } from '../utils/analytics';
import { AIBreakdownModal } from './AIBreakdownModal';
import { taskService } from '../features/tasks/services/taskService';
import type { MicroTask } from '../types/ai';
import { useIsMobile } from '../hooks/use-mobile';

interface TaskManagerProps {
  userId: string;
  showCompleted?: boolean;
  onProfileUpdate?: () => void;
  className?: string;
}

// Componente per le statistiche rapide
interface QuickStatsProps {
  userId: string;
  className?: string;
}

function QuickStats({ userId, className }: QuickStatsProps) {
  const { data: stats, isLoading, error } = useTaskStats();

  if (isLoading) {
    return <StatsSkeleton cards={4} className={className} />;
  }

  if (error || !stats) {
    return (
      <div className={cn("text-center py-4 text-muted-foreground", className)}>
        <p>Impossibile caricare le statistiche</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Task Completati",
      value: stats.completed,
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      description: "Questo mese",
      color: "bg-green-50 border-green-200"
    },
    {
      title: "Task Attivi",
      value: stats.active,
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      description: "In corso",
      color: "bg-blue-50 border-blue-200"
    },
    {
      title: "XP Totali",
      value: stats.totalXP,
      icon: <Zap className="w-5 h-5 text-purple-600" />,
      description: `Livello ${stats.level}`,
      color: "bg-purple-50 border-purple-200"
    },
    {
      title: "Streak",
      value: stats.streak,
      icon: <TrendingUp className="w-5 h-5 text-orange-600" />,
      description: "Giorni consecutivi",
      color: "bg-orange-50 border-orange-200"
    }
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-4 mb-4 md:mb-6", className)}>
      {statCards.map((stat, index) => (
        <div key={index} className="adhd-stat-card adhd-hover-lift adhd-click-bounce w-full">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-1 md:gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground break-words">
                  {stat.title}
                </p>
                <p className="text-sm md:text-2xl font-bold">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground break-words hidden md:block">
                  {stat.description}
                </p>
              </div>
              <div className="flex-shrink-0 md:block hidden">
                {stat.icon}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}



// Componente principale TaskManager refactorizzato
export const TaskManager: React.FC<TaskManagerProps> = ({
  userId,
  showCompleted = false,
  onProfileUpdate,
  className
}) => {
  const isMobile = useIsMobile();
  const taskListRef = useRef<{ handleCreateTask: () => void } | null>(null);
  const [expandedPatternId, setExpandedPatternId] = useState<string | null>(null);
  
  // Ultra Focus Mode hook
  const {
    isActive: isUltraFocusActive,
    currentTask: ultraFocusTask,
    startUltraFocus,
    exitUltraFocus,
    completeCurrentTask,
    refreshCurrentTask
  } = useUltraFocusMode();
  
  const { 
    distractionMode,
    setDistractionMode,
    currentView,
    setCurrentView
  } = useUIStore();

  // Pattern Mining and Smart Suggestions
  const {
    suggestions,
    isProcessing,
    logTaskInteraction,
    generateSuggestions,
    acceptSuggestion,
    dismissSuggestion,
    analytics,
    patterns,
    taskClusters,
    processPatterns
  } = usePatternMining(userId);

  // Debug log per suggestions
  React.useEffect(() => {
    console.log('🎯 TaskManager - suggestions updated:', suggestions.length, suggestions);
  }, [suggestions]);

  // AI Breakdown state
  const [aiSupported, setAiSupported] = useState<boolean | null>(null);
  const [breakdownModal, setBreakdownModal] = useState<{
    isOpen: boolean;
    task: Task | null;
    suggestedMicroTasks: MicroTask[];
  }>({ isOpen: false, task: null, suggestedMicroTasks: [] });
  const [isBreakdownLoading, setIsBreakdownLoading] = useState(false);

  React.useEffect(() => {
    isAISupported().then(setAiSupported);
  }, []);

  // Generate initial suggestions when component mounts
  React.useEffect(() => {
    const timer = setTimeout(() => {
      generateSuggestions({
        recentAction: 'component_mounted',
        timestamp: new Date()
      });
    }, 2000); // Wait 2 seconds to let other data load

    return () => clearTimeout(timer);
  }, [generateSuggestions]);



  const onTaskCreated = () => {
    if (taskListRef.current?.handleRefresh) {
      taskListRef.current.handleRefresh();
    }
    // Log task creation for pattern mining
    logTaskInteraction('task_created', { timestamp: new Date() });
    // Generate new suggestions based on updated context
    generateSuggestions({ 
      recentAction: 'task_created',
      timestamp: new Date()
    });
  };

  // Gestione AI Breakdown
  const handleTaskBreakdown = async (task: Task) => {
    if (!aiSupported) {
      console.warn('AI non supportato per il breakdown');
      return;
    }

    setIsBreakdownLoading(true);
    try {
      // Costruisci il contesto esteso per l'AI
      const context = await taskService.buildAIContext(userId, task);
      
      // Crea il servizio AI
      const aiService = await createAIService();
      
      // Prepara la richiesta di breakdown
      const breakdownRequest = {
        taskDescription: `${task.title}${task.description ? ': ' + task.description : ''}`,
        context: {
          adhdContext: {
            energyLevel: task.energy_required,
            timeOfDay: new Date().getHours() < 12 ? 'mattina' : 
                      new Date().getHours() < 18 ? 'pomeriggio' : 'sera',
            distractionLevel: context.preferences?.distractionLevel || 'medium',
            currentMood: 'neutro'
          },
          tasks: context.userHistory || [],
          userBehavior: {
            preferredTaskDuration: context.preferences?.preferredSessionDuration || 25,
            energyPatterns: context.workPatterns?.energyDistribution || {},
            completionRate: context.workPatterns?.completionRate || 0.75,
            preferredTimeSlots: context.workPatterns?.mostProductiveTimeSlots || []
          },
          currentTime: new Date(),
          sessionData: {
            archetype: context.archetype,
            project: context.project,
            taskType: context.taskType,
            deadline: context.deadline
          }
        },
        maxMicroTasks: 8,
        preferredDuration: context.preferences?.preferredSessionDuration || 25,
        difficultyLevel: task.energy_required === 'molto_alta' || task.energy_required === 'alta' ? 'hard' :
                        task.energy_required === 'media' ? 'medium' : 'easy'
      };

      // Chiama l'AI per il breakdown
      const response = await aiService.breakdownTask(breakdownRequest);
      
      // Apri la modale con i risultati
      setBreakdownModal({
        isOpen: true,
        task,
        suggestedMicroTasks: response.microTasks
      });
      
    } catch (error) {
      console.error('Errore nel breakdown AI:', error);
      // TODO: Mostra notifica di errore all'utente
    } finally {
      setIsBreakdownLoading(false);
    }
  };

  const handleBreakdownConfirm = async (microTasks: MicroTask[]) => {
    if (!breakdownModal.task) return;

    setIsBreakdownLoading(true);
    try {
      // Crea le subtask nel database
      for (const microTask of microTasks) {
        const taskData = {
          title: microTask.title,
          description: microTask.description || '',
          task_type: breakdownModal.task.task_type,
          energy_required: microTask.energy === 'basso' ? 'bassa' as const :
                          microTask.energy === 'medio' ? 'media' as const : 'alta' as const,
          due_date: breakdownModal.task.due_date,
          is_recurring: false,
          tags: breakdownModal.task.tags || [],
          can_be_interrupted: true
        };

        await taskService.createTask(userId, taskData, breakdownModal.task.id);
      }

      // Chiudi la modale e aggiorna la lista
      setBreakdownModal({ isOpen: false, task: null, suggestedMicroTasks: [] });
      onTaskCreated();
      
      // TODO: Mostra notifica di successo
      console.log(`✅ Creati ${microTasks.length} micro-task per "${breakdownModal.task.title}"`);
      
      // Log AI breakdown usage for pattern mining
      logTaskInteraction('ai_breakdown_completed', { 
        originalTask: breakdownModal.task,
        microTasksCount: microTasks.length,
        timestamp: new Date()
      });
      
      // Generate suggestions based on AI breakdown usage
      generateSuggestions({
        recentAction: 'ai_breakdown_completed',
        taskComplexity: microTasks.length > 3 ? 'high' : 'medium',
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Errore nella creazione delle subtask:', error);
      // TODO: Mostra notifica di errore
    } finally {
      setIsBreakdownLoading(false);
    }
  };

  const handleBreakdownClose = () => {
    setBreakdownModal({ isOpen: false, task: null, suggestedMicroTasks: [] });
  };

  // KPI utente (accettazione suggerimenti, uso azioni rapide, focus)
  const [userKpis, setUserKpis] = useState({
    suggestionAcceptanceRate: 0,
    quickActionUsageRate: 0,
    focusCompletionRate: 0,
    averageSatisfaction: 0
  });

  React.useEffect(() => {
    try {
      const manager = AnalyticsManager.getInstance();
      // Prova prima con getRecentEvents diretto, altrimenti usa l'EventLogger
      const events = (manager as any).getRecentEvents
        ? (manager as any).getRecentEvents(500)
        : manager.getEventLogger().getRecentEvents(500);
      const applied = events.filter((e: any) => e.type === 'suggestion_applied').length;
      const dismissed = events.filter((e: any) => e.type === 'suggestion_dismissed').length;
      const totalInteracted = applied + dismissed;
      const acceptanceRate = totalInteracted > 0 ? Math.round((applied / totalInteracted) * 100) : 0;

      const insights = manager.getInsights();
      const chatbotEff = insights.getChatbotEffectiveness();
      const prod = insights.getProductivityMetrics();

      setUserKpis({
        suggestionAcceptanceRate: acceptanceRate,
        quickActionUsageRate: Math.round((chatbotEff.quickActionUsageRate || 0) * 100),
        focusCompletionRate: Math.round((prod.focusSessionCompletionRate || 0) * 100),
        averageSatisfaction: Math.round(chatbotEff.averageSatisfaction || 0)
      });
    } catch (err) {
      console.warn('Impossibile calcolare KPI utente:', err);
    }
  }, [suggestions, analytics]);

  // Mappatura etichette per i tipi di pattern
  const formatPatternTypeLabel = (type: string) => {
    const key = String(type).toLowerCase();
    if (key === 'undefined' || key === 'unknown' || key === '') return 'Altro';
    if (key.includes('sequence') || key.includes('sequential')) return 'Sequenze';
    if (key.includes('temporal')) return 'Temporali';
    if (key.includes('context')) return 'Contestuali';
    if (key.includes('energy') || key.includes('behavior')) return 'Comportamentali';
    return key.replace('_', ' ');
  };

  // Traduzioni e formattazioni in italiano per nomi/descrizioni dei pattern
  const EVENT_LABEL_IT: Record<string, string> = {
    task_created: 'creazione task',
    task_completed: 'completamento task',
    task_postponed: 'rinvio task',
    task_deleted: 'eliminazione task',
    routine_activated: 'attivazione routine',
    routine_completed: 'routine completata',
    note_processed: 'note elaborate',
    chatbot_interaction: 'interazione chatbot',
    quick_action: 'azione rapida',
    mood_change: 'cambio umore',
    focus_session: 'sessione focus',
    suggestion_request: 'richiesta suggerimento'
  };

  const TIME_LABEL_IT: Record<string, string> = {
    morning: 'mattina',
    afternoon: 'pomeriggio',
    evening: 'sera',
    night: 'notte'
  };

  const DEVICE_LABEL_IT: Record<string, string> = {
    desktop: 'desktop',
    mobile: 'mobile',
    tablet: 'tablet'
  };

  const energyLevelLabel = (value?: string | number) => {
    const n = typeof value === 'string' ? parseInt(String(value).replace(/[^0-9]/g, '')) : (typeof value === 'number' ? value : undefined);
    const text = n === 1 ? 'energia molto bassa' : n === 2 ? 'energia bassa' : n === 3 ? 'energia media' : n === 4 ? 'energia alta' : n === 5 ? 'energia molto alta' : 'livello di energia';
    return text + (n ? ` (${n})` : '');
  };

  const toItEvent = (token?: string) => {
    if (!token) return 'azione';
    const key = token.trim().toLowerCase();
    return EVENT_LABEL_IT[key] || key.replace(/_/g, ' ');
  };

  const toItTime = (token?: string) => {
    if (!token) return 'un orario specifico';
    const key = token.trim().toLowerCase();
    return TIME_LABEL_IT[key] || key;
  };

  const getCondition = (p: any, field: string) => {
    try {
      const cond = (p?.conditions || []).find((c: any) => c?.field === field);
      return cond?.value;
    } catch { return undefined; }
  };

  const formatContextLabel = (contextKey?: string, p?: any) => {
    const parts = (contextKey || '').split('_').filter(Boolean);
    // Se non disponibile, prova dai conditions
    const time = parts.find(x => x && ['morning','afternoon','evening','night'].includes(x)) || String(getCondition(p, 'context.timeOfDay') || '');
    const device = parts.find(x => x && ['desktop','mobile','tablet'].includes(x)) || String(getCondition(p, 'context.deviceType') || '');
    const energy = parts.find(x => x?.startsWith('energy')) || String(getCondition(p, 'context.energyLevel') || '');

    const list: string[] = [];
    if (time) list.push(toItTime(time));
    if (device) list.push(DEVICE_LABEL_IT[String(device)] || String(device));
    if (energy) list.push(energyLevelLabel(energy));
    return list.length ? list.join(' • ') : 'contesto specifico';
  };

  const formatPatternNameIT = (p: any) => {
    const type = String(p?.type || '').toLowerCase();
    const name = String(p?.name || '');

    if (type.includes('temporal')) {
      const m = name.match(/^(.*?)\s*pattern\s*at\s*(.*)$/i);
      const ev = m?.[1];
      const tod = m?.[2] || getCondition(p, 'context.timeOfDay');
      return `Tendenza: ${toItEvent(ev)} in ${toItTime(String(tod || ''))}`;
    }

    if (type.includes('sequence')) {
      const part = name.split(':')[1]?.trim() || '';
      const events = part.split('->').map(e => e.trim()).filter(Boolean);
      const labels = events.map(toItEvent);
      return labels.length ? `Sequenza ricorrente: ${labels.join(' → ')}` : 'Sequenza ricorrente';
    }

    if (type.includes('context')) {
      const m = name.match(/^(.*?)\s*tasks\s*in\s*(.*)$/i);
      const taskType = m?.[1];
      const ctx = m?.[2];
      const ctxLabel = formatContextLabel(ctx, p);
      const tt = taskType ? taskType.replace(/_/g, ' ') : 'task preferiti';
      return `Preferenza: ${tt} nel contesto ${ctxLabel}`;
    }

    if (type.includes('energy') || type.includes('behavior')) {
      const m = name.match(/^(.*?)\s*tasks\s*at\s*(.*?)\s*energy/i);
      const tt = m?.[1] ? m[1].replace(/_/g, ' ') : 'task';
      const energy = m?.[2] || getCondition(p, 'context.energyLevel');
      return `Meglio: ${tt} con ${energyLevelLabel(energy)}`;
    }

    return name || `Pattern ${formatPatternTypeLabel(p?.type)}`;
  };

  const formatPatternDescriptionIT = (p: any) => {
    const type = String(p?.type || '').toLowerCase();
    const desc = String(p?.description || '');

    if (type.includes('temporal')) {
      const m = desc.match(/User\s+tends\s+to\s+(.*?)\s+during\s+(.*)/i);
      const ev = m?.[1];
      const tod = m?.[2];
      return `Succede spesso: ${toItEvent(ev)} in ${toItTime(String(tod || getCondition(p,'context.timeOfDay') || ''))}. Suggerimento: blocca 25 minuti in quell’orario.`;
    }
    if (type.includes('sequence')) {
      const part = (p?.name || '').split(':')[1]?.trim() || '';
      const events = part.split('->').map(e => e.trim()).filter(Boolean);
      if (events.length >= 2) {
        const first = toItEvent(events[0]);
        const last = toItEvent(events[events.length - 1]);
        return `Sequenza ripetuta: dopo “${first}” tende ad avvenire “${last}”. Suggerimento: crea un piccolo rituale guidato.`;
      }
      return 'Sequenza ripetuta. Suggerimento: crea un piccolo rituale guidato.';
    }
    if (type.includes('context')) {
      return `Dipende dal contesto (luogo/dispositivo/energia). Suggerimento: prepara l’ambiente giusto in anticipo.`;
    }
    if (type.includes('energy') || type.includes('behavior')) {
      return `Legato al livello di energia/umore. Suggerimento: scegli task compatibili con il tuo stato.`;
    }
    return 'Schema utile: trasformiamolo in una abitudine o automazione.';
  };

  const ctaActionLabel = (p: any) => {
    const t = String(p?.type || '').toLowerCase();
    if (t.includes('sequence')) return 'Avvia rituale';
    if (t.includes('temporal')) return 'Blocca 25 min';
    if (t.includes('energy')) return 'Scegli task adatte';
    return 'Applica suggerimento';
  };

  const isUsefulPattern = (p: any) => {
    const t = String(p?.type || '').toLowerCase();
    if (t.includes('sequence')) {
      const part = String(p?.name || '').split(':')[1]?.trim() || '';
      const events = part.split('->').map(e => e.trim()).filter(Boolean);
      const unique = new Set(events);
      if (events.length < 2 || unique.size < 2) return false;
    }
    // Evita pattern con confidenza estremamente bassa
    if (typeof p?.confidence === 'number' && p.confidence < 0.2) return false;
    return true;
  };

  // Gestisce il completamento di una sessione focus
  const handleFocusSessionComplete = React.useCallback(() => {
    onProfileUpdate?.();
    // Mostra notifica di completamento sessione
  }, [onProfileUpdate]);

  const renderTaskContent = () => (
    <div className="space-y-3 md:space-y-6">
      {/* Header con controlli - ottimizzato per mobile */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          {isUltraFocusActive && ultraFocusTask && (
            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
              <Target className="w-3 h-3 mr-1" />
              Ultra Focus: {ultraFocusTask.title.substring(0, 20)}...
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs per diverse visualizzazioni - ottimizzate per mobile */}
      <Tabs value={currentView || "active"} onValueChange={(value) => {
        console.log('Tab clicked:', value);
        console.log('Current view before:', currentView);
        setCurrentView(value);
        console.log('Current view after:', value);
      }} className="w-full">
        <TabsList data-tutorial="task-subtabs" className={cn(
          "grid w-full gap-0.5 py-2.5 h-auto md:h-auto p-0.5 md:p-1",
          distractionMode ? "grid-cols-3" : "grid-cols-3"
        )}>
          <TabsTrigger value="active" className="flex items-center gap-1 text-xs py-2.5 h-auto px-2 md:h-9 md:px-3 md:gap-2 md:text-sm">
            <Target className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Task Attivi</span>
            <span className="sm:hidden">Attivi</span>
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="flex items-center gap-1 text-xs py-2.5 h-auto px-2 md:h-9 md:px-3 md:gap-2 md:text-sm"
            onClick={() => {
              console.log('Completati tab trigger clicked');
              console.log('Current view:', currentView);
            }}
          >
            <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Completati</span>
            <span className="sm:hidden">Fatti</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs py-2.5 h-auto px-2 md:h-9 md:px-3 md:gap-2 md:text-sm">
            <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Analisi</span>
            <span className="sm:hidden">Analisi</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-3 md:mt-6">
          <TaskListContainer
            ref={taskListRef}
            userId={userId}
            showCompleted={false}
            onTaskComplete={onProfileUpdate}
            onTaskBreakdown={handleTaskBreakdown}
            onUltraFocus={startUltraFocus}
            className="min-h-[400px]"
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-3 md:mt-6">
          <TaskListContainer
            userId={userId}
            showCompleted={true}
            onTaskComplete={onProfileUpdate}
            onTaskBreakdown={handleTaskBreakdown}
            onUltraFocus={startUltraFocus}
            className="min-h-[300px] md:min-h-[400px]"
          />
          
          {/* Statistiche rapide - dopo la lista task completate */}
          {!distractionMode && (
            <div className="mt-4 md:mt-6">
              <QuickStats userId={userId} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-3 md:mt-6">
          <div className="grid gap-6">
            {/* Smart Suggestions Panel */}
            {suggestions.length > 0 && (
              <SmartSuggestionsPanel
                suggestions={suggestions}
                onApplySuggestion={acceptSuggestion}
                onDismissSuggestion={dismissSuggestion}
              />
            )}

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analisi delle Performance
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => processPatterns()} disabled={isProcessing}>
                  {isProcessing ? 'Elaborazione…' : 'Aggiorna analisi'}
                </Button>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="space-y-6">
                    {/* KPI principali */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                      <div className="adhd-stat-card adhd-hover-lift adhd-click-bounce w-full">
                        <div className="relative z-10">
                          <p className="text-xs font-medium text-muted-foreground">Pattern Totali</p>
                          <p className="text-sm md:text-2xl font-bold">{(analytics as any).totalPatterns ?? 0}</p>
                        </div>
                      </div>
                      <div className="adhd-stat-card adhd-hover-lift adhd-click-bounce w-full">
                        <div className="relative z-10">
                          <p className="text-xs font-medium text-muted-foreground">Pattern Attivi</p>
                          <p className="text-sm md:text-2xl font-bold">{(analytics as any).activePatterns ?? 0}</p>
                        </div>
                      </div>
                      <div className="adhd-stat-card adhd-hover-lift adhd-click-bounce w-full">
                        <div className="relative z-10">
                          <p className="text-xs font-medium text-muted-foreground">Confidenza Media</p>
                          <p className="text-sm md:text-2xl font-bold">{(((analytics as any).avgPatternConfidence ?? 0) * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Distribuzione per tipo */}
                    <div>
                      <p className="text-sm font-medium mb-2">Distribuzione Pattern</p>
                      <div className="space-y-2">
                        {Object.entries(((analytics as any).patternsByType || {})).map(([type, count]: any) => (
                          <div key={type} className="flex items-center gap-2">
                            <span className="text-xs w-28">{formatPatternTypeLabel(String(type))}</span>
                            <div className="flex-1 h-2 bg-muted rounded">
                              <div
                                className="h-2 bg-blue-500 rounded"
                                style={{ width: `${Math.min(100, ((count || 0) / Math.max(1, (analytics as any).totalPatterns || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs w-8 text-right">{count as number}</span>
                          </div>
                        ))}
                        {Object.keys(((analytics as any).patternsByType || {})).length === 0 && (
                          <p className="text-xs text-muted-foreground">Nessun pattern rilevato ancora.</p>
                        )}
                      </div>
                    </div>

                    {/* Esplora pattern - elenco concreto e comprensibile */}
                    {patterns && patterns.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Esplora i tuoi pattern</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                          {patterns.filter(isUsefulPattern).slice(0, 6).map((p) => (
                            <div key={p.id} className="border rounded p-3 adhd-hover-lift">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-medium">
                                    {formatPatternNameIT(p)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatPatternTypeLabel(p.type)} • Confidenza {(Math.round((p.confidence || 0) * 100))}% • Frequenza {p.frequency ?? 0}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {p.lastDetected ? new Date(p.lastDetected).toLocaleDateString('it-IT') : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Button size="sm" variant="ghost" className="text-xs px-2"
                                  onClick={() => setExpandedPatternId(expandedPatternId === p.id ? null : p.id)}>
                                  {expandedPatternId === p.id ? 'Nascondi dettagli' : 'Dettagli'}
                                </Button>
                              </div>
                              {expandedPatternId === p.id && (
                                <div className="bg-primary/5 dark:bg-primary/10 rounded p-2 mt-2">
                                  <p className="text-xs">
                                    {formatPatternDescriptionIT(p)}
                                  </p>
                                </div>
                              )}
                              {/* CTA semplici */}
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="outline" onClick={() => setCurrentView('active')}>Apri Task</Button>
                                <Button size="sm" onClick={() => setCurrentView('active')}>{ctaActionLabel(p)}</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {patterns.filter(isUsefulPattern).length > 6 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {isMobile
                              ? 'Analisi dettagliate in arrivo…'
                              : 'Mostrati i primi 6. Altri disponibili con analisi completa.'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* KPI Utente */}
                    <div>
                      <p className="text-sm font-medium mb-2">Il tuo andamento</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                        <div className="adhd-stat-card adhd-hover-lift adhd-click-bounce w-full">
                          <div className="relative z-10">
                            <p className="text-xs font-medium text-muted-foreground">Accuratezza Suggerimenti</p>
                            <p className="text-sm md:text-2xl font-bold">{userKpis.suggestionAcceptanceRate}%</p>
                          </div>
                        </div>
                        <div className="adhd-stat-card adhd-hover-lift adhd-click-bounce w-full">
                          <div className="relative z-10">
                            <p className="text-xs font-medium text-muted-foreground">Uso Azioni Rapide</p>
                            <p className="text-sm md:text-2xl font-bold">{userKpis.quickActionUsageRate}%</p>
                          </div>
                        </div>
                        <div className="adhd-stat-card adhd-hover-lift adhd-click-bounce w-full">
                          <div className="relative z-10">
                            <p className="text-xs font-medium text-muted-foreground">Completamento Focus</p>
                            <p className="text-sm md:text-2xl font-bold">{userKpis.focusCompletionRate}%</p>
                          </div>
                        </div>
                        <div className="adhd-stat-card adhd-hover-lift adhd-click-bounce w-full">
                          <div className="relative z-10">
                            <p className="text-xs font-medium text-muted-foreground">Soddisfazione Media</p>
                            <p className="text-sm md:text-2xl font-bold">{userKpis.averageSatisfaction}/5</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Automazioni */}
                    <div>
                      <p className="text-sm font-medium mb-2">Automazioni</p>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          Attive: {(analytics as any).activeAutomations ?? 0}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Totali: {(analytics as any).totalAutomations ?? 0}
                        </Badge>
                      </div>
                    </div>

                    {/* Clustering delle task */}
                    <div>
                      <p className="text-sm font-medium mb-2">Cluster di Task</p>
                      {taskClusters && taskClusters.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                          {taskClusters.slice(0, 4).map((cluster) => (
                            <div key={cluster.id} className="border rounded p-3">
                              <p className="text-sm font-medium">{cluster.name}</p>
                              <p className="text-xs text-muted-foreground">{cluster.tasks.length} task • similarità {(cluster.similarity * 100).toFixed(0)}%</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Nessun cluster disponibile.</p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="text-xs text-muted-foreground">
                      Ultima analisi: {new Date(((analytics as any).lastAnalysisAt || new Date())).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Analisi non disponibili al momento.</p>
                    <p className="text-sm mt-2">Prova a premere "Aggiorna analisi" per elaborare i dati recenti.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className={cn("w-full max-w-7xl mx-auto p-2 md:p-4", className)}>
        {isUltraFocusActive && ultraFocusTask ? (
          <UltraFocusMode
            task={ultraFocusTask}
            onExit={exitUltraFocus}
            onTaskComplete={() => {
              completeCurrentTask();
              onProfileUpdate?.();
            }}
          />
        ) : (
          renderTaskContent()
        )}
        
        {/* Modale AI Breakdown */}
        {breakdownModal.task && (
          <AIBreakdownModal
            isOpen={breakdownModal.isOpen}
            onClose={handleBreakdownClose}
            originalTask={breakdownModal.task}
            suggestedMicroTasks={breakdownModal.suggestedMicroTasks}
            onConfirm={handleBreakdownConfirm}
            isLoading={isBreakdownLoading}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default TaskManager;
