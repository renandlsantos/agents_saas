#!/bin/bash

# =============================================================================
# 🚀 DEPLOY RÁPIDO NA VM - AGENTS CHAT (Usando imagem pré-buildada)
# =============================================================================
# Este script usa a imagem oficial do Lobe Chat do Docker Hub
# Muito mais rápido que buildar localmente!
# =============================================================================

set -e

# Executar o deploy completo usando imagem pré-buildada
USE_PREBUILT=true ./deploy-complete-local.sh