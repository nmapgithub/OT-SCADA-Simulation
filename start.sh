#!/bin/bash
# OT-SCADA Simulation Platform Startup Script

echo "Starting OT-SCADA Simulation Platform..."
echo "Installing dependencies..."

pip3 install -r requirements.txt

echo "Starting FastAPI server..."
echo "Access the platform at: http://localhost:8000"
echo "Press Ctrl+C to stop"

python3 main.py

