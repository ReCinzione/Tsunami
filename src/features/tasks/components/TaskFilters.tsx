import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Clock, 
  Zap, 
  Target, 
  Tag, 
  X,
  Filter,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  initialFilters: Record<string, any>;
  className?: string;
}

interface FilterOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  options: { value: string; label: string; color?: string }[];
}

/**
 * Componente per i filtri delle task
 * Fornisce opzioni di filtraggio per priorità, stato, energia, scadenze, ecc.
 */
export const TaskFilters: React.FC<TaskFiltersProps> = ({
  onFiltersChange,
  initialFilters,
  className
}) => {
  const [activeFilters, setActiveFilters] = React.useState(initialFilters);

  // Definizione delle opzioni di filtro
  const filterOptions: FilterOption[] = [
    {
      id: 'priority',
      label: 'Priorità',
      icon: <Target className="w-4 h-4" />,
      options: [
        { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800 border-red-200' },
        { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        { value: 'low', label: 'Bassa', color: 'bg-green-100 text-green-800 border-green-200' }
      ]
    },
    {
      id: 'status',
      label: 'Stato',
      icon: <Clock className="w-4 h-4" />,
      options: [
        { value: 'pending', label: 'In attesa', color: 'bg-gray-100 text-gray-800 border-gray-200' },
        { value: 'in_progress', label: 'In corso', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        { value: 'completed', label: 'Completata', color: 'bg-green-100 text-green-800 border-green-200' },
        { value: 'paused', label: 'In pausa', color: 'bg-orange-100 text-orange-800 border-orange-200' }
      ]
    },
    {
      id: 'energy',
      label: 'Energia Richiesta',
      icon: <Zap className="w-4 h-4" />,
      options: [
        { value: 'low', label: 'Bassa', color: 'bg-green-100 text-green-800 border-green-200' },
        { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800 border-red-200' }
      ]
    },
    {
      id: 'due',
      label: 'Scadenza',
      icon: <Calendar className="w-4 h-4" />,
      options: [
        { value: 'overdue', label: 'In ritardo', color: 'bg-red-100 text-red-800 border-red-200' },
        { value: 'today', label: 'Oggi', color: 'bg-orange-100 text-orange-800 border-orange-200' },
        { value: 'tomorrow', label: 'Domani', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        { value: 'this_week', label: 'Questa settimana', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        { value: 'no_due', label: 'Senza scadenza', color: 'bg-gray-100 text-gray-800 border-gray-200' }
      ]
    },
    {
      id: 'tags',
      label: 'Tag',
      icon: <Tag className="w-4 h-4" />,
      options: [
        { value: 'work', label: 'Lavoro', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        { value: 'personal', label: 'Personale', color: 'bg-purple-100 text-purple-800 border-purple-200' },
        { value: 'health', label: 'Salute', color: 'bg-green-100 text-green-800 border-green-200' },
        { value: 'learning', label: 'Apprendimento', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        { value: 'creative', label: 'Creativo', color: 'bg-pink-100 text-pink-800 border-pink-200' },
        { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-800 border-red-200' }
      ]
    }
  ];

  // Gestisce il toggle di un filtro
  const handleFilterToggle = (filterId: string, value: string) => {
    const currentValues = activeFilters[filterId] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];
    
    const newFilters = {
      ...activeFilters,
      [filterId]: newValues.length > 0 ? newValues : undefined
    };
    
    // Rimuove le chiavi con valori undefined
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key] === undefined) {
        delete newFilters[key];
      }
    });
    
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Rimuove tutti i filtri
  const clearAllFilters = () => {
    setActiveFilters({});
    onFiltersChange({});
  };

  // Conta i filtri attivi
  const activeFilterCount = Object.values(activeFilters).reduce(
    (count, values) => count + (Array.isArray(values) ? values.length : 0),
    0
  );

  return (
    <Card className={cn("bg-slate-50 border-slate-200", className)}>
      <CardContent className="p-4">
        {/* Header con contatore filtri attivi */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">
              Filtri
            </span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} attivi
              </Badge>
            )}
          </div>
          
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-slate-500 hover:text-slate-700"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Pulisci tutto
            </Button>
          )}
        </div>

        {/* Gruppi di filtri */}
        <div className="space-y-4">
          {filterOptions.map((filterGroup) => {
            const activeValues = activeFilters[filterGroup.id] || [];
            
            return (
              <div key={filterGroup.id} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  {filterGroup.icon}
                  {filterGroup.label}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {filterGroup.options.map((option) => {
                    const isActive = activeValues.includes(option.value);
                    
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleFilterToggle(filterGroup.id, option.value)}
                        className={cn(
                          "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all",
                          isActive
                            ? option.color || "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {option.label}
                        {isActive && (
                          <X className="w-3 h-3 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggerimenti ADHD-friendly */}
        {activeFilterCount === 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-1">
              💡 Suggerimento per il focus:
            </p>
            <p className="text-xs text-blue-600">
              Usa i filtri per concentrarti su un tipo di task alla volta. 
              Inizia con le task a bassa energia quando ti senti stanco!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

TaskFilters.displayName = 'TaskFilters';