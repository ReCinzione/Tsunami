import React, { useState, useEffect } from 'react';
import { Task } from '../features/tasks/types';
import { generateSubtaskSuggestions, generateADHDFriendlySubtasks, SubtaskSuggestion } from '../utils/subtaskSuggestions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Lightbulb, Brain, Clock, Target } from 'lucide-react';

interface SubtaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentTask: Task;
  onCreateSubtask: (subtask: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function SubtaskCreationModal({ 
  isOpen, 
  onClose, 
  parentTask, 
  onCreateSubtask 
}: SubtaskCreationModalProps) {
  const [suggestions, setSuggestions] = useState<SubtaskSuggestion[]>([]);
  const [adhdSuggestions, setAdhdSuggestions] = useState<SubtaskSuggestion[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen && parentTask) {
      setSuggestions(generateSubtaskSuggestions(parentTask));
      setAdhdSuggestions(generateADHDFriendlySubtasks(parentTask));
      setSelectedSuggestions(new Set());
      setCustomTitle('');
      setCustomDescription('');
    }
  }, [isOpen, parentTask]);

  const handleSuggestionToggle = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleCreateSelected = () => {
    // Crea subtask dai suggerimenti selezionati
    selectedSuggestions.forEach(index => {
      const suggestion = suggestions[index];
      if (suggestion) {
        const subtask: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
          title: suggestion.title,
          description: suggestion.description || '',
          status: 'pending',
          priority: suggestion.priority,
          parent_task_id: parentTask.id,
          task_type: parentTask.task_type, // Eredita il tipo dalla task padre
          estimated_minutes: suggestion.estimatedMinutes,
          tags: parentTask.tags,
          is_recurring: false,
          energy_required: 'media',
          xp_reward: 10
        };
        onCreateSubtask(subtask);
      }
    });

    // Crea subtask personalizzata se presente
    if (customTitle.trim()) {
      const customSubtask: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
        title: customTitle.trim(),
        description: customDescription.trim(),
        status: 'pending',
        priority: 'media',
        parent_task_id: parentTask.id,
        task_type: parentTask.task_type, // Eredita il tipo dalla task padre
        tags: parentTask.tags,
        is_recurring: false,
        energy_required: 'media',
        xp_reward: 10
      };
      onCreateSubtask(customSubtask);
    }

    onClose();
  };

  const handleCreateADHDSubtasks = () => {
    adhdSuggestions.forEach(suggestion => {
      const subtask: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
        title: suggestion.title,
        description: suggestion.description || '',
        status: 'pending',
        priority: suggestion.priority,
        parent_task_id: parentTask.id,
        task_type: parentTask.task_type, // Eredita il tipo dalla task padre
        estimated_minutes: suggestion.estimatedMinutes,
        tags: [...(parentTask.tags || []), 'adhd-friendly'],
        is_recurring: false,
        energy_required: 'media',
        xp_reward: 10
      };
      onCreateSubtask(subtask);
    });
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'bassa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crea Subtask per: {parentTask?.title}
          </DialogTitle>
          <DialogDescription>
            Scegli dai suggerimenti intelligenti o crea subtask personalizzate
          </DialogDescription>
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
              Suggerimenti basati sul contenuto della task. Seleziona quelli che vuoi creare:
            </div>
            <div className="grid gap-3">
              {suggestions.map((suggestion, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-all ${
                    selectedSuggestions.has(index) 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
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
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority}
                        </Badge>
                        {suggestion.estimatedMinutes && (
                          <Badge variant="outline">
                            {suggestion.estimatedMinutes}m
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {selectedSuggestions.size > 0 && (
              <Button onClick={handleCreateSelected} className="w-full">
                Crea {selectedSuggestions.size} Subtask Selezionate
              </Button>
            )}
          </TabsContent>

          <TabsContent value="adhd" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Workflow ottimizzato per persone con ADHD - struttura chiara e step gestibili:
            </div>
            <div className="grid gap-3">
              {adhdSuggestions.map((suggestion, index) => (
                <Card key={index} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {suggestion.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={getPriorityColor(suggestion.priority)}>
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
            <Button onClick={handleCreateADHDSubtasks} className="w-full bg-purple-600 hover:bg-purple-700">
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
                />
              </div>
              <Button 
                onClick={handleCreateSelected} 
                disabled={!customTitle.trim()}
                className="w-full"
              >
                Crea Subtask Personalizzata
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
