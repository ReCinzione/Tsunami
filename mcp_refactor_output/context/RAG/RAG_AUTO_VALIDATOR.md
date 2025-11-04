---
status: Golden
updated: 2025-10-31
owner: fra
source_path: RAG_AUTO_VALIDATOR.md
last_detected: 2025-01-21
---
# 🔍 RAG AUTO-VALIDATOR - Sistema di Coerenza Automatica

**Versione**: 1.0  
**Data**: 2025-01-21  
**Scopo**: Garantire coerenza automatica tra RAG e codebase reale  

---

## 🎯 MANDATORY PRE-RESPONSE CHECKLIST

### ✅ STEP 1: RAG CONSULTATION (OBBLIGATORIO)
```
🔍 PRIMA DI OGNI RISPOSTA:
   1. Leggi CONTEXT_RAG.md sezioni rilevanti
   2. Verifica pattern applicabili
   3. Controlla problemi noti
   4. Identifica best practices ADHD
   
❌ MAI rispondere senza consultare il RAG
✅ SEMPRE basare la risposta su informazioni RAG
```

### ✅ STEP 2: REAL-TIME VALIDATION
```
🔍 DURANTE LA RISPOSTA:
   1. Confronta RAG con codice reale se necessario
   2. Identifica discrepanze
   3. Aggiorna RAG se trovate inconsistenze
   4. Documenta nuovi pattern scoperti
```

### ✅ STEP 3: POST-RESPONSE UPDATE
```
🔍 DOPO OGNI MODIFICA:
   1. Aggiorna CONTEXT_RAG.md se nuovo pattern
   2. Documenta problema risolto se applicabile
   3. Aggiorna best practices se migliorate
   4. Mantieni coerenza documentazione
```

---

## 🚨 VALIDATION RULES

### Rule 1: RAG-First Approach
```
❌ VIETATO: Rispondere basandosi solo su conoscenza generale
✅ OBBLIGATORIO: Consultare sempre CONTEXT_RAG.md prima
✅ PREFERITO: Citare sezione RAG utilizzata
```

### Rule 2: Real-Code Verification
```
❌ VIETATO: Assumere struttura codice senza verificare
✅ OBBLIGATORIO: Verificare file esistenti se in dubbio
✅ PREFERITO: Aggiornare RAG se trovate discrepanze
```

### Rule 3: Pattern Consistency
```
❌ VIETATO: Introdurre pattern non documentati
✅ OBBLIGATORIO: Seguire pattern esistenti in RAG
✅ PREFERITO: Documentare nuovi pattern nel RAG
```

### Rule 4: ADHD Optimization
```
❌ VIETATO: Ignorare considerazioni ADHD
✅ OBBLIGATORIO: Sempre considerare cognitive load
✅ PREFERITO: Riferirsi a sezione "Design Principles ADHD"
```

---

## 🔄 AUTO-UPDATE TRIGGERS

### Quando Aggiornare CONTEXT_RAG.md
```
🔄 TRIGGER AUTOMATICI:
   ✅ Nuovo pattern identificato (>1 uso)
   ✅ Problema risolto non documentato
   ✅ Best practice migliorata
   ✅ Struttura file cambiata
   ✅ Nuova utility function creata
   ✅ Integrazione modificata
   ✅ Schema database aggiornato
```

### Template Aggiornamento RAG
```markdown
## 📝 RAG UPDATE - [DATA]

### Sezione Modificata
[Sezione del RAG aggiornata]

### Motivo Aggiornamento
- [ ] Nuovo pattern identificato
- [ ] Inconsistenza corretta
- [ ] Best practice migliorata
- [ ] Struttura codice cambiata

### Dettagli Modifica
[Descrizione specifica della modifica]

### Impatto
- **Componenti Interessati**: [lista]
- **Pattern Modificati**: [lista]
- **Breaking Changes**: [sì/no]
```

---

## 🎯 QUALITY GATES

### Pre-Response Quality Check
```typescript
// Pseudo-codice per quality gate
function validatePreResponse(query: string): ValidationResult {
  return {
    ragConsulted: hasRAGReference(query),
    patternIdentified: hasPatternReference(query),
    adhdConsidered: hasADHDConsiderations(query),
    codeVerified: hasCodeVerification(query),
    score: calculateQualityScore()
  };
}

// MINIMUM SCORE: 80/100
// EXCELLENT SCORE: 95/100
```

### Post-Response Validation
```typescript
// Pseudo-codice per post-validation
function validatePostResponse(response: string): ValidationResult {
  return {
    ragUpdated: needsRAGUpdate(response),
    patternDocumented: hasNewPatternDocumented(response),
    problemSolved: hasProblemSolutionDocumented(response),
    consistencyMaintained: isConsistentWithRAG(response)
  };
}
```

---

## 📊 CONSISTENCY METRICS

### Daily Tracking
```
📈 METRICHE GIORNALIERE:
   - % Risposte con RAG consultation: TARGET 100%
   - % Pattern consistency: TARGET 95%+
   - % ADHD considerations: TARGET 90%+
   - Numero inconsistenze trovate: TARGET <3
   - Numero aggiornamenti RAG: NORMALE 1-3
```

### Weekly Analysis
```
📈 ANALISI SETTIMANALE:
   - Nuovi pattern emersi: DOCUMENTARE
   - Problemi ricorrenti: AGGIORNARE RAG
   - Best practices migliorate: CONDIVIDERE
   - Quality score medio: TARGET 90%+
```

---

## 🛠️ VALIDATION TOOLS

### Manual Validation Commands
```bash
# Cerca inconsistenze tra RAG e codice
grep -r "pattern_name" src/ | compare_with_rag.sh

# Verifica utility functions documentate
ls src/utils/*.ts | validate_rag_coverage.sh

# Controlla tipi TypeScript aggiornati
find src/types -name "*.ts" | check_rag_types.sh
```

### Automated Checks
```typescript
// Script di validazione automatica
interface RAGValidation {
  fileStructureMatch: boolean;
  utilityFunctionsMatch: boolean;
  typesConsistency: boolean;
  patternsDocumented: boolean;
  problemsSolutionsUpdated: boolean;
}

function validateRAGConsistency(): RAGValidation {
  // Implementazione validazione automatica
}
```

---

## 🚀 IMPLEMENTATION WORKFLOW

### Workflow Standard
```
1. 🔍 QUERY RECEIVED
   ↓
2. 📖 CONSULT CONTEXT_RAG.md (MANDATORY)
   ↓
3. 🔍 VERIFY CODE IF NEEDED
   ↓
4. 📝 IDENTIFY INCONSISTENCIES
   ↓
5. 💡 GENERATE RAG-BASED RESPONSE
   ↓
6. 🔄 UPDATE RAG IF NECESSARY
   ↓
7. ✅ VALIDATE CONSISTENCY
```

### Emergency Workflow (Inconsistenza Critica)
```
1. 🚨 CRITICAL INCONSISTENCY FOUND
   ↓
2. 🛑 STOP CURRENT RESPONSE
   ↓
3. 🔧 FIX RAG IMMEDIATELY
   ↓
4. 🔍 RE-VALIDATE ENTIRE SECTION
   ↓
5. 📝 DOCUMENT FIX IN RAG
   ↓
6. ✅ RESUME WITH CORRECTED INFO
```

---

## 📚 REFERENCE SECTIONS

### Critical RAG Sections (Always Check)
```
🎯 SEZIONI CRITICHE:
   - "Componenti Critici" → Per modifiche componenti
   - "Pattern Comuni Sviluppo" → Per nuove implementazioni
   - "Problemi Comuni & Soluzioni" → Per debugging
   - "Utility Functions Chiave" → Per utility usage
   - "Design Principles ADHD" → Per UI/UX decisions
```

### Context Priority Matrix
```
🔥 PRIORITÀ ALTA (Sempre consultare):
   - Architettura sistema
   - Pattern sviluppo
   - Problemi noti
   - Best practices ADHD

⚡ PRIORITÀ MEDIA (Consultare se rilevante):
   - Schema database
   - Utility functions
   - Configurazioni

📝 PRIORITÀ BASSA (Consultare se necessario):
   - Comandi sviluppo
   - Riferimenti esterni
```

---

## 🎯 SUCCESS INDICATORS

### Short Term (1 settimana)
- [ ] 100% risposte consultano RAG
- [ ] Zero inconsistenze critiche
- [ ] RAG aggiornato quotidianamente
- [ ] Pattern consistency >95%

### Medium Term (1 mese)
- [ ] Validazione automatica implementata
- [ ] Quality score medio >90%
- [ ] Zero rework per inconsistenze
- [ ] Documentation debt = 0

### Long Term (3 mesi)
- [ ] RAG self-updating system
- [ ] Predictive inconsistency detection
- [ ] AI-assisted pattern recognition
- [ ] Zero manual validation needed

---

**🎯 Questo sistema garantisce che il RAG sia sempre la fonte di verità aggiornata e che ogni risposta sia basata su informazioni accurate e coerenti.**

**💡 Remember: RAG Consistency = Code Quality = User Experience**

---

## 🔧 IMPLEMENTATION CHECKLIST

### Per Ogni Sessione di Lavoro
- [ ] Apri CONTEXT_RAG.md all'inizio
- [ ] Consulta sezioni rilevanti prima di rispondere
- [ ] Verifica codice reale se in dubbio
- [ ] Aggiorna RAG se trovi inconsistenze
- [ ] Documenta nuovi pattern scoperti
- [ ] Valida coerenza alla fine

### Per Ogni Nuova Feature
- [ ] Documenta pattern nel RAG
- [ ] Aggiorna sezione "Componenti Critici"
- [ ] Aggiorna "Utility Functions" se applicabile
- [ ] Aggiorna "Problemi Comuni" se risolvi bug
- [ ] Verifica impatto su archetipi ADHD

### Per Ogni Bug Fix
- [ ] Documenta problema in "Problemi Comuni"
- [ ] Aggiorna soluzione nel RAG
- [ ] Verifica pattern non violati
- [ ] Aggiorna best practices se necessario

**🚀 Con questo sistema, il RAG diventa un living document che evolve con il codice, garantendo sempre coerenza e qualità!**