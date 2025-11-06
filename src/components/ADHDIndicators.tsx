import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Timer } from 'lucide-react';
import type { Task } from '@/features/tasks/types';

interface ADHDIndicatorsProps {
  task: Task;
  subtasks?: Task[];
  showProgress?: boolean;
  compact?: boolean;
}

export const ADHDIndicators: React.FC<ADHDIndicatorsProps> = ({
  task,
  subtasks = [],
  showProgress = true,
  compact = false
}) => {
  const completedSubtasks = subtasks.filter(st => st.status === 'completed').length;
  const totalSubtasks = subtasks.length;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  const getEnergyConfig = (energy: Task['energy_required']) => {
    switch (energy) {
      case 'molto_alta':
        return {
          symbol: '🌋',
          color: 'text-red-700',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Energia Molto Alta'
        };
      case 'alta':
        return {
          symbol: '🔥',
          color: 'text-orange-700',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          label: 'Energia Alta'
        };
      case 'media':
        return {
          symbol: '💡',
          color: 'text-yellow-700',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          label: 'Energia Media'
        };
      case 'bassa':
        return {
          symbol: '🌊',
          color: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'Energia Bassa'
        };
      case 'molto_bassa':
        return {
          symbol: '🍃',
          color: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Energia Molto Bassa'
        };
      default:
        return {
          symbol: '❓',
          color: 'text-gray-700',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: 'Energia Non Specificata'
        };
    }
  };

  const energyConfig = getEnergyConfig(task.energy_required);

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", compact && "gap-1")}>
      {/* Badge Energia Richiesta */}
      <Badge 
        variant="outline" 
        className={cn(
          "text-xs font-medium transition-all hover:scale-105",
          energyConfig.bg,
          energyConfig.color,
          energyConfig.border
        )}
      >
        <span aria-label={energyConfig.label} title={energyConfig.label} className="leading-none text-[13px]">{energyConfig.symbol}</span>
      </Badge>

      {/* Badge Durata Stimata */}
      {task.estimated_duration && (
        <Badge 
          variant="outline" 
          className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 transition-all hover:scale-105"
        >
          <Timer className="w-3 h-3" aria-label="Durata stimata" title={`${task.estimated_duration} min`} />
        </Badge>
      )}

      {/* Rimosso: XP Reward (icona e riferimenti) */}

      {/* Progress Bar per Subtask */}
      {showProgress && totalSubtasks > 0 && (
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Progress 
            value={progressPercentage} 
            className={cn(
              "h-2 flex-1 transition-all",
              compact ? "min-w-[60px]" : "min-w-[80px]"
            )}
          />
        </div>
      )}
    </div>
  );
};

export default ADHDIndicators;
