# OT-SCADA Simulation - Complete Attack Scenario

## 🎯 Overview

This simulation teaches students how to compromise critical infrastructure through a multi-stage attack chain. The firewall now comes with **predefined security rules** that students must disable to gain access to SCADA systems and military equipment.

---

## 🚀 Attack Chain: Step-by-Step Guide

### **Stage 1: Initial Access - Firewall Login**

**Objective**: Compromise the firewall login credentials

**Steps**:
1. Navigate to `http://localhost:8000`
2. Click **"Firewall Login"** button
3. Try brute-force attack or use default credentials:
   - Username: `admin`
   - Password: `admin123`
4. Successfully login to access firewall management interface

**Learning Point**: Many OT systems use default or weak credentials that are never changed.

---

### **Stage 2: Disable Security Controls**

**Objective**: Remove the security rules protecting SCADA systems

**What You'll See**:
After logging in, the firewall panel shows **6 predefined rules**:

#### 🛡️ Security Rules (ACTIVE - Must Disable):
1. **Block SCADA Portal Access** (Priority 100)
   - Blocks: HTTP to SCADA destinations
   - Status: **Enabled** ← Disable this!

2. **Block SCADA Protocol Commands** (Priority 90)
   - Blocks: SCADA protocol to all devices
   - Status: **Enabled** ← Disable this!

3. **Block HTTPS to SCADA Network** (Priority 95)
   - Blocks: HTTPS to portal destinations
   - Status: **Enabled** ← Disable this!

4. **Restrict Device Management Access** (Priority 85)
   - Blocks: HTTP device management
   - Status: **Enabled** ← Disable this!

#### ✅ Legitimate Rules (Keep Enabled):
5. **Allow Internal Network Traffic** (Priority 50)
   - Allows: Internal 192.168.1.0/24 communication

6. **Allow SSH to Management** (Priority 60)
   - Allows: SSH for management

**Steps**:
1. Click **"Edit"** button on each security rule (rules 1-4)
2. Toggle **"Enabled"** to **"Disabled"** or **OFF**
3. Save changes
4. Verify rules show as **"Disabled"** in the firewall table

**Learning Point**: With firewall access, attackers can disable security controls, removing all protection from critical infrastructure.

---

### **Stage 3: Reconnaissance - Discover Hidden Systems**

**Objective**: Find the hidden SCADA portal using directory brute-forcing

**Steps**:
1. Click **"Dirbuster"** button in the header
2. Try scanning common paths:
   - `/scada-portal` ✅ **SUCCESS!**
   - `/admin`
   - `/control`
   - `/ot-control`
3. When you find `/scada-portal`, note the link

**Learning Point**: Security through obscurity doesn't work. Hidden pages can be discovered using automated tools.

---

### **Stage 4: Access SCADA Control Portal**

**Objective**: Navigate to the SCADA portal

**Steps**:
1. Navigate to `http://localhost:8000/scada-portal`
2. **Important**: This only works if security rules are disabled!
3. You should see:
   - Power Grid Status dashboard
   - All SCADA devices
   - Military equipment
   - Real-time metrics

**Error Handling**:
- If you see **"Access denied. Firewall rule required"**:
  - Go back and ensure rules 1, 3, and 4 are **disabled**
- If you see **"Authentication required"**:
  - Login to firewall first

---

### **Stage 5: Device Exploration**

**Objective**: Understand the infrastructure and find vulnerabilities

**What You Can Do**:
1. **View Grid Status**:
   - Total Capacity: 1850 MW
   - Current Load: varies
   - Frequency: 50 Hz (stable)
   - Stations Online: 3/3

2. **Browse Devices**:
   - **Power Stations** (3): Jammu, Pathankot, Srinagar
   - **PLCs** (4): Industrial controllers
   - **RTUs** (3): Remote monitoring
   - **Military Equipment** (9):
     - S-400 Air Defense (2)
     - Drones (3)
     - Autonomous Systems (2)
     - Radar (1)
     - Missile Battery (1)

3. **Click on Any Device** to view:
   - Operational metrics
   - Vulnerabilities list
   - **Default credentials**
   - Control buttons

---

### **Stage 6: Execute Attacks**

**Objective**: Demonstrate the impact of infrastructure compromise

#### **Attack Scenario A: Disable Military Air Defense**

```
Target: S-400 Air Defense Systems
Impact: Leave airspace vulnerable

Steps:
1. Click "S-400 Air Defense System Alpha (Jammu Sector)"
2. View credentials: defense_admin / s400_2023
3. Click "Shutdown" button
4. Confirm action
5. Repeat for "S-400 Air Defense System Bravo (Srinagar Sector)"

Result: Both S-400 systems offline, air defense compromised!
```

#### **Attack Scenario B: Power Grid Sabotage**

```
Target: Power Stations
Impact: Cascading infrastructure failure

Steps:
1. Click "Jammu Power Station"
2. View credentials: operator / operator
3. Click "Cut Power" button
4. Observe: 
   - Grid capacity drops 500 MW
   - Connected military equipment loses power
   - S-400, drones, and autonomous systems in Jammu go offline

5. Click "Srinagar Power Station"
6. Click "Cut Power"
7. Observe:
   - Grid becomes "UNSTABLE"
   - Frequency drops below 50 Hz
   - Only Pathankot station remaining
   - Northern defense completely offline

Result: Military infrastructure compromised through power grid attack!
```

#### **Attack Scenario C: Drone Squadron Hijack**

```
Target: Drone Systems
Impact: Loss of aerial surveillance and combat capability

Steps:
1. Click any drone system (e.g., "Armed UAV Squadron Alpha")
2. View credentials: pilot / drone123
3. Click "Shutdown" to disable
4. Or use "Set Voltage" / "Set Load" to manipulate

Result: Drones grounded, aerial operations halted!
```

#### **Attack Scenario D: Complete Infrastructure Takeover**

```
Target: Everything
Impact: Total infrastructure compromise

Steps:
1. Cut power to all 3 power stations
2. Shutdown all S-400 systems
3. Disable all drone squadrons
4. Shutdown radar system
5. Disable autonomous systems
6. Watch grid status: "CRITICAL - UNSTABLE"

Result: Complete loss of power and defense capabilities!
```

---

## 📊 **Monitoring Attack Impact**

Watch for these indicators:

### **Power Grid Status Changes**:
- **Total Capacity**: Decreases as stations go offline
- **Grid Stability**: Changes from "stable" → "unstable"
- **Frequency**: Drops from 50.0 Hz → 49.5 Hz (dangerous!)
- **Stations Online**: Decreases (e.g., 3/3 → 1/3 → 0/3)

### **Device Status Changes**:
- **Status**: "online" → "offline"
- **Voltage**: Normal → 0V
- **Load**: Normal → 0%
- **Military Equipment**: "operational" → "offline" / "no power"

### **Network Map Visualization**:
- Navigate to "Network Map" tab
- See geographical locations of all devices
- **Blue lines** = Military SCADA connections
- **Yellow lines** = Power grid connections
- **Green lines** = Network connections
- Click any marker for quick device access

---

## 🎓 **Learning Objectives Demonstrated**

This simulation teaches:

1. **Attack Chain Progression**: Login → Disable Security → Discover → Access → Exploit → Impact
2. **Privilege Escalation**: From login credentials to full infrastructure control
3. **Lateral Movement**: From firewall to SCADA to military systems
4. **Default Credentials**: How weak passwords enable attacks
5. **Security Misconfigurations**: How disabled rules expose systems
6. **Lack of Segmentation**: Military and civilian infrastructure sharing resources
7. **Cascading Failures**: One compromised system affects everything
8. **Real-World Impact**: Understanding consequences of OT attacks

---

## 🛡️ **Defense Lessons**

What should be done to prevent these attacks:

### **Authentication & Access Control**:
- ✅ Change all default credentials
- ✅ Implement strong password policies
- ✅ Enable multi-factor authentication
- ✅ Use role-based access control (RBAC)
- ✅ Regular password rotation

### **Network Segmentation**:
- ✅ Separate military from civilian systems
- ✅ Implement DMZ for SCADA systems
- ✅ Use VLANs to isolate critical devices
- ✅ Air-gap critical infrastructure when possible

### **Firewall Hardening**:
- ✅ Default deny policy for all traffic
- ✅ Prevent rule modification without approval
- ✅ Audit all firewall changes
- ✅ Alert on security rule disablement
- ✅ Implement rule approval workflows

### **Monitoring & Detection**:
- ✅ Log all firewall rule changes
- ✅ Alert on failed login attempts
- ✅ Monitor SCADA command execution
- ✅ Detect abnormal device behavior
- ✅ Real-time security operations center (SOC)

### **Zero Trust Architecture**:
- ✅ Verify every access request
- ✅ Assume breach mentality
- ✅ Micro-segmentation
- ✅ Continuous authentication
- ✅ Least privilege access

---

## 📝 **Default Credentials Reference**

| System Type | Username | Password | Count |
|-------------|----------|----------|-------|
| Firewall | `admin` | `admin123` | 1 |
| Power Stations | `operator` | `operator` | 3 |
| PLCs | `admin` | `1234` | 4 |
| RTUs | `user` | `user` | 3 |
| HMI | `admin` | `admin123` | 1 |
| SCADA Server | `scada_admin` | `scada2023` | 1 |
| S-400 Systems | `defense_admin` | `s400_2023` | 2 |
| Drones | `pilot` | `drone123` | 3 |
| Autonomous | `auto_admin` | `auto2023` | 2 |
| Radar | `radar_op` | `radar123` | 1 |
| Missiles | `commander` | `missile_2023` | 1 |

---

## ⚠️ **Important Notes**

- This is an **educational simulation** only
- No real systems are affected
- All vulnerabilities are intentionally included for learning
- Use this knowledge responsibly and ethically
- Always obtain proper authorization before testing real systems
- Never apply these techniques to production systems without permission

---

## 🔗 **Quick Reference Links**

- **Main Interface**: `http://localhost:8000`
- **Firewall Login**: `http://localhost:8000/firewall-login`
- **SCADA Portal**: `http://localhost:8000/scada-portal` (requires disabled security rules)
- **Default Credentials**: See `DEFAULT_CREDENTIALS.md`
- **Full Documentation**: See `README.md`

---

**Happy Learning! Remember: With great power comes great responsibility.** 🛡️💻

