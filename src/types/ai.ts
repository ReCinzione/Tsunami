/**
 * Shared types for AI Service
 * Central reference for UI and AIService interactions
 */

import type { ADHDContext, Task, UserBehaviorPattern } from './chatbot';

/**
 * AI Model status information
 */
export interface AIModelStatus {
  isLoaded: boolean;
  isLoading: boolean;
  loadingProgress: number; // 0-100
  error: string | null;
  modelName: string;
  modelSize?: string;
  estimatedMemory?: string;
  supportsWebGPU?: boolean;
  platform: 'web' | 'native' | 'unknown';
}

/**
 * AI inference request structure
 */
export interface AIInferenceRequest {
  prompt: string;
  systemPrompt?: string;
  context?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/**
 * AI inference response structure
 */
export interface AIInferenceResponse {
  text: string;
  finishReason: 'stop' | 'length' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Parsed AI response with structured data
 */
export interface ParsedAIResponse {
  text: string;
  actions?: string[];
  microTasks?: MicroTask[];
  ritual?: Ritual;
  suggestions?: string[];
  nextSteps?: string[];
}

/**
 * Micro-task structure for task breakdown
 */
export interface MicroTask {
  id?: string;
  title: string;
  description?: string;
  duration: number; // minutes
  energy: 'basso' | 'medio' | 'alto';
  priority?: 'low' | 'medium' | 'high';
  timeOfDay?: 'mattina' | 'pomeriggio' | 'sera' | 'qualsiasi';
  prerequisites?: string[];
  estimatedDifficulty?: number; // 1-10
}

/**
 * Ritual structure for mood management
 */
export interface Ritual {
  id?: string;
  name: string;
  description?: string;
  steps: string[];
  duration: number; // minutes
  moodState: 'congelato' | 'disorientato' | 'in_flusso' | 'ispirato';
  energyRequired: 'basso' | 'medio' | 'alto';
  environment?: string; // e.g., "silenzioso", "con musica"
  materials?: string[]; // things needed
}

/**
 * Context data for AI requests
 */
export interface AIContextData {
  adhdContext?: ADHDContext;
  tasks?: Task[];
  projects?: any[];
  userBehavior?: UserBehaviorPattern;
  conversationHistory?: any[];
  currentTime?: Date;
  sessionData?: Record<string, any>;
  intent?: string;
}

/**
 * AI Service configuration
 */
export interface AIServiceConfig {
  modelName: string;
  maxRetries: number;
  timeout: number;
  fallbackEnabled: boolean;
  webGPURequired?: boolean;
  memoryLimit?: number; // MB
  cacheEnabled?: boolean;
}

/**
 * AI Service capabilities
 */
export interface AICapabilities {
  supportsWebGPU: boolean;
  supportsStreaming: boolean;
  supportsContextWindow: number;
  maxTokens: number;
  supportedLanguages: string[];
  platform: 'web' | 'native';
  requiresDownload: boolean;
  estimatedSize?: string;
}

/**
 * AI Service error types
 */
export type AIServiceError = 
  | 'MODEL_NOT_LOADED'
  | 'WEBGPU_NOT_SUPPORTED'
  | 'INSUFFICIENT_MEMORY'
  | 'NETWORK_ERROR'
  | 'INFERENCE_FAILED'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

/**
 * AI Service events
 */
export interface AIServiceEvents {
  'status-changed': AIModelStatus;
  'loading-progress': { progress: number; stage: string };
  'model-loaded': { modelName: string; capabilities: AICapabilities };
  'error': { error: AIServiceError; message: string; details?: any };
  'inference-start': { requestId: string };
  'inference-complete': { requestId: string; response: AIInferenceResponse };
}

/**
 * Task breakdown request
 */
export interface TaskBreakdownRequest {
  taskDescription: string;
  context: AIContextData;
  maxMicroTasks?: number;
  preferredDuration?: number; // minutes per micro-task
  difficultyLevel?: 'easy' | 'medium' | 'hard';
}

/**
 * Task breakdown response
 */
export interface TaskBreakdownResponse {
  microTasks: MicroTask[];
  estimatedTotalTime: number;
  difficulty: number; // 1-10
  recommendations: string[];
  energyDistribution: {
    basso: number;
    medio: number;
    alto: number;
  };
}

/**
 * Mood ritual request
 */
export interface MoodRitualRequest {
  moodState: 'congelato' | 'disorientato' | 'in_flusso' | 'ispirato';
  context: AIContextData;
  duration?: number; // preferred duration in minutes
  environment?: string;
}

/**
 * Mood ritual response
 */
export interface MoodRitualResponse {
  ritual: Ritual;
  alternatives?: Ritual[];
  explanation: string;
  expectedOutcome: string;
}

/**
 * Chat request
 */
export interface ChatRequest {
  message: string;
  context: AIContextData;
  conversationId?: string;
  expectActions?: boolean;
}

/**
 * Chat response
 */
export interface ChatResponse {
  message: string;
  actions?: string[];
  suggestions?: string[];
  mood?: string;
  energy?: number;
  followUpQuestions?: string[];
}

/**
 * AI Service interface for dependency injection
 */
export interface IAIService {
  loadModel(): Promise<void>;
  infer(request: AIInferenceRequest): Promise<AIInferenceResponse>;
  getStatus(): AIModelStatus;
  getCapabilities(): AICapabilities;
  isReady(): boolean;
  cleanup(): Promise<void>;
  
  // High-level methods
  chatbot(request: ChatRequest): Promise<ChatResponse>;
  breakdownTask(request: TaskBreakdownRequest): Promise<TaskBreakdownResponse>;
  suggestRitual(request: MoodRitualRequest): Promise<MoodRitualResponse>;
  
  // Event handling
  on<K extends keyof AIServiceEvents>(event: K, listener: (data: AIServiceEvents[K]) => void): void;
  off<K extends keyof AIServiceEvents>(event: K, listener: (data: AIServiceEvents[K]) => void): void;
}

/**
 * Privacy and compliance information
 */
export interface AIPrivacyInfo {
  isLocal: boolean;
  dataSharing: 'none' | 'anonymous' | 'identified';
  storageLocation: 'browser' | 'device' | 'cloud';
  encryptionEnabled: boolean;
  retentionPolicy: string;
  complianceStandards: string[];
}

/**
 * Fallback UI configuration
 */
export interface AIFallbackConfig {
  showWebGPUWarning: boolean;
  showBrowserCompatibility: boolean;
  showNativeAppPromotion: boolean;
  fallbackMessage: string;
  supportedBrowsers: string[];
  minimumVersions: Record<string, string>;
}