# Unbeed MVP

A map-based + list-based farm jobs board with crowdsourced rate reporting.

## Quick Start

1. **Add your Mapbox token:**
   - Open `data.js`
   - Replace `YOUR_MAPBOX_TOKEN_HERE` with your Mapbox public token
   - Get one free at: https://mapbox.com/

2. **Open in browser:**
   - **Map view:** Open `index.html`
   - **List view:** Open `list.html` (shareable, no map needed)

3. **Deploy:**
   - Drag the folder to [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
   - No build step needed

## Files

```
docv/
├── index.html      # Map view (main page)
├── list.html       # List view (shareable, crowdsourced)
├── styles.css      # Shared styles (dark theme)
├── list-styles.css # List view specific styles
├── data.js         # Map view data
├── app.js          # Map view logic
├── list-data.js    # Crowdsourced rate data + unit conversion
├── list-app.js     # List view logic
└── README.md       # This file
```

## Features

- 🗺️ Map-based job discovery (Mapbox GL JS)
- 💰 Piece rate vs hourly rate display
- 📍 Distance from current location
- 🏢 Multiple contractors per farm
- 📱 Mobile-responsive design
- 🔒 Soft gate contact flow (phone capture)

## Adding Real Jobs

Edit `data.js`:

1. Add farms to the `farms` array
2. Add contractors to the `contractors` array
3. Add jobs to the `jobs` array

Example job:
```javascript
{
    id: 'job-new',
    farmId: 'farm-1',
    contractorId: 'contractor-1',
    jobDate: '2024-12-12',
    cropType: 'grapes',
    jobType: 'picking',
    payType: 'piece',
    rate: 0.35,
    rateUnit: 'kg',
    estimatedHourly: '~$28-35/hr avg',
    startTime: '06:00',
    workersNeeded: 20,
    transportProvided: false
}
```

## Phase 2: Supabase Backend

When ready to add real database:

1. Create Supabase project
2. Run schema from `implementation_plan.md`
3. Replace `data.js` with API calls

## License

Private - Unbeed
