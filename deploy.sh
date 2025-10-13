#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# NFS Media Setup Function
setup_nfs_media() {
    PROJECT_PATH=$(pwd | sed 's|.*/projects/||')
    
    if [ -z "$PROJECT_PATH" ]; then
        echo "ERROR: Not in a projects directory"
        return 1
    fi
    
    if ! mountpoint -q /app-media; then
        echo "WARNING: NFS media mount not available, skipping media setup"
        return 0
    fi
    
    NFS_PROJECT_DIR="/app-media/${PROJECT_PATH}"
    mkdir -p "$NFS_PROJECT_DIR"
    
    # Check if uploads is already properly symlinked
    if [ -L "./uploads" ] && [ "$(readlink ./uploads)" = "$NFS_PROJECT_DIR" ]; then
        echo "NFS media already configured: ./uploads -> $NFS_PROJECT_DIR"
        return 0
    fi
    
    # Only migrate if it's a regular directory
    if [ -d "./uploads" ] && [ ! -L "./uploads" ]; then
        echo "Migrating uploads directory to NFS"
        cp -r ./uploads/* "$NFS_PROJECT_DIR/"
        rm -rf "./uploads"
    fi
    
    # Create/fix symlink
    rm -f "./uploads" 2>/dev/null || true
    ln -sf "$NFS_PROJECT_DIR" "./uploads"
    echo "Linked media: ./uploads -> $NFS_PROJECT_DIR"
}

# Setup NFS media storage
setup_nfs_media

# Function to check if docker compose command exists and use appropriate version
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

DOCKER_COMPOSE=$(check_docker_compose)

# Build new images without affecting running containers
echo "🏗️  Building new images..."
$DOCKER_COMPOSE build

# If builds succeeded, stop and recreate containers
echo "🔄 Swapping to new containers..."
$DOCKER_COMPOSE down
$DOCKER_COMPOSE up -d --force-recreate

echo "📢 Deployment complete!"