#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# NFS Media Setup Function
setup_nfs_media() {
    # Extract project path from current directory
    PROJECT_PATH=$(pwd | sed 's|.*/projects/||')
    
    if [ -z "$PROJECT_PATH" ]; then
        echo "ERROR: Not in a projects directory"
        return 1
    fi
    
    # Check NFS mount
    if ! mountpoint -q /app-media; then
        echo "WARNING: NFS media mount not available, skipping media setup"
        return 0
    fi
    
    # Create project media directory on NFS
    NFS_PROJECT_DIR="/app-media/${PROJECT_PATH}"
    mkdir -p "$NFS_PROJECT_DIR"
    
    echo "Created NFS media directory: $NFS_PROJECT_DIR"
    
    # Setup media symlinks for /uploads structure
    if [ -d "./uploads" ]; then
        # Check if already symlinked
        if [ -L "./uploads" ] && [ "$(readlink ./uploads)" = "$NFS_PROJECT_DIR" ]; then
            echo "Media symlink already configured: ./uploads -> $NFS_PROJECT_DIR"
        else
            # If it's a regular directory with files, migrate them first
            if [ -d "./uploads" ] && [ ! -L "./uploads" ]; then
                echo "Migrating existing files from ./uploads to NFS..."
                # Copy all contents to NFS, preserving structure
                cp -r ./uploads/* "$NFS_PROJECT_DIR/" 2>/dev/null || true
                # Remove the original directory
                sudo rm -rf "./uploads"
                echo "Files migrated to $NFS_PROJECT_DIR"
            fi
            
            # Create the symlink
            ln -sf "$NFS_PROJECT_DIR" "./uploads"
            echo "Linked media: ./uploads -> $NFS_PROJECT_DIR"
        fi
        
        # Ensure any subdirectories that exist in the project are also on NFS
        if [ -d "$NFS_PROJECT_DIR" ]; then
            echo "NFS media directory ready with subdirectories preserved"
        fi
    fi
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