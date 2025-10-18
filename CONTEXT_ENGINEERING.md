# 🧠 CONTEXT ENGINEERING SYSTEM - Tsunami

**Versione**: 1.0  
**Data**: 2025-01-21  
**Scopo**: Sistema per context engineering e miglioramento qualità codice  

---

## 🎯 OBIETTIVO CONTEXT ENGINEERING

Il **Context Engineering** è un approccio sistematico per:
1. **Centralizzare la conoscenza** del progetto
2. **Standardizzare le risposte** basate su contesto
3. **Migliorare la qualità** del codice e delle decisioni
4. **Accelerare lo sviluppo** riducendo ricerca di informazioni

---

## 📋 WORKFLOW CONTEXT ENGINEERING

### 1. PRIMA DI OGNI RISPOSTA
```
✅ Consulta CONTEXT_RAG.md per:
   - Architettura sistema
   - Pattern comuni
   - Problemi noti e soluzioni
   - Best practices ADHD

✅ Verifica coerenza con:
   - Stack tecnologico definito
   - Convenzioni di naming
   - Struttura directory
   - Tipi TypeScript esistenti
```

### 2. DURANTE LO SVILUPPO
```
✅ Segui pattern consolidati:
   - Callback pattern per azioni
   - Zustand per state management
   - shadcn/ui per componenti
   - Tailwind per styling

✅ Considera sempre:
   - Impatto su utenti ADHD
   - Integrazione con archetipi
   - Gestione energia/mood
   - Accessibilità cognitiva
```

### 3. DOPO OGNI MODIFICA
```
✅ Aggiorna documentazione:
   - CONTEXT_RAG.md se nuovi pattern
   - README specifici se nuove utility
   - Tipi TypeScript se nuove interfacce

✅ Testa integrazione:
   - Chatbot funziona correttamente
   - TaskStore sincronizzato
   - UI responsive e accessibile
   - Esegui test context-driven (src/test/contextFlows.test.ts)

✅ Verifica error handling:
   - useErrorHandler centralizzato
   - Messaggi user-friendly
   - Logging strutturato
```

---

## 🏗️ ARCHITETTURA STATE MANAGEMENT

### Distinzione Context vs Store
```
✅ REACT CONTEXT (Cross-cutting, low-traffic)
   ├── AuthProvider (App.tsx) - Autenticazione globale
   ├── TooltipProvider - UI tooltips
   └── QueryClientProvider - React Query cache

✅ ZUSTAND STORES (High-frequency, performance-critical)
   ├── useUIStore - Preferenze UI, focus mode, notifiche
   ├── useTaskStore - Task data, filtri, view modes
   └── Pattern: un solo provider Context per tipo

❌ ANTI-PATTERNS DA EVITARE
   ├── Nested provider dello stesso tipo (RISOLTO: rimosso AuthProvider da Index.tsx)
   ├── Context per dati che cambiano frequentemente
   ├── Store per dati cross-cutting stabili
   ├── Manual try/catch senza error handler centralizzato
   └── Azioni chatbot che non influenzano realmente lo stato
```

### Mobile-Ready Architecture
```
✅ Hooks condivisi (use-mobile.tsx, useAuth.tsx)
✅ Componenti granulari e riutilizzabili
✅ Store Zustand portabili su React Native
✅ Feature flags per differenziazione mobile
```

## 🔍 SISTEMA RAG (RETRIEVAL-AUGMENTED GENERATION)

### Knowledge Base Hierarchy
```
1. CONTEXT_RAG.md (PRIMARIO)
   ├── Architettura sistema
   ├── Pattern sviluppo
   ├── Problemi comuni
   └── Best practices

2. Documentazione Specifica
   ├── docs/LOCAL_CHATBOT.md
   ├── src/types/README.md
   ├── src/utils/README.md
   └── TSUNAMI_APPLICATION_DOCUMENTATION.md

3. Codice Sorgente
   ├── Componenti esistenti
   ├── Store Zustand
   ├── Utility functions
   └── Tipi TypeScript
```

### Retrieval Strategy
```typescript
// Pseudo-codice per context retrieval
function getRelevantContext(userQuery: string) {
  const contexts = [
    // 1. Cerca in CONTEXT_RAG.md
    searchRAG(userQuery),
    
    // 2. Cerca in documentazione specifica
    searchDocs(userQuery),
    
    // 3. Cerca nel codice esistente
    searchCodebase(userQuery)
  ];
  
  return prioritizeAndMerge(contexts);
}
```

---

## 🎯 QUALITY GATES

### Code Quality Checklist
```
✅ ARCHITETTURA
   - Segue pattern esistenti
   - Integrazione corretta con store
   - Rispetta separazione concerns

✅ TYPESCRIPT
   - Tipi definiti in src/types/
   - Interfacce documentate
   - Generics utilizzati correttamente

✅ ADHD-SPECIFIC
   - Considera cognitive load
   - Supporta diversi livelli energia
   - Integrato con sistema archetipi

✅ PERFORMANCE
   - Lazy loading dove possibile
   - Memoization per calcoli pesanti
   - Ottimizzato per mobile

✅ ACCESSIBILITÀ
   - Keyboard navigation
   - Screen reader friendly
   - Colori accessibili
```

### Response Quality Metrics
```
✅ COMPLETEZZA
   - Risposta basata su RAG
   - Considera tutti gli aspetti
   - Include esempi pratici

✅ COERENZA
   - Allineata con architettura
   - Usa terminologia standard
   - Segue convenzioni progetto

✅ ACTIONABILITY
   - Passi chiari e specifici
   - Codice pronto all'uso
   - Testing instructions
```

---

## 🚀 IMPLEMENTATION GUIDELINES

### 1. Nuove Feature
```markdown
## Template Nuova Feature

### Context Check
- [ ] Consultato CONTEXT_RAG.md
- [ ] Verificata integrazione con archetipi
- [ ] Considerato impatto ADHD

### Implementation
- [ ] Tipi TypeScript definiti
- [ ] Componenti seguono pattern esistenti
- [ ] Store integrato correttamente
- [ ] UI accessibile e responsive

### Documentation
- [ ] CONTEXT_RAG.md aggiornato
- [ ] README specifico creato/aggiornato
- [ ] Esempi d'uso documentati

### Testing
- [ ] Funzionalità testata manualmente
- [ ] Integrazione con chatbot verificata
- [ ] Performance accettabile
```

### 2. Bug Fix
```markdown
## Template Bug Fix

### Root Cause Analysis
- [ ] Problema identificato in CONTEXT_RAG.md?
- [ ] Pattern esistente violato?
- [ ] Integrazione store compromessa?

### Solution
- [ ] Fix allineato con architettura
- [ ] Non introduce regressioni
- [ ] Mantiene coerenza UX

### Prevention
- [ ] CONTEXT_RAG.md aggiornato con soluzione
- [ ] Pattern migliorato se necessario
- [ ] Quality gate rafforzato
```

---

## 📊 METRICS & MONITORING

### Development Velocity
```
📈 BEFORE Context Engineering:
   - Tempo ricerca informazioni: ~30% sviluppo
   - Inconsistenze architetturali: Frequenti
   - Rework per mancanza contesto: ~20%

📈 AFTER Context Engineering:
   - Tempo ricerca informazioni: ~5% sviluppo
   - Inconsistenze architetturali: Rare
   - Rework per mancanza contesto: ~2%
```

### Code Quality Indicators
```
✅ Consistency Score
   - Naming conventions: 95%+
   - Architecture patterns: 90%+
   - TypeScript coverage: 85%+

✅ ADHD Optimization Score
   - Cognitive load reduction: 80%+
   - Energy-aware features: 90%+
   - Accessibility compliance: 95%+
```

---

## 🔄 CONTINUOUS IMPROVEMENT

### Weekly RAG Updates
```
🗓️ OGNI LUNEDÌ:
   - Review nuovi pattern emersi
   - Aggiorna problemi comuni
   - Raffina best practices
   - Sincronizza con team
```

### Monthly Architecture Review
```
🗓️ OGNI MESE:
   - Valuta evoluzione architettura
   - Identifica debt tecnico
   - Pianifica refactoring
   - Aggiorna quality gates
```

---

## 🎯 SUCCESS CRITERIA

### Short Term (1 mese)
- [ ] CONTEXT_RAG.md utilizzato in 100% delle risposte
- [ ] Tempo sviluppo nuove feature ridotto del 40%
- [ ] Zero inconsistenze architetturali

### Medium Term (3 mesi)
- [ ] Documentazione auto-aggiornante
- [ ] Quality gates automatizzati
- [ ] Onboarding nuovi sviluppatori < 1 giorno

### Long Term (6 mesi)
- [ ] AI-assisted code generation basata su RAG
- [ ] Predictive architecture suggestions
- [ ] Zero technical debt accumulation

---

## 🛠️ TOOLS & AUTOMATION

### Recommended Tools
```bash
# Documentation
Typedoc          # Auto-generate API docs
Storybook        # Component documentation
Mermaid          # Architecture diagrams

# Code Quality
ESLint           # Code consistency
Prettier         # Code formatting
Husky            # Git hooks

# Context Search
ripgrep          # Fast text search
fzf              # Fuzzy finder
silver-searcher  # Code search
```

### Automation Scripts
```typescript
// scripts/update-rag.ts
// Auto-update CONTEXT_RAG.md when patterns change

// scripts/validate-architecture.ts
// Validate new code against established patterns

// scripts/generate-context.ts
// Generate context summaries for AI assistance
```

---

**🎯 Il Context Engineering è la chiave per portare Tsunami al prossimo livello. Ogni decisione deve essere informata dal RAG, ogni pattern deve essere documentato, ogni miglioramento deve essere condiviso.**

**💡 Remember: Context is King, Consistency is Queen, Quality is the Kingdom.**