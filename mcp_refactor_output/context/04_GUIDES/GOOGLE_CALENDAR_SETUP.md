---
status: Golden
updated: 2025-10-31
owner: fra
source_path: GOOGLE_CALENDAR_SETUP.md
---
# Configurazione Google Calendar Integration

Questa guida ti aiuterà a configurare l'integrazione con Google Calendar per sincronizzare automaticamente i tuoi task.

## 🔧 Configurazione Google Cloud Console

### 1. Accedi alla Google Cloud Console
- Vai su [Google Cloud Console](https://console.cloud.google.com/)
- Accedi con il tuo account Google

### 2. Crea o Seleziona un Progetto
- Clicca su "Select a project" in alto
- Crea un nuovo progetto o seleziona uno esistente
- Assegna un nome significativo (es. "TSUNAMI Calendar Integration")

### 3. Abilita l'API Google Calendar
- Nel menu laterale, vai su "APIs & Services" > "Library"
- Cerca "Google Calendar API"
- Clicca su "Google Calendar API" e poi "Enable"

### 4. Configura OAuth Consent Screen
- Vai su "APIs & Services" > "OAuth consent screen"
- Seleziona "External" (a meno che tu non abbia un Google Workspace)
- Compila i campi obbligatori:
  - **App name**: TSUNAMI Task Manager
  - **User support email**: la tua email
  - **Developer contact information**: la tua email
- Salva e continua
- Nella sezione "Scopes", aggiungi:
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/calendar.events`
- Salva e continua

### 5. Crea Credenziali OAuth 2.0
- Vai su "APIs & Services" > "Credentials"
- Clicca "+ CREATE CREDENTIALS" > "OAuth client ID"
- Seleziona "Web application"
- Configura:
  - **Name**: TSUNAMI Web Client
  - **Authorized JavaScript origins**:
    - `http://localhost:8080` (per sviluppo)
    - `https://tuodominio.com` (per produzione)
  - **Authorized redirect URIs**:
    - `http://localhost:8080/auth/google/callback` (per sviluppo)
    - `https://tuodominio.com/auth/google/callback` (per produzione)

### 6. Ottieni le Credenziali
- Dopo aver creato il client OAuth, vedrai:
  - **Client ID**: inizia con qualcosa come `123456789-abc...googleusercontent.com`
  - **Client Secret**: una stringa alfanumerica
- **IMPORTANTE**: Copia questi valori, li userai nel passo successivo

## 🔐 Configurazione Variabili d'Ambiente

### 1. Crea il file .env
Nella root del progetto TSUNAMI, crea un file `.env` (se non esiste già):

```bash
# Google Calendar Integration
VITE_GOOGLE_CLIENT_ID=il_tuo_client_id_qui
VITE_GOOGLE_CLIENT_SECRET=il_tuo_client_secret_qui

# Supabase (già configurato)
VITE_SUPABASE_URL=https://dbjltvwgrhgrcthmkiwo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Sostituisci i Valori
- Sostituisci `il_tuo_client_id_qui` con il Client ID ottenuto
- Sostituisci `il_tuo_client_secret_qui` con il Client Secret ottenuto

### 3. Riavvia il Server
```bash
npm run dev
```

## 🚀 Come Usare l'Integrazione

### 1. Collega il tuo Account Google
- Vai su **Impostazioni** nell'app TSUNAMI
- Nella sezione "Integrazioni", clicca "Collega Google Calendar"
- Autorizza l'accesso quando richiesto
- Vedrai lo stato "Collegato" ✅

### 2. Sincronizza i Task
- Quando crei un nuovo task, spunta "Sincronizza con Google Calendar"
- Assicurati di impostare una **data di scadenza**
- Il task verrà automaticamente creato nel tuo Google Calendar

### 3. Gestione Eventi
- Gli eventi sincronizzati avranno:
  - **Titolo**: Nome del task
  - **Descrizione**: Dettagli del task + priorità e categoria
  - **Durata**: 1 ora (predefinita)
  - **Promemoria**: 15 minuti e 1 ora prima

## 🚨 Risoluzione Problemi

### La sincronizzazione non funziona
**Sintomi**: Selezioni il checkbox "Sincronizza con Google Calendar" ma non succede nulla

**Possibili cause e soluzioni**:
1. **Google Calendar non collegato**
   - Vai nelle Impostazioni dell'app
   - Verifica se Google Calendar è collegato
   - Se non collegato, clicca "Collega Google Calendar"

2. **Variabili d'ambiente mancanti**
   - Controlla che il file `.env` contenga:
     ```
     VITE_GOOGLE_CLIENT_ID=il_tuo_client_id
     VITE_GOOGLE_CLIENT_SECRET=il_tuo_client_secret
     ```
   - Riavvia l'applicazione dopo aver aggiunto le variabili

3. **Data di scadenza mancante**
   - La sincronizzazione richiede SEMPRE una data di scadenza
   - Imposta una data e ora nel campo "Data di scadenza"

4. **Checkbox non selezionato**
   - Assicurati di spuntare "Sincronizza con Google Calendar" prima di creare il task

### Errore "Invalid Client"
- Verifica che `VITE_GOOGLE_CLIENT_ID` sia corretto
- Controlla che l'URL di callback sia configurato correttamente nella Google Cloud Console

### Errore "Access Denied"
- Assicurati che l'OAuth Consent Screen sia configurato
- Verifica che gli scopes siano corretti:
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/calendar.events`

### Token Scaduto
- L'app gestisce automaticamente il refresh dei token
- Se persistono problemi, disconnetti e riconnetti l'account dalle Impostazioni

### Debug della sincronizzazione
1. Apri la Console del browser (F12)
2. Vai nella tab "Console"
3. Prova a creare un task con sincronizzazione
4. Controlla eventuali errori rossi nella console
5. Gli errori più comuni:
   - `Google Calendar non è collegato` → Vai nelle Impostazioni
   - `La data di scadenza è richiesta` → Aggiungi una data al task
   - `Not authenticated` → Riconnetti Google Calendar

### URL di Callback Non Valido
- Assicurati che l'URL di callback sia esattamente:
  - `http://localhost:8080/auth/google/callback` (sviluppo)
  - `https://tuodominio.com/auth/google/callback` (produzione)
- L'URL deve essere identico in Google Cloud Console e nell'app

## 📋 URL di Callback per Configurazione

**Per Sviluppo Locale:**
```
http://localhost:8080/auth/google/callback
```

**Per Produzione:**
```
https://tuodominio.com/auth/google/callback
```

> **Nota**: Sostituisci `tuodominio.com` con il tuo dominio effettivo quando deploy in produzione.

## 🔒 Sicurezza

- **MAI** committare il file `.env` nel repository
- Le credenziali OAuth sono sensibili e devono essere protette
- In produzione, usa variabili d'ambiente del server/hosting
- I token di accesso vengono salvati in modo sicuro nel database Supabase

## 📞 Supporto

Se hai problemi con la configurazione:
1. Controlla la console del browser per errori dettagliati
2. Verifica che tutti i passaggi siano stati seguiti correttamente
3. Assicurati che le API siano abilitate e le quote non siano esaurite
4. Controlla che l'OAuth consent screen sia configurato correttamente