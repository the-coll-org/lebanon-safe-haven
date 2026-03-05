#!/bin/bash
set -e

# Auto DevOps Setup Script for The Haven
# Run this on your production server to prepare for GitHub Actions deployments

echo "🚀 The Haven Auto DevOps Setup"
echo "================================"
echo ""

# Configuration
APP_DIR="/opt/the-haven"
REPO_URL="${1:-}"  # Pass GitHub repo URL as first argument

if [ -z "$REPO_URL" ]; then
    echo "Usage: $0 <github-repo-url>"
    echo "Example: $0 https://github.com/username/the-haven"
    exit 1
fi

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  This script needs to run with sudo for initial setup"
    exit 1
fi

echo "📁 Setting up application directory at $APP_DIR..."
mkdir -p $APP_DIR
cd $APP_DIR

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install docker-compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    apt-get update
    apt-get install -y docker-compose-plugin || true
fi

# Clone repository if not exists
if [ ! -d "$APP_DIR/.git" ]; then
    echo "📥 Cloning repository..."
    git clone "$REPO_URL" .
else
    echo "🔄 Repository already exists, updating..."
    git fetch origin
    git reset --hard origin/main || git reset --hard origin/master
fi

# Create data directory
mkdir -p data
chmod 755 data

# Generate secrets if not exist
if [ ! -f ".env" ]; then
    echo "🔐 Generating secrets..."
    cat > .env << EOF
SESSION_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF
    echo "✅ Secrets generated in .env file"
    echo "⚠️  IMPORTANT: Back up this .env file securely!"
fi

# Create deploy key for GitHub Actions
DEPLOY_KEY_FILE="/root/.ssh/thehaven_deploy"
if [ ! -f "$DEPLOY_KEY_FILE" ]; then
    echo "🔑 Creating SSH deploy key for GitHub Actions..."
    mkdir -p /root/.ssh
    ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$DEPLOY_KEY_FILE" -N ""
    chmod 700 /root/.ssh
    chmod 600 "$DEPLOY_KEY_FILE"
    chmod 644 "$DEPLOY_KEY_FILE.pub"
    
    # Add to authorized_keys
    cat "$DEPLOY_KEY_FILE.pub" >> /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
fi

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================="
echo "✅ Auto DevOps Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Add these GitHub Secrets to your repository:"
echo "   Go to: Settings → Secrets and variables → Actions"
echo ""
echo "   SERVER_HOST: $SERVER_IP (or your domain)"
echo "   SERVER_USER: root (or your deploy user)"
echo "   SERVER_SSH_KEY: (copy the private key below)"
echo ""
cat "$DEPLOY_KEY_FILE"
echo ""
echo ""
echo "2️⃣  Configure the .env file on the server:"
echo "   Location: $APP_DIR/.env"
echo "   Contents:"
cat .env
echo ""
echo ""
echo "3️⃣  Ensure your domain DNS points to: $SERVER_IP"
echo ""
echo "4️⃣  Push to main branch to trigger first deployment!"
echo ""
echo "📚 Useful Commands:"
echo "   View logs:    docker-compose -f docker-compose.prod.yml logs -f"
echo "   Restart app:  docker-compose -f docker-compose.prod.yml restart"
echo "   Update:       cd $APP_DIR && git pull && ./deploy.sh"
echo ""
