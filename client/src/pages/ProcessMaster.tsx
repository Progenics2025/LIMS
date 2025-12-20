import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRecycle } from '@/contexts/RecycleContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatINR } from '@/components/ui/currency-input';
import { PDFViewer } from '@/components/PDFViewer';

function normalizeLead(l: any) {
  if (!l) return l;
  const get = (snake: string, camel: string) => {
    if (l[camel] !== undefined) return l[camel];
    if (l[snake] !== undefined) return l[snake];
    return undefined;
  };

  const normalized: any = {
    id: get('id', 'id'),
    uniqueId: get('unique_id', 'uniqueId') ?? get('title_unique_id', 'titleUniqueId') ?? get('titleUniqueId', 'titleUniqueId') ?? undefined,
    projectId: get('project_id', 'projectId') ?? get('projectId', 'projectId') ?? undefined,
    sampleId: get('sample_id', 'sampleId') ?? get('sampleId', 'sampleId') ?? (l.sample ? (l.sample.sampleId ?? l.sample.sample_id) : undefined) ?? undefined,
    clientId: get('client_id', 'clientId') || undefined,
    testName: get('test_name', 'testName') ?? get('testName', 'testName'),
    dateSampleCollected:
      get('date_sample_collected', 'dateSampleCollected') ||
      get('sample_collected_date', 'sampleCollectedDate') ||
      get('dateSampleCollected', 'dateSampleCollected') ||
      get('sampleCollectedDate', 'sampleCollectedDate') ||
      (l.sample ? (l.sample.date_sample_collected ?? l.sample.sample_collected_date ?? l.sample.collected_at ?? l.sample.collectedAt ?? l.sample.sampleCollectedDate) : undefined) ||
      null,
    createdAt: get('created_at', 'createdAt') || get('createdAt', 'createdAt') || null,
    convertedAt: get('converted_at', 'convertedAt') || get('convertedAt', 'convertedAt') || null,
    updatedAt: get('converted_at', 'updatedAt') || get('updatedAt', 'updatedAt') || get('converted_at', 'converted_at') || null,
    leadType: get('lead_type_discovery', 'leadType') || get('leadType', 'leadType') || get('lead_type_discovery', 'lead_type_discovery') || undefined,
    status: get('status', 'status') || undefined,
    geneticCounsellorRequired: get('genetic_counsellor_required', 'geneticCounsellorRequired') ?? get('geneticCounsellorRequired', 'geneticCounsellorRequired') ?? false,
    createdBy: get('created_by', 'createdBy') || get('createdBy', 'createdBy') || undefined,
    salesResponsiblePerson: get('sales_responsible_person', 'salesResponsiblePerson') || get('salesResponsiblePerson', 'salesResponsiblePerson') || undefined,
    sampleType: get('sample_type', 'sampleType') || undefined,
    organization:
      get('organization', 'organization') ||
      get('organisation', 'organization') ||
      get('org', 'organization') ||
      get('hospital', 'organization') ||
      get('hospital_name', 'organization') ||
      get('clinic_name', 'organization') ||
      get('organisation_hospital', 'organization') ||
      undefined,
    referredDoctor:
      get('clinician_name', 'referredDoctor') ||
      get('clinician_researcher_name', 'referredDoctor') ||
      get('referredDoctor', 'referredDoctor') ||
      get('referred_doctor', 'referred_doctor') ||
      undefined,
    clinicHospitalName: get('clinic_hospital_name', 'clinicHospitalName') || undefined,
    specialty:
      get('specialty', 'specialty') ||
      get('speciality', 'speciality') ||
      get('clinician_specialty', 'clinicianSpecialty') ||
      get('clinicianSpecialty', 'clinicianSpecialty') ||
      (l.clinician ? (l.clinician.specialty ?? l.clinician.speciality) : undefined) ||
      undefined,
    email: get('clinician_org_email', 'email') || get('email', 'email') || undefined,
    phone: get('clinician_org_phone', 'phone') || get('phone', 'phone') || undefined,
    location: get('location', 'location') || undefined,
    patientClientName: get('patient_client_name', 'patientClientName') || undefined,
    patientClientEmail: get('patient_client_email', 'patientClientEmail') || undefined,
    patientClientPhone: get('patient_client_phone', 'patientClientPhone') || undefined,
    patientClientAddress: get('patient_client_address', 'patientClientAddress') || undefined,
    age: get('age', 'age') ?? undefined,
    gender: get('gender', 'gender') || undefined,
    budget: get('budget', 'budget') ?? undefined,
    serviceName: get('service_name', 'serviceName') || undefined,
    followUp: get('follow_up', 'followUp') || undefined,
    pickupFrom: get('pickup_from', 'pickupFrom') || undefined,
    pickupUpto: get('pickup_upto', 'pickupUpto') || get('pickupUpto', 'pickupUpto') || undefined,
    sampleShippedDate:
      get('sample_shipped_date', 'sampleShippedDate') ||
      get('sampleShippedDate', 'sampleShippedDate') ||
      get('date_sample_shipped', 'sampleShippedDate') ||
      undefined,
    sampleReceivedDate:
      get('sample_recevied_date', 'sampleReceivedDate') ||
      get('sample_received_date', 'sampleReceivedDate') ||
      get('date_sample_received', 'sampleReceivedDate') ||
      get('dateSampleReceived', 'sampleReceivedDate') ||
      undefined,
    clinicianResearcherAddress:
      get('clinician_researcher_address', 'clinicianResearcherAddress') ||
      get('clinician_address', 'clinicianAddress') ||
      get('clinic_hospital_address', 'clinicianAddress') ||
      get('clinic_address', 'clinicianAddress') ||
      get('clinician_org_address', 'clinicianAddress') ||
      get('organisation_hospital', 'clinicianAddress') ||
      undefined,
    nutritionRequired: get('nutrition_management', 'nutritionRequired') || get('nutrition_required', 'nutritionRequired') || get('nutritionRequired', 'nutritionRequired') || get('nutritionManagement', 'nutritionRequired') || false,
    shippingAmount: get('shipping_amount', 'shippingAmount') ?? undefined,
    trackingId: get('tracking_id', 'trackingId') || undefined,
    courierCompany: get('courier_company', 'courierCompany') || undefined,
    progenicsTrf: (() => {
      const val = get('progenics_trf', 'progenicsTrf');
      if (val && typeof val === 'string' && !val.startsWith('/') && !val.startsWith('http')) return '/' + val;
      return val || undefined;
    })(),
    thirdPartyTrf: (() => {
      const val = get('third_party_trf', 'thirdPartyTrf');
      if (val && typeof val === 'string' && !val.startsWith('/') && !val.startsWith('http')) return '/' + val;
      return val || undefined;
    })(),
    progenicsReport: (() => {
      const val = get('progenics_report', 'progenicsReport');
      if (val && typeof val === 'string' && !val.startsWith('/') && !val.startsWith('http')) return '/' + val;
      return val || undefined;
    })(),
    sampleSentToThirdPartyDate: get('sample_sent_to_third_party_date', 'sampleSentToThirdPartyDate') || undefined,
    thirdPartyReport: (() => {
      const val = get('third_party_report', 'thirdPartyReport');
      if (val && typeof val === 'string' && !val.startsWith('/') && !val.startsWith('http')) return '/' + val;
      return val || undefined;
    })(),
    resultsRawDataReceivedFromThirdPartyDate: get('results_raw_data_received_from_third_party_date', 'resultsRawDataReceivedFromThirdPartyDate') || undefined,
    labProcessStatus: get('lab_process_status', 'labProcessStatus') || undefined,
    bioinformaticsStatus: get('bioinformatics_status', 'bioinformaticsStatus') || undefined,
    nutritionalManagementStatus: get('nutritional_management_status', 'nutritionalManagementStatus') || undefined,
    remarkComment: get('remark_comment', 'remarkComment') || get('Remark_Comment', 'remarkComment') || undefined,
    tat: get('tat', 'tat') ?? undefined,
    noOfSamples: get('no_of_samples', 'noOfSamples') ?? undefined,
    sampleCollectionDate: get('sample_collection_date', 'sampleCollectionDate') || undefined,

    thirdPartyName: get('third_party_name', 'thirdPartyName') || undefined,
    logisticStatus: get('logistic_status', 'logisticStatus') || undefined,
    financeStatus: get('finance_status', 'financeStatus') || undefined,

    _raw: l,
  };

  return normalized;
}

export default function ProcessMaster() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { add } = useRecycle();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'clinical' | 'discovery' | 'combined'>('combined');
  const [editingLead, setEditingLead] = useState<any>(null);
  const [editSelectedTitle, setEditSelectedTitle] = useState('Dr');
  const [editClinicianName, setEditClinicianName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [isSaving, setIsSaving] = useState(false);

  const { data: processMasterData = [], isLoading: processMasterLoading } = useQuery({
    queryKey: ['/api/process-master'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/process-master');
      return res.json();
    }
  });

  const normalizeProjectSample = (ps: any) => {
    if (!ps) return ps;

    return {
      // Core identifiers
      id: ps.id,
      uniqueId: ps.unique_id,
      projectId: ps.project_id,
      sampleId: ps.sample_id,
      clientId: ps.client_id,

      // Clinician/Researcher Information
      clinicianResearcherName: ps.clinician_researcher_name,
      clinicianResearcherEmail: ps.clinician_researcher_email,
      clinicianResearcherPhone: ps.clinician_researcher_phone,
      clinicianResearcherAddress: ps.clinician_researcher_address,
      specialty: ps.speciality,
      organisationHospital: ps.organisation_hospital,

      // Patient/Client Information
      patientClientName: ps.patient_client_name,
      age: ps.age,
      gender: ps.gender,
      patientClientEmail: ps.patient_client_email,
      patientClientPhone: ps.patient_client_phone,
      patientClientAddress: ps.patient_client_address,

      // Sample Information
      sampleCollectionDate: ps.sample_collection_date,
      sampleReceivedDate: ps.sample_recevied_date, // DB has typo "recevied"
      serviceName: ps.service_name,
      sampleType: ps.sample_type,
      noOfSamples: ps.no_of_samples,

      // Process Information
      tat: ps.tat,
      salesResponsiblePerson: ps.sales_responsible_person,

      // Third Party & Reports
      progenicsTrf: (() => {
        const val = ps.progenics_trf;
        if (val && typeof val === 'string' && !val.startsWith('/') && !val.startsWith('http')) return '/' + val;
        return val || undefined;
      })(),
      thirdPartyTrf: (() => {
        const val = ps.third_party_trf;
        if (val && typeof val === 'string' && !val.startsWith('/') && !val.startsWith('http')) return '/' + val;
        return val || undefined;
      })(),
      progenicsReport: (() => {
        const val = ps.progenics_report;
        if (val && typeof val === 'string' && !val.startsWith('/') && !val.startsWith('http')) return '/' + val;
        return val || undefined;
      })(),
      sampleSentToThirdPartyDate: ps.sample_sent_to_third_party_date,
      thirdPartyName: ps.third_party_name,
      thirdPartyReport: (() => {
        const val = ps.third_party_report;
        if (val && typeof val === 'string' && !val.startsWith('/') && !val.startsWith('http')) return '/' + val;
        return val || undefined;
      })(),
      resultsRawDataReceivedFromThirdPartyDate: ps.results_raw_data_received_from_third_party_date,

      // Status Fields
      logisticStatus: ps.logistic_status,
      financeStatus: ps.finance_status,
      labProcessStatus: ps.lab_process_status,
      bioinformaticsStatus: ps.bioinformatics_status,
      nutritionalManagementStatus: ps.nutritional_management_status,
      progenicsReportReleaseDate: ps.progenics_report_release_date,

      // Comments & Metadata
      remarkComment: ps.Remark_Comment,
      createdAt: ps.created_at,
      createdBy: ps.created_by,
      modifiedAt: ps.modified_at,
      modifiedBy: ps.modified_by,

      _raw: ps,
    };
  };

  // Only show ProcessMaster records from database, no virtual/mock data from leads
  const combinedLeads = processMasterData.map((pm: any) => normalizeProjectSample(pm));

  const filteredLeads = combinedLeads.filter((lead: any) => {
    const idToCheck = (lead.projectId || lead.sampleId || '').toString().toUpperCase();

    if (filterType === 'clinical') {
      if (!idToCheck.startsWith('PG')) return false;
    } else if (filterType === 'discovery') {
      if (!idToCheck.startsWith('DG')) return false;
    }

    const searchLower = searchTerm.toLowerCase();
    return (
      (String(lead.uniqueId || '')).toLowerCase().includes(searchLower) ||
      (String(lead.projectId || '')).toLowerCase().includes(searchLower) ||
      (String(lead.sampleId || '')).toLowerCase().includes(searchLower) ||
      (String(lead.clientId || '')).toLowerCase().includes(searchLower) ||
      (String(lead.patientClientName || '')).toLowerCase().includes(searchLower) ||
      (String(lead.patientClientPhone || '')).toLowerCase().includes(searchLower)
    );
  });

  // Pagination logic
  const totalFiltered = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  if (page > totalPages) setPage(totalPages);
  const start = (page - 1) * pageSize;
  const visibleLeads = filteredLeads.slice(start, start + pageSize);

  const handleEdit = (lead: any) => {
    setEditingLead({ ...lead });
    
    // Parse clinicianResearcherName into title and name for edit state
    const clinicianName = lead.clinicianResearcherName || '';
    const nameParts = clinicianName.split(' ');
    const titlePrefixes = ['Dr', 'Mr', 'Ms', 'Prof'];
    
    if (titlePrefixes.includes(nameParts[0]) && nameParts.length > 1) {
      setEditSelectedTitle(nameParts[0]);
      setEditClinicianName(nameParts.slice(1).join(' '));
    } else {
      setEditSelectedTitle('Dr');
      setEditClinicianName(clinicianName);
    }
    
    setIsEditDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Validate file type for TRF files
    if (!file.type || !file.type.includes('pdf')) {
      toast({ title: 'Error', description: 'Please select a PDF file', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Map field names to API categories
      const categoryMap: { [key: string]: string } = {
        progenicsTrf: 'Progenics_TRF',
        thirdPartyTrf: 'Thirdparty_TRF',
        progenicsReport: 'Progenics_Report',
        thirdPartyReport: 'Thirdparty_Report',
      };
      const category = categoryMap[field] || field;
      const leadId = editingLead?.id || 'new';
      
      // Use the new categorized API endpoint
      const res = await fetch(`/api/uploads/categorized?category=${category}&entityType=lead&entityId=${leadId}`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Upload failed');
      }
      const data = await res.json();
      
      // Store the file path from the new API response
      setEditingLead((prev: any) => ({ ...prev, [field]: data.filePath }));
      
      console.log('✅ File uploaded successfully:', {
        field,
        filePath: data.filePath,
        uploadId: data.uploadId,
        category: data.category,
        fileSize: data.fileSize
      });
      
      toast({ 
        title: 'Success', 
        description: `File uploaded successfully to ${data.category} folder` 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    try {
      if (!editingLead || !editingLead.id) {
        toast({ title: 'Error', description: 'Record ID is missing', variant: 'destructive' });
        return;
      }

      setIsSaving(true);

      // Convert camelCase back to snake_case for database
      const convertToDbFormat = (obj: any) => {
        const dbObj: any = {};
        const fieldMapping: { [key: string]: string } = {
          uniqueId: 'unique_id',
          projectId: 'project_id',
          sampleId: 'sample_id',
          clientId: 'client_id',
          organisationHospital: 'organisation_hospital',
          clinicianResearcherName: 'clinician_researcher_name',
          specialty: 'speciality',
          clinicianResearcherEmail: 'clinician_researcher_email',
          clinicianResearcherPhone: 'clinician_researcher_phone',
          clinicianResearcherAddress: 'clinician_researcher_address',
          patientClientName: 'patient_client_name',
          age: 'age',
          gender: 'gender',
          patientClientEmail: 'patient_client_email',
          patientClientPhone: 'patient_client_phone',
          patientClientAddress: 'patient_client_address',
          dateSampleCollected: 'sample_collection_date',
          sampleCollectionDate: 'sample_collection_date',
          sampleReceivedDate: 'sample_recevied_date',
          serviceName: 'service_name',
          sampleType: 'sample_type',
          noOfSamples: 'no_of_samples',
          tat: 'tat',
          salesResponsiblePerson: 'sales_responsible_person',
          progenicsTrf: 'progenics_trf',
          thirdPartyTrf: 'third_party_trf',
          progenicsReport: 'progenics_report',
          sampleSentToThirdPartyDate: 'sample_sent_to_third_party_date',
          thirdPartyName: 'third_party_name',
          thirdPartyReport: 'third_party_report',
          resultsRawDataReceivedFromThirdPartyDate: 'results_raw_data_received_from_third_party_date',
          logisticStatus: 'logistic_status',
          financeStatus: 'finance_status',
          labProcessStatus: 'lab_process_status',
          bioinformaticsStatus: 'bioinformatics_status',
          nutritionalManagementStatus: 'nutritional_management_status',
          progenicsReportReleaseDate: 'progenics_report_release_date',
          remarkComment: 'Remark_Comment',
          createdBy: 'created_by',
          modifiedBy: 'modified_by',
        };

        // Date fields that need to be formatted as YYYY-MM-DD
        const dateFields = [
          'sampleCollectionDate', 'sampleReceivedDate', 'sampleSentToThirdPartyDate',
          'resultsRawDataReceivedFromThirdPartyDate', 'progenicsReportReleaseDate',
          'dateSampleCollected'
        ];

        for (const [camel, snake] of Object.entries(fieldMapping)) {
          if (obj[camel] !== undefined && obj[camel] !== null) {
            let value = obj[camel];
            
            // Format date fields to YYYY-MM-DD
            if (dateFields.includes(camel) && value) {
              if (value instanceof Date) {
                value = value.toISOString().split('T')[0];
              } else if (typeof value === 'string' && value.length > 10) {
                // If it's an ISO string with time, extract just the date part
                value = value.split('T')[0];
              }
            }
            
            dbObj[snake] = value;
          }
        }

        // Include id but not createdAt, modifiedAt (those are system fields)
        if (obj.id !== undefined) {
          dbObj.id = obj.id;
        }

        return dbObj;
      };

      const dbData = convertToDbFormat(editingLead);

      // Validate that we have at least some data to save
      const fieldsToUpdate = Object.keys(dbData).filter(k => k !== 'id');
      if (fieldsToUpdate.length === 0) {
        toast({ title: 'Error', description: 'No fields to update', variant: 'destructive' });
        setIsSaving(false);
        return;
      }

      console.debug('[ProcessMaster] Saving record:', { id: editingLead.id, dbData });

      // All records are now ProcessMaster records from database
      const response = await apiRequest('PUT', `/api/process-master/${editingLead.id}`, dbData);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      toast({ title: 'Success', description: 'Record updated successfully' });
      setIsEditDialogOpen(false);
      setEditingLead(null);
      setEditSelectedTitle('Dr');
      setEditClinicianName('');
      queryClient.invalidateQueries({ queryKey: ['/api/process-master'] });
    } catch (error: any) {
      console.error('[ProcessMaster] Save error:', error);
      toast({ title: 'Error', description: error?.message || 'Failed to update record', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const leadToDelete = combinedLeads.find((l: any) => l.id === id);
      if (leadToDelete) {
        await add({
          entityType: 'lead',
          entityId: String(id),
          name: leadToDelete.patientClientName || leadToDelete.sampleId || 'Unknown Lead',
          originalPath: '/process-master',
          data: leadToDelete,
          deletedAt: new Date().toISOString()
        });
      }

      // Determine if this is a lead or ProcessMaster record and delete accordingly
      // All records are ProcessMaster records
      await apiRequest('DELETE', `/api/process-master/${id}`);

      toast({ title: 'Success', description: 'Record moved to recycle bin' });
      queryClient.invalidateQueries({ queryKey: ['/api/process-master'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete record', variant: 'destructive' });
    }
  };

  if (processMasterLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Process Master</h1>
        <div className="flex gap-4">
          <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="combined">Combined</SelectItem>
              <SelectItem value="clinical">Clinical (PG)</SelectItem>
              <SelectItem value="discovery">Discovery (DG)</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search Unique ID / Project ID / Sample ID / Client ID / Patient Name / Phone "
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto leads-table-wrapper process-table-wrapper">
            <Table className="leads-table w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Unique ID</TableHead>
                <TableHead className="whitespace-nowrap">Project ID</TableHead>
                <TableHead className="whitespace-nowrap">Sample ID</TableHead>
                <TableHead className="whitespace-nowrap">Client ID</TableHead>
                <TableHead className="whitespace-nowrap">Organisation/Hospital</TableHead>
                <TableHead className="whitespace-nowrap">Clinician/Researcher name</TableHead>
                <TableHead className="whitespace-nowrap">Speciality</TableHead>
                <TableHead className="whitespace-nowrap">Clinician/Researcher Email</TableHead>
                <TableHead className="whitespace-nowrap">Clinician/Researcher Phone</TableHead>
                <TableHead className="whitespace-nowrap">Clinician/Researcher address</TableHead>
                <TableHead className="whitespace-nowrap">Patient/Client name</TableHead>
                <TableHead className="whitespace-nowrap">Age</TableHead>
                <TableHead className="whitespace-nowrap">Gender</TableHead>
                <TableHead className="whitespace-nowrap">Patient/Client email</TableHead>
                <TableHead className="whitespace-nowrap">Patient/Client phone</TableHead>
                <TableHead className="whitespace-nowrap">Patient/Client address</TableHead>
                <TableHead className="whitespace-nowrap">Sample collection date</TableHead>
                <TableHead className="whitespace-nowrap">Sample recevied date</TableHead>
                <TableHead className="whitespace-nowrap">Service name</TableHead>
                <TableHead className="whitespace-nowrap">Sample Type</TableHead>
                <TableHead className="whitespace-nowrap">No of Samples</TableHead>
                <TableHead className="whitespace-nowrap">TAT</TableHead>
                <TableHead className="whitespace-nowrap">Sales/Responsible person</TableHead>
                <TableHead className="whitespace-nowrap">Progenics TRF</TableHead>
                <TableHead className="whitespace-nowrap">Third Party TRF</TableHead>
                <TableHead className="whitespace-nowrap">Progenics Report</TableHead>
                <TableHead className="whitespace-nowrap">Sample Sent To Third Party Date</TableHead>
                <TableHead className="whitespace-nowrap">Third Party Name</TableHead>
                <TableHead className="whitespace-nowrap">Third Party Report</TableHead>
                <TableHead className="whitespace-nowrap">Results/Raw Data Received From Third Party Date</TableHead>
                <TableHead className="whitespace-nowrap">Logistic Status</TableHead>
                <TableHead className="whitespace-nowrap">Finance Status</TableHead>
                <TableHead className="whitespace-nowrap">Lab Process Status</TableHead>
                <TableHead className="whitespace-nowrap">Bioinformatics Status</TableHead>
                <TableHead className="whitespace-nowrap">Nutritional Management Status</TableHead>
                <TableHead className="whitespace-nowrap">Progenics Report Release Date</TableHead>
                <TableHead className="whitespace-nowrap">Remark/Comment</TableHead>
                <TableHead className="whitespace-nowrap">Modified By</TableHead>
                <TableHead className="whitespace-nowrap">Modified At</TableHead>
                <TableHead className="actions-column whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleLeads.map((lead: any, i: any) => (
                <TableRow key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                  <TableCell className="whitespace-nowrap">{lead.uniqueId || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.projectId || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.sampleId || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.clientId || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.organisationHospital || lead.organization || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.clinicianResearcherName || lead.referredDoctor || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.specialty || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.clinicianResearcherEmail || lead.email || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.clinicianResearcherPhone || lead.phone || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.clinicianResearcherAddress || lead.clinicianAddress || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.patientClientName || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.age || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.gender || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.patientClientEmail || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.patientClientPhone || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.patientClientAddress || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.sampleCollectionDate ? new Date(lead.sampleCollectionDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.sampleReceivedDate ? new Date(lead.sampleReceivedDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.serviceName || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.sampleType || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.noOfSamples || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.tat || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.salesResponsiblePerson || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.progenicsTrf ? <PDFViewer pdfUrl={lead.progenicsTrf} fileName="Progenics_TRF.pdf" /> : '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.thirdPartyTrf || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.progenicsReport || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.sampleSentToThirdPartyDate ? new Date(lead.sampleSentToThirdPartyDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.thirdPartyName || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.thirdPartyReport || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.resultsRawDataReceivedFromThirdPartyDate ? new Date(lead.resultsRawDataReceivedFromThirdPartyDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.logisticStatus || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.financeStatus || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.labProcessStatus || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.bioinformaticsStatus || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.nutritionalManagementStatus || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.progenicsReportReleaseDate ? new Date(lead.progenicsReportReleaseDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.remarkComment || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.modifiedBy || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{lead.modifiedAt ? new Date(lead.modifiedAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="actions-column">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(lead)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </CardContent>
        {/* Pagination controls (responsive) */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t">
          <div className="flex items-center space-x-2">
            <Label>Page size</Label>
            <Select onValueChange={(v) => { setPageSize(parseInt(v || '25', 10)); setPage(1); }} value={String(pageSize)}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm">Showing {(start + 1) <= totalFiltered ? (start + 1) : 0} - {Math.min(start + pageSize, totalFiltered)} of {totalFiltered}</div>
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} size="sm">Prev</Button>
            <div className="text-sm px-2 min-w-[60px] text-center">Page {page} / {totalPages}</div>
            <Button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} size="sm">Next</Button>
          </div>
        </div>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>Make changes to the record below.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Excluded Unique ID and Project ID as per request */}

            <div className="space-y-2">
              <Label>Sample ID</Label>
              <Input value={editingLead?.sampleId || ''} onChange={(e) => setEditingLead({ ...editingLead, sampleId: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Client ID</Label>
              <Input value={editingLead?.clientId || ''} onChange={(e) => setEditingLead({ ...editingLead, clientId: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Organisation/Hospital</Label>
              <Input value={editingLead?.organisationHospital || ''} onChange={(e) => setEditingLead({ ...editingLead, organisationHospital: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Clinician/Researcher Name</Label>
              <Input value={editingLead?.clinicianResearcherName || ''} onChange={(e) => setEditingLead({ ...editingLead, clinicianResearcherName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Speciality</Label>
              <Input value={editingLead?.specialty || ''} onChange={(e) => setEditingLead({ ...editingLead, specialty: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Clinician Email</Label>
              <Input value={editingLead?.clinicianResearcherEmail || ''} onChange={(e) => setEditingLead({ ...editingLead, clinicianResearcherEmail: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Clinician Phone</Label>
              <Input value={editingLead?.clinicianResearcherPhone || ''} onChange={(e) => setEditingLead({ ...editingLead, clinicianResearcherPhone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Clinician Address</Label>
              <Input value={editingLead?.clinicianResearcherAddress || ''} onChange={(e) => setEditingLead({ ...editingLead, clinicianResearcherAddress: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Patient/Client Name</Label>
              <Input value={editingLead?.patientClientName || ''} onChange={(e) => setEditingLead({ ...editingLead, patientClientName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Age</Label>
              <Input value={editingLead?.age || ''} onChange={(e) => setEditingLead({ ...editingLead, age: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={editingLead?.gender || ''} onValueChange={(v) => setEditingLead({ ...editingLead, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Patient / Client Email</Label>
              <Input value={editingLead?.patientClientEmail || ''} onChange={(e) => setEditingLead({ ...editingLead, patientClientEmail: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Patient / Client Phone</Label>
              <Input value={editingLead?.patientClientPhone || ''} onChange={(e) => setEditingLead({ ...editingLead, patientClientPhone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Patient / Client Address</Label>
              <Input value={editingLead?.patientClientAddress || ''} onChange={(e) => setEditingLead({ ...editingLead, patientClientAddress: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Sample Collection Date</Label>
              <Input type="date" value={editingLead?.dateSampleCollected ? new Date(editingLead.dateSampleCollected).toISOString().split('T')[0] : ''} onChange={(e) => setEditingLead({ ...editingLead, dateSampleCollected: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Sample Received Date</Label>
              <Input type="date" value={editingLead?.sampleReceivedDate ? new Date(editingLead.sampleReceivedDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditingLead({ ...editingLead, sampleReceivedDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input value={editingLead?.serviceName || ''} onChange={(e) => setEditingLead({ ...editingLead, serviceName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Sample Type</Label>
              <Input value={editingLead?.sampleType || ''} onChange={(e) => setEditingLead({ ...editingLead, sampleType: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>No of Samples</Label>
              <Input value={editingLead?.noOfSamples || ''} onChange={(e) => setEditingLead({ ...editingLead, noOfSamples: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>TAT</Label>
              <Input value={editingLead?.tat || ''} onChange={(e) => setEditingLead({ ...editingLead, tat: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Sales/Responsible Person</Label>
              <Input value={editingLead?.salesResponsiblePerson || ''} onChange={(e) => setEditingLead({ ...editingLead, salesResponsiblePerson: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Progenics TRF</Label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <Input value={editingLead?.progenicsTrf || ''} readOnly placeholder="Upload a file" />
                  <Input type="file" className="w-[200px]" onChange={(e) => handleFileUpload(e, 'progenicsTrf')} accept=".pdf" />
                </div>
                {editingLead?.progenicsTrf && (
                  <div className="h-[200px] border rounded overflow-hidden">
                    <PDFViewer pdfUrl={editingLead.progenicsTrf} fileName="Progenics_TRF.pdf" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Third Party TRF</Label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <Input value={editingLead?.thirdPartyTrf || ''} readOnly placeholder="Upload a file" />
                  <Input type="file" className="w-[200px]" onChange={(e) => handleFileUpload(e, 'thirdPartyTrf')} accept=".pdf" />
                </div>
                {editingLead?.thirdPartyTrf && (
                  <div className="h-[200px] border rounded overflow-hidden">
                    <PDFViewer pdfUrl={editingLead.thirdPartyTrf} fileName="Third_Party_TRF.pdf" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Progenics Report</Label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <Input value={editingLead?.progenicsReport || ''} readOnly placeholder="Upload a file" />
                  <Input type="file" className="w-[200px]" onChange={(e) => handleFileUpload(e, 'progenicsReport')} accept=".pdf" />
                </div>
                {editingLead?.progenicsReport && (
                  <div className="h-[200px] border rounded overflow-hidden">
                    <PDFViewer pdfUrl={editingLead.progenicsReport} fileName="Progenics_Report.pdf" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sample Sent To Third Party Date</Label>
              <Input type="date" value={editingLead?.sampleSentToThirdPartyDate ? new Date(editingLead.sampleSentToThirdPartyDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditingLead({ ...editingLead, sampleSentToThirdPartyDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Third Party Name</Label>
              <Input value={editingLead?.thirdPartyName || ''} onChange={(e) => setEditingLead({ ...editingLead, thirdPartyName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Third Party Report</Label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <Input value={editingLead?.thirdPartyReport || ''} readOnly placeholder="Upload a file" />
                  <Input type="file" className="w-[200px]" onChange={(e) => handleFileUpload(e, 'thirdPartyReport')} accept=".pdf" />
                </div>
                {editingLead?.thirdPartyReport && (
                  <div className="h-[200px] border rounded overflow-hidden">
                    <PDFViewer pdfUrl={editingLead.thirdPartyReport} fileName="Third_Party_Report.pdf" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Results/Raw Data Received From Third Party Date</Label>
              <Input type="date" value={editingLead?.resultsRawDataReceivedFromThirdPartyDate ? new Date(editingLead.resultsRawDataReceivedFromThirdPartyDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditingLead({ ...editingLead, resultsRawDataReceivedFromThirdPartyDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Logistic Status</Label>
              <Input value={editingLead?.logisticStatus || ''} onChange={(e) => setEditingLead({ ...editingLead, logisticStatus: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Finance Status</Label>
              <Input value={editingLead?.financeStatus || ''} onChange={(e) => setEditingLead({ ...editingLead, financeStatus: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Lab Process Status</Label>
              <Input value={editingLead?.labProcessStatus || ''} onChange={(e) => setEditingLead({ ...editingLead, labProcessStatus: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Bioinformatics Status</Label>
              <Input value={editingLead?.bioinformaticsStatus || ''} onChange={(e) => setEditingLead({ ...editingLead, bioinformaticsStatus: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nutritional Management Status</Label>
              <Input value={editingLead?.nutritionalManagementStatus || ''} onChange={(e) => setEditingLead({ ...editingLead, nutritionalManagementStatus: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Progenics Report Release Date</Label>
              <Input type="date" value={editingLead?.progenicsReportReleaseDate ? new Date(editingLead.progenicsReportReleaseDate).toISOString().split('T')[0] : ''} onChange={(e) => setEditingLead({ ...editingLead, progenicsReportReleaseDate: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Remark/Comment</Label>
              <Textarea value={editingLead?.remarkComment || ''} onChange={(e) => setEditingLead({ ...editingLead, remarkComment: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingLead(null);
              setEditSelectedTitle('Dr');
              setEditClinicianName('');
            }} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
