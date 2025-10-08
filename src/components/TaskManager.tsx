import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePatternMining } from '@/hooks/usePatternMining';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Calendar, CalendarDays, Clock, Plus, Trash2, Edit, CheckCircle2, Circle, Focus, X } from 'lucide-react';
import { googleCalendarService } from '@/services/googleCalendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SmartSuggestionsPanel } from '@/components/SmartSuggestionsPanel';
import LevelUpNotification from '@/components/LevelUpNotification';

interface TaskIntervention {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  task_type: 'azione' | 'riflessione' | 'comunicazione' | 'creativita' | 'organizzazione';
  energy_required: 'molto_bassa' | 'bassa' | 'media' | 'alta' | 'molto_alta';
  xp_reward: number;
  created_at: string;
  completed_at?: string;
  google_calendar_event_id?: string;
}

interface TaskManagerProps {
  userId: string;
  showCompleted?: boolean;
  focusMode?: boolean;
  focusTaskCount?: number;
  onProfileUpdate?: () => void;
}

// Funzione per calcolare il livello basato sui punti XP
const calculateLevelFromXP = (totalXP: number): number => {
  // Sistema di livellamento progressivo: ogni livello richiede più XP del precedente
  // Livello 1: 0-99 XP, Livello 2: 100-249 XP, Livello 3: 250-449 XP, etc.
  if (totalXP < 100) return 1;
  if (totalXP < 250) return 2;
  if (totalXP < 450) return 3;
  if (totalXP < 700) return 4;
  if (totalXP < 1000) return 5;
  if (totalXP < 1350) return 6;
  if (totalXP < 1750) return 7;
  if (totalXP < 2200) return 8;
  if (totalXP < 2700) return 9;
  if (totalXP < 3250) return 10;
  
  // Per livelli superiori al 10, ogni livello richiede 600 XP aggiuntivi
  return Math.floor((totalXP - 3250) / 600) + 11;
};

export const TaskManager = ({ userId, showCompleted = false, focusMode = false, focusTaskCount = 3, onProfileUpdate }: TaskManagerProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    isVisible: boolean;
    newLevel: number;
    archetype?: string;
    xpGained: number;
  }>({ isVisible: false, newLevel: 1, xpGained: 0 });
  
  // Pattern Mining Integration
  const {
    suggestions,
    applySuggestion,
    dismissSuggestion,
    isProcessing
  } = usePatternMining(userId);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [interventions, setInterventions] = useState<TaskIntervention[]>([]);
  const [newIntervention, setNewIntervention] = useState('');
  
  // Funzione per calcolare la priorità dei task
  const calculateTaskPriority = (task: Task) => {
    let priority = 0;
    
    // Priorità basata su scadenza
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 1) priority += 100; // Scade oggi/domani
      else if (daysUntilDue <= 3) priority += 50; // Scade entro 3 giorni
      else if (daysUntilDue <= 7) priority += 25; // Scade entro una settimana
    }
    
    // Priorità basata su energia richiesta (task più facili hanno priorità quando in focus mode)
    const energyPriority = {
      'molto_bassa': 20,
      'bassa': 15,
      'media': 10,
      'alta': 5,
      'molto_alta': 0
    };
    priority += energyPriority[task.energy_required] || 0;
    
    // Priorità basata su XP reward
    priority += Math.min(task.xp_reward / 10, 20);
    
    return priority;
  };
  
  // Filtra e ordina i task per focus mode e filtri dinamici
  const getDisplayTasks = () => {
    let displayTasks = filteredTasks.filter(task => 
      showCompleted ? task.status === 'completato' : task.status !== 'completato'
    );
    
    if (focusMode && !showCompleted) {
      // In focus mode, mostra solo i task più prioritari (numero personalizzabile)
      displayTasks = displayTasks
        .map(task => ({ ...task, priority: calculateTaskPriority(task) }))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, focusTaskCount);
    }
    
    return displayTasks;
  };
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    is_recurring: false,
    recurrence_pattern: '',
    task_type: 'azione' as 'azione' | 'riflessione' | 'comunicazione' | 'creativita' | 'organizzazione',
    energy_required: 'media' as 'molto_bassa' | 'bassa' | 'media' | 'alta' | 'molto_alta',
    xp_reward: 10,
    sync_to_calendar: false
  });

  // Filtri dinamici basati su energia e mood
  const [energyFilter, setEnergyFilter] = useState<string>('all');
  const [smartFilter, setSmartFilter] = useState<boolean>(false);
  const [todayMood, setTodayMood] = useState<any>(null);

  useEffect(() => {
    loadTasks();
    loadTodayMood();
  }, [userId, showCompleted]);

  // Carica il mood giornaliero per i filtri intelligenti
  const loadTodayMood = async () => {
    if (!userId) return;
    
    try {
      const today = new Date();
      const todayString = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      
      const { data, error } = await supabase
        .from('daily_moods')
        .select('*')
        .eq('user_id', userId)
        .eq('date', todayString)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setTodayMood(data);
    } catch (error: any) {
      console.error('Error loading today mood:', error);
    }
  };

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

  // Funzione per ottenere i suggerimenti energetici basati sul mood
  const getEnergyRecommendations = (mood: string) => {
    const recommendations = {
      'congelato': ['molto_bassa', 'bassa'],
      'disorientato': ['bassa', 'media'],
      'in_flusso': ['media', 'alta', 'molto_alta'],
      'ispirato': ['alta', 'molto_alta']
    };
    return recommendations[mood as keyof typeof recommendations] || ['bassa', 'media'];
  };

  // Filtra i task basandosi sui filtri attivi
  const filteredTasks = tasks.filter(task => {
    // Filtro per energia specifica
    if (energyFilter !== 'all' && task.energy_required !== energyFilter) {
      return false;
    }

    // Filtro intelligente basato sul mood
    if (smartFilter && todayMood) {
      const recommendedEnergies = getEnergyRecommendations(todayMood.mood);
      return recommendedEnergies.includes(task.energy_required);
    }

    return true;
  });

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
          
          // Calcolare il nuovo livello basato sui punti XP
          const newLevel = calculateLevelFromXP(newTotalXp);
          
          await supabase
            .from('profiles')
            .update({ 
              total_xp: newTotalXp,
              current_level: newLevel
            })
            .eq('user_id', userId);
            
          // Notificare se c'è stato un aumento di livello
           if (newLevel > (currentProfile.current_level || 1)) {
             // Ottenere l'archetipo dominante per la notifica
             const { data: profileData } = await supabase
               .from('profiles')
               .select('dominant_archetype')
               .eq('user_id', userId)
               .single();
               
             setLevelUpData({
               isVisible: true,
               newLevel,
               archetype: profileData?.dominant_archetype || undefined,
               xpGained: task.xp_reward
             });
           }
           
           // Chiamare il callback per aggiornare il profilo nell'interfaccia
           if (onProfileUpdate) {
             onProfileUpdate();
           }
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

      const deletedTask = tasks.find(t => t.id === taskId);
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
    try {
      if (!googleCalendarService.isAuthenticated()) {
        throw new Error("Google Calendar non è collegato. Collegalo dalle impostazioni.");
      }

      if (!task.due_date) {
        throw new Error("La data di scadenza è richiesta per la sincronizzazione con Google Calendar.");
      }

      // Prepara l'evento per Google Calendar
      const startDate = new Date(task.due_date);
      const endDate = new Date(startDate.getTime() + (60 * 60 * 1000)); // 1 ora di durata predefinita

      const calendarEvent = {
        summary: task.title,
        description: task.description || `Task creato in TSUNAMI\n\nPriorità: ${task.priority}\nCategoria: ${task.category}`,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 15 },
            { method: 'popup', minutes: 60 }
          ]
        }
      };

      // Crea l'evento in Google Calendar
      const eventId = await googleCalendarService.createEvent(calendarEvent);
      
      // Aggiorna il task con l'ID dell'evento Google Calendar
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ google_calendar_event_id: eventId })
        .eq('id', task.id);

      if (updateError) {
        console.error('Error updating task with calendar event ID:', updateError);
        // Non lanciare errore qui, l'evento è stato creato con successo
      }

      return eventId;
     } catch (error: any) {
       console.error('Error syncing to Google Calendar:', error);
       throw error;
     }
   };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      is_recurring: false,
      recurrence_pattern: '',
      task_type: 'azione' as 'azione' | 'riflessione' | 'comunicazione' | 'creativita' | 'organizzazione',
      energy_required: 'media' as 'molto_bassa' | 'bassa' | 'media' | 'alta' | 'molto_alta',
      xp_reward: 10,
      sync_to_calendar: false
    });
  };

  // Template per task ADHD-friendly
  const getTaskTemplates = () => {
    return [
      {
        name: "Quick Win",
        icon: "⚡",
        description: "Task veloce per iniziare la giornata",
        energy: "Molto Bassa",
        type: "Azione",
        template: {
          title: "Quick Win: ",
          description: "Task semplice da completare in 5-10 minuti per iniziare con energia positiva",
          task_type: 'azione',
          energy_required: 'molto_bassa',
          due_date: new Date().toISOString().split('T')[0]
        }
      },
      {
        name: "Pomodoro Focus",
        icon: "🍅",
        description: "Task da 25 minuti con focus intenso",
        energy: "Media",
        type: "Azione",
        template: {
          title: "Focus 25min: ",
          description: "Task strutturato per una sessione Pomodoro (25 min focus + 5 min pausa)",
          task_type: 'azione',
          energy_required: 'media',
          due_date: new Date().toISOString().split('T')[0]
        }
      },
      {
        name: "Brain Dump",
        icon: "🧠",
        description: "Svuota la mente, scrivi tutto",
        energy: "Bassa",
        type: "Riflessione",
        template: {
          title: "Brain Dump: ",
          description: "Scrivi tutti i pensieri, idee e preoccupazioni per liberare la mente",
          task_type: 'riflessione',
          energy_required: 'bassa',
          due_date: new Date().toISOString().split('T')[0]
        }
      },
      {
        name: "Comunicazione Difficile",
        icon: "💬",
        description: "Email, chiamata o conversazione importante",
        energy: "Alta",
        type: "Comunicazione",
        template: {
          title: "Comunicazione: ",
          description: "Preparare e gestire una comunicazione che richiede attenzione e energia",
          task_type: 'comunicazione',
          energy_required: 'alta',
          due_date: new Date().toISOString().split('T')[0]
        }
      },
      {
        name: "Progetto Creativo",
        icon: "🎨",
        description: "Sessione di creatività e brainstorming",
        energy: "Alta",
        type: "Creatività",
        template: {
          title: "Creatività: ",
          description: "Sessione dedicata alla creatività, brainstorming o progetto artistico",
          task_type: 'creativita',
          energy_required: 'alta',
          due_date: new Date().toISOString().split('T')[0]
        }
      },
      {
        name: "Organizza Spazio",
        icon: "📋",
        description: "Riordina, organizza, sistema",
        energy: "Media",
        type: "Organizzazione",
        template: {
          title: "Organizzazione: ",
          description: "Riordinare, organizzare o sistemare uno spazio fisico o digitale",
          task_type: 'organizzazione',
          energy_required: 'media',
          due_date: new Date().toISOString().split('T')[0]
        }
      }
    ];
  };

  // Applica template selezionato
  const applyTemplate = (template: any) => {
    setFormData({
      ...formData,
      ...template.template
    });
    setShowTemplates(false);
    setIsCreateDialogOpen(true);
  };

  const loadInterventions = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_interventions')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInterventions(data || []);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile caricare gli interventi",
        variant: "destructive"
      });
    }
  };

  const addIntervention = async () => {
    if (!editingTask || !newIntervention.trim()) {
      toast({
        title: "Errore",
        description: "L'intervento non può essere vuoto",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('task_interventions')
        .insert({
          task_id: editingTask.id,
          user_id: userId,
          content: newIntervention.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setInterventions(prev => [data, ...prev]);
      setNewIntervention('');
      
      toast({
        title: "Intervento aggiunto",
        description: "Intervento registrato con successo"
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile salvare l'intervento",
        variant: "destructive"
      });
    }
  };

  const deleteIntervention = async (interventionId: string) => {
    try {
      const { error } = await supabase
        .from('task_interventions')
        .delete()
        .eq('id', interventionId);

      if (error) throw error;

      setInterventions(prev => prev.filter(i => i.id !== interventionId));
      
      toast({
        title: "Intervento eliminato",
        description: "Intervento eliminato con successo"
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'intervento",
        variant: "destructive"
      });
    }
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
    loadInterventions(task.id);
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

      // Aggiorna lo stato locale immediatamente
      setTasks(prev => prev.map(t => 
        t.id === editingTask.id 
          ? { ...t, ...taskData }
          : t
      ));

      // Chiudi il dialog e resetta il form
      resetForm();
      setIsEditDialogOpen(false);
      setEditingTask(null);
      setInterventions([]);
      setNewIntervention('');

      toast({
        title: "Task aggiornato",
        description: `Task "${formData.title}" aggiornato con successo`
      });

      // Ricarica i task dal database per sincronizzare
      setTimeout(() => {
        loadTasks();
      }, 100);

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
      case 'molto_bassa': return 'text-green-500';
      case 'bassa': return 'text-green-600';
      case 'media': return 'text-yellow-600';
      case 'alta': return 'text-orange-600';
      case 'molto_alta': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getEnergyPoints = (energy: string) => {
    switch (energy) {
      case 'molto_bassa': return 1;
      case 'bassa': return 3;
      case 'media': return 6;
      case 'alta': return 10;
      case 'molto_alta': return 15;
      default: return 6;
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
      </div>

      {/* Filtri Dinamici */}
      {!showCompleted && (
        <div className="bg-card border rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-sm">🎯 Filtri Intelligenti</h3>
            {todayMood && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {todayMood.mood === 'disorientato' ? '🌀' : 
                   todayMood.mood === 'congelato' ? '❄️' :
                   todayMood.mood === 'in_flusso' ? '🌊' :
                   todayMood.mood === 'ispirato' ? '✨' : '🎭'}
                </span>
                <span className="capitalize">{todayMood.mood?.replace('_', ' ')}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Filtro Smart basato su mood */}
            {todayMood && (
              <Button
                variant={smartFilter ? "default" : "outline"}
                size="sm"
                onClick={() => setSmartFilter(!smartFilter)}
                className="gap-2"
              >
                <span>🧠</span>
                <span>Suggeriti per oggi</span>
                {smartFilter && (
                  <span className="text-xs bg-primary-foreground/20 px-1 rounded">
                    {filteredTasks.filter(t => t.status !== 'completato').length}
                  </span>
                )}
              </Button>
            )}
            
            {/* Filtri per livello di energia */}
            <Select value={energyFilter} onValueChange={setEnergyFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtra per energia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🔄 Tutti i livelli</SelectItem>
                <SelectItem value="molto_bassa">🟢 Molto Bassa</SelectItem>
                <SelectItem value="bassa">🟢 Bassa</SelectItem>
                <SelectItem value="media">🟡 Media</SelectItem>
                <SelectItem value="alta">🔴 Alta</SelectItem>
                <SelectItem value="molto_alta">🔴 Molto Alta</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Reset filtri */}
            {(energyFilter !== 'all' || smartFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEnergyFilter('all');
                  setSmartFilter(false);
                }}
                className="gap-2 text-muted-foreground"
              >
                <span>↻</span>
                <span>Reset</span>
              </Button>
            )}
          </div>
          
          {/* Statistiche filtri */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>📊 Mostrando {filteredTasks.filter(t => t.status !== 'completato').length} di {tasks.filter(t => t.status !== 'completato').length} task</span>
            {smartFilter && todayMood && (
              <span>💡 Energia consigliata: {getEnergyRecommendations(todayMood.mood).join(', ')}</span>
            )}
          </div>
        </div>
      )}

      {/* Smart Suggestions Panel */}
      {suggestions.length > 0 && (
        <SmartSuggestionsPanel
          suggestions={suggestions}
          onApply={applySuggestion}
          onDismiss={dismissSuggestion}
          isProcessing={isProcessing}
        />
      )}

      <div className="flex items-center justify-between">
        
        {!showCompleted && (
          <div className="flex gap-2">
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
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, energy_required: value, xp_reward: getEnergyPoints(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                          <SelectContent>
                          <SelectItem value="molto_bassa">🟢 Molto Bassa (1 XP)</SelectItem>
                          <SelectItem value="bassa">🟢 Bassa (3 XP)</SelectItem>
                          <SelectItem value="media">🟡 Media (6 XP)</SelectItem>
                          <SelectItem value="alta">🔴 Alta (10 XP)</SelectItem>
                          <SelectItem value="molto_alta">🔴 Molto Alta (15 XP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="due_date">Scadenza</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="is_recurring"
                        checked={formData.is_recurring}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: !!checked }))}
                      />
                      <Label htmlFor="is_recurring" className="text-sm">Ricorrente</Label>
                    </div>
                  </div>

                  {formData.is_recurring && (
                    <div>
                      <Label htmlFor="recurrence_pattern">Pattern di ricorrenza</Label>
                      <Select 
                        value={formData.recurrence_pattern} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, recurrence_pattern: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona frequenza" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Giornaliero</SelectItem>
                          <SelectItem value="weekly">Settimanale</SelectItem>
                          <SelectItem value="monthly">Mensile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Annulla
                    </Button>
                    <Button 
                      onClick={createTask}
                      disabled={!formData.title.trim() || loading}
                    >
                      {loading ? 'Creazione...' : 'Crea Task'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              📋 Template
            </Button>
          </div>
        )}
        
        {/* Template Wizard */}
        {showTemplates && !showCompleted && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                🧙‍♂️ Wizard Template ADHD-Friendly
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getTaskTemplates().map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2 text-left"
                    onClick={() => applyTemplate(template)}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-lg">{template.icon}</span>
                      <span>{template.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{template.energy}</Badge>
                      <Badge variant="outline" className="text-xs">{template.type}</Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        


        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsEditDialogOpen(false);
            setEditingTask(null);
            setInterventions([]);
            setNewIntervention('');
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifica Task</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Informazioni Task */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informazioni Task</h3>
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
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, energy_required: value, xp_reward: getEnergyPoints(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="molto_bassa">🟢 Molto Bassa (1 XP)</SelectItem>
                        <SelectItem value="bassa">🟢 Bassa (3 XP)</SelectItem>
                        <SelectItem value="media">🟡 Media (6 XP)</SelectItem>
                        <SelectItem value="alta">🔴 Alta (10 XP)</SelectItem>
                        <SelectItem value="molto_alta">🔴 Molto Alta (15 XP)</SelectItem>
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
              </div>

              {/* Sezione Interventi */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Interventi</h3>
                
                {/* Aggiungi nuovo intervento */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Scrivi un nuovo intervento..."
                    value={newIntervention}
                    onChange={(e) => setNewIntervention(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button 
                    onClick={addIntervention}
                    disabled={!newIntervention.trim()}
                    className="shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Lista interventi */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {interventions.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Nessun intervento ancora registrato</p>
                  ) : (
                    interventions.map((intervention) => (
                      <div key={intervention.id} className="bg-muted/50 rounded-lg p-3 flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm">{intervention.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(intervention.created_at).toLocaleString('it-IT')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => deleteIntervention(intervention.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={updateTask} className="flex-1">
                  Aggiorna Task
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingTask(null);
                  setInterventions([]);
                  setNewIntervention('');
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
      {getDisplayTasks().length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {focusMode ? 'Nessun task prioritario' : 'Nessun task ancora'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {focusMode 
                ? 'Tutti i task sono completati o non ci sono task urgenti'
                : 'Crea il tuo primo task per iniziare'
              }
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
              {focusMode ? 'Aggiungi task' : 'Crea il primo task'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {focusMode && !showCompleted && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-primary font-medium">
                📍 Mostrando {getDisplayTasks().length} task prioritari su {tasks.filter(t => t.status !== 'completato').length} totali
              </p>
            </div>
          )}
          {getDisplayTasks().map((task) => (
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
                          ⚡ {task.energy_required} ({getEnergyPoints(task.energy_required)} XP)
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
      
      {/* Level Up Notification */}
      <LevelUpNotification
        isVisible={levelUpData.isVisible}
        newLevel={levelUpData.newLevel}
        archetype={levelUpData.archetype}
        xpGained={levelUpData.xpGained}
        onClose={() => setLevelUpData(prev => ({ ...prev, isVisible: false }))}
        onViewCharacterSheet={() => {
          setLevelUpData(prev => ({ ...prev, isVisible: false }));
          // Navigate to character sheet if navigation function is available
          window.location.href = '/personaggio';
        }}
      />
    </div>
  );
};