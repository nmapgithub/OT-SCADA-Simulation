# Default Credentials - OT-SCADA Simulation Platform

This document lists all default credentials used in the simulation platform for educational purposes.

## ⚠️ Security Notice
These credentials are intentionally weak for educational purposes. In a real-world scenario, these would be severe security vulnerabilities.

---

## 🛡️ Firewall Credentials

**NextGen Firewall Login:**
- **URL:** `/firewall-login`
- **Username:** `admin`
- **Password:** `admin123`
- **Brute-Force Protection:** 5 attempts, then 5-minute lockout

---

## ⚡ SCADA Device Credentials

### PLC (Programmable Logic Controllers)
- **Username:** `admin`
- **Password:** `1234`
- **Devices:**
  - PLC Jammu Grid (plc-1)
  - PLC Pathankot Grid (plc-2)
  - PLC Srinagar Grid (plc-3)
  - PLC Distribution Network (plc-4)

### RTU (Remote Terminal Units)
- **Username:** `user`
- **Password:** `user`
- **Devices:**
  - RTU Jammu Substation (rtu-1)
  - RTU Pathankot Substation (rtu-2)
  - RTU Srinagar Substation (rtu-3)

### Power Stations
- **Username:** `operator`
- **Password:** `operator`
- **Devices:**
  - Jammu Power Station (station-1)
  - Pathankot Power Station (station-2)
  - Srinagar Power Station (station-3)

### HMI (Human Machine Interface)
- **Device:** Main HMI Control (hmi-1)
- **Username:** `admin`
- **Password:** `admin123`

### SCADA Server
- **Device:** SCADA Master Server (scada-server-1)
- **Username:** `scada_admin`
- **Password:** `scada2023`

---

## 🎖️ Military Equipment (Critical Infrastructure)

### S-400 Air Defense Systems
- **Username:** `defense_admin`
- **Password:** `s400_2023`
- **Devices:**
  - S-400 Air Defense System Alpha (s400-1) - Jammu Sector
  - S-400 Air Defense System Bravo (s400-2) - Srinagar Sector
- **Vulnerabilities:** Command injection, firmware backdoor, network exposure

### Drone Systems
- **Username:** `pilot`
- **Password:** `drone123`
- **Devices:**
  - Armed UAV Squadron Alpha (drone-1) - Jammu Air Base
  - Surveillance Drone Unit (drone-2) - Pathankot Air Base
  - Combat Drone Squadron (drone-3) - Srinagar Air Base
- **Vulnerabilities:** GPS spoofing, command hijacking, weak encryption

### Autonomous Systems
- **Username:** `auto_admin`
- **Password:** `auto2023`
- **Devices:**
  - Autonomous Ground Vehicle Unit (auto-1) - Jammu Defense Zone
  - Autonomous Patrol System (auto-2) - Pathankot Border
- **Vulnerabilities:** AI model poisoning, sensor manipulation

### Radar Systems
- **Username:** `radar_op`
- **Password:** `radar123`
- **Devices:**
  - Advanced Radar System (radar-1) - Srinagar Command
- **Vulnerabilities:** Signal jamming, buffer overflow

### Missile Systems
- **Username:** `commander`
- **Password:** `missile_2023`
- **Devices:**
  - Brahmos Missile Battery (missile-1) - Jammu Strategic Point
- **Vulnerabilities:** Weak launch codes, command injection, physical tampering

**⚠️ CRITICAL WARNING:** All military equipment is connected to power stations through SCADA systems. Compromising the power grid can disable or manipulate military defense systems, creating critical national security threats.

---

## 📋 Summary Table

| Device Type | Username | Password | Device Count |
|------------|----------|----------|--------------|
| **Firewall** | `admin` | `admin123` | 1 |
| **PLC** | `admin` | `1234` | 4 |
| **RTU** | `user` | `user` | 3 |
| **Power Station** | `operator` | `operator` | 3 |
| **HMI** | `admin` | `admin123` | 1 |
| **SCADA Server** | `scada_admin` | `scada2023` | 1 |
| **S-400 Systems** | `defense_admin` | `s400_2023` | 2 |
| **Drone Systems** | `pilot` | `drone123` | 3 |
| **Autonomous Systems** | `auto_admin` | `auto2023` | 2 |
| **Radar Systems** | `radar_op` | `radar123` | 1 |
| **Missile Systems** | `commander` | `missile_2023` | 1 |

---

## 🔍 How to Use These Credentials

### 1. Firewall Login
1. Navigate to `/firewall-login`
2. Use brute-force techniques or try default credentials
3. Login with: `admin` / `admin123`
4. After login, access firewall management

### 2. Disable Security Rules
1. After logging into firewall, view the firewall rules panel
2. You'll see 4 active security rules (marked with 🛡️) blocking SCADA access:
   - Block SCADA Portal Access
   - Block SCADA Protocol Commands
   - Block HTTPS to SCADA Network
   - Restrict Device Management Access
3. **Disable/toggle OFF these blocking rules** to gain access
4. This demonstrates removing security controls

### 3. Finding Hidden SCADA Portal
- Use Dirbuster tool to find `/scada-portal`
- Common paths: `/scada-portal`, `/admin`, `/control`
- Once security rules are disabled, navigate to `/scada-portal`

### 4. SCADA Device Access
1. Access SCADA portal at `/scada-portal` (only works if blocking rules disabled)
2. Click on any device to view details
3. Credentials are displayed in device detail panel
4. Use these credentials for device control
5. Execute commands to control/disable military and power systems

---

## 🎯 Learning Objectives

This simulation demonstrates:
- **Default Credentials:** Devices often ship with factory defaults that are never changed
- **Common Weak Passwords:** Many devices use simple, guessable passwords
- **Shared Credentials:** Multiple devices use the same passwords across infrastructure
- **Firewall Misconfigurations:** Security rules can be disabled by attackers with access
- **No Password Policy:** Weak passwords are accepted without complexity requirements
- **Credential Exposure:** Credentials are often visible in configuration files or device details
- **Lack of Segmentation:** Critical military systems share infrastructure with civilian systems
- **Cascading Failures:** Compromising one system (firewall) leads to full infrastructure access
- **Attack Chain:** Login → Disable Security → Discover Hidden Systems → Exploit → Control → Impact

---

## 📝 Notes

- All passwords are intentionally weak for educational purposes
- Real-world OT systems should NEVER use these passwords
- Always change default credentials in production systems
- Implement strong password policies
- Use unique credentials for each device
- Enable multi-factor authentication where possible

---

**Remember:** This is a simulation platform only. Always practice ethical hacking and obtain proper authorization before testing on real systems.

