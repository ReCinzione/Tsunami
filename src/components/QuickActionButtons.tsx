import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  ListTodo, 
  Focus, 
  TrendingUp, 
  Clock, 
  Coffee, 
  Target, 
  Shuffle, 
  Award,
  Lightbulb,
  MoreHorizontal
} from 'lucide-react';
import type { QuickAction } from '@/types/chatbot';

interface QuickActionButtonsProps {
  actions: QuickAction[];
  onActionClick: (action: QuickAction) => void;
  onShowTextInput?: () => void;
  className?: string;
}

const getActionIcon = (action: string, category?: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'manage_energy': <Zap className="w-4 h-4" />,
    'organize_tasks': <ListTodo className="w-4 h-4" />,
    'improve_focus': <Focus className="w-4 h-4" />,
    'view_progress': <TrendingUp className="w-4 h-4" />,
    'quick_action': <Clock className="w-4 h-4" />,
    'take_break': <Coffee className="w-4 h-4" />,
    'prioritize_tasks': <Target className="w-4 h-4" />,
    'change_environment': <Shuffle className="w-4 h-4" />,
    'show_achievements': <Award className="w-4 h-4" />,
    'suggest_strategy': <Lightbulb className="w-4 h-4" />,
  };

  return iconMap[action] || <MoreHorizontal className="w-4 h-4" />;
};

const getCategoryColor = (category?: string) => {
  const colorMap: Record<string, string> = {
    'energy': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    'tasks': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    'focus': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    'progress': 'bg-green-100 text-green-800 hover:bg-green-200',
    'quick': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  };

  return colorMap[category || 'quick'] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
};

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  actions,
  onActionClick,
  onShowTextInput,
  className = ''
}) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Titolo */}
      <div className="text-sm font-medium text-muted-foreground">
        🤖 Come posso aiutarti?
      </div>
      
      {/* Griglia di azioni rapide */}
      <div className="grid grid-cols-1 gap-1.5">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            className={`justify-start h-auto p-2 text-left ${getCategoryColor(action.category)}`}
            onClick={() => onActionClick(action)}
          >
            <div className="flex items-center gap-2 w-full">
              <div className="flex-shrink-0">
                {getActionIcon(action.action, action.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{action.label}</div>
                {action.description && (
                  <div className="text-xs opacity-70 mt-0.5 line-clamp-1">
                    {action.description}
                  </div>
                )}
              </div>
              {action.category && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {action.category}
                </Badge>
              )}
            </div>
          </Button>
        ))}
      </div>
      
      {/* Opzione per input libero */}
      {onShowTextInput && (
        <div className="pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-muted-foreground hover:text-foreground"
            onClick={onShowTextInput}
          >
            <MoreHorizontal className="w-4 h-4 mr-2" />
            Scrivi altro...
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuickActionButtons;