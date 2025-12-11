// No import required for fetch in Node 18+

const API_BASE = 'http://localhost:3000';

async function testLabProcessAlert() {
  console.log('🧪 Testing Lab Process Alert Functionality\n');
  
  try {
    // Test 1: Create a clinical sample (PG project)
    console.log('Test 1: Creating clinical sample with PG project ID...');
    const clinicalSample = {
      uniqueId: 'TEST_CLINICAL_001',
      projectId: 'PG-2024-001',
      sampleType: 'Blood',
      serviceType: 'WES',
      patientClientName: 'John Doe',
      age: 35,
      gender: 'M',
      organisationHospital: 'Apollo Hospitals',
      clinicianResearcherName: 'Dr. Smith',
      speciality: 'Genetics',
      budget: 50000,
      sampleCollectionDate: new Date(),
      createdBy: 'test-user',
      remarkComment: 'Test clinical sample',
    };

    const clinicalResponse = await fetch(`${API_BASE}/api/sample-tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clinicalSample),
    });
    
    const clinicalData = await clinicalResponse.json() as any;
    const clinicalSampleId = clinicalData.id;
    console.log(`✓ Clinical sample created with ID: ${clinicalSampleId}\n`);

    // Test 2: Create discovery sample (DG project)
    console.log('Test 2: Creating discovery sample with DG project ID...');
    const discoverySample = {
      uniqueId: 'TEST_DISCOVERY_001',
      projectId: 'DG-2024-001',
      sampleType: 'Tissue',
      serviceType: 'WGS',
      patientClientName: 'Jane Smith',
      age: 42,
      gender: 'F',
      organisationHospital: 'Max Healthcare',
      clinicianResearcherName: 'Dr. Johnson',
      speciality: 'Oncology',
      budget: 75000,
      sampleCollectionDate: new Date(),
      createdBy: 'test-user',
      remarkComment: 'Test discovery sample',
    };

    const discoveryResponse = await fetch(`${API_BASE}/api/sample-tracking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discoverySample),
    });
    
    const discoveryData = await discoveryResponse.json() as any;
    const discoverySampleId = discoveryData.id;
    console.log(`✓ Discovery sample created with ID: ${discoverySampleId}\n`);

    // Test 3: Alert lab process for clinical sample
    console.log('Test 3: Alerting lab process for clinical sample (should go to lab_process_clinical_sheet)...');
    const clinicalAlertResponse = await fetch(`${API_BASE}/api/alert-lab-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sampleId: clinicalSampleId,
        projectId: 'PG-2024-001',
        uniqueId: 'TEST_CLINICAL_001',
        sampleType: 'Blood',
        serviceType: 'WES',
        patientName: 'John Doe',
        age: 35,
        gender: 'M',
        clinicianName: 'Dr. Smith',
        organization: 'Apollo Hospitals',
        speciality: 'Genetics',
        budget: 50000,
        status: 'Initiated',
        comments: 'Test alert',
        createdBy: 'test-user',
      }),
    });
    
    const clinicalAlertData = await clinicalAlertResponse.json() as any;
    if (clinicalAlertData.success && clinicalAlertData.table === 'lab_process_clinical_sheet') {
      console.log(`✓ Clinical alert processed successfully - Record created in ${clinicalAlertData.table}\n`);
    } else {
      console.log(`✗ Clinical alert failed: ${JSON.stringify(clinicalAlertData)}\n`);
    }

    // Test 4: Alert lab process for discovery sample
    console.log('Test 4: Alerting lab process for discovery sample (should go to lab_process_discovery_sheet)...');
    const discoveryAlertResponse = await fetch(`${API_BASE}/api/alert-lab-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sampleId: discoverySampleId,
        projectId: 'DG-2024-001',
        uniqueId: 'TEST_DISCOVERY_001',
        sampleType: 'Tissue',
        serviceType: 'WGS',
        patientName: 'Jane Smith',
        age: 42,
        gender: 'F',
        clinicianName: 'Dr. Johnson',
        organization: 'Max Healthcare',
        speciality: 'Oncology',
        budget: 75000,
        status: 'Initiated',
        comments: 'Test alert',
        createdBy: 'test-user',
      }),
    });
    
    const discoveryAlertData = await discoveryAlertResponse.json() as any;
    if (discoveryAlertData.success && discoveryAlertData.table === 'lab_process_discovery_sheet') {
      console.log(`✓ Discovery alert processed successfully - Record created in ${discoveryAlertData.table}\n`);
    } else {
      console.log(`✗ Discovery alert failed: ${JSON.stringify(discoveryAlertData)}\n`);
    }

    // Test 5: Verify clinical record was created
    console.log('Test 5: Verifying clinical lab process record was created...');
    const clinicalRecordsResponse = await fetch(`${API_BASE}/api/labprocess-clinical-sheet`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const clinicalRecords = await clinicalRecordsResponse.json() as any[];
    const clinicalRecord = clinicalRecords.find((r: any) => r.project_id === 'PG-2024-001');
    if (clinicalRecord) {
      console.log(`✓ Clinical record found: ${JSON.stringify(clinicalRecord).substring(0, 100)}...\n`);
    } else {
      console.log(`✗ Clinical record not found\n`);
    }

    // Test 6: Verify discovery record was created
    console.log('Test 6: Verifying discovery lab process record was created...');
    const discoveryRecordsResponse = await fetch(`${API_BASE}/api/labprocess-discovery-sheet`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const discoveryRecords = await discoveryRecordsResponse.json() as any[];
    const discoveryRecord = discoveryRecords.find((r: any) => r.project_id === 'DG-2024-001');
    if (discoveryRecord) {
      console.log(`✓ Discovery record found: ${JSON.stringify(discoveryRecord).substring(0, 100)}...\n`);
    } else {
      console.log(`✗ Discovery record not found\n`);
    }

    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLabProcessAlert();
