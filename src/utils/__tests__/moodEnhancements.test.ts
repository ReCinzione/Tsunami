import { describe, it, expect, beforeEach } from 'vitest';
import {
  enhanceResponseWithMoodContext,
  getMoodQuickActions,
  moodEnhancements
} from '../moodEnhancements';
import { MoodContext } from '../../types/chatbot';

describe('moodEnhancements', () => {
  describe('enhanceResponseWithMoodContext', () => {
    it('should enhance response for "disorientato" mood', () => {
      const baseResponse = 'Ecco alcuni suggerimenti per te';
      const moodContext: MoodContext = {
        mood: 'disorientato',
        suggested_ritual: 'Lista priorità',
        date: new Date('2025-01-21')
      };

      const enhanced = enhanceResponseWithMoodContext(baseResponse, moodContext);

      expect(enhanced).toContain('⚡');
      expect(enhanced).toContain('disorientato');
      expect(enhanced).toContain(baseResponse);
      expect(enhanced).toContain('Lista priorità');
    });

    it('should enhance response for "congelato" mood', () => {
      const baseResponse = 'Ciao!';
      const moodContext: MoodContext = {
        mood: 'congelato',
        suggested_ritual: 'Micro-task',
        date: new Date('2025-01-21')
      };

      const enhanced = enhanceResponseWithMoodContext(baseResponse, moodContext);

      expect(enhanced).toContain('🧊');
      expect(enhanced).toContain('congelato');
      expect(enhanced).toContain('Micro-task');
      expect(enhanced).toContain('piccoli passi');
    });

    it('should enhance response for "in_flusso" mood', () => {
      const baseResponse = 'Ottimo lavoro!';
      const moodContext: MoodContext = {
        mood: 'in_flusso',
        suggested_ritual: 'Protezione focus',
        date: new Date('2025-01-21')
      };

      const enhanced = enhanceResponseWithMoodContext(baseResponse, moodContext);

      expect(enhanced).toContain('🌊');
      expect(enhanced).toContain('flusso');
      expect(enhanced).toContain('Protezione focus');
      expect(enhanced).toContain('mantieni');
    });

    it('should enhance response for "ispirato" mood', () => {
      const baseResponse = 'Hai delle idee interessanti';
      const moodContext: MoodContext = {
        mood: 'ispirato',
        suggested_ritual: 'Cattura idee',
        date: new Date('2025-01-21')
      };

      const enhanced = enhanceResponseWithMoodContext(baseResponse, moodContext);

      expect(enhanced).toContain('✨');
      expect(enhanced).toContain('ispirato');
      expect(enhanced).toContain('Cattura idee');
      expect(enhanced).toContain('creatività');
    });

    it('should handle unknown mood gracefully', () => {
      const baseResponse = 'Test response';
      const moodContext: MoodContext = {
        mood: 'unknown_mood' as any,
        suggested_ritual: 'Test ritual',
        date: new Date('2025-01-21')
      };

      const enhanced = enhanceResponseWithMoodContext(baseResponse, moodContext);

      expect(enhanced).toContain(baseResponse);
      expect(enhanced).toContain('Test ritual');
    });

    it('should handle missing suggested_ritual', () => {
      const baseResponse = 'Test response';
      const moodContext: MoodContext = {
        mood: 'disorientato',
        date: new Date('2025-01-21')
      };

      const enhanced = enhanceResponseWithMoodContext(baseResponse, moodContext);

      expect(enhanced).toContain(baseResponse);
      expect(enhanced).toContain('⚡');
    });
  });

  describe('getMoodQuickActions', () => {
    it('should return quick actions for "disorientato" mood', () => {
      const actions = getMoodQuickActions('disorientato');

      expect(actions).toHaveLength(3);
      expect(actions[0].label).toBe('Lista 3 Priorità');
      expect(actions[0].action).toBe('create_task');
      expect(actions[0].priority).toBe('high');
      expect(actions[1].label).toBe('Brain Dump');
      expect(actions[2].label).toBe('Pausa Strategica');
    });

    it('should return quick actions for "congelato" mood', () => {
      const actions = getMoodQuickActions('congelato');

      expect(actions).toHaveLength(3);
      expect(actions[0].label).toBe('Micro-Task (2 min)');
      expect(actions[0].action).toBe('create_task');
      expect(actions[0].priority).toBe('high');
    });

    it('should return quick actions for "in_flusso" mood', () => {
      const actions = getMoodQuickActions('in_flusso');

      expect(actions).toHaveLength(3);
      expect(actions[0].label).toBe('Proteggi Focus');
      expect(actions[0].action).toBe('start_focus_session');
      expect(actions[0].priority).toBe('high');
    });

    it('should return quick actions for "ispirato" mood', () => {
      const actions = getMoodQuickActions('ispirato');

      expect(actions).toHaveLength(3);
      expect(actions[0].label).toBe('Cattura Idee');
      expect(actions[0].action).toBe('open_mental_inbox');
      expect(actions[0].priority).toBe('high');
    });

    it('should return empty array for unknown mood', () => {
      const actions = getMoodQuickActions('unknown_mood' as any);

      expect(actions).toHaveLength(0);
    });

    it('should return actions with correct structure', () => {
      const actions = getMoodQuickActions('disorientato');

      actions.forEach(action => {
        expect(action).toHaveProperty('id');
        expect(action).toHaveProperty('label');
        expect(action).toHaveProperty('action');
        expect(action).toHaveProperty('icon');
        expect(action).toHaveProperty('priority');
        expect(typeof action.id).toBe('string');
        expect(typeof action.label).toBe('string');
        expect(['high', 'medium', 'low']).toContain(action.priority);
      });
    });
  });

  describe('moodEnhancements object', () => {
    it('should have enhancements for all supported moods', () => {
      const supportedMoods = ['congelato', 'disorientato', 'in_flusso', 'ispirato'];
      
      supportedMoods.forEach(mood => {
        expect(moodEnhancements).toHaveProperty(mood);
        expect(moodEnhancements[mood]).toHaveProperty('prefix');
        expect(moodEnhancements[mood]).toHaveProperty('suggestions');
        expect(moodEnhancements[mood]).toHaveProperty('quickActions');
      });
    });

    it('should have consistent structure for all mood enhancements', () => {
      Object.values(moodEnhancements).forEach(enhancement => {
        expect(enhancement).toHaveProperty('prefix');
        expect(enhancement).toHaveProperty('suggestions');
        expect(enhancement).toHaveProperty('quickActions');
        expect(typeof enhancement.prefix).toBe('string');
        expect(Array.isArray(enhancement.suggestions)).toBe(true);
        expect(Array.isArray(enhancement.quickActions)).toBe(true);
      });
    });

    it('should have non-empty suggestions for all moods', () => {
      Object.values(moodEnhancements).forEach(enhancement => {
        expect(enhancement.suggestions.length).toBeGreaterThan(0);
        enhancement.suggestions.forEach(suggestion => {
          expect(typeof suggestion).toBe('string');
          expect(suggestion.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have valid quick actions for all moods', () => {
      Object.values(moodEnhancements).forEach(enhancement => {
        expect(enhancement.quickActions.length).toBeGreaterThan(0);
        enhancement.quickActions.forEach(action => {
          expect(action).toHaveProperty('id');
          expect(action).toHaveProperty('label');
          expect(action).toHaveProperty('action');
          expect(action).toHaveProperty('priority');
          expect(['high', 'medium', 'low']).toContain(action.priority);
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty base response', () => {
      const moodContext: MoodContext = {
        mood: 'disorientato',
        suggested_ritual: 'Test',
        date: new Date()
      };

      const enhanced = enhanceResponseWithMoodContext('', moodContext);

      expect(enhanced).toContain('⚡');
      expect(enhanced.length).toBeGreaterThan(0);
    });

    it('should handle very long base response', () => {
      const longResponse = 'A'.repeat(1000);
      const moodContext: MoodContext = {
        mood: 'congelato',
        suggested_ritual: 'Test',
        date: new Date()
      };

      const enhanced = enhanceResponseWithMoodContext(longResponse, moodContext);

      expect(enhanced).toContain(longResponse);
      expect(enhanced).toContain('🧊');
    });

    it('should handle special characters in suggested_ritual', () => {
      const moodContext: MoodContext = {
        mood: 'disorientato',
        suggested_ritual: 'Test & <script>alert("xss")</script>',
        date: new Date()
      };

      const enhanced = enhanceResponseWithMoodContext('Test', moodContext);

      expect(enhanced).toContain('Test & <script>alert("xss")</script>');
      expect(enhanced).toContain('⚡');
    });
  });
});