/**
 * Unbeed - Sample Job Data
 * This simulates what would come from Supabase
 * Replace MAPBOX_TOKEN with your actual token
 */

// ⚠️ REPLACE THIS WITH YOUR MAPBOX TOKEN
const MAPBOX_TOKEN = 'pk.eyJ1IjoibGV2MTIzNCIsImEiOiJjbWlicHpmNGMxNHR4MmlwcGx1M3N4M2c3In0.KiUwLmWVDUi2V7m8fMHNfQ';

// Sample farms (locations in Murray-Riverina region)
const farms = [
    {
        id: 'farm-1',
        displayName: 'Farm near Mildura',
        lat: -34.2358,
        lng: 142.0867,
        approxLat: -34.24,
        approxLng: 142.09
    },
    {
        id: 'farm-2', 
        displayName: 'Orchard near Robinvale',
        lat: -34.5833,
        lng: 142.7667,
        approxLat: -34.58,
        approxLng: 142.77
    },
    {
        id: 'farm-3',
        displayName: 'Vineyard near Red Cliffs',
        lat: -34.3069,
        lng: 142.1903,
        approxLat: -34.31,
        approxLng: 142.19
    },
    {
        id: 'farm-4',
        displayName: 'Farm near Renmark',
        lat: -34.1756,
        lng: 140.7461,
        approxLat: -34.18,
        approxLng: 140.75
    },
    {
        id: 'farm-5',
        displayName: 'Orchard near Griffith',
        lat: -34.2890,
        lng: 146.0350,
        approxLat: -34.29,
        approxLng: 146.04
    }
];

// Sample contractors
const contractors = [
    {
        id: 'contractor-1',
        displayName: 'Contractor A',
        phone: '0400 111 222',
        parentId: null
    },
    {
        id: 'contractor-2',
        displayName: 'Contractor B',
        phone: '0400 333 444',
        parentId: null
    },
    {
        id: 'contractor-3',
        displayName: 'Sub of Contractor A',
        phone: '0400 555 666',
        parentId: 'contractor-1'
    }
];

// Crop emoji mapping
const cropEmoji = {
    'grapes': '🍇',
    'citrus': '🍊',
    'stone fruit': '🍑',
    'almonds': '🌰',
    'vegetables': '🥬'
};

// Generate dates
function getDateString(offsetDays) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
}

// Sample jobs - multiple contractors at same farm
const jobs = [
    // Mildura - Multiple contractors
    {
        id: 'job-1',
        farmId: 'farm-1',
        contractorId: 'contractor-1',
        jobDate: getDateString(1), // Tomorrow
        cropType: 'grapes',
        jobType: 'picking',
        payType: 'piece',
        rate: 0.35,
        rateUnit: 'kg',
        estimatedHourly: '~$28-35/hr avg',
        startTime: '06:00',
        workersNeeded: 20,
        transportProvided: false
    },
    {
        id: 'job-2',
        farmId: 'farm-1', // Same farm!
        contractorId: 'contractor-2', // Different contractor
        jobDate: getDateString(1),
        cropType: 'grapes',
        jobType: 'picking',
        payType: 'piece',
        rate: 0.32, // Lower rate!
        rateUnit: 'kg',
        estimatedHourly: '~$24-30/hr avg',
        startTime: '06:30',
        workersNeeded: 15,
        transportProvided: true
    },
    {
        id: 'job-3',
        farmId: 'farm-1', // Same farm!
        contractorId: 'contractor-3', // Sub-contractor
        jobDate: getDateString(1),
        cropType: 'citrus',
        jobType: 'picking',
        payType: 'hourly',
        rate: 28.00,
        rateUnit: 'hour',
        estimatedHourly: null,
        startTime: '07:00',
        workersNeeded: 5,
        transportProvided: false
    },
    // Robinvale
    {
        id: 'job-4',
        farmId: 'farm-2',
        contractorId: 'contractor-1',
        jobDate: getDateString(1),
        cropType: 'stone fruit',
        jobType: 'picking',
        payType: 'piece',
        rate: 0.45,
        rateUnit: 'kg',
        estimatedHourly: '~$30-40/hr avg',
        startTime: '05:30',
        workersNeeded: 25,
        transportProvided: false
    },
    // Red Cliffs
    {
        id: 'job-5',
        farmId: 'farm-3',
        contractorId: 'contractor-2',
        jobDate: getDateString(1),
        cropType: 'grapes',
        jobType: 'pruning',
        payType: 'hourly',
        rate: 30.35,
        rateUnit: 'hour',
        estimatedHourly: null,
        startTime: '06:00',
        workersNeeded: 10,
        transportProvided: true
    },
    // Renmark (SA)
    {
        id: 'job-6',
        farmId: 'farm-4',
        contractorId: 'contractor-1',
        jobDate: getDateString(1),
        cropType: 'citrus',
        jobType: 'picking',
        payType: 'piece',
        rate: 0.28,
        rateUnit: 'kg',
        estimatedHourly: '~$25-32/hr avg',
        startTime: '06:00',
        workersNeeded: 30,
        transportProvided: false
    },
    // Griffith (NSW)
    {
        id: 'job-7',
        farmId: 'farm-5',
        contractorId: 'contractor-2',
        jobDate: getDateString(0), // Today
        cropType: 'vegetables',
        jobType: 'picking',
        payType: 'hourly',
        rate: 28.50,
        rateUnit: 'hour',
        estimatedHourly: null,
        startTime: '05:00',
        workersNeeded: 40,
        transportProvided: true
    },
    // Day after tomorrow jobs
    {
        id: 'job-8',
        farmId: 'farm-2',
        contractorId: 'contractor-2',
        jobDate: getDateString(2),
        cropType: 'almonds',
        jobType: 'picking',
        payType: 'piece',
        rate: 0.50,
        rateUnit: 'kg',
        estimatedHourly: '~$35-45/hr avg',
        startTime: '06:00',
        workersNeeded: 50,
        transportProvided: false
    }
];

// Helper to get farm by ID
function getFarm(farmId) {
    return farms.find(f => f.id === farmId);
}

// Helper to get contractor by ID
function getContractor(contractorId) {
    return contractors.find(c => c.id === contractorId);
}

// Get jobs for a specific date
function getJobsForDate(dateOffset) {
    const targetDate = getDateString(dateOffset);
    return jobs.filter(j => j.jobDate === targetDate);
}

// Group jobs by farm
function groupJobsByFarm(jobsList) {
    const grouped = {};
    jobsList.forEach(job => {
        if (!grouped[job.farmId]) {
            grouped[job.farmId] = [];
        }
        grouped[job.farmId].push(job);
    });
    return grouped;
}
