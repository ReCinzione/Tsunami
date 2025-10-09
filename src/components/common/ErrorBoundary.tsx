import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Home, 
  Bug, 
  Heart, 
  Coffee,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Error Boundary con design ADHD-friendly e messaggi gentili
 */
export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Salva l'errore nello store UI
    useUIStore.getState().setLastError(error);
    useUIStore.getState().setErrorBoundaryInfo(errorInfo);
    
    // Callback personalizzata
    this.props.onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= 3) {
      // Dopo 3 tentativi, suggerisci di ricaricare la pagina
      window.location.reload();
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1
    });

    // Aggiungi un piccolo delay per evitare loop immediati
    this.retryTimeoutId = setTimeout(() => {
      // Reset del retry count dopo un po' di tempo
      this.setState({ retryCount: 0 });
    }, 30000);
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  getErrorMessage = (error: Error): string => {
    // Messaggi gentili basati sul tipo di errore
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Sembra che ci sia un problemino con la connessione. Niente panico! 🌐';
    }
    
    if (errorMessage.includes('chunk') || errorMessage.includes('loading')) {
      return 'Sto caricando qualcosa di nuovo... Un momento di pazienza! ⏳';
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return 'Ops, sembra che tu non abbia i permessi per questa azione. Proviamo insieme a risolverlo! 🔐';
    }
    
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return 'Non riesco a trovare quello che stai cercando. Forse è nascosto da qualche parte? 🔍';
    }
    
    return 'Qualcosa è andato storto, ma non è colpa tua! Succede anche ai migliori. 💙';
  };

  getSuggestions = (): string[] => {
    const { error, retryCount } = this.state;
    const suggestions = [];
    
    if (retryCount === 0) {
      suggestions.push('Prova a cliccare "Riprova" - spesso funziona! ✨');
    }
    
    if (retryCount >= 1) {
      suggestions.push('Controlla la tua connessione internet 📶');
      suggestions.push('Prova a ricaricare la pagina 🔄');
    }
    
    if (retryCount >= 2) {
      suggestions.push('Fai una pausa di 30 secondi e riprova ☕');
      suggestions.push('Chiudi e riapri il browser 🌟');
    }
    
    suggestions.push('Se il problema persiste, non esitare a contattarci! 💬');
    
    return suggestions;
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, retryCount } = this.state;
      const errorMessage = error ? this.getErrorMessage(error) : 'Qualcosa è andato storto';
      const suggestions = this.getSuggestions();

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl mx-auto shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl font-semibold text-gray-800 mb-2">
                Oops! Un piccolo intoppo 🌈
              </CardTitle>
              <p className="text-gray-600 text-lg">
                {errorMessage}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Suggerimenti gentili */}
              <Alert className="border-blue-200 bg-blue-50">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <div className="space-y-2">
                    <p className="font-medium">Ecco cosa puoi provare:</p>
                    <ul className="space-y-1 text-sm">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Azioni */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center gap-2"
                  size="lg"
                >
                  <RefreshCw className="h-4 w-4" />
                  {retryCount >= 3 ? 'Ricarica Pagina' : 'Riprova'}
                  {retryCount > 0 && (
                    <span className="text-xs opacity-75">({retryCount}/3)</span>
                  )}
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 flex items-center gap-2"
                  size="lg"
                >
                  <Home className="h-4 w-4" />
                  Torna alla Home
                </Button>
              </div>

              {/* Messaggio di incoraggiamento */}
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <Coffee className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 text-sm">
                  <strong>Ricorda:</strong> Gli errori capitano a tutti, anche agli sviluppatori più esperti! 
                  Stai facendo un ottimo lavoro usando Tsunami. 💚
                </p>
              </div>

              {/* Dettagli tecnici (collassabili) */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Dettagli tecnici (per sviluppatori)
                  </summary>
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg text-xs font-mono overflow-auto">
                    <div className="mb-2">
                      <strong>Errore:</strong> {error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook per utilizzare l'Error Boundary in modo più semplice
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);
  
  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);
  
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
  
  return { captureError, resetError };
};

// Componente wrapper per facilità d'uso
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = (props) => {
  return <ErrorBoundary {...props} />;
};