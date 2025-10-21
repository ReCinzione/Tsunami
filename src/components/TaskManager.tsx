import React, { useRef, useState } from 'react';
import { TaskListContainer } from '../features/tasks/containers/TaskListContainer';
import { useFocusMode, FocusMode, FocusKeep } from './common/FocusMode';
import { useUIStore } from '../store/uiStore';
import { useTaskStats } from '../features/tasks/hooks/useTasks';
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
  Brain,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { StatsSkeleton } from './common/Skeleton';
import { ErrorBoundary } from './common/ErrorBoundary';
import { createAIService, isAISupported } from '../lib/AIService';

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

// Componente per AI Breakdown
function AIBreakdownButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [aiSupported, setAiSupported] = useState(false);

  React.useEffect(() => {
    isAISupported().then(setAiSupported);
  }, []);

  const handleAIBreakdown = async () => {
    if (!taskDescription.trim()) return;
    
    setIsLoading(true);
    try {
      const aiService = await createAIService();
      
      // Check if model is loaded
      const status = aiService.getStatus();
      if (!status.isLoaded) {
        console.log('🤖 Caricamento modello AI...');
        await aiService.loadModel();
      }
      
      const response = await aiService.breakdownTask({
        taskDescription,
        context: {
          userPreferences: {
            preferredDuration: 25, // Pomodoro standard
            energyLevel: 'medio',
            workingHours: { start: 9, end: 18 }
          },
          currentMood: 'neutro',
          availableTime: 120 // 2 ore
        }
      });
      
      console.log('🎯 AI Breakdown Result:', response);
      
      // TODO: Integrate with task creation system
      // For now, just show in console
      alert(`AI ha suddiviso la task in ${response.microTasks.length} micro-task!\n\nControlla la console per i dettagli.`);
      
      setTaskDescription('');
      setShowInput(false);
      
    } catch (error) {
      console.error('❌ AI Breakdown Error:', error);
      alert('Errore durante la suddivisione AI. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!aiSupported) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="flex items-center gap-2 opacity-50"
        title="AI non supportata in questo browser"
      >
        <Brain className="w-4 h-4" />
        <span className="hidden sm:inline">AI Breakdown</span>
      </Button>
    );
  }

  if (showInput) {
    return (
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
        <input
          type="text"
          placeholder="Descrivi la task da suddividere..."
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAIBreakdown()}
          className="flex-1 min-w-0 px-2 py-1 text-sm border-0 bg-transparent focus:outline-none placeholder:text-blue-400"
          autoFocus
        />
        <Button
          onClick={handleAIBreakdown}
          disabled={isLoading || !taskDescription.trim()}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Brain className="w-3 h-3" />
          )}
        </Button>
        <Button
          onClick={() => {
            setShowInput(false);
            setTaskDescription('');
          }}
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
        >
          ✕
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => setShowInput(true)}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
      title="Usa l'AI per suddividere task complesse"
    >
      <Brain className="w-4 h-4" />
      <span className="hidden sm:inline">AI Breakdown</span>
    </Button>
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

  // Inizializza la modalità focus se richiesta
  React.useEffect(() => {
    if (initialFocusMode && !isFocusModeActive) {
      toggleFocusMode();
    }
  }, [initialFocusMode, isFocusModeActive, toggleFocusMode]);

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
          {/* Bottone AI Breakdown */}
          <AIBreakdownButton />
          
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
      </div>
    </ErrorBoundary>
  );
};

export default TaskManager;