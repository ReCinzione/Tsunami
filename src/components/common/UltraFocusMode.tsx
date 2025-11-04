import React, { useState, useEffect, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Plus, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Task } from '@/features/tasks/types';
import { taskService } from '@/features/tasks/services/taskService';
import { UnifiedSubtaskCreator } from '@/components/UnifiedSubtaskCreator';
import { useToast } from '@/hooks/use-toast';

interface UltraFocusModeProps {
  isActive: boolean;
  onClose: () => void;
  focusTask: Task | null;
  onTaskComplete: (taskId: string) => void;
  onSubtaskCreate: (parentId: string, title: string) => void;
  onSubtaskComplete: (subtaskId: string) => void;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export function UltraFocusMode({
  isActive,
  onClose,
  focusTask,
  onTaskComplete,
  onSubtaskCreate,
  onSubtaskComplete
}: UltraFocusModeProps) {
  // Timer Pomodoro (sempre attivo)
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minuti
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  
  // Subtask management
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  
  const { toast } = useToast();

  // Load subtasks when focus task changes
  useEffect(() => {
    if (focusTask?.id) {
      loadSubtasks();
    }
  }, [focusTask?.id]);

  const loadSubtasks = async () => {
    if (!focusTask?.id) return;
    
    try {
      const data = await taskService.getSubtasks(focusTask.id);
      setSubtasks(data.map(task => ({
        id: task.id,
        title: task.title,
        completed: task.status === 'completed',
        created_at: task.created_at
      })));
    } catch (error) {
      console.error('Error loading subtasks:', error);
    }
  };

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    if (isBreak) {
      // Fine pausa, torna al lavoro
      setTimeLeft(25 * 60);
      setIsBreak(false);
      toast({
        title: "⚡ Pausa finita!",
        description: "Torna al lavoro con energia rinnovata",
      });
    } else {
      // Fine sessione lavoro, inizia pausa
      setTimeLeft(5 * 60);
      setIsBreak(true);
      toast({
        title: "🎉 Sessione completata!",
        description: "Prenditi una pausa di 5 minuti",
      });
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubtaskToggle = async (subtask: Subtask) => {
    try {
      await onSubtaskComplete(subtask.id);
      await loadSubtasks(); // Reload to get updated state
      
      if (!subtask.completed) {
        toast({
          title: "🎯 Subtask completata!",
          description: `"${subtask.title}" completata`,
        });
      }
    } catch (error) {
      toast({
        title: "❌ Errore",
        description: "Impossibile aggiornare la subtask",
        variant: "destructive"
      });
    }
  };

  const handleCompleteMainTask = async () => {
    if (!focusTask?.id) return;
    
    try {
      await onTaskComplete(focusTask.id);
      toast({
        title: "🎉 Task completata!",
        description: `"${focusTask.title}" completata con successo`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "❌ Errore",
        description: "Impossibile completare la task",
        variant: "destructive"
      });
    }
  };

  // Calculate progress
  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const totalSubtasks = subtasks.length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  const timerProgress = isBreak 
    ? ((5 * 60 - timeLeft) / (5 * 60)) * 100
    : ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  if (!isActive || !focusTask) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900">
      {/* Header minimalista */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-3 h-3 rounded-full animate-pulse",
            isBreak ? "bg-orange-500" : "bg-green-500"
          )} />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {isBreak ? "🧘 Pausa" : "🎯 Focus Mode"}
          </span>
        </div>
        
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Contenuto principale centrato */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-8 max-w-2xl mx-auto">
        
        {/* Timer Pomodoro Grande */}
        <div className="text-center mb-12">
          <div className={cn(
            "text-8xl font-mono font-bold mb-4",
            isBreak ? "text-orange-600" : "text-blue-600"
          )}>
            {formatTime(timeLeft)}
          </div>
          
          <Progress 
            value={timerProgress} 
            className={cn(
              "w-80 h-3 mb-6",
              isBreak ? "[&>div]:bg-orange-500" : "[&>div]:bg-blue-500"
            )}
          />
          
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={toggleTimer}
              size="lg"
              className={cn(
                "h-12 px-8",
                isBreak ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isRunning ? 'Pausa' : 'Inizia'}
            </Button>
            
            <Button
              onClick={resetTimer}
              variant="outline"
              size="lg"
              className="h-12 px-6"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Task principale */}
        <Card className="w-full max-w-xl mb-8">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">{focusTask.title}</h2>
                {focusTask.description && (
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {focusTask.description}
                  </p>
                )}
                
                {/* Progress subtask */}
                {totalSubtasks > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <span>Progresso subtask</span>
                      <span>{completedSubtasks}/{totalSubtasks}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleCompleteMainTask}
                variant="outline"
                size="sm"
                className="ml-4 text-green-600 border-green-600 hover:bg-green-50"
              >
                <Check className="w-4 h-4 mr-2" />
                Completa
              </Button>
            </div>

            {/* Lista subtask */}
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                >
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => handleSubtaskToggle(subtask)}
                    className="h-5 w-5"
                  />
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                  <span className={cn(
                    "flex-1",
                    subtask.completed && "line-through text-slate-500"
                  )}>
                    {subtask.title}
                  </span>
                </div>
              ))}
              
              {/* Unified Subtask Creator */}
              <UnifiedSubtaskCreator
                mode="quick"
                parentTask={focusTask}
                onCreateSubtask={async (title: string) => {
                  if (!focusTask?.id) return;
                  await onSubtaskCreate(focusTask.id, title);
                  await loadSubtasks();
                }}
                showQuickInput={showAddSubtask}
                onToggleQuickInput={() => setShowAddSubtask(!showAddSubtask)}
                placeholder="Nuova subtask..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}