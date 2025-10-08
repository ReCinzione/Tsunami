import { supabase } from '@/integrations/supabase/client';

// Configurazione OAuth Google Calendar
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;

// Scopes necessari per Google Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
].join(' ');

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export class GoogleCalendarService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.loadTokensFromStorage();
  }

  // URL per l'autorizzazione OAuth
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Scambia il codice di autorizzazione con i token
  async exchangeCodeForTokens(code: string): Promise<void> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      
      // Salva i token nel database dell'utente
      await this.saveTokensToDatabase();
      this.saveTokensToStorage();
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  // Refresh del token di accesso
  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      
      await this.saveTokensToDatabase();
      this.saveTokensToStorage();
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  // Crea un evento nel calendario
  async createEvent(event: GoogleCalendarEvent): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar');
    }

    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (response.status === 401) {
        // Token scaduto, prova a fare refresh
        await this.refreshAccessToken();
        return this.createEvent(event); // Riprova
      }

      if (!response.ok) {
        throw new Error(`Failed to create calendar event: ${response.statusText}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  // Aggiorna un evento esistente
  async updateEvent(eventId: string, event: GoogleCalendarEvent): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.updateEvent(eventId, event);
      }

      if (!response.ok) {
        throw new Error(`Failed to update calendar event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  // Elimina un evento
  async deleteEvent(eventId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.deleteEvent(eventId);
      }

      if (!response.ok && response.status !== 410) { // 410 = Already deleted
        throw new Error(`Failed to delete calendar event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  // Verifica se l'utente è autenticato
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Disconnetti l'account Google
  async disconnect(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('google_calendar_tokens');
    
    // Rimuovi i token dal database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ 
          google_calendar_access_token: null,
          google_calendar_refresh_token: null 
        })
        .eq('user_id', user.id);
    }
  }

  // Salva i token nel localStorage
  private saveTokensToStorage(): void {
    if (this.accessToken && this.refreshToken) {
      localStorage.setItem('google_calendar_tokens', JSON.stringify({
        access_token: this.accessToken,
        refresh_token: this.refreshToken
      }));
    }
  }

  // Carica i token dal localStorage
  private loadTokensFromStorage(): void {
    const tokens = localStorage.getItem('google_calendar_tokens');
    if (tokens) {
      try {
        const parsed = JSON.parse(tokens);
        this.accessToken = parsed.access_token;
        this.refreshToken = parsed.refresh_token;
      } catch (error) {
        console.error('Error parsing stored tokens:', error);
        localStorage.removeItem('google_calendar_tokens');
      }
    }
  }

  // Salva i token nel database
  private async saveTokensToDatabase(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && this.accessToken && this.refreshToken) {
      await supabase
        .from('profiles')
        .update({ 
          google_calendar_access_token: this.accessToken,
          google_calendar_refresh_token: this.refreshToken 
        })
        .eq('user_id', user.id);
    }
  }
}

// Istanza singleton del servizio
export const googleCalendarService = new GoogleCalendarService();