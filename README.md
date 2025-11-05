# OT-SCADA Simulation Platform

An educational platform for teaching Operational Technology (OT) security and penetration testing. This platform simulates an OT infrastructure network with SCADA systems, power grid stations, and security mechanisms like firewalls.

## Features

### 🛡️ NextGen Firewall Simulation
- Firewall rule management (add, edit, delete)
- Policy-based traffic control
- IPS (Intrusion Prevention System) toggle
- Firewall logs and monitoring
- Vulnerability exploitation simulation
- Fortinet/FireEye-style web interface

### ⚡ SCADA System Simulation
- Multiple device types:
  - **PLC** (Programmable Logic Controllers)
  - **RTU** (Remote Terminal Units)
  - **HMI** (Human Machine Interface)
  - **SCADA Server**
  - **Power Stations**
- Real-time power grid monitoring
- Device control commands:
  - Set voltage
  - Set load
  - Shutdown/Restart devices
  - Cut power to stations
- Process variable monitoring
- HMI-style dashboard

### 🗺️ Interactive Network Map
- Visual representation of power grid stations
- Network device visualization (firewalls, switches)
- SCADA device connections
- Click on devices to view details
- Real-time status updates

### 🔓 Security Vulnerabilities
Multiple vulnerabilities implemented for educational purposes:
- Default credentials
- Weak passwords
- Unpatched firmware
- Exposed management interfaces
- SQL injection
- Command injection
- Unencrypted protocols
- Buffer overflow

### 📊 Device Detail Panels
Each device shows:
- Device type and status
- Current operational metrics (voltage, load, temperature)
- Configuration details
- Vulnerabilities list
- Credentials (for educational purposes)
- Control interface

## Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Setup

1. Clone or navigate to the project directory:
```bash
cd /root/OT-SCADA-Simulation
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

4. Open your browser and navigate to:
```
http://localhost:8000
```

## Usage Guide

### Learning Path

1. **Compromise Firewall Login**
   - Navigate to http://localhost:8000
   - Click "Firewall Login" button
   - Use brute-force or try default credentials: `admin` / `admin123`
   - Successfully login to access firewall management

2. **Disable Security Rules**
   - View the predefined firewall rules (4 security rules are active)
   - Identify the rules blocking SCADA access:
     - 🛡️ Block SCADA Portal Access
     - 🛡️ Block SCADA Protocol Commands
     - 🛡️ Block HTTPS to SCADA Network
     - 🛡️ Restrict Device Management Access
   - **Disable these rules** by clicking the toggle/edit buttons
   - This removes the security controls protecting SCADA systems

3. **Discover Hidden SCADA Portal**
   - Click "Dirbuster" button in the header
   - Scan for hidden paths: `/scada-portal`, `/admin`, `/control`
   - Find the SCADA portal at `/scada-portal`

4. **Access SCADA Portal**
   - Navigate to `/scada-portal` (only works if blocking rules are disabled)
   - View all SCADA devices and power grid status
   - See military equipment connections

5. **Control Devices & Execute Attacks**
   - Click on devices in the SCADA portal or map
   - View device details, credentials, and vulnerabilities
   - Execute control commands:
     - Shutdown military equipment (S-400, drones, missiles)
     - Cut power to stations (disables connected military systems)
     - Set voltage levels (cause equipment damage)
     - Adjust load percentages (destabilize grid)
     - Restart devices

6. **Observe Cascading Impact**
   - Watch grid stability change from "stable" to "unstable"
   - See military equipment go offline when power is cut
   - Monitor frequency drops and capacity reductions
   - Understand how OT attacks affect critical infrastructure

### Device Types

- **Firewall**: Network security device protecting the OT network
- **Switch**: Network switching devices
- **PLC**: Programmable Logic Controllers controlling industrial processes
- **RTU**: Remote Terminal Units for remote monitoring
- **HMI**: Human Machine Interface for operator interaction
- **SCADA Server**: Master control system
- **Power Station**: Electrical power generation stations

### Security Features

- **Default Deny Policy**: Firewall blocks all traffic by default
- **Rule-Based Access Control**: Traffic allowed only by explicit rules
- **IPS Protection**: Intrusion Prevention System detects and blocks attacks
- **Logging**: All firewall activities are logged
- **Vulnerability Simulation**: Realistic security vulnerabilities for learning

## API Endpoints

### Authentication
- `POST /api/firewall/login` - Login to firewall (username/password)
- `POST /api/firewall/logout` - Logout from firewall
- `GET /firewall-login` - Firewall login page
- `GET /scada-portal` - SCADA control portal (requires firewall access)

### Firewall
- `GET /api/firewall/rules` - Get all firewall rules (requires authentication)
- `POST /api/firewall/rules` - Add a new firewall rule (requires authentication)
- `PUT /api/firewall/rules/{rule_id}` - Update a firewall rule (requires authentication)
- `DELETE /api/firewall/rules/{rule_id}` - Delete a firewall rule (requires authentication)
- `GET /api/firewall/status` - Get firewall status
- `POST /api/firewall/exploit` - Attempt firewall exploitation
- `PUT /api/firewall/ips` - Toggle IPS (requires authentication)
- `POST /api/firewall/test` - Test connection through firewall
- `GET /api/dirbuster` - Directory brute-forcing endpoint

### SCADA
- `GET /api/scada/status` - Get SCADA system status
- `GET /api/scada/devices` - Get all SCADA devices
- `POST /api/scada/command` - Send command to SCADA device
- `POST /api/scada/exploit` - Attempt SCADA exploitation

### Devices
- `GET /api/devices` - Get all devices
- `GET /api/devices/{device_id}` - Get device details

### Map
- `GET /api/map` - Get map data with stations and connections

### WebSocket
- `WS /ws` - Real-time updates connection

## Project Structure

```
OT-SCADA-Simulation/
├── main.py                 # FastAPI application and routes
├── firewall_engine.py      # Firewall simulation engine
├── scada_engine.py         # SCADA system simulation engine
├── device_manager.py       # Device management system
├── requirements.txt        # Python dependencies
├── README.md               # This file
├── templates/
│   └── index.html          # Main web interface
└── static/
    ├── css/
    │   └── main.css        # Styling
    └── js/
        └── main.js         # Frontend JavaScript
```

## Educational Objectives

This platform teaches students:

1. **OT Network Architecture**: Understanding SCADA systems, PLCs, RTUs, and HMIs
2. **Firewall Security**: How firewalls protect networks and how to bypass them
3. **Penetration Testing**: Techniques for exploiting vulnerabilities
4. **SCADA Security**: Critical security concerns in industrial control systems
5. **Attack Impact**: Understanding the consequences of compromising OT systems
6. **Defense Strategies**: How to secure OT infrastructure

## Security Note

⚠️ **This is an educational simulation platform only.**
- All vulnerabilities and exploits are simulated
- No real systems are affected
- Designed for educational and training purposes
- Use responsibly and ethically

## Technologies Used

- **Backend**: FastAPI (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Real-time**: WebSockets
- **Simulation**: Custom Python engines

## License

This project is for educational purposes only.

## Contributing

This is an educational platform. Contributions for improving the simulation accuracy, adding more vulnerabilities, or enhancing the UI are welcome.

## Support

For issues or questions, please check the code comments or create an issue in the repository.

---

**Remember**: This platform is for educational purposes only. Always practice ethical hacking and obtain proper authorization before testing on real systems.

