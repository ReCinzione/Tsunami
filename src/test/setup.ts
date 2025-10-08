import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Estende expect con matchers di jest-dom
expect.extend(matchers);

// Cleanup dopo ogni test
afterEach(() => {
  cleanup();
});

// Mock di localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

vi.stubGlobal('localStorage', localStorageMock);

// Mock di sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

vi.stubGlobal('sessionStorage', sessionStorageMock);

// Mock di window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock di ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock di IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock di console per test più puliti (opzionale)
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock di Date per test deterministici
const mockDate = new Date('2025-01-21T10:00:00.000Z');
vi.setSystemTime(mockDate);

// Utility per reset dei mock tra test
export const resetAllMocks = () => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
};

// Mock factories per oggetti comuni
export const createMockTask = (overrides = {}) => ({
  id: 'test-task-1',
  title: 'Test Task',
  type: 'creative' as const,
  priority: 'medium' as const,
  status: 'pending' as const,
  energyRequired: 5,
  focusRequired: 'medium' as const,
  estimatedDuration: 30,
  tags: ['test'],
  moodBoost: 5,
  overwhelmRisk: 3,
  ...overrides
});

export const createMockUserPattern = (overrides = {}) => ({
  preferredTaskTypes: ['creative', 'analytical'],
  averageSessionDuration: 45,
  peakEnergyHours: [9, 10, 11],
  lowEnergyHours: [14, 15],
  completionRate: 0.75,
  procrastinationTriggers: ['routine'],
  motivationalFactors: ['deadline', 'creativity'],
  ...overrides
});

export const createMockChatMessage = (overrides = {}) => ({
  id: 'test-message-1',
  text: 'Test message',
  sender: 'user' as const,
  timestamp: new Date(),
  ...overrides
});

export const createMockMoodContext = (overrides = {}) => ({
  mood: 'disorientato' as const,
  suggested_ritual: 'Test ritual',
  date: new Date(),
  ...overrides
});

// Helper per test asincroni
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper per simulare eventi utente
export const simulateUserEvent = {
  click: (element: HTMLElement) => {
    element.click();
  },
  type: (element: HTMLInputElement, text: string) => {
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  },
  keyPress: (element: HTMLElement, key: string) => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  }
};

// Mock per analytics (evita chiamate durante i test)
vi.mock('../utils/analytics', () => ({
  analytics: {
    track: vi.fn(),
    trackChatbotInteraction: vi.fn(),
    trackQuickAction: vi.fn(),
    trackMoodChange: vi.fn(),
    trackError: vi.fn(),
    getInsights: vi.fn(() => ({
      getMoodPatterns: vi.fn(() => ({
        mostCommonMood: 'disorientato',
        moodDistribution: {},
        moodTransitions: []
      })),
      getChatbotEffectiveness: vi.fn(() => ({
        averageResponseTime: 100,
        averageSatisfaction: 4,
        mostCommonIntents: [],
        quickActionUsageRate: 50
      })),
      getProductivityMetrics: vi.fn(() => ({
        averageFocusSessionDuration: 30,
        focusSessionCompletionRate: 80,
        averageProductivityRating: 4,
        bestFocusTimes: ['09:00-10:00']
      }))
    })),
    setEnabled: vi.fn(),
    exportData: vi.fn(() => '{"test": true}')
  },
  useAnalytics: () => ({
    track: vi.fn(),
    trackChatbotInteraction: vi.fn(),
    trackQuickAction: vi.fn(),
    trackMoodChange: vi.fn(),
    trackError: vi.fn(),
    getInsights: vi.fn(),
    setEnabled: vi.fn(),
    exportData: vi.fn()
  })
}));

// Mock per componenti pesanti (se necessario)
// vi.mock('../components/SomeHeavyComponent', () => ({
//   default: () => <div data-testid="mocked-heavy-component">Mocked Component</div>
// }));

console.log('🧪 Test setup completato - Vitest + React Testing Library + Jest-DOM');