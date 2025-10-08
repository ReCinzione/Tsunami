# Local ChatBot - Documentazione Tecnica

## Overview

Il LocalChatBot è un assistente AI completamente locale progettato specificamente per utenti con ADHD. Funziona interamente nel browser senza inviare dati a server esterni, garantendo privacy totale.

## Architettura

### Componenti Principali

1. **Pattern Matching Engine**: Riconosce intenti basati su regex patterns
2. **Response Database**: Database locale di risposte pre-programmate
3. **Context Awareness**: Integrazione con stato ADHD dell'utente
4. **Action Suggestions**: Suggerisce azioni concrete nell'app

### Flusso di Elaborazione

```
Input Utente → Analisi Intent → Selezione Risposta → Personalizzazione → Output + Azioni
```

## Funzionalità ADHD-Specifiche

### Intent Supportati

- **Overwhelm**: Gestione del sovraccarico cognitivo
- **Focus**: Problemi di concentrazione
- **Procrastination**: Supporto anti-procrastinazione
- **Energy Management**: Gestione energia alta/bassa
- **Motivation**: Supporto motivazionale
- **Time Management**: Gestione del tempo

### Contesto ADHD

Il bot considera:
- Modalità Focus attiva
- Livello di energia (1-10)
- Numero di task attivi
- Ora del giorno
- Stato emotivo inferito

## Implementazione Tecnica

### Pattern Matching

```typescript
const INTENT_PATTERNS = {
  overwhelm: /sopraffatt|troppo|caos|confus|stress|ansia|panic/i,
  focus: /concentr|focus|distraz|attenz|mente/i,
  // ...
};
```

### Response Personalization

```typescript
const personalizeResponse = (baseResponse: string, intent: string): string => {
  // Aggiunge contesto basato su ora del giorno, focus mode, etc.
};
```

### Action Integration

```typescript
const suggestAction = (intent: string) => {
  const actions = {
    overwhelm: () => onActionSuggested?.('activate_focus_mode'),
    focus: () => onActionSuggested?.('start_pomodoro'),
    // ...
  };
};
```

## Estensibilità

### Aggiungere Nuovi Intent

1. **Aggiungi Pattern**:
```typescript
const INTENT_PATTERNS = {
  // existing patterns...
  new_intent: /pattern|keywords|here/i
};
```

2. **Aggiungi Risposte**:
```typescript
const ADHD_RESPONSES = {
  // existing responses...
  new_intent: [
    "Risposta 1 per nuovo intent",
    "Risposta 2 per nuovo intent"
  ]
};
```

3. **Aggiungi Azione** (opzionale):
```typescript
const suggestAction = (intent: string) => {
  const actions = {
    // existing actions...
    new_intent: () => onActionSuggested?.('new_action')
  };
};
```

### Migliorare Pattern Matching

#### Opzione 1: Pattern Più Sofisticati
```typescript
// Combinazioni di keywords
const COMPLEX_PATTERNS = {
  severe_overwhelm: /(sopraffatt|caos).*(non ce la faccio|troppo)/i,
  focus_with_deadline: /(concentr|focus).*(scadenza|urgente)/i
};
```

#### Opzione 2: Scoring System
```typescript
const calculateIntentScore = (message: string, intent: string): number => {
  const keywords = INTENT_KEYWORDS[intent];
  let score = 0;
  
  keywords.forEach(keyword => {
    if (message.toLowerCase().includes(keyword)) {
      score += keyword.weight || 1;
    }
  });
  
  return score;
};
```

## Integrazione con TensorFlow.js (Futuro)

### Setup Base
```typescript
import * as tf from '@tensorflow/tfjs';

class LocalNLPProcessor {
  private model: tf.LayersModel | null = null;
  
  async loadModel() {
    this.model = await tf.loadLayersModel('/models/adhd-intent-classifier.json');
  }
  
  async classifyIntent(text: string): Promise<{intent: string, confidence: number}> {
    // Tokenization e prediction
  }
}
```

### Vantaggi TensorFlow.js
- Classificazione intent più accurata
- Sentiment analysis
- Personalizzazione basata su cronologia
- Riconoscimento pattern complessi

## Performance e Ottimizzazioni

### Lazy Loading
```typescript
// Carica risposte solo quando necessario
const loadResponsesForIntent = async (intent: string) => {
  return await import(`./responses/${intent}.json`);
};
```

### Caching
```typescript
// Cache delle risposte recenti
const responseCache = new Map<string, string>();
```

### Memory Management
```typescript
// Limita cronologia messaggi
const MAX_MESSAGES = 50;
if (messages.length > MAX_MESSAGES) {
  setMessages(prev => prev.slice(-MAX_MESSAGES));
}
```

## Testing

### Unit Tests
```typescript
describe('LocalChatBot', () => {
  test('should recognize overwhelm intent', () => {
    const result = analyzeIntent('mi sento sopraffatto');
    expect(result.intent).toBe('overwhelm');
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});
```

### Integration Tests
```typescript
test('should suggest focus mode for overwhelm', () => {
  const mockOnAction = jest.fn();
  // Test complete flow
});
```

## Roadmap

### Fase 1: Base (✅ Completata)
- Pattern matching base
- Risposte pre-programmate
- Integrazione con contesto ADHD
- UI/UX ottimizzata

### Fase 2: Enhanced Intelligence
- [ ] TensorFlow.js integration
- [ ] Sentiment analysis
- [ ] Learning from user interactions
- [ ] Personalized response generation

### Fase 3: Advanced Features
- [ ] Voice input/output
- [ ] Emotional state tracking
- [ ] Proactive suggestions
- [ ] Integration with external ADHD tools

### Fase 4: Multi-Platform
- [ ] Mobile app integration
- [ ] Desktop app version
- [ ] Browser extension
- [ ] API per terze parti

## Considerazioni Privacy

### Dati Locali
- Tutte le conversazioni rimangono nel browser
- Nessun invio di dati a server esterni
- Storage locale per cronologia (opzionale)

### Compliance
- GDPR compliant (no data collection)
- HIPAA friendly (no health data transmission)
- Trasparenza totale sui dati processati

## Contribuire

### Aggiungere Risposte ADHD
1. Identifica gap nelle risposte attuali
2. Aggiungi risposte evidence-based
3. Testa con utenti ADHD reali
4. Documenta fonte e rationale

### Migliorare Pattern Recognition
1. Analizza conversazioni reali (anonimizzate)
2. Identifica pattern non catturati
3. Aggiungi/modifica regex patterns
4. Testa accuracy su dataset di validazione

### Ottimizzazioni Performance
1. Profila performance su dispositivi low-end
2. Ottimizza bundle size
3. Implementa lazy loading intelligente
4. Migliora memory management

## Conclusioni

Il LocalChatBot rappresenta un approccio innovativo al supporto ADHD:
- **Privacy-first**: Nessun dato lascia il dispositivo
- **ADHD-specific**: Progettato per bisogni specifici ADHD
- **Actionable**: Non solo conversazione, ma azioni concrete
- **Extensible**: Architettura modulare per future espansioni

L'obiettivo è creare un assistente che comprenda veramente le sfide ADHD e fornisca supporto pratico e immediato.