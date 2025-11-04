#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TsunamiMCPServer {
  constructor() {
    this.contextPath = join(__dirname, 'mcp_refactor_output', 'context');
    this.resources = new Map();
    this.loadResources();
  }

  loadResources() {
    try {
      const categories = readdirSync(this.contextPath);
      
      for (const category of categories) {
        const categoryPath = join(this.contextPath, category);
        if (statSync(categoryPath).isDirectory()) {
          const files = readdirSync(categoryPath).filter(f => f.endsWith('.md'));
          
          for (const file of files) {
            const resourceUri = `tsunami://context/${category}/${file}`;
            this.resources.set(resourceUri, {
              uri: resourceUri,
              name: file.replace('.md', ''),
              description: `${category} - ${file}`,
              mimeType: 'text/markdown',
              category: category,
              filePath: join(categoryPath, file)
            });
          }
        }
      }
      
      console.error(`🚀 Tsunami MCP Server avviato con ${this.resources.size} risorse`);
    } catch (error) {
      console.error('❌ Errore nel caricamento delle risorse:', error.message);
    }
  }

  async handleRequest(request) {
    try {
      switch (request.method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                resources: {
                  subscribe: true,
                  listChanged: true
                }
              },
              serverInfo: {
                name: 'tsunami-mcp-server',
                version: '1.0.0'
              }
            }
          };

        case 'resources/list':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              resources: Array.from(this.resources.values()).map(r => ({
                uri: r.uri,
                name: r.name,
                description: r.description,
                mimeType: r.mimeType
              }))
            }
          };

        case 'resources/read':
          const uri = request.params?.uri;
          if (!uri || !this.resources.has(uri)) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32602,
                message: 'Resource not found'
              }
            };
          }

          const resource = this.resources.get(uri);
          const content = readFileSync(resource.filePath, 'utf-8');
          
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              contents: [{
                uri: uri,
                mimeType: 'text/markdown',
                text: content
              }]
            }
          };

        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: 'Method not found'
            }
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error.message
        }
      };
    }
  }

  start() {
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
      let chunk;
      while (null !== (chunk = process.stdin.read())) {
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const request = JSON.parse(line);
            this.handleRequest(request).then(response => {
              process.stdout.write(JSON.stringify(response) + '\n');
            });
          } catch (error) {
            console.error('❌ Errore parsing JSON:', error.message);
          }
        }
      }
    });

    process.stdin.on('end', () => {
      process.exit(0);
    });

    console.error('✅ Server MCP pronto per connessioni');
  }
}

const server = new TsunamiMCPServer();
server.start();