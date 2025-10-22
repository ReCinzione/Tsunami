import React, { useState, useEffect } from 'react';
import { SmartSuggestion, SuggestionAction } from '../types/patterns';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Lightbulb, 
  Clock, 
  Zap, 
  ArrowRight, 
  X, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Battery
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SmartSuggestionsPanelProps {
  suggestions: SmartSuggestion[];
  onApplySuggestion: (suggestionId: string, action: SuggestionAction) => void;
  onDismissSuggestion: (suggestionId: string) => void;
  className?: string;
  maxVisible?: number;
}

const getSuggestionIcon = (type: string) => {
  switch (type) {
    case 'task_optimization':
      return TrendingUp;
    case 'energy_optimization':
      return Battery;
    case 'task_reordering':
      return ArrowRight;
    case 'break_reminder':
      return Clock;
    case 'task_postponement':
      return Calendar;
    case 'automation_triggered':
      return Zap;
    default:
      return Lightbulb;
  }
};

const getSuggestionColor = (confidence: number) => {
  if (confidence >= 0.8) return 'bg-green-50 border-green-200 text-green-800';
  if (confidence >= 0.6) return 'bg-blue-50 border-blue-200 text-blue-800';
  return 'bg-yellow-50 border-yellow-200 text-yellow-800';
};

const getConfidenceLabel = (confidence: number) => {
  if (confidence >= 0.8) return 'High confidence';
  if (confidence >= 0.6) return 'Medium confidence';
  return 'Low confidence';
};

const SmartSuggestionCard: React.FC<{
  suggestion: SmartSuggestion;
  onApply: (action: SuggestionAction) => void;
  onDismiss: () => void;
}> = ({ suggestion, onApply, onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  
  const Icon = getSuggestionIcon(suggestion.type);
  const colorClass = getSuggestionColor(suggestion.confidence);
  
  const handleApplyAction = async (action: SuggestionAction) => {
    setIsApplying(action.type);
    try {
      await onApply(action);
    } finally {
      setIsApplying(null);
    }
  };

  const timeUntilExpiry = suggestion.expiresAt.getTime() - Date.now();
  const hoursUntilExpiry = Math.max(0, Math.floor(timeUntilExpiry / (1000 * 60 * 60)));
  const minutesUntilExpiry = Math.max(0, Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', colorClass)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-white/50">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">
                {suggestion.title}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {suggestion.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {Math.round(suggestion.confidence * 100)}%
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 hover:bg-white/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Confidence and expiry info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
          <span className="flex items-center space-x-1">
            <AlertCircle className="h-3 w-3" />
            <span>{getConfidenceLabel(suggestion.confidence)}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>
              {hoursUntilExpiry > 0 
                ? `${hoursUntilExpiry}h ${minutesUntilExpiry}m left`
                : `${minutesUntilExpiry}m left`
              }
            </span>
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Actions */}
        <div className="space-y-2">
          {suggestion.actions.slice(0, isExpanded ? undefined : 2).map((action, index) => (
            <Button
              key={index}
              variant={index === 0 ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
              onClick={() => handleApplyAction(action)}
              disabled={isApplying !== null}
            >
              {isApplying === action.type ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                  <span>Applying...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>{action.label}</span>
                </div>
              )}
            </Button>
          ))}
          
          {suggestion.actions.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded 
                ? `Show less` 
                : `Show ${suggestion.actions.length - 2} more actions`
              }
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SmartSuggestionsPanel: React.FC<SmartSuggestionsPanelProps> = ({
  suggestions,
  onApplySuggestion,
  onDismissSuggestion,
  className,
  maxVisible = 5
}) => {
  const [visibleSuggestions, setVisibleSuggestions] = useState<SmartSuggestion[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Debug log
  console.log('🎨 SmartSuggestionsPanel rendered with:', {
    suggestionsCount: suggestions.length,
    suggestions,
    visibleSuggestionsCount: visibleSuggestions.length
  });

  useEffect(() => {
    console.log('🔄 SmartSuggestionsPanel useEffect triggered');
    // Filter active and non-expired suggestions
    const now = new Date();
    const activeSuggestions = suggestions
      .filter(s => s.isActive && s.expiresAt > now)
      .sort((a, b) => b.confidence - a.confidence);
    
    console.log('✅ Active suggestions after filtering:', activeSuggestions.length, activeSuggestions);
    
    setVisibleSuggestions(
      showAll ? activeSuggestions : activeSuggestions.slice(0, maxVisible)
    );
  }, [suggestions, showAll, maxVisible]);

  const handleApplySuggestion = (suggestionId: string) => (action: SuggestionAction) => {
    onApplySuggestion(suggestionId, action);
  };

  const handleDismissSuggestion = (suggestionId: string) => () => {
    onDismissSuggestion(suggestionId);
  };

  if (visibleSuggestions.length === 0) {
    return (
      <div className={cn('p-6 text-center', className)}>
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 rounded-full bg-muted">
            <Lightbulb className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-muted-foreground">No suggestions right now</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Keep working, and I'll learn your patterns to provide smart suggestions!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalActiveSuggestions = suggestions.filter(s => s.isActive && s.expiresAt > new Date()).length;
  const hiddenCount = totalActiveSuggestions - visibleSuggestions.length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Smart Suggestions</h2>
          {totalActiveSuggestions > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalActiveSuggestions}
            </Badge>
          )}
        </div>
        
        {hiddenCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show less' : `Show ${hiddenCount} more`}
          </Button>
        )}
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {visibleSuggestions.map((suggestion) => (
          <SmartSuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onApply={handleApplySuggestion(suggestion.id)}
            onDismiss={handleDismissSuggestion(suggestion.id)}
          />
        ))}
      </div>

      {/* Summary Stats */}
      {totalActiveSuggestions > 0 && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {totalActiveSuggestions} active suggestion{totalActiveSuggestions !== 1 ? 's' : ''}
            </span>
            <span>
              Avg confidence: {Math.round(
                visibleSuggestions.reduce((sum, s) => sum + s.confidence, 0) / 
                visibleSuggestions.length * 100
              )}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export { SmartSuggestionsPanel };