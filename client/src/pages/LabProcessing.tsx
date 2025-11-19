import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { insertLabProcessingSchema, type LabProcessingWithSample } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Eye, Edit, FlaskConical, TestTube, Microscope, Activity, Trash2 } from "lucide-react";
import { useRecycle } from '@/contexts/RecycleContext';

const labFormSchema = insertLabProcessingSchema.extend({
  dnaRnaQuantity: z.number().optional(),
  approvedToBioinformatics: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

type LabFormData = z.infer<typeof labFormSchema>;

export default function LabProcessing() {
  const [showOutsourceDetails, setShowOutsourceDetails] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState<LabProcessingWithSample | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // Lab type filter: 'all' | 'clinical' | 'discovery'
  const [labTypeFilter, setLabTypeFilter] = useState<'all' | 'clinical' | 'discovery'>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Fetch both discovery and clinical lab process sheets and merge them
  const { data: discoveryRows = [] } = useQuery<any[]>({ queryKey: ['/api/lab-process/discovery'], queryFn: async () => { const r = await fetch('/api/lab-process/discovery'); if (!r.ok) throw new Error('Failed'); return r.json(); } });
  const { data: clinicalRows = [] } = useQuery<any[]>({ queryKey: ['/api/lab-process/clinical'], queryFn: async () => { const r = await fetch('/api/lab-process/clinical'); if (!r.ok) throw new Error('Failed'); return r.json(); } });
  const labQueue = Array.isArray(discoveryRows) || Array.isArray(clinicalRows) ? ([...(discoveryRows || []), ...(clinicalRows || [])]) : [];
  const isLoading = false;

  // Mapping between frontend table labels / UI fields and database columns
  // This mapping documents which DB column corresponds to each UI column and
  // is used as reference when normalizing API responses or creating queries.
  const labProcessingFieldMap: Record<string, string> = {
    // Title / Unique ID => title_unique_id
    'Id': 'id',
    // Sample ID => sample_id
    'sampleId': 'sample_id',
    // Sample Delivery Date => sample_delivery_date
    'sampleDeliveryDate': 'sample_delivery_date',
    // Sample Type => sample_type
    'sampleType': 'sample_type',
    // Service Name => service_name
    'serviceName': 'service_name',
    // Patient Name => NOT present in lab_processing table (usually comes from related lead or sample table)
    'patientName': '',
    // Protocol1 (DNA Extraction) => protocol_1
    'protocol1': 'protocol_1',
    // Isolation => isolation_method
    'isolationMethod': 'isolation_method',
    // Quality Check 2 => quality_check_2
    'qualityCheck2': 'quality_check_2',
    // Purification Protocol => purification_protocol
    'purificationProtocol': 'purification_protocol',
    // Quality Check of Product => product_quality_check
    'productQualityCheck': 'product_quality_check',
    // Status (Library Preparation) => status_library_preparation
    'statusLibraryPreparation': 'status_library_preparation',
    // Transit Status => transit_status
    'transitStatus': 'transit_status',
    // Finance Approval => finance_approval
    'financeApproval': 'finance_approval',
    // Complete Status => complete_status
    'completeStatus': 'complete_status',
    // Progenics TRF => progenics_trf
    'progenicsTrf': 'progenics_trf',
    // Protocol (Other) => protocol_2
    'protocol2': 'protocol_2',
    // QC Status => qc_status
    'qcStatus': 'qc_status',
  };

  // Normalize lab processing records returned by the API into a stable shape.
  // The API may return camelCase fields (e.g., sampleDeliveryDate) or snake_case from DB.
  function normalizeLab(l: any) {
    if (!l) return l;
    const get = (snake: string, camel: string) => {
      if (l[camel] !== undefined) return l[camel];
      if (l[snake] !== undefined) return l[snake];
      // some fields are present on nested sample: check there too
      if (l.sample && l.sample[camel] !== undefined) return l.sample[camel];
      if (l.sample && l.sample[snake] !== undefined) return l.sample[snake];
      return undefined;
    };

    const sample = l.sample || {};
    const lead = sample.lead || {};

    return {
      id: get('id','id') ?? l.id,
      titleUniqueId: get('title_unique_id','titleUniqueId') ?? sample.titleUniqueId ?? sample.title_unique_id ?? lead.id ?? undefined,
      sampleId: get('sample_id','sampleId') ?? sample.sampleId ?? sample.sample_id ?? undefined,
      sampleDeliveryDate: get('sample_delivery_date','sampleDeliveryDate') ?? sample.sampleDeliveryDate ?? sample.sample_delivery_date ?? sample.sampleCollectedDate ?? sample.sample_collected_date ?? null,
      sampleType: get('sample_type','sampleType') ?? sample.sampleType ?? sample.sample_type ?? lead.sampleType ?? lead.sample_type ?? undefined,
      serviceName: get('service_name','serviceName') ?? sample.serviceName ?? sample.service_name ?? lead.serviceName ?? lead.service_name ?? undefined,
      patientName: lead.patientClientName ?? lead.patient_client_name ?? undefined,
      protocol1: get('protocol_1','protocol1') ?? (l as any).protocol1 ?? undefined,
      isolationMethod: get('isolation_method','isolationMethod') ?? (l as any).isolationMethod ?? undefined,
      qualityCheckDNA: get('quality_check_dna','qualityCheckDNA') ?? (l as any).qualityCheckDNA ?? undefined,
      statusDNAExtraction: get('status_dna_extraction','statusDNAExtraction') ?? (l as any).statusDNAExtraction ?? undefined,
      qualityCheck2: get('quality_check_2','qualityCheck2') ?? (l as any).qualityCheck2 ?? undefined,
      purificationProtocol: get('purification_protocol','purificationProtocol') ?? (l as any).purificationProtocol ?? undefined,
      productQualityCheck: get('product_quality_check','productQualityCheck') ?? (l as any).productQualityCheck ?? undefined,
      statusLibraryPreparation: get('status_library_preparation','statusLibraryPreparation') ?? (l as any).statusLibraryPreparation ?? undefined,
      libraryPreparationProtocol: get('library_preparation_protocol','libraryPreparationProtocol') ?? (l as any).libraryPreparationProtocol ?? undefined,
      transitStatus: get('transit_status','transitStatus') ?? (l as any).transitStatus ?? undefined,
      financeApproval: get('finance_approval','financeApproval') ?? (l as any).financeApproval ?? undefined,
      completeStatus: get('complete_status','completeStatus') ?? (l as any).completeStatus ?? undefined,
      progenicsTrf: get('progenics_trf','progenicsTrf') ?? (l as any).progenicsTrf ?? lead.progenicsTRF ?? lead.progenics_trf ?? undefined,
      protocol2: get('protocol_2','protocol2') ?? (l as any).protocol2 ?? undefined,
      qcStatus: get('qc_status','qcStatus') ?? (l as any).qcStatus ?? null,
      labId: get('lab_id','labId') ?? (l as any).labId ?? undefined,
      dnaRnaQuantity: get('dna_rna_quantity','dnaRnaQuantity') ?? (l as any).dnaRnaQuantity ?? undefined,
      approvedToBioinformatics: get('approved_to_bioinformatics','approvedToBioinformatics') ?? (l as any).approvedToBioinformatics ?? false,
      // keep original raw with full nested structure
      _raw: l,
      sample,
      lead,
    };
  }

  const normalizedLabs = useMemo(() => Array.isArray(labQueue) ? labQueue.map(normalizeLab) : [], [labQueue]);

  // Add client-side sorting state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Filter lab processing records based on search and status (use normalized shape)
  // New behavior: only match by ID or Sample ID (case-insensitive)
  const filteredLabs = normalizedLabs.filter((lab) => {
    // Apply status filter
    if (statusFilter && statusFilter !== 'all' && lab.qcStatus !== statusFilter) {
      return false;
    }

    // Apply lab type filter (category on the lead/sample)
    if (labTypeFilter && labTypeFilter !== 'all') {
      const category = (lab.sample && lab.sample.lead && (lab.sample.lead.category || lab.sample.lead.type)) || (lab.lead && (lab.lead.category || lab.lead.type)) || (lab._raw && lab._raw.category) || 'clinical';
      if (String(category).toLowerCase() !== labTypeFilter) return false;
    }

    // If no search, keep the record
    if (!searchQuery) return true;

    const q = String(searchQuery).toLowerCase();
    const idMatches = String(lab.id ?? '').toLowerCase().includes(q) || String(lab.titleUniqueId ?? '').toLowerCase().includes(q);
    const sampleMatches = String(lab.sampleId ?? '').toLowerCase().includes(q) || String(lab.sample?.sampleId ?? '').toLowerCase().includes(q) || String(lab.sample?.sample_id ?? '').toLowerCase().includes(q);

    return idMatches || sampleMatches;
  });

  // Pagination + sorting calculations
  const totalFiltered = filteredLabs.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  if (page > totalPages) setPage(totalPages);
  const start = (page - 1) * pageSize;

  const sortedLabs = (() => {
    if (!sortKey) return filteredLabs;
    const copy = [...filteredLabs];
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

  const visibleLabs = sortedLabs.slice(start, start + pageSize);

  const CLINICAL_HEADER_COUNT = 22;
  const DISCOVERY_HEADER_COUNT = 25;
  const DEFAULT_HEADER_COUNT = 20;

  const getStatusCounts = () => ({
    passed: labQueue.filter(l => l.qcStatus === 'passed').length,
    failed: labQueue.filter(l => l.qcStatus === 'failed').length,
    retest_required: labQueue.filter(l => l.qcStatus === 'retest_required').length,
    outsourced: labQueue.filter(l => l.isOutsourced).length,
  });

  const statusCounts = getStatusCounts();

  const statusCards = [
    { title: "QC Passed", value: statusCounts.passed, icon: TestTube, color: "text-green-600 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-900/20" },
    { title: "QC Failed", value: statusCounts.failed, icon: FlaskConical, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-900/20" },
    { title: "Retest Required", value: statusCounts.retest_required, icon: Microscope, color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-50 dark:bg-yellow-900/20" },
    { title: "Outsourced", value: statusCounts.outsourced, icon: Activity, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
  ];

  const getQCStatusBadge = (status: string | null | undefined) => {
    const variants = {
      passed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      retest_required: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    };
    const key = status ?? 'passed';
    return variants[key as keyof typeof variants] || variants.passed;
  };

  const getQCStatusText = (status: string | null | undefined) => {
    const texts = {
      passed: "Passed",
      failed: "Failed",
      retest_required: "Retest Required",
    };
    const key = status ?? 'passed';
    return texts[key as keyof typeof texts] || String(status);
  };

  const createLabProcessingMutation = useMutation({
    mutationFn: async (data: LabFormData) => {
      const response = await apiRequest('POST', '/api/lab-processing', { ...data, processedBy: user?.id });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-processing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      form.reset();
      setIsCreateDialogOpen(false);
      toast({ title: "Lab processing updated", description: "Sample processing information has been saved" });
    },
  });

  const form = useForm<LabFormData>({
    resolver: zodResolver(labFormSchema),
    defaultValues: {
      sampleId: '', labId: '', qcStatus: 'passed', libraryPrepared: false, isOutsourced: false,
      titleUniqueId: '', sampleDeliveryDate: undefined, serviceName: '', protocol1: '', isolationMethod: '',
      qualityCheckDNA: '', statusDNAExtraction: '', protocol2: '', libraryPreparationProtocol: '', qualityCheck2: '',
      purificationProtocol: '', productQualityCheck: '', statusLibraryPreparation: '', transitStatus: '',
      financeApproval: '', completeStatus: '', progenicsTrf: '',
    },
  });

  // Edit form — keep same shape as create but allow partials
  const editForm = useForm<Partial<LabFormData>>({
    defaultValues: {
      sampleId: '',
      labId: '',
      qcStatus: 'passed',
      libraryPrepared: false,
      isOutsourced: false,
      titleUniqueId: '',
      sampleDeliveryDate: undefined,
      serviceName: '',
      protocol1: '',
      isolationMethod: '',
      qualityCheckDNA: '',
      statusDNAExtraction: '',
      protocol2: '',
      libraryPreparationProtocol: '',
      qualityCheck2: '',
      purificationProtocol: '',
      productQualityCheck: '',
      statusLibraryPreparation: '',
      transitStatus: '',
      financeApproval: '',
      completeStatus: '',
      progenicsTrf: '',
      dnaRnaQuantity: undefined,
      approvedToBioinformatics: false,
    },
  });

  const updateLabMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/lab-processing/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-processing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      setIsEditDialogOpen(false);
      setSelectedLab(null);
      toast({ title: 'Lab processing updated', description: 'Record updated successfully' });
    },
  });

  const deleteLabMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await apiRequest('DELETE', `/api/lab-processing/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-processing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      toast({ title: 'Lab record deleted', description: 'Record has been deleted' });
      // Notify recycle UI to refresh (server snapshots deleted lab records)
      window.dispatchEvent(new Event('ll:recycle:update'));
    },
    onError: (error: any) => {
      toast({ title: 'Delete failed', description: error.message || 'Failed to delete record', variant: 'destructive' });
    }
  });

  const { add } = useRecycle();

  // Editable fields per user rule (Lab Processing edit modal only)
  const labEditable = new Set<string>([
    'protocol1','isolationMethod','qualityCheckDNA','statusDNAExtraction','protocol2','libraryPreparationProtocol','qualityCheck2','purificationProtocol','productQualityCheck','statusLibraryPreparation','transitStatus','completeStatus',
    // allow editing of sample type and patient name from the edit dialog
    'sampleType','patientName','serviceName','progenicsTrf','financeApproval','approvedToBioinformatics','created_at','updated_at'
  ]);

  const onSubmit = (data: LabFormData) => {
    const processedData: any = { ...data, outsourceDetails: showOutsourceDetails ? data.outsourceDetails : null };
    ['dnaRnaQuantity','concentration','purity','volume','processingTime','temperature','humidity'].forEach(k => {
      if (processedData[k] != null) processedData[k] = String(processedData[k]);
    });
    createLabProcessingMutation.mutate(processedData);
  };

  const handleOutsourceChange = (checked: boolean) => {
    setShowOutsourceDetails(checked);
    form.setValue('isOutsourced', checked);
  };

  return (
    <div className="space-y-8">
      {/* Header and Add Dialog */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lab Processing</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage lab processing, QC, and data entry</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              className={labTypeFilter === 'clinical' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
              aria-pressed={labTypeFilter === 'clinical'}
              onClick={() => setLabTypeFilter(labTypeFilter === 'clinical' ? 'all' : 'clinical')}
            >
              Clinical
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={labTypeFilter === 'discovery' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
              aria-pressed={labTypeFilter === 'discovery'}
              onClick={() => setLabTypeFilter(labTypeFilter === 'discovery' ? 'all' : 'discovery')}
            >
              Discovery
            </Button>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6 text-center">
                <div className={`inline-flex p-3 rounded-lg ${card.bgColor} mb-3`}><Icon className={`h-6 w-6 ${card.color}`} /></div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lab Processing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lab Processing Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search and Filter Controls */}
          <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center space-x-2">
                <Input 
                  placeholder="Search by ID or Sample ID" 
                  value={searchQuery} 
                  onChange={(e) => { 
                    setSearchQuery(e.target.value); 
                    setPage(1); // Reset to first page when searching
                  }} 
                />
              <Select 
                onValueChange={(v) => { 
                  setStatusFilter(v); 
                  setPage(1); // Reset to first page when filtering
                }} 
                value={statusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="QC Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="retest_required">Retest Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Label>Page size</Label>
              <Select 
                onValueChange={(v) => { 
                  setPageSize(parseInt(v || '25', 10)); 
                  setPage(1); // Reset to first page when changing page size
                }} 
                value={String(pageSize)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">Loading lab processing data...</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white/95 dark:bg-gray-900/95 z-10 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    {labTypeFilter === 'clinical' ? (
                      <TableRow>
                        <TableHead className="whitespace-nowrap font-semibold">Sample ID</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Unique ID</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Sample type</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Service Name</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Sample Received Date</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Extraction Protocol</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Extraction Status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Quality Check Extraction</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Extraction QC Status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Library preparation Protocol</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Library preparation</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Quality Check Library preparation</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Library preparation Status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Purification protocol</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Quality Check Purifications</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Purification QC Status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Purification Status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Created At</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Updated At</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Transit status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Finance status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Alert Technical Team</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Progenics TRF</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Remark/Comment</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Actions</TableHead>
                      </TableRow>
                    ) : labTypeFilter === 'discovery' ? (
                      <TableRow>
                        <TableHead className="whitespace-nowrap font-semibold">Unique ID</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Project ID</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Client ID</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Sample ID</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">No of samples</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Sample type</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Service Name</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Sample Received Date</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Extraction Protocol</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Extraction Status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Quality Check Extraction</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Extraction QC Status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Library preparation Protocol</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Library preparation Status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Quality Check Library</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Library QC Status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Purification protocol</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Quality Check Purification</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Purification QC Status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Transit Status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Finance Status</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Alert Technical Team</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Created At</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Updated At</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Progenics TRF</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Remark/Comment</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold">Actions</TableHead>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableHead colSpan={4} className="whitespace-nowrap font-semibold text-left text-gray-600">Select "Clinical" or "Discovery" to view the corresponding table</TableHead>
                      </TableRow>
                    )}
                  </TableHeader>
                  <TableBody>
                    {labTypeFilter === 'all' ? (
                      <TableRow>
                        <TableCell colSpan={DEFAULT_HEADER_COUNT} className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">Select "Clinical" or "Discovery" to view the corresponding table</p>
                        </TableCell>
                      </TableRow>
                    ) : visibleLabs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={labTypeFilter === 'clinical' ? CLINICAL_HEADER_COUNT : DISCOVERY_HEADER_COUNT} className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">
                            {filteredLabs.length === 0 ? 'No lab processing records found' : 'No records match your search criteria'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleLabs.map((lab) => {
                        if (labTypeFilter === 'clinical') {
                          return (
                            <TableRow key={lab.id}>
                              <TableCell>{lab.id ?? (lab as any).titleUniqueId ?? (lab.sampleId ?? lab.sample?.sampleId ?? '-')}</TableCell>
                              <TableCell>{lab.sampleId ?? lab.sample?.sampleId ?? '-'}</TableCell>
                              <TableCell>{lab.sample?.lead?.sampleType ?? lab.sampleType ?? '-'}</TableCell>
                              <TableCell>{(lab as any).serviceName ?? lab.sample?.lead?.serviceName ?? '-'}</TableCell>
                              <TableCell>{(lab as any).sampleDeliveryDate ? new Date((lab as any).sampleDeliveryDate).toLocaleDateString() : (lab.sample?.sampleDeliveryDate ? new Date(lab.sample.sampleDeliveryDate).toLocaleDateString() : '-')}</TableCell>
                              <TableCell>{(lab as any).protocol1 ?? '-'}</TableCell>
                              <TableCell>{(lab as any).isolationMethod ?? (lab as any).extractionMethod ?? '-'}</TableCell>
                              <TableCell>{(lab as any).qualityCheckDNA ?? (lab as any).qualityCheck2 ?? '-'}</TableCell>
                              <TableCell>{(lab as any).statusDNAExtraction ?? '-'}</TableCell>
                              <TableCell>{(lab as any).libraryPreparationProtocol ?? '-'}</TableCell>
                              <TableCell>{(lab as any).libraryPrepared ? 'Yes' : 'No'}</TableCell>
                              <TableCell>{(lab as any).qualityCheck2 ?? '-'}</TableCell>
                              <TableCell>{(lab as any).statusLibraryPreparation ?? '-'}</TableCell>
                              <TableCell>{(lab as any).purificationProtocol ?? '-'}</TableCell>
                              <TableCell>{(lab as any).productQualityCheck ?? '-'}</TableCell>
                              <TableCell>{(lab as any).qcStatus ?? '-'}</TableCell>
                              <TableCell>{(lab as any).transitStatus ?? '-'}</TableCell>
                              <TableCell>{(lab as any).financeApproval ?? '-'}</TableCell>
                              <TableCell>{(lab as any).completeStatus ?? '-'}</TableCell>
                              <TableCell>{(lab as any).progenicsTrf ?? '-'}</TableCell>
                              <TableCell>{(lab as any).created_at ? new Date((lab as any).created_at).toLocaleString() : '-'}</TableCell>
                              <TableCell>{(lab as any).updated_at ? new Date((lab as any).updated_at).toLocaleString() : '-'}</TableCell>
                              <TableCell>{(lab as any).remark ?? (lab as any)._raw?.remark ?? '-'}</TableCell>
                              <TableCell className="sticky right-0 bg-white dark:bg-gray-900 border-l-2 border-gray-200 dark:border-gray-700 min-w-[130px]">
                                <div className="flex space-x-2 items-center justify-center">
                                  <Button variant="outline" size="sm" onClick={() => {
                                    setSelectedLab(lab);
                                    editForm.reset({
                                      sampleId: lab.sampleId ?? '',
                                      labId: lab.labId ?? '',
                                      qcStatus: lab.qcStatus ?? 'passed',
                                      libraryPrepared: lab.libraryPrepared ?? false,
                                      isOutsourced: lab.isOutsourced ?? false,
                                      titleUniqueId: (lab as any).titleUniqueId ?? (lab.sample?.sampleId ?? ''),
                                      sampleDeliveryDate: (lab as any).sampleDeliveryDate ? (new Date((lab as any).sampleDeliveryDate).toISOString().slice(0,16) as any) : (lab.sample?.sampleDeliveryDate ? new Date(lab.sample.sampleDeliveryDate).toISOString().slice(0,16) as any : undefined),
                                      serviceName: (lab as any).serviceName ?? '',
                                      protocol1: (lab as any).protocol1 ?? '',
                                      isolationMethod: (lab as any).isolationMethod ?? '',
                                      qualityCheckDNA: (lab as any).qualityCheckDNA ?? '',
                                      statusDNAExtraction: (lab as any).statusDNAExtraction ?? '',
                                      protocol2: (lab as any).protocol2 ?? '',
                                      libraryPreparationProtocol: (lab as any).libraryPreparationProtocol ?? '',
                                      qualityCheck2: (lab as any).qualityCheck2 ?? '',
                                      purificationProtocol: (lab as any).purificationProtocol ?? '',
                                      productQualityCheck: (lab as any).productQualityCheck ?? '',
                                      statusLibraryPreparation: (lab as any).statusLibraryPreparation ?? '',
                                      transitStatus: (lab as any).transitStatus ?? '',
                                      financeApproval: (lab as any).financeApproval ?? '',
                                      completeStatus: (lab as any).completeStatus ?? '',
                                      progenicsTrf: (lab as any).progenicsTrf ?? '',
                                      dnaRnaQuantity: lab.dnaRnaQuantity ? Number(lab.dnaRnaQuantity) : undefined,
                                      approvedToBioinformatics: (lab as any).approvedToBioinformatics ?? false,
                                      created_at: (lab as any).created_at ? new Date((lab as any).created_at).toISOString().slice(0, 16) : '',
                                      updated_at: (lab as any).updated_at ? new Date((lab as any).updated_at).toISOString().slice(0, 16) : '',
                                    });
                                    setIsEditDialogOpen(true);
                                  }}><Edit className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    if (!confirm('Delete this lab processing record? This action cannot be undone.')) return;
                                    deleteLabMutation.mutate({ id: lab.id });
                                  }}>
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }

                        if (labTypeFilter === 'discovery') {
                          return (
                            <TableRow key={lab.id}>
                              <TableCell>{(lab as any).projectId ?? lab.sample?.lead?.projectId ?? lab.sample?.lead?.project_id ?? '-'}</TableCell>
                              <TableCell>{lab.id ?? (lab as any).titleUniqueId ?? (lab.sampleId ?? lab.sample?.sampleId ?? '-')}</TableCell>
                              <TableCell>{(lab as any).clientId ?? lab.sample?.lead?.clientId ?? lab.sample?.lead?.client_id ?? '-'}</TableCell>
                              <TableCell>{lab.sampleId ?? lab.sample?.sampleId ?? '-'}</TableCell>
                              <TableCell>{(lab as any).numberOfSamples ?? lab.sample?.numberOfSamples ?? lab.sample?.count ?? '-'}</TableCell>
                              <TableCell>{lab.sample?.lead?.sampleType ?? lab.sampleType ?? '-'}</TableCell>
                              <TableCell>{(lab as any).serviceName ?? lab.sample?.lead?.serviceName ?? '-'}</TableCell>
                              <TableCell>{(lab as any).sampleDeliveryDate ? new Date((lab as any).sampleDeliveryDate).toLocaleDateString() : (lab.sample?.sampleDeliveryDate ? new Date(lab.sample.sampleDeliveryDate).toLocaleDateString() : '-')}</TableCell>
                              <TableCell>{(lab as any).protocol1 ?? '-'}</TableCell>
                              <TableCell>{(lab as any).isolationMethod ?? (lab as any).extractionMethod ?? '-'}</TableCell>
                              <TableCell>{(lab as any).qualityCheckDNA ?? (lab as any).qualityCheck2 ?? '-'}</TableCell>
                              <TableCell>{(lab as any).statusDNAExtraction ?? '-'}</TableCell>
                              <TableCell>{(lab as any).libraryPreparationProtocol ?? '-'}</TableCell>
                              <TableCell>{(lab as any).libraryPrepared ? 'Yes' : 'No'}</TableCell>
                              <TableCell>{(lab as any).qualityCheck2 ?? '-'}</TableCell>
                              <TableCell>{(lab as any).statusLibraryPreparation ?? '-'}</TableCell>
                              <TableCell>{(lab as any).purificationProtocol ?? '-'}</TableCell>
                              <TableCell>{(lab as any).productQualityCheck ?? '-'}</TableCell>
                              <TableCell>{(lab as any).qcStatus ?? '-'}</TableCell>
                              <TableCell>{(lab as any).transitStatus ?? '-'}</TableCell>
                              <TableCell>{(lab as any).financeApproval ?? '-'}</TableCell>
                              <TableCell>{(lab as any).alertToTechnical ?? (lab as any)._raw?.alert_to_technical_team ?? '-'}</TableCell>
                              <TableCell>{(lab as any).created_at ? new Date((lab as any).created_at).toLocaleString() : '-'}</TableCell>
                              <TableCell>{(lab as any).updated_at ? new Date((lab as any).updated_at).toLocaleString() : '-'}</TableCell>
                              <TableCell>{(lab as any).progenicsTrf ?? '-'}</TableCell>
                              <TableCell>{(lab as any).remark ?? (lab as any)._raw?.remark ?? '-'}</TableCell>
                              <TableCell className="sticky right-0 bg-white dark:bg-gray-900 border-l-2 border-gray-200 dark:border-gray-700 min-w-[130px]">
                                <div className="flex space-x-2 items-center justify-center">
                                  <Button variant="outline" size="sm" onClick={() => {
                                    setSelectedLab(lab);
                                    editForm.reset({
                                      sampleId: lab.sampleId ?? '',
                                      labId: lab.labId ?? '',
                                      qcStatus: lab.qcStatus ?? 'passed',
                                      libraryPrepared: lab.libraryPrepared ?? false,
                                      isOutsourced: lab.isOutsourced ?? false,
                                      titleUniqueId: (lab as any).titleUniqueId ?? (lab.sample?.sampleId ?? ''),
                                      sampleDeliveryDate: (lab as any).sampleDeliveryDate ? (new Date((lab as any).sampleDeliveryDate).toISOString().slice(0,16) as any) : (lab.sample?.sampleDeliveryDate ? new Date(lab.sample.sampleDeliveryDate).toISOString().slice(0,16) as any : undefined),
                                      serviceName: (lab as any).serviceName ?? '',
                                      protocol1: (lab as any).protocol1 ?? '',
                                      isolationMethod: (lab as any).isolationMethod ?? '',
                                      qualityCheckDNA: (lab as any).qualityCheckDNA ?? '',
                                      statusDNAExtraction: (lab as any).statusDNAExtraction ?? '',
                                      protocol2: (lab as any).protocol2 ?? '',
                                      libraryPreparationProtocol: (lab as any).libraryPreparationProtocol ?? '',
                                      qualityCheck2: (lab as any).qualityCheck2 ?? '',
                                      purificationProtocol: (lab as any).purificationProtocol ?? '',
                                      productQualityCheck: (lab as any).productQualityCheck ?? '',
                                      statusLibraryPreparation: (lab as any).statusLibraryPreparation ?? '',
                                      transitStatus: (lab as any).transitStatus ?? '',
                                      financeApproval: (lab as any).financeApproval ?? '',
                                      completeStatus: (lab as any).completeStatus ?? '',
                                      progenicsTrf: (lab as any).progenicsTrf ?? '',
                                      dnaRnaQuantity: lab.dnaRnaQuantity ? Number(lab.dnaRnaQuantity) : undefined,
                                      approvedToBioinformatics: (lab as any).approvedToBioinformatics ?? false,
                                      created_at: (lab as any).created_at ? new Date((lab as any).created_at).toISOString().slice(0, 16) : '',
                                      updated_at: (lab as any).updated_at ? new Date((lab as any).updated_at).toISOString().slice(0, 16) : '',
                                    });
                                    setIsEditDialogOpen(true);
                                  }}><Edit className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    if (!confirm('Delete this lab processing record? This action cannot be undone.')) return;
                                    deleteLabMutation.mutate({ id: lab.id });
                                  }}>
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }

                        return null; // we only render clinical or discovery rows
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          {/* Pagination Controls */}
          {visibleLabs.length > 0 && (
            <div className="p-4 flex items-center justify-between border-t">
              <div>
                Showing {(start + 1) <= totalFiltered ? (start + 1) : 0} - {Math.min(start + pageSize, totalFiltered)} of {totalFiltered}
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  disabled={page <= 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <div>
                  Page {page} / {totalPages}
                </div>
                <Button 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lab Processing Entry</DialogTitle>
            <DialogDescription>Update processing information for a sample.</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit((vals) => {
            if (!selectedLab) return;
            // only include editable fields
            const updates: any = {};
            Object.keys(vals || {}).forEach((k) => {
              if (labEditable.has(k)) updates[k] = (vals as any)[k];
            });
            // convert numeric fields
            ['dnaRnaQuantity','concentration','purity','volume','processingTime','temperature','humidity'].forEach(k => {
              if (updates[k] != null) updates[k] = String(updates[k]);
            });
            if (!updates.isOutsourced) updates.outsourceDetails = null;
            updateLabMutation.mutate({ id: selectedLab.id, updates });
          })} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label>Sample ID</Label><Input {...editForm.register('sampleId')} disabled={!labEditable.has('sampleId')} /></div>
              <div><Label>Lab ID</Label><Input {...editForm.register('labId')} disabled={!labEditable.has('labId')} /></div>
              <div><Label>ID</Label><Input value={selectedLab?.id ?? ''} disabled /></div>
              <div><Label>Sample Delivery Date</Label><Input type="datetime-local" {...editForm.register('sampleDeliveryDate')} disabled={!labEditable.has('sampleDeliveryDate')} /></div>
              <div><Label>Service Name</Label><Input {...editForm.register('serviceName')} disabled={!labEditable.has('serviceName')} /></div>
              <div><Label>Sample Type</Label><Input {...editForm.register('sampleType' as any)} disabled={!labEditable.has('sampleType')} /></div>
              <div><Label>Patient Name</Label><Input {...editForm.register('patientName' as any)} disabled={!labEditable.has('patientName')} /></div>
              <div><Label>Protocol 1 (DNA Extraction)</Label><Input {...editForm.register('protocol1')} disabled={!labEditable.has('protocol1')} /></div>
              <div><Label>Isolation</Label><Input {...editForm.register('isolationMethod')} disabled={!labEditable.has('isolationMethod')} /></div>
              <div><Label>Quality Check (DNA)</Label><Input {...editForm.register('qualityCheckDNA')} disabled={!labEditable.has('qualityCheckDNA')} /></div>
              <div><Label>Status (DNA Extraction)</Label><Input {...editForm.register('statusDNAExtraction')} disabled={!labEditable.has('statusDNAExtraction')} /></div>
              <div><Label>Protocol 2</Label><Input {...editForm.register('protocol2')} disabled={!labEditable.has('protocol2')} /></div>
              <div><Label>Library Preparation</Label><Input {...editForm.register('libraryPreparationProtocol')} disabled={!labEditable.has('libraryPreparationProtocol')} /></div>
              <div><Label>Quality Check 2</Label><Input {...editForm.register('qualityCheck2')} disabled={!labEditable.has('qualityCheck2')} /></div>
              <div><Label>Purification Protocol</Label><Input {...editForm.register('purificationProtocol')} disabled={!labEditable.has('purificationProtocol')} /></div>
              <div><Label>Quality Check of Product</Label><Input {...editForm.register('productQualityCheck')} disabled={!labEditable.has('productQualityCheck')} /></div>
              <div><Label>Status (Library Preparation)</Label><Input {...editForm.register('statusLibraryPreparation')} disabled={!labEditable.has('statusLibraryPreparation')} /></div>
              <div><Label>Transit Status</Label><Input {...editForm.register('transitStatus')} disabled={!labEditable.has('transitStatus')} /></div>
              <div><Label>Finance Approval</Label><Input {...editForm.register('financeApproval')} disabled={!labEditable.has('financeApproval')} /></div>
              <div><Label>Complete Status</Label><Input {...editForm.register('completeStatus')} disabled={!labEditable.has('completeStatus')} /></div>
              <div><Label>Progenics TRF</Label><Input {...editForm.register('progenicsTrf')} disabled={!labEditable.has('progenicsTrf')} /></div>
              <div>
                <Label>QC Status</Label>
                <Select onValueChange={(v) => editForm.setValue('qcStatus', v)}>
                  <SelectTrigger><SelectValue placeholder="Select QC Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="retest_required">Retest Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>DNA/RNA Quantity (ng/μL)</Label><Input type="number" step="0.1" {...editForm.register('dnaRnaQuantity', { valueAsNumber: true })} /></div>
              <div><Label>Library Prepared</Label><div className="pt-2"><Checkbox {...editForm.register('libraryPrepared')} /></div></div>
              <div><Label>Outsourced</Label><div className="pt-2"><Checkbox {...editForm.register('isOutsourced')} /></div></div>
              <div><Label>Approved to Bioinformatics</Label><div className="pt-2"><Checkbox {...editForm.register('approvedToBioinformatics')} disabled={!labEditable.has('approvedToBioinformatics')} /></div></div>
              <div><Label>Created At</Label><Input type="datetime-local" {...editForm.register('created_at')} disabled={!labEditable.has('created_at')} /></div>
              <div><Label>Updated At</Label><Input type="datetime-local" {...editForm.register('updated_at')} disabled={!labEditable.has('updated_at')} /></div>
              <div><Label>Outsource Details</Label><Textarea {...editForm.register('outsourceDetails' as any)} /></div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedLab(null); }}>Cancel</Button>
              <Button type="submit" disabled={updateLabMutation.isPending}>{updateLabMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}