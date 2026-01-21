import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useRecycle } from '@/contexts/RecycleContext';
import { useAuth } from "@/contexts/AuthContext";
import { Search, Edit as EditIcon, Trash2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useToast } from "@/hooks/use-toast";
import { FilterBar } from "@/components/FilterBar";
import { useColumnPreferences, ColumnConfig } from '@/hooks/useColumnPreferences';
import { ColumnSettings } from '@/components/ColumnSettings';
import { sortData } from '@/lib/utils';

type GeneticAnalystRecord = {
    id: string;
    uniqueId: string;
    projectId: string;
    sampleId: string;
    receivedDateForAnalysis?: string;
    completedAnalysis?: string;
    analyzedBy?: string;
    reviewerComments?: string;
    reportPreparationDate?: string;
    reportReviewDate?: string;
    reportReleaseDate?: string;
    remarks?: string;
    // Metadata
    createdAt?: string;
    createdBy?: string;
    modifiedAt?: string;
    modifiedBy?: string;
};

export default function GeneticAnalyst() {
    const { user } = useAuth();
    const [rows, setRows] = useState<GeneticAnalystRecord[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<GeneticAnalystRecord | null>(null);
    const { add } = useRecycle();
    const [, setLocation] = useLocation();
    const [loading, setLoading] = useState(true);

    // Search and pagination state
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
    const [dateFilterField, setDateFilterField] = useState<string>('createdAt');
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(25);

    // Sorting state
    const [sortKey, setSortKey] = useState<string | null>('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // Load data from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/genetic-analyst');
                if (response.ok) {
                    const data = await response.json();
                    setRows(Array.isArray(data) ? data : []);
                } else {
                    console.error('Failed to fetch genetic analyst records');
                    setRows([]);
                }
            } catch (error) {
                console.error('Error fetching genetic analyst records:', error);
                setRows([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Column configuration
    const columns: ColumnConfig[] = useMemo(() => [
        { id: 'uniqueId', label: 'Unique ID', canHide: false },
        { id: 'projectId', label: 'Project ID', canHide: false },
        { id: 'sampleId', label: 'Sample ID', canHide: false },
        { id: 'receivedDateForAnalysis', label: 'Received Date for Analysis', defaultVisible: true },
        { id: 'completedAnalysis', label: 'Completed Analysis', defaultVisible: true },
        { id: 'analyzedBy', label: 'Analyzed By', defaultVisible: true },
        { id: 'reviewerComments', label: 'Reviewer Comments', defaultVisible: true },
        { id: 'reportPreparationDate', label: 'Report Preparation Date', defaultVisible: true },
        { id: 'reportReviewDate', label: 'Report Review Date', defaultVisible: true },
        { id: 'reportReleaseDate', label: 'Report Release Date', defaultVisible: true },
        { id: 'remarks', label: 'Remarks', defaultVisible: true },
        { id: 'actions', label: 'Actions', canHide: false },
    ], []);

    const columnPrefs = useColumnPreferences('genetic_analyst_table', columns);
    const form = useForm<GeneticAnalystRecord>();
    const { toast } = useToast();

    // Filter records
    const filteredRows = rows.filter((record) => {
        // Search Query
        let matchesSearch = true;
        if (searchQuery) {
            const q = searchQuery.toLowerCase().trim();
            matchesSearch = Object.values(record).some(val => {
                if (val === null || val === undefined) return false;
                return String(val).toLowerCase().includes(q);
            });
        }

        // Date Range Filter
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

    // Pagination
    const totalFiltered = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    if (page > totalPages) setPage(totalPages);
    const start = (page - 1) * pageSize;

    // Sorting
    const sortedRows = useMemo(() => {
        return sortData(filteredRows, sortKey as keyof GeneticAnalystRecord | null, sortDir);
    }, [filteredRows, sortKey, sortDir]);

    const visibleRows = sortedRows.slice(start, start + pageSize);

    const openEdit = (r: GeneticAnalystRecord) => {
        setEditing(r);
        form.reset(r);
        setIsOpen(true);
    };

    const handleDelete = async (id: string) => {
        // Add to recycle bin (frontend)
        try {
            const item = rows.find(r => r.id === id);
            if (item) {
                add({ entityType: 'genetic_analyst', entityId: id, name: item.uniqueId ?? item.sampleId ?? id, originalPath: '/genetic-analyst', data: item });
            }
        } catch (err) {
            console.error("Failed to recycle", err);
        }

        // Delete from backend
        try {
            const response = await fetch(`/api/genetic-analyst/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setRows(rows.filter(r => r.id !== id));
                toast({ title: "Deleted", description: "Record has been deleted." });
            } else {
                toast({ title: "Error", description: "Failed to delete record" });
            }
        } catch (error) {
            console.error("Failed to delete record", error);
            toast({ title: "Error", description: "Failed to delete record" });
        }
    };

    const onSave = async (formData: GeneticAnalystRecord) => {
        try {
            if (!editing?.id) {
                toast({ title: "Error", description: "No record ID found" });
                return;
            }

            // Prepare data for backend (map camelCase to snake_case)
            const apiPayload = {
                receivedDateForAnalysis: formData.receivedDateForAnalysis || null,
                completedAnalysis: formData.completedAnalysis || null,
                analyzedBy: formData.analyzedBy || null,
                reviewerComments: formData.reviewerComments || null,
                reportPreparationDate: formData.reportPreparationDate || null,
                reportReviewDate: formData.reportReviewDate || null,
                reportReleaseDate: formData.reportReleaseDate || null,
                remarks: formData.remarks || null,
                modifiedBy: user?.id || 'system'
            };

            // Send update to backend
            const response = await fetch(`/api/genetic-analyst/${editing.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload)
            });

            if (!response.ok) {
                const error = await response.json();
                toast({ title: "Error", description: error.message || "Failed to update record" });
                return;
            }

            // Get updated record from backend
            const updatedRecord = await response.json();

            // Update local state with backend response
            setRows(rows.map(r => r.id === editing.id ? updatedRecord : r));

            setIsOpen(false);
            setEditing(null);
            toast({ title: "Saved", description: "Record updated successfully in backend." });
        } catch (error) {
            console.error("Failed to save:", error);
            toast({ title: "Error", description: "Failed to update record in backend" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Genetic Analyst</h1>
                    <p className="text-muted-foreground">Manage genetic analysis records</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Genetic Analyst Queue</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">
                            Loading genetic analyst records...
                        </div>
                    ) : (
                        <>
                            <FilterBar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        dateFilterField={dateFilterField}
                        setDateFilterField={setDateFilterField}
                        dateFieldOptions={[
                            { label: "Created At", value: "createdAt" },
                            { label: "Received Date", value: "receivedDateForAnalysis" },
                            { label: "Completed Analysis", value: "completedAnalysis" },
                            { label: "Report Prep Date", value: "reportPreparationDate" },
                            { label: "Report Release Date", value: "reportReleaseDate" },
                        ]}
                        totalItems={totalFiltered}
                        pageSize={pageSize}
                        setPageSize={setPageSize}
                        setPage={setPage}
                        placeholder="Search Unique ID / Project ID / Sample ID..."
                    />

                    <div className="mt-2">
                        <ColumnSettings
                            columns={columns}
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
                                        {/* Dynamic Columns */}
                                        {columns.map(col => {
                                            if (!columnPrefs.isColumnVisible(col.id)) return null;

                                            // Calculate sticky classes
                                            let stickyClass = '';
                                            if (col.id === 'actions') {
                                                stickyClass = 'sticky right-0 z-40 bg-white dark:bg-gray-900 border-l-2';
                                            } else if (col.id === 'uniqueId') {
                                                stickyClass = 'sticky left-0 z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[120px]';
                                            } else if (col.id === 'projectId') {
                                                stickyClass = 'sticky left-[120px] z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[120px]';
                                            } else if (col.id === 'sampleId') {
                                                stickyClass = 'sticky left-[240px] z-40 bg-white dark:bg-gray-900 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[120px]';
                                            } else {
                                                stickyClass = 'cursor-pointer';
                                            }

                                            return (
                                                <TableHead
                                                    key={col.id}
                                                    onClick={() => col.id !== 'actions' && (setSortKey(col.id), setSortDir(s => s === 'asc' ? 'desc' : 'asc'))}
                                                    className={`whitespace-nowrap font-semibold ${stickyClass}`}
                                                >
                                                    {col.label}
                                                    {col.id !== 'actions' && sortKey === col.id ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={columns.filter(c => columnPrefs.isColumnVisible(c.id)).length} className="text-center py-8 text-muted-foreground">
                                                No records match your search criteria
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        visibleRows.map((r) => {
                                            const rowColor = r.reportReleaseDate
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : r.completedAnalysis
                                                    ? 'bg-blue-100 dark:bg-blue-900/30'
                                                    : 'bg-yellow-50 dark:bg-yellow-900/20';

                                            return (
                                                <TableRow key={r.id} className={`${rowColor} hover:bg-opacity-75 dark:hover:bg-opacity-75`}>
                                                    {columnPrefs.isColumnVisible('uniqueId') && <TableCell className={`font-medium sticky left-0 z-20 ${rowColor} border-r py-1 min-w-[120px]`}>{r.uniqueId}</TableCell>}
                                                    {columnPrefs.isColumnVisible('projectId') && <TableCell className={`sticky left-[120px] z-20 ${rowColor} border-r py-1 min-w-[120px]`}>{r.projectId}</TableCell>}
                                                    {columnPrefs.isColumnVisible('sampleId') && <TableCell className={`sticky left-[240px] z-20 ${rowColor} border-r py-1 min-w-[120px]`}>{r.sampleId}</TableCell>}
                                                    {columnPrefs.isColumnVisible('receivedDateForAnalysis') && <TableCell className="py-1">{r.receivedDateForAnalysis}</TableCell>}
                                                    {columnPrefs.isColumnVisible('completedAnalysis') && <TableCell className="py-1">{r.completedAnalysis}</TableCell>}
                                                    {columnPrefs.isColumnVisible('analyzedBy') && <TableCell className="py-1">{r.analyzedBy}</TableCell>}
                                                    {columnPrefs.isColumnVisible('reviewerComments') && <TableCell className="py-1">{r.reviewerComments}</TableCell>}
                                                    {columnPrefs.isColumnVisible('reportPreparationDate') && <TableCell className="py-1">{r.reportPreparationDate}</TableCell>}
                                                    {columnPrefs.isColumnVisible('reportReviewDate') && <TableCell className="py-1">{r.reportReviewDate}</TableCell>}
                                                    {columnPrefs.isColumnVisible('reportReleaseDate') && <TableCell className="py-1">{r.reportReleaseDate}</TableCell>}
                                                    {columnPrefs.isColumnVisible('remarks') && <TableCell className="py-1">{r.remarks}</TableCell>}
                                                    {columnPrefs.isColumnVisible('actions') && (
                                                        <TableCell className={`sticky right-0 z-20 border-l-2 border-gray-200 dark:border-gray-700 ${rowColor} py-1 text-right`}>
                                                            <div className="flex items-center justify-end space-x-2">
                                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-1" aria-label="Edit" onClick={() => openEdit(r)}>
                                                                    <EditIcon className="h-4 w-4" />
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-1" aria-label="Recycle" onClick={() => handleDelete(r.id)}>
                                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination */}
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
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Genetic Analyst Record</DialogTitle>
                        <DialogDescription>Edit record details.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSave)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Read only fields */}
                        <div><Label>Unique ID</Label><Input {...form.register('uniqueId')} disabled /></div>
                        <div><Label>Project ID</Label><Input {...form.register('projectId')} disabled /></div>
                        <div><Label>Sample ID</Label><Input {...form.register('sampleId')} disabled /></div>

                        {/* Editable fields */}
                        <div><Label>Received Date for Analysis</Label><Input type="date" {...form.register('receivedDateForAnalysis')} /></div>
                        <div><Label>Completed Analysis</Label><Input type="date" {...form.register('completedAnalysis')} /></div>
                        <div><Label>Analyzed By</Label><Input {...form.register('analyzedBy')} /></div>
                        <div><Label>Report Preparation Date</Label><Input type="date" {...form.register('reportPreparationDate')} /></div>
                        <div><Label>Report Review Date</Label><Input type="date" {...form.register('reportReviewDate')} /></div>
                        <div><Label>Report Release Date</Label><Input type="date" {...form.register('reportReleaseDate')} /></div>

                        <div className="md:col-span-2">
                            <Label>Reviewer Comments</Label>
                            <Textarea {...form.register('reviewerComments')} />
                        </div>

                        <div className="md:col-span-2">
                            <Label>Remarks</Label>
                            <Textarea {...form.register('remarks')} />
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
