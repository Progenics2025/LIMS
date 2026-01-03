import { sql } from "drizzle-orm";
import { mysqlTable, varchar, text, int, timestamp, boolean, decimal, json, bigint } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Helper to convert empty strings to null for date preprocessing
const emptyToNull = (val: unknown) =>
  val === "" || val === null || val === undefined ? null : val;

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(), // sales, operations, finance, lab, bioinformatics, reporting, manager, admin
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  lastLogin: timestamp("last_login"),
});

// Enhanced leads table to accommodate more fields from Excel sheets
export const leads = mysqlTable("lead_management", {
  id: varchar("id", { length: 36 }).primaryKey(),
  uniqueId: varchar("unique_id", { length: 100 }).notNull(),
  projectId: varchar("project_id", { length: 100 }),
  leadType: varchar("lead_type", { length: 100 }),
  status: varchar("status", { length: 50 }).default("quoted"),
  organisationHospital: varchar("organisation_hospital", { length: 255 }),
  clinicianResearcherName: varchar("clinician_researcher_name", { length: 255 }),
  speciality: varchar("speciality", { length: 255 }),
  clinicianResearcherEmail: varchar("clinician_researcher_email", { length: 255 }),
  clinicianResearcherPhone: varchar("clinician_researcher_phone", { length: 50 }),
  clinicianResearcherAddress: varchar("clinician_researcher_address", { length: 500 }),
  patientClientName: varchar("patient_client_name", { length: 255 }),
  age: int("age"),
  gender: varchar("gender", { length: 20 }),
  patientClientEmail: varchar("patient_client_email", { length: 255 }),
  patientClientPhone: varchar("patient_client_phone", { length: 50 }),
  patientClientAddress: varchar("patient_client_address", { length: 500 }),
  serviceName: varchar("service_name", { length: 255 }),
  sampleType: varchar("sample_type", { length: 255 }),
  testCategory: varchar("test_category", { length: 50 }),
  noOfSamples: int("no_of_samples"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  amountQuoted: decimal("amount_quoted", { precision: 10, scale: 2 }),
  tat: varchar("tat", { length: 50 }),
  sampleShipmentAmount: decimal("sample_shipment_amount", { precision: 10, scale: 2 }),
  phlebotomistCharges: decimal("phlebotomist_charges", { precision: 10, scale: 2 }),
  geneticCounselorRequired: boolean("genetic_counselor_required").default(false),
  nutritionalCounsellingRequired: boolean("nutritional_counselling_required").default(false),
  samplePickUpFrom: varchar("sample_pick_up_from", { length: 500 }),
  deliveryUpTo: varchar("delivery_up_to", { length: 255 }),
  sampleCollectionDate: timestamp("sample_collection_date", { mode: "date" }),
  sampleShippedDate: timestamp("sample_shipped_date", { mode: "date" }),
  sampleReceivedDate: timestamp("sample_recevied_date", { mode: "date" }),
  trackingId: varchar("tracking_id", { length: 100 }),
  courierCompany: varchar("courier_company", { length: 255 }),
  progenicsTrf: varchar("progenics_trf", { length: 255 }),
  followUp: varchar("follow_up", { length: 500 }),
  remarkComment: text("Remark_Comment"),
  leadCreatedBy: varchar("lead_created_by", { length: 36 }),
  salesResponsiblePerson: varchar("sales_responsible_person", { length: 255 }),
  leadCreated: timestamp("lead_created", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  leadModified: timestamp("lead_modified", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  modifiedBy: varchar("modified_by", { length: 255 }),
});

export const leadTrfs = mysqlTable('lead_trfs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  leadId: varchar('lead_id', { length: 36 }),
  filename: varchar('filename', { length: 255 }),
  data: text('data'), // drizzle mysql-core doesn't have LONGBLOB helper; store as text for now and use raw SQL if needed
  createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
});

// Enhanced samples table
export const samples = mysqlTable("sample_tracking", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  uniqueId: varchar("unique_id", { length: 80 }),
  projectId: varchar("project_id", { length: 80 }),
  sampleCollectionDate: timestamp("sample_collection_date", { mode: "date" }),
  sampleShippedDate: timestamp("sample_shipped_date", { mode: "date" }),
  sampleDeliveryDate: timestamp("sample_delivery_date", { mode: "date" }),
  samplePickUpFrom: varchar("sample_pick_up_from", { length: 255 }),
  deliveryUpTo: varchar("delivery_up_to", { length: 255 }),
  trackingId: varchar("tracking_id", { length: 120 }),
  courierCompany: varchar("courier_company", { length: 200 }),
  sampleShipmentAmount: decimal("sample_shipment_amount", { precision: 10, scale: 2 }),
  organisationHospital: varchar("organisation_hospital", { length: 255 }),
  clinicianResearcherName: varchar("clinician_researcher_name", { length: 200 }),
  clinicianResearcherPhone: varchar("clinician_researcher_phone", { length: 60 }),
  patientClientName: varchar("patient_client_name", { length: 200 }),
  patientClientPhone: varchar("patient_client_phone", { length: 60 }),
  sampleReceivedDate: timestamp("sample_recevied_date", { mode: "date" }),
  salesResponsiblePerson: varchar("sales_responsible_person", { length: 200 }),
  thirdPartyName: varchar("third_party_name", { length: 200 }),
  thirdPartyPhone: varchar("third_party_phone", { length: 60 }),
  thirdPartyReport: varchar("third_party_report", { length: 500 }),
  thirdPartyTrf: varchar("third_party_trf", { length: 500 }),
  sampleSentToThirdPartyDate: timestamp("sample_sent_to_third_party_date", { mode: "date" }),
  sampleReceivedToThirdPartyDate: timestamp("sample_received_to_third_party_date", { mode: "date" }),
  alertToLabprocessTeam: boolean("alert_to_labprocess_team").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("created_by", { length: 80 }),
  remarkComment: text("remark_comment"),
  modifiedAt: timestamp("modified_at", { mode: "date" }),
  modifiedBy: varchar("modified_by", { length: 255 }),
});

// Enhanced lab processing table
export const labProcessing = mysqlTable("lab_processing", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sampleId: varchar("sample_id", { length: 36 }).notNull(),
  labId: varchar("lab_id", { length: 100 }).notNull(),
  qcStatus: varchar("qc_status", { length: 100 }), // passed, failed, retest_required
  dnaRnaQuantity: decimal("dna_rna_quantity", { precision: 8, scale: 2 }),
  runId: varchar("run_id", { length: 100 }),
  libraryPrepared: boolean("library_prepared").default(false),
  sequencingId: varchar("sequencing_id", { length: 100 }),
  isOutsourced: boolean("is_outsourced").default(false),
  outsourceDetails: json("outsource_details"),
  processedAt: timestamp("processed_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  processedBy: varchar("processed_by", { length: 36 }),
  // Additional fields from Excel sheets
  sampleType: varchar("sample_type", { length: 100 }),
  extractionMethod: varchar("extraction_method", { length: 100 }),
  concentration: decimal("concentration", { precision: 8, scale: 2 }),
  purity: decimal("purity", { precision: 5, scale: 2 }),
  volume: decimal("volume", { precision: 8, scale: 2 }),
  qualityScore: varchar("quality_score", { length: 50 }),
  processingNotes: text("processing_notes"),
  equipmentUsed: varchar("equipment_used", { length: 255 }),
  reagents: json("reagents"),
  processingTime: int("processing_time"), // minutes
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  humidity: decimal("humidity", { precision: 5, scale: 2 }),
  // New detailed lab processing fields requested
  titleUniqueId: varchar("title_unique_id", { length: 100 }),
  sampleDeliveryDate: timestamp("sample_delivery_date"),
  serviceName: varchar("service_name", { length: 255 }),
  protocol1: varchar("protocol_1", { length: 255 }),
  isolationMethod: varchar("isolation_method", { length: 255 }),
  qualityCheckDNA: varchar("quality_check_dna", { length: 100 }),
  statusDNAExtraction: varchar("status_dna_extraction", { length: 100 }),
  protocol2: varchar("protocol_2", { length: 255 }),
  libraryPreparationProtocol: varchar("library_preparation_protocol", { length: 255 }),
  qualityCheck2: varchar("quality_check_2", { length: 100 }),
  purificationProtocol: varchar("purification_protocol", { length: 255 }),
  productQualityCheck: varchar("product_quality_check", { length: 100 }),
  statusLibraryPreparation: varchar("status_library_preparation", { length: 100 }),
  transitStatus: varchar("transit_status", { length: 100 }),
  financeApproval: varchar("finance_approval", { length: 100 }),
  completeStatus: varchar("complete_status", { length: 100 }),
  progenicsTrf: varchar("progenics_trf", { length: 255 }),
});

export const labProcessDiscoverySheet = mysqlTable("labprocess_discovery_sheet", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  uniqueId: varchar("unique_id", { length: 255 }).notNull().unique(),
  projectId: varchar("project_id", { length: 255 }),
  sampleId: varchar("sample_id", { length: 255 }),
  clientId: varchar("client_id", { length: 255 }),
  serviceName: varchar("service_name", { length: 255 }),
  sampleType: varchar("sample_type", { length: 255 }),
  noOfSamples: int("no_of_samples"),
  sampleReceivedDate: timestamp("sample_received_date", { mode: "date" }),
  extractionProtocol: varchar("extraction_protocol", { length: 255 }),
  extractionQualityCheck: varchar("extraction_quality_check", { length: 255 }),
  extractionQcStatus: varchar("extraction_qc_status", { length: 100 }),
  extractionProcess: varchar("extraction_process", { length: 255 }),
  libraryPreparationProtocol: varchar("library_preparation_protocol", { length: 255 }),
  libraryPreparationQualityCheck: varchar("library_preparation_quality_check", { length: 255 }),
  libraryPreparationQcStatus: varchar("library_preparation_qc_status", { length: 100 }),
  libraryPreparationProcess: varchar("library_preparation_process", { length: 255 }),
  purificationProtocol: varchar("purification_protocol", { length: 255 }),
  purificationQualityCheck: varchar("purification_quality_check", { length: 255 }),
  purificationQcStatus: varchar("purification_qc_status", { length: 100 }),
  purificationProcess: varchar("purification_process", { length: 255 }),
  alertToBioinformaticsTeam: boolean("alert_to_bioinformatics_team").default(false),
  alertToTechnicalLeadd: boolean("alert_to_technical_leadd").default(false),
  progenicsTrf: varchar("progenics_trf", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("created_by", { length: 255 }),
  modifiedAt: timestamp("modified_at", { mode: "date" }),
  modifiedBy: varchar("modified_by", { length: 255 }),
  remarkComment: text("remark_comment"),
});

export const labProcessClinicalSheet = mysqlTable("labprocess_clinical_sheet", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  uniqueId: varchar("unique_id", { length: 255 }).notNull().unique(),
  projectId: varchar("project_id", { length: 255 }),
  sampleId: varchar("sample_id", { length: 255 }),
  clientId: varchar("client_id", { length: 255 }),
  serviceName: varchar("service_name", { length: 255 }),
  sampleType: varchar("sample_type", { length: 255 }),
  noOfSamples: int("no_of_samples"),
  sampleReceivedDate: timestamp("sample_received_date", { mode: "date" }),
  extractionProtocol: varchar("extraction_protocol", { length: 255 }),
  extractionQualityCheck: varchar("extraction_quality_check", { length: 255 }),
  extractionQcStatus: varchar("extraction_qc_status", { length: 100 }),
  extractionProcess: varchar("extraction_process", { length: 255 }),
  libraryPreparationProtocol: varchar("library_preparation_protocol", { length: 255 }),
  libraryPreparationQualityCheck: varchar("library_preparation_quality_check", { length: 255 }),
  libraryPreparationQcStatus: varchar("library_preparation_qc_status", { length: 100 }),
  libraryPreparationProcess: varchar("library_preparation_process", { length: 255 }),
  purificationProtocol: varchar("purification_protocol", { length: 255 }),
  purificationQualityCheck: varchar("purification_quality_check", { length: 255 }),
  purificationQcStatus: varchar("purification_qc_status", { length: 100 }),
  purificationProcess: varchar("purification_process", { length: 255 }),
  alertToBioinformaticsTeam: boolean("alert_to_bioinformatics_team").default(false),
  alertToTechnicalLead: boolean("alert_to_technical_lead").default(false),
  progenicsTrf: varchar("progenics_trf", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("created_by", { length: 255 }),
  modifiedAt: timestamp("modified_at", { mode: "date" }),
  modifiedBy: varchar("modified_by", { length: 255 }),
  remarkComment: text("remark_comment"),
});

// Enhanced reports table
export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sampleId: varchar("sample_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 50 }).default("in_progress"), // in_progress, awaiting_approval, approved, delivered
  reportPath: varchar("report_path", { length: 500 }),
  generatedAt: timestamp("generated_at"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by", { length: 36 }),
  deliveredAt: timestamp("delivered_at"),
  // Additional fields from Excel sheets
  reportType: varchar("report_type", { length: 100 }),
  reportFormat: varchar("report_format", { length: 50 }), // pdf, excel, word
  findings: text("findings"),
  recommendations: text("recommendations"),
  clinicalInterpretation: text("clinical_interpretation"),
  technicalNotes: text("technical_notes"),
  qualityControl: json("quality_control"),
  validationStatus: varchar("validation_status", { length: 50 }),
  reportVersion: varchar("report_version", { length: 20 }),
  deliveryMethod: varchar("delivery_method", { length: 50 }), // email, portal, courier
  recipientEmail: varchar("recipient_email", { length: 255 }),
});

// Genetic counselling table
export const geneticCounselling = mysqlTable("genetic_counselling_records", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  uniqueId: varchar("unique_id", { length: 255 }).notNull(),
  projectId: varchar("project_id", { length: 255 }),
  counsellingDate: timestamp("counselling_date", { mode: "date" }),
  gcRegistrationStartTime: varchar("gc_registration_start_time", { length: 20 }),
  gcRegistrationEndTime: varchar("gc_registration_end_time", { length: 20 }),
  patientClientName: varchar("patient_client_name", { length: 255 }),
  age: int("age"),
  gender: varchar("gender", { length: 20 }),
  patientClientEmail: varchar("patient_client_email", { length: 255 }),
  patientClientPhone: varchar("patient_client_phone", { length: 50 }),
  patientClientAddress: varchar("patient_client_address", { length: 255 }),
  paymentStatus: varchar("payment_status", { length: 100 }),
  modeOfPayment: varchar("mode_of_payment", { length: 100 }),
  approvalFromHead: boolean("approval_from_head").default(false),
  clinicianResearcherName: varchar("clinician_researcher_name", { length: 255 }),
  organisationHospital: varchar("organisation_hospital", { length: 255 }),
  speciality: varchar("speciality", { length: 255 }),
  querySuspection: varchar("query_suspection", { length: 500 }),
  gcName: varchar("gc_name", { length: 255 }),
  gcOtherMembers: varchar("gc_other_members", { length: 255 }),
  serviceName: varchar("service_name", { length: 255 }),
  counselingType: varchar("counseling_type", { length: 255 }),
  counselingStartTime: varchar("counseling_start_time", { length: 20 }),
  counselingEndTime: varchar("counseling_end_time", { length: 20 }),
  budgetForTestOpted: decimal("budget_for_test_opted", { precision: 10, scale: 2 }),
  testingStatus: varchar("testing_status", { length: 255 }),
  actionRequired: varchar("action_required", { length: 255 }),
  potentialPatientForTestingInFuture: boolean("potential_patient_for_testing_in_future").default(false),
  extendedFamilyTestingRequirement: boolean("extended_family_testing_requirement").default(false),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  sampleType: varchar("sample_type", { length: 255 }),
  gcSummarySheet: text("gc_summary_sheet"),
  gcVideoLink: varchar("gc_video_link", { length: 500 }),
  gcAudioLink: varchar("gc_audio_link", { length: 500 }),
  salesResponsiblePerson: varchar("sales_responsible_person", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("created_by", { length: 255 }),
  modifiedAt: timestamp("modified_at", { mode: "date" }),
  modifiedBy: varchar("modified_by", { length: 255 }),
  remarkComment: text("remark_comment"),
});

// New table for finance records
export const financeRecords = mysqlTable("finance_sheet", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  uniqueId: varchar("unique_id", { length: 255 }).notNull(),
  projectId: varchar("project_id", { length: 255 }).notNull(),
  sampleCollectionDate: timestamp("sample_collection_date", { mode: "date" }),
  organisationHospital: varchar("organisation_hospital", { length: 255 }),
  clinicianResearcherName: varchar("clinician_researcher_name", { length: 255 }),
  clinicianResearcherEmail: varchar("clinician_researcher_email", { length: 255 }),
  clinicianResearcherPhone: varchar("clinician_researcher_phone", { length: 50 }),
  clinicianResearcherAddress: varchar("clinician_researcher_address", { length: 255 }),
  patientClientName: varchar("patient_client_name", { length: 255 }),
  patientClientEmail: varchar("patient_client_email", { length: 255 }),
  patientClientPhone: varchar("patient_client_phone", { length: 50 }),
  patientClientAddress: varchar("patient_client_address", { length: 255 }),
  serviceName: varchar("service_name", { length: 255 }),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  phlebotomistCharges: decimal("phlebotomist_charges", { precision: 10, scale: 2 }),
  salesResponsiblePerson: varchar("sales_responsible_person", { length: 255 }),
  sampleShipmentAmount: decimal("sample_shipment_amount", { precision: 10, scale: 2 }),
  invoiceNumber: varchar("invoice_number", { length: 255 }),
  invoiceAmount: decimal("invoice_amount", { precision: 10, scale: 2 }),
  invoiceDate: timestamp("invoice_date", { mode: "date" }),
  paymentReceiptAmount: decimal("payment_receipt_amount", { precision: 10, scale: 2 }),
  balanceAmount: decimal("balance_amount", { precision: 10, scale: 2 }),
  paymentReceiptDate: timestamp("payment_receipt_date", { mode: "date" }),
  modeOfPayment: varchar("mode_of_payment", { length: 100 }),
  transactionalNumber: varchar("transactional_number", { length: 255 }),
  balanceAmountReceivedDate: timestamp("balance_amount_received_date", { mode: "date" }),
  totalAmountReceivedStatus: boolean("total_amount_received_status").default(false),
  utrDetails: varchar("utr_details", { length: 255 }),
  thirdPartyCharges: decimal("third_party_charges", { precision: 10, scale: 2 }),
  otherCharges: decimal("other_charges", { precision: 10, scale: 2 }),
  otherChargesReason: varchar("other_charges_reason", { length: 255 }),
  thirdPartyName: varchar("third_party_name", { length: 255 }),
  thirdPartyPhone: varchar("third_party_phone", { length: 50 }),
  thirdPartyPaymentDate: timestamp("third_party_payment_date", { mode: "date" }),
  thirdPartyPaymentStatus: boolean("third_party_payment_status").default(false),
  alertToLabprocessTeam: boolean("alert_to_labprocess_team").default(false),
  alertToReportTeam: boolean("alert_to_report_team").default(false),
  alertToTechnicalLead: boolean("alert_to_technical_lead").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("created_by", { length: 255 }),
  modifiedAt: timestamp("modified_at", { mode: "date" }),
  modifiedBy: varchar("modified_by", { length: 255 }),
  remarkComment: text("remark_comment"),
});

// New table for logistics tracking
export const logisticsTracking = mysqlTable("logistics_tracking", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sampleId: varchar("sample_id", { length: 36 }),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  courierName: varchar("courier_name", { length: 100 }),
  pickupDate: timestamp("pickup_date"),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  status: varchar("status", { length: 50 }).default("scheduled"), // scheduled, picked_up, in_transit, delivered, failed
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  // Additional fields from Excel sheets
  pickupAddress: text("pickup_address"),
  deliveryAddress: text("delivery_address"),
  contactPerson: varchar("contact_person", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  specialInstructions: text("special_instructions"),
  packageWeight: decimal("package_weight", { precision: 8, scale: 2 }),
  packageDimensions: varchar("package_dimensions", { length: 100 }),
  insuranceAmount: decimal("insurance_amount", { precision: 10, scale: 2 }),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
  trackingUpdates: json("tracking_updates"),
  deliveryNotes: text("delivery_notes"),
});

// New table for pricing
export const pricing = mysqlTable("pricing", {
  id: varchar("id", { length: 36 }).primaryKey(),
  testName: varchar("test_name", { length: 255 }).notNull(),
  testCode: varchar("test_code", { length: 50 }).unique(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("INR"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  // Additional fields from Excel sheets
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  description: text("description"),
  turnaroundTime: int("turnaround_time"), // days
  sampleRequirements: text("sample_requirements"),
  methodology: varchar("methodology", { length: 255 }),
  accreditation: varchar("accreditation", { length: 255 }),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  notes: text("notes"),
});

// New table for sales activities
export const salesActivities = mysqlTable("sales_activities", {
  id: varchar("id", { length: 36 }).primaryKey(),
  leadId: varchar("lead_id", { length: 36 }),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // call, email, meeting, follow_up, proposal
  description: text("description"),
  outcome: varchar("outcome", { length: 100 }),
  nextAction: varchar("next_action", { length: 255 }),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  assignedTo: varchar("assigned_to", { length: 36 }),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  // Additional fields from Excel sheets
  duration: int("duration"), // minutes
  priority: varchar("priority", { length: 50 }),
  status: varchar("status", { length: 50 }).default("planned"), // planned, in_progress, completed, cancelled
  notes: text("notes"),
  attachments: json("attachments"),
});

// New table for client information
export const clients = mysqlTable("clients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organizationName: varchar("organization_name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  pincode: varchar("pincode", { length: 20 }),
  clientType: varchar("client_type", { length: 50 }), // individual, hospital, clinic, corporate
  registrationDate: timestamp("registration_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  // Additional fields from Excel sheets
  gstNumber: varchar("gst_number", { length: 50 }),
  panNumber: varchar("pan_number", { length: 50 }),
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  assignedSalesRep: varchar("assigned_sales_rep", { length: 36 }),
  notes: text("notes"),
  tags: json("tags"),
});

export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 100 }).notNull(), // lead_converted, payment_pending, report_ready, etc.
  isRead: boolean("is_read").default(false),
  relatedId: varchar("related_id", { length: 36 }), // related lead, sample, or report ID
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
});

// Recycle bin table: stores deleted entity snapshots for possible restore
export const recycleBin = mysqlTable("recycle_bin", {
  id: varchar("id", { length: 36 }).primaryKey(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 255 }),
  data: json("data"),
  originalPath: varchar("original_path", { length: 500 }),
  createdBy: varchar("created_by", { length: 36 }),
  deletedAt: timestamp("deleted_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
});

export const insertRecycleBinSchema = createInsertSchema(recycleBin).omit({ id: true, deletedAt: true });

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  leadCreated: true,
  leadModified: true,
}).extend({
  // Preprocess date fields: convert empty strings to null, then coerce to Date
  deliveryUpTo: z.string().nullable().optional(),
  sampleCollectionDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
  sampleReceivedDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
});

export const insertSampleSchema = createInsertSchema(samples).omit({
  id: true,
  createdAt: true,
}).extend({
  // Preprocess date fields: convert empty strings to null, then coerce to Date
  sampleCollectionDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
  sampleShippedDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
  sampleDeliveryDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
  sampleReceivedDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
  sampleSentToThirdPartyDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
  sampleReceivedToThirdPartyDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
});

export const insertLabProcessingSchema = createInsertSchema(labProcessing).omit({
  id: true,
  processedAt: true,
});

export const insertLabProcessDiscoverySheetSchema = createInsertSchema(labProcessDiscoverySheet).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
}).extend({
  // Preprocess date fields: convert empty strings to null, then coerce to Date
  sampleReceivedDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
}).passthrough();

export const insertLabProcessClinicalSheetSchema = createInsertSchema(labProcessClinicalSheet).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
}).extend({
  // Preprocess date fields: convert empty strings to null, then coerce to Date
  sampleReceivedDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
}).passthrough();

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  generatedAt: true,
  approvedAt: true,
  deliveredAt: true,
});

export const insertGeneticCounsellingSchema = createInsertSchema(geneticCounselling).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
});

export const insertFinanceRecordSchema = createInsertSchema(financeRecords).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
}).extend({
  // Preprocess date fields: convert empty strings to null, then coerce to Date
  sampleCollectionDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
  invoiceDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
  paymentReceiptDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
  balanceAmountReceivedDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
  thirdPartyPaymentDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
});

export const insertLogisticsTrackingSchema = createInsertSchema(logisticsTracking).omit({
  id: true,
  createdAt: true,
});

export const insertPricingSchema = createInsertSchema(pricing).omit({
  id: true,
  createdAt: true,
});

export const insertSalesActivitySchema = createInsertSchema(salesActivities).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Bioinformatics Clinical Sheet
export const bioinformaticsSheetClinical = mysqlTable("bioinformatics_sheet_clinical", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  uniqueId: varchar("unique_id", { length: 255 }).notNull().unique(),
  projectId: varchar("project_id", { length: 255 }),
  sampleId: varchar("sample_id", { length: 255 }),
  clientId: varchar("client_id", { length: 255 }),
  organisationHospital: varchar("organisation_hospital", { length: 255 }),
  clinicianResearcherName: varchar("clinician_researcher_name", { length: 255 }),
  patientClientName: varchar("patient_client_name", { length: 255 }),
  age: int("age"),
  gender: varchar("gender", { length: 20 }),
  serviceName: varchar("service_name", { length: 255 }),
  noOfSamples: int("no_of_samples"),
  sequencingStatus: varchar("sequencing_status", { length: 255 }),
  sequencingDataStorageDate: timestamp("sequencing_data_storage_date", { mode: "date" }),
  basecalling: varchar("basecalling", { length: 255 }),
  basecallingDataStorageDate: timestamp("basecalling_data_storage_date", { mode: "date" }),
  workflowType: varchar("workflow_type", { length: 255 }),
  analysisStatus: varchar("analysis_status", { length: 255 }),
  analysisDate: timestamp("analysis_date", { mode: "date" }),
  thirdPartyName: varchar("third_party_name", { length: 255 }),
  sampleSentToThirdPartyDate: timestamp("sample_sent_to_third_party_date", { mode: "date" }),
  thirdPartyTrf: varchar("third_party_trf", { length: 255 }),
  resultsRawDataReceivedFromThirdPartyDate: timestamp("results_raw_data_received_from_third_party_date", { mode: "date" }),
  thirdPartyReport: varchar("third_party_report", { length: 255 }),
  tat: varchar("tat", { length: 100 }),
  vcfFileLink: varchar("vcf_file_link", { length: 500 }),
  cnvStatus: varchar("cnv_status", { length: 255 }),
  progenicsRawData: varchar("progenics_raw_data", { length: 500 }),
  progenicsRawDataSize: varchar("progenics_raw_data_size", { length: 255 }),
  progenicsRawDataLink: varchar("progenics_raw_data_link", { length: 500 }),
  analysisHtmlLink: varchar("analysis_html_link", { length: 500 }),
  relativeAbundanceSheet: varchar("relative_abundance_sheet", { length: 500 }),
  dataAnalysisSheet: varchar("data_analysis_sheet", { length: 500 }),
  databaseToolsInformation: text("database_tools_information"),
  alertToTechnicalLeadd: boolean("alert_to_technical_leadd").default(false),
  alertToReportTeam: boolean("alert_to_report_team").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("created_by", { length: 255 }),
  modifiedAt: timestamp("modified_at", { mode: "date" }),
  modifiedBy: varchar("modified_by", { length: 255 }),
  remarkComment: text("remark_comment"),
});

export const insertBioinformaticsSheetClinicalSchema = createInsertSchema(bioinformaticsSheetClinical).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
});

// Bioinformatics Discovery Sheet
export const bioinformaticsSheetDiscovery = mysqlTable("bioinformatics_sheet_discovery", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  uniqueId: varchar("unique_id", { length: 255 }).notNull().unique(),
  projectId: varchar("project_id", { length: 255 }),
  sampleId: varchar("sample_id", { length: 255 }),
  clientId: varchar("client_id", { length: 255 }),
  organisationHospital: varchar("organisation_hospital", { length: 255 }),
  clinicianResearcherName: varchar("clinician_researcher_name", { length: 255 }),
  patientClientName: varchar("patient_client_name", { length: 255 }),
  age: int("age"),
  gender: varchar("gender", { length: 20 }),
  serviceName: varchar("service_name", { length: 255 }),
  noOfSamples: int("no_of_samples"),
  sequencingStatus: varchar("sequencing_status", { length: 255 }),
  sequencingDataStorageDate: timestamp("sequencing_data_storage_date", { mode: "date" }),
  basecalling: varchar("basecalling", { length: 255 }),
  basecallingDataStorageDate: timestamp("basecalling_data_storage_date", { mode: "date" }),
  workflowType: varchar("workflow_type", { length: 255 }),
  analysisStatus: varchar("analysis_status", { length: 255 }),
  analysisDate: timestamp("analysis_date", { mode: "date" }),
  thirdPartyName: varchar("third_party_name", { length: 255 }),
  sampleSentToThirdPartyDate: timestamp("sample_sent_to_third_party_date", { mode: "date" }),
  thirdPartyTrf: varchar("third_party_trf", { length: 255 }),
  resultsRawDataReceivedFromThirdPartyDate: timestamp("results_raw_data_received_from_third_party_date", { mode: "date" }),
  thirdPartyReport: varchar("third_party_report", { length: 500 }),
  tat: varchar("tat", { length: 100 }),
  vcfFileLink: varchar("vcf_file_link", { length: 500 }),
  cnvStatus: varchar("cnv_status", { length: 255 }),
  progenicsRawData: varchar("progenics_raw_data", { length: 500 }),
  progenicsRawDataSize: varchar("progenics_raw_data_size", { length: 255 }),
  progenicsRawDataLink: varchar("progenics_raw_data_link", { length: 500 }),
  analysisHtmlLink: varchar("analysis_html_link", { length: 500 }),
  relativeAbundanceSheet: varchar("relative_abundance_sheet", { length: 500 }),
  dataAnalysisSheet: varchar("data_analysis_sheet", { length: 500 }),
  databaseToolsInformation: text("database_tools_information"),
  alertToTechnicalLeadd: boolean("alert_to_technical_leadd").default(false),
  alertToReportTeam: boolean("alert_to_report_team").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("created_by", { length: 255 }),
  modifiedAt: timestamp("modified_at", { mode: "date" }),
  modifiedBy: varchar("modified_by", { length: 255 }),
  remarkComment: text("remark_comment"),
});

export const insertBioinformaticsSheetDiscoverySchema = createInsertSchema(bioinformaticsSheetDiscovery).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
});

// Nutritional Management
export const nutritionalManagement = mysqlTable("nutritional_management", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  uniqueId: varchar("unique_id", { length: 255 }).notNull().unique(),
  projectId: varchar("project_id", { length: 255 }),
  sampleId: varchar("sample_id", { length: 255 }),
  serviceName: varchar("service_name", { length: 255 }),
  patientClientName: varchar("patient_client_name", { length: 255 }),
  age: int("age"),
  gender: varchar("gender", { length: 20 }),
  progenicsTrf: varchar("progenics_trf", { length: 255 }),
  questionnaire: text("questionnaire"),
  questionnaireCallRecording: varchar("questionnaire_call_recording", { length: 500 }),
  dataAnalysisSheet: varchar("data_analysis_sheet", { length: 500 }),
  progenicsReport: varchar("progenics_report", { length: 500 }),
  nutritionChart: varchar("nutrition_chart", { length: 500 }),
  counsellingSessionDate: timestamp("counselling_session_date", { mode: "date" }),
  furtherCounsellingRequired: boolean("further_counselling_required").default(false),
  counsellingStatus: varchar("counselling_status", { length: 255 }),
  counsellingSessionRecording: varchar("counselling_session_recording", { length: 500 }),
  alertToTechnicalLead: boolean("alert_to_technical_lead").default(false),
  alertToReportTeam: boolean("alert_to_report_team").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("created_by", { length: 255 }),
  modifiedAt: timestamp("modified_at", { mode: "date" }),
  modifiedBy: varchar("modified_by", { length: 255 }),
  remarkComment: text("remark_comment"),
});

export const insertNutritionalManagementSchema = createInsertSchema(nutritionalManagement).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
}).extend({
  // Make all fields more lenient and allow coercion
  uniqueId: z.string().optional(),
  projectId: z.union([z.string(), z.number()]).optional(),
  sampleId: z.string().optional(),
  serviceName: z.string().optional(),
  patientClientName: z.string().optional(),
  age: z.union([z.string(), z.number()]).transform(v => v === '' ? null : Number(v)).nullable().optional(),
  gender: z.string().optional(),
  progenicsTrf: z.string().optional(),
  questionnaire: z.string().optional(),
  questionnaireCallRecording: z.string().optional(),
  dataAnalysisSheet: z.string().optional(),
  progenicsReport: z.string().optional(),
  nutritionChart: z.string().optional(),
  counsellingSessionDate: z
    .preprocess(emptyToNull, z.coerce.date().nullable())
    .optional(),
  furtherCounsellingRequired: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true' || v === 'on').optional(),
  counsellingStatus: z.string().optional(),
  counsellingSessionRecording: z.string().optional(),
  alertToTechnicalLead: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true' || v === 'on').optional(),
  alertToReportTeam: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true' || v === 'on').optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
  modifiedAt: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
  remarkComment: z.string().optional(),
  remarksComment: z.string().optional(),
}).passthrough();

// Process Master Sheet
export const processMasterSheet = mysqlTable("process_master_sheet", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  uniqueId: varchar("unique_id", { length: 255 }).notNull().unique(),
  projectId: varchar("project_id", { length: 255 }),
  sampleId: varchar("sample_id", { length: 255 }),
  clientId: varchar("client_id", { length: 255 }),
  organisationHospital: varchar("organisation_hospital", { length: 255 }),
  clinicianResearcherName: varchar("clinician_researcher_name", { length: 255 }),
  speciality: varchar("speciality", { length: 255 }),
  clinicianResearcherEmail: varchar("clinician_researcher_email", { length: 255 }),
  clinicianResearcherPhone: varchar("clinician_researcher_phone", { length: 50 }),
  clinicianResearcherAddress: varchar("clinician_researcher_address", { length: 255 }),
  patientClientName: varchar("patient_client_name", { length: 255 }),
  age: int("age"),
  gender: varchar("gender", { length: 20 }),
  patientClientEmail: varchar("patient_client_email", { length: 255 }),
  patientClientPhone: varchar("patient_client_phone", { length: 50 }),
  patientClientAddress: varchar("patient_client_address", { length: 255 }),
  sampleCollectionDate: timestamp("sample_collection_date", { mode: "date" }),
  sampleReceviedDate: timestamp("sample_recevied_date", { mode: "date" }),
  serviceName: varchar("service_name", { length: 255 }),
  sampleType: varchar("sample_type", { length: 255 }),
  noOfSamples: int("no_of_samples"),
  tat: varchar("tat", { length: 100 }),
  salesResponsiblePerson: varchar("sales_responsible_person", { length: 255 }),
  progenicsTrf: varchar("progenics_trf", { length: 255 }),
  thirdPartyTrf: varchar("third_party_trf", { length: 255 }),
  progenicsReport: varchar("progenics_report", { length: 500 }),
  sampleSentToThirdPartyDate: timestamp("sample_sent_to_third_party_date", { mode: "date" }),
  thirdPartyName: varchar("third_party_name", { length: 255 }),
  thirdPartyReport: varchar("third_party_report", { length: 500 }),
  resultsRawDataReceivedFromThirdPartyDate: timestamp("results_raw_data_received_from_third_party_date", { mode: "date" }),
  logisticStatus: varchar("logistic_status", { length: 255 }),
  financeStatus: varchar("finance_status", { length: 255 }),
  labProcessStatus: varchar("lab_process_status", { length: 255 }),
  bioinformaticsStatus: varchar("bioinformatics_status", { length: 255 }),
  nutritionalManagementStatus: varchar("nutritional_management_status", { length: 255 }),
  progenicsReportReleaseDate: timestamp("progenics_report_release_date", { mode: "date" }),
  remarkComment: text("Remark_Comment"),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("created_by", { length: 255 }),
  modifiedAt: timestamp("modified_at", { mode: "date" }),
  modifiedBy: varchar("modified_by", { length: 255 }),
});

export const insertProcessMasterSheetSchema = createInsertSchema(processMasterSheet).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertSample = z.infer<typeof insertSampleSchema>;
export type Sample = typeof samples.$inferSelect;
export type InsertLabProcessing = z.infer<typeof insertLabProcessingSchema>;
export type LabProcessing = typeof labProcessing.$inferSelect;
export type InsertLabProcessDiscoverySheet = z.infer<typeof insertLabProcessDiscoverySheetSchema>;
export type LabProcessDiscoverySheet = typeof labProcessDiscoverySheet.$inferSelect;
export type InsertLabProcessClinicalSheet = z.infer<typeof insertLabProcessClinicalSheetSchema>;
export type LabProcessClinicalSheet = typeof labProcessClinicalSheet.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertFinanceRecord = z.infer<typeof insertFinanceRecordSchema>;
export type FinanceRecord = typeof financeRecords.$inferSelect;
export type InsertLogisticsTracking = z.infer<typeof insertLogisticsTrackingSchema>;
export type LogisticsTracking = typeof logisticsTracking.$inferSelect;
export type InsertPricing = z.infer<typeof insertPricingSchema>;
export type Pricing = typeof pricing.$inferSelect;
export type InsertSalesActivity = z.infer<typeof insertSalesActivitySchema>;
export type SalesActivity = typeof salesActivities.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertBioinformaticsSheetClinical = z.infer<typeof insertBioinformaticsSheetClinicalSchema>;
export type BioinformaticsSheetClinical = typeof bioinformaticsSheetClinical.$inferSelect;
export type InsertBioinformaticsSheetDiscovery = z.infer<typeof insertBioinformaticsSheetDiscoverySchema>;
export type BioinformaticsSheetDiscovery = typeof bioinformaticsSheetDiscovery.$inferSelect;
export type InsertBioinformaticsSheet = InsertBioinformaticsSheetClinical;
export type BioinformaticsSheet = BioinformaticsSheetClinical;
export type InsertBioinformaticsDiscovery = InsertBioinformaticsSheetDiscovery;
export type BioinformaticsDiscovery = BioinformaticsSheetDiscovery;
export type InsertNutritionalManagement = z.infer<typeof insertNutritionalManagementSchema>;
export type NutritionalManagement = typeof nutritionalManagement.$inferSelect;
export type InsertProcessMasterSheet = z.infer<typeof insertProcessMasterSheetSchema>;
export type ProcessMasterSheet = typeof processMasterSheet.$inferSelect;

// Extended types for joins
export type LeadWithUser = Lead & { createdBy: User | null };
export type SampleWithLead = Sample & { lead: Lead };
export type LabProcessingWithSample = LabProcessing & { sample: Sample & { lead: Lead } };
export type ReportWithSample = Report & { sample: Sample & { lead: Lead } };
export type FinanceRecordWithSample = FinanceRecord & { sample: Sample & { lead: Lead } };
export type LogisticsTrackingWithSample = LogisticsTracking & { sample: Sample & { lead: Lead } };
