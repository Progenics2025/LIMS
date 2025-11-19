import { useState, useEffect } from 'react';
import { useRecycle } from '@/contexts/RecycleContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
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

type GCRecord = {
  id: string;
  sample_id: string;
  gc_name: string;
  counselling_type: string;
  counselling_start_time?: string;
  counselling_end_time?: string;
  gc_summary?: string;
  extended_family_testing?: boolean;
  approval_status?: string;
  // Additional optional frontend-only / backend-mapped fields
  created_at?: string;
  registration_start_time?: string;
  registration_end_time?: string;
  client_name?: string;
  client_contact?: string;
  client_email?: string;
  age?: number;
  sex?: string;
  payment_status?: string;
  mode_of_payment?: string;
  approval_from_head?: string;
  referral_doctor?: string;
  organisation?: string;
  speciality?: string;
  query?: string;
  gc_other_members?: string;
  service_name?: string;
  budget_for_test_opted?: string;
  testing_status?: string;
  action_required?: string;
  potential_patient_future?: boolean;
  budget?: string;
  sample_type?: string;
  created_by?: string;
  gc_summary_sheet?: string;
  gcf_video_links?: string;
  modified?: string;
  assigned_sales_person?: string;
};

const initialData: GCRecord[] = [
  {
    id: 'GC-001',
    sample_id: 'SAMP-1001',
      created_at: '2025-09-15T09:45',
    gc_name: 'Dr. Meera Rao',
      client_name: 'Mr. Ajay Kumar',
      client_contact: '+91-9876543210',
      client_email: 'ajay.k@example.com',
      age: 34,
      sex: 'Male',
      payment_status: 'Paid',
      mode_of_payment: 'Card',
      referral_doctor: 'Dr. S. Nair',
      organisation: 'City Hospital',
      service_name: 'WES',
    counselling_type: 'Pre-test',
    counselling_start_time: '2025-09-15T10:00',
    counselling_end_time: '2025-09-15T10:45',
    gc_summary: 'Discussed family history and consent.',
    extended_family_testing: false,
    approval_status: 'pending',
  },
  {
    id: 'GC-002',
    sample_id: 'SAMP-1002',
      created_at: '2025-09-17T13:40',
    gc_name: 'Dr. Arun Patel',
      client_name: 'Ms. Rekha Singh',
      client_contact: '+91-9123456789',
      client_email: 'rekha.s@example.com',
      age: 29,
      sex: 'Female',
      payment_status: 'Pending',
      mode_of_payment: 'UPI',
      referral_doctor: 'Dr. K. Verma',
      organisation: 'Genome Clinic',
      service_name: 'CMA',
    counselling_type: 'Post-test',
    counselling_start_time: '2025-09-17T14:00',
    counselling_end_time: '2025-09-17T14:30',
    gc_summary: 'Explained results and next steps.',
    extended_family_testing: true,
    approval_status: 'approved',
  },
  {
    id: 'GC-003',
    sample_id: 'SAMP-1003',
      created_at: '2025-09-18T10:40',
    gc_name: 'Dr. Priya Sharma',
      client_name: 'Mr. Ramesh Iyer',
      client_contact: '+91-9988776655',
      client_email: 'r.iyer@example.com',
      age: 45,
      sex: 'Male',
      payment_status: 'Paid',
      mode_of_payment: 'Cash',
      referral_doctor: 'Dr. L. Menon',
      organisation: 'Sunrise Labs',
      service_name: 'WES',
    counselling_type: 'Pre-test',
    counselling_start_time: '2025-09-18T11:00',
    counselling_end_time: '2025-09-18T11:50',
    gc_summary: 'Genetic risk assessment completed.',
    extended_family_testing: false,
    approval_status: 'pending',
  },
  {
    id: 'GC-004',
    sample_id: 'SAMP-1004',
      created_at: '2025-09-19T14:40',
    gc_name: 'Dr. Rajesh Kumar',
      client_name: 'Ms. Anjali Rao',
      client_contact: '+91-9012345678',
      client_email: 'anjali.rao@example.com',
      age: 38,
      sex: 'Female',
      payment_status: 'Paid',
      mode_of_payment: 'Card',
      referral_doctor: 'Dr. P. Singh',
      organisation: 'Health Plus',
      service_name: 'NBS',
    counselling_type: 'Follow-up',
    counselling_start_time: '2025-09-19T15:00',
    counselling_end_time: '2025-09-19T15:40',
    gc_summary: 'Follow-up on previous test results.',
    extended_family_testing: true,
    approval_status: 'approved',
  },
  {
    id: 'GC-005',
    sample_id: 'SAMP-1005',
      created_at: '2025-09-20T09:00',
    gc_name: 'Dr. Meera Rao',
      client_name: 'Mr. Suresh Patel',
      client_contact: '+91-9234567890',
      client_email: 'suresh.p@example.com',
      age: 52,
      sex: 'Male',
      payment_status: 'Rejected',
      mode_of_payment: 'NA',
      referral_doctor: 'Dr. R. Karthik',
      organisation: 'City Hospital',
      service_name: 'WES',
    counselling_type: 'Post-test',
    counselling_start_time: '2025-09-20T09:30',
    counselling_end_time: '2025-09-20T10:15',
    gc_summary: 'Results interpretation and management plan.',
    extended_family_testing: false,
    approval_status: 'rejected',
  },
];

export default function GeneticCounselling() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: serverRows = null } = useQuery<GCRecord[]>({ queryKey: ['/api/gc-registration'], queryFn: async () => {
    const r = await fetch('/api/gc-registration');
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  }, staleTime: 1000 * 60 * 5, retry: 1 });

  // Keep local rows in sync with server query results when available.
  const [rows, setRows] = useState<GCRecord[]>(serverRows ?? initialData);

  // Normalizer: map server row (camelCase or snake_case) to client GCRecord shape (snake_case)
  const normalizeServerRow = (r: any): GCRecord => ({
    id: r.id,
    sample_id: r.sampleId ?? r.sample_id ?? '',
    gc_name: r.gcName ?? r.gc_name ?? '',
    counselling_type: r.counsellingType ?? r.counselling_type ?? '',
    counselling_start_time: r.counsellingStartTime ?? r.counselling_start_time ?? undefined,
    counselling_end_time: r.counsellingEndTime ?? r.counselling_end_time ?? undefined,
    gc_summary: r.gcSummary ?? r.gc_summary ?? undefined,
    extended_family_testing: (r.extendedFamilyTesting ?? r.extended_family_testing) ?? false,
    approval_status: r.approvalStatus ?? r.approval_status ?? 'pending',
    // map additional optional fields from server (try camelCase and snake_case)
    created_at: r.createdAt ?? r.created_at ?? r.created ?? undefined,
    registration_start_time: r.registrationStartTime ?? r.registration_start_time ?? undefined,
    registration_end_time: r.registrationEndTime ?? r.registration_end_time ?? undefined,
    // client / patient name + contact fallbacks (many possible server keys)
    client_name: r.clientName ?? r.client_name ?? r.client_name_display ?? r.patientName ?? r.patient_name ?? r.patient_client_name ?? r.patient_client_name_display ?? r.name ?? r.patient ?? undefined,
    client_contact: r.clientContact ?? r.client_contact ?? r.client_phone ?? r.patientContact ?? r.patient_contact ?? r.patient_phone ?? r.patient_client_phone ?? undefined,
    client_email: r.clientEmail ?? r.client_email ?? r.patientEmail ?? r.patient_email ?? r.patient_client_email ?? undefined,
    age: r.age ?? undefined,
    sex: r.sex ?? r.gender ?? undefined,
    payment_status: r.paymentStatus ?? r.payment_status ?? undefined,
    mode_of_payment: r.modeOfPayment ?? r.mode_of_payment ?? undefined,
    approval_from_head: r.approvalFromHead ?? r.approval_from_head ?? undefined,
    referral_doctor: r.referralDoctor ?? r.referral_doctor ?? undefined,
    organisation: r.organisation ?? r.organization ?? r.organisation_name ?? undefined,
    speciality: r.speciality ?? r.specialty ?? undefined,
    query: r.query ?? undefined,
    gc_other_members: r.gcOtherMembers ?? r.gc_other_members ?? undefined,
    service_name: r.serviceName ?? r.service_name ?? undefined,
    budget_for_test_opted: r.budgetForTestOpted ?? r.budget_for_test_opted ?? undefined,
    testing_status: r.testingStatus ?? r.testing_status ?? undefined,
    action_required: r.actionRequired ?? r.action_required ?? undefined,
    potential_patient_future: (r.potentialPatientFuture ?? r.potential_patient_future) ?? false,
    budget: r.budget ?? undefined,
    sample_type: r.sampleType ?? r.sample_type ?? undefined,
    created_by: r.createdBy ?? r.created_by ?? undefined,
    gc_summary_sheet: r.gcSummarySheet ?? r.gc_summary_sheet ?? undefined,
    gcf_video_links: r.gcfVideoLinks ?? r.gcf_video_links ?? undefined,
    modified: r.updatedAt ?? r.updated_at ?? r.modified ?? undefined,
    assigned_sales_person: r.assignedSalesPerson ?? r.assigned_sales_person ?? undefined,
  });

  // When serverRows is available (DB reachable), replace local rows so the UI reflects DB state.
  useEffect(() => {
    if (serverRows && Array.isArray(serverRows)) {
      try {
        const normalized = serverRows.map(normalizeServerRow);
        // debug: show incoming and normalized shape when developing
        // eslint-disable-next-line no-console
        console.debug('GC serverRows sample:', serverRows[0]);
        // eslint-disable-next-line no-console
        console.debug('GC normalized sample:', normalized[0]);
        setRows(normalized);
        setPage(1);
      } catch (e) {
        // fallback: just set raw serverRows
        setRows(serverRows as any);
        setPage(1);
      }
    }
  }, [serverRows]);

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<GCRecord | null>(null);
  const { add } = useRecycle();
  
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [counsellingTypeFilter, setCounsellingTypeFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  // Sorting state (per-column ascending/descending)
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const form = useForm<GCRecord>({ defaultValues: {} as any });

  // Filter records based on search and filters
  const filteredRows = rows.filter((record) => {
    // Apply status filter
    if (statusFilter !== 'all' && record.approval_status !== statusFilter) {
      return false;
    }
    
    // Apply counselling type filter
    if (counsellingTypeFilter !== 'all' && record.counselling_type !== counsellingTypeFilter) {
      return false;
    }
    
    // Apply search query
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      record.id.toLowerCase().includes(query) ||
      record.sample_id.toLowerCase().includes(query) ||
      record.gc_name.toLowerCase().includes(query) ||
      (record.gc_summary || '').toLowerCase().includes(query)
    );
  });

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
          name: `${item.id || item.sample_id || id} - ${item.client_name || 'No Name'}`,
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
        const res = await fetch(`/api/gc-registration/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        queryClient.invalidateQueries({ queryKey: ['/api/gc-registration'] });
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
    (async () => {
      try {
        if (editing) {
          const res = await fetch(`/api/gc-registration/${data.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          if (!res.ok) throw new Error('Update failed');
          const updated = await res.json();
          queryClient.invalidateQueries({ queryKey: ['/api/gc-registration'] });
          const normalized = normalizeServerRow(updated);
          setRows((s) => s.map((r) => (r.id === normalized.id ? normalized : r)));
          toast({ title: 'Updated', description: 'Record updated' });
        } else {
          const res = await fetch('/api/gc-registration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          if (!res.ok) throw new Error('Create failed');
          const created = await res.json();
          queryClient.invalidateQueries({ queryKey: ['/api/gc-registration'] });
          const normalized = normalizeServerRow(created);
          setRows((s) => [normalized, ...s]);
          toast({ title: 'Created', description: 'Record created' });
        }
      } catch (e) {
        // fallback to local update
        setRows((s) => s.map((r) => (r.id === data.id ? data : r)));
        if (!editing) setRows((s) => [data, ...s]);
  toast({ title: 'Saved locally', description: 'Server operation failed; changes kept locally' });
      } finally {
        setIsOpen(false);
        setEditing(null);
        setPage(1);
      }
    })();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
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
          <Button onClick={() => { setEditing(null); form.reset({} as any); setIsOpen(true); }}>
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
          <div className="text-2xl font-extrabold">{rows.filter((r) => r.approval_status === 'pending').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Pending Approval</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-blue-50 flex items-center justify-center mb-3">
            <Check className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold">{rows.filter((r) => r.approval_status === 'approved').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Approved</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Genetic Counselling Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search and Filter Controls */}
          <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b">
            <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by ID, sample, GC name..."
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
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={counsellingTypeFilter} 
                  onValueChange={(value) => {
                    setCounsellingTypeFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Pre-test">Pre-test</SelectItem>
                    <SelectItem value="Post-test">Post-test</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
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

          <div className="border rounded-lg max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b-2">
                <TableRow>
                  <TableHead onClick={() => { setSortKey('id'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Unique ID{sortKey === 'id' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('created_at'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Date{sortKey === 'created_at' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('registration_start_time'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Gc registration start time{sortKey === 'registration_start_time' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('registration_end_time'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Gc registration end time{sortKey === 'registration_end_time' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('client_name'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Patient / Client Name{sortKey === 'client_name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('client_contact'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Contact{sortKey === 'client_contact' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('client_email'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Email ID{sortKey === 'client_email' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('age'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Age{sortKey === 'age' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('sex'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Gender{sortKey === 'sex' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('payment_status'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Payment status{sortKey === 'payment_status' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('mode_of_payment'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Mode of Payment{sortKey === 'mode_of_payment' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('approval_status'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Approval{sortKey === 'approval_status' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('referral_doctor'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Referral Doctor{sortKey === 'referral_doctor' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('organisation'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Organisation / Hospital{sortKey === 'organisation' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('speciality'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Speciality{sortKey === 'speciality' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('query'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Suspection{sortKey === 'query' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('gc_name'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">GC name{sortKey === 'gc_name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('gc_other_members'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Other Gc names{sortKey === 'gc_other_members' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('service_name'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Service name{sortKey === 'service_name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('counselling_type'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Counselling type{sortKey === 'counselling_type' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('testing_status'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Testing status{sortKey === 'testing_status' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('action_required'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Action required{sortKey === 'action_required' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('potential_patient_future'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Potential Patient for testing in future{sortKey === 'potential_patient_future' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('extended_family_testing'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Extended family testing requirement{sortKey === 'extended_family_testing' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('created_by'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Created by{sortKey === 'created_by' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('gcf_video_links'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Gc Video links{sortKey === 'gcf_video_links' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead onClick={() => { setSortKey('gc_summary'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer whitespace-nowrap font-semibold">Gc summary{sortKey === 'gc_summary' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>
                  <TableHead className="sticky right-0 bg-white dark:bg-gray-900 border-l-2 whitespace-nowrap font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={40} className="text-center py-8 text-muted-foreground">
                      {filteredRows.length === 0 ? "No genetic counselling records found" : "No records match your search criteria"}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.id}</TableCell>
                      <TableCell className="text-sm">
                        {r.created_at ? (
                          <span title={new Date(r.created_at).toISOString()}>
                            {new Date(r.created_at).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              timeZoneName: 'short'
                            })}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.registration_start_time ? (
                          <span title={new Date(r.registration_start_time).toISOString()}>
                            {new Date(r.registration_start_time).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              timeZoneName: 'short'
                            })}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.registration_end_time ? (
                          <span title={new Date(r.registration_end_time).toISOString()}>
                            {new Date(r.registration_end_time).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              timeZoneName: 'short'
                            })}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{r.client_name ?? '-'}</TableCell>
                      <TableCell>{r.client_contact ?? '-'}</TableCell>
                      <TableCell>{r.client_email ?? '-'}</TableCell>
                      <TableCell>{r.age != null ? String(r.age) : '-'}</TableCell>
                      <TableCell>{r.sex ?? '-'}</TableCell>
                      <TableCell>{r.payment_status ?? '-'}</TableCell>
                      <TableCell>{r.mode_of_payment ?? '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(r.approval_status || 'pending')}`}>
                          {r.approval_status || 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell>{r.referral_doctor ?? '-'}</TableCell>
                      <TableCell>{r.organisation ?? '-'}</TableCell>
                      <TableCell>{r.speciality ?? '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{r.query ?? '-'}</TableCell>
                      <TableCell>{r.gc_name ?? '-'}</TableCell>
                      <TableCell>{r.gc_other_members ?? '-'}</TableCell>
                      <TableCell>{r.service_name ?? '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCounsellingTypeBadgeColor(r.counselling_type)}`}>
                          {r.counselling_type}
                        </span>
                      </TableCell>
                      <TableCell>{r.testing_status ?? '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{r.action_required ?? '-'}</TableCell>
                      <TableCell>{r.potential_patient_future ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          r.extended_family_testing 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}>
                          {r.extended_family_testing ? 'Yes' : 'No'}
                        </span>
                      </TableCell>
                      <TableCell>{r.created_by ?? '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{r.gcf_video_links ?? '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{r.gc_summary ?? '-'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost" aria-label="Edit GC" onClick={() => openEdit(r)}>
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" aria-label="Delete GC" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {visibleRows.length > 0 && (
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
                <div>Page {page} / {totalPages}</div>
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
            <DialogTitle>{editing ? 'Edit Genetic Counselling' : 'Add New GC'}</DialogTitle>
            <DialogDescription>{editing ? 'Edit counselling details for the selected sample.' : 'Create a new genetic counselling record.'}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((vals) => {
              // ensure boolean flags are consistent
              vals.extended_family_testing = !!vals.extended_family_testing;
              vals.potential_patient_future = !!vals.potential_patient_future;
              onSave(vals as GCRecord);
            })}
            className="grid grid-cols-1 gap-4 p-2"
          >
            {/* Canonical GC fields (in the same order as the table) */}
            <div>
              <Label>Unique ID</Label>
              <Input {...form.register('id')} placeholder="e.g. GC-001" readOnly={!!editing} />
            </div>

            <div>
              <Label>Date</Label>
              <Input {...form.register('created_at')} type="datetime-local" readOnly />
            </div>

            <div>
              <Label>GC registration start time</Label>
              <Input type="datetime-local" {...form.register('registration_start_time')} />
            </div>

            <div>
              <Label>GC registration end time</Label>
              <Input type="datetime-local" {...form.register('registration_end_time')} />
            </div>

            <div>
              <Label>Name</Label>
              <Input {...form.register('client_name')} />
            </div>

            <div>
              <Label>Contact</Label>
              <Input {...form.register('client_contact')} />
            </div>

            <div>
              <Label>Email ID</Label>
              <Input {...form.register('client_email')} />
            </div>

            <div>
              <Label>Age</Label>
              <Input type="number" {...form.register('age')} />
            </div>

            <div>
              <Label>Gender</Label>
              <Select value={form.watch('sex') || ''} onValueChange={(v) => form.setValue('sex', v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
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
              <Label>Mode of Payment</Label>
              <Input {...form.register('mode_of_payment')} placeholder="Card / UPI / Cash" />
            </div>

            <div>
              <Label>Approval</Label>
              <Select value={String(form.getValues('approval_status') || '')} onValueChange={(v) => form.setValue('approval_status', v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Approval" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Referral Doctor</Label>
              <Input {...form.register('referral_doctor')} />
            </div>

            <div>
              <Label>Organisation</Label>
              <Input {...form.register('organisation')} />
            </div>

            <div>
              <Label>Speciality</Label>
              <Input {...form.register('speciality')} />
            </div>

            <div>
              <Label>Suspection</Label>
              <Textarea {...form.register('query')} />
            </div>

            <div>
              <Label>GC name</Label>
              <Input {...form.register('gc_name')} placeholder="Counsellor name" />
            </div>

            <div>
              <Label>Other GC names</Label>
              <Input {...form.register('gc_other_members')} placeholder="Other members" />
            </div>

            <div>
              <Label>Service name</Label>
              <Input {...form.register('service_name')} />
            </div>

            <div>
              <Label>Counselling type</Label>
              <Select value={String(form.getValues('counselling_type') || '')} onValueChange={(v) => form.setValue('counselling_type', v)}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Online">Pre-test</SelectItem>
                  <SelectItem value="Offline">Post-test</SelectItem>
                </SelectContent>
              </Select>
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
              <Checkbox id="potential_patient" {...form.register('potential_patient_future')} />
              <Label htmlFor="potential_patient">Potential Patient for testing in future</Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox id="extended_family" {...form.register('extended_family_testing')} />
              <Label htmlFor="extended_family">Extended family testing requirement</Label>
            </div>

            <div>
              <Label>Created by</Label>
              <Input {...form.register('created_by')} />
            </div>

            <div>
              <Label>GC Video links</Label>
              <Textarea {...form.register('gcf_video_links')} />
            </div>

            <div>
              <Label>GC summary</Label>
              <Textarea {...form.register('gc_summary')} placeholder="Short summary of counselling session" />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsOpen(false); setEditing(null); form.reset({} as any); }}>
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