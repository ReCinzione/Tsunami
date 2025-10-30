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
   * Calculate level from total XP (using Supabase logic)
   */
  calculateLevelFromXP(totalXP: number): number {
    if (totalXP <= 0) return 1;
    
    // Use the same thresholds as Supabase
    if (totalXP >= 11500) return 10;
    if (totalXP >= 10500) return 9;
    if (totalXP >= 7800) return 8;
    if (totalXP >= 5600) return 7;
    if (totalXP >= 3850) return 6;
    if (totalXP >= 2500) return 5;
    if (totalXP >= 1500) return 4;
    if (totalXP >= 800) return 3;
    if (totalXP >= 350) return 2;
    if (totalXP >= 100) return 1;
    
    return 1;
  }

  /**
   * Get XP required for a specific level (using Supabase logic)
   */
  getXPRequiredForLevel(level: number): number {
    // Use the same logic as Supabase calculate_xp_for_level function
    const xpTable: { [key: number]: number } = {
      1: 0,
      2: 100,   // Level 1 to 2: 100 XP
      3: 150,   // Level 2 to 3: 150 XP  
      4: 200,   // Level 3 to 4: 200 XP
      5: 250,   // Level 4 to 5: 250 XP
      6: 350,   // Level 5 to 6: 350 XP
      7: 450,   // Level 6 to 7: 450 XP
      8: 550,   // Level 7 to 8: 550 XP
      9: 700,   // Level 8 to 9: 700 XP
      10: 1000  // Level 9 to 10: 1000 XP
    };
    return xpTable[level] || 0;
  }

  /**
   * Get total XP required to reach a specific level (using Supabase logic)
   */
  getTotalXPForLevel(level: number): number {
    // Use the same cumulative XP as Supabase
    const totalXpTable: { [key: number]: number } = {
      1: 100,
      2: 350,   // 100 + 250
      3: 800,   // 350 + 450
      4: 1500,  // 800 + 700
      5: 2500,  // 1500 + 1000
      6: 3850,  // 2500 + 1350
      7: 5600,  // 3850 + 1750
      8: 7800,  // 5600 + 2200
      9: 10500, // 7800 + 2700
      10: 11500 // 10500 + 1000
    };
    return totalXpTable[level] || 0;
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