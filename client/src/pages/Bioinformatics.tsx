import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useRecycle } from '@/contexts/RecycleContext';
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
  const [rows, setRows] = useState<BIRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<BIRecord | null>(null);
  const { add } = useRecycle();
  const [, setLocation] = useLocation();

  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');
  // BI type filter: 'all' | 'clinical' | 'discovery'
  const [biTypeFilter, setBiTypeFilter] = useState<'all' | 'clinical' | 'discovery'>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Sorting state (per-column)
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const form = useForm<BIRecord>({ defaultValues: {} as any });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Send to Reports mutation
  const sendToReportsMutation = useMutation({
    mutationFn: async (record: BIRecord) => {
      // Send to reports endpoint which handles routing based on project ID
      // Sending all fields needed for auto-population in ReportManagement
      const response = await apiRequest('POST', '/api/send-to-reports', {
        // IDs
        bioinformaticsId: record.id,
        uniqueId: record.uniqueId,
        projectId: record.projectId,
        // Patient info
        patientClientName: record.patientClientName,
        age: record.age,
        gender: record.gender,
        // Clinician info
        clinicianResearcherName: record.clinicianResearcherName,
        organisationHospital: record.organisationHospital,
        // Service info
        serviceName: record.serviceName,
        // TAT and comments
        tat: record.tat,
        remarkComment: record.remarkComment,
        // Optional: lead fields
        createdBy: record.createdBy,
        modifiedBy: record.modifiedBy,
        // Additional useful fields
        sampleId: record.sampleId,
        analysisDate: record.analysisDate,
        clientId: record.clientId,
      });
      return response.json();
    },
    onSuccess: (data: any, recordData: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bioinfo-discovery-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bioinfo-clinical-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/report'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });

      // Update local state to mark as sent
      setRows((prevRows) =>
        prevRows.map((r) =>
          r.id === data.bioinformaticsId ? { ...r, alertToReportTeam: true } : r
        )
      );

      // Store bioinformatics data in sessionStorage for auto-population in ReportManagement
      const bioinformationData = {
        // IDs
        uniqueId: recordData.uniqueId,
        projectId: recordData.projectId,
        // Patient info
        patientClientName: recordData.patientClientName,
        age: recordData.age,
        gender: recordData.gender,
        // Clinician info
        clinicianResearcherName: recordData.clinicianResearcherName,
        organisationHospital: recordData.organisationHospital,
        // Service info
        serviceName: recordData.serviceName,
        // TAT and comments
        tat: recordData.tat,
        remarkComment: recordData.remarkComment,
        // Optional: lead fields
        createdBy: recordData.createdBy,
        modifiedBy: recordData.modifiedBy,
        // Additional useful fields
        sampleId: recordData.sampleId,
        analysisDate: recordData.analysisDate,
        sampleReceivedDate: recordData.sampleReceivedDate,
        clientId: recordData.clientId,
      };
      
      sessionStorage.setItem('bioinformatics_send_to_reports', JSON.stringify(bioinformationData));

      toast({
        title: "Sent to Reports",
        description: `Report record created in ${data.table}. Redirecting to Reports module...`,
      });

      // Navigate to ReportManagement after a short delay
      setTimeout(() => {
        setLocation('/report-management');
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send to Reports",
        description: error.message || "Failed to send bioinformatics record to Reports",
        variant: "destructive",
      });
    }
  });

  // Filter records based on search and filters
  const filteredRows = rows.filter((record) => {
    // Apply analysis status filter
    if (statusFilter !== 'all' && record.analysisStatus !== statusFilter) {
      return false;
    }

    // Apply search query
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      (record.uniqueId || '').toLowerCase().includes(query) ||
      (record.projectId || '').toLowerCase().includes(query) ||
      (record.sampleId || '').toLowerCase().includes(query) ||
      (record.clientId || '').toLowerCase().includes(query) ||
      (record.patientClientName || '').toLowerCase().includes(query)
    );
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

  // Helper function to get sequential sample ID counter for a given project
  const getSequentialSampleId = (record: BIRecord, recordsToCheck: BIRecord[]): number => {
    const projectId = (record as any).projectId || (record as any)._raw?.project_id || '';
    if (!projectId) return 1;
    
    // Count how many records exist for this project ID in the current view
    const sameProjectRecords = recordsToCheck.filter((r: any) => {
      const pid = (r as any).projectId || (r as any)._raw?.project_id || '';
      return pid === projectId;
    });
    
    // Find the index of the current record in the list
    const index = sameProjectRecords.findIndex((r: any) => r.id === record.id);
    return index >= 0 ? index + 1 : 1;
  };

  // Pagination calculations (after applying BI type filter)
  const totalFiltered = typeFilteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  // Reset to first page if current page exceeds total pages
  if (page > totalPages) setPage(totalPages);
  const start = (page - 1) * pageSize;
  // Apply sorting
  const sortedRows = (() => {
    if (!sortKey) return typeFilteredRows;
    const copy = [...typeFilteredRows];
    copy.sort((a: any, b: any) => {
      const A = (a as any)[sortKey];
      const B = (b as any)[sortKey];
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
      no_of_samples: data.noOfSamples,
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
      modified_by: data.modifiedBy,
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
                alertToTechnicalLeadd: item.alert_to_technical_leadd || item.alert_to_technical_lead,
                alertToReportTeam: item.alert_to_report_team,
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
                alertToTechnicalLeadd: item.alert_to_technical_leadd || item.alert_to_technical_lead,
                alertToReportTeam: item.alert_to_report_team,
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
          <div className="text-2xl font-extrabold">{biTypeFilter === 'all' ? '-' : typeFilteredRows.length}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Analyses</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-orange-50 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-extrabold">{biTypeFilter === 'all' ? '-' : typeFilteredRows.filter((r) => r.analysisStatus === 'pending').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Pending</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-amber-50 flex items-center justify-center mb-3">
            <Cpu className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold">{biTypeFilter === 'all' ? '-' : typeFilteredRows.filter((r) => r.analysisStatus === 'running').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Running</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-sky-50 flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold">{biTypeFilter === 'all' ? '-' : typeFilteredRows.filter((r) => r.analysisStatus === 'completed').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Completed</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bioinformatics Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search and Filter Controls */}
          <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b">
            <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search Unique ID / Project ID / Sample ID / Client ID / Patient Name"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1); // Reset to first page when searching
                  }}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
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
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="pageSize" className="text-sm whitespace-nowrap">Page size</Label>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(parseInt(value, 10));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white/95 dark:bg-gray-900/95 z-10 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  {biTypeFilter === 'clinical' || biTypeFilter === 'discovery' ? (
                    <TableRow>
                      <TableHead className="whitespace-nowrap font-semibold">Unique ID</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Project ID</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Sample ID</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Client ID</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Organisation/Hospital</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Clinician/Researcher name</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Patient/Client name</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Age</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Gender</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Service name</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">No of Samples</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Sequencing status</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Sequencing data storage date</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Basecalling</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">basecalling data storage date</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Workflow type</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Analysis status</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Analysis date</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Third party Name</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Sample sent to third party Date</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Third party TRF</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Results/Raw data received from third party date</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Third party report</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">TAT</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">VCF file link</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">CNV status</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Progenics raw data</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Progenics raw data size</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Progenics raw data link</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Analysis HTML link</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Relative abundance sheet</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Data analysis sheet</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Database/Tools information</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Alert to Technical lead</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Alert to Report team</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Created at</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Created by</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Modified at</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Modified by</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold">Remark/Comment</TableHead>
                      <TableHead className="whitespace-nowrap font-semibold sticky right-0 bg-white dark:bg-gray-900 border-l-2 border-gray-200 dark:border-gray-700">Actions</TableHead>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableHead colSpan={3} className="whitespace-nowrap font-semibold text-left text-gray-600">Select "Clinical" or "Discovery" to view the corresponding table</TableHead>
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {biTypeFilter === 'all' ? (
                    <TableRow>
                      <TableCell colSpan={41} className="text-center py-8 text-muted-foreground">
                        Select "Clinical" or "Discovery" to view the corresponding table
                      </TableCell>
                    </TableRow>
                  ) : visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={41} className="text-center py-8 text-muted-foreground">
                        {typeFilteredRows.length === 0 ? "No bioinformatics records found" : "No records match your search criteria"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((r) => {
                      if (biTypeFilter === 'clinical' || biTypeFilter === 'discovery') {
                        return (
                          <TableRow key={r.id} className={`${(r as any).alertToReportTeam ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'} hover:bg-opacity-75 dark:hover:bg-opacity-75 cursor-pointer`}>
                            <TableCell className="font-medium">{r.uniqueId ?? '-'}</TableCell>
                            <TableCell>{(r as any).projectId ?? (r as any)._raw?.project_id ?? '-'}</TableCell>
                            <TableCell>{(r as any).projectId ? `${(r as any).projectId}_${getSequentialSampleId(r, typeFilteredRows)}` : r.sampleId ?? '-'}</TableCell>
                            <TableCell>{(r as any).clientId ?? '-'}</TableCell>
                            <TableCell>{(r as any).organisationHospital ?? '-'}</TableCell>
                            <TableCell>{(r as any).clinicianResearcherName ?? '-'}</TableCell>
                            <TableCell>{(r as any).patientClientName ?? '-'}</TableCell>
                            <TableCell>{(r as any).age ?? '-'}</TableCell>
                            <TableCell>{(r as any).gender ?? '-'}</TableCell>
                            <TableCell>{(r as any).serviceName ?? '-'}</TableCell>
                            <TableCell>{(r as any).sequencingStatus ?? '-'}</TableCell>
                            <TableCell>{(r as any).sequencingDataStorageDate ? new Date((r as any).sequencingDataStorageDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{(r as any).basecalling ?? '-'}</TableCell>
                            <TableCell>{(r as any).basecallingDataStorageDate ? new Date((r as any).basecallingDataStorageDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{(r as any).workflowType ?? '-'}</TableCell>
                            <TableCell>{(r as any).analysisStatus ?? '-'}</TableCell>
                            <TableCell>{(r as any).analysisDate ? new Date((r as any).analysisDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{r.thirdPartyName ?? '-'}</TableCell>
                            <TableCell>{(r as any).sampleSentToThirdPartyDate ? new Date((r as any).sampleSentToThirdPartyDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{(r as any).thirdPartyTrf ?? '-'}</TableCell>
                            <TableCell>{(r as any).resultsRawDataReceivedFromThirdPartyDate ? new Date((r as any).resultsRawDataReceivedFromThirdPartyDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{(r as any).thirdPartyReport ?? '-'}</TableCell>
                            <TableCell>{(r as any).tat ?? '-'}</TableCell>
                            <TableCell>{(r as any).vcfFileLink ?? '-'}</TableCell>
                            <TableCell>{(r as any).cnvStatus ?? '-'}</TableCell>
                            <TableCell>{(r as any).progenicsRawData ?? '-'}</TableCell>
                            <TableCell>{(r as any).progenicsRawDataSize ?? '-'}</TableCell>
                            <TableCell>{(r as any).progenicsRawDataLink ?? '-'}</TableCell>
                            <TableCell>{(r as any).analysisHtmlLink ?? '-'}</TableCell>
                            <TableCell>{(r as any).relativeAbundanceSheet ?? '-'}</TableCell>
                            <TableCell>{(r as any).dataAnalysisSheet ?? '-'}</TableCell>
                            <TableCell>{(r as any).databaseToolsInformation ?? '-'}</TableCell>
                            <TableCell>{(r as any).alertToTechnicalLeadd ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{(r as any).alertToReportTeam ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{(r as any).createdAt ? new Date((r as any).createdAt).toLocaleString() : '-'}</TableCell>
                            <TableCell>{(r as any).createdBy ?? '-'}</TableCell>
                            <TableCell>{(r as any).modifiedAt ? new Date((r as any).modifiedAt).toLocaleString() : '-'}</TableCell>
                            <TableCell>{(r as any).modifiedBy ?? '-'}</TableCell>
                            <TableCell>{(r as any).remarkComment ?? '-'}</TableCell>
                            <TableCell className={`sticky right-0 border-l-2 border-gray-200 dark:border-gray-700 min-w-[300px] ${(r as any).alertToReportTeam ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                              <div className="flex space-x-2 items-center justify-center flex-wrap">
                                <Button size="sm" variant="ghost" aria-label="Edit record" onClick={() => openEdit(r)}>
                                  <EditIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all font-medium text-sm ${(r as any).alertToReportTeam
                                      ? 'bg-red-500 hover:bg-red-600 text-white cursor-not-allowed'
                                      : 'bg-green-500 hover:bg-green-600 text-white'
                                    } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                                  onClick={() => {
                                    sendToReportsMutation.mutate(r);
                                  }}
                                  disabled={sendToReportsMutation.isPending || (r as any).alertToReportTeam}
                                  title={(r as any).alertToReportTeam ? 'Already sent to reports' : 'Send to Reports module'}
                                  aria-label="Send to Reports"
                                >
                                  {(r as any).alertToReportTeam ? 'Sent ✓' : 'Send to Reports'}
                                </Button>
                                <Button size="sm" variant="ghost" aria-label="Delete record" onClick={() => handleDelete(r.id)}>
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      // should not reach here because we only render rows for clinical or discovery
                      return null;
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Controls */}
          {visibleRows.length > 0 && (
            <div className="p-4 flex items-center justify-between border-t">
              <div>
                Showing {(start + 1) <= totalFiltered ? (start + 1) : 0} - {Math.min(start + pageSize, totalFiltered)} of {totalFiltered} records
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
    </div>
  );
}