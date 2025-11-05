# OT-SCADA Simulation - Docker Deployment Guide

## 🐳 Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

### Run with Docker Compose (Recommended)

```bash
# Development mode (with hot reload)
docker-compose up -d

# Production mode (optimized)
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Run with Docker Only

```bash
# Build the image
docker build -t ot-scada-sim .

# Run the container
docker run -d \
  --name ot-scada-sim \
  -p 8000:8000 \
  ot-scada-sim

# View logs
docker logs -f ot-scada-sim

# Stop container
docker stop ot-scada-sim
docker rm ot-scada-sim
```

## 📦 Access the Application

Once running, access the simulation at:
- **URL**: http://localhost:8000
- **Firewall Login**: http://localhost:8000/firewall-login
- **SCADA Portal**: http://localhost:8000/scada-portal (hidden - use Dirb/Gobuster)

## 🔐 Default Credentials

- **Firewall**: `admin` / `admin123`
- **SCADA Devices**: See `DEFAULT_CREDENTIALS.md`

## 🛠️ Docker Commands

### Management

```bash
# Build/rebuild image
docker-compose build

# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View running containers
docker-compose ps

# View logs
docker-compose logs -f ot-scada-simulation

# Execute commands inside container
docker-compose exec ot-scada-simulation bash

# Remove everything (containers, networks, volumes)
docker-compose down -v
```

### Troubleshooting

```bash
# Check container health
docker-compose ps

# View detailed logs
docker-compose logs --tail=100 ot-scada-simulation

# Access container shell
docker-compose exec ot-scada-simulation /bin/bash

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🌐 Network Configuration

The application runs on port 8000 by default. To change:

```yaml
# In docker-compose.yml, modify:
ports:
  - "YOUR_PORT:8000"
```

## 🔧 Environment Variables

Add to `docker-compose.yml` under `environment:`:

```yaml
environment:
  - DEBUG=false
  - LOG_LEVEL=INFO
  - MAX_CONNECTIONS=100
```

## 📊 Resource Limits

For production, resource limits are set in `docker-compose.prod.yml`:
- CPU: 2 cores max, 0.5 cores reserved
- Memory: 2GB max, 512MB reserved

## 🚀 Deployment on Different Platforms

### Deploy on Linux Server
```bash
git clone <repository>
cd OT-SCADA-Simulation
docker-compose up -d
```

### Deploy on Windows
```powershell
git clone <repository>
cd OT-SCADA-Simulation
docker-compose up -d
```

### Deploy on macOS
```bash
git clone <repository>
cd OT-SCADA-Simulation
docker-compose up -d
```

### Deploy on Cloud (AWS, Azure, GCP)
```bash
# Install Docker on your cloud instance
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone and run
git clone <repository>
cd OT-SCADA-Simulation
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security Notes

⚠️ **Important**: This is a **training simulation** for educational purposes.

- Do NOT expose to public internet without proper security measures
- Use a reverse proxy (nginx/traefik) with SSL in production
- Change default credentials immediately
- Run on isolated training networks only

## 🐛 Health Checks

The container includes health checks:
- Endpoint: `http://localhost:8000/api/devices`
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

Check health status:
```bash
docker inspect --format='{{.State.Health.Status}}' ot-scada-sim
```

## 📝 Persistent Data

To persist data across container restarts, uncomment the volumes section in `docker-compose.yml`.

## 🎓 Educational Use

This simulation is designed for:
- Cybersecurity training
- OT/ICS security education
- Penetration testing practice
- SCADA system understanding
- Firewall bypass techniques

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify all services are healthy: `docker-compose ps`
3. Review `README.md` for application-specific help

---

**Version**: 1.0  
**Last Updated**: November 2025

