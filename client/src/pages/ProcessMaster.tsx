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
      // As a last resort, some exports put the hospital/org under `organisation_hospital`
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
    patientAddress: get('patient_address', 'patientAddress') || undefined,
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
    // explicit mapping for sample received / date_sample_received variants
    sampleReceivedDate:
      get('sample_received_date', 'sampleReceivedDate') ||
      get('date_sample_received', 'sampleReceivedDate') ||
      get('dateSampleReceived', 'sampleReceivedDate') ||
      undefined,
    // clinician / researcher address mapping (many possible backend keys)
    clinicianAddress:
      get('clinician_address', 'clinicianAddress') ||
      get('clinic_hospital_address', 'clinicianAddress') ||
      get('clinic_address', 'clinicianAddress') ||
      get('clinician_org_address', 'clinicianAddress') ||
      get('organisation_hospital', 'clinicianAddress') ||
      undefined,
    // Nutrition flag mapping
    nutritionRequired: get('nutrition_management', 'nutritionRequired') || get('nutrition_required', 'nutritionRequired') || get('nutritionRequired', 'nutritionRequired') || get('nutritionManagement', 'nutritionRequired') || false,
    shippingAmount: get('shipping_amount', 'shippingAmount') ?? undefined,
    trackingId: get('tracking_id', 'trackingId') || undefined,
    courierCompany: get('courier_company', 'courierCompany') || undefined,
    progenicsTRF: get('progenics_trf', 'progenicsTRF') || get('progenicsTRF', 'progenicsTRF') || undefined,
    // third-party / report fields
    thirdPartyTRF: get('third_party_trf', 'thirdPartyTRF') || get('thirdPartyTRF', 'thirdPartyTRF') || undefined,
    report: get('report', 'report') || undefined,
    internalReportId: get('internal_report_id', 'internalReportId') || get('internalReportId', 'internalReportId') || undefined,
    thirdPartyReportName: get('third_party_report_name', 'thirdPartyReportName') || get('thirdPartyReportName', 'thirdPartyReportName') || undefined,
    dateSampleSentToThirdParty: get('date_sample_sent_to_third_party', 'dateSampleSentToThirdParty') || get('dateSampleSentToThirdParty', 'dateSampleSentToThirdParty') || get('date_sample_sent', 'dateSampleSentToThirdParty') || undefined,
    dateReportReleasedFromProgenics: get('date_report_released_from_progenics', 'dateReportReleasedFromProgenics') || get('dateReportReleasedFromProgenics', 'dateReportReleasedFromProgenics') || undefined,
    labProcessStatus: get('labprocess_status', 'labProcessStatus') || get('lab_process_status', 'labProcessStatus') || undefined,
    bioinformaticsStatus: get('bioinformatics_status', 'bioinformaticsStatus') || get('bioinformaticsStatus', 'bioinformaticsStatus') || undefined,
    approvalFromFinance: get('approval_from_finance', 'approvalFromFinance') || get('approvalFromFinance', 'approvalFromFinance') || undefined,
    rawDataReceivedDate: get('raw_data_received_date', 'rawDataReceivedDate') || get('rawDataReceivedDate', 'rawDataReceivedDate') || undefined,
    nutritionSheetUpdate: get('nutrition_sheet_update', 'nutritionSheetUpdate') || get('nutritionSheetUpdate', 'nutritionSheetUpdate') || undefined,
    remark: get('remark', 'remark') || undefined,
    phlebotomistCharges: get('phlebotomist_charges', 'phlebotomistCharges') ?? undefined,
    amountQuoted: get('amount_quoted', 'amountQuoted') ?? get('amountQuoted', 'amountQuoted') ?? undefined,
    tat: get('tat', 'tat') ?? undefined,
    noOfSamples: get('no_of_samples', 'noOfSamples') ?? get('noOfSamples', 'noOfSamples') ?? (l.no_of_samples ?? l.noOfSamples) ?? undefined,
    _raw: l,
  };

  return normalized;
}

export default function ProcessMaster() {
  const formatUniqueId = (lead: any) => {
    if (!lead) return '-';
    // prefer explicit uniqueId from backend
    if (lead.uniqueId) return lead.uniqueId;
    // prefer projectId/title/sampleId if it already contains prefix
    const sample = lead.projectId ?? lead.sampleId ?? lead.id;
    if (!sample) return '-';
    const s = String(sample);
    // if it already has DG/PG prefix, return as-is
    if (/^(DG|PG)/i.test(s)) return s;
    // if it's numeric-looking and seems like a discovery sample, prefix DG
    if (/^\d{6,}$/.test(s)) return `DG${s}`;
    return s;
  };
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [filterType, setFilterType] = useState<'clinical' | 'discovery' | 'combined'>('combined');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: leads = [], isLoading } = useQuery<any[]>({ queryKey: ['/api/leads'], queryFn: async () => {
    const r = await apiRequest('GET', '/api/leads');
    return r.json();
  }});

  const { data: projectSamples = [], isLoading: psLoading } = useQuery<any[]>({ queryKey: ['/api/project-samples'], queryFn: async () => {
    try {
      const r = await apiRequest('GET', '/api/project-samples');
      return r.json();
    } catch (e) {
      return [];
    }
  }});

  const normalizedLeads = Array.isArray(leads) ? leads.map(normalizeLead) : [];
  const normalizeProjectSample = (ps: any) => {
    if (!ps) return ps;
    return {
      id: ps.id ?? ps.sample_id ?? ps.project_id ?? undefined,
      uniqueId: ps.project_id ?? ps.title_unique_id ?? ps.titleUniqueId ?? undefined,
      projectId: ps.project_id ?? undefined,
      sampleId: ps.sample_id ?? undefined,
      dateSampleCollected: ps.date_sample_collected ?? ps.sample_collected_date ?? ps.sampleCollectedDate ?? (ps.sample ? (ps.sample.date_sample_collected ?? ps.sample.sample_collected_date) : null) ?? null,
      sampleType: ps.sample_type ?? ps.sampleType ?? undefined,
      noOfSamples: ps.no_of_samples ?? ps.noOfSamples ?? undefined,
      // patient / client fields
      patientClientName: ps.patient_client_name ?? ps.patientClientName ?? ps.patient_name ?? ps.name ?? undefined,
      patientClientEmail: ps.patient_client_email ?? ps.patientClientEmail ?? ps.patient_email ?? undefined,
      patientClientPhone: ps.patient_client_phone ?? ps.patientClientPhone ?? ps.patient_phone ?? undefined,
      patientAddress: ps.patient_address ?? ps.patientAddress ?? ps.address ?? undefined,
      age: ps.age ?? undefined,
      gender: ps.gender ?? undefined,
      serviceName: ps.service_name ?? ps.serviceName ?? undefined,
      salesResponsiblePerson: ps.sales_responsible_person ?? ps.salesResponsiblePerson ?? undefined,
      followUp: ps.follow_up ?? ps.followUp ?? undefined,
      organization: ps.organization ?? ps.clinic_hospital_name ?? ps.clinic_name ?? ps.hospital_name ?? ps.org ?? ps.organisation ?? ps.organisation_hospital ?? undefined,
      referredDoctor: ps.clinician_name ?? ps.clinician_researcher_name ?? ps.referredDoctor ?? ps.referred_doctor ?? undefined,
      specialty: ps.specialty ?? ps.speciality ?? undefined,
      // third-party / report fields
      thirdPartyTRF: ps.third_party_trf ?? ps.thirdPartyTRF ?? undefined,
      report: ps.report ?? undefined,
      internalReportId: ps.internal_report_id ?? ps.internalReportId ?? undefined,
      thirdPartyReportName: ps.third_party_report_name ?? ps.thirdPartyReportName ?? undefined,
      dateSampleSentToThirdParty: ps.date_sample_sent_to_third_party ?? ps.dateSampleSentToThirdParty ?? ps.date_sample_sent ?? undefined,
      dateReportReleasedFromProgenics: ps.date_report_released_from_progenics ?? ps.dateReportReleasedFromProgenics ?? undefined,
      labProcessStatus: ps.labprocess_status ?? ps.lab_process_status ?? ps.labProcessStatus ?? undefined,
      bioinformaticsStatus: ps.bioinformatics_status ?? ps.bioinformaticsStatus ?? undefined,
      approvalFromFinance: ps.approval_from_finance ?? ps.approvalFromFinance ?? undefined,
      rawDataReceivedDate: ps.raw_data_received_date ?? ps.rawDataReceivedDate ?? undefined,
      nutritionSheetUpdate: ps.nutrition_sheet_update ?? ps.nutritionSheetUpdate ?? undefined,
      remark: ps.remark ?? undefined,
      // clinician / researcher contact info
      email: ps.clinician_org_email ?? ps.email ?? undefined,
      phone: ps.clinician_org_phone ?? ps.phone ?? undefined,
      clinicianAddress: ps.clinician_address ?? ps.clinic_hospital_address ?? ps.clinic_address ?? ps.clinician_org_address ?? ps.organisation_hospital ?? undefined,
      progenicsTRF: ps.progenics_trf ?? ps.progenicsTRF ?? undefined,
      createdAt: ps.created_at ?? ps.createdAt ?? null,
      convertedAt: ps.converted_at ?? ps.convertedAt ?? ps.created_at ?? null,
      _raw: ps,
    };
  };

  const normalizedProjectSamples = Array.isArray(projectSamples) ? projectSamples.map(normalizeProjectSample) : [];

  // merge leads and project samples, prefer project-samples when keys collide
  const mergedMap = new Map<string, any>();
  const keyFor = (l: any) => String(l.uniqueId ?? l.projectId ?? l.sampleId ?? l.id ?? '') ;
  normalizedLeads.forEach(l => { mergedMap.set(keyFor(l), l); });
  normalizedProjectSamples.forEach(ps => { mergedMap.set(keyFor(ps), ps); });
  const combinedLeads = Array.from(mergedMap.values());
  
  // Filter leads based on selected filter type
  const loading = isLoading || psLoading;
  const filteredLeads = (combinedLeads || normalizedLeads).filter((lead) => {
    // Apply type filter (Clinical/Discovery/Combined)
    if (filterType === 'clinical') {
      const sampleId = lead.sampleId?.toString().toUpperCase() || '';
      if (!sampleId.startsWith('PG')) return false;
    } else if (filterType === 'discovery') {
      const sampleId = lead.sampleId?.toString().toUpperCase() || '';
      if (!sampleId.startsWith('DG')) return false;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const sampleId = (lead.sampleId?.toString() || '').toLowerCase();
      const patientName = (lead.patientClientName || '').toLowerCase();
      const patientPhone = (lead.patientClientPhone || '').toLowerCase();
      
      return sampleId.includes(query) || 
             patientName.includes(query) || 
             patientPhone.includes(query);
    }
    
    return true;
  });
  
  const queryClient = useQueryClient();
  const { add } = useRecycle();
  const toastHook = useToast();
  const toast = toastHook?.toast || toastHook;

  useEffect(() => {
    if (selectedLead) {
      // shallow copy selected lead into formData
      setFormData({ ...selectedLead });
    } else {
      setFormData({});
    }
  }, [selectedLead]);

  const handleChange = (key: string, value: any) => {
    setFormData((s: any) => ({ ...(s || {}), [key]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedLead) return;
    setIsSaving(true);
    try {
      // If user selected a title separately, combine it with the clinician name
      const payload = { ...(formData || {}) };
      if (payload.referredDoctorTitle && payload.referredDoctor) {
        payload.referredDoctor = `${payload.referredDoctorTitle} ${payload.referredDoctor}`.trim();
        delete payload.referredDoctorTitle;
      }

      const res = await apiRequest('PUT', `/api/leads/${selectedLead.id}`, payload);
      const json = await res.json();
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      try { window.dispatchEvent(new Event('ll:recycle:update')); } catch (e) { /* ignore */ }
      try { toast && toast({ title: 'Saved', description: 'Lead updated' }); } catch (e) { /* ignore */ }
      setIsEditDialogOpen(false);
      setSelectedLead(null);
    } catch (err: any) {
      try { toast && toast({ title: 'Save failed', description: err?.message || 'Failed to save lead', variant: 'destructive' }); } catch (e) { /* ignore */ }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Filter Buttons */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Process Master Sheet</h1>
        
        <div className="flex space-x-4">
          <Button
            variant={filterType === 'clinical' ? 'default' : 'outline'}
            onClick={() => setFilterType('clinical')}
          >
            Clinical
          </Button>
          <Button
            variant={filterType === 'discovery' ? 'default' : 'outline'}
            onClick={() => setFilterType('discovery')}
          >
            Discovery
          </Button>
          <Button
            variant={filterType === 'combined' ? 'default' : 'outline'}
            onClick={() => setFilterType('combined')}
          >
            Combined
          </Button>
        </div>
      </div>
      
      {/* Search Filter */}
      <div className="w-full max-w-md">
        <Input
          placeholder="Search by Project ID, Patient Name, or Phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="border rounded-lg max-h-[70vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b-2">
                <TableRow>
                  <TableHead className="whitespace-nowrap font-semibold">Unique ID</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Project ID</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Sample  ID</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Sample Collected Date</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Sample Type</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">No of Samples</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Organization / Hospital</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Clinican / Researcher Name</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Specialty</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Clinican / Researcher Email </TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Clinican / Researcher Phone</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Patient / Client Name</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Patient / Client Address</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Age</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Gender</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Patient / Client Email</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Patient / Client Phone</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Service Name</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Sales / Responsible Person</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Logistics Status</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Progenics_TRF</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Third party_TRF</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Created At</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Updated At</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Report</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Report:Internal Report ID</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Third Party name</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Sample sent to Third Party Date</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Report Released from Progenics Date</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Labprocess Status</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Bioinformatics Status</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Finance Approval Status From Third Party</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Raw Data Received Date</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Nutrition Sheet Update</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Result Received From The Third Party Date</TableHead>
                  <TableHead className="whitespace-nowrap font-semibold">Remark/Comment</TableHead>
                  <TableHead className="sticky right-0 bg-white dark:bg-gray-900 border-l-2 whitespace-nowrap font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={40} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={40} className="text-center py-8">No records</TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                          <TableCell className="whitespace-nowrap">{formatUniqueId(lead)}</TableCell>
                          <TableCell className="whitespace-nowrap">{lead.projectId ?? lead.sampleId ?? '-'}</TableCell>
                          <TableCell className="whitespace-nowrap">{lead.sampleId ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.dateSampleCollected ? new Date(lead.dateSampleCollected).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.sampleType ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.noOfSamples != null ? String(lead.noOfSamples) : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.organization ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.referredDoctor ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.specialty ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.email ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.phone ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.location ?? lead.patientAddress ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.patientClientName ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.age != null ? String(lead.age) : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.gender ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.patientClientEmail ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.patientClientPhone ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.serviceName ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.salesResponsiblePerson ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.followUp ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.progenicsTRF ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">-</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">-</TableCell>
                      <TableCell className="whitespace-nowrap">-</TableCell>
                      <TableCell className="whitespace-nowrap">-</TableCell>
                      <TableCell className="whitespace-nowrap">-</TableCell>
                      <TableCell className="whitespace-nowrap">-</TableCell>
                      <TableCell className="whitespace-nowrap">-</TableCell>
                      <TableCell className="whitespace-nowrap">-</TableCell>
                      <TableCell className="whitespace-nowrap">-</TableCell>
                      <TableCell className="whitespace-nowrap">-</TableCell>
                      <TableCell className="whitespace-nowrap">-</TableCell>
                      <TableCell className="whitespace-nowrap">-</TableCell>
                      <TableCell className="whitespace-nowrap">{lead.remark ?? '-'}</TableCell>
                      <TableCell className="sticky right-0 bg-white dark:bg-gray-900 border-l-2">
                        <div className="flex space-x-2 items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 w-10 p-2 rounded-lg flex items-center justify-center"
                            onClick={() => { setSelectedLead(lead); setIsEditDialogOpen(true); }}
                            aria-label="Edit lead"
                          >
                            <Edit className="h-5 w-5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (!confirm('Move this lead to Recycle Bin?')) return;
                              try {
                                const now = new Date();
                                const deletedAt = now.toISOString();
                                add({
                                  entityType: 'lead',
                                  entityId: lead.id,
                                  name: `${lead.id || lead.sampleId || lead.patientClientName}`,
                                  originalPath: '/process-master',
                                  data: { ...lead, deletedAt },
                                  deletedAt,
                                }).catch(() => { /* ignore */ });
                              } catch (err) {
                                // ignore recycle failures
                              }

                              (async () => {
                                try {
                                  const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' });
                                  if (!res.ok) throw new Error('Delete failed');
                                  queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
                                  try { window.dispatchEvent(new Event('ll:recycle:update')); } catch(e) { /* ignore */ }
                                  try { toast && toast({ title: 'Moved to Recycle', description: 'Lead moved to recycle bin' }); } catch(e) { /* ignore */ }
                                  return;
                                } catch (e) {
                                  try { toast && toast({ title: 'Recycle saved locally', description: 'Server delete failed; saved locally', variant: 'destructive' }); } catch(e) { /* ignore */ }
                                }
                              })();
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription>Modify lead details. (Form implementation will be added.)</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {selectedLead ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Unique Id</Label>
                      <Input value={formData?.uniqueId ?? formData?.id ?? ''} readOnly />
                    </div>

                    <div>
                      <Label>Project ID</Label>
                      <Input value={formData?.sampleId ?? ''} onChange={(e) => handleChange('sampleId', e.target.value)} />
                    </div>

                    <div>
                      <Label>Sample Collected Date</Label>
                      <Input type="date" value={formData?.dateSampleCollected ? new Date(formData.dateSampleCollected).toISOString().slice(0,10) : ''} onChange={(e) => handleChange('dateSampleCollected', e.target.value)} />
                    </div>

                    <div>
                      <Label>Sample Type</Label>
                      <Input value={formData?.sampleType ?? ''} onChange={(e) => handleChange('sampleType', e.target.value)} />
                    </div>

                    <div>
                      <Label>No of Samples</Label>
                      <Input type="number" value={formData?.noOfSamples ?? ''} onChange={(e) => handleChange('noOfSamples', e.target.value ? Number(e.target.value) : '')} />
                    </div>

                    <div>
                      <Label>Organization / Hospital </Label>
                      <Input value={formData?.organization ?? ''} onChange={(e) => handleChange('organization', e.target.value)} />
                    </div>

                    <div>
                      <Label>Clinician / Researcher Name</Label>
                      <Select onValueChange={(v) => handleChange('referredDoctorName', v)} value={formData?.referredDoctorName ?? ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dr">Dr</SelectItem>
                          <SelectItem value="Mr">Mr</SelectItem>
                          <SelectItem value="Ms">Ms</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Clinician / Researcher Name</Label>
                      <Input value={formData?.referredDoctor ?? ''} onChange={(e) => handleChange('referredDoctor', e.target.value)} />
                    </div>

                    <div>
                      <Label>Specialty</Label>
                      <Input value={formData?.specialty ?? ''} onChange={(e) => handleChange('specialty', e.target.value)} />
                    </div>

                    <div>
                      <Label>Clinician / Researcher Email</Label>
                      <Input value={formData?.email ?? ''} onChange={(e) => handleChange('email', e.target.value)} />
                    </div>

                    <div>
                      <Label>Clinician / Researcher Phone</Label>
                      <Input value={formData?.phone ?? ''} onChange={(e) => handleChange('phone', e.target.value)} />
                    </div>

                    <div>
                      <Label>Clinician / Researcher Address</Label>
                      <Input value={formData?.location ?? ''} onChange={(e) => handleChange('location', e.target.value)} />
                    </div>

                    <div>
                      <Label>Patient / Client Name</Label>
                      <Input value={formData?.patientClientName ?? ''} onChange={(e) => handleChange('patientClientName', e.target.value)} />
                    </div>

                    <div>
                      <Label>Age</Label>
                      <Input type="number" value={formData?.age ?? ''} onChange={(e) => handleChange('age', e.target.value ? Number(e.target.value) : '')} />
                    </div>

                    <div>
                      <Label>Gender</Label>
                      <Select onValueChange={(v) => handleChange('gender', v)} value={formData?.gender ?? ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Patient / Client Email</Label>
                      <Input value={formData?.patientClientEmail ?? ''} onChange={(e) => handleChange('patientClientEmail', e.target.value)} />
                    </div>

                    <div>
                      <Label>Patient / Client Phone</Label>
                      <Input value={formData?.patientClientPhone ?? ''} onChange={(e) => handleChange('patientClientPhone', e.target.value)} />
                    </div>

                    <div>
                      <Label>Service name</Label>
                      <Input value={formData?.serviceName ?? ''} onChange={(e) => handleChange('serviceName', e.target.value)} />
                    </div>

                    <div>
                      <Label>Sales / Responsible person</Label>
                      <Input value={formData?.salesResponsiblePerson ?? ''} onChange={(e) => handleChange('salesResponsiblePerson', e.target.value)} />
                    </div>

                    <div>
                      <Label>Logistics update</Label>
                      <Input value={formData?.followUp ?? ''} onChange={(e) => handleChange('followUp', e.target.value)} />
                    </div>

                    <div>
                      <Label>Progenics_TRF</Label>
                      <Input value={formData?.progenicsTRF ?? ''} onChange={(e) => handleChange('progenicsTRF', e.target.value)} />
                    </div>

                    <div>
                      <Label>Third party_TRF</Label>
                      <Input value={formData?.thirdPartyTRF ?? ''} onChange={(e) => handleChange('thirdPartyTRF', e.target.value)} />
                    </div>

                    <div>
                      <Label>Created At</Label>
                      <Input type="date" value={formData?.createdAt ? new Date(formData.createdAt).toISOString().slice(0,10) : ''} onChange={(e) => handleChange('createdAt', e.target.value)} />
                    </div>

                     <div>
                      <Label>Updated At</Label>
                      <Input type="date" value={formData?.updatedAt ? new Date(formData.updatedAt).toISOString().slice(0,10) : ''} onChange={(e) => handleChange('updatedAt', e.target.value)} />
                    </div>

                    <div>
                      <Label>Report</Label>
                      <Input value={formData?.report ?? ''} onChange={(e) => handleChange('report', e.target.value)} />
                    </div>

                    <div>
                      <Label>Report: Internal report ID</Label>
                      <Input value={formData?.internalReportId ?? ''} onChange={(e) => handleChange('internalReportId', e.target.value)} />
                    </div>

                    <div>
                      <Label>Report: Third party name</Label>
                      <Input value={formData?.thirdPartyReportName ?? ''} onChange={(e) => handleChange('thirdPartyReportName', e.target.value)} />
                    </div>

                    <div>
                      <Label>Sample sent to third party date</Label>
                      <Input type="date" value={formData?.dateSampleSentToThirdParty ? new Date(formData.dateSampleSentToThirdParty).toISOString().slice(0,10) : ''} onChange={(e) => handleChange('dateSampleSentToThirdParty', e.target.value)} />
                    </div>

                    <div>
                      <Label>Report: Date of Report received to progenics date</Label>
                      <Input type="date" value={formData?.dateReportReceivedToProgenics ? new Date(formData.dateReportReceivedToProgenics).toISOString().slice(0,10) : ''} onChange={(e) => handleChange('dateReportReceivedToProgenics', e.target.value)} />
                    </div>

                    <div>
                      <Label>Labprocess status</Label>
                      <Input value={formData?.labProcessStatus ?? ''} onChange={(e) => handleChange('labProcessStatus', e.target.value)} />
                    </div>

                    <div>
                      <Label>Bioinformatics status</Label>
                      <Input value={formData?.bioinformaticsStatus ?? ''} onChange={(e) => handleChange('bioinformaticsStatus', e.target.value)} />
                    </div>

                    <div>
                      <Label>Finance Approval Status From Third Party</Label>
                      <Select onValueChange={(v) => handleChange('approvalFromFinance', v)} value={formData?.approvalFromFinance ?? ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Raw data received date</Label>
                      <Input type="date" value={formData?.rawDataReceivedDate ? new Date(formData.rawDataReceivedDate).toISOString().slice(0,10) : ''} onChange={(e) => handleChange('rawDataReceivedDate', e.target.value)} />
                    </div>

                    <div>
                      <Label>Nutrition Status</Label>
                      <Input value={formData?.nutritionSheetUpdate ?? ''} onChange={(e) => handleChange('nutritionSheetUpdate', e.target.value)} />
                    </div>

                     <div>
                      <Label>Result received from the third party date</Label>
                      <Input type="date" value={formData?.dateReportReleasedFromProgenics ? new Date(formData.dateReportReleasedFromProgenics).toISOString().slice(0,10) : ''} onChange={(e) => handleChange('dateReportReleasedFromProgenics', e.target.value)} />
                    </div>

                    <div className="col-span-2">
                      <Label>Remark / Comment</Label>
                      <Textarea value={formData?.remark ?? ''} onChange={(e) => handleChange('remark', e.target.value)} />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="ghost" onClick={() => { setIsEditDialogOpen(false); setSelectedLead(null); }}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                  </div>
                </form>
              ) : (
                <p>No lead selected</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}
