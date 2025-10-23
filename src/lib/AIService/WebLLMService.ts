/**
 * WebLLM-based AI Service Implementation
 * Handles in-browser AI inference using WebLLM
 */

import { AIService } from './AIService';
import { ContextBuilder } from './ContextBuilder';
import { aiErrorHandler, AIServiceError } from './AIErrorHandler';
import type {
  AIInferenceRequest,
  AIInferenceResponse,
  AICapabilities,
  AIPrivacyInfo,
  ChatRequest,
  ChatResponse,
  TaskBreakdownRequest,
  TaskBreakdownResponse,
  MoodRitualRequest,
  MoodRitualResponse
} from '@/types/ai';

// Mock WebLLM types for development
interface MockWebLLMEngine {
  reload(modelId: string, chatOpts?: any, appConfig?: any): Promise<void>;
  chat(messages: any[], genConfig?: any, requestId?: string): Promise<string>;
  runtimeStatsText(): string;
  interruptGenerate(): void;
  unload(): Promise<void>;
  setInitProgressCallback?: (callback: (progress: any) => void) => void;
}

// Mock WebLLM for now - will be replaced with actual import
class MockWebLLMEngine implements MockWebLLMEngine {
  async reload(modelId: string): Promise<void> {
    // Simulate model loading
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async chat(messages: any[], genConfig?: any, requestId?: string): Promise<string> {
    // Mock response - will be replaced with actual WebLLM
    await new Promise(resolve => setTimeout(resolve, 1000));
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage?.content || '';
    return this.generateMockResponse(prompt);
  }

  runtimeStatsText(): string {
    return 'Mock WebLLM Stats: Ready';
  }

  interruptGenerate(): void {
    // Mock interrupt
  }

  async unload(): Promise<void> {
    // Mock cleanup
  }

  private generateMockResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 12 ? 'mattina' : currentHour < 17 ? 'pomeriggio' : currentHour < 21 ? 'sera' : 'notte';
    
    // Gestione saluti più naturale
    if (lowerPrompt.includes('ciao') || lowerPrompt.includes('salve') || lowerPrompt.includes('buongiorno') || lowerPrompt.includes('buonasera')) {
      const greetings = {
        mattina: [
          "Ciao! ☀️ Buongiorno! Come ti senti oggi? Pronto per affrontare la giornata?",
          "Ehi, ciao! 🌅 Che energia hai stamattina? Vediamo cosa possiamo fare insieme!",
          "Ciao! 😊 Buongiorno! Come iniziamo questa giornata nel modo migliore?"
        ],
        pomeriggio: [
          "Ciao! 👋 Come va il pomeriggio? Come ti senti con l'energia?",
          "Ehi, ciao! ☀️ Come procede la giornata? Posso aiutarti con qualcosa?",
          "Ciao! 😊 Buon pomeriggio! Dimmi, come stai andando oggi?"
        ],
        sera: [
          "Ciao! 🌆 Buonasera! Come è andata la giornata?",
          "Ehi, ciao! 🌙 Come ti senti stasera? Vuoi fare il punto della giornata?",
          "Ciao! 😊 Buonasera! Rilassiamoci un po', come posso aiutarti?"
        ],
        notte: [
          "Ciao! 🌙 Ancora sveglio? Come posso aiutarti?",
          "Ehi, ciao! ✨ Notte fonda... tutto ok? Dimmi come stai.",
          "Ciao! 😊 Ciao nottambulo! Come posso supportarti?"
        ]
      };
      const timeGreetings = greetings[timeOfDay as keyof typeof greetings];
      return timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
    }
    
    // Gestione task più specifica
    if (lowerPrompt.includes('task') || lowerPrompt.includes('attività') || lowerPrompt.includes('lavoro')) {
      const taskResponses = [
        'Perfetto! Posso aiutarti con le tue task. Vuoi che iniziamo spezzando il lavoro in micro-task gestibili?',
        'Ottimo! Vedo che vuoi lavorare sulle task. Quale ti preoccupa di più in questo momento?',
        'Bene! Affrontiamo le tue attività. Preferisci iniziare da quelle più urgenti o da quelle più facili?'
      ];
      return taskResponses[Math.floor(Math.random() * taskResponses.length)];
    }
    
    // Gestione energia più contestuale
    if (lowerPrompt.includes('energia') || lowerPrompt.includes('stanco') || lowerPrompt.includes('carico')) {
      const energyResponses = [
        'Capisco che la gestione dell\'energia è importante. Come ti senti in questo momento? Proviamo con task adatte al tuo livello energetico.',
        'L\'energia è fondamentale per la produttività ADHD. Dimmi, su una scala da 1 a 10, come ti senti ora?',
        'Perfetto che tu sia consapevole della tua energia! Questo è il primo passo per una gestione efficace delle attività.'
      ];
      return energyResponses[Math.floor(Math.random() * energyResponses.length)];
    }
    
    // Gestione focus
    if (lowerPrompt.includes('focus') || lowerPrompt.includes('concentr') || lowerPrompt.includes('distraz')) {
      const focusResponses = [
        'Il focus è una sfida comune per chi ha l\'ADHD. Ti suggerisco di attivare la modalità Focus per eliminare le distrazioni.',
        'Capisco le difficoltà di concentrazione. Proviamo con la tecnica del Pomodoro: 25 minuti di focus intenso, poi pausa.',
        'La concentrazione è un muscolo che si allena! Iniziamo con sessioni brevi ma intense. Quale task vuoi provare?'
      ];
      return focusResponses[Math.floor(Math.random() * focusResponses.length)];
    }
    
    // Gestione motivazione
    if (lowerPrompt.includes('motivaz') || lowerPrompt.includes('scoragg') || lowerPrompt.includes('non ce la faccio')) {
      const motivationResponses = [
        'Ti capisco, a volte può sembrare tutto troppo difficile. Ma sei qui, e questo dimostra che non ti arrendi mai! 💪',
        'I momenti difficili fanno parte del percorso ADHD. Ricorda: ogni piccolo passo conta. Cosa possiamo fare insieme ora?',
        'La motivazione va e viene, è normale. L\'importante è avere strategie per quando manca. Parliamone insieme!'
      ];
      return motivationResponses[Math.floor(Math.random() * motivationResponses.length)];
    }
    
    // Risposta generica migliorata
    const genericResponses = [
      'Ti ascolto! Dimmi di più, così posso aiutarti nel modo migliore. 🤗',
      'Interessante! Come posso supportarti in questo momento? Sono qui per te.',
      'Capisco. Affrontiamo insieme quello che ti preoccupa. Da dove vuoi iniziare?',
      'Perfetto che tu mi abbia scritto! Qual è la cosa più importante su cui posso aiutarti ora?'
    ];
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  }
}

export interface WebLLMConfig {
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  useWebGPU?: boolean;
}

/**
 * WebLLM-based AI service for in-browser inference
 */
export class WebLLMService extends AIService {
  private engine: MockWebLLMEngine | null = null;
  private modelConfig = {
    modelId: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    temperature: 0.7,
    maxTokens: 512
  };

  constructor() {
    super();
    this.updateStatus({
      isLoaded: false,
      isLoading: false,
      loadingProgress: 0,
      error: null,
      modelName: this.modelConfig.modelId,
      platform: 'web',
      supportsWebGPU: this.checkWebGPUSupport()
    });
  }

  /**
   * Check if WebGPU is supported in current browser
   */
  private checkWebGPUSupport(): boolean {
    try {
      return 'gpu' in navigator;
    } catch (error) {
      console.warn('WebGPU not supported:', error);
      return false;
    }
  }

  /**
   * Load WebLLM model with retry logic
   */
  async loadModel(): Promise<void> {
    if (this.status.isLoaded) return;

    // Check WebGPU support first
    if (!this.checkWebGPUSupport()) {
      throw new AIServiceError(
        'WebGPU not supported in this browser',
        'WEBGPU_NOT_SUPPORTED',
        {
          operation: 'loadModel',
          serviceName: 'WebLLMService',
          modelName: this.modelConfig.modelId,
          attempt: 1,
          totalAttempts: 1
        },
        undefined,
        false // Not retryable
      );
    }

    this.updateStatus({ isLoading: true, error: null });
    this.emit('loading-progress', { progress: 0, stage: 'Inizializzazione...' });

    try {
      await aiErrorHandler.executeWithRetry(
        async () => {
          // Initialize mock engine (replace with real WebLLM)
          this.engine = new MockWebLLMEngine();
          
          // Set up progress callback
          if (this.engine.setInitProgressCallback) {
            this.engine.setInitProgressCallback((progress) => {
              const progressValue = progress.progress || 0;
              this.updateStatus({ loadingProgress: progressValue });
              this.emit('loading-progress', { 
                progress: progressValue, 
                stage: progress.text || 'Caricamento modello...' 
              });
            });
          }

          // Load model
          await this.engine.reload(this.modelConfig.modelId);
        },
        {
          operation: 'loadModel',
          serviceName: 'WebLLMService',
          modelName: this.modelConfig.modelId
        },
        {
          maxRetries: 2,
          timeoutMs: 60000 // 60 seconds for model loading
        }
      );
      
      this.updateStatus({
        isLoaded: true,
        isLoading: false,
        loadingProgress: 100
      });
      
      this.emit('model-loaded', {
        modelName: this.modelConfig.modelId,
        capabilities: this.getCapabilities()
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load model';
      this.updateStatus({
        isLoading: false,
        error: errorMessage
      });
      
      if (error instanceof AIServiceError) {
        this.emit('error', {
          error: error.code,
          message: error.message,
          details: error.originalError
        });
      } else {
        this.emit('error', {
          error: 'MODEL_NOT_LOADED',
          message: errorMessage,
          details: error
        });
      }
      
      throw error;
    }
  }

  /**
   * Perform AI inference with retry logic
   */
  async infer(request: AIInferenceRequest): Promise<AIInferenceResponse> {
    if (!this.engine || !this.status.isLoaded) {
      throw new AIServiceError(
        'Model not loaded. Call loadModel() first.',
        'MODEL_NOT_LOADED',
        {
          operation: 'infer',
          serviceName: 'WebLLMService',
          modelName: this.modelConfig.modelId,
          attempt: 1,
          totalAttempts: 1
        },
        undefined,
        false // Not retryable until model is loaded
      );
    }

    const requestId = Math.random().toString(36).substring(7);
    this.emit('inference-start', { requestId });

    try {
      const result = await aiErrorHandler.executeWithRetry(
        async () => {
          // Convert request to WebLLM format
          const messages = [
            {
              role: 'system',
              content: request.systemPrompt || 'You are a helpful AI assistant specialized in ADHD support.'
            },
            {
              role: 'user', 
              content: request.prompt
            }
          ];

          // Make inference request using mock engine
          const responseText = await this.engine!.chat(messages, {
            temperature: request.temperature ?? this.modelConfig.temperature,
            max_tokens: request.maxTokens ?? this.modelConfig.maxTokens
          }, requestId);

          return {
            text: responseText,
            finishReason: 'stop' as const,
            usage: {
              promptTokens: Math.floor(request.prompt.length / 4), // rough estimate
              completionTokens: Math.floor(responseText.length / 4),
              totalTokens: Math.floor((request.prompt.length + responseText.length) / 4)
            },
            metadata: {
              modelId: this.modelConfig.modelId,
              temperature: request.temperature ?? this.modelConfig.temperature,
              requestId
            }
          };
        },
        {
          operation: 'infer',
          serviceName: 'WebLLMService',
          modelName: this.modelConfig.modelId,
          requestId
        },
        {
          maxRetries: 2,
          timeoutMs: 30000 // 30 seconds for inference
        }
      );

      this.emit('inference-complete', { requestId, response: result });
      return result;
      
    } catch (error) {
      if (error instanceof AIServiceError) {
        this.emit('error', {
          error: error.code,
          message: error.message,
          details: error.originalError
        });
      } else {
        this.emit('error', {
          error: 'INFERENCE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown inference error',
          details: error
        });
      }
      throw error;
    }
  }

  /**
   * Get AI capabilities
   */
  getCapabilities(): AICapabilities {
    return {
      supportsWebGPU: this.checkWebGPUSupport(),
      supportsStreaming: false,
      supportsContextWindow: 4096,
      maxTokens: 512,
      supportedLanguages: ['it', 'en'],
      platform: 'web',
      requiresDownload: true,
      estimatedSize: '~1.2GB'
    };
  }

  /**
   * Get privacy information
   */
  getPrivacyInfo(): AIPrivacyInfo {
    return {
      isLocal: true,
      dataSharing: 'none',
      storageLocation: 'browser',
      encryptionEnabled: false,
      retentionPolicy: 'Session only - data cleared on page refresh',
      complianceStandards: ['GDPR compliant - no data leaves device']
    };
  }

  /**
   * High-level chatbot interaction
   */
  async chatbot(request: ChatRequest): Promise<ChatResponse> {
    const aiRequest = ContextBuilder.buildChatbotRequest(
      request.message,
      request.context,
      request.context.intent
    );

    const response = await this.infer(aiRequest);
    const parsed = ContextBuilder.parseResponse(response.text);

    return {
      message: parsed.text,
      actions: parsed.actions,
      suggestions: parsed.actions?.slice(0, 3), // First 3 actions as suggestions
      mood: request.context.adhdContext?.todayMood?.mood,
      energy: request.context.adhdContext?.energyLevel,
      followUpQuestions: this.generateFollowUpQuestions(request.context)
    };
  }

  /**
   * Task breakdown functionality
   */
  async breakdownTask(request: TaskBreakdownRequest): Promise<TaskBreakdownResponse> {
    const aiRequest = ContextBuilder.buildTaskBreakdownRequest(
      request.taskDescription,
      request.context
    );

    const response = await this.infer(aiRequest);
    const parsed = ContextBuilder.parseResponse(response.text);

    const microTasks = parsed.microTasks || [];
    const totalTime = microTasks.reduce((sum, task) => sum + task.duration, 0);
    
    // Calculate energy distribution
    const energyCount = { basso: 0, medio: 0, alto: 0 };
    microTasks.forEach(task => {
      energyCount[task.energy]++;
    });

    return {
      microTasks,
      estimatedTotalTime: totalTime,
      difficulty: this.calculateDifficulty(microTasks),
      recommendations: parsed.actions || [],
      energyDistribution: energyCount
    };
  }

  /**
   * Mood ritual suggestions
   */
  async suggestRitual(request: MoodRitualRequest): Promise<MoodRitualResponse> {
    const aiRequest = ContextBuilder.buildMoodRitualRequest(
      request.moodState,
      request.context
    );

    const response = await this.infer(aiRequest);
    const parsed = ContextBuilder.parseResponse(response.text);

    const ritual = parsed.ritual || {
      name: `Rituale per stato ${request.moodState}`,
      steps: parsed.actions || ['Respira profondamente', 'Fai una pausa'],
      duration: request.duration || 5,
      moodState: request.moodState,
      energyRequired: 'basso'
    };

    return {
      ritual,
      explanation: parsed.text,
      expectedOutcome: this.getExpectedOutcome(request.moodState)
    };
  }

  /**
   * Generate follow-up questions based on context
   */
  private generateFollowUpQuestions(context: any): string[] {
    const questions = [];
    
    if (context.tasks && context.tasks.length > 0) {
      questions.push('Vuoi che ti aiuti a prioritizzare le tue task?');
    }
    
    if (context.adhdContext?.energyLevel && context.adhdContext.energyLevel < 5) {
      questions.push('Ti serve un rituale per aumentare l\'energia?');
    }
    
    if (!context.adhdContext?.focusMode) {
      questions.push('Vuoi attivare la modalità Focus?');
    }
    
    return questions.slice(0, 2); // Max 2 questions
  }

  /**
   * Calculate task difficulty based on micro-tasks
   */
  private calculateDifficulty(microTasks: any[]): number {
    if (microTasks.length === 0) return 1;
    
    const avgDuration = microTasks.reduce((sum, task) => sum + task.duration, 0) / microTasks.length;
    const highEnergyCount = microTasks.filter(task => task.energy === 'alto').length;
    
    let difficulty = Math.min(10, Math.max(1, Math.floor(avgDuration / 5)));
    difficulty += Math.floor(highEnergyCount / microTasks.length * 3);
    
    return Math.min(10, difficulty);
  }

  /**
   * Get expected outcome for mood state
   */
  private getExpectedOutcome(moodState: string): string {
    const outcomes = {
      congelato: 'Ti aiuterà a sbloccarti e iniziare con piccoli passi',
      disorientato: 'Ti darà direzione e focus per canalizzare la tua energia',
      in_flusso: 'Manterrà e ottimizzerà il tuo stato di concentrazione',
      ispirato: 'Trasformerà la tua ispirazione in azioni concrete'
    };
    
    return outcomes[moodState as keyof typeof outcomes] || 'Ti aiuterà a gestire meglio il tuo stato attuale';
  }

  /**
   * Check if WebGPU is supported
   */
  isWebGPUSupported(): boolean {
    return this.checkWebGPUSupport();
  }

  /**
   * Get model information
   */
  getModelInfo(): { name: string; size?: string; isLocal: boolean } {
    return {
      name: this.modelConfig.modelId,
      size: '~1.2GB',
      isLocal: true
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.engine) {
      await this.engine.unload();
      this.engine = null;
    }
    this.updateStatus({ 
      isLoaded: false,
      isLoading: false,
      error: null
    });
  }
}