// Server MCP Semplificato per Tsunami (ES Modules)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SimpleTsunamiMCPServer {
    constructor() {
        this.contextPath = path.join(__dirname, '..', 'context');
        console.error('🚀 Tsunami MCP Server Semplificato avviato');
        console.error(`📁 Context path: ${this.contextPath}`);
        this.listResources();
    }

    async listResources() {
        console.error('📋 Risorse disponibili:');
        const categories = ['00_CORE', '01_TECH', '02_FUNCTIONAL', '03_COGNITIVE', '04_GUIDES', 'RAG'];
        
        for (const category of categories) {
            const categoryPath = path.join(this.contextPath, category);
            if (fs.existsSync(categoryPath)) {
                const files = fs.readdirSync(categoryPath);
                console.error(`\n📂 ${category}:`);
                for (const file of files) {
                    if (file.endsWith('.md')) {
                        console.error(`  - ${file}`);
                    }
                }
            }
        }
        
        console.error('\n✅ Server pronto per connessioni MCP');
        console.error('🔗 URI base: tsunami://context/[categoria]/[file].md');
        console.error('\n📖 Esempi di URI:');
        console.error('  - tsunami://context/00_CORE/DOCS_INDEX.md');
        console.error('  - tsunami://context/01_TECH/TYPES_REFERENCE.md');
        console.error('  - tsunami://context/02_FUNCTIONAL/ADHD_IMPLEMENTATION_ROADMAP.md');
    }

    getResource(uri) {
        const match = uri.match(/tsunami:\/\/context\/(.+)/);
        if (!match) {
            throw new Error('URI non valido');
        }
        
        const filePath = path.join(this.contextPath, match[1]);
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
        
        throw new Error('File non trovato: ' + filePath);
    }
}

// Avvia il server
const server = new SimpleTsunamiMCPServer();

// Mantieni il processo attivo
process.stdin.resume();