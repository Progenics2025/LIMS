import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/components/ui/currency-input";
import { Eye, IndianRupee, Clock, FileText, Edit as EditIcon, Trash2 } from "lucide-react";
import type { SampleWithLead } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export default function FinanceManagement() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [financeQuery, setFinanceQuery] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const financeFormSchema = z.object({
    uniqueId: z.string().optional(),
    projectId: z.string().optional(),
    sampleCollectionDate: z.string().optional(),
    organisationHospital: z.string().optional(),
    clinicianResearcherName: z.string().optional(),
    clinicianResearcherEmail: z.string().optional(),
    clinicianResearcherPhone: z.string().optional(),
    clinicianResearcherAddress: z.string().optional(),
    patientClientName: z.string().optional(),
    patientClientEmail: z.string().optional(),
    patientClientPhone: z.string().optional(),
    patientClientAddress: z.string().optional(),
    serviceName: z.string().optional(),
    budget: z.string().optional(),
    salesResponsiblePerson: z.string().optional(),
    invoiceNumber: z.string().optional(),
    invoiceAmount: z.string().optional(),
    invoiceDate: z.string().optional(),
    paymentReceiptAmount: z.string().optional(),
    modeOfPayment: z.string().optional(),
    utrDetails: z.string().optional(),
    balanceAmountReceivedDate: z.string().optional(),
    totalAmountReceivedStatus: z.boolean().optional(),
    phlebotomistCharges: z.string().optional(),
    sampleShipmentAmount: z.string().optional(),
    thirdPartyCharges: z.string().optional(),
    otherCharges: z.string().optional(),
    thirdPartyName: z.string().optional(),
    thirdPartyPhone: z.string().optional(),
    thirdPartyPaymentStatus: z.boolean().optional(),
    balanceAmount: z.string().optional(),
    paymentReceiptDate: z.string().optional(),
    transactionalNumber: z.string().optional(),
    otherChargesReason: z.string().optional(),
    thirdPartyPaymentDate: z.string().optional(),
    alertToLabprocessTeam: z.boolean().optional(),
    alertToReportTeam: z.boolean().optional(),
    alertToTechnicalLead: z.boolean().optional(),
    screenshotDocument: z.string().optional(),
    remarkComment: z.string().optional(),
    createdAt: z.string().optional(),
    createdBy: z.string().optional(),
    modifiedAt: z.string().optional(),
    modifiedBy: z.string().optional(),
  });

  type EditFormData = z.infer<typeof financeFormSchema>;

  // edit form (loose typing to accept server fields)
  const editForm = useForm<any>({
    defaultValues: {
      uniqueId: '',
      projectId: '',
      sampleCollectionDate: undefined,
      organisationHospital: '',
      clinicianResearcherName: '',
      clinicianResearcherEmail: '',
      clinicianResearcherPhone: '',
      clinicianResearcherAddress: '',
      patientClientName: '',
      patientClientEmail: '',
      patientClientPhone: '',
      patientClientAddress: '',
      serviceName: '',
      budget: '',
      salesResponsiblePerson: '',
      invoiceNumber: '',
      invoiceAmount: '',
      invoiceDate: undefined,
      paymentReceiptAmount: '',
      modeOfPayment: '',
      utrDetails: '',
      balanceAmountReceivedDate: undefined,
      totalAmountReceivedStatus: false,
      phlebotomistCharges: '',
      sampleShipmentAmount: '',
      thirdPartyCharges: '',
      otherCharges: '',
      thirdPartyName: '',
      thirdPartyPhone: '',
      thirdPartyPaymentStatus: false,
      balanceAmount: '',
      paymentReceiptDate: undefined,
      transactionalNumber: '',
      otherChargesReason: '',
      thirdPartyPaymentDate: undefined,
      alertToLabprocessTeam: false,
      alertToReportTeam: false,
      alertToTechnicalLead: false,
      remarkComment: '',
      createdAt: '',
      createdBy: '',
      modifiedAt: '',
      modifiedBy: '',
    },
  });

  // Editable fields per user rule (Finance edit modal only)
  const financeEditable = new Set<string>([
    'uniqueId','projectId','invoiceNumber','invoiceAmount','invoiceDate','paymentReceiptAmount','modeOfPayment','utrDetails','balanceAmountReceivedDate','totalAmountReceivedStatus','sampleShipmentAmount','thirdPartyCharges','otherCharges','thirdPartyName','thirdPartyPhone','thirdPartyPaymentStatus','balanceAmount','paymentReceiptDate','transactionalNumber','otherChargesReason','thirdPartyPaymentDate','alertToLabprocessTeam','alertToReportTeam','alertToTechnicalLead','remarkComment'
  ]);

  const updateFinanceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      try {
        console.log('[Finance PUT] Sending PUT to /api/finance-sheet/' + id, 'with updates:', updates);
        const response = await apiRequest('PUT', `/api/finance-sheet/${id}`, updates);
        if (!response.ok) {
          const errorData = await response.text();
          console.error('[Finance PUT] Response not OK:', response.status, errorData);
          throw new Error(`HTTP ${response.status}: ${errorData}`);
        }
        const result = await response.json();
        console.log('[Finance PUT] Success:', result);
        return result;
      } catch (e) {
        console.error('[Finance PUT] Error:', e);
        throw e;
      }
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
    onError: (error: any) => {
      console.error('[Finance PUT onError]', error);
      toast({ title: 'Update failed', description: error.message || 'Failed to update finance record', variant: 'destructive' });
    },
  });

  const deleteFinanceMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      try {
        console.log('[Finance DELETE] Sending DELETE to /api/finance-sheet/' + id);
        const response = await apiRequest('DELETE', `/api/finance-sheet/${id}`);
        if (!response.ok) {
          const errorData = await response.text();
          console.error('[Finance DELETE] Response not OK:', response.status, errorData);
          throw new Error(`HTTP ${response.status}: ${errorData}`);
        }
        const result = await response.json();
        console.log('[Finance DELETE] Success:', result);
        return result;
      } catch (e) {
        console.error('[Finance DELETE] Error:', e);
        throw e;
      }
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
      console.error('[Finance DELETE onError]', error);
      toast({ title: 'Delete failed', description: error.message || 'Failed to delete finance record', variant: 'destructive' });
    }
  });

  const { data: financeStats } = useQuery<any>({
    queryKey: ['/api/finance/stats'],
    queryFn: async () => {
      try {
        console.log('[Finance Stats] Fetching /api/finance/stats');
        const res = await fetch(`/api/finance/stats`);
        if (!res.ok) {
          const errorData = await res.text();
          console.error('[Finance Stats] Response not OK:', res.status, errorData);
          throw new Error(`HTTP ${res.status}: Failed to fetch finance stats`);
        }
        const data = await res.json();
        console.log('[Finance Stats] Success:', data);
        return data;
      } catch (e) {
        console.error('[Finance Stats] Error:', e);
        // Return empty stats on error so UI doesn't break
        return { totalRevenue: 0, pendingPayments: 0, pendingApprovals: 0 };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  const { data: financeData = [], isLoading: isLoadingRecords } = useQuery<any>({
    queryKey: ['/api/finance-sheet'],
    queryFn: async () => {
      try {
        console.log('[Finance GET] Fetching /api/finance-sheet');
        const res = await fetch(`/api/finance-sheet`);
        if (!res.ok) {
          const errorData = await res.text();
          console.error('[Finance GET] Response not OK:', res.status, errorData);
          throw new Error(`HTTP ${res.status}: Failed to fetch finance sheet`);
        }
        const data = await res.json();
        console.log('[Finance GET] Success, received', Array.isArray(data) ? data.length : 'non-array', 'records');
        return data;
      } catch (e) {
        console.error('[Finance GET] Error:', e);
        throw e;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Converted leads removed from Finance view — show only finance_sheet rows
  const convertedLeads: any[] = [];

  const { data: pendingApprovals = [], isLoading } = useQuery<SampleWithLead[]>({
    queryKey: ['/api/finance/pending-approvals'],
    queryFn: async () => {
      try {
        console.log('[Pending Approvals GET] Fetching /api/finance/pending-approvals');
        const res = await fetch('/api/finance/pending-approvals');
        if (!res.ok) {
          const errorData = await res.text();
          console.error('[Pending Approvals GET] Response not OK:', res.status, errorData);
          throw new Error(`HTTP ${res.status}: Failed to fetch pending approvals`);
        }
        const data = await res.json();
        console.log('[Pending Approvals GET] Success, received', Array.isArray(data) ? data.length : 'non-array', 'records');
        return data;
      } catch (e) {
        console.error('[Pending Approvals GET] Error:', e);
        throw e;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
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
  // Column counts for empty-state spanning cells (keeps header visible when no rows)
  // added 1 column for Screenshot/Document
  const PENDING_HEADER_COUNT = 45;
  // Use same header count for finance records so both tables show identical columns
  const FINANCE_HEADER_COUNT = PENDING_HEADER_COUNT;

  // Simple ID / Sample ID search (copied from LabProcessing)
  // Filter pending approvals by search query using 4 fields: Unique ID, Project ID, Patient Name, Phone
  const filteredPendingApprovals = (pendingApprovals || []).filter((s) => {
    if (!financeQuery) return true;
    const q = String(financeQuery).toLowerCase().trim();
    const lead = s.lead || {};
    return (
      (String(s.uniqueId || '')).toLowerCase().includes(q) ||
      (String(s.projectId || (lead as any).projectId || '')).toLowerCase().includes(q) ||
      (String(s.patientClientName || (lead as any).patientClientName || '')).toLowerCase().includes(q) ||
      (String(s.patientClientPhone || (lead as any).patientClientPhone || '')).toLowerCase().includes(q)
    );
  });

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

  // Normalize finance records: convert snake_case to camelCase for display
  const normalizeFinanceRecord = (record: any) => ({
    ...record,
    sampleCollectionDate: record.sampleCollectionDate ?? record.sample_collection_date,
    organisationHospital: record.organisationHospital ?? record.organisation_hospital,
    clinicianResearcherName: record.clinicianResearcherName ?? record.clinician_researcher_name,
    clinicianResearcherEmail: record.clinicianResearcherEmail ?? record.clinician_researcher_email,
    clinicianResearcherPhone: record.clinicianResearcherPhone ?? record.clinician_researcher_phone,
    clinicianResearcherAddress: record.clinicianResearcherAddress ?? record.clinician_researcher_address,
    patientClientName: record.patientClientName ?? record.patient_client_name,
    patientClientEmail: record.patientClientEmail ?? record.patient_client_email,
    patientClientPhone: record.patientClientPhone ?? record.patient_client_phone,
    patientClientAddress: record.patientClientAddress ?? record.patient_client_address,
    serviceName: record.serviceName ?? record.service_name,
    salesResponsiblePerson: record.salesResponsiblePerson ?? record.sales_responsible_person,
    invoiceNumber: record.invoiceNumber ?? record.invoice_number,
    invoiceAmount: record.invoiceAmount ?? record.invoice_amount,
    invoiceDate: record.invoiceDate ?? record.invoice_date,
    paymentReceiptAmount: record.paymentReceiptAmount ?? record.payment_receipt_amount,
    modeOfPayment: record.modeOfPayment ?? record.mode_of_payment,
    utrDetails: record.utrDetails ?? record.utr_details,
    balanceAmountReceivedDate: record.balanceAmountReceivedDate ?? record.balance_amount_received_date,
    totalAmountReceivedStatus: record.totalAmountReceivedStatus ?? record.total_amount_received_status,
    phlebotomistCharges: record.phlebotomistCharges ?? record.phlebotomist_charges,
    sampleShipmentAmount: record.sampleShipmentAmount ?? record.sample_shipment_amount,
    thirdPartyCharges: record.thirdPartyCharges ?? record.third_party_charges,
    otherCharges: record.otherCharges ?? record.other_charges,
    thirdPartyName: record.thirdPartyName ?? record.third_party_name,
    thirdPartyPhone: record.thirdPartyPhone ?? record.third_party_phone,
    thirdPartyPaymentStatus: record.thirdPartyPaymentStatus ?? record.third_party_payment_status,
    balanceAmount: record.balanceAmount ?? record.balance_amount,
    paymentReceiptDate: record.paymentReceiptDate ?? record.payment_receipt_date,
    transactionalNumber: record.transactionalNumber ?? record.transactional_number,
    otherChargesReason: record.otherChargesReason ?? record.other_charges_reason,
    thirdPartyPaymentDate: record.thirdPartyPaymentDate ?? record.third_party_payment_date,
    alertToLabprocessTeam: record.alertToLabprocessTeam ?? record.alert_to_labprocess_team,
    alertToReportTeam: record.alertToReportTeam ?? record.alert_to_report_team,
    alertToTechnicalLead: record.alertToTechnicalLead ?? record.alert_to_technical_lead,
    createdAt: record.createdAt ?? record.created_at,
    createdBy: record.createdBy ?? record.created_by,
    modifiedAt: record.modifiedAt ?? record.modified_at,
    modifiedBy: record.modifiedBy ?? record.modified_by,
    remarkComment: record.remarkComment ?? record.remark_comment,
    screenshotDocument: record.screenshotDocument ?? record.screenshot_document ?? null,
  });

  // Normalize rows: API returns flat array of finance records
  const allFinanceRows: any[] = Array.isArray(financeData)
    ? (financeData as any[]).map(normalizeFinanceRecord)
    : [];

  // Only show finance records (do not include converted leads)
  const combinedFinanceRows = allFinanceRows;

  const filteredFinanceRows = combinedFinanceRows.filter((r) => {
    if (!financeQuery) return true;
    const q = String(financeQuery).toLowerCase().trim();
    
    return (
      (String(r.uniqueId || '')).toLowerCase().includes(q) ||
      (String(r.projectId || r.sample?.projectId || r.sample?.project_id || r.sample?.lead?.projectId || r.sample?.lead?.project_id || '')).toLowerCase().includes(q) ||
      (String(r.patientClientName || r.sample?.lead?.patientClientName || '')).toLowerCase().includes(q) ||
      (String(r.patientClientPhone || r.sample?.lead?.patientClientPhone || '')).toLowerCase().includes(q)
    );
  });

  // Pagination calculations for finance records (client-side)
  const totalFiltered = filteredFinanceRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const start = Math.max(0, (page - 1) * pageSize);
  const visibleRows = filteredFinanceRows.slice(start, start + pageSize);

  // Upload helper for screenshot/document attachments
  const handleFileUpload = async (id: string | number, file: File | null) => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please choose a file to upload', variant: 'destructive' });
      return;
    }
    try {
      const fd = new FormData();
      // Use new categorized API endpoint
      fd.append('file', file);
      console.log('[Finance Upload] Uploading screenshot/document for id', id, file.name);
      
      const res = await fetch(`/api/uploads/categorized?category=Finance_Screenshot_Document&entityType=finance&entityId=${id}`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      console.log('✅ Screenshot/Document uploaded successfully:', {
        filePath: data.filePath,
        uploadId: data.uploadId,
        category: data.category,
        fileSize: data.fileSize
      });
      
      // Update the form field with the new file path
      editForm.setValue('screenshotDocument', data.filePath);
      
      toast({ title: 'Upload successful', description: `File uploaded to ${data.category} folder` });
      queryClient.invalidateQueries({ queryKey: ['/api/finance-sheet'] });
    } catch (e: any) {
      console.error('[Finance Upload] Error', e);
      toast({ title: 'Upload failed', description: e?.message || String(e), variant: 'destructive' });
    }
  };

  // Render attachment link or filename for table cells
  const renderAttachmentLink = (val: any) => {
    if (!val) return '-';
    const str = String(val);
    // Use the new categorized uploads path
    const url = str.startsWith('/') ? str : `/uploads/Finance_Screenshot_Document/${str}`;
    const name = str.split('/').pop() || str;
    return (
      <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{name}</a>
    );
  };

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
            <div className="overflow-x-auto leads-table-wrapper process-table-wrapper">
              {/* Make pending approvals table vertically scrollable with sticky header */}
              <div className="max-h-[50vh] overflow-y-auto">
                <Table className="leads-table">
                  <TableHeader className="sticky top-0 bg-white/95 dark:bg-gray-900/95 z-30 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    <TableRow>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Unique ID</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Project ID</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Sample Collection Date</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Organisation / Hospital</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Clinician / Researcher Name</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Clinician / Researcher Email</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Clinician / Researcher Phone</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Clinician / Researcher Address</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Name</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Email</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Patient / Client Phone</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Patient / Client Address</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Service Name</TableHead>
                      <TableHead className="min-w-[120px] whitespace-nowrap font-semibold">Budget</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Phlebotomist Charges</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Sales / Responsible Person</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Sample Shipment Amount</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Invoice Number</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Invoice Amount</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Invoice Date</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Payment Receipt Amount</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Balance Amount</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Payment Receipt Date</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Mode of Payment</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Transactional Number</TableHead>
                      <TableHead className="min-w-[170px] whitespace-nowrap font-semibold">Balance Amount Received Date</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Total Amount Received Status</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">UTR Details</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Charges</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Other Charges</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Other Charges Reason</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Third Party Name</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Third Party Phone</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Payment Date</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Payment Status</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Alert to Labprocess Team</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Alert to Report Team</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Alert to Technical Lead</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Screenshot/Document</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Created At</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Created By</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Modified At</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Modified By</TableHead>
                      <TableHead className="min-w-[220px] whitespace-nowrap font-semibold">Remark / Comment</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold bg-white dark:bg-gray-900 border-l-2 border-gray-200 dark:border-gray-700 z-[31] actions-column">Actions</TableHead>
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
                          <TableRow key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                            <TableCell className="min-w-[140px] font-medium text-gray-900 dark:text-white">{s.uniqueId ?? s.unique_id ?? '-'}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{s.projectId ?? s.project_id ?? '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.sampleCollectionDate ? new Date(s.sampleCollectionDate).toLocaleDateString() : ((lead as any).sampleCollectionDate ? new Date((lead as any).sampleCollectionDate).toLocaleDateString() : '-')}</TableCell>
                            <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{s.organisationHospital ?? (lead as any).organisationHospital ?? 'N/A'}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.clinicianResearcherName ?? (lead as any).clinicianResearcherName ?? (lead as any).referredDoctor ?? '-'}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.clinicianResearcherEmail ?? (lead as any).clinicianResearcherEmail ?? '-'}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.clinicianResearcherPhone ?? (lead as any).clinicianResearcherPhone ?? (lead as any).phone ?? '-'}</TableCell>
                            <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{s.clinicianResearcherAddress ?? (lead as any).clinicianResearcherAddress ?? (lead as any).location ?? '-'}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.patientClientName ?? (lead as any).patientClientName ?? (lead as any).patientName ?? '-'}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.patientClientEmail ?? (lead as any).patientClientEmail ?? (lead as any).patientEmail ?? '-'}</TableCell>
                            <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{s.patientClientPhone ?? (lead as any).patientClientPhone ?? (lead as any).patientPhone ?? '-'}</TableCell>
                            <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{s.patientClientAddress ?? (lead as any).patientClientAddress ?? (lead as any).patientClientAddress ?? '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.serviceName ?? (lead as any).serviceName ?? '-'}</TableCell>
                            <TableCell className="min-w-[120px] text-gray-900 dark:text-white">{s.budget != null ? `₹${formatINR(Number(s.budget))}` : ((lead as any).budget != null ? `₹${formatINR(Number((lead as any).budget))}` : '-')}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.phlebotomistCharges != null ? `₹${formatINR(Number(s.phlebotomistCharges))}` : ((lead as any).phlebotomistCharges != null ? `₹${formatINR(Number((lead as any).phlebotomistCharges))}` : '-')}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.salesResponsiblePerson ?? (lead as any).salesResponsiblePerson ?? '-'}</TableCell>
                            <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{s.sampleShipmentAmount != null ? `₹${formatINR(Number(s.sampleShipmentAmount))}` : (s.shippingCost != null ? `₹${formatINR(Number(s.shippingCost))}` : '-')}</TableCell>
                            <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{s.invoiceNumber ?? (lead as any).invoiceNumber ?? '-'}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{s.invoiceAmount != null ? `₹${formatINR(Number(s.invoiceAmount))}` : ((lead as any).invoiceAmount != null ? `₹${formatINR(Number((lead as any).invoiceAmount))}` : '-')}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{s.invoiceDate ? new Date(s.invoiceDate).toLocaleDateString() : ((lead as any).invoiceDate ? new Date((lead as any).invoiceDate).toLocaleDateString() : '-')}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.paymentReceivedAmount != null ? `₹${formatINR(Number(s.paymentReceivedAmount))}` : ((lead as any).paymentReceivedAmount != null ? `₹${formatINR(Number((lead as any).paymentReceivedAmount))}` : '-')}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{!isNaN(balance) ? `₹${formatINR(Number(balance))}` : '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.paymentReceivedDate ? new Date(s.paymentReceivedDate).toLocaleDateString() : ((lead as any).paymentReceivedDate ? new Date((lead as any).paymentReceivedDate).toLocaleDateString() : '-')}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{s.paymentMethod ?? (lead as any).paymentMethod ?? '-'}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{s.transactionNumber ?? s.utrDetails ?? (lead as any).transactionNumber ?? (lead as any).utrDetails ?? '-'}</TableCell>
                            <TableCell className="min-w-[170px] text-gray-900 dark:text-white">{s.balanceAmountReceivedDate ? new Date(s.balanceAmountReceivedDate).toLocaleDateString() : ((lead as any).balanceAmountReceivedDate ? new Date((lead as any).balanceAmountReceivedDate).toLocaleDateString() : '-')}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.totalPaymentReceivedStatus ?? (lead as any).totalPaymentReceivedStatus ?? '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.utrDetails ?? (lead as any).utrDetails ?? '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.thirdPartyCharges != null ? `₹${formatINR(Number(s.thirdPartyCharges))}` : ((lead as any).thirdPartyCharges != null ? `₹${formatINR(Number((lead as any).thirdPartyCharges))}` : '-')}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.otherCharges != null ? `₹${formatINR(Number(s.otherCharges))}` : ((lead as any).otherCharges != null ? `₹${formatINR(Number((lead as any).otherCharges))}` : '-')}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.otherChargesReason ?? (lead as any).otherChargesReason ?? '-'}</TableCell>
                            <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{s.thirdPartyName ?? (lead as any).thirdPartyName ?? '-'}</TableCell>
                            <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{s.thirdPartyPhone ?? (lead as any).thirdPartyPhone ?? '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.thirdPartyPaymentDate ? new Date(s.thirdPartyPaymentDate).toLocaleDateString() : ((lead as any).thirdPartyPaymentDate ? new Date((lead as any).thirdPartyPaymentDate).toLocaleDateString() : '-')}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.thirdPartyPaymentStatus ?? (lead as any).thirdPartyPaymentStatus ?? '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.approveToLabProcess ? 'Yes' : ((lead as any).approveToLabProcess ? 'Yes' : 'No')}</TableCell>
                            <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{s.approveToReportProcess ? 'Yes' : ((lead as any).approveToReportProcess ? 'Yes' : 'No')}</TableCell>
                            <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{s.approveToTechnicalLead ? 'Yes' : ((lead as any).approveToTechnicalLead ? 'Yes' : 'No')}</TableCell>
                            <TableCell className="min-w-[140px] text-gray-900 dark:text-white">
                              {renderAttachmentLink(s.screenshotDocument ?? s.screenshot_document)}
                            </TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.createdAt ? new Date(s.createdAt).toLocaleString() : '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.createdBy ?? (lead as any).createdBy ?? '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.modifiedAt ? new Date(s.modifiedAt).toLocaleString() : '-'}</TableCell>
                            <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{s.modifiedBy ?? (lead as any).modifiedBy ?? '-'}</TableCell>
                            <TableCell className="min-w-[220px] text-gray-900 dark:text-white">{s.remark_comment ?? s.comments ?? s.notes ?? s.remarks ?? (lead as any).comments ?? (lead as any).remarks ?? '-'}</TableCell>
                            <TableCell className="min-w-[150px] bg-white dark:bg-gray-900 border-l-2 border-gray-200 dark:border-gray-700 z-[5] overflow-visible p-0 actions-column">
                              <div className="action-buttons flex items-center space-x-2 h-full bg-white dark:bg-gray-900 px-2 py-1">
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setSelectedRecord(s);
                                  setIsEditDialogOpen(true);
                                }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                  setSelectedRecord(s);
                                  setIsEditDialogOpen(true);
                                  // prefill edit form with all 42-column fields
                                  editForm.reset({
                                    uniqueId: s.uniqueId ?? (s.lead as any)?.uniqueId ?? '',
                                    projectId: s.projectId ?? (s.lead as any)?.projectId ?? '',
                                    dateSampleCollected: s.dateSampleCollected ?? (s.lead as any)?.dateSampleCollected ?? '',
                                    organization: s.organization ?? (s.lead as any)?.organization ?? '',
                                    clinician: s.clinician ?? (s.lead as any)?.clinician ?? '',
                                    city: s.city ?? (s.lead as any)?.city ?? '',
                                    patientName: s.patientName ?? (s.lead as any)?.patientName ?? '',
                                    patientEmail: s.patientEmail ?? (s.lead as any)?.patientEmail ?? '',
                                    patientPhone: s.patientPhone ?? (s.lead as any)?.patientPhone ?? '',
                                    patientClientAddress: s.patientClientAddress ?? (s.lead as any)?.patientClientAddress ?? '',
                                    serviceName: s.serviceName ?? (s.lead as any)?.serviceName ?? '',
                                    budget: s.budget ?? (s.lead as any)?.budget ?? '',
                                    salesResponsiblePerson: s.salesResponsiblePerson ?? (s.lead as any)?.salesResponsiblePerson ?? '',
                                    invoiceNumber: s.invoiceNumber ?? (s.lead as any)?.invoiceNumber ?? '',
                                    invoiceAmount: s.invoiceAmount ?? (s.lead as any)?.invoiceAmount ?? '',
                                    invoiceDate: s.invoiceDate ?? (s.lead as any)?.invoiceDate ?? '',
                                    paymentReceivedAmount: s.paymentReceivedAmount ?? (s.lead as any)?.paymentReceivedAmount ?? '',
                                    paymentMethod: s.paymentMethod ?? (s.lead as any)?.paymentMethod ?? '',
                                    utrDetails: s.utrDetails ?? (s.lead as any)?.utrDetails ?? '',
                                    balanceAmountReceivedDate: s.balanceAmountReceivedDate ?? (s.lead as any)?.balanceAmountReceivedDate ?? '',
                                    totalPaymentReceivedStatus: s.totalPaymentReceivedStatus ?? (s.lead as any)?.totalPaymentReceivedStatus ?? '',
                                    phlebotomistCharges: s.phlebotomistCharges ?? (s.lead as any)?.phlebotomistCharges ?? '',
                                    sampleShipmentAmount: s.sampleShipmentAmount ?? (s.lead as any)?.sampleShipmentAmount ?? '',
                                    thirdPartyCharges: s.thirdPartyCharges ?? (s.lead as any)?.thirdPartyCharges ?? '',
                                    otherCharges: s.otherCharges ?? (s.lead as any)?.otherCharges ?? '',
                                    thirdPartyName: s.thirdPartyName ?? (s.lead as any)?.thirdPartyName ?? '',
                                    thirdPartyContractDetails: s.thirdPartyContractDetails ?? (s.lead as any)?.thirdPartyContractDetails ?? '',
                                    thirdPartyPaymentStatus: s.thirdPartyPaymentStatus ?? (s.lead as any)?.thirdPartyPaymentStatus ?? '',
                                    balanceAmount: s.balanceAmount ?? (s.lead as any)?.balanceAmount ?? '',
                                    paymentReceiptDate: s.paymentReceiptDate ?? (s.lead as any)?.paymentReceiptDate ?? '',
                                    transactionalNumber: s.transactionalNumber ?? (s.lead as any)?.transactionalNumber ?? '',
                                    otherChargesReason: s.otherChargesReason ?? (s.lead as any)?.otherChargesReason ?? '',
                                    thirdPartyPhone: s.thirdPartyPhone ?? (s.lead as any)?.thirdPartyPhone ?? '',
                                    thirdPartyPaymentDate: s.thirdPartyPaymentDate ?? (s.lead as any)?.thirdPartyPaymentDate ?? '',
                                    approveToLabProcess: s.approveToLabProcess ?? (s.lead as any)?.approveToLabProcess ?? '',
                                    approveToReportProcess: s.approveToReportProcess ?? (s.lead as any)?.approveToReportProcess ?? '',
                                    approveToTechnicalLead: s.approveToTechnicalLead ?? (s.lead as any)?.approveToTechnicalLead ?? '',
                                    remarkComment: s.remark_comment ?? (s.lead as any)?.remark_comment ?? '',
                                    createdAt: s.created_at ?? s.createdAt ?? (s.lead as any)?.createdAt ?? '',
                                    createdBy: s.created_by ?? s.createdBy ?? (s.lead as any)?.createdBy ?? '',
                                    modifiedAt: s.modified_at ?? s.modifiedAt ?? (s.lead as any)?.modifiedAt ?? '',
                                    modifiedBy: s.modified_by ?? s.modifiedBy ?? (s.lead as any)?.modifiedBy ?? '',
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
            ['invoiceAmount','paymentReceiptAmount','phlebotomistCharges','sampleShipmentAmount','thirdPartyCharges','otherCharges'].forEach(k => {
              if (updates[k] != null) updates[k] = String(updates[k]);
            });

            // Convert date/datetime fields safely (HTML date/datetime-local inputs are YYYY-MM-DD or YYYY-MM-DDTHH:MM)
            const dateFields = [
              'sampleCollectionDate',
              'invoiceDate',
              'paymentReceiptDate',
              'balanceAmountReceivedDate',
              'thirdPartyPaymentDate'
            ];
            const datetimeFields = [
              'createdAt',
              'modifiedAt'
            ];

            const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            const isoLikeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/;

            const pad = (n: number) => n.toString().padStart(2, '0');

            // Convert DATE fields (keep as YYYY-MM-DD)
            dateFields.forEach(field => {
              const raw = updates[field];
              if (!raw || typeof raw !== 'string') return;
              if (dateRegex.test(raw)) return;
              if (datetimeLocalRegex.test(raw)) {
                updates[field] = raw.split('T')[0];
                return;
              }
              if (isoLikeRegex.test(raw) || raw.includes('Z')) {
                const parsed = Date.parse(raw);
                if (!isNaN(parsed)) {
                  const d = new Date(parsed);
                  updates[field] = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
                  return;
                }
                delete updates[field];
                return;
              }
            });

            // Convert DATETIME fields (convert to YYYY-MM-DD HH:MM:SS)
            datetimeFields.forEach(field => {
              const raw = updates[field];
              if (!raw || typeof raw !== 'string') return;
              if (datetimeLocalRegex.test(raw)) {
                updates[field] = raw.replace('T', ' ') + ':00';
                return;
              }
              if (isoLikeRegex.test(raw) || raw.includes('Z')) {
                const parsed = Date.parse(raw);
                if (!isNaN(parsed)) {
                  const d = new Date(parsed);
                  updates[field] = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                  return;
                }
                delete updates[field];
                return;
              }
            });

            // Remove empty-string and null values so server won't receive "" for date fields
            Object.keys(updates).forEach(k => {
              const v = updates[k];
              if (v === '' || v === null || v === undefined) {
                delete updates[k];
              }
            });

            console.log('[Finance Edit] Submitting updates:', updates);
            updateFinanceMutation.mutate({ id: selectedRecord.id, updates });
          })} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sampleCollectionDate">Sample Collection Date</Label>
                <Input id="sampleCollectionDate" type="date" {...editForm.register('sampleCollectionDate')} disabled={!financeEditable.has('sampleCollectionDate')} />
              </div>
              <div>
                <Label htmlFor="organisationHospital">Organisation / Hospital</Label>
                <Input id="organisationHospital" {...editForm.register('organisationHospital')} disabled={!financeEditable.has('organisationHospital')} />
              </div>
              <div>
                <Label htmlFor="clinicianResearcherName">Clinician / Researcher Name</Label>
                <Input id="clinicianResearcherName" {...editForm.register('clinicianResearcherName')} disabled={!financeEditable.has('clinicianResearcherName')} />
              </div>
              <div>
                <Label htmlFor="clinicianResearcherEmail">Clinician / Researcher Email</Label>
                <Input id="clinicianResearcherEmail" type="email" {...editForm.register('clinicianResearcherEmail')} disabled={!financeEditable.has('clinicianResearcherEmail')} />
              </div>
              <div>
                <Label htmlFor="clinicianResearcherPhone">Clinician / Researcher Phone</Label>
                <Input id="clinicianResearcherPhone" {...editForm.register('clinicianResearcherPhone')} disabled={!financeEditable.has('clinicianResearcherPhone')} />
              </div>
              <div>
                <Label htmlFor="clinicianResearcherAddress">Clinician / Researcher Address</Label>
                <Input id="clinicianResearcherAddress" {...editForm.register('clinicianResearcherAddress')} disabled={!financeEditable.has('clinicianResearcherAddress')} />
              </div>
              <div>
                <Label htmlFor="patientClientName">Patient / Client Name</Label>
                <Input id="patientClientName" {...editForm.register('patientClientName')} disabled={!financeEditable.has('patientClientName')} />
              </div>
              <div>
                <Label htmlFor="patientClientEmail">Patient / Client Email</Label>
                <Input id="patientClientEmail" type="email" {...editForm.register('patientClientEmail')} disabled={!financeEditable.has('patientClientEmail')} />
              </div>
              <div>
                <Label htmlFor="patientClientPhone">Patient / Client Phone</Label>
                <Input id="patientClientPhone" {...editForm.register('patientClientPhone')} disabled={!financeEditable.has('patientClientPhone')} />
              </div>
              <div>
                <Label htmlFor="patientClientAddress">Patient / Client Address</Label>
                <Input id="patientClientAddress" {...editForm.register('patientClientAddress')} disabled={!financeEditable.has('patientClientAddress')} />
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
                <Label htmlFor="phlebotomistCharges">Phlebotomist Charges</Label>
                <Input id="phlebotomistCharges" {...editForm.register('phlebotomistCharges')} disabled={!financeEditable.has('phlebotomistCharges')} />
              </div>
              <div>
                <Label htmlFor="salesResponsiblePerson">Sales / Responsible Person</Label>
                <Input id="salesResponsiblePerson" {...editForm.register('salesResponsiblePerson')} disabled={!financeEditable.has('salesResponsiblePerson')} />
              </div>
              <div>
                <Label htmlFor="sampleShipmentAmount">Sample Shipment Amount</Label>
                <Input id="sampleShipmentAmount" {...editForm.register('sampleShipmentAmount')} disabled={!financeEditable.has('sampleShipmentAmount')} />
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
                <Label htmlFor="paymentReceiptAmount">Payment Receipt Amount</Label>
                <Input id="paymentReceiptAmount" {...editForm.register('paymentReceiptAmount')} disabled={!financeEditable.has('paymentReceiptAmount')} />
              </div>
              <div>
                <Label htmlFor="balanceAmount">Balance Amount</Label>
                <Input id="balanceAmount" {...editForm.register('balanceAmount')} disabled={!financeEditable.has('balanceAmount')} />
              </div>
              <div>
                <Label htmlFor="paymentReceiptDate">Payment Receipt Date</Label>
                <Input id="paymentReceiptDate" type="date" {...editForm.register('paymentReceiptDate')} disabled={!financeEditable.has('paymentReceiptDate')} />
              </div>
              <div>
                <Label htmlFor="modeOfPayment">Mode of Payment</Label>
                <Input id="modeOfPayment" {...editForm.register('modeOfPayment')} disabled={!financeEditable.has('modeOfPayment')} />
              </div>
              <div>
                <Label htmlFor="transactionalNumber">Transactional Number</Label>
                <Input id="transactionalNumber" {...editForm.register('transactionalNumber')} disabled={!financeEditable.has('transactionalNumber')} />
              </div>
              <div>
                <Label htmlFor="balanceAmountReceivedDate">Balance Amount Received Date</Label>
                <Input id="balanceAmountReceivedDate" type="date" {...editForm.register('balanceAmountReceivedDate')} disabled={!financeEditable.has('balanceAmountReceivedDate')} />
              </div>
              <div>
                <Label htmlFor="totalAmountReceivedStatus">Total Amount Received Status</Label>
                <Input id="totalAmountReceivedStatus" {...editForm.register('totalAmountReceivedStatus')} disabled={!financeEditable.has('totalAmountReceivedStatus')} />
              </div>
              <div>
                <Label htmlFor="utrDetails">UTR Details</Label>
                <Input id="utrDetails" {...editForm.register('utrDetails')} disabled={!financeEditable.has('utrDetails')} />
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
                <Label htmlFor="otherChargesReason">Other Charges Reason</Label>
                <Input id="otherChargesReason" {...editForm.register('otherChargesReason')} disabled={!financeEditable.has('otherChargesReason')} />
              </div>
              <div>
                <Label htmlFor="thirdPartyName">Third Party Name</Label>
                <Input id="thirdPartyName" {...editForm.register('thirdPartyName')} disabled={!financeEditable.has('thirdPartyName')} />
              </div>
              <div>
                <Label htmlFor="thirdPartyPhone">Third Party Phone</Label>
                <Input id="thirdPartyPhone" {...editForm.register('thirdPartyPhone')} disabled={!financeEditable.has('thirdPartyPhone')} />
              </div>
              <div>
                <Label htmlFor="thirdPartyPaymentDate">Third Party Payment Date</Label>
                <Input id="thirdPartyPaymentDate" type="date" {...editForm.register('thirdPartyPaymentDate')} disabled={!financeEditable.has('thirdPartyPaymentDate')} />
              </div>
              <div>
                <Label htmlFor="thirdPartyPaymentStatus">Third Party Payment Status</Label>
                <Input id="thirdPartyPaymentStatus" {...editForm.register('thirdPartyPaymentStatus')} disabled={!financeEditable.has('thirdPartyPaymentStatus')} />
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="alertToLabprocessTeam_edit" checked={editForm.watch('alertToLabprocessTeam')} onCheckedChange={(checked) => editForm.setValue('alertToLabprocessTeam', checked as boolean)} disabled={!financeEditable.has('alertToLabprocessTeam')} />
                <Label htmlFor="alertToLabprocessTeam_edit">Alert to Labprocess Team</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="alertToReportTeam_edit" checked={editForm.watch('alertToReportTeam')} onCheckedChange={(checked) => editForm.setValue('alertToReportTeam', checked as boolean)} disabled={!financeEditable.has('alertToReportTeam')} />
                <Label htmlFor="alertToReportTeam_edit">Alert to Report Team</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="alertToTechnicalLead_edit" checked={editForm.watch('alertToTechnicalLead')} onCheckedChange={(checked) => editForm.setValue('alertToTechnicalLead', checked as boolean)} disabled={!financeEditable.has('alertToTechnicalLead')} />
                <Label htmlFor="alertToTechnicalLead_edit">Alert to Technical Lead</Label>
              </div>
              <div>
                <Label htmlFor="screenshotFile">Screenshot/Document</Label>
                <input id="screenshotFile" type="file" accept="image/*,application/pdf" className="mt-1 block w-full text-sm text-gray-700" onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (!f) return;
                  if (!selectedRecord) {
                    toast({ title: 'No record selected', description: 'Open a record before uploading', variant: 'destructive' });
                    return;
                  }
                  handleFileUpload(selectedRecord.id, f);
                }} />
              </div>
              <div>
                <Label htmlFor="createdAt">Created At</Label>
                <Input id="createdAt" type="datetime-local" {...editForm.register('createdAt')} disabled={!financeEditable.has('createdAt')} />
              </div>
              <div>
                <Label htmlFor="createdBy">Created By</Label>
                <Input id="createdBy" {...editForm.register('createdBy')} disabled={!financeEditable.has('createdBy')} />
              </div>
              <div>
                <Label htmlFor="modifiedAt">Modified At</Label>
                <Input id="modifiedAt" type="datetime-local" {...editForm.register('modifiedAt')} disabled={!financeEditable.has('modifiedAt')} />
              </div>
              <div>
                <Label htmlFor="modifiedBy">Modified By</Label>
                <Input id="modifiedBy" {...editForm.register('modifiedBy')} disabled={!financeEditable.has('modifiedBy')} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="remarkComment">Remark / Comment</Label>
                <Textarea id="remarkComment" {...editForm.register('remarkComment')} disabled={!financeEditable.has('remarkComment')} />
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
                placeholder="Search Unique ID / Project ID / Patient Name / Phone" 
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
              <div className="overflow-x-auto leads-table-wrapper process-table-wrapper">
                {/* Make finance records table vertically scrollable with sticky header */}
                <div className="max-h-[60vh] overflow-y-auto">
                  <Table className="leads-table">
                    <TableHeader className="sticky top-0 bg-white/95 dark:bg-gray-900/95 z-30 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    <TableRow>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Unique ID</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Project ID</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Sample Collection Date</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Organisation / Hospital</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Clinician / Researcher Name</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Clinician / Researcher Email</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Clinician / Researcher Phone</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Clinician / Researcher Address</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Name</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Patient / Client Email</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Patient / Client Phone</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Patient / Client Address</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Service Name</TableHead>
                      <TableHead className="min-w-[120px] whitespace-nowrap font-semibold">Budget</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Phlebotomist Charges</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Sales / Responsible Person</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Sample Shipment Amount</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Invoice Number</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Invoice Amount</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Invoice Date</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Payment Receipt Amount</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Balance Amount</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Payment Receipt Date</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Mode of Payment</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Transactional Number</TableHead>
                      <TableHead className="min-w-[170px] whitespace-nowrap font-semibold">Balance Amount Received Date</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Total Amount Received Status</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">UTR Details</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Charges</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Other Charges</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Other Charges Reason</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Third Party Name</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Third Party Phone</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Payment Date</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Third Party Payment Status</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Alert to Labprocess Team</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Alert to Report Team</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap font-semibold">Alert to Technical Lead</TableHead>
                      <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">Screenshot/Document</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Created At</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Created By</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Modified At</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap font-semibold">Modified By</TableHead>
                      <TableHead className="min-w-[220px] whitespace-nowrap font-semibold">Remark / Comment</TableHead>
                      <TableHead className="min-w-[150px] whitespace-nowrap font-semibold bg-white dark:bg-gray-900 border-l-2 border-gray-200 dark:border-gray-700 z-[31] actions-column">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredFinanceRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={FINANCE_HEADER_COUNT} className="text-center py-8 text-gray-500 dark:text-gray-400">No finance records match your search</TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((record: any) => {
                      const projectIdDisplay = record.projectId ?? record.project_id ?? record.sample?.projectId ?? record.sample?.project_id ?? record.sample?.lead?.projectId ?? record.sample?.lead?.project_id ?? record.sample?.lead?.id ?? 'N/A';
                      const uniqueIdDisplay = record.uniqueId ?? (record as any).unique_id ?? record.sample?.lead?.id ?? '-';
                      return (
                      <TableRow key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                        <TableCell className="min-w-[140px] font-medium text-gray-900 dark:text-white">{uniqueIdDisplay}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{projectIdDisplay}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.sampleCollectionDate ? new Date(record.sampleCollectionDate).toLocaleDateString() : (record.sample?.lead?.sampleCollectionDate ? new Date(record.sample.lead.sampleCollectionDate).toLocaleDateString() : '-')}</TableCell>
                        <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{(record.organisationHospital ?? record.sample?.lead?.organisationHospital) || 'N/A'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.clinicianResearcherName ?? record.sample?.lead?.clinicianResearcherName ?? record.sample?.lead?.referredDoctor ?? '-'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.clinicianResearcherEmail ?? record.sample?.lead?.clinicianResearcherEmail ?? '-'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.clinicianResearcherPhone ?? record.sample?.lead?.clinicianResearcherPhone ?? record.sample?.lead?.phone ?? '-'}</TableCell>
                        <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{record.clinicianResearcherAddress ?? record.sample?.lead?.clinicianResearcherAddress ?? record.sample?.lead?.location ?? '-'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.patientClientName ?? record.sample?.lead?.patientClientName ?? '-'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.patientClientEmail ?? record.sample?.lead?.patientClientEmail ?? '-'}</TableCell>
                        <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{record.patientClientPhone ?? record.sample?.lead?.patientClientPhone ?? '-'}</TableCell>
                        <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{record.patientClientAddress ?? record.sample?.lead?.patientClientAddress ?? '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.serviceName ?? record.sample?.lead?.serviceName ?? '-'}</TableCell>
                        <TableCell className="min-w-[120px] text-gray-900 dark:text-white">{record.budget != null ? `₹${formatINR(Number(record.budget))}` : (record.sample?.lead?.budget != null ? `₹${formatINR(Number(record.sample.lead.budget))}` : '-')}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.phlebotomistCharges != null ? `₹${formatINR(Number(record.phlebotomistCharges))}` : (record.sample?.lead?.phlebotomistCharges != null ? `₹${formatINR(Number(record.sample.lead.phlebotomistCharges))}` : '-')}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.salesResponsiblePerson ?? record.sample?.lead?.salesResponsiblePerson ?? '-'}</TableCell>
                        <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{record.sampleShipmentAmount != null ? `₹${formatINR(Number(record.sampleShipmentAmount))}` : (record.sample?.lead?.sampleShipmentAmount != null ? `₹${formatINR(Number(record.sample.lead.sampleShipmentAmount))}` : '-')}</TableCell>
                        <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{record.invoiceNumber ?? '-'}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{record.invoiceAmount != null ? `₹${formatINR(Number(record.invoiceAmount))}` : '-'}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{record.invoiceDate ? new Date(record.invoiceDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.paymentReceiptAmount != null ? `₹${formatINR(Number(record.paymentReceiptAmount))}` : '-'}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{record.balanceAmount != null ? `₹${formatINR(Number(record.balanceAmount))}` : '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.paymentReceiptDate ? new Date(record.paymentReceiptDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{record.modeOfPayment || '-'}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">{record.utrDetails ?? '-'}</TableCell>
                        <TableCell className="min-w-[170px] text-gray-900 dark:text-white">{record.balanceAmountReceivedDate ? new Date(record.balanceAmountReceivedDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.totalAmountReceivedStatus ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.thirdPartyCharges != null ? `₹${formatINR(Number(record.thirdPartyCharges))}` : '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.otherCharges != null ? `₹${formatINR(Number(record.otherCharges))}` : '-'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.otherChargesReason ?? '-'}</TableCell>
                        <TableCell className="min-w-[180px] text-gray-900 dark:text-white">{record.thirdPartyName ?? '-'}</TableCell>
                        <TableCell className="min-w-[150px] text-gray-900 dark:text-white">{record.thirdPartyPhone ?? '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.thirdPartyPaymentDate ? new Date(record.thirdPartyPaymentDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.thirdPartyPaymentStatus ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.alertToLabprocessTeam ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{record.alertToReportTeam ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="min-w-[200px] text-gray-900 dark:text-white">{record.alertToTechnicalLead ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="min-w-[140px] text-gray-900 dark:text-white">
                          {renderAttachmentLink(record.screenshotDocument ?? record.screenshot_document)}
                        </TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{(record.createdAt ?? record.created_at) ? new Date(record.createdAt ?? record.created_at).toLocaleString() : '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.createdBy ?? record.created_by ?? '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{(record.modifiedAt ?? record.modified_at) ? new Date(record.modifiedAt ?? record.modified_at).toLocaleString() : '-'}</TableCell>
                        <TableCell className="min-w-[160px] text-gray-900 dark:text-white">{record.modifiedBy ?? record.modified_by ?? '-'}</TableCell>
                        <TableCell className="min-w-[220px] text-gray-900 dark:text-white max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">{record.remarkComment ?? record.remark_comment ?? record.comments ?? record.remarks ?? '-'}</TableCell>
                        <TableCell className="min-w-[150px] bg-white dark:bg-gray-900 border-l-2 border-gray-200 dark:border-gray-700 z-[5] overflow-visible p-0 actions-column">
                          <div className="action-buttons flex space-x-1 items-center justify-center h-full bg-white dark:bg-gray-900 px-2 py-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg flex items-center justify-center"
                            aria-label="Edit finance record"
                            onClick={() => {
                            setSelectedRecord(record);
                            editForm.reset({
                              uniqueId: record.uniqueId ?? '',
                              projectId: record.projectId ?? '',
                              sampleCollectionDate: record.sampleCollectionDate ? new Date(record.sampleCollectionDate).toISOString().slice(0,10) : (record.sample?.lead?.sampleCollectionDate ? new Date(record.sample.lead.sampleCollectionDate).toISOString().slice(0,10) : undefined),
                              organisationHospital: record.organisationHospital ?? record.sample?.lead?.organisationHospital ?? '',
                              clinicianResearcherName: record.clinicianResearcherName ?? record.sample?.lead?.clinicianResearcherName ?? '',
                              clinicianResearcherEmail: record.clinicianResearcherEmail ?? record.sample?.lead?.clinicianResearcherEmail ?? '',
                              clinicianResearcherPhone: record.clinicianResearcherPhone ?? record.sample?.lead?.clinicianResearcherPhone ?? '',
                              clinicianResearcherAddress: record.clinicianResearcherAddress ?? record.sample?.lead?.clinicianResearcherAddress ?? '',
                              patientClientName: record.patientClientName ?? record.sample?.lead?.patientClientName ?? '',
                              patientClientEmail: record.patientClientEmail ?? record.sample?.lead?.patientClientEmail ?? '',
                              patientClientPhone: record.patientClientPhone ?? record.sample?.lead?.patientClientPhone ?? '',
                              patientClientAddress: record.patientClientAddress ?? record.sample?.lead?.patientClientAddress ?? '',
                              serviceName: record.serviceName ?? record.sample?.lead?.serviceName ?? '',
                              budget: record.budget ?? record.sample?.lead?.budget ?? '',
                              salesResponsiblePerson: record.salesResponsiblePerson ?? record.sample?.lead?.salesResponsiblePerson ?? '',
                              invoiceNumber: record.invoiceNumber ?? '',
                              invoiceAmount: record.invoiceAmount ?? '',
                              invoiceDate: record.invoiceDate ? new Date(record.invoiceDate).toISOString().slice(0,10) : undefined,
                              paymentReceiptAmount: record.paymentReceiptAmount ?? '',
                              modeOfPayment: record.modeOfPayment ?? '',
                              utrDetails: record.utrDetails ?? '',
                              balanceAmountReceivedDate: record.balanceAmountReceivedDate ? new Date(record.balanceAmountReceivedDate).toISOString().slice(0,10) : undefined,
                              totalAmountReceivedStatus: record.totalAmountReceivedStatus ?? false,
                              phlebotomistCharges: record.phlebotomistCharges ?? record.sample?.lead?.phlebotomistCharges ?? '',
                              sampleShipmentAmount: record.sampleShipmentAmount ?? record.sample?.lead?.sampleShipmentAmount ?? '',
                              thirdPartyCharges: record.thirdPartyCharges ?? '',
                              otherCharges: record.otherCharges ?? '',
                              thirdPartyName: record.thirdPartyName ?? '',
                              thirdPartyPhone: record.thirdPartyPhone ?? '',
                              thirdPartyPaymentStatus: record.thirdPartyPaymentStatus ?? false,
                              balanceAmount: record.balanceAmount ?? '',
                              paymentReceiptDate: record.paymentReceiptDate ? new Date(record.paymentReceiptDate).toISOString().slice(0,10) : undefined,
                              transactionalNumber: record.transactionalNumber ?? record.transactionNumber ?? '',
                              otherChargesReason: record.otherChargesReason ?? '',
                              thirdPartyPaymentDate: record.thirdPartyPaymentDate ? new Date(record.thirdPartyPaymentDate).toISOString().slice(0,10) : undefined,
                              alertToLabprocessTeam: record.alertToLabprocessTeam ?? false,
                              alertToReportTeam: record.alertToReportTeam ?? false,
                              alertToTechnicalLead: record.alertToTechnicalLead ?? false,
                              remarkComment: record.remarkComment ?? '',
                              createdAt: record.createdAt ? new Date(record.createdAt).toISOString().slice(0, 16) : '',
                              createdBy: record.createdBy ?? '',
                              modifiedAt: record.modifiedAt ? new Date(record.modifiedAt).toISOString().slice(0, 16) : '',
                              modifiedBy: record.modifiedBy ?? '',
                            });
                            setIsEditDialogOpen(true);
                          }}>
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Delete finance record" onClick={() => {
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
              
              {/* Pagination Controls */}
              {totalFiltered > 0 && (
                <div className="p-4 border-t">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Showing {totalFiltered === 0 ? 0 : (start + 1)} - {Math.min(start + pageSize, totalFiltered)} of {totalFiltered}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
