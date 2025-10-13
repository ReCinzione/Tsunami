# 🎤 Guida al Sistema di Comando Vocale

## Panoramica

Il sistema di comando vocale di Tsunami permette di creare task e note utilizzando comandi vocali in italiano. Il sistema utilizza l'API Web Speech Recognition del browser per convertire la voce in testo e analizza automaticamente il contenuto per determinare se creare un task o una nota.

## Come Funziona la Distinzione Task vs Note

### 🎯 Creazione di Task

Il sistema identifica un **TASK** quando rileva parole chiave specifiche:

**Parole chiave per Task:**
- `devo`, `devo fare`
- `task`, `attività`, `compito`, `fare`
- `ricordami di`, `ricorda di`
- `programma`, `pianifica`
- `entro`, `scadenza`
- `urgente`, `importante`, `priorità`

**Esempi di comandi per Task:**
- *"Devo comprare il latte entro stasera"*
- *"Ricordami di chiamare il dottore"*
- *"Task urgente: finire il progetto"*
- *"Pianifica riunione con il team"*
- *"Attività importante per domani"*

### 📝 Creazione di Note

Il sistema identifica una **NOTA** quando rileva parole chiave specifiche:

**Parole chiave per Note:**
- `nota`, `appunto`
- `idea`, `pensiero`
- `ricorda che` (diverso da "ricordami di")
- `annotazione`, `memo`, `osservazione`

**Esempi di comandi per Note:**
- *"Nota: Mario ha detto che il meeting è spostato"*
- *"Idea per il nuovo progetto: usare React"*
- *"Appunto: ricorda che domani è festa"*
- *"Pensiero interessante sulla strategia"*

## Logica di Analisi

### Sistema di Punteggio

Il sistema utilizza un algoritmo di punteggio:

1. **Conta le parole chiave** presenti nel comando vocale
2. **Calcola il punteggio** per task e note separatamente
3. **Sceglie il tipo** con punteggio più alto
4. **Default**: Se nessuna parola chiave è rilevata, crea una nota

### Parametri Automatici per Task

#### Priorità
- **Alta**: Se contiene parole come "urgente", "subito", "presto", "importante"
- **Media**: Default per tutti gli altri task

#### Energia Richiesta
- **Alta**: Se il task è urgente
- **Bassa**: Se il comando è molto breve (< 20 caratteri)
- **Media**: Default

#### Scadenza
- **Oggi**: Se contiene "oggi"
- **Domani**: Se contiene "domani"
- **Nessuna**: Default

#### Ricompensa XP
- **Base**: 10 XP
- **Bonus urgenza**: +5 XP se urgente
- **Bonus confidenza**: +0-5 XP basato sulla qualità del riconoscimento vocale

## Esempi Pratici

### ✅ Task Creati Automaticamente

| Comando Vocale | Risultato |
|---|---|
| "Devo comprare il pane oggi" | Task: "comprare il pane", Scadenza: oggi, Priorità: media |
| "Ricordami di chiamare mamma urgente" | Task: "chiamare mamma", Priorità: alta, XP: 15 |
| "Task importante finire report entro domani" | Task: "finire report", Scadenza: domani, Priorità: alta |

### 📝 Note Create Automaticamente

| Comando Vocale | Risultato |
|---|---|
| "Nota: il meeting è alle 15" | Nota nella Mental Inbox |
| "Idea per migliorare l'app" | Nota nella Mental Inbox |
| "Ricorda che Marco è in ferie" | Nota nella Mental Inbox |

## Configurazione Tecnica

### Supporto Browser
- ✅ **Chrome/Chromium**: Supporto completo
- ✅ **Edge**: Supporto completo
- ✅ **Safari**: Supporto limitato
- ❌ **Firefox**: Non supportato

### Lingua
- **Configurata**: Italiano (it-IT)
- **Riconoscimento**: Ottimizzato per accento italiano
- **Parole chiave**: Tutte in italiano

### Campi Database

Ogni task/nota creato vocalmente include:
- `voice_created: true` - Indica creazione vocale
- `voice_confidence: 0.0-1.0` - Livello di confidenza del riconoscimento
- `description` - Include il testo originale del comando

## Risoluzione Problemi

### Errori Comuni

1. **"Microfono non accessibile"**
   - Verificare permessi del browser
   - Controllare che il microfono sia collegato

2. **"Browser non supportato"**
   - Usare Chrome o Edge
   - Aggiornare il browser all'ultima versione

3. **"Comando non riconosciuto"**
   - Parlare più chiaramente
   - Usare parole chiave specifiche
   - Riprovare in ambiente più silenzioso

### Best Practices

1. **Parlare chiaramente** e a velocità normale
2. **Usare parole chiave** specifiche all'inizio del comando
3. **Ambiente silenzioso** per migliore riconoscimento
4. **Comandi concisi** ma descrittivi
5. **Attendere** il feedback visivo prima di ripetere

## Roadmap Future

- [ ] Supporto per più lingue
- [ ] Riconoscimento di date più complesse
- [ ] Integrazione con categorie task
- [ ] Comandi vocali per modifica task esistenti
- [ ] Supporto per task ricorrenti vocali
- [ ] Analisi sentiment per priorità automatica

---

*Ultimo aggiornamento: 2025-01-21*