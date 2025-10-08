// Task suggestion utilities
// Extracted from LocalChatBot.tsx for better maintainability

import { MoodContext } from './moodEnhancements';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_date?: string;
  task_type: 'azione' | 'riflessione' | 'comunicazione' | 'creativita' | 'organizzazione';
  energy_required: 'molto_bassa' | 'bassa' | 'media' | 'alta' | 'molto_alta';
  xp_reward: number;
}

export interface UserBehaviorPattern {
  preferredTaskTypes: string[];
  peakEnergyHours: number[];
  averageTaskDuration: number;
  procrastinationTriggers: string[];
  successfulStrategies: string[];
  completionRate: number;
}

/**
 * Calculates task score based on mood and energy level
 */
export function calculateMoodTaskScore(
  task: Task,
  mood: string,
  energyLevel: number
): number {
  let score = calculateBaseTaskScore(task, energyLevel);
  
  // Mood-specific adjustments
  switch (mood) {
    case 'congelato':
      // Prefer very low energy tasks when frozen
      if (task.energy_required === 'molto_bassa') score += 30;
      if (task.energy_required === 'bassa') score += 10;
      break;
      
    case 'disorientato':
      // Prefer structured, clear tasks when disoriented
      if (task.task_type === 'organizzazione') score += 20;
      if (task.task_type === 'azione') score += 15;
      break;
      
    case 'in_flusso':
      // Prefer creative and action tasks when in flow
      if (task.task_type === 'creativita') score += 25;
      if (task.task_type === 'azione') score += 20;
      if (task.energy_required === 'alta' || task.energy_required === 'molto_alta') score += 15;
      break;
      
    case 'ispirato':
      // Prefer creative and reflection tasks when inspired
      if (task.task_type === 'creativita') score += 30;
      if (task.task_type === 'riflessione') score += 25;
      break;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculates base task score based on energy and other factors
 */
export function calculateBaseTaskScore(task: Task, energyLevel: number): number {
  let score = 50; // Base score
  
  // Energy matching
  const energyMap = {
    'molto_bassa': 1,
    'bassa': 2,
    'media': 3,
    'alta': 4,
    'molto_alta': 5
  };
  
  const taskEnergyLevel = energyMap[task.energy_required];
  const energyDiff = Math.abs(taskEnergyLevel - energyLevel);
  score -= energyDiff * 10; // Penalty for energy mismatch
  
  // XP reward bonus
  score += Math.min(task.xp_reward / 10, 20);
  
  // Due date urgency
  if (task.due_date) {
    const dueDate = new Date(task.due_date);
    const now = new Date();
    const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysUntilDue < 1) score += 30; // Due today or overdue
    else if (daysUntilDue < 3) score += 20; // Due soon
    else if (daysUntilDue < 7) score += 10; // Due this week
  }
  
  return score;
}

/**
 * Predicts optimal tasks based on mood and energy
 */
export function predictOptimalTasksWithMood(
  tasks: Task[],
  mood: string,
  energyLevel: number,
  userBehavior: UserBehaviorPattern,
  limit: number = 3
): Task[] {
  return tasks
    .filter(task => task.status !== 'completed')
    .map(task => ({
      ...task,
      score: calculateMoodTaskScore(task, mood, energyLevel)
    }))
    .sort((a, b) => (b as any).score - (a as any).score)
    .slice(0, limit);
}

/**
 * Gets mood-based strategic suggestions
 */
export function getMoodBasedStrategicSuggestion(
  mood: string,
  energyLevel: number
): string {
  const strategies = {
    congelato: {
      low: "Inizia con un task di 2 minuti. Qualsiasi cosa. L'importante è muoversi.",
      medium: "Prova la tecnica del 'body doubling' - lavora in presenza di qualcun altro.",
      high: "Usa questa energia per preparare l'ambiente per quando sarai più motivato."
    },
    disorientato: {
      low: "Fai una lista di tutto quello che hai in mente, poi scegli UNA cosa.",
      medium: "Usa il Pomodoro: 25 minuti su una task, poi pausa. Ripeti.",
      high: "Canalizza questa energia: scegli 3 task e completale in sequenza."
    },
    in_flusso: {
      low: "Mantieni il flusso con task leggere ma significative.",
      medium: "Perfetto! Continua con task creative o che richiedono concentrazione.",
      high: "Questo è il momento ideale per i task più impegnativi. Vai!"
    },
    ispirato: {
      low: "Cattura le idee ora, eseguile quando avrai più energia.",
      medium: "Bilancia cattura delle idee con un po' di esecuzione.",
      high: "Momento perfetto per brainstorming e pianificazione di nuovi progetti!"
    }
  };

  const moodStrategies = strategies[mood as keyof typeof strategies];
  if (!moodStrategies) return "Concentrati su una task alla volta.";

  if (energyLevel <= 3) return moodStrategies.low;
  if (energyLevel <= 6) return moodStrategies.medium;
  return moodStrategies.high;
}

/**
 * Gets contextual suggestions based on current state
 */
export function getContextualSuggestions(
  activeTasks: number,
  timeOfDay: string,
  mood?: string
): string[] {
  const suggestions: string[] = [];

  // Overwhelm detection
  if (activeTasks > 10) {
    suggestions.push("🚨 Hai troppe task attive. Considera di archiviarne alcune o usare il Focus Mode.");
  }

  // Time-based suggestions
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 11) {
    suggestions.push("🌅 Mattina: momento ideale per task che richiedono concentrazione.");
  } else if (hour >= 14 && hour <= 16) {
    suggestions.push("☀️ Pomeriggio: buon momento per task collaborative e comunicazione.");
  } else if (hour >= 19) {
    suggestions.push("🌙 Sera: perfetto per riflessione e pianificazione del giorno dopo.");
  }

  // Mood-specific suggestions
  if (mood === 'disorientato') {
    suggestions.push("💡 Quando sei disorientato, inizia sempre con una lista. Usa il Mental Inbox!");
  }

  return suggestions;
}