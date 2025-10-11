import { supabase } from '@/integrations/supabase/client';
import { Task, TaskFormData, TaskFilters, TaskStats } from '../types';

class TaskService {
  /**
   * Recupera le task dell'utente con filtri opzionali
   */
  async getTasks(userId: string, filters?: TaskFilters): Promise<Task[]> {
    // Debug log per diagnosticare problemi di filtraggio
    console.log('🔍 TaskService.getTasks - USERID:', userId, 'FILTERS:', filters);
    
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Applica filtri con controlli migliorati
    if (filters?.status?.length) {
      console.log('📊 Applicando filtro status:', filters.status);
      query = query.in('status', filters.status);
    }

    if (filters?.task_type?.length) {
      console.log('📝 Applicando filtro task_type:', filters.task_type);
      query = query.in('task_type', filters.task_type);
    }

    if (filters?.energy_required?.length) {
      console.log('⚡ Applicando filtro energy_required:', filters.energy_required);
      query = query.in('energy_required', filters.energy_required);
    }

    if (filters?.due_date_from) {
      console.log('📅 Applicando filtro due_date_from:', filters.due_date_from);
      query = query.gte('due_date', filters.due_date_from);
    }

    if (filters?.due_date_to) {
      console.log('📅 Applicando filtro due_date_to:', filters.due_date_to);
      query = query.lte('due_date', filters.due_date_to);
    }

    if (filters?.search) {
      console.log('🔍 Applicando filtro search:', filters.search);
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Gestione migliorata del filtro tags
    if (Array.isArray(filters?.tags) && filters.tags.length > 0 && filters.tags.some(t => t.trim() !== "")) {
      const validTags = filters.tags.filter(t => t.trim() !== "");
      console.log('🏷️ Applicando filtro tags:', validTags);
      query = query.overlaps('tags', validTags);
    }

    // Deep focus filter removed - requires_deep_focus not in database schema
    // if (filters?.requires_deep_focus !== undefined) {
    //   query = query.eq('requires_deep_focus', filters.requires_deep_focus);
    // }

    const { data, error } = await query;
    
    // Debug log per vedere il risultato della query
    console.log('📋 TaskService.getTasks - RESULT DATA:', data, 'ERROR:', error);
    console.log('📊 TaskService.getTasks - Numero task trovate:', data?.length || 0);

    if (error) {
      console.error('❌ Errore nella query getTasks:', error);
      throw new Error(`Errore nel caricamento delle task: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Crea una nuova task
   */
  async createTask(userId: string, taskData: TaskFormData): Promise<Task> {
    const xpReward = this.calculateXPReward(taskData);
    
    // Extract only the fields that exist in the database schema
    const {
      parent_task_id, // Remove parent_task_id - not in database schema
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
        xp_reward: xpReward,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Errore nella creazione della task: ${error.message}`);
    }

    return data;
  }

  /**
   * Aggiorna una task esistente
   */
  async updateTask(taskId: string, updates: Partial<TaskFormData>): Promise<Task> {
    // Ricalcola XP se necessario
    if (this.shouldRecalculateXP(updates)) {
      updates = { ...updates };
      // XP viene ricalcolato solo se cambiano parametri rilevanti
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
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
   * Completa una task e assegna XP
   */
  async completeTask(taskId: string): Promise<{ task: Task; xpGained: number }> {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      throw new Error('Task non trovata');
    }

    if (task.status === 'completed') {
      throw new Error('Task già completata');
    }

    // Aggiorna task come completata
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Errore nel completamento della task: ${updateError.message}`);
    }

    // Assegna XP al profilo utente
    const xpGained = task.xp_reward;
    await this.awardXP(task.user_id, xpGained);

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
    const level = this.calculateLevelFromXP(totalXP);
    
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
   * Calcola il livello dall'XP totale
   */
  private calculateLevelFromXP(totalXP: number): number {
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
    
    // Per livelli superiori a 10
    return 10 + Math.floor((totalXP - 3250) / 600);
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
}

export const taskService = new TaskService();