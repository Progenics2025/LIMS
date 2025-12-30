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
import { DataTable, ColumnDef } from "@/components/DataTable";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Eye, Edit, FlaskConical, TestTube, Microscope, Activity, Trash2, AlertCircle } from "lucide-react";
import { useRecycle } from '@/contexts/RecycleContext';
import { FilterBar } from "@/components/FilterBar";

const labFormSchema = insertLabProcessingSchema.extend({
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  // numberOfSamples removed from front-end per request
  extractionProtocol: z.string().optional(),
  extractionQualityCheck: z.string().optional(),
  extractionQCStatus: z.string().optional(),
  extractionProcess: z.string().optional(),
  libraryPreparationProtocol: z.string().optional(),
  libraryPreparationQualityCheck: z.string().optional(),
  libraryQCStatus: z.string().optional(),
  libraryProcess: z.string().optional(),
  purificationProtocol: z.string().optional(),
  purificationQualityCheck: z.string().optional(),
  purificationQCStatus: z.string().optional(),
  purificationProcess: z.string().optional(),
  alertToBioinformaticsTeam: z.boolean().optional(),
  alertToTechnicalLead: z.boolean().optional(),
  progenicsTrf: z.string().optional(),
  createdAt: z.string().optional(),
  createdBy: z.string().optional(),
  modifiedAt: z.string().optional(),
  modifiedBy: z.string().optional(),
  remarksComment: z.string().optional(),
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
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [dateFilterField, setDateFilterField] = useState<string>('createdAt');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // Lab type filter: 'all' | 'clinical' | 'discovery' - Default to 'discovery' to show data immediately
  const [labTypeFilter, setLabTypeFilter] = useState<'all' | 'clinical' | 'discovery'>('discovery');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Fetch both discovery and clinical lab process sheets and merge them
  const { data: discoveryRows = [], isLoading: discoveryLoading } = useQuery<any[]>({
    queryKey: ['/api/labprocess-discovery-sheet'],
    queryFn: async () => {
      const r = await fetch('/api/labprocess-discovery-sheet');
      if (!r.ok) throw new Error('Failed');
      return r.json();
    }
  });
  const { data: clinicalRows = [], isLoading: clinicalLoading } = useQuery<any[]>({
    queryKey: ['/api/labprocess-clinical-sheet'],
    queryFn: async () => {
      const r = await fetch('/api/labprocess-clinical-sheet');
      if (!r.ok) throw new Error('Failed');
      return r.json();
    }
  });

  // Fetch sample tracking data to check for alerts
  const { data: sampleTrackingData = [] } = useQuery<any[]>({
    queryKey: ['/api/sample-tracking'],
    queryFn: async () => {
      const r = await fetch('/api/sample-tracking');
      if (!r.ok) throw new Error('Failed');
      return r.json();
    }
  });

  // Properly merge data from both sheets
  const labQueue = useMemo(() => {
    const discovery = Array.isArray(discoveryRows) ? discoveryRows : [];
    const clinical = Array.isArray(clinicalRows) ? clinicalRows : [];
    return [...discovery, ...clinical];
  }, [discoveryRows, clinicalRows]);

  const isLoading = discoveryLoading || clinicalLoading;

  // Mapping between frontend table labels / UI fields and database columns
  // This mapping documents which DB column corresponds to each UI column and
  // is used as reference when normalizing API responses or creating queries.
  const labProcessingFieldMap: Record<string, string> = {
    // Unique ID => unique_id
    'UniqueId': 'unique_id',
    // Project ID => project_id
    'projectId': 'project_id',
    // Sample ID => sample_id
    'sampleId': 'sample_id',
    // Client ID => client_id
    'clientId': 'client_id',
    // Service Name => service_name
    'serviceName': 'service_name',
    // Sample Type => sample_type
    'sampleType': 'sample_type',
    // No of Samples removed from UI / mapping
    // Sample Received Date => sample_received_date
    'sampleDeliveryDate': 'sample_received_date',
    // Extraction Protocol => extraction_protocol
    'extractionProtocol': 'extraction_protocol',
    // Extraction Quality Check => extraction_quality_check
    'extractionQualityCheck': 'extraction_quality_check',
    // Extraction QC Status => extraction_qc_status
    'extractionQCStatus': 'extraction_qc_status',
    // Extraction Process => extraction_process
    'extractionProcess': 'extraction_process',
    // Library Preparation Protocol => library_preparation_protocol
    'libraryPreparationProtocol': 'library_preparation_protocol',
    // Library Preparation Quality Check => library_preparation_quality_check
    'libraryPreparationQualityCheck': 'library_preparation_quality_check',
    // Library Preparation QC Status => library_preparation_qc_status
    'libraryQCStatus': 'library_preparation_qc_status',
    // Library Preparation Process => library_preparation_process
    'libraryProcess': 'library_preparation_process',
    // Purification Protocol => purification_protocol
    'purificationProtocol': 'purification_protocol',
    // Purification Quality Check => purification_quality_check
    'purificationQualityCheck': 'purification_quality_check',
    // Purification QC Status => purification_qc_status
    'purificationQCStatus': 'purification_qc_status',
    // Purification Process => purification_process
    'purificationProcess': 'purification_process',
    // Alert to Bioinformatics Team => alert_to_bioinformatics_team
    'alertToBioinformaticsTeam': 'alert_to_bioinformatics_team',
    // Alert to Technical Lead => alert_to_technical_lead / alert_to_technical_leadd
    'alertToTechnicalLead': 'alert_to_technical_lead',
    // Progenics TRF => progenics_trf
    'progenicsTrf': 'progenics_trf',
    // Created At => created_at
    'createdAt': 'created_at',
    // Created By => created_by
    'createdBy': 'created_by',
    // Modified At => modified_at
    'modifiedAt': 'modified_at',
    // Modified By => modified_by
    'modifiedBy': 'modified_by',
    // Remark/Comment => remark_comment
    'remarksComment': 'remark_comment',
  };

  // Normalize lab processing records returned by the API into a stable shape.
  // The API may return camelCase fields (e.g., extractionProtocol) or snake_case from DB.
  function normalizeLab(l: any) {
    if (!l) return l;
    const get = (snake: string, camel: string) => {
      // Use != null to treat both null and undefined as "not found"
      // This allows fallback logic to continue looking in nested objects
      if (l[camel] != null) return l[camel];
      if (l[snake] != null) return l[snake];
      // some fields are present on nested sample: check there too
      if (l.sample && l.sample[camel] != null) return l.sample[camel];
      if (l.sample && l.sample[snake] != null) return l.sample[snake];
      return undefined;
    };

    const sample = l.sample || {};
    const lead = sample.lead || {};

    // 🔍 DEBUG: Log project_id extraction
    const extractedProjectId = get('project_id', 'projectId');
    if (l.id === 1) {
      console.log('🔍 normalizeLab for ID 1:', {
        l_project_id: l['project_id'],
        l_projectId: l['projectId'],
        extracted: extractedProjectId,
        fallback1: l.projectId,
        final: extractedProjectId ?? l.projectId ?? undefined
      });
    }

    return {
      id: get('id', 'id') ?? l.id,
      titleUniqueId: get('unique_id', 'titleUniqueId') ?? sample.titleUniqueId ?? sample.unique_id ?? lead.id ?? undefined,
      uniqueId: get('unique_id', 'uniqueId') ?? sample.uniqueId ?? sample.unique_id ?? lead.uniqueId ?? lead.unique_id ?? undefined,
      projectId: extractedProjectId ?? l.projectId ?? undefined,
      sampleId: get('sample_id', 'sampleId') ?? sample.sampleId ?? sample.sample_id ?? (l as any).sample_id ?? undefined,
      clientId: get('client_id', 'clientId') ?? l.clientId ?? undefined,
      sampleDeliveryDate: get('sample_received_date', 'sampleDeliveryDate') ?? sample.sampleDeliveryDate ?? sample.sample_received_date ?? sample.sampleCollectedDate ?? sample.sample_collected_date ?? null,
      sampleType: get('sample_type', 'sampleType') ?? sample.sampleType ?? sample.sample_type ?? lead.sampleType ?? lead.sample_type ?? undefined,
      serviceName: get('service_name', 'serviceName') ?? sample.serviceName ?? sample.service_name ?? lead.serviceName ?? lead.service_name ?? undefined,
      // numberOfSamples removed from UI
      extractionProtocol: get('extraction_protocol', 'extractionProtocol') ?? (l as any).extractionProtocol ?? (l as any).protocol1 ?? undefined,
      extractionQualityCheck: get('extraction_quality_check', 'extractionQualityCheck') ?? (l as any).extractionQualityCheck ?? (l as any).qualityCheckDNA ?? undefined,
      extractionQCStatus: get('extraction_qc_status', 'extractionQCStatus') ?? (l as any).extractionQCStatus ?? undefined,
      extractionProcess: get('extraction_process', 'extractionProcess') ?? (l as any).extractionProcess ?? undefined,
      libraryPreparationProtocol: get('library_preparation_protocol', 'libraryPreparationProtocol') ?? (l as any).libraryPreparationProtocol ?? undefined,
      libraryPreparationQualityCheck: get('library_preparation_quality_check', 'libraryPreparationQualityCheck') ?? (l as any).libraryPreparationQualityCheck ?? (l as any).qualityCheck2 ?? undefined,
      libraryQCStatus: get('library_preparation_qc_status', 'libraryQCStatus') ?? (l as any).libraryQCStatus ?? undefined,
      libraryProcess: get('library_preparation_process', 'libraryProcess') ?? (l as any).libraryProcess ?? undefined,
      purificationProtocol: get('purification_protocol', 'purificationProtocol') ?? (l as any).purificationProtocol ?? undefined,
      purificationQualityCheck: get('purification_quality_check', 'purificationQualityCheck') ?? (l as any).purificationQualityCheck ?? (l as any).productQualityCheck ?? undefined,
      purificationQCStatus: get('purification_qc_status', 'purificationQCStatus') ?? (l as any).purificationQCStatus ?? undefined,
      purificationProcess: get('purification_process', 'purificationProcess') ?? (l as any).purificationProcess ?? undefined,
      // Derive overall QC status: use extraction status as primary indicator
      qcStatus: get('extraction_qc_status', 'extractionQCStatus') ?? (l as any).extractionQCStatus ?? undefined,
      isOutsourced: Boolean(get('is_outsourced', 'isOutsourced') ?? (l as any).isOutsourced ?? false),
      alertToBioinformaticsTeam: Boolean(get('alert_to_bioinformatics_team', 'alertToBioinformaticsTeam') ?? (l as any).alertToBioinformaticsTeam ?? (l as any).approvedToBioinformatics ?? false),
      alertToTechnicalLead: Boolean(get('alert_to_technical_lead', 'alertToTechnicalLead') ?? get('alert_to_technical_leadd', 'alertToTechnicalLead') ?? (l as any).alertToTechnicalLead ?? (l as any).alertToTechnical ?? false),
      progenicsTrf: get('progenics_trf', 'progenicsTrf') ?? (l as any).progenicsTrf ?? lead.progenicsTRF ?? lead.progenics_trf ?? undefined,
      createdAt: get('created_at', 'createdAt') ?? (l as any).createdAt ?? (l as any).created_at ?? undefined,
      createdBy: get('created_by', 'createdBy') ?? (l as any).createdBy ?? undefined,
      modifiedAt: get('modified_at', 'modifiedAt') ?? (l as any).modifiedAt ?? (l as any).updated_at ?? undefined,
      modifiedBy: get('modified_by', 'modifiedBy') ?? (l as any).modifiedBy ?? undefined,
      remarksComment: get('remark_comment', 'remarksComment') ?? (l as any).remarksComment ?? (l as any).remark ?? undefined,
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
  // Auto-detect lab type from project_id prefix: PG = clinical, DG = discovery
  const filteredLabs = normalizedLabs.filter((lab) => {
    // 1. Status Filter
    if (statusFilter && statusFilter !== 'all' && lab.qcStatus !== statusFilter) {
      return false;
    }

    // 2. Lab Type Filter
    if (labTypeFilter && labTypeFilter !== 'all') {
      let category = (lab.sample && lab.sample.lead && (lab.sample.lead.category || lab.sample.lead.type)) || (lab.lead && (lab.lead.category || lab.lead.type)) || (lab._raw && lab._raw.category);
      // If no explicit category, infer from project_id prefix
      if (!category) {
        const projectId = lab.projectId || lab._raw?.project_id || '';
        category = String(projectId).startsWith('DG') ? 'discovery' : 'clinical';
      }
      if (String(category).toLowerCase() !== labTypeFilter) return false;
    }

    // 3. Search Query (Global)
    let matchesSearch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch = Object.values(lab).some(val => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') return Object.values(val).some(v => String(v ?? '').toLowerCase().includes(q));
        return String(val).toLowerCase().includes(q);
      });
    }

    // 4. Date Range Filter
    let matchesDate = true;
    if (dateRange.from) {
      const dateVal = (lab as any)[dateFilterField];
      if (dateVal) {
        const d = new Date(dateVal);
        const fromTime = dateRange.from.getTime();
        const toTime = dateRange.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : fromTime;

        if (dateRange.to) {
          matchesDate = d.getTime() >= fromTime && d.getTime() <= toTime;
        } else {
          matchesDate = d.getTime() >= fromTime;
        }
      } else {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  // Separate labs by type based on project_id prefix (PG = clinical, DG = discovery)
  const clinicalLabs = filteredLabs.filter(lab => {
    const projectId = lab.projectId || lab._raw?.project_id || '';
    return String(projectId).startsWith('PG');
  });

  const discoveryLabs = filteredLabs.filter(lab => {
    const projectId = lab.projectId || lab._raw?.project_id || '';
    return String(projectId).startsWith('DG');
  });

  // Helper function to check if a sample has been alerted from Sample Tracking
  const isAlertedFromSampleTracking = (titleUniqueId: string | undefined): boolean => {
    if (!titleUniqueId) return false;
    return sampleTrackingData.some((sample: any) =>
      (sample.uniqueId === titleUniqueId || sample.unique_id === titleUniqueId) &&
      (sample.alertToLabprocessTeam === true || sample.alert_to_labprocess_team === true)
    );
  };

  // Helper function to get sequential sample ID counter for a given project
  const getSequentialSampleId = (lab: any, labsToCheck: any[]): number => {
    const projectId = lab.projectId || lab._raw?.project_id || '';
    if (!projectId) return 1;

    // Count how many records exist for this project ID in the current view
    // Filter labs with the same project ID and that come before or are the current lab
    const sameProjectLabs = labsToCheck.filter((l: any) => {
      const pid = l.projectId || l._raw?.project_id || '';
      return pid === projectId;
    });

    // Find the index of the current lab in the sorted list
    const index = sameProjectLabs.findIndex((l: any) => l.id === lab.id);
    return index >= 0 ? index + 1 : 1;
  };

  // Pagination + sorting calculations - use separated lists based on active filter
  const labsToDisplay = labTypeFilter === 'clinical' ? clinicalLabs : labTypeFilter === 'discovery' ? discoveryLabs : filteredLabs;
  const totalFiltered = labsToDisplay.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  if (page > totalPages) setPage(totalPages);
  const start = (page - 1) * pageSize;

  const sortedLabs = (() => {
    if (!sortKey) return labsToDisplay;
    const copy = [...labsToDisplay];
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

  const CLINICAL_HEADER_COUNT = 29;
  const DISCOVERY_HEADER_COUNT = 29;
  const DEFAULT_HEADER_COUNT = 20;

  // Fetch lab processing stats from API
  const { data: labStats } = useQuery<{
    totalInQueue: number;
    sentToBioinformatics: number;
    discoveryInQueue: number;
    discoverySent: number;
    clinicalInQueue: number;
    clinicalSent: number;
  }>({
    queryKey: ['/api/lab-processing/stats'],
    queryFn: async () => {
      const res = await fetch('/api/lab-processing/stats');
      if (!res.ok) throw new Error('Failed to fetch lab processing stats');
      return res.json();
    },
  });

  const getStatusCounts = () => ({
    passed: normalizedLabs.filter(l => l.qcStatus === 'passed').length,
    failed: normalizedLabs.filter(l => l.qcStatus === 'failed').length,
    retest_required: normalizedLabs.filter(l => l.qcStatus === 'retest_required').length,
    outsourced: normalizedLabs.filter(l => l.isOutsourced).length,
    totalInQueue: normalizedLabs.length,
    sentToBioinformatics: normalizedLabs.filter(l => l.alertToBioinformaticsTeam).length,
  });

  const statusCounts = getStatusCounts();

  const statusCards = [
    { title: "Total Samples Under Process", value: labStats?.totalInQueue ?? statusCounts.totalInQueue, icon: TestTube, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "Processed (Sent to Bioinformatics)", value: labStats?.sentToBioinformatics ?? statusCounts.sentToBioinformatics, icon: FlaskConical, color: "text-green-600 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-900/20" },
    { title: "QC Passed", value: statusCounts.passed, icon: Microscope, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-900/20" },
    { title: "QC Failed", value: statusCounts.failed, icon: Activity, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-900/20" },
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
      // Determine if this is discovery or clinical based on project ID
      const projectId = data.projectId || '';
      const isDiscovery = projectId.startsWith('DG');
      const endpoint = isDiscovery ? '/api/labprocess-discovery-sheet' : '/api/labprocess-clinical-sheet';

      // Get current data to count existing samples for this project
      const currentSheetData = isDiscovery ? discoveryRows : clinicalRows;
      const sameProjectCount = currentSheetData.filter(lab =>
        (lab.projectId || lab._raw?.project_id) === projectId
      ).length;

      // Generate sequential sample_id: PROJECT_ID_COUNTER
      const sequentialSampleId = `${projectId}_${sameProjectCount + 1}`;

      const response = await apiRequest('POST', endpoint, {
        ...data,
        sampleId: sequentialSampleId,
        processedBy: user?.id
      });
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/labprocess-discovery-sheet'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/labprocess-clinical-sheet'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/samples'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-processing/stats'], refetchType: 'all' });
      form.reset();
      setIsCreateDialogOpen(false);
      toast({ title: "Lab processing updated", description: "Sample processing information has been saved" });
    },
  });

  const form = useForm<LabFormData>({
    resolver: zodResolver(labFormSchema),
    defaultValues: {
      sampleId: '', titleUniqueId: '', projectId: '', clientId: '', serviceName: '', sampleType: '',
      sampleDeliveryDate: undefined, extractionProtocol: '', extractionQualityCheck: '', extractionQCStatus: '', extractionProcess: '',
      libraryPreparationProtocol: '', libraryPreparationQualityCheck: '', libraryQCStatus: '', libraryProcess: '',
      purificationProtocol: '', purificationQualityCheck: '', purificationQCStatus: '', purificationProcess: '',
      alertToBioinformaticsTeam: false, alertToTechnicalLead: false, progenicsTrf: '',
      createdAt: '', createdBy: '', modifiedAt: '', modifiedBy: '', remarksComment: '',
    },
  });

  // Edit form — keep same shape as create but allow partials
  const editForm = useForm<Partial<LabFormData>>({
    defaultValues: {
      sampleId: '',
      titleUniqueId: '',
      projectId: '',
      clientId: '',
      serviceName: '',
      sampleType: '',
      sampleDeliveryDate: undefined,
      extractionProtocol: '',
      extractionQualityCheck: '',
      extractionQCStatus: '',
      extractionProcess: '',
      libraryPreparationProtocol: '',
      libraryPreparationQualityCheck: '',
      libraryQCStatus: '',
      libraryProcess: '',
      purificationProtocol: '',
      purificationQualityCheck: '',
      purificationQCStatus: '',
      purificationProcess: '',
      alertToBioinformaticsTeam: false,
      alertToTechnicalLead: false,
      progenicsTrf: '',
      createdAt: '',
      createdBy: '',
      modifiedAt: '',
      modifiedBy: '',
      remarksComment: '',
    },
  });

  const updateLabMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      // Determine if this is discovery or clinical by looking up the record by id
      const labRecord = normalizedLabs.find(l => String(l.id) === String(id)) || selectedLab || null;
      const projectId = labRecord?.projectId || labRecord?._raw?.project_id || '';
      const isDiscovery = String(projectId).startsWith('DG');
      const endpoint = isDiscovery ? `/api/labprocess-discovery-sheet/${id}` : `/api/labprocess-clinical-sheet/${id}`;
      const response = await apiRequest('PUT', endpoint, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/labprocess-discovery-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/labprocess-clinical-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/samples'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      setIsEditDialogOpen(false);
      setSelectedLab(null);
      toast({ title: 'Lab processing updated', description: 'Record updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Update failed', description: error.message || 'Failed to update lab processing record', variant: 'destructive' });
    },
  });

  const deleteLabMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      // Determine if this is discovery or clinical by looking up the record by id
      const labRecord = normalizedLabs.find(l => String(l.id) === String(id)) || selectedLab || null;
      const projectId = labRecord?.projectId || labRecord?._raw?.project_id || '';
      const isDiscovery = String(projectId).startsWith('DG');
      const endpoint = isDiscovery ? `/api/labprocess-discovery-sheet/${id}` : `/api/labprocess-clinical-sheet/${id}`;
      const response = await apiRequest('DELETE', endpoint);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/labprocess-discovery-sheet'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/labprocess-clinical-sheet'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/samples'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-processing/stats'], refetchType: 'all' });
      toast({ title: 'Record deleted', description: 'Lab processing record has been removed' });
      // Notify recycle UI to refresh (server snapshots deleted lab records)
      window.dispatchEvent(new Event('ll:recycle:update'));
    },
    onError: (error: any) => {
      toast({ title: 'Delete failed', description: error.message || 'Failed to delete record', variant: 'destructive' });
    }
  });

  // Alert to Bioinformatics mutation
  const alertBioinformaticsMutation = useMutation({
    mutationFn: async ({ labId, projectIdHint }: { labId: string; projectIdHint?: string }) => {
      // BUG FIX: Discovery and Clinical sheets have separate ID sequences (both start at 1)
      // So we need to filter by type first before searching by ID
      let labRecord: any = null;

      // If we have a projectId hint, use it to search in the correct list
      if (projectIdHint) {
        const isDiscovery = String(projectIdHint).startsWith('DG');
        const sourceList = isDiscovery ? discoveryRows : clinicalRows;
        const rawRecord = sourceList.find((l: any) => String(l.id) === String(labId));
        // 🔑 FIX: Normalize the raw record so projectId is accessible as camelCase
        if (rawRecord) {
          labRecord = normalizeLab(rawRecord);
        }
      }

      // Fallback: search in all normalized labs (may match wrong type if both have same ID)
      if (!labRecord) {
        labRecord = normalizedLabs.find(l => String(l.id) === String(labId));
      }

      if (!labRecord) {
        console.error('🔴 Lab record not found for labId:', labId, 'projectIdHint:', projectIdHint);
        console.log('Available discovery IDs:', discoveryRows.map((l: any) => l.id));
        console.log('Available clinical IDs:', clinicalRows.map((l: any) => l.id));
        throw new Error('Lab record not found');
      }

      // Determine if this is discovery or clinical based on project ID
      const projectId = labRecord.projectId || labRecord._raw?.project_id || projectIdHint || '';
      const isDiscovery = String(projectId).startsWith('DG');
      const isClinical = String(projectId).startsWith('PG');

      console.log('🔍 DEBUG alertBioinformaticsMutation:', {
        labId,
        projectIdHint,
        labRecordFound: !!labRecord,
        projectId,
        isDiscovery,
        isClinical,
      });

      if (!isDiscovery && !isClinical) {
        throw new Error(`Invalid project ID format. Must start with DG (Discovery) or PG (Clinical). Got: "${projectId}"`);
      }

      // 🔑 IMPORTANT: Send THIS RECORD only (not all records with same unique_id)
      // 🔑 CRITICAL: Create bioinformatics record FIRST, then mark lab process as sent
      // This ensures the bio record is created before updating the lab status
      const bioinfoEndpoint = isDiscovery ? '/api/bioinfo-discovery-sheet' : '/api/bioinfo-clinical-sheet';

      // Get lead data from sample tracking data which includes the full lead object
      const uniqueId = labRecord.titleUniqueId || labRecord.uniqueId || labRecord.unique_id;
      const sampleRecord = sampleTrackingData.find(s =>
        s.uniqueId === uniqueId || s.unique_id === uniqueId
      );
      const lead = sampleRecord?.lead || {};
      const sample = sampleRecord || {};

      // 🎯 KEY FIX: Use labRecord.sampleId directly (which includes the suffix from lab process)
      // AND use labRecord's uniqueId/titleUniqueId for unique_id (NOT projectId fallback)
      const bioinfoData = {
        unique_id: labRecord.titleUniqueId || labRecord.uniqueId || labRecord.unique_id || '',
        project_id: labRecord.projectId || labRecord._raw?.project_id || '',
        sample_id: labRecord.sampleId || labRecord.sample_id || labRecord._raw?.sample_id || sample.sampleId || sample.sample_id || '',  // 🔑 Use exact sample_id with suffix
        client_id: labRecord.clientId || labRecord._raw?.client_id || sample.clientId || sample.client_id || lead.clientId || '',
        organisation_hospital: lead.organisationHospital || sample.organisationHospital || null,
        clinician_researcher_name: lead.clinicianResearcherName || sample.clinicianResearcherName || null,
        patient_client_name: lead.patientClientName || sample.patientClientName || null,
        age: lead.age || null,
        gender: lead.gender || null,
        service_name: lead.serviceName || labRecord.serviceName || null,
        // no_of_samples removed from front-end payload
        sequencing_status: 'pending',
        analysis_status: 'pending',
        tat: lead.tat || null,
        created_by: user?.email || 'system',
      };

      console.log('✅ [FIXED] DEBUG bioinformatics send to reports - after normalizeLab fix:', {
        isDiscovery,
        isClinical,
        projectId,
        labRecordProjectId: labRecord.projectId,
        labRecordRawProjectId: labRecord._raw?.project_id,
        bioinfoDataProjectId: bioinfoData.project_id,
        labId,
        labRecordId: labRecord.id,
        labRecordSampleId: labRecord.sampleId,
      });

      // Step 1: Create bioinformatics record FIRST
      const response = await apiRequest('POST', bioinfoEndpoint, bioinfoData);
      const bioResponse = await response.json();

      // Step 2: Only if bioinformatics record created successfully, mark lab process as sent
      const labSheetEndpoint = isDiscovery ? `/api/labprocess-discovery-sheet/${labId}` : `/api/labprocess-clinical-sheet/${labId}`;
      await apiRequest('PUT', labSheetEndpoint, {
        alert_to_bioinformatics_team: true,
      });

      return bioResponse;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/labprocess-discovery-sheet'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/labprocess-clinical-sheet'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/bioinfo-discovery-sheet'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/bioinfo-clinical-sheet'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/sample-tracking'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/lab-processing/stats'], refetchType: 'all' });
      toast({ title: "Sent to Bioinformatics", description: "Sample has been alerted to Bioinformatics team" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Failed to send sample to bioinformatics team",
        variant: "destructive",
      });
    },
  });

  const { add } = useRecycle();

  // Editable fields per user rule (Lab Processing edit modal only)
  const labEditable = new Set<string>([
    'extractionProtocol', 'extractionQualityCheck', 'extractionQCStatus', 'extractionProcess',
    'libraryPreparationProtocol', 'libraryPreparationQualityCheck', 'libraryQCStatus', 'libraryProcess',
    'purificationProtocol', 'purificationQualityCheck', 'purificationQCStatus', 'purificationProcess',
    // allow editing of sample details from the edit dialog
    'clientId',
    'alertToBioinformaticsTeam', 'alertToTechnicalLead', 'remarksComment'
  ]);

  const onSubmit = (data: LabFormData) => {
    const processedData: any = { ...data };
    createLabProcessingMutation.mutate(processedData);
  };

  const handleOutsourceChange = (checked: boolean) => {
    setShowOutsourceDetails(checked);
    form.setValue('isOutsourced', checked);
  };

  const columns: ColumnDef<any>[] = [
    {
      header: "Unique ID",
      accessorKey: "uniqueId",
      className: "sticky left-0 z-20 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
    },
    { header: "Project ID", accessorKey: "projectId" },
    {
      header: "Sample ID",
      cell: (lab) => lab.projectId
        ? `${lab.projectId}_${getSequentialSampleId(lab, labTypeFilter === 'clinical' ? clinicalLabs : discoveryLabs)}`
        : lab.sampleId ?? '-'
    },
    { header: "Client ID", accessorKey: "clientId" },
    { header: "Service name", accessorKey: "serviceName" },
    { header: "Sample Type", accessorKey: "sampleType" },
    {
      header: "Sample received date",
      cell: (lab) => lab.sampleDeliveryDate ? new Date(lab.sampleDeliveryDate).toLocaleDateString() : '-'
    },
    { header: "Extraction protocol", accessorKey: "extractionProtocol" },
    { header: "Extraction quality check", accessorKey: "extractionQualityCheck" },
    { header: "Extraction QC status", accessorKey: "extractionQCStatus" },
    { header: "Extraction process", accessorKey: "extractionProcess" },
    { header: "Library preparation protocol", accessorKey: "libraryPreparationProtocol" },
    { header: "Library preparation quality check", accessorKey: "libraryPreparationQualityCheck" },
    { header: "Library preparation QC status", accessorKey: "libraryQCStatus" },
    { header: "Library preparation process", accessorKey: "libraryProcess" },
    { header: "Purification protocol", accessorKey: "purificationProtocol" },
    { header: "Purification quality check", accessorKey: "purificationQualityCheck" },
    { header: "Purification QC status", accessorKey: "purificationQCStatus" },
    { header: "Purification process", accessorKey: "purificationProcess" },
    {
      header: "Alert to Bioinformatics team",
      cell: (lab) => lab.alertToBioinformaticsTeam ? 'Yes' : 'No'
    },
    {
      header: "Alert to Technical lead",
      cell: (lab) => lab.alertToTechnicalLead ? 'Yes' : 'No'
    },
    { header: "Progenics TRF", accessorKey: "progenicsTrf" },
    {
      header: "Created at",
      cell: (lab) => lab.createdAt ? new Date(lab.createdAt).toLocaleString() : '-'
    },
    { header: "Created by", accessorKey: "createdBy" },
    {
      header: "Modified at",
      cell: (lab) => lab.modifiedAt ? new Date(lab.modifiedAt).toLocaleString() : '-'
    },
    { header: "Modified by", accessorKey: "modifiedBy" },
    { header: "Remark/Comment", accessorKey: "remarksComment" },
    {
      header: "Actions",
      className: "min-w-[180px] actions-column",
      cell: (lab) => (
        <div className="action-buttons flex space-x-2 items-center justify-center">
          <Button variant="outline" size="sm" onClick={() => {
            setSelectedLab(lab);
            editForm.reset({
              sampleId: lab.sampleId ?? '',
              titleUniqueId: lab.titleUniqueId ?? '',
              projectId: lab.projectId ?? '',
              clientId: lab.clientId ?? '',
              serviceName: lab.serviceName ?? '',
              sampleType: lab.sampleType ?? '',
              // numberOfSamples removed
              sampleDeliveryDate: lab.sampleDeliveryDate ? (new Date(lab.sampleDeliveryDate).toISOString().slice(0, 10) as any) : undefined,
              extractionProtocol: lab.extractionProtocol ?? '',
              extractionQualityCheck: lab.extractionQualityCheck ?? '',
              extractionQCStatus: lab.extractionQCStatus ?? '',
              extractionProcess: lab.extractionProcess ?? '',
              libraryPreparationProtocol: lab.libraryPreparationProtocol ?? '',
              libraryPreparationQualityCheck: lab.libraryPreparationQualityCheck ?? '',
              libraryQCStatus: lab.libraryQCStatus ?? '',
              libraryProcess: lab.libraryProcess ?? '',
              purificationProtocol: lab.purificationProtocol ?? '',
              purificationQualityCheck: lab.purificationQualityCheck ?? '',
              purificationQCStatus: lab.purificationQCStatus ?? '',
              purificationProcess: lab.purificationProcess ?? '',
              alertToBioinformaticsTeam: lab.alertToBioinformaticsTeam ?? false,
              alertToTechnicalLead: lab.alertToTechnicalLead ?? false,
              progenicsTrf: lab.progenicsTrf ?? '',
              createdAt: lab.createdAt ? new Date(lab.createdAt).toISOString().slice(0, 16) : '',
              modifiedAt: lab.modifiedAt ? new Date(lab.modifiedAt).toISOString().slice(0, 16) : '',
              createdBy: lab.createdBy ?? '',
              modifiedBy: lab.modifiedBy ?? '',
              remarksComment: lab.remarksComment ?? '',
            });
            setIsEditDialogOpen(true);
          }}><Edit className="h-4 w-4" /></Button>
          <Button
            variant="default"
            size="sm"
            className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all font-medium text-sm ${lab.alertToBioinformaticsTeam
              ? 'bg-red-500 hover:bg-red-600 text-white cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            onClick={() => {
              alertBioinformaticsMutation.mutate({
                labId: lab.id,
                projectIdHint: lab.projectId || lab._raw?.project_id
              });
            }}
            disabled={alertBioinformaticsMutation.isPending || lab.alertToBioinformaticsTeam}
            title={lab.alertToBioinformaticsTeam ? 'Already sent for Bioinformatics' : 'Send sample for Bioinformatics'}
            aria-label="Send For Bioinformatics "
          >
            {lab.alertToBioinformaticsTeam ? 'Sent ✓' : 'Send For Bioinformatics'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            if (!confirm('Delete this lab processing record? This action cannot be undone.')) return;
            deleteLabMutation.mutate({ id: lab.id });
          }}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      )
    }
  ];

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
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <div className={`flex p-3 rounded-lg ${card.bgColor} mb-4`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white text-center break-words w-full">{card.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 leading-tight">{card.title}</p>
                </div>
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
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dateRange={dateRange}
            setDateRange={setDateRange}
            dateFilterField={dateFilterField}
            setDateFilterField={setDateFilterField}
            dateFieldOptions={[
              { label: "Created At", value: "createdAt" },
              { label: "Sample Delivery Date", value: "sampleDeliveryDate" },
              { label: "Modified At", value: "modifiedAt" },
            ]}
            totalItems={totalFiltered}
            pageSize={pageSize}
            setPageSize={setPageSize}
            setPage={setPage}
            placeholder="Search Unique ID / Project ID / Sample ID / Client ID..."
          />

          {isLoading ? (
            <div className="text-center py-8">Loading lab processing data...</div>
          ) : (
            <div className="overflow-x-auto leads-table-wrapper process-table-wrapper">
              <DataTable
                data={visibleLabs}
                columns={columns}
                emptyMessage={
                  labTypeFilter === 'all'
                    ? 'Select "Clinical" or "Discovery" to view the corresponding table'
                    : filteredLabs.length === 0
                      ? 'No lab processing records found'
                      : 'No records match your search criteria'
                }
                rowClassName={(lab) => lab.alertToBioinformaticsTeam ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}
              />
            </div>
          )}

          {/* Pagination Controls */}
          {visibleLabs.length > 0 && (
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
            updateLabMutation.mutate({ id: selectedLab.id, updates });
          })} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label>Unique ID</Label><Input {...editForm.register('titleUniqueId')} disabled={!labEditable.has('titleUniqueId')} /></div>
              <div><Label>Project ID</Label><Input {...editForm.register('projectId')} disabled={!labEditable.has('projectId')} /></div>
              <div><Label>Sample ID</Label><Input {...editForm.register('sampleId')} disabled={!labEditable.has('sampleId')} /></div>
              <div><Label>Client ID</Label><Input {...editForm.register('clientId')} disabled={!labEditable.has('clientId')} /></div>
              <div><Label>Service Name</Label><Input {...editForm.register('serviceName')} disabled={!labEditable.has('serviceName')} /></div>
              <div><Label>Sample Type</Label><Input {...editForm.register('sampleType')} disabled={!labEditable.has('sampleType')} /></div>
              {/* No of Samples removed from edit form */}
              <div><Label>Sample Received Date</Label><Input type="date" {...editForm.register('sampleDeliveryDate')} disabled={!labEditable.has('sampleDeliveryDate')} /></div>

              <div><Label>Extraction Protocol</Label><Input {...editForm.register('extractionProtocol')} disabled={!labEditable.has('extractionProtocol')} /></div>
              <div><Label>Extraction Quality Check</Label><Input {...editForm.register('extractionQualityCheck')} disabled={!labEditable.has('extractionQualityCheck')} /></div>
              <div><Label>Extraction QC Status</Label><Input {...editForm.register('extractionQCStatus')} disabled={!labEditable.has('extractionQCStatus')} /></div>
              <div><Label>Extraction Process</Label><Input {...editForm.register('extractionProcess')} disabled={!labEditable.has('extractionProcess')} /></div>

              <div><Label>Library Preparation Protocol</Label><Input {...editForm.register('libraryPreparationProtocol')} disabled={!labEditable.has('libraryPreparationProtocol')} /></div>
              <div><Label>Library Preparation Quality Check</Label><Input {...editForm.register('libraryPreparationQualityCheck')} disabled={!labEditable.has('libraryPreparationQualityCheck')} /></div>
              <div><Label>Library QC Status</Label><Input {...editForm.register('libraryQCStatus')} disabled={!labEditable.has('libraryQCStatus')} /></div>
              <div><Label>Library Process</Label><Input {...editForm.register('libraryProcess')} disabled={!labEditable.has('libraryProcess')} /></div>

              <div><Label>Purification Protocol</Label><Input {...editForm.register('purificationProtocol')} disabled={!labEditable.has('purificationProtocol')} /></div>
              <div><Label>Purification Quality Check</Label><Input {...editForm.register('purificationQualityCheck')} disabled={!labEditable.has('purificationQualityCheck')} /></div>
              <div><Label>Purification QC Status</Label><Input {...editForm.register('purificationQCStatus')} disabled={!labEditable.has('purificationQCStatus')} /></div>
              <div><Label>Purification Process</Label><Input {...editForm.register('purificationProcess')} disabled={!labEditable.has('purificationProcess')} /></div>

              <div><Label>Alert to Bioinformatics Team</Label><div className="pt-2"><Checkbox {...editForm.register('alertToBioinformaticsTeam')} disabled={!labEditable.has('alertToBioinformaticsTeam')} /></div></div>
              <div><Label>Alert to Technical Lead</Label><div className="pt-2"><Checkbox {...editForm.register('alertToTechnicalLead')} disabled={!labEditable.has('alertToTechnicalLead')} /></div></div>

              <div>
                <Label>Progenics TRF</Label>
                <Input {...editForm.register('progenicsTrf')} disabled placeholder="TRF reference" />
              </div>

              <div><Label>Created At</Label><Input type="datetime-local" {...editForm.register('createdAt')} disabled={!labEditable.has('createdAt')} /></div>
              <div><Label>Created By</Label><Input {...editForm.register('createdBy')} disabled={!labEditable.has('createdBy')} /></div>
              <div><Label>Modified At</Label><Input type="datetime-local" {...editForm.register('modifiedAt')} disabled={!labEditable.has('modifiedAt')} /></div>
              <div><Label>Modified By</Label><Input {...editForm.register('modifiedBy')} disabled={!labEditable.has('modifiedBy')} /></div>

              <div className="col-span-2"><Label>Remark/Comment</Label><Textarea {...editForm.register('remarksComment')} disabled={!labEditable.has('remarksComment')} /></div>
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