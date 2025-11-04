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
        
        // Percorso corretto per la cartella context
        this.contextPath = path.join(__dirname, '..', '..', '..', 'Desktop', 'Tsunami', 'mcp_refactor_output', 'context');
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