# 🌊 Tsunami Context Loader

**Alternativa semplice e affidabile all'MCP server per caricare il contesto del progetto in Trae.**

## 🚀 Come Usare

### Opzione 1: Script Veloce (Raccomandato)
```powershell
.\quick_load.ps1
```
- Menu interattivo con opzioni numerate
- Scegli cosa caricare (tutto o categoria specifica)
- Più user-friendly

### Opzione 2: Script Diretto
```powershell
# Carica tutto
.\load_context.ps1

# Carica categoria specifica
.\load_context.ps1 -Category "00_CORE"
.\load_context.ps1 -Category "01_TECH"
.\load_context.ps1 -Category "02_FUNCTIONAL"
.\load_context.ps1 -Category "03_COGNITIVE"
.\load_context.ps1 -Category "04_GUIDES"
.\load_context.ps1 -Category "RAG"
```

## 📂 Categorie Disponibili

| Categoria | Contenuto |
|-----------|-----------|
| **00_CORE** | Documentazione base del progetto |
| **01_TECH** | Riferimenti tecnici e architettura |
| **02_FUNCTIONAL** | Funzionalità e implementazioni |
| **03_COGNITIVE** | Ottimizzazioni per ADHD |
| **04_GUIDES** | Guide e tutorial |
| **RAG** | Validazione automatica |

## 🎯 Workflow Consigliato

1. **Apri PowerShell** nella directory del progetto
2. **Esegui** `.\quick_load.ps1`
3. **Scegli** la categoria che ti serve
4. **Trascina** il file `tsunami_context_loaded.md` generato nella chat di Trae
5. **Inizia** a lavorare con tutto il contesto caricato!

## ✅ Vantaggi

- ✅ **Funziona sempre** - nessun problema di connessione
- ✅ **Veloce** - caricamento istantaneo
- ✅ **Flessibile** - scegli cosa caricare
- ✅ **Semplice** - nessuna configurazione complessa
- ✅ **Affidabile** - nessun server da gestire

## 🔧 Personalizzazione

Puoi modificare gli script per:
- Aggiungere nuove categorie
- Cambiare il formato di output
- Filtrare file specifici
- Aggiungere metadati

## 🆘 Risoluzione Problemi

**Script non si avvia?**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**File non trovato?**
- Assicurati di essere nella directory `C:\Users\Fra\Desktop\Tsunami`
- Verifica che la cartella `mcp_refactor_output\context` esista

**Notepad non si apre?**
- Il file viene comunque creato come `tsunami_context_loaded.md`
- Aprilo manualmente o trascinalo direttamente in Trae