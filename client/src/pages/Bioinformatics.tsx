import { useState, useEffect } from 'react';
import { useRecycle } from '@/contexts/RecycleContext';
import { Activity, Cpu, CheckCircle, Search, Edit as EditIcon, Trash2, Clock } from 'lucide-react';
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

type BIRecord = {
  id: string;
  sample_id: string;
  projectId?: string;
  sequencing_date?: string;
  analysis_status?: string;
  total_mb_generated?: number;
  result_report_link?: string;
  progenics_trf?: string;
  progenics_raw_data?: string;
  third_party_name?: string;
  third_party_result_date?: string;
  alert_to_technical?: boolean;
  alert_from_lab_team?: boolean;
  alert_from_finance?: boolean;
  report_related_status?: string;
  created_at?: string;
  updated_at?: string;
  serviceName?: string;
  clinicianName?: string;
  organizationName?: string;
  patientName?: string;
  age?: string;
  gender?: string;
  third_party_report?: string;
  tat?: string;
  raw_data_received_date?: string;
  vcf_link?: string;
  cnv?: string;
  remark?: string;
};

const initialBI: BIRecord[] = [
  { id: 'BI-001', sample_id: 'SAMP-1001', sequencing_date: '2025-09-20', analysis_status: 'completed', total_mb_generated: 1200, result_report_link: 'https://example.com/report/BI-001', progenics_trf: 'trf-1', progenics_raw_data: 'raw-1', third_party_name: 'ThirdLab A', third_party_result_date: '2025-09-25', alert_to_technical: true, alert_from_lab_team: false, alert_from_finance: false, report_related_status: 'ready' },
  { id: 'BI-002', sample_id: 'SAMP-1002', sequencing_date: '2025-09-22', analysis_status: 'running', total_mb_generated: 600, result_report_link: '', progenics_trf: '', progenics_raw_data: '', third_party_name: '', third_party_result_date: '', alert_to_technical: false, alert_from_lab_team: false, alert_from_finance: false, report_related_status: 'processing' },
  { id: 'BI-003', sample_id: 'SAMP-1003', sequencing_date: '2025-09-18', analysis_status: 'completed', total_mb_generated: 1800, result_report_link: 'https://example.com/report/BI-003', progenics_trf: 'trf-3', progenics_raw_data: 'raw-3', third_party_name: 'Genomics Corp', third_party_result_date: '2025-09-23', alert_to_technical: false, alert_from_lab_team: true, alert_from_finance: true, report_related_status: 'delivered' },
  { id: 'BI-004', sample_id: 'SAMP-1004', sequencing_date: '2025-09-24', analysis_status: 'pending', total_mb_generated: 0, result_report_link: '', progenics_trf: '', progenics_raw_data: '', third_party_name: '', third_party_result_date: '', alert_to_technical: false, alert_from_lab_team: false, alert_from_finance: false, report_related_status: 'processing' },
  { id: 'BI-005', sample_id: 'SAMP-1005', sequencing_date: '2025-09-21', analysis_status: 'failed', total_mb_generated: 400, result_report_link: '', progenics_trf: 'trf-5', progenics_raw_data: 'raw-5', third_party_name: 'BioTech Labs', third_party_result_date: '', alert_to_technical: true, alert_from_lab_team: true, alert_from_finance: false, report_related_status: 'processing' },
  { id: 'BI-006', sample_id: 'SAMP-1006', sequencing_date: '2025-09-19', analysis_status: 'completed', total_mb_generated: 1500, result_report_link: 'https://example.com/report/BI-006', progenics_trf: 'trf-6', progenics_raw_data: 'raw-6', third_party_name: 'ThirdLab A', third_party_result_date: '2025-09-24', alert_to_technical: false, alert_from_lab_team: false, alert_from_finance: false, report_related_status: 'ready' },
];

export default function Bioinformatics() {
  const [rows, setRows] = useState<BIRecord[]>(initialBI);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<BIRecord | null>(null);
  const { add } = useRecycle();
  
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

  // Filter records based on search and filters
  const filteredRows = rows.filter((record) => {
    // Apply analysis status filter
    if (statusFilter !== 'all' && record.analysis_status !== statusFilter) {
      return false;
    }
    
    // Apply report status filter
    if (reportStatusFilter !== 'all' && record.report_related_status !== reportStatusFilter) {
      return false;
    }
    
    // Apply search query
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      record.id.toLowerCase().includes(query) ||
      record.sample_id.toLowerCase().includes(query) ||
      (record.third_party_name || '').toLowerCase().includes(query) ||
      (record.progenics_trf || '').toLowerCase().includes(query)
    );
  });

  // Apply BI type filter (if set)
  const typeFilteredRows = filteredRows.filter((record) => {
    if (!biTypeFilter || biTypeFilter === 'all') return true;
    // attempt to find category on nested raw/sample/lead objects if present
    const raw: any = (record as any)._raw || (record as any).sample || (record as any);
    const category = raw?.sample?.lead?.category || raw?.lead?.category || raw?.category || raw?.type || 'clinical';
    return String(category).toLowerCase() === biTypeFilter;
  });

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
        add({ entityType: 'bioinformatics', entityId: id, name: item.id ?? item.sample_id ?? id, originalPath: '/bioinformatics', data: item });
      }
    } catch (err) {
      // ignore recycle failures
    }

    // Try server-side delete if endpoint exists, otherwise fall back to local state
    try {
      const res = await fetch(`/api/bioinformatics/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
  
  const onSave = async (data: BIRecord) => { 
    // Try to save on server first; if it fails, update locally
    try {
      const res = await fetch(`/api/bioinformatics/${encodeURIComponent(data.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setRows((s) => s.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
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

  // On mount, try to load bioinformatics records from server if available
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try discovery and clinical bioinfo sheets first
        const [dRes, cRes] = await Promise.allSettled([
          fetch('/api/bioinfo/discovery'),
          fetch('/api/bioinfo/clinical'),
        ]);

        const rows: BIRecord[] = [];

        if (dRes.status === 'fulfilled' && dRes.value.ok) {
          try { const p = await dRes.value.json(); if (Array.isArray(p)) rows.push(...p); } catch (e) { /* ignore parse */ }
        }
        if (cRes.status === 'fulfilled' && cRes.value.ok) {
          try { const p = await cRes.value.json(); if (Array.isArray(p)) rows.push(...p); } catch (e) { /* ignore parse */ }
        }

        // If nothing returned, try legacy /api/bioinformatics as a fallback
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

        if (!cancelled && rows.length > 0) setRows(rows);
      } catch (err) {
        // ignore - keep local demo data
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
          <div className="text-2xl font-extrabold">{rows.length}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Analyses</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-orange-50 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-extrabold">{rows.filter((r) => r.analysis_status === 'pending').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Pending</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-amber-50 flex items-center justify-center mb-3">
            <Cpu className="w-6 h-6 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold">{rows.filter((r) => r.analysis_status === 'running').length}</div>
          <div className="text-sm text-muted-foreground mt-1">Running</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-md bg-sky-50 flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold">{rows.filter((r) => r.analysis_status === 'completed').length}</div>
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
                  placeholder="Search by ID, sample, third party..."
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
                {biTypeFilter === 'clinical' ? (
                  <TableRow>
                    <TableHead className="whitespace-nowrap font-semibold">Unique ID</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Sample ID</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Project ID</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Service Name</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Clinician / Researcher Name</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Organization / Hospital Name</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Patient / Client Name</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Age</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Gender</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Third party Name</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Third party Report</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">TAT</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Raw data Received from third party Date</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">VCF File link</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">CNV</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Created At</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Updated At</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Remark/Comment</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Actions</TableHead>
                  </TableRow>
                ) : biTypeFilter === 'discovery' ? (
                  <TableRow>
                    <TableHead className="whitespace-nowrap font-semibold">Unique ID</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Sample ID</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Project ID</TableHead>
                    <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Clinician / Researcher Name</TableHead>
                    <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Clinician / Researcher Address</TableHead>
                    <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Name</TableHead>
                    <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Address</TableHead>
                    <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Email</TableHead>
                    <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Patient / Client Phone</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold min-w-[200px]">Age</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold min-w-[120px]">Gender</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Service Name</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Sequencing</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Date of Sequencing</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Base Calling</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Epi2me workflow</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Analysis</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Third party name</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Samples sent Third party Date</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Third party TRF</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Results received from Third  Date</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Progenics TRF</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Progenics Raw data</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Data size</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Fastq link</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">HTML link</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Relative abundance sheet</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Data analysis sheet</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Database  Info</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Progenics Reports</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Results /report Released Date</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Alert from Lab process</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Alert from finance team</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Report Released status</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Report Reminder Date</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">TAT (Days)</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Created At</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Updated At</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Remark/Comment</TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">Actions</TableHead>
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
                    <TableCell colSpan={16} className="text-center py-8 text-muted-foreground">
                      Select "Clinical" or "Discovery" to view the corresponding table
                    </TableCell>
                  </TableRow>
                ) : visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={biTypeFilter === 'clinical' ? 16 : biTypeFilter === 'discovery' ? 28 : 16} className="text-center py-8 text-muted-foreground">
                      {typeFilteredRows.length === 0 ? "No bioinformatics records found" : "No records match your search criteria"}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((r) => {
                    if (biTypeFilter === 'clinical') {
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.id}</TableCell>
                          <TableCell>{r.sample_id}</TableCell>
                          <TableCell>{(r as any).projectId ?? (r as any)._raw?.project_id ?? '-'}</TableCell>
                          <TableCell>{(r as any).serviceName ?? (r as any).service_name ?? '-'}</TableCell>
                          <TableCell>{(r as any).clinicianName ?? (r as any).clinician_name ?? '-'}</TableCell>
                          <TableCell>{(r as any).organizationName ?? (r as any).organization_name ?? '-'}</TableCell>
                          <TableCell>{(r as any).patientName ?? (r as any).patient_name ?? '-'}</TableCell>
                          <TableCell>{(r as any).age ?? (r as any).patient_age ?? '-'}</TableCell>
                          <TableCell>{(r as any).gender ?? (r as any).patient_gender ?? '-'}</TableCell>
                          <TableCell>{r.third_party_name ?? '-'}</TableCell>
                          <TableCell>{(r as any).third_party_result_date ?? '-'}</TableCell>
                          <TableCell>{(r as any).tat ?? '-'}</TableCell>
                          <TableCell>{(r as any).raw_data_received_date ?? (r as any).progenics_raw_data_date ?? '-'}</TableCell>
                          <TableCell>{(r as any).vcf_link ?? (r as any).vcf_file_link ?? '-'}</TableCell>
                          <TableCell>{(r as any).cnv ?? '-'}</TableCell>
                          <TableCell>{(r as any).created_at ? new Date((r as any).created_at).toLocaleString() : '-'}</TableCell>
                          <TableCell>{(r as any).updated_at ? new Date((r as any).updated_at).toLocaleString() : '-'}</TableCell>
                          <TableCell>{(r as any).remark ?? (r as any).report_related_status ?? '-'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost" aria-label="Edit record" onClick={() => openEdit(r)}>
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" aria-label="Delete record" onClick={() => handleDelete(r.id)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    if (biTypeFilter === 'discovery') {
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.id}</TableCell>
                          <TableCell>{(r as any).projectId ?? (r as any)._raw?.project_id ?? '-'}</TableCell>
                          <TableCell>{(r as any).serviceName ?? (r as any).service_name ?? '-'}</TableCell>
                          <TableCell>{(r as any).sequencing ?? (r as any).analysis_status ?? '-'}</TableCell>
                          <TableCell>{r.sequencing_date ? new Date(r.sequencing_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{(r as any).base_calling ?? '-'}</TableCell>
                          <TableCell>{(r as any).epi2me_workflow ?? '-'}</TableCell>
                          <TableCell>{(r as any).analysis ?? (r as any).report_related_status ?? '-'}</TableCell>
                          <TableCell>{r.third_party_name ?? '-'}</TableCell>
                          <TableCell>{(r as any).third_party_sent_date ?? (r as any).date_samples_sent_to_third_party ?? '-'}</TableCell>
                          <TableCell>{(r as any).third_party_trf ?? (r as any)._raw?.third_party_trf ?? '-'}</TableCell>
                          <TableCell>{(r as any).third_party_result_date ?? '-'}</TableCell>
                          <TableCell>{r.progenics_trf ?? '-'}</TableCell>
                          <TableCell>{r.progenics_raw_data ?? '-'}</TableCell>
                          <TableCell>{(r as any).data_size ?? (r.total_mb_generated ? `${r.total_mb_generated.toLocaleString()} MB` : '-')}</TableCell>
                          <TableCell>{(r as any).fastq_link ?? (r as any).fastq_file_link ?? '-'}</TableCell>
                          <TableCell>{(r as any).html_link ?? (r as any).html_report_link ?? '-'}</TableCell>
                          <TableCell>{(r as any).relative_abundance_link ?? '-'}</TableCell>
                          <TableCell>{(r as any).data_analysis_sheet ?? '-'}</TableCell>
                          <TableCell>{(r as any).database ?? '-'}</TableCell>
                          <TableCell>{(r as any).progenics_report ?? '-'}</TableCell>
                          <TableCell>{(r as any).report_released_date ?? (r as any).report_date ?? '-'}</TableCell>
                          <TableCell>{r.alert_from_lab_team ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{r.alert_from_finance ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{r.report_related_status ?? '-'}</TableCell>
                          <TableCell>{(r as any).report_reminder_dates ?? '-'}</TableCell>
                          <TableCell>{(r as any).tat ?? '-'}</TableCell>
                          <TableCell>{(r as any).created_at ? new Date((r as any).created_at).toLocaleString() : '-'}</TableCell>
                          <TableCell>{(r as any).updated_at ? new Date((r as any).updated_at).toLocaleString() : '-'}</TableCell>
                          <TableCell>{(r as any).remark ?? '-'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost" aria-label="Edit record" onClick={() => openEdit(r)}>
                                <EditIcon className="h-4 w-4" />
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
            <div>
              <Label>Service Name</Label>
              <Input {...form.register('serviceName')} />
            </div>
            <div>
              <Label>Clinician / Researcher Name</Label>
              <Input {...form.register('clinicianName')} />
            </div>
            <div>
              <Label>Organization / Hospital Name</Label>
              <Input {...form.register('organizationName')} />
            </div>
            <div>
              <Label>Patient / Client Name</Label>
              <Input {...form.register('patientName')} />
            </div>
            <div>
              <Label>Age</Label>
              <Input {...form.register('age')} />
            </div>
            <div>
              <Label>Gender</Label>
              <Input {...form.register('gender')} />
            </div>
            <div>
              <Label>Third party Name</Label>
              <Input {...form.register('third_party_name')} />
            </div>
            <div>
              <Label>Third party Report</Label>
              <Input {...form.register('third_party_report')} />
            </div>
            <div>
              <Label>TAT</Label>
              <Input {...form.register('tat')} />
            </div>
            <div>
              <Label>Raw data Received from third party Date</Label>
              <Input type="date" {...form.register('raw_data_received_date')} />
            </div>
            <div>
              <Label>VCF File link</Label>
              <Input {...form.register('vcf_link')} />
            </div>
            <div>
              <Label>CNV</Label>
              <Input {...form.register('cnv')} />
            </div>
            <div>
              <Label>Created At</Label>
              <Input type="datetime-local" {...form.register('created_at')} />
            </div>
            <div>
              <Label>Updated At</Label>
              <Input type="datetime-local" {...form.register('updated_at')} />
            </div>
            <div className="md:col-span-2">
              <Label>Remark/Comment</Label>
              <Textarea {...form.register('remark')} />
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