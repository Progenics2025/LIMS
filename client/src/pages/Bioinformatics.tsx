import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useRecycle } from '@/contexts/RecycleContext';
import { useAuth } from "@/contexts/AuthContext";
import { Activity, Cpu, CheckCircle, Search, Edit as EditIcon, Trash2, Clock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { FilterBar } from "@/components/FilterBar";
import { useColumnPreferences, ColumnConfig } from '@/hooks/useColumnPreferences';
import { ColumnSettings } from '@/components/ColumnSettings';
import { sortData } from '@/lib/utils';

type BIRecord = {
  id: string;
  uniqueId: string;
  projectId?: string;
  sampleId?: string;
  clientId?: string;
  organisationHospital?: string;
  clinicianResearcherName?: string;
  patientClientName?: string;
  age?: string;
  gender?: string;
  serviceName?: string;
  // noOfSamples removed from UI
  sequencingStatus?: string;
  sequencingDataStorageDate?: string;
  basecalling?: string;
  basecallingDataStorageDate?: string;
  workflowType?: string;
  analysisStatus?: string;
  analysisDate?: string;
  thirdPartyName?: string;
  sampleSentToThirdPartyDate?: string;
  thirdPartyTrf?: string;
  resultsRawDataReceivedFromThirdPartyDate?: string;
  thirdPartyReport?: string;
  tat?: string;
  vcfFileLink?: string;
  cnvStatus?: string;
  progenicsRawData?: string;
  progenicsRawDataSize?: string;
  progenicsRawDataLink?: string;
  analysisHtmlLink?: string;
  relativeAbundanceSheet?: string;
  dataAnalysisSheet?: string;
  databaseToolsInformation?: string;
  alertToTechnicalLeadd?: boolean;
  alertToReportTeam?: boolean;
  createdAt?: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
  remarkComment?: string;
};

export default function Bioinformatics() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BIRecord[]>([]);
  const [sendingIds, setSendingIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<BIRecord | null>(null);
  const { add } = useRecycle();
  const [, setLocation] = useLocation();

  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [dateFilterField, setDateFilterField] = useState<string>('createdAt');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');
  // BI type filter: 'all' | 'clinical' | 'discovery' - Optional filtering, shows all by default
  const [biTypeFilter, setBiTypeFilter] = useState<'all' | 'clinical' | 'discovery'>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Sorting state (per-column) - Default to createdAt descending (newest first)
  const [sortKey, setSortKey] = useState<string | null>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Column configuration for hide/show feature
  const bioinformaticsColumns: ColumnConfig[] = useMemo(() => [
    { id: 'uniqueId', label: 'Unique ID', canHide: false }, // Primary identifier
    { id: 'projectId', label: 'Project ID', defaultVisible: true },
    { id: 'sampleId', label: 'Sample ID', defaultVisible: true },
    { id: 'clientId', label: 'Client ID', defaultVisible: true },
    { id: 'organisationHospital', label: 'Organisation/Hospital', defaultVisible: true },
    { id: 'clinicianResearcherName', label: 'Clinician/Researcher Name', defaultVisible: true },
    { id: 'patientClientName', label: 'Patient/Client Name', defaultVisible: true },
    { id: 'age', label: 'Age', defaultVisible: false }, // Hidden by default
    { id: 'gender', label: 'Gender', defaultVisible: false }, // Hidden by default
    { id: 'serviceName', label: 'Service Name', defaultVisible: true },
    { id: 'noOfSamples', label: 'No of Samples', defaultVisible: false }, // Hidden by default
    { id: 'sequencingStatus', label: 'Sequencing Status', defaultVisible: true },
    { id: 'sequencingDataStorageDate', label: 'Sequencing Data Storage Date', defaultVisible: false },
    { id: 'basecalling', label: 'Basecalling', defaultVisible: false },
    { id: 'basecallingDataStorageDate', label: 'Basecalling Data Storage Date', defaultVisible: false },
    { id: 'workflowType', label: 'Workflow Type', defaultVisible: false },
    { id: 'analysisStatus', label: 'Analysis Status', defaultVisible: true },
    { id: 'analysisDate', label: 'Analysis Date', defaultVisible: true },
    { id: 'thirdPartyName', label: 'Third Party Name', defaultVisible: false },
    { id: 'sampleSentToThirdPartyDate', label: 'Sample Sent to 3rd Party Date', defaultVisible: false },
    { id: 'thirdPartyTrf', label: 'Third Party TRF', defaultVisible: false },
    { id: 'resultsRawDataReceivedDate', label: 'Results Received Date', defaultVisible: false },
    { id: 'thirdPartyReport', label: 'Third Party Report', defaultVisible: false },
    { id: 'tat', label: 'TAT', defaultVisible: true },
    { id: 'vcfFileLink', label: 'VCF File Link', defaultVisible: false },
    { id: 'cnvStatus', label: 'CNV Status', defaultVisible: false },
    { id: 'progenicsRawData', label: 'Progenics Raw Data', defaultVisible: false },
    { id: 'progenicsRawDataSize', label: 'Progenics Raw Data Size', defaultVisible: false },
    { id: 'progenicsRawDataLink', label: 'Progenics Raw Data Link', defaultVisible: false },
    { id: 'analysisHtmlLink', label: 'Analysis HTML Link', defaultVisible: false },
    { id: 'relativeAbundanceSheet', label: 'Relative Abundance Sheet', defaultVisible: false },
    { id: 'dataAnalysisSheet', label: 'Data Analysis Sheet', defaultVisible: false },
    { id: 'databaseToolsInformation', label: 'Database/Tools Information', defaultVisible: false },
    { id: 'alertToTechnicalLead', label: 'Alert to Technical Lead', defaultVisible: true },
    { id: 'alertToReportTeam', label: 'Alert to Report Team', defaultVisible: true },
    { id: 'createdAt', label: 'Created At', defaultVisible: false },
    { id: 'createdBy', label: 'Created By', defaultVisible: false },
    { id: 'modifiedAt', label: 'Modified At', defaultVisible: false },
    { id: 'modifiedBy', label: 'Modified By', defaultVisible: false },
    { id: 'remarkComment', label: 'Remark/Comment', defaultVisible: true },
    { id: 'actions', label: 'Actions', canHide: false }, // Always visible
  ], []);

  // Column visibility preferences (per-user)
  const columnPrefs = useColumnPreferences('bioinformatics_table', bioinformaticsColumns);

  const form = useForm<BIRecord>({ defaultValues: {} as any });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Send to Reports mutation
  // 🔍 Helper: Extract prefix from sample ID (e.g., "25AD12171225" from "25AD12171225_001")
  const getSampleIdPrefix = (sampleId?: string): string | null => {
    if (!sampleId) return null;
    const parts = sampleId.split('_');
    return parts.length > 1 ? parts[0] : sampleId;
  };

  // 🔍 Helper: Find all records with matching sample ID prefix
  const getRecordsWithSamplePrefix = (record: BIRecord, allRecords: BIRecord[]): BIRecord[] => {
    const prefix = getSampleIdPrefix(record.sampleId);
    if (!prefix) return [record];

    return allRecords.filter((r) => {
      const rPrefix = getSampleIdPrefix((r as any).sampleId);
      return rPrefix === prefix;
    });
  };

  const sendToReportsMutation = useMutation({
    mutationFn: async (record: BIRecord) => {
      // Send only the clicked record (no automatic batch)
      const recordsToSend = [record];
      console.log(`Sending single record ${record.id} (sample ${record.sampleId})`);

      // Send records sequentially so each turns green individually
      const responses = [];
      for (const rec of recordsToSend) {
        setSendingIds((s) => [...s, rec.id]);
        try {
          const response = await apiRequest('POST', '/api/send-to-reports', {
            // IDs
            bioinformaticsId: rec.id,
            uniqueId: rec.id,
            projectId: rec.projectId,
            // Patient info
            patientClientName: rec.patientClientName,
            age: rec.age,
            gender: rec.gender,
            // Clinician info
            clinicianResearcherName: rec.clinicianResearcherName,
            organisationHospital: rec.organisationHospital,
            // Service info
            serviceName: rec.serviceName,
            // TAT and comments
            tat: rec.tat,
            remarkComment: rec.remarkComment,
            // Optional: lead fields
            createdBy: rec.createdBy,
            modifiedBy: rec.modifiedBy,
            // Additional useful fields
            sampleId: rec.sampleId,
            analysisDate: rec.analysisDate,
            clientId: rec.clientId,
          });
          const result = await response.json();
          responses.push(result);

          // Try to persist the 'sent' flag on the bioinformatics record so it remains after refresh
          try {
            const projectId = (rec as any).projectId || '';
            const isDiscovery = String(projectId).startsWith('DG');
            const isClinical = String(projectId).startsWith('PG');
            const bioEndpoint = isDiscovery
              ? `/api/bioinfo-discovery-sheet/${encodeURIComponent(rec.id)}`
              : isClinical
                ? `/api/bioinfo-clinical-sheet/${encodeURIComponent(rec.id)}`
                : `/api/bioinformatics/${encodeURIComponent(rec.id)}`;

            await apiRequest('PUT', bioEndpoint, { alert_to_report_team: true });
          } catch (err) {
            // non-fatal: log and continue; UI will still update locally
            console.warn('Failed to persist alert_to_report_team on bioinformatics record', err);
          }

          // 🟢 Mark this record as sent immediately (local UI)
          setRows((prevRows) =>
            prevRows.map((r) =>
              r.id === rec.id ? { ...r, alertToReportTeam: true } : r
            )
          );

          // 🔄 Refresh ReportManagement to show new record immediately
          await queryClient.refetchQueries({ queryKey: ['/api/report_management'] });

        } catch (error: any) {
          // 🔍 Handle 409 (duplicate/already exists) as a success response
          if (error.status === 409) {
            responses.push(error.body);

            // Mark as sent even if already exists
            setRows((prevRows) =>
              prevRows.map((r) =>
                r.id === rec.id ? { ...r, alertToReportTeam: true } : r
              )
            );

            // Refresh ReportManagement
            await queryClient.refetchQueries({ queryKey: ['/api/report_management'] });
          } else {
            throw error;
          }
        } finally {
          setSendingIds((s) => s.filter((id) => id !== rec.id));
        }
      }

      return { responses, recordsToSend };
    },
    onSuccess: async (data: any, recordData: any) => {
      const { responses, recordsToSend } = data;

      await queryClient.invalidateQueries({ queryKey: ['/api/bioinfo-discovery-sheet'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/bioinfo-clinical-sheet'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/report_management'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/report'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'], refetchType: 'all' });
      // Notify ProcessMaster to refresh for real-time updates
      window.dispatchEvent(new CustomEvent('ll:data:changed', { detail: { action: 'bioinformatics-updated' } }));

      // Show summary toast
      const successCount = responses.filter((r: any) => r.success && !r.alreadyExists).length;
      const duplicateCount = responses.filter((r: any) => r.alreadyExists).length;

      if (successCount > 0) {
        toast({
          title: `Batch Send Complete`,
          description: `${successCount} record(s) sent to Reports${duplicateCount > 0 ? `, ${duplicateCount} already existed` : ''}`,
        });
      } else if (duplicateCount > 0) {
        toast({
          title: "Reports Already Sent",
          description: `All ${duplicateCount} record(s) have already been released for this sample.`,
        });
      }
    },
    onError: (error: any) => {
      // 🔍 Better error handling - don't navigate on error
      const errorMessage = error?.body?.message || error?.message || "Failed to send bioinformatics records to Reports";

      toast({
        title: "Failed to send to Reports",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Filter records based on search and filters
  const filteredRows = rows.filter((record) => {
    // 1. Analysis Status Filter
    if (statusFilter !== 'all' && record.analysisStatus !== statusFilter) {
      return false;
    }

    // 2. Search Query (Global)
    let matchesSearch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch = Object.values(record).some(val => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') return Object.values(val).some(v => String(v ?? '').toLowerCase().includes(q));
        return String(val).toLowerCase().includes(q);
      });
    }

    // 3. Date Range Filter
    let matchesDate = true;
    if (dateRange.from) {
      const dateVal = (record as any)[dateFilterField];
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

  // Apply BI type filter (if set)
  const typeFilteredRows = filteredRows.filter((record) => {
    if (!biTypeFilter || biTypeFilter === 'all') return true;

    // Logic based on project_id prefix: PG -> Clinical, DG -> Discovery
    const projectId = (record.projectId || '').toUpperCase();

    if (projectId.startsWith('PG')) {
      return biTypeFilter === 'clinical';
    }
    if (projectId.startsWith('DG')) {
      return biTypeFilter === 'discovery';
    }

    // Fallback: if no project_id or doesn't match prefix pattern, include in both
    return true;
  });



  // Pagination calculations (after applying BI type filter)
  const totalFiltered = typeFilteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  // Reset to first page if current page exceeds total pages
  if (page > totalPages) setPage(totalPages);
  const start = (page - 1) * pageSize;
  // Apply sorting
  const sortedRows = useMemo(() => {
    return sortData(typeFilteredRows, sortKey as keyof BIRecord | null, sortDir);
  }, [typeFilteredRows, sortKey, sortDir]);

  const visibleRows = sortedRows.slice(start, start + pageSize);

  const openEdit = (r: BIRecord) => {
    setEditing(r);
    form.reset(r);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Add to recycle bin (frontend-only) before removing
    try {
      const item = rows.find(r => r.id === id);
      if (item) {
        add({ entityType: 'bioinformatics', entityId: id, name: item.id ?? item.sampleId ?? id, originalPath: '/bioinformatics', data: item });
      }
    } catch (err) {
      // ignore recycle failures
    }

    // Determine which table to delete from based on project ID prefix
    const record = rows.find(r => r.id === id);
    const projectId = record?.projectId || '';
    const isDiscovery = projectId.startsWith('DG');
    const isClinical = projectId.startsWith('PG');

    // Choose appropriate endpoint
    let endpoint = `/api/bioinformatics/${encodeURIComponent(id)}`; // fallback
    if (isDiscovery) {
      endpoint = `/api/bioinfo-discovery-sheet/${encodeURIComponent(id)}`;
    } else if (isClinical) {
      endpoint = `/api/bioinfo-clinical-sheet/${encodeURIComponent(id)}`;
    }

    // Try server-side delete
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        setRows((s) => s.filter((r) => r.id !== id));
      } else if (res.status === 404) {
        // endpoint not found on server - fallback
        setRows((s) => s.filter((r) => r.id !== id));
      } else {
        // unexpected server response - fallback locally but log
        console.warn('Delete bioinformatics API returned', res.status);
        setRows((s) => s.filter((r) => r.id !== id));
      }
    } catch (err) {
      // network error or endpoint missing - fallback to local state
      setRows((s) => s.filter((r) => r.id !== id));
    }

    // Reset to previous page if deleting last item on page
    if (visibleRows.length === 1 && page > 1) {
      setPage(page - 1);
    }
  };

  const onSave = async (formData: BIRecord) => {
    const data = { ...editing, ...formData } as BIRecord;
    // Determine which table to update based on project ID prefix
    const projectId = data.projectId || '';
    const isDiscovery = projectId.startsWith('DG');
    const isClinical = projectId.startsWith('PG');

    // Choose appropriate endpoint
    let endpoint = `/api/bioinformatics/${encodeURIComponent(data.id)}`; // fallback
    if (isDiscovery) {
      endpoint = `/api/bioinfo-discovery-sheet/${encodeURIComponent(data.id)}`;
    } else if (isClinical) {
      endpoint = `/api/bioinfo-clinical-sheet/${encodeURIComponent(data.id)}`;
    }

    // Convert camelCase to snake_case for database
    const dbData: any = {
      funique_id: data.uniqueId,
      project_id: data.projectId,
      sample_id: data.sampleId,
      client_id: data.clientId,
      organisation_hospital: data.organisationHospital,
      clinician_researcher_name: data.clinicianResearcherName,
      patient_client_name: data.patientClientName,
      age: data.age,
      gender: data.gender,
      service_name: data.serviceName,
      sequencing_status: data.sequencingStatus,
      sequencing_data_storage_date: data.sequencingDataStorageDate,
      basecalling: data.basecalling,
      basecalling_data_storage_date: data.basecallingDataStorageDate,
      workflow_type: data.workflowType,
      analysis_status: data.analysisStatus,
      analysis_date: data.analysisDate,
      third_party_name: data.thirdPartyName,
      sample_sent_to_third_party_date: data.sampleSentToThirdPartyDate,
      third_party_trf: data.thirdPartyTrf,
      results_raw_data_received_from_third_party_date: data.resultsRawDataReceivedFromThirdPartyDate,
      third_party_report: data.thirdPartyReport,
      tat: data.tat,
      vcf_file_link: data.vcfFileLink,
      cnv_status: data.cnvStatus,
      progenics_raw_data: data.progenicsRawData,
      progenics_raw_data_size: data.progenicsRawDataSize,
      progenics_raw_data_link: data.progenicsRawDataLink,
      analysis_html_link: data.analysisHtmlLink,
      relative_abundance_sheet: data.relativeAbundanceSheet,
      data_analysis_sheet: data.dataAnalysisSheet,
      database_tools_information: data.databaseToolsInformation,
      alert_to_technical_leadd: data.alertToTechnicalLeadd,
      alert_to_report_team: data.alertToReportTeam,
      modified_by: user?.name || user?.email || 'system',
      remark_comment: data.remarkComment,
    };

    // Try to save on server first; if it fails, update locally
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbData),
      });
      if (res.ok) {
        const updated = await res.json();
        // Map back from snake_case to camelCase
        const mappedUpdate = {
          id: String(updated.id),
          uniqueId: updated.unique_id,
          projectId: updated.project_id,
          sampleId: updated.sample_id,
          clientId: updated.client_id,
          organisationHospital: updated.organisation_hospital,
          clinicianResearcherName: updated.clinician_researcher_name,
          patientClientName: updated.patient_client_name,
          age: updated.age,
          gender: updated.gender,
          serviceName: updated.service_name,
          noOfSamples: updated.no_of_samples,
          sequencingStatus: updated.sequencing_status,
          sequencingDataStorageDate: updated.sequencing_data_storage_date,
          basecalling: updated.basecalling,
          basecallingDataStorageDate: updated.basecalling_data_storage_date,
          workflowType: updated.workflow_type,
          analysisStatus: updated.analysis_status,
          analysisDate: updated.analysis_date,
          thirdPartyName: updated.third_party_name,
          sampleSentToThirdPartyDate: updated.sample_sent_to_third_party_date,
          thirdPartyTrf: updated.third_party_trf,
          resultsRawDataReceivedFromThirdPartyDate: updated.results_raw_data_received_from_third_party_date,
          thirdPartyReport: updated.third_party_report,
          tat: updated.tat,
          vcfFileLink: updated.vcf_file_link,
          cnvStatus: updated.cnv_status,
          progenicsRawData: updated.progenics_raw_data,
          progenicsRawDataSize: updated.progenics_raw_data_size,
          progenicsRawDataLink: updated.progenics_raw_data_link,
          analysisHtmlLink: updated.analysis_html_link,
          relativeAbundanceSheet: updated.relative_abundance_sheet,
          dataAnalysisSheet: updated.data_analysis_sheet,
          databaseToolsInformation: updated.database_tools_information,
          alertToTechnicalLeadd: updated.alert_to_technical_leadd || updated.alert_to_technical_lead,
          alertToReportTeam: updated.alert_to_report_team,
          createdAt: updated.created_at,
          createdBy: updated.created_by,
          modifiedAt: updated.modified_at,
          modifiedBy: updated.modified_by,
          remarkComment: updated.remark_comment,
        };
        setRows((s) => s.map((r) => (r.id === mappedUpdate.id ? { ...r, ...mappedUpdate } : r)));
      } else if (res.status === 404) {
        // endpoint not present - fallback to local
        setRows((s) => s.map((r) => (r.id === data.id ? { ...r, ...data } : r)));
      } else {
        console.warn('Save bioinformatics API returned', res.status);
        setRows((s) => s.map((r) => (r.id === data.id ? { ...r, ...data } : r)));
      }
    } catch (err) {
      // network error - fallback to local state
      setRows((s) => s.map((r) => (r.id === data.id ? { ...r, ...data } : r)));
    }

    setIsOpen(false);
    setEditing(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof BIRecord) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Map field names to API categories
      const categoryMap: { [key: string]: string } = {
        thirdPartyTrf: 'Thirdparty_TRF',
        thirdPartyReport: 'Thirdparty_Report',
      };
      const category = categoryMap[field as string] || 'Thirdparty_TRF';

      // Use the new categorized API endpoint
      const res = await fetch(`/api/uploads/categorized?category=${category}&entityType=bioinformatics`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      // Store the file path from the new API response
      form.setValue(field, data.filePath);

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

  // On mount, try to load bioinformatics records from server if available
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetch from both bioinformatics sheet tables (new primary endpoints)
        const [dRes, cRes] = await Promise.allSettled([
          fetch('/api/bioinfo-discovery-sheet'),
          fetch('/api/bioinfo-clinical-sheet'),
        ]);

        const rows: BIRecord[] = [];

        // Process discovery sheet response
        if (dRes.status === 'fulfilled' && dRes.value.ok) {
          try {
            const p = await dRes.value.json();
            if (Array.isArray(p)) {
              // Map database fields to BIRecord format
              const mapped = p.map((item: any) => ({
                id: String(item.id),
                uniqueId: item.unique_id || '',
                projectId: item.project_id,
                sampleId: item.sample_id,
                clientId: item.client_id,
                organisationHospital: item.organisation_hospital,
                clinicianResearcherName: item.clinician_researcher_name,
                patientClientName: item.patient_client_name,
                age: item.age,
                gender: item.gender,
                serviceName: item.service_name,
                noOfSamples: item.no_of_samples,
                sequencingStatus: item.sequencing_status,
                sequencingDataStorageDate: item.sequencing_data_storage_date,
                basecalling: item.basecalling,
                basecallingDataStorageDate: item.basecalling_data_storage_date,
                workflowType: item.workflow_type,
                analysisStatus: item.analysis_status,
                analysisDate: item.analysis_date,
                thirdPartyName: item.third_party_name,
                sampleSentToThirdPartyDate: item.sample_sent_to_third_party_date,
                thirdPartyTrf: item.third_party_trf,
                resultsRawDataReceivedFromThirdPartyDate: item.results_raw_data_received_from_third_party_date,
                thirdPartyReport: item.third_party_report,
                tat: item.tat,
                vcfFileLink: item.vcf_file_link,
                cnvStatus: item.cnv_status,
                progenicsRawData: item.progenics_raw_data,
                progenicsRawDataSize: item.progenics_raw_data_size,
                progenicsRawDataLink: item.progenics_raw_data_link,
                analysisHtmlLink: item.analysis_html_link,
                relativeAbundanceSheet: item.relative_abundance_sheet,
                dataAnalysisSheet: item.data_analysis_sheet,
                databaseToolsInformation: item.database_tools_information,
                alertToTechnicalLeadd: Boolean(item.alert_to_technical_leadd || item.alert_to_technical_lead),
                alertToReportTeam: Boolean(item.alert_to_report_team),
                createdAt: item.created_at,
                createdBy: item.created_by,
                modifiedAt: item.modified_at,
                modifiedBy: item.modified_by,
                remarkComment: item.remark_comment,
              }));
              rows.push(...mapped);
            }
          } catch (e) { /* ignore parse */ }
        }

        // Process clinical sheet response
        if (cRes.status === 'fulfilled' && cRes.value.ok) {
          try {
            const p = await cRes.value.json();
            if (Array.isArray(p)) {
              // Map database fields to BIRecord format
              const mapped = p.map((item: any) => ({
                id: String(item.id),
                uniqueId: item.unique_id || '',
                projectId: item.project_id,
                sampleId: item.sample_id,
                clientId: item.client_id,
                organisationHospital: item.organisation_hospital,
                clinicianResearcherName: item.clinician_researcher_name,
                patientClientName: item.patient_client_name,
                age: item.age,
                gender: item.gender,
                serviceName: item.service_name,
                noOfSamples: item.no_of_samples,
                sequencingStatus: item.sequencing_status,
                sequencingDataStorageDate: item.sequencing_data_storage_date,
                basecalling: item.basecalling,
                basecallingDataStorageDate: item.basecalling_data_storage_date,
                workflowType: item.workflow_type,
                analysisStatus: item.analysis_status,
                analysisDate: item.analysis_date,
                thirdPartyName: item.third_party_name,
                sampleSentToThirdPartyDate: item.sample_sent_to_third_party_date,
                thirdPartyTrf: item.third_party_trf,
                resultsRawDataReceivedFromThirdPartyDate: item.results_raw_data_received_from_third_party_date,
                thirdPartyReport: item.third_party_report,
                tat: item.tat,
                vcfFileLink: item.vcf_file_link,
                cnvStatus: item.cnv_status,
                progenicsRawData: item.progenics_raw_data,
                progenicsRawDataSize: item.progenics_raw_data_size,
                progenicsRawDataLink: item.progenics_raw_data_link,
                analysisHtmlLink: item.analysis_html_link,
                relativeAbundanceSheet: item.relative_abundance_sheet,
                dataAnalysisSheet: item.data_analysis_sheet,
                databaseToolsInformation: item.database_tools_information,
                alertToTechnicalLeadd: Boolean(item.alert_to_technical_leadd || item.alert_to_technical_lead),
                alertToReportTeam: Boolean(item.alert_to_report_team),
                createdAt: item.created_at,
                createdBy: item.created_by,
                modifiedAt: item.modified_at,
                modifiedBy: item.modified_by,
                remarkComment: item.remark_comment,
              }));
              rows.push(...mapped);
            }
          } catch (e) { /* ignore parse */ }
        }

        // Fallback to legacy endpoints if no data from new tables
        if (rows.length === 0) {
          const [dLegacy, cLegacy] = await Promise.allSettled([
            fetch('/api/bioinfo/discovery'),
            fetch('/api/bioinfo/clinical'),
          ]);

          if (dLegacy.status === 'fulfilled' && dLegacy.value.ok) {
            try { const p = await dLegacy.value.json(); if (Array.isArray(p)) rows.push(...p); } catch (e) { /* ignore */ }
          }
          if (cLegacy.status === 'fulfilled' && cLegacy.value.ok) {
            try { const p = await cLegacy.value.json(); if (Array.isArray(p)) rows.push(...p); } catch (e) { /* ignore */ }
          }

          // Final fallback to /api/bioinformatics
          if (rows.length === 0) {
            try {
              const res = await fetch('/api/bioinformatics');
              if (res.ok) {
                const payload = await res.json();
                if (!cancelled && Array.isArray(payload)) setRows(payload as BIRecord[]);
                return;
              }
            } catch (e) { /* ignore */ }
          }
        }

        if (!cancelled && rows.length > 0) setRows(rows);
      } catch (err) {
        // ignore - no data available
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'running': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getReportStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'delivered': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getAlertBadgeColor = (alert: boolean) => {
    return alert
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bioinformatics</h1>
          <p className="text-muted-foreground">Manage sequencing analyses and reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              className={biTypeFilter === 'clinical' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
              aria-pressed={biTypeFilter === 'clinical'}
              onClick={() => setBiTypeFilter(biTypeFilter === 'clinical' ? 'all' : 'clinical')}
            >
              Clinical
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={biTypeFilter === 'discovery' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
              aria-pressed={biTypeFilter === 'discovery'}
              onClick={() => setBiTypeFilter(biTypeFilter === 'discovery' ? 'all' : 'discovery')}
            >
              Discovery
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-emerald-50 flex items-center justify-center mb-3">
            <Activity className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold">{typeFilteredRows.length}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Analyses</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-orange-50 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-extrabold">{typeFilteredRows.filter((r) => r.analysisStatus === 'pending').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Pending</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-amber-50 flex items-center justify-center mb-3">
            <Cpu className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold">{typeFilteredRows.filter((r) => r.analysisStatus === 'running').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Running</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-sky-50 flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold">{typeFilteredRows.filter((r) => r.analysisStatus === 'completed').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Completed</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bioinformatics Queue</CardTitle>
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
              { label: "Analysis Date", value: "analysisDate" },
              { label: "Sequencing Data Storage Date", value: "sequencingDataStorageDate" },
              { label: "Basecalling Data Storage Date", value: "basecallingDataStorageDate" },
              { label: "Sample Sent to 3rd Party", value: "sampleSentToThirdPartyDate" },
              { label: "Results Received from 3rd Party", value: "resultsRawDataReceivedFromThirdPartyDate" },
              { label: "Modified At", value: "modifiedAt" },
            ]}
            totalItems={totalFiltered}
            pageSize={pageSize}
            setPageSize={setPageSize}
            setPage={setPage}
            placeholder="Search Unique ID / Project ID / Sample ID / Client ID..."
          >
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Analysis Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={reportStatusFilter}
              onValueChange={(value) => {
                setReportStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Report Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>

          {/* Column Visibility Settings */}
          <div className="mt-2">
            <ColumnSettings
              columns={bioinformaticsColumns}
              isColumnVisible={columnPrefs.isColumnVisible}
              toggleColumn={columnPrefs.toggleColumn}
              resetToDefaults={columnPrefs.resetToDefaults}
              showAllColumns={columnPrefs.showAllColumns}
              showCompactView={columnPrefs.showCompactView}
              visibleCount={columnPrefs.visibleCount}
              totalCount={columnPrefs.totalCount}
            />
          </div>

          <div className="overflow-x-auto leads-table-wrapper process-table-wrapper">
            <div className="max-h-[60vh] overflow-y-auto">
              <Table className="leads-table">
                <TableHeader className="sticky top-0 bg-white/95 dark:bg-gray-900/95 z-30 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  <TableRow>
                    {columnPrefs.isColumnVisible('uniqueId') && <TableHead onClick={() => { setSortKey('uniqueId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold sticky left-0 z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[120px]">Unique ID{sortKey === 'uniqueId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('projectId') && <TableHead onClick={() => { setSortKey('projectId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold sticky left-[120px] z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Project ID{sortKey === 'projectId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('sampleId') && <TableHead onClick={() => { setSortKey('sampleId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Sample ID{sortKey === 'sampleId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('clientId') && <TableHead onClick={() => { setSortKey('clientId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Client ID{sortKey === 'clientId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('organisationHospital') && <TableHead onClick={() => { setSortKey('organisationHospital'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Organisation/Hospital{sortKey === 'organisationHospital' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('clinicianResearcherName') && <TableHead onClick={() => { setSortKey('clinicianResearcherName'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Clinician/Researcher name{sortKey === 'clinicianResearcherName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('patientClientName') && <TableHead onClick={() => { setSortKey('patientClientName'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Patient/Client name{sortKey === 'patientClientName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('age') && <TableHead onClick={() => { setSortKey('age'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Age{sortKey === 'age' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('gender') && <TableHead onClick={() => { setSortKey('gender'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Gender{sortKey === 'gender' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('serviceName') && <TableHead onClick={() => { setSortKey('serviceName'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Service name{sortKey === 'serviceName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('noOfSamples') && <TableHead onClick={() => { setSortKey('noOfSamples'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">No of Samples{sortKey === 'noOfSamples' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('sequencingStatus') && <TableHead onClick={() => { setSortKey('sequencingStatus'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Sequencing status{sortKey === 'sequencingStatus' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('sequencingDataStorageDate') && <TableHead onClick={() => { setSortKey('sequencingDataStorageDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Sequencing data storage date{sortKey === 'sequencingDataStorageDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('basecalling') && <TableHead onClick={() => { setSortKey('basecalling'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Basecalling{sortKey === 'basecalling' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('basecallingDataStorageDate') && <TableHead onClick={() => { setSortKey('basecallingDataStorageDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Basecalling data storage date{sortKey === 'basecallingDataStorageDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('workflowType') && <TableHead onClick={() => { setSortKey('workflowType'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Workflow type{sortKey === 'workflowType' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('analysisStatus') && <TableHead onClick={() => { setSortKey('analysisStatus'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Analysis status{sortKey === 'analysisStatus' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('analysisDate') && <TableHead onClick={() => { setSortKey('analysisDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Analysis date{sortKey === 'analysisDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('thirdPartyName') && <TableHead onClick={() => { setSortKey('thirdPartyName'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Third party Name{sortKey === 'thirdPartyName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('sampleSentToThirdPartyDate') && <TableHead onClick={() => { setSortKey('sampleSentToThirdPartyDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Sample sent to third party Date{sortKey === 'sampleSentToThirdPartyDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('thirdPartyTrf') && <TableHead onClick={() => { setSortKey('thirdPartyTrf'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Third party TRF{sortKey === 'thirdPartyTrf' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('resultsRawDataReceivedDate') && <TableHead onClick={() => { setSortKey('resultsRawDataReceivedDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Results/Raw data received date{sortKey === 'resultsRawDataReceivedDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('thirdPartyReport') && <TableHead onClick={() => { setSortKey('thirdPartyReport'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Third party report{sortKey === 'thirdPartyReport' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('tat') && <TableHead onClick={() => { setSortKey('tat'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">TAT{sortKey === 'tat' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('vcfFileLink') && <TableHead onClick={() => { setSortKey('vcfFileLink'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">VCF file link{sortKey === 'vcfFileLink' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('cnvStatus') && <TableHead onClick={() => { setSortKey('cnvStatus'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">CNV status{sortKey === 'cnvStatus' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('progenicsRawData') && <TableHead onClick={() => { setSortKey('progenicsRawData'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Progenics raw data{sortKey === 'progenicsRawData' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('progenicsRawDataSize') && <TableHead onClick={() => { setSortKey('progenicsRawDataSize'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Progenics raw data size{sortKey === 'progenicsRawDataSize' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('progenicsRawDataLink') && <TableHead onClick={() => { setSortKey('progenicsRawDataLink'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Progenics raw data link{sortKey === 'progenicsRawDataLink' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('analysisHtmlLink') && <TableHead onClick={() => { setSortKey('analysisHtmlLink'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Analysis HTML link{sortKey === 'analysisHtmlLink' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('relativeAbundanceSheet') && <TableHead onClick={() => { setSortKey('relativeAbundanceSheet'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Relative abundance sheet{sortKey === 'relativeAbundanceSheet' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('dataAnalysisSheet') && <TableHead onClick={() => { setSortKey('dataAnalysisSheet'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Data analysis sheet{sortKey === 'dataAnalysisSheet' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('databaseToolsInformation') && <TableHead onClick={() => { setSortKey('databaseToolsInformation'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Database/Tools information{sortKey === 'databaseToolsInformation' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('alertToTechnicalLead') && <TableHead onClick={() => { setSortKey('alertToTechnicalLead'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Alert to Technical lead{sortKey === 'alertToTechnicalLead' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('alertToReportTeam') && <TableHead onClick={() => { setSortKey('alertToReportTeam'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Alert to Report team{sortKey === 'alertToReportTeam' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('createdAt') && <TableHead onClick={() => { setSortKey('createdAt'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Created at{sortKey === 'createdAt' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('createdBy') && <TableHead onClick={() => { setSortKey('createdBy'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Created by{sortKey === 'createdBy' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('modifiedAt') && <TableHead onClick={() => { setSortKey('modifiedAt'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Modified at{sortKey === 'modifiedAt' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('modifiedBy') && <TableHead onClick={() => { setSortKey('modifiedBy'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Modified by{sortKey === 'modifiedBy' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('remarkComment') && <TableHead onClick={() => { setSortKey('remarkComment'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Remark/Comment{sortKey === 'remarkComment' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {columnPrefs.isColumnVisible('actions') && <TableHead className="sticky right-0 z-40 whitespace-nowrap font-semibold bg-white dark:bg-gray-900 border-l-2 border-gray-200 dark:border-gray-700 actions-column">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={41} className="text-center py-8 text-muted-foreground">
                        {typeFilteredRows.length === 0 ? "No bioinformatics records found" : "No records match your search criteria"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((r) => (
                      <TableRow key={r.id} className={`${(r as any).alertToReportTeam ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/20'} hover:bg-opacity-75 dark:hover:bg-opacity-75 cursor-pointer`}>
                        {columnPrefs.isColumnVisible('uniqueId') && <TableCell className={`font-medium sticky left-0 z-20 ${(r as any).alertToReportTeam ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/20'} border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] py-1 min-w-[120px]`}>{r.uniqueId ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('projectId') && <TableCell className={`sticky left-[120px] z-20 ${(r as any).alertToReportTeam ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/20'} border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] py-1`}>{(r as any).projectId ?? (r as any)._raw?.project_id ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('sampleId') && <TableCell className="py-1">{r.sampleId ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('clientId') && <TableCell className="py-1">{(r as any).clientId ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('organisationHospital') && <TableCell className="py-1">{(r as any).organisationHospital ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('clinicianResearcherName') && <TableCell className="py-1">{(r as any).clinicianResearcherName ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('patientClientName') && <TableCell className="py-1">{(r as any).patientClientName ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('age') && <TableCell className="py-1">{(r as any).age ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('gender') && <TableCell className="py-1">{(r as any).gender ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('serviceName') && <TableCell className="py-1">{(r as any).serviceName ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('noOfSamples') && <TableCell className="py-1">{(r as any).noOfSamples ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('sequencingStatus') && <TableCell className="py-1">{(r as any).sequencingStatus ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('sequencingDataStorageDate') && <TableCell className="py-1">{(r as any).sequencingDataStorageDate ? new Date((r as any).sequencingDataStorageDate).toLocaleDateString() : '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('basecalling') && <TableCell className="py-1">{(r as any).basecalling ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('basecallingDataStorageDate') && <TableCell className="py-1">{(r as any).basecallingDataStorageDate ? new Date((r as any).basecallingDataStorageDate).toLocaleDateString() : '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('workflowType') && <TableCell className="py-1">{(r as any).workflowType ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('analysisStatus') && <TableCell className="py-1">{(r as any).analysisStatus ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('analysisDate') && <TableCell className="py-1">{(r as any).analysisDate ? new Date((r as any).analysisDate).toLocaleDateString() : '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('thirdPartyName') && <TableCell className="py-1">{r.thirdPartyName ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('sampleSentToThirdPartyDate') && <TableCell className="py-1">{(r as any).sampleSentToThirdPartyDate ? new Date((r as any).sampleSentToThirdPartyDate).toLocaleDateString() : '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('thirdPartyTrf') && <TableCell className="py-1">{(r as any).thirdPartyTrf ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('resultsRawDataReceivedDate') && <TableCell className="py-1">{(r as any).resultsRawDataReceivedFromThirdPartyDate ? new Date((r as any).resultsRawDataReceivedFromThirdPartyDate).toLocaleDateString() : '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('thirdPartyReport') && <TableCell className="py-1">{(r as any).thirdPartyReport ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('tat') && <TableCell className="py-1">{(r as any).tat ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('vcfFileLink') && <TableCell className="py-1">{(r as any).vcfFileLink ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('cnvStatus') && <TableCell className="py-1">{(r as any).cnvStatus ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('progenicsRawData') && <TableCell className="py-1">{(r as any).progenicsRawData ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('progenicsRawDataSize') && <TableCell className="py-1">{(r as any).progenicsRawDataSize ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('progenicsRawDataLink') && <TableCell className="py-1">{(r as any).progenicsRawDataLink ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('analysisHtmlLink') && <TableCell className="py-1">{(r as any).analysisHtmlLink ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('relativeAbundanceSheet') && <TableCell className="py-1">{(r as any).relativeAbundanceSheet ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('dataAnalysisSheet') && <TableCell className="py-1">{(r as any).dataAnalysisSheet ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('databaseToolsInformation') && <TableCell className="py-1">{(r as any).databaseToolsInformation ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('alertToTechnicalLead') && <TableCell className="py-1">{(r as any).alertToTechnicalLeadd ? 'Yes' : 'No'}</TableCell>}
                        {columnPrefs.isColumnVisible('alertToReportTeam') && <TableCell className="py-1">{(r as any).alertToReportTeam ? 'Yes' : 'No'}</TableCell>}
                        {columnPrefs.isColumnVisible('createdAt') && <TableCell className="py-1">{(r as any).createdAt ? new Date((r as any).createdAt).toLocaleString() : '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('createdBy') && <TableCell className="py-1">{(r as any).createdBy ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('modifiedAt') && <TableCell className="py-1">{(r as any).modifiedAt ? new Date((r as any).modifiedAt).toLocaleString() : '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('modifiedBy') && <TableCell className="py-1">{(r as any).modifiedBy ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('remarkComment') && <TableCell className="max-w-[220px] truncate pr-4 py-1" title={(r as any).remarkComment || ''}>{(r as any).remarkComment ?? '-'}</TableCell>}
                        {columnPrefs.isColumnVisible('actions') && (
                          <TableCell className={`sticky right-0 z-20 border-l-2 border-gray-200 dark:border-gray-700 min-w-[150px] actions-column text-right ${(r as any).alertToReportTeam ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/20'} py-1`}>
                            <div className="action-buttons flex-shrink-0 flex space-x-2 items-center justify-end h-full px-2 py-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-1" aria-label="Edit record" onClick={() => openEdit(r)}>
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className={`min-w-[48px] px-2 py-1 h-7 rounded-md flex items-center justify-center gap-1 transition-all font-medium text-xs ${(r as any).alertToReportTeam
                                  ? 'bg-red-500 hover:bg-red-600 text-white cursor-not-allowed'
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                                  } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                                onClick={() => { sendToReportsMutation.mutate(r); }}
                                disabled={sendingIds.includes(r.id) || (r as any).alertToReportTeam}
                                title={(r as any).alertToReportTeam ? 'Already sent to reports' : 'Send to Reports module'}
                                aria-label="Send to Reports"
                              >
                                <span className="hidden sm:inline">{(r as any).alertToReportTeam ? 'Sent ✓' : 'Send to Reports'}</span>
                                <span className="sm:hidden text-xs">{(r as any).alertToReportTeam ? 'Sent' : 'Send'}</span>
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-1" aria-label="Delete record" onClick={() => handleDelete(r.id)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Controls */}
          {visibleRows.length > 0 && (
            <div className="p-4 border-t">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Showing {(start + 1) <= totalFiltered ? (start + 1) : 0} - {Math.min(start + pageSize, totalFiltered)} of {totalFiltered} records
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bioinformatics Record</DialogTitle>
            <DialogDescription>Edit bioinformatics details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSave)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Unique ID</Label><Input {...form.register('uniqueId')} disabled /></div>
            <div><Label>Project ID</Label><Input {...form.register('projectId')} disabled /></div>
            <div><Label>Sample ID</Label><Input {...form.register('sampleId')} disabled /></div>
            <div><Label>Client ID</Label><Input {...form.register('clientId')} /></div>
            <div><Label>Organisation/Hospital</Label><Input {...form.register('organisationHospital')} disabled /></div>
            <div><Label>Clinician/Researcher name</Label><Input {...form.register('clinicianResearcherName')} disabled /></div>
            <div><Label>Patient/Client name</Label><Input {...form.register('patientClientName')} disabled /></div>
            <div><Label>Age</Label><Input {...form.register('age')} disabled /></div>
            <div><Label>Gender</Label><Input {...form.register('gender')} disabled /></div>
            <div><Label>Service name</Label><Input {...form.register('serviceName')} disabled /></div>
            {/* No of Samples removed from UI */}
            <div><Label>Sequencing status</Label><Input {...form.register('sequencingStatus')} /></div>
            <div><Label>Sequencing data storage date</Label><Input type="date" {...form.register('sequencingDataStorageDate')} /></div>
            <div><Label>Basecalling</Label><Input {...form.register('basecalling')} /></div>
            <div><Label>basecalling data storage date</Label><Input type="date" {...form.register('basecallingDataStorageDate')} /></div>
            <div><Label>Workflow type</Label><Input {...form.register('workflowType')} /></div>
            <div><Label>Analysis status</Label><Input {...form.register('analysisStatus')} /></div>
            <div><Label>Analysis date</Label><Input type="date" {...form.register('analysisDate')} /></div>
            <div><Label>Third party Name</Label><Input {...form.register('thirdPartyName')} /></div>
            <div><Label>Sample sent to third party Date</Label><Input type="date" {...form.register('sampleSentToThirdPartyDate')} /></div>
            <div>
              <Label>Third party TRF</Label>
              <div className="flex gap-2 items-center">
                <Input {...form.register('thirdPartyTrf')} readOnly placeholder="Upload a file" />
                <Input type="file" className="w-[100px]" onChange={(e) => handleFileUpload(e, 'thirdPartyTrf')} accept=".pdf" />
              </div>
            </div>
            <div><Label>Results/Raw data received from third party date</Label><Input type="date" {...form.register('resultsRawDataReceivedFromThirdPartyDate')} /></div>
            <div>
              <Label>Third party report</Label>
              <div className="flex gap-2 items-center">
                <Input {...form.register('thirdPartyReport')} readOnly placeholder="Upload a file" />
                <Input type="file" className="w-[100px]" onChange={(e) => handleFileUpload(e, 'thirdPartyReport')} accept=".pdf" />
              </div>
            </div>
            <div><Label>TAT</Label><Input {...form.register('tat')} /></div>
            <div><Label>VCF file link</Label><Input {...form.register('vcfFileLink')} /></div>
            <div><Label>CNV status</Label><Input {...form.register('cnvStatus')} /></div>
            <div><Label>Progenics raw data</Label><Input {...form.register('progenicsRawData')} /></div>
            <div><Label>Progenics raw data size</Label><Input {...form.register('progenicsRawDataSize')} /></div>
            <div><Label>Progenics raw data link</Label><Input {...form.register('progenicsRawDataLink')} /></div>
            <div><Label>Analysis HTML link</Label><Input {...form.register('analysisHtmlLink')} /></div>
            <div><Label>Relative abundance sheet</Label><Input {...form.register('relativeAbundanceSheet')} /></div>
            <div><Label>Data analysis sheet</Label><Input {...form.register('dataAnalysisSheet')} /></div>
            <div><Label>Database/Tools information</Label><Input {...form.register('databaseToolsInformation')} /></div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="alertToTechnicalLeadd" {...form.register('alertToTechnicalLeadd')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <Label htmlFor="alertToTechnicalLeadd">Alert to Technical lead</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="alertToReportTeam" {...form.register('alertToReportTeam')} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <Label htmlFor="alertToReportTeam">Alert to Report team</Label>
            </div>

            <div><Label>Created at</Label><Input type="datetime-local" {...form.register('createdAt')} disabled /></div>
            <div><Label>Created by</Label><Input {...form.register('createdBy')} disabled /></div>
            <div><Label>Modified at</Label><Input type="datetime-local" {...form.register('modifiedAt')} disabled /></div>
            <div><Label>Modified by</Label><Input {...form.register('modifiedBy')} disabled /></div>

            <div className="md:col-span-2">
              <Label>Remark/Comment</Label>
              <Textarea {...form.register('remarkComment')} />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsOpen(false); setEditing(null); }}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div >
  );
}