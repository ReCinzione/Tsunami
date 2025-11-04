# Script per caricare il contesto Tsunami in Trae
# Uso: .\load_context.ps1 [categoria]

param(
    [string]$Category = "all"
)

$contextPath = "mcp_refactor_output\context"
$outputFile = "tsunami_context_loaded.md"

Write-Host "Tsunami Context Loader" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

# Funzione per caricare una categoria
function Load-Category {
    param($categoryPath, $categoryName)
    
    if (Test-Path $categoryPath) {
        $files = Get-ChildItem -Path $categoryPath -Filter "*.md"
        
        if ($files.Count -gt 0) {
            Write-Host "Caricando categoria: $categoryName" -ForegroundColor Green
            
            Add-Content -Path $outputFile -Value "`n## $categoryName`n"
            
            foreach ($file in $files) {
                Write-Host "  File: $($file.Name)" -ForegroundColor Yellow
                
                Add-Content -Path $outputFile -Value "### $($file.Name)`n"
                Add-Content -Path $outputFile -Value "```markdown"
                Get-Content -Path $file.FullName | Add-Content -Path $outputFile
                Add-Content -Path $outputFile -Value "```"
                Add-Content -Path $outputFile -Value ""
            }
        }
    }
}

# Rimuovi file di output precedente
if (Test-Path $outputFile) {
    Remove-Item $outputFile
}

# Header del file
Add-Content -Path $outputFile -Value "# Tsunami Project Context"
Add-Content -Path $outputFile -Value "Generato automaticamente il $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
Add-Content -Path $outputFile -Value ""

# Carica categorie
if ($Category -eq "all") {
    Write-Host "Caricando tutte le categorie..." -ForegroundColor Magenta
    
    $categories = @(
        @{Path = "$contextPath\00_CORE"; Name = "00_CORE - Documentazione Base"},
        @{Path = "$contextPath\01_TECH"; Name = "01_TECH - Riferimenti Tecnici"},
        @{Path = "$contextPath\02_FUNCTIONAL"; Name = "02_FUNCTIONAL - Funzionalita"},
        @{Path = "$contextPath\03_COGNITIVE"; Name = "03_COGNITIVE - Ottimizzazioni ADHD"},
        @{Path = "$contextPath\04_GUIDES"; Name = "04_GUIDES - Guide e Tutorial"},
        @{Path = "$contextPath\RAG"; Name = "RAG - Validazione Automatica"}
    )
    
    foreach ($cat in $categories) {
        Load-Category -categoryPath $cat.Path -categoryName $cat.Name
    }
} else {
    Write-Host "Caricando categoria: $Category" -ForegroundColor Magenta
    Load-Category -categoryPath "$contextPath\$Category" -categoryName $Category
}

Write-Host ""
Write-Host "Contesto caricato in: $outputFile" -ForegroundColor Green
Write-Host "Ora puoi trascinare questo file nella chat di Trae!" -ForegroundColor Cyan

# Apri il file automaticamente
if (Test-Path $outputFile) {
    Write-Host "Apertura automatica del file..." -ForegroundColor Yellow
    Start-Process notepad.exe -ArgumentList $outputFile
}