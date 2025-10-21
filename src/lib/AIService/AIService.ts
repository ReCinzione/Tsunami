/**
 * AI Service Interface
 * Abstract interface for AI inference services
 */

import type {
  AIModelStatus,
  AIInferenceRequest,
  AIInferenceResponse,
  AICapabilities,
  AIServiceEvents,
  ChatRequest,
  ChatResponse,
  TaskBreakdownRequest,
  TaskBreakdownResponse,
  MoodRitualRequest,
  MoodRitualResponse,
  AIPrivacyInfo
} from '@/types/ai';

/**
 * Abstract AIService class
 * Base implementation for all AI services
 */
export abstract class AIService {
  protected status: AIModelStatus = {
    isLoaded: false,
    isLoading: false,
    loadingProgress: 0,
    error: null,
    modelName: '',
    platform: 'unknown'
  };

  protected eventListeners: Map<keyof AIServiceEvents, Function[]> = new Map();

  /**
   * Load the AI model
   */
  abstract loadModel(): Promise<void>;

  /**
   * Perform AI inference
   */
  abstract infer(request: AIInferenceRequest): Promise<AIInferenceResponse>;

  /**
   * Get current model status
   */
  getStatus(): AIModelStatus {
    return { ...this.status };
  }

  /**
   * Get AI capabilities
   */
  abstract getCapabilities(): AICapabilities;

  /**
   * Get privacy information
   */
  abstract getPrivacyInfo(): AIPrivacyInfo;

  /**
   * Check if model is ready for inference
   */
  isReady(): boolean {
    return this.status.isLoaded && !this.status.error;
  }

  /**
   * High-level chatbot interaction
   */
  abstract chatbot(request: ChatRequest): Promise<ChatResponse>;

  /**
   * Task breakdown functionality
   */
  abstract breakdownTask(request: TaskBreakdownRequest): Promise<TaskBreakdownResponse>;

  /**
   * Mood ritual suggestions
   */
  abstract suggestRitual(request: MoodRitualRequest): Promise<MoodRitualResponse>;

  /**
   * Event handling
   */
  on<K extends keyof AIServiceEvents>(event: K, listener: (data: AIServiceEvents[K]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off<K extends keyof AIServiceEvents>(event: K, listener: (data: AIServiceEvents[K]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  protected emit<K extends keyof AIServiceEvents>(event: K, data: AIServiceEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  /**
   * Update status and emit event
   */
  protected updateStatus(updates: Partial<AIModelStatus>): void {
    this.status = { ...this.status, ...updates };
    this.emit('status-changed', this.status);
  }

  /**
   * Cleanup resources
   */
  abstract cleanup(): Promise<void>;
}