# Script basilare per caricare il contesto Tsunami

$contextPath = "mcp_refactor_output\context"
$outputFile = "tsunami_context_loaded.md"

Write-Host "Tsunami Context Loader" -ForegroundColor Cyan

# Rimuovi file precedente
if (Test-Path $outputFile) {
    Remove-Item $outputFile
}

# Header
"# Tsunami Project Context" | Out-File -FilePath $outputFile -Encoding UTF8
"Generato automaticamente" | Out-File -FilePath $outputFile -Append -Encoding UTF8
"" | Out-File -FilePath $outputFile -Append -Encoding UTF8

# Carica tutte le categorie
$categories = @("00_CORE", "01_TECH", "02_FUNCTIONAL", "03_COGNITIVE", "04_GUIDES", "RAG")

foreach ($category in $categories) {
    $categoryPath = Join-Path $contextPath $category
    
    if (Test-Path $categoryPath) {
        Write-Host "Caricando: $category" -ForegroundColor Green
        
        "## $category" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        
        $files = Get-ChildItem -Path $categoryPath -Filter "*.md"
        
        foreach ($file in $files) {
            Write-Host "  File: $($file.Name)" -ForegroundColor Yellow
            
            "### $($file.Name)" | Out-File -FilePath $outputFile -Append -Encoding UTF8
            "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
            "```markdown" | Out-File -FilePath $outputFile -Append -Encoding UTF8
            
            Get-Content -Path $file.FullName | Out-File -FilePath $outputFile -Append -Encoding UTF8
            
            "```" | Out-File -FilePath $outputFile -Append -Encoding UTF8
            "" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        }
    }
}

Write-Host ""
Write-Host "COMPLETATO!" -ForegroundColor Green
Write-Host "File creato: $outputFile" -ForegroundColor Cyan

# Apri il file
if (Test-Path $outputFile) {
    Start-Process notepad.exe -ArgumentList $outputFile
}