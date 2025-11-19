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
import { Eye, Edit, Truck, Package, Activity, Plus, MapPin, Building2, Trash2 } from "lucide-react";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Client-side search & pagination for samples table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  // Editable fields per user rule (Sample Tracking edit modal only)
  // Editable: Sample Delivery, Alert to Lab Process, Third Party Name, Third Party Contact Details,
  // Sample Sent to 3rd Party Date, Sample Received to 3rd Party Date
  // Make the main sample tracking fields editable in the Update dialog so the table columns map to dialog inputs
  const editableFields = new Set<string>([
    'UniqueId','sampleUniqueId','sampleCollectedDate','sampleShippedDate','sampleDeliveryDate',
    'responsiblePerson','organization','senderCity','senderContact','receiverAddress',
    'trackingId','trackingNumber','courierCompany','labAlertStatus',
    'thirdPartyName','thirdPartyContractDetails','thirdPartySentDate','thirdPartyReceivedDate',
    'comments',
    'thirdPartyLab','thirdPartyAddress','courierPartner','labDestination','pickupDate',
    'amount','shippingCost'
  ]);

  const { data: samples = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/logistic-sheet'],
    queryFn: async () => {
      const r = await fetch('/api/logistic-sheet');
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
        organization: l.organization ?? l.Organization,
        location: l.location ?? l.Location,
        testName: l.testName ?? l.test_name ?? l.TestName,
        category: l.category ?? l.Category,
        salesResponsiblePerson: l.salesResponsiblePerson ?? l.sales_responsible_person,
        phone: l.phone ?? l.Phone,
        pickupFrom: l.pickupFrom ?? l.pickup_from,
        email: l.email ?? l.Email,
        // Add all fallback fields needed for sample normalization
        dateSampleCollected: l.dateSampleCollected ?? l.date_sample_collected,
        dateSampleShipped: l.dateSampleShipped ?? l.date_sample_shipped,
        dateSampleReceived: l.dateSampleReceived ?? l.date_sample_received,
        pickupUpto: l.pickupUpto ?? l.pickup_upto,
        trackingId: l.trackingId ?? l.tracking_id,
        courierCompany: l.courierCompany ?? l.courier_company,
      };
    };

    const lead = normalizeLead(s.lead);
    return {
      id: get('id','id'),
      sampleId: get('sample_id','sampleId'),
      leadId: get('lead_id','leadId'),
      status: get('status','status'),
      courierDetails: get('courier_details','courierDetails'),
      amount: get('amount','amount'),
      paidAmount: get('paid_amount','paidAmount'),
      createdAt: get('created_at','createdAt'),
      sampleCollectionDate: get('sample_collection_date','sampleCollectionDate') || get('sample_collected_date','sampleCollectedDate') || get('sampleCollectedDate','sampleCollectedDate') || lead?.dateSampleCollected,
      receivedDate: get('received_date','receivedDate'),
      pickupLocation: get('pickup_location','pickupLocation') || get('pickup_location','pickupLocation') || get('pickupLocation','pickupLocation') || lead?.pickupFrom,
      deliveryAddress: get('delivery_address','deliveryAddress') || get('receiver_address','receiverAddress') || lead?.pickupUpto,
      courierService: get('courier_service','courierService'),
      trackingDetails: get('tracking_details','trackingDetails'),
      labDestination: get('lab_destination','labDestination'),
      thirdPartyLab: get('third_party_lab','thirdPartyLab'),
      thirdPartyAddress: get('third_party_address','thirdPartyAddress'),
      courierPartner: get('courier_partner','courierPartner'),
      pickupDate: get('pickup_date','pickupDate'),
      trackingNumber: get('tracking_number','trackingNumber') || get('tracking_id','trackingId') || get('trackingNumber','trackingNumber') || lead?.trackingId,
      shippingCost: get('shipping_cost','shippingCost') || get('shippingCost','shippingCost'),
      specialInstructions: get('special_instructions','specialInstructions'),
      sampleCollectionStatus: get('sample_collection_status','sampleCollectionStatus'),
      sampleCollectedDate: get('sample_collected_date','sampleCollectedDate') || get('sample_collection_date','sampleCollectionDate') || get('sampleCollectedDate','sampleCollectedDate') || lead?.dateSampleCollected,
      sampleShippedDate: get('sample_shipped_date','sampleShippedDate') || get('sampleShippedDate','sampleShippedDate') || lead?.dateSampleShipped,
      sampleDeliveryDate: get('sample_delivery_date','sampleDeliveryDate') || get('sampleDeliveryDate','sampleDeliveryDate') || lead?.dateSampleReceived,
      responsiblePerson: get('responsible_person','responsiblePerson') || lead?.salesResponsiblePerson,
      organization: get('organization','organization') || lead?.organization,
      senderCity: get('sender_city','senderCity') || get('senderCity','senderCity') || lead?.location,
      senderContact: get('sender_contact','senderContact') || get('senderContact','senderContact') || lead?.phone,
      receiverAddress: get('receiver_address','receiverAddress') || get('receiverAddress','receiverAddress') || lead?.pickupFrom,
      trackingId: get('tracking_id','trackingId') || get('trackingId','trackingId') || lead?.trackingId,
      courierCompany: get('courier_company','courierCompany') || get('courierCompany','courierCompany') || lead?.courierCompany,
      labAlertStatus: get('lab_alert_status','labAlertStatus'),
      thirdPartyName: get('third_party_name','thirdPartyName'),
      thirdPartyContractDetails: get('third_party_contract_details','thirdPartyContractDetails'),
      thirdPartySentDate: get('third_party_sent_date','thirdPartySentDate'),
      thirdPartyReceivedDate: get('third_party_received_date','thirdPartyReceivedDate'),
      comments: get('comments','comments'),
      UniqueId: get('unique_id','UniqueId') || lead?.id,
      sampleUniqueId: get('sample_unique_id','sampleUniqueId'),
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
      String(s.sampleId || '').toLowerCase().includes(sq) ||
      String(s.organization || s.lead?.organization || '').toLowerCase().includes(sq) ||
      String(s.trackingNumber || s.trackingId || s.trackingId || '').toLowerCase().includes(sq) ||
      String(s.senderContact || s.lead?.phone || '').toLowerCase().includes(sq)
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
      const response = await apiRequest('PUT', `/api/logistic-sheet/${sampleId}`, updates);
      return response.json();
    },
    onSuccess: () => {
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
      const response = await apiRequest('DELETE', `/api/logistic-sheet/${sampleId}`);
      return response.json();
    },
    onSuccess: () => {
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
              <Input placeholder="Search sample id / org / tracking / sender" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} />
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
            <div className="border rounded-lg max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b-2">
                  <TableRow>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('UniqueId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Unique ID{sortKey === 'titleUniqueId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('sampleId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Project ID{sortKey === 'projectId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('sampleCollectedDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sample Collected Date{sortKey === 'sampleCollectedDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('sampleShippedDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sample Shipped Date{sortKey === 'sampleShippedDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('sampleDeliveryDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sample Delivery Date{sortKey === 'sampleDeliveryDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[180px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('responsiblePerson'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sales / Responsible Person{sortKey === 'responsiblePerson' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[200px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('organization'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Organisation / Hospital{sortKey === 'organization' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead onClick={() => { setSortKey('senderCity'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="min-w-[150px] whitespace-nowrap font-semibold">Sample Pickup From{sortKey === 'senderCity' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead onClick={() => { setSortKey('senderContact'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="min-w-[150px] whitespace-nowrap font-semibold">Patient / Client Phone{sortKey === 'senderContact' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead onClick={() => { setSortKey('receiverAddress'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="min-w-[200px] whitespace-nowrap font-semibold">Delivery Upto{sortKey === 'receiverAddress' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('sampleDeliveryDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Sample Recevied Date{sortKey === 'sampleReceivedDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('trackingNumber'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Tracking ID{sortKey === 'trackingNumber' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="min-w-[150px] cursor-pointer whitespace-nowrap font-semibold" onClick={() => { setSortKey('courierCompany'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }}>Courier Company{sortKey === 'courierCompany' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead onClick={() => { setSortKey('labAlertStatus'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="min-w-[150px] whitespace-nowrap font-semibold">Alert to Lab Process{sortKey === 'labAlertStatus' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead onClick={() => { setSortKey('thirdPartyName'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="min-w-[180px] whitespace-nowrap font-semibold">Third Party Name{sortKey === 'thirdPartyName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead onClick={() => { setSortKey('thirdPartyContractDetails'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="min-w-[180px] whitespace-nowrap font-semibold">Third Party Contact{sortKey === 'thirdPartyContractDetails' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead onClick={() => { setSortKey('thirdPartySentDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="min-w-[150px] whitespace-nowrap font-semibold">Sample Sent to 3rd Party Date{sortKey === 'thirdPartySentDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead onClick={() => { setSortKey('thirdPartyReceivedDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="min-w-[150px] whitespace-nowrap font-semibold">Sample Received to 3rd party date{sortKey === 'thirdPartyReceivedDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead onClick={() => { setSortKey('comments'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="min-w-[220px] whitespace-nowrap font-semibold">Remark/Comment{sortKey === 'comments' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                    <TableHead className="sticky right-0 bg-white dark:bg-gray-900 border-l-2 whitespace-nowrap font-semibold min-w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSamples.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={40} className="text-center py-8 text-muted-foreground">
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
                      const balance = Number(sample.amount) - Number(sample.paidAmount);
                      const lead = sample.lead || {};
                      return (
                        <TableRow key={sample.id}>
                          <TableCell className="min-w-[150px] font-medium text-gray-900 dark:text-white">{sample.id ?? (sample as any).UniqueId ?? '-'}</TableCell>
                          <TableCell className="min-w-[150px] font-medium text-gray-900 dark:text-white">{sample.sampleId}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.sampleCollectedDate ? new Date(sample.sampleCollectedDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{(sample as any).sampleShippedDate ? new Date((sample as any).sampleShippedDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{(sample as any).sampleDeliveryDate ? new Date((sample as any).sampleDeliveryDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{sample.responsiblePerson || sample.lead?.salesResponsiblePerson || 'N/A'}</TableCell>
                          <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{sample.organization || sample.lead?.organization || 'N/A'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.senderCity || sample.lead?.location || 'N/A'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.senderContact || sample.lead?.phone || 'N/A'}</TableCell>
                          <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{sample.receiverAddress || sample.lead?.pickupFrom || '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.trackingNumber || sample.trackingId || 'N/A'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.courierCompany || sample.courierPartner || 'N/A'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.labAlertStatus || 'N/A'}</TableCell>
                          <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{sample.thirdPartyName || 'N/A'}</TableCell>
                          <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{sample.thirdPartyContractDetails || 'N/A'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.thirdPartySentDate ? new Date(sample.thirdPartySentDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{sample.thirdPartyReceivedDate ? new Date(sample.thirdPartyReceivedDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="min-w-[220px] text-gray-900 dark:text-white max-w-xs truncate">{sample.comments ?? (sample._raw && sample._raw.comments) ?? '-'}</TableCell>
                          <TableCell className="min-w-[150px]">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-10 w-10 p-2 rounded-lg flex items-center justify-center"
                                onClick={() => {
                                  setSelectedSample(sample);
                                  setDialogLabDestination((sample as any).labDestination || 'internal');
                                  setDialogCourierPartner((sample as any).courierPartner || '');
                                  setDialogLabAlertStatus((sample as any).labAlertStatus || 'pending');
                                  setIsUpdateDialogOpen(true);
                                }}
                                aria-label="Edit sample"
                              >
                                <Edit className="h-5 w-5" />
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
              <div className="p-4 flex items-center justify-between">
                <div>Showing {(start + 1) <= totalFiltered ? (start + 1) : 0} - {Math.min(start + pageSize, totalFiltered)} of {totalFiltered}</div>
                <div className="flex items-center space-x-2">
                  <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                  <div>Page {page} / {totalPages}</div>
                  <Button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
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
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Sample Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Sample ID:</span> {selectedSample.sampleId}</div>
                  <div><span className="font-medium">Organization:</span> {selectedSample.lead?.organization || 'N/A'}</div>
                  <div><span className="font-medium">Test Type:</span> {selectedSample.lead?.testName || 'N/A'}</div>
                  <div><span className="font-medium">Category:</span> {selectedSample.lead?.category || 'N/A'}</div>

                  {/* New fields for sample tracking */}
                  <div>
                    <Label htmlFor="UniqueId">ID</Label>
                    <Input id="UniqueId" value={(selectedSample as any).id || ''} disabled readOnly />
                  </div>

                  <div>
                    <Label htmlFor="sampleUniqueId">Sample ID</Label>
                    <Input id="sampleUniqueId" defaultValue={(selectedSample as any).sampleUniqueId || (selectedSample as any).sampleId || ''} disabled={!editableFields.has('sampleUniqueId')} readOnly />
                  </div>

                  <div>
                    <Label htmlFor="sampleCollectedDate">Sample Collected Date</Label>
                    <Input id="sampleCollectedDate" type="datetime-local" defaultValue={(selectedSample as any).sampleCollectedDate ? new Date((selectedSample as any).sampleCollectedDate).toISOString().slice(0,16) : ''} disabled={!editableFields.has('sampleCollectedDate')} />
                  </div>

                  <div>
                    <Label htmlFor="sampleShippedDate">Sample Shipped Date</Label>
                    <Input id="sampleShippedDate" type="datetime-local" defaultValue={(selectedSample as any).sampleShippedDate ? new Date((selectedSample as any).sampleShippedDate).toISOString().slice(0,16) : ''} disabled={!editableFields.has('sampleShippedDate')} />
                  </div>

                  <div>
                    <Label htmlFor="sampleDeliveryDate">Sample Delivery Date</Label>
                    <Input id="sampleDeliveryDate" type="datetime-local" defaultValue={(selectedSample as any).sampleDeliveryDate ? new Date((selectedSample as any).sampleDeliveryDate).toISOString().slice(0,16) : ''} disabled={!editableFields.has('sampleDeliveryDate')} />
                  </div>

                  <div>
                    <Label htmlFor="responsiblePerson">Responsible Person</Label>
                    <Input id="responsiblePerson" defaultValue={(selectedSample as any).responsiblePerson || ''} disabled={!editableFields.has('responsiblePerson')} />
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount (INR)</Label>
                    <Input id="amount" type="number" step="0.01" defaultValue={(selectedSample as any).amount ?? ''} />
                  </div>

                  <div>
                    <Label htmlFor="organization">Organization</Label>
                    <Input id="organization" defaultValue={(selectedSample as any).organization || ''} disabled={!editableFields.has('organization')} />
                  </div>

                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Lab Routing</h4>

                  <div>
                    <Label htmlFor="labDestination">Lab Destination</Label>
                    {editableFields.has('labDestination') ? (
                      <Select value={dialogLabDestination} onValueChange={(v) => setDialogLabDestination(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Lab Destination" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Internal Lab</SelectItem>
                          <SelectItem value="third_party">Third Party Lab</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={dialogLabDestination} readOnly />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="thirdPartyLab">Third Party Lab Name</Label>
                    <Input
                      id="thirdPartyLab"
                      placeholder="e.g., Advanced Genomics Lab"
                      defaultValue={(selectedSample as any).thirdPartyLab || ''}
                      disabled={!editableFields.has('thirdPartyLab')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="thirdPartyAddress">Third Party Lab Address</Label>
                    <Textarea
                      id="thirdPartyAddress"
                      placeholder="Complete address of third party lab"
                      defaultValue={(selectedSample as any).thirdPartyAddress || ''}
                      rows={3}
                      disabled={!editableFields.has('thirdPartyAddress')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="thirdPartyName">Third Party Name</Label>
                    <Input id="thirdPartyName" defaultValue={(selectedSample as any).thirdPartyName || ''} disabled={!editableFields.has('thirdPartyName')} />
                  </div>

                  <div>
                    <Label htmlFor="thirdPartyContractDetails">Third Party Contract Details</Label>
                    <Textarea id="thirdPartyContractDetails" defaultValue={(selectedSample as any).thirdPartyContractDetails || ''} rows={3} disabled={!editableFields.has('thirdPartyContractDetails')} />
                  </div>

                  <div>
                    <Label htmlFor="thirdPartySentDate">Third Party Sent Date</Label>
                    <Input id="thirdPartySentDate" type="datetime-local" defaultValue={(selectedSample as any).thirdPartySentDate ? new Date((selectedSample as any).thirdPartySentDate).toISOString().slice(0,16) : ''} disabled={!editableFields.has('thirdPartySentDate')} />
                  </div>

                  <div>
                    <Label htmlFor="thirdPartyReceivedDate">Third Party Received Date</Label>
                    <Input id="thirdPartyReceivedDate" type="datetime-local" defaultValue={(selectedSample as any).thirdPartyReceivedDate ? new Date((selectedSample as any).thirdPartyReceivedDate).toISOString().slice(0,16) : ''} disabled={!editableFields.has('thirdPartyReceivedDate')} />
                  </div>

                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Courier & Tracking</h4>

                  <div>
                    <Label htmlFor="courierPartner">Courier Company</Label>
                      {editableFields.has('courierPartner') ? (
                        <Select value={dialogCourierPartner} onValueChange={(v) => setDialogCourierPartner(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Courier Partner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dhl">DHL</SelectItem>
                            <SelectItem value="fedex">FedEx</SelectItem>
                            <SelectItem value="bluedart">Blue Dart</SelectItem>
                            <SelectItem value="dtdc">DTDC</SelectItem>
                            <SelectItem value="professional">Professional Couriers</SelectItem>
                            <SelectItem value="local">Local Courier</SelectItem>
                            <SelectItem value="own_transport">Own Transport</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={dialogCourierPartner} readOnly />
                      )}
                  </div>

                  <div>
                    <Label htmlFor="pickupDate">Pickup Date</Label>
                    <Input
                      id="pickupDate"
                      type="datetime-local"
                      defaultValue={(selectedSample as any).pickupDate ?
                        new Date((selectedSample as any).pickupDate).toISOString().slice(0, 16) : ''}
                    />
                  </div>

                  <div>
                    <Label htmlFor="trackingNumber">Tracking Number</Label>
                    <Input
                      id="trackingNumber"
                      placeholder="e.g., DHL123456789"
                      defaultValue={(selectedSample as any).trackingNumber || ''}
                    />
                  </div>

                  <div>
                    <Label htmlFor="shippingCost">Shipping Cost (INR)</Label>
                    <Input
                      id="shippingCost"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 500"
                      defaultValue={(selectedSample as any).shippingCost || ''}
                    />
                  </div>

                  <div>
                    <Label htmlFor="labAlertStatus">Lab Alert Status</Label>
                    {editableFields.has('labAlertStatus') ? (
                      <Select value={dialogLabAlertStatus} onValueChange={(v) => setDialogLabAlertStatus(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="alerted">Alerted</SelectItem>
                          <SelectItem value="acknowledged">Acknowledged</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={dialogLabAlertStatus} readOnly />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="trackingId">Tracking ID</Label>
                    <Input id="trackingId" defaultValue={(selectedSample as any).trackingId || ''} disabled={!editableFields.has('trackingId')} />
                  </div>

                  <div>
                    <Label htmlFor="courierCompany">Courier Company</Label>
                    <Input id="courierCompany" defaultValue={(selectedSample as any).courierCompany || ''} disabled={!editableFields.has('courierCompany')} />
                  </div>

                  <div>
                    <Label htmlFor="senderCity">Sender City</Label>
                    <Input id="senderCity" defaultValue={(selectedSample as any).senderCity || ''} disabled={!editableFields.has('senderCity')} />
                  </div>

                  <div>
                    <Label htmlFor="senderContact">Sender Contact</Label>
                    <Input id="senderContact" defaultValue={(selectedSample as any).senderContact || ''} disabled={!editableFields.has('senderContact')} />
                  </div>

                  <div>
                    <Label htmlFor="receiverAddress">Receiver Address</Label>
                    <Textarea id="receiverAddress" defaultValue={(selectedSample as any).receiverAddress || ''} rows={3} disabled={!editableFields.has('receiverAddress')} />
                  </div>

                  {/* Special instructions - ensure this control exists so updates include it */}
                  <div>
                    <Label htmlFor="specialInstructions">Special Instructions</Label>
                    <Textarea id="specialInstructions" defaultValue={(selectedSample as any).specialInstructions || ''} rows={3} />
                  </div>

                  <div>
                    <Label htmlFor="comments">Remark / Comment</Label>
                    <Textarea id="comments" defaultValue={(selectedSample as any).comments || ''} rows={3} disabled={!editableFields.has('comments')} />
                  </div>

                  <div>
                    <Label htmlFor="responsiblePerson">Responsible Person</Label>
                    <Input id="responsiblePerson" defaultValue={(selectedSample as any).responsiblePerson || ''} disabled={!editableFields.has('responsiblePerson')} />
                  </div>

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
                    sampleUniqueId: raw('sampleUniqueId'),
                    sampleCollectedDate: isoDate('sampleCollectedDate'),
                    sampleShippedDate: isoDate('sampleShippedDate'),
                    sampleDeliveryDate: isoDate('sampleDeliveryDate'),
                    responsiblePerson: raw('responsiblePerson'),
                    organization: raw('organization'),
                    senderCity: raw('senderCity'),
                    senderContact: raw('senderContact'),
                    receiverAddress: raw('receiverAddress'),
                    trackingId: raw('trackingId'),
                    courierCompany: raw('courierCompany'),
                    labAlertStatus: dialogLabAlertStatus || undefined,
                    thirdPartyName: raw('thirdPartyName'),
                    thirdPartyContractDetails: raw('thirdPartyContractDetails'),
                    thirdPartySentDate: isoDate('thirdPartySentDate'),
                    thirdPartyReceivedDate: isoDate('thirdPartyReceivedDate'),
                    labDestination: dialogLabDestination || undefined,
                    thirdPartyLab: raw('thirdPartyLab'),
                    thirdPartyAddress: raw('thirdPartyAddress'),
                    courierPartner: dialogCourierPartner || undefined,
                    pickupDate: isoDate('pickupDate'),
                    trackingNumber: raw('trackingNumber'),
                    shippingCost: formatDecimal(raw('shippingCost')),
                    amount: formatDecimal(raw('amount')),
                    specialInstructions: raw('specialInstructions'),
                    comments: raw('comments'),
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
                  {updateSampleMutation.isPending ? "Updating..." : "Update Sample"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
