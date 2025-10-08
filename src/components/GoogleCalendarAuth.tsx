import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, AlertCircle, ExternalLink, Unlink } from 'lucide-react';
import { googleCalendarService } from '@/services/googleCalendar';
import { useToast } from '@/hooks/use-toast';

interface GoogleCalendarAuthProps {
  onAuthChange?: (isAuthenticated: boolean) => void;
}

export const GoogleCalendarAuth: React.FC<GoogleCalendarAuthProps> = ({ onAuthChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Controlla lo stato di autenticazione all'avvio
    const checkAuthStatus = () => {
      const authenticated = googleCalendarService.isAuthenticated();
      setIsAuthenticated(authenticated);
      onAuthChange?.(authenticated);
    };

    checkAuthStatus();

    // Gestisci il callback OAuth se presente nell'URL
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        toast({
          title: "Errore di autenticazione",
          description: "L'autorizzazione Google Calendar è stata annullata.",
          variant: "destructive"
        });
        return;
      }

      if (code) {
        setIsLoading(true);
        try {
          await googleCalendarService.exchangeCodeForTokens(code);
          setIsAuthenticated(true);
          onAuthChange?.(true);
          
          // Pulisci l'URL dai parametri OAuth
          window.history.replaceState({}, document.title, window.location.pathname);
          
          toast({
            title: "Connessione riuscita!",
            description: "Google Calendar è stato collegato con successo.",
          });
        } catch (error) {
          console.error('OAuth callback error:', error);
          toast({
            title: "Errore di connessione",
            description: "Impossibile collegare Google Calendar. Riprova.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleOAuthCallback();
  }, [onAuthChange, toast]);

  const handleConnect = () => {
    try {
      const url = googleCalendarService.getAuthUrl();
      setAuthUrl(url);
      // Apri la finestra di autorizzazione
      window.location.href = url;
    } catch (error) {
      console.error('Error generating auth URL:', error);
      toast({
        title: "Errore",
        description: "Impossibile generare l'URL di autorizzazione.",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await googleCalendarService.disconnect();
      setIsAuthenticated(false);
      onAuthChange?.(false);
      
      toast({
        title: "Disconnesso",
        description: "Google Calendar è stato scollegato.",
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Errore",
        description: "Errore durante la disconnessione.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyAuthUrl = () => {
    const url = googleCalendarService.getAuthUrl();
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copiato!",
      description: "L'URL di autorizzazione è stato copiato negli appunti.",
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Collega il tuo account Google Calendar per sincronizzare automaticamente i task.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stato di connessione */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Stato:</span>
          <Badge variant={isAuthenticated ? "default" : "secondary"} className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Collegato
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                Non collegato
              </>
            )}
          </Badge>
        </div>

        {/* Informazioni di configurazione */}
        {!isAuthenticated && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>URL di callback per Google OAuth:</strong>
              <br />
              <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 block">
                {window.location.origin}/auth/google/callback
              </code>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto mt-1"
                onClick={copyAuthUrl}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Copia URL autorizzazione
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Pulsanti di azione */}
        <div className="flex flex-col gap-2">
          {!isAuthenticated ? (
            <Button 
              onClick={handleConnect} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Connessione..." : "Collega Google Calendar"}
            </Button>
          ) : (
            <Button 
              onClick={handleDisconnect} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <Unlink className="w-4 h-4 mr-2" />
              {isLoading ? "Disconnessione..." : "Scollega Account"}
            </Button>
          )}
        </div>

        {/* Istruzioni per la configurazione */}
        {!isAuthenticated && (
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>Per configurare Google OAuth:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Vai alla <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
              <li>Crea un nuovo progetto o seleziona uno esistente</li>
              <li>Abilita l'API Google Calendar</li>
              <li>Crea credenziali OAuth 2.0</li>
              <li>Aggiungi l'URL di callback mostrato sopra</li>
              <li>Configura le variabili d'ambiente VITE_GOOGLE_CLIENT_ID e VITE_GOOGLE_CLIENT_SECRET</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
};