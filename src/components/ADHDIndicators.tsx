import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  Target, 
  Brain, 
  Timer, 
  CheckCircle2,
  AlertCircle,
  
} from 'lucide-react';

interface Task {
  id: string;
  priority: 'alta' | 'media' | 'bassa';
  energy_required: 'alta' | 'media' | 'bassa';
  estimated_duration?: number;
  status: string;
  task_type: string;
  xp_reward?: number;
}

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
  const completedSubtasks = subtasks.filter(st => st.status === 'completata').length;
  const totalSubtasks = subtasks.length;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const getEnergyConfig = (energy: string) => {
    switch (energy) {
      case 'alta':
        return {
          icon: Brain,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          label: 'Focus Alto'
        };
      case 'media':
        return {
          icon: Target,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'Focus Medio'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: 'Focus Basso'
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
        <energyConfig.icon className="w-3 h-3" aria-label={energyConfig.label} title={energyConfig.label} />
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
