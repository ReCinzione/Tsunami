// Chatbot response utilities
// Extracted from LocalChatBot.tsx for better maintainability

export const responseTemplates = {
  greeting: [
    "Ciao! Come va oggi? Raccontami come ti senti.",
    "Benvenuto! Di cosa vuoi parlare oggi?",
    "Ehi! Come posso aiutarti a organizzare la giornata?",
    "Ciao! Che energia hai oggi? Parliamone insieme."
  ],
  
  emotional_state: [
    "Capisco come ti senti. Vuoi che ti aiuti a trovare qualcosa di adatto al tuo stato d'animo?",
    "Grazie per avermi detto come stai. Cosa ti servirebbe in questo momento?",
    "È normale sentirsi così. Posso suggerirti qualche strategia?"
  ],
  
  task_help: [
    "Perfetto! Posso aiutarti a organizzare le tue attività. Cosa hai in mente?",
    "Ottimo! Parliamo di cosa devi fare. Da dove vuoi iniziare?",
    "Bene! Ti aiuto a strutturare le tue task. Qual è la priorità?"
  ],
  
  overwhelm_support: [
    "Sento che ti senti sopraffatto. Facciamo un passo alla volta, ok?",
    "Troppo da fare? Iniziamo con una cosa piccola e gestibile.",
    "Quando tutto sembra troppo, la soluzione è sempre: una cosa alla volta."
  ],
  
  focus_encouragement: [
    "Ottimo! Mantieni questo focus. Stai andando bene.",
    "Perfetto! Continua così, sei sulla strada giusta.",
    "Bravissimo! Questo è esattamente il tipo di concentrazione che serve."
  ],
  
  break_suggestion: [
    "Hai lavorato bene! Che ne dici di una pausa?",
    "Momento perfetto per staccare un po'. Te lo sei meritato!",
    "Pausa strategica? Il cervello ha bisogno di ricaricarsi."
  ]
};

export const quickActions = {
  disorientato: [
    {
      label: "📝 Apri Task Manager",
      description: "Vai alla sezione Attività per organizzare le tue task",
      action: "navigate_to_tasks"
    },
    {
      label: "🧠 Apri Mental Inbox",
      description: "Scarica tutti i pensieri che hai in testa",
      action: "open_mental_inbox"
    },
    {
      label: "🎯 Attiva Focus Mode",
      description: "Mostra solo le 3 task più importanti",
      action: "enable_focus_mode"
    },
    {
      label: "📋 Crea Lista Rapida",
      description: "Scrivi 3 cose che ti vengono in mente ora",
      action: "create_quick_list"
    }
  ],
  
  congelato: [
    {
      label: "⏱️ Timer 2 Minuti",
      description: "Inizia con qualcosa di piccolissimo",
      action: "start_micro_timer"
    },
    {
      label: "🎯 Task Facile",
      description: "Trova la task più semplice da fare ora",
      action: "suggest_easy_task"
    },
    {
      label: "🚶 Cambia Ambiente",
      description: "A volte basta spostarsi in un'altra stanza",
      action: "suggest_environment_change"
    }
  ],
  
  in_flusso: [
    {
      label: "⏰ Imposta Timer",
      description: "Proteggi il tuo flusso con un timer",
      action: "start_focus_timer"
    },
    {
      label: "🔕 Non Disturbare",
      description: "Disattiva notifiche per mantenere la concentrazione",
      action: "enable_dnd_mode"
    }
  ],
  
  ispirato: [
    {
      label: "💡 Cattura Idea",
      description: "Salva velocemente l'ispirazione nel Mental Inbox",
      action: "quick_capture"
    },
    {
      label: "🚀 Nuovo Progetto",
      description: "Trasforma l'ispirazione in un progetto concreto",
      action: "create_project"
    }
  ]
};

/**
 * Gets appropriate response template based on context
 */
export function getResponseTemplate(
  intent: string,
  mood?: string,
  context?: any
): string {
  const templates = responseTemplates[intent as keyof typeof responseTemplates];
  if (!templates || templates.length === 0) {
    return "Come posso aiutarti?";
  }
  
  // Return random template from the category
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Gets quick actions based on mood and context
 */
export function getQuickActionsForMood(mood: string) {
  return quickActions[mood as keyof typeof quickActions] || [];
}

/**
 * Generates contextual help text based on user's question
 */
export function generateContextualHelp(userMessage: string, mood?: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // Lista/organizzazione
  if (lowerMessage.includes('lista') || lowerMessage.includes('organizzare')) {
    if (mood === 'disorientato') {
      return "Perfetto! Quando sei disorientato, fare una lista è la strategia migliore. Puoi usare:\n\n" +
             "📝 **Task Manager** (tab Attività) - per task concrete con scadenze\n" +
             "🧠 **Mental Inbox** (tab Note) - per scaricare tutti i pensieri\n" +
             "📋 **Carta e penna** - se preferisci il metodo tradizionale\n\n" +
             "Quale preferisci?";
    }
    return "Ottima idea fare una lista! Puoi usare il Task Manager per task concrete o il Mental Inbox per pensieri sparsi.";
  }
  
  // Dove fare qualcosa
  if (lowerMessage.includes('dove') && (lowerMessage.includes('faccio') || lowerMessage.includes('posso'))) {
    return "Hai diverse opzioni:\n\n" +
           "📱 **Nell'app**: Task Manager per task organizzate, Mental Inbox per pensieri liberi\n" +
           "📝 **Su carta**: A volte scrivere a mano aiuta a sbloccarsi\n" +
           "💻 **Note digitali**: Qualsiasi app di note che preferisci\n\n" +
           "L'importante è iniziare, il mezzo è secondario!";
  }
  
  // Cosa fare
  if (lowerMessage.includes('cosa') && (lowerMessage.includes('fare') || lowerMessage.includes('faccio'))) {
    if (mood === 'disorientato') {
      return "Quando sei disorientato, la strategia è semplificare:\n\n" +
             "1. **Scrivi 3 cose** che ti vengono in mente (qualsiasi cosa)\n" +
             "2. **Scegli quella che ti attira di più**\n" +
             "3. **Inizia con 5 minuti** su quella cosa\n\n" +
             "Vuoi che ti aiuti a fare questo processo?";
    }
    return "Dipende dal tuo stato d'animo e energia. Raccontami come ti senti oggi e ti suggerisco qualcosa di adatto.";
  }
  
  // Fallback generico
  return "Non ho capito completamente. Puoi riformulare o darmi più dettagli?";
}

/**
 * Detects if user needs immediate action suggestions
 */
export function needsImmediateAction(userMessage: string): boolean {
  const urgentKeywords = [
    'non so cosa fare',
    'sono bloccato',
    'aiuto',
    'cosa faccio',
    'dove comincio',
    'sono perso',
    'non riesco'
  ];
  
  const lowerMessage = userMessage.toLowerCase();
  return urgentKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Generates immediate action suggestions for urgent requests
 */
export function getImmediateActionSuggestions(mood?: string): string[] {
  const baseSuggestions = [
    "Respira profondamente per 30 secondi",
    "Scrivi la prima cosa che ti viene in mente",
    "Fai una cosa piccolissima (anche solo aprire un file)"
  ];
  
  if (mood === 'disorientato') {
    return [
      "Apri il Mental Inbox e scrivi tutto quello che hai in testa",
      "Vai al Task Manager e guarda se c'è qualcosa di veloce da fare",
      "Fai una lista di 3 cose, qualsiasi cosa"
    ];
  }
  
  if (mood === 'congelato') {
    return [
      "Imposta un timer di 2 minuti e fai qualsiasi cosa",
      "Cambia stanza o posizione",
      "Inizia con la task più piccola che vedi"
    ];
  }
  
  return baseSuggestions;
}