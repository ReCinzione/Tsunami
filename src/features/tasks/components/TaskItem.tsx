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

  // Gestisce il completamento con feedback visivo
  const handleComplete = async () => {
    if (isCompleted) return;
    
    setIsCompleting(true);
    try {
      await onComplete?.(task.id);
    } finally {
      setTimeout(() => setIsCompleting(false), 300);
    }
  };

  // Stili dinamici basati sullo stato
  const getTaskStyles = () => {
    if (isCompleted) {
      return {
        card: "bg-green-50 border-green-200 opacity-75",
        title: "text-green-800 line-through",
        badge: "bg-green-100 text-green-800"
      };
    }
    
    if (isOverdue) {
      return {
        card: "bg-red-50 border-red-200 border-l-4 border-l-red-500",
        title: "text-red-900 font-medium",
        badge: "bg-red-100 text-red-800"
      };
    }
    
    if (isDueToday) {
      return {
        card: "bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-500",
        title: "text-yellow-900 font-medium",
        badge: "bg-yellow-100 text-yellow-800"
      };
    }
    
    return {
      card: "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm",
      title: "text-gray-900",
      badge: "bg-gray-100 text-gray-800"
    };
  };

  const styles = getTaskStyles();

  // Icona di stato
  const StatusIcon = isCompleted ? CheckCircle2 : Circle;

  // Badge per energia richiesta
  const getEnergyBadge = () => {
    const energyConfig = {
      'molto_bassa': { color: 'bg-gray-100 text-gray-600', icon: '●', text: 'Molto Bassa' },
      'bassa': { color: 'bg-green-100 text-green-600', icon: '●', text: 'Bassa' },
      'media': { color: 'bg-yellow-100 text-yellow-600', icon: '●', text: 'Media' },
      'alta': { color: 'bg-orange-100 text-orange-600', icon: '●', text: 'Alta' },
      'molto_alta': { color: 'bg-red-100 text-red-600', icon: '●', text: 'Molto Alta' }
    };
    
    const config = energyConfig[task.energy_required];
    
    return (
      <Badge className={cn("text-xs flex items-center gap-1", config.color)}>
        <span>{config.icon}</span>
        {focusMode ? config.icon : config.text}
      </Badge>
    );
  };

  // Formatta la data di scadenza
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
          <Calendar className="h-3 w-3" />
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
        "w-full rounded-lg shadow-sm p-2 mb-2 flex flex-col md:flex-row items-center group transition-all duration-200 hover:shadow-md cursor-pointer",
        styles.card,
        isCompleting && "scale-[0.98] opacity-50",
        focusMode && "shadow-md border-2"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onClick?.(task)}
    >
      <CardContent className={cn(
        "p-2 w-full",
        focusMode && "p-6"
      )}>
        <div className="flex items-start gap-3 w-full">
          {/* Checkbox di completamento */}
          <div className="flex-shrink-0 mt-0.5">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleComplete}
              className={cn(
                "h-5 w-5",
                isCompleted && "bg-green-500 border-green-500"
              )}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Contenuto principale */}
          <div className="flex-1 min-w-0 w-full">
            {/* Titolo e badge */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-center w-full">
                {/* Icona priorità/media */}
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  <span className="text-xs font-medium">{task.xp_reward || 10} XP</span>
                </div>
                
                <h3 className={cn(
                  "font-medium text-sm leading-tight flex-1 break-words",
                  styles.title,
                  focusMode && "text-base font-semibold"
                )}>
                  {task.title}
                </h3>
                
                {showDetails && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {getEnergyBadge()}
                  </div>
                )}
              </div>
            </div>

            {/* Descrizione (se presente e showDetails) */}
            {showDetails && task.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2 break-words">
                {task.description}
              </p>
            )}

            {/* Metadata row */}
            {showDetails && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs text-gray-500">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Data scadenza */}
                  {formatDueDate()}
                  
                  {/* XP */}
                  {task.xp_reward && (
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {task.xp_reward} XP
                    </div>
                  )}
                  
                  {/* Durata stimata */}
                  {task.estimated_duration && (
                    <div className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {task.estimated_duration}min
                    </div>
                  )}
                </div>

                {/* Azioni rapide */}
                {showActions && (
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {!isCompleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-base p-2 rounded-md bg-blue-50 w-fit h-fit hover:bg-blue-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(task);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-base p-2 rounded-md bg-red-50 w-fit h-fit hover:bg-red-100 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(task.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Progress bar per task parzialmente completate */}
            {task.progress && task.progress > 0 && task.progress < 100 && (
              <div className="mt-2">
                <Progress value={task.progress} className="h-1" />
                <span className="text-xs text-gray-500 mt-1">
                  {task.progress}% completato
                </span>
              </div>
            )}

            {/* Messaggio di completamento */}
            {isCompleted && (
              <div className="mt-2 text-xs text-green-600 font-medium">
                Completata! 🎉
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TaskItem.displayName = 'TaskItem';