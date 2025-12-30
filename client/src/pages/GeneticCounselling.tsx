import { useState, useEffect, useMemo } from 'react';
import { useRecycle } from '@/contexts/RecycleContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from "@/contexts/AuthContext";
import { User, Clock, Check, Search, Edit as EditIcon, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { FilterBar } from "@/components/FilterBar";
import { useColumnPreferences, ColumnConfig } from '@/hooks/useColumnPreferences';
import { ColumnSettings } from '@/components/ColumnSettings';


type GCRecord = {
  id: string;
  unique_id: string;
  project_id: string;
  counselling_date?: string;
  gc_registration_start_time?: string;
  gc_registration_end_time?: string;
  patient_client_name?: string;
  age?: number;
  gender?: string;
  patient_client_email?: string;
  patient_client_phone?: string;
  patient_client_address?: string;
  payment_status?: string;
  mode_of_payment?: string;
  approval_from_head?: boolean;
  clinician_researcher_name?: string;
  organisation_hospital?: string;
  speciality?: string;
  query_suspection?: string;
  gc_name: string;
  gc_other_members?: string;
  service_name?: string;
  counseling_type?: string;
  counseling_start_time?: string;
  counseling_end_time?: string;
  budget_for_test_opted?: string;
  testing_status?: string;
  action_required?: string;
  potential_patient_for_testing_in_future?: boolean;
  extended_family_testing_requirement?: boolean;
  budget?: string;
  sample_type?: string;
  gc_summary_sheet?: string;
  gc_video_link?: string;
  gc_audio_link?: string;
  sales_responsible_person?: string;
  created_at?: string;
  created_by?: string;
  modified_at?: string;
  modified_by?: string;
  remark_comment?: string;
};

const initialData: GCRecord[] = [];

export default function GeneticCounselling() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: serverRows = null } = useQuery<GCRecord[]>({
    queryKey: ['/api/genetic-counselling-sheet'],
    queryFn: async () => {
      const r = await fetch('/api/genetic-counselling-sheet');
      if (!r.ok) throw new Error('Failed to fetch');
      return r.json();
    },
    retry: 1
  });

  // Keep local rows in sync with server query results when available.
  const [rows, setRows] = useState<GCRecord[]>(initialData);

  // Normalizer: map server row (camelCase or snake_case) to client GCRecord shape (snake_case)
  const normalizeServerRow = (r: any): GCRecord => ({
    id: r.id,
    unique_id: r.unique_id ?? r.uniqueId ?? '',
    project_id: r.projectId ?? r.project_id ?? '',
    counselling_date: r.counsellingDate ?? r.counselling_date ?? r.createdAt ?? r.created_at ?? undefined,
    gc_registration_start_time: r.gcRegistrationStartTime ?? r.gc_registration_start_time ?? undefined,
    gc_registration_end_time: r.gcRegistrationEndTime ?? r.gc_registration_end_time ?? undefined,
    patient_client_name: r.patientClientName ?? r.patient_client_name ?? undefined,
    age: r.age ?? undefined,
    gender: r.gender ?? undefined,
    patient_client_email: r.patientClientEmail ?? r.patient_client_email ?? undefined,
    patient_client_phone: r.patientClientPhone ?? r.patient_client_phone ?? undefined,
    patient_client_address: r.patientClientAddress ?? r.patient_client_address ?? undefined,
    payment_status: r.paymentStatus ?? r.payment_status ?? undefined,
    mode_of_payment: r.modeOfPayment ?? r.mode_of_payment ?? undefined,
    approval_from_head: !!(r.approvalFromHead ?? r.approval_from_head),
    clinician_researcher_name: r.clinicianResearcherName ?? r.clinician_researcher_name ?? undefined,
    organisation_hospital: r.organisationHospital ?? r.organisation_hospital ?? undefined,
    speciality: r.speciality ?? undefined,
    query_suspection: r.querySuspection ?? r.query_suspection ?? undefined,
    gc_name: r.gcName ?? r.gc_name ?? '',
    gc_other_members: r.gcOtherMembers ?? r.gc_other_members ?? undefined,
    service_name: r.serviceName ?? r.service_name ?? undefined,
    counseling_type: r.counselingType ?? r.counseling_type ?? undefined,
    counseling_start_time: r.counselingStartTime ?? r.counseling_start_time ?? undefined,
    counseling_end_time: r.counselingEndTime ?? r.counseling_end_time ?? undefined,
    budget_for_test_opted: r.budgetForTestOpted ?? r.budget_for_test_opted ?? undefined,
    testing_status: r.testingStatus ?? r.testing_status ?? undefined,
    action_required: r.actionRequired ?? r.action_required ?? undefined,
    potential_patient_for_testing_in_future: !!(r.potentialPatientForTestingInFuture ?? r.potential_patient_for_testing_in_future),
    extended_family_testing_requirement: !!(r.extendedFamilyTestingRequirement ?? r.extended_family_testing_requirement),
    budget: r.budget ?? undefined,
    sample_type: r.sampleType ?? r.sample_type ?? undefined,
    gc_summary_sheet: r.gcSummarySheet ?? r.gc_summary_sheet ?? undefined,
    gc_video_link: r.gcVideoLink ?? r.gc_video_link ?? undefined,
    gc_audio_link: r.gcAudioLink ?? r.gc_audio_link ?? undefined,
    sales_responsible_person: r.salesResponsiblePerson ?? r.sales_responsible_person ?? undefined,
    created_at: r.createdAt ?? r.created_at ?? undefined,
    created_by: r.createdBy ?? r.created_by ?? undefined,
    modified_at: r.modifiedAt ?? r.modified_at ?? undefined,
    modified_by: r.modifiedBy ?? r.modified_by ?? undefined,
    remark_comment: r.remarkComment ?? r.remark_comment ?? undefined,
  });

  // When serverRows is available (DB reachable), replace local rows so the UI reflects DB state.
  useEffect(() => {
    if (serverRows && Array.isArray(serverRows)) {
      try {
        const normalized = serverRows.map(normalizeServerRow);
        setRows(normalized);
        setPage(1);
      } catch (e) {
        // fallback: just set raw serverRows
        setRows(serverRows as any);
        setPage(1);
      }
    }
  }, [serverRows]);

  // Helper function to format TIME-only strings (HH:MM:SS) for display
  const formatTimeString = (timeStr: string | undefined): string => {
    if (!timeStr) return '-';
    // If it's just a time string (HH:MM:SS format), format it directly
    if (timeStr.includes(':') && !timeStr.includes('T') && !timeStr.includes('Z')) {
      return timeStr; // Just return as-is (09:00:00)
    }
    // Otherwise try to parse as date
    try {
      return new Date(timeStr).toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timeStr;
    }
  };

  // Helper function to format DATE/DATETIME strings for display

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<GCRecord | null>(null);
  const { add } = useRecycle();

  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [dateFilterField, setDateFilterField] = useState<string>('created_at');
  const [counsellingTypeFilter, setCounsellingTypeFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  // Sorting state (per-column ascending/descending)
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Column configuration for hide/show feature
  const gcColumns: ColumnConfig[] = useMemo(() => [
    { id: 'unique_id', label: 'Unique ID', canHide: false },
    { id: 'project_id', label: 'Project ID', defaultVisible: true },
    { id: 'counselling_date', label: 'Counselling Date', defaultVisible: true },
    { id: 'gc_registration_start_time', label: 'GC Registration Start Time', defaultVisible: false },
    { id: 'gc_registration_end_time', label: 'GC Registration End Time', defaultVisible: false },
    { id: 'patient_client_name', label: 'Patient/Client Name', defaultVisible: true },
    { id: 'age', label: 'Age', defaultVisible: false },
    { id: 'gender', label: 'Gender', defaultVisible: false },
    { id: 'patient_client_email', label: 'Patient/Client Email', defaultVisible: false },
    { id: 'patient_client_phone', label: 'Patient/Client Phone', defaultVisible: false },
    { id: 'patient_client_address', label: 'Patient/Client Address', defaultVisible: false },
    { id: 'payment_status', label: 'Payment Status', defaultVisible: false },
    { id: 'mode_of_payment', label: 'Mode of Payment', defaultVisible: false },
    { id: 'approval_from_head', label: 'Approval from Head', defaultVisible: true },
    { id: 'clinician_researcher_name', label: 'Clinician/Researcher Name', defaultVisible: true },
    { id: 'organisation_hospital', label: 'Organisation/Hospital', defaultVisible: true },
    { id: 'speciality', label: 'Speciality', defaultVisible: false },
    { id: 'query_suspection', label: 'Query/Suspection', defaultVisible: false },
    { id: 'gc_name', label: 'GC Name', defaultVisible: true },
    { id: 'gc_other_members', label: 'GC Other Members', defaultVisible: false },
    { id: 'service_name', label: 'Service Name', defaultVisible: true },
    { id: 'counseling_type', label: 'Counselling Type', defaultVisible: true },
    { id: 'counseling_start_time', label: 'Counselling Start Time', defaultVisible: false },
    { id: 'counseling_end_time', label: 'Counselling End Time', defaultVisible: false },
    { id: 'budget_for_test_opted', label: 'Budget for Test Opted', defaultVisible: false },
    { id: 'testing_status', label: 'Testing Status', defaultVisible: true },
    { id: 'action_required', label: 'Action Required', defaultVisible: false },
    { id: 'potential_patient_for_testing_in_future', label: 'Potential Patient for Testing', defaultVisible: false },
    { id: 'extended_family_testing_requirement', label: 'Extended Family Testing', defaultVisible: false },
    { id: 'budget', label: 'Budget', defaultVisible: false },
    { id: 'sample_type', label: 'Sample Type', defaultVisible: false },
    { id: 'gc_summary_sheet', label: 'GC Summary Sheet', defaultVisible: false },
    { id: 'gc_video_link', label: 'GC Video Link', defaultVisible: false },
    { id: 'gc_audio_link', label: 'GC Audio Link', defaultVisible: false },
    { id: 'sales_responsible_person', label: 'Sales/Responsible Person', defaultVisible: false },
    { id: 'created_at', label: 'Created At', defaultVisible: false },
    { id: 'created_by', label: 'Created By', defaultVisible: false },
    { id: 'modified_at', label: 'Modified At', defaultVisible: false },
    { id: 'modified_by', label: 'Modified By', defaultVisible: false },
    { id: 'remark_comment', label: 'Remark/Comment', defaultVisible: true },
    { id: 'actions', label: 'Actions', canHide: false },
  ], []);

  // Column visibility preferences (per-user)
  const gcColumnPrefs = useColumnPreferences('genetic_counselling_table', gcColumns);


  const form = useForm<GCRecord>({
    defaultValues: {
      approval_from_head: false,
      potential_patient_for_testing_in_future: false,
      extended_family_testing_requirement: false,
    } as any
  });

  // Filter records based on search and filters
  // Filter records based on search and filters
  const filteredRows = rows.filter((record) => {
    // 1. Counselling Type Filter
    if (counsellingTypeFilter !== 'all' && record.counseling_type !== counsellingTypeFilter) {
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
  }).filter((record, index, self) => self.findIndex(r => r.id === record.id) === index);

  // Pagination calculations
  const totalFiltered = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  // Reset to first page if current page exceeds total pages
  if (page > totalPages) setPage(totalPages);
  const start = (page - 1) * pageSize;

  // Apply sorting if requested
  const sortedRows = (() => {
    if (!sortKey) return filteredRows;
    const copy = [...filteredRows];
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

  const openEdit = (r: GCRecord) => {
    setEditing(r);
    form.reset(r);
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    // Add to client recycle bin first (ensures user can recover even if server snapshot fails)
    try {
      const item = rows.find(r => r.id === id);
      if (item) {
        // Capture exact deletion timestamp that we'll use in UI
        const now = new Date();
        // Format it to match the display format used in RecycleBin.tsx
        const deletedAt = now.toISOString();
        add({
          entityType: 'genetic_counselling',
          entityId: id,
          name: `${item.id || id} - ${item.patient_client_name || 'No Name'}`,
          originalPath: '/genetic-counselling',
          data: {
            ...item,
            // Ensure we pass the exact deletion time
            deletedAt
          },
          deletedAt
        }).catch(() => { /* ignore */ });
      }
    } catch (err) {
      // ignore recycle failures
    }

    // attempt server delete, fallback to local state on failure
    (async () => {
      try {
        const res = await fetch(`/api/genetic-counselling-sheet/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        queryClient.invalidateQueries({ queryKey: ['/api/genetic-counselling-sheet'] });
        toast({ title: 'Deleted', description: 'Record deleted' });
        // Notify recycle UI to pick up the new entry created by the server
        window.dispatchEvent(new Event('ll:recycle:update'));
        return;
      } catch (e) {
        // fallback to local removal
        setRows((s) => s.filter((r) => r.id !== id));
        toast({ title: 'Deleted (local)', description: 'Server delete failed, removed locally' });
      }
    })();
    // Reset to first page if deleting from current page
    if (visibleRows.length === 1 && page > 1) {
      setPage(page - 1);
    }
  };

  const onSave = (data: GCRecord) => {
    console.log('[GC onSave] Starting save operation for record:', data.id || 'new');
    (async () => {
      try {
        if (editing) {
          console.log('[GC onSave] Updating record ID:', data.id);
          // Set modified_by to current user's name
          data.modified_by = user?.name || user?.email || 'system';
          const res = await fetch(`/api/genetic-counselling-sheet/${data.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          console.log('[GC onSave] PUT response status:', res.status);
          if (!res.ok) {
            const errorText = await res.text();
            console.error('[GC onSave] PUT failed:', errorText);
            throw new Error('Update failed');
          }
          const result = await res.json();
          console.log('[GC onSave] PUT success, result:', result);
          // Let React Query refetch handle the update - don't manually update state
          queryClient.invalidateQueries({ queryKey: ['/api/genetic-counselling-sheet'] });
          toast({ title: 'Updated', description: 'Record updated' });
        } else {
          console.log('[GC onSave] Creating new record');
          // Set created_by to current user's name
          data.created_by = user?.name || user?.email || 'system';
          const res = await fetch('/api/genetic-counselling-sheet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          console.log('[GC onSave] POST response status:', res.status);
          if (!res.ok) {
            const errorText = await res.text();
            console.error('[GC onSave] POST failed:', errorText);
            throw new Error('Create failed');
          }
          const result = await res.json();
          console.log('[GC onSave] POST success, result:', result);
          // Let React Query refetch handle adding the new record - don't manually update state
          queryClient.invalidateQueries({ queryKey: ['/api/genetic-counselling-sheet'] });
          toast({ title: 'Created', description: 'Record created' });
        }
      } catch (e) {
        console.error('[GC onSave] Error:', e);
        // fallback to local update only if server fails
        if (editing) {
          setRows((s) => s.map((r) => (r.id === data.id ? data : r)));
        } else {
          setRows((s) => [data, ...s]);
        }
        toast({ title: 'Saved locally', description: 'Server operation failed; changes kept locally' });
      } finally {
        setIsOpen(false);
        setEditing(null);
        setPage(1);
      }
    })();
  };

  const getCounsellingTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Pre-test': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Post-test': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'Follow-up': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Genetic Counselling</h1>
          <p className="text-muted-foreground">Manage genetic counselling sessions and approvals</p>
        </div>
        <div>
          <Button onClick={() => {
            setEditing(null);
            form.reset({
              approval_from_head: false,
              potential_patient_for_testing_in_future: false,
              extended_family_testing_requirement: false,
            } as any);
            setIsOpen(true);
          }}>
            + Add New GC
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-green-50 flex items-center justify-center mb-3">
            <User className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-extrabold">{rows.length}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Counselling</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-yellow-50 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-2xl font-extrabold">{rows.filter((r) => r.counseling_type === 'Pre-test').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Pre-test</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-blue-50 flex items-center justify-center mb-3">
            <Check className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold">{rows.filter((r) => r.counseling_type === 'Post-test').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Post-test</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Genetic Counselling Queue</CardTitle>
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
              { label: "Created At", value: "created_at" },
              { label: "Counselling Date", value: "counselling_date" },
              { label: "Modified At", value: "modified_at" },
            ]}
            totalItems={filteredRows.length}
            pageSize={pageSize}
            setPageSize={setPageSize}
            setPage={setPage}
            placeholder="Search Unique ID / Project ID / Patient Name / Phone..."
          >
            <Select
              value={counsellingTypeFilter}
              onValueChange={(value) => {
                setCounsellingTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] bg-white dark:bg-gray-900">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Pre-test">Pre-test</SelectItem>
                <SelectItem value="Post-test">Post-test</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>

          {/* Column Visibility Settings */}
          <div className="mt-2 mb-2 px-4">
            <ColumnSettings
              columns={gcColumns}
              isColumnVisible={gcColumnPrefs.isColumnVisible}
              toggleColumn={gcColumnPrefs.toggleColumn}
              resetToDefaults={gcColumnPrefs.resetToDefaults}
              showAllColumns={gcColumnPrefs.showAllColumns}
              showCompactView={gcColumnPrefs.showCompactView}
              visibleCount={gcColumnPrefs.visibleCount}
              totalCount={gcColumnPrefs.totalCount}
            />
          </div>

          <div className="border rounded-lg max-h-[60vh] overflow-x-auto leads-table-wrapper process-table-wrapper">
            <Table className="leads-table">
              <TableHeader className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b-2">
                <TableRow>
                  {gcColumnPrefs.isColumnVisible('unique_id') && <TableHead onClick={() => { setSortKey('unique_id'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold sticky left-0 z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Unique ID{sortKey === 'unique_id' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('project_id') && <TableHead onClick={() => { setSortKey('project_id'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold sticky left-[120px] z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Project ID{sortKey === 'project_id' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('counselling_date') && <TableHead onClick={() => { setSortKey('counselling_date'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Counselling date{sortKey === 'counselling_date' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('gc_registration_start_time') && <TableHead onClick={() => { setSortKey('gc_registration_start_time'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">GC registration start time{sortKey === 'gc_registration_start_time' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('gc_registration_end_time') && <TableHead onClick={() => { setSortKey('gc_registration_end_time'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">GC registration end time{sortKey === 'gc_registration_end_time' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('patient_client_name') && <TableHead onClick={() => { setSortKey('patient_client_name'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Patient/Client name{sortKey === 'patient_client_name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('age') && <TableHead onClick={() => { setSortKey('age'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Age{sortKey === 'age' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('gender') && <TableHead onClick={() => { setSortKey('gender'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Gender{sortKey === 'gender' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('patient_client_email') && <TableHead onClick={() => { setSortKey('patient_client_email'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Patient/Client email{sortKey === 'patient_client_email' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('patient_client_phone') && <TableHead onClick={() => { setSortKey('patient_client_phone'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Patient/Client phone{sortKey === 'patient_client_phone' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('patient_client_address') && <TableHead onClick={() => { setSortKey('patient_client_address'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Patient/Client address{sortKey === 'patient_client_address' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('payment_status') && <TableHead onClick={() => { setSortKey('payment_status'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Payment status{sortKey === 'payment_status' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('mode_of_payment') && <TableHead onClick={() => { setSortKey('mode_of_payment'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Mode of payment{sortKey === 'mode_of_payment' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('approval_from_head') && <TableHead onClick={() => { setSortKey('approval_from_head'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Approval from head{sortKey === 'approval_from_head' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('clinician_researcher_name') && <TableHead onClick={() => { setSortKey('clinician_researcher_name'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Clinician/Researcher name{sortKey === 'clinician_researcher_name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('organisation_hospital') && <TableHead onClick={() => { setSortKey('organisation_hospital'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Organisation/Hospital{sortKey === 'organisation_hospital' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('speciality') && <TableHead onClick={() => { setSortKey('speciality'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Speciality{sortKey === 'speciality' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('query_suspection') && <TableHead onClick={() => { setSortKey('query_suspection'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Query/Suspection{sortKey === 'query_suspection' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('gc_name') && <TableHead onClick={() => { setSortKey('gc_name'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">GC name{sortKey === 'gc_name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('gc_other_members') && <TableHead onClick={() => { setSortKey('gc_other_members'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">GC other members{sortKey === 'gc_other_members' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('service_name') && <TableHead onClick={() => { setSortKey('service_name'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Service name{sortKey === 'service_name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('counseling_type') && <TableHead onClick={() => { setSortKey('counseling_type'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Counselling type{sortKey === 'counseling_type' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('counseling_start_time') && <TableHead onClick={() => { setSortKey('counseling_start_time'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Counselling start time{sortKey === 'counseling_start_time' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('counseling_end_time') && <TableHead onClick={() => { setSortKey('counseling_end_time'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Counselling end time{sortKey === 'counseling_end_time' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('budget_for_test_opted') && <TableHead onClick={() => { setSortKey('budget_for_test_opted'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Budget for Test opted{sortKey === 'budget_for_test_opted' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('testing_status') && <TableHead onClick={() => { setSortKey('testing_status'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Testing status{sortKey === 'testing_status' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('action_required') && <TableHead onClick={() => { setSortKey('action_required'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Action required{sortKey === 'action_required' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('potential_patient_for_testing_in_future') && <TableHead onClick={() => { setSortKey('potential_patient_for_testing_in_future'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Potential Patient for testing in future{sortKey === 'potential_patient_for_testing_in_future' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('extended_family_testing_requirement') && <TableHead onClick={() => { setSortKey('extended_family_testing_requirement'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Extended family testing requirement{sortKey === 'extended_family_testing_requirement' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('budget') && <TableHead onClick={() => { setSortKey('budget'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Budget{sortKey === 'budget' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('sample_type') && <TableHead onClick={() => { setSortKey('sample_type'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Sample Type{sortKey === 'sample_type' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('gc_summary_sheet') && <TableHead onClick={() => { setSortKey('gc_summary_sheet'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">GC summary sheet{sortKey === 'gc_summary_sheet' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('gc_video_link') && <TableHead onClick={() => { setSortKey('gc_video_link'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">GC video link{sortKey === 'gc_video_link' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('gc_audio_link') && <TableHead onClick={() => { setSortKey('gc_audio_link'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">GC audio link{sortKey === 'gc_audio_link' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('sales_responsible_person') && <TableHead onClick={() => { setSortKey('sales_responsible_person'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Sales/Responsible person{sortKey === 'sales_responsible_person' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('created_at') && <TableHead onClick={() => { setSortKey('created_at'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Created at{sortKey === 'created_at' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('created_by') && <TableHead onClick={() => { setSortKey('created_by'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Created by{sortKey === 'created_by' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('modified_at') && <TableHead onClick={() => { setSortKey('modified_at'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Modified at{sortKey === 'modified_at' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('modified_by') && <TableHead onClick={() => { setSortKey('modified_by'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Modified by{sortKey === 'modified_by' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('remark_comment') && <TableHead onClick={() => { setSortKey('remark_comment'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Remark/Comment{sortKey === 'remark_comment' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                  {gcColumnPrefs.isColumnVisible('actions') && <TableHead className="sticky right-0 bg-white dark:bg-gray-900 border-l-2 whitespace-nowrap font-semibold actions-column">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={gcColumnPrefs.visibleCount} className="text-center py-8 text-muted-foreground">
                      {filteredRows.length === 0 ? "No genetic counselling records found" : "No records match your search criteria"}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                      {gcColumnPrefs.isColumnVisible('unique_id') && <TableCell className="font-medium sticky left-0 z-20 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{r.unique_id}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('project_id') && <TableCell className="sticky left-[120px] z-20 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{r.project_id ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('counselling_date') && <TableCell className="text-sm">
                        {r.counselling_date ? (
                          (() => {
                            try {
                              const parsed = Date.parse(String(r.counselling_date));
                              if (isNaN(parsed)) return <span>{String(r.counselling_date)}</span>;
                              const d = new Date(parsed);
                              return (
                                <span title={d.toISOString()}>
                                  {d.toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    timeZoneName: 'short'
                                  })}
                                </span>
                              );
                            } catch (e) {
                              return <span>{String(r.counselling_date)}</span>;
                            }
                          })()
                        ) : '-'}
                      </TableCell>}
                      {gcColumnPrefs.isColumnVisible('gc_registration_start_time') && <TableCell className="text-sm">
                        {r.gc_registration_start_time ? (
                          <span>{formatTimeString(r.gc_registration_start_time)}</span>
                        ) : '-'}
                      </TableCell>}
                      {gcColumnPrefs.isColumnVisible('gc_registration_end_time') && <TableCell className="text-sm">
                        {r.gc_registration_end_time ? (
                          <span>{formatTimeString(r.gc_registration_end_time)}</span>
                        ) : '-'}
                      </TableCell>}
                      {gcColumnPrefs.isColumnVisible('patient_client_name') && <TableCell>{r.patient_client_name ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('age') && <TableCell>{r.age != null ? String(r.age) : '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('gender') && <TableCell>{r.gender ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('patient_client_email') && <TableCell>{r.patient_client_email ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('patient_client_phone') && <TableCell>{r.patient_client_phone ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('patient_client_address') && <TableCell>{r.patient_client_address ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('payment_status') && <TableCell>{r.payment_status ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('mode_of_payment') && <TableCell>{r.mode_of_payment ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('approval_from_head') && <TableCell>{r.approval_from_head ? 'Yes' : 'No'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('clinician_researcher_name') && <TableCell>{r.clinician_researcher_name ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('organisation_hospital') && <TableCell>{r.organisation_hospital ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('speciality') && <TableCell>{r.speciality ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('query_suspection') && <TableCell className="max-w-xs truncate">{r.query_suspection ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('gc_name') && <TableCell>{r.gc_name ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('gc_other_members') && <TableCell>{r.gc_other_members ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('service_name') && <TableCell>{r.service_name ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('counseling_type') && <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCounsellingTypeBadgeColor(r.counseling_type ?? '')}`}>
                          {r.counseling_type}
                        </span>
                      </TableCell>}
                      {gcColumnPrefs.isColumnVisible('counseling_start_time') && <TableCell className="text-sm">
                        {r.counseling_start_time ? (
                          <span>{formatTimeString(r.counseling_start_time)}</span>
                        ) : '-'}
                      </TableCell>}
                      {gcColumnPrefs.isColumnVisible('counseling_end_time') && <TableCell className="text-sm">
                        {r.counseling_end_time ? (
                          <span>{formatTimeString(r.counseling_end_time)}</span>
                        ) : '-'}
                      </TableCell>}
                      {gcColumnPrefs.isColumnVisible('budget_for_test_opted') && <TableCell>{r.budget_for_test_opted ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('testing_status') && <TableCell>{r.testing_status ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('action_required') && <TableCell className="max-w-xs truncate">{r.action_required ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('potential_patient_for_testing_in_future') && <TableCell>{r.potential_patient_for_testing_in_future ? 'Yes' : 'No'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('extended_family_testing_requirement') && <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.extended_family_testing_requirement
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                          }`}>
                          {r.extended_family_testing_requirement ? 'Yes' : 'No'}
                        </span>
                      </TableCell>}
                      {gcColumnPrefs.isColumnVisible('budget') && <TableCell>{r.budget ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('sample_type') && <TableCell>{r.sample_type ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('gc_summary_sheet') && <TableCell className="max-w-xs truncate">{r.gc_summary_sheet ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('gc_video_link') && <TableCell className="max-w-xs truncate">{r.gc_video_link ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('gc_audio_link') && <TableCell className="max-w-xs truncate">{r.gc_audio_link ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('sales_responsible_person') && <TableCell>{r.sales_responsible_person ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('created_at') && <TableCell className="text-sm">
                        {r.created_at ? (
                          (() => {
                            try {
                              const parsed = Date.parse(String(r.created_at));
                              if (isNaN(parsed)) return <span>{String(r.created_at)}</span>;
                              const d = new Date(parsed);
                              return (
                                <span title={d.toISOString()}>
                                  {d.toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    timeZoneName: 'short'
                                  })}
                                </span>
                              );
                            } catch (e) {
                              return <span>{String(r.created_at)}</span>;
                            }
                          })()
                        ) : '-'}
                      </TableCell>}
                      {gcColumnPrefs.isColumnVisible('created_by') && <TableCell>{r.created_by ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('modified_at') && <TableCell className="text-sm">
                        {r.modified_at ? (
                          (() => {
                            try {
                              const parsed = Date.parse(String(r.modified_at));
                              if (isNaN(parsed)) return <span>{String(r.modified_at)}</span>;
                              const d = new Date(parsed);
                              return (
                                <span title={d.toISOString()}>
                                  {d.toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    timeZoneName: 'short'
                                  })}
                                </span>
                              );
                            } catch (e) {
                              return <span>{String(r.modified_at)}</span>;
                            }
                          })()
                        ) : '-'}
                      </TableCell>}
                      {gcColumnPrefs.isColumnVisible('modified_by') && <TableCell>{r.modified_by ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('remark_comment') && <TableCell className="max-w-xs truncate">{r.remark_comment ?? '-'}</TableCell>}
                      {gcColumnPrefs.isColumnVisible('actions') && <TableCell className="sticky right-0 bg-white dark:bg-gray-900 border-l-2 actions-column">
                        <div className="action-buttons flex space-x-2">
                          <Button size="sm" variant="ghost" aria-label="Edit GC" onClick={() => openEdit(r)}>
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" aria-label="Delete GC" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {visibleRows.length > 0 && (
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Genetic Counselling' : 'Add New GC'}</DialogTitle>
            <DialogDescription>{editing ? 'Edit counselling details for the selected sample.' : 'Create a new genetic counselling record.'}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(
              (vals) => {
                // Ensure ID is present for updates
                if (editing && editing.id) {
                  vals.id = editing.id;
                }
                // ensure boolean flags are consistent - checkboxes may not be captured properly
                vals.approval_from_head = !!vals.approval_from_head;
                vals.extended_family_testing_requirement = !!vals.extended_family_testing_requirement;
                vals.potential_patient_for_testing_in_future = !!vals.potential_patient_for_testing_in_future;

                // Convert datetime values to MySQL-friendly format (YYYY-MM-DD HH:mm:ss)
                // Handle three types of inputs safely:
                //  - HTML datetime-local: 'YYYY-MM-DDTHH:MM' -> append ':00'
                //  - ISO timestamps: parse and format to local YYYY-MM-DD HH:MM:SS
                //  - Already formatted DB datetimes: leave as-is
                const dateTimeFields = [
                  'counselling_date',
                  'gc_registration_start_time',
                  'gc_registration_end_time',
                  'counseling_start_time',
                  'counseling_end_time',
                  'created_at',
                  'modified_at'
                ];

                const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/; // e.g. 2025-12-04T11:45
                const isoLikeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/; // e.g. 2025-12-04T11:45:00.000Z

                const pad = (n: number) => n.toString().padStart(2, '0');

                dateTimeFields.forEach(field => {
                  const raw = vals[field as keyof GCRecord];
                  if (!raw || typeof raw !== 'string') return;

                  const dateValue = raw as string;

                  // Exact datetime-local (no seconds) -> append seconds
                  if (datetimeLocalRegex.test(dateValue)) {
                    (vals as any)[field] = dateValue.replace('T', ' ') + ':00';
                    return;
                  }

                  // ISO-like timestamps -> parse and reformat
                  if (isoLikeRegex.test(dateValue) || dateValue.includes('Z')) {
                    const parsed = Date.parse(dateValue);
                    if (!isNaN(parsed)) {
                      const d = new Date(parsed);
                      const converted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                      (vals as any)[field] = converted;
                      return;
                    }
                    // if parsing fails, set null to avoid sending malformed strings to server
                    (vals as any)[field] = null;
                    return;
                  }

                  // Otherwise assume it's already in DB-friendly 'YYYY-MM-DD HH:MM:SS' format and leave it
                });

                // Convert empty strings to null for numeric fields (age cannot be empty string)
                const numericFields = ['age'];
                numericFields.forEach(field => {
                  if (vals[field as keyof GCRecord] === '' || vals[field as keyof GCRecord] === undefined) {
                    (vals as any)[field] = null;
                  } else if (typeof vals[field as keyof GCRecord] === 'string') {
                    // Convert string to number if it's a valid numeric field
                    const numValue = parseInt(vals[field as keyof GCRecord] as string, 10);
                    (vals as any)[field] = isNaN(numValue) ? null : numValue;
                  }
                });

                console.log('[GC Form] Submitting form data:', vals);
                onSave(vals as GCRecord);
              },
              (errors) => {
                console.error('[GC Form] Validation errors:', errors);
                Object.keys(errors).forEach(field => {
                  const error = errors[field as keyof typeof errors];
                  if (error) {
                    toast({ title: 'Validation Error', description: `${field}: ${error.message}`, variant: 'destructive' });
                  }
                });
              }
            )}
            className="grid grid-cols-1 gap-4 p-2"
          >
            {/* Hidden ID field for updates */}
            {editing && <Input type="hidden" {...form.register('id')} />}

            {/* Unique ID and Project ID fields */}
            <div>
              <Label>Unique ID</Label>
              <Input {...form.register('unique_id', { required: 'Unique ID is required' })} placeholder="e.g., GC_001" disabled={!!editing} />
            </div>

            <div>
              <Label>Project ID</Label>
              <Input {...form.register('project_id')} placeholder="e.g., PG251202001" disabled={!!editing} />
            </div>

            <div>
              <Label>Counselling date</Label>
              <Input {...form.register('counselling_date')} type="datetime-local" />
            </div>

            <div>
              <Label>GC registration start time</Label>
              <Input type="datetime-local" {...form.register('gc_registration_start_time')} />
            </div>

            <div>
              <Label>GC registration end time</Label>
              <Input type="datetime-local" {...form.register('gc_registration_end_time')} />
            </div>

            <div>
              <Label>Patient/Client name</Label>
              <Input {...form.register('patient_client_name')} disabled={!!editing} />
            </div>

            <div>
              <Label>Age</Label>
              <Input type="number" {...form.register('age')} disabled={!!editing} />
            </div>

            <div>
              <Label>Gender</Label>
              <Select value={form.watch('gender') || ''} onValueChange={(v) => form.setValue('gender', v)} disabled={!!editing}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Patient/Client email</Label>
              <Input {...form.register('patient_client_email')} />
            </div>

            <div>
              <Label>Patient/Client phone</Label>
              <PhoneInput
                international
                countryCallingCodeEditable={false}
                defaultCountry="IN"
                value={form.watch('patient_client_phone') || ''}
                onChange={(value) => form.setValue('patient_client_phone', value || '')}
                placeholder="Enter phone number"
                disabled={!!editing}
              />
            </div>

            <div>
              <Label>Patient/Client address</Label>
              <Input {...form.register('patient_client_address')} disabled={!!editing} />
            </div>

            <div>
              <Label>Payment status</Label>
              <Select value={String(form.getValues('payment_status') || '')} onValueChange={(v) => form.setValue('payment_status', v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Payment status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partial Paid">Partial Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mode of payment</Label>
              <Input {...form.register('mode_of_payment')} placeholder="Card / UPI / Cash" />
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="approval_from_head"
                checked={!!form.watch('approval_from_head')}
                onCheckedChange={(checked) => form.setValue('approval_from_head', checked as boolean)}
              />
              <Label htmlFor="approval_from_head">Approval from head</Label>
            </div>

            <div>
              <Label>Clinician/Researcher name</Label>
              <Input {...form.register('clinician_researcher_name')} disabled={!!editing} />
            </div>

            <div>
              <Label>Organisation/Hospital</Label>
              <Input {...form.register('organisation_hospital')} disabled={!!editing} />
            </div>

            <div>
              <Label>Speciality</Label>
              <Input {...form.register('speciality')} disabled={!!editing} />
            </div>

            <div>
              <Label>Query/Suspection</Label>
              <Textarea {...form.register('query_suspection')} />
            </div>

            <div>
              <Label>GC name</Label>
              <Input {...form.register('gc_name')} placeholder="Counsellor name" />
            </div>

            <div>
              <Label>GC other members</Label>
              <Input {...form.register('gc_other_members')} placeholder="Other members" />
            </div>

            <div>
              <Label>Service name</Label>
              <Input {...form.register('service_name')} disabled={!!editing} />
            </div>

            <div>
              <Label>Counselling type</Label>
              <Select value={String(form.getValues('counseling_type') || '')} onValueChange={(v) => form.setValue('counseling_type', v)}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pre-test">Pre-test</SelectItem>
                  <SelectItem value="Post-test">Post-test</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Counselling start time</Label>
              <Input type="datetime-local" {...form.register('counseling_start_time')} />
            </div>

            <div>
              <Label>Counselling end time</Label>
              <Input type="datetime-local" {...form.register('counseling_end_time')} />
            </div>

            <div>
              <Label>Budget for Test opted</Label>
              <Input {...form.register('budget_for_test_opted')} />
            </div>

            <div>
              <Label>Testing status</Label>
              <Select value={String(form.getValues('testing_status') || '')} onValueChange={(v) => form.setValue('testing_status', v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Testing status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not started">Not started</SelectItem>
                  <SelectItem value="In progress">In progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Action required</Label>
              <Textarea {...form.register('action_required')} />
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="potential_patient"
                checked={!!form.watch('potential_patient_for_testing_in_future')}
                onCheckedChange={(checked) => form.setValue('potential_patient_for_testing_in_future', checked as boolean)}
              />
              <Label htmlFor="potential_patient">Potential Patient for testing in future</Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="extended_family"
                checked={!!form.watch('extended_family_testing_requirement')}
                onCheckedChange={(checked) => form.setValue('extended_family_testing_requirement', checked as boolean)}
              />
              <Label htmlFor="extended_family">Extended family testing requirement</Label>
            </div>

            <div>
              <Label>Budget</Label>
              <Input {...form.register('budget')} disabled={!!editing} />
            </div>

            <div>
              <Label>Sample Type</Label>
              <Input {...form.register('sample_type')} disabled={!!editing} />
            </div>

            <div>
              <Label>GC summary sheet</Label>
              <Input {...form.register('gc_summary_sheet')} />
            </div>

            <div>
              <Label>GC video link</Label>
              <Textarea {...form.register('gc_video_link')} />
            </div>

            <div>
              <Label>GC audio link</Label>
              <Textarea {...form.register('gc_audio_link')} />
            </div>

            <div>
              <Label>Sales/Responsible person</Label>
              <Input {...form.register('sales_responsible_person')} disabled={!!editing} />
            </div>

            <div>
              <Label>Created at</Label>
              <Input {...form.register('created_at')} type="datetime-local" disabled />
            </div>

            <div>
              <Label>Created by</Label>
              <Input {...form.register('created_by')} disabled />
            </div>

            <div>
              <Label>Modified at</Label>
              <Input {...form.register('modified_at')} type="datetime-local" disabled />
            </div>

            <div>
              <Label>Modified by</Label>
              <Input {...form.register('modified_by')} disabled />
            </div>

            <div>
              <Label>Remark/Comment</Label>
              <Textarea {...form.register('remark_comment')} placeholder="Any additional notes or remarks..." />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsOpen(false); setEditing(null); form.reset({ approval_from_head: false, potential_patient_for_testing_in_future: false, extended_family_testing_requirement: false } as any); }}>
                Cancel
              </Button>
              <Button type="submit">{editing ? 'Save Changes' : 'Add GC'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}