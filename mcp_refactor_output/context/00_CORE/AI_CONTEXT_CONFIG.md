---
status: Golden
updated: 2025-10-31
owner: fra
---
# AI_CONTEXT_CONFIG (Guardrails + SOP)

## Priorità delle fonti
1. `context/00_CORE/**`
2. `context/01_TECH/**`
3. `context/02_FUNCTIONAL/**`
4. `context/03_COGNITIVE/**`
5. `context/04_GUIDES/**`
6. `context/RAG/**`

In caso di conflitto vince la fonte con priorità più alta; a parità, preferisci il file con `updated` più recente.

## SOP modifiche
- Leggi `DOCS_INDEX.md` e i CORE pertinenti.
- Verifica schema DB, permessi/RLS, standard UI/UX.
- Produci un **piano** numerato → commit atomici.
- Aggiorna anche i documenti di contesto toccati (schema, checklist, guide).

## Anti-pattern
- Non alterare segreti o `.env`.
- Non introdurre dipendenze senza motivarle in `CHANGELOG.md`.
- Non basarti su documenti marcati `[Obsolete]` o `status: Obsolete`.

## Tag
- `status: Golden` → fonte autorevole
- `status: Draft` → da verificare/aggiornare
- `status: Obsolete` → esclusa dal contesto