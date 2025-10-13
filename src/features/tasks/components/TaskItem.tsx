import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Zap, 
  Edit, 
  Trash2, 
  AlertTriangle
} from 'lucide-react';
import { TaskItemProps } from '../types';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { it } from 'date-fns/locale';

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

  const isCompleted = task.status === 'completed';
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted;
  const isDueToday = task.due_date && isToday(new Date(task.due_date));
  const isDueTomorrow = task.due_date && isTomorrow(new Date(task.due_date));

  const handleComplete = async () => {
    if (isCompleted) return;
    setIsCompleting(true);
    try {
      await onComplete(task.id);
      setTimeout(() => setIsCompleting(false), 1000);
    } catch (error) {
      setIsCompleting(false);
    }
  };

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
  const StatusIcon = isCompleted ? CheckCircle2 : Circle;
  const statusIconColor = isCompleted ? "text-green-600" : "text-gray-400";

  const getTaskTypeBadge = () => {
    const typeColors = {
      'azione': 'bg-blue-100 text-blue-800',
      'riflessione': 'bg-purple-100 text-purple-800',
      'comunicazione': 'bg-green-100 text-green-800',
      'creativita': 'bg-pink-100 text-pink-800',
      'organizzazione': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={cn("text-xs", typeColors[task.task_type])}>
        {task.task_type}
      </Badge>
    );
  };

  const getEnergyBadge = () => {
    const energyConfig = {
      'molto_bassa': { color: 'bg-gray-100 text-gray-600', icon: '💤', text: 'Molto Bassa' },
      'bassa': { color: 'bg-green-100 text-green-600', icon: '🌱', text: 'Bassa' },
      'media': { color: 'bg-yellow-100 text-yellow-600', icon: '⚡', text: 'Media' },
      'alta': { color: 'bg-orange-100 text-orange-600', icon: '🔥', text: 'Alta' },
      'molto_alta': { color: 'bg-red-100 text-red-600', icon: '🚀', text: 'Molto Alta' }
    };
    
    const config = energyConfig[task.energy_required];
    
    return (
      <Badge className={cn("text-xs flex items-center gap-1", config.color)}>
        <span>{config.icon}</span>
        {focusMode ? config.icon : config.text}
      </Badge>
    );
  };

  const renderDueDate = () => {
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
        "transition-all duration-200 cursor-pointer",
        styles.card,
        isCompleting && "scale-[0.98] opacity-50",
        focusMode && "shadow-md border-2"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onClick?.(task)}
    >
      <CardContent className={cn(
        "p-4",
        focusMode && "p-6"
      )}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleComplete();
              }}
              disabled={isCompleting}
              className={cn(
                "transition-all duration-200 hover:scale-110",
                isCompleting && "animate-pulse"
              )}
            >
              <StatusIcon 
                className={cn(
                  "h-5 w-5 transition-colors",
                  statusIconColor,
                  !isCompleted && "hover:text-green-600"
                )} 
              />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={cn(
                "font-medium leading-tight",
                styles.title,
                focusMode && "text-lg"
              )}>
                {task.title}
              </h3>
              
              {task.xp_reward > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 text-xs flex items-center gap-1 flex-shrink-0">
                  <Zap className="h-3 w-3" />
                  {task.xp_reward} XP
                </Badge>
              )}
            </div>

            {task.description && showDetails && !focusMode && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-2">
              {getTaskTypeBadge()}
              {getEnergyBadge()}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {renderDueDate()}
              </div>

              {showActions && !isCompleted && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Sei sicuro di voler eliminare "${task.title}"?`)) {
                        onDelete(task.id);
                      }
                    }}
                    className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {task.status === 'in_progress' && showDetails && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>In corso...</span>
                  <span>75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            )}
          </div>
        </div>

        {isCompleting && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle2 className="h-5 w-5 animate-bounce" />
              Completata! 🎉
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TaskItem.displayName = 'TaskItem';