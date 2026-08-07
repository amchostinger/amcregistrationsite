# Backend Data Sync Setup Guide

## Overview

All frontend pages (Schedule, Speakers, Hotels, Venue) now fetch data directly from the backend API with proper error handling. Static/dummy data has been removed, and a seed database file has been created with sample conference data.

## What Changed

### Frontend Updates

1. **Schedule.jsx**
   - Removed `SESSIONS_STATIC` fallback data
   - Now always fetches from `/api/schedule?date=YYYY-MM-DD`
   - Added error state and displays red error banner if API fails
   - Shows loading message while fetching

2. **Speakers.jsx**
   - Removed `STATIC_SPEAKERS` as initial state
   - Now fetches from `/api/speakers` endpoint
   - Added `loading` and `error` states
   - Displays error banner if API fails
   - Shows loading message while fetching

3. **Hotels.jsx**
   - Removed `STATIC_HOTELS` as initial state
   - Now fetches from `/api/hotels` endpoint
   - Added `loading` and `error` states
   - Displays error banner if API fails
   - Shows loading message while fetching

4. **Venue.jsx**
   - Added API integration to fetch hotels
   - Displays top 4 hotels with live data
   - Added loading and error handling

### Backend Changes

**New Database Seed File:** `server/db/migrations/004_seed_data.sql`

Contains:
- 8 speakers with designations, churches, countries, and bios
- 7 hotels with full details (stars, amenities, pricing)
- Conference schedule for all 7 days (March 9-15, 2027)
- Speaker-session associations via `session_speakers` junction table

**Key Speaker-Session Links:**
- Presiding Bishop James Mwale: Opening Worship
- Bishop Ivan Abrahams: Presidential Address
- Bishop Eliud Wabukala: Keynote session
- Dr. Patricia Otieno: Closing Worship
- Rev. Namunkunda & Dr. Charity Mwale: Youth & Women Panel

## Setup Instructions

### 1. Run All Database Migrations

Execute these commands in order in your terminal:

```bash
# Navigate to project root
cd c:\Users\PC\Documents\React Projects\React Projects\AMCRegistrationSite

# Run migrations (replace 'root' with your MySQL user if different)
mysql -u root -p amc_conference_2027 < server/db/migrations/001_init.sql
mysql -u root -p amc_conference_2027 < server/db/migrations/002_admins.sql
mysql -u root -p amc_conference_2027 < server/db/migrations/003_content.sql
mysql -u root -p amc_conference_2027 < server/db/migrations/004_seed_data.sql
```

When prompted for password, enter your MySQL root password.

### 2. Start Backend & Frontend

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

### 3. Test All Pages

Visit these URLs to verify all data is fetching from backend:

1. **http://localhost:5173/schedule** - Should show 7-day schedule with speakers
2. **http://localhost:5173/speakers** - Should display 8 speakers with bios
3. **http://localhost:5173/hotels** - Should list 7 hotels with pricing
4. **http://localhost:5173/venue** - Should display top 4 hotels dynamically

### 4. Verify Admin Pages (Optional)

- http://localhost:5173/admin/speakers - Should list all 8 speakers
- http://localhost:5173/admin/schedule - Should show editable schedule
- http://localhost:5173/admin/hotels - Should display all 7 hotels

## API Endpoints

All working endpoints that now serve real data:

### Public
- `GET /api/speakers` - List all speakers
- `GET /api/speakers/:id` - Single speaker details
- `GET /api/schedule` or `GET /api/schedule?date=YYYY-MM-DD` - Sessions for a date
- `GET /api/schedule/live` - Currently happening session
- `GET /api/hotels` - List all hotels

### Admin (Protected)
- `GET /api/admin/speakers` - CRUD speakers
- `GET /api/admin/schedule` - CRUD schedule
- `GET /api/admin/hotels` - CRUD hotels

## Room Allocation Logic (Registration Form)

The hotel picker in the registration form now:
- Auto-adjusts rooms when delegation size > current rooms × 2
- Shows user notice explaining adjustment
- Enforces maximum 2 people per room
- Updates total cost based on room count
- Validates hotel room availability

Example: If user selects 2 rooms (capacity 4) but enters 6 people, system auto-adjusts to 3 rooms and displays notice.

## Database Schema Verification

Confirm all tables exist:

```bash
mysql -u root -p amc_conference_2027 -e "SHOW TABLES;"
```

Expected tables:
- registrants
- payments
- admin_audit_log
- conference_settings
- admins
- speakers
- schedule_sessions
- session_speakers
- hotels
- hotel_bookings

## Troubleshooting

### "Table doesn't exist" errors
- Ensure you ran ALL 4 migration files (001-004)
- Check migrations ran in order: 001_init → 002_admins → 003_content → 004_seed_data

### API returns empty data
- Check MySQL server is running: `mysql -u root -p -e "SELECT 1;"`
- Verify tables have data: `SELECT COUNT(*) FROM speakers;`
- Check backend server logs for errors

### Frontend shows error banners
- Verify backend is running on port 5000
- Check `client/lib/api.js` has correct API_URL (should be `http://localhost:5000`)
- Review browser console for network errors

### Static data still showing
- Clear browser cache (Cmd+Shift+Delete on Mac, Ctrl+Shift+Delete on Windows)
- Restart frontend dev server
- Verify your file edits were saved

## Next Steps

1. ✅ Backend data sync complete
2. 📋 Run the 4 migrations to populate database
3. 🧪 Test all pages showing real data
4. 🔧 Admin can now manage speakers/schedule/hotels
5. 📝 Update conference schedule if needed (via admin panel)
