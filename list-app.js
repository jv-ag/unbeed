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
    loadReports();
    initControls();
    checkGate();
});

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

// Initialize controls
function initControls() {
    // Group by
    document.getElementById('group-by').addEventListener('change', (e) => {
        currentGroupBy = e.target.value;
        renderRates();
    });

    // Sort by
    document.getElementById('sort-by').addEventListener('change', (e) => {
        currentSortBy = e.target.value;
        renderRates();
    });

    // Filters
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            renderRates();
        });
    });

    // Rate input for conversion preview
    document.getElementById('share-rate')?.addEventListener('input', updateConversionPreview);
    document.getElementById('share-unit')?.addEventListener('change', updateConversionPreview);
}

// Render rates list
function renderRates() {
    const container = document.getElementById('rates-container');
    let rates = [...rateReports];

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
                // Piece rates: by ratePerKg, hourly: by originalRate
                const aRate = a.payType === 'piece' ? (a.ratePerKg || 0) : (a.originalRate || 0);
                const bRate = b.payType === 'piece' ? (b.ratePerKg || 0) : (b.originalRate || 0);
                return bRate - aRate;
            case 'spots':
                return (b.spots || 0) - (a.spots || 0);
            case 'fresh':
                return new Date(b.reportedAt) - new Date(a.reportedAt);
            default:
                return 0;
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
                    ${verified ? '✓' : '⏱'} ${rate.confirmations} ${rate.confirmations === 1 ? 'report' : 'confirmed'} · ${timeAgo(rate.reportedAt)}
                </span>
                <button class="confirm-btn" onclick="confirmRate('${rate.id}')">👍 Confirm</button>
            </div>
        </div>
    `;
}

// Show share form modal
function showShareForm() {
    document.getElementById('share-modal').classList.remove('hidden');
    document.getElementById('share-form').reset();
    setPayType('piece');
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

    addRateReport(report);
    setUserShared();

    closeShareModal();
    document.getElementById('confirm-modal').classList.remove('hidden');
}

// Confirm a rate
function confirmRate(reportId) {
    confirmReport(reportId);
    renderRates();
}

// Utils
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
