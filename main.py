"""
OT-SCADA Simulation Platform
Educational platform for teaching OT security and pentesting
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
import json
import uuid
from pathlib import Path

app = FastAPI(title="OT-SCADA Simulation Platform")
BASE_DIR = Path(__file__).resolve().parent

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# Mount offline tiles if available
tiles_path = BASE_DIR / "tiles"
if tiles_path.exists():
    app.mount("/tiles", StaticFiles(directory=str(tiles_path)), name="tiles")

# Import simulation engines
from firewall_engine import FirewallEngine
from scada_engine import SCADAEngine
from device_manager import DeviceManager

# Initialize engines
firewall = FirewallEngine()
scada = SCADAEngine()
devices = DeviceManager(scada_engine=scada)

# WebSocket connections for real-time updates
active_connections: List[WebSocket] = []

async def broadcast_update(data: dict):
    """Broadcast updates to all connected clients"""
    for connection in active_connections:
        try:
            await connection.send_json(data)
        except:
            pass

# ============ Models ============

class FirewallRule(BaseModel):
    id: Optional[str] = None
    name: str
    source: str
    destination: str
    service: str
    action: str  # "allow" or "deny"
    enabled: bool = True

class DeviceDetail(BaseModel):
    id: str
    name: str
    type: str
    status: str
    metrics: Dict[str, Any]
    config: Dict[str, Any]
    vulnerabilities: List[str]

class SCADACommand(BaseModel):
    device_id: str
    command: str
    parameters: Dict[str, Any]

class IPSToggle(BaseModel):
    enabled: bool

class LoginRequest(BaseModel):
    username: str
    password: str

# ============ Routes ============

@app.get("/", response_class=HTMLResponse)
async def root():
    """Main entry point"""
    with open("templates/index.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.get("/firewall-login", response_class=HTMLResponse)
async def firewall_login_page():
    """Firewall login page"""
    with open("templates/firewall_login.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.get("/scada-portal", response_class=HTMLResponse)
async def scada_portal_page():
    """Hidden SCADA portal page - requires firewall rule"""
    # Check if firewall allows access
    if not firewall.check_scada_portal_access():
        raise HTTPException(status_code=403, detail="Access denied. Firewall rule required.")
    
    # Check if authenticated
    if not firewall.authenticated:
        raise HTTPException(status_code=401, detail="Authentication required. Please login to firewall first.")
    
    with open("templates/scada_portal.html", "r") as f:
        return HTMLResponse(content=f.read())

@app.get("/api/devices")
async def get_devices():
    """Get all devices"""
    return devices.get_all_devices()

@app.get("/api/devices/{device_id}")
async def get_device(device_id: str):
    """Get device details"""
    device = devices.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@app.get("/api/firewall/rules")
async def get_firewall_rules():
    """Get all firewall rules"""
    # Check authentication
    if not firewall.authenticated:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    return firewall.get_rules()

@app.get("/api/firewall/status")
async def get_firewall_status():
    """Get firewall status"""
    return firewall.get_status()

@app.post("/api/firewall/login")
async def firewall_login(login: LoginRequest):
    """Firewall login endpoint"""
    result = firewall.authenticate(login.username, login.password)
    return result

@app.post("/api/firewall/logout")
async def firewall_logout():
    """Firewall logout endpoint"""
    firewall.logout()
    return {"status": "success", "message": "Logged out"}

@app.post("/api/firewall/rules")
async def add_firewall_rule(rule: FirewallRule):
    """Add a new firewall rule"""
    # Check authentication
    if not firewall.authenticated:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    rule.id = str(uuid.uuid4())
    firewall.add_rule(rule.dict())
    await broadcast_update({"type": "firewall_updated", "rules": firewall.get_rules()})
    return {"status": "success", "rule": rule.dict()}

@app.delete("/api/firewall/rules/{rule_id}")
async def delete_firewall_rule(rule_id: str):
    """Delete a firewall rule"""
    # Check authentication
    if not firewall.authenticated:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    firewall.remove_rule(rule_id)
    await broadcast_update({"type": "firewall_updated", "rules": firewall.get_rules()})
    return {"status": "success"}

@app.put("/api/firewall/rules/{rule_id}")
async def update_firewall_rule(rule_id: str, rule: FirewallRule):
    """Update a firewall rule"""
    # Check authentication
    if not firewall.authenticated:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    rule.id = rule_id
    firewall.update_rule(rule_id, rule.dict())
    await broadcast_update({"type": "firewall_updated", "rules": firewall.get_rules()})
    return {"status": "success"}

@app.post("/api/firewall/test")
async def test_firewall_connection(source: str, destination: str, service: str):
    """Test if a connection would be allowed through firewall"""
    result = firewall.check_connection(source, destination, service)
    return result

@app.put("/api/firewall/ips")
async def toggle_ips(toggle: IPSToggle):
    """Toggle IPS (Intrusion Prevention System)"""
    # Check authentication
    if not firewall.authenticated:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    firewall.toggle_ips(toggle.enabled)
    await broadcast_update({"type": "firewall_updated", "status": firewall.get_status()})
    return {"status": "success", "ips_enabled": toggle.enabled}

@app.get("/api/scada/status")
async def get_scada_status():
    """Get SCADA system status"""
    return scada.get_status()

@app.get("/api/scada/devices")
async def get_scada_devices():
    """Get SCADA-connected devices"""
    return scada.get_devices()

@app.post("/api/scada/command")
async def send_scada_command(cmd: SCADACommand):
    """Send a command to SCADA system"""
    # Check firewall access first
    can_access = firewall.check_connection("student", cmd.device_id, "scada")
    if not can_access["allowed"]:
        return {"status": "blocked", "message": "Firewall blocking access"}
    
    result = scada.execute_command(cmd.device_id, cmd.command, cmd.parameters)
    await broadcast_update({"type": "scada_update", "status": scada.get_status()})
    return result

@app.get("/api/map")
async def get_map_data():
    """Get map data with stations and connections"""
    return {
        "stations": devices.get_map_stations(),
        "connections": devices.get_connections(),
        "grid_status": scada.get_grid_status()
    }

@app.post("/api/firewall/exploit")
async def exploit_firewall():
    """Attempt to exploit firewall vulnerabilities"""
    result = firewall.attempt_exploit()
    if result["success"]:
        await broadcast_update({"type": "firewall_compromised", "details": result})
    return result

@app.post("/api/scada/exploit")
async def exploit_scada():
    """Attempt to exploit SCADA vulnerabilities"""
    # Check firewall access
    if not firewall.check_scada_portal_access():
        raise HTTPException(status_code=403, detail="Access denied. Firewall rule required.")
    
    result = scada.attempt_exploit()
    if result["success"]:
        await broadcast_update({"type": "scada_compromised", "details": result})
    return result

@app.get("/api/dirbuster")
async def dirbuster_endpoint(path: str = ""):
    """Directory brute-forcing endpoint - simulates dirbuster"""
    # Common paths that might exist
    common_paths = [
        "/scada-portal",
        "/admin",
        "/login",
        "/firewall-login",
        "/api",
        "/static",
        "/dashboard",
        "/control",
        "/ot-control",
        "/hmi",
        "/scada"
    ]
    
    # Check if path exists
    if path in common_paths:
        return {
            "found": True,
            "path": path,
            "status_code": 200,
            "message": f"Path {path} found"
        }
    elif path == "":
        # Return hint about common paths
        return {
            "found": False,
            "hint": "Try common paths like /scada-portal, /admin, /control",
            "common_paths": common_paths
        }
    else:
        return {
            "found": False,
            "path": path,
            "status_code": 404,
            "message": f"Path {path} not found"
        }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process incoming messages
            await websocket.send_json({"type": "ack", "message": "received"})
    except WebSocketDisconnect:
        active_connections.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

