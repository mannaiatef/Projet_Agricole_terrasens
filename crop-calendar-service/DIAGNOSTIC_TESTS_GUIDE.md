# Diagnostic Tests - Quick Start Guide

## Problem
Calendar displays stage headers but content (actions, fertilization, alerts) is not showing.

## Solution
Run these diagnostic tests from the `crop-calendar-service` directory to identify where the data flow breaks.

## Tests Available

### 1. **test-database-schema.js**
**What it does:** Checks if the `calendar_stages` table has the required JSON columns

**Run:**
```bash
cd crop-calendar-service
node test-database-schema.js
```

**What to look for:**
- ✓ If all columns exist: Good, schema is correct
- ✗ If columns are MISSING: Database schema incomplete, need to run ALTER TABLE statements

**Output example:**
```
✓ calendar_stages has 12 columns
  ✓ actions                EXISTS
  ✓ alerts                 EXISTS
  ✓ fertilization          EXISTS
```

---

### 2. **test-comprehensive-diagnostic.js**
**What it does:** Full diagnostic of the entire data flow

**Run:**
```bash
cd crop-calendar-service
node test-comprehensive-diagnostic.js
```

**What to look for:**
- Schema validation ✓
- Data existence in database
- INSERT level (1 = LEVEL 1 all data, 2/3 = fallback = no JSON columns populated)
- API response test
- Recommendations

**Critical output:**
```
INSERT LEVEL DETECTED: Using LEVEL 2 or 3 (no JSON columns populated)
```
This means data isn't being saved to the calendar_stages JSON columns.

---

### 3. **test-api-calendar-debug.js**
**What it does:** Shows exactly what the API returns for a calendar

**Run:**
```bash
cd crop-calendar-service
node test-api-calendar-debug.js
```

**What to look for:**
- Does API return complete calendar object?
- Do stages have actions array, alerts array, fertilization object?
- Are values null or populated?

---

## Running All Tests

```bash
# Navigate to crop-calendar-service directory
cd crop-calendar-service

# Run tests in order
node test-database-schema.js
node test-comprehensive-diagnostic.js
node test-api-calendar-debug.js
```

---

## Interpreting Results

### Scenario 1: Missing JSON Columns
**Symptoms:** test-database-schema.js shows ✗ for actions/alerts/fertilization

**Fix:**
```sql
-- Run in MySQL
ALTER TABLE calendar_stages ADD COLUMN actions JSON NULL;
ALTER TABLE calendar_stages ADD COLUMN alerts JSON NULL;
ALTER TABLE calendar_stages ADD COLUMN fertilization JSON NULL;
```

Then regenerate calendars.

---

### Scenario 2: Columns Exist but Empty
**Symptoms:** 
- calendar_stages has columns ✓
- But INSERT LEVEL shows 2 or 3
- Sample data shows actions/alerts/fertilization as NULL

**Root Cause:** Backend INSERT is failing when writing JSON, falls back to LEVEL 2/3 (no JSON)

**Fix:** Check crop-calendar-service logs for INSERT errors, may need to adjust how data is being stringified

---

### Scenario 3: API Returns Empty Arrays/NULL
**Symptoms:**
- Database has data ✓
- API returns calendar ✓
- But `stage.actions`, `stage.alerts`, `stage.fertilization` are null or []

**Root Cause:** Query or JSON parsing issue in calendar.service.js

**Fix:** Check the getCalendarByFarmId() or getCalendarsByParcelleId() method for COALESCE/parsing issues

---

### Scenario 4: API Returns Complete Data
**Symptoms:** All above tests pass, API returns full data

**Problem is in Frontend:** Component not binding data correctly, check:
- Template: `*ngFor="let action of stage.actions"`
- Auto-expand logic triggering
- CSS preventing display

**Fix:** Add console.log in component.ts loadCalendar() method to verify data received

---

## Prerequisites

Make sure before running:

1. Database is running and connected
2. `.env` file exists in crop-calendar-service with DB credentials
3. For test-api-calendar-debug.js: Backend API must be running (`npm start` on port 3000)

---

## Next Steps After Diagnostics

1. **Run test-database-schema.js** → Confirms column structure
2. **Run test-comprehensive-diagnostic.js** → Shows INSERT level and detects issues
3. **Based on results** → Follow scenario fix above
4. **Run test-api-calendar-debug.js** → Verify API returns correct data
5. **Check frontend** → If API data is good, issue is in Angular component

