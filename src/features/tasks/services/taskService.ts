import { supabase } from '../../../integrations/supabase/client';
import { Task, TaskFormData, TaskFilters, TaskStats } from '../types';
import { AnalyticsManager } from '../../../utils/analytics';
import { progressionService } from '@/services/ProgressionService';

/**
 * Custom error for validation failures
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validation result interface
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

class TaskService {
  /**
   * Recupera le task dell'utente con filtri opzionali
   */
  async getTasks(userId: string, filters?: TaskFilters): Promise<Task[]> {
    console.log('🔍 TaskService.getTasks chiamato:', {
      userId,
      filters,
      timestamp: new Date().toISOString()
    });

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .is('parent_task_id', null) // Filtra solo le task principali (non subtask)
      .order('created_at', { ascending: false });

    // Applica filtri
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters?.task_type?.length) {
      query = query.in('task_type', filters.task_type);
    }

    if (filters?.energy_required?.length) {
      query = query.in('energy_required', filters.energy_required);
    }

    if (filters?.due_date_from) {
      query = query.gte('due_date', filters.due_date_from);
    }

    if (filters?.due_date_to) {
      query = query.lte('due_date', filters.due_date_to);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }



    // Deep focus filter removed - requires_deep_focus not in database schema
    // if (filters?.requires_deep_focus !== undefined) {
    //   query = query.eq('requires_deep_focus', filters.requires_deep_focus);
    // }

    const { data, error } = await query;

    console.log('📊 TaskService.getTasks risultato:', {
      tasksCount: data?.length || 0,
      error: error?.message,
      firstTask: data?.[0]?.title,
      timestamp: new Date().toISOString()
    });

    if (error) {
      console.error('❌ Errore nel caricamento delle task:', error);
      throw new Error(`Errore nel caricamento delle task: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Recupera TUTTE le task dell'utente (incluse le subtask) con filtri opzionali
   */
  async getAllTasks(userId: string, filters?: TaskFilters): Promise<Task[]> {
    console.log('🔍 TaskService.getAllTasks chiamato:', {
      userId,
      filters,
      timestamp: new Date().toISOString()
    });

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Applica filtri (stessa logica di getTasks)
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters?.task_type?.length) {
      query = query.in('task_type', filters.task_type);
    }

    if (filters?.energy_required?.length) {
      query = query.in('energy_required', filters.energy_required);
    }

    if (filters?.due_date_from) {
      query = query.gte('due_date', filters.due_date_from);
    }

    if (filters?.due_date_to) {
      query = query.lte('due_date', filters.due_date_to);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    console.log('📊 TaskService.getAllTasks risultato:', {
      tasksCount: data?.length || 0,
      error: error?.message,
      timestamp: new Date().toISOString()
    });

    if (error) {
      console.error('❌ Errore nel caricamento di tutte le task:', error);
      throw new Error(`Errore nel caricamento di tutte le task: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Recupera le subtask di una task principale
   */
  async getSubtasks(parentTaskId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', parentTaskId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Errore nel recupero delle subtask: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Recupera una task con le sue subtask
   */
  async getTaskWithSubtasks(taskId: string): Promise<Task & { subtasks?: Task[] }> {
    // Recupera la task principale
    const { data: mainTask, error: mainError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (mainError || !mainTask) {
      throw new Error('Task non trovata');
    }

    // Recupera le subtask se esistono
    const subtasks = await this.getSubtasks(taskId);

    return {
      ...mainTask,
      subtasks: subtasks.length > 0 ? subtasks : undefined
    };
  }

  /**
   * Validate task data before database operations
   */
  private validateTaskData(taskData: Partial<TaskFormData>): ValidationResult {
    const errors: string[] = [];
    
    // Title validation
    if (!taskData.title || typeof taskData.title !== 'string') {
      errors.push("Titolo è obbligatorio");
    } else if (taskData.title.trim().length < 3) {
      errors.push("Titolo deve essere almeno 3 caratteri");
    } else if (taskData.title.length > 100) {
      errors.push("Titolo massimo 100 caratteri");
    }
    
    // Description validation
    if (taskData.description && taskData.description.length > 500) {
      errors.push("Descrizione massimo 500 caratteri");
    }
    
    // Due date validation
    if (taskData.due_date) {
      const dueDate = new Date(taskData.due_date);
      if (isNaN(dueDate.getTime())) {
        errors.push("Data scadenza non valida");
      } else if (dueDate < new Date()) {
        errors.push("Data scadenza non può essere nel passato");
      }
    }
    
    // Energy required validation
    if (taskData.energy_required) {
      const validEnergyLevels = ['bassa', 'media', 'alta'];
      if (!validEnergyLevels.includes(taskData.energy_required)) {
        errors.push("Livello energia deve essere: bassa, media, o alta");
      }
    }
    
    // Task type validation
    if (taskData.task_type) {
      const validTaskTypes = ['azione', 'riflessione', 'comunicazione', 'creativita', 'organizzazione'];
      if (!validTaskTypes.includes(taskData.task_type)) {
        errors.push("Tipo task non valido");
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  /**
   * Crea una nuova task
   */
  async createTask(userId: string, taskData: TaskFormData): Promise<Task> {
    // Validate input data
    const validation = this.validateTaskData(taskData);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(', '));
    }
    
    const xpReward = this.calculateXPReward(taskData);
    
    // Extract only the fields that exist in the database schema
    const {
      context_switching_cost, // Remove context_switching_cost - not in database schema
      can_be_interrupted, // Remove can_be_interrupted - not in database schema
      actual_duration, // Remove actual_duration - not in database schema
      ...validTaskData
    } = taskData;
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        ...validTaskData,
        due_date: taskData.due_date?.toISOString(),
        planned_date: taskData.planned_date?.toISOString(),
        xp_reward: xpReward,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Errore nella creazione della task: ${error.message}`);
    }

    // Track task creation for pattern mining
    try {
      const analytics = AnalyticsManager.getInstance();
      analytics.trackTaskInteraction({
        taskId: data.id,
        action: 'created',
        taskType: data.task_type,
        energyRequired: data.energy_required,
        xpReward: data.xp_reward,
        userId: userId
      });
    } catch (analyticsError) {
      console.warn('Failed to track task creation:', analyticsError);
    }

    return data;
  }

  /**
   * Aggiorna una task esistente
   */
  async updateTask(taskId: string, updates: Partial<TaskFormData>): Promise<Task> {
    // Validate input data
    const validation = this.validateTaskData(updates);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(', '));
    }
    
    // Ricalcola XP se necessario
    if (this.shouldRecalculateXP(updates)) {
      updates = { ...updates };
      // XP viene ricalcolato solo se cambiano parametri rilevanti
    }

    // Converti le date in ISO string per il database
    const updateData = { ...updates };
    if (updateData.due_date !== undefined) {
      updateData.due_date = updateData.due_date?.toISOString() as any;
    }
    if (updateData.planned_date !== undefined) {
      updateData.planned_date = updateData.planned_date?.toISOString() as any;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Errore nell'aggiornamento della task: ${error.message}`);
    }

    return data;
  }

  /**
   * Completa una task e assegna XP con protezione contro race condition
   */
  async completeTask(taskId: string): Promise<{ task: Task; xpGained: number }> {
    // Aggiorna task come completata solo se non è già completata (atomic operation)
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .neq('status', 'completed') // Condizione atomica per prevenire doppi completamenti
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        // Nessuna riga aggiornata - task già completata
        throw new Error('Task già completata');
      }
      throw new Error(`Errore nel completamento della task: ${updateError.message}`);
    }

    if (!updatedTask) {
      throw new Error('Task già completata o non trovata');
    }

    // Track task completion for pattern mining
    try {
      const analytics = AnalyticsManager.getInstance();
      analytics.trackTaskInteraction({
        taskId: updatedTask.id,
        action: 'completed',
        taskType: updatedTask.task_type,
        energyRequired: updatedTask.energy_required,
        xpReward: updatedTask.xp_reward,
        userId: updatedTask.user_id
      });
    } catch (analyticsError) {
      console.warn('Failed to track task completion:', analyticsError);
    }

    // Assegna XP al profilo utente solo se il completamento è avvenuto con successo
    const xpGained = updatedTask.xp_reward || 0;
    if (xpGained > 0) {
      await this.awardXP(updatedTask.user_id, xpGained);
    }

    return { task: updatedTask, xpGained };
  }

  /**
   * Elimina una task
   */
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      throw new Error(`Errore nell'eliminazione della task: ${error.message}`);
    }
  }

  /**
   * Ottieni statistiche delle task per l'utente
   */
  async getTaskStats(userId: string, dateRange?: { from: string; to: string }): Promise<TaskStats> {
    let query = supabase
      .from('tasks')
      .select('status, xp_reward, created_at, completed_at')
      .eq('user_id', userId);

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Errore nel caricamento delle statistiche: ${error.message}`);
    }

    const tasks = data || [];
    const completed = tasks.filter(t => t.status === 'completed');
    const pending = tasks.filter(t => t.status === 'pending');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const overdue = tasks.filter(t => 
      t.status !== 'completed' && 
      t.due_date && 
      new Date(t.due_date) < new Date()
    );

    const totalXP = completed.reduce((sum, task) => sum + (task.xp_reward || 0), 0);
    const completionRate = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;

    // Calcola tempo medio di completamento
    const completedWithTimes = completed.filter(t => t.completed_at && t.created_at);
    const avgCompletionTime = completedWithTimes.length > 0 
      ? completedWithTimes.reduce((sum, task) => {
          const created = new Date(task.created_at).getTime();
          const completed = new Date(task.completed_at!).getTime();
          return sum + (completed - created);
        }, 0) / completedWithTimes.length
      : 0;

    // Calcola il livello dall'XP totale
    const level = progressionService.calculateLevelFromXP(totalXP);
    
    // Calcola lo streak (giorni consecutivi con task completate)
    const streak = this.calculateStreak(completed);

    return {
      total: tasks.length,
      completed: completed.length,
      pending: pending.length,
      in_progress: inProgress.length,
      overdue: overdue.length,
      completion_rate: Math.round(completionRate * 100) / 100,
      avg_completion_time: Math.round(avgCompletionTime / (1000 * 60 * 60)), // ore
      total_xp_earned: totalXP,
      level,
      streak
    };
  }



  /**
   * Calcola lo streak di giorni consecutivi con task completate
   */
  private calculateStreak(completedTasks: any[]): number {
    if (completedTasks.length === 0) return 0;
    
    // Raggruppa le task per data di completamento
    const tasksByDate = new Map<string, number>();
    completedTasks.forEach(task => {
      if (task.completed_at) {
        const date = new Date(task.completed_at).toDateString();
        tasksByDate.set(date, (tasksByDate.get(date) || 0) + 1);
      }
    });
    
    // Ordina le date
    const dates = Array.from(tasksByDate.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    if (dates.length === 0) return 0;
    
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    // Inizia il conteggio da oggi o ieri
    let currentDate = dates[0] === today ? today : (dates[0] === yesterday ? yesterday : null);
    
    if (!currentDate) return 0;
    
    // Conta i giorni consecutivi
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toDateString();
      if (dates.includes(expectedDate)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * Calcola il reward XP basato sui parametri della task
   */
  private calculateXPReward(taskData: TaskFormData): number {
    let baseXP = 10;

    // Bonus per tipo di task
    const typeMultipliers = {
      'azione': 1.0,
      'riflessione': 1.2,
      'comunicazione': 1.1,
      'creativita': 1.3,
      'organizzazione': 1.1
    };

    // Bonus per energia richiesta
    const energyMultipliers = {
      'molto_bassa': 0.8,
      'bassa': 1.0,
      'media': 1.2,
      'alta': 1.5,
      'molto_alta': 2.0
    };

    // Bonus per difficoltà
    const difficultyBonus = 5; // Base difficulty bonus

    // Bonus per focus profondo - removed (requires_deep_focus not in database schema)
    const focusBonus = 0; // taskData.requires_deep_focus ? 10 : 0;

    // Bonus per durata stimata
    const durationBonus = 0; // Duration bonus removed - estimated_duration not in schema

    const totalXP = Math.round(
      (baseXP + difficultyBonus + focusBonus + durationBonus) *
      typeMultipliers[taskData.task_type] *
      energyMultipliers[taskData.energy_required]
    );

    return Math.max(totalXP, 5); // Minimo 5 XP
  }

  /**
   * Assegna XP al profilo utente
   */
  private async awardXP(userId: string, xpAmount: number): Promise<void> {
    const { error } = await supabase.rpc('add_xp_to_profile', {
      user_id: userId,
      xp_amount: xpAmount
    });

    if (error) {
      console.error('Errore nell\'assegnazione XP:', error);
      // Non lanciamo errore per non bloccare il completamento della task
    }
  }

  /**
   * Determina se è necessario ricalcolare l'XP
   */
  private shouldRecalculateXP(updates: Partial<TaskFormData>): boolean {
    const xpAffectingFields = [
      'task_type',
      'energy_required',
      // 'difficulty_level' removed
      // 'requires_deep_focus', // Removed - not in database schema
      // 'estimated_duration' removed
    ];

    return xpAffectingFields.some(field => field in updates);
  }

  /**
   * Ottieni task in scadenza
   */
  async getUpcomingTasks(userId: string, days: number = 7): Promise<Task[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'completed')
      .not('due_date', 'is', null)
      .lte('due_date', endDate.toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error(`Errore nel caricamento delle task in scadenza: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Ottieni task consigliate basate su energia e contesto
   */
  async getRecommendedTasks(
    userId: string, 
    currentEnergy: Task['energy_required'],
    limit: number = 5
  ): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .eq('energy_required', currentEnergy)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Errore nel caricamento delle task consigliate: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Ottieni le ultime task completate per contesto AI
   */
  async getRecentCompletedTasks(userId: string, limit: number = 3): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Errore nel caricamento delle task recenti:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Ottieni informazioni del progetto di una task (placeholder)
   */
  async getTaskProject(taskId: string): Promise<any> {
    // TODO: Implementare quando avremo la tabella progetti
    // Per ora restituiamo un oggetto placeholder
    return {
      id: 'default',
      name: 'Progetto Generale',
      description: 'Progetto di default per task non categorizzate'
    };
  }

  /**
   * Ottieni preferenze utente per contesto AI (placeholder)
   */
  async getUserPreferences(userId: string): Promise<any> {
    // TODO: Implementare quando avremo la tabella user_preferences
    // Per ora restituiamo preferenze di default ADHD-friendly
    return {
      preferredSessionDuration: 25, // Pomodoro
      preferredBreakDuration: 5,
      energyPeakHours: ['09:00', '11:00', '15:00', '17:00'],
      workingStyle: 'short_bursts',
      distractionLevel: 'medium',
      motivationTriggers: ['gamification', 'progress_tracking', 'micro_rewards']
    };
  }

  /**
   * Ottieni archetipo utente per contesto AI (placeholder)
   */
  async getUserArchetype(userId: string): Promise<string> {
    // TODO: Implementare quando avremo la tabella user_archetypes
    // Per ora restituiamo un archetipo di default
    return 'Visionario';
  }

  /**
   * Ottieni pattern comportamentali utente per contesto AI (placeholder)
   */
  async getUserPatterns(userId: string): Promise<any> {
    // TODO: Implementare analisi pattern comportamentali
    // Per ora restituiamo pattern di default
    return {
      mostProductiveTimeSlots: ['09:00-11:00', '15:00-17:00'],
      averageTaskDuration: 30,
      completionRate: 0.75,
      preferredTaskTypes: ['azione', 'organizzazione'],
      energyDistribution: {
        bassa: 0.4,
        media: 0.4,
        alta: 0.2
      }
    };
  }

  /**
   * Costruisci contesto esteso per AI breakdown
   */
  async buildAIContext(userId: string, selectedTask: Task): Promise<any> {
    try {
      const [recentTasks, projectInfo, userPreferences, userArchetype, userPatterns] = await Promise.all([
        this.getRecentCompletedTasks(userId, 3),
        this.getTaskProject(selectedTask.id),
        this.getUserPreferences(userId),
        this.getUserArchetype(userId),
        this.getUserPatterns(userId)
      ]);

      return {
        task: selectedTask,
        taskType: selectedTask.task_type,
        energyLevel: selectedTask.energy_required,
        deadline: selectedTask.due_date,
        project: projectInfo,
        userHistory: recentTasks,
        preferences: userPreferences,
        archetype: userArchetype,
        workPatterns: userPatterns,
        currentTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('Errore nella costruzione del contesto AI:', error);
      // Restituisci contesto minimo in caso di errore
      return {
        task: selectedTask,
        taskType: selectedTask.task_type,
        energyLevel: selectedTask.energy_required,
        deadline: selectedTask.due_date,
        currentTime: new Date().toISOString()
      };
    }
  }

  /**
   * Crea una subtask con tutti i campi necessari
   */
  async createSubtask(userId: string, subtaskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    // Validazione base del titolo
    if (!subtaskData.title || subtaskData.title.trim().length < 3) {
      throw new ValidationError("Titolo della subtask deve essere almeno 3 caratteri");
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: subtaskData.title,
        description: subtaskData.description || '',
        status: subtaskData.status || 'pending',
        priority: subtaskData.priority,
        task_type: subtaskData.task_type,
        energy_required: subtaskData.energy_required,
        xp_reward: subtaskData.xp_reward,
        due_date: subtaskData.due_date,
        planned_date: subtaskData.planned_date,
        is_recurring: subtaskData.is_recurring || false,
        parent_task_id: subtaskData.parent_task_id,
        tags: subtaskData.tags || [],
        can_be_interrupted: subtaskData.can_be_interrupted,
        context_switching_cost: subtaskData.context_switching_cost,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Errore nella creazione della subtask: ${error.message}`);
    }

    // Track subtask creation
    try {
      const analytics = AnalyticsManager.getInstance();
      analytics.trackTaskInteraction({
        taskId: data.id,
        action: 'created',
        taskType: data.task_type,
        energyRequired: data.energy_required,
        xpReward: data.xp_reward,
        userId: userId
      });
    } catch (analyticsError) {
      console.warn('Failed to track subtask creation:', analyticsError);
    }

    return data;
  }
}

export const taskService = new TaskService();