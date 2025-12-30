import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, FilePlus, Eye, X, AlertTriangle, Timer, Edit, Trash2 } from "lucide-react";
import type { ReportWithSample } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FilterBar } from "@/components/FilterBar";

export default function ReportManagement() {
  // Helper: remove common honorifics from a name to avoid duplicated prefixes
  const stripHonorific = (name?: string) => {
    if (!name) return '';
    return name.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Prof\.?|Miss\.?|Drs\.?)(\s+|-)?/i, '').trim();
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, location] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState('all');
  const [autoPopulatedData, setAutoPopulatedData] = useState<any>(null);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [dateFilterField, setDateFilterField] = useState<string>('created_at');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-populate fields from bioinformatics data passed via location state
  useEffect(() => {
    // Removed: Auto-open modal when bioinformatics data detected
    // User should manually create report if needed
  }, [location]);

  const { data: reports = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/report_management'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/report_management');
      return res.json();
    },
  });

  // Quick connectivity check for the new report_management API
  const checkReportManagementConnection = async () => {
    try {
      const res = await apiRequest('GET', '/api/report_management');
      const json = await res.json();
      toast({ title: 'report_management API', description: `Connected — ${Array.isArray(json) ? json.length : 1} records` });
      console.debug('report_management sample rows:', json?.slice?.(0, 3) || json);
    } catch (e: any) {
      toast({ title: 'report_management API', description: `Connection failed: ${e?.message || String(e)}` });
    }
  };

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({
    unique_id: '',
    project_id: '',
    report_url: '',
    report_release_date: '',
    organisation_hospital: '',
    clinician_researcher_name: '',
    clinician_researcher_email: '',
    clinician_researcher_phone: '',
    clinician_researcher_address: '',
    patient_client_name: '',
    age: '',
    gender: '',
    patient_client_email: '',
    patient_client_phone: '',
    patient_client_address: '',
    genetic_counselor_required: false,
    nutritional_counselling_required: false,
    service_name: '',
    tat: '',
    sample_type: '',
    no_of_samples: '',
    sample_id: '',
    sample_received_date: '',
    progenics_trf: '',
    approval_from_finance: false,
    sales_responsible_person: '',
    lead_created_by: '',
    lead_modified: '',
    remark_comment: '',
    gc_case_summary: '',
  });

  // Helper function to open new record form with bioinformatics data pre-populated
  const openNewRecordWithBioData = (bioData: any) => {
    const newForm = {
      unique_id: bioData.uniqueId ?? '',
      project_id: bioData.projectId ?? '',
      report_url: '',
      report_release_date: '',
      organisation_hospital: bioData.organisationHospital ?? '',
      clinician_researcher_name: bioData.clinicianResearcherName ?? '',
      clinician_researcher_email: '',
      clinician_researcher_phone: '',
      clinician_researcher_address: '',
      patient_client_name: bioData.patientClientName ?? '',
      age: bioData.age ?? '',
      gender: bioData.gender ?? '',
      patient_client_email: '',
      patient_client_phone: '',
      patient_client_address: '',
      genetic_counselor_required: false,
      nutritional_counselling_required: false,
      service_name: bioData.serviceName ?? '',
      tat: bioData.tat ?? '',
      sample_type: '',
      no_of_samples: bioData.noOfSamples ?? '',
      sample_id: bioData.sampleId ?? '',
      sample_received_date: bioData.sampleReceivedDate ? String(bioData.sampleReceivedDate).split('T')[0] : '',
      progenics_trf: '',
      approval_from_finance: false,
      sales_responsible_person: '',
      lead_created_by: bioData.createdBy ?? '',
      lead_modified: bioData.modifiedBy ?? '',
      remark_comment: bioData.remarkComment ?? '',
      gc_case_summary: '',
    };
    setEditRecord(null);
    setEditForm(newForm);
    setIsEditOpen(true);
    toast({
      title: 'New Report',
      description: 'Form pre-populated with bioinformatics data. Please complete and save.',
    });
  };

  const openEdit = (record: any) => {
    setEditRecord(record);
    setEditForm({
      unique_id: record.unique_id ?? record.uniqueId ?? '',
      project_id: record.project_id ?? record.projectId ?? '',
      report_url: record.report_url ?? record.reportUrl ?? '',
      report_release_date: record.report_release_date ? String(record.report_release_date).split('T')[0] : '',
      organisation_hospital: record.organisation_hospital ?? '',
      clinician_researcher_name: record.clinician_researcher_name ?? '',
      clinician_researcher_email: record.clinician_researcher_email ?? '',
      clinician_researcher_phone: record.clinician_researcher_phone ?? '',
      clinician_researcher_address: record.clinician_researcher_address ?? '',
      patient_client_name: record.patient_client_name ?? '',
      age: record.age ?? '',
      gender: record.gender ?? '',
      patient_client_email: record.patient_client_email ?? '',
      patient_client_phone: record.patient_client_phone ?? '',
      patient_client_address: record.patient_client_address ?? '',
      genetic_counselor_required: !!record.genetic_counselor_required,
      nutritional_counselling_required: !!record.nutritional_counselling_required,
      service_name: record.service_name ?? '',
      tat: record.tat ?? '',
      sample_type: record.sample_type ?? '',
      no_of_samples: record.no_of_samples ?? '',
      sample_id: record.sample_id ?? '',
      sample_received_date: record.sample_received_date ? String(record.sample_received_date).split('T')[0] : '',
      progenics_trf: record.progenics_trf ?? '',
      approval_from_finance: !!record.approval_from_finance,
      sales_responsible_person: record.sales_responsible_person ?? '',
      lead_created_by: record.lead_created_by ?? '',
      lead_modified: record.lead_modified ?? record.created_at ?? '',
      remark_comment: record.remark_comment ?? record.remarkComment ?? '',
      gc_case_summary: record.gc_case_summary ?? record.gcCaseSummary ?? '',
    });
    setIsEditOpen(true);
  };

  const getUniqueId = (r: any) => r.unique_id || r.uniqueId || r.id;

  const updateMutation = useMutation({
    mutationFn: async ({ uniqueId, updates }: { uniqueId: string; updates: any }) => {
      console.log('PUT request:', uniqueId, updates);
      const res = await apiRequest('PUT', `/api/report_management/${uniqueId}`, updates);
      const json = await res.json();
      console.log('PUT response:', json);
      return json;
    },
    onSuccess: async (_data, variables) => {
      console.log('Update onSuccess called');
      try {
        // Refresh the list
        await queryClient.invalidateQueries({ queryKey: ['/api/report_management'], refetchType: 'all' });
        // Fetch the updated record so the modal shows the latest data
        const uniqueId = variables.uniqueId;
        const res = await apiRequest('GET', `/api/report_management/${uniqueId}`);
        const json = await res.json();
        console.log('Fetched updated record:', json);
        setEditForm({
          unique_id: json.unique_id ?? json.uniqueId ?? '',
          project_id: json.project_id ?? json.projectId ?? '',
          report_url: json.report_url ?? json.reportUrl ?? '',
          report_release_date: json.report_release_date ? String(json.report_release_date).split('T')[0] : '',
          organisation_hospital: json.organisation_hospital ?? '',
          clinician_researcher_name: json.clinician_researcher_name ?? '',
          clinician_researcher_email: json.clinician_researcher_email ?? '',
          clinician_researcher_phone: json.clinician_researcher_phone ?? '',
          clinician_researcher_address: json.clinician_researcher_address ?? '',
          patient_client_name: json.patient_client_name ?? '',
          age: json.age ?? '',
          gender: json.gender ?? '',
          patient_client_email: json.patient_client_email ?? '',
          patient_client_phone: json.patient_client_phone ?? '',
          patient_client_address: json.patient_client_address ?? '',
          genetic_counselor_required: !!json.genetic_counselor_required,
          nutritional_counselling_required: !!json.nutritional_counselling_required,
          service_name: json.service_name ?? '',
          tat: json.tat ?? '',
          sample_type: json.sample_type ?? '',
          no_of_samples: json.no_of_samples ?? '',
          sample_id: json.sample_id ?? '',
          sample_received_date: json.sample_received_date ? String(json.sample_received_date).split('T')[0] : '',
          progenics_trf: json.progenics_trf ?? '',
          approval_from_finance: !!json.approval_from_finance,
          sales_responsible_person: json.sales_responsible_person ?? '',
          lead_created_by: json.lead_created_by ?? '',
          lead_modified: json.lead_modified ?? json.created_at ?? '',
          remark_comment: json.remark_comment ?? json.remarkComment ?? '',
          gc_case_summary: json.gc_case_summary ?? json.gcCaseSummary ?? '',
        });
        toast({ title: 'Updated', description: 'Record updated successfully' });
      } catch (e: any) {
        console.error('onSuccess refresh failed:', e);
        toast({ title: 'Update', description: 'Record updated but failed to refresh: ' + (e?.message || String(e)) });
      }
    },
    onError: (err: any) => {
      console.error('Update onError:', err);
      toast({ title: 'Update failed', description: err?.message || 'Failed to update' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (uniqueId: string) => {
      const res = await apiRequest('DELETE', `/api/report_management/${uniqueId}`);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/report_management'], refetchType: 'all' });
      toast({ title: 'Deleted', description: 'Record deleted' });
    },
    onError: (err: any) => {
      toast({ title: 'Delete failed', description: err?.message || 'Failed to delete' });
    }
  });

  const handleSave = async () => {
    if (!editRecord) return;
    const uniqueId = getUniqueId(editRecord) || editForm.unique_id;
    if (!uniqueId) {
      toast({ title: 'Missing ID', description: 'Cannot determine unique id for record' });
      return;
    }
    // Exclude read-only fields from the update payload
    // Normalize types: booleans -> 0/1, empty numeric strings -> null, numeric strings -> numbers
    const { unique_id, lead_modified, ...base } = editForm;
    const updatePayload: any = {
      ...base,
      genetic_counselor_required: base.genetic_counselor_required ? 1 : 0,
      nutritional_counselling_required: base.nutritional_counselling_required ? 1 : 0,
      approval_from_finance: base.approval_from_finance ? 1 : 0,
    };

    // Coerce numeric-like fields to numbers or null to avoid MySQL "Incorrect integer value" errors
    const numericFields = ['age', 'no_of_samples', 'tat'];
    for (const k of numericFields) {
      if (updatePayload[k] === '' || updatePayload[k] === undefined) {
        updatePayload[k] = null;
        continue;
      }
      if (typeof updatePayload[k] === 'string') {
        const n = Number(updatePayload[k]);
        updatePayload[k] = Number.isNaN(n) ? null : n;
      }
    }
    // Coerce empty date strings to null to avoid MySQL "Incorrect date value" errors
    const dateFields = ['report_release_date', 'sample_received_date'];
    for (const k of dateFields) {
      if (updatePayload[k] === '' || updatePayload[k] === undefined) {
        updatePayload[k] = null;
        continue;
      }
      // If it's a non-empty string, attempt to normalize to YYYY-MM-DD
      if (typeof updatePayload[k] === 'string') {
        const s = updatePayload[k].trim();
        if (s === '') {
          updatePayload[k] = null;
        } else {
          // if already in ISO date or YYYY-MM-DD, keep; otherwise try to parse
          const maybeDate = new Date(s);
          if (!isNaN(maybeDate.getTime())) {
            // send only the date part
            updatePayload[k] = maybeDate.toISOString().split('T')[0];
          }
        }
      }
    }
    console.log('Saving record:', uniqueId, 'with payload:', updatePayload);
    try {
      await updateMutation.mutateAsync({ uniqueId, updates: updatePayload });
      setIsEditOpen(false);
    } catch (err: any) {
      console.error('Save error:', err);
      toast({ title: 'Save error', description: err?.message || 'Failed to save' });
    }
  };

  const handleDelete = async (record: any) => {
    const uniqueId = getUniqueId(record);
    if (!uniqueId) return toast({ title: 'Missing ID', description: 'Cannot determine unique id for record' });
    const ok = window.confirm('Delete this report_management record?');
    if (!ok) return;
    await deleteMutation.mutateAsync(uniqueId);
  };

  // TAT Logic (simplified for report_management table data structure)
  const processedReports = useMemo(() => {
    return reports.map(report => {
      const regDate = new Date(report.sample_received_date || report.created_at || new Date());
      const tatHours = (parseInt(report.tat || '0', 10) || 0) * 24;
      const deadline = new Date(regDate.getTime() + tatHours * 60 * 60 * 1000);
      const diffMs = deadline.getTime() - currentTime.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);

      let urgency = 'normal';
      if (tatHours === 0) {
        urgency = 'normal';
      } else if (diffHrs < 0) {
        urgency = 'overdue';
      } else if (diffHrs < 2) {
        urgency = 'critical';
      } else if (diffHrs < 4) {
        urgency = 'warning';
      }

      return { ...report, deadline, diffMs, diffHrs, urgency, tatHours };
    }).sort((a, b) => {
      const urgencyWeight: Record<string, number> = { overdue: 0, critical: 1, warning: 2, normal: 3, completed: 4 };
      if (urgencyWeight[a.urgency] !== urgencyWeight[b.urgency]) {
        return urgencyWeight[a.urgency] - urgencyWeight[b.urgency];
      }
      return a.diffMs - b.diffMs;
    });
  }, [reports, currentTime]);

  const filteredReports = processedReports.filter(r => {
    // 1. Status/Urgency Filter
    if (filter !== 'all') {
      if (filter === 'critical') {
        if (!['overdue', 'critical'].includes(r.urgency)) return false;
      } else if (filter === 'warning') {
        if (r.urgency !== 'warning') return false;
      } else {
        // Filter by status for other values
        if (r.status !== filter) return false;
      }
    }

    // 2. Search Query (Global)
    let matchesSearch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch = Object.values(r).some(val => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') return Object.values(val).some(v => String(v ?? '').toLowerCase().includes(q));
        return String(val).toLowerCase().includes(q);
      });
    }

    // 3. Date Range Filter
    let matchesDate = true;
    if (dateRange.from) {
      const dateVal = (r as any)[dateFilterField];
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
  const totalRecords = filteredReports.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalRecords);
  const paginatedReports = filteredReports.slice(startIdx, endIdx);

  // Keep currentPage within bounds when filters/pageSize change
  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const approveReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest('PUT', `/api/reports/${reportId}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "Report approved",
        description: "Report has been approved and can be delivered",
      });
    },
  });

  const getStatusCounts = () => {
    return {
      inProgress: reports.filter(r => r.status === 'in_progress').length,
      awaitingApproval: reports.filter(r => r.status === 'awaiting_approval').length,
      approved: reports.filter(r => r.status === 'approved').length,
      delivered: reports.filter(r => r.status === 'delivered').length,
    };
  };

  const statusCounts = getStatusCounts();

  const statusCards = [
    {
      title: "In Progress",
      value: statusCounts.inProgress,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Awaiting Approval",
      value: statusCounts.awaitingApproval,
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: "Approved",
      value: statusCounts.approved,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Delivered",
      value: statusCounts.delivered,
      icon: FilePlus,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      awaiting_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      delivered: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return variants[status as keyof typeof variants] || variants.in_progress;
  };

  const getStatusText = (status: string) => {
    const texts = {
      in_progress: "In Progress",
      awaiting_approval: "Awaiting Approval",
      approved: "Approved",
      delivered: "Delivered",
    };
    return texts[status as keyof typeof texts] || status;
  };

  // Helper Component for TAT Urgency
  const UrgencyBadge = ({ urgency, diffHrs }: { urgency: string, diffHrs: number }) => {
    const formatTime = (hrs: number) => {
      const absHrs = Math.abs(hrs);
      const h = Math.floor(absHrs);
      const m = Math.floor((absHrs - h) * 60);
      return `${h}h ${m}m`;
    };

    const styles: Record<string, string> = {
      completed: "bg-slate-100 text-slate-600 border-slate-200",
      overdue: "bg-red-50 text-red-700 border-red-200 animate-pulse",
      critical: "bg-orange-50 text-orange-700 border-orange-200",
      warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
      normal: "bg-[#E6F6FD] text-[#0085CA] border-blue-100"
    };

    const style = styles[urgency] || styles.normal;
    const labels: Record<string, string> = {
      completed: "Completed",
      overdue: `Overdue ${formatTime(diffHrs)}`,
      critical: `< 2h Remaining`,
      warning: `< 4h Remaining`,
      normal: `${formatTime(diffHrs)} Left`
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${style} shadow-sm`}>
        {urgency === 'overdue' && <AlertTriangle className="w-3 h-3 mr-1.5" />}
        {urgency === 'critical' && <Timer className="w-3 h-3 mr-1.5" />}
        {labels[urgency]}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Report Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Generate, approve, and deliver client reports
        </p>
      </div>

      {/* Report Status Cards */}
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

      {/* Edit Dialog (single instance) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-full max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit report_management</DialogTitle>
            <DialogDescription>Update remark and finance approval</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Unique ID</label>
              <Input value={editForm.unique_id} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Project ID</label>
              <Input value={editForm.project_id} onChange={(e: any) => setEditForm((s: any) => ({ ...s, project_id: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Report URL</label>
              <Input value={editForm.report_url} onChange={(e: any) => setEditForm((s: any) => ({ ...s, report_url: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Report Release Date</label>
              <Input type="date" value={editForm.report_release_date} onChange={(e: any) => setEditForm((s: any) => ({ ...s, report_release_date: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Organisation / Hospital</label>
              <Input value={editForm.organisation_hospital} onChange={(e: any) => setEditForm((s: any) => ({ ...s, organisation_hospital: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Clinician / Researcher Name</label>
              <Input value={editForm.clinician_researcher_name} onChange={(e: any) => setEditForm((s: any) => ({ ...s, clinician_researcher_name: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Clinician Email</label>
              <Input value={editForm.clinician_researcher_email} onChange={(e: any) => setEditForm((s: any) => ({ ...s, clinician_researcher_email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Clinician Phone</label>
              <Input value={editForm.clinician_researcher_phone} onChange={(e: any) => setEditForm((s: any) => ({ ...s, clinician_researcher_phone: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Clinician Address</label>
              <Textarea value={editForm.clinician_researcher_address} onChange={(e: any) => setEditForm((s: any) => ({ ...s, clinician_researcher_address: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Patient / Client Name</label>
              <Input value={editForm.patient_client_name} onChange={(e: any) => setEditForm((s: any) => ({ ...s, patient_client_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <Input type="number" value={editForm.age} onChange={(e: any) => setEditForm((s: any) => ({ ...s, age: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <Input value={editForm.gender} onChange={(e: any) => setEditForm((s: any) => ({ ...s, gender: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Patient Email</label>
              <Input value={editForm.patient_client_email} onChange={(e: any) => setEditForm((s: any) => ({ ...s, patient_client_email: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Patient Phone</label>
              <Input value={editForm.patient_client_phone} onChange={(e: any) => setEditForm((s: any) => ({ ...s, patient_client_phone: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Patient Address</label>
              <Textarea value={editForm.patient_client_address} onChange={(e: any) => setEditForm((s: any) => ({ ...s, patient_client_address: e.target.value }))} />
            </div>

            <div className="flex items-center">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={!!editForm.genetic_counselor_required} onChange={(e: any) => setEditForm((s: any) => ({ ...s, genetic_counselor_required: e.target.checked }))} className="mr-2" />
                Genetic Counselling Required
              </label>
            </div>
            <div className="flex items-center">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={!!editForm.nutritional_counselling_required} onChange={(e: any) => setEditForm((s: any) => ({ ...s, nutritional_counselling_required: e.target.checked }))} className="mr-2" />
                Nutritional Counselling Required
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Service Name</label>
              <Input value={editForm.service_name} onChange={(e: any) => setEditForm((s: any) => ({ ...s, service_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">TAT (Days)</label>
              <Input type="number" value={editForm.tat} onChange={(e: any) => setEditForm((s: any) => ({ ...s, tat: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sample Type</label>
              <Input value={editForm.sample_type} onChange={(e: any) => setEditForm((s: any) => ({ ...s, sample_type: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">No of Samples</label>
              <Input type="number" value={editForm.no_of_samples} onChange={(e: any) => setEditForm((s: any) => ({ ...s, no_of_samples: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sample ID</label>
              <Input value={editForm.sample_id} onChange={(e: any) => setEditForm((s: any) => ({ ...s, sample_id: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sample Received Date</label>
              <Input type="date" value={editForm.sample_received_date} onChange={(e: any) => setEditForm((s: any) => ({ ...s, sample_received_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Progenics TRF</label>
              <Input value={editForm.progenics_trf} onChange={(e: any) => setEditForm((s: any) => ({ ...s, progenics_trf: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Approval from Finance</label>
              <div className="flex items-center">
                <input type="checkbox" checked={!!editForm.approval_from_finance} onChange={(e: any) => setEditForm((s: any) => ({ ...s, approval_from_finance: e.target.checked }))} className="mr-2" />
                <span>{editForm.approval_from_finance ? 'Approved' : 'Not approved'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sales / Responsible Person</label>
              <Input value={editForm.sales_responsible_person} onChange={(e: any) => setEditForm((s: any) => ({ ...s, sales_responsible_person: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Lead Created By</label>
              <Input value={editForm.lead_created_by} onChange={(e: any) => setEditForm((s: any) => ({ ...s, lead_created_by: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lead Modified</label>
              <Input value={editForm.lead_modified ? String(editForm.lead_modified) : ''} readOnly />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Remark / Comment</label>
              <Textarea value={editForm.remark_comment} onChange={(e: any) => setEditForm((s: any) => ({ ...s, remark_comment: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">GC Case Summary</label>
              <Textarea value={editForm.gc_case_summary} onChange={(e: any) => setEditForm((s: any) => ({ ...s, gc_case_summary: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reports Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <FilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dateRange={dateRange}
            setDateRange={setDateRange}
            dateFilterField={dateFilterField}
            setDateFilterField={setDateFilterField}
            dateFieldOptions={[
              { label: "Created At", value: "created_at" },
              { label: "Report Release Date", value: "report_release_date" },
              { label: "Sample Received Date", value: "sample_received_date" },
              { label: "Modified At", value: "lead_modified" },
            ]}
            totalItems={filteredReports.length}
            pageSize={pageSize}
            setPageSize={setPageSize}
            setPage={setCurrentPage}
            placeholder="Search Unique ID / Project ID / Sample ID / Client ID..."
          >
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="critical">Critical Urgency</SelectItem>
                <SelectItem value="warning">Warning Urgency</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => window.open('/wes-report.html', '_blank')}>
              <FileText className="mr-2 h-4 w-4" />
              WES Report
            </Button>
            <Button>
              <FilePlus className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </FilterBar>
        </CardHeader>
        <CardContent className="pt-0">
        </CardContent>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto leads-table-wrapper process-table-wrapper">
              <Table className="leads-table w-full text-sm">
                <TableHeader className="sticky top-0 z-30 bg-white dark:bg-gray-900">
                  <TableRow>
                    <TableHead className="min-w-[120px] whitespace-nowrap font-semibold sticky left-0 z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Unique ID</TableHead>
                    <TableHead>Project ID</TableHead>
                    <TableHead>Report URL</TableHead>
                    <TableHead>Report release Date</TableHead>
                    <TableHead>Organisation / Hospital</TableHead>
                    <TableHead>Clinician / Researcher Name</TableHead>
                    <TableHead>Clinician / Researcher Email</TableHead>
                    <TableHead>Clinician / Researcher Phone</TableHead>
                    <TableHead>Clinician / Researcher Address</TableHead>
                    <TableHead>Patient / Client Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Patient / Client Email</TableHead>
                    <TableHead>Patient / Client Phone</TableHead>
                    <TableHead>Patient / Client Address</TableHead>
                    <TableHead>Genetic Counselling Required</TableHead>
                    <TableHead>Nutritional Counselling Required</TableHead>
                    <TableHead>Service Name</TableHead>
                    <TableHead>TAT (Days)</TableHead>
                    <TableHead>Sample Type</TableHead>
                    <TableHead>No of Samples</TableHead>
                    <TableHead>Sample ID</TableHead>
                    <TableHead>Sample Received Date</TableHead>
                    <TableHead>Progenics TRF</TableHead>
                    <TableHead>Approveal from Finance</TableHead>
                    <TableHead>Sales / Responsible Person</TableHead>
                    <TableHead>Lead Created</TableHead>
                    <TableHead>Lead Modified</TableHead>
                    <TableHead>Remark / Comment</TableHead>
                    <TableHead>GC case Summary</TableHead>
                    <TableHead className="min-w-[120px] border-l-2 actions-column">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReports.map((report) => (
                    <TableRow key={report.unique_id}>
                      <TableCell className="min-w-[120px] font-medium sticky left-0 z-20 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{report.unique_id ?? '-'}</TableCell>
                      <TableCell>{report.project_id ?? '-'}</TableCell>
                      <TableCell>{report.report_url ?? '-'}</TableCell>
                      <TableCell>{report.report_release_date ? new Date(report.report_release_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{report.organisation_hospital ?? '-'}</TableCell>
                      <TableCell>{report.clinician_researcher_name ?? '-'}</TableCell>
                      <TableCell>{report.clinician_researcher_email ?? '-'}</TableCell>
                      <TableCell>{report.clinician_researcher_phone ?? '-'}</TableCell>
                      <TableCell>{report.clinician_researcher_address ?? '-'}</TableCell>
                      <TableCell>{report.patient_client_name ?? '-'}</TableCell>
                      <TableCell>{report.age ?? '-'}</TableCell>
                      <TableCell>{report.gender ?? '-'}</TableCell>
                      <TableCell>{report.patient_client_email ?? '-'}</TableCell>
                      <TableCell>{report.patient_client_phone ?? '-'}</TableCell>
                      <TableCell>{report.patient_client_address ?? '-'}</TableCell>
                      <TableCell>{report.genetic_counselor_required ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{report.nutritional_counselling_required ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{report.service_name ?? '-'}</TableCell>
                      <TableCell>{report.tat ?? '-'}</TableCell>
                      <TableCell>{report.sample_type ?? '-'}</TableCell>
                      <TableCell>{report.no_of_samples ?? '-'}</TableCell>
                      <TableCell>{report.sample_id ?? '-'}</TableCell>
                      <TableCell>{report.sample_received_date ? new Date(report.sample_received_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{report.progenics_trf ?? '-'}</TableCell>
                      <TableCell>{report.approval_from_finance ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{report.sales_responsible_person ?? '-'}</TableCell>
                      <TableCell>{report.lead_created_by ?? '-'}</TableCell>
                      <TableCell>{report.lead_modified ? new Date(report.lead_modified).toLocaleString() : '-'}</TableCell>
                      <TableCell>{report.remark_comment ?? '-'}</TableCell>
                      <TableCell>{report.gc_case_summary ?? '-'}</TableCell>
                      <TableCell className="min-w-[150px] border-l-2 px-4 py-3">
                        <div className="action-buttons flex items-center space-x-2 h-full bg-white dark:bg-gray-900 px-2 py-1">
                          <Button size="sm" variant="outline" onClick={() => openEdit(report)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(report)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Pagination controls */}
          {filteredReports.length > 0 && (
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
        </CardContent>
      </Card>
    </div>
  );
}
