import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/components/ui/currency-input";
import { CheckCircle, Eye, IndianRupee, Clock, FileText, Edit as EditIcon, Trash2 } from "lucide-react";
import type { SampleWithLead } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import normalizeFinanceRow from "@/lib/normalizeFinanceRow";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useRecycle } from '@/contexts/RecycleContext';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export default function FinanceManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  // Sorting state (re-enable per-column UI sorting)
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [financeQuery, setFinanceQuery] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const financeFormSchema = z.object({
    titleUniqueId: z.string().optional(),
    sampleId: z.string().optional(),
    dateSampleCollected: z.string().optional(),
    organization: z.string().optional(),
    clinician: z.string().optional(),
    city: z.string().optional(),
    patientName: z.string().optional(),
    patientEmail: z.string().optional(),
    patientPhone: z.string().optional(),
    serviceName: z.string().optional(),
    budget: z.string().optional(),
    salesResponsiblePerson: z.string().optional(),
    invoiceNumber: z.string().optional(),
    invoiceAmount: z.string().optional(),
    invoiceDate: z.string().optional(),
    paymentReceivedAmount: z.string().optional(),
    paymentMethod: z.string().optional(),
    utrDetails: z.string().optional(),
    balanceAmountReceivedDate: z.string().optional(),
    totalPaymentReceivedStatus: z.string().optional(),
    phlebotomistCharges: z.string().optional(),
    sampleShipmentAmount: z.string().optional(),
    thirdPartyCharges: z.string().optional(),
    otherCharges: z.string().optional(),
    thirdPartyName: z.string().optional(),
    thirdPartyContractDetails: z.string().optional(),
    thirdPartyPaymentStatus: z.string().optional(),
    progenicsTrf: z.string().optional(),
    approveToLabProcess: z.boolean().optional(),
    approveToReportProcess: z.boolean().optional(),
    notes: z.string().optional(),
  });

  type FinanceFormData = z.infer<typeof financeFormSchema>;

  const form = useForm<FinanceFormData>({
    resolver: zodResolver(financeFormSchema),
    defaultValues: {
      titleUniqueId: '',
      sampleId: '',
      dateSampleCollected: undefined,
      organization: '',
      clinician: '',
      city: '',
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      serviceName: '',
      budget: '',
      salesResponsiblePerson: '',
      invoiceNumber: '',
      invoiceAmount: '',
      invoiceDate: undefined,
      paymentReceivedAmount: '',
      paymentMethod: '',
      utrDetails: '',
      balanceAmountReceivedDate: undefined,
      totalPaymentReceivedStatus: '',
      phlebotomistCharges: '',
      sampleShipmentAmount: '',
      thirdPartyCharges: '',
      otherCharges: '',
      thirdPartyName: '',
      thirdPartyContractDetails: '',
      thirdPartyPaymentStatus: '',
      progenicsTrf: '',
      approveToLabProcess: false,
      approveToReportProcess: false,
      notes: '',
    },
  });

  // edit form (loose typing to accept server fields)
  const editForm = useForm<any>({
    defaultValues: {
      titleUniqueId: '',
      sampleId: '',
      dateSampleCollected: undefined,
      organization: '',
      clinician: '',
      city: '',
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      serviceName: '',
      budget: '',
      salesResponsiblePerson: '',
      invoiceNumber: '',
      invoiceAmount: '',
      invoiceDate: undefined,
      paymentReceivedAmount: '',
      paymentMethod: '',
      utrDetails: '',
      balanceAmountReceivedDate: undefined,
      totalPaymentReceivedStatus: '',
      phlebotomistCharges: '',
      sampleShipmentAmount: '',
      thirdPartyCharges: '',
      otherCharges: '',
      thirdPartyName: '',
      thirdPartyContractDetails: '',
      thirdPartyPaymentStatus: '',
      progenicsTrf: '',
      approveToLabProcess: false,
      approveToReportProcess: false,
      notes: '',
      created_at: '',
      updated_at: '',
    },
  });

  // Editable fields per user rule (Finance edit modal only)
  const financeEditable = new Set<string>([
    'dateSampleCollected','organization','clinician','city','patientName','patientEmail','patientPhone','serviceName','budget','salesResponsiblePerson','invoiceNumber','invoiceAmount','invoiceDate','paymentReceivedAmount','paymentMethod','utrDetails','balanceAmountReceivedDate','totalPaymentReceivedStatus','phlebotomistCharges','sampleShipmentAmount','thirdPartyCharges','otherCharges','thirdPartyName','thirdPartyContractDetails','thirdPartyPaymentStatus','progenicsTrf','approveToLabProcess','approveToReportProcess','notes','created_at','updated_at'
  ]);

  const updateFinanceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/finance-sheet/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      setIsEditDialogOpen(false);
      setSelectedRecord(null);
      toast({ title: 'Finance record updated', description: 'Record updated successfully' });
    },
  });

  const [isViewMode, setIsViewMode] = useState(false);

  const deleteFinanceMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await apiRequest('DELETE', `/api/finance-sheet/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      toast({ title: 'Finance record deleted', description: 'Record has been deleted' });
      // Notify recycle UI to refresh (server creates snapshot for deleted finance)
      window.dispatchEvent(new Event('ll:recycle:update'));
    },
    onError: (error: any) => {
      toast({ title: 'Delete failed', description: error.message || 'Failed to delete finance record', variant: 'destructive' });
    }
  });

  const { add } = useRecycle();

  const createFinanceMutation = useMutation({
    mutationFn: async (data: FinanceFormData) => {
      const response = await apiRequest('POST', '/api/finance/records', {
        ...data,
        createdBy: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/records'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      form.reset();
      setIsCreateDialogOpen(false);
      toast({ title: 'Finance record created', description: 'Finance record saved successfully' });
    },
  });

  const { data: financeStats } = useQuery<any>({
    queryKey: ['/api/finance/stats'],
  });

  const { data: financeData = { rows: [], total: 0 }, isLoading: isLoadingRecords } = useQuery<any>({
    queryKey: ['/api/finance-sheet', page, pageSize, financeQuery],
    queryFn: async () => {
      const res = await fetch(`/api/finance-sheet`);
      if (!res.ok) throw new Error('Failed to fetch finance sheet');
      return res.json();
    },
  });
  const { data: pendingApprovals = [], isLoading } = useQuery<SampleWithLead[]>({
    queryKey: ['/api/finance/pending-approvals'],
  });

  const approvePaymentMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest('PUT', `/api/reports/${reportId}/approve`, {
        approvedBy: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/finance/pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/performance-metrics'] });
      toast({
        title: "Payment approved",
        description: "Report has been approved for delivery",
      });
    },
  });

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${formatINR(financeStats?.totalRevenue || 0)}`,
      icon: IndianRupee,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Pending Payments",
      value: `₹${formatINR(financeStats?.pendingPayments || 0)}`,
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: "Pending Approvals",
      value: financeStats?.pendingApprovals || 0,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
  ];

  // Column counts for empty-state spanning cells (keeps header visible when no rows)
  const PENDING_HEADER_COUNT = 36;
  // Use same header count for finance records so both tables show identical columns
  const FINANCE_HEADER_COUNT = PENDING_HEADER_COUNT;

  // Simple ID / Sample ID search (copied from LabProcessing)
  // Show all pending approvals without filtering
  const filteredPendingApprovals = pendingApprovals || [];

  // Apply optional client-side sorting for pending approvals
  const sortedPendingApprovals = (() => {
    if (!sortKey) return filteredPendingApprovals;
    const getValue = (obj: any, key: string) => {
      if (key === 'balance') {
        const amount = Number(obj.lead?.amount ?? obj.amount ?? 0);
        const paid = Number(obj.lead?.paidAmount ?? obj.paidAmount ?? 0);
        return amount - paid;
      }
      return key.split('.').reduce((acc: any, k: string) => (acc ? acc[k] : undefined), obj);
    };
    const copy = [...filteredPendingApprovals];
    copy.sort((a: any, b: any) => {
      const A = getValue(a, sortKey);
      const B = getValue(b, sortKey);
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

  // Normalize rows: sometimes the query returns { rows: [...] }, sometimes it may return the array directly.
  const allFinanceRows: any[] = Array.isArray(financeData?.rows)
    ? (financeData.rows as any[])
    : Array.isArray(financeData)
    ? (financeData as any[])
    : [];

  const filteredFinanceRows = allFinanceRows.filter((r) => {
    if (!financeQuery) return true;
    const q = String(financeQuery).toLowerCase().trim();
    
    // Search in finance-specific fields
    const financeFieldMatches = [
      r.invoiceNumber,
      r.titleUniqueId,
      r.organization,
      r.patientName,
      r.serviceName,
      r.salesResponsiblePerson,
      r.paymentStatus,
      r.paymentMethod
    ].some(field => String(field || '').toLowerCase().includes(q));

    // Search in ID fields
    const idMatches = [
      r.id,
      r.titleUniqueId,
      (r as any).title_unique_id,
      r.sampleId,
      r.sample?.sampleId,
      r.sample?.sample_id,
      r.sample?.lead?.sampleId,
      r.sample?.lead?.sample_id,
      r.sample?.lead?.id
    ].some(id => String(id || '').toLowerCase().includes(q));

    return financeFieldMatches || idMatches;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Track payments, pending amounts, and financial approvals</p>
        </div>
        {/* Create Finance dialog removed per request - only edit dialog remains */}
      </div>

      {/* Finance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pending Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Financial Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading pending approvals...</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Make pending approvals table vertically scrollable with sticky header */}
              <div className="max-h-[50vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white/95 dark:bg-gray-900/95 z-10 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    <TableRow>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Unique Id</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Project ID</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Sample Collected Date</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Organisation / Hospital</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Clinician / Researcher Name</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Clinician / Researcher Address</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Name</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Address</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Email</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Patient / Client Phone</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Service Name</TableHead>
                      <TableHead className="min-w-[120px] whitespace-nowrap font-semibold">Budget</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Sales / Responsible Person</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Invoice Number</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Invoice Amount</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Invoice Date</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Payment Received amount</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Balance amount</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Payment Received Date</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Mode of Payment</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">UTR Details</TableHead>
                      <TableHead className="min-w-[170px] whitespace-nowrap font-semibold">Balance amount Received Date</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Total Payment Received status</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Phlebotomist Charges</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Sample Shippment Amount</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Charges</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Other Charges</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Third Party Name</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Third Party Contact details</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Payment Date</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Payment Status</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Progenics TRF</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Approve to Lab Process</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Approve to Report Process</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Patient Address</TableHead>
                      <TableHead className="min-w-[220px] whitespace-nowrap font-semibold">Remark/Comment</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Created At</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Updated At</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingApprovals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={PENDING_HEADER_COUNT} className="text-center py-8 text-gray-500 dark:text-gray-400">No pending approvals match your search</TableCell>
                      </TableRow>
                    ) : (
                      sortedPendingApprovals.map((sample) => {
                        const s: any = sample;
                        const lead = s.lead || {};
                        const balance = s.balanceAmount != null ? Number(s.balanceAmount) : (Number(s.amount || (lead as any).amount || 0) - Number(s.paidAmount || (lead as any).paidAmount || 0));
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="min-w-[140px] font-medium text-gray-900 dark:text-white">{s.titleUniqueId ?? s.title_unique_id ?? '-'}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{s.sampleId ?? s.sample_id ?? '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.sampleCollectedDate ? new Date(s.sampleCollectedDate).toLocaleDateString() : ((lead as any).dateSampleCollected ? new Date((lead as any).dateSampleCollected).toLocaleDateString() : '-')}</TableCell>
                            <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{s.organization ?? (lead as any).organization ?? 'N/A'}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.clinician ?? (lead as any).clinician ?? (lead as any).referredDoctor ?? '-'}</TableCell>
                            <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{s.city ?? (lead as any).location ?? '-'}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.patientName ?? (lead as any).patientName ?? (lead as any).patientClientName ?? '-'}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.patientEmail ?? (lead as any).patientEmail ?? (lead as any).patientClientEmail ?? '-'}</TableCell>
                            <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{s.patientPhone ?? (lead as any).patientPhone ?? (lead as any).patientClientPhone ?? '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.serviceName ?? (lead as any).serviceName ?? '-'}</TableCell>
                            <TableCell className="min-w-[120px] text-gray-900 dark:text-white">{s.budget != null ? `₹${formatINR(Number(s.budget))}` : ((lead as any).budget != null ? `₹${formatINR(Number((lead as any).budget))}` : '-')}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.salesResponsiblePerson ?? (lead as any).salesResponsiblePerson ?? '-'}</TableCell>
                            <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{s.invoiceNumber ?? (lead as any).invoiceNumber ?? '-'}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{s.invoiceAmount != null ? `₹${formatINR(Number(s.invoiceAmount))}` : ((lead as any).invoiceAmount != null ? `₹${formatINR(Number((lead as any).invoiceAmount))}` : '-')}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{s.invoiceDate ? new Date(s.invoiceDate).toLocaleDateString() : ((lead as any).invoiceDate ? new Date((lead as any).invoiceDate).toLocaleDateString() : '-')}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.paymentReceivedAmount != null ? `₹${formatINR(Number(s.paymentReceivedAmount))}` : ((lead as any).paymentReceivedAmount != null ? `₹${formatINR(Number((lead as any).paymentReceivedAmount))}` : '-')}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{!isNaN(balance) ? `₹${formatINR(Number(balance))}` : '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.paymentReceivedDate ? new Date(s.paymentReceivedDate).toLocaleDateString() : ((lead as any).paymentReceivedDate ? new Date((lead as any).paymentReceivedDate).toLocaleDateString() : '-')}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{s.paymentMethod ?? (lead as any).paymentMethod ?? '-'}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{s.utrDetails ?? (lead as any).utrDetails ?? '-'}</TableCell>
                            <TableCell className="min-w-[170px] text-gray-900 dark:text-white">{s.balanceAmountReceivedDate ? new Date(s.balanceAmountReceivedDate).toLocaleDateString() : ((lead as any).balanceAmountReceivedDate ? new Date((lead as any).balanceAmountReceivedDate).toLocaleDateString() : '-')}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.totalPaymentReceivedStatus ?? (lead as any).totalPaymentReceivedStatus ?? '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.phlebotomistCharges != null ? `₹${formatINR(Number(s.phlebotomistCharges))}` : ((lead as any).phlebotomistCharges != null ? `₹${formatINR(Number((lead as any).phlebotomistCharges))}` : '-')}</TableCell>
                            <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{s.sampleShipmentAmount != null ? `₹${formatINR(Number(s.sampleShipmentAmount))}` : (s.shippingCost != null ? `₹${formatINR(Number(s.shippingCost))}` : '-')}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.thirdPartyCharges != null ? `₹${formatINR(Number(s.thirdPartyCharges))}` : ((lead as any).thirdPartyCharges != null ? `₹${formatINR(Number((lead as any).thirdPartyCharges))}` : '-')}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.otherCharges != null ? `₹${formatINR(Number(s.otherCharges))}` : ((lead as any).otherCharges != null ? `₹${formatINR(Number((lead as any).otherCharges))}` : '-')}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.thirdPartyName ?? (lead as any).thirdPartyName ?? '-'}</TableCell>
                            <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{s.thirdPartyContractDetails ?? (lead as any).thirdPartyContractDetails ?? '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.thirdPartyPaymentDate ? new Date(s.thirdPartyPaymentDate).toLocaleDateString() : ((lead as any).thirdPartyPaymentDate ? new Date((lead as any).thirdPartyPaymentDate).toLocaleDateString() : '-')}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.thirdPartyPaymentStatus ?? (lead as any).thirdPartyPaymentStatus ?? '-'}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{s.progenicsTrf ?? (lead as any).progenicsTrf ?? '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.approveToLabProcess ? 'Yes' : ((lead as any).approveToLabProcess ? 'Yes' : 'No')}</TableCell>
                            <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{s.approveToReportProcess ? 'Yes' : ((lead as any).approveToReportProcess ? 'Yes' : 'No')}</TableCell>
                            <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{s.patientAddress ?? (lead as any).patientAddress ?? '-'}</TableCell>
                            <TableCell className="min-w-[220px] text-gray-900 dark:text-white">{s.comments ?? s.notes ?? (lead as any).comments ?? '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.created_at ? new Date(s.created_at).toLocaleString() : '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.updated_at ? new Date(s.updated_at).toLocaleString() : '-'}</TableCell>
                            <TableCell className="min-w-[150px]">
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setSelectedRecord(s);
                                  setIsEditDialogOpen(true);
                                  setIsViewMode(true);
                                }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                  setSelectedRecord(s);
                                  setIsEditDialogOpen(true);
                                  setIsViewMode(false);
                                  // prefill edit form (keep existing behavior)
                                  editForm.reset({
                                    invoiceNumber: (s.lead as any)?.invoiceNumber ?? s.invoiceNumber ?? '',
                                    invoiceAmount: (s.lead as any)?.invoiceAmount ?? s.invoiceAmount ?? '',
                                    taxAmount: (s.lead as any)?.taxAmount ?? s.taxAmount ?? '',
                                    totalAmount: (s.lead as any)?.totalAmount ?? s.totalAmount ?? '',
                                    paymentStatus: (s.lead as any)?.paymentStatus ?? s.paymentStatus ?? '',
                                    paymentMethod: (s.lead as any)?.paymentMethod ?? s.paymentMethod ?? '',
                                    dueDate: (s.lead as any)?.dueDate ?? s.dueDate ?? undefined,
                                    paymentDate: (s.lead as any)?.paymentDate ?? s.paymentDate ?? undefined,
                                    billingContact: (s.lead as any)?.billingContact ?? s.billingContact ?? '',
                                    notes: (s.lead as any)?.notes ?? s.notes ?? '',
                                  });
                                }}>
                                  <EditIcon className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => {
                                  if (!confirm('Delete this finance record? This action cannot be undone.')) return;
                                  deleteFinanceMutation.mutate({ id: s.id });
                                }}>
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Edit Finance Record Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Finance Record</DialogTitle>
            <DialogDescription>Update invoice, payment status and billing information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit((vals) => {
            if (!selectedRecord) return;
            // only send editable fields to the server
            const updates: any = {};
            Object.keys(vals || {}).forEach((k) => {
              if (financeEditable.has(k)) updates[k] = vals[k];
            });
            // normalize numeric fields that are editable
            ['invoiceAmount','paymentReceivedAmount','phlebotomistCharges','sampleShipmentAmount','thirdPartyCharges','otherCharges'].forEach(k => {
              if (updates[k] != null) updates[k] = String(updates[k]);
            });

            // Remove empty-string and null values so server won't receive "" for date fields
            Object.keys(updates).forEach(k => {
              const v = updates[k];
              if (v === '' || v === null || v === undefined) {
                delete updates[k];
              }
            });

            updateFinanceMutation.mutate({ id: selectedRecord.id, updates });
          })} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateSampleCollected">Sample Collected Date</Label>
                <Input id="dateSampleCollected" type="date" {...editForm.register('dateSampleCollected')} disabled={!financeEditable.has('dateSampleCollected')} />
              </div>
              <div>
                <Label htmlFor="organization">Organization / Hospital</Label>
                <Input id="organization" {...editForm.register('organization')} disabled={!financeEditable.has('organization')} />
              </div>
              <div>
                <Label htmlFor="clinician">Clinician / Researcher Name</Label>
                <Input id="clinician" {...editForm.register('clinician')} disabled={!financeEditable.has('clinician')} />
              </div>
              <div>
                <Label htmlFor="city">Clinician / Researcher Address</Label>
                <Input id="city" {...editForm.register('city')} disabled={!financeEditable.has('city')} />
              </div>
              <div>
                <Label htmlFor="patientName">Patient / Client Name</Label>
                <Input id="patientName" {...editForm.register('patientName')} disabled={!financeEditable.has('patientName')} />
              </div>
              <div>
                <Label htmlFor="patientEmail">Patient / Client Email</Label>
                <Input id="patientEmail" type="email" {...editForm.register('patientEmail')} disabled={!financeEditable.has('patientEmail')} />
              </div>
              <div>
                <Label htmlFor="patientPhone">Patient / Client Phone</Label>
                <Input id="patientPhone" {...editForm.register('patientPhone')} disabled={!financeEditable.has('patientPhone')} />
              </div>
              <div>
                <Label htmlFor="serviceName">Service Name</Label>
                <Input id="serviceName" {...editForm.register('serviceName')} disabled={!financeEditable.has('serviceName')} />
              </div>
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input id="budget" {...editForm.register('budget')} disabled={!financeEditable.has('budget')} />
              </div>
              <div>
                <Label htmlFor="salesResponsiblePerson">Sales / Responsible Person</Label>
                <Input id="salesResponsiblePerson" {...editForm.register('salesResponsiblePerson')} disabled={!financeEditable.has('salesResponsiblePerson')} />
              </div>
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input id="invoiceNumber" {...editForm.register('invoiceNumber')} disabled={!financeEditable.has('invoiceNumber')} />
              </div>
              <div>
                <Label htmlFor="invoiceAmount">Invoice Amount</Label>
                <Input id="invoiceAmount" {...editForm.register('invoiceAmount')} disabled={!financeEditable.has('invoiceAmount')} />
              </div>
              <div>
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input id="invoiceDate" type="date" {...editForm.register('invoiceDate')} disabled={!financeEditable.has('invoiceDate')} />
              </div>
              <div>
                <Label htmlFor="paymentReceivedAmount">Payment Received Amount</Label>
                <Input id="paymentReceivedAmount" {...editForm.register('paymentReceivedAmount')} disabled={!financeEditable.has('paymentReceivedAmount')} />
              </div>
              <div>
                <Label htmlFor="paymentMethod">Mode of Payment</Label>
                <Input id="paymentMethod" {...editForm.register('paymentMethod')} disabled={!financeEditable.has('paymentMethod')} />
              </div>
              <div>
                <Label htmlFor="utrDetails">UTR Details</Label>
                <Input id="utrDetails" {...editForm.register('utrDetails')} disabled={!financeEditable.has('utrDetails')} />
              </div>
              <div>
                <Label htmlFor="balanceAmountReceivedDate">Balance Amount Received Date</Label>
                <Input id="balanceAmountReceivedDate" type="date" {...editForm.register('balanceAmountReceivedDate')} disabled={!financeEditable.has('balanceAmountReceivedDate')} />
              </div>
              <div>
                <Label htmlFor="totalPaymentReceivedStatus">Total Payment Received Status</Label>
                <Input id="totalPaymentReceivedStatus" {...editForm.register('totalPaymentReceivedStatus')} disabled={!financeEditable.has('totalPaymentReceivedStatus')} />
              </div>
              <div>
                <Label htmlFor="phlebotomistCharges">Phlebotomist Charges</Label>
                <Input id="phlebotomistCharges" {...editForm.register('phlebotomistCharges')} disabled={!financeEditable.has('phlebotomistCharges')} />
              </div>
              <div>
                <Label htmlFor="sampleShipmentAmount">Sample Shipment Amount / Courier Charges</Label>
                <Input id="sampleShipmentAmount" {...editForm.register('sampleShipmentAmount')} disabled={!financeEditable.has('sampleShipmentAmount')} />
              </div>
              <div>
                <Label htmlFor="thirdPartyCharges">Third Party Charges</Label>
                <Input id="thirdPartyCharges" {...editForm.register('thirdPartyCharges')} disabled={!financeEditable.has('thirdPartyCharges')} />
              </div>
              <div>
                <Label htmlFor="otherCharges">Other Charges</Label>
                <Input id="otherCharges" {...editForm.register('otherCharges')} disabled={!financeEditable.has('otherCharges')} />
              </div>
              <div>
                <Label htmlFor="thirdPartyName">Third Party Name</Label>
                <Input id="thirdPartyName" {...editForm.register('thirdPartyName')} disabled={!financeEditable.has('thirdPartyName')} />
              </div>
              <div>
                <Label htmlFor="thirdPartyContractDetails">Third Party Contract Details</Label>
                <Textarea id="thirdPartyContractDetails" {...editForm.register('thirdPartyContractDetails')} disabled={!financeEditable.has('thirdPartyContractDetails')} />
              </div>
              <div>
                <Label htmlFor="thirdPartyPaymentStatus">Third Party Payment Status</Label>
                <Input id="thirdPartyPaymentStatus" {...editForm.register('thirdPartyPaymentStatus')} disabled={!financeEditable.has('thirdPartyPaymentStatus')} />
              </div>
              <div>
                <Label htmlFor="progenicsTrf">Progenics TRF</Label>
                <Input id="progenicsTrf" {...editForm.register('progenicsTrf')} disabled={!financeEditable.has('progenicsTrf')} />
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="approveToLabProcess_edit" {...editForm.register('approveToLabProcess')} disabled={!financeEditable.has('approveToLabProcess')} />
                <Label htmlFor="approveToLabProcess_edit">Approve to Lab Process</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="approveToReportProcess_edit" {...editForm.register('approveToReportProcess')} disabled={!financeEditable.has('approveToReportProcess')} />
                <Label htmlFor="approveToReportProcess_edit">Approve to Report Process</Label>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...editForm.register('notes')} disabled={!financeEditable.has('notes')} />
              </div>
              <div>
                <Label htmlFor="created_at">Created At</Label>
                <Input id="created_at" type="datetime-local" {...editForm.register('created_at')} disabled={!financeEditable.has('created_at')} />
              </div>
              <div>
                <Label htmlFor="updated_at">Updated At</Label>
                <Input id="updated_at" type="datetime-local" {...editForm.register('updated_at')} disabled={!financeEditable.has('updated_at')} />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedRecord(null); }}>Cancel</Button>
              <Button type="submit" disabled={updateFinanceMutation.isPending}>{updateFinanceMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* All Finance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Finance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and page size controls */}
          <div className="p-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Input 
                placeholder="Search finance records..." 
                value={financeQuery} 
                onChange={(e) => { setFinanceQuery(e.target.value); setPage(1); }} 
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label>Page size</Label>
              <Select onValueChange={(v) => { setPageSize(parseInt(v || '25', 10)); setPage(1); }} value={String(pageSize)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingRecords ? (
            <div className="text-center py-8">Loading finance records...</div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                {/* Make finance records table vertically scrollable with sticky header */}
                <div className="max-h-[60vh] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white/95 dark:bg-gray-900/95 z-10 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    <TableRow>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Unique Id</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Project ID</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Sample Collected Date</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Organisation / Hospital</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Clinician / Researcher Name</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Clinician / Researcher Address</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Name</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Mail Id</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Patient / Client Address</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Patient / Client Phone number</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Service Name</TableHead>
                      <TableHead className="min-w-[120px] whitespace-nowrap font-semibold">Budget</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Sales / Responsible Person</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Invoice Number</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Invoice Amount</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Invoice Date</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Payment Received amount</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Balance amount</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Payment Received Date</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Mode of Payment</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">UTR Details</TableHead>
                      <TableHead className="min-w-[170px] whitespace-nowrap font-semibold">Balance amount Received Date</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Total Payment Received status</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Phlebotomist Charges</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Sample Shippment Amount</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Charges</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Other Charges</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Third Party Name</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Third Party Contact details</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Payment Date</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Payment Status</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Progenics TRF</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Approve to Lab Process</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Approve to Report Process</TableHead>
                      <TableHead className="min-w-[220px] whitespace-nowrap font-semibold">Remark/Comment</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Created At</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Updated At</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredFinanceRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={FINANCE_HEADER_COUNT} className="text-center py-8 text-gray-500 dark:text-gray-400">No finance records match your search</TableCell>
                    </TableRow>
                  ) : (
                    filteredFinanceRows.map((record: any) => {
                      const sampleIdDisplay = record.sample?.sampleId || record.sample?.sample_id || (record as any).sampleId || (record as any).s_sample_id || (record.sample && record.sample.lead && (record.sample.lead.sampleId ?? record.sample.lead.sample_id)) || record.sample?.lead?.id || 'N/A';
                      const titleDisplay = record.titleUniqueId ?? (record as any).title_unique_id ?? record.sample?.lead?.id ?? '-';
                      return (
                      <TableRow key={record.id}>
                        <TableCell className="min-w-[140px] font-medium text-gray-900 dark:text-white">{titleDisplay}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{sampleIdDisplay}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.dateSampleCollected ? new Date(record.dateSampleCollected).toLocaleDateString() : (record.sample?.sampleCollectedDate ? new Date(record.sample.sampleCollectedDate).toLocaleDateString() : '-')}</TableCell>
                        <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{record.sample?.lead?.organization || 'N/A'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.clinician ?? record.sample?.lead?.referredDoctor ?? '-'}</TableCell>
                        <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{record.city ?? record.sample?.lead?.location ?? '-'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.patientName ?? record.sample?.lead?.patientClientName ?? '-'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.patientEmail ?? record.sample?.lead?.patientClientEmail ?? '-'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.patientAddress ?? record.sample?.lead?.patientAddress ?? '-'}</TableCell>
                        <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{record.patientPhone ?? record.sample?.lead?.patientClientPhone ?? '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.serviceName ?? record.sample?.lead?.serviceName ?? '-'}</TableCell>
                        <TableCell className="min-w-[120px] text-gray-900 dark:text-white">{record.budget != null ? `₹${formatINR(Number(record.budget))}` : (record.sample?.lead?.budget != null ? `₹${formatINR(Number(record.sample.lead.budget))}` : '-')}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.salesResponsiblePerson ?? record.sample?.lead?.salesResponsiblePerson ?? '-'}</TableCell>
                        <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{record.invoiceNumber ?? '-'}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{record.amount != null ? `₹${formatINR(Number(record.amount))}` : '-'}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{record.invoiceDate ? new Date(record.invoiceDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.paymentReceivedAmount != null ? `₹${formatINR(Number(record.paymentReceivedAmount))}` : '-'}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{record.totalAmount && record.paidAmount != null ? `₹${formatINR(Number(record.totalAmount) - Number(record.paidAmount))}` : (record.balanceAmount != null ? `₹${formatINR(Number(record.balanceAmount))}` : '-')}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{record.paymentMethod || '-'}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{record.utrDetails ?? '-'}</TableCell>
                        <TableCell className="min-w-[170px] text-gray-900 dark:text-white">{record.balanceAmountReceivedDate ? new Date(record.balanceAmountReceivedDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.totalPaymentReceivedStatus ?? '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.phlebotomistCharges != null ? `₹${formatINR(Number(record.phlebotomistCharges))}` : '-'}</TableCell>
                        <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{record.sampleShipmentAmount != null ? `₹${formatINR(Number(record.sampleShipmentAmount))}` : '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.thirdPartyCharges != null ? `₹${formatINR(Number(record.thirdPartyCharges))}` : '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.otherCharges != null ? `₹${formatINR(Number(record.otherCharges))}` : '-'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.thirdPartyName ?? '-'}</TableCell>
                        <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{record.thirdPartyContractDetails ?? '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.thirdPartyPaymentDate ? new Date(record.thirdPartyPaymentDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.thirdPartyPaymentStatus ?? '-'}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{record.progenicsTrf ?? record.sample?.lead?.progenicsTRF ?? '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.approveToLabProcess ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{record.approveToReportProcess ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="min-w-[220px] text-gray-900 dark:text-white">{record.notes ?? record.comments ?? '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.created_at ? new Date(record.created_at).toLocaleString() : '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.updated_at ? new Date(record.updated_at).toLocaleString() : '-'}</TableCell>
                        <TableCell className="min-w-[150px] sticky right-0 bg-white dark:bg-gray-900 border-l-2">
                          <div className="flex space-x-2 items-center justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 w-10 p-2 rounded-lg flex items-center justify-center"
                            aria-label="Edit finance record"
                            onClick={() => {
                            setSelectedRecord(record);
                            editForm.reset({
                              titleUniqueId: record.titleUniqueId ?? '',
                              sampleId: record.sampleId ?? '',
                              dateSampleCollected: record.dateSampleCollected ? new Date(record.dateSampleCollected).toISOString().slice(0,10) : undefined,
                              organization: record.organization ?? '',
                              clinician: record.clinician ?? '',
                              city: record.city ?? '',
                              patientName: record.patientName ?? '',
                              patientEmail: record.patientEmail ?? '',
                              patientPhone: record.patientPhone ?? '',
                              serviceName: record.serviceName ?? '',
                              budget: record.budget ?? '',
                              salesResponsiblePerson: record.salesResponsiblePerson ?? '',
                              invoiceNumber: record.invoiceNumber ?? '',
                              invoiceAmount: record.amount ?? '',
                              invoiceDate: record.invoiceDate ? new Date(record.invoiceDate).toISOString().slice(0,10) : undefined,
                              paymentReceivedAmount: record.paymentReceivedAmount ?? '',
                              paymentMethod: record.paymentMethod ?? '',
                              utrDetails: record.utrDetails ?? '',
                              balanceAmountReceivedDate: record.balanceAmountReceivedDate ? new Date(record.balanceAmountReceivedDate).toISOString().slice(0,10) : undefined,
                              totalPaymentReceivedStatus: record.totalPaymentReceivedStatus ?? '',
                              phlebotomistCharges: record.phlebotomistCharges ?? '',
                              sampleShipmentAmount: record.sampleShipmentAmount ?? '',
                              thirdPartyCharges: record.thirdPartyCharges ?? '',
                              otherCharges: record.otherCharges ?? '',
                              thirdPartyName: record.thirdPartyName ?? '',
                              thirdPartyContractDetails: record.thirdPartyContractDetails ?? '',
                              thirdPartyPaymentStatus: record.thirdPartyPaymentStatus ?? '',
                              progenicsTrf: record.progenicsTrf ?? '',
                              approveToLabProcess: record.approveToLabProcess ?? false,
                              approveToReportProcess: record.approveToReportProcess ?? false,
                              notes: record.notes ?? '',
                              created_at: record.created_at ? new Date(record.created_at).toISOString().slice(0, 16) : '',
                              updated_at: record.updated_at ? new Date(record.updated_at).toISOString().slice(0, 16) : '',
                            });
                            setIsEditDialogOpen(true);
                          }}>
                            <EditIcon className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="sm" aria-label="Delete finance record" onClick={() => {
                            if (!confirm('Delete this finance record? This action cannot be undone.')) return;
                            // Server snapshots finance deletes; don't create local duplicate
                            deleteFinanceMutation.mutate({ id: record.id });
                          }}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                  })
                  )}
                </TableBody>
                </Table>
                </div>
              </div>
              
              {/* Pagination controls */}
              <div className="p-4 flex items-center justify-between">
                <div>Showing {((page - 1) * pageSize + 1)} - {Math.min(page * pageSize, (financeData.total || 0))} of {financeData.total || 0}</div>
                <div className="flex items-center space-x-2">
                  <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                  <div>Page {page} / {Math.max(1, Math.ceil((financeData.total || 0) / pageSize))}</div>
                  <Button disabled={page >= Math.max(1, Math.ceil((financeData.total || 0) / pageSize))} onClick={() => setPage(p => Math.min(Math.max(1, Math.ceil((financeData.total || 0) / pageSize)), p + 1))}>Next</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
