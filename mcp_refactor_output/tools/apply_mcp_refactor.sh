#!/usr/bin/env bash
set -euo pipefail

echo "Applying MCP refactor (content + structure)"
mkdir -p context/00_CORE context/01_TECH context/02_FUNCTIONAL context/03_COGNITIVE context/04_GUIDES context/RAG

# Copy over generated files (overwrite on purpose)
rsync -a context/ ./context/
cp -f mcp-config.yaml mcp-config.yaml
cp -f mcp-config.json mcp-config.json

echo "Done. Review diffs, then commit."