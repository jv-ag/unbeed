/**
 * Unbeed - Data Service
 * Unified Source of Truth for Map and List
 */

// Unit conversion factors (weight in kg per unit)
const unitConversions = {
    'grapes': { 'kg': 1, 'bucket': 20, 'bin': 400, 'lug': 10 },
    'cherries': { 'kg': 1, 'lug': 6, 'bin': 10, 'bucket': 5 },
    'citrus': { 'kg': 1, 'bin': 400, 'bucket': 18, 'lug': 10 },
    'stone fruit': { 'kg': 1, 'bin': 300, 'bucket': 15, 'lug': 8 },
    'almonds': { 'kg': 1, 'bin': 500, 'bucket': 20 },
    'vegetables': { 'kg': 1, 'bin': 20, 'bucket': 10 }
};

// Crop emojis
const cropEmojis = {
    'grapes': '🍇',
    'cherries': '🍒',
    'citrus': '🍊',
    'stone fruit': '🍑',
    'almonds': '🌰',
    'vegetables': '🥬'
};

// Convert rate to $/kg
function convertToKg(rate, unit, crop) {
    const conversions = unitConversions[crop] || unitConversions['grapes'];
    const factor = conversions[unit] || 1;
    return rate / factor;
}

// Format time ago
function timeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor(diff / (1000 * 60));

    if (hours > 24) return Math.floor(hours / 24) + 'd ago';
    if (hours > 0) return hours + 'hr ago';
    if (mins > 0) return mins + 'min ago';
    return 'Just now';
}

class DataService {
    constructor() {
        this.STORAGE_KEY = 'unbeed_rates_v1';
        this.townCoords = {
            'Mildura': { lat: -34.208, lng: 142.124 },
            'Robinvale': { lat: -34.583, lng: 142.766 },
            'Red Cliffs': { lat: -34.307, lng: 142.031 },
            'Renmark': { lat: -34.174, lng: 140.744 },
            'Griffith': { lat: -34.283, lng: 146.045 },
            'Loxton': { lat: -34.453, lng: 140.566 },
            'Waikerie': { lat: -34.172, lng: 139.985 }
        };

        // Seed data (if storage empty)
        this.seedData = [
            {
                id: 'r1', town: 'Mildura', crop: 'grapes', payType: 'piece',
                ratePerKg: 0.35, originalRate: 0.35, originalUnit: 'kg',
                spots: 20, transport: false, reportedAt: new Date(Date.now() - 2 * 3600000).toISOString(), confirmations: 4
            },
            {
                id: 'r2', town: 'Robinvale', crop: 'cherries', payType: 'piece',
                ratePerKg: 2.50, originalRate: 25, originalUnit: 'bin',
                spots: 30, transport: true, reportedAt: new Date(Date.now() - 30 * 60000).toISOString(), confirmations: 1
            },
            {
                id: 'r3', town: 'Renmark', crop: 'citrus', payType: 'hourly',
                ratePerKg: null, originalRate: 29.50, originalUnit: 'hour',
                spots: 5, transport: false, reportedAt: new Date(Date.now() - 5 * 3600000).toISOString(), confirmations: 8
            },
            {
                id: 'r4', town: 'Griffith', crop: 'vegetables', payType: 'hourly',
                ratePerKg: null, originalRate: 28.50, originalUnit: 'hour',
                spots: 40, transport: true, reportedAt: new Date(Date.now() - 6 * 3600000).toISOString(), confirmations: 5
            }
        ];
    }

    // Get all rates (from storage or seed)
    getRates() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
            // First time load: save seed data
            this.saveRates(this.seedData);
            return this.seedData;
        } catch (e) {
            console.error('Storage error', e);
            return this.seedData;
        }
    }

    // Add a new rate
    addRate(rate) {
        const rates = this.getRates();
        const newRate = {
            ...rate,
            id: 'r' + Date.now(),
            reportedAt: new Date().toISOString(),
            confirmations: 1
        };

        // Add to top
        rates.unshift(newRate);
        this.saveRates(rates);
        return newRate;
    }

    // Confirm a rate (upvote)
    confirmRate(id) {
        const rates = this.getRates();
        const rate = rates.find(r => r.id === id);
        if (rate) {
            rate.confirmations = (rate.confirmations || 0) + 1;
            this.saveRates(rates);
            return true;
        }
        return false;
    }

    // Save to storage
    saveRates(rates) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rates));
        // Dispatch event for cross-component updates
        window.dispatchEvent(new CustomEvent('unbeed-data-updated'));
    }

    // Get coordinates for a town
    getTownCoords(town) {
        return this.townCoords[town] || null;
    }

    // Get all towns with data
    getAllTowns() {
        return Object.keys(this.townCoords);
    }
}

const dataService = new DataService();
