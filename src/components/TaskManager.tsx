import React, { useRef, useState } from 'react';
import { TaskListContainer } from '../features/tasks/containers/TaskListContainer';
import { useFocusMode, FocusMode, FocusKeep } from './common/FocusMode';
import { useUIStore } from '../store/uiStore';
import { useTaskStats } from '../features/tasks/hooks/useTasks';
import { usePatternMining } from '../hooks/usePatternMining';
import { SmartSuggestionsPanel } from './SmartSuggestionsPanel';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Focus, 
  BarChart3, 
  Settings, 
  Target, 
  Zap, 
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  Lightbulb
} from 'lucide-react';
import { cn } from '../lib/utils';
import { StatsSkeleton } from './common/Skeleton';
import { ErrorBoundary } from './common/ErrorBoundary';
import { createAIService, isAISupported } from '../lib/AIService';
import { AIBreakdownModal } from './AIBreakdownModal';
import { taskService } from '../features/tasks/services/taskService';
import type { MicroTask } from '../types/ai';

interface TaskManagerProps {
  userId: string;
  showCompleted?: boolean;
  focusMode?: boolean;
  focusTaskCount?: number;
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
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6", className)}>
      {statCards.map((stat, index) => (
        <Card key={index} className={cn("transition-all hover:shadow-md w-full", stat.color)}>
          <CardContent className="p-2 md:p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-muted-foreground break-words">
                  {stat.title}
                </p>
                <p className="text-lg md:text-2xl font-bold">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground break-words">
                  {stat.description}
                </p>
              </div>
              <div className="flex-shrink-0">
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



// Componente principale TaskManager refactorizzato
export const TaskManager: React.FC<TaskManagerProps> = ({
  userId,
  showCompleted = false,
  focusMode: initialFocusMode = false,
  focusTaskCount = 3,
  onProfileUpdate,
  className
}) => {
  const taskListRef = useRef<{ handleCreateTask: () => void } | null>(null);
  const { 
    isActive: isFocusModeActive, 
    toggleFocusMode, 
    startFocusSession,
    settings: focusSettings
  } = useFocusMode();
  
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
    dismissSuggestion
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

  // Inizializza la modalità focus se richiesta
  React.useEffect(() => {
    if (initialFocusMode && !isFocusModeActive) {
      toggleFocusMode();
    }
  }, [initialFocusMode, isFocusModeActive, toggleFocusMode]);

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

  // Gestisce il completamento di una sessione focus
  const handleFocusSessionComplete = React.useCallback(() => {
    onProfileUpdate?.();
    // Mostra notifica di completamento sessione
  }, [onProfileUpdate]);

  const renderTaskContent = () => (
    <div className="space-y-6">
      {/* Header con controlli */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">
            I tuoi Task
          </h2>
          
          {isFocusModeActive && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              <Focus className="w-3 h-3 mr-1" />
              Modalità Focus
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Bottone Crea Task */}
          <Button
            onClick={() => {
              if (taskListRef.current?.handleCreateTask) {
                taskListRef.current.handleCreateTask();
              }
            }}
            variant="default"
            size="sm"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuova Task</span>
          </Button>
          
          {/* Bottone Focus - solo in header */}
          <div className="hidden md:block">
            {!isFocusModeActive && (
              <Button
                onClick={() => startFocusSession(25)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Focus className="w-4 h-4" />
                Focus 25min
              </Button>
            )}
          </div>
          
          <div className="relative group">
            <Button
              onClick={() => setDistractionMode(!distractionMode)}
              variant={distractionMode ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {distractionMode ? "Modalità Semplice" : "Modalità Avanzata"}
            </Button>
            
            {/* Tooltip con descrizioni */}
            <div className="absolute bottom-full left-0 mb-2 w-72 md:w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="space-y-2">
                <div>
                  <strong>Modalità Semplice:</strong> Mostra solo la lista dei tuoi task e la funzione aggiungi, nascondendo tutte le analisi e le funzioni avanzate.
                </div>
                <div>
                  <strong>Modalità Avanzata:</strong> Sblocca tutte le funzioni di analisi, i timer, la gestione focus, insight e filtri dettagliati.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs per diverse visualizzazioni */}
      <Tabs value={currentView || "active"} onValueChange={(value) => {
        console.log('Tab clicked:', value);
        console.log('Current view before:', currentView);
        setCurrentView(value);
        console.log('Current view after:', value);
      }} className="w-full">
        <TabsList className={cn(
          "grid w-full gap-1 h-auto p-1",
          distractionMode ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
        )}>
          <TabsTrigger value="active" className="flex items-center gap-2 text-xs md:text-sm">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Task Attivi</span>
            <span className="sm:hidden">Attivi</span>
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="flex items-center gap-2 text-xs md:text-sm"
            onClick={() => {
              console.log('Completati tab trigger clicked');
              console.log('Current view:', currentView);
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Completati</span>
            <span className="sm:hidden">Fatti</span>
          </TabsTrigger>
          {!distractionMode && (
            <TabsTrigger value="analytics" className="hidden md:flex items-center gap-2 text-xs md:text-sm">
              <BarChart3 className="w-4 h-4" />
              Analisi
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {/* Modalità Focus - Solo visualizzazione stato su mobile */}
          {isFocusModeActive && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Modalità Focus Attiva</span>
                </div>
                <Button
                  onClick={toggleFocusMode}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  Disattiva
                </Button>
              </div>
              <p className="text-sm text-purple-600">
                Concentrati solo sulle {focusTaskCount} task più importanti
              </p>
            </div>
          )}

          <FocusKeep highlight={isFocusModeActive}>
            <TaskListContainer
              ref={taskListRef}
              userId={userId}
              showCompleted={false}
              focusMode={isFocusModeActive}
              focusTaskCount={focusTaskCount}
              onTaskComplete={onProfileUpdate}
              onTaskBreakdown={handleTaskBreakdown}
              className="min-h-[400px]"
            />
          </FocusKeep>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <TaskListContainer
            userId={userId}
            showCompleted={true}
            focusMode={false}
            onTaskComplete={onProfileUpdate}
            onTaskBreakdown={handleTaskBreakdown}
            className="min-h-[400px]"
          />
          
          {/* Statistiche rapide - dopo la lista task completate */}
          {!distractionMode && (
            <div className="mt-6">
              <QuickStats userId={userId} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analisi delle Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Analisi dettagliate in arrivo...</p>
                  <p className="text-sm mt-2">
                    Qui vedrai grafici sui tuoi pattern di produttività,
                    tempi di completamento e molto altro!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className={cn("w-full max-w-7xl mx-auto p-4", className)}>
        {isFocusModeActive ? (
          <FocusMode
            isActive={isFocusModeActive}
            onToggle={toggleFocusMode}
            showTimer={focusSettings.showTimer}
            timerDuration={focusSettings.timerDuration}
            onTimerComplete={handleFocusSessionComplete}
            intensity={focusSettings.intensity}
          >
            {renderTaskContent()}
          </FocusMode>
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