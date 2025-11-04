---
status: Golden
updated: 2025-10-31
owner: fra
source_path: README_DEPLOY.md
---
# 🚀 Deploy su Vercel - Guida Completa

## 📋 Prerequisiti

- Account Vercel (gratuito)
- Repository GitHub collegato
- Credenziali Google OAuth per produzione

## 🔧 Setup Iniziale

### 1. Preparazione Repository

✅ **File già configurati:**
- `vercel.json` - Configurazione Vercel
- `vite.config.ts` - Ottimizzazioni bundle
- `.env.production` - Template variabili produzione

### 2. Collegamento a Vercel

1. Vai su [vercel.com](https://vercel.com)
2. Clicca "New Project"
3. Importa il repository GitHub
4. Vercel rileverà automaticamente che è un progetto Vite

### 3. Configurazione Variabili d'Ambiente

Nel dashboard Vercel, vai su **Settings > Environment Variables** e aggiungi:

```
VITE_SUPABASE_URL = https://dbjltvwgrhgrcthmkiwo.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiamx0dndncmhncmN0aG1raXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMDM2NzcsImV4cCI6MjA2ODU3OTY3N30.fxLEL_LfxX9plvLi9A1sh8FgED-0ppFb2F0H7SxFtpU
VITE_GOOGLE_CLIENT_ID = [DA_CONFIGURARE]
VITE_APP_ENV = production
```

## 🔑 Configurazione Google OAuth

### Passo 1: Crea Credenziali Produzione

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il progetto esistente o creane uno nuovo
3. Vai su **APIs & Services > Credentials**
4. Clicca **Create Credentials > OAuth 2.0 Client IDs**

### Passo 2: Configura URL di Callback

**Authorized JavaScript origins:**
```
https://tuoapp.vercel.app
```

**Authorized redirect URIs:**
```
https://tuoapp.vercel.app/auth/google/callback
```

> ⚠️ **Importante:** Sostituisci `tuoapp.vercel.app` con il tuo URL Vercel effettivo

### Passo 3: Aggiorna Vercel

Copia il **Client ID** e aggiornalo nelle variabili d'ambiente Vercel.

## 🚀 Deploy

### Deploy Automatico

Ogni push su `main` triggera automaticamente un deploy.

### Deploy Manuale

```bash
# Installa Vercel CLI (opzionale)
npm i -g vercel

# Deploy
vercel

# Deploy in produzione
vercel --prod
```

## 🧪 Test Pre-Deploy

```bash
# Test build locale
npm run build
npm run preview

# Verifica che tutto funzioni su http://localhost:4173
```

## 📊 Ottimizzazioni Implementate

### Bundle Splitting
- **vendor**: React, React DOM
- **ui**: Componenti Radix UI
- **supabase**: Client Supabase
- **router**: React Router
- **query**: TanStack Query
- **motion**: Framer Motion
- **charts**: Recharts

### Performance
- Cache headers ottimizzati
- Sourcemaps solo in sviluppo
- Chunk size limit aumentato a 1MB

## 🔍 Monitoraggio

### Vercel Analytics (Opzionale)

1. Nel dashboard Vercel, vai su **Analytics**
2. Abilita **Web Analytics**
3. Aggiungi il script nel `<head>` se necessario

### Logs e Debugging

- **Build logs**: Visibili nel dashboard Vercel
- **Runtime logs**: Nella sezione Functions
- **Performance**: Web Vitals automatici

## 🚨 Troubleshooting

### Errori Comuni

**Build fallisce:**
```bash
# Verifica localmente
npm run build
```

**Variabili d'ambiente non funzionano:**
- Verifica che inizino con `VITE_`
- Controlla spelling nel dashboard Vercel
- Redeploy dopo le modifiche

**Google OAuth non funziona:**
- Verifica URL di callback
- Controlla che il Client ID sia corretto
- Assicurati che il dominio sia autorizzato

**Routing non funziona:**
- Il file `vercel.json` include già le rewrites necessarie
- Tutte le route vengono reindirizzate a `/index.html`

## 📝 Checklist Deploy

- [ ] Repository pushato su GitHub
- [ ] Progetto collegato a Vercel
- [ ] Variabili d'ambiente configurate
- [ ] Google OAuth configurato per produzione
- [ ] Build locale testata
- [ ] Deploy completato con successo
- [ ] Funzionalità principali testate in produzione
- [ ] URL condiviso per il test

## 🔄 Aggiornamenti Futuri

Per aggiornare l'app:
1. Fai le modifiche in locale
2. Testa con `npm run build && npm run preview`
3. Push su GitHub
4. Vercel deploierà automaticamente

## 📞 Supporto

Per problemi specifici:
- Controlla i logs nel dashboard Vercel
- Verifica la documentazione Vercel
- Testa sempre localmente prima del deploy

---

**🎯 Questo setup è ottimizzato per un deploy di test rapido mantenendo lo stesso database di sviluppo.**