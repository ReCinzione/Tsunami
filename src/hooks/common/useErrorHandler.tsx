import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface ErrorContext {
  action?: string;
  component?: string;
  userId?: string;
  taskId?: string;
  retryAction?: () => void;
}

interface FriendlyErrorMessage {
  title: string;
  description: string;
  actionText?: string;
  variant: 'default' | 'destructive' | 'warning';
}

/**
 * Hook per gestione centralizzata degli errori con messaggi ADHD-friendly
 */
export const useErrorHandler = () => {
  const { toast } = useToast();

  /**
   * Categorizza l'errore e restituisce un messaggio gentile
   */
  const getFriendlyErrorMessage = useCallback((error: Error, context?: ErrorContext): FriendlyErrorMessage => {
    const errorMessage = error.message.toLowerCase();
    const action = context?.action || 'operazione';

    // Errori di rete
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return {
        title: "🌐 Problema di connessione",
        description: `Sembra che ci sia un piccolo intoppo con la connessione. Nessun problema, capita a tutti! Riprova tra un momento.`,
        actionText: "Riprova",
        variant: 'warning'
      };
    }

    // Errori di autenticazione
    if (errorMessage.includes('autenticato') || errorMessage.includes('unauthorized') || errorMessage.includes('login')) {
      return {
        title: "🔐 Accesso necessario",
        description: `Per continuare, hai bisogno di effettuare l'accesso. È solo una questione di sicurezza! 😊`,
        actionText: "Accedi",
        variant: 'default'
      };
    }

    // Errori di validazione
    if (errorMessage.includes('validation') || errorMessage.includes('required') || errorMessage.includes('invalid')) {
      return {
        title: "✨ Piccoli aggiustamenti",
        description: `Alcuni dettagli hanno bisogno di essere sistemati. Niente di grave, basta un piccolo ritocco!`,
        actionText: "Correggi",
        variant: 'warning'
      };
    }

    // Errori del server
    if (errorMessage.includes('server') || errorMessage.includes('500') || errorMessage.includes('internal')) {
      return {
        title: "☕ I nostri server stanno facendo una pausa",
        description: `Sembra che i nostri server abbiano bisogno di un momento di riposo. Torna tra qualche minuto, nel frattempo prenditi una pausa anche tu!`,
        actionText: "Riprova più tardi",
        variant: 'destructive'
      };
    }

    // Errori di permessi
    if (errorMessage.includes('permission') || errorMessage.includes('forbidden') || errorMessage.includes('access')) {
      return {
        title: "🚫 Accesso limitato",
        description: `Non hai i permessi necessari per questa azione. Se pensi sia un errore, contatta il supporto!`,
        actionText: "Contatta supporto",
        variant: 'warning'
      };
    }

    // Errori di timeout
    if (errorMessage.includes('timeout') || errorMessage.includes('slow')) {
      return {
        title: "⏰ Operazione lenta",
        description: `L'operazione sta richiedendo più tempo del previsto. Pazienza, a volte le cose buone richiedono tempo!`,
        actionText: "Aspetta ancora",
        variant: 'warning'
      };
    }

    // Errori specifici per task
    if (context?.action?.includes('task')) {
      if (errorMessage.includes('not found')) {
        return {
          title: "🔍 Task non trovata",
          description: `La task che stai cercando sembra essere scomparsa. Forse è già stata completata o eliminata?`,
          actionText: "Aggiorna lista",
          variant: 'warning'
        };
      }

      if (errorMessage.includes('already completed')) {
        return {
          title: "🎉 Task già completata!",
          description: `Ottimo lavoro! Questa task è già stata completata. Sei davvero efficiente!`,
          actionText: "Continua",
          variant: 'default'
        };
      }
    }

    // Errore generico con messaggio gentile
    return {
      title: "💪 Piccolo intoppo",
      description: `Qualcosa è andato storto, ma non è colpa tua! A volte capita, l'importante è non arrendersi. Proviamo di nuovo insieme!`,
      actionText: "Riprova",
      variant: 'destructive'
    };
  }, []);

  /**
   * Gestisce l'errore mostrando un toast gentile
   */
  const handleError = useCallback((error: Error, context?: ErrorContext) => {
    console.error(`Error in ${context?.action || 'unknown action'}:`, {
      error: error.message,
      stack: error.stack,
      context
    });

    const friendlyMessage = getFriendlyErrorMessage(error, context);
    
    toast({
      title: friendlyMessage.title,
      description: friendlyMessage.description,
      variant: friendlyMessage.variant,
      duration: friendlyMessage.variant === 'destructive' ? 6000 : 4000,
      action: context?.retryAction ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={context.retryAction}
        >
          {friendlyMessage.actionText || 'Riprova'}
        </Button>
      ) : undefined
    });
  }, [toast, getFriendlyErrorMessage]);

  /**
   * Gestisce errori con retry automatico
   */
  const handleErrorWithRetry = useCallback((
    error: Error, 
    retryFn: () => void, 
    context?: ErrorContext,
    maxRetries: number = 3
  ) => {
    const retryCount = (context as any)?.retryCount || 0;
    
    if (retryCount < maxRetries) {
      // Retry automatico con backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      
      setTimeout(() => {
        console.log(`Retry attempt ${retryCount + 1}/${maxRetries}`);
        retryFn();
      }, delay);
      
      toast({
        title: "🔄 Nuovo tentativo in corso...",
        description: `Tentativo ${retryCount + 1} di ${maxRetries}. Non mollare!`,
        variant: 'default',
        duration: 2000
      });
    } else {
      // Mostra errore finale dopo tutti i tentativi
      handleError(error, {
        ...context,
        retryAction: retryFn
      });
    }
  }, [handleError, toast]);

  /**
   * Gestisce errori di validazione con suggerimenti specifici
   */
  const handleValidationError = useCallback((errors: Record<string, string[]>) => {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');

    toast({
      title: "📝 Controlla questi campi",
      description: `Alcuni dettagli hanno bisogno di attenzione:\n${errorMessages}`,
      variant: 'warning',
      duration: 6000
    });
  }, [toast]);

  /**
   * Mostra messaggio di successo gentile
   */
  const showSuccess = useCallback((message: string, description?: string) => {
    toast({
      title: `✨ ${message}`,
      description: description || "Ottimo lavoro! Continua così! 🎉",
      variant: 'default',
      duration: 3000
    });
  }, [toast]);

  /**
   * Mostra avviso gentile
   */
  const showWarning = useCallback((message: string, description?: string) => {
    toast({
      title: `⚠️ ${message}`,
      description: description || "Solo un piccolo avviso, niente di grave!",
      variant: 'warning',
      duration: 4000
    });
  }, [toast]);

  /**
   * Mostra informazione utile
   */
  const showInfo = useCallback((message: string, description?: string) => {
    toast({
      title: `💡 ${message}`,
      description: description,
      variant: 'default',
      duration: 3000
    });
  }, [toast]);

  return {
    handleError,
    handleErrorWithRetry,
    handleValidationError,
    showSuccess,
    showWarning,
    showInfo,
    getFriendlyErrorMessage
  };
};

/**
 * Hook per gestire errori specifici delle operazioni async
 */
export const useAsyncErrorHandler = () => {
  const { handleError } = useErrorHandler();

  const wrapAsync = useCallback(<T extends any[], R>(
    asyncFn: (...args: T) => Promise<R>,
    context?: ErrorContext
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        handleError(error as Error, context);
        return null;
      }
    };
  }, [handleError]);

  return { wrapAsync };
};

/**
 * Hook per gestire stati di loading con timeout
 */
export const useLoadingWithTimeout = (timeoutMs: number = 30000) => {
  const { showWarning } = useErrorHandler();

  const createTimeoutWarning = useCallback((action: string) => {
    const timeoutId = setTimeout(() => {
      showWarning(
        "Operazione lenta",
        `${action} sta richiedendo più tempo del previsto. Pazienza, stiamo lavorando per te! ⏰`
      );
    }, timeoutMs);

    return () => clearTimeout(timeoutId);
  }, [showWarning, timeoutMs]);

  return { createTimeoutWarning };
};