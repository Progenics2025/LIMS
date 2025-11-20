import { sql } from "drizzle-orm";
import { mysqlTable, varchar, text, int, timestamp, boolean, decimal, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
export const leads = mysqlTable("leads", {
  id: varchar("id", { length: 36 }).primaryKey(),
  organization: varchar("organization", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  referredDoctor: varchar("referred_doctor", { length: 255 }).notNull(),
  clinicHospitalName: varchar("clinic_hospital_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }).notNull(),
  testName: varchar("test_name", { length: 255 }).notNull(),
  sampleType: varchar("sample_type", { length: 255 }).notNull(),
  amountQuoted: decimal("amount_quoted", { precision: 10, scale: 2 }).notNull(),
  tat: int("tat").notNull(), // days
  status: varchar("status", { length: 50 }).default("quoted"), // quoted, cold, hot, won, converted, closed
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("created_by", { length: 36 }),
  convertedAt: timestamp("converted_at"),
  category: varchar("category", { length: 50 }).default("clinical"), // clinical, discovery
  // Discovery-specific fields
  discoveryOrganization: varchar("discovery_organization", { length: 255 }),
  clinicianName: varchar("clinician_name", { length: 255 }),
  specialty: varchar("specialty", { length: 255 }),
  clinicianOrgEmail: varchar("clinician_org_email", { length: 255 }),
  clinicianOrgPhone: varchar("clinician_org_phone", { length: 50 }),
  serviceName: varchar("service_name", { length: 255 }),
  // pickupFrom: varchar("pickup_from", { length: 255 }), // Moved to sample tracking
  // deliveryUpto: varchar("delivery_upto", { length: 255 }), // Moved to sample tracking
  discoveryStatus: varchar("discovery_status", { length: 100 }),
  followUp: varchar("follow_up", { length: 255 }),
  leadType: varchar("lead_type", { length: 100 }),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  // sampleShipmentAmount: decimal("sample_shipment_amount", { precision: 10, scale: 2 }), // Moved to sample tracking
  noOfSamples: int("no_of_samples"),
  patientClientName: varchar("patient_client_name", { length: 255 }),
  age: int("age"),
  gender: varchar("gender", { length: 20 }),
  patientClientPhone: varchar("patient_client_phone", { length: 50 }),
  patientClientEmail: varchar("patient_client_email", { length: 255 }),
  salesResponsiblePerson: varchar("sales_responsible_person", { length: 255 }),
  geneticCounsellorRequired: boolean("genetic_counsellor_required").default(false),
  dateSampleReceived: timestamp("date_sample_received"),
  dateSampleCollected: timestamp("date_sample_collected"),
  // Pickup / tracking fields (some apps move these to samples/logistics, but adding here per request)
  pickupFrom: varchar("pickup_from", { length: 255 }),
  pickupUpto: timestamp("pickup_upto"),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }),
  trackingId: varchar("tracking_id", { length: 100 }),
  courierCompany: varchar("courier_company", { length: 255 }),
  progenicsTRF: varchar("progenics_trf", { length: 255 }),
  phlebotomistCharges: decimal("phlebotomist_charges", { precision: 10, scale: 2 }),
});

export const leadTrfs = mysqlTable('lead_trfs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  leadId: varchar('lead_id', { length: 36 }),
  filename: varchar('filename', { length: 255 }),
  data: text('data'), // drizzle mysql-core doesn't have LONGBLOB helper; store as text for now and use raw SQL if needed
  createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
});

// Enhanced samples table
export const samples = mysqlTable("samples", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sampleId: varchar("sample_id", { length: 64 }).notNull().unique(),
  leadId: varchar("lead_id", { length: 36 }).notNull(),
  status: varchar("status", { length: 50 }).default("pickup_scheduled"), // pickup_scheduled, in_transit, received, lab_processing, bioinformatics, reporting, completed
  courierDetails: json("courier_details"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  // New tracking fields (mirrors migrations)
  sampleCollectedDate: timestamp("sample_collected_date"),
  sampleShippedDate: timestamp("sample_shipped_date"),
  sampleDeliveryDate: timestamp("sample_delivery_date"),
  responsiblePerson: varchar("responsible_person", { length: 255 }),
  organization: varchar("organization", { length: 255 }),
  senderCity: varchar("sender_city", { length: 255 }),
  senderContact: varchar("sender_contact", { length: 100 }),
  receiverAddress: text("receiver_address"),
  trackingId: varchar("tracking_id", { length: 100 }),
  courierCompany: varchar("courier_company", { length: 100 }),
  labAlertStatus: varchar("lab_alert_status", { length: 50 }).default("pending"),
  thirdPartyName: varchar("third_party_name", { length: 255 }),
  thirdPartyContractDetails: text("third_party_contract_details"),
  thirdPartySentDate: timestamp("third_party_sent_date"),
  thirdPartyReceivedDate: timestamp("third_party_received_date"),
  comments: text("comments"),
  // Lab routing and tracking fields
  labDestination: varchar("lab_destination", { length: 100 }).default("internal"), // internal, third_party
  thirdPartyLab: varchar("third_party_lab", { length: 255 }),
  thirdPartyAddress: text("third_party_address"),
  courierPartner: varchar("courier_partner", { length: 100 }),
  pickupDate: timestamp("pickup_date"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
  specialInstructions: text("special_instructions"),
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
export const geneticCounselling = mysqlTable("genetic_counselling", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sampleId: varchar("sample_id", { length: 64 }).notNull(),
  uniqueId: varchar("unique_id", { length: 100 }),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  gcRegistrationStartTime: timestamp("gc_registration_start_time"),
  gcRegistrationEndTime: timestamp("gc_registration_end_time"),
  clientName: varchar("client_name", { length: 255 }),
  clientContact: varchar("client_contact", { length: 100 }),
  clientEmail: varchar("client_email", { length: 255 }),
  age: int("age"),
  sex: varchar("sex", { length: 20 }),
  paymentStatus: varchar("payment_status", { length: 50 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  approvalFromHead: varchar("approval_from_head", { length: 255 }),
  referralDoctor: varchar("referral_doctor", { length: 255 }),
  organization: varchar("organization", { length: 255 }),
  specialty: varchar("specialty", { length: 255 }),
  query: text("query"),
  gcName: varchar("gc_name", { length: 255 }).notNull(),
  gcOtherMembers: text("gc_other_members"),
  serviceName: varchar("service_name", { length: 255 }),
  counsellingType: varchar("counselling_type", { length: 100 }),
  counsellingStartTime: timestamp("counselling_start_time", { mode: "date" }),
  counsellingEndTime: timestamp("counselling_end_time", { mode: "date" }),
  budgetForTestOpted: decimal("budget_for_test_opted", { precision: 10, scale: 2 }),
  testingStatus: varchar("testing_status", { length: 100 }),
  potentialPatientForTestingFuture: boolean("potential_patient_for_testing_future").default(false),
  extendedFamilyTesting: boolean("extended_family_testing").default(false),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  sampleType: varchar("sample_type", { length: 100 }),
  createdBy: varchar("created_by", { length: 36 }),
  gcSummary: text("gc_summary"),
  gcSummarySheet: text("gc_summary_sheet"),
  gcfVideoLinks: text("gcf_video_links"),
  modifiedAt: timestamp("modified_at"),
  assignedToSalesPerson: varchar("assigned_to_sales_person", { length: 36 }),
  
  // keep existing approvalStatus compatibility
  approvalStatus: varchar("approval_status", { length: 50 }).default("pending"),
  // preserve auto-created timestamp
  // createdAt already defined above
  // existing fields end
  // Note: `counsellingStartTime` / `counsellingEndTime` are mapped above to snake_case columns
});

// New table for finance records
export const financeRecords = mysqlTable("finance_records", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sampleId: varchar("sample_id", { length: 36 }),
  leadId: varchar("lead_id", { length: 36 }),
  invoiceNumber: varchar("invoice_number", { length: 100 }).unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // pending, partial, paid, overdue
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentDate: timestamp("payment_date"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
  // Additional fields from Excel sheets
  currency: varchar("currency", { length: 10 }).default("INR"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  discountReason: varchar("discount_reason", { length: 255 }),
  billingAddress: text("billing_address"),
  billingContact: varchar("billing_contact", { length: 255 }),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  lateFees: decimal("late_fees", { precision: 10, scale: 2 }).default("0"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).default("0"),
  refundReason: varchar("refund_reason", { length: 255 }),
  notes: text("notes"),
  // Fields used by the Finance UI (added to match client form)
  titleUniqueId: varchar("title_unique_id", { length: 100 }),
  dateSampleCollected: timestamp("date_sample_collected"),
  organization: varchar("organization", { length: 255 }),
  clinician: varchar("clinician", { length: 255 }),
  city: varchar("city", { length: 255 }),
  patientName: varchar("patient_name", { length: 255 }),
  patientEmail: varchar("patient_email", { length: 255 }),
  patientPhone: varchar("patient_phone", { length: 50 }),
  serviceName: varchar("service_name", { length: 255 }),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  salesResponsiblePerson: varchar("sales_responsible_person", { length: 255 }),
  invoiceAmount: decimal("invoice_amount", { precision: 10, scale: 2 }),
  invoiceDate: timestamp("invoice_date"),
  paymentReceivedAmount: decimal("payment_received_amount", { precision: 10, scale: 2 }),
  utrDetails: varchar("utr_details", { length: 255 }),
  balanceAmountReceivedDate: timestamp("balance_amount_received_date"),
  totalPaymentReceivedStatus: varchar("total_payment_received_status", { length: 100 }),
  phlebotomistCharges: decimal("phlebotomist_charges", { precision: 10, scale: 2 }),
  sampleShipmentAmount: decimal("sample_shipment_amount", { precision: 10, scale: 2 }),
  thirdPartyCharges: decimal("third_party_charges", { precision: 10, scale: 2 }),
  otherCharges: decimal("other_charges", { precision: 10, scale: 2 }),
  thirdPartyName: varchar("third_party_name", { length: 255 }),
  thirdPartyContractDetails: text("third_party_contract_details"),
  thirdPartyPaymentStatus: varchar("third_party_payment_status", { length: 100 }),
  progenicsTrf: varchar("progenics_trf", { length: 255 }),
  approveToLabProcess: boolean("approve_to_lab_process").default(false),
  approveToReportProcess: boolean("approve_to_report_process").default(false),
  createdBy: varchar("created_by", { length: 36 }),
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
  createdAt: true,
  convertedAt: true,
});

export const insertSampleSchema = createInsertSchema(samples).omit({
  id: true,
  createdAt: true,
  sampleId: true, // generated server-side
});

export const insertLabProcessingSchema = createInsertSchema(labProcessing).omit({
  id: true,
  processedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  generatedAt: true,
  approvedAt: true,
  deliveredAt: true,
});

export const insertGeneticCounsellingSchema = createInsertSchema(geneticCounselling).omit({ id: true, createdAt: true });

export const insertFinanceRecordSchema = createInsertSchema(financeRecords).omit({
  id: true,
  createdAt: true,
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertSample = z.infer<typeof insertSampleSchema>;
export type Sample = typeof samples.$inferSelect;
export type InsertLabProcessing = z.infer<typeof insertLabProcessingSchema>;
export type LabProcessing = typeof labProcessing.$inferSelect;
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

// Extended types for joins
export type LeadWithUser = Lead & { createdBy: User | null };
export type SampleWithLead = Sample & { lead: Lead };
export type LabProcessingWithSample = LabProcessing & { sample: Sample & { lead: Lead } };
export type ReportWithSample = Report & { sample: Sample & { lead: Lead } };
export type FinanceRecordWithSample = FinanceRecord & { sample: Sample & { lead: Lead } };
export type LogisticsTrackingWithSample = LogisticsTracking & { sample: Sample & { lead: Lead } };
