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
  Zap,
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
}>(({ task, onEdit, onDelete, onBreakdown }) => {
  const handleEdit = useCallback(() => onEdit?.(task), [onEdit, task]);
  const handleDelete = useCallback(() => onDelete?.(task.id), [onDelete, task.id]);
  const handleBreakdown = useCallback(() => onBreakdown?.(task), [onBreakdown, task]);

  return (
    <div className="flex gap-0.5 md:gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEdit}
        className="h-6 w-6 md:h-8 md:w-8 p-0"
      >
        <Edit className="h-3 w-3 md:h-4 md:w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBreakdown}
        className="h-6 w-6 md:h-8 md:w-8 p-0"
        title="Breakdown AI"
      >
        <Lightbulb className="h-3 w-3 md:h-4 md:w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        className="h-6 w-6 md:h-8 md:w-8 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
      </Button>
    </div>
  );
});

TaskActions.displayName = 'TaskActions';

// Componente memoizzato per il badge di priorità
const PriorityBadge = memo<{ priority: Task['priority'] }>(({ priority }) => {
  const priorityConfig = useMemo(() => {
    switch (priority) {
      case 'high':
        return { label: 'Alta', variant: 'destructive' as const, icon: AlertTriangle };
      case 'medium':
        return { label: 'Media', variant: 'default' as const, icon: Clock };
      case 'low':
        return { label: 'Bassa', variant: 'secondary' as const, icon: Clock };
      default:
        return { label: 'Media', variant: 'default' as const, icon: Clock };
    }
  }, [priority]);

  const Icon = priorityConfig.icon;

  return (
    <Badge variant={priorityConfig.variant} className="text-xs">
      <Icon className="w-3 h-3 mr-1" />
      {priorityConfig.label}
    </Badge>
  );
});

PriorityBadge.displayName = 'PriorityBadge';

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
            {/* Checkbox per completamento */}
            <Checkbox
              checked={isCompleted}
              disabled={isCompleting}
              onCheckedChange={handleComplete}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 flex-shrink-0 h-4 w-4 md:h-5 md:w-5"
            />
            
            {/* Contenuto principale */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 md:gap-2 mb-1">
                {statusIcon}
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
              <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                <PriorityBadge priority={task.priority} />
                
                {task.energy_required && (
                  <Badge variant="outline" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    {task.energy_required}
                  </Badge>
                )}
                
                {task.due_date && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(task.due_date).toLocaleDateString('it-IT')}
                  </Badge>
                )}
                
                {task.task_type && (
                  <Badge variant="outline" className="text-xs">
                    <Target className="w-3 h-3 mr-1" />
                    {task.task_type}
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