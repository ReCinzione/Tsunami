/**
 * Centralized progression and XP calculation service
 * Handles all level calculations, XP rewards, and progression logic
 */

import type { Task } from '@/types/adhd';
import type { TaskFormData } from '@/features/tasks/types';

/**
 * XP calculation constants
 */
const XP_CONSTANTS = {
  BASE_XP: 10,
  ENERGY_MULTIPLIERS: {
    bassa: 1.0,
    media: 1.5,
    alta: 2.0
  },
  TYPE_MULTIPLIERS: {
    azione: 1.0,
    riflessione: 1.2,
    comunicazione: 1.3,
    creativita: 1.4,
    organizzazione: 1.1
  },
  LEVEL_BASE: 100,
  LEVEL_MULTIPLIER: 1.5
} as const;

/**
 * Level information interface
 */
export interface LevelInfo {
  currentLevel: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  progressPercentage: number;
}

/**
 * XP transaction for history tracking
 */
export interface XPTransaction {
  id: string;
  amount: number;
  reason: string;
  taskId?: string;
  taskTitle?: string;
  timestamp: Date;
  type: 'gain' | 'loss' | 'bonus';
}

/**
 * Centralized progression service
 */
export class ProgressionService {
  private static instance: ProgressionService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ProgressionService {
    if (!ProgressionService.instance) {
      ProgressionService.instance = new ProgressionService();
    }
    return ProgressionService.instance;
  }

  /**
   * Calculate XP reward for a task
   */
  calculateTaskXP(taskData: TaskFormData | Task): number {
    let xp = XP_CONSTANTS.BASE_XP;

    // Apply energy multiplier
    if (taskData.energy_required) {
      const energyMultiplier = XP_CONSTANTS.ENERGY_MULTIPLIERS[taskData.energy_required] || 1.0;
      xp *= energyMultiplier;
    }

    // Apply task type multiplier
    if (taskData.task_type) {
      const typeMultiplier = XP_CONSTANTS.TYPE_MULTIPLIERS[taskData.task_type] || 1.0;
      xp *= typeMultiplier;
    }

    // Bonus for tasks with due dates (time management)
    if ('due_date' in taskData && taskData.due_date) {
      xp *= 1.1;
    }

    // Bonus for tasks with descriptions (planning)
    if (taskData.description && taskData.description.trim().length > 20) {
      xp *= 1.05;
    }

    return Math.round(xp);
  }

  /**
   * Calculate level from total XP
   */
  calculateLevelFromXP(totalXP: number): number {
    if (totalXP <= 0) return 1;
    
    let level = 1;
    let xpRequired = 0;
    
    while (xpRequired < totalXP) {
      xpRequired += this.getXPRequiredForLevel(level);
      if (xpRequired <= totalXP) {
        level++;
      }
    }
    
    return Math.max(1, level - 1);
  }

  /**
   * Get XP required for a specific level
   */
  getXPRequiredForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.round(XP_CONSTANTS.LEVEL_BASE * Math.pow(XP_CONSTANTS.LEVEL_MULTIPLIER, level - 2));
  }

  /**
   * Get total XP required to reach a specific level
   */
  getTotalXPForLevel(level: number): number {
    if (level <= 1) return 0;
    
    let totalXP = 0;
    for (let i = 2; i <= level; i++) {
      totalXP += this.getXPRequiredForLevel(i);
    }
    
    return totalXP;
  }

  /**
   * Get XP needed for next level
   */
  getXPForNextLevel(currentLevel: number): number {
    return this.getXPRequiredForLevel(currentLevel + 1);
  }

  /**
   * Get comprehensive level information
   */
  getLevelInfo(totalXP: number): LevelInfo {
    const currentLevel = this.calculateLevelFromXP(totalXP);
    const xpForCurrentLevel = this.getTotalXPForLevel(currentLevel);
    const xpForNextLevel = this.getTotalXPForLevel(currentLevel + 1);
    const xpToNextLevel = xpForNextLevel - totalXP;
    const progressPercentage = xpForNextLevel > xpForCurrentLevel 
      ? ((totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100
      : 100;

    return {
      currentLevel,
      currentXP: totalXP,
      xpForCurrentLevel,
      xpForNextLevel,
      xpToNextLevel: Math.max(0, xpToNextLevel),
      progressPercentage: Math.min(100, Math.max(0, progressPercentage))
    };
  }

  /**
   * Calculate bonus XP for streaks, achievements, etc.
   */
  calculateBonusXP(type: 'streak' | 'first_task' | 'daily_goal' | 'weekly_goal', value?: number): number {
    switch (type) {
      case 'streak':
        return Math.min(50, (value || 1) * 5); // Max 50 XP for streaks
      case 'first_task':
        return 25;
      case 'daily_goal':
        return 30;
      case 'weekly_goal':
        return 100;
      default:
        return 0;
    }
  }

  /**
   * Validate XP amount (prevent negative or excessive values)
   */
  validateXPAmount(amount: number): number {
    return Math.max(0, Math.min(1000, Math.round(amount))); // Max 1000 XP per transaction
  }

  /**
   * Create XP transaction record
   */
  createXPTransaction(
    amount: number, 
    reason: string, 
    type: XPTransaction['type'] = 'gain',
    taskId?: string,
    taskTitle?: string
  ): Omit<XPTransaction, 'id'> {
    return {
      amount: this.validateXPAmount(amount),
      reason,
      type,
      taskId,
      taskTitle,
      timestamp: new Date()
    };
  }

  /**
   * Get level progression milestones
   */
  getLevelMilestones(): Array<{ level: number; totalXP: number; title: string }> {
    return [
      { level: 5, totalXP: this.getTotalXPForLevel(5), title: "Principiante Motivato" },
      { level: 10, totalXP: this.getTotalXPForLevel(10), title: "Organizzatore Emergente" },
      { level: 15, totalXP: this.getTotalXPForLevel(15), title: "Maestro della Produttività" },
      { level: 20, totalXP: this.getTotalXPForLevel(20), title: "Guru dell'Efficienza" },
      { level: 25, totalXP: this.getTotalXPForLevel(25), title: "Leggenda ADHD" }
    ];
  }

  /**
   * Check if user reached a new milestone
   */
  checkMilestone(oldXP: number, newXP: number): { level: number; title: string } | null {
    const oldLevel = this.calculateLevelFromXP(oldXP);
    const newLevel = this.calculateLevelFromXP(newXP);
    
    if (newLevel > oldLevel) {
      const milestones = this.getLevelMilestones();
      const milestone = milestones.find(m => m.level === newLevel);
      if (milestone) {
        return { level: milestone.level, title: milestone.title };
      }
    }
    
    return null;
  }
}

// Export singleton instance
export const progressionService = ProgressionService.getInstance();
export default progressionService;