import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Aggiorna lo state per mostrare la UI di fallback
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log dell'errore per debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Salva i dettagli dell'errore nello state
    this.setState({
      error,
      errorInfo
    });

    // Callback personalizzata per gestione errori
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Invia errore a servizio di monitoring (es. Sentry)
    // this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Implementazione futura per logging centralizzato
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Per ora solo console.log, in futuro API call
    console.log('Error logged:', errorData);
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI personalizzata se fornita
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI di fallback predefinita ottimizzata per ADHD
      return (
        <div className="error-boundary-container min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
          <div className="error-content bg-white rounded-xl shadow-lg border border-red-200 max-w-md w-full p-6">
            {/* Header con emoji rassicurante */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🌊</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Oops! Qualcosa è andato storto
              </h1>
              <p className="text-gray-600 text-sm">
                Non preoccuparti, capita anche ai migliori! 💙
              </p>
            </div>

            {/* Messaggio rassicurante per utenti ADHD */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl flex-shrink-0">💡</span>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Per utenti ADHD:</p>
                  <p>Questo errore non è colpa tua! A volte le app hanno piccoli intoppi. Prova a ricaricare o contattaci se il problema persiste.</p>
                </div>
              </div>
            </div>

            {/* Azioni disponibili */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                Riprova
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span>↻</span>
                Ricarica Pagina
              </button>
            </div>

            {/* Dettagli errore (solo in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700 font-medium">
                  Dettagli Tecnici (Development)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded border text-gray-700 font-mono text-xs overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Errore:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Link di supporto */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 mb-2">
                Problema persistente?
              </p>
              <a 
                href="mailto:support@tsunami-adhd.app?subject=Errore Applicazione"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
              >
                Contatta il Supporto 📧
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook per gestire errori in componenti funzionali
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    
    // TODO: Invia a servizio di monitoring
    // logErrorToService(error, context);
  }, []);

  return { handleError };
};

// Componente wrapper per errori asincroni
export const AsyncErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, onError }) => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason);
      setError(error);
      if (onError) onError(error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  if (error) {
    throw error; // Sarà catturato da ErrorBoundary parent
  }

  return <>{children}</>;
};

// Componente per errori specifici del chatbot
export const ChatbotErrorFallback: React.FC<{
  error?: Error;
  onRetry?: () => void;
}> = ({ error, onRetry }) => {
  return (
    <div className="chatbot-error bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
      <div className="flex items-start gap-3">
        <span className="text-yellow-600 text-2xl flex-shrink-0">🤖💔</span>
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800 mb-2">
            Il chatbot ha avuto un piccolo problema
          </h3>
          <p className="text-sm text-yellow-700 mb-3">
            Non preoccuparti! Questo capita quando il chatbot sta "pensando" troppo intensamente. 
            Proviamo a riavviarlo.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200"
            >
              🔄 Riavvia Chatbot
            </button>
          )}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-3">
              <summary className="text-xs text-yellow-600 cursor-pointer">
                Dettagli errore
              </summary>
              <pre className="text-xs text-yellow-700 mt-1 overflow-auto max-h-20">
                {error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};