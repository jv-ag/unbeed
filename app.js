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

    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v11',
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

    // Get jobs for selected date
    let jobsList = getJobsForDate(selectedDateOffset);

    // Apply filter
    if (selectedFilter === 'piece') {
        jobsList = jobsList.filter(j => j.payType === 'piece');
    } else if (selectedFilter === 'hourly') {
        jobsList = jobsList.filter(j => j.payType === 'hourly');
    }

    // Group by farm
    const grouped = groupJobsByFarm(jobsList);

    // Create markers for each farm
    Object.keys(grouped).forEach(farmId => {
        const farm = getFarm(farmId);
        const farmJobs = grouped[farmId];

        if (!farm) return;

        // Determine marker type based on job types at this farm
        const hasP = farmJobs.some(j => j.payType === 'piece');
        const hasH = farmJobs.some(j => j.payType === 'hourly');
        let markerClass = hasP && hasH ? 'mixed' : (hasP ? 'piece' : 'hourly');

        // Total workers needed
        const totalWorkers = farmJobs.reduce((sum, j) => sum + j.workersNeeded, 0);

        // Create marker element
        const el = document.createElement('div');
        el.className = `job-marker ${markerClass}`;
        el.textContent = totalWorkers;
        el.setAttribute('data-farm-id', farmId);

        // Add click handler
        el.addEventListener('click', () => {
            showJobPanel(farmId, farmJobs);
        });

        // Create Mapbox marker
        const marker = new mapboxgl.Marker(el)
            .setLngLat([farm.approxLng, farm.approxLat])
            .addTo(map);

        markers.push(marker);
    });
}

// Show job panel for a farm
function showJobPanel(farmId, farmJobs) {
    const farm = getFarm(farmId);
    const panel = document.getElementById('job-panel');
    const container = document.getElementById('job-cards-container');

    // Set location name
    document.getElementById('panel-location-name').textContent = farm.displayName;

    // Calculate distance
    const distance = calculateDistance(farm.approxLat, farm.approxLng);
    document.getElementById('panel-distance').textContent = distance;

    // Clear and populate job cards
    container.innerHTML = '';

    // Sort: piece rate first, then by rate descending
    farmJobs.sort((a, b) => {
        if (a.payType !== b.payType) return a.payType === 'piece' ? -1 : 1;
        return b.rate - a.rate;
    });

    farmJobs.forEach(job => {
        const contractor = getContractor(job.contractorId);
        const card = createJobCard(job, contractor);
        container.appendChild(card);
    });

    // Show panel
    panel.classList.remove('hidden');

    // Center map on selected farm
    map.flyTo({
        center: [farm.approxLng, farm.approxLat],
        zoom: 10,
        duration: 500
    });
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
