import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateMoodTaskScore,
  calculateBaseTaskScore,
  predictOptimalTasksWithMood,
  getMoodBasedStrategicSuggestion,
  getContextualSuggestions
} from '../taskSuggestions';
import { Task, UserBehaviorPattern, MoodType, EnergyLevel } from '../../types/adhd';

describe('taskSuggestions', () => {
  let mockTasks: Task[];
  let mockUserPattern: UserBehaviorPattern;

  beforeEach(() => {
    mockTasks = [
      {
        id: '1',
        title: 'Creative Writing',
        type: 'creative',
        priority: 'high',
        status: 'pending',
        energyRequired: 7,
        focusRequired: 'high',
        estimatedDuration: 60,
        tags: ['writing', 'creative'],
        deadline: new Date(Date.now() + 86400000), // tomorrow
        moodBoost: 8,
        overwhelmRisk: 3
      },
      {
        id: '2',
        title: 'Data Analysis',
        type: 'analytical',
        priority: 'medium',
        status: 'pending',
        energyRequired: 8,
        focusRequired: 'high',
        estimatedDuration: 90,
        tags: ['analysis', 'data'],
        moodBoost: 5,
        overwhelmRisk: 7
      },
      {
        id: '3',
        title: 'Email Cleanup',
        type: 'routine',
        priority: 'low',
        status: 'pending',
        energyRequired: 3,
        focusRequired: 'low',
        estimatedDuration: 30,
        tags: ['email', 'cleanup'],
        moodBoost: 3,
        overwhelmRisk: 2
      },
      {
        id: '4',
        title: 'Team Meeting',
        type: 'social',
        priority: 'high',
        status: 'pending',
        energyRequired: 6,
        focusRequired: 'medium',
        estimatedDuration: 45,
        tags: ['meeting', 'team'],
        deadline: new Date(Date.now() + 3600000), // 1 hour
        moodBoost: 6,
        overwhelmRisk: 4
      }
    ];

    mockUserPattern = {
      preferredTaskTypes: ['creative', 'analytical'],
      averageSessionDuration: 45,
      peakEnergyHours: [9, 10, 11],
      lowEnergyHours: [14, 15],
      completionRate: 0.75,
      procrastinationTriggers: ['routine', 'administrative'],
      motivationalFactors: ['deadline', 'creativity', 'challenge']
    };
  });

  describe('calculateMoodTaskScore', () => {
    it('should calculate higher score for creative tasks when inspired', () => {
      const creativeTask = mockTasks[0]; // Creative Writing
      const routineTask = mockTasks[2]; // Email Cleanup

      const creativeScore = calculateMoodTaskScore(creativeTask, 'ispirato', 8);
      const routineScore = calculateMoodTaskScore(routineTask, 'ispirato', 8);

      expect(creativeScore).toBeGreaterThan(routineScore);
    });

    it('should calculate higher score for routine tasks when energy is low', () => {
      const creativeTask = mockTasks[0]; // Creative Writing (high energy required)
      const routineTask = mockTasks[2]; // Email Cleanup (low energy required)

      const creativeScore = calculateMoodTaskScore(creativeTask, 'congelato', 2);
      const routineScore = calculateMoodTaskScore(routineTask, 'congelato', 2);

      expect(routineScore).toBeGreaterThan(creativeScore);
    });

    it('should boost analytical tasks when in flow state', () => {
      const analyticalTask = mockTasks[1]; // Data Analysis
      const socialTask = mockTasks[3]; // Team Meeting

      const analyticalScore = calculateMoodTaskScore(analyticalTask, 'in_flusso', 9);
      const socialScore = calculateMoodTaskScore(socialTask, 'in_flusso', 9);

      expect(analyticalScore).toBeGreaterThan(socialScore);
    });

    it('should penalize high overwhelm risk tasks when disorientated', () => {
      const highOverwhelmTask = mockTasks[1]; // Data Analysis (overwhelm risk 7)
      const lowOverwhelmTask = mockTasks[2]; // Email Cleanup (overwhelm risk 2)

      const highScore = calculateMoodTaskScore(highOverwhelmTask, 'disorientato', 5);
      const lowScore = calculateMoodTaskScore(lowOverwhelmTask, 'disorientato', 5);

      expect(lowScore).toBeGreaterThan(highScore);
    });

    it('should return score between 0 and 100', () => {
      mockTasks.forEach(task => {
        const score = calculateMoodTaskScore(task, 'disorientato', 5);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('calculateBaseTaskScore', () => {
    it('should prioritize high priority tasks', () => {
      const highPriorityTask = mockTasks[0]; // priority: 'high'
      const lowPriorityTask = mockTasks[2]; // priority: 'low'

      const highScore = calculateBaseTaskScore(highPriorityTask, mockUserPattern);
      const lowScore = calculateBaseTaskScore(lowPriorityTask, mockUserPattern);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it('should boost tasks with approaching deadlines', () => {
      const urgentTask = mockTasks[3]; // deadline in 1 hour
      const normalTask = mockTasks[0]; // deadline tomorrow

      const urgentScore = calculateBaseTaskScore(urgentTask, mockUserPattern);
      const normalScore = calculateBaseTaskScore(normalTask, mockUserPattern);

      expect(urgentScore).toBeGreaterThan(normalScore);
    });

    it('should boost preferred task types', () => {
      const preferredTask = mockTasks[0]; // creative (in preferred types)
      const nonPreferredTask = mockTasks[2]; // routine (not in preferred types)

      const preferredScore = calculateBaseTaskScore(preferredTask, mockUserPattern);
      const nonPreferredScore = calculateBaseTaskScore(nonPreferredTask, mockUserPattern);

      expect(preferredScore).toBeGreaterThan(nonPreferredScore);
    });

    it('should return score between 0 and 100', () => {
      mockTasks.forEach(task => {
        const score = calculateBaseTaskScore(task, mockUserPattern);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('predictOptimalTasksWithMood', () => {
    it('should return requested number of tasks', () => {
      const result = predictOptimalTasksWithMood(
        mockTasks,
        'disorientato',
        5,
        mockUserPattern,
        2
      );

      expect(result).toHaveLength(2);
    });

    it('should return tasks sorted by score (highest first)', () => {
      const result = predictOptimalTasksWithMood(
        mockTasks,
        'ispirato',
        8,
        mockUserPattern,
        3
      );

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
      }
    });

    it('should include score and reasoning in results', () => {
      const result = predictOptimalTasksWithMood(
        mockTasks,
        'in_flusso',
        9,
        mockUserPattern,
        1
      );

      expect(result[0]).toHaveProperty('task');
      expect(result[0]).toHaveProperty('score');
      expect(result[0]).toHaveProperty('reasoning');
      expect(typeof result[0].score).toBe('number');
      expect(typeof result[0].reasoning).toBe('string');
    });

    it('should filter out completed tasks', () => {
      const tasksWithCompleted = [
        ...mockTasks,
        {
          ...mockTasks[0],
          id: '5',
          status: 'completed' as const
        }
      ];

      const result = predictOptimalTasksWithMood(
        tasksWithCompleted,
        'disorientato',
        5,
        mockUserPattern,
        10
      );

      expect(result.every(r => r.task.status !== 'completed')).toBe(true);
    });

    it('should handle empty task list', () => {
      const result = predictOptimalTasksWithMood(
        [],
        'disorientato',
        5,
        mockUserPattern,
        3
      );

      expect(result).toHaveLength(0);
    });

    it('should handle limit greater than available tasks', () => {
      const result = predictOptimalTasksWithMood(
        mockTasks,
        'disorientato',
        5,
        mockUserPattern,
        10
      );

      expect(result.length).toBeLessThanOrEqual(mockTasks.length);
    });
  });

  describe('getMoodBasedStrategicSuggestion', () => {
    it('should return appropriate suggestion for each mood', () => {
      const moods: MoodType[] = ['congelato', 'disorientato', 'in_flusso', 'ispirato'];
      
      moods.forEach(mood => {
        const suggestion = getMoodBasedStrategicSuggestion(mood, 5);
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });

    it('should include energy-specific advice for low energy', () => {
      const suggestion = getMoodBasedStrategicSuggestion('congelato', 2);
      expect(suggestion.toLowerCase()).toMatch(/micro|piccol|semplice|facile/);
    });

    it('should include energy-specific advice for high energy', () => {
      const suggestion = getMoodBasedStrategicSuggestion('ispirato', 9);
      expect(suggestion.toLowerCase()).toMatch(/sfrutt|massimizz|approfitta/);
    });

    it('should handle unknown mood gracefully', () => {
      const suggestion = getMoodBasedStrategicSuggestion('unknown' as any, 5);
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  });

  describe('getContextualSuggestions', () => {
    it('should return array of suggestions', () => {
      const suggestions = getContextualSuggestions(
        mockTasks,
        'disorientato',
        5,
        mockUserPattern
      );

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should include different types of suggestions', () => {
      const suggestions = getContextualSuggestions(
        mockTasks,
        'disorientato',
        5,
        mockUserPattern
      );

      // Should have at least one suggestion
      expect(suggestions.length).toBeGreaterThan(0);
      
      // All suggestions should be strings
      suggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });

    it('should provide overwhelm warning when many high-priority tasks', () => {
      const highPriorityTasks = mockTasks.map(task => ({
        ...task,
        priority: 'high' as const
      }));

      const suggestions = getContextualSuggestions(
        highPriorityTasks,
        'disorientato',
        3,
        mockUserPattern
      );

      const hasOverwhelmWarning = suggestions.some(s => 
        s.toLowerCase().includes('sopraffatt') || 
        s.toLowerCase().includes('tropp') ||
        s.toLowerCase().includes('priorit')
      );

      expect(hasOverwhelmWarning).toBe(true);
    });

    it('should suggest breaks for low energy', () => {
      const suggestions = getContextualSuggestions(
        mockTasks,
        'congelato',
        2,
        mockUserPattern
      );

      const hasBreakSuggestion = suggestions.some(s => 
        s.toLowerCase().includes('pausa') || 
        s.toLowerCase().includes('riposo') ||
        s.toLowerCase().includes('energia')
      );

      expect(hasBreakSuggestion).toBe(true);
    });

    it('should handle empty task list', () => {
      const suggestions = getContextualSuggestions(
        [],
        'disorientato',
        5,
        mockUserPattern
      );

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('integration tests', () => {
    it('should provide consistent results across multiple calls', () => {
      const result1 = predictOptimalTasksWithMood(
        mockTasks,
        'ispirato',
        8,
        mockUserPattern,
        2
      );
      
      const result2 = predictOptimalTasksWithMood(
        mockTasks,
        'ispirato',
        8,
        mockUserPattern,
        2
      );

      expect(result1).toEqual(result2);
    });

    it('should handle edge case with very high energy and creative mood', () => {
      const result = predictOptimalTasksWithMood(
        mockTasks,
        'ispirato',
        10,
        mockUserPattern,
        3
      );

      // Should prioritize creative tasks
      const creativeTask = result.find(r => r.task.type === 'creative');
      expect(creativeTask).toBeDefined();
      expect(creativeTask!.score).toBeGreaterThan(50);
    });

    it('should handle edge case with very low energy and overwhelmed mood', () => {
      const result = predictOptimalTasksWithMood(
        mockTasks,
        'congelato',
        1,
        mockUserPattern,
        3
      );

      // Should prioritize low-energy, low-overwhelm tasks
      const topTask = result[0];
      expect(topTask.task.energyRequired).toBeLessThanOrEqual(5);
      expect(topTask.task.overwhelmRisk || 0).toBeLessThanOrEqual(5);
    });
  });
});