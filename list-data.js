/**
 * Unbeed - List View Data
 * Crowdsourced rate reports with unit conversion
 */

// Unit conversion factors (weight in kg per unit)
const unitConversions = {
    'grapes': {
        'kg': 1,
        'bucket': 20,
        'bin': 400,
        'lug': 10
    },
    'cherries': {
        'kg': 1,
        'lug': 6,
        'bin': 10,
        'bucket': 5
    },
    'citrus': {
        'kg': 1,
        'bin': 400,
        'bucket': 18,
        'lug': 10
    },
    'stone fruit': {
        'kg': 1,
        'bin': 300,
        'bucket': 15,
        'lug': 8
    },
    'almonds': {
        'kg': 1,
        'bin': 500,
        'bucket': 20
    },
    'vegetables': {
        'kg': 1,
        'bin': 20,
        'bucket': 10
    }
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

// Towns
const towns = ['Mildura', 'Robinvale', 'Red Cliffs', 'Renmark', 'Griffith', 'Loxton', 'Waikerie'];

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

// Sample crowdsourced rate reports
let rateReports = [
    {
        id: 'r1',
        town: 'Mildura',
        crop: 'grapes',
        payType: 'piece',
        originalRate: 0.35,
        originalUnit: 'kg',
        ratePerKg: 0.35,
        spots: 20,
        contractor: 'Contractor A',
        transport: false,
        reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        confirmations: 4
    },
    {
        id: 'r2',
        town: 'Mildura',
        crop: 'grapes',
        payType: 'piece',
        originalRate: 8,
        originalUnit: 'bucket',
        ratePerKg: 0.40,
        spots: 15,
        contractor: null,
        transport: true,
        reportedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        confirmations: 2
    },
    {
        id: 'r3',
        town: 'Red Cliffs',
        crop: 'grapes',
        payType: 'piece',
        originalRate: 0.42,
        originalUnit: 'kg',
        ratePerKg: 0.42,
        spots: 10,
        contractor: 'Contractor B',
        transport: false,
        reportedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        confirmations: 3
    },
    {
        id: 'r4',
        town: 'Red Cliffs',
        crop: 'grapes',
        payType: 'hourly',
        originalRate: 30.35,
        originalUnit: 'hour',
        ratePerKg: null,
        spots: 10,
        contractor: null,
        transport: true,
        reportedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        confirmations: 3
    },
    {
        id: 'r5',
        town: 'Robinvale',
        crop: 'cherries',
        payType: 'piece',
        originalRate: 25,
        originalUnit: 'bin',
        ratePerKg: 2.50,
        spots: 30,
        contractor: 'Agriconnex',
        transport: false,
        reportedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        confirmations: 1
    },
    {
        id: 'r6',
        town: 'Renmark',
        crop: 'citrus',
        payType: 'piece',
        originalRate: 0.28,
        originalUnit: 'kg',
        ratePerKg: 0.28,
        spots: 30,
        contractor: null,
        transport: false,
        reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        confirmations: 2
    },
    {
        id: 'r7',
        town: 'Griffith',
        crop: 'vegetables',
        payType: 'hourly',
        originalRate: 28.50,
        originalUnit: 'hour',
        ratePerKg: null,
        spots: 40,
        contractor: 'HM Origins',
        transport: true,
        reportedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        confirmations: 5
    },
    {
        id: 'r8',
        town: 'Mildura',
        crop: 'citrus',
        payType: 'hourly',
        originalRate: 29.00,
        originalUnit: 'hour',
        ratePerKg: null,
        spots: 25,
        contractor: 'Contractor A',
        transport: false,
        reportedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
        confirmations: 2
    }
];

// Add a new rate report
function addRateReport(report) {
    const id = 'r' + Date.now();
    const newReport = {
        id,
        town: report.town,
        crop: report.crop,
        payType: report.payType,
        originalRate: report.rate,
        originalUnit: report.unit,
        ratePerKg: report.payType === 'piece' ? convertToKg(report.rate, report.unit, report.crop) : null,
        spots: report.spots || null,
        contractor: report.contractor || null,
        transport: report.transport || false,
        reportedAt: new Date().toISOString(),
        confirmations: 1
    };
    rateReports.unshift(newReport);
    saveReports();
    return newReport;
}

// Confirm a rate report
function confirmReport(reportId) {
    const report = rateReports.find(r => r.id === reportId);
    if (report) {
        report.confirmations++;
        saveReports();
    }
}

// Save to localStorage (simulates database)
function saveReports() {
    try {
        localStorage.setItem('unbeed_reports', JSON.stringify(rateReports));
    } catch (e) {
        console.log('LocalStorage not available');
    }
}

// Load from localStorage
function loadReports() {
    try {
        const saved = localStorage.getItem('unbeed_reports');
        if (saved) {
            rateReports = JSON.parse(saved);
        }
    } catch (e) {
        console.log('LocalStorage not available');
    }
}

// Check if user has shared
function hasUserShared() {
    try {
        return localStorage.getItem('unbeed_shared') === 'true';
    } catch (e) {
        return false;
    }
}

function setUserShared() {
    try {
        localStorage.setItem('unbeed_shared', 'true');
    } catch (e) {
        // Ignore
    }
}
