// normalizeFinanceRow.ts
// Maps a FinanceRecordWithSample (server shape) to a stable UI shape used by FinanceManagement
export default function normalizeFinanceRow(rec: any) {
  // defensive getters for snake_case / camelCase variants
  const get = (k1: string, k2?: string) => rec[k1] ?? rec[k2 ?? ''];
  const fr = rec;
  const sample = rec.sample ?? null;
  const lead = sample?.lead ?? rec.lead ?? null;

  return {
    id: fr.id,
  titleUniqueId: fr.titleUniqueId ?? fr.title_unique_id ?? lead?.id ?? null,
    sampleId: fr.sampleId ?? fr.sample_id ?? sample?.sampleId ?? sample?.sample_id ?? null,
    dateSampleCollected: fr.dateSampleCollected ?? fr.date_sample_collected ?? sample?.sampleCollectedDate ?? sample?.sample_collected_date ?? null,
    organization: fr.organization ?? lead?.organization ?? sample?.organization ?? null,
    clinician: fr.clinician ?? lead?.clinicianName ?? lead?.clinician_name ?? null,
    city: fr.city ?? lead?.location ?? null,
    patientName: fr.patientName ?? fr.patient_name ?? lead?.patientClientName ?? lead?.patient_client_name ?? null,
    patientEmail: fr.patientEmail ?? fr.patient_email ?? lead?.patientClientEmail ?? lead?.patient_client_email ?? null,
    patientPhone: fr.patientPhone ?? fr.patient_phone ?? lead?.patientClientPhone ?? lead?.patient_client_phone ?? null,
    serviceName: fr.serviceName ?? fr.service_name ?? lead?.serviceName ?? lead?.service_name ?? null,
    budget: fr.budget ?? lead?.budget ?? null,
    salesResponsiblePerson: fr.salesResponsiblePerson ?? fr.sales_responsible_person ?? lead?.salesResponsiblePerson ?? lead?.sales_responsible_person ?? null,

    invoiceNumber: fr.invoiceNumber ?? fr.invoice_number ?? null,
    invoiceAmount: fr.invoiceAmount ?? fr.invoice_amount ?? fr.amount ?? fr.totalAmount ?? fr.total_amount ?? null,
    amount: fr.amount ?? fr.invoiceAmount ?? fr.invoice_amount ?? null,
    taxAmount: fr.taxAmount ?? fr.tax_amount ?? null,
    totalAmount: fr.totalAmount ?? fr.total_amount ?? fr.invoiceAmount ?? fr.invoice_amount ?? null,
    invoiceDate: fr.invoiceDate ?? fr.invoice_date ?? null,
    paymentReceivedAmount: fr.paymentReceivedAmount ?? fr.payment_received_amount ?? null,
    paidAmount: fr.paidAmount ?? fr.paid_amount ?? fr.paymentReceivedAmount ?? fr.payment_received_amount ?? null,
    paymentMethod: fr.paymentMethod ?? fr.payment_method ?? null,
    paymentStatus: fr.paymentStatus ?? fr.payment_status ?? null,
    utrDetails: fr.utrDetails ?? fr.utr_details ?? null,
    balanceAmountReceivedDate: fr.balanceAmountReceivedDate ?? fr.balance_amount_received_date ?? null,
    paymentDate: fr.paymentDate ?? fr.payment_date ?? null,
    totalPaymentReceivedStatus: fr.totalPaymentReceivedStatus ?? fr.total_payment_received_status ?? null,

    phlebotomistCharges: fr.phlebotomistCharges ?? fr.phlebotomist_charges ?? null,
    sampleShipmentAmount: fr.sampleShipmentAmount ?? fr.sample_shipment_amount ?? sample?.shippingCost ?? sample?.shipping_cost ?? null,
    thirdPartyCharges: fr.thirdPartyCharges ?? fr.third_party_charges ?? null,
    otherCharges: fr.otherCharges ?? fr.other_charges ?? null,
    thirdPartyName: fr.thirdPartyName ?? fr.third_party_name ?? sample?.thirdPartyName ?? null,
    thirdPartyContractDetails: fr.thirdPartyContractDetails ?? fr.third_party_contract_details ?? sample?.thirdPartyContractDetails ?? null,
    thirdPartyPaymentStatus: fr.thirdPartyPaymentStatus ?? fr.third_party_payment_status ?? null,

    progenicsTrf: fr.progenicsTrf ?? fr.progenics_trf ?? lead?.progenicsTRF ?? null,
    approveToLabProcess: fr.approveToLabProcess ?? fr.approve_to_lab_process ?? false,
    approveToReportProcess: fr.approveToReportProcess ?? fr.approve_to_report_process ?? false,

    createdAt: fr.createdAt ?? fr.created_at ?? null,
    _raw: rec,
  };
}
