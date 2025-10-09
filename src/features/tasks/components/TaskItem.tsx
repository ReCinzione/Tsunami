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
import { it as itLocale } from 'date-fns/locale';

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
      await onComplete?.(task.id);
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleComplete();
            }}
            className={cn(
              "mt-1 transition-colors",
              isCompleted ? "text-green-600" : "text-gray-400 hover:text-blue-600"
            )}
          >
            <StatusIcon
              className={cn(
                "h-5 w-5",
                statusIconColor
              )}
            />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className={cn(
                "font-medium text-sm leading-tight",
                styles.title,
                focusMode && "text-lg font-semibold"
              )}>
                {task.title}
              </h3>
              
              {task.xp_reward > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  {task.xp_reward} XP
                </Badge>
              )}
            </div>

            {task.description && showDetails && !focusMode && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className={cn("text-xs", styles.badge)}>
                {task.task_type}
              </Badge>
              
              <Badge className="text-xs bg-blue-100 text-blue-600">
                Energia: {task.energy_required}
              </Badge>
            </div>

            {task.due_date && (
              <div className="text-xs text-gray-500">
                Scadenza: {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: itLocale })}
              </div>
            )}

            {showActions && !isCompleted && (
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(task);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Sei sicuro di voler eliminare "${task.title}"?`)) {
                      onDelete?.(task.id);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}

            {task.status === 'in_progress' && showDetails && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>In corso...</span>
                  <span>50%</span>
                </div>
                <Progress value={50} className="h-1" />
              </div>
            )}

            {isCompleting && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded">
                <div className="text-green-600 font-medium text-sm">
                  Completata! 🎉
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TaskItem.displayName = 'TaskItem';