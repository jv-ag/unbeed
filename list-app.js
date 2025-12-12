/**
 * Unbeed - List View Application
 */

// State
let currentFilter = 'all';
let currentGroupBy = 'crop';
let currentSortBy = 'rate';
let selectedPayType = 'piece';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Listen for updates
    window.addEventListener('unbeed-data-updated', () => {
        renderRates();
    });

    // Auth State
    authService.onAuthStateChanged((user) => {
        // Update UI if needed (e.g., show login/logout buttons)
    });

    checkGate(); // Gate check first
    // Default filter
    applySmartFilter('all');
});

// Town Coordinates (Mock for MVP)
const townCoords = {
    'Mildura': { lat: -34.208, lng: 142.124 },
    'Robinvale': { lat: -34.583, lng: 142.766 },
    'Red Cliffs': { lat: -34.307, lng: 142.031 },
    'Renmark': { lat: -34.174, lng: 140.744 },
    'Griffith': { lat: -34.283, lng: 146.045 },
    'Loxton': { lat: -34.453, lng: 140.566 },
    'Waikerie': { lat: -34.172, lng: 139.985 }
};

let userLocation = null;

// Smart Filter Logic
function applySmartFilter(intent) {
    // 1. Visual State
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(intent));
    });

    // 2. Logic configuration
    switch (intent) {
        case 'best':
            currentSortBy = 'rate';
            currentFilter = 'piece';
            currentGroupBy = 'crop';
            break;
        case 'nearest':
            // Try to get location
            if (!userLocation) {
                getUserLocation(() => {
                    // Success callback
                    currentSortBy = 'distance';
                    currentFilter = 'all';
                    currentGroupBy = 'town';
                    renderRates();
                });
                return; // Wait for location
            }
            currentSortBy = 'distance';
            currentFilter = 'all';
            currentGroupBy = 'town';
            break;
        case 'hourly':
            currentSortBy = 'rate';
            currentFilter = 'hourly';
            currentGroupBy = 'town';
            break;
        case 'grapes':
            currentSortBy = 'fresh';
            currentFilter = 'all';
            currentGroupBy = 'crop';
            break;
        case 'citrus':
            currentSortBy = 'fresh';
            currentFilter = 'all';
            currentGroupBy = 'crop';
            break;
        case 'all':
        default:
            currentSortBy = 'fresh';
            currentFilter = 'all';
            currentGroupBy = 'crop';
            break;
    }

    // 3. Render
    renderRates();
}

// Get User Location
function getUserLocation(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                if (callback) callback();
            },
            (error) => {
                console.log('Location error:', error);
                alert('Could not get your location. Please enable location services.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Calculate distance (Haversine)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Check if user needs to share first
function checkGate() {
    if (hasUserShared()) {
        passGate();
    }
}

// Skip gate (for returning users)
function skipGate() {
    passGate();
}

// Pass through gate
function passGate() {
    document.getElementById('share-gate').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    renderRates();
}

// Rate input for conversion preview
document.getElementById('share-rate')?.addEventListener('input', updateConversionPreview);
document.getElementById('share-unit')?.addEventListener('change', updateConversionPreview);

// Render rates list
function renderRates() {
    const container = document.getElementById('rates-container');
    let rates = dataService.getRates();

    // Filter
    if (currentFilter === 'piece') {
        rates = rates.filter(r => r.payType === 'piece');
    } else if (currentFilter === 'hourly') {
        rates = rates.filter(r => r.payType === 'hourly');
    }

    // Sort
    rates.sort((a, b) => {
        switch (currentSortBy) {
            case 'rate':
                const aRate = a.payType === 'piece' ? (a.ratePerKg || 0) : (a.originalRate || 0);
                const bRate = b.payType === 'piece' ? (b.ratePerKg || 0) : (b.originalRate || 0);
                return bRate - aRate;
            case 'spots':
                return (b.spots || 0) - (a.spots || 0);
            case 'distance':
                if (!userLocation) return 0;
                const distA = townCoords[a.town] ? getDistance(userLocation.lat, userLocation.lng, townCoords[a.town].lat, townCoords[a.town].lng) : 9999;
                const distB = townCoords[b.town] ? getDistance(userLocation.lat, userLocation.lng, townCoords[b.town].lat, townCoords[b.town].lng) : 9999;
                return distA - distB;
            case 'fresh':
            default:
                return new Date(b.reportedAt) - new Date(a.reportedAt);
        }
    });

    // Group
    const grouped = {};
    rates.forEach(rate => {
        const key = currentGroupBy === 'crop' ? rate.crop : rate.town;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(rate);
    });

    // Render
    if (Object.keys(grouped).length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No rates yet</h3>
                <p>Be the first to share a rate!</p>
            </div>
        `;
        return;
    }

    let html = '';

    // Sort groups
    const sortedKeys = Object.keys(grouped).sort();

    sortedKeys.forEach(key => {
        const groupRates = grouped[key];
        const icon = currentGroupBy === 'crop' ? (cropEmojis[key] || '🌱') : '📍';
        const label = currentGroupBy === 'crop' ? capitalize(key) : key;

        html += `<div class="rate-group">`;
        html += `<div class="group-header"><span class="group-icon">${icon}</span> ${label}</div>`;

        groupRates.forEach(rate => {
            html += createRateCard(rate);
        });

        html += `</div>`;
    });

    container.innerHTML = html;
}

// Create rate card HTML
function createRateCard(rate) {
    const isPiece = rate.payType === 'piece';
    const rateDisplay = isPiece
        ? `$${rate.ratePerKg.toFixed(2)}`
        : `$${rate.originalRate.toFixed(2)}`;
    const unitDisplay = isPiece ? '/kg' : '/hr';

    // Show original if converted
    const showOriginal = isPiece && rate.originalUnit !== 'kg';
    const originalDisplay = showOriginal
        ? `Quoted: $${rate.originalRate}/${rate.originalUnit}`
        : '';

    const verified = rate.confirmations >= 2;

    return `
        <div class="rate-card">
            <div class="rate-card-header">
                <div>
                    <div class="rate-main">
                        <span class="rate-value ${rate.payType}">${rateDisplay}</span>
                        <span class="rate-unit">${unitDisplay}</span>
                    </div>
                    ${showOriginal ? `<div class="rate-original">${originalDisplay}</div>` : ''}
                </div>
                <span class="rate-badge ${rate.payType}">${rate.payType}</span>
            </div>
            <div class="rate-card-meta">
                <span>📍 ${rate.town}</span>
                ${rate.spots ? `<span>👥 ${rate.spots} spots</span>` : ''}
                ${rate.transport ? '<span>🚐 Transport</span>' : ''}
                ${rate.contractor ? `<span>🏢 ${rate.contractor}</span>` : ''}
            </div>
            <div class="rate-card-footer">
                <span class="confirmations ${verified ? 'verified' : ''}">
                    ${timeAgo(rate.reportedAt)}
                </span>
                
                <div class="confirmation-area">
                    <div class="witnesses">
                        ${renderWitnesses(rate.confirmations, hasUserConfirmed(rate.id))}
                    </div>
                    ${!hasUserConfirmed(rate.id) ? `
                        <span class="verify-question">?</span>
                        <div class="verify-actions">
                            <button class="verify-btn deny" onclick="event.stopPropagation(); denyRate('${rate.id}')">✗</button>
                            <button class="verify-btn confirm" onclick="event.stopPropagation(); confirmRate('${rate.id}')">✓</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Render witness silhouettes
function renderWitnesses(count, userConfirmed) {
    let html = '';
    const maxShow = 5;
    const toShow = Math.min(count, maxShow);

    for (let i = 0; i < toShow; i++) {
        const isYou = userConfirmed && i === count - 1;
        html += `<span class="witness ${isYou ? 'you' : ''}">👤</span>`;
    }

    if (count > maxShow) {
        html += `<span class="witness-more">+${count - maxShow}</span>`;
    }

    return html;
}

// Deny rate (future: track for data quality)
function denyRate(reportId) {
    // For now, just log - could track denials in future
    console.log('User denies rate:', reportId);
    // Optional: show feedback
}

// Show share form modal
function showShareForm() {
    document.getElementById('share-modal').classList.remove('hidden');
    document.getElementById('share-form').reset();
    setPayType('piece');

    // Auto-unlock gate for THIS session just by opening share (User Friendly)
    // In a real app, we'd wait for successful submit.
    // access is implied if they are contributing.
}

// Close share modal
function closeShareModal() {
    document.getElementById('share-modal').classList.add('hidden');
}

// Close confirm modal
function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.add('hidden');
    passGate();
    renderRates();
}

// Set pay type
function setPayType(type) {
    selectedPayType = type;
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.pay === type);
    });

    document.getElementById('piece-rate-fields').classList.toggle('hidden', type !== 'piece');
    document.getElementById('hourly-rate-fields').classList.toggle('hidden', type !== 'hourly');

    // Update required fields
    document.getElementById('share-rate').required = type === 'piece';
    document.getElementById('share-unit').required = type === 'piece';
    document.getElementById('share-hourly').required = type === 'hourly';
}

// Update units based on crop
function updateUnits() {
    const crop = document.getElementById('share-crop').value;
    const unitSelect = document.getElementById('share-unit');

    // Get available units for this crop
    const available = unitConversions[crop] || unitConversions['grapes'];

    // Update options
    unitSelect.innerHTML = Object.keys(available)
        .filter(u => u !== 'hour')
        .map(u => `<option value="${u}">${u}</option>`)
        .join('');

    updateConversionPreview();
}

// Update conversion preview
function updateConversionPreview() {
    const rate = parseFloat(document.getElementById('share-rate').value);
    const unit = document.getElementById('share-unit').value;
    const crop = document.getElementById('share-crop').value;
    const preview = document.getElementById('conversion-preview');
    const converted = document.getElementById('converted-rate');

    if (rate && unit && crop && unit !== 'kg') {
        const perKg = convertToKg(rate, unit, crop);
        converted.textContent = '$' + perKg.toFixed(2);
        preview.classList.remove('hidden');
    } else {
        preview.classList.add('hidden');
    }
}

// Submit rate
function submitRate(event) {
    event.preventDefault();

    const crop = document.getElementById('share-crop').value;
    const town = document.getElementById('share-town').value;

    let report;

    if (selectedPayType === 'piece') {
        const rate = parseFloat(document.getElementById('share-rate').value);
        const unit = document.getElementById('share-unit').value;

        report = {
            town,
            crop,
            payType: 'piece',
            rate,
            unit,
            spots: parseInt(document.getElementById('share-spots').value) || null,
            contractor: document.getElementById('share-contractor').value || null,
            transport: document.getElementById('share-transport').checked
        };
    } else {
        const rate = parseFloat(document.getElementById('share-hourly').value);

        report = {
            town,
            crop,
            payType: 'hourly',
            rate,
            unit: 'hour',
            spots: parseInt(document.getElementById('share-spots').value) || null,
            contractor: document.getElementById('share-contractor').value || null,
            transport: document.getElementById('share-transport').checked
        };
    }

    dataService.addRate(report);
    setUserShared();

    closeShareModal();
    document.getElementById('confirm-modal').classList.remove('hidden');
}

// Confirm a rate (with spam protection)
function confirmRate(reportId) {
    // Check if user already confirmed this rate
    const confirmed = getUserConfirmedRates();
    if (confirmed.includes(reportId)) {
        // Already confirmed - could show a message, but silently ignore for now
        return;
    }

    dataService.confirmRate(reportId);

    // Track that user confirmed this rate
    confirmed.push(reportId);
    localStorage.setItem('unbeed_confirmed_rates', JSON.stringify(confirmed));

    renderRates();
}

// Get list of rates this user has confirmed
function getUserConfirmedRates() {
    try {
        return JSON.parse(localStorage.getItem('unbeed_confirmed_rates') || '[]');
    } catch {
        return [];
    }
}

// Check if user can confirm a rate (for UI feedback)
function hasUserConfirmed(reportId) {
    return getUserConfirmedRates().includes(reportId);
}

// Utils
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function hasUserShared() {
    return localStorage.getItem('unbeed_user_shared') === 'true';
}

function setUserShared() {
    localStorage.setItem('unbeed_user_shared', 'true');
}

// Close modals on outside click
document.getElementById('share-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'share-modal') closeShareModal();
});

document.getElementById('confirm-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'confirm-modal') closeConfirmModal();
});

// Escape key closes modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeShareModal();
        closeConfirmModal();
    }
});
