$outputFile = "tsunami_context.md"

Write-Host "Caricando contesto Tsunami..." -ForegroundColor Green

if (Test-Path $outputFile) {
    Remove-Item $outputFile
}

"# Tsunami Project Context" > $outputFile
"" >> $outputFile

$contextPath = "mcp_refactor_output\context"
$categories = @("00_CORE", "01_TECH", "02_FUNCTIONAL", "03_COGNITIVE", "04_GUIDES", "RAG")

foreach ($cat in $categories) {
    $catPath = Join-Path $contextPath $cat
    if (Test-Path $catPath) {
        Write-Host "Categoria: $cat" -ForegroundColor Yellow
        "## $cat" >> $outputFile
        "" >> $outputFile
        
        $files = Get-ChildItem -Path $catPath -Filter "*.md"
        foreach ($file in $files) {
            Write-Host "  $($file.Name)" -ForegroundColor Cyan
            "### $($file.Name)" >> $outputFile
            "" >> $outputFile
            Get-Content $file.FullName >> $outputFile
            "" >> $outputFile
        }
    }
}

Write-Host "Fatto! File: $outputFile" -ForegroundColor Green
Start-Process notepad.exe -ArgumentList $outputFile