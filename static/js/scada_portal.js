// SCADA Portal JavaScript

let currentDevice = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSCADAStatus();
    setInterval(loadSCADAStatus, 5000); // Update every 5 seconds
});

// SCADA Functions
async function loadSCADAStatus() {
    try {
        const [statusResponse, devicesResponse] = await Promise.all([
            fetch('/api/scada/status'),
            fetch('/api/scada/devices')
        ]);
        
        if (!statusResponse.ok || !devicesResponse.ok) {
            if (statusResponse.status === 403 || devicesResponse.status === 403) {
                alert('Access denied. Please add a firewall rule to allow access to SCADA portal.');
                window.location.href = '/#firewall';
                return;
            }
        }
        
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
            alert(result.message);
            closeDeviceModal();
            loadSCADAStatus();
        } else if (result.status === 'blocked') {
            alert(result.message);
        } else {
            alert('Command failed');
        }
    } catch (error) {
        console.error('Error executing command:', error);
        alert('Error executing command');
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

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('device-modal');
    if (event.target === modal) {
        closeDeviceModal();
    }
}

