import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronRight, ChevronDown, Check, X, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Task } from '@/features/tasks/types';
import { taskService } from '@/features/tasks/services/taskService';
import { useToast } from '@/hooks/use-toast';

interface SubtaskManagerProps {
  parentTask: Task;
  onSubtaskUpdate?: () => void;
  compact?: boolean;
  showProgress?: boolean;
  allowEdit?: boolean;
}

interface SubtaskWithChildren extends Task {
  children?: SubtaskWithChildren[];
  level: number;
}

export function SubtaskManager({
  parentTask,
  onSubtaskUpdate,
  compact = false,
  showProgress = true,
  allowEdit = true
}: SubtaskManagerProps) {
  const [subtasks, setSubtasks] = useState<SubtaskWithChildren[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [newSubtaskParent, setNewSubtaskParent] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  const { toast } = useToast();

  // Load subtasks with hierarchy
  const loadSubtasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskService.getSubtasks(parentTask.id);
      const hierarchicalData = buildHierarchy(data);
      setSubtasks(hierarchicalData);
    } catch (error) {
      console.error('Error loading subtasks:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le subtask",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [parentTask.id, toast]);

  useEffect(() => {
    loadSubtasks();
  }, [loadSubtasks]);

  // Build hierarchical structure
  const buildHierarchy = (tasks: Task[]): SubtaskWithChildren[] => {
    const taskMap = new Map<string, SubtaskWithChildren>();
    const rootTasks: SubtaskWithChildren[] = [];

    // First pass: create all tasks with level 0
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [], level: 0 });
    });

    // Second pass: build hierarchy
    tasks.forEach(task => {
      const taskWithChildren = taskMap.get(task.id)!;
      
      if (task.parent_task_id && task.parent_task_id !== parentTask.id) {
        // This is a subtask of another subtask
        const parent = taskMap.get(task.parent_task_id);
        if (parent) {
          taskWithChildren.level = parent.level + 1;
          parent.children!.push(taskWithChildren);
        }
      } else {
        // This is a direct child of the main task
        taskWithChildren.level = 1;
        rootTasks.push(taskWithChildren);
      }
    });

    return rootTasks;
  };

  // Calculate progress recursively
  const calculateProgress = (tasks: SubtaskWithChildren[]): { completed: number; total: number } => {
    let completed = 0;
    let total = 0;

    tasks.forEach(task => {
      total += 1;
      if (task.status === 'completed') {
        completed += 1;
      }
      
      if (task.children && task.children.length > 0) {
        const childProgress = calculateProgress(task.children);
        completed += childProgress.completed;
        total += childProgress.total;
      }
    });

    return { completed, total };
  };

  const progress = calculateProgress(subtasks);
  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  // Toggle expand/collapse
  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedItems(newExpanded);
  };

  // Create new subtask
  const handleCreateSubtask = async (parentId: string) => {
    if (!newSubtaskTitle.trim()) return;

    try {
      const taskData = {
        title: newSubtaskTitle.trim(),
        description: '',
        task_type: parentTask.task_type,
        energy_required: 'bassa' as const,
        due_date: parentTask.due_date,
        is_recurring: false,
        tags: parentTask.tags || [],
        can_be_interrupted: true
      };

      await taskService.createTask(parentTask.user_id, taskData, parentId);
      
      setNewSubtaskTitle('');
      setNewSubtaskParent(null);
      await loadSubtasks();
      onSubtaskUpdate?.();
      
      toast({
        title: "✅ Subtask creata",
        description: `"${taskData.title}" aggiunta con successo`,
      });
    } catch (error) {
      console.error('Error creating subtask:', error);
      toast({
        title: "❌ Errore",
        description: "Impossibile creare la subtask",
        variant: "destructive"
      });
    }
  };

  // Toggle subtask completion
  const handleToggleComplete = async (subtask: SubtaskWithChildren) => {
    try {
      const newStatus = subtask.status === 'completed' ? 'pending' : 'completed';
      await taskService.updateTask(subtask.id, { status: newStatus });
      
      await loadSubtasks();
      onSubtaskUpdate?.();
      
      toast({
        title: newStatus === 'completed' ? "🎯 Subtask completata!" : "↩️ Subtask riaperta",
        description: `"${subtask.title}" ${newStatus === 'completed' ? 'completata' : 'riaperta'}`,
      });
    } catch (error) {
      console.error('Error toggling subtask:', error);
      toast({
        title: "❌ Errore",
        description: "Impossibile aggiornare la subtask",
        variant: "destructive"
      });
    }
  };

  // Edit subtask title
  const handleEditSubtask = async (subtaskId: string) => {
    if (!editTitle.trim()) return;

    try {
      await taskService.updateTask(subtaskId, { title: editTitle.trim() });
      
      setEditingItem(null);
      setEditTitle('');
      await loadSubtasks();
      onSubtaskUpdate?.();
      
      toast({
        title: "✏️ Subtask modificata",
        description: "Titolo aggiornato con successo",
      });
    } catch (error) {
      console.error('Error editing subtask:', error);
      toast({
        title: "❌ Errore",
        description: "Impossibile modificare la subtask",
        variant: "destructive"
      });
    }
  };

  // Delete subtask
  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await taskService.deleteTask(subtaskId);
      
      await loadSubtasks();
      onSubtaskUpdate?.();
      
      toast({
        title: "🗑️ Subtask eliminata",
        description: "Subtask rimossa con successo",
      });
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast({
        title: "❌ Errore",
        description: "Impossibile eliminare la subtask",
        variant: "destructive"
      });
    }
  };

  // Render subtask item
  const renderSubtask = (subtask: SubtaskWithChildren) => {
    const hasChildren = subtask.children && subtask.children.length > 0;
    const isExpanded = expandedItems.has(subtask.id);
    const isEditing = editingItem === subtask.id;
    const isAddingChild = newSubtaskParent === subtask.id;

    return (
      <div key={subtask.id} className="space-y-2">
        <div 
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg transition-colors",
            "hover:bg-slate-50 dark:hover:bg-slate-800",
            subtask.level > 1 && "ml-6 border-l-2 border-slate-200 dark:border-slate-700 pl-4"
          )}
        >
          {/* Expand/Collapse button */}
          {hasChildren && (
            <Button
              onClick={() => toggleExpanded(subtask.id)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}
          
          {!hasChildren && <div className="w-6" />}

          {/* Checkbox */}
          <Checkbox
            checked={subtask.status === 'completed'}
            onCheckedChange={() => handleToggleComplete(subtask)}
            className="h-5 w-5"
          />

          {/* Title */}
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSubtask(subtask.id);
                    if (e.key === 'Escape') {
                      setEditingItem(null);
                      setEditTitle('');
                    }
                  }}
                  autoFocus
                />
                <Button onClick={() => handleEditSubtask(subtask.id)} size="sm">
                  <Check className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => {
                    setEditingItem(null);
                    setEditTitle('');
                  }} 
                  variant="ghost" 
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm",
                  subtask.status === 'completed' && "line-through text-slate-500"
                )}>
                  {subtask.title}
                </span>
                
                {hasChildren && (
                  <Badge variant="secondary" className="text-xs">
                    {subtask.children!.filter(c => c.status === 'completed').length}/{subtask.children!.length}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {allowEdit && !isEditing && (
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setNewSubtaskParent(subtask.id)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Aggiungi subtask"
              >
                <Plus className="w-3 h-3" />
              </Button>
              
              <Button
                onClick={() => {
                  setEditingItem(subtask.id);
                  setEditTitle(subtask.title);
                }}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Modifica"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              
              <Button
                onClick={() => handleDeleteSubtask(subtask.id)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                title="Elimina"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Add child subtask */}
        {isAddingChild && (
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20",
            subtask.level > 0 && "ml-6"
          )}>
            <div className="w-6" />
            <Input
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Nuova subtask..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSubtask(subtask.id);
                if (e.key === 'Escape') setNewSubtaskParent(null);
              }}
              autoFocus
            />
            <Button onClick={() => handleCreateSubtask(subtask.id)} size="sm">
              <Check className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => setNewSubtaskParent(null)} 
              variant="ghost" 
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {subtask.children!.map(child => renderSubtask(child))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Caricamento subtask...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Progress header */}
        {showProgress && progress.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Progresso subtask
              </span>
              <span className="font-medium">
                {progress.completed}/{progress.total} ({Math.round(progressPercentage)}%)
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Subtasks list */}
        <div className="space-y-1">
          {subtasks.map(subtask => renderSubtask(subtask))}
        </div>

        {/* Add root subtask */}
        {newSubtaskParent === parentTask.id ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Input
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Nuova subtask..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSubtask(parentTask.id);
                if (e.key === 'Escape') setNewSubtaskParent(null);
              }}
              autoFocus
            />
            <Button onClick={() => handleCreateSubtask(parentTask.id)} size="sm">
              <Check className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => setNewSubtaskParent(null)} 
              variant="ghost" 
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setNewSubtaskParent(parentTask.id)}
            variant="ghost"
            className="w-full justify-start text-slate-600 dark:text-slate-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi subtask
          </Button>
        )}
      </CardContent>
    </Card>
  );
}