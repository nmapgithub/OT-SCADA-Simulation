"""
Firewall Simulation Engine
Simulates NextGen Firewall behavior with rules, NAT, IPS, and vulnerabilities
"""
from typing import List, Dict, Optional, Any
import random
from datetime import datetime

class FirewallEngine:
    def __init__(self):
        self.rules: List[Dict] = []
        self.ips_enabled = True
        self.nat_rules: List[Dict] = []
        self.logs: List[Dict] = []
        self.compromised = False
        self.authenticated = False
        self.default_policy = "deny"  # Default deny
        
        # Authentication
        self.login_attempts = 0
        self.max_login_attempts = 5
        self.locked_until = None
        self.credentials = {
            "username": "admin",
            "password": "admin123"  # Weak password for educational purposes
        }
        
        # Initial rules (vulnerable configuration)
        self._initialize_default_rules()
        
        # Vulnerabilities
        self.vulnerabilities = {
            "weak_admin_password": True,
            "default_credentials": True,
            "unpatched_firmware": True,
            "exposed_management_interface": True
        }
    
    def _initialize_default_rules(self):
        """Initialize with security rules that block SCADA access - students must disable these"""
        default_rules = [
            {
                "id": "rule-1",
                "name": "🛡️ Block SCADA Portal Access",
                "source": "any",
                "destination": "scada",
                "service": "http",
                "action": "deny",
                "enabled": True,
                "priority": 100,
                "description": "Security rule blocking unauthorized access to SCADA portal"
            },
            {
                "id": "rule-2",
                "name": "🛡️ Block SCADA Protocol Commands",
                "source": "any",
                "destination": "any",
                "service": "scada",
                "action": "deny",
                "enabled": True,
                "priority": 90,
                "description": "Security rule blocking SCADA protocol commands to devices"
            },
            {
                "id": "rule-3",
                "name": "🛡️ Block HTTPS to SCADA Network",
                "source": "any",
                "destination": "portal",
                "service": "https",
                "action": "deny",
                "enabled": True,
                "priority": 95,
                "description": "Security rule blocking HTTPS access to SCADA network"
            },
            {
                "id": "rule-4",
                "name": "🛡️ Restrict Device Management Access",
                "source": "any",
                "destination": "any",
                "service": "http",
                "action": "deny",
                "enabled": True,
                "priority": 85,
                "description": "Security rule restricting HTTP device management access"
            },
            {
                "id": "rule-5",
                "name": "Allow Internal Network Traffic",
                "source": "192.168.1.0/24",
                "destination": "192.168.1.0/24",
                "service": "any",
                "action": "allow",
                "enabled": True,
                "priority": 50,
                "description": "Allow internal network communication"
            },
            {
                "id": "rule-6",
                "name": "Allow SSH to Management",
                "source": "192.168.1.0/24",
                "destination": "192.168.1.1",
                "service": "ssh",
                "action": "allow",
                "enabled": True,
                "priority": 60,
                "description": "Allow SSH for management purposes"
            }
        ]
        self.rules = default_rules
    
    def add_rule(self, rule: Dict):
        """Add a new firewall rule"""
        if "priority" not in rule:
            rule["priority"] = len(self.rules) * 10
        rule["created_at"] = datetime.now().isoformat()
        self.rules.append(rule)
        self.rules.sort(key=lambda x: x.get("priority", 0), reverse=True)
        self._log("rule_added", f"Rule added: {rule.get('name')}")
    
    def remove_rule(self, rule_id: str):
        """Remove a firewall rule"""
        self.rules = [r for r in self.rules if r.get("id") != rule_id]
        self._log("rule_removed", f"Rule removed: {rule_id}")
    
    def update_rule(self, rule_id: str, rule_data: Dict):
        """Update an existing firewall rule"""
        for i, rule in enumerate(self.rules):
            if rule.get("id") == rule_id:
                rule_data["id"] = rule_id
                rule_data["priority"] = rule.get("priority", 0)
                self.rules[i] = rule_data
                self.rules.sort(key=lambda x: x.get("priority", 0), reverse=True)
                self._log("rule_updated", f"Rule updated: {rule_id}")
                return
        raise ValueError(f"Rule {rule_id} not found")
    
    def check_connection(self, source: str, destination: str, service: str) -> Dict:
        """Check if a connection would be allowed"""
        self._log("connection_attempt", 
                 f"Connection attempt: {source} -> {destination}:{service}")
        
        # If compromised, allow everything from attacker
        if self.compromised and source == "student":
            return {
                "allowed": True,
                "reason": "firewall_compromised",
                "rule_id": None,
                "nat_applied": False
            }
        
        # Check rules in priority order
        for rule in self.rules:
            if not rule.get("enabled", True):
                continue
            
            if self._match_rule(rule, source, destination, service):
                allowed = rule.get("action") == "allow"
                self._log("connection_result",
                        f"Connection {'allowed' if allowed else 'blocked'} by rule {rule.get('name')}")
                return {
                    "allowed": allowed,
                    "reason": "rule_match",
                    "rule_id": rule.get("id"),
                    "rule_name": rule.get("name"),
                    "nat_applied": False
                }
        
        # Default policy
        allowed = self.default_policy == "allow"
        self._log("connection_result",
                 f"Connection {'allowed' if allowed else 'blocked'} by default policy")
        return {
            "allowed": allowed,
            "reason": "default_policy",
            "rule_id": None,
            "nat_applied": False
        }
    
    def _match_rule(self, rule: Dict, source: str, destination: str, service: str) -> bool:
        """Check if a connection matches a rule"""
        # Simple matching (can be enhanced with CIDR, etc.)
        source_match = rule.get("source") == "any" or rule.get("source") == source or source.startswith(rule.get("source", ""))
        dest_match = rule.get("destination") == "any" or rule.get("destination") == destination or destination.startswith(rule.get("destination", ""))
        service_match = rule.get("service") == "any" or rule.get("service") == service
        
        return source_match and dest_match and service_match
    
    def get_rules(self) -> List[Dict]:
        """Get all firewall rules"""
        return self.rules
    
    def toggle_ips(self, enabled: bool):
        """Toggle IPS (Intrusion Prevention System)"""
        self.ips_enabled = enabled
        self._log("ips_toggled", f"IPS {'enabled' if enabled else 'disabled'}")
    
    def attempt_exploit(self) -> Dict:
        """Attempt to exploit firewall vulnerabilities"""
        attempts = []
        
        # Try default credentials
        if self.vulnerabilities.get("default_credentials"):
            attempts.append({
                "method": "default_credentials",
                "success": random.random() < 0.3,  # 30% chance
                "message": "Attempting default admin credentials..."
            })
        
        # Try weak password
        if self.vulnerabilities.get("weak_admin_password"):
            attempts.append({
                "method": "weak_password",
                "success": random.random() < 0.4,  # 40% chance
                "message": "Attempting password brute force..."
            })
        
        # Try exposed management interface
        if self.vulnerabilities.get("exposed_management_interface"):
            attempts.append({
                "method": "exposed_interface",
                "success": random.random() < 0.5,  # 50% chance
                "message": "Exploiting exposed management interface..."
            })
        
        # Check if any exploit succeeded
        success = any(attempt["success"] for attempt in attempts)
        
        if success:
            self.compromised = True
            self._log("exploit_success", "Firewall compromised!")
            return {
                "success": True,
                "message": "Firewall successfully compromised!",
                "attempts": attempts,
                "compromised": True
            }
        else:
            return {
                "success": False,
                "message": "Exploitation attempts failed",
                "attempts": attempts,
                "compromised": False
            }
    
    def _log(self, event_type: str, message: str):
        """Add log entry"""
        self.logs.append({
            "timestamp": datetime.now().isoformat(),
            "type": event_type,
            "message": message
        })
        # Keep only last 1000 logs
        if len(self.logs) > 1000:
            self.logs = self.logs[-1000:]
    
    def get_logs(self, limit: int = 100) -> List[Dict]:
        """Get firewall logs"""
        return self.logs[-limit:]
    
    def authenticate(self, username: str, password: str) -> Dict:
        """Authenticate firewall login"""
        from datetime import datetime, timedelta
        
        # Check if locked
        if self.locked_until and datetime.now() < self.locked_until:
            remaining = (self.locked_until - datetime.now()).seconds
            return {
                "success": False,
                "message": f"Account locked. Try again in {remaining} seconds.",
                "locked": True
            }
        
        # Check credentials
        if username == self.credentials["username"] and password == self.credentials["password"]:
            self.authenticated = True
            self.login_attempts = 0
            self.locked_until = None
            self._log("auth_success", f"Successful login: {username}")
            return {
                "success": True,
                "message": "Authentication successful",
                "authenticated": True
            }
        else:
            self.login_attempts += 1
            self._log("auth_failed", f"Failed login attempt {self.login_attempts}: {username}")
            
            # Lock after max attempts
            if self.login_attempts >= self.max_login_attempts:
                self.locked_until = datetime.now() + timedelta(seconds=300)  # 5 minutes
                return {
                    "success": False,
                    "message": f"Too many failed attempts. Account locked for 5 minutes.",
                    "locked": True,
                    "attempts_remaining": 0
                }
            
            return {
                "success": False,
                "message": "Invalid credentials",
                "attempts_remaining": self.max_login_attempts - self.login_attempts,
                "locked": False
            }
    
    def logout(self):
        """Logout from firewall"""
        self.authenticated = False
        self._log("auth_logout", "User logged out")
    
    def check_scada_portal_access(self) -> bool:
        """Check if SCADA portal access is allowed via firewall rules"""
        # If firewall is compromised, allow everything
        if self.compromised:
            return True
        
        # Check rules - now we need to make sure there's NO DENY rule blocking access
        # Or there's an ALLOW rule that permits it
        scada_blocked = False
        scada_allowed = False
        
        for rule in self.rules:
            if not rule.get("enabled", True):
                continue
                
            service = rule.get("service", "").lower()
            action = rule.get("action", "").lower()
            destination = rule.get("destination", "").lower()
            
            # Check if this rule blocks SCADA access
            if (action == "deny" and 
                (service in ["http", "https", "any"] or "scada" in service or "portal" in service) and
                (destination == "any" or "scada" in destination or "portal" in destination)):
                scada_blocked = True
                self._log("scada_access_denied", f"SCADA portal access blocked by rule: {rule.get('name')}")
                break
            
            # Check if this rule allows SCADA access
            if (action == "allow" and 
                (service in ["http", "https", "any"] or "scada" in service or "portal" in service) and
                (destination == "any" or "scada" in destination or "portal" in destination)):
                scada_allowed = True
        
        # If blocked by a deny rule, access denied
        if scada_blocked:
            return False
        
        # If explicitly allowed, grant access
        if scada_allowed:
            self._log("scada_access", "SCADA portal access allowed")
            return True
        
        # Default deny if not explicitly allowed
        self._log("scada_access_denied", "SCADA portal access denied - default policy")
        return False
    
    def get_status(self) -> Dict:
        """Get firewall status"""
        return {
            "compromised": self.compromised,
            "authenticated": self.authenticated,
            "ips_enabled": self.ips_enabled,
            "rule_count": len(self.rules),
            "default_policy": self.default_policy,
            "vulnerabilities": self.vulnerabilities,
            "login_attempts": self.login_attempts,
            "max_login_attempts": self.max_login_attempts,
            "locked": self.locked_until is not None if self.locked_until else False,
            "recent_logs": self.get_logs(50)
        }

