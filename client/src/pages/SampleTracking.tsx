import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatINR } from "@/components/ui/currency-input";
import { useRecycle } from '@/contexts/RecycleContext';
import { Eye, Edit, Truck, Package, Activity, Plus, MapPin, Building2, Trash2, AlertCircle } from "lucide-react";
import type { SampleWithLead } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMemo } from "react";

export default function SampleTracking() {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [dialogLabDestination, setDialogLabDestination] = useState<string>('internal');
  const [dialogCourierPartner, setDialogCourierPartner] = useState<string>('');
  const [dialogLabAlertStatus, setDialogLabAlertStatus] = useState<string>('pending');
  const [uploadedThirdPartyReport, setUploadedThirdPartyReport] = useState<string | null>(null);
  const [uploadedThirdPartyTrf, setUploadedThirdPartyTrf] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Client-side search & pagination for samples table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  // Editable fields per user rule (Sample Tracking edit modal only)
  // Editable: Sample Delivery, Alert to Lab Process, Third Party Name, Third Party Phone,
  // Sample Sent to 3rd Party Date, Sample Received to 3rd Party Date
  const editableFields = new Set<string>([
    'sampleCollectionDate', 'sampleShippedDate', 'sampleDeliveryDate',
    'samplePickUpFrom', 'deliveryUpTo', 'trackingId', 'courierCompany', 'sampleShipmentAmount',
    'salesResponsiblePerson', 'thirdPartyName', 'thirdPartyPhone', 'sampleSentToThirdPartyDate', 'sampleReceivedToThirdPartyDate',
    'alertToLabprocessTeam', 'remarkComment'
  ]);

  const { data: samples = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/sample-tracking'],
    queryFn: async () => {
      const r = await fetch('/api/sample-tracking');
      if (!r.ok) throw new Error('Failed to fetch logistic sheet');
      return r.json();
    }
  });

  // Normalize incoming sample records to a consistent camelCase shape that the UI expects.
  // Accept both snake_case and camelCase API responses.
  function normalizeSample(s: any) {
    if (!s) return s;
    const get = (snake: string, camel: string) => {
      if (s[camel] !== undefined) return s[camel];
      if (s[snake] !== undefined) return s[snake];
      return undefined;
    };

    // Normalize the nested lead object if it exists (handle both snake_case and camelCase)
    const normalizeLead = (l: any) => {
      if (!l) return undefined;
      return {
        id: l.id,
        organisationHospital: l.organisationHospital ?? l.organisation_hospital,
        clinicianResearcherName: l.clinicianResearcherName ?? l.clinician_researcher_name,
        clinicianResearcherPhone: l.clinicianResearcherPhone ?? l.clinician_researcher_phone,
        clinicianResearcherAddress: l.clinicianResearcherAddress ?? l.clinician_researcher_address,
        patientClientName: l.patientClientName ?? l.patient_client_name,
        patientClientPhone: l.patientClientPhone ?? l.patient_client_phone,
        sampleCollectionDate: l.sampleCollectionDate ?? l.sample_collection_date,
        sampleShippedDate: l.sampleShippedDate ?? l.sample_shipped_date,
        sampleDeliveryDate: l.sampleDeliveryDate ?? l.sample_delivery_date ?? l.deliveryUpTo ?? l.delivery_up_to,
        sampleReceivedDate: l.sampleReceivedDate ?? l.sample_recevied_date,
        deliveryUpTo: l.deliveryUpTo ?? l.delivery_up_to,
        samplePickUpFrom: l.samplePickUpFrom ?? l.sample_pick_up_from,
        trackingId: l.trackingId ?? l.tracking_id,
        courierCompany: l.courierCompany ?? l.courier_company,
        salesResponsiblePerson: l.salesResponsiblePerson ?? l.sales_responsible_person,
        remarkComment: l.remarkComment ?? l.remark_comment,
      };
    };

    const lead = normalizeLead(s.lead);
    return {
      id: get('id', 'id'),
      uniqueId: get('unique_id', 'uniqueId'),
      projectId: get('project_id', 'projectId'),
      sampleCollectionDate: get('sample_collection_date', 'sampleCollectionDate') || lead?.sampleCollectionDate,
      sampleShippedDate: get('sample_shipped_date', 'sampleShippedDate') || lead?.sampleShippedDate,
      sampleDeliveryDate: get('sample_delivery_date', 'sampleDeliveryDate') || lead?.sampleDeliveryDate,
      samplePickUpFrom: get('sample_pick_up_from', 'samplePickUpFrom') || lead?.samplePickUpFrom,
      deliveryUpTo: get('delivery_up_to', 'deliveryUpTo') || lead?.deliveryUpTo,
      trackingId: get('tracking_id', 'trackingId') || lead?.trackingId,
      courierCompany: get('courier_company', 'courierCompany') || lead?.courierCompany,
      sampleShipmentAmount: get('sample_shipment_amount', 'sampleShipmentAmount'),
      organisationHospital: get('organisation_hospital', 'organisationHospital') || lead?.organisationHospital,
      clinicianResearcherName: get('clinician_researcher_name', 'clinicianResearcherName') || lead?.clinicianResearcherName,
      clinicianResearcherPhone: get('clinician_researcher_phone', 'clinicianResearcherPhone') || lead?.clinicianResearcherPhone,
      patientClientName: get('patient_client_name', 'patientClientName') || lead?.patientClientName,
      patientClientPhone: get('patient_client_phone', 'patientClientPhone') || lead?.patientClientPhone,
      sampleReceivedDate: get('sample_recevied_date', 'sampleReceivedDate') || lead?.sampleReceivedDate,
      salesResponsiblePerson: get('sales_responsible_person', 'salesResponsiblePerson') || lead?.salesResponsiblePerson,
      thirdPartyName: get('third_party_name', 'thirdPartyName'),
      thirdPartyPhone: get('third_party_phone', 'thirdPartyPhone'),
      sampleSentToThirdPartyDate: get('sample_sent_to_third_party_date', 'sampleSentToThirdPartyDate'),
      sampleReceivedToThirdPartyDate: get('sample_received_to_third_party_date', 'sampleReceivedToThirdPartyDate'),
      alertToLabprocessTeam: get('alert_to_labprocess_team', 'alertToLabprocessTeam'),
      createdAt: get('created_at', 'createdAt'),
      createdBy: get('created_by', 'createdBy'),
      remarkComment: get('remark_comment', 'remarkComment') || lead?.remarkComment,
      // keep raw as backup
      _raw: s,
      // Normalize and keep original lead object if present
      lead,
    };
  }

  const normalizedSamples = useMemo(() => Array.isArray(samples) ? samples.map(normalizeSample) : [], [samples]);

  // Sorting state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // derived filtering & pagination for samples (computed in component scope)
  const filteredSamples = normalizedSamples.filter((s) => {
    if (statusFilter && statusFilter !== 'all' && String(s.status) !== String(statusFilter)) return false;
    if (!searchQuery) return true;
    const sq = searchQuery.toLowerCase();
    return (
      (String(s.uniqueId || '')).toLowerCase().includes(sq) ||
      (String(s.projectId || '')).toLowerCase().includes(sq) ||
      (String(s.patientClientName || '')).toLowerCase().includes(sq) ||
      (String(s.patientClientPhone || '')).toLowerCase().includes(sq)
    );
  });

  const totalFiltered = filteredSamples.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  if (page > totalPages) setPage(totalPages);
  const start = (page - 1) * pageSize;

  // Apply sorting if requested
  const sortedSamples = (() => {
    if (!sortKey) return filteredSamples;
    const copy = [...filteredSamples];
    copy.sort((a: any, b: any) => {
      const A = a[sortKey];
      const B = b[sortKey];
      if (A == null && B == null) return 0;
      if (A == null) return sortDir === 'asc' ? -1 : 1;
      if (B == null) return sortDir === 'asc' ? 1 : -1;
      if (typeof A === 'number' && typeof B === 'number') return sortDir === 'asc' ? A - B : B - A;
      const sA = String(A).toLowerCase();
      const sB = String(B).toLowerCase();
      if (sA < sB) return sortDir === 'asc' ? -1 : 1;
      if (sA > sB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  })();

  const visibleSamples = sortedSamples.slice(start, start + pageSize);

  const updateSampleMutation = useMutation({
    mutationFn: async ({ sampleId, updates }: { sampleId: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/sample-tracking/${sampleId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sample-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      setIsUpdateDialogOpen(false);
      toast({
        title: "Sample updated",
        description: "Sample tracking information has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update sample",
        variant: "destructive",
      });
    },
  });

  const deleteSampleMutation = useMutation({
    mutationFn: async ({ sampleId }: { sampleId: string }) => {
      const response = await apiRequest('DELETE', `/api/sample-tracking/${sampleId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sample-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      toast({ title: 'Sample deleted', description: 'Sample has been deleted' });
      // Notify recycle UI to refresh (server snapshots deleted samples)
      window.dispatchEvent(new Event('ll:recycle:update'));
    },
    onError: (error: any) => {
      toast({ title: 'Delete failed', description: error.message || 'Failed to delete sample', variant: 'destructive' });
    }
  });

  // Alert to Lab Process mutation
  const alertLabProcessMutation = useMutation({
    mutationFn: async (sample: any) => {
      // First, mark the sample as alerted in sample tracking
      await apiRequest('PUT', `/api/sample-tracking/${sample.id}`, {
        alertToLabprocessTeam: true,
      });

      // Then call the alert lab process endpoint which handles routing based on project ID
      // Send sample delivery date to populate sample_received_date in lab processing
      const response = await apiRequest('POST', '/api/alert-lab-process', {
        sampleId: sample.sampleId,
        projectId: sample.projectId,
        uniqueId: sample.uniqueId,
        sampleDeliveryDate: sample.sampleDeliveryDate,
        sampleType: sample.sampleType,
        serviceType: sample.serviceType,
        patientName: sample.patientClientName,
        age: sample.patientAge,
        gender: sample.patientGender,
        clinicianName: sample.clinicianResearcherName,
        organization: sample.organisationHospital,
        speciality: sample.speciality,
        budget: sample.budget,
        status: 'Initiated',
        comments: sample.remarkComment,
        labProcessingTeam: null,
        createdBy: sample.createdBy,
        createdAt: new Date(),
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sample-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
      queryClient.invalidateQueries({ queryKey: ['/api/labprocess-discovery-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/labprocess-clinical-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/labprocess-discovery'] });
      queryClient.invalidateQueries({ queryKey: ['/api/labprocess-clinical'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      toast({
        title: "Alert Sent",
        description: `Lab process record created. Sample has been alerted to Lab Process team.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Alert failed",
        description: error.message || "Failed to alert lab process team",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'report' | 'trf') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Map file type to API category
      const category = type === 'report' ? 'Thirdparty_Report' : 'Thirdparty_TRF';
      const sampleId = selectedSample?.id || 'new';
      
      // Use the new categorized API endpoint
      const res = await fetch(`/api/uploads/categorized?category=${category}&entityType=sample&entityId=${sampleId}`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      // Store the file path from the new API response
      if (type === 'report') {
        setUploadedThirdPartyReport(data.filePath);
      } else {
        setUploadedThirdPartyTrf(data.filePath);
      }
      
      console.log('✅ File uploaded successfully:', {
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

  const { add } = useRecycle();

  const getStatusCounts = () => {
    return {
      pickup_scheduled: samples.filter(s => s.status === 'pickup_scheduled').length,
      in_transit: samples.filter(s => s.status === 'in_transit').length,
      received: samples.filter(s => s.status === 'received').length,
      lab_processing: samples.filter(s => s.status === 'lab_processing').length,
      bioinformatics: samples.filter(s => s.status === 'bioinformatics').length,
      reporting: samples.filter(s => s.status === 'reporting').length,
      completed: samples.filter(s => s.status === 'completed').length,
    };
  };

  const statusCounts = getStatusCounts();

  const statusCards = [
    {
      title: "Pickup Scheduled",
      value: statusCounts.pickup_scheduled,
      icon: Package,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: "In Transit",
      value: statusCounts.in_transit,
      icon: Truck,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Received",
      value: statusCounts.received,
      icon: Activity,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "In Processing",
      value: statusCounts.lab_processing + statusCounts.bioinformatics + statusCounts.reporting,
      icon: Activity,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      pickup_scheduled: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      in_transit: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      received: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      lab_processing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      bioinformatics: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      reporting: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return variants[status as keyof typeof variants] || variants.pickup_scheduled;
  };

  const getStatusText = (status: string) => {
    const texts = {
      pickup_scheduled: "Pickup Scheduled",
      in_transit: "In Transit",
      received: "Received",
      lab_processing: "Lab Processing",
      bioinformatics: "Bioinformatics",
      reporting: "Reporting",
      completed: "Completed",
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading samples...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sample Tracking</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track sample pickup, courier details, and processing status
        </p>
      </div>

      {/* Sample Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6 text-center">
                <div className={`inline-flex p-3 rounded-lg ${card.bgColor} mb-3`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Samples Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sample Tracking Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search, status filter and page size controls */}
          <div className="p-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Input placeholder="Search Unique ID / Project ID / Patient Name / Phone" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} />
              <Select onValueChange={(v) => { setStatusFilter(v); setPage(1); }} value={statusFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pickup_scheduled">Pickup Scheduled</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="lab_processing">Lab Processing</SelectItem>
                  <SelectItem value="bioinformatics">Bioinformatics</SelectItem>
                  <SelectItem value="reporting">Reporting</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label>Page size</Label>
              <Select onValueChange={(v) => { setPageSize(parseInt(v || '25', 10)); setPage(1); }} value={String(pageSize)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="border rounded-lg max-h-[60vh] overflow-x-auto leads-table-wrapper process-table-wrapper">
              <Table className="leads-table">
                <TableHeader className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b-2">
                  <TableRow>
                    <TableHead className="min-w-[120px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('uniqueId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Unique ID{sortKey === 'uniqueId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[120px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('projectId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Project ID{sortKey === 'projectId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('sampleCollectionDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sample Collection Date{sortKey === 'sampleCollectionDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('sampleShippedDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sample Shipped Date{sortKey === 'sampleShippedDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('sampleDeliveryDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sample Delivery Date{sortKey === 'sampleDeliveryDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('samplePickUpFrom'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sample Pick Up From{sortKey === 'samplePickUpFrom' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[130px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('deliveryUpTo'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Delivery Up To{sortKey === 'deliveryUpTo' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[120px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('trackingId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Tracking ID{sortKey === 'trackingId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[130px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('courierCompany'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Courier Company{sortKey === 'courierCompany' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('sampleShipmentAmount'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sample Shipment Amount{sortKey === 'sampleShipmentAmount' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('organisationHospital'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Organisation/Hospital{sortKey === 'organisationHospital' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('clinicianResearcherName'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Clinician/Researcher Name{sortKey === 'clinicianResearcherName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('clinicianResearcherPhone'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Clinician/Researcher Phone{sortKey === 'clinicianResearcherPhone' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('patientClientName'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Patient/Client Name{sortKey === 'patientClientName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('patientClientPhone'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Patient/Client Phone{sortKey === 'patientClientPhone' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('sampleReceivedDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sample Received Date{sortKey === 'sampleReceivedDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('salesResponsiblePerson'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sales/Responsible Person{sortKey === 'salesResponsiblePerson' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('thirdPartyName'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Third Party Name{sortKey === 'thirdPartyName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('thirdPartyPhone'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Third Party Phone{sortKey === 'thirdPartyPhone' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('sampleSentToThirdPartyDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sample Sent to Third Party Date{sortKey === 'sampleSentToThirdPartyDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('sampleReceivedToThirdPartyDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sample Received to Third Party Date{sortKey === 'sampleReceivedToThirdPartyDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('alertToLabprocessTeam'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Alert to Labprocess Team{sortKey === 'alertToLabprocessTeam' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('createdAt'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Created At{sortKey === 'createdAt' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('createdBy'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Created By{sortKey === 'createdBy' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[200px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('remarkComment'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Remark/Comment{sortKey === 'remarkComment' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="bg-white dark:bg-gray-900 border-l-2 border-gray-200 dark:border-gray-700 z-[5] whitespace-nowrap font-semibold min-w-[100px] actions-column">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSamples.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={26} className="text-center py-8 text-muted-foreground">
                        {filteredSamples.length === 0 ? (
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No samples found</h3>
                            <p className="text-gray-500 dark:text-gray-400">Samples will appear here once leads are converted</p>
                          </div>
                        ) : (
                          <div>No records match your search criteria</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleSamples.map((sample) => {
                      return (
                        <TableRow key={sample.id} className={`${sample.alertToLabprocessTeam ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'} hover:bg-opacity-75 dark:hover:bg-opacity-75 cursor-pointer`}>
                          <TableCell className="min-w-[120px] font-medium text-gray-900 dark:text-white">{sample.uniqueId ?? sample.id ?? '-'}</TableCell>
                          <TableCell className="min-w-[120px] text-gray-900 dark:text-white">{sample.projectId ?? '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.sampleCollectionDate ? new Date(sample.sampleCollectionDate).toLocaleDateString() : sample.lead?.sampleCollectionDate ? new Date(sample.lead.sampleCollectionDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.sampleShippedDate ? new Date(sample.sampleShippedDate).toLocaleDateString() : sample.lead?.sampleShippedDate ? new Date(sample.lead.sampleShippedDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.sampleDeliveryDate ? new Date(sample.sampleDeliveryDate).toLocaleDateString() : sample.lead?.sampleDeliveryDate ? new Date(sample.lead.sampleDeliveryDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.samplePickUpFrom || sample.lead?.samplePickUpFrom || '-'}</TableCell>
                          <TableCell className="min-w-[130px] text-gray-900 dark:text-white">{sample.deliveryUpTo ? new Date(sample.deliveryUpTo).toLocaleDateString() : sample.lead?.deliveryUpTo ? new Date(sample.lead.deliveryUpTo).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="min-w-[120px] text-gray-900 dark:text-white">{sample.trackingId || '-'}</TableCell>
                          <TableCell className="min-w-[130px] text-gray-900 dark:text-white">{sample.courierCompany || sample.lead?.courierCompany || '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.sampleShipmentAmount ? `₹${formatINR(Number(sample.sampleShipmentAmount))}` : '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.organisationHospital || sample.lead?.organisationHospital || '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.clinicianResearcherName || sample.lead?.clinicianResearcherName || '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.clinicianResearcherPhone || sample.lead?.clinicianResearcherPhone || '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.patientClientName || sample.lead?.patientClientName || '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.patientClientPhone || sample.lead?.patientClientPhone || '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.sampleReceivedDate ? new Date(sample.sampleReceivedDate).toLocaleDateString() : sample.lead?.sampleReceivedDate ? new Date(sample.lead.sampleReceivedDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.salesResponsiblePerson || sample.lead?.salesResponsiblePerson || '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.thirdPartyName || '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.thirdPartyPhone || '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.sampleSentToThirdPartyDate ? new Date(sample.sampleSentToThirdPartyDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.sampleReceivedToThirdPartyDate ? new Date(sample.sampleReceivedToThirdPartyDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.alertToLabprocessTeam ? 'Yes' : 'No'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.createdAt ? new Date(sample.createdAt).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{typeof sample.createdBy === 'object' ? (sample.createdBy as any)?.name ?? '-' : sample.createdBy ?? '-'}</TableCell>
                          <TableCell className="min-w-[200px] text-gray-900 dark:text-white max-w-xs truncate">{sample.remarkComment || sample.lead?.remarkComment || sample._raw?.remark_comment || '-'}</TableCell>
                          <TableCell className={`min-w-[100px] border-l-2 border-gray-200 dark:border-gray-700 z-[4] ${sample.alertToLabprocessTeam ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                            <div className="action-buttons flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-10 w-10 p-2 rounded-lg flex items-center justify-center"
                                onClick={() => {
                                  setSelectedSample(sample);
                                  setDialogLabDestination((sample as any).labDestination || 'internal');
                                  setDialogCourierPartner((sample as any).courierPartner || '');
                                  setDialogLabAlertStatus((sample as any).labAlertStatus || 'pending');
                                  setUploadedThirdPartyReport((sample as any).thirdPartyReport || null);
                                  setUploadedThirdPartyTrf((sample as any).thirdPartyTrf || null);
                                  setIsUpdateDialogOpen(true);
                                }}
                                aria-label="Edit sample"
                              >
                                <Edit className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all font-medium text-sm ${sample.alertToLabprocessTeam
                                  ? 'bg-red-500 hover:bg-red-600 text-white cursor-not-allowed'
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                                  } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                                onClick={() => {
                                  alertLabProcessMutation.mutate(sample);
                                }}
                                disabled={alertLabProcessMutation.isPending || sample.alertToLabprocessTeam}
                                title={sample.alertToLabprocessTeam ? 'Already sent for processing' : 'Send sample for processing'}
                                aria-label="Send For Processing"
                              >
                                {sample.alertToLabprocessTeam ? 'Sent ✓' : 'Send For Processing'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (!confirm('Delete this sample? This action cannot be undone.')) return;
                                  deleteSampleMutation.mutate({ sampleId: sample.id });
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination controls */}
            {visibleSamples.length > 0 && (
              <div className="p-4 border-t">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    Showing {(start + 1) <= totalFiltered ? (start + 1) : 0} - {Math.min(start + pageSize, totalFiltered)} of {totalFiltered}
                  </div>

                  <div className="flex items-center space-x-2 justify-end pagination-controls">
                    <Button size="sm" className="flex-shrink-0 min-w-[64px]" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                      Prev
                    </Button>
                    <div className="whitespace-nowrap flex-shrink-0 px-2">Page {page} / {totalPages}</div>
                    <Button size="sm" className="flex-shrink-0 min-w-[64px]" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sample Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Sample Tracking</DialogTitle>
            <DialogDescription>
              Update lab routing, courier details, and tracking information
            </DialogDescription>
          </DialogHeader>
          {selectedSample && (
            <div className="space-y-6">
              {/* Sample Collection & Dates Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium mb-4">Sample Collection & Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sampleCollectionDate">Sample Collection Date</Label>
                    <Input id="sampleCollectionDate" type="datetime-local" defaultValue={(selectedSample as any).sampleCollectionDate ? new Date((selectedSample as any).sampleCollectionDate).toISOString().slice(0, 16) : ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="sampleShippedDate">Sample Shipped Date</Label>
                    <Input id="sampleShippedDate" type="datetime-local" defaultValue={(selectedSample as any).sampleShippedDate ? new Date((selectedSample as any).sampleShippedDate).toISOString().slice(0, 16) : ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="sampleDeliveryDate">Sample Delivery Date</Label>
                    <Input id="sampleDeliveryDate" type="datetime-local" defaultValue={(selectedSample as any).sampleDeliveryDate ? new Date((selectedSample as any).sampleDeliveryDate).toISOString().slice(0, 16) : ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="samplePickUpFrom">Sample Pick Up From (Address)</Label>
                    <Input id="samplePickUpFrom" placeholder="Pickup address" defaultValue={selectedSample.samplePickUpFrom || selectedSample.lead?.samplePickUpFrom || ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="deliveryUpTo">Delivery Up To (Deadline)</Label>
                    <Input id="deliveryUpTo" type="date" defaultValue={selectedSample.deliveryUpTo ? new Date(selectedSample.deliveryUpTo).toISOString().split('T')[0] : selectedSample.lead?.deliveryUpTo ? new Date(selectedSample.lead.deliveryUpTo).toISOString().split('T')[0] : ''} disabled readOnly />
                  </div>
                </div>
              </div>

              {/* Tracking & Courier Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium mb-4">Tracking & Courier Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trackingId">Tracking ID</Label>
                    <Input id="trackingId" defaultValue={(selectedSample as any).trackingId || ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="courierCompany">Courier Company</Label>
                    <Input id="courierCompany" defaultValue={(selectedSample as any).courierCompany || ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="shippingCost">Sample Shipment Amount (INR)</Label>
                    <Input id="shippingCost" type="number" step="0.01" placeholder="e.g., 500" defaultValue={(selectedSample as any).shippingCost || ''} disabled readOnly />
                  </div>
                </div>
              </div>

              {/* Organisation & Contact Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium mb-4">Organisation & Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organisationHospital">Organisation/Hospital</Label>
                    <Input id="organisationHospital" defaultValue={selectedSample.organisationHospital || selectedSample.lead?.organisationHospital || ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="clinicianResearcherName">Clinician/Researcher Name</Label>
                    <Input id="clinicianResearcherName" defaultValue={selectedSample.clinicianResearcherName || selectedSample.lead?.clinicianResearcherName || ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="clinicianResearcherPhone">Clinician/Researcher Phone</Label>
                    <Input id="clinicianResearcherPhone" defaultValue={selectedSample.clinicianResearcherPhone || selectedSample.lead?.clinicianResearcherPhone || ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="patientClientName">Patient/Client Name</Label>
                    <Input id="patientClientName" defaultValue={selectedSample.patientClientName || selectedSample.lead?.patientClientName || ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="patientClientPhone">Patient/Client Phone</Label>
                    <Input id="patientClientPhone" defaultValue={selectedSample.patientClientPhone || selectedSample.lead?.patientClientPhone || ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="sampleReceivedDate">Sample Received Date</Label>
                    <Input id="sampleReceivedDate" type="date" defaultValue={selectedSample.sampleReceivedDate ? new Date(selectedSample.sampleReceivedDate).toISOString().split('T')[0] : ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="salesResponsiblePerson">Sales/Responsible Person</Label>
                    <Input id="salesResponsiblePerson" defaultValue={(selectedSample as any).salesResponsiblePerson || selectedSample.lead?.salesResponsiblePerson || ''} />
                  </div>
                </div>
              </div>

              {/* Third Party Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium mb-4">Third Party Lab Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="thirdPartyName">Third Party Name</Label>
                    <Input id="thirdPartyName" defaultValue={(selectedSample as any).thirdPartyName || ''} />
                  </div>

                  <div>
                    <Label htmlFor="thirdPartyPhone">Third Party Phone</Label>
                    <Input id="thirdPartyPhone" placeholder="Phone number" defaultValue={(selectedSample as any).thirdPartyPhone || ''} />
                  </div>

                  <div>
                    <Label htmlFor="sampleSentToThirdPartyDate">Sample Sent to Third Party Date</Label>
                    <Input id="sampleSentToThirdPartyDate" type="datetime-local" defaultValue={(selectedSample as any).sampleSentToThirdPartyDate ? new Date((selectedSample as any).sampleSentToThirdPartyDate).toISOString().slice(0, 16) : ''} />
                  </div>

                  <div>
                    <Label htmlFor="sampleReceivedToThirdPartyDate">Sample Received to Third Party Date</Label>
                    <Input id="sampleReceivedToThirdPartyDate" type="datetime-local" defaultValue={(selectedSample as any).sampleReceivedToThirdPartyDate ? new Date((selectedSample as any).sampleReceivedToThirdPartyDate).toISOString().slice(0, 16) : ''} />
                  </div>

                  <div>
                    <Label>Third Party Report</Label>
                    <div className="flex gap-2 items-center">
                      <Input value={uploadedThirdPartyReport || ''} readOnly placeholder="Upload a file" />
                      <Input type="file" className="w-[200px]" onChange={(e) => handleFileUpload(e, 'report')} accept=".pdf" />
                    </div>
                  </div>

                  <div>
                    <Label>Third Party TRF</Label>
                    <div className="flex gap-2 items-center">
                      <Input value={uploadedThirdPartyTrf || ''} readOnly placeholder="Upload a file" />
                      <Input type="file" className="w-[200px]" onChange={(e) => handleFileUpload(e, 'trf')} accept=".pdf" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lab Alert & System Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium mb-4">Lab Alert & System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="alertToLabprocessTeam">Alert to Lab Process Team</Label>
                    {selectedSample.alertToLabprocessTeam ? (
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-300 font-medium">
                        ✓ Already sent for processing
                      </div>
                    ) : (
                      <Select value={dialogLabAlertStatus} onValueChange={(v) => setDialogLabAlertStatus(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="createdAt">Created At</Label>
                    <Input id="createdAt" type="text" value={selectedSample.createdAt ? new Date(selectedSample.createdAt).toLocaleString() : ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="createdBy">Created By</Label>
                    <Input id="createdBy" type="text" value={typeof selectedSample.createdBy === 'object' ? (selectedSample.createdBy as any)?.name ?? '-' : selectedSample.createdBy ?? ''} disabled readOnly />
                  </div>
                </div>
              </div>

              {/* Remarks Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium mb-4">Remarks & Comments</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="remarkComment">Remark/Comment</Label>
                    <Textarea id="remarkComment" placeholder="Add any remarks or comments" defaultValue={(selectedSample as any).remarkComment || ''} rows={4} />
                  </div>
                </div>
              </div>

              {/* Additional Fields (hidden from view but still editable) */}
              <div className="hidden">
                <div>
                  <Label htmlFor="thirdPartyContractDetails">Third Party Contract Details</Label>
                  <Textarea id="thirdPartyContractDetails" defaultValue={(selectedSample as any).thirdPartyContractDetails || ''} rows={3} disabled={!editableFields.has('thirdPartyContractDetails')} />
                </div>
                <div>
                  <Label htmlFor="thirdPartyLab">Third Party Lab</Label>
                  <Input id="thirdPartyLab" placeholder="e.g., Advanced Genomics Lab" defaultValue={(selectedSample as any).thirdPartyLab || ''} />
                </div>
                <div>
                  <Label htmlFor="thirdPartyAddress">Third Party Lab Address</Label>
                  <Textarea id="thirdPartyAddress" placeholder="Complete address of third party lab" defaultValue={(selectedSample as any).thirdPartyAddress || ''} rows={3} />
                </div>
                <div>
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea id="specialInstructions" placeholder="Any special handling instructions" defaultValue={(selectedSample as any).specialInstructions || ''} rows={4} />
                </div>
                <div>
                  <Label htmlFor="trackingNumber">Tracking Number</Label>
                  <Input id="trackingNumber" placeholder="e.g., DHL123456789" defaultValue={(selectedSample as any).trackingNumber || ''} />
                </div>
                <div>
                  <Label htmlFor="senderContact">Sender Contact</Label>
                  <Input id="senderContact" defaultValue={(selectedSample as any).senderContact || ''} disabled={!editableFields.has('senderContact')} />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={updateSampleMutation.isPending} onClick={() => {
                  if (!selectedSample) return;

                  // helper to read input value and return undefined for empty strings
                  const raw = (id: string) => {
                    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
                    if (!el) return undefined;
                    const v = (el as HTMLInputElement).value;
                    if (v == null) return undefined;
                    const s = String(v).trim();
                    return s === '' ? undefined : s;
                  };

                  // helper to convert datetime-local value to full ISO string
                  const isoDate = (id: string) => {
                    const v = raw(id);
                    if (!v) return undefined;
                    // datetime-local inputs are local without timezone, e.g. 2025-10-17T10:30
                    // Construct a Date from the local components and return ISO string
                    // Use split to avoid Date parsing quirks
                    try {
                      // If input already contains seconds or timezone, Date will handle it
                      if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-].+)?/.test(v)) {
                        const d = new Date(v);
                        if (!isNaN(d.getTime())) return d.toISOString();
                      }

                      const parts = v.split('T');
                      if (parts.length === 2) {
                        const [datePart, timePart] = parts;
                        const timeParts = timePart.split(':');
                        const hh = Number(timeParts[0] || '0');
                        const mm = Number(timeParts[1] || '0');
                        const ss = Number(timeParts[2] || '0');
                        // construct a Date in local timezone
                        const [y, m, d] = datePart.split('-').map((n) => Number(n));
                        const dateObj = new Date(y, (m || 1) - 1, d, hh, mm, ss);
                        if (!isNaN(dateObj.getTime())) return dateObj.toISOString();
                      }
                    } catch (e) {
                      // fallthrough to undefined
                    }
                    return undefined;
                  };

                  const formatDecimal = (v: any) => {
                    if (v == null) return undefined;
                    // if already a string, trim and ensure it's a valid decimal-like string
                    if (typeof v === 'string') {
                      const s = v.trim();
                      if (s === '') return undefined;
                      // normalize to two decimals when possible
                      const n = Number(s);
                      if (!isNaN(n)) return n.toFixed(2);
                      return s;
                    }
                    if (typeof v === 'number') {
                      return v.toFixed(2);
                    }
                    return undefined;
                  };

                  const updates: any = {
                    // Sample Collection & Dates
                    sampleCollectionDate: isoDate('sampleCollectionDate'),
                    sampleShippedDate: isoDate('sampleShippedDate'),
                    sampleDeliveryDate: isoDate('sampleDeliveryDate'),
                    // Tracking & Courier
                    trackingId: raw('trackingId'),
                    courierCompany: raw('courierCompany'),
                    sampleShipmentAmount: raw('shippingCost'),
                    // Organisation & Contact
                    salesResponsiblePerson: raw('salesResponsiblePerson'),
                    // Third Party
                    thirdPartyName: raw('thirdPartyName'),
                    thirdPartyPhone: raw('thirdPartyPhone'),
                    sampleSentToThirdPartyDate: isoDate('sampleSentToThirdPartyDate'),
                    sampleReceivedToThirdPartyDate: isoDate('sampleReceivedToThirdPartyDate'),
                    thirdPartyReport: uploadedThirdPartyReport,
                    thirdPartyTrf: uploadedThirdPartyTrf,
                    // Lab Alert - PRESERVE existing alert status if already sent
                    alertToLabprocessTeam: selectedSample.alertToLabprocessTeam ? true : (dialogLabAlertStatus === 'yes'),
                    // Remarks
                    remarkComment: raw('remarkComment'),
                    // hidden fields
                    thirdPartyContractDetails: raw('thirdPartyContractDetails'),
                    thirdPartyLab: raw('thirdPartyLab'),
                    thirdPartyAddress: raw('thirdPartyAddress'),
                    specialInstructions: raw('specialInstructions'),
                    trackingNumber: raw('trackingNumber'),
                    senderContact: raw('senderContact'),
                  };

                  // remove undefined keys and empty strings
                  Object.keys(updates).forEach(k => {
                    const v = updates[k];
                    if (v === undefined) delete updates[k];
                    if (typeof v === 'string' && v.trim() === '') delete updates[k];
                  });

                  // debug log the payload (visible in browser console)
                  // eslint-disable-next-line no-console
                  console.debug('Sample update payload (client):', updates);

                  updateSampleMutation.mutate({ sampleId: selectedSample.id, updates });
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
