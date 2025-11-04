# Setup MCP Server per Tsunami
# Questo script configura un server MCP locale per utilizzare automaticamente i file di riferimento

Write-Host "🚀 Setup MCP Server per Tsunami" -ForegroundColor Green

# Verifica prerequisiti
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js non trovato. Installa Node.js prima di continuare." -ForegroundColor Red
    exit 1
}

# Crea directory per il server MCP
$mcpDir = "$env:USERPROFILE\.mcp\tsunami"
New-Item -ItemType Directory -Force -Path $mcpDir | Out-Null

# Copia configurazione MCP
Copy-Item "mcp-config.json" "$mcpDir\config.json" -Force
Copy-Item "mcp-config.yaml" "$mcpDir\config.yaml" -Force

# Crea package.json per il server MCP
$packageJson = @{
    name = "tsunami-mcp-server"
    version = "1.0.0"
    description = "MCP Server per progetto Tsunami"
    main = "server.js"
    dependencies = @{
        "@modelcontextprotocol/sdk" = "^0.5.0"
        "fs-extra" = "^11.0.0"
        "path" = "^0.12.7"
        "yaml" = "^2.3.4"
    }
} | ConvertTo-Json -Depth 3

Set-Content -Path "$mcpDir\package.json" -Value $packageJson

# Crea server MCP
$serverJs = @"
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');

class TsunamiMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'tsunami-context',
                version: '1.0.0',
            },
            {
                capabilities: {
                    resources: {},
                },
            }
        );
        
        this.contextPath = path.join(__dirname, '..', '..', 'Desktop', 'Tsunami', 'mcp_refactor_output', 'context');
        this.setupHandlers();
    }

    setupHandlers() {
        this.server.setRequestHandler('resources/list', async () => {
            const resources = await this.loadAllResources();
            return { resources };
        });

        this.server.setRequestHandler('resources/read', async (request) => {
            const uri = request.params.uri;
            const content = await this.loadResource(uri);
            return { contents: [{ uri, mimeType: 'text/markdown', text: content }] };
        });
    }

    async loadAllResources() {
        const resources = [];
        const categories = ['00_CORE', '01_TECH', '02_FUNCTIONAL', '03_COGNITIVE', '04_GUIDES', 'RAG'];
        
        for (const category of categories) {
            const categoryPath = path.join(this.contextPath, category);
            if (await fs.pathExists(categoryPath)) {
                const files = await fs.readdir(categoryPath);
                for (const file of files) {
                    if (file.endsWith('.md')) {
                        resources.push({
                            uri: `tsunami://context/${category}/${file}`,
                            name: file,
                            description: `File di riferimento: ${category}/${file}`,
                            mimeType: 'text/markdown'
                        });
                    }
                }
            }
        }
        
        return resources;
    }

    async loadResource(uri) {
        const match = uri.match(/tsunami:\/\/context\/(.+)/);
        if (!match) {
            throw new Error('URI non valido');
        }
        
        const filePath = path.join(this.contextPath, match[1]);
        if (await fs.pathExists(filePath)) {
            return await fs.readFile(filePath, 'utf8');
        }
        
        throw new Error('File non trovato');
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Tsunami MCP Server avviato');
    }
}

const server = new TsunamiMCPServer();
server.run().catch(console.error);
"@

Set-Content -Path "$mcpDir\server.js" -Value $serverJs

# Installa dipendenze
Write-Host "📦 Installazione dipendenze..." -ForegroundColor Yellow
Set-Location $mcpDir
npm install

Write-Host "✅ Setup completato!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prossimi passi:" -ForegroundColor Cyan
Write-Host "1. Configura il tuo client MCP per utilizzare il server:"
Write-Host "   Comando: node $mcpDir\server.js"
Write-Host ""
Write-Host "2. Oppure aggiungi alla configurazione Claude Desktop:"
Write-Host "   File: %APPDATA%\Claude\claude_desktop_config.json"
Write-Host ""
Write-Host "3. Configurazione esempio:"
Write-Host '{
  "mcpServers": {
    "tsunami": {
      "command": "node",
      "args": ["' + $mcpDir + '\server.js"]
    }
  }
}' -ForegroundColor Gray