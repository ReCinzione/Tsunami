import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Check, 
  X, 
  Lightbulb, 
  Brain, 
  Target, 
  Clock,
  Zap
} from 'lucide-react';
import { Task } from '@/types/task';
import { generateSubtaskSuggestions, generateADHDFriendlySubtasks, SubtaskSuggestion } from '@/utils/subtaskSuggestions';

interface UnifiedSubtaskCreatorProps {
  // Modalità rapida (inline)
  mode?: 'quick' | 'advanced';
  parentTask: Task;
  onCreateSubtask: (title: string, description?: string) => Promise<void>;
  
  // Props per modalità avanzata
  isOpen?: boolean;
  onClose?: () => void;
  
  // Props per modalità rapida
  showQuickInput?: boolean;
  onToggleQuickInput?: () => void;
  placeholder?: string;
}

export function UnifiedSubtaskCreator({
  mode = 'quick',
  parentTask,
  onCreateSubtask,
  isOpen = false,
  onClose,
  showQuickInput = false,
  onToggleQuickInput,
  placeholder = "Nuova subtask..."
}: UnifiedSubtaskCreatorProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [suggestions, setSuggestions] = useState<SubtaskSuggestion[]>([]);
  const [adhdSuggestions, setAdhdSuggestions] = useState<SubtaskSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  // Carica suggerimenti quando si apre la modalità avanzata
  React.useEffect(() => {
    if (mode === 'advanced' && isOpen && parentTask) {
      setSuggestions(generateSubtaskSuggestions(parentTask));
      setAdhdSuggestions(generateADHDFriendlySubtasks(parentTask));
      setSelectedSuggestions(new Set());
      setCustomTitle('');
      setCustomDescription('');
    }
  }, [mode, isOpen, parentTask]);

  const handleQuickCreate = useCallback(async () => {
    if (!quickTitle.trim()) return;
    
    setIsLoading(true);
    try {
      await onCreateSubtask(quickTitle.trim());
      setQuickTitle('');
      onToggleQuickInput?.();
      
      toast({
        title: "✅ Subtask creata",
        description: `"${quickTitle}" aggiunta alla task`,
      });
    } catch (error) {
      toast({
        title: "❌ Errore",
        description: "Impossibile creare la subtask",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [quickTitle, onCreateSubtask, onToggleQuickInput, toast]);

  const handleAdvancedCreate = useCallback(async (title: string, description?: string) => {
    setIsLoading(true);
    try {
      await onCreateSubtask(title, description);
      
      toast({
        title: "✅ Subtask creata",
        description: `"${title}" aggiunta alla task`,
      });
    } catch (error) {
      toast({
        title: "❌ Errore",
        description: "Impossibile creare la subtask",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [onCreateSubtask, toast]);

  const handleSuggestionToggle = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleCreateSelected = async () => {
    // Crea subtask dai suggerimenti selezionati
    for (const index of selectedSuggestions) {
      const suggestion = suggestions[index];
      if (suggestion) {
        await handleAdvancedCreate(suggestion.title, suggestion.description);
      }
    }

    // Crea subtask personalizzata se presente
    if (customTitle.trim()) {
      await handleAdvancedCreate(customTitle.trim(), customDescription.trim());
    }

    onClose?.();
  };

  const handleCreateADHDSubtasks = async () => {
    for (const suggestion of adhdSuggestions) {
      await handleAdvancedCreate(suggestion.title, suggestion.description);
    }
    onClose?.();
  };

  // Modalità rapida (inline)
  if (mode === 'quick') {
    return (
      <>
        {showQuickInput ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
            <Input
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder={placeholder}
              className="flex-1 border-0 bg-transparent focus:ring-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickCreate();
                if (e.key === 'Escape') onToggleQuickInput?.();
              }}
              autoFocus
              disabled={isLoading}
            />
            <Button 
              onClick={handleQuickCreate} 
              size="sm" 
              disabled={!quickTitle.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
            <Button 
              onClick={onToggleQuickInput} 
              variant="ghost" 
              size="sm"
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={onToggleQuickInput}
            variant="ghost"
            className="w-full justify-start text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi subtask
          </Button>
        )}
      </>
    );
  }

  // Modalità avanzata (dialog)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crea Subtask per: {parentTask?.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="suggestions" className="w-full">
          <TabsList className="w-full gap-1 p-1">
            <TabsTrigger value="suggestions" className="flex items-center justify-center gap-1 text-[11px] sm:text-sm flex-1 min-w-0 px-2 sm:px-3">
              <Lightbulb className="h-4 w-4 hidden sm:inline" />
              <span className="truncate sm:inline hidden">Suggerimenti</span>
              <span className="sm:hidden truncate">Suggerimenti</span>
            </TabsTrigger>
            <TabsTrigger value="adhd" className="flex items-center justify-center gap-1 text-[11px] sm:text-sm flex-1 min-w-0 px-2 sm:px-3">
              <Brain className="h-4 w-4 hidden sm:inline" />
              <span className="truncate sm:inline hidden">ADHD-Friendly</span>
              <span className="sm:hidden truncate">ADHD</span>
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center justify-center gap-1 text-[11px] sm:text-sm flex-1 min-w-0 px-2 sm:px-3">
              <Target className="h-4 w-4 hidden sm:inline" />
              <span className="truncate sm:inline hidden">Personalizzata</span>
              <span className="sm:hidden truncate">Pers.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Suggerimenti basati sul contenuto della task:
            </div>
            <div className="grid gap-3">
              {suggestions.map((suggestion, index) => (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-all ${
                    selectedSuggestions.has(index) 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleSuggestionToggle(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        {suggestion.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {suggestion.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge variant={suggestion.priority === 'alta' ? 'destructive' : suggestion.priority === 'media' ? 'default' : 'secondary'}>
                          {suggestion.priority}
                        </Badge>
                        {suggestion.estimatedMinutes && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {suggestion.estimatedMinutes}m
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button 
              onClick={handleCreateSelected} 
              disabled={selectedSuggestions.size === 0 && !customTitle.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? <Clock className="w-4 h-4 animate-spin mr-2" /> : null}
              Crea Subtask Selezionate ({selectedSuggestions.size})
            </Button>
          </TabsContent>

          <TabsContent value="adhd" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Workflow ottimizzato per ADHD - suddivisione in micro-task:
            </div>
            <div className="grid gap-3">
              {adhdSuggestions.map((suggestion, index) => (
                <Card key={index} className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-purple-800 dark:text-purple-200">
                          {suggestion.title}
                        </h4>
                        {suggestion.description && (
                          <p className="text-sm text-purple-600 dark:text-purple-300 mt-1">
                            {suggestion.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="border-purple-300">
                        {suggestion.estimatedMinutes}m
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button 
              onClick={handleCreateADHDSubtasks} 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? <Clock className="w-4 h-4 animate-spin mr-2" /> : null}
              Crea Workflow ADHD-Friendly Completo
            </Button>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Crea una subtask personalizzata:
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Titolo Subtask</label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Inserisci il titolo della subtask..."
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrizione (opzionale)</label>
                <Textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Aggiungi dettagli sulla subtask..."
                  className="mt-1"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
              <Button 
                onClick={() => handleAdvancedCreate(customTitle.trim(), customDescription.trim())} 
                disabled={!customTitle.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? <Clock className="w-4 h-4 animate-spin mr-2" /> : null}
                Crea Subtask Personalizzata
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
