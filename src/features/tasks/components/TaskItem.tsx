import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Zap, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Focus,
  Timer,
  Target
} from 'lucide-react';
import { TaskItemProps } from '../types';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Componente per visualizzare una singola task con design ADHD-friendly
 */
export const TaskItem = React.memo<TaskItemProps>(({ 
  task, 
  onClick, 
  onComplete, 
  onEdit, 
  onDelete,
  showDetails = true,
  focusMode = false
}) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Calcola lo stato della task
  const isCompleted = task.status === 'completed';
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted;
  const isDueToday = task.due_date && isToday(new Date(task.due_date));
  const isDueTomorrow = task.due_date && isTomorrow(new Date(task.due_date));
  
  // Icona di stato
  const StatusIcon = isCompleted ? CheckCircle2 : Circle;
  const statusIconColor = isCompleted 
    ? 'text-green-600' 
    : isOverdue 
      ? 'text-red-500' 
      : isDueToday 
        ? 'text-yellow-500'
        : 'text-gray-400';

  // Stili dinamici per focus mode e stati
  const styles = {
    card: cn(
      "group hover:shadow-lg border-l-4",
      isCompleted && "bg-gray-50 opacity-75",
      isOverdue && "border-l-red-500 bg-red-50",
      isDueToday && "border-l-yellow-500 bg-yellow-50",
      isDueTomorrow && "border-l-blue-500 bg-blue-50",
      !isOverdue && !isDueToday && !isDueTomorrow && "border-l-gray-300",
      focusMode && "ring-2 ring-blue-500 ring-opacity-50"
    ),
    content: "space-y-3 p-4",
    header: "flex items-start justify-between gap-3",
    title: cn(
      "font-medium text-sm leading-tight",
      isCompleted && "line-through text-gray-500",
      focusMode && "text-lg font-semibold"
    ),
    description: cn(
      "text-xs text-gray-600 mt-1 line-clamp-2",
      isCompleted && "line-through",
      focusMode && "text-sm"
    ),
    footer: "flex items-center justify-between gap-2 text-xs",
    actions: "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
  };

  // Gestisce il completamento della task
  const handleComplete = async (e: React.MouseEvent) => {
    console.log('handleComplete chiamato per task:', task.id, 'isCompleted:', isCompleted);
    e.stopPropagation();
    if (isCompleting) {
      console.log('Task già in completamento, uscita');
      return;
    }
    
    setIsCompleting(true);
    try {
      console.log('Chiamando onComplete con:', task.id, !isCompleted);
      await onComplete?.(task.id, !isCompleted);
      console.log('onComplete completato con successo');
    } catch (error) {
      console.error('Errore in handleComplete:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  // Gestisce il click sulla task
  const handleClick = () => {
    if (!isCompleting) {
      onClick?.(task);
    }
  };

  // Badge per tipo di task
  const getTaskTypeBadge = () => {
    const typeConfig = {
      'work': { color: 'bg-blue-100 text-blue-800', icon: '💼', text: 'Lavoro' },
      'personal': { color: 'bg-green-100 text-green-800', icon: '🏠', text: 'Personale' },
      'health': { color: 'bg-red-100 text-red-800', icon: '❤️', text: 'Salute' },
      'learning': { color: 'bg-purple-100 text-purple-800', icon: '📚', text: 'Studio' },
      'creative': { color: 'bg-pink-100 text-pink-800', icon: '🎨', text: 'Creativo' },
      'social': { color: 'bg-yellow-100 text-yellow-800', icon: '👥', text: 'Sociale' }
    };
    
    const config = typeConfig[task.type as keyof typeof typeConfig] || typeConfig.personal;
    
    return (
      <Badge className={cn("text-xs flex items-center gap-1", config.color)}>
        <span>{config.icon}</span>
        {focusMode ? config.text : config.icon}
      </Badge>
    );
  };

  // Badge per energia richiesta
  const getEnergyBadge = () => {
    const energyConfig = {
      'low': { color: 'bg-green-100 text-green-800', icon: '🟢', text: 'Bassa' },
      'medium': { color: 'bg-yellow-100 text-yellow-800', icon: '🟡', text: 'Media' },
      'high': { color: 'bg-red-100 text-red-800', icon: '🔴', text: 'Alta' }
    };
    
    const config = energyConfig[task.energy_required as keyof typeof energyConfig] || energyConfig.medium;
    
    return (
      <Badge className={cn("text-xs flex items-center gap-1", config.color)}>
        <span>{config.icon}</span>
        {focusMode ? config.icon : config.text}
      </Badge>
    );
  };

  // Formattazione data di scadenza
  const formatDueDate = () => {
    if (!task.due_date) return null;
    
    const dueDate = new Date(task.due_date);
    
    if (isOverdue) {
      return (
        <div className="flex items-center gap-1 text-red-600 text-xs">
          <AlertTriangle className="h-3 w-3" />
          Scaduta {format(dueDate, 'dd/MM', { locale: it })}
        </div>
      );
    }
    
    if (isDueToday) {
      return (
        <div className="flex items-center gap-1 text-yellow-600 text-xs font-medium">
          <Clock className="h-3 w-3" />
          Oggi
        </div>
      );
    }
    
    if (isDueTomorrow) {
      return (
        <div className="flex items-center gap-1 text-blue-600 text-xs">
          <Clock className="h-3 w-3" />
          Domani
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1 text-gray-500 text-xs">
        <Calendar className="h-3 w-3" />
        {format(dueDate, 'dd/MM/yyyy', { locale: it })}
      </div>
    );
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer",
        styles.card,
        isCompleting && "scale-[0.98] opacity-50",
        focusMode && "shadow-md border-2"
      )}
      onClick={handleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className={styles.content}>
        {/* Header con checkbox e titolo */}
        <div className={styles.header}>
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-0 h-auto hover:bg-transparent",
                statusIconColor
              )}
              onClick={handleComplete}
              disabled={isCompleting}
            >
              <StatusIcon className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 min-w-0">
              <h3 className={styles.title}>
                {task.title}
              </h3>
              
              {showDetails && task.description && (
                <p className={styles.description}>
                  {task.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Azioni rapide - sempre visibili per task non completate */}
          {!task.status || task.status !== 'completed' ? (
            <div className={cn(
              "flex items-center gap-1 transition-opacity",
              showActions || focusMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  title="Modifica task"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  title="Elimina task"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : null}
        </div>

        {/* Badges e metadati */}
        {showDetails && (
          <div className="flex items-center gap-2 flex-wrap">
            {getTaskTypeBadge()}
            {getEnergyBadge()}
            
            {task.priority && (
              <Badge 
                variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                className="text-xs"
              >
                <Target className="h-3 w-3 mr-1" />
                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Bassa'}
              </Badge>
            )}
            
            {task.estimated_duration && (
              <Badge variant="outline" className="text-xs">
                <Timer className="h-3 w-3 mr-1" />
                {task.estimated_duration}min
              </Badge>
            )}
          </div>
        )}

        {/* Footer con data e progresso */}
        {showDetails && (
          <div className={styles.footer}>
            <div className="flex items-center gap-2">
              {formatDueDate()}
            </div>
            
            {task.progress !== undefined && task.progress > 0 && (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Progress value={task.progress} className="flex-1 h-1" />
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {task.progress}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Indicatore focus mode */}
        {focusMode && (
          <div className="absolute top-2 right-2">
            <Focus className="h-4 w-4 text-blue-500" />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TaskItem.displayName = 'TaskItem';