import React, { useState, useCallback, useMemo, memo } from 'react';
import { Task, TaskStatus } from '../types';
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
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { taskService } from '../services/taskService';
import { useToast } from '@/hooks/use-toast';

interface TaskItemProps {
  task: Task;
  onComplete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onBreakdown?: (task: Task) => void;
  onClick?: (task: Task) => void;
  isSelected?: boolean;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

// Componente memoizzato per le azioni della task
const TaskActions = memo<{
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onBreakdown?: (task: Task) => void;
  onComplete?: (taskId: string) => void;
}>(({ task, onEdit, onDelete, onBreakdown, onComplete }) => {
  const handleEdit = useCallback(() => onEdit?.(task), [onEdit, task]);
  const handleDelete = useCallback(() => {
    if (confirm(`Sei sicuro di voler eliminare la task "${task.title}"? Questa azione non può essere annullata.`)) {
      onDelete?.(task.id);
    }
  }, [onDelete, task.id, task.title]);
  const handleBreakdown = useCallback(() => onBreakdown?.(task), [onBreakdown, task]);
  const handleComplete = useCallback(() => {
    if (confirm(`Sei sicuro di voler completare la task "${task.title}"?`)) {
      onComplete?.(task.id);
    }
  }, [onComplete, task.id, task.title]);

  return (
    <div className="grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {task.status !== 'completed' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleComplete}
          className="h-10 w-10 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          title="Completa task"
        >
          <CheckCircle2 className="h-5 w-5" />
        </Button>
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
        className="h-10 w-10 p-0 hover:bg-yellow-50"
        title="Breakdown AI"
      >
        <Lightbulb className="h-5 w-5" />
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
  const [loaded, setLoaded] = useState(false);
  const { toast } = useToast();

  // Carica subtask solo quando necessario
  React.useEffect(() => {
    if (isExpanded && !loaded && !loading) {
      setLoading(true);
      taskService.getSubtasks(taskId)
        .then(setSubtasks)
        .catch((error) => {
          console.error('Errore caricamento subtask:', error);
          toast({
            title: "Errore",
            description: "Impossibile caricare le subtask",
            variant: "destructive"
          });
        })
        .finally(() => {
          setLoading(false);
          setLoaded(true);
        });
    }
  }, [isExpanded, loaded, loading, taskId, toast]);

  const progress = useMemo(() => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(st => st.status === 'completed').length;
    return Math.round((completed / subtasks.length) * 100);
  }, [subtasks]);

  if (!isExpanded) return null;

  return (
    <div className="mt-3 space-y-2">
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Progresso subtask:</span>
          <Progress value={progress} className="flex-1 h-2" />
          <span>{progress}%</span>
        </div>
      )}
      
      {loading ? (
        <div className="text-sm text-muted-foreground">Caricamento subtask...</div>
      ) : subtasks.length > 0 ? (
        <div className="space-y-1">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-2 text-sm pl-4">
              <Checkbox 
                checked={subtask.status === 'completed'}
                disabled
                className="h-4 w-4"
              />
              <span className={cn(
                subtask.status === 'completed' && "line-through text-muted-foreground"
              )}>
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground pl-4">Nessuna subtask</div>
      )}
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
  onClick,
  isSelected = false,
  showActions = true,
  compact = false,
  className 
}) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const { toast } = useToast();

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

  const toggleSubtasks = useCallback(() => {
    setShowSubtasks(prev => !prev);
  }, []);

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
                
                {/* Priorità - solo icona */}
                <PriorityBadge priority={task.priority} />
                
                {/* Energia - solo icona */}
                {task.energy_required && (
                  <EnergyBadge energy={task.energy_required} />
                )}
                
                {/* Data di pianificazione - sfondo verde */}
                {task.planned_date && (
                  <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
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
                
                {/* Data di scadenza - sfondo giallo */}
                {task.due_date && (
                  <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
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
                onBreakdown={onBreakdown}
                onComplete={onComplete}
              />
            </div>
          )}
        </div>
      </CardHeader>
      
      {/* Subtask collapsible */}
      {!compact && task.has_subtasks && (
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
    </Card>
  );
});

TaskItem.displayName = 'TaskItem';