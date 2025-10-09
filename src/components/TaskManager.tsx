import React from 'react';
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
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { StatsSkeleton } from './common/Skeleton';
import { ErrorBoundary } from './common/ErrorBoundary';

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
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6", className)}>
      {statCards.map((stat, index) => (
        <Card key={index} className={cn("transition-all hover:shadow-md", stat.color)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">
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
      {/* Statistiche rapide */}
      <FocusKeep highlight={isFocusModeActive}>
        <QuickStats userId={userId} />
      </FocusKeep>

      {/* Controlli modalità focus */}
      <div className="flex items-center justify-between">
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
          
          <Button
            onClick={() => setDistractionMode(!distractionMode)}
            variant={distractionMode ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {distractionMode ? "Modalità Semplice" : "Modalità Avanzata"}
          </Button>
        </div>
      </div>

      {/* Tabs per diverse visualizzazioni */}
      <Tabs value={currentView} onValueChange={setCurrentView} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Attivi
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Completati
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analisi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <FocusKeep highlight={isFocusModeActive}>
            <TaskListContainer
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