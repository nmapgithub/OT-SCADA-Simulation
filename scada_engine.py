"""
SCADA Simulation Engine
Simulates SCADA systems, PLCs, RTUs, HMIs, and power grid operations
"""
from typing import List, Dict, Optional, Any
import random
from datetime import datetime

class SCADAEngine:
    def __init__(self):
        self.devices: Dict[str, Dict] = {}
        self.grid_status: Dict[str, Any] = {}
        self.commands_log: List[Dict] = []
        self.compromised = False
        self._initialize_devices()
        self._initialize_grid()
    
    def _initialize_devices(self):
        """Initialize SCADA devices with India locations"""
        # Power Stations in Jammu & Kashmir and Pathankot region
        # Coordinates based on India map (simplified)
        # Jammu: ~32.7°N, 74.8°E, Pathankot: ~32.3°N, 75.6°E
        stations = [
            {"id": "station-1", "name": "Jammu Power Station", "type": "power_station", "capacity": 500, 
             "location": {"x": 470, "y": 180, "lat": 32.7266, "lon": 74.8570}, "city": "Jammu, J&K"},
            {"id": "station-2", "name": "Pathankot Power Station", "type": "power_station", "capacity": 750, 
             "location": {"x": 520, "y": 200, "lat": 32.2643, "lon": 75.6421}, "city": "Pathankot, Punjab"},
            {"id": "station-3", "name": "Srinagar Power Station", "type": "power_station", "capacity": 600, 
             "location": {"x": 480, "y": 120, "lat": 34.0837, "lon": 74.7973}, "city": "Srinagar, J&K"},
        ]
        
        # PLCs (Programmable Logic Controllers)
        plcs = [
            {"id": "plc-1", "name": "PLC Jammu Grid", "type": "PLC", "station_id": "station-1", 
             "location": {"x": 470, "y": 230, "lat": 32.7266, "lon": 74.8570}},
            {"id": "plc-2", "name": "PLC Pathankot Grid", "type": "PLC", "station_id": "station-2", 
             "location": {"x": 520, "y": 250, "lat": 32.2643, "lon": 75.6421}},
            {"id": "plc-3", "name": "PLC Srinagar Grid", "type": "PLC", "station_id": "station-3", 
             "location": {"x": 480, "y": 170, "lat": 34.0837, "lon": 74.7973}},
            {"id": "plc-4", "name": "PLC Distribution Network", "type": "PLC", "station_id": "station-2", 
             "location": {"x": 540, "y": 280, "lat": 32.3, "lon": 75.7}},
        ]
        
        # RTUs (Remote Terminal Units)
        rtus = [
            {"id": "rtu-1", "name": "RTU Jammu Substation", "type": "RTU", "station_id": "station-1", 
             "location": {"x": 450, "y": 280, "lat": 32.7, "lon": 74.8}},
            {"id": "rtu-2", "name": "RTU Pathankot Substation", "type": "RTU", "station_id": "station-2", 
             "location": {"x": 500, "y": 300, "lat": 32.26, "lon": 75.64}},
            {"id": "rtu-3", "name": "RTU Srinagar Substation", "type": "RTU", "station_id": "station-3", 
             "location": {"x": 490, "y": 220, "lat": 34.08, "lon": 74.79}},
        ]
        
        # HMI (Human Machine Interface)
        hmi = {
            "id": "hmi-1",
            "name": "Main HMI Control",
            "type": "HMI",
            "location": {"x": 500, "y": 100, "lat": 32.5, "lon": 75.2},
            "connected_devices": ["plc-1", "plc-2", "plc-3", "plc-4"]
        }
        
        # SCADA Server
        scada_server = {
            "id": "scada-server-1",
            "name": "SCADA Master Server",
            "type": "SCADA_SERVER",
            "location": {"x": 480, "y": 50, "lat": 32.5, "lon": 75.0},
            "connected_devices": ["hmi-1", "plc-1", "plc-2", "plc-3", "plc-4", "rtu-1", "rtu-2", "rtu-3"]
        }
        
        # Military Equipment - Connected to SCADA systems
        military = [
            {"id": "s400-1", "name": "S-400 Air Defense System Alpha", "type": "S400", "station_id": "station-1",
             "location": {"x": 450, "y": 400, "lat": 32.65, "lon": 74.80}, "city": "Jammu Sector"},
            {"id": "s400-2", "name": "S-400 Air Defense System Bravo", "type": "S400", "station_id": "station-3",
             "location": {"x": 500, "y": 180, "lat": 34.15, "lon": 74.85}, "city": "Srinagar Sector"},
            {"id": "drone-1", "name": "Armed UAV Squadron Alpha", "type": "DRONE", "station_id": "station-1",
             "location": {"x": 440, "y": 350, "lat": 32.68, "lon": 74.75}, "city": "Jammu Air Base"},
            {"id": "drone-2", "name": "Surveillance Drone Unit", "type": "DRONE", "station_id": "station-2",
             "location": {"x": 600, "y": 300, "lat": 32.30, "lon": 75.70}, "city": "Pathankot Air Base"},
            {"id": "drone-3", "name": "Combat Drone Squadron", "type": "DRONE", "station_id": "station-3",
             "location": {"x": 470, "y": 190, "lat": 34.10, "lon": 74.70}, "city": "Srinagar Air Base"},
            {"id": "auto-1", "name": "Autonomous Ground Vehicle Unit", "type": "AUTONOMOUS", "station_id": "station-1",
             "location": {"x": 490, "y": 360, "lat": 32.75, "lon": 74.90}, "city": "Jammu Defense Zone"},
            {"id": "auto-2", "name": "Autonomous Patrol System", "type": "AUTONOMOUS", "station_id": "station-2",
             "location": {"x": 640, "y": 310, "lat": 32.25, "lon": 75.75}, "city": "Pathankot Border"},
            {"id": "radar-1", "name": "Advanced Radar System", "type": "RADAR", "station_id": "station-3",
             "location": {"x": 460, "y": 210, "lat": 34.00, "lon": 74.75}, "city": "Srinagar Command"},
            {"id": "missile-1", "name": "Brahmos Missile Battery", "type": "MISSILE", "station_id": "station-1",
             "location": {"x": 480, "y": 390, "lat": 32.70, "lon": 74.87}, "city": "Jammu Strategic Point"},
        ]
        
        # Initialize all devices
        for device in stations + plcs + rtus + military:
            # Military equipment has different metrics
            if device["type"] in ["S400", "DRONE", "AUTONOMOUS", "RADAR", "MISSILE"]:
                self.devices[device["id"]] = {
                    **device,
                    "status": "online",
                    "power_status": "operational",
                    "readiness": random.uniform(0.85, 1.0),
                    "last_update": datetime.now().isoformat(),
                    "vulnerabilities": self._get_device_vulnerabilities(device["type"]),
                    "credentials": self._get_default_credentials(device["type"])
                }
            else:
                self.devices[device["id"]] = {
                    **device,
                    "status": "online",
                    "voltage": random.uniform(220, 240) if device["type"] != "power_station" else random.uniform(11000, 13200),
                    "load": random.uniform(0.4, 0.8),
                    "temperature": random.uniform(30, 45),
                    "last_update": datetime.now().isoformat(),
                    "vulnerabilities": self._get_device_vulnerabilities(device["type"]),
                    "credentials": self._get_default_credentials(device["type"])
                }
        
        self.devices[hmi["id"]] = {
            **hmi,
            "status": "online",
            "last_update": datetime.now().isoformat(),
            "vulnerabilities": ["default_credentials", "unencrypted_communication"],
            "credentials": {"username": "admin", "password": "admin123"}
        }
        
        self.devices[scada_server["id"]] = {
            **scada_server,
            "status": "online",
            "last_update": datetime.now().isoformat(),
            "vulnerabilities": ["default_credentials", "sql_injection", "command_injection"],
            "credentials": {"username": "scada_admin", "password": "scada2023"}
        }
    
    def _get_device_vulnerabilities(self, device_type: str) -> List[str]:
        """Get vulnerabilities for a device type"""
        vulnerabilities_map = {
            "PLC": ["CVE-2023-4567: Authentication Bypass", "Weak TLS Configuration", "CVE-2022-38392: Insecure Default Credentials"],
            "RTU": ["CVE-2023-1234: Authentication Weakness", "CVE-2022-3456: Unencrypted Communications", "Hardcoded Credentials Found"],
            "power_station": ["Physical Security: Inadequate Perimeter Controls", "CVE-2023-7890: Default Admin Access", "Insufficient Access Controls"],
            "HMI": ["CVE-2023-5678: Cross-Site Scripting (XSS)", "CVE-2022-9876: Weak Session Management", "Cleartext Protocol Transmission"],
            "SCADA_SERVER": ["CVE-2023-3456: SQL Injection Vulnerability", "CVE-2023-2345: Remote Code Execution", "Privilege Escalation: Misconfigured Permissions"],
            "S400": ["CVE-2023-8901: Firmware Update Verification Bypass", "Insufficient Network Segmentation", "CVE-2022-7654: Command Injection"],
            "DRONE": ["CVE-2023-6543: GPS Signal Spoofing Vulnerability", "CVE-2022-5432: Weak Communication Encryption", "Command Authentication Bypass"],
            "AUTONOMOUS": ["CVE-2023-4321: Sensor Data Manipulation", "AI Model: Adversarial Input Vulnerability", "CVE-2022-8765: Insufficient Input Validation"],
            "RADAR": ["CVE-2023-9012: Signal Processing Vulnerability", "Electromagnetic Interference Susceptibility", "CVE-2022-6789: Memory Corruption"],
            "MISSILE": ["CVE-2023-7654: Launch Authorization Weakness", "CVE-2022-4567: Command Validation Bypass", "Physical Tamper Detection: Disabled"]
        }
        return vulnerabilities_map.get(device_type, [])
    
    def _get_default_credentials(self, device_type: str) -> Dict[str, str]:
        """Get default credentials for device type"""
        credentials_map = {
            "PLC": {"username": "admin", "password": "1234"},
            "RTU": {"username": "user", "password": "user"},
            "power_station": {"username": "operator", "password": "operator"},
            "HMI": {"username": "admin", "password": "admin123"},
            "SCADA_SERVER": {"username": "scada_admin", "password": "scada2023"},
            "S400": {"username": "defense_admin", "password": "s400_2023"},
            "DRONE": {"username": "pilot", "password": "drone123"},
            "AUTONOMOUS": {"username": "auto_admin", "password": "auto2023"},
            "RADAR": {"username": "radar_op", "password": "radar123"},
            "MISSILE": {"username": "commander", "password": "missile_2023"}
        }
        return credentials_map.get(device_type, {"username": "admin", "password": "admin"})
    
    def _initialize_grid(self):
        """Initialize power grid status"""
        self.grid_status = {
            "total_capacity": 1850,  # MW
            "current_load": 1200,  # MW
            "frequency": 50.0,  # Hz
            "voltage_level": "normal",
            "stations_online": 3,
            "stations_total": 3,
            "grid_stability": "stable",
            "last_update": datetime.now().isoformat()
        }
    
    def get_devices(self) -> List[Dict]:
        """Get all SCADA devices"""
        return list(self.devices.values())
    
    def get_device(self, device_id: str) -> Optional[Dict]:
        """Get a specific device"""
        return self.devices.get(device_id)
    
    def execute_command(self, device_id: str, command: str, parameters: Dict) -> Dict:
        """Execute a command on a SCADA device"""
        device = self.devices.get(device_id)
        if not device:
            return {"status": "error", "message": "Device not found"}
        
        # Check if device is accessible (would normally check firewall/auth)
        if device["status"] != "online":
            return {"status": "error", "message": "Device is offline"}
        
        # Log command
        self.commands_log.append({
            "timestamp": datetime.now().isoformat(),
            "device_id": device_id,
            "command": command,
            "parameters": parameters,
            "executed": True
        })
        
        # Execute command based on type
        if command == "set_voltage":
            voltage = parameters.get("voltage", device.get("voltage", 230))
            device["voltage"] = voltage
            self._update_grid_status()
            return {"status": "success", "message": f"Voltage set to {voltage}V", "device": device}
        
        elif command == "set_load":
            load = parameters.get("load", device.get("load", 0.5))
            device["load"] = min(max(load, 0), 1.0)  # Clamp between 0 and 1
            self._update_grid_status()
            return {"status": "success", "message": f"Load set to {load*100}%", "device": device}
        
        elif command == "shutdown":
            device["status"] = "offline"
            device["voltage"] = 0
            device["load"] = 0
            self._update_grid_status()
            return {"status": "success", "message": "Device shut down", "device": device}
        
        elif command == "restart":
            device["status"] = "online"
            device["voltage"] = random.uniform(220, 240)
            device["load"] = random.uniform(0.4, 0.8)
            self._update_grid_status()
            return {"status": "success", "message": "Device restarted", "device": device}
        
        elif command == "cut_power":
            # Critical command - cut power to station
            if device["type"] == "power_station":
                device["status"] = "offline"
                device["voltage"] = 0
                # Reduce grid capacity
                self.grid_status["total_capacity"] -= device.get("capacity", 0)
                self.grid_status["stations_online"] -= 1
                self._update_grid_status()
                return {"status": "success", "message": f"Power cut to {device['name']}", "device": device, "grid_impact": True}
        
        return {"status": "error", "message": f"Unknown command: {command}"}
    
    def _update_grid_status(self):
        """Update power grid status based on devices"""
        online_devices = [d for d in self.devices.values() if d["status"] == "online"]
        stations_online = len([d for d in online_devices if d["type"] == "power_station"])
        
        total_load = sum(d.get("load", 0) * d.get("capacity", 0) for d in online_devices if d["type"] == "power_station")
        total_capacity = sum(d.get("capacity", 0) for d in online_devices if d["type"] == "power_station")
        
        self.grid_status.update({
            "current_load": total_load,
            "total_capacity": total_capacity,
            "stations_online": stations_online,
            "grid_stability": "stable" if total_capacity > total_load * 1.1 else "unstable",
            "frequency": 50.0 if self.grid_status["grid_stability"] == "stable" else 49.5,
            "voltage_level": "normal" if self.grid_status["grid_stability"] == "stable" else "low",
            "last_update": datetime.now().isoformat()
        })
    
    def attempt_exploit(self) -> Dict:
        """Attempt to exploit SCADA vulnerabilities"""
        # Try to exploit default credentials
        success = random.random() < 0.6  # 60% chance
        
        if success:
            self.compromised = True
            return {
                "success": True,
                "message": "SCADA system compromised via default credentials!",
                "method": "default_credentials",
                "compromised": True
            }
        else:
            return {
                "success": False,
                "message": "Exploitation attempt failed",
                "compromised": False
            }
    
    def get_status(self) -> Dict:
        """Get SCADA system status"""
        return {
            "compromised": self.compromised,
            "grid_status": self.grid_status,
            "devices_online": len([d for d in self.devices.values() if d["status"] == "online"]),
            "devices_total": len(self.devices),
            "recent_commands": self.commands_log[-20:]
        }
    
    def get_grid_status(self) -> Dict:
        """Get power grid status"""
        return self.grid_status

