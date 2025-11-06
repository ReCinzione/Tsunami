import React, { useState, useEffect, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Check, Target, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Task } from '@/features/tasks/types';
import { taskService } from '@/features/tasks/services/taskService';
import { useToast } from '@/hooks/use-toast';
import { SubtaskManager } from '@/components/SubtaskManager';
import { UnifiedSubtaskCreator } from '@/components/UnifiedSubtaskCreator';

interface UltraFocusModeProps {
  task: Task;
  onExit: () => void;
  onTaskComplete?: () => void;
}

export function UltraFocusMode({ task, onExit, onTaskComplete }: UltraFocusModeProps) {
  // Timer state (Pomodoro: 25 minutes default)
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25 * 60);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [isSubtaskSuggestionsOpen, setIsSubtaskSuggestionsOpen] = useState(false);
  
  // Task state
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [subtaskCount, setSubtaskCount] = useState({ completed: 0, total: 0 });
  
  const { toast } = useToast();

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    setSessionCount(prev => prev + 1);
    
    if (soundEnabled) {
      playCompletionSound();
    }
    
    toast({
      title: "🎯 Sessione Focus Completata!",
      description: `Hai completato ${sessionCount + 1} sessioni di focus. Prenditi una pausa!`,
      duration: 5000,
    });
    
    // Auto-start break timer (5 minutes)
    setTimeLeft(5 * 60);
    setTimerDuration(5 * 60);
    setIsTimerRunning(true);
  }, [soundEnabled, sessionCount, toast]);

  // Play completion sound
  const playCompletionSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play completion sound:', error);
    }
  };

  // Timer controls
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerDuration);
  };

  const startPomodoroSession = () => {
    setTimeLeft(25 * 60);
    setTimerDuration(25 * 60);
    setIsTimerRunning(true);
  };

  const startBreak = (duration: number) => {
    setTimeLeft(duration * 60);
    setTimerDuration(duration * 60);
    setIsTimerRunning(true);
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle task completion
  const handleCompleteTask = async () => {
    try {
      await taskService.updateTask(currentTask.id, { status: 'completed' });
      
      toast({
        title: "🎉 Task Completata!",
        description: `"${currentTask.title}" è stata completata con successo!`,
        duration: 5000,
      });
      
      onTaskComplete?.();
      onExit();
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "❌ Errore",
        description: "Impossibile completare la task",
        variant: "destructive"
      });
    }
  };

  // Handle subtask updates
  const handleSubtaskUpdate = useCallback(() => {
    // This will be called when subtasks are updated
    // We could refresh task data here if needed
  }, []);

  // Create subtask from suggestions (advanced dialog)
  const handleCreateSubtaskFromSuggestion = useCallback(async (title: string, description?: string) => {
    try {
      const taskData = {
        title: title,
        description: description || '',
        task_type: currentTask.task_type,
        energy_required: 'bassa' as const,
        due_date: currentTask.due_date,
        is_recurring: false,
        tags: currentTask.tags || [],
        can_be_interrupted: true
      };

      await taskService.createTask(currentTask.user_id, taskData, currentTask.id);
      setIsSubtaskSuggestionsOpen(false);
      handleSubtaskUpdate();
      toast({
        title: '✅ Subtask creata',
        description: `"${title}" aggiunta con successo`,
      });
    } catch (error) {
      console.error('Error creating subtask via suggestions:', error);
      toast({
        title: '❌ Errore',
        description: 'Impossibile creare la subtask',
        variant: 'destructive'
      });
    }
  }, [currentTask, handleSubtaskUpdate, toast]);

  // Calculate timer progress
  const timerProgress = timerDuration > 0 ? ((timerDuration - timeLeft) / timerDuration) * 100 : 0;
  const isBreakTime = timerDuration === 5 * 60;

  // Apply focus mode styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      body { overflow: hidden !important; }
      .sidebar, .header, .footer, .navigation { display: none !important; }
      [data-focus-hide] { display: none !important; }
      .notification, .toast { z-index: 9999 !important; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header in stile FocusMode */}
      <div className="fixed top-0 left-0 right-0 z-60 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center justify-between p-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-blue-600" />
            <Badge variant={isBreakTime ? "secondary" : "default"} className="bg-blue-50 text-blue-700 border-blue-200">
              {isBreakTime ? "Pausa" : "Focus"} • Sessione {sessionCount + 1}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button onClick={resetTimer} variant="ghost" size="sm" className="h-8 w-8 p-0">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="ghost" size="sm" className="h-8 w-8 p-0">
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button onClick={onExit} variant="ghost" size="sm" className="h-8 px-2">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {/* Progress bar del timer in header */}
        <div className="px-4 pb-2">
          <div className="max-w-5xl mx-auto">
            <Progress value={timerProgress} className="h-1 bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="min-h-screen pt-24 pb-8 px-4 flex flex-col">
        {/* Timer Display grande al centro */}
        <div className="max-w-5xl mx-auto w-full">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="text-6xl font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatTime(timeLeft)}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={toggleTimer} variant={isTimerRunning ? "secondary" : "default"} size="lg">
                    {isTimerRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                    {isTimerRunning ? "Pausa" : "Avvia"}
                  </Button>
                  <Button onClick={resetTimer} variant="outline" size="lg">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Reset
                  </Button>
                  <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="ghost" size="lg">
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
                  <Button onClick={startPomodoroSession} variant="outline" size="sm" disabled={isTimerRunning}>
                    Pomodoro (25m)
                  </Button>
                  <Button onClick={() => startBreak(5)} variant="outline" size="sm" disabled={isTimerRunning}>
                    Pausa Breve (5m)
                  </Button>
                  <Button onClick={() => startBreak(15)} variant="outline" size="sm" disabled={isTimerRunning}>
                    Pausa Lunga (15m)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Task Section */}
        <div className="flex-1 max-w-4xl mx-auto w-full space-y-6">
          {/* Current Task */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-slate-800 dark:text-slate-200">
                  {currentTask.title}
                </CardTitle>
                <Button
                  onClick={handleCompleteTask}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Completa Task
                </Button>
              </div>
              
              {currentTask.description && (
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  {currentTask.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline">
                  {currentTask.task_type}
                </Badge>
                <Badge variant="outline">
                  Energia: {currentTask.energy_required}
                </Badge>
                {currentTask.due_date && (
                  <Badge variant="outline">
                    Scadenza: {new Date(currentTask.due_date).toLocaleDateString('it-IT')}
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Subtasks Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Subtask
              </h2>
              <Button
                onClick={() => setIsSubtaskSuggestionsOpen(true)}
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Suggerimenti
              </Button>
            </div>
            <SubtaskManager
              parentTask={currentTask}
              onSubtaskUpdate={handleSubtaskUpdate}
              showProgress={true}
              allowEdit={true}
            />
            <div className="mt-2 sm:hidden">
              <Button
                onClick={() => setIsSubtaskSuggestionsOpen(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Suggerimenti subtask
              </Button>
            </div>
          </div>
        </div>

        {/* Focus Tips */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            💡 <strong>Suggerimento:</strong> Concentrati su una cosa alla volta. 
            {isBreakTime ? " È ora di riposare!" : " Usa il timer Pomodoro per mantenere il focus."}
          </p>
        </div>
      </div>
      {/* Advanced Subtask Suggestions Dialog */}
      <UnifiedSubtaskCreator
        mode="advanced"
        parentTask={currentTask}
        onCreateSubtask={handleCreateSubtaskFromSuggestion}
        isOpen={isSubtaskSuggestionsOpen}
        onClose={() => setIsSubtaskSuggestionsOpen(false)}
      />
    </div>
  );
}
