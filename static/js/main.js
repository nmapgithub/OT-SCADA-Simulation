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

// Convert military device names to power grid station names
function convertToPowerStationName(device) {
    const deviceName = device.name || '';
    const deviceType = device.type || '';
    const city = device.city || '';
    
    // Convert military device types to power grid stations
    if (['S400', 'DRONE', 'AUTONOMOUS', 'RADAR', 'MISSILE'].includes(deviceType)) {
        // Use city information if available
        if (city) {
            if (city.includes('Jammu')) {
                return 'Jammu Power Grid Station';
            } else if (city.includes('Srinagar')) {
                return 'Srinagar Power Grid Station';
            } else if (city.includes('Pathankot')) {
                return 'Pathankot Power Grid Station';
            }
        }
        
        // Fallback to name-based conversion
        if (deviceName.includes('Alpha')) {
            return 'Power Grid Station Alpha';
        } else if (deviceName.includes('Bravo')) {
            return 'Power Grid Station Bravo';
        } else if (deviceName.includes('Jammu')) {
            return 'Jammu Power Grid Station';
        } else if (deviceName.includes('Srinagar')) {
            return 'Srinagar Power Grid Station';
        } else if (deviceName.includes('Pathankot')) {
            return 'Pathankot Power Grid Station';
        } else {
            return 'Power Grid Station';
        }
    }
    return deviceName;
}

function displaySCADADevices(devices) {
    const container = document.getElementById('scada-devices');
    container.innerHTML = '';
    
    devices.forEach(device => {
        const card = document.createElement('div');
        card.className = 'device-card';
        card.onclick = () => showDeviceDetails(device);
        
        // Convert device name for display
        const displayName = convertToPowerStationName(device);
        const displayType = ['S400', 'DRONE', 'AUTONOMOUS', 'RADAR', 'MISSILE'].includes(device.type) ? 'POWER_STATION' : device.type;
        
        card.innerHTML = `
            <h4>${displayName}</h4>
            <div class="device-type">${displayType}</div>
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
    
    // Convert device name and type for display
    const displayName = convertToPowerStationName(device);
    const displayType = ['S400', 'DRONE', 'AUTONOMOUS', 'RADAR', 'MISSILE'].includes(device.type) ? 'POWER_STATION' : device.type;
    
    content.innerHTML = `
        <h2>${displayName}</h2>
        <div class="device-info">
            <div class="info-item">
                <strong>Type:</strong> ${displayType}
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
let gridRadiusCircle = null;
let droneRadiusCircles = [];
let s400CoverageCircles = [];
let radarCoverageCircles = [];
let missileRangeCircles = [];
let securityZones = [];
let threatIndicators = [];
let borderLines = [];
let operationalZones = [];
let layerGroups = {
    power: null,
    military: null,
    network: null,
    zones: null
};
let onlineTileLayer = null;
let offlineTileLayer = null;
let usingOfflineTiles = false;
let tileLayerEventsBound = false;
let offlineNotificationShown = false;

async function loadMap() {
    try {
        const response = await fetch('/api/map');
        const data = await response.json();
        
        displayMap(data.stations, data.connections);
    } catch (error) {
        console.error('Error loading map:', error);
    }
}

function initializeTileLayers() {
    if (onlineTileLayer || offlineTileLayer) {
        return;
    }

    onlineTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 6,
        updateWhenIdle: true,
        detectRetina: true
    });

    offlineTileLayer = L.tileLayer('/tiles/{z}/{x}/{y}.png', {
        attribution: 'Offline Map Tiles',
        maxZoom: 19,
        maxNativeZoom: 10,
        minZoom: 6,
        tileSize: 256,
        updateWhenIdle: true,
        keepBuffer: 8,
        detectRetina: false,
        noWrap: true
    });

    onlineTileLayer.on('tileerror', () => {
        if (!usingOfflineTiles) {
            console.warn('OpenStreetMap tile load failed. Switching to offline tiles.');
            useOfflineTiles('tileerror');
        }
    });
}

function useOnlineTiles() {
    if (!map || !onlineTileLayer) {
        return;
    }

    if (!navigator.onLine) {
        useOfflineTiles('navigator-offline');
        return;
    }

    if (offlineTileLayer && map.hasLayer(offlineTileLayer)) {
        map.removeLayer(offlineTileLayer);
    }

    if (!map.hasLayer(onlineTileLayer)) {
        onlineTileLayer.addTo(map);
    }

    if (usingOfflineTiles) {
        console.info('Reconnected. Restoring online OpenStreetMap tiles.');
        if (typeof showNotification === 'function') {
            showNotification('Reconnected. Using live OpenStreetMap tiles.', 'success');
        }
    }

    usingOfflineTiles = false;
    offlineNotificationShown = false;
}

function useOfflineTiles(reason = '') {
    if (!map || !offlineTileLayer) {
        return;
    }

    if (onlineTileLayer && map.hasLayer(onlineTileLayer)) {
        map.removeLayer(onlineTileLayer);
    }

    if (!map.hasLayer(offlineTileLayer)) {
        offlineTileLayer.addTo(map);
    }

    if (!usingOfflineTiles) {
        const reasonSuffix = reason ? ` (${reason})` : '';
        console.warn(`Using offline map tiles${reasonSuffix}.`);
        if (typeof showNotification === 'function' && !offlineNotificationShown) {
            showNotification('Using offline basemap tiles (no internet connection).', 'warning');
            offlineNotificationShown = true;
        }
    }

    usingOfflineTiles = true;
}

function setupTileLayers() {
    if (!map) {
        return;
    }

    initializeTileLayers();

    if (!tileLayerEventsBound) {
        window.addEventListener('online', () => useOnlineTiles());
        window.addEventListener('offline', () => useOfflineTiles('navigator-offline'));
        tileLayerEventsBound = true;
    }

    if (navigator.onLine) {
        useOnlineTiles();

        setTimeout(() => {
            if (!map || !onlineTileLayer || usingOfflineTiles) {
                return;
            }

            const loadedTiles = onlineTileLayer._tiles ? Object.keys(onlineTileLayer._tiles).length : 0;
            if (loadedTiles === 0) {
                useOfflineTiles('online-timeout');
            }
        }, 4000);
    } else {
        useOfflineTiles('navigator-offline');
    }
}

function displayMap(stations, connections) {
    // Initialize Leaflet map if not already initialized
    if (!map) {
        // Center on Jammu & Kashmir region (between Jammu, Srinagar, and Pathankot)
        map = L.map('network-map').setView([32.7266, 74.8570], 9);
    }
    
    // Ensure tile layers are configured (with offline fallback)
    setupTileLayers();
    
    // Clear existing markers, power lines, and all overlays
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    powerLines.forEach(line => map.removeLayer(line));
    if (gridRadiusCircle) {
        map.removeLayer(gridRadiusCircle);
        gridRadiusCircle = null;
    }
    droneRadiusCircles.forEach(circle => map.removeLayer(circle));
    s400CoverageCircles.forEach(circle => map.removeLayer(circle));
    radarCoverageCircles.forEach(circle => map.removeLayer(circle));
    missileRangeCircles.forEach(circle => map.removeLayer(circle));
    securityZones.forEach(zone => map.removeLayer(zone));
    threatIndicators.forEach(indicator => map.removeLayer(indicator));
    borderLines.forEach(line => map.removeLayer(line));
    operationalZones.forEach(zone => map.removeLayer(zone));
    droneRadiusCircles = [];
    s400CoverageCircles = [];
    radarCoverageCircles = [];
    missileRangeCircles = [];
    securityZones = [];
    threatIndicators = [];
    borderLines = [];
    operationalZones = [];
    markers = {};
    powerLines = [];
    
    // Add grid radius circle overlay covering Jammu & Kashmir region
    // Center: Jammu region (32.7266, 74.8570)
    // Radius: ~120 km to cover all stations including missile systems
    const gridCenter = [32.7266, 74.8570];
    const gridRadiusMeters = 120000; // 120 km in meters
    
    gridRadiusCircle = L.circle(gridCenter, {
        radius: gridRadiusMeters,
        color: '#ff4444',
        fillColor: '#ff4444',
        fillOpacity: 0.15,
        weight: 3,
        dashArray: '10, 5',
        opacity: 0.8
    }).addTo(map);
    
    // Add popup to grid radius circle
    gridRadiusCircle.bindPopup(`
        <div style="min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: #ff4444;">Network Grid Coverage Area</h3>
            <p style="margin: 5px 0;"><b>Radius:</b> 120 km</p>
            <p style="margin: 5px 0;"><b>Coverage:</b> Jammu & Kashmir Region</p>
            <p style="margin: 5px 0;"><b>Includes:</b> Power Grid Stations</p>
            <p style="margin: 5px 0; color: #ff4444;"><b>⚠️ CRITICAL INFRASTRUCTURE ZONE</b></p>
        </div>
    `);
    
    // Add drone activity radius circles (military-style)
    const droneStations = stations.filter(s => s.type === 'DRONE' && s.location && s.location.lat);
    droneStations.forEach(drone => {
        // Military-style radius circle for drone activity zone
        // Radius: 50 km operational range
        const droneRadiusMeters = 50000; // 50 km in meters
        
        const droneCircle = L.circle([drone.location.lat, drone.location.lon], {
            radius: droneRadiusMeters,
            color: '#0066ff', // Military blue
            fillColor: '#0066ff',
            fillOpacity: 0.1, // Very light fill
            weight: 2,
            dashArray: '20, 10, 5, 10', // Military-style dashed pattern
            opacity: 0.9,
            className: 'drone-activity-zone'
        }).addTo(map);
        
        // Add military-style popup
        droneCircle.bindPopup(`
            <div style="min-width: 220px;">
                <h3 style="margin: 0 0 10px 0; color: #0066ff;">🚁 Drone Activity Zone</h3>
                <p style="margin: 5px 0;"><b>Drone:</b> ${drone.name}</p>
                <p style="margin: 5px 0;"><b>Operational Radius:</b> 50 km</p>
                <p style="margin: 5px 0;"><b>Status:</b> <span style="color: ${drone.status === 'online' ? '#34a853' : '#ea4335'}">${drone.status.toUpperCase()}</span></p>
                <p style="margin: 5px 0;"><b>Type:</b> ${drone.city || 'Military Air Base'}</p>
                <p style="margin: 5px 0; color: #0066ff;"><b>⚠️ ACTIVE SURVEILLANCE ZONE</b></p>
                <p style="margin: 5px 0; color: #ff8800;"><b>⚠️ RESTRICTED AIRSPACE</b></p>
            </div>
        `);
        
        droneRadiusCircles.push(droneCircle);
    });
    
    // 1. MILITARY DEFENSE ZONES
    // S-400 Air Defense Coverage Zones (400km radius)
    const s400Stations = stations.filter(s => s.type === 'S400' && s.location && s.location.lat);
    s400Stations.forEach(s400 => {
        const s400Circle = L.circle([s400.location.lat, s400.location.lon], {
            radius: 400000, // 400 km
            color: '#ff00ff', // Magenta for air defense
            fillColor: '#ff00ff',
            fillOpacity: 0.08,
            weight: 3,
            dashArray: '25, 15, 5, 15',
            opacity: 0.9
        }).addTo(map);
        s400Circle.bindPopup(`
            <div style="min-width: 220px;">
                <h3 style="margin: 0 0 10px 0; color: #ff00ff;">🛡️ S-400 Air Defense Zone</h3>
                <p style="margin: 5px 0;"><b>System:</b> ${s400.name}</p>
                <p style="margin: 5px 0;"><b>Coverage Radius:</b> 400 km</p>
                <p style="margin: 5px 0; color: #ff00ff;"><b>⚠️ AIR DEFENSE COVERAGE</b></p>
            </div>
        `);
        s400CoverageCircles.push(s400Circle);
    });
    
    // Radar Coverage Zones (200km radius)
    const radarStations = stations.filter(s => s.type === 'RADAR' && s.location && s.location.lat);
    radarStations.forEach(radar => {
        const radarCircle = L.circle([radar.location.lat, radar.location.lon], {
            radius: 200000, // 200 km
            color: '#00ffff', // Cyan for radar
            fillColor: '#00ffff',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '15, 10, 3, 10',
            opacity: 0.85
        }).addTo(map);
        radarCircle.bindPopup(`
            <div style="min-width: 220px;">
                <h3 style="margin: 0 0 10px 0; color: #00ffff;">📡 Radar Coverage Zone</h3>
                <p style="margin: 5px 0;"><b>System:</b> ${radar.name}</p>
                <p style="margin: 5px 0;"><b>Coverage Radius:</b> 200 km</p>
                <p style="margin: 5px 0; color: #00ffff;"><b>⚠️ ACTIVE RADAR SURVEILLANCE</b></p>
            </div>
        `);
        radarCoverageCircles.push(radarCircle);
    });
    
    // Missile System Range Circles (300km radius)
    const missileStations = stations.filter(s => s.type === 'MISSILE' && s.location && s.location.lat);
    missileStations.forEach(missile => {
        const missileCircle = L.circle([missile.location.lat, missile.location.lon], {
            radius: 300000, // 300 km
            color: '#ff6600', // Orange for missile range
            fillColor: '#ff6600',
            fillOpacity: 0.12,
            weight: 3,
            dashArray: '20, 10, 5, 10',
            opacity: 0.9
        }).addTo(map);
        missileCircle.bindPopup(`
            <div style="min-width: 220px;">
                <h3 style="margin: 0 0 10px 0; color: #ff6600;">🚀 Missile Range Zone</h3>
                <p style="margin: 5px 0;"><b>System:</b> ${missile.name}</p>
                <p style="margin: 5px 0;"><b>Range:</b> 300 km</p>
                <p style="margin: 5px 0; color: #ff6600;"><b>⚠️ MISSILE COVERAGE AREA</b></p>
            </div>
        `);
        missileRangeCircles.push(missileCircle);
    });
    
    // Defense Perimeter Line (India-Pakistan border approximation)
    const borderCoordinates = [
        [32.0, 74.5], [32.2, 74.6], [32.4, 74.7], [32.6, 74.8],
        [32.8, 74.9], [33.0, 75.0], [33.2, 75.1], [33.4, 75.2],
        [33.6, 75.3], [33.8, 75.4], [34.0, 75.5], [34.2, 75.6]
    ];
    const borderLine = L.polyline(borderCoordinates, {
        color: '#ff0000',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 5'
    }).addTo(map);
    borderLine.bindPopup('<b>🇮🇳 Defense Perimeter Line</b><br>India-Pakistan Border Region');
    borderLines.push(borderLine);
    
    // 2. SECURITY ZONES
    // High Security Zones around critical infrastructure
    const criticalStations = stations.filter(s => 
        ['power_station', 'SCADA_SERVER', 'MISSILE', 'S400'].includes(s.type) && s.location && s.location.lat
    );
    criticalStations.forEach(station => {
        const securityZone = L.circle([station.location.lat, station.location.lon], {
            radius: 10000, // 10 km security perimeter
            color: '#ff0000',
            fillColor: '#ff0000',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '5, 5'
        }).addTo(map);
        securityZones.push(securityZone);
    });
    
    // 3. THREAT INDICATORS (simulated)
    const threatLocations = [
        {lat: 32.5, lon: 75.0, type: 'suspicious_activity'},
        {lat: 33.0, lon: 74.8, type: 'network_scan'}
    ];
    threatLocations.forEach(threat => {
        const threatIcon = L.divIcon({
            className: 'threat-indicator',
            html: '<div style="background: #ff0000; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #fff; animation: pulse 2s infinite;"></div>',
            iconSize: [20, 20]
        });
        const threatMarker = L.marker([threat.lat, threat.lon], {icon: threatIcon}).addTo(map);
        threatMarker.bindPopup(`
            <div style="min-width: 200px;">
                <h3 style="color: #ff0000;">⚠️ THREAT DETECTED</h3>
                <p><b>Type:</b> ${threat.type.replace('_', ' ').toUpperCase()}</p>
                <p><b>Status:</b> Under Investigation</p>
            </div>
        `);
        threatIndicators.push(threatMarker);
    });
    
    // 4. OPERATIONAL ZONES
    // Emergency Response Zones
    const emergencyZones = [
        {center: [32.7266, 74.8570], name: 'Jammu Emergency Zone', radius: 25000},
        {center: [34.0837, 74.7973], name: 'Srinagar Emergency Zone', radius: 25000}
    ];
    emergencyZones.forEach(zone => {
        const emergencyZone = L.circle(zone.center, {
            radius: zone.radius,
            color: '#ffff00',
            fillColor: '#ffff00',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '8, 4'
        }).addTo(map);
        emergencyZone.bindPopup(`<b>🚨 ${zone.name}</b><br>Emergency Response Zone`);
        operationalZones.push(emergencyZone);
    });
    
    // Maintenance Zones
    const maintenanceZones = [
        {center: [32.2643, 75.6421], name: 'Pathankot Maintenance Zone', radius: 15000}
    ];
    maintenanceZones.forEach(zone => {
        const maintZone = L.circle(zone.center, {
            radius: zone.radius,
            color: '#ff8800',
            fillColor: '#ff8800',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '6, 6'
        }).addTo(map);
        maintZone.bindPopup(`<b>🔧 ${zone.name}</b><br>Scheduled Maintenance`);
        operationalZones.push(maintZone);
    });
    
    // 5. DATA VISUALIZATION - Network Traffic Flow (animated arrows)
    // Add animated connection indicators for active connections
    connections.forEach(conn => {
        const fromStation = stations.find(s => s.id === conn.from);
        const toStation = stations.find(s => s.id === conn.to);
        
        if (fromStation && toStation && fromStation.location && toStation.location && 
            fromStation.location.lat && toStation.location.lat) {
            // Add midpoint marker for traffic flow visualization
            const midLat = (fromStation.location.lat + toStation.location.lat) / 2;
            const midLon = (fromStation.location.lon + toStation.location.lon) / 2;
            
            if (conn.type === 'military_connection' || conn.type === 'network_connection') {
                const trafficIcon = L.divIcon({
                    className: 'traffic-indicator',
                    html: `<div style="
                        background: ${conn.type === 'military_connection' ? '#0066ff' : '#00ff88'};
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        border: 2px solid #fff;
                        animation: pulse 1.5s infinite;
                        box-shadow: 0 0 10px ${conn.type === 'military_connection' ? '#0066ff' : '#00ff88'};
                    "></div>`,
                    iconSize: [12, 12]
                });
                const trafficMarker = L.marker([midLat, midLon], {icon: trafficIcon}).addTo(map);
                trafficMarker.bindPopup(`<b>📡 Active Connection</b><br>${fromStation.name} ↔ ${toStation.name}`);
            }
        }
    });
    
    // 6. DATA VISUALIZATION - Device Health Status Overlay
    // Add health status indicators based on device metrics
    stations.forEach(station => {
        if (!station.location || !station.location.lat) return;
        
        // Calculate health score (simplified)
        let healthScore = 100;
        if (station.status === 'offline') healthScore = 0;
        else if (station.metrics) {
            if (station.metrics.load > 0.9) healthScore -= 20;
            if (station.metrics.voltage && (station.metrics.voltage < 200 || station.metrics.voltage > 250)) healthScore -= 15;
        }
        
        // Add health indicator circle
        if (healthScore < 70) {
            const healthIndicator = L.circle([station.location.lat, station.location.lon], {
                radius: 5000, // 5 km
                color: healthScore < 50 ? '#ff0000' : '#ff8800',
                fillColor: healthScore < 50 ? '#ff0000' : '#ff8800',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '3, 3'
            }).addTo(map);
            healthIndicator.bindPopup(`
                <div style="min-width: 180px;">
                    <h3 style="color: ${healthScore < 50 ? '#ff0000' : '#ff8800'};">⚠️ Health Alert</h3>
                    <p><b>Device:</b> ${station.name}</p>
                    <p><b>Health Score:</b> ${healthScore}%</p>
                    <p><b>Status:</b> ${healthScore < 50 ? 'CRITICAL' : 'WARNING'}</p>
                </div>
            `);
        }
    });
    
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
        
        // Power grid station icons - all stations use power station icon
        // Use real images for icons - larger size for projector visibility
        let iconImage = '/static/images/power_station.jpg';
        let iconSize = [80, 80];  // Increased size for projector
        
        // All stations (including former military equipment) now use power station icon
        if (station.type === 'PLC') {
            iconImage = '/static/images/plc.jpg';
            iconSize = [70, 70];  // Increased industrial equipment
        } else if (station.type === 'RTU') {
            iconImage = '/static/images/rtu.jpg';
            iconSize = [70, 70];
        }
        // All other types (S400, DRONE, AUTONOMOUS, RADAR, MISSILE, and regular power stations) use power_station.jpg
        
        const customIcon = L.icon({
            iconUrl: iconImage,
            iconSize: iconSize,
            iconAnchor: [iconSize[0]/2, iconSize[1]/2],
            popupAnchor: [0, -iconSize[1]/2],
            className: 'power-station-icon'
        });
        
        // Add real-time status indicator (pulsing effect for online devices)
        let markerElement;
        if (station.status === 'online') {
            // Create pulsing status indicator
            const statusIndicator = L.divIcon({
                className: 'status-indicator-pulse',
                html: `<div class="pulse-ring" style="
                    position: absolute;
                    width: 30px;
                    height: 30px;
                    border: 3px solid ${station.type === 'MISSILE' || station.type === 'S400' ? '#ff0000' : '#00ff00'};
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                    top: -15px;
                    left: -15px;
                "></div>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0]
            });
            markerElement = L.marker([station.location.lat, station.location.lon], {
                icon: customIcon
            }).addTo(map);
            // Add pulsing indicator
            L.marker([station.location.lat, station.location.lon], {
                icon: statusIndicator,
                zIndexOffset: -1000
            }).addTo(map);
        } else {
            markerElement = L.marker([station.location.lat, station.location.lon], {
                icon: customIcon
            }).addTo(map);
        }
        
        const marker = markerElement;
        
        // Add popup with device information
        let popupContent = `
            <div style="min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #00d4ff;">${station.name}</h3>
                <p style="margin: 5px 0;"><b>Type:</b> ${station.type}</p>
                <p style="margin: 5px 0;"><b>Status:</b> <span style="color: ${station.status === 'online' ? '#34a853' : '#ea4335'}">${station.status.toUpperCase()}</span></p>
                ${station.city ? `<p style="margin: 5px 0;"><b>Location:</b> ${station.city}</p>` : ''}`;
        
        // Add power grid station metrics
        if (['S400', 'DRONE', 'AUTONOMOUS', 'RADAR', 'MISSILE'].includes(station.type)) {
            // Show power station metrics for all types
            popupContent += `
                <p style="margin: 5px 0; color: #00d4ff;"><b>⚡ POWER GRID STATION</b></p>
                ${station.power_status ? `<p style="margin: 5px 0;"><b>Power Status:</b> ${station.power_status}</p>` : ''}
                ${station.readiness ? `<p style="margin: 5px 0;"><b>Operational Status:</b> ${(station.readiness * 100).toFixed(1)}%</p>` : ''}
                <p style="margin: 5px 0; color: #ff8800;"><b>⚠️ CRITICAL INFRASTRUCTURE</b></p>
                <p style="margin: 5px 0; color: #ff8800;"><b>⚠️ WITHIN GRID RADIUS COVERAGE</b></p>`;
        } else {
            // Regular SCADA metrics
            popupContent += `
                <p style="margin: 5px 0; color: #00d4ff;"><b>⚡ POWER GRID STATION</b></p>
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

function toggleGridRadius() {
    const toggle = document.getElementById('grid-radius-toggle');
    if (gridRadiusCircle) {
        if (toggle.checked) {
            map.addLayer(gridRadiusCircle);
        } else {
            map.removeLayer(gridRadiusCircle);
        }
    }
}

function toggleDroneRadius() {
    const toggle = document.getElementById('drone-radius-toggle');
    droneRadiusCircles.forEach(circle => {
        if (toggle.checked) {
            map.addLayer(circle);
        } else {
            map.removeLayer(circle);
        }
    });
}

function toggleS400Coverage() {
    const toggle = document.getElementById('s400-coverage-toggle');
    s400CoverageCircles.forEach(circle => {
        if (toggle.checked) {
            map.addLayer(circle);
        } else {
            map.removeLayer(circle);
        }
    });
}

function toggleRadarCoverage() {
    const toggle = document.getElementById('radar-coverage-toggle');
    radarCoverageCircles.forEach(circle => {
        if (toggle.checked) {
            map.addLayer(circle);
        } else {
            map.removeLayer(circle);
        }
    });
}

function toggleMissileRange() {
    const toggle = document.getElementById('missile-range-toggle');
    missileRangeCircles.forEach(circle => {
        if (toggle.checked) {
            map.addLayer(circle);
        } else {
            map.removeLayer(circle);
        }
    });
}

function toggleSecurityZones() {
    const toggle = document.getElementById('security-zones-toggle');
    securityZones.forEach(zone => {
        if (toggle.checked) {
            map.addLayer(zone);
        } else {
            map.removeLayer(zone);
        }
    });
}

function toggleThreatIndicators() {
    const toggle = document.getElementById('threat-indicators-toggle');
    threatIndicators.forEach(indicator => {
        if (toggle.checked) {
            map.addLayer(indicator);
        } else {
            map.removeLayer(indicator);
        }
    });
}

function toggleBorderLines() {
    const toggle = document.getElementById('border-lines-toggle');
    borderLines.forEach(line => {
        if (toggle.checked) {
            map.addLayer(line);
        } else {
            map.removeLayer(line);
        }
    });
}

function toggleOperationalZones() {
    const toggle = document.getElementById('operational-zones-toggle');
    operationalZones.forEach(zone => {
        if (toggle.checked) {
            map.addLayer(zone);
        } else {
            map.removeLayer(zone);
        }
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

