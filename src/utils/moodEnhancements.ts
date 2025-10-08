// Utility functions for mood-based enhancements
// Extracted from LocalChatBot.tsx for better maintainability

export interface MoodContext {
  mood: 'congelato' | 'disorientato' | 'in_flusso' | 'ispirato';
  suggested_ritual: string;
  date: Date;
}

export const moodEnhancements = {
  congelato: {
    prefix: "🧊 Capisco che oggi ti senti bloccato. ",
    suggestions: [
      "Inizia con qualcosa di molto piccolo - anche solo aprire un file conta.",
      "Prova la regola dei 2 minuti: fai solo 2 minuti di qualsiasi task.",
      "Cambia ambiente fisico - anche solo spostarti in un'altra stanza può aiutare."
    ],
    tone: "gentle",
    actionable: true
  },
  disorientato: {
    prefix: "⚡ Ottima domanda! Sei \"disorientato\" ma hai energia. ",
    suggestions: [
      "Fai una lista di 3 cose che ti vengono in mente nel **Task Manager** (tab Attività).",
      "Usa il **Mental Inbox** per scaricare tutti i pensieri che ti frullano in testa.",
      "Prova il Focus Mode: seleziona solo 1-2 task e nasconde tutto il resto."
    ],
    tone: "energetic",
    actionable: true
  },
  in_flusso: {
    prefix: "🌊 Perfetto! Sei in flusso. ",
    suggestions: [
      "Continua con quello che stai facendo, ma imposta un timer per non perdere la cognizione del tempo.",
      "Tieni a portata di mano acqua e snack per non dover interrompere il flusso.",
      "Disattiva le notifiche per proteggere questo stato prezioso."
    ],
    tone: "supportive",
    actionable: false
  },
  ispirato: {
    prefix: "✨ Fantastico! L'ispirazione è un dono. ",
    suggestions: [
      "Cattura subito le idee nel **Mental Inbox** prima che svaniscano.",
      "Se hai un'idea per un progetto, vai su **Progetti** e creane uno nuovo.",
      "Usa questo momento per pianificare, non necessariamente per eseguire tutto."
    ],
    tone: "enthusiastic",
    actionable: true
  }
};

/**
 * Enhances a chatbot response with mood-specific context and suggestions
 */
export function enhanceResponseWithMoodContext(
  baseResponse: string,
  moodContext?: MoodContext
): string {
  if (!moodContext) {
    return baseResponse;
  }

  const enhancement = moodEnhancements[moodContext.mood];
  if (!enhancement) {
    return baseResponse;
  }

  // Add mood-specific prefix and suggestions
  let enhancedResponse = enhancement.prefix + baseResponse;
  
  // Add actionable suggestions if appropriate
  if (enhancement.actionable && enhancement.suggestions.length > 0) {
    enhancedResponse += "\n\n💡 **Suggerimenti per il tuo stato attuale:**\n";
    enhancement.suggestions.forEach((suggestion, index) => {
      enhancedResponse += `${index + 1}. ${suggestion}\n`;
    });
  }

  return enhancedResponse;
}

/**
 * Gets mood-specific quick actions for the UI
 */
export function getMoodQuickActions(mood: string) {
  const actions = {
    congelato: [
      { label: "Timer 2 minuti", action: "start_micro_timer" },
      { label: "Task più facile", action: "suggest_easy_task" }
    ],
    disorientato: [
      { label: "Apri Task Manager", action: "open_task_manager" },
      { label: "Apri Mental Inbox", action: "open_mental_inbox" },
      { label: "Attiva Focus Mode", action: "enable_focus_mode" }
    ],
    in_flusso: [
      { label: "Imposta Timer", action: "start_focus_timer" },
      { label: "Modalità Non Disturbare", action: "enable_dnd" }
    ],
    ispirato: [
      { label: "Cattura Idea", action: "quick_capture" },
      { label: "Nuovo Progetto", action: "create_project" }
    ]
  };

  return actions[mood as keyof typeof actions] || [];
}