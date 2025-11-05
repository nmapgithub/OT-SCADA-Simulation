// OT-SCADA Simulation Platform - Main JavaScript

let ws = null;
let firewallCompromised = false;
let firewallAuthenticated = false;
let scadaAccessGranted = false;
let currentDevice = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeWebSocket();
    loadFirewallRules();
    loadSCADAStatus();
    loadMap();
    setInterval(updateStatus, 5000); // Update every 5 seconds
});

// WebSocket connection
function initializeWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
        console.log('WebSocket connected');
        document.getElementById('connection-status').textContent = 'Connected';
        document.getElementById('connection-status').classList.remove('disconnected');
    };
    
    ws.onclose = function() {
        console.log('WebSocket disconnected');
        document.getElementById('connection-status').textContent = 'Disconnected';
        document.getElementById('connection-status').classList.add('disconnected');
        // Reconnect after 3 seconds
        setTimeout(initializeWebSocket, 3000);
    };
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

function handleWebSocketMessage(data) {
    switch(data.type) {
        case 'firewall_updated':
            loadFirewallRules();
            break;
        case 'firewall_compromised':
            firewallCompromised = true;
            showNotification('Firewall compromised! Access granted.', 'success');
            break;
        case 'scada_update':
            loadSCADAStatus();
            break;
        case 'scada_compromised':
            scadaAccessGranted = true;
            document.getElementById('scada-access-status').textContent = 'Access Granted';
            document.getElementById('scada-access-status').classList.add('granted');
            showNotification('SCADA system compromised!', 'success');
            break;
    }
}

// Panel Navigation
function showFirewall() {
    hideAllPanels();
    document.getElementById('firewall-panel').classList.add('active');
    loadFirewallStatus();
    // Check if authenticated
    checkFirewallAuth();
}

async function checkFirewallAuth() {
    try {
        const response = await fetch('/api/firewall/status');
        const status = await response.json();
        
        firewallAuthenticated = status.authenticated;
        
        if (!status.authenticated) {
            // Redirect to login
            window.location.href = '/firewall-login';
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
}

function showSCADA() {
    hideAllPanels();
    document.getElementById('scada-panel').classList.add('active');
    loadSCADAStatus();
}

function showMap() {
    hideAllPanels();
    document.getElementById('map-panel').classList.add('active');
    loadMap();
}

// Dirbuster functionality removed - students should use external tools like:
// - Dirb
// - Gobuster  
// - Dirbuster
// - Burp Suite
// Target: /scada-portal

function hideAllPanels() {
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.remove('active');
    });
}

// Firewall Functions
async function loadFirewallRules() {
    try {
        const response = await fetch('/api/firewall/rules');
        const rules = await response.json();
        displayFirewallRules(rules);
    } catch (error) {
        console.error('Error loading firewall rules:', error);
    }
}

function displayFirewallRules(rules) {
    const tbody = document.getElementById('firewall-rules-body');
    tbody.innerHTML = '';
    
    rules.forEach(rule => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${rule.name}</td>
            <td>${rule.source}</td>
            <td>${rule.destination}</td>
            <td>${rule.service}</td>
            <td><span class="action-badge action-${rule.action}">${rule.action.toUpperCase()}</span></td>
            <td><span class="${rule.enabled ? 'enabled-badge' : 'disabled-badge'}">${rule.enabled ? 'Enabled' : 'Disabled'}</span></td>
            <td>
                <button class="btn btn-secondary" onclick="editRule('${rule.id}')" style="margin-right: 0.5rem;">Edit</button>
                <button class="btn btn-danger" onclick="deleteRule('${rule.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadFirewallStatus() {
    try {
        const response = await fetch('/api/firewall/status');
        const status = await response.json();
        
        firewallCompromised = status.compromised;
        firewallAuthenticated = status.authenticated;
        
        const statusHtml = `
            <div class="status-item">
                <span>Status:</span>
                <span style="color: ${status.compromised ? '#ff4444' : '#00ff88'}">
                    ${status.compromised ? 'COMPROMISED' : 'SECURE'}
                </span>
            </div>
            <div class="status-item">
                <span>Total Rules:</span>
                <span>${status.rule_count}</span>
            </div>
            <div class="status-item">
                <span>IPS:</span>
                <span>${status.ips_enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div class="status-item">
                <span>Default Policy:</span>
                <span>${status.default_policy.toUpperCase()}</span>
            </div>
        `;
        document.getElementById('firewall-status').innerHTML = statusHtml;
        
        // Update IPS toggle
        document.getElementById('ips-toggle').checked = status.ips_enabled;
    } catch (error) {
        console.error('Error loading firewall status:', error);
    }
}

function addFirewallRule() {
    // Clear any editing state
    delete document.getElementById('rule-form').dataset.editingRuleId;
    
    // Reset form and change title
    document.getElementById('rule-form').reset();
    document.querySelector('#rule-modal h2').textContent = 'Add Firewall Rule';
    document.getElementById('rule-modal').style.display = 'block';
    document.getElementById('rule-form').onsubmit = saveRule;
}

function closeRuleModal() {
    document.getElementById('rule-modal').style.display = 'none';
}

async function saveRule(event) {
    event.preventDefault();
    
    const form = document.getElementById('rule-form');
    const editingRuleId = form.dataset.editingRuleId;
    
    const rule = {
        name: document.getElementById('rule-name').value,
        source: document.getElementById('rule-source').value,
        destination: document.getElementById('rule-destination').value,
        service: document.getElementById('rule-service').value,
        action: document.getElementById('rule-action').value,
        enabled: document.getElementById('rule-enabled').checked
    };
    
    try {
        let response;
        let successMessage;
        
        if (editingRuleId) {
            // Editing existing rule - use PUT
            response = await fetch(`/api/firewall/rules/${editingRuleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rule)
            });
            successMessage = 'Rule updated successfully';
        } else {
            // Adding new rule - use POST
            response = await fetch('/api/firewall/rules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rule)
            });
            successMessage = 'Rule added successfully';
        }
        
        if (response.ok) {
            showNotification(successMessage, 'success');
            closeRuleModal();
            loadFirewallRules();
        } else {
            const errorData = await response.json();
            showNotification(errorData.detail || 'Failed to save rule', 'error');
        }
    } catch (error) {
        console.error('Error saving rule:', error);
        showNotification('Error saving rule', 'error');
    }
}

async function deleteRule(ruleId) {
    if (!confirm('Are you sure you want to delete this rule?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/firewall/rules/${ruleId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Rule deleted successfully', 'success');
            loadFirewallRules();
        } else {
            showNotification('Failed to delete rule', 'error');
        }
    } catch (error) {
        console.error('Error deleting rule:', error);
        showNotification('Error deleting rule', 'error');
    }
}

async function editRule(ruleId) {
    // Fetch all rules to find the one we're editing
    try {
        const response = await fetch('/api/firewall/rules');
        const rules = await response.json();
        const rule = rules.find(r => r.id === ruleId);
        
        if (!rule) {
            showNotification('Rule not found', 'error');
            return;
        }
        
        // Store the rule ID for updating
        document.getElementById('rule-form').dataset.editingRuleId = ruleId;
        
        // Populate form with existing rule data
        document.getElementById('rule-name').value = rule.name;
        document.getElementById('rule-source').value = rule.source;
        document.getElementById('rule-destination').value = rule.destination;
        document.getElementById('rule-service').value = rule.service;
        document.getElementById('rule-action').value = rule.action;
        document.getElementById('rule-enabled').checked = rule.enabled;
        
        // Change modal title
        document.querySelector('#rule-modal h2').textContent = 'Edit Firewall Rule';
        
        // Show the modal
        document.getElementById('rule-modal').style.display = 'block';
    } catch (error) {
        console.error('Error loading rule:', error);
        showNotification('Error loading rule', 'error');
    }
}

async function toggleIPS() {
    const enabled = document.getElementById('ips-toggle').checked;
    
    try {
        const response = await fetch('/api/firewall/ips', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enabled: enabled })
        });
        
        if (response.ok) {
            showNotification(`IPS ${enabled ? 'enabled' : 'disabled'}`, 'success');
            loadFirewallStatus();
        } else {
            showNotification('Failed to toggle IPS', 'error');
        }
    } catch (error) {
        console.error('Error toggling IPS:', error);
        showNotification('Error toggling IPS', 'error');
    }
}

// Exploit functionality removed - students should use real penetration testing tools

// SCADA Functions
async function loadSCADAStatus() {
    try {
        const [statusResponse, devicesResponse] = await Promise.all([
            fetch('/api/scada/status'),
            fetch('/api/scada/devices')
        ]);
        
        const status = await statusResponse.json();
        const devices = await devicesResponse.json();
        
        displayGridStatus(status.grid_status);
        displaySCADADevices(devices);
    } catch (error) {
        console.error('Error loading SCADA status:', error);
    }
}

function displayGridStatus(gridStatus) {
    const gridHtml = `
        <div class="metric-card">
            <div class="metric-label">Total Capacity</div>
            <div class="metric-value">${gridStatus.total_capacity} MW</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Current Load</div>
            <div class="metric-value">${gridStatus.current_load} MW</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Frequency</div>
            <div class="metric-value">${gridStatus.frequency.toFixed(2)} Hz</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Grid Stability</div>
            <div class="metric-value" style="color: ${gridStatus.grid_stability === 'stable' ? '#00ff88' : '#ff4444'}">
                ${gridStatus.grid_stability.toUpperCase()}
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Stations Online</div>
            <div class="metric-value">${gridStatus.stations_online}/${gridStatus.stations_total}</div>
        </div>
    `;
    document.getElementById('grid-status').innerHTML = gridHtml;
}

function displaySCADADevices(devices) {
    const container = document.getElementById('scada-devices');
    container.innerHTML = '';
    
    devices.forEach(device => {
        const card = document.createElement('div');
        card.className = 'device-card';
        card.onclick = () => showDeviceDetails(device);
        
        card.innerHTML = `
            <h4>${device.name}</h4>
            <div class="device-type">${device.type}</div>
            <div class="device-metrics">
                <div class="metric-row">
                    <span>Status:</span>
                    <span style="color: ${device.status === 'online' ? '#00ff88' : '#ff4444'}">
                        ${device.status.toUpperCase()}
                    </span>
                </div>
                ${device.voltage !== undefined ? `
                    <div class="metric-row">
                        <span>Voltage:</span>
                        <span>${device.voltage.toFixed(1)}V</span>
                    </div>
                ` : ''}
                ${device.load !== undefined ? `
                    <div class="metric-row">
                        <span>Load:</span>
                        <span>${(device.load * 100).toFixed(1)}%</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        container.appendChild(card);
    });
}

function showDeviceDetails(device) {
    if (!firewallCompromised && !scadaAccessGranted && !firewallAuthenticated) {
        showNotification('Access denied. Login to firewall first.', 'error');
        return;
    }
    
    currentDevice = device;
    const modal = document.getElementById('device-modal');
    const content = document.getElementById('device-modal-content');
    
    content.innerHTML = `
        <h2>${device.name}</h2>
        <div class="device-info">
            <div class="info-item">
                <strong>Type:</strong> ${device.type}
            </div>
            <div class="info-item">
                <strong>Status:</strong> <span style="color: ${device.status === 'online' ? '#00ff88' : '#ff4444'}">${device.status.toUpperCase()}</span>
            </div>
            ${device.voltage !== undefined ? `
                <div class="info-item">
                    <strong>Voltage:</strong> ${device.voltage.toFixed(1)}V
                </div>
            ` : ''}
            ${device.load !== undefined ? `
                <div class="info-item">
                    <strong>Load:</strong> ${(device.load * 100).toFixed(1)}%
                </div>
            ` : ''}
            ${device.temperature !== undefined ? `
                <div class="info-item">
                    <strong>Temperature:</strong> ${device.temperature.toFixed(1)}°C
                </div>
            ` : ''}
        </div>
        
        <h3 style="margin-top: 2rem; color: #00d4ff;">Vulnerabilities</h3>
        <div class="vulnerabilities-list">
            ${device.vulnerabilities.map(v => `<span class="vulnerability-item">${v}</span>`).join('')}
        </div>
        
        ${device.credentials ? `
            <h3 style="margin-top: 2rem; color: #00d4ff;">Credentials</h3>
            <div class="info-item">
                <strong>Username:</strong> ${device.credentials.username}<br>
                <strong>Password:</strong> ${device.credentials.password}
            </div>
        ` : ''}
        
        <h3 style="margin-top: 2rem; color: #00d4ff;">Control</h3>
        <div class="control-buttons">
            ${device.type === 'power_station' ? `
                <button class="btn btn-danger" onclick="executeCommand('cut_power', {})">Cut Power</button>
            ` : ''}
            <button class="btn btn-secondary" onclick="executeCommand('shutdown', {})">Shutdown</button>
            <button class="btn btn-success" onclick="executeCommand('restart', {})">Restart</button>
            ${device.voltage !== undefined ? `
                <button class="btn btn-secondary" onclick="setVoltage()">Set Voltage</button>
            ` : ''}
            ${device.load !== undefined ? `
                <button class="btn btn-secondary" onclick="setLoad()">Set Load</button>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeDeviceModal() {
    document.getElementById('device-modal').style.display = 'none';
    currentDevice = null;
}

async function executeCommand(command, parameters) {
    if (!currentDevice) return;
    
    if (!scadaAccessGranted && !firewallCompromised && !firewallAuthenticated) {
        showNotification('Access denied. Login to firewall first.', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/scada/command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                device_id: currentDevice.id,
                command: command,
                parameters: parameters
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showNotification(result.message, 'success');
            closeDeviceModal();
            loadSCADAStatus();
        } else if (result.status === 'blocked') {
            showNotification(result.message, 'error');
        } else {
            showNotification('Command failed', 'error');
        }
    } catch (error) {
        console.error('Error executing command:', error);
        showNotification('Error executing command', 'error');
    }
}

function setVoltage() {
    const voltage = prompt('Enter voltage (V):', currentDevice.voltage || 230);
    if (voltage !== null) {
        executeCommand('set_voltage', { voltage: parseFloat(voltage) });
    }
}

function setLoad() {
    const load = prompt('Enter load (0-100%):', (currentDevice.load * 100) || 50);
    if (load !== null) {
        executeCommand('set_load', { load: parseFloat(load) / 100 });
    }
}

// SCADA exploit functionality removed - use real tools for penetration testing

// Map Functions
let map = null;
let markers = {};
let powerLines = [];

async function loadMap() {
    try {
        const response = await fetch('/api/map');
        const data = await response.json();
        
        displayMap(data.stations, data.connections);
    } catch (error) {
        console.error('Error loading map:', error);
    }
}

function displayMap(stations, connections) {
    // Initialize Leaflet map if not already initialized
    if (!map) {
        // Center on Jammu & Kashmir region (between Jammu, Srinagar, and Pathankot)
        map = L.map('network-map').setView([32.7266, 74.8570], 9);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            minZoom: 6
        }).addTo(map);
    }
    
    // Clear existing markers and power lines
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    powerLines.forEach(line => map.removeLayer(line));
    markers = {};
    powerLines = [];
    
    // Draw connections (power grid and military)
    connections.forEach(conn => {
        const fromStation = stations.find(s => s.id === conn.from);
        const toStation = stations.find(s => s.id === conn.to);
        
        if (fromStation && toStation && fromStation.location && toStation.location) {
            // Check if devices have lat/lon
            if (fromStation.location.lat && toStation.location.lat) {
                // Different styles for different connection types
                let lineColor, lineWeight, lineDash, lineOpacity, lineLabel;
                
                if (conn.type === 'military_connection') {
                    // Military connections - Bold Blue
                    lineColor = '#0066ff';
                    lineWeight = 6;
                    lineDash = '15, 10';
                    lineOpacity = 0.9;
                    lineLabel = 'Military SCADA Connection';
                } else if (conn.type === 'network_connection') {
                    // Network connections - Green
                    lineColor = '#00ff88';
                    lineWeight = 4;
                    lineDash = '8, 4';
                    lineOpacity = 0.7;
                    lineLabel = 'Network Connection';
                } else {
                    // Power grid lines - Bright Yellow (easier to see)
                    lineColor = '#ffdd00';
                    lineWeight = 5;
                    lineDash = '12, 6';
                    lineOpacity = 0.9;
                    lineLabel = 'Power Grid Line';
                }
                
                const powerLine = L.polyline([
                    [fromStation.location.lat, fromStation.location.lon],
                    [toStation.location.lat, toStation.location.lon]
                ], {
                    color: lineColor,
                    weight: lineWeight,
                    opacity: lineOpacity,
                    dashArray: lineDash
                }).addTo(map);
                
                powerLine.bindPopup(`<b>${lineLabel}</b><br>From: ${fromStation.name}<br>To: ${toStation.name}`);
                powerLines.push(powerLine);
            }
        }
    });
    
    // Add device markers to the map
    stations.forEach(station => {
        if (!station.location || !station.location.lat || !station.location.lon) return;
        
        // Create custom icon based on device type and status
        const iconColor = station.status === 'online' ? '#34a853' : '#ea4335';
        let iconSymbol;
        
        // Military equipment icons
        // Use real images for icons - larger size for projector visibility
        let iconImage = '/static/images/power_station.jpg';
        let iconSize = [80, 80];  // Increased size for projector
        
        if (station.type === 'S400') {
            iconImage = '/static/images/s400.jpg';
            iconSize = [100, 100];  // Larger military equipment icons
        } else if (station.type === 'DRONE') {
            iconImage = '/static/images/drone.jpg';
            iconSize = [100, 100];
        } else if (station.type === 'AUTONOMOUS') {
            iconImage = '/static/images/autonomous.jpg';
            iconSize = [100, 100];
        } else if (station.type === 'RADAR') {
            iconImage = '/static/images/radar.jpg';
            iconSize = [100, 100];
        } else if (station.type === 'MISSILE') {
            iconImage = '/static/images/brahmos.jpg';
            iconSize = [100, 100];
        } else if (station.type === 'PLC') {
            iconImage = '/static/images/plc.jpg';
            iconSize = [70, 70];  // Increased industrial equipment
        } else if (station.type === 'RTU') {
            iconImage = '/static/images/rtu.jpg';
            iconSize = [70, 70];
        }
        
        const customIcon = L.icon({
            iconUrl: iconImage,
            iconSize: iconSize,
            iconAnchor: [iconSize[0]/2, iconSize[1]/2],
            popupAnchor: [0, -iconSize[1]/2],
            className: 'military-equipment-icon'
        });
        
        const marker = L.marker([station.location.lat, station.location.lon], {
            icon: customIcon
        }).addTo(map);
        
        // Add popup with device information
        let popupContent = `
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #00d4ff;">${station.name}</h3>
                <p style="margin: 5px 0;"><b>Type:</b> ${station.type}</p>
                <p style="margin: 5px 0;"><b>Status:</b> <span style="color: ${station.status === 'online' ? '#34a853' : '#ea4335'}">${station.status.toUpperCase()}</span></p>
                ${station.city ? `<p style="margin: 5px 0;"><b>Location:</b> ${station.city}</p>` : ''}`;
        
        // Add military-specific metrics
        if (['S400', 'DRONE', 'AUTONOMOUS', 'RADAR', 'MISSILE'].includes(station.type)) {
            popupContent += `
                ${station.power_status ? `<p style="margin: 5px 0;"><b>Power Status:</b> ${station.power_status}</p>` : ''}
                ${station.readiness ? `<p style="margin: 5px 0;"><b>Readiness:</b> ${(station.readiness * 100).toFixed(1)}%</p>` : ''}
                <p style="margin: 5px 0; color: #ff4444;"><b>⚠️ CRITICAL MILITARY ASSET</b></p>`;
        } else {
            // Regular SCADA metrics
            popupContent += `
                ${station.metrics && station.metrics.voltage ? `<p style="margin: 5px 0;"><b>Voltage:</b> ${station.metrics.voltage.toFixed(1)}V</p>` : ''}
                ${station.metrics && station.metrics.load ? `<p style="margin: 5px 0;"><b>Load:</b> ${(station.metrics.load * 100).toFixed(1)}%</p>` : ''}`;
        }
        
        popupContent += `
                <button onclick="showDeviceDetailsFromMap({id: '${station.id}'})" style="
                    margin-top: 10px;
                    padding: 8px 16px;
                    background: #00d4ff;
                    border: none;
                    border-radius: 4px;
                    color: #000;
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                ">View Details</button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        markers[station.id] = marker;
    });
}

function showDeviceDetailsFromMap(station) {
    // Load full device details from API
    fetch(`/api/devices/${station.id}`)
        .then(response => response.json())
        .then(device => {
            // Use the existing showDeviceDetails function from main.js
            if (typeof showDeviceDetails === 'function') {
                showDeviceDetails(device);
            } else {
                // Fallback - open in new window or modal
                alert(`Device: ${device.name}\nType: ${device.type}\nStatus: ${device.status}`);
            }
        })
        .catch(error => {
            console.error('Error loading device:', error);
            alert(`Device: ${station.name}\nType: ${station.type}\nStatus: ${station.status}`);
        });
}

function getDeviceIcon(type) {
    const icons = {
        'FIREWALL': '🛡️',
        'SWITCH': '🔀',
        'PLC': '⚙️',
        'RTU': '📡',
        'HMI': '🖥️',
        'SCADA_SERVER': '🖥️',
        'power_station': '⚡'
    };
    return icons[type] || '🔧';
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Simple notification - can be enhanced with a proper toast library
    alert(`${type.toUpperCase()}: ${message}`);
}

async function updateStatus() {
    // Periodically update status
    if (document.getElementById('firewall-panel').classList.contains('active')) {
        loadFirewallStatus();
    }
    if (document.getElementById('scada-panel').classList.contains('active')) {
        loadSCADAStatus();
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const ruleModal = document.getElementById('rule-modal');
    const deviceModal = document.getElementById('device-modal');
    
    if (event.target === ruleModal) {
        closeRuleModal();
    }
    if (event.target === deviceModal) {
        closeDeviceModal();
    }
}

