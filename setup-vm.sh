#!/bin/bash
# RunRight VM Setup Script
# Run this on a fresh Ubuntu 22.04 GCE VM

set -e

echo "📦 Installing Docker..."
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release git

# Docker GPG key and repo
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Let current user run docker without sudo
sudo usermod -aG docker $USER

echo "🐳 Docker installed!"

echo "📥 Pre-pulling runner images (this takes a few minutes)..."
sudo docker pull python:3.9-slim &
sudo docker pull node:18-slim &
sudo docker pull gcc:latest &
wait
echo "✅ Runner images pre-pulled!"

echo ""
echo "=== SETUP COMPLETE ==="
echo ""
echo "Next steps:"
echo "1. Log out and back in (for docker group to take effect):"
echo "   exit"
echo "   Then SSH back in"
echo ""
echo "2. Clone your repo:"
echo "   git clone https://github.com/YOUR_USERNAME/runright.git"
echo "   cd runright"
echo ""
echo "3. Get your VM's external IP:"
echo "   curl -s ifconfig.me"
echo ""
echo "4. Create a .env file with your VM's external IP:"
echo "   echo 'NEXT_PUBLIC_API_URL=http://YOUR_VM_IP:3000' > .env"
echo ""
echo "5. Build and start everything:"
echo "   docker compose up -d --build"
echo ""
echo "6. Seed the database:"
echo "   docker compose exec api npx prisma migrate deploy"
echo "   docker compose exec api npx prisma db seed"
echo ""
echo "7. Visit http://YOUR_VM_IP:3001 in your browser!"
