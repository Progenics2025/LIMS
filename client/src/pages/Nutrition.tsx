import { useState, useEffect, useMemo } from "react";
import { ConfirmationDialog, useConfirmationDialog } from "@/components/ConfirmationDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Trash2, Edit, Users, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { useRecycle } from '@/contexts/RecycleContext';
import { toast } from "@/hooks/use-toast";
import { PDFViewer } from '@/components/PDFViewer';
import { FilterBar } from "@/components/FilterBar";
import { useColumnPreferences, ColumnConfig } from '@/hooks/useColumnPreferences';
import { ColumnSettings } from '@/components/ColumnSettings';
import { sortData } from "@/lib/utils";


async function apiRequest(method: string, url: string, data?: any) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = new Error('API request failed');
    try {
      const errorData = await response.json();
      (error as any).body = errorData;
      (error as any).status = response.status;
      (error as any).message = errorData.message || response.statusText;
    } catch {
      (error as any).message = response.statusText;
      (error as any).status = response.status;
    }
    throw error;
  }

  return response;
}

function normalizeNutritionRecord(r: any): NutritionRecord {
  if (!r) return r;
  const get = (snake: string, camel: string) => {
    if (r[camel] !== undefined) return r[camel];
    if (r[snake] !== undefined) return r[snake];
    return undefined;
  };

  return {
    id: r.id ?? '',
    uniqueId: get('unique_id', 'uniqueId') ?? '',
    projectId: get('project_id', 'projectId') ?? '',
    sampleId: get('sample_id', 'sampleId') ?? '',
    patientClientName: get('patient_client_name', 'patientClientName') ?? '',
    age: get('age', 'age') ? Number(get('age', 'age')) : null,
    gender: get('gender', 'gender') ?? '',
    serviceName: get('service_name', 'serviceName') ?? '',
    progenicsTrf: get('progenics_trf', 'progenicsTrf') ?? '',
    questionnaire: get('questionnaire', 'questionnaire') ?? '',
    questionnaireCallRecording: get('questionnaire_call_recording', 'questionnaireCallRecording') ?? '',
    dataAnalysisSheet: get('data_analysis_sheet', 'dataAnalysisSheet') ?? '',
    progenicsReport: get('progenics_report', 'progenicsReport') ?? '',
    nutritionChart: get('nutrition_chart', 'nutritionChart') ?? '',
    counsellingSessionDate: get('counselling_session_date', 'counsellingSessionDate') ?? null,
    furtherCounsellingRequired: get('further_counselling_required', 'furtherCounsellingRequired') ?? false,
    counsellingStatus: get('counselling_status', 'counsellingStatus') ?? '',
    counsellingSessionRecording: get('counselling_session_recording', 'counsellingSessionRecording') ?? '',
    alertToTechnicalLead: get('alert_to_technical_lead', 'alertToTechnicalLead') ?? false,
    alertToReportTeam: get('alert_to_report_team', 'alertToReportTeam') ?? false,
    createdAt: get('created_at', 'createdAt') ?? '',
    createdBy: get('created_by', 'createdBy') ?? '',
    modifiedAt: get('modified_at', 'modifiedAt') ?? get('updated_at', 'updatedAt') ?? '',
    modifiedBy: get('modified_by', 'modifiedBy') ?? '',
    remarksComment: get('remark_comment', 'remarksComment') ?? '',
  };
}

interface NutritionRecord {
  id: string;
  uniqueId: string;
  projectId: string;
  sampleId: string;
  patientClientName: string;
  age: number | null;
  gender: string;
  serviceName: string;
  progenicsTrf: string;
  questionnaire: string;
  questionnaireCallRecording: string;
  dataAnalysisSheet: string;
  progenicsReport: string;
  nutritionChart: string;
  counsellingSessionDate: string | null;
  furtherCounsellingRequired: boolean;
  counsellingStatus: string;
  counsellingSessionRecording: string;
  alertToTechnicalLead: boolean;
  alertToReportTeam: boolean;
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
  modifiedBy: string;
  remarksComment: string;
}

export default function Nutrition() {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<NutritionRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [dateFilterField, setDateFilterField] = useState<string>('createdAt');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editFormValues, setEditFormValues] = useState<any>({});
  const queryClient = useQueryClient();
  const deleteConfirmation = useConfirmationDialog();
  const editConfirmation = useConfirmationDialog();
  const { add } = useRecycle();

  // Column configuration for hide/show feature
  const nutritionColumns: ColumnConfig[] = useMemo(() => [
    { id: 'uniqueId', label: 'Unique ID', canHide: false },
    { id: 'projectId', label: 'Project ID', defaultVisible: true },
    { id: 'sampleId', label: 'Sample ID', defaultVisible: true },
    { id: 'serviceName', label: 'Service Name', defaultVisible: true },
    { id: 'patientClientName', label: 'Patient/Client Name', defaultVisible: true },
    { id: 'age', label: 'Age', defaultVisible: false },
    { id: 'gender', label: 'Gender', defaultVisible: false },
    { id: 'progenicsTrf', label: 'Progenics TRF', defaultVisible: false },
    { id: 'questionnaire', label: 'Questionnaire', defaultVisible: false },
    { id: 'questionnaireCallRecording', label: 'Questionnaire Call Recording', defaultVisible: false },
    { id: 'dataAnalysisSheet', label: 'Data Analysis Sheet', defaultVisible: false },
    { id: 'progenicsReport', label: 'Progenics Report', defaultVisible: false },
    { id: 'nutritionChart', label: 'Nutrition Chart', defaultVisible: false },
    { id: 'counsellingSessionDate', label: 'Counselling Session Date', defaultVisible: true },
    { id: 'furtherCounsellingRequired', label: 'Further Counselling Required', defaultVisible: false },
    { id: 'counsellingStatus', label: 'Counselling Status', defaultVisible: true },
    { id: 'counsellingSessionRecording', label: 'Counselling Session Recording', defaultVisible: false },
    { id: 'alertToTechnicalLead', label: 'Alert to Technical Lead', defaultVisible: true },
    { id: 'alertToReportTeam', label: 'Alert to Report Team', defaultVisible: true },
    { id: 'createdAt', label: 'Created At', defaultVisible: false },
    { id: 'createdBy', label: 'Created By', defaultVisible: false },
    { id: 'modifiedAt', label: 'Modified At', defaultVisible: false },
    { id: 'modifiedBy', label: 'Modified By', defaultVisible: false },
    { id: 'remarksComment', label: 'Remark/Comment', defaultVisible: true },
    { id: 'actions', label: 'Actions', canHide: false },
  ], []);

  // Column visibility preferences (per-user)
  const nutritionColumnPrefs = useColumnPreferences('nutrition_table', nutritionColumns);


  // Fetch all users for name lookup
  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const r = await fetch('/api/users');
      if (!r.ok) throw new Error('Failed to fetch users');
      return r.json();
    }
  });

  // Helper function to get user name by ID
  const getUserNameById = (userId: string | undefined): string => {
    if (!userId) return '-';
    const user = allUsers.find(u => u.id === userId);
    return user?.name ?? userId;
  };

  // Fetch nutrition records
  const { data: rawRecords = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/nutrition'],
    queryFn: async () => {
      const r = await fetch('/api/nutrition');
      if (!r.ok) throw new Error('Failed to fetch nutrition records');
      return r.json();
    }
  });

  // Only show nutrition records from database, no virtual/mock records from leads
  const records = rawRecords.map(normalizeNutritionRecord);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NutritionRecord> }) => {
      const response = await apiRequest('PUT', `/api/nutrition/${id}`, data);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/nutrition'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'], refetchType: 'all' });
      setIsEditDialogOpen(false);
      setSelectedRecord(null);
      toast({ title: "Success", description: "Nutrition record updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update nutrition record",
        variant: "destructive"
      });
    },
  });

  // Progenics TRF upload handler
  const handleProgenicsTrfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Validate file type
    if (!file.type || !file.type.includes('pdf')) {
      toast({ title: 'Error', description: 'Please select a PDF file', variant: 'destructive' });
      return;
    }

    if (!selectedRecord) {
      toast({ title: 'Error', description: 'No record selected', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const nutritionId = selectedRecord.id || 'new';
      const res = await fetch(`/api/uploads/categorized?category=Progenics_TRF&entityType=nutrition&entityId=${nutritionId}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      // Update form value with the uploaded file path
      setEditFormValues({ ...editFormValues, progenicsTrf: data.filePath });

      console.log('✅ Progenics TRF uploaded successfully:', {
        filePath: data.filePath,
        uploadId: data.uploadId,
        category: data.category,
        fileSize: data.fileSize
      });

      toast({
        title: 'Success',
        description: `Progenics TRF uploaded successfully to ${data.category} folder`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };


  // Filter records based on search query
  const filteredRecords = records.filter((record) => {
    // 1. Search Query (Global)
    let matchesSearch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch = Object.values(record).some(val => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') return Object.values(val).some(v => String(v ?? '').toLowerCase().includes(q));
        return String(val).toLowerCase().includes(q);
      });
    }

    // 2. Date Range Filter
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

  const sortedRecords = useMemo(() => {
    return sortData(filteredRecords, sortKey as keyof NutritionRecord | null, sortDir);
  }, [filteredRecords, sortKey, sortDir]);

  // Pagination calculations
  const totalRecords = sortedRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalRecords);
  const paginatedRecords = sortedRecords.slice(startIdx, endIdx);

  // Ensure currentPage stays within bounds when filters or pageSize change
  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  // Calculate summary statistics
  const stats = {
    total: records.length,
    pending: records.filter(r => !r.counsellingStatus || r.counsellingStatus.toLowerCase() === 'pending').length,
    completed: records.filter(r => r.counsellingStatus?.toLowerCase() === 'completed').length,
    alertsActive: records.filter(r => r.alertToTechnicalLead || r.alertToReportTeam).length,
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500';
      case 'on_hold': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nutrition Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage nutrition counselling sessions and reports
        </p>
      </div>

      {/* Summary Statistics Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500 mt-1">{stats.pending}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-500 mt-1">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alerts Active</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-500 mt-1">{stats.alertsActive}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Nutrition Records</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and filters */}
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dateRange={dateRange}
            setDateRange={setDateRange}
            dateFilterField={dateFilterField}
            setDateFilterField={setDateFilterField}
            dateFieldOptions={[
              { label: "Created At", value: "createdAt" },
              { label: "Counselling Session Date", value: "counsellingSessionDate" },
              { label: "Modified At", value: "modifiedAt" },
            ]}
            totalItems={filteredRecords.length}
            pageSize={pageSize}
            setPageSize={setPageSize}
            setPage={setCurrentPage}
            placeholder="Search Unique ID / Project ID / Sample ID / Client ID..."
          />

          {/* Column Visibility Settings */}
          <div className="mt-2 mb-2">
            <ColumnSettings
              columns={nutritionColumns}
              isColumnVisible={nutritionColumnPrefs.isColumnVisible}
              toggleColumn={nutritionColumnPrefs.toggleColumn}
              resetToDefaults={nutritionColumnPrefs.resetToDefaults}
              showAllColumns={nutritionColumnPrefs.showAllColumns}
              showCompactView={nutritionColumnPrefs.showCompactView}
              visibleCount={nutritionColumnPrefs.visibleCount}
              totalCount={nutritionColumnPrefs.totalCount}
            />
          </div>

          <div className="overflow-x-auto leads-table-wrapper process-table-wrapper">
            <div className="border rounded-lg max-h-[60vh] overflow-y-auto">
              <table className="leads-table w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-30">
                  <tr>
                    {nutritionColumnPrefs.isColumnVisible('uniqueId') && <th onClick={() => { setSortKey('uniqueId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[120px] px-4 py-1 text-left whitespace-nowrap font-semibold sticky left-0 z-40 bg-gray-50 dark:bg-gray-800 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Unique ID{sortKey === 'uniqueId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('projectId') && <th onClick={() => { setSortKey('projectId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[120px] px-4 py-1 text-left whitespace-nowrap font-semibold sticky left-[120px] z-40 bg-gray-50 dark:bg-gray-800 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Project ID{sortKey === 'projectId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('sampleId') && <th onClick={() => { setSortKey('sampleId'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[120px] px-4 py-1 text-left whitespace-nowrap font-semibold">Sample ID{sortKey === 'sampleId' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('serviceName') && <th onClick={() => { setSortKey('serviceName'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[130px] px-4 py-1 text-left whitespace-nowrap font-semibold">Service name{sortKey === 'serviceName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('patientClientName') && <th onClick={() => { setSortKey('patientClientName'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Patient/Client name{sortKey === 'patientClientName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('age') && <th onClick={() => { setSortKey('age'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[80px] px-4 py-1 text-left whitespace-nowrap font-semibold">Age{sortKey === 'age' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('gender') && <th onClick={() => { setSortKey('gender'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[100px] px-4 py-1 text-left whitespace-nowrap font-semibold">Gender{sortKey === 'gender' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('progenicsTrf') && <th onClick={() => { setSortKey('progenicsTrf'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[120px] px-4 py-1 text-left whitespace-nowrap font-semibold">Progenics TRF{sortKey === 'progenicsTrf' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('questionnaire') && <th onClick={() => { setSortKey('questionnaire'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[130px] px-4 py-1 text-left whitespace-nowrap font-semibold">Questionnaire{sortKey === 'questionnaire' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('questionnaireCallRecording') && <th onClick={() => { setSortKey('questionnaireCallRecording'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Questionnaire Call recording{sortKey === 'questionnaireCallRecording' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('dataAnalysisSheet') && <th onClick={() => { setSortKey('dataAnalysisSheet'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Data analysis sheet{sortKey === 'dataAnalysisSheet' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('progenicsReport') && <th onClick={() => { setSortKey('progenicsReport'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[140px] px-4 py-1 text-left whitespace-nowrap font-semibold">Progenics Report{sortKey === 'progenicsReport' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('nutritionChart') && <th onClick={() => { setSortKey('nutritionChart'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[130px] px-4 py-1 text-left whitespace-nowrap font-semibold">Nutrition Chart{sortKey === 'nutritionChart' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('counsellingSessionDate') && <th onClick={() => { setSortKey('counsellingSessionDate'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Counselling session date{sortKey === 'counsellingSessionDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('furtherCounsellingRequired') && <th onClick={() => { setSortKey('furtherCounsellingRequired'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[160px] px-4 py-1 text-left whitespace-nowrap font-semibold">Further counselling required{sortKey === 'furtherCounsellingRequired' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('counsellingStatus') && <th onClick={() => { setSortKey('counsellingStatus'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[140px] px-4 py-1 text-left whitespace-nowrap font-semibold">Counselling status{sortKey === 'counsellingStatus' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('counsellingSessionRecording') && <th onClick={() => { setSortKey('counsellingSessionRecording'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Counselling session recording{sortKey === 'counsellingSessionRecording' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('alertToTechnicalLead') && <th onClick={() => { setSortKey('alertToTechnicalLead'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Alert to Technical lead{sortKey === 'alertToTechnicalLead' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('alertToReportTeam') && <th onClick={() => { setSortKey('alertToReportTeam'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[130px] px-4 py-1 text-left whitespace-nowrap font-semibold">Alert to Report team{sortKey === 'alertToReportTeam' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('createdAt') && <th onClick={() => { setSortKey('createdAt'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[140px] px-4 py-1 text-left whitespace-nowrap font-semibold">Created at{sortKey === 'createdAt' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('createdBy') && <th onClick={() => { setSortKey('createdBy'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[130px] px-4 py-1 text-left whitespace-nowrap font-semibold">Created by{sortKey === 'createdBy' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('modifiedAt') && <th onClick={() => { setSortKey('modifiedAt'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[150px] px-4 py-1 text-left whitespace-nowrap font-semibold">Modified at{sortKey === 'modifiedAt' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('modifiedBy') && <th onClick={() => { setSortKey('modifiedBy'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[130px] px-4 py-1 text-left whitespace-nowrap font-semibold">Modified by{sortKey === 'modifiedBy' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('remarksComment') && <th onClick={() => { setSortKey('remarksComment'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer min-w-[200px] px-4 py-1 text-left whitespace-nowrap font-semibold">Remark/Comment{sortKey === 'remarksComment' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>}
                    {nutritionColumnPrefs.isColumnVisible('actions') && <th className="sticky right-0 z-40 bg-gray-50 dark:bg-gray-800 px-4 py-1 text-left whitespace-nowrap font-semibold min-w-[100px] border-l-2 actions-column">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={25} className="px-4 py-8 text-center text-gray-500">
                        {filteredRecords.length === 0 ? 'No nutrition records found' : 'No records on this page'}
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((record) => (
                      <tr key={record.id} className={`${record.alertToReportTeam ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/20'} hover:bg-opacity-75 dark:hover:bg-opacity-75`}>
                        {nutritionColumnPrefs.isColumnVisible('uniqueId') && <td className={`min-w-[120px] px-4 py-1 whitespace-nowrap sticky left-0 z-20 ${record.alertToReportTeam ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/20'} border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>{record.uniqueId || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('projectId') && <td className={`min-w-[120px] px-4 py-1 whitespace-nowrap sticky left-[120px] z-20 ${record.alertToReportTeam ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/20'} border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>{record.projectId || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('sampleId') && <td className="min-w-[120px] px-4 py-1 whitespace-nowrap">{record.sampleId || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('serviceName') && <td className="min-w-[130px] px-4 py-1 whitespace-nowrap">{record.serviceName || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('patientClientName') && <td className="min-w-[150px] px-4 py-1 whitespace-nowrap">{record.patientClientName || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('age') && <td className="min-w-[80px] px-4 py-1 whitespace-nowrap">{record.age ?? '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('gender') && <td className="min-w-[100px] px-4 py-1 whitespace-nowrap">{record.gender || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('progenicsTrf') && <td className="min-w-[120px] px-4 py-1 whitespace-nowrap">
                          <PDFViewer pdfUrl={record.progenicsTrf} fileName="Progenics_TRF.pdf" />
                        </td>}
                        {nutritionColumnPrefs.isColumnVisible('questionnaire') && <td className="min-w-[130px] px-4 py-1 whitespace-nowrap">{record.questionnaire || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('questionnaireCallRecording') && <td className="min-w-[150px] px-4 py-1 whitespace-nowrap">{record.questionnaireCallRecording || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('dataAnalysisSheet') && <td className="min-w-[150px] px-4 py-1 whitespace-nowrap">{record.dataAnalysisSheet || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('progenicsReport') && <td className="min-w-[140px] px-4 py-1 whitespace-nowrap">{record.progenicsReport || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('nutritionChart') && <td className="min-w-[130px] px-4 py-1 whitespace-nowrap">{record.nutritionChart || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('counsellingSessionDate') && <td className="min-w-[150px] px-4 py-1 whitespace-nowrap">{record.counsellingSessionDate ? new Date(record.counsellingSessionDate).toLocaleDateString() : '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('furtherCounsellingRequired') && <td className="min-w-[160px] px-4 py-1 whitespace-nowrap">{record.furtherCounsellingRequired ? 'Yes' : 'No'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('counsellingStatus') && <td className="min-w-[140px] px-4 py-1 whitespace-nowrap">
                          <Badge className={getStatusBadgeColor(record.counsellingStatus)}>
                            {record.counsellingStatus || 'Pending'}
                          </Badge>
                        </td>}
                        {nutritionColumnPrefs.isColumnVisible('counsellingSessionRecording') && <td className="min-w-[150px] px-4 py-1 whitespace-nowrap">{record.counsellingSessionRecording || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('alertToTechnicalLead') && <td className="min-w-[150px] px-4 py-1 whitespace-nowrap">{record.alertToTechnicalLead ? 'Yes' : 'No'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('alertToReportTeam') && <td className="min-w-[130px] px-4 py-1 whitespace-nowrap">{record.alertToReportTeam ? 'Yes' : 'No'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('createdAt') && <td className="min-w-[140px] px-4 py-1 whitespace-nowrap">{record.createdAt ? new Date(record.createdAt).toLocaleString() : '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('createdBy') && <td className="min-w-[130px] px-4 py-1 whitespace-nowrap">{getUserNameById(record.createdBy)}</td>}
                        {nutritionColumnPrefs.isColumnVisible('modifiedAt') && <td className="min-w-[150px] px-4 py-1 whitespace-nowrap">{record.modifiedAt ? new Date(record.modifiedAt).toLocaleString() : '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('modifiedBy') && <td className="min-w-[130px] px-4 py-1 whitespace-nowrap">{record.modifiedBy || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('remarksComment') && <td className="min-w-[200px] px-4 py-1 whitespace-nowrap">{record.remarksComment || '-'}</td>}
                        {nutritionColumnPrefs.isColumnVisible('actions') && <td className={`sticky right-0 z-20 border-l-2 border-gray-200 dark:border-gray-700 min-w-[150px] actions-column px-4 py-1 ${record.alertToReportTeam ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
                          <div className="action-buttons flex items-center space-x-2 h-full px-2 py-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-1"
                              onClick={() => {
                                setSelectedRecord(record);
                                setEditFormValues({
                                  furtherCounsellingRequired: record.furtherCounsellingRequired ? "true" : "false",
                                  alertToTechnicalLead: record.alertToTechnicalLead || false,
                                  alertToReportTeam: record.alertToReportTeam || false,
                                });
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-1"
                              onClick={() => {
                                deleteConfirmation.confirmDelete({
                                  title: 'Delete Nutrition Record',
                                  description: `Are you sure you want to move the nutrition record for "${record.patientClientName || record.id}" to the Recycle Bin?`,
                                  onConfirm: async () => {
                                    try {
                                      const now = new Date();
                                      const deletedAt = now.toISOString();
                                      add({
                                        entityType: 'nutrition',
                                        entityId: record.id,
                                        name: `${record.patientClientName || record.id}`,
                                        originalPath: '/nutrition',
                                        data: { ...record, deletedAt },
                                        deletedAt,
                                        createdBy: user?.email,
                                      }).catch(() => { /* ignore */ });
                                    } catch (err) {
                                      // ignore recycle failures
                                    }

                                    try {
                                      const res = await fetch(`/api/nutrition/${record.id}`, { method: 'DELETE' });
                                      if (!res.ok) throw new Error('Delete failed');
                                      queryClient.invalidateQueries({ queryKey: ['/api/nutrition'] });
                                      toast({ title: 'Moved to Recycle', description: 'Nutrition record moved to recycle bin' });
                                      window.dispatchEvent(new Event('ll:recycle:update'));
                                    } catch (e) {
                                      toast({ title: 'Recycle saved locally', description: 'Server delete failed; record kept locally', variant: 'destructive' });
                                    }
                                    deleteConfirmation.hideConfirmation();
                                  }
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination controls */}
            {paginatedRecords.length > 0 && (
              <div className="p-4">
                <div className="pagination-controls flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Showing {startIdx + 1 <= totalRecords ? (startIdx + 1) : 0} - {Math.min(startIdx + pageSize, totalRecords)} of {totalRecords}</div>
                  <div className="flex items-center space-x-2">
                    <Button className="min-w-[48px]" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</Button>
                    <div className="px-2 text-sm">Page {currentPage} / {totalPages}</div>
                    <Button className="min-w-[48px]" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Nutrition Record</DialogTitle>
            <DialogDescription>
              Modify existing nutrition record details
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data: Partial<NutritionRecord> = {
                uniqueId: selectedRecord.uniqueId,
                projectId: selectedRecord.projectId,
                sampleId: selectedRecord.sampleId,
                serviceName: selectedRecord.serviceName,
                patientClientName: selectedRecord.patientClientName,
                age: selectedRecord.age,
                gender: selectedRecord.gender,
                progenicsTrf: selectedRecord.progenicsTrf,
                questionnaire: formData.get('questionnaire') as string,
                questionnaireCallRecording: formData.get('questionnaireCallRecording') as string,
                dataAnalysisSheet: formData.get('dataAnalysisSheet') as string,
                progenicsReport: formData.get('progenicsReport') as string,
                nutritionChart: formData.get('nutritionChart') as string,
                counsellingSessionDate: formData.get('counsellingSessionDate') as string,
                furtherCounsellingRequired: editFormValues.furtherCounsellingRequired === 'true',
                counsellingStatus: formData.get('counsellingStatus') as string,
                counsellingSessionRecording: formData.get('counsellingSessionRecording') as string,
                alertToTechnicalLead: editFormValues.alertToTechnicalLead || false,
                alertToReportTeam: editFormValues.alertToReportTeam || false,
                remarksComment: formData.get('remarksComment') as string,
                modifiedBy: user?.name || user?.email || 'System',
                modifiedAt: new Date().toISOString(),
              };
              console.log('[Nutrition Form] Submitting data:', data);
              editConfirmation.confirmEdit({
                title: 'Update Nutrition Record',
                description: `Are you sure you want to save changes to the nutrition record for "${selectedRecord.patientClientName || selectedRecord.id}"?`,
                onConfirm: () => {
                  updateMutation.mutate({ id: selectedRecord.id, data });
                  editConfirmation.hideConfirmation();
                }
              });
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Unique ID and Project ID are excluded as requested */}
                <div className="space-y-2"><Label>Sample ID</Label><Input name="sampleId" defaultValue={selectedRecord.sampleId} disabled /></div>
                <div className="space-y-2"><Label>Service Name</Label><Input name="serviceName" defaultValue={selectedRecord.serviceName} disabled /></div>
                <div className="space-y-2"><Label>Patient/Client Name</Label><Input name="patientClientName" defaultValue={selectedRecord.patientClientName} disabled /></div>
                <div className="space-y-2"><Label>Age</Label><Input name="age" type="number" defaultValue={selectedRecord.age ?? ''} disabled /></div>
                <div className="space-y-2"><Label>Gender</Label><Input name="gender" defaultValue={selectedRecord.gender} disabled /></div>
                <div className="space-y-2">
                  <Label>Progenics TRF</Label>
                  <Input
                    name="progenicsTrf"
                    defaultValue={selectedRecord?.progenicsTrf || ''}
                    disabled
                  />
                </div>
                <div className="space-y-2"><Label>Questionnaire</Label><Input name="questionnaire" defaultValue={selectedRecord.questionnaire} /></div>
                <div className="space-y-2"><Label>Questionnaire Call Recording</Label><Input name="questionnaireCallRecording" defaultValue={selectedRecord.questionnaireCallRecording} /></div>
                <div className="space-y-2"><Label>Data Analysis Sheet</Label><Input name="dataAnalysisSheet" defaultValue={selectedRecord.dataAnalysisSheet} /></div>
                <div className="space-y-2"><Label>Progenics Report</Label><Input name="progenicsReport" defaultValue={selectedRecord.progenicsReport} /></div>
                <div className="space-y-2"><Label>Nutrition Chart</Label><Input name="nutritionChart" defaultValue={selectedRecord.nutritionChart} /></div>
                <div className="space-y-2"><Label>Counselling Session Date</Label><Input name="counsellingSessionDate" type="date" defaultValue={selectedRecord.counsellingSessionDate ? new Date(selectedRecord.counsellingSessionDate).toISOString().split('T')[0] : ''} /></div>
                <div className="space-y-2">
                  <Label>Further Counselling Required</Label>
                  <Select
                    name="furtherCounsellingRequired"
                    value={editFormValues.furtherCounsellingRequired || "false"}
                    onValueChange={(val) => setEditFormValues({ ...editFormValues, furtherCounsellingRequired: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Counselling Status</Label><Input name="counsellingStatus" defaultValue={selectedRecord.counsellingStatus} /></div>
                <div className="space-y-2"><Label>Counselling Session Recording</Label><Input name="counsellingSessionRecording" defaultValue={selectedRecord.counsellingSessionRecording} /></div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="edit_alertToTechnicalLead"
                    name="alertToTechnicalLead"
                    checked={editFormValues.alertToTechnicalLead || false}
                    onChange={(e) => setEditFormValues({ ...editFormValues, alertToTechnicalLead: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edit_alertToTechnicalLead">Alert to Technical Lead</Label>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="edit_alertToReportTeam"
                    name="alertToReportTeam"
                    checked={editFormValues.alertToReportTeam || false}
                    onChange={(e) => setEditFormValues({ ...editFormValues, alertToReportTeam: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edit_alertToReportTeam">Alert to Report Team</Label>
                </div>
                <div className="space-y-2"><Label>Created At</Label><Input value={selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString() : ''} disabled /></div>
                <div className="space-y-2"><Label>Created By</Label><Input value={selectedRecord.createdBy || ''} disabled /></div>
                <div className="space-y-2"><Label>Modified At</Label><Input value={selectedRecord.modifiedAt ? new Date(selectedRecord.modifiedAt).toLocaleString() : ''} disabled /></div>
                <div className="space-y-2"><Label>Modified By</Label><Input value={selectedRecord.modifiedBy || ''} disabled /></div>
                <div className="col-span-2 space-y-2">
                  <Label>Remark/Comment</Label>
                  <Input name="remarksComment" defaultValue={selectedRecord.remarksComment} />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmation.open}
        onOpenChange={deleteConfirmation.onOpenChange}
        title={deleteConfirmation.title}
        description={deleteConfirmation.description}
        confirmText={deleteConfirmation.confirmText}
        onConfirm={deleteConfirmation.onConfirm}
        type={deleteConfirmation.type}
        isLoading={deleteConfirmation.isLoading}
      />

      {/* Edit Confirmation Dialog */}
      <ConfirmationDialog
        open={editConfirmation.open}
        onOpenChange={editConfirmation.onOpenChange}
        title={editConfirmation.title}
        description={editConfirmation.description}
        confirmText={editConfirmation.confirmText}
        onConfirm={editConfirmation.onConfirm}
        type={editConfirmation.type}
        isLoading={editConfirmation.isLoading}
      />
    </div>
  );
}