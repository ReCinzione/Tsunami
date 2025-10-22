import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  Zap, 
  Edit2, 
  Trash2, 
  Plus,
  Brain,
  Target,
  CheckCircle2
} from 'lucide-react';
import { Task } from '@/features/tasks/types';
import type { MicroTask } from '@/types/ai';

interface AIBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalTask: Task;
  suggestedMicroTasks: MicroTask[];
  onConfirm: (microTasks: MicroTask[]) => void;
  isLoading?: boolean;
}

interface EditableMicroTask extends MicroTask {
  isSelected: boolean;
  isEditing: boolean;
}

export const AIBreakdownModal: React.FC<AIBreakdownModalProps> = ({
  isOpen,
  onClose,
  originalTask,
  suggestedMicroTasks,
  onConfirm,
  isLoading = false
}) => {
  const [microTasks, setMicroTasks] = useState<EditableMicroTask[]>(() =>
    suggestedMicroTasks.map(task => ({
      ...task,
      isSelected: true,
      isEditing: false
    }))
  );

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Aggiorna le micro-task quando cambiano i suggerimenti
  React.useEffect(() => {
    setMicroTasks(suggestedMicroTasks.map(task => ({
      ...task,
      isSelected: true,
      isEditing: false
    })));
  }, [suggestedMicroTasks]);

  const handleToggleSelection = (index: number) => {
    setMicroTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, isSelected: !task.isSelected } : task
    ));
  };

  const handleEditTask = (index: number) => {
    setMicroTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, isEditing: !task.isEditing } : task
    ));
  };

  const handleUpdateTask = (index: number, updates: Partial<MicroTask>) => {
    setMicroTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, ...updates, isEditing: false } : task
    ));
  };

  const handleDeleteTask = (index: number) => {
    setMicroTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: EditableMicroTask = {
      title: newTaskTitle,
      duration: 15,
      energy: 'medio',
      priority: 'medium',
      isSelected: true,
      isEditing: false
    };
    
    setMicroTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setShowAddForm(false);
  };

  const handleConfirm = () => {
    const selectedTasks = microTasks
      .filter(task => task.isSelected)
      .map(({ isSelected, isEditing, ...task }) => task);
    
    onConfirm(selectedTasks);
  };

  const selectedCount = microTasks.filter(task => task.isSelected).length;
  const totalEstimatedTime = microTasks
    .filter(task => task.isSelected)
    .reduce((sum, task) => sum + task.duration, 0);

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case 'basso': return 'bg-green-100 text-green-700';
      case 'medio': return 'bg-yellow-100 text-yellow-700';
      case 'alto': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            🧠 Breakdown AI - Micro-task Suggerite
          </DialogTitle>
          <div className="text-sm text-gray-600">
            Task originale: <span className="font-medium">{originalTask.title}</span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statistiche */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                <strong>{selectedCount}</strong> micro-task selezionate
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                Tempo stimato: <strong>{totalEstimatedTime} min</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">
                XP totale: <strong>{selectedCount * 5} XP</strong>
              </span>
            </div>
          </div>

          {/* Lista micro-task */}
          <div className="space-y-3">
            {microTasks.map((task, index) => (
              <Card key={index} className={`transition-all ${
                task.isSelected ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.isSelected}
                      onCheckedChange={() => handleToggleSelection(index)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-2">
                      {task.isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={task.title}
                            onChange={(e) => handleUpdateTask(index, { title: e.target.value })}
                            placeholder="Titolo micro-task"
                          />
                          {task.description && (
                            <Textarea
                              value={task.description}
                              onChange={(e) => handleUpdateTask(index, { description: e.target.value })}
                              placeholder="Descrizione (opzionale)"
                              rows={2}
                            />
                          )}
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={task.duration}
                              onChange={(e) => handleUpdateTask(index, { duration: parseInt(e.target.value) || 15 })}
                              placeholder="Durata (min)"
                              className="w-24"
                            />
                            <select
                              value={task.energy}
                              onChange={(e) => handleUpdateTask(index, { energy: e.target.value as any })}
                              className="px-3 py-1 border rounded-md"
                            >
                              <option value="basso">Bassa</option>
                              <option value="medio">Media</option>
                              <option value="alto">Alta</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${getEnergyColor(task.energy)}`}>
                              {task.energy === 'basso' ? 'Bassa' : task.energy === 'medio' ? 'Media' : 'Alta'} energia
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.duration} min
                            </Badge>
                            {task.timeOfDay && (
                              <Badge variant="outline" className="text-xs">
                                {task.timeOfDay}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTask(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(index)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Form per aggiungere nuova micro-task */}
          {showAddForm ? (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Titolo della nuova micro-task"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddTask} size="sm">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Aggiungi
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddForm(false);
                        setNewTaskTitle('');
                      }}
                      size="sm"
                    >
                      Annulla
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="w-full border-dashed border-2 border-gray-300 hover:border-purple-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi micro-task personalizzata
            </Button>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedCount === 0 || isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              'Creazione in corso...'
            ) : (
              `Crea ${selectedCount} micro-task`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};