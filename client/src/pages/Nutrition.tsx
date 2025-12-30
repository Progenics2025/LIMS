import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<NutritionRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [dateFilterField, setDateFilterField] = useState<string>('createdAt');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [editFormValues, setEditFormValues] = useState<any>({});
  const queryClient = useQueryClient();
  const { add } = useRecycle();

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

  // Pagination calculations
  const totalRecords = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalRecords);
  const paginatedRecords = filteredRecords.slice(startIdx, endIdx);

  // Ensure currentPage stays within bounds when filters or pageSize change
  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  // Calculate summary statistics
  const stats = {
    total: records.length,
    pending: records.filter(r => r.counsellingStatus?.toLowerCase() === 'pending').length,
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

          <div className="overflow-x-auto leads-table-wrapper process-table-wrapper">
            <div className="border rounded-lg max-h-[60vh] overflow-y-auto">
              <table className="leads-table w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-30">
                  <tr>
                    <th className="min-w-[120px] px-4 py-3 text-left whitespace-nowrap font-semibold sticky left-0 z-40 bg-gray-50 dark:bg-gray-800 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Unique ID</th>
                    <th className="min-w-[120px] px-4 py-3 text-left whitespace-nowrap font-semibold">Project ID</th>
                    <th className="min-w-[120px] px-4 py-3 text-left whitespace-nowrap font-semibold">Sample ID</th>
                    <th className="min-w-[130px] px-4 py-3 text-left whitespace-nowrap font-semibold">Service name</th>
                    <th className="min-w-[150px] px-4 py-3 text-left whitespace-nowrap font-semibold">Patient/Client name</th>
                    <th className="min-w-[80px] px-4 py-3 text-left whitespace-nowrap font-semibold">Age</th>
                    <th className="min-w-[100px] px-4 py-3 text-left whitespace-nowrap font-semibold">Gender</th>
                    <th className="min-w-[120px] px-4 py-3 text-left whitespace-nowrap font-semibold">Progenics TRF</th>
                    <th className="min-w-[130px] px-4 py-3 text-left whitespace-nowrap font-semibold">Questionnaire</th>
                    <th className="min-w-[150px] px-4 py-3 text-left whitespace-nowrap font-semibold">Questionnaire Call recording</th>
                    <th className="min-w-[150px] px-4 py-3 text-left whitespace-nowrap font-semibold">Data analysis sheet</th>
                    <th className="min-w-[140px] px-4 py-3 text-left whitespace-nowrap font-semibold">Progenics Report</th>
                    <th className="min-w-[130px] px-4 py-3 text-left whitespace-nowrap font-semibold">Nutrition Chart</th>
                    <th className="min-w-[150px] px-4 py-3 text-left whitespace-nowrap font-semibold">Counselling session date</th>
                    <th className="min-w-[160px] px-4 py-3 text-left whitespace-nowrap font-semibold">Further counselling required</th>
                    <th className="min-w-[140px] px-4 py-3 text-left whitespace-nowrap font-semibold">Counselling status</th>
                    <th className="min-w-[150px] px-4 py-3 text-left whitespace-nowrap font-semibold">Counselling session recording</th>
                    <th className="min-w-[150px] px-4 py-3 text-left whitespace-nowrap font-semibold">Alert to Technical lead</th>
                    <th className="min-w-[130px] px-4 py-3 text-left whitespace-nowrap font-semibold">Alert to Report team</th>
                    <th className="min-w-[140px] px-4 py-3 text-left whitespace-nowrap font-semibold">Created at</th>
                    <th className="min-w-[130px] px-4 py-3 text-left whitespace-nowrap font-semibold">Created by</th>
                    <th className="min-w-[150px] px-4 py-3 text-left whitespace-nowrap font-semibold">Modified at</th>
                    <th className="min-w-[130px] px-4 py-3 text-left whitespace-nowrap font-semibold">Modified by</th>
                    <th className="min-w-[200px] px-4 py-3 text-left whitespace-nowrap font-semibold">Remark/Comment</th>
                    <th className="bg-gray-50 dark:bg-gray-800 z-20 px-4 py-3 text-left whitespace-nowrap font-semibold min-w-[100px] border-l-2 actions-column">Actions</th>
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
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="min-w-[120px] px-4 py-3 whitespace-nowrap sticky left-0 z-20 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{record.uniqueId || '-'}</td>
                        <td className="min-w-[120px] px-4 py-3 whitespace-nowrap">{record.projectId || '-'}</td>
                        <td className="min-w-[120px] px-4 py-3 whitespace-nowrap">{record.sampleId || '-'}</td>
                        <td className="min-w-[130px] px-4 py-3 whitespace-nowrap">{record.serviceName || '-'}</td>
                        <td className="min-w-[150px] px-4 py-3 whitespace-nowrap">{record.patientClientName || '-'}</td>
                        <td className="min-w-[80px] px-4 py-3 whitespace-nowrap">{record.age ?? '-'}</td>
                        <td className="min-w-[100px] px-4 py-3 whitespace-nowrap">{record.gender || '-'}</td>
                        <td className="min-w-[120px] px-4 py-3 whitespace-nowrap">
                          <PDFViewer pdfUrl={record.progenicsTrf} fileName="Progenics_TRF.pdf" />
                        </td>
                        <td className="min-w-[130px] px-4 py-3 whitespace-nowrap">{record.questionnaire || '-'}</td>
                        <td className="min-w-[150px] px-4 py-3 whitespace-nowrap">{record.questionnaireCallRecording || '-'}</td>
                        <td className="min-w-[150px] px-4 py-3 whitespace-nowrap">{record.dataAnalysisSheet || '-'}</td>
                        <td className="min-w-[140px] px-4 py-3 whitespace-nowrap">{record.progenicsReport || '-'}</td>
                        <td className="min-w-[130px] px-4 py-3 whitespace-nowrap">{record.nutritionChart || '-'}</td>
                        <td className="min-w-[150px] px-4 py-3 whitespace-nowrap">{record.counsellingSessionDate ? new Date(record.counsellingSessionDate).toLocaleDateString() : '-'}</td>
                        <td className="min-w-[160px] px-4 py-3 whitespace-nowrap">{record.furtherCounsellingRequired ? 'Yes' : 'No'}</td>
                        <td className="min-w-[140px] px-4 py-3 whitespace-nowrap">
                          <Badge className={getStatusBadgeColor(record.counsellingStatus)}>
                            {record.counsellingStatus || 'Pending'}
                          </Badge>
                        </td>
                        <td className="min-w-[150px] px-4 py-3 whitespace-nowrap">{record.counsellingSessionRecording || '-'}</td>
                        <td className="min-w-[150px] px-4 py-3 whitespace-nowrap">{record.alertToTechnicalLead ? 'Yes' : 'No'}</td>
                        <td className="min-w-[130px] px-4 py-3 whitespace-nowrap">{record.alertToReportTeam ? 'Yes' : 'No'}</td>
                        <td className="min-w-[140px] px-4 py-3 whitespace-nowrap">{record.createdAt ? new Date(record.createdAt).toLocaleString() : '-'}</td>
                        <td className="min-w-[130px] px-4 py-3 whitespace-nowrap">{getUserNameById(record.createdBy)}</td>
                        <td className="min-w-[150px] px-4 py-3 whitespace-nowrap">{record.modifiedAt ? new Date(record.modifiedAt).toLocaleString() : '-'}</td>
                        <td className="min-w-[130px] px-4 py-3 whitespace-nowrap">{record.modifiedBy || '-'}</td>
                        <td className="min-w-[200px] px-4 py-3 whitespace-nowrap">{record.remarksComment || '-'}</td>
                        <td className="border-l-2 border-gray-200 dark:border-gray-700 min-w-[150px] actions-column px-4 py-3">
                          <div className="action-buttons flex items-center space-x-2 h-full bg-white dark:bg-gray-900 px-2 py-1">
                            <Button
                              variant="outline"
                              size="sm"
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
                              onClick={() => {
                                if (!confirm('Move this nutrition record to Recycle Bin?')) return;
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
                                  }).catch(() => { /* ignore */ });
                                } catch (err) {
                                  // ignore recycle failures
                                }

                                (async () => {
                                  try {
                                    const res = await fetch(`/api/nutrition/${record.id}`, { method: 'DELETE' });
                                    if (!res.ok) throw new Error('Delete failed');
                                    queryClient.invalidateQueries({ queryKey: ['/api/nutrition'] });
                                    toast({ title: 'Moved to Recycle', description: 'Nutrition record moved to recycle bin' });
                                    window.dispatchEvent(new Event('ll:recycle:update'));
                                    return;
                                  } catch (e) {
                                    toast({ title: 'Recycle saved locally', description: 'Server delete failed; record kept locally', variant: 'destructive' });
                                  }
                                })();
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
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
                modifiedBy: 'System', // Should be current user
                modifiedAt: new Date().toISOString(),
              };
              console.log('[Nutrition Form] Submitting data:', data);
              updateMutation.mutate({ id: selectedRecord.id, data });
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
    </div>
  );
}