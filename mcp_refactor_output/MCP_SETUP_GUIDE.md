# 🚀 Guida Setup Server MCP per Tsunami

## 📋 **Problema Risolto**

Invece di dover specificare manualmente i file di riferimento ad ogni conversazione, il server MCP permette l'accesso automatico a tutti i file di contesto organizzati.

## 🎯 **Opzioni Disponibili**

### **Opzione 1: Server MCP Locale** (Raccomandato)

#### **Setup Automatico**
```powershell
# Esegui nella cartella mcp_refactor_output/tools
.\setup_mcp_server.ps1
```

#### **Setup Manuale**
1. **Installa Node.js** (se non già presente)
2. **Crea directory MCP**:
   ```powershell
   mkdir $env:USERPROFILE\.mcp\tsunami
   ```
3. **Esegui lo script di setup**

#### **Configurazione Claude Desktop**
Aggiungi al file `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "tsunami": {
      "command": "node",
      "args": ["C:\\Users\\[TuoUsername]\\.mcp\\tsunami\\server.js"]
    }
  }
}
```

### **Opzione 2: Integrazione Diretta** (Alternativa)

#### **Per Trae AI o altri IDE**
Configura l'IDE per caricare automaticamente:
```json
{
  "contextFiles": [
    "./mcp_refactor_output/context/**/*.md"
  ],
  "excludePatterns": [
    "**/DAILY_PROGRESS_*",
    "**/*obsolete*"
  ]
}
```

## 🔧 **Utilizzo del Server MCP**

### **Vantaggi**
- ✅ **Accesso Automatico**: Tutti i file di riferimento disponibili senza richiesta manuale
- ✅ **Organizzazione**: Struttura categorizzata (CORE, TECH, FUNCTIONAL, etc.)
- ✅ **Filtri Intelligenti**: Esclusione automatica di file obsoleti
- ✅ **Performance**: Caricamento ottimizzato e deduplicazione

### **Struttura Accessibile**
```
tsunami://context/
├── 00_CORE/          # Documentazione fondamentale
├── 01_TECH/          # Architettura e tipi
├── 02_FUNCTIONAL/    # Roadmap e funzionalità
├── 03_COGNITIVE/     # Ottimizzazioni ADHD
├── 04_GUIDES/        # Tutorial e guide
└── RAG/              # Validazione automatica
```

## 🚀 **Test del Server**

### **Verifica Funzionamento**
```powershell
# Test del server
node $env:USERPROFILE\.mcp\tsunami\server.js

# Dovrebbe mostrare: "Tsunami MCP Server avviato"
```

### **Test Risorse**
Il server espone automaticamente:
- 21 file di documentazione organizzati
- Accesso via URI: `tsunami://context/[categoria]/[file].md`
- Filtri per file obsoleti attivi

## 📊 **Confronto Opzioni**

| Caratteristica | Server MCP | Specifica Manuale |
|----------------|------------|-------------------|
| **Automazione** | ✅ Completa | ❌ Manuale ogni volta |
| **Organizzazione** | ✅ Categorizzata | ❌ Lista disordinata |
| **Performance** | ✅ Ottimizzata | ❌ Caricamento completo |
| **Filtri** | ✅ Automatici | ❌ Manuali |
| **Manutenzione** | ✅ Zero | ❌ Continua |

## 🎯 **Raccomandazione**

**Usa il Server MCP** per:
- Sviluppo continuo del progetto
- Accesso frequente ai file di riferimento
- Workflow automatizzato

**Usa Specifica Manuale** per:
- Test occasionali
- Debugging specifico
- Quando il server MCP non è disponibile

## 🔄 **Prossimi Passi**

1. **Esegui** `setup_mcp_server.ps1`
2. **Configura** Claude Desktop (se applicabile)
3. **Testa** l'accesso automatico ai file
4. **Goditi** il workflow automatizzato! 🎉

---

**Status**: ✅ Pronto per l'uso  
**Versione**: 1.0  
**Compatibilità**: Windows, macOS, Linux