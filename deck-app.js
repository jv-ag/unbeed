/**
 * Unbeed - Deck App
 * Discovery View (Tinder-style)
 */

let currentCards = [];
let currentIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Load Data
    const allRates = dataService.getRates();

    // Sort logic for Deck: "Smart Stack"
    // 1. Nearest (if loc), 2. High Pay, 3. Recent
    // For MVP: Just recent
    currentCards = allRates.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));

    // Sort logic for Deck: "Smart Stack"
    // 1. Nearest (if loc), 2. High Pay, 3. Recent
    // For MVP: Just recent
    currentCards = allRates.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));

    checkGate(); // NEW: Gate check

    // Listen for Wizard Success
    window.addEventListener('unbeed-rate-shared', () => {
        // User just shared, so they pass the gate
        localStorage.setItem('unbeed_user_shared', 'true');
        passGate();

        // Reload data to see their own post + others
        const allRates = dataService.getRates();
        currentCards = allRates.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
        currentIndex = 0;
        renderCard();
    });
});

// Utils (Shared with List)
function hasUserShared() {
    return localStorage.getItem('unbeed_user_shared') === 'true';
}

function checkGate() {
    if (hasUserShared()) {
        passGate();
    } else {
        // Ensure gate is visible
        document.getElementById('share-gate').classList.remove('hidden');
        document.getElementById('deck-container').classList.add('hidden');
    }
}

function passGate() {
    document.getElementById('share-gate').classList.add('hidden');
    document.getElementById('deck-container').classList.remove('hidden');
    renderCard();
}

function skipGate() {
    // For MVP testing
    localStorage.setItem('unbeed_user_shared', 'true');
    passGate();
}

function playGateAudio() {
    // Placeholder TTS using Web Speech API
    const msg = new SpeechSynthesisUtterance("Share a rate. Then see what everyone else shared.");
    window.speechSynthesis.speak(msg);
}

function renderCard() {
    const container = document.getElementById('deck-container');
    const rate = currentCards[currentIndex];

    if (!rate) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No more rates</h3>
                <p>Check back later or share one!</p>
            </div>`;
        toggleNav(true); // Emergency Nav
        return;
    }

    // Determine Logic
    const isPiece = rate.payType === 'piece';
    const priceDisplay = isPiece ? `$${rate.ratePerKg.toFixed(2)}` : `$${rate.originalRate}`;
    const unitDisplay = isPiece ? '/kg' : '/hr';

    // Emoji
    const emoji = {
        'grapes': '🍇', 'citrus': '🍊', 'cherries': '🍒',
        'stone fruit': '🍑', 'vegetables': '🥬'
    }[rate.crop] || '🌱';

    container.innerHTML = `
        <div class="rate-card-xl" id="current-card">
            <div class="card-image-area">
                ${emoji}
            </div>
            <div class="card-info">
                <div class="card-price">
                    ${priceDisplay}<span class="card-unit">${unitDisplay}</span>
                </div>
                <div class="card-meta">
                    <span>📍 ${rate.town}</span>
                    <span>👥 ${rate.spots || '?'} spots</span>
                </div>
                <div class="card-meta">
                     <span>${rate.payType.toUpperCase()}</span>
                </div>
            </div>
        </div>
    `;

    // Ensure nav is hidden if content exists (unless hovered)
    toggleNav(false);
}

// Nav Visibility Logic
function toggleNav(show) {
    const nav = document.querySelector('.bottom-nav');
    if (nav) {
        if (show) nav.classList.add('nav-visible');
        else nav.classList.remove('nav-visible');
    }
}

// Interactions for Nav handling
function handleNavInteraction(y) {
    const isBottom = window.innerHeight - y < 100;
    const isEmpty = !currentCards[currentIndex];

    // Show if near bottom OR empty
    toggleNav(isBottom || isEmpty);
}

// Hover (Desktop)
document.addEventListener('mousemove', (e) => {
    handleNavInteraction(e.clientY);
});

// Touch (Mobile) - Simple tap check
document.addEventListener('click', (e) => {
    // If they click/tap near the bottom, toggle nav ON
    // (Swipe left/right actions handle cards, background clicks handle nav)
    handleNavInteraction(e.clientY);
});

function swipeLeft() {
    const card = document.getElementById('current-card');
    if (card) {
        card.classList.add('swipe-left');
        setTimeout(() => {
            currentIndex++;
            renderCard();
        }, 300);
    }
}

async function swipeRight() {
    const card = document.getElementById('current-card');
    const rate = currentCards[currentIndex];

    if (card && rate) {
        card.classList.add('swipe-right');

        // Mock "Take Spot" Logic
        if (rate.spots > 0) {
            // In real app: call Supabase decrement
            console.log(`Taking spot for ${rate.id}`);
            // Optimistic update local (dataService)
            // dataService.takeSpot(rate.id) // TODO
        }

        setTimeout(() => {
            currentIndex++;
            renderCard();
        }, 300);
    }
}

// Wizard is handled by wizard.js
