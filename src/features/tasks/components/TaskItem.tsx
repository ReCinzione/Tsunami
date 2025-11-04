import React, { useState, useCallback, useMemo, memo } from 'react';
import { Task, TaskStatus, TaskFormData } from '../types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight,
  Edit,
  Trash2,
  Calendar,
  Target,
  Plus,
  Focus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { taskService } from '../services/taskService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ADHDIndicators } from '@/components/ADHDIndicators';
import { UnifiedSubtaskCreator } from '@/components/UnifiedSubtaskCreator';

interface TaskItemProps {
  task: Task;
  onComplete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onBreakdown?: (task: Task) => void;
  onUltraFocus?: (task: Task) => void;
  onClick?: (task: Task) => void;
  isSelected?: boolean;
  showActions?: boolean;
  compact?: boolean;
  showDetails?: boolean;
  focusMode?: boolean;
  className?: string;
  // Nuovi controlli globali
  forceShowSubtaskToggle?: boolean;
  globalSubtasksOpen?: boolean;
}

// Componente memoizzato per le azioni della task
const TaskActions = memo<{
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onBreakdown?: () => void;
  onUltraFocus?: (task: Task) => void;
  onComplete?: (taskId: string) => void;
}>(({ task, onEdit, onDelete, onBreakdown, onUltraFocus, onComplete }) => {
  const handleEdit = useCallback(() => onEdit?.(task), [onEdit, task]);
  const handleDelete = useCallback(() => {
    if (confirm(`Sei sicuro di voler eliminare la task "${task.title}"? Questa azione non può essere annullata.`)) {
      onDelete?.(task.id);
    }
  }, [onDelete, task.id, task.title]);
  const handleBreakdown = useCallback(() => onBreakdown?.(), [onBreakdown]);
  const handleUltraFocus = useCallback(() => onUltraFocus?.(task), [onUltraFocus, task]);
  const handleComplete = useCallback(() => {
    if (confirm(`Sei sicuro di voler completare la task "${task.title}"?`)) {
      onComplete?.(task.id);
    }
  }, [onComplete, task.id, task.title]);

  return (
    <div className="grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {task.status !== 'completed' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUltraFocus}
            className="h-10 w-10 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Ultra Focus Mode"
          >
            <Focus className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleComplete}
            className="h-10 w-10 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
            title="Completa task"
          >
            <CheckCircle2 className="h-5 w-5" />
          </Button>
        </>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEdit}
        className="h-10 w-10 p-0 hover:bg-blue-50"
        title="Modifica task"
      >
        <Edit className="h-5 w-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBreakdown}
        className="h-10 w-10 p-0 hover:bg-green-50"
        title="Crea Subtask"
      >
        <Plus className="h-5 w-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        className="h-10 w-10 p-0 text-destructive hover:text-destructive hover:bg-red-50"
        title="Elimina task"
      >
        <Trash2 className="h-5 w-5" />
      </Button>
    </div>
  );
});

TaskActions.displayName = 'TaskActions';

// Componente memoizzato per il badge di priorità (colore + simbolo)
const PriorityBadge = memo<{ priority: 'bassa' | 'media' | 'alta' }>(({ priority }) => {
  const priorityConfig = useMemo(() => {
    switch (priority) {
      case 'alta':
        return { color: 'bg-red-500', symbol: '🔴', title: 'Priorità Alta' };
      case 'media':
        return { color: 'bg-yellow-500', symbol: '🟡', title: 'Priorità Media' };
      case 'bassa':
        return { color: 'bg-green-500', symbol: '🟢', title: 'Priorità Bassa' };
      default:
        return { color: 'bg-yellow-500', symbol: '🟡', title: 'Priorità Media' };
    }
  }, [priority]);

  return (
    <span className="text-sm" title={priorityConfig.title}>
      {priorityConfig.symbol}
    </span>
  );
});

PriorityBadge.displayName = 'PriorityBadge';

// Componente memoizzato per il badge di energia (colore + simbolo)
const EnergyBadge = memo<{ energy: Task['energy_required'] }>(({ energy }) => {
  const energyConfig = useMemo(() => {
    switch (energy) {
      case 'molto_alta':
          return { color: 'bg-red-600', symbol: '🌋', title: 'Energia Molto Alta' };
      case 'alta':
          return { color: 'bg-orange-500', symbol: '🔥', title: 'Energia Alta' };
      case 'media':
        return { color: 'bg-yellow-500', symbol: '💡', title: 'Energia Media' };
      case 'bassa':
        return { color: 'bg-blue-500', symbol: '🌊', title: 'Energia Bassa' };
      case 'molto_bassa':
        return { color: 'bg-green-500', symbol: '🍃', title: 'Energia Molto Bassa' };
      default:
        return { color: 'bg-gray-500', symbol: '❓', title: 'Energia Non Specificata' };
    }
  }, [energy]);

  return (
    <span className="text-sm" title={energyConfig.title}>
      {energyConfig.symbol}
    </span>
  );
});

EnergyBadge.displayName = 'EnergyBadge';

// Componente memoizzato per il tipo di task (solo simbolo)
const TaskTypeIcon = memo<{ taskType: Task['task_type'] }>(({ taskType }) => {
  const typeConfig = useMemo(() => {
    switch (taskType) {
      case 'azione':
        return { icon: '🎯', title: 'Azione' };
      case 'riflessione':
        return { icon: '🤔', title: 'Riflessione' };
      case 'comunicazione':
        return { icon: '💬', title: 'Comunicazione' };
      case 'creativita':
        return { icon: '🎨', title: 'Creatività' };
      case 'organizzazione':
        return { icon: '📋', title: 'Organizzazione' };
      default:
        return { icon: '📝', title: 'Task Generica' };
    }
  }, [taskType]);

  return (
    <span 
      className="text-sm"
      title={typeConfig.title}
    >
      {typeConfig.icon}
    </span>
  );
});

TaskTypeIcon.displayName = 'TaskTypeIcon';

// Componente memoizzato per le subtask
const SubtasksList = memo<{
  taskId: string;
  isExpanded: boolean;
}>(({ taskId, isExpanded }) => {
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!isExpanded) return;
    
    setLoading(true);
    taskService.getSubtasks(taskId)
      .then(setSubtasks)
      .catch((error) => {
        console.error('Errore caricamento subtask:', error);
      })
      .finally(() => setLoading(false));
  }, [taskId, isExpanded]);

  if (!isExpanded) return null;
  if (loading) return <div className="text-sm text-muted-foreground p-2">Caricamento subtask...</div>;
  if (subtasks.length === 0) return <div className="text-sm text-muted-foreground p-2">Nessuna subtask</div>;

  const completedCount = subtasks.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedCount / subtasks.length) * 100;

  return (
    <div className="mt-3 space-y-2">
      {/* Barra di progresso */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Progresso subtask:</span>
        <Progress value={progressPercentage} className="flex-1 h-2" />
        <span>{completedCount}/{subtasks.length}</span>
      </div>
      
      {/* Lista subtask */}
      <div className="space-y-2 pl-4 border-l-2 border-muted">
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-start gap-3 p-2 rounded-md bg-muted/30">
            <Checkbox
              checked={subtask.status === 'completed'}
              disabled
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TaskTypeIcon taskType={subtask.task_type} />
                <h4 className={cn(
                  "text-sm font-medium",
                  subtask.status === 'completed' && "line-through text-muted-foreground"
                )}>
                  {subtask.title}
                </h4>
              </div>
              
              {subtask.description && (
                <p className={cn(
                  "text-xs text-muted-foreground mt-1",
                  subtask.status === 'completed' && "line-through"
                )}>
                  {subtask.description}
                </p>
              )}
              
              <div className="mt-2">
                <ADHDIndicators 
                  task={{
                    ...subtask,
                    xp_reward: undefined
                  }}
                  compact={true}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

SubtasksList.displayName = 'SubtasksList';

/**
 * Componente ottimizzato per visualizzare una singola task
 * Utilizza React.memo e callback memoizzati per evitare re-render non necessari
 */
export const TaskItem = memo<TaskItemProps>(({ 
  task, 
  onComplete, 
  onEdit, 
  onDelete, 
  onBreakdown,
  onUltraFocus,
  onClick,
  isSelected = false,
  showActions = true,
  compact = false,
  showDetails = true,
  focusMode = false,
  className,
  forceShowSubtaskToggle = false,
  globalSubtasksOpen = false,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Memoizza lo stato di completamento
  const isCompleted = useMemo(() => task.status === 'completed', [task.status]);
  
  // Memoizza l'icona di stato
  const statusIcon = useMemo(() => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  }, [task.status]);

  // Callback memoizzati
  const handleComplete = useCallback(async () => {
    if (isCompleting || isCompleted) return;
    
    if (!confirm(`Sei sicuro di voler completare la task "${task.title}"?`)) {
      return;
    }
    
    setIsCompleting(true);
    try {
      await onComplete?.(task.id);
      toast({
        title: "Task completata! 🎉",
        description: `"${task.title}" è stata completata con successo.`,
        duration: 3000
      });
    } catch (error) {
      console.error('Errore completamento task:', error);
    } finally {
      // Debounce per evitare click multipli
      setTimeout(() => setIsCompleting(false), 1000);
    }
  }, [isCompleting, isCompleted, onComplete, task.id, task.title, toast]);

  const handleClick = useCallback(() => {
    onClick?.(task);
  }, [onClick, task]);

  const handleBreakdown = useCallback(() => {
    setShowSubtaskModal(true);
  }, []);

  const toggleSubtasks = useCallback(() => {
    setShowSubtasks(prev => !prev);
  }, []);

  // Sincronizza apertura subtask con controllo globale
  React.useEffect(() => {
    setShowSubtasks(Boolean(globalSubtasksOpen));
  }, [globalSubtasksOpen]);

  // Carica subtask se la task ne ha
  React.useEffect(() => {
    if (task.has_subtasks) {
      taskService.getSubtasks(task.id)
        .then(setSubtasks)
        .catch((error) => {
          console.error('Errore caricamento subtask:', error);
        });
    }
  }, [task.id, task.has_subtasks]);

  // Memoizza le classi CSS
  const cardClasses = useMemo(() => cn(
    "group transition-all duration-200 hover:shadow-md cursor-pointer",
    isSelected && "ring-2 ring-primary",
    isCompleted && "opacity-75",
    compact && "py-2",
    className
  ), [isSelected, isCompleted, compact, className]);

  const titleClasses = useMemo(() => cn(
    "font-medium transition-colors",
    isCompleted && "line-through text-muted-foreground",
    compact ? "text-sm" : "text-base"
  ), [isCompleted, compact]);

  return (
    <Card className={cardClasses} onClick={handleClick}>
      <CardHeader className={cn("pb-1 md:pb-2 p-3 md:p-6", compact && "py-2")}>
        <div className="flex items-start justify-between gap-2 md:gap-3">
          <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
            
            {/* Contenuto principale */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 md:gap-2 mb-1">
                <h3 className={titleClasses}>
                  {task.title}
                </h3>
              </div>
              
              {!compact && task.description && (
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-1 md:mb-2">
                  {task.description}
                </p>
              )}
              
              {/* Badges e metadati */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Tipo di task - solo simbolo (primo) */}
                {task.task_type && (
                  <TaskTypeIcon taskType={task.task_type} />
                )}

                {/* Icona Priorità (emoji) */}
                {task.priority && (
                  <PriorityBadge priority={task.priority} />
                )}
                
                {/* Indicatori ADHD-friendly */}
                <ADHDIndicators 
                  task={task}
                  subtasks={subtasks}
                  showProgress={task.has_subtasks && subtasks.length > 0}
                  compact={false}
                />
                
                {/* Data di pianificazione - outline verde con testo */}
                {task.planned_date && (
                  <Badge 
                    variant="outline"
                    className="text-xs mt-2 border-green-300 text-green-700"
                    title={(() => {
                      const date = new Date(task.planned_date);
                      const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
                      return hasTime 
                        ? date.toLocaleString('it-IT', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : date.toLocaleDateString('it-IT');
                    })()}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {(() => {
                      const date = new Date(task.planned_date);
                      const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
                      return hasTime 
                        ? date.toLocaleString('it-IT', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : date.toLocaleDateString('it-IT');
                    })()}
                  </Badge>
                )}
                
                {/* Data di scadenza - outline giallo con testo */}
                {task.due_date && (
                  <Badge 
                    variant="outline"
                    className="text-xs mt-2 border-yellow-300 text-yellow-700"
                    title={(() => {
                      const date = new Date(task.due_date);
                      const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
                      return hasTime 
                        ? date.toLocaleString('it-IT', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : date.toLocaleDateString('it-IT');
                    })()}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {(() => {
                      const date = new Date(task.due_date);
                      const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
                      return hasTime 
                        ? date.toLocaleString('it-IT', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : date.toLocaleDateString('it-IT');
                    })()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Azioni */}
          {showActions && (
            <div onClick={(e) => e.stopPropagation()}>
              <TaskActions
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onBreakdown={handleBreakdown}
                onUltraFocus={onUltraFocus}
                onComplete={onComplete}
              />
            </div>
          )}
        </div>
      </CardHeader>
      
      {/* Subtask collapsible */}
      {!compact && (forceShowSubtaskToggle || task.has_subtasks) && (
        <CardContent className="pt-0">
          <Collapsible open={showSubtasks} onOpenChange={setShowSubtasks}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start p-0 h-auto font-normal"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSubtasks();
                }}
              >
                {showSubtasks ? (
                  <ChevronDown className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                <span className="text-sm text-muted-foreground">
                  {showSubtasks ? 'Nascondi' : 'Mostra'} subtask
                </span>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <SubtasksList taskId={task.id} isExpanded={showSubtasks} />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}
      
      {/* Modal per creazione subtask */}
      <UnifiedSubtaskCreator
        mode="advanced"
        isOpen={showSubtaskModal}
        onClose={() => setShowSubtaskModal(false)}
        parentTask={task}
        onCreateSubtask={async (title: string, description?: string) => {
          if (!user?.id) {
            throw new Error('Utente non autenticato');
          }

          const subtaskData = {
            title,
            description: description || '',
            status: 'pending' as const,
            priority: 'media' as const,
            parent_task_id: task.id,
            task_type: task.task_type,
            tags: task.tags,
            is_recurring: false,
            energy_required: 'media' as const,
            xp_reward: 10,
            user_id: user.id
          };

          await taskService.createSubtask(user.id, subtaskData);
        }}
      />
    </Card>
  );
});

TaskItem.displayName = 'TaskItem';
