import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, CalendarDays, Clock, Plus, Trash2, Edit, CheckCircle2, Circle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  task_type: 'azione' | 'riflessione' | 'comunicazione' | 'creativita' | 'organizzazione';
  energy_required: 'bassa' | 'media' | 'alta';
  xp_reward: number;
  created_at: string;
  completed_at?: string;
  google_calendar_event_id?: string;
}

interface TaskManagerProps {
  userId: string;
  showCompleted?: boolean;
}

export const TaskManager = ({ userId, showCompleted = false }: TaskManagerProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    is_recurring: false,
    recurrence_pattern: '',
    task_type: 'azione' as 'azione' | 'riflessione' | 'comunicazione' | 'creativita' | 'organizzazione',
    energy_required: 'media' as 'bassa' | 'media' | 'alta',
    xp_reward: 10,
    sync_to_calendar: false
  });

  useEffect(() => {
    loadTasks();
  }, [userId, showCompleted]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', showCompleted ? 'completed' : 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile caricare i task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Errore",
        description: "Il titolo è obbligatorio",
        variant: "destructive"
      });
      return;
    }

    try {
      const taskData = {
        user_id: userId,
        title: formData.title,
        description: formData.description || null,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
        task_type: formData.task_type,
        energy_required: formData.energy_required,
        xp_reward: formData.xp_reward,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;

      // Se l'utente vuole sincronizzare con Google Calendar
      if (formData.sync_to_calendar && formData.due_date) {
        try {
          await syncToGoogleCalendar(data);
        } catch (calendarError: any) {
          toast({
            title: "Task creato",
            description: "Task creato ma non sincronizzato con Google Calendar",
            variant: "destructive"
          });
        }
      }

      setTasks(prev => [data, ...prev]);
      resetForm();
      setIsCreateDialogOpen(false);

      toast({
        title: "Task creato",
        description: `Task "${formData.title}" creato con successo`
      });

    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore nella creazione del task",
        variant: "destructive"
      });
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const completed_at = newStatus === 'completed' ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at 
        })
        .eq('id', task.id);

      if (error) throw error;

      // Aggiornare XP se completato
      if (newStatus === 'completed') {
        await supabase
          .from('xp_transactions')
          .insert({
            user_id: userId,
            amount: task.xp_reward,
            source: 'task_completion',
            source_id: task.id,
            description: `Completamento task: ${task.title}`
          });

        // Aggiornare il profilo con i nuovi XP
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('total_xp, current_level')
          .eq('user_id', userId)
          .single();
        
        if (currentProfile) {
          const newTotalXp = (currentProfile.total_xp || 0) + task.xp_reward;
          await supabase
            .from('profiles')
            .update({ total_xp: newTotalXp })
            .eq('user_id', userId);
        }
      }

      setTasks(prev => prev.map(t => 
        t.id === task.id 
          ? { ...t, status: newStatus, completed_at }
          : t
      ));

      toast({
        title: newStatus === 'completed' ? "Task completato!" : "Task riattivato",
        description: newStatus === 'completed' 
          ? `Hai guadagnato ${task.xp_reward} XP!` 
          : "Task riattivato"
      });

    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il task",
        variant: "destructive"
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({
        title: "Task eliminato",
        description: "Task eliminato con successo"
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il task",
        variant: "destructive"
      });
    }
  };

  const syncToGoogleCalendar = async (task: Task) => {
    // Placeholder per l'integrazione Google Calendar
    // Implementeremo questo dopo aver configurato l'Edge Function
    throw new Error("Integrazione Google Calendar non ancora configurata");
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      is_recurring: false,
      recurrence_pattern: '',
      task_type: 'azione' as 'azione' | 'riflessione' | 'comunicazione' | 'creativita' | 'organizzazione',
      energy_required: 'media' as 'bassa' | 'media' | 'alta',
      xp_reward: 10,
      sync_to_calendar: false
    });
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
      is_recurring: task.is_recurring,
      recurrence_pattern: task.recurrence_pattern || '',
      task_type: task.task_type,
      energy_required: task.energy_required,
      xp_reward: task.xp_reward,
      sync_to_calendar: !!task.google_calendar_event_id
    });
    setIsEditDialogOpen(true);
  };

  const updateTask = async () => {
    if (!editingTask || !formData.title.trim()) {
      toast({
        title: "Errore",
        description: "Il titolo è obbligatorio",
        variant: "destructive"
      });
      return;
    }

    try {
      const taskData = {
        title: formData.title,
        description: formData.description || null,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
        task_type: formData.task_type,
        energy_required: formData.energy_required,
        xp_reward: formData.xp_reward,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', editingTask.id);

      if (error) throw error;

      setTasks(prev => prev.map(t => 
        t.id === editingTask.id 
          ? { ...t, ...taskData }
          : t
      ));

      resetForm();
      setIsEditDialogOpen(false);
      setEditingTask(null);

      toast({
        title: "Task aggiornato",
        description: `Task "${formData.title}" aggiornato con successo`
      });

    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore nell'aggiornamento del task",
        variant: "destructive"
      });
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'azione': return 'bg-blue-500/10 text-blue-600';
      case 'riflessione': return 'bg-purple-500/10 text-purple-600';
      case 'comunicazione': return 'bg-green-500/10 text-green-600';
      case 'creativita': return 'bg-pink-500/10 text-pink-600';
      case 'organizzazione': return 'bg-amber-500/10 text-amber-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case 'bassa': return 'text-green-600';
      case 'media': return 'text-yellow-600';
      case 'alta': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {showCompleted ? 'Task Completati' : 'Task Attivi'}
          </h2>
          <p className="text-muted-foreground">
            {showCompleted ? 'Storico dei task completati' : 'Gestisci i tuoi compiti e rituali'}
          </p>
        </div>
        
        {!showCompleted && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nuovo Task
              </Button>
            </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crea Nuovo Task</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titolo *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Inserisci il titolo del task..."
                />
              </div>

              <div>
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrizione opzionale..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="task_type">Tipo</Label>
                  <Select 
                    value={formData.task_type} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, task_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="azione">🎯 Azione</SelectItem>
                      <SelectItem value="riflessione">🤔 Riflessione</SelectItem>
                      <SelectItem value="comunicazione">💬 Comunicazione</SelectItem>
                      <SelectItem value="creativita">🎨 Creatività</SelectItem>
                      <SelectItem value="organizzazione">📋 Organizzazione</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="energy_required">Energia</Label>
                  <Select 
                    value={formData.energy_required} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, energy_required: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bassa">🟢 Bassa</SelectItem>
                      <SelectItem value="media">🟡 Media</SelectItem>
                      <SelectItem value="alta">🔴 Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="due_date">Scadenza</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="xp_reward">XP Reward</Label>
                  <Input
                    id="xp_reward"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.xp_reward}
                    onChange={(e) => setFormData(prev => ({ ...prev, xp_reward: parseInt(e.target.value) || 10 }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: !!checked }))}
                  />
                  <Label htmlFor="is_recurring">Task ricorrente</Label>
                </div>

                {formData.is_recurring && (
                  <Select 
                    value={formData.recurrence_pattern} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, recurrence_pattern: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona frequenza..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">📅 Giornaliero</SelectItem>
                      <SelectItem value="weekly">📅 Settimanale</SelectItem>
                      <SelectItem value="monthly">📅 Mensile</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sync_to_calendar"
                    checked={formData.sync_to_calendar}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sync_to_calendar: !!checked }))}
                  />
                  <Label htmlFor="sync_to_calendar">Sincronizza con Google Calendar</Label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={createTask} className="flex-1">
                  Crea Task
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annulla
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}

        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifica Task</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Titolo *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Inserisci il titolo del task..."
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Descrizione</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrizione opzionale..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-task_type">Tipo</Label>
                  <Select 
                    value={formData.task_type} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, task_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="azione">🎯 Azione</SelectItem>
                      <SelectItem value="riflessione">🤔 Riflessione</SelectItem>
                      <SelectItem value="comunicazione">💬 Comunicazione</SelectItem>
                      <SelectItem value="creativita">🎨 Creatività</SelectItem>
                      <SelectItem value="organizzazione">📋 Organizzazione</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-energy_required">Energia</Label>
                  <Select 
                    value={formData.energy_required} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, energy_required: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bassa">🟢 Bassa</SelectItem>
                      <SelectItem value="media">🟡 Media</SelectItem>
                      <SelectItem value="alta">🔴 Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-due_date">Scadenza</Label>
                  <Input
                    id="edit-due_date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-xp_reward">XP Reward</Label>
                  <Input
                    id="edit-xp_reward"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.xp_reward}
                    onChange={(e) => setFormData(prev => ({ ...prev, xp_reward: parseInt(e.target.value) || 10 }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={updateTask} className="flex-1">
                  Aggiorna Task
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingTask(null);
                  resetForm();
                }}>
                  Annulla
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun task ancora</h3>
            <p className="text-muted-foreground mb-4">Crea il tuo primo task per iniziare</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
              Crea il primo task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className={`${task.status === 'completed' ? 'bg-muted/50' : ''}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <button 
                      onClick={() => toggleTaskComplete(task)}
                      className="mt-1 text-primary hover:text-primary/80 transition-colors"
                    >
                      {task.status === 'completed' ? 
                        <CheckCircle2 className="w-5 h-5" /> : 
                        <Circle className="w-5 h-5" />
                      }
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                        <Badge variant="secondary" className={getTaskTypeColor(task.task_type)}>
                          {task.task_type}
                        </Badge>
                        {task.is_recurring && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {task.recurrence_pattern}
                          </Badge>
                        )}
                        {task.google_calendar_event_id && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            Calendar
                          </Badge>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className={`text-sm text-muted-foreground mb-2 ${task.status === 'completed' ? 'line-through' : ''}`}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(task.due_date)}
                          </span>
                        )}
                        <span className={`flex items-center gap-1 ${getEnergyColor(task.energy_required)}`}>
                          ⚡ {task.energy_required}
                        </span>
                        <span className="flex items-center gap-1 text-primary">
                          ✨ {task.xp_reward} XP
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {!showCompleted && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => openEditDialog(task)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};