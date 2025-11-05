#!/bin/bash
# OT-SCADA Simulation - Build and Run Script

echo "════════════════════════════════════════════════════════"
echo "🐳 OT-SCADA Simulation - Docker Build & Run"
echo "════════════════════════════════════════════════════════"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  docker-compose not found. Installing..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Build and run
echo "🔨 Building Docker image..."
docker-compose build

echo ""
echo "🚀 Starting OT-SCADA Simulation..."
docker-compose up -d

echo ""
echo "⏳ Waiting for application to start..."
sleep 5

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ OT-SCADA Simulation is running!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📍 Access the application:"
echo "   URL: http://localhost:8000"
echo "   Firewall Login: http://localhost:8000/firewall-login"
echo ""
echo "🔐 Default Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📊 Useful Commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop:         docker-compose down"
echo "   Restart:      docker-compose restart"
echo "   Status:       docker-compose ps"
echo ""
echo "════════════════════════════════════════════════════════"

