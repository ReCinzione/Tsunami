/**
 * AI Service Error Handler
 * Centralized error handling, retry logic, and timeout management for AI services
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  timeoutMs: number;
}

export interface AIErrorContext {
  operation: string;
  serviceName: string;
  modelName?: string;
  requestId?: string;
  attempt: number;
  totalAttempts: number;
}

export class AIServiceError extends Error {
  public readonly code: string;
  public readonly context: AIErrorContext;
  public readonly originalError?: Error;
  public readonly isRetryable: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    context: AIErrorContext,
    originalError?: Error,
    isRetryable: boolean = true
  ) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.context = context;
    this.originalError = originalError;
    this.isRetryable = isRetryable;
    this.timestamp = new Date();
  }
}

/**
 * Centralized AI Error Handler with retry logic and timeout management
 */
export class AIErrorHandler {
  private static instance: AIErrorHandler;
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    timeoutMs: 30000
  };

  private constructor() {}

  static getInstance(): AIErrorHandler {
    if (!AIErrorHandler.instance) {
      AIErrorHandler.instance = new AIErrorHandler();
    }
    return AIErrorHandler.instance;
  }

  /**
   * Execute operation with retry logic and timeout
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: Omit<AIErrorContext, 'attempt' | 'totalAttempts'>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
      const fullContext: AIErrorContext = {
        ...context,
        attempt,
        totalAttempts: finalConfig.maxRetries + 1
      };

      try {
        // Execute with timeout
        const result = await this.withTimeout(
          operation(),
          finalConfig.timeoutMs,
          fullContext
        );
        
        // Success - log if this was a retry
        if (attempt > 1) {
          console.log(`✅ AI operation succeeded on attempt ${attempt}/${finalConfig.maxRetries + 1}:`, context.operation);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if error is retryable
        const isRetryable = this.isErrorRetryable(lastError);
        const isLastAttempt = attempt === finalConfig.maxRetries + 1;
        
        if (!isRetryable || isLastAttempt) {
          // Don't retry - throw enhanced error
          throw this.enhanceError(lastError, fullContext, !isRetryable);
        }
        
        // Calculate delay for next retry
        const delay = this.calculateDelay(attempt - 1, finalConfig);
        
        console.warn(
          `⚠️ AI operation failed (attempt ${attempt}/${finalConfig.maxRetries + 1}), retrying in ${delay}ms:`,
          context.operation,
          lastError.message
        );
        
        // Wait before retry
        await this.delay(delay);
      }
    }

    // This should never be reached, but just in case
    throw this.enhanceError(
      lastError || new Error('Unknown error'),
      { ...context, attempt: finalConfig.maxRetries + 1, totalAttempts: finalConfig.maxRetries + 1 }
    );
  }

  /**
   * Add timeout to a promise
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    context: AIErrorContext
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new AIServiceError(
          `Operation timed out after ${timeoutMs}ms`,
          'TIMEOUT',
          context,
          undefined,
          true
        ));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Determine if an error is retryable
   */
  private isErrorRetryable(error: Error): boolean {
    // Network errors are usually retryable
    if (error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('connection')) {
      return true;
    }

    // AI service specific errors
    if (error.message.includes('Model not loaded') ||
        error.message.includes('WebGPU not supported') ||
        error.message.includes('Native bridge not available')) {
      return false; // These require different handling
    }

    // Inference failures might be temporary
    if (error.message.includes('Inference failed') ||
        error.message.includes('Generation failed')) {
      return true;
    }

    // Validation errors are not retryable
    if (error.name === 'ValidationError') {
      return false;
    }

    // Default to retryable for unknown errors
    return true;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
    return Math.min(jitteredDelay, config.maxDelay);
  }

  /**
   * Add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Enhance error with context and make it an AIServiceError
   */
  private enhanceError(
    error: Error,
    context: AIErrorContext,
    isNonRetryable: boolean = false
  ): AIServiceError {
    if (error instanceof AIServiceError) {
      return error;
    }

    // Determine error code
    let code = 'UNKNOWN_ERROR';
    if (error.message.includes('timeout')) code = 'TIMEOUT';
    else if (error.message.includes('network')) code = 'NETWORK_ERROR';
    else if (error.message.includes('Model not loaded')) code = 'MODEL_NOT_LOADED';
    else if (error.message.includes('Inference failed')) code = 'INFERENCE_FAILED';
    else if (error.message.includes('WebGPU')) code = 'WEBGPU_ERROR';
    else if (error.message.includes('Native bridge')) code = 'NATIVE_BRIDGE_ERROR';

    return new AIServiceError(
      `${context.operation} failed: ${error.message}`,
      code,
      context,
      error,
      !isNonRetryable
    );
  }

  /**
   * Create fallback strategy for AI services
   */
  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context: Omit<AIErrorContext, 'attempt' | 'totalAttempts'>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    try {
      return await this.executeWithRetry(primaryOperation, {
        ...context,
        serviceName: `${context.serviceName} (primary)`
      }, config);
    } catch (primaryError) {
      console.warn(
        `🔄 Primary AI service failed, falling back to secondary:`,
        context.operation,
        primaryError instanceof AIServiceError ? primaryError.code : primaryError.message
      );
      
      try {
        return await this.executeWithRetry(fallbackOperation, {
          ...context,
          serviceName: `${context.serviceName} (fallback)`
        }, { ...config, maxRetries: 1 }); // Fewer retries for fallback
      } catch (fallbackError) {
        // Both failed - throw enhanced error with both contexts
        throw new AIServiceError(
          `Both primary and fallback AI services failed for ${context.operation}`,
          'ALL_SERVICES_FAILED',
          { ...context, attempt: 1, totalAttempts: 1 },
          fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
          false
        );
      }
    }
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorsByService: Record<string, number>;
  } {
    // This would be implemented with actual error tracking
    // For now, return empty stats
    return {
      totalErrors: 0,
      errorsByCode: {},
      errorsByService: {}
    };
  }
}

// Export singleton instance
export const aiErrorHandler = AIErrorHandler.getInstance();
export default aiErrorHandler;