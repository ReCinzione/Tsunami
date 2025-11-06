import { Task } from '../features/tasks/types';

export interface SubtaskSuggestion {
  title: string;
  description?: string;
  priority: 'bassa' | 'media' | 'alta';
  estimatedMinutes?: number;
}

/**
 * Genera suggerimenti intelligenti per le subtask basati sul contenuto della task principale
 */
export function generateSubtaskSuggestions(task: Task): SubtaskSuggestion[] {
  const title = task.title.toLowerCase();
  const description = task.description?.toLowerCase() || '';
  const taskType = task.task_type;
  
  const suggestions: SubtaskSuggestion[] = [];
  
  // Suggerimenti basati su parole chiave comuni
  const keywordPatterns = [
    // Sviluppo/Programmazione
    {
      keywords: ['sviluppo', 'codice', 'programma', 'app', 'sito', 'software', 'bug', 'feature'],
      suggestions: [
        { title: 'Analisi dei requisiti', priority: 'alta' as const, estimatedMinutes: 30 },
        { title: 'Progettazione architettura', priority: 'alta' as const, estimatedMinutes: 45 },
        { title: 'Implementazione base', priority: 'media' as const, estimatedMinutes: 120 },
        { title: 'Testing e debug', priority: 'media' as const, estimatedMinutes: 60 },
        { title: 'Documentazione', priority: 'bassa' as const, estimatedMinutes: 30 }
      ]
    },
    
    // Studio/Ricerca
    {
      keywords: ['studio', 'ricerca', 'impara', 'corso', 'esame', 'libro', 'lezione'],
      suggestions: [
        { title: 'Raccolta materiali di studio', priority: 'alta' as const, estimatedMinutes: 20 },
        { title: 'Lettura e comprensione', priority: 'alta' as const, estimatedMinutes: 90 },
        { title: 'Presa di appunti', priority: 'media' as const, estimatedMinutes: 45 },
        { title: 'Ripasso e memorizzazione', priority: 'media' as const, estimatedMinutes: 60 },
        { title: 'Test di autovalutazione', priority: 'bassa' as const, estimatedMinutes: 30 }
      ]
    },
    
    // Lavoro/Business
    {
      keywords: ['riunione', 'meeting', 'presentazione', 'report', 'progetto', 'cliente', 'proposta'],
      suggestions: [
        { title: 'Preparazione agenda', priority: 'alta' as const, estimatedMinutes: 15 },
        { title: 'Ricerca informazioni', priority: 'alta' as const, estimatedMinutes: 45 },
        { title: 'Creazione contenuti', priority: 'media' as const, estimatedMinutes: 90 },
        { title: 'Revisione e controllo', priority: 'media' as const, estimatedMinutes: 30 },
        { title: 'Follow-up e comunicazione', priority: 'bassa' as const, estimatedMinutes: 20 }
      ]
    },
    
    // Casa/Personale
    {
      keywords: ['casa', 'pulizia', 'organizza', 'spesa', 'cucina', 'giardino', 'riparazione'],
      suggestions: [
        { title: 'Pianificazione e lista', priority: 'alta' as const, estimatedMinutes: 10 },
        { title: 'Raccolta strumenti/materiali', priority: 'alta' as const, estimatedMinutes: 15 },
        { title: 'Esecuzione principale', priority: 'media' as const, estimatedMinutes: 60 },
        { title: 'Pulizia e riordino', priority: 'bassa' as const, estimatedMinutes: 20 }
      ]
    },
    
    // Creatività/Design
    {
      keywords: ['design', 'creativo', 'arte', 'disegno', 'video', 'foto', 'grafica'],
      suggestions: [
        { title: 'Brainstorming e concept', priority: 'alta' as const, estimatedMinutes: 30 },
        { title: 'Ricerca ispirazione', priority: 'alta' as const, estimatedMinutes: 45 },
        { title: 'Bozze e prototipi', priority: 'media' as const, estimatedMinutes: 90 },
        { title: 'Realizzazione finale', priority: 'media' as const, estimatedMinutes: 120 },
        { title: 'Revisione e rifinitura', priority: 'bassa' as const, estimatedMinutes: 45 }
      ]
    }
  ];
  
  // Trova pattern corrispondenti
  for (const pattern of keywordPatterns) {
    const hasKeyword = pattern.keywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword)
    );
    
    if (hasKeyword) {
      suggestions.push(...pattern.suggestions);
      break; // Usa solo il primo pattern che corrisponde
    }
  }
  
  // Suggerimenti generici se nessun pattern specifico è trovato
  if (suggestions.length === 0) {
    suggestions.push(
      { title: 'Pianificazione iniziale', priority: 'alta', estimatedMinutes: 15 },
      { title: 'Ricerca e preparazione', priority: 'alta', estimatedMinutes: 30 },
      { title: 'Esecuzione principale', priority: 'media', estimatedMinutes: 60 },
      { title: 'Controllo qualità', priority: 'media', estimatedMinutes: 20 },
      { title: 'Finalizzazione', priority: 'bassa', estimatedMinutes: 15 }
    );
  }
  
  // Suggerimenti basati sul tipo di task
  if (taskType === 'urgent') {
    suggestions.forEach(s => {
      if (s.priority === 'bassa') s.priority = 'media';
      if (s.priority === 'media') s.priority = 'alta';
    });
  }
  
  // Limita a massimo 5 suggerimenti e personalizza i titoli
  return suggestions.slice(0, 5).map((suggestion, index) => ({
    ...suggestion,
    title: `${index + 1}. ${suggestion.title}`,
    description: `Subtask suggerita per: "${task.title}"`
  }));
}

/**
 * Genera suggerimenti basati su pattern ADHD-friendly
 */
export function generateADHDFriendlySubtasks(task: Task): SubtaskSuggestion[] {
  const suggestions: SubtaskSuggestion[] = [
    {
      title: 'Focus: Definisci obiettivo specifico',
      description: 'Chiarisci esattamente cosa vuoi ottenere',
      priority: 'alta',
      estimatedMinutes: 5
    },
    {
      title: 'Prepara: Raccogli tutto il necessario',
      description: 'Evita interruzioni raccogliendo strumenti e materiali',
      priority: 'alta',
      estimatedMinutes: 10
    },
    {
      title: 'Timer: Imposta sessione di lavoro',
      description: 'Usa la tecnica Pomodoro (25 min focus)',
      priority: 'media',
      estimatedMinutes: 25
    },
    {
      title: 'Checkpoint: Verifica progresso',
      description: 'Controlla se stai andando nella direzione giusta',
      priority: 'media',
      estimatedMinutes: 5
    },
    {
      title: 'Celebra: Riconosci il completamento',
      description: 'Prenditi un momento per apprezzare il lavoro fatto',
      priority: 'bassa',
      estimatedMinutes: 2
    }
  ];
  
  return suggestions;
}
