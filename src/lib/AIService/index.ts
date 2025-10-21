/**
 * AI Service Module - Centralized exports
 * 
 * This module provides a unified interface for AI services including:
 * - Abstract AIService base class
 * - WebLLM implementation for browser-based inference
 * - Native LLM implementation for mobile/desktop apps
 * - Factory for automatic service selection
 * - Context builder for prompt engineering
 */

// Core interfaces and base classes
export { AIService } from './AIService';
export type { 
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
} from '../../types/ai';

// Service implementations
export { WebLLMService } from './WebLLMService';
export { NativeLLMService } from './NativeLLMService';

// Factory and utilities
export { AIServiceFactory } from './AIServiceFactory';
export { ContextBuilder } from './ContextBuilder';

// Re-export types for convenience
export type {
  AIServiceConfig,
  AIContextData,
  ParsedAIResponse,
  MicroTask,
  Ritual,
  AIServiceError,
  AIFallbackConfig
} from '../../types/ai';

/**
 * Quick factory function to get AI service instance
 * 
 * @example
 * ```typescript
 * import { createAIService } from '@/lib/AIService';
 * 
 * const aiService = await createAIService();
 * const response = await aiService.chatbot({
 *   message: 'Aiutami con le mie task',
 *   context: { intent: 'task_help' }
 * });
 * ```
 */
export async function createAIService(config?: {
  preferNative?: boolean;
  fallbackToWeb?: boolean;
}) {
  try {
    // Import dinamico per evitare problemi di bundling
    const { AIServiceFactory } = await import('./AIServiceFactory');
    return AIServiceFactory.getInstance(config);
  } catch (error) {
    console.error('Failed to create AI service:', error);
    throw error;
  }
}

/**
 * Check if current environment supports AI inference
 * 
 * @returns boolean - true if WebGPU or native bridge available
 */
export async function isAISupported(): Promise<boolean> {
  try {
    console.log('🔍 Chiamata AIServiceFactory.isSupported()...');
    // Import dinamico per evitare problemi di bundling
    const { AIServiceFactory } = await import('./AIServiceFactory');
    const support = AIServiceFactory.isSupported();
    console.log('📋 Risultato supporto AI:', support);
    return support.supported;
  } catch (error) {
    console.warn('❌ AIServiceFactory not available:', error);
    console.warn('❌ Fallback: controllo manuale WebGPU...');
    
    // Fallback: controllo manuale delle capabilities
    if (typeof window === 'undefined') {
      console.log('🖥️ Ambiente server-side - AI non supportato');
      return false;
    }
    
    const hasWebGPU = 'gpu' in navigator;
    console.log('🎮 WebGPU disponibile (fallback):', hasWebGPU);
    return hasWebGPU;
  }
}

/**
 * Get environment capabilities without creating service instance
 * 
 * @returns Promise<AICapabilities> - capabilities of current environment
 */
export async function getAICapabilities() {
  try {
    // Import dinamico per evitare problemi di bundling
    const { AIServiceFactory } = await import('./AIServiceFactory');
    return AIServiceFactory.getCapabilities();
  } catch (error) {
    console.warn('Failed to get AI capabilities:', error);
    return {
      supportsChat: false,
      supportsTaskBreakdown: false,
      supportsRituals: false,
      maxTokens: 0,
      supportedModels: [],
      requiresInternet: true
    };
  }
}

/**
 * Get fallback configuration for unsupported environments
 * 
 * @returns AIFallbackConfig - UI configuration for fallback scenarios
 */
export async function getAIFallbackConfig() {
  try {
    // Import dinamico per evitare problemi di bundling
    const { AIServiceFactory } = await import('./AIServiceFactory');
    return AIServiceFactory.getFallbackConfig();
  } catch (error) {
    console.warn('Failed to get AI fallback config:', error);
    return {
      showFallbackUI: true,
      fallbackMessage: 'AI features are temporarily unavailable',
      suggestedActions: ['Please refresh the page', 'Try again later']
    };
  }
}