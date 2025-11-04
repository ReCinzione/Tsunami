---
status: Golden
updated: 2025-01-21
owner: fra
---
# Tsunami – Context Index (ENTRYPOINT)

## Struttura
- **00_CORE** – overview, principi, regole AI
- **01_TECH** – schema DB, architettura, best practices, tipi consolidati
- **02_FUNCTIONAL** – checklist operative, roadmap, changelog
- **03_COGNITIVE** – principi UX/ADHD, linee guida cognitive
- **04_GUIDES** – setup, tutorial, integrazioni
- **RAG** – policy e validazione retriever

## File Prioritari (Golden Status)
- `ARCHITECTURE_REFERENCE.md` - Schema DB consolidato
- `TYPES_REFERENCE.md` - Tipi ed enum consolidati
- `AI_CONTEXT_CONFIG.md` - Configurazione AI

## Come usare
1. Segui `AI_CONTEXT_CONFIG.md`.
2. Se trovi conflitti, vince CORE → TECH → FUNCTIONAL → COGNITIVE → GUIDES → RAG.
3. Ignora file con `status: Obsolete`.
4. Per tipi ed enum, usa sempre `TYPES_REFERENCE.md` come fonte autorevole.