# ✅ Testing Guide: Sample ID Prefixes Fix

## What Was Fixed
The bioinformatics component was not receiving sample ID prefixes (_1, _2, _3, _4) when multi-sample records were sent to bioinformatics.

**Root Cause:** The `unique_id` was incorrectly falling back to `project_id` instead of using the lab record's actual unique_id.

## Test Procedure

### Step 1: Create a Multi-Sample Lead
1. Go to **Lead Management**
2. Create a new lead with:
   - Name: Test Lead
   - Client: Test Client  
   - **no_of_samples: 4** ⚠️ IMPORTANT
   - Project: DG-XXXX (for discovery) or PG-XXXX (for clinical)

### Step 2: Alert to Lab Processing
1. Go to **Sample Tracking**
2. Find your test lead
3. Click **"Alert to Lab Processing"** button
4. ✅ Should create 4 records in Lab Processing with suffixes

### Step 3: Verify Lab Process Records Created
Check database:
```bash
mysql -h 127.0.0.1 -u remote_user -p lead_lims2 -e \
"SELECT id, unique_id, sample_id, project_id FROM labprocess_discovery_sheet 
WHERE unique_id LIKE 'TEST%' ORDER BY id DESC LIMIT 5;"
```

**Expected Output:**
```
id | unique_id   | sample_id     | project_id
4  | SAMPLE-ID   | SAMPLE-ID_1   | DG-XXXX
5  | SAMPLE-ID   | SAMPLE-ID_2   | DG-XXXX
6  | SAMPLE-ID   | SAMPLE-ID_3   | DG-XXXX
7  | SAMPLE-ID   | SAMPLE-ID_4   | DG-XXXX
```

### Step 4: Send First Record to Bioinformatics
1. Go to **Lab Processing**
2. Filter by "Discovery" or "Clinical" as needed
3. Find your test record (SAMPLE-ID_1)
4. Click **"Send For Bioinformatics"** button
5. ✅ Button should turn red and show "Sent ✓"

### Step 5: Verify First Record Sent
```bash
mysql -h 127.0.0.1 -u remote_user -p lead_lims2 -e \
"SELECT id, unique_id, sample_id, project_id FROM bioinformatics_sheet_discovery 
WHERE sample_id LIKE 'SAMPLE-ID%' ORDER BY id DESC;"
```

**Expected After Sending _1:**
```
id | unique_id   | sample_id     | project_id
1  | SAMPLE-ID   | SAMPLE-ID_1   | DG-XXXX  ✅ Correct unique_id, suffix preserved
```

### Step 6: Send Second Record to Bioinformatics
1. Find SAMPLE-ID_2 in Lab Processing
2. Click **"Send For Bioinformatics"** button
3. Wait for success toast

### Step 7: Verify Second Record Sent
```bash
mysql -h 127.0.0.1 -u remote_user -p lead_lims2 -e \
"SELECT id, unique_id, sample_id, project_id FROM bioinformatics_sheet_discovery 
WHERE sample_id LIKE 'SAMPLE-ID%' ORDER BY id DESC;"
```

**Expected After Sending _2:**
```
id | unique_id   | sample_id     | project_id
1  | SAMPLE-ID   | SAMPLE-ID_1   | DG-XXXX
2  | SAMPLE-ID   | SAMPLE-ID_2   | DG-XXXX  ✅ New record with _2 suffix
```

### Step 8: Send Records 3 and 4
Repeat the same process for SAMPLE-ID_3 and SAMPLE-ID_4

### Step 9: Final Verification
```bash
mysql -h 127.0.0.1 -u remote_user -p lead_lims2 -e \
"SELECT id, unique_id, sample_id, project_id FROM bioinformatics_sheet_discovery 
WHERE sample_id LIKE 'SAMPLE-ID%' ORDER BY id;"
```

**Expected Final Result:**
```
id | unique_id   | sample_id     | project_id
1  | SAMPLE-ID   | SAMPLE-ID_1   | DG-XXXX  ✅
2  | SAMPLE-ID   | SAMPLE-ID_2   | DG-XXXX  ✅
3  | SAMPLE-ID   | SAMPLE-ID_3   | DG-XXXX  ✅
4  | SAMPLE-ID   | SAMPLE-ID_4   | DG-XXXX  ✅
```

## Success Criteria

✅ All 4 records appear in bioinformatics_sheet_discovery
✅ Each record has the correct sample_id with suffix (_1, _2, _3, _4)
✅ Each record has the correct unique_id (NOT the project_id)
✅ Each record has the correct project_id
✅ Same behavior for clinical project (PG prefix)

## What to Look For (Issues)

❌ **Issue 1:** Records showing unique_id as "DG-XXXX" instead of actual sample ID
→ Means fallback to projectId still happening (fix wasn't applied)

❌ **Issue 2:** Records showing sample_id as "SAMPLE-ID" without suffix
→ Means sample_id with suffix not being sent

❌ **Issue 3:** Only 1 record sent when clicking button
→ Expected behavior (individual sends), NOT an issue

## Browser Console Check
Open browser DevTools → Console and look for:
- ✅ No errors when clicking "Send For Bioinformatics"
- ✅ Request shows correct unique_id and sample_id with suffix
- ✅ Success toast message appears

## Database Verification Command
Quick check of all bioinformatics records:
```bash
# Discovery
mysql -h 127.0.0.1 -u remote_user -p lead_lims2 -e \
"SELECT COUNT(*) as total_records, COUNT(DISTINCT sample_id) as unique_samples FROM bioinformatics_sheet_discovery WHERE sample_id LIKE '%_%';"

# Clinical  
mysql -h 127.0.0.1 -u remote_user -p lead_lims2 -e \
"SELECT COUNT(*) as total_records, COUNT(DISTINCT sample_id) as unique_samples FROM bioinformatics_sheet_clinical WHERE sample_id LIKE '%_%';"
```

## After Testing
1. Delete test records from bioinformatics_sheet_discovery
2. Delete test records from labprocess_discovery_sheet  
3. Delete test lead from lead_management

