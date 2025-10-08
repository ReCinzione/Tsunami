import React from 'react';
import { QuickAction, MoodType } from '../types/chatbot';
import { getQuickActionsForMood } from '../utils/chatbotResponses';

interface QuickActionsProps {
  mood?: MoodType;
  onActionClick: (action: QuickAction) => void;
  className?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  mood, 
  onActionClick, 
  className = '' 
}) => {
  if (!mood) return null;

  const actions = getQuickActionsForMood(mood);
  
  if (actions.length === 0) return null;

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300';
    }
  };

  const getMoodEmoji = (mood: MoodType) => {
    switch (mood) {
      case 'congelato': return '🧊';
      case 'disorientato': return '⚡';
      case 'in_flusso': return '🌊';
      case 'ispirato': return '✨';
      case 'sopraffatto': return '😰';
      case 'iperfocus': return '🎯';
      default: return '💭';
    }
  };

  return (
    <div className={`quick-actions-container ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{getMoodEmoji(mood)}</span>
        <span className="text-sm font-medium text-gray-600 capitalize">
          Azioni per stato: {mood.replace('_', ' ')}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action)}
            className={`
              inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium
              transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${getPriorityColor(action.priority)}
            `}
            title={`Priorità: ${action.priority}`}
          >
            {action.icon && (
              <span className="text-base" role="img" aria-label={action.label}>
                {action.icon}
              </span>
            )}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        💡 Suggerimento: Clicca su un'azione per ricevere supporto immediato
      </div>
    </div>
  );
};

export default QuickActions;

// Hook personalizzato per gestire le azioni
export const useQuickActions = () => {
  const handleQuickAction = React.useCallback((action: QuickAction) => {
    switch (action.action) {
      case 'create_task':
        // Integrazione con Task Manager
        console.log('Aprendo creazione task...');
        // TODO: Implementare navigazione a Task Manager
        break;
        
      case 'set_reminder':
        // Integrazione con sistema reminder
        console.log('Impostando reminder...');
        // TODO: Implementare modal reminder
        break;
        
      case 'start_focus_session':
        // Avvio sessione focus
        console.log('Avviando sessione focus...');
        // TODO: Implementare timer focus
        break;
        
      case 'take_break':
        // Suggerimento pausa
        console.log('Suggerendo pausa...');
        // TODO: Implementare break suggestions
        break;
        
      case 'mood_check':
        // Check-in umore
        console.log('Avviando mood check...');
        // TODO: Implementare mood tracker
        break;
        
      case 'show_calendar':
        // Mostra calendario
        console.log('Aprendo calendario...');
        // TODO: Implementare integrazione calendario
        break;
        
      case 'open_mental_inbox':
        // Apri Mental Inbox
        console.log('Aprendo Mental Inbox...');
        // TODO: Implementare navigazione Mental Inbox
        break;
        
      default:
        console.warn('Azione non riconosciuta:', action.action);
    }
  }, []);

  return { handleQuickAction };
};

// Componente per azioni immediate in caso di overwhelm
export const EmergencyActions: React.FC<{
  onActionClick: (action: QuickAction) => void;
}> = ({ onActionClick }) => {
  const emergencyActions: QuickAction[] = [
    {
      id: 'emergency-breathe',
      label: 'Respira (4-7-8)',
      action: 'take_break',
      icon: '🫁',
      priority: 'high'
    },
    {
      id: 'emergency-brain-dump',
      label: 'Brain Dump',
      action: 'open_mental_inbox',
      icon: '🧠',
      priority: 'high'
    },
    {
      id: 'emergency-simplify',
      label: 'Semplifica',
      action: 'create_task',
      icon: '✂️',
      priority: 'medium'
    }
  ];

  return (
    <div className="emergency-actions bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-red-600 text-lg">🚨</span>
        <span className="text-sm font-semibold text-red-800">
          Azioni di Emergenza - Quando ti senti sopraffatto
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {emergencyActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action)}
            className="
              inline-flex items-center gap-2 px-4 py-2 rounded-lg
              bg-red-100 hover:bg-red-200 text-red-800 border border-red-300
              text-sm font-medium transition-all duration-200 hover:scale-105
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
            "
          >
            <span className="text-base">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-red-600">
        ⚡ Queste azioni sono progettate per aiutarti immediatamente quando ti senti bloccato
      </div>
    </div>
  );
};