# 🛠️ Utility Functions per TSUNAMI ADHD App

Questa directory contiene le utility functions estratte dal `LocalChatBot.tsx` per migliorare la manutenibilità e riusabilità del codice.

## 📁 Struttura Files

### `moodEnhancements.ts`
**Scopo**: Gestione dei miglioramenti basati sull'umore giornaliero

**Funzioni principali**:
- `enhanceResponseWithMoodContext()` - Personalizza risposte chatbot in base all'umore
- `getMoodQuickActions()` - Genera azioni rapide specifiche per ogni umore
- `moodEnhancements` - Configurazioni per ogni stato d'animo ADHD

**Stati d'animo supportati**:
- 🧊 **Congelato**: Strategie per sbloccarsi quando ci si sente paralizzati
- ⚡ **Disorientato**: Approcci per quando si ha energia ma manca direzione
- 🌊 **In Flusso**: Supporto per mantenere e proteggere lo stato di flow
- ✨ **Ispirato**: Tecniche per catturare e canalizzare l'ispirazione

### `taskSuggestions.ts`
**Scopo**: Algoritmi intelligenti per suggerimenti di task personalizzati

**Funzioni principali**:
- `calculateMoodTaskScore()` - Calcola punteggio task basato su umore ed energia
- `predictOptimalTasksWithMood()` - Predice le task migliori per il momento attuale
- `getMoodBasedStrategicSuggestion()` - Suggerimenti strategici personalizzati
- `getContextualSuggestions()` - Suggerimenti basati su contesto (ora, carico task, etc.)

**Caratteristiche**:
- Matching intelligente energia-task
- Considerazione scadenze e priorità
- Adattamento ai pattern comportamentali utente
- Prevenzione overwhelm

### `chatbotResponses.ts`
**Scopo**: Template e logica per risposte del chatbot

**Funzioni principali**:
- `generateContextualHelp()` - Genera aiuto contestuale basato sulla domanda
- `needsImmediateAction()` - Rileva richieste urgenti di supporto
- `getImmediateActionSuggestions()` - Fornisce azioni immediate per situazioni critiche
- `getQuickActionsForMood()` - Azioni rapide specifiche per umore

**Template disponibili**:
- Saluti e accoglienza
- Supporto emotivo
- Aiuto con task
- Gestione overwhelm
- Incoraggiamento focus
- Suggerimenti pause

## 🎯 Vantaggi del Refactoring

### 1. **Manutenibilità**
- Codice organizzato in moduli logici
- Funzioni più piccole e focalizzate
- Facile individuazione e correzione bug

### 2. **Riusabilità**
- Utility functions utilizzabili in altri componenti
- Logica centralizzata per funzionalità ADHD
- Evita duplicazione codice

### 3. **Testabilità**
- Funzioni pure facilmente testabili
- Separazione logica business da UI
- Mock e stub più semplici

### 4. **Performance**
- Possibilità di memoizzazione selettiva
- Lazy loading delle utility
- Bundle splitting più efficace

### 5. **Type Safety**
- Tipi centralizzati e consistenti
- Migliore IntelliSense
- Errori rilevati a compile-time

## 🚀 Come Usare

### Importazione Base
```typescript
import { enhanceResponseWithMoodContext } from '@/utils/moodEnhancements';
import { predictOptimalTasksWithMood } from '@/utils/taskSuggestions';
import { generateContextualHelp } from '@/utils/chatbotResponses';
```

### Esempio Uso Mood Enhancement
```typescript
const baseResponse = "Ecco alcuni suggerimenti per te";
const moodContext = {
  mood: 'disorientato' as const,
  suggested_ritual: 'Lista priorità',
  date: new Date()
};

const enhancedResponse = enhanceResponseWithMoodContext(baseResponse, moodContext);
// Risultato: risposta personalizzata con suggerimenti specifici per "disorientato"
```

### Esempio Predizione Task
```typescript
const optimalTasks = predictOptimalTasksWithMood(
  allTasks,
  'in_flusso',
  8, // energia alta
  userBehaviorPattern,
  3  // limite task
);
// Risultato: 3 task migliori per stato "in flusso" con energia alta
```

## 🔄 Prossimi Sviluppi

1. **Machine Learning Integration**: Algoritmi di apprendimento per migliorare predizioni
2. **A/B Testing**: Framework per testare efficacia diverse strategie
3. **Analytics Integration**: Metriche per ottimizzare continuamente l'esperienza
4. **Personalizzazione Avanzata**: Profili utente più dettagliati
5. **Integrazione Wearables**: Dati biometrici per suggerimenti più precisi

## 📚 Riferimenti

- [ADHD Task Management Best Practices](../docs/LOCAL_CHATBOT.md)
- [TypeScript Types Documentation](../types/README.md)
- [Component Integration Guide](../components/README.md)