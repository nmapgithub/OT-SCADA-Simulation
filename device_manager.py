"""
Device Manager
Manages all devices in the OT network including switches, routers, etc.
"""
from typing import List, Dict, Optional

class DeviceManager:
    def __init__(self, scada_engine=None):
        self.scada = scada_engine
        self.network_devices = {
            "firewall-1": {
                "id": "firewall-1",
                "name": "NextGen Firewall",
                "type": "FIREWALL",
                "status": "online",
                "ip": "192.168.1.1",
                "location": {"x": 50, "y": 50},
                "metrics": {
                    "cpu_usage": 45,
                    "memory_usage": 60,
                    "connections_per_second": 1200,
                    "blocked_connections": 150
                },
                "config": {
                    "model": "FortiGate-600E",
                    "firmware": "v6.4.5",
                    "ips_enabled": True,
                    "ssl_inspection": True
                },
                "vulnerabilities": ["weak_admin_password", "default_credentials", "unpatched_firmware"]
            },
            "switch-1": {
                "id": "switch-1",
                "name": "Core Switch",
                "type": "SWITCH",
                "status": "online",
                "ip": "192.168.1.2",
                "location": {"x": 200, "y": 50},
                "metrics": {
                    "ports_active": 24,
                    "ports_total": 48,
                    "throughput_mbps": 1000,
                    "packet_loss": 0.01
                },
                "config": {
                    "model": "Cisco Catalyst 9300",
                    "vlan_count": 5,
                    "stp_enabled": True
                },
                "vulnerabilities": ["default_credentials", "snmp_weak"]
            },
            "switch-2": {
                "id": "switch-2",
                "name": "Distribution Switch",
                "type": "SWITCH",
                "status": "online",
                "ip": "192.168.1.3",
                "location": {"x": 350, "y": 50},
                "metrics": {
                    "ports_active": 12,
                    "ports_total": 24,
                    "throughput_mbps": 500,
                    "packet_loss": 0.02
                },
                "config": {
                    "model": "Cisco Catalyst 2960",
                    "vlan_count": 3,
                    "stp_enabled": True
                },
                "vulnerabilities": ["default_credentials"]
            }
        }
    
    def get_all_devices(self) -> List[Dict]:
        """Get all devices (SCADA + network)"""
        devices = list(self.scada.devices.values()) + list(self.network_devices.values())
        return devices
    
    def get_device(self, device_id: str) -> Optional[Dict]:
        """Get a specific device"""
        # Check SCADA devices first
        device = self.scada.get_device(device_id)
        if device:
            return device
        
        # Check network devices
        return self.network_devices.get(device_id)
    
    def get_map_stations(self) -> List[Dict]:
        """Get stations for map display"""
        stations = []
        
        # Add SCADA devices
        for device in self.scada.devices.values():
            if "location" in device:
                station_data = {
                    "id": device["id"],
                    "name": device["name"],
                    "type": device["type"],
                    "location": device["location"],
                    "status": device["status"]
                }
                
                # Add military-specific fields for missile systems and other military equipment
                if device.get("type") in ["S400", "DRONE", "AUTONOMOUS", "RADAR", "MISSILE"]:
                    station_data["power_status"] = device.get("power_status")
                    station_data["readiness"] = device.get("readiness")
                    if "city" in device:
                        station_data["city"] = device["city"]
                else:
                    # Regular SCADA metrics
                    station_data["metrics"] = {
                        "voltage": device.get("voltage", 0),
                        "load": device.get("load", 0),
                        "temperature": device.get("temperature", 0)
                    }
                    if "city" in device:
                        station_data["city"] = device["city"]
                
                stations.append(station_data)
        
        # Add network devices
        for device in self.network_devices.values():
            if "location" in device:
                stations.append({
                    "id": device["id"],
                    "name": device["name"],
                    "type": device["type"],
                    "location": device["location"],
                    "status": device["status"],
                    "metrics": device.get("metrics", {})
                })
        
        return stations
    
    def get_connections(self) -> List[Dict]:
        """Get network connections between devices"""
        connections = []
        
        # SCADA connections
        scada_server = self.scada.devices.get("scada-server-1")
        if scada_server:
            for device_id in scada_server.get("connected_devices", []):
                device = self.scada.get_device(device_id)
                if device and "location" in device:
                    connections.append({
                        "from": scada_server["id"],
                        "to": device_id,
                        "type": "scada_connection"
                    })
        
        # HMI connections
        hmi = self.scada.devices.get("hmi-1")
        if hmi:
            for device_id in hmi.get("connected_devices", []):
                device = self.scada.get_device(device_id)
                if device and "location" in device:
                    connections.append({
                        "from": hmi["id"],
                        "to": device_id,
                        "type": "hmi_connection"
                    })
        
        # Network device connections
        connections.append({
            "from": "firewall-1",
            "to": "switch-1",
            "type": "network_connection"
        })
        connections.append({
            "from": "switch-1",
            "to": "switch-2",
            "type": "network_connection"
        })
        connections.append({
            "from": "switch-2",
            "to": "scada-server-1",
            "type": "network_connection"
        })
        
        # Military equipment connections to SCADA systems
        military_devices = [d for d in self.scada.devices.values() if d.get("type") in ["S400", "DRONE", "AUTONOMOUS", "RADAR", "MISSILE"]]
        for mil_device in military_devices:
            station_id = mil_device.get("station_id")
            if station_id:
                connections.append({
                    "from": station_id,
                    "to": mil_device["id"],
                    "type": "military_connection"
                })
        
        return connections

