import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { 
  Filter, 
  Brain, 
  Zap, 
  Clock, 
  Target, 
  Flame, 
  Sparkles,
  Coffee,
  Moon,
  Sun,
  Battery,
  Focus,
  X
} from 'lucide-react';

export interface SmartFilterOptions {
  energy?: 'alta' | 'media' | 'bassa';
  priority?: 'alta' | 'media' | 'bassa';
  timeAvailable?: '5min' | '15min' | '30min' | '1h' | '2h+';
  mentalState?: 'focused' | 'scattered' | 'tired' | 'energetic';
  taskType?: string;
}

interface SmartFiltersProps {
  onFiltersChange: (filters: SmartFilterOptions) => void;
  activeFilters: SmartFilterOptions;
}

export const SmartFilters: React.FC<SmartFiltersProps> = ({
  onFiltersChange,
  activeFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const energyOptions = [
    { value: 'bassa', label: 'Focus Basso', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50' },
    { value: 'media', label: 'Focus Medio', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'alta', label: 'Focus Alto', icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  const priorityOptions = [
    { value: 'bassa', label: 'Bassa', icon: Sparkles, color: 'text-green-600', bg: 'bg-green-50', emoji: '🌱' },
    { value: 'media', label: 'Media', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', emoji: '⚡' },
    { value: 'alta', label: 'Alta', icon: Flame, color: 'text-red-600', bg: 'bg-red-50', emoji: '🔥' }
  ];

  const timeOptions = [
    { value: '5min', label: '5 minuti', icon: Clock, description: 'Task veloce' },
    { value: '15min', label: '15 minuti', icon: Clock, description: 'Task breve' },
    { value: '30min', label: '30 minuti', icon: Clock, description: 'Task media' },
    { value: '1h', label: '1 ora', icon: Clock, description: 'Task lunga' },
    { value: '2h+', label: '2+ ore', icon: Clock, description: 'Progetto' }
  ];

  const mentalStateOptions = [
    { value: 'focused', label: 'Concentrato', icon: Focus, color: 'text-blue-600', bg: 'bg-blue-50', description: 'Perfetto per task complesse' },
    { value: 'energetic', label: 'Energico', icon: Sun, color: 'text-orange-600', bg: 'bg-orange-50', description: 'Ideale per task fisiche' },
    { value: 'scattered', label: 'Distratto', icon: Battery, color: 'text-yellow-600', bg: 'bg-yellow-50', description: 'Meglio task semplici' },
    { value: 'tired', label: 'Stanco', icon: Moon, color: 'text-gray-600', bg: 'bg-gray-50', description: 'Solo task facili' }
  ];

  const updateFilter = (key: keyof SmartFilterOptions, value: any) => {
    const newFilters = { ...activeFilters };
    if (newFilters[key] === value) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  const getQuickSuggestions = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 6 && hour < 10) {
      return {
        title: "🌅 Mattino Produttivo",
        description: "Energia alta, perfetto per task complesse",
        filters: { energy: 'alta' as const, priority: 'alta' as const, mentalState: 'focused' as const }
      };
    } else if (hour >= 10 && hour < 14) {
      return {
        title: "☀️ Picco Giornaliero", 
        description: "Momento ideale per task importanti",
        filters: { energy: 'alta' as const, priority: 'media' as const, timeAvailable: '1h' as const }
      };
    } else if (hour >= 14 && hour < 17) {
      return {
        title: "🍃 Pomeriggio Tranquillo",
        description: "Energia media, task di routine",
        filters: { energy: 'media' as const, timeAvailable: '30min' as const }
      };
    } else {
      return {
        title: "🌙 Sera Rilassante",
        description: "Task leggere e preparazione",
        filters: { energy: 'bassa' as const, priority: 'bassa' as const, timeAvailable: '15min' as const }
      };
    }
  };

  const quickSuggestion = getQuickSuggestions();

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "relative transition-all hover:scale-105",
              activeFilterCount > 0 && "bg-blue-50 border-blue-200 text-blue-700"
            )}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtri Smart
            {activeFilterCount > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-blue-600 text-white">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80 p-4" align="start">
          {/* Suggerimento rapido basato sull'ora */}
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{quickSuggestion.title}</h4>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => onFiltersChange(quickSuggestion.filters)}
              >
                Applica
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{quickSuggestion.description}</p>
          </div>

          <DropdownMenuSeparator />

          {/* Filtro Energia */}
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            🧠 Livello di Focus
          </DropdownMenuLabel>
          <div className="grid grid-cols-1 gap-1 mb-3">
            {energyOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className={cn(
                  "cursor-pointer transition-all",
                  activeFilters.energy === option.value && `${option.bg} ${option.color}`
                )}
                onClick={() => updateFilter('energy', option.value)}
              >
                <option.icon className="w-4 h-4 mr-2" />
                {option.label}
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator />

          {/* Filtro Priorità */}
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            🎯 Priorità
          </DropdownMenuLabel>
          <div className="grid grid-cols-1 gap-1 mb-3">
            {priorityOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className={cn(
                  "cursor-pointer transition-all",
                  activeFilters.priority === option.value && `${option.bg} ${option.color}`
                )}
                onClick={() => updateFilter('priority', option.value)}
              >
                <span className="mr-2">{option.emoji}</span>
                {option.label}
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator />

          {/* Filtro Tempo Disponibile */}
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            ⏰ Tempo Disponibile
          </DropdownMenuLabel>
          <div className="grid grid-cols-2 gap-1 mb-3">
            {timeOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className={cn(
                  "cursor-pointer transition-all text-xs",
                  activeFilters.timeAvailable === option.value && "bg-indigo-50 text-indigo-700"
                )}
                onClick={() => updateFilter('timeAvailable', option.value)}
              >
                <Clock className="w-3 h-3 mr-1" />
                {option.label}
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator />

          {/* Filtro Stato Mentale */}
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            💭 Come ti senti?
          </DropdownMenuLabel>
          <div className="grid grid-cols-1 gap-1 mb-3">
            {mentalStateOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className={cn(
                  "cursor-pointer transition-all flex-col items-start p-2",
                  activeFilters.mentalState === option.value && `${option.bg} ${option.color}`
                )}
                onClick={() => updateFilter('mentalState', option.value)}
              >
                <div className="flex items-center w-full">
                  <option.icon className="w-4 h-4 mr-2" />
                  {option.label}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
              </DropdownMenuItem>
            ))}
          </div>

          {activeFilterCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="w-full text-xs text-muted-foreground hover:text-red-600"
              >
                <X className="w-3 h-3 mr-1" />
                Rimuovi tutti i filtri
              </Button>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Badge filtri attivi */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {activeFilters.energy && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              <Brain className="w-3 h-3 mr-1" />
              Focus {activeFilters.energy}
            </Badge>
          )}
          {activeFilters.priority && (
            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
              <Flame className="w-3 h-3 mr-1" />
              {activeFilters.priority}
            </Badge>
          )}
          {activeFilters.timeAvailable && (
            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              <Clock className="w-3 h-3 mr-1" />
              {activeFilters.timeAvailable}
            </Badge>
          )}
          {activeFilters.mentalState && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              <Focus className="w-3 h-3 mr-1" />
              {mentalStateOptions.find(o => o.value === activeFilters.mentalState)?.label}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartFilters;