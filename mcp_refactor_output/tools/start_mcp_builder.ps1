# Script per avviare il Builder con MCP Tsunami
param(
    [string]$BuilderPath = "",
    [switch]$Help
)

if ($Help) {
    Write-Host "🔧 Script per avviare il Builder con MCP Tsunami" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\start_mcp_builder.ps1 [-BuilderPath <percorso>]"
    Write-Host ""
    Write-Host "Parametri:" -ForegroundColor Yellow
    Write-Host "  -BuilderPath    Percorso dell'eseguibile del builder (opzionale)"
    Write-Host "  -Help          Mostra questo messaggio di aiuto"
    Write-Host ""
    Write-Host "Esempi:" -ForegroundColor Green
    Write-Host "  .\start_mcp_builder.ps1"
    Write-Host "  .\start_mcp_builder.ps1 -BuilderPath 'C:\Program Files\Builder\builder.exe'"
    exit 0
}

Write-Host "🚀 Avvio Builder con MCP Tsunami" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Verifica che il server MCP sia in esecuzione
$mcpProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*simple_mcp_server.mjs*" }

if (-not $mcpProcess) {
    Write-Host "⚠️  Server MCP non in esecuzione. Avvio automatico..." -ForegroundColor Yellow
    
    # Avvia il server MCP in background
    $serverPath = Join-Path $PSScriptRoot "simple_mcp_server.mjs"
    Start-Process -FilePath "node" -ArgumentList $serverPath -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    
    Write-Host "⏳ Attendo avvio server MCP..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    Write-Host "✅ Server MCP avviato" -ForegroundColor Green
} else {
    Write-Host "✅ Server MCP già in esecuzione" -ForegroundColor Green
}

# Configura le variabili d'ambiente per MCP
$env:MCP_CONFIG_PATH = Join-Path $PSScriptRoot "mcp_client_config.json"
$env:TSUNAMI_MCP_SERVER = "tsunami://context/"

Write-Host "📁 Configurazione MCP:" -ForegroundColor Cyan
Write-Host "   Config: $env:MCP_CONFIG_PATH" -ForegroundColor Gray
Write-Host "   Server: $env:TSUNAMI_MCP_SERVER" -ForegroundColor Gray

# Mostra le risorse disponibili
Write-Host ""
Write-Host "📋 Risorse MCP disponibili:" -ForegroundColor Cyan
Write-Host "   🔧 00_CORE     - Configurazione e documentazione principale" -ForegroundColor Gray
Write-Host "   ⚙️  01_TECH     - Riferimenti tecnici e architettura" -ForegroundColor Gray
Write-Host "   🎯 02_FUNCTIONAL - Roadmap e changelog funzionale" -ForegroundColor Gray
Write-Host "   🧠 03_COGNITIVE  - Ottimizzazioni cognitive e ADHD" -ForegroundColor Gray
Write-Host "   📖 04_GUIDES    - Guide e tutorial" -ForegroundColor Gray
Write-Host "   🔍 RAG         - Validatori e strumenti RAG" -ForegroundColor Gray

Write-Host ""
Write-Host "🔗 URI di esempio:" -ForegroundColor Cyan
Write-Host "   tsunami://context/00_CORE/DOCS_INDEX.md" -ForegroundColor Gray
Write-Host "   tsunami://context/01_TECH/TYPES_REFERENCE.md" -ForegroundColor Gray
Write-Host "   tsunami://context/02_FUNCTIONAL/ADHD_IMPLEMENTATION_ROADMAP.md" -ForegroundColor Gray

if ($BuilderPath -and (Test-Path $BuilderPath)) {
    Write-Host ""
    Write-Host "🚀 Avvio Builder da: $BuilderPath" -ForegroundColor Green
    Start-Process -FilePath $BuilderPath
} else {
    Write-Host ""
    Write-Host "💡 Per avviare il tuo builder:" -ForegroundColor Yellow
    Write-Host "   1. Avvia il tuo IDE/Builder preferito" -ForegroundColor Gray
    Write-Host "   2. Configura MCP con il file: $env:MCP_CONFIG_PATH" -ForegroundColor Gray
    Write-Host "   3. Il server MCP è disponibile su: $env:TSUNAMI_MCP_SERVER" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Setup completato! Il builder può ora accedere al contesto Tsunami via MCP." -ForegroundColor Green