/**
 * Unbeed - Main Application
 * Static version - no build step required
 */

// State
let map;
let markers = [];
let selectedDateOffset = 1; // Default: tomorrow
let selectedFilter = 'all'; // 'all', 'piece', 'hourly'
let currentJobId = null; // For contact modal
let userLocation = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkGate(); // CRITICAL: Enforce gate before showing map
    initMap();
    initDatePicker();
    initFilters();
    getUserLocation();
});

// Initialize Mapbox map
function initMap() {
    if (MAPBOX_TOKEN === 'YOUR_MAPBOX_TOKEN_HERE') {
        alert('Please add your Mapbox token in data.js');
        return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Detect system theme for map style
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const mapStyle = isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';

    map = new mapboxgl.Map({
        container: 'map',
        style: mapStyle,
        center: [142.09, -34.24], // Mildura region
        zoom: 7
    });

    map.on('load', () => {
        renderJobs();
    });

    // Add zoom controls
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    // Add user location button
    map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserHeading: false
    }), 'bottom-right');
}

// Get user's location for distance calculations
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            },
            (error) => {
                console.log('Location not available:', error);
                // Default to Mildura for demo
                userLocation = { lat: -34.24, lng: 142.09 };
            }
        );
    }
}

// Initialize date picker
function initDatePicker() {
    document.querySelectorAll('.date-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDateOffset = parseInt(btn.dataset.offset);
            renderJobs();
            closePanel();
        });
    });
}

// Initialize filters
function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedFilter = btn.dataset.filter;
            renderJobs();
        });
    });
}

// Render jobs on map
function renderJobs() {
    // Clear existing markers
    markers.forEach(m => m.remove());
    markers = [];

    // DATA SERVICE INTEGRATION
    // Get all crowdsourced rates
    const rates = dataService.getRates();

    // Group by Town
    const grouped = {};
    rates.forEach(rate => {
        if (!grouped[rate.town]) grouped[rate.town] = [];
        grouped[rate.town].push(rate);
    });

    // Create markers for each town
    Object.keys(grouped).forEach(town => {
        const townRates = grouped[town];
        const coords = dataService.getTownCoords(town);

        if (!coords) return;

        // Determine marker type
        const hasP = townRates.some(r => r.payType === 'piece');
        const hasH = townRates.some(r => r.payType === 'hourly');
        let markerClass = hasP && hasH ? 'mixed' : (hasP ? 'piece' : 'hourly');

        // Count reports
        const totalReports = townRates.length;

        // Create marker element
        const el = document.createElement('div');
        el.className = `job-marker ${markerClass}`;
        el.textContent = totalReports;

        // Click handler
        el.addEventListener('click', () => {
            showJobPanel(town, townRates);
        });

        // Add to map
        const marker = new mapboxgl.Marker(el)
            .setLngLat([coords.lng, coords.lat])
            .addTo(map);

        markers.push(marker);

        // Jiggle marker if new
        if (Date.now() - new Date(townRates[0].reportedAt).getTime() < 60000) {
            el.classList.add('animate-bounce');
        }
    });
}

// Show job panel (now Rate Panel)
function showJobPanel(town, rates) {
    const panel = document.getElementById('job-panel');
    const container = document.getElementById('job-cards-container');

    // Set location name
    document.getElementById('panel-location-name').textContent = town;

    // Calculate distance
    const coords = dataService.getTownCoords(town);
    if (coords) {
        const distance = calculateDistance(coords.lat, coords.lng);
        document.getElementById('panel-distance').textContent = distance;
    }

    // Clear and populate cards
    container.innerHTML = '';

    // Sort: most recent first
    rates.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));

    rates.forEach(rate => {
        // Reuse list-app.js Logic?
        // Ideally we'd share the `createRateCard` function.
        // For now, I'll inline a simplified version for the map panel
        const card = createMapRateCard(rate);
        container.appendChild(card);
    });

    // Show panel
    panel.classList.remove('hidden');

    // Center map
    if (coords) {
        map.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 10,
            duration: 500
        });
    }
}

function createMapRateCard(rate) {
    const card = document.createElement('div');
    card.className = 'job-card'; // Reuse styles

    // Logic to format rate
    const isPiece = rate.payType === 'piece';
    const rateDisplay = isPiece
        ? `$${rate.ratePerKg.toFixed(2)}/kg`
        : `$${rate.originalRate.toFixed(2)}/hr`;

    const emoji = {
        'grapes': '🍇',
        'citrus': '🍊',
        'stone fruit': '🍑',
        'almonds': '🌰',
        'vegetables': '🥬',
        'cherries': '🍒'
    }[rate.crop] || '🌱';

    card.innerHTML = `
        <div class="job-card-header">
            <div class="job-crop">
                <span class="crop-icon">${emoji}</span>
                <div class="crop-info">
                    <h4>${rate.crop.charAt(0).toUpperCase() + rate.crop.slice(1)}</h4>
                    <span class="pay-type-badge ${rate.payType}">${rate.payType}</span>
                </div>
            </div>
            <div class="job-rate">
                <div class="rate-value ${rate.payType}">${rateDisplay}</div>
                <div class="rate-estimate">${isPiece ? 'Confirmed rate' : 'Hourly rate'}</div>
            </div>
        </div>
        <div class="job-meta">
            <span>🕐 ${new Date(rate.reportedAt).toLocaleDateString()}</span>
            <span>✅ ${rate.confirmations} confirmed</span>
            ${rate.transport ? '<span>🚐 Transport</span>' : ''}
        </div>
    `;
    return card;
}

// Create a job card element
function createJobCard(job, contractor) {
    const card = document.createElement('div');
    card.className = 'job-card';

    const emoji = cropEmoji[job.cropType] || '🌱';
    const rateDisplay = job.payType === 'piece'
        ? `$${job.rate.toFixed(2)}/${job.rateUnit}`
        : `$${job.rate.toFixed(2)}/hr`;

    const contractorDisplay = contractor.parentId
        ? `Sub of ${getContractor(contractor.parentId).displayName}`
        : contractor.displayName;

    card.innerHTML = `
        <div class="job-card-header">
            <div class="job-crop">
                <span class="crop-icon">${emoji}</span>
                <div class="crop-info">
                    <h4>${capitalize(job.cropType)}</h4>
                    <span class="pay-type-badge ${job.payType}">${job.payType.toUpperCase()}</span>
                </div>
            </div>
            <div class="job-rate">
                <div class="rate-value ${job.payType}">${rateDisplay}</div>
                ${job.estimatedHourly ? `<div class="rate-estimate">${job.estimatedHourly}</div>` : ''}
            </div>
        </div>
        <div class="job-meta">
            <span>🕐 ${job.startTime}</span>
            <span>👥 ${job.workersNeeded} spots</span>
            ${job.transportProvided ? '<span>🚐 Transport</span>' : ''}
        </div>
        <div class="job-contractor">${contractorDisplay}</div>
        <button class="contact-btn" onclick="openContactModal('${job.id}')">Get Contact Details</button>
    `;

    return card;
}

// Close job panel
function closePanel() {
    document.getElementById('job-panel').classList.add('hidden');
}

// Open contact modal
function openContactModal(jobId) {
    currentJobId = jobId;
    document.getElementById('contact-modal').classList.remove('hidden');
    document.getElementById('contact-form').classList.remove('hidden');
    document.getElementById('contact-result').classList.add('hidden');
    document.getElementById('phone-input').value = '';
    document.getElementById('phone-input').focus();
}

// Close contact modal
function closeModal() {
    document.getElementById('contact-modal').classList.add('hidden');
    currentJobId = null;
}

// Submit contact form (soft gate)
function submitContact(event) {
    event.preventDefault();

    const phone = document.getElementById('phone-input').value;
    const job = jobs.find(j => j.id === currentJobId);
    const contractor = getContractor(job.contractorId);

    // In production, this would save to Supabase
    console.log('Contact request:', { jobId: currentJobId, phone, timestamp: new Date() });

    // Show contractor details
    document.getElementById('contact-form').classList.add('hidden');
    document.getElementById('contact-result').classList.remove('hidden');
    document.getElementById('contractor-phone').textContent = contractor.phone;
    document.getElementById('call-link').href = `tel:${contractor.phone.replace(/\s/g, '')}`;
}

// Utility: Calculate distance from user
function calculateDistance(lat, lng) {
    if (!userLocation) {
        return 'Distance unknown';
    }

    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat - userLocation.lat);
    const dLng = toRad(lng - userLocation.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(userLocation.lat)) * Math.cos(toRad(lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return `${Math.round(d)}km away`;
}

function toRad(deg) {
    return deg * Math.PI / 180;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Gate functions (unified across all views)
function checkGate() {
    const gate = document.getElementById('share-gate');
    const mapEl = document.getElementById('map');

    if (!gate || !mapEl) {
        console.error('Gate or map element not found');
        return;
    }

    if (hasUserShared()) {
        passGate();
    } else {
        // Show gate, hide map
        gate.classList.remove('hidden');
        mapEl.style.display = 'none';
    }
}

function passGate() {
    const gate = document.getElementById('share-gate');
    const mapEl = document.getElementById('map');

    if (gate) gate.classList.add('hidden');
    if (mapEl) mapEl.style.display = 'block';
}

function skipGate() {
    // For MVP testing
    localStorage.setItem('unbeed_user_shared', 'true');
    passGate();
}

function playGateAudio() {
    // TTS using Web Speech API
    const msg = new SpeechSynthesisUtterance("Share a rate. Then see what everyone else shared.");
    window.speechSynthesis.speak(msg);
}

function hasUserShared() {
    return localStorage.getItem('unbeed_user_shared') === 'true';
}

// Close modal on outside click
document.getElementById('contact-modal').addEventListener('click', (e) => {
    if (e.target.id === 'contact-modal') {
        closeModal();
    }
});

// Close panel on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePanel();
        closeModal();
    }
});
