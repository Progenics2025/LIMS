# Bioinformatics API Documentation

## Overview
This document describes the API endpoints for managing bioinformatics records in the LeadLab LIMS system. The system supports two separate bioinformatics tables:
- **bioinformatics_sheet_clinical** - For clinical samples (Project ID starts with `PG`)
- **bioinformatics_sheet_discovery** - For discovery/research samples (Project ID starts with `DG`)

## Base URL
```
http://localhost:4000
```

---

## Endpoints

### 1. Bioinformatics Clinical Sheet

#### GET `/api/bioinfo-clinical-sheet`
Fetch all clinical bioinformatics records.

**Request:**
```bash
curl http://localhost:4000/api/bioinfo-clinical-sheet
```

**Response:** Array of clinical bioinformatics records
```json
[
  {
    "id": 1,
    "unique_id": "25AD11221715",
    "project_id": "PG251122171546",
    "sample_id": "9",
    "service_name": "NBS",
    "sequencing_status": "pending",
    "analysis_status": "pending",
    "created_at": "2025-11-24T11:13:51.000Z",
    "created_by": "lab_team",
    ...
  }
]
```

#### POST `/api/bioinfo-clinical-sheet`
Create a new clinical bioinformatics record.

**Request:**
```bash
curl -X POST http://localhost:4000/api/bioinfo-clinical-sheet \
  -H "Content-Type: application/json" \
  -d '{
    "unique_id": "25AD11221715",
    "project_id": "PG251122171546",
    "sample_id": "9",
    "service_name": "NBS",
    "sequencing_status": "pending",
    "analysis_status": "pending",
    "created_by": "lab_team"
  }'
```

**Response:** Created record with auto-generated ID
```json
{
  "id": 2,
  "unique_id": "25AD11221715",
  "project_id": "PG251122171546",
  "sample_id": "9",
  "service_name": "NBS",
  "sequencing_status": "pending",
  "analysis_status": "pending",
  "created_at": "2025-11-24T11:13:51.000Z",
  ...
}
```

#### PUT `/api/bioinfo-clinical-sheet/:id`
Update an existing clinical bioinformatics record.

**Request:**
```bash
curl -X PUT http://localhost:4000/api/bioinfo-clinical-sheet/2 \
  -H "Content-Type: application/json" \
  -d '{
    "analysis_status": "in_progress",
    "workflow_type": "WES",
    "modified_by": "bioinformatics_team"
  }'
```

**Response:** Updated record
```json
{
  "id": 2,
  "unique_id": "25AD11221715",
  "analysis_status": "in_progress",
  "workflow_type": "WES",
  "modified_by": "bioinformatics_team",
  ...
}
```

#### DELETE `/api/bioinfo-clinical-sheet/:id`
Delete a clinical bioinformatics record.

**Request:**
```bash
curl -X DELETE http://localhost:4000/api/bioinfo-clinical-sheet/2
```

**Response:**
```json
{
  "id": "2"
}
```

---

### 2. Bioinformatics Discovery Sheet

#### GET `/api/bioinfo-discovery-sheet`
Fetch all discovery bioinformatics records.

**Request:**
```bash
curl http://localhost:4000/api/bioinfo-discovery-sheet
```

**Response:** Array of discovery bioinformatics records

#### POST `/api/bioinfo-discovery-sheet`
Create a new discovery bioinformatics record.

**Request:**
```bash
curl -X POST http://localhost:4000/api/bioinfo-discovery-sheet \
  -H "Content-Type: application/json" \
  -d '{
    "unique_id": "TEST_DISC_LAB_001",
    "project_id": "DG251124LAB01",
    "sample_id": "77",
    "service_name": "WGS",
    "sequencing_status": "pending",
    "analysis_status": "pending",
    "created_by": "lab_team"
  }'
```

**Response:** Created record with auto-generated ID

#### PUT `/api/bioinfo-discovery-sheet/:id`
Update an existing discovery bioinformatics record.

**Request:**
```bash
curl -X PUT http://localhost:4000/api/bioinfo-discovery-sheet/2 \
  -H "Content-Type: application/json" \
  -d '{
    "analysis_status": "completed",
    "workflow_type": "WGS",
    "modified_by": "bioinformatics_team"
  }'
```

**Response:** Updated record

#### DELETE `/api/bioinfo-discovery-sheet/:id`
Delete a discovery bioinformatics record.

**Request:**
```bash
curl -X DELETE http://localhost:4000/api/bioinfo-discovery-sheet/2
```

**Response:**
```json
{
  "id": "2"
}
```

---

## Complete Workflow: Lab Processing → Bioinformatics

This workflow demonstrates how the "Send for Processing" button in Lab Processing triggers the creation of bioinformatics records.

### Step 1: Check Lab Processing Records
```bash
# For Clinical
curl http://localhost:4000/api/labprocess-clinical-sheet

# For Discovery
curl http://localhost:4000/api/labprocess-discovery-sheet
```

### Step 2: Update Lab Process (Mark as Alerted)
When user clicks "Send for Processing" button:

```bash
# For Clinical (ID: 6)
curl -X PUT http://localhost:4000/api/labprocess-clinical-sheet/6 \
  -H "Content-Type: application/json" \
  -d '{"alert_to_bioinformatics_team": 1}'

# For Discovery (ID: 1041)
curl -X PUT http://localhost:4000/api/labprocess-discovery-sheet/1041 \
  -H "Content-Type: application/json" \
  -d '{"alert_to_bioinformatics_team": 1}'
```

### Step 3: Create Bioinformatics Record
Automatically create a bioinformatics record with data from lab processing:

```bash
# For Clinical
curl -X POST http://localhost:4000/api/bioinfo-clinical-sheet \
  -H "Content-Type: application/json" \
  -d '{
    "unique_id": "25AD11221715",
    "project_id": "PG251122171546",
    "sample_id": "9",
    "service_name": "NBS",
    "sequencing_status": "pending",
    "analysis_status": "pending",
    "created_by": "lab_team"
  }'

# For Discovery
curl -X POST http://localhost:4000/api/bioinfo-discovery-sheet \
  -H "Content-Type: application/json" \
  -d '{
    "unique_id": "TEST_DISC_LAB_001",
    "project_id": "DG251124LAB01",
    "sample_id": "77",
    "service_name": "WGS",
    "sequencing_status": "pending",
    "analysis_status": "pending",
    "created_by": "lab_team"
  }'
```

---

## Field Mapping

### Common Fields (Both Tables)

| Frontend Field | Database Column | Type | Description |
|---|---|---|---|
| uniqueId | unique_id | VARCHAR(255) | Unique identifier |
| projectId | project_id | VARCHAR(255) | Project ID (PG=Clinical, DG=Discovery) |
| sampleId | sample_id | VARCHAR(255) | Sample identifier |
| clientId | client_id | VARCHAR(255) | Client identifier |
| organisationHospital | organisation_hospital | VARCHAR(255) | Organization/Hospital name |
| clinicianResearcherName | clinician_researcher_name | VARCHAR(255) | Clinician/Researcher name |
| patientClientName | patient_client_name | VARCHAR(255) | Patient/Client name |
| age | age | INT | Age |
| gender | gender | VARCHAR(20) | Gender |
| serviceName | service_name | VARCHAR(255) | Service type (WGS, WES, NBS, etc) |
| noOfSamples | no_of_samples | INT | Number of samples |
| sequencingStatus | sequencing_status | VARCHAR(255) | Sequencing status |
| sequencingDataStorageDate | sequencing_data_storage_date | DATE | Sequencing data storage date |
| basecalling | basecalling | VARCHAR(255) | Basecalling information |
| basecallingDataStorageDate | basecalling_data_storage_date | DATE | Basecalling data storage date |
| workflowType | workflow_type | VARCHAR(255) | Workflow type |
| analysisStatus | analysis_status | VARCHAR(255) | Analysis status (pending/in_progress/completed) |
| analysisDate | analysis_date | DATE | Analysis date |
| thirdPartyName | third_party_name | VARCHAR(255) | Third party name |
| sampleSentToThirdPartyDate | sample_sent_to_third_party_date | DATE | Sample sent to third party date |
| thirdPartyTrf | third_party_trf | VARCHAR(255) | Third party TRF |
| resultsRawDataReceivedFromThirdPartyDate | results_raw_data_received_from_third_party_date | DATE | Results received date |
| thirdPartyReport | third_party_report | VARCHAR(500) | Third party report |
| tat | tat | VARCHAR(100) | Turn around time |
| vcfFileLink | vcf_file_link | VARCHAR(500) | VCF file link |
| cnvStatus | cnv_status | VARCHAR(255) | CNV status |
| progenicsRawData | progenics_raw_data | VARCHAR(500) | Progenics raw data |
| progenicsRawDataSize | progenics_raw_data_size | VARCHAR(255) | Raw data size |
| progenicsRawDataLink | progenics_raw_data_link | VARCHAR(500) | Raw data link |
| analysisHtmlLink | analysis_html_link | VARCHAR(500) | Analysis HTML link |
| relativeAbundanceSheet | relative_abundance_sheet | VARCHAR(500) | Relative abundance sheet |
| dataAnalysisSheet | data_analysis_sheet | VARCHAR(500) | Data analysis sheet |
| databaseToolsInformation | database_tools_information | TEXT | Database tools info |
| alertToTechnicalLeadd | alert_to_technical_leadd (discovery) / alert_to_technical_lead (clinical) | TINYINT(1) | Alert to technical lead flag |
| alertToReportTeam | alert_to_report_team | TINYINT(1) | Alert to report team flag |
| createdAt | created_at | DATETIME | Created timestamp |
| createdBy | created_by | VARCHAR(255) | Created by user |
| modifiedAt | modified_at | DATETIME | Modified timestamp |
| modifiedBy | modified_by | VARCHAR(255) | Modified by user |
| remarkComment | remark_comment | TEXT | Remarks/Comments |

---

## Project ID Prefixes

The system automatically routes records to the correct table based on project ID:

- **PG*** → Clinical (e.g., `PG251122171546`)
- **DG*** → Discovery (e.g., `DG251124LAB01`)

---

## Testing

Run the comprehensive test suite:

```bash
./test_bioinformatics_api.sh
```

This script tests:
1. ✓ GET endpoints for both tables
2. ✓ POST (create) for both tables
3. ✓ PUT (update) for both tables
4. ✓ DELETE for both tables
5. ✓ Complete workflow from Lab Processing to Bioinformatics
6. ✓ Data cleanup

---

## Status Values

### Analysis Status
- `pending` - Analysis not started
- `in_progress` - Analysis in progress
- `completed` - Analysis completed
- `failed` - Analysis failed

### Sequencing Status
- `pending` - Sequencing pending
- `in_progress` - Sequencing in progress
- `completed` - Sequencing completed

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "No updates provided"
}
```

### 404 Not Found
```json
{
  "message": "Bioinformatics record not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to create bioinformatics record",
  "error": "Error message details"
}
```
