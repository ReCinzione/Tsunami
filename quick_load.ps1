# Quick Context Loader per Tsunami
# Script veloce con opzioni predefinite

Write-Host "Tsunami Quick Context Loader" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Scegli cosa caricare:" -ForegroundColor Yellow
Write-Host "1. TUTTO (tutte le categorie)" -ForegroundColor White
Write-Host "2. CORE (documentazione base)" -ForegroundColor White
Write-Host "3. TECH (riferimenti tecnici)" -ForegroundColor White
Write-Host "4. FUNCTIONAL (funzionalita)" -ForegroundColor White
Write-Host "5. COGNITIVE (ottimizzazioni ADHD)" -ForegroundColor White
Write-Host "6. GUIDES (guide e tutorial)" -ForegroundColor White
Write-Host "7. RAG (validazione automatica)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Inserisci il numero (1-7)"

switch ($choice) {
    "1" { 
        Write-Host "Caricando TUTTO..." -ForegroundColor Green
        .\load_context.ps1 
    }
    "2" { 
        Write-Host "Caricando CORE..." -ForegroundColor Green
        .\load_context.ps1 -Category "00_CORE" 
    }
    "3" { 
        Write-Host "Caricando TECH..." -ForegroundColor Green
        .\load_context.ps1 -Category "01_TECH" 
    }
    "4" { 
        Write-Host "Caricando FUNCTIONAL..." -ForegroundColor Green
        .\load_context.ps1 -Category "02_FUNCTIONAL" 
    }
    "5" { 
        Write-Host "Caricando COGNITIVE..." -ForegroundColor Green
        .\load_context.ps1 -Category "03_COGNITIVE" 
    }
    "6" { 
        Write-Host "Caricando GUIDES..." -ForegroundColor Green
        .\load_context.ps1 -Category "04_GUIDES" 
    }
    "7" { 
        Write-Host "Caricando RAG..." -ForegroundColor Green
        .\load_context.ps1 -Category "RAG" 
    }
    default { 
        Write-Host "Scelta non valida. Caricando tutto..." -ForegroundColor Red
        .\load_context.ps1 
    }
}

Write-Host ""
Write-Host "Fatto! Il file e pronto per essere trascinato in Trae." -ForegroundColor Green