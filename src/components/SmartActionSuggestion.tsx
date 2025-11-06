import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { taskService } from '@/features/tasks/services/taskService';
import { Task } from '@/types/adhd';
import { calculateMoodTaskScore } from '@/utils/taskSuggestions';
import { Clock, AlertTriangle, Zap, Target } from 'lucide-react';

interface SmartActionSuggestionProps {
  mood?: string;
  suggestedRitual?: string;
  onActionClick: (action: 'tasks' | 'mental-inbox' | 'focus') => void;
  // Permette di mostrare un suggerimento proveniente dal motore di pattern mining
  override?: {
    title: string;
    description: string;
    action: 'tasks' | 'mental-inbox' | 'focus';
    actionLabel: string;
    icon?: string;
    urgency: 'low' | 'medium' | 'high';
    task?: Task;
  };
}

interface SmartSuggestion {
  type: 'ritual' | 'urgent_task' | 'energy_match' | 'overdue';
  title: string;
  description: string;
  action: 'tasks' | 'mental-inbox' | 'focus';
  actionLabel: string;
  icon: string;
  urgency: 'low' | 'medium' | 'high';
  task?: Task;
}

export const SmartActionSuggestion: React.FC<SmartActionSuggestionProps> = ({
  mood,
  suggestedRitual,
  onActionClick,
  override
}) => {
  const { user } = useAuth();
  const { tasks } = useTasks();
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [upcomingTasksLoaded, setUpcomingTasksLoaded] = useState(false);

  // Carica task in scadenza
  useEffect(() => {
    const loadUpcomingTasks = async () => {
      if (!user?.id) {
        setUpcomingTasksLoaded(true);
        return;
      }
      
      try {
        const upcoming = await taskService.getUpcomingTasks(user.id, 3);
        setUpcomingTasks(upcoming);
      } catch (error) {
        console.error('Errore nel caricamento task in scadenza:', error);
      } finally {
        setUpcomingTasksLoaded(true);
      }
    };

    loadUpcomingTasks();
  }, [user?.id]);

  // Determina se mostrare il loading
  const isLoading = !upcomingTasksLoaded || !tasks;

  // Calcola il livello di energia basato sull'umore
  const getEnergyFromMood = (mood?: string): number => {
    switch (mood) {
      case 'congelato': return 1;
      case 'disorientato': return 2;
      case 'in_flusso': return 4;
      case 'ispirato': return 5;
      default: return 3;
    }
  };

  // Genera suggerimento intelligente
  const smartSuggestion = useMemo((): SmartSuggestion => {
    // Se è stato passato un suggerimento esterno (override), usalo direttamente
    if (override) {
      return {
        type: 'energy_match',
        title: override.title,
        description: override.description,
        action: override.action,
        actionLabel: override.actionLabel,
        icon: override.icon || '🎯',
        urgency: override.urgency,
        task: override.task
      };
    }

    const energyLevel = getEnergyFromMood(mood);
    const now = new Date();
    const activeTasks = tasks?.filter(t => t.status !== 'completed') || [];
    
    // 1. Controlla task scadute (priorità massima)
    const overdueTasks = activeTasks.filter(task => {
      if (!task.due_date) return false;
      return new Date(task.due_date) < now;
    });
    
    if (overdueTasks.length > 0) {
      const mostOverdue = overdueTasks.sort((a, b) => 
        new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
      )[0];
      
      return {
        type: 'overdue',
        title: 'Task Scaduta!',
        description: `"${mostOverdue.title}" è scaduta. Affrontala ora o ripianifica.`,
        action: 'tasks',
        actionLabel: '🚨 Gestisci Scaduta',
        icon: '⚠️',
        urgency: 'high',
        task: mostOverdue
      };
    }
    
    // 2. Controlla task urgenti (scadenza entro 24 ore)
    const urgentTasks = upcomingTasks.filter(task => {
      if (!task.due_date) return false;
      const hoursUntilDue = (new Date(task.due_date).getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilDue <= 24 && hoursUntilDue > 0;
    });
    
    if (urgentTasks.length > 0) {
      const mostUrgent = urgentTasks.sort((a, b) => 
        new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
      )[0];
      
      const hoursLeft = Math.ceil((new Date(mostUrgent.due_date!).getTime() - now.getTime()) / (1000 * 60 * 60));
      
      return {
        type: 'urgent_task',
        title: 'Task Urgente',
        description: `"${mostUrgent.title}" scade tra ${hoursLeft}h. È il momento giusto per completarla.`,
        action: 'tasks',
        actionLabel: '⏰ Completa Ora',
        icon: '🔥',
        urgency: 'high',
        task: mostUrgent
      };
    }
    
    // 3. Suggerimento basato su energia e umore
    if (activeTasks.length > 0) {
      const scoredTasks = activeTasks
        .map(task => ({
          ...task,
          score: calculateMoodTaskScore(task, mood || '', energyLevel)
        }))
        .sort((a, b) => (b as any).score - (a as any).score);
      
      const bestTask = scoredTasks[0];
      
      if ((bestTask as any).score > 60) {
        return {
          type: 'energy_match',
          title: 'Task Perfetta per Te',
          description: `"${bestTask.title}" si adatta perfettamente al tuo stato ${mood || 'attuale'}.`,
          action: 'tasks',
          actionLabel: '✨ Inizia Subito',
          icon: '🎯',
          urgency: 'medium',
          task: bestTask
        };
      }
    }
    
    // 4. Suggerimento rituale basato sull'umore
    if (mood && suggestedRitual) {
      const ritualActions = {
        'congelato': { action: 'mental-inbox' as const, label: '🧠 Libera la Mente', description: 'Inizia scaricando i pensieri nel Mental Inbox' },
        'disorientato': { action: 'focus' as const, label: '🎯 Modalità Focus', description: 'Usa il timer Pomodoro per ritrovare la concentrazione' },
        'in_flusso': { action: 'tasks' as const, label: '🌊 Cavalca l\'Onda', description: 'Approfitta di questo stato per completare task importanti' },
        'ispirato': { action: 'mental-inbox' as const, label: '💡 Cattura l\'Ispirazione', description: 'Registra le tue idee prima che svaniscano' }
      };
      
      const ritualAction = ritualActions[mood as keyof typeof ritualActions];
      
      if (ritualAction) {
        return {
          type: 'ritual',
          title: 'Rituale Suggerito',
          description: ritualAction.description,
          action: ritualAction.action,
          actionLabel: ritualAction.label,
          icon: mood === 'congelato' ? '❄️' : mood === 'disorientato' ? '🌀' : mood === 'in_flusso' ? '🌊' : '✨',
          urgency: 'low'
        };
      }
    }
    
    // 5. Fallback generico
    return {
      type: 'ritual',
      title: 'Inizia la Giornata',
      description: 'Scegli come vuoi iniziare: organizza i pensieri o pianifica le attività.',
      action: 'mental-inbox',
      actionLabel: '🚀 Inizia',
      icon: '🎯',
      urgency: 'low'
    };
  }, [mood, suggestedRitual, tasks, upcomingTasks, override]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-primary/20 border-primary/30 text-primary ring-2 ring-primary/20';
      case 'medium': return 'bg-primary/15 border-primary/25 text-primary';
      default: return 'bg-primary/10 border-primary/20 text-primary';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'tasks': return <Target className="w-4 h-4" />;
      case 'mental-inbox': return <Zap className="w-4 h-4" />;
      case 'focus': return <Clock className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-muted/30 border border-muted-foreground/20 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-muted-foreground/20 rounded mb-2"></div>
        <div className="h-4 bg-muted-foreground/10 rounded mb-4"></div>
        <div className="h-10 bg-muted-foreground/20 rounded"></div>
      </div>
    );
  }

  return (
    <div data-tutorial="smart-action-suggestion" className={`border rounded-xl p-6 transition-all duration-300 ${getUrgencyColor(smartSuggestion.urgency)}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{smartSuggestion.icon}</div>
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {smartSuggestion.title}
              {smartSuggestion.urgency === 'high' && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Urgente
                </Badge>
              )}
            </h3>
            <p className="text-sm opacity-80 mt-1">
              {smartSuggestion.description}
            </p>
          </div>
        </div>
      </div>
      
      {/* Informazioni aggiuntive per task specifiche */}
      {smartSuggestion.task && (
        <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{smartSuggestion.task.title}</span>
            {smartSuggestion.task.due_date && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(smartSuggestion.task.due_date).toLocaleDateString('it-IT')}
              </span>
            )}
          </div>
          {smartSuggestion.task.xp_reward && (
            <div className="text-xs text-muted-foreground mt-1">
              Ricompensa: {smartSuggestion.task.xp_reward} XP
            </div>
          )}
        </div>
      )}
      
      <div className="flex gap-2">
        <Button 
          onClick={() => onActionClick(smartSuggestion.action)}
          className="gap-2 flex-1"
          variant={smartSuggestion.urgency === 'high' ? 'default' : 'outline'}
        >
          {getActionIcon(smartSuggestion.action)}
          {smartSuggestion.actionLabel}
        </Button>
        
        {/* Azione secondaria basata sul contesto */}
        {smartSuggestion.type !== 'ritual' && (
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => onActionClick('mental-inbox')}
            className="gap-1"
          >
            <Zap className="w-3 h-3" />
            Idee
          </Button>
        )}
      </div>
    </div>
  );
};
