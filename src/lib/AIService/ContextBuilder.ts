/**
 * Centralized context builder for AI prompts
 * Handles context engineering and prompt construction
 */

import type { ADHDContext, UserBehaviorPattern } from '@/types/chatbot';
import type { Task } from '@/types/adhd';
import type { AIInferenceRequest } from './AIService';

export interface ContextData {
  adhdContext?: ADHDContext;
  tasks?: Task[];
  projects?: any[];
  userBehavior?: UserBehaviorPattern;
  conversationHistory?: any[];
  currentTime?: Date;
  sessionData?: Record<string, any>;
}

export interface PromptTemplate {
  systemPrompt: string;
  userPromptTemplate: string;
  contextInstructions: string[];
  responseFormat?: string;
}

/**
 * Centralized context builder for consistent AI interactions
 */
export class ContextBuilder {
  private static readonly SYSTEM_PROMPTS = {
    chatbot: `Sei un assistente AI specializzato nel supporto ADHD. Il tuo ruolo è:

1. **Supporto Empatico**: Comprendi le sfide ADHD (overwhelm, procrastinazione, gestione energia)
2. **Suggerimenti Pratici**: Fornisci strategie concrete e micro-task gestibili
3. **Motivazione Positiva**: Celebra i progressi e mantieni un tono incoraggiante
4. **Focus su Azioni**: Trasforma idee in passi concreti e realizzabili

Principi chiave:
- Risposte brevi e dirette (max 3-4 frasi)
- Suggerisci sempre un'azione specifica
- Adatta il linguaggio al livello di energia dell'utente
- Usa emoji per rendere il testo più accessibile
- Evita lunghe spiegazioni teoriche`,

    taskBreakdown: `Sei un esperto nella suddivisione di task complesse per persone con ADHD.

Il tuo compito è:
1. Analizzare la task fornita
2. Spezzarla in micro-task da 5-15 minuti ciascuna
3. Ordinare i micro-task per difficoltà crescente
4. Suggerire il momento migliore per ogni micro-task

Formato risposta:
- Lista numerata di micro-task
- Tempo stimato per ognuna
- Livello energia richiesto (basso/medio/alto)
- Suggerimento su quando farla`,

    moodRitual: `Sei un coach specializzato in rituali per la gestione dell'umore ADHD.

Stati d'umore supportati:
- **Congelato**: Paralisi decisionale, overwhelm
- **Disorientato**: Energia alta ma senza direzione
- **In Flusso**: Concentrazione ottimale
- **Ispirato**: Creatività e visione alta

Fornisci rituali specifici di 2-5 minuti per ogni stato, con istruzioni precise e immediate.`
  };

  /**
   * Build complete AI request for chatbot interactions
   */
  static buildChatbotRequest(
    userMessage: string,
    context: ContextData,
    intent?: string
  ): AIInferenceRequest {
    const systemPrompt = this.buildSystemPrompt('chatbot', context);
    const contextualPrompt = this.buildContextualPrompt(userMessage, context, intent);

    return {
      prompt: contextualPrompt,
      systemPrompt,
      context: this.extractRelevantContext(context),
      temperature: 0.7,
      maxTokens: 300
    };
  }

  /**
   * Build AI request for task breakdown
   */
  static buildTaskBreakdownRequest(
    task: Task | string,
    context: ContextData
  ): AIInferenceRequest {
    const systemPrompt = this.buildSystemPrompt('taskBreakdown', context);
    const prompt = this.buildTaskBreakdownPrompt(task, context);

    return {
      prompt,
      systemPrompt,
      context: this.extractRelevantContext(context),
      temperature: 0.5,
      maxTokens: 400
    };
  }

  /**
   * Build AI request for mood ritual suggestions
   */
  static buildMoodRitualRequest(
    moodState: string,
    context: ContextData
  ): AIInferenceRequest {
    const systemPrompt = this.buildSystemPrompt('moodRitual', context);
    const prompt = this.buildMoodRitualPrompt(moodState, context);

    return {
      prompt,
      systemPrompt,
      context: this.extractRelevantContext(context),
      temperature: 0.6,
      maxTokens: 250
    };
  }

  /**
   * Build system prompt with context
   */
  private static buildSystemPrompt(type: keyof typeof this.SYSTEM_PROMPTS, context: ContextData): string {
    let systemPrompt = this.SYSTEM_PROMPTS[type];
    
    // Add context-specific instructions
    const contextInstructions = this.getContextInstructions(context);
    if (contextInstructions.length > 0) {
      systemPrompt += '\n\nContesto attuale:\n' + contextInstructions.join('\n');
    }

    return systemPrompt;
  }

  /**
   * Build contextual prompt for chatbot
   */
  private static buildContextualPrompt(
    userMessage: string,
    context: ContextData,
    intent?: string
  ): string {
    let prompt = `Messaggio utente: "${userMessage}"`;

    // Add intent if detected
    if (intent) {
      prompt += `\nIntent rilevato: ${intent}`;
    }

    // Add relevant context
    const contextInfo = this.buildContextSummary(context);
    if (contextInfo) {
      prompt += `\n\nContesto:\n${contextInfo}`;
    }

    prompt += '\n\nRispondi in modo empatico e pratico, suggerendo un\'azione concreta.';

    return prompt;
  }

  /**
   * Build task breakdown prompt with context
   */
  private static buildTaskBreakdownPrompt(task: Task | string, context: ContextData): string {
    // Handle both Task object and string input for backward compatibility
    const taskDescription = typeof task === 'string' ? task : task.title;
    const taskObj = typeof task === 'object' ? task : null;
    
    let prompt = `Task da suddividere: "${taskDescription}"`;

    // Add task-specific context if Task object is provided
    if (taskObj) {
      if (taskObj.description) {
        prompt += `\nDescrizione: ${taskObj.description}`;
      }
      if (taskObj.due_date) {
        prompt += `\nScadenza: ${new Date(taskObj.due_date).toLocaleDateString('it-IT')}`;
      }
      if (taskObj.energy_required) {
        prompt += `\nEnergia richiesta: ${taskObj.energy_required}`;
      }
      if (taskObj.task_type) {
        prompt += `\nTipo task: ${taskObj.task_type}`;
      }
      if (taskObj.actual_duration) {
        prompt += `\nDurata stimata precedente: ${taskObj.actual_duration} minuti`;
      }
    }

    // Add energy level context
    if (context.adhdContext?.energyLevel) {
      prompt += `\nLivello energia utente: ${context.adhdContext.energyLevel}/10`;
    }

    // Add mood context
    if (context.adhdContext?.todayMood) {
      prompt += `\nUmore attuale: ${context.adhdContext.todayMood.mood}`;
    }

    // Add time context
    const timeContext = this.getTimeContext(context.currentTime);
    if (timeContext) {
      prompt += `\nContesto temporale: ${timeContext}`;
    }

    prompt += '\n\nSuddividi in micro-task specifiche e gestibili.';

    return prompt;
  }

  /**
   * Build mood ritual prompt
   */
  private static buildMoodRitualPrompt(moodState: string, context: ContextData): string {
    let prompt = `Stato d'umore: ${moodState}`;

    // Add current situation context
    if (context.tasks && context.tasks.length > 0) {
      const pendingTasks = context.tasks.filter(t => t.status !== 'completed').length;
      prompt += `\nTask in sospeso: ${pendingTasks}`;
    }

    if (context.adhdContext?.energyLevel) {
      prompt += `\nLivello energia: ${context.adhdContext.energyLevel}/10`;
    }

    prompt += '\n\nSuggerisci un rituale specifico di 2-5 minuti per questo stato d\'umore.';

    return prompt;
  }

  /**
   * Get context-specific instructions
   */
  private static getContextInstructions(context: ContextData): string[] {
    const instructions: string[] = [];

    // Focus mode instruction
    if (context.adhdContext?.focusMode) {
      instructions.push('- Utente in modalità Focus: suggerisci solo task prioritarie');
    }

    // Energy level instruction
    if (context.adhdContext?.energyLevel !== undefined) {
      if (context.adhdContext.energyLevel <= 3) {
        instructions.push('- Energia bassa: suggerisci task semplici e brevi');
      } else if (context.adhdContext.energyLevel >= 7) {
        instructions.push('- Energia alta: momento ideale per task impegnative');
      }
    }

    // Mood instruction
    if (context.adhdContext?.todayMood) {
      const mood = context.adhdContext.todayMood.mood;
      instructions.push(`- Umore "${mood}": adatta suggerimenti a questo stato`);
    }

    return instructions;
  }

  /**
   * Build context summary
   */
  private static buildContextSummary(context: ContextData): string {
    const parts: string[] = [];

    // Task summary
    if (context.tasks && context.tasks.length > 0) {
      const pending = context.tasks.filter(t => t.status !== 'completed').length;
      const completed = context.tasks.length - pending;
      parts.push(`Task: ${pending} in sospeso, ${completed} completate`);
    }

    // Energy and mood
    if (context.adhdContext?.energyLevel) {
      parts.push(`Energia: ${context.adhdContext.energyLevel}/10`);
    }

    if (context.adhdContext?.todayMood) {
      parts.push(`Umore: ${context.adhdContext.todayMood.mood}`);
    }

    // Time context
    const timeContext = this.getTimeContext(context.currentTime);
    if (timeContext) {
      parts.push(`Momento: ${timeContext}`);
    }

    return parts.join(' | ');
  }

  /**
   * Get time-based context
   */
  private static getTimeContext(currentTime?: Date): string | null {
    if (!currentTime) currentTime = new Date();
    
    const hour = currentTime.getHours();
    
    if (hour >= 6 && hour < 12) return 'mattina';
    if (hour >= 12 && hour < 17) return 'pomeriggio';
    if (hour >= 17 && hour < 22) return 'sera';
    return 'notte';
  }

  /**
   * Extract relevant context for AI metadata
   */
  private static extractRelevantContext(context: ContextData): Record<string, any> {
    return {
      hasActiveTasks: context.tasks && context.tasks.length > 0,
      energyLevel: context.adhdContext?.energyLevel,
      focusMode: context.adhdContext?.focusMode,
      moodState: context.adhdContext?.todayMood?.mood,
      timeOfDay: this.getTimeContext(context.currentTime),
      taskCount: context.tasks?.length || 0,
      projectCount: context.projects?.length || 0
    };
  }

  /**
   * Parse AI response for structured data
   */
  static parseResponse(response: string, expectedFormat?: string): {
    text: string;
    actions?: string[];
    microTasks?: Array<{ title: string; duration: number; energy: string }>;
    ritual?: { name: string; steps: string[]; duration: number };
  } {
    const result = { text: response };

    // Parse micro-tasks if present
    const taskMatches = response.match(/\d+\..+?(?=\n\d+\.|$)/gs);
    if (taskMatches) {
      result.microTasks = taskMatches.map(match => {
        const title = match.replace(/^\d+\.\s*/, '').split('(')[0].trim();
        const durationMatch = match.match(/(\d+)\s*min/i);
        const energyMatch = match.match(/(basso|medio|alto)/i);
        
        return {
          title,
          duration: durationMatch ? parseInt(durationMatch[1]) : 10,
          energy: energyMatch ? energyMatch[1].toLowerCase() : 'medio'
        };
      });
    }

    // Parse actions if present
    const actionMatches = response.match(/(?:^|\n)[-•]\s*(.+)/gm);
    if (actionMatches) {
      result.actions = actionMatches.map(match => match.replace(/^[-•]\s*/, '').trim());
    }

    return result;
  }
}