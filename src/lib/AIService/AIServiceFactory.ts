/**
 * Factory for automatic AI service selection
 * Chooses between WebLLM and Native implementations based on environment
 */

import { AIService } from './AIService';
import { WebLLMService, WebLLMConfig } from './WebLLMService';
import { NativeLLMService, NativeLLMConfig } from './NativeLLMService';
import { AIServiceConfig, AICapabilities, AIFallbackConfig } from '../../types/ai';

export type AIServiceType = 'web' | 'native' | 'auto';

export interface AIServiceFactoryConfig {
  serviceType?: AIServiceType;
  webConfig?: WebLLMConfig;
  nativeConfig?: NativeLLMConfig;
  fallbackToWeb?: boolean;
}

/**
 * Environment detection and service selection
 */
export class AIServiceFactory {
  private static instance: AIService | null = null;
  private static currentConfig: AIServiceFactoryConfig | null = null;

  /**
   * Create or get singleton AI service instance
   */
  static async createService(config: AIServiceFactoryConfig = {}): Promise<AIService> {
    const finalConfig: AIServiceFactoryConfig = {
      serviceType: 'auto',
      fallbackToWeb: true,
      ...config
    };

    // Return existing instance if config hasn't changed
    if (this.instance && this.configEquals(finalConfig, this.currentConfig)) {
      return this.instance;
    }

    // Dispose existing instance
    if (this.instance) {
      await this.instance.dispose();
    }

    // Create new service based on config
    this.instance = await this.selectAndCreateService(finalConfig);
    this.currentConfig = finalConfig;
    
    return this.instance;
  }

  /**
   * Select and create appropriate AI service
   */
  private static async selectAndCreateService(config: AIServiceFactoryConfig): Promise<AIService> {
    const environment = this.detectEnvironment();
    let serviceType = config.serviceType;

    // Auto-select service type
    if (serviceType === 'auto') {
      serviceType = this.autoSelectServiceType(environment);
    }

    try {
      switch (serviceType) {
        case 'native':
          return await this.createNativeService(config.nativeConfig, environment);
        
        case 'web':
        default:
          return await this.createWebService(config.webConfig, environment);
      }
    } catch (error) {
      console.warn(`Failed to create ${serviceType} service:`, error);
      
      // Fallback to web service if enabled
      if (config.fallbackToWeb && serviceType !== 'web') {
        console.log('Falling back to WebLLM service...');
        return await this.createWebService(config.webConfig, environment);
      }
      
      throw error;
    }
  }

  /**
   * Create WebLLM service
   */
  private static async createWebService(
    webConfig?: WebLLMConfig, 
    environment?: EnvironmentInfo
  ): Promise<AIService> {
    const service = new WebLLMService(webConfig);
    
    // Check WebGPU support
    if (!service.isWebGPUSupported()) {
      console.warn('WebGPU not supported, AI features may be limited');
    }
    
    return service;
  }

  /**
   * Create Native service
   */
  private static async createNativeService(
    nativeConfig?: NativeLLMConfig,
    environment?: EnvironmentInfo
  ): Promise<AIService> {
    const service = new NativeLLMService(nativeConfig);
    
    // Validate native environment
    if (!environment?.isNative) {
      throw new Error('Native service requested but not in native environment');
    }
    
    return service;
  }

  /**
   * Auto-select service type based on environment
   */
  private static autoSelectServiceType(environment: EnvironmentInfo): AIServiceType {
    // For now, always prefer web since native is not implemented
    // TODO: Enable native selection when implementation is ready
    
    // if (environment.isNative && environment.capabilities.includes('large-models')) {
    //   return 'native';
    // }
    
    return 'web';
  }

  /**
   * Detect current environment
   */
  private static detectEnvironment(): EnvironmentInfo {
    console.log('🔍 Rilevamento ambiente in corso...');
    const info: EnvironmentInfo = {
      platform: 'web',
      isNative: false,
      capabilities: [],
      browserInfo: null
    };

    if (typeof window === 'undefined') {
      // Server-side
      console.log('🖥️ Ambiente server-side rilevato');
      info.platform = 'server';
      return info;
    }

    console.log('🌐 Ambiente browser rilevato');
    
    // Check for native environments
    if ((window as any).Capacitor) {
      console.log('📱 Capacitor rilevato');
      info.platform = 'capacitor';
      info.isNative = true;
      info.capabilities.push('mobile', 'offline');
    } else if ((window as any).electronAPI) {
      console.log('💻 Electron rilevato');
      info.platform = 'electron';
      info.isNative = true;
      info.capabilities.push('desktop', 'offline', 'large-models');
    } else {
      // Web environment
      console.log('🌍 Ambiente web standard');
      info.browserInfo = this.getBrowserInfo();
      
      // Check WebGPU support
      const hasWebGPU = 'gpu' in navigator;
      console.log('🎮 WebGPU disponibile:', hasWebGPU);
      if (hasWebGPU) {
        info.capabilities.push('webgpu');
      }
      
      // Check other web capabilities
      if ('serviceWorker' in navigator) {
        console.log('🔧 Service Worker supportato');
        info.capabilities.push('service-worker');
      }
      
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        console.log('💾 Storage API supportato');
        info.capabilities.push('storage-estimate');
      }
    }

    console.log('📊 Informazioni ambiente finale:', info);
    return info;
  }

  /**
   * Get browser information
   */
  private static getBrowserInfo(): BrowserInfo {
    const userAgent = navigator.userAgent;
    
    return {
      name: this.getBrowserName(userAgent),
      version: this.getBrowserVersion(userAgent),
      isChrome: /Chrome/.test(userAgent),
      isFirefox: /Firefox/.test(userAgent),
      isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
      isEdge: /Edg/.test(userAgent),
      supportsWebGPU: 'gpu' in navigator
    };
  }

  private static getBrowserName(userAgent: string): string {
    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Safari/.test(userAgent)) return 'Safari';
    if (/Edg/.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  private static getBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edg)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  /**
   * Compare configurations for equality
   */
  private static configEquals(
    config1: AIServiceFactoryConfig, 
    config2: AIServiceFactoryConfig | null
  ): boolean {
    if (!config2) return false;
    return JSON.stringify(config1) === JSON.stringify(config2);
  }

  /**
   * Get current service instance
   */
  static getCurrentService(): AIService | null {
    return this.instance;
  }

  /**
   * Dispose current service
   */
  static async dispose(): Promise<void> {
    if (this.instance) {
      await this.instance.dispose();
      this.instance = null;
      this.currentConfig = null;
    }
  }

  /**
   * Get or create singleton AI service instance
   */
  static async getInstance(config?: {
    preferNative?: boolean;
    fallbackToWeb?: boolean;
  }): Promise<AIService> {
    const factoryConfig: AIServiceFactoryConfig = {
      serviceType: config?.preferNative ? 'native' : 'auto',
      fallbackToWeb: config?.fallbackToWeb ?? true
    };
    return this.createService(factoryConfig);
  }

  /**
   * Get environment capabilities
   */
  static getEnvironmentInfo(): EnvironmentInfo {
    return this.detectEnvironment();
  }

  /**
   * Get AI capabilities without creating service instance
   */
  static async getCapabilities(): Promise<import('../../types/ai').AICapabilities> {
    const env = this.detectEnvironment();
    return {
      supportsChat: true,
      supportsTaskBreakdown: true,
      supportsRituals: true,
      maxTokens: env.capabilities.includes('webgpu') ? 4096 : 2048,
      supportedModels: ['phi-3-mini'],
      requiresInternet: false
    };
  }

  /**
   * Get fallback configuration for unsupported environments
   */
  static getFallbackConfig(): import('../../types/ai').AIFallbackConfig {
    return {
      showFallbackUI: true,
      fallbackMessage: 'AI features are not available in this environment',
      suggestedActions: [
        'Try using a modern browser with WebGPU support',
        'Enable WebGPU flags in Chrome',
        'Use the web version of the application'
      ]
    };
  }

  /**
   * Check if AI services are supported in current environment
   */
  static isSupported(): { supported: boolean; reason?: string; fallback?: string } {
    const env = this.detectEnvironment();
    
    if (env.platform === 'server') {
      return { 
        supported: false, 
        reason: 'Server-side environment not supported',
        fallback: 'Use client-side rendering'
      };
    }
    
    if (env.platform === 'web' && !env.capabilities.includes('webgpu')) {
      return {
        supported: true, // Still supported but limited
        reason: 'WebGPU not available, performance may be limited',
        fallback: 'Upgrade to Chrome 113+ or enable WebGPU flags'
      };
    }
    
    return { supported: true };
  }
}

// Type definitions
interface EnvironmentInfo {
  platform: 'web' | 'capacitor' | 'electron' | 'server';
  isNative: boolean;
  capabilities: string[];
  browserInfo: BrowserInfo | null;
}

interface BrowserInfo {
  name: string;
  version: string;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  supportsWebGPU: boolean;
}