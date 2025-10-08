import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/AuthPage';
import { GoogleCalendarAuth } from '@/components/GoogleCalendarAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings, Calendar, User, Bell } from 'lucide-react';

export const SettingsPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-primary" />
          Impostazioni
        </h1>
        <p className="text-muted-foreground">
          Configura le tue preferenze e integrazioni per ottimizzare l'esperienza TSUNAMI.
        </p>
      </div>

      <div className="space-y-8">
        {/* Sezione Profilo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profilo Utente
            </CardTitle>
            <CardDescription>
              Informazioni del tuo account e preferenze personali.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID Utente</label>
                  <p className="text-xs font-mono bg-muted px-2 py-1 rounded">{user.id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Sezione Integrazioni */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Integrazioni
          </h2>
          <p className="text-muted-foreground mb-6">
            Collega servizi esterni per sincronizzare i tuoi task e routine.
          </p>

          {/* Google Calendar Integration */}
          <div className="mb-6">
            <GoogleCalendarAuth 
              onAuthChange={(isAuthenticated) => {
                console.log('Google Calendar auth status:', isAuthenticated);
              }}
            />
          </div>
        </div>

        <Separator />

        {/* Sezione Notifiche */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifiche
            </CardTitle>
            <CardDescription>
              Gestisci come e quando ricevere le notifiche.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>⚠️ Le impostazioni delle notifiche saranno disponibili in una versione futura.</p>
                <p className="mt-2">Per ora, le notifiche vengono gestite tramite:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Toast notifications nell'app</li>
                  <li>Promemoria di Google Calendar (se collegato)</li>
                  <li>Notifiche del browser (se abilitate)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informazioni di Debug */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Informazioni di Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-2 font-mono">
              <div>
                <span className="text-muted-foreground">Ambiente:</span> {import.meta.env.MODE}
              </div>
              <div>
                <span className="text-muted-foreground">URL Callback Google:</span> {window.location.origin}/auth/google/callback
              </div>
              <div>
                <span className="text-muted-foreground">Timestamp:</span> {new Date().toISOString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};