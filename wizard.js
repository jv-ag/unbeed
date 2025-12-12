/**
 * Unbeed Wizard - Pre-Literate Share Flow
 */

const wizardState = {
    step: 1,
    data: {
        crop: null,
        payType: null,
        unit: null,
        rate: null,
        town: null
    }
};

const crops = [
    { id: 'grapes', icon: '🍇', label: 'Grapes' },
    { id: 'citrus', icon: '🍊', label: 'Citrus' },
    { id: 'cherries', icon: '🍒', label: 'Cherries' },
    { id: 'stone fruit', icon: '🍑', label: 'Stone' },
    { id: 'vegetables', icon: '🥬', label: 'Veg' },
    { id: 'almonds', icon: '🌰', label: 'Nuts' }
];

const units = {
    'grapes': ['basket', 'box', 'lug'],
    'citrus': ['bin'],
    'cherries': ['lug', 'kg'],
    'stone fruit': ['bin', 'kg'],
    'vegetables': ['bin'], // Unifying crate/bin
    'almonds': ['tree', 'kg']
};

// Rate ranges: min, max, typical range [low, high], step
const rateRanges = {
    'grapes_basket': { min: 5, max: 15, typical: [7, 12], step: 0.50 },
    'grapes_box': { min: 3, max: 12, typical: [5, 9], step: 0.50 },
    'grapes_lug': { min: 2, max: 8, typical: [3, 6], step: 0.25 },
    'cherries_lug': { min: 10, max: 30, typical: [15, 25], step: 1 },
    'cherries_kg': { min: 1, max: 4, typical: [2, 3.50], step: 0.25 },
    'citrus_bin': { min: 80, max: 200, typical: [100, 150], step: 10 },
    'stone fruit_bin': { min: 60, max: 180, typical: [90, 140], step: 10 },
    'stone fruit_kg': { min: 0.80, max: 2.50, typical: [1.20, 2], step: 0.10 },
    'vegetables_bin': { min: 15, max: 50, typical: [20, 35], step: 5 },
    'almonds_tree': { min: 2, max: 8, typical: [3, 6], step: 0.50 },
    'almonds_kg': { min: 0.50, max: 2, typical: [0.80, 1.50], step: 0.10 },
    'hourly_hour': { min: 20, max: 40, typical: [25, 32], step: 1 }
};

function openWizard() {
    document.getElementById('wizard-overlay').classList.remove('hidden');
    renderStep(1);
}

function closeWizard() {
    document.getElementById('wizard-overlay').classList.add('hidden');
    wizardState.step = 1;
    wizardState.data = {};
}

function goBack() {
    if (wizardState.step > 1) {
        renderStep(wizardState.step - 1);
    }
}

function renderStep(step) {
    wizardState.step = step;
    const container = document.getElementById('wizard-content');
    const title = document.getElementById('wizard-title');


    // Toggle Back Button
    const backBtn = document.getElementById('wizard-back');
    if (backBtn) {
        if (step > 1) {
            backBtn.classList.remove('hidden');
        } else {
            // Check visibility style to avoid layout jump or just ensure hidden
            backBtn.classList.add('hidden');
        }
    }

    const dots = document.querySelectorAll('.dot');
    // Update Dots
    dots.forEach((d, i) => d.classList.toggle('active', i < step));

    let html = '';

    switch (step) {
        case 1: // Crop
            title.textContent = 'What are you picking?';
            html = `<div class="grid-2">`;
            crops.forEach(c => {
                const isSelected = wizardState.data.crop === c.id ? 'selected' : '';
                html += `
                    <button class="wiz-btn ${isSelected}" onclick="selectCrop('${c.id}')">
                        <span class="wiz-icon">${c.icon}</span>
                        <!-- <span class="wiz-label">${c.label}</span> -->
                    </button>
                `;
            });
            html += `</div>`;
            break;

        case 2: // Pay Type
            title.textContent = 'How are you paid?';
            const pay = wizardState.data.payType;
            html = `
                <div class="grid-2">
                    <button class="wiz-btn ${pay === 'piece' ? 'selected' : ''}" onclick="selectPay('piece')">
                        <span class="wiz-icon">🤝</span>
                        <span class="wiz-label">Contract</span>
                    </button>
                    <button class="wiz-btn ${pay === 'hourly' ? 'selected' : ''}" onclick="selectPay('hourly')">
                        <span class="wiz-icon">⏰</span>
                        <span class="wiz-label">Hourly</span>
                    </button>
                </div>
            `;
            break;

        case 3: // Unit (Skip if hourly)
            if (wizardState.data.payType === 'hourly') {
                selectUnit('hour'); // Auto-skip
                return;
            }
            title.textContent = 'Per what?';
            const availUnits = units[wizardState.data.crop] || ['bin', 'kg'];
            html = `<div class="grid-2">`;
            availUnits.forEach(u => {
                const isSelected = wizardState.data.unit === u ? 'selected' : '';
                // Icon selection logic
                let uIcon = '📦';
                if (u === 'tree') uIcon = '🌳';
                if (u === 'basket') uIcon = '🧺';
                if (u === 'kg') uIcon = '⚖️';

                html += `
                    <button class="wiz-btn ${isSelected}" onclick="selectUnit('${u}')">
                        <span class="wiz-icon">${uIcon}</span>
                        <span class="wiz-label">${u}</span>
                    </button>
                `;
            });
            html += `</div>`;
            break;

        case 4: // Rate
            title.textContent = 'How much?';

            // Get range config
            const crop = wizardState.data.crop;
            const unit = wizardState.data.unit;
            const rangeKey = unit === 'hour' ? 'hourly_hour' : `${crop}_${unit}`;
            const config = rateRanges[rangeKey] || { min: 0, max: 100, typical: [20, 80], step: 1 };

            const currentRate = wizardState.data.rate || config.typical[0];

            html = `
                <div class="rate-slider-container">
                    <div class="rate-display">$${currentRate.toFixed(2)}</div>
                    
                    <div class="typical-range-label">
                        Typical: $${config.typical[0]}-$${config.typical[1]}
                    </div>
                    
                    <input 
                        type="range" 
                        id="wiz-rate-slider" 
                        min="${config.min}" 
                        max="${config.max}" 
                        step="${config.step}" 
                        value="${currentRate}"
                        oninput="updateRateFromSlider()"
                        class="rate-slider"
                    >
                    
                    <div class="wiz-input-group" style="margin-top: 24px;">
                        <label style="font-size: 14px; color: var(--text-secondary);">Or enter exact:</label>
                        <input 
                            type="number" 
                            id="wiz-rate-input" 
                            class="wiz-input" 
                            style="font-size: 32px;"
                            placeholder="$0.00"
                            value="${currentRate}"
                            oninput="updateRateFromInput()"
                            step="${config.step}"
                            min="${config.min}"
                            max="${config.max}"
                        >
                    </div>
                </div>
                <button class="next-btn" onclick="submitRateStep()">Next ➝</button>
            `;
            break;

        case 5: // Town
            title.textContent = 'Where?';
            // Simple select for MVP speed
            html = `
                <div class="wiz-input-group">
                    <select id="wiz-town" class="wiz-input" style="font-size: 24px;">
                        <option value="Mildura">📍 Mildura</option>
                        <option value="Robinvale">📍 Robinvale</option>
                        <option value="Renmark">📍 Renmark</option>
                        <option value="Griffith">📍 Griffith</option>
                    </select>
                </div>
                 <button class="next-btn" onclick="finishWizard()">Share ✓</button>
            `;
            break;
    }

    container.innerHTML = html;
}

// Actions
function selectCrop(crop) {
    wizardState.data.crop = crop;
    renderStep(2);
}

function selectPay(type) {
    wizardState.data.payType = type;
    renderStep(3);
}

function selectUnit(unit) {
    wizardState.data.unit = unit;
    renderStep(4);
}

// Two-way binding for rate slider/input
function updateRateFromSlider() {
    const slider = document.getElementById('wiz-rate-slider');
    const input = document.getElementById('wiz-rate-input');
    const display = document.querySelector('.rate-display');

    if (slider && input && display) {
        const value = parseFloat(slider.value);
        input.value = value;
        display.textContent = '$' + value.toFixed(2);
    }
}

function updateRateFromInput() {
    const slider = document.getElementById('wiz-rate-slider');
    const input = document.getElementById('wiz-rate-input');
    const display = document.querySelector('.rate-display');

    if (slider && input && display) {
        const value = parseFloat(input.value) || 0;
        slider.value = value;
        display.textContent = '$' + value.toFixed(2);
    }
}

function submitRateStep() {
    const rate = parseFloat(document.getElementById('wiz-rate-input').value);
    if (!rate) return;
    wizardState.data.rate = rate;
    renderStep(5);
}

function finishWizard() {
    const town = document.getElementById('wiz-town').value;
    wizardState.data.town = town;

    // Save to Data Service
    const report = {
        ...wizardState.data,
        ratePerKg: wizardState.data.payType === 'piece' ? wizardState.data.rate : 0, // Mock calc
        originalRate: wizardState.data.rate,
        originalUnit: wizardState.data.unit
    };

    dataService.addRate(report);

    closeWizard();

    // Notify App
    window.dispatchEvent(new CustomEvent('unbeed-rate-shared'));

    // Pass gate (hide gate, show content)
    if (typeof passGate === 'function') {
        passGate();
    }
}
