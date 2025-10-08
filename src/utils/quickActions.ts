import type { QuickAction, ADHDContext } from '@/types/chatbot';

// Quick Actions predefinite con linguaggio inclusivo
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'manage_energy',
    label: '🔋 Gestisci la tua Energia',
    description: 'Trova task adatti al tuo livello di energia attuale',
    action: 'manage_energy',
    category: 'energy',
    context: 'general'
  },
  {
    id: 'organize_tasks',
    label: '📋 Organizza i Task',
    description: 'Aiuto per prioritizzare e organizzare le attività',
    action: 'organize_tasks',
    category: 'tasks',
    context: 'general'
  },
  {
    id: 'improve_focus',
    label: '🧠 Migliora il Focus',
    description: 'Strategie per mantenere la concentrazione',
    action: 'improve_focus',
    category: 'focus',
    context: 'general'
  },
  {
    id: 'view_progress',
    label: '📊 Vedi i Progressi',
    description: 'Controlla come stai andando oggi',
    action: 'view_progress',
    category: 'progress',
    context: 'general'
  },
  {
    id: 'quick_action',
    label: '⚡ Azione Rapida',
    description: 'Suggerimento immediato per iniziare',
    action: 'quick_action',
    category: 'quick',
    context: 'general'
  }
];

// Quick Actions specifiche per contesto di bassa energia
export const LOW_ENERGY_ACTIONS: QuickAction[] = [
  {
    id: 'easy_tasks',
    label: '🌱 Task Facili',
    description: 'Mostrami task che richiedono poca energia',
    action: 'suggest_easy_task',
    category: 'energy',
    context: 'low_energy'
  },
  {
    id: 'take_break',
    label: '☕ Pausa Strategica',
    description: 'Suggerisci una pausa rigenerante',
    action: 'take_break',
    category: 'energy',
    context: 'low_energy'
  },
  {
    id: 'micro_tasks',
    label: '⏱️ Micro Task',
    description: 'Task da 2-5 minuti per iniziare',
    action: 'start_micro_timer',
    category: 'quick',
    context: 'low_energy'
  }
];

// Quick Actions per alta energia
export const HIGH_ENERGY_ACTIONS: QuickAction[] = [
  {
    id: 'challenging_tasks',
    label: '🚀 Task Impegnativi',
    description: 'Sfrutta la tua energia per task complessi',
    action: 'suggest_challenging_task',
    category: 'energy',
    context: 'high_energy'
  },
  {
    id: 'focus_session',
    label: '🎯 Sessione Focus',
    description: 'Inizia una sessione di lavoro concentrato',
    action: 'start_focus_timer',
    category: 'focus',
    context: 'high_energy'
  },
  {
    id: 'tackle_backlog',
    label: '📚 Affronta il Backlog',
    description: 'Lavora sui task rimandati',
    action: 'tackle_backlog',
    category: 'tasks',
    context: 'high_energy'
  }
];

// Quick Actions per quando ci si sente sopraffatti
export const OVERWHELMED_ACTIONS: QuickAction[] = [
  {
    id: 'prioritize',
    label: '🎯 Prioritizza',
    description: 'Aiutami a scegliere cosa fare prima',
    action: 'prioritize_tasks',
    category: 'tasks',
    context: 'overwhelmed'
  },
  {
    id: 'break_down',
    label: '🔨 Spezza un Task',
    description: 'Rendi un task grande più gestibile',
    action: 'break_task',
    category: 'tasks',
    context: 'overwhelmed'
  },
  {
    id: 'focus_mode',
    label: '🔍 Modalità Focus',
    description: 'Nascondi tutto tranne i task essenziali',
    action: 'enable_focus_mode',
    category: 'focus',
    context: 'overwhelmed'
  },
  {
    id: 'mental_inbox',
    label: '📥 Svuota la Mente',
    description: 'Scarica tutti i pensieri nella Mental Inbox',
    action: 'open_mental_inbox',
    category: 'quick',
    context: 'overwhelmed'
  }
];

// Quick Actions per modalità focus
export const FOCUSED_ACTIONS: QuickAction[] = [
  {
    id: 'next_task',
    label: '➡️ Prossimo Task',
    description: 'Cosa fare dopo questo task',
    action: 'suggest_next_task',
    category: 'tasks',
    context: 'focused'
  },
  {
    id: 'extend_focus',
    label: '⏰ Estendi Focus',
    description: 'Continua la sessione di concentrazione',
    action: 'extend_focus_session',
    category: 'focus',
    context: 'focused'
  },
  {
    id: 'track_progress',
    label: '📈 Traccia Progresso',
    description: 'Segna quello che hai completato',
    action: 'track_progress',
    category: 'progress',
    context: 'focused'
  }
];

// Funzione per ottenere le quick actions appropriate al contesto
export const getContextualQuickActions = (context?: ADHDContext): QuickAction[] => {
  if (!context) {
    return DEFAULT_QUICK_ACTIONS;
  }

  const actions: QuickAction[] = [];

  // Logica basata sul livello di energia
  if (context.energyLevel !== undefined) {
    if (context.energyLevel <= 3) {
      actions.push(...LOW_ENERGY_ACTIONS.slice(0, 2));
    } else if (context.energyLevel >= 7) {
      actions.push(...HIGH_ENERGY_ACTIONS.slice(0, 2));
    }
  }

  // Logica basata sul numero di task attivi
  if (context.activeTasks && context.activeTasks > 10) {
    actions.push(...OVERWHELMED_ACTIONS.slice(0, 2));
  }

  // Logica basata sulla modalità focus
  if (context.focusMode) {
    actions.push(...FOCUSED_ACTIONS.slice(0, 2));
  }

  // Se non ci sono azioni specifiche, usa quelle di default
  if (actions.length === 0) {
    return DEFAULT_QUICK_ACTIONS;
  }

  // Aggiungi sempre alcune azioni generali
  const generalActions = DEFAULT_QUICK_ACTIONS.filter(action => 
    !actions.some(a => a.id === action.id)
  ).slice(0, 3 - actions.length);

  return [...actions, ...generalActions].slice(0, 5);
};

// Risposte del chatbot per le quick actions (linguaggio inclusivo)
export const QUICK_ACTION_RESPONSES: Record<string, string[]> = {
  manage_energy: [
    "Perfetto! Valutiamo insieme il tuo livello di energia attuale.",
    "Gestire l'energia è fondamentale per la produttività. Dimmi, come ti senti ora?",
    "L'energia è la risorsa più preziosa. Vediamo come ottimizzarla."
  ],
  
  organize_tasks: [
    "Ottima scelta! L'organizzazione è la chiave del successo.",
    "Mettiamo ordine insieme. Quale area ti preoccupa di più?",
    "Organizziamo tutto step by step. Da dove vuoi iniziare?"
  ],
  
  improve_focus: [
    "Il focus è una skill che si può allenare. Vediamo come migliorarlo.",
    "Concentrazione al top! Quali sono le tue principali distrazioni?",
    "Focus mode attivato! Eliminiamo tutto ciò che non serve."
  ],
  
  view_progress: [
    "Fantastico! Vedere i progressi motiva tantissimo.",
    "I tuoi risultati parlano chiaro. Ecco cosa hai ottenuto:",
    "Progress check! Sei sulla strada giusta."
  ],
  
  quick_action: [
    "Azione immediata in arrivo! Ecco cosa puoi fare ora:",
    "Perfetto per iniziare subito. Prova questo:",
    "Quick win in vista! Inizia con questo task facile:"
  ],
  
  prioritize_tasks: [
    "Prioritizzare è un'arte. Usiamo il metodo Eisenhower:",
    "Troppo da fare? Mettiamo tutto in ordine di importanza.",
    "Focus sui task che contano davvero. Ecco la priorità:"
  ],
  
  break_task: [
    "Task troppo grande? Lo spezziamo in parti gestibili.",
    "Divide et impera! Ecco come suddividere questo task:",
    "Un passo alla volta. Iniziamo dalla parte più facile:"
  ],
  
  take_break: [
    "Pausa strategica! Il riposo è produttività.",
    "Ricaricare le batterie è essenziale. Prova questo:",
    "Break time! Ecco come rigenerarti in pochi minuti:"
  ]
};

// Funzione per ottenere una risposta casuale per un'azione
export const getQuickActionResponse = (action: string): string => {
  const responses = QUICK_ACTION_RESPONSES[action] || [
    "Perfetto! Vediamo come posso aiutarti con questo.",
    "Ottima scelta! Procediamo insieme.",
    "Sono qui per supportarti. Iniziamo!"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};