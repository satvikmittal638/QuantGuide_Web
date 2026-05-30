#!/bin/bash
echo "Waiting for llama3.2:1b to be ready..."
while true; do
  if ollama list | grep -q "llama3.2:1b"; then
    echo "Model found! Starting formatting script..."
    node scripts/format_latex_local.js
    break
  fi
  sleep 10
done
