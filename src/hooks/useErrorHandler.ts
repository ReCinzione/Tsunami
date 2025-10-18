import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  customMessage?: string;
}

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback(
    (
      error: Error | unknown,
      context?: ErrorContext,
      options: ErrorHandlerOptions = {}
    ) => {
      const {
        showToast = true,
        logToConsole = true,
        customMessage
      } = options;

      // Estrai messaggio di errore
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log strutturato per debugging
      if (logToConsole) {
        console.error('🚨 Error Handler:', {
          error: errorMessage,
          context,
          timestamp: new Date().toISOString(),
          stack: error instanceof Error ? error.stack : undefined
        });
      }

      // Mostra toast user-friendly
      if (showToast) {
        const title = customMessage || getErrorTitle(context?.action);
        const description = getUserFriendlyMessage(errorMessage);
        
        toast({
          title,
          description,
          variant: "destructive"
        });
      }

      // In futuro: invia a servizio di logging (Sentry, LogRocket, etc.)
      // logToExternalService(error, context);
    },
    [toast]
  );

  return { handleError };
};

// Helper per titoli contestuali
function getErrorTitle(action?: string): string {
  const actionTitles: Record<string, string> = {
    'load_profile': 'Errore Caricamento Profilo',
    'load_tasks': 'Errore Caricamento Task',
    'create_task': 'Errore Creazione Task',
    'update_task': 'Errore Aggiornamento Task',
    'delete_task': 'Errore Eliminazione Task',
    'auth': 'Errore Autenticazione',
    'mood_check': 'Errore Controllo Umore',
    'archetype_load': 'Errore Caricamento Archetipi'
  };

  return actionTitles[action || ''] || 'Errore';
}

// Helper per messaggi user-friendly
function getUserFriendlyMessage(errorMessage: string): string {
  // Mappa errori tecnici a messaggi comprensibili
  const errorMappings: Record<string, string> = {
    'Network Error': 'Problema di connessione. Riprova tra poco.',
    'PGRST116': 'Nessun dato trovato.',
    'JWT': 'Sessione scaduta. Effettua nuovamente il login.',
    'permission denied': 'Non hai i permessi per questa operazione.',
    'duplicate key': 'Elemento già esistente.',
    'foreign key': 'Impossibile completare: dipendenze mancanti.'
  };

  // Cerca pattern noti
  for (const [pattern, message] of Object.entries(errorMappings)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  // Fallback generico
  return 'Si è verificato un errore imprevisto. Riprova o contatta il supporto.';
}

// Hook specializzato per errori async
export const useAsyncErrorHandler = () => {
  const { handleError } = useErrorHandler();

  const wrapAsync = useCallback(
    <T extends (...args: any[]) => Promise<any>>(
      asyncFn: T,
      context?: ErrorContext,
      options?: ErrorHandlerOptions
    ): T => {
      return (async (...args: Parameters<T>) => {
        try {
          return await asyncFn(...args);
        } catch (error) {
          handleError(error, context, options);
          throw error; // Re-throw per permettere gestione locale se necessaria
        }
      }) as T;
    },
    [handleError]
  );

  return { wrapAsync, handleError };
};