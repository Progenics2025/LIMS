var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  clients: () => clients,
  financeRecords: () => financeRecords,
  geneticCounselling: () => geneticCounselling,
  insertClientSchema: () => insertClientSchema,
  insertFinanceRecordSchema: () => insertFinanceRecordSchema,
  insertGeneticCounsellingSchema: () => insertGeneticCounsellingSchema,
  insertLabProcessingSchema: () => insertLabProcessingSchema,
  insertLeadSchema: () => insertLeadSchema,
  insertLogisticsTrackingSchema: () => insertLogisticsTrackingSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPricingSchema: () => insertPricingSchema,
  insertRecycleBinSchema: () => insertRecycleBinSchema,
  insertReportSchema: () => insertReportSchema,
  insertSalesActivitySchema: () => insertSalesActivitySchema,
  insertSampleSchema: () => insertSampleSchema,
  insertUserSchema: () => insertUserSchema,
  labProcessing: () => labProcessing,
  leadTrfs: () => leadTrfs,
  leads: () => leads,
  logisticsTracking: () => logisticsTracking,
  notifications: () => notifications,
  pricing: () => pricing,
  recycleBin: () => recycleBin,
  reports: () => reports,
  salesActivities: () => salesActivities,
  samples: () => samples,
  users: () => users
});
import { sql } from "drizzle-orm";
import { mysqlTable, varchar, text, int, timestamp, boolean, decimal, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
var users, leads, leadTrfs, samples, labProcessing, reports, geneticCounselling, financeRecords, logisticsTracking, pricing, salesActivities, clients, notifications, recycleBin, insertRecycleBinSchema, insertUserSchema, insertLeadSchema, insertSampleSchema, insertLabProcessingSchema, insertReportSchema, insertGeneticCounsellingSchema, insertFinanceRecordSchema, insertLogisticsTrackingSchema, insertPricingSchema, insertSalesActivitySchema, insertClientSchema, insertNotificationSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: varchar("id", { length: 36 }).primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      email: varchar("email", { length: 255 }).notNull().unique(),
      password: varchar("password", { length: 255 }).notNull(),
      role: varchar("role", { length: 100 }).notNull(),
      // sales, operations, finance, lab, bioinformatics, reporting, manager, admin
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
      lastLogin: timestamp("last_login")
    });
    leads = mysqlTable("leads", {
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
      tat: int("tat").notNull(),
      // days
      status: varchar("status", { length: 50 }).default("quoted"),
      // quoted, cold, hot, won, converted, closed
      createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
      createdBy: varchar("created_by", { length: 36 }),
      convertedAt: timestamp("converted_at"),
      category: varchar("category", { length: 50 }).default("clinical"),
      // clinical, discovery
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
      phlebotomistCharges: decimal("phlebotomist_charges", { precision: 10, scale: 2 })
    });
    leadTrfs = mysqlTable("lead_trfs", {
      id: varchar("id", { length: 36 }).primaryKey(),
      leadId: varchar("lead_id", { length: 36 }),
      filename: varchar("filename", { length: 255 }),
      data: text("data"),
      // drizzle mysql-core doesn't have LONGBLOB helper; store as text for now and use raw SQL if needed
      createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`)
    });
    samples = mysqlTable("samples", {
      id: varchar("id", { length: 36 }).primaryKey(),
      sampleId: varchar("sample_id", { length: 64 }).notNull().unique(),
      leadId: varchar("lead_id", { length: 36 }).notNull(),
      status: varchar("status", { length: 50 }).default("pickup_scheduled"),
      // pickup_scheduled, in_transit, received, lab_processing, bioinformatics, reporting, completed
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
      labDestination: varchar("lab_destination", { length: 100 }).default("internal"),
      // internal, third_party
      thirdPartyLab: varchar("third_party_lab", { length: 255 }),
      thirdPartyAddress: text("third_party_address"),
      courierPartner: varchar("courier_partner", { length: 100 }),
      pickupDate: timestamp("pickup_date"),
      trackingNumber: varchar("tracking_number", { length: 100 }),
      shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
      specialInstructions: text("special_instructions")
    });
    labProcessing = mysqlTable("lab_processing", {
      id: varchar("id", { length: 36 }).primaryKey(),
      sampleId: varchar("sample_id", { length: 36 }).notNull(),
      labId: varchar("lab_id", { length: 100 }).notNull(),
      qcStatus: varchar("qc_status", { length: 100 }),
      // passed, failed, retest_required
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
      processingTime: int("processing_time"),
      // minutes
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
      progenicsTrf: varchar("progenics_trf", { length: 255 })
    });
    reports = mysqlTable("reports", {
      id: varchar("id", { length: 36 }).primaryKey(),
      sampleId: varchar("sample_id", { length: 36 }).notNull(),
      status: varchar("status", { length: 50 }).default("in_progress"),
      // in_progress, awaiting_approval, approved, delivered
      reportPath: varchar("report_path", { length: 500 }),
      generatedAt: timestamp("generated_at"),
      approvedAt: timestamp("approved_at"),
      approvedBy: varchar("approved_by", { length: 36 }),
      deliveredAt: timestamp("delivered_at"),
      // Additional fields from Excel sheets
      reportType: varchar("report_type", { length: 100 }),
      reportFormat: varchar("report_format", { length: 50 }),
      // pdf, excel, word
      findings: text("findings"),
      recommendations: text("recommendations"),
      clinicalInterpretation: text("clinical_interpretation"),
      technicalNotes: text("technical_notes"),
      qualityControl: json("quality_control"),
      validationStatus: varchar("validation_status", { length: 50 }),
      reportVersion: varchar("report_version", { length: 20 }),
      deliveryMethod: varchar("delivery_method", { length: 50 }),
      // email, portal, courier
      recipientEmail: varchar("recipient_email", { length: 255 })
    });
    geneticCounselling = mysqlTable("genetic_counselling", {
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
      approvalStatus: varchar("approval_status", { length: 50 }).default("pending")
      // preserve auto-created timestamp
      // createdAt already defined above
      // existing fields end
      // Note: `counsellingStartTime` / `counsellingEndTime` are mapped above to snake_case columns
    });
    financeRecords = mysqlTable("finance_records", {
      id: varchar("id", { length: 36 }).primaryKey(),
      sampleId: varchar("sample_id", { length: 36 }),
      leadId: varchar("lead_id", { length: 36 }),
      invoiceNumber: varchar("invoice_number", { length: 100 }).unique(),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      paymentStatus: varchar("payment_status", { length: 50 }).default("pending"),
      // pending, partial, paid, overdue
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
      createdBy: varchar("created_by", { length: 36 })
    });
    logisticsTracking = mysqlTable("logistics_tracking", {
      id: varchar("id", { length: 36 }).primaryKey(),
      sampleId: varchar("sample_id", { length: 36 }),
      trackingNumber: varchar("tracking_number", { length: 100 }),
      courierName: varchar("courier_name", { length: 100 }),
      pickupDate: timestamp("pickup_date"),
      estimatedDelivery: timestamp("estimated_delivery"),
      actualDelivery: timestamp("actual_delivery"),
      status: varchar("status", { length: 50 }).default("scheduled"),
      // scheduled, picked_up, in_transit, delivered, failed
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
      deliveryNotes: text("delivery_notes")
    });
    pricing = mysqlTable("pricing", {
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
      turnaroundTime: int("turnaround_time"),
      // days
      sampleRequirements: text("sample_requirements"),
      methodology: varchar("methodology", { length: 255 }),
      accreditation: varchar("accreditation", { length: 255 }),
      validFrom: timestamp("valid_from"),
      validTo: timestamp("valid_to"),
      notes: text("notes")
    });
    salesActivities = mysqlTable("sales_activities", {
      id: varchar("id", { length: 36 }).primaryKey(),
      leadId: varchar("lead_id", { length: 36 }),
      activityType: varchar("activity_type", { length: 50 }).notNull(),
      // call, email, meeting, follow_up, proposal
      description: text("description"),
      outcome: varchar("outcome", { length: 100 }),
      nextAction: varchar("next_action", { length: 255 }),
      scheduledDate: timestamp("scheduled_date"),
      completedDate: timestamp("completed_date"),
      assignedTo: varchar("assigned_to", { length: 36 }),
      createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`),
      // Additional fields from Excel sheets
      duration: int("duration"),
      // minutes
      priority: varchar("priority", { length: 50 }),
      status: varchar("status", { length: 50 }).default("planned"),
      // planned, in_progress, completed, cancelled
      notes: text("notes"),
      attachments: json("attachments")
    });
    clients = mysqlTable("clients", {
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
      clientType: varchar("client_type", { length: 50 }),
      // individual, hospital, clinic, corporate
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
      tags: json("tags")
    });
    notifications = mysqlTable("notifications", {
      id: varchar("id", { length: 36 }).primaryKey(),
      userId: varchar("user_id", { length: 36 }),
      title: varchar("title", { length: 255 }).notNull(),
      message: text("message").notNull(),
      type: varchar("type", { length: 100 }).notNull(),
      // lead_converted, payment_pending, report_ready, etc.
      isRead: boolean("is_read").default(false),
      relatedId: varchar("related_id", { length: 36 }),
      // related lead, sample, or report ID
      createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`)
    });
    recycleBin = mysqlTable("recycle_bin", {
      id: varchar("id", { length: 36 }).primaryKey(),
      entityType: varchar("entity_type", { length: 100 }).notNull(),
      entityId: varchar("entity_id", { length: 255 }),
      data: json("data"),
      originalPath: varchar("original_path", { length: 500 }),
      createdBy: varchar("created_by", { length: 36 }),
      deletedAt: timestamp("deleted_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`)
    });
    insertRecycleBinSchema = createInsertSchema(recycleBin).omit({ id: true, deletedAt: true });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true,
      lastLogin: true
    });
    insertLeadSchema = createInsertSchema(leads).omit({
      id: true,
      createdAt: true,
      convertedAt: true
    });
    insertSampleSchema = createInsertSchema(samples).omit({
      id: true,
      createdAt: true,
      sampleId: true
      // generated server-side
    });
    insertLabProcessingSchema = createInsertSchema(labProcessing).omit({
      id: true,
      processedAt: true
    });
    insertReportSchema = createInsertSchema(reports).omit({
      id: true,
      generatedAt: true,
      approvedAt: true,
      deliveredAt: true
    });
    insertGeneticCounsellingSchema = createInsertSchema(geneticCounselling).omit({ id: true, createdAt: true });
    insertFinanceRecordSchema = createInsertSchema(financeRecords).omit({
      id: true,
      createdAt: true
    });
    insertLogisticsTrackingSchema = createInsertSchema(logisticsTracking).omit({
      id: true,
      createdAt: true
    });
    insertPricingSchema = createInsertSchema(pricing).omit({
      id: true,
      createdAt: true
    });
    insertSalesActivitySchema = createInsertSchema(salesActivities).omit({
      id: true,
      createdAt: true
    });
    insertClientSchema = createInsertSchema(clients).omit({
      id: true,
      createdAt: true
    });
    insertNotificationSchema = createInsertSchema(notifications).omit({
      id: true,
      createdAt: true
    });
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import bcrypt2 from "bcrypt";

// server/storage.ts
init_schema();
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

// server/db.ts
import "dotenv/config";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
function getDbConfig() {
  const config2 = {
    host: process.env.DB_HOST || "192.168.29.11",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "remote_user",
    // allow percent-encoded passwords in env (e.g. Prolab%2305) and decode them
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.includes("%") ? decodeURIComponent(process.env.DB_PASSWORD) : process.env.DB_PASSWORD : "Prolab#05",
    database: process.env.DB_NAME || "leadlab_lims",
    ssl: false,
    connectTimeout: 6e4,
    charset: "utf8mb4"
  };
  console.log("Database config:", { ...config2, password: "***" });
  return config2;
}
var config = getDbConfig();
var pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: void 0,
  // Remove SSL for local connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
pool.getConnection().then((connection) => {
  console.log("\u2705 Database connection pool initialized successfully");
  connection.release();
}).catch((err) => {
  console.error("\u274C Error initializing database connection pool:", {
    code: err.code,
    errno: err.errno,
    sqlState: err.sqlState,
    sqlMessage: err.sqlMessage
  });
  process.exit(1);
});
var db = drizzle(pool);

// server/storage.ts
import { and, eq, asc, desc } from "drizzle-orm";
var DBStorage = class {
  connectionWorking = false;
  constructor() {
    this.initializeConnection();
  }
  async initializeConnection() {
    try {
      await this.testConnection();
      try {
        await this.ensureRecycleTable();
      } catch (e) {
        console.error("Failed to ensure recycle table exists:", e.message);
      }
      await this.ensureDefaultAdmin();
    } catch (error) {
      console.error("Failed to initialize database connection:", error.message);
      console.log("\u26A0\uFE0F Application will run in mock data mode");
    }
  }
  // Create recycle_bin table if it does not exist to avoid runtime errors
  async ensureRecycleTable() {
    try {
      const sql3 = `
      CREATE TABLE IF NOT EXISTS recycle_bin (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(255),
        data JSON,
        original_path VARCHAR(500),
        created_by VARCHAR(36),
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      await pool.execute(sql3);
      console.log("\u2705 Ensured recycle_bin table exists");
    } catch (err) {
      console.error("Failed to create recycle_bin table:", err?.message || err);
      throw err;
    }
  }
  async testConnection() {
    try {
      console.log("Testing database connection...");
      const testQuery = await db.select().from(users).limit(1);
      console.log("\u2705 Database connection successful");
      this.connectionWorking = true;
    } catch (error) {
      console.error("\u274C Database connection failed:", error.message);
      console.log("\u26A0\uFE0F Using mock data mode due to database connection issues");
      this.connectionWorking = false;
      throw error;
    }
  }
  async ensureDefaultAdmin() {
    const existing = await db.select().from(users).limit(1);
    if (existing.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const id = randomUUID();
      await db.insert(users).values({
        id,
        name: "Admin User",
        email: "admin@lims.com",
        password: hashedPassword,
        role: "admin",
        isActive: true
      });
    }
  }
  async getUser(id) {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0];
  }
  async getUserByEmail(email) {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0];
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    await db.insert(users).values({
      id,
      name: insertUser.name,
      email: insertUser.email,
      password: hashedPassword,
      role: insertUser.role,
      isActive: insertUser.isActive ?? true,
      lastLogin: null
    });
    const created = await this.getUser(id);
    if (!created) throw new Error("Failed to create user");
    return created;
  }
  async updateUser(id, updates) {
    await db.update(users).set(updates).where(eq(users.id, id));
    return this.getUser(id);
  }
  async getAllUsers() {
    return db.select().from(users);
  }
  async deleteUser(id) {
    try {
      try {
        const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (rows[0]) {
          const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          await db.insert(recycleBin2).values({ id: randomUUID(), entityType: "users", entityId: id, data: rows[0], originalPath: `/users/${id}` });
        }
      } catch (e) {
        console.error("Failed to create recycle snapshot for user:", e.message);
      }
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Failed to delete user:", error.message);
      return false;
    }
  }
  async deleteLead(id) {
    try {
      try {
        const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
        if (rows[0]) {
          const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          await db.insert(recycleBin2).values({ id: randomUUID(), entityType: "leads", entityId: id, data: rows[0], originalPath: `/leads/${id}` });
        }
      } catch (e) {
        console.error("Failed to create recycle snapshot for lead:", e.message);
      }
      await db.delete(leads).where(eq(leads.id, id));
      return true;
    } catch (error) {
      console.error("Failed to delete lead:", error.message);
      return false;
    }
  }
  async createLead(insertLead) {
    const id = randomUUID();
    await db.insert(leads).values({
      id,
      organization: insertLead.organization,
      location: insertLead.location,
      referredDoctor: insertLead.referredDoctor,
      clinicHospitalName: insertLead.clinicHospitalName ?? null,
      phone: insertLead.phone,
      email: insertLead.email,
      clientEmail: insertLead.clientEmail,
      testName: insertLead.testName,
      sampleType: insertLead.sampleType,
      category: insertLead.category ?? "clinical",
      amountQuoted: insertLead.amountQuoted,
      tat: insertLead.tat,
      status: insertLead.status ?? "quoted",
      createdBy: insertLead.createdBy ?? null,
      convertedAt: null,
      // Discovery-specific fields
      discoveryOrganization: insertLead.discoveryOrganization ?? null,
      clinicianName: insertLead.clinicianName ?? null,
      specialty: insertLead.specialty ?? null,
      clinicianOrgEmail: insertLead.clinicianOrgEmail ?? null,
      clinicianOrgPhone: insertLead.clinicianOrgPhone ?? null,
      serviceName: insertLead.serviceName ?? null,
      discoveryStatus: insertLead.discoveryStatus ?? null,
      followUp: insertLead.followUp ?? null,
      leadType: insertLead.leadType ?? null,
      budget: insertLead.budget ?? null,
      noOfSamples: insertLead.noOfSamples ?? null,
      patientClientName: insertLead.patientClientName ?? null,
      age: insertLead.age ?? null,
      gender: insertLead.gender ?? null,
      patientClientPhone: insertLead.patientClientPhone ?? null,
      patientClientEmail: insertLead.patientClientEmail ?? null,
      salesResponsiblePerson: insertLead.salesResponsiblePerson ?? null,
      geneticCounsellorRequired: insertLead.geneticCounsellorRequired ?? false,
      dateSampleReceived: insertLead.dateSampleReceived ?? null,
      dateSampleCollected: insertLead.dateSampleCollected ?? null,
      // Pickup / tracking fields
      pickupFrom: insertLead.pickupFrom ?? null,
      pickupUpto: insertLead.pickupUpto ?? null,
      shippingAmount: insertLead.shippingAmount ?? null,
      trackingId: insertLead.trackingId ?? null,
      courierCompany: insertLead.courierCompany ?? null,
      progenicsTRF: insertLead.progenicsTRF ?? null,
      phlebotomistCharges: insertLead.phlebotomistCharges ?? null
    });
    const created = await this.getLeadById(id);
    if (!created) throw new Error("Failed to create lead");
    return created;
  }
  async createLeadTrf(leadTrf) {
    const id = randomUUID();
    try {
      const base64 = leadTrf.data.toString("base64");
      await db.insert((await Promise.resolve().then(() => (init_schema(), schema_exports))).leadTrfs).values({ id, leadId: leadTrf.leadId, filename: leadTrf.filename, data: base64 });
      return { id, filename: leadTrf.filename };
    } catch (error) {
      console.error("Failed to insert lead TRF into DB", error.message);
      throw error;
    }
  }
  async getLeadTrf(id) {
    try {
      const schema = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const rows = await db.select().from(schema.leadTrfs).where(eq(schema.leadTrfs.id, id)).limit(1);
      const row = rows[0];
      if (!row) return void 0;
      const buf = Buffer.from(row.data || "", "base64");
      return { id: row.id, filename: row.filename, data: buf };
    } catch (error) {
      console.error("Failed to fetch lead TRF from DB", error.message);
      return void 0;
    }
  }
  async getLeads(userRole, userId) {
    if (!this.connectionWorking) {
      return [
        {
          id: "1",
          organization: "Apollo Hospitals",
          location: "Chennai",
          referredDoctor: "Dr. Smith",
          clinicHospitalName: "Apollo Main",
          phone: "+91-9876543210",
          email: "contact@apollo.com",
          clientEmail: "patient@apollo.com",
          testName: "Whole Genome Sequencing",
          sampleType: "Blood",
          category: "clinical",
          amountQuoted: "45000",
          tat: 14,
          status: "hot",
          createdAt: /* @__PURE__ */ new Date(),
          createdBy: null,
          convertedAt: null,
          discoveryOrganization: null,
          clinicianName: null,
          specialty: null,
          clinicianOrgEmail: null,
          clinicianOrgPhone: null,
          serviceName: null,
          discoveryStatus: null,
          followUp: null,
          leadType: null,
          budget: null,
          noOfSamples: null,
          patientClientName: null,
          age: null,
          gender: null,
          patientClientPhone: null,
          patientClientEmail: null,
          // Pickup/tracking fields
          pickupFrom: null,
          pickupUpto: null,
          shippingAmount: null,
          trackingId: null,
          courierCompany: null,
          progenicsTRF: null,
          phlebotomistCharges: null,
          salesResponsiblePerson: null,
          geneticCounsellorRequired: false,
          dateSampleReceived: null,
          dateSampleCollected: null
        },
        {
          id: "2",
          organization: "Fortis Healthcare",
          location: "Mumbai",
          referredDoctor: "Dr. Patel",
          clinicHospitalName: "Fortis Mulund",
          phone: "+91-9876543211",
          email: "contact@fortis.com",
          clientEmail: "patient@fortis.com",
          testName: "Exome Sequencing",
          sampleType: "Saliva",
          category: "discovery",
          amountQuoted: "25000",
          tat: 10,
          status: "quoted",
          createdAt: /* @__PURE__ */ new Date(),
          createdBy: null,
          convertedAt: null,
          discoveryOrganization: "Research Institute",
          clinicianName: "Dr. Research Lead",
          specialty: "Genetics Research",
          clinicianOrgEmail: "research@fortis.com",
          clinicianOrgPhone: "+91-9876543212",
          serviceName: "Discovery Sequencing Service",
          discoveryStatus: "In Progress",
          followUp: "Weekly updates",
          leadType: "Research",
          budget: "50000",
          noOfSamples: 20,
          patientClientName: "Research Subject 001",
          age: 35,
          gender: "Male",
          patientClientPhone: "+91-9876543213",
          patientClientEmail: "subject@research.com",
          // Pickup/tracking fields
          pickupFrom: null,
          pickupUpto: null,
          shippingAmount: null,
          trackingId: null,
          courierCompany: null,
          progenicsTRF: null,
          phlebotomistCharges: null,
          salesResponsiblePerson: "John Sales Manager",
          geneticCounsellorRequired: false,
          dateSampleReceived: /* @__PURE__ */ new Date(),
          dateSampleCollected: null
        }
      ];
    }
    try {
      let whereCondition = void 0;
      if (userRole && userRole.toLowerCase() === "sales" && userId) {
        whereCondition = eq(leads.createdBy, userId);
      }
      let queryBuilder = db.select({ lead: leads, user: users, sample: samples }).from(leads).leftJoin(samples, eq(samples.leadId, leads.id)).leftJoin(users, eq(leads.createdBy, users.id));
      if (whereCondition) {
        queryBuilder = queryBuilder.where(whereCondition);
      }
      const rows = await queryBuilder;
      return rows.map((row) => {
        const leadObj = { ...row.lead };
        leadObj.createdBy = row.user ?? null;
        leadObj.sample = row.sample ? { ...row.sample } : null;
        leadObj.sampleId = row.sample?.sampleId ?? leadObj.sampleId ?? null;
        return leadObj;
      });
    } catch (error) {
      console.error("Error fetching leads:", error);
      return [
        {
          id: "1",
          organization: "Apollo Hospitals",
          location: "Chennai",
          referredDoctor: "Dr. Smith",
          clinicHospitalName: "Apollo Main",
          phone: "+91-9876543210",
          email: "contact@apollo.com",
          clientEmail: "patient@apollo.com",
          testName: "Whole Genome Sequencing",
          sampleType: "Blood",
          category: "clinical",
          amountQuoted: "45000",
          tat: 14,
          status: "hot",
          createdAt: /* @__PURE__ */ new Date(),
          createdBy: null,
          convertedAt: null,
          discoveryOrganization: null,
          clinicianName: null,
          specialty: null,
          clinicianOrgEmail: null,
          clinicianOrgPhone: null,
          serviceName: null,
          discoveryStatus: null,
          followUp: null,
          leadType: null,
          budget: null,
          noOfSamples: null,
          patientClientName: null,
          age: null,
          gender: null,
          patientClientPhone: null,
          patientClientEmail: null,
          // tracking fields
          pickupFrom: null,
          pickupUpto: null,
          shippingAmount: null,
          trackingId: null,
          courierCompany: null,
          progenicsTRF: null,
          phlebotomistCharges: null,
          salesResponsiblePerson: null,
          geneticCounsellorRequired: false,
          dateSampleReceived: null,
          dateSampleCollected: null
        }
      ];
    }
  }
  async getLeadById(id) {
    const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return rows[0];
  }
  async updateLead(id, updates) {
    await db.update(leads).set(updates).where(eq(leads.id, id));
    return this.getLeadById(id);
  }
  async updateLeadStatus(id, status) {
    await db.update(leads).set({ status }).where(eq(leads.id, id));
    return this.getLeadById(id);
  }
  async findLeadByEmailPhone(email, phone) {
    const rows = await db.select().from(leads).where(and(eq(leads.email, email), eq(leads.phone, phone))).limit(1);
    return rows[0];
  }
  generateSampleId(category) {
    const now = /* @__PURE__ */ new Date();
    const prefix = category && category.toLowerCase() === "discovery" ? "DG" : "PG";
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const date = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${prefix}${year}${month}${date}${hours}${minutes}${seconds}`;
  }
  async convertLead(leadId, sampleData) {
    try {
      const lead = await this.getLeadById(leadId);
      if (!lead) throw new Error("Lead not found");
      console.log("Converting lead:", lead.id, "category:", lead.category);
      console.log("Sample data:", sampleData);
      return await db.transaction(async (tx) => {
        await tx.update(leads).set({ status: "converted", convertedAt: /* @__PURE__ */ new Date() }).where(eq(leads.id, leadId));
        console.log("\u2705 Lead status updated to converted");
        const sampleIdStr = this.generateSampleId(lead.category || "clinical");
        const sampleId = randomUUID();
        console.log("\u2705 Generated sample ID:", sampleIdStr, "UUID:", sampleId);
        await tx.insert(samples).values({
          id: sampleId,
          sampleId: sampleIdStr,
          leadId,
          status: sampleData.status ?? "pickup_scheduled",
          courierDetails: sampleData.courierDetails ?? null,
          amount: sampleData.amount,
          paidAmount: sampleData.paidAmount ?? "0",
          // New tracking fields
          // Extra tracking fields (may not be in InsertSample type) - cast to any
          ...{ titleUniqueId: sampleData.titleUniqueId ?? null },
          ...{ sampleUniqueId: sampleData.sampleUniqueId ?? null },
          sampleCollectedDate: sampleData.sampleCollectedDate ?? null,
          sampleShippedDate: sampleData.sampleShippedDate ?? null,
          sampleDeliveryDate: sampleData.sampleDeliveryDate ?? null,
          responsiblePerson: sampleData.responsiblePerson ?? null,
          organization: sampleData.organization ?? null,
          senderCity: sampleData.senderCity ?? null,
          senderContact: sampleData.senderContact ?? null,
          receiverAddress: sampleData.receiverAddress ?? null,
          trackingId: sampleData.trackingId ?? null,
          courierCompany: sampleData.courierCompany ?? null,
          labAlertStatus: sampleData.labAlertStatus ?? null,
          thirdPartyName: sampleData.thirdPartyName ?? null,
          thirdPartyContractDetails: sampleData.thirdPartyContractDetails ?? null,
          thirdPartySentDate: sampleData.thirdPartySentDate ?? null,
          thirdPartyReceivedDate: sampleData.thirdPartyReceivedDate ?? null,
          comments: sampleData.comments ?? null
        });
        console.log("\u2705 Sample created in database");
        const financeId = randomUUID();
        await tx.insert(financeRecords).values({
          id: financeId,
          sampleId,
          leadId,
          invoiceNumber: sampleData.invoiceNumber ?? null,
          amount: sampleData.amount ?? "0",
          taxAmount: sampleData.taxAmount ?? "0",
          totalAmount: sampleData.totalAmount ?? sampleData.amount ?? "0",
          paymentStatus: "pending",
          paymentMethod: sampleData.paymentMethod ?? null,
          paymentDate: null,
          dueDate: null,
          createdAt: /* @__PURE__ */ new Date(),
          currency: sampleData.currency ?? "INR",
          discountAmount: sampleData.discountAmount ?? "0",
          billingAddress: sampleData.billingAddress ?? null,
          billingContact: sampleData.billingContact ?? null,
          notes: sampleData.notes ?? null,
          titleUniqueId: sampleData.titleUniqueId ?? null,
          dateSampleCollected: sampleData.sampleCollectedDate ?? null,
          organization: sampleData.organization ?? null,
          clinician: sampleData.clinician ?? null,
          city: sampleData.city ?? null,
          patientName: sampleData.patientClientName ?? null,
          patientEmail: sampleData.patientClientEmail ?? null,
          patientPhone: sampleData.patientClientPhone ?? null,
          serviceName: sampleData.serviceName ?? null
        });
        const labId = randomUUID();
        await tx.insert(labProcessing).values({
          id: labId,
          sampleId,
          labId: sampleData.labId ?? "default",
          qcStatus: sampleData.qcStatus ?? "pending",
          dnaRnaQuantity: sampleData.dnaRnaQuantity ?? null,
          runId: sampleData.runId ?? null,
          libraryPrepared: false,
          sequencingId: null,
          isOutsourced: false,
          outsourceDetails: null,
          processedAt: null,
          processedBy: null,
          titleUniqueId: sampleData.titleUniqueId ?? null,
          sampleDeliveryDate: sampleData.sampleDeliveryDate ?? null,
          serviceName: sampleData.serviceName ?? null,
          protocol1: sampleData.protocol1 ?? null,
          isolationMethod: sampleData.isolationMethod ?? null,
          qualityCheckDNA: sampleData.qualityCheckDNA ?? null,
          statusDNAExtraction: sampleData.statusDNAExtraction ?? null,
          protocol2: sampleData.protocol2 ?? null,
          libraryPreparationProtocol: sampleData.libraryPreparationProtocol ?? null,
          qualityCheck2: sampleData.qualityCheck2 ?? null,
          purificationProtocol: sampleData.purificationProtocol ?? null,
          productQualityCheck: sampleData.productQualityCheck ?? null,
          statusLibraryPreparation: sampleData.statusLibraryPreparation ?? null,
          transitStatus: sampleData.transitStatus ?? null,
          financeApproval: null,
          completeStatus: null,
          progenicsTrf: sampleData.progenicsTRF ?? null,
          sampleType: sampleData.sampleType ?? null,
          extractionMethod: sampleData.extractionMethod ?? null,
          concentration: sampleData.concentration ?? null,
          purity: sampleData.purity ?? null,
          volume: sampleData.volume ?? null,
          qualityScore: sampleData.qualityScore ?? null,
          processingNotes: sampleData.processingNotes ?? null,
          equipmentUsed: sampleData.equipmentUsed ?? null,
          reagents: sampleData.reagents ?? null,
          processingTime: sampleData.processingTime ?? null,
          temperature: sampleData.temperature ?? null,
          humidity: sampleData.humidity ?? null
        });
        console.log("\u2705 Finance and lab_processing placeholders created");
        let createdGc = null;
        try {
          const leadServiceName = lead.serviceName || lead.service_name || "";
          const gcRequired = lead.geneticCounsellorRequired ?? lead.genetic_counsellor_required ?? false;
          const leadFollowUp = lead.followUp || lead.follow_up || "";
          const requestGcFlag = !!sampleData?.createGeneticCounselling || !!sampleData?.createGc || !!sampleData?.create_genetic_counselling;
          const shouldCreateGc = requestGcFlag || (String(leadServiceName).toLowerCase().includes("wes") || String(leadFollowUp).toLowerCase().includes("gc")) && !!gcRequired;
          console.log("GC decision: leadServiceName=", leadServiceName, "leadFollowUp=", leadFollowUp, "gcRequired=", gcRequired, "requestGcFlag=", requestGcFlag, "shouldCreateGc=", shouldCreateGc);
          if (shouldCreateGc) {
            const gcId = randomUUID();
            await tx.insert((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).values({
              id: gcId,
              sampleId: sampleIdStr,
              gcName: "",
              counsellingType: null,
              counsellingStartTime: null,
              counsellingEndTime: null,
              gcSummary: null,
              extendedFamilyTesting: false,
              approvalStatus: "pending"
            });
            const gcRows = await tx.select().from((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).where(eq((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.id, gcId)).limit(1);
            createdGc = gcRows[0] ?? null;
            console.log("\u2705 Genetic counselling record created for sample", sampleIdStr);
          }
        } catch (err) {
          console.error("Failed to create genetic counselling record during conversion:", err.message);
        }
        const updatedLeadRows = await tx.select().from(leads).where(eq(leads.id, leadId)).limit(1);
        const updatedLead = updatedLeadRows[0];
        const financeRows = await tx.select().from(financeRecords).where(eq(financeRecords.id, financeId)).limit(1);
        const createdFinance = financeRows[0];
        const labRows = await tx.select().from(labProcessing).where(eq(labProcessing.id, labId)).limit(1);
        const createdLab = labRows[0];
        return { lead: updatedLead, sample: {
          id: sampleId,
          sampleId: sampleIdStr,
          leadId,
          status: sampleData.status ?? "pickup_scheduled",
          courierDetails: sampleData.courierDetails ?? null,
          amount: sampleData.amount,
          paidAmount: sampleData.paidAmount ?? "0",
          // New tracking fields echoed back
          titleUniqueId: sampleData.titleUniqueId ?? null,
          sampleUniqueId: sampleData.sampleUniqueId ?? null,
          sampleCollectedDate: sampleData.sampleCollectedDate ?? null,
          sampleShippedDate: sampleData.sampleShippedDate ?? null,
          sampleDeliveryDate: sampleData.sampleDeliveryDate ?? null,
          responsiblePerson: sampleData.responsiblePerson ?? null,
          organization: sampleData.organization ?? null,
          senderCity: sampleData.senderCity ?? null,
          senderContact: sampleData.senderContact ?? null,
          receiverAddress: sampleData.receiverAddress ?? null,
          trackingId: sampleData.trackingId ?? null,
          courierCompany: sampleData.courierCompany ?? null,
          labAlertStatus: sampleData.labAlertStatus ?? null,
          thirdPartyName: sampleData.thirdPartyName ?? null,
          thirdPartyContractDetails: sampleData.thirdPartyContractDetails ?? null,
          thirdPartySentDate: sampleData.thirdPartySentDate ?? null,
          thirdPartyReceivedDate: sampleData.thirdPartyReceivedDate ?? null,
          comments: sampleData.comments ?? null,
          createdAt: /* @__PURE__ */ new Date()
        }, finance: createdFinance, labProcessing: createdLab, geneticCounselling: createdGc };
      });
    } catch (error) {
      console.error("\u274C Error in convertLead:", error);
      throw error;
    }
  }
  async getSamples() {
    const rows = await db.select({ sample: samples, lead: leads }).from(samples).leftJoin(leads, eq(samples.leadId, leads.id));
    return rows.map((row) => ({
      ...row.sample,
      lead: row.lead
    }));
  }
  async getSampleById(id) {
    const rows = await db.select().from(samples).where(eq(samples.id, id)).limit(1);
    return rows[0];
  }
  async updateSample(id, updates) {
    await db.update(samples).set(updates).where(eq(samples.id, id));
    return this.getSampleById(id);
  }
  async deleteSample(id) {
    try {
      try {
        const rows = await db.select().from(samples).where(eq(samples.id, id)).limit(1);
        if (rows[0]) {
          const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          await db.insert(recycleBin2).values({ id: randomUUID(), entityType: "samples", entityId: id, data: rows[0], originalPath: `/samples/${id}` });
        }
      } catch (e) {
        console.error("Failed to create recycle snapshot for sample:", e.message);
      }
      await db.delete(samples).where(eq(samples.id, id));
      return true;
    } catch (error) {
      console.error("Failed to delete sample:", error.message);
      return false;
    }
  }
  async createLabProcessing(labData) {
    const id = randomUUID();
    let resolvedSampleId = labData.sampleId;
    try {
      const byId = await db.select().from(samples).where(eq(samples.id, labData.sampleId)).limit(1);
      if (!byId[0]) {
        const byHuman = await db.select().from(samples).where(eq(samples.sampleId, labData.sampleId)).limit(1);
        if (byHuman[0]) resolvedSampleId = byHuman[0].id;
        else throw new Error(`Sample not found for sample identifier: ${labData.sampleId}`);
      }
    } catch (err) {
      console.error("Failed to resolve sampleId for lab processing:", err.message);
      throw err;
    }
    await db.insert(labProcessing).values({
      id,
      sampleId: resolvedSampleId,
      labId: labData.labId,
      qcStatus: labData.qcStatus ?? null,
      dnaRnaQuantity: labData.dnaRnaQuantity ?? null,
      runId: labData.runId ?? null,
      libraryPrepared: labData.libraryPrepared ?? false,
      sequencingId: labData.sequencingId ?? null,
      isOutsourced: labData.isOutsourced ?? false,
      outsourceDetails: labData.outsourceDetails ?? null,
      processedBy: labData.processedBy ?? null,
      // Additional detailed fields (client-side form expects these)
      titleUniqueId: labData.titleUniqueId ?? null,
      sampleDeliveryDate: labData.sampleDeliveryDate ?? null,
      serviceName: labData.serviceName ?? null,
      protocol1: labData.protocol1 ?? null,
      isolationMethod: labData.isolationMethod ?? null,
      qualityCheckDNA: labData.qualityCheckDNA ?? null,
      statusDNAExtraction: labData.statusDNAExtraction ?? null,
      protocol2: labData.protocol2 ?? null,
      libraryPreparationProtocol: labData.libraryPreparationProtocol ?? null,
      qualityCheck2: labData.qualityCheck2 ?? null,
      purificationProtocol: labData.purificationProtocol ?? null,
      productQualityCheck: labData.productQualityCheck ?? null,
      statusLibraryPreparation: labData.statusLibraryPreparation ?? null,
      transitStatus: labData.transitStatus ?? null,
      financeApproval: labData.financeApproval ?? null,
      completeStatus: labData.completeStatus ?? null,
      progenicsTrf: labData.progenicsTrf ?? null,
      sampleType: labData.sampleType ?? null,
      extractionMethod: labData.extractionMethod ?? null,
      concentration: labData.concentration ?? null,
      purity: labData.purity ?? null,
      volume: labData.volume ?? null,
      qualityScore: labData.qualityScore ?? null,
      processingNotes: labData.processingNotes ?? null,
      equipmentUsed: labData.equipmentUsed ?? null,
      reagents: labData.reagents ?? null,
      processingTime: labData.processingTime ?? null,
      temperature: labData.temperature ?? null,
      humidity: labData.humidity ?? null
    });
    const created = await this.getLabProcessingBySampleId(resolvedSampleId);
    if (!created) throw new Error("Failed to create lab processing");
    return created;
  }
  async getLabProcessingBySampleId(sampleId) {
    const rows = await db.select().from(labProcessing).where(eq(labProcessing.sampleId, sampleId)).limit(1);
    return rows[0];
  }
  async getLabProcessingById(id) {
    const rows = await db.select().from(labProcessing).where(eq(labProcessing.id, id)).limit(1);
    return rows[0];
  }
  async getLabProcessingQueue() {
    const rows = await db.select({ lp: labProcessing, sample: samples, lead: leads }).from(labProcessing).leftJoin(samples, eq(labProcessing.sampleId, samples.id)).leftJoin(leads, eq(samples.leadId, leads.id));
    return rows.map((row) => ({
      ...row.lp,
      sample: {
        ...row.sample,
        lead: row.lead
      }
    }));
  }
  async updateLabProcessing(id, updates) {
    let safeUpdates;
    try {
      safeUpdates = { ...updates };
      const toDbDate = (v) => {
        if (v == null) return v;
        if (v instanceof Date) return v;
        if (typeof v === "string") {
          if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?/.test(v)) {
            const d = new Date(v);
            if (!isNaN(d.getTime())) return d;
          }
          return v;
        }
        return v;
      };
      for (const k of Object.keys(safeUpdates)) {
        safeUpdates[k] = toDbDate(safeUpdates[k]);
      }
      await db.update(labProcessing).set(safeUpdates).where(eq(labProcessing.id, id));
      const rows = await db.select().from(labProcessing).where(eq(labProcessing.id, id)).limit(1);
      return rows[0];
    } catch (error) {
      console.error("Error in updateLabProcessing:", error.message);
      try {
        console.error("Safe updates:", JSON.stringify(safeUpdates || updates, null, 2));
      } catch (e) {
        console.error("Failed to stringify safeUpdates", e);
      }
      console.error(error.stack);
      throw error;
    }
  }
  async deleteLabProcessing(id) {
    try {
      try {
        const rows = await db.select().from(labProcessing).where(eq(labProcessing.id, id)).limit(1);
        if (rows[0]) {
          const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          await db.insert(recycleBin2).values({ id: randomUUID(), entityType: "lab_processing", entityId: id, data: rows[0], originalPath: `/lab-processing/${id}` });
        }
      } catch (e) {
        console.error("Failed to create recycle snapshot for lab processing:", e.message);
      }
      await db.delete(labProcessing).where(eq(labProcessing.id, id));
      return true;
    } catch (error) {
      console.error("Failed to delete lab processing record:", error.message);
      return false;
    }
  }
  async createReport(report) {
    const id = randomUUID();
    await db.insert(reports).values({
      id,
      sampleId: report.sampleId,
      status: report.status ?? "in_progress",
      reportPath: report.reportPath ?? null,
      generatedAt: /* @__PURE__ */ new Date(),
      approvedAt: null,
      approvedBy: report.approvedBy ?? null,
      deliveredAt: null,
      reportType: report.reportType ?? null,
      reportFormat: report.reportFormat ?? null,
      findings: report.findings ?? null,
      recommendations: report.recommendations ?? null,
      clinicalInterpretation: report.clinicalInterpretation ?? null,
      technicalNotes: report.technicalNotes ?? null,
      qualityControl: report.qualityControl ?? null,
      validationStatus: report.validationStatus ?? null,
      reportVersion: report.reportVersion ?? null,
      deliveryMethod: report.deliveryMethod ?? null,
      recipientEmail: report.recipientEmail ?? null
    });
    const created = await this.getReportById(id);
    if (!created) throw new Error("Failed to create report");
    return created;
  }
  async getReports() {
    const rows = await db.select({ r: reports, sample: samples, lead: leads }).from(reports).leftJoin(samples, eq(reports.sampleId, samples.id)).leftJoin(leads, eq(samples.leadId, leads.id));
    return rows.map((row) => ({
      ...row.r,
      sample: {
        ...row.sample,
        lead: row.lead
      }
    }));
  }
  async getReportById(id) {
    const rows = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    return rows[0];
  }
  async updateReport(id, updates) {
    await db.update(reports).set(updates).where(eq(reports.id, id));
    return this.getReportById(id);
  }
  // Finance Records
  async createFinanceRecord(financeData) {
    const id = randomUUID();
    await db.insert(financeRecords).values({
      id,
      sampleId: financeData.sampleId ?? null,
      leadId: financeData.leadId ?? null,
      invoiceNumber: financeData.invoiceNumber,
      amount: financeData.amount,
      taxAmount: financeData.taxAmount ?? "0",
      totalAmount: financeData.totalAmount,
      paymentStatus: financeData.paymentStatus ?? "pending",
      paymentMethod: financeData.paymentMethod ?? null,
      paymentDate: financeData.paymentDate ?? null,
      dueDate: financeData.dueDate ?? null,
      currency: financeData.currency ?? "INR",
      discountAmount: financeData.discountAmount ?? "0",
      discountReason: financeData.discountReason ?? null,
      billingAddress: financeData.billingAddress ?? null,
      billingContact: financeData.billingContact ?? null,
      paymentTerms: financeData.paymentTerms ?? null,
      lateFees: financeData.lateFees ?? "0",
      refundAmount: financeData.refundAmount ?? "0",
      refundReason: financeData.refundReason ?? null,
      notes: financeData.notes ?? null,
      // Additional UI fields
      titleUniqueId: financeData.titleUniqueId ?? null,
      dateSampleCollected: financeData.dateSampleCollected ?? null,
      organization: financeData.organization ?? null,
      clinician: financeData.clinician ?? null,
      city: financeData.city ?? null,
      patientName: financeData.patientName ?? null,
      patientEmail: financeData.patientEmail ?? null,
      patientPhone: financeData.patientPhone ?? null,
      serviceName: financeData.serviceName ?? null,
      budget: financeData.budget ?? null,
      salesResponsiblePerson: financeData.salesResponsiblePerson ?? null,
      invoiceAmount: financeData.invoiceAmount ?? null,
      invoiceDate: financeData.invoiceDate ?? null,
      paymentReceivedAmount: financeData.paymentReceivedAmount ?? null,
      utrDetails: financeData.utrDetails ?? null,
      balanceAmountReceivedDate: financeData.balanceAmountReceivedDate ?? null,
      totalPaymentReceivedStatus: financeData.totalPaymentReceivedStatus ?? null,
      phlebotomistCharges: financeData.phlebotomistCharges ?? null,
      sampleShipmentAmount: financeData.sampleShipmentAmount ?? null,
      thirdPartyCharges: financeData.thirdPartyCharges ?? null,
      otherCharges: financeData.otherCharges ?? null,
      thirdPartyName: financeData.thirdPartyName ?? null,
      thirdPartyContractDetails: financeData.thirdPartyContractDetails ?? null,
      thirdPartyPaymentStatus: financeData.thirdPartyPaymentStatus ?? null,
      progenicsTrf: financeData.progenicsTrf ?? null,
      approveToLabProcess: financeData.approveToLabProcess ?? false,
      approveToReportProcess: financeData.approveToReportProcess ?? false,
      createdBy: financeData.createdBy ?? null
    });
    const created = await this.getFinanceRecordById(id);
    if (!created) throw new Error("Failed to create finance record");
    return created;
  }
  async getFinanceRecords(opts) {
    let page = opts?.page ?? 1;
    let pageSize = opts?.pageSize ?? 25;
    const sortBy = opts?.sortBy ?? null;
    const sortDir = opts?.sortDir ?? "desc";
    const q = (opts?.query || "").trim();
    let offset = (page - 1) * pageSize;
    if (q) {
      pageSize = 1e4;
      offset = 0;
    }
    const mapping = {
      invoiceDate: financeRecords.paymentDate,
      invoiceAmount: financeRecords.totalAmount,
      createdAt: financeRecords.createdAt
    };
    const orderExpr = sortBy ? mapping[sortBy] ?? financeRecords[sortBy] ?? void 0 : void 0;
    let rows = [];
    let total = 0;
    if (q) {
      const like = `%${q}%`;
      const searchCols = [
        "fr.invoice_number",
        "fr.id",
        // ensure we match sample id whether it's stored on finance_records or samples
        "fr.sample_id",
        "s.sample_id",
        "fr.patient_name",
        "fr.organization",
        "l.organization"
      ];
      const whereParts = searchCols.map(() => `?`).map((p, i) => `${searchCols[i]} LIKE ${p}`);
      const whereClause = `WHERE ${whereParts.join(" OR ")}`;
      const orderClause = orderExpr ? `ORDER BY ${typeof orderExpr === "string" ? orderExpr : "fr.created_at"} ${sortDir === "asc" ? "ASC" : "DESC"}` : `ORDER BY fr.created_at DESC`;
      const sqlQuery = `SELECT fr.*, s.id as s_id, s.sample_id as s_sample_id, s.*, l.*, lp.title_unique_id as lp_title_unique_id FROM finance_records fr LEFT JOIN samples s ON fr.sample_id = s.id LEFT JOIN leads l ON fr.lead_id = l.id LEFT JOIN lab_processing lp ON lp.sample_id = s.id ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
      const likeBindings = searchCols.map(() => like);
      const bindings = [...likeBindings, pageSize, offset];
      try {
        const [resultRows] = await pool.execute(sqlQuery, bindings);
        rows = resultRows;
        const countSql = `SELECT COUNT(*) as cnt FROM finance_records fr LEFT JOIN samples s ON fr.sample_id = s.id LEFT JOIN leads l ON fr.lead_id = l.id ${whereClause}`;
        const [countRes] = await pool.execute(countSql, likeBindings);
        total = countRes && countRes[0] && countRes[0].cnt ? Number(countRes[0].cnt) : 0;
      } catch (err) {
        console.error("Raw SQL finance search failed:", err);
        rows = [];
        total = 0;
      }
    } else {
      const qb = db.select({ fr: financeRecords, sample: samples, lead: leads, lp: labProcessing }).from(financeRecords).leftJoin(samples, eq(financeRecords.sampleId, samples.id)).leftJoin(leads, eq(financeRecords.leadId, leads.id)).leftJoin(labProcessing, eq(labProcessing.sampleId, samples.id)).limit(pageSize).offset(offset).orderBy(orderExpr ? sortDir === "asc" ? asc(orderExpr) : desc(orderExpr) : desc(financeRecords.createdAt));
      rows = await qb;
      const totalRows = await db.select().from(financeRecords).execute();
      total = Array.isArray(totalRows) ? totalRows.length : totalRows.length || 0;
    }
    let mapped = [];
    if (rows.length && rows[0].fr !== void 0) {
      mapped = rows.map((row) => {
        const fr = { ...row.fr };
        const sample = row.sample ? { ...row.sample } : null;
        const lp = row.lp ? { ...row.lp } : null;
        const titleUniqueId = fr.titleUniqueId ?? sample?.titleUniqueId ?? lp?.titleUniqueId ?? row.lead?.id ?? null;
        return {
          ...fr,
          ...titleUniqueId != null ? { titleUniqueId } : {},
          sample: sample ? { ...sample, lead: row.lead } : null
        };
      });
    } else {
      mapped = rows.map((r) => {
        const title_unique_id = r.title_unique_id ?? r.lp_title_unique_id ?? r.id ?? null;
        const obj = { ...r };
        if (title_unique_id != null) {
          obj.title_unique_id = title_unique_id;
          if (obj.titleUniqueId == null) obj.titleUniqueId = title_unique_id;
        }
        return obj;
      });
    }
    return { rows: mapped, total };
  }
  async getFinanceRecordById(id) {
    const rows = await db.select().from(financeRecords).where(eq(financeRecords.id, id)).limit(1);
    return rows[0];
  }
  async updateFinanceRecord(id, updates) {
    let safeUpdates;
    try {
      safeUpdates = { ...updates };
      const toDbDate = (v) => {
        if (v == null) return v;
        if (v instanceof Date) return v;
        if (typeof v === "string") {
          if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?/.test(v)) {
            const d = new Date(v);
            if (!isNaN(d.getTime())) return d;
          }
          return v;
        }
        return v;
      };
      for (const k of Object.keys(safeUpdates)) {
        safeUpdates[k] = toDbDate(safeUpdates[k]);
      }
      try {
        const typesReport = {};
        for (const k of Object.keys(safeUpdates)) {
          const v = safeUpdates[k];
          typesReport[k] = { typeof: typeof v, constructor: v && v.constructor ? v.constructor.name : null };
        }
        console.error("updateFinanceRecord - typesReport:", JSON.stringify(typesReport));
      } catch (e) {
        console.error("Failed to build typesReport", e);
      }
      try {
        await db.update(financeRecords).set(safeUpdates).where(eq(financeRecords.id, id));
      } catch (dbErr) {
        console.error("DB update failed in updateFinanceRecord");
        try {
          console.error("Safe updates:", JSON.stringify(safeUpdates, null, 2));
        } catch (e) {
          console.error("SafeUpdates stringify failed", e);
        }
        console.error("DB error stack:", dbErr.stack || dbErr);
        throw dbErr;
      }
      return this.getFinanceRecordById(id);
    } catch (error) {
      console.error("Error in updateFinanceRecord:", error.message);
      try {
        console.error("Safe updates:", JSON.stringify(safeUpdates || updates, null, 2));
      } catch (e) {
        console.error("Failed to stringify safeUpdates", e);
      }
      console.error(error.stack);
      throw error;
    }
  }
  async deleteFinanceRecord(id) {
    try {
      try {
        const rows = await db.select().from(financeRecords).where(eq(financeRecords.id, id)).limit(1);
        if (rows[0]) {
          const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          await db.insert(recycleBin2).values({ id: randomUUID(), entityType: "finance_records", entityId: id, data: rows[0], originalPath: `/finance/records/${id}` });
        }
      } catch (e) {
        console.error("Failed to create recycle snapshot for finance record:", e.message);
      }
      await db.delete(financeRecords).where(eq(financeRecords.id, id));
      return true;
    } catch (error) {
      console.error("Failed to delete finance record:", error.message);
      return false;
    }
  }
  // Logistics Tracking
  async createLogisticsTracking(logisticsData) {
    const id = randomUUID();
    await db.insert(logisticsTracking).values({
      id,
      sampleId: logisticsData.sampleId ?? null,
      trackingNumber: logisticsData.trackingNumber ?? null,
      courierName: logisticsData.courierName ?? null,
      pickupDate: logisticsData.pickupDate ?? null,
      estimatedDelivery: logisticsData.estimatedDelivery ?? null,
      actualDelivery: logisticsData.actualDelivery ?? null,
      status: logisticsData.status ?? "scheduled",
      pickupAddress: logisticsData.pickupAddress ?? null,
      deliveryAddress: logisticsData.deliveryAddress ?? null,
      contactPerson: logisticsData.contactPerson ?? null,
      contactPhone: logisticsData.contactPhone ?? null,
      specialInstructions: logisticsData.specialInstructions ?? null,
      packageWeight: logisticsData.packageWeight ?? null,
      packageDimensions: logisticsData.packageDimensions ?? null,
      insuranceAmount: logisticsData.insuranceAmount ?? null,
      shippingCost: logisticsData.shippingCost ?? null,
      trackingUpdates: logisticsData.trackingUpdates ?? null,
      deliveryNotes: logisticsData.deliveryNotes ?? null
    });
    const created = await this.getLogisticsTrackingById(id);
    if (!created) throw new Error("Failed to create logistics tracking");
    return created;
  }
  async getLogisticsTracking() {
    const rows = await db.select({ lt: logisticsTracking, sample: samples, lead: leads }).from(logisticsTracking).leftJoin(samples, eq(logisticsTracking.sampleId, samples.id)).leftJoin(leads, eq(samples.leadId, leads.id));
    return rows.map((row) => ({
      ...row.lt,
      sample: row.sample ? {
        ...row.sample,
        lead: row.lead
      } : null
    }));
  }
  async getLogisticsTrackingById(id) {
    const rows = await db.select().from(logisticsTracking).where(eq(logisticsTracking.id, id)).limit(1);
    return rows[0];
  }
  async updateLogisticsTracking(id, updates) {
    await db.update(logisticsTracking).set(updates).where(eq(logisticsTracking.id, id));
    return this.getLogisticsTrackingById(id);
  }
  // Pricing
  async createPricing(pricingData) {
    const id = randomUUID();
    await db.insert(pricing).values({
      id,
      testName: pricingData.testName,
      testCode: pricingData.testCode,
      basePrice: pricingData.basePrice,
      discountedPrice: pricingData.discountedPrice ?? null,
      currency: pricingData.currency ?? "INR",
      isActive: pricingData.isActive ?? true,
      category: pricingData.category ?? null,
      subcategory: pricingData.subcategory ?? null,
      description: pricingData.description ?? null,
      turnaroundTime: pricingData.turnaroundTime ?? null,
      sampleRequirements: pricingData.sampleRequirements ?? null,
      methodology: pricingData.methodology ?? null,
      accreditation: pricingData.accreditation ?? null,
      validFrom: pricingData.validFrom ?? null,
      validTo: pricingData.validTo ?? null,
      notes: pricingData.notes ?? null
    });
    const created = await this.getPricingById(id);
    if (!created) throw new Error("Failed to create pricing");
    return created;
  }
  async getPricing() {
    return db.select().from(pricing);
  }
  async getPricingById(id) {
    const rows = await db.select().from(pricing).where(eq(pricing.id, id)).limit(1);
    return rows[0];
  }
  async updatePricing(id, updates) {
    await db.update(pricing).set(updates).where(eq(pricing.id, id));
    return this.getPricingById(id);
  }
  // Genetic counselling implementations
  async createGeneticCounselling(record) {
    const id = randomUUID();
    const toDbDate = (v) => {
      if (!v) return null;
      if (v instanceof Date) return v;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };
    await db.insert((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).values({
      id,
      sampleId: record.sampleId,
      gcName: record.gcName,
      counsellingType: record.counsellingType ?? null,
      counsellingStartTime: toDbDate(record.counsellingStartTime),
      counsellingEndTime: toDbDate(record.counsellingEndTime),
      gcSummary: record.gcSummary ?? null,
      extendedFamilyTesting: record.extendedFamilyTesting ?? false,
      approvalStatus: record.approvalStatus ?? "pending"
    });
    const rows = await db.select().from((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).where(eq((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.id, id)).limit(1);
    return rows[0];
  }
  async getGeneticCounselling() {
    const rows = await db.select().from((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling);
    return rows;
  }
  async updateGeneticCounselling(id, updates) {
    const safe = { ...updates };
    if (safe.counsellingStartTime) safe.counsellingStartTime = new Date(safe.counsellingStartTime);
    if (safe.counsellingEndTime) safe.counsellingEndTime = new Date(safe.counsellingEndTime);
    await db.update((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).set(safe).where(eq((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.id, id));
    const rows = await db.select().from((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).where(eq((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.id, id)).limit(1);
    return rows[0];
  }
  async deleteGeneticCounselling(id) {
    try {
      try {
        const gc = await db.select().from((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).where(eq((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.id, id)).limit(1);
        if (gc[0]) {
          const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          await db.insert(recycleBin2).values({ id: randomUUID(), entityType: "genetic_counselling", entityId: id, data: gc[0], originalPath: `/genetic-counselling/${id}` });
        }
      } catch (e) {
        console.error("Failed to create recycle snapshot for genetic counselling:", e.message);
      }
      await db.delete((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).where(eq((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.id, id));
      return true;
    } catch (error) {
      console.error("Failed to delete genetic counselling record:", error.message);
      return false;
    }
  }
  // Recycle implementations
  async createRecycleEntry(payload) {
    const id = randomUUID();
    const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    await db.insert(recycleBin2).values({ id, entityType: payload.entityType, entityId: payload.entityId ?? null, data: payload.data ?? null, originalPath: payload.originalPath ?? null, createdBy: payload.createdBy ?? null });
    const row = await db.select().from(recycleBin2).where(eq(recycleBin2.id, id)).limit(1);
    return row[0];
  }
  async listRecycleEntries() {
    const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return db.select().from(recycleBin2).orderBy(
      recycleBin2.deletedAt
      /* drizzle types */
    );
  }
  async getRecycleEntry(id) {
    const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const rows = await db.select().from(recycleBin2).where(eq(recycleBin2.id, id)).limit(1);
    return rows[0];
  }
  async deleteRecycleEntry(id) {
    try {
      const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      await db.delete(recycleBin2).where(eq(recycleBin2.id, id));
      return true;
    } catch (error) {
      console.error("Failed to delete recycle entry:", error.message);
      return false;
    }
  }
  async restoreRecycleEntry(id) {
    const entry = await this.getRecycleEntry(id);
    if (!entry) throw new Error("Recycle entry not found");
    const entityType = entry.entityType;
    const data = entry.data || {};
    try {
      const normalizeDates = (v) => {
        if (v == null) return v;
        if (typeof v === "string") {
          const d = new Date(v);
          if (!isNaN(d.getTime())) return d;
          return v;
        }
        if (Array.isArray(v)) return v.map(normalizeDates);
        if (typeof v === "object") {
          const out = {};
          for (const k of Object.keys(v)) out[k] = normalizeDates(v[k]);
          return out;
        }
        return v;
      };
      const normalizedData = normalizeDates(data);
      try {
        const buildTypesReport = (v) => {
          if (v == null) return { type: String(v) };
          if (Array.isArray(v)) return v.slice(0, 5).map(buildTypesReport);
          if (typeof v === "object") {
            const out = {};
            for (const k of Object.keys(v)) {
              const val = v[k];
              out[k] = val == null ? String(val) : val instanceof Date ? "Date" : typeof val === "object" ? Array.isArray(val) ? "Array" : "Object" : typeof val;
            }
            return out;
          }
          return typeof v;
        };
        const typesReport = buildTypesReport(normalizedData);
        console.error("Restore types report for", entityType, ":", JSON.stringify(typesReport));
      } catch (logErr) {
        console.error("Failed to build types report for restore:", logErr.message);
      }
      switch (entityType) {
        case "users":
          await db.insert(users).values(normalizedData);
          break;
        case "leads":
          await db.insert(leads).values(normalizedData);
          break;
        case "samples":
          await db.insert(samples).values(normalizedData);
          break;
        case "lab_processing":
          await db.insert(labProcessing).values(normalizedData);
          break;
        case "finance_records":
          await db.insert(financeRecords).values(normalizedData);
          break;
        case "genetic_counselling":
          await db.insert((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).values(normalizedData);
          break;
        case "reports":
          await db.insert(reports).values(normalizedData);
          break;
        default:
          return data;
      }
      await this.deleteRecycleEntry(id);
      return { ok: true, restored: true, entityType };
    } catch (err) {
      console.error("Failed to restore recycle entry:", err.message);
      throw err;
    }
  }
  // Sales Activities
  async createSalesActivity(activityData) {
    const id = randomUUID();
    await db.insert(salesActivities).values({
      id,
      leadId: activityData.leadId ?? null,
      activityType: activityData.activityType,
      description: activityData.description ?? null,
      outcome: activityData.outcome ?? null,
      nextAction: activityData.nextAction ?? null,
      scheduledDate: activityData.scheduledDate ?? null,
      completedDate: activityData.completedDate ?? null,
      assignedTo: activityData.assignedTo ?? null,
      duration: activityData.duration ?? null,
      priority: activityData.priority ?? null,
      status: activityData.status ?? "planned",
      notes: activityData.notes ?? null,
      attachments: activityData.attachments ?? null
    });
    const created = await this.getSalesActivityById(id);
    if (!created) throw new Error("Failed to create sales activity");
    return created;
  }
  async getSalesActivities() {
    return db.select().from(salesActivities);
  }
  async getSalesActivityById(id) {
    const rows = await db.select().from(salesActivities).where(eq(salesActivities.id, id)).limit(1);
    return rows[0];
  }
  async updateSalesActivity(id, updates) {
    await db.update(salesActivities).set(updates).where(eq(salesActivities.id, id));
    return this.getSalesActivityById(id);
  }
  // Clients
  async createClient(clientData) {
    const id = randomUUID();
    await db.insert(clients).values({
      id,
      organizationName: clientData.organizationName,
      contactPerson: clientData.contactPerson ?? null,
      email: clientData.email ?? null,
      phone: clientData.phone ?? null,
      address: clientData.address ?? null,
      city: clientData.city ?? null,
      state: clientData.state ?? null,
      country: clientData.country ?? null,
      pincode: clientData.pincode ?? null,
      clientType: clientData.clientType ?? null,
      registrationDate: clientData.registrationDate ?? null,
      isActive: clientData.isActive ?? true,
      gstNumber: clientData.gstNumber ?? null,
      panNumber: clientData.panNumber ?? null,
      creditLimit: clientData.creditLimit ?? null,
      paymentTerms: clientData.paymentTerms ?? null,
      assignedSalesRep: clientData.assignedSalesRep ?? null,
      notes: clientData.notes ?? null,
      tags: clientData.tags ?? null
    });
    const created = await this.getClientById(id);
    if (!created) throw new Error("Failed to create client");
    return created;
  }
  async getClients() {
    return db.select().from(clients);
  }
  async getClientById(id) {
    const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return rows[0];
  }
  async updateClient(id, updates) {
    await db.update(clients).set(updates).where(eq(clients.id, id));
    return this.getClientById(id);
  }
  async createNotification(notification) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    await db.insert(notifications).values({
      id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead ?? false,
      relatedId: notification.relatedId ?? null,
      createdAt: now
    });
    const rows = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    if (!rows[0]) throw new Error("Failed to create notification");
    return rows[0];
  }
  async getNotificationsByUserId(userId) {
    return db.select().from(notifications).where(eq(notifications.userId, userId));
  }
  async markNotificationAsRead(id) {
    const res = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    const row = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
    return !!row[0]?.isRead;
  }
  async deleteNotification(id) {
    console.log("Attempting to delete notification with ID:", id);
    try {
      const res = await db.delete(notifications).where(eq(notifications.id, id));
      console.log("Delete executed");
      const check = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
      const success = check.length === 0;
      console.log("Notification exists after delete:", check.length > 0, "Success:", success);
      return success;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }
  async getDashboardStats() {
    if (!this.connectionWorking) {
      return {
        activeLeads: 12,
        samplesProcessing: 8,
        pendingRevenue: 145e3,
        reportsPending: 3
      };
    }
    try {
      const leadsRows = await db.select().from(leads).where(eq(leads.status, "cold"));
      const samplesRows = await db.select().from(samples);
      const reportsRows = await db.select().from(reports).where(eq(reports.status, "awaiting_approval"));
      const activeLeads = leadsRows.length;
      const samplesProcessing = samplesRows.filter((s) => ["received", "lab_processing", "bioinformatics"].includes(s.status ?? "")).length;
      const pendingRevenue = samplesRows.reduce((sum, s) => sum + Number(s.amount ?? 0) - Number(s.paidAmount ?? 0), 0);
      const reportsPending = reportsRows.length;
      return { activeLeads, samplesProcessing, pendingRevenue, reportsPending };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        activeLeads: 12,
        samplesProcessing: 8,
        pendingRevenue: 145e3,
        reportsPending: 3
      };
    }
  }
  async getFinanceStats() {
    const samplesRows = await db.select().from(samples);
    const reportsRows = await db.select().from(reports).where(eq(reports.status, "awaiting_approval"));
    const totalRevenue = samplesRows.reduce((sum, s) => sum + Number(s.paidAmount ?? 0), 0);
    const pendingPayments = samplesRows.reduce((sum, s) => sum + (Number(s.amount ?? 0) - Number(s.paidAmount ?? 0)), 0);
    const pendingApprovals = reportsRows.length;
    return { totalRevenue, pendingPayments, pendingApprovals };
  }
  async getPendingFinanceApprovals() {
    const rows = await db.select({ r: reports, sample: samples, lead: leads }).from(reports).leftJoin(samples, eq(reports.sampleId, samples.id)).leftJoin(leads, eq(samples.leadId, leads.id)).where(eq(reports.status, "awaiting_approval"));
    return rows.map((row) => ({
      ...row.sample,
      lead: row.lead
    }));
  }
};
var storage = new DBStorage();

// server/services/NotificationService.ts
var NotificationService = class _NotificationService {
  static instance;
  static getInstance() {
    if (!_NotificationService.instance) {
      _NotificationService.instance = new _NotificationService();
    }
    return _NotificationService.instance;
  }
  // Lead Management Notifications
  async notifyLeadCreated(leadId, organizationName, userId) {
    console.log("NotificationService: Creating notification for lead:", leadId, organizationName, userId);
    const notification = {
      userId: userId || "system",
      title: "New Lead Created",
      message: `A new lead has been created for ${organizationName}`,
      type: "lead_created",
      relatedId: leadId,
      isRead: false
    };
    try {
      const result = await storage.createNotification(notification);
      console.log("NotificationService: Notification created successfully:", result.id);
      return result;
    } catch (error) {
      console.error("NotificationService: Failed to create notification:", error);
      throw error;
    }
  }
  async notifyLeadConverted(leadId, organizationName, sampleId, userId) {
    const notification = {
      userId: userId || "system",
      title: "Lead Converted to Sample",
      message: `Lead for ${organizationName} has been converted to sample (ID: ${sampleId})`,
      type: "lead_converted",
      relatedId: leadId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  async notifyLeadStatusChanged(leadId, organizationName, oldStatus, newStatus, userId) {
    const notification = {
      userId: userId || "system",
      title: "Lead Status Updated",
      message: `Lead for ${organizationName} status changed from ${oldStatus} to ${newStatus}`,
      type: "lead_status_changed",
      relatedId: leadId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  // Sample Tracking Notifications
  async notifySampleReceived(sampleId, organizationName, userId) {
    const notification = {
      userId: userId || "system",
      title: "Sample Received",
      message: `Sample from ${organizationName} has been received (ID: ${sampleId})`,
      type: "sample_received",
      relatedId: sampleId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  async notifySampleStatusChanged(sampleId, organizationName, oldStatus, newStatus, userId) {
    const notification = {
      userId: userId || "system",
      title: "Sample Status Updated",
      message: `Sample from ${organizationName} status changed from ${oldStatus} to ${newStatus}`,
      type: "sample_status_changed",
      relatedId: sampleId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  // Genetic Counselling Notifications
  async notifyGeneticCounsellingRequired(sampleId, patientName, userId) {
    const notification = {
      userId: userId || "system",
      title: "Genetic Counselling Required",
      message: `Genetic counselling is required for patient ${patientName} (Sample ID: ${sampleId})`,
      type: "genetic_counselling_required",
      relatedId: sampleId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  async notifyGeneticCounsellingCompleted(gcId, patientName, userId) {
    const notification = {
      userId: userId || "system",
      title: "Genetic Counselling Completed",
      message: `Genetic counselling has been completed for patient ${patientName}`,
      type: "genetic_counselling_completed",
      relatedId: gcId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  // Finance Notifications
  async notifyPaymentReceived(financeId, amount, organizationName, userId) {
    const notification = {
      userId: userId || "system",
      title: "Payment Received",
      message: `Payment of \u20B9${amount.toLocaleString()} received from ${organizationName}`,
      type: "payment_received",
      relatedId: financeId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  async notifyPaymentPending(financeId, amount, organizationName, userId) {
    const notification = {
      userId: userId || "system",
      title: "Payment Pending",
      message: `Payment of \u20B9${amount.toLocaleString()} is pending from ${organizationName}`,
      type: "payment_pending",
      relatedId: financeId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  // Lab Processing Notifications
  async notifyLabProcessingStarted(sampleId, testType, userId) {
    const notification = {
      userId: userId || "system",
      title: "Lab Processing Started",
      message: `Lab processing has started for ${testType} (Sample ID: ${sampleId})`,
      type: "lab_processing_started",
      relatedId: sampleId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  async notifyLabProcessingCompleted(sampleId, testType, userId) {
    const notification = {
      userId: userId || "system",
      title: "Lab Processing Completed",
      message: `Lab processing has been completed for ${testType} (Sample ID: ${sampleId})`,
      type: "lab_processing_completed",
      relatedId: sampleId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  // Bioinformatics Notifications
  async notifyBioinformaticsStarted(sampleId, analysisType, userId) {
    const notification = {
      userId: userId || "system",
      title: "Bioinformatics Analysis Started",
      message: `Bioinformatics analysis has started for ${analysisType} (Sample ID: ${sampleId})`,
      type: "bioinformatics_started",
      relatedId: sampleId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  async notifyBioinformaticsCompleted(sampleId, analysisType, userId) {
    const notification = {
      userId: userId || "system",
      title: "Bioinformatics Analysis Completed",
      message: `Bioinformatics analysis has been completed for ${analysisType} (Sample ID: ${sampleId})`,
      type: "bioinformatics_completed",
      relatedId: sampleId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  // Report Notifications
  async notifyReportGenerated(reportId, patientName, testType, userId) {
    const notification = {
      userId: userId || "system",
      title: "Report Generated",
      message: `Report has been generated for ${patientName} - ${testType}`,
      type: "report_generated",
      relatedId: reportId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  async notifyReportApproved(reportId, patientName, testType, userId) {
    const notification = {
      userId: userId || "system",
      title: "Report Approved",
      message: `Report has been approved for ${patientName} - ${testType}`,
      type: "report_approved",
      relatedId: reportId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  async notifyReportDelivered(reportId, patientName, testType, userId) {
    const notification = {
      userId: userId || "system",
      title: "Report Delivered",
      message: `Report has been delivered to patient ${patientName} - ${testType}`,
      type: "report_delivered",
      relatedId: reportId,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  // Admin Panel Notifications
  async notifySystemAlert(title, message, userId) {
    const notification = {
      userId: userId || "system",
      title,
      message,
      type: "system_alert",
      relatedId: null,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  // General utility methods
  async notifyAllUsers(title, message, type) {
    const notification = {
      userId: "all",
      title,
      message,
      type,
      relatedId: null,
      isRead: false
    };
    return await storage.createNotification(notification);
  }
  async markAsRead(notificationId) {
    return await storage.markNotificationAsRead(notificationId);
  }
  async getUserNotifications(userId) {
    return await storage.getNotificationsByUserId(userId);
  }
};
var notificationService = NotificationService.getInstance();

// server/routes.ts
init_schema();
import path from "path";
import fs from "fs";

// server/lib/generateRoleId.ts
function generateRoleId(role) {
  const roleMap = {
    administration: "AD",
    admin: "AD",
    manager: "MG",
    discovery: "DG",
    production: "PG",
    finance: "FN",
    hr: "HR"
  };
  const code = roleMap[role?.toLowerCase()] || (role ? role.substring(0, 2).toUpperCase() : "AD");
  const now = /* @__PURE__ */ new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${yy}${code}${mm}${dd}${hh}${min}`;
}

// server/routes.ts
import xlsx from "xlsx";
import multer from "multer";
var uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
var storageM = multer.diskStorage({
  destination: function(_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(_req, file, cb) {
    const unique = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "_")}`;
    cb(null, unique);
  }
});
var uploadDisk = multer({ storage: storageM, limits: { fileSize: 10 * 1024 * 1024 } });
var uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
function formatZodErrors(err) {
  const out = {};
  for (const e of err.errors) {
    const key = e.path.join(".") || "_";
    if (!out[key]) out[key] = [];
    out[key].push(e.message || `${e.code}`);
  }
  return out;
}
function normalizeDateFields(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const copy = { ...obj };
  const dateKeys = [
    "dateSampleReceived",
    "dateSampleCollected",
    "pickupUpto",
    "pickupDate",
    "createdAt",
    "convertedAt",
    "sampleCollectedDate",
    "sampleShippedDate",
    "sampleDeliveryDate",
    "thirdPartySentDate",
    "thirdPartyReceivedDate"
  ];
  const tryParseDate = (val) => {
    if (!val || typeof val !== "string") return null;
    let trimmed = val.trim();
    if (trimmed === "") return null;
    let d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
      d = /* @__PURE__ */ new Date(`${trimmed}:00`);
      if (!isNaN(d.getTime())) return d;
    }
    try {
      d = /* @__PURE__ */ new Date(`${trimmed}Z`);
      if (!isNaN(d.getTime())) return d;
    } catch (e) {
    }
    return null;
  };
  for (const k of dateKeys) {
    if (copy[k] && typeof copy[k] === "string") {
      const parsed = tryParseDate(copy[k]);
      if (parsed) copy[k] = parsed;
      else {
        delete copy[k];
      }
    }
  }
  return copy;
}
async function registerRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValidPassword = await bcrypt2.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      await storage.updateUser(user.id, { lastLogin: /* @__PURE__ */ new Date() });
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/users", async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const usersWithoutPasswords = users2.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.post("/api/users", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid user data", errors: result.error.errors });
      }
      const existingUser = await storage.getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      const user = await storage.createUser(result.data);
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (updates.email) {
        const existing = await storage.getUserByEmail(updates.email);
        if (existing && existing.id !== id) {
          return res.status(400).json({ message: "Invalid user data", errors: { email: ["Email already exists"] } });
        }
      }
      if (updates.password) {
        updates.password = await bcrypt2.hash(updates.password, 10);
      }
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user (legacy route):", error);
      const e = error;
      if (e?.code === "ER_DUP_ENTRY" || e?.errno === 1062 || e?.message && /duplicate/i.test(e.message)) {
        return res.status(400).json({ message: "Invalid user data", errors: { email: ["Email already exists"] } });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteUser(id);
      if (!ok) return res.status(500).json({ message: "Failed to delete user" });
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete user", error.message);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.post("/api/users/:id/lock", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUser(id, { isActive: false });
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Failed to lock user", error.message);
      res.status(500).json({ message: "Failed to lock user" });
    }
  });
  app2.post("/api/users/:id/unlock", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUser(id, { isActive: true });
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Failed to unlock user", error.message);
      res.status(500).json({ message: "Failed to unlock user" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Failed to fetch user", error.message);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.put("/api/users/:id/role", async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const allowed = ["sales", "operations", "finance", "lab", "bioinformatics", "reporting", "manager", "admin"];
      if (!role || typeof role !== "string" || !allowed.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const user = await storage.updateUser(id, { role });
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Failed to update user role", error.message);
      res.status(500).json({ message: "Failed to update role" });
    }
  });
  app2.use("/uploads", (await import("express")).static(uploadsDir));
  const wesReportDir = path.join(process.cwd(), "WES report code", "wes_report");
  if (fs.existsSync(wesReportDir)) {
    app2.use("/wes-report", (await import("express")).static(wesReportDir));
  }
  app2.post("/api/uploads/trf", uploadDisk.single("trf"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.originalname });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  app2.post("/api/uploads/trf-db", uploadMemory.single("trf"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const { originalname, buffer } = req.file;
      const { leadId } = req.body;
      if (!leadId) return res.status(400).json({ message: "leadId is required to associate TRF" });
      const trf = await storage.createLeadTrf({ leadId, filename: originalname, data: buffer });
      res.json({ id: trf.id, filename: trf.filename });
    } catch (error) {
      console.error("TRF DB upload failed", error);
      res.status(500).json({ message: "Failed to upload TRF to DB" });
    }
  });
  app2.get("/api/uploads/trf/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const trf = await storage.getLeadTrf(id);
      if (!trf) return res.status(404).json({ message: "TRF not found" });
      res.setHeader("Content-Disposition", `attachment; filename="${trf.filename}"`);
      res.setHeader("Content-Type", "application/pdf");
      res.send(trf.data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch TRF" });
    }
  });
  app2.get("/api/leads", async (req, res) => {
    try {
      let userRole = null;
      let userId = null;
      const headerUserId = req.headers["x-user-id"];
      const headerUserRole = req.headers["x-user-role"];
      if (headerUserId) userId = headerUserId;
      if (headerUserRole) userRole = headerUserRole;
      const leads2 = await storage.getLeads(userRole, userId);
      res.json(leads2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });
  app2.post("/api/leads", async (req, res) => {
    try {
      try {
        console.debug("POST /api/leads incoming keys:", Object.keys(req.body));
        console.debug("raw dateSampleCollected:", JSON.stringify(req.body.dateSampleCollected));
        console.debug("raw pickupUpto:", JSON.stringify(req.body.pickupUpto));
      } catch (e) {
      }
      const normalized = normalizeDateFields(req.body);
      const result = insertLeadSchema.safeParse(normalized);
      if (!result.success) {
        console.error("Lead validation failed on POST /api/leads:", JSON.stringify(result.error.errors, null, 2));
        const rawDateSampleCollected = req.body && req.body.dateSampleCollected;
        const rawPickupUpto = req.body && req.body.pickupUpto;
        return res.status(400).json({ message: "Invalid lead data", errors: result.error.errors, fields: formatZodErrors(result.error), debug: { rawDateSampleCollected, rawPickupUpto } });
      }
      const lead = await storage.createLead(result.data);
      console.log("Lead created successfully, sending notification for:", lead.id, lead.organization);
      try {
        await notificationService.notifyLeadCreated(
          lead.id,
          lead.organization,
          lead.createdBy || "system"
        );
        console.log("Lead creation notification sent successfully");
      } catch (notificationError) {
        console.error("Failed to send lead creation notification:", notificationError);
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to create lead" });
    }
  });
  app2.put("/api/leads/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!["cold", "hot", "won"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be cold, hot, or won" });
      }
      const currentLead = await storage.getLeadById(id);
      if (!currentLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      const lead = await storage.updateLeadStatus(id, status);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      try {
        await notificationService.notifyLeadStatusChanged(
          lead.id,
          lead.organization,
          currentLead.status || "unknown",
          status,
          "system"
        );
      } catch (notificationError) {
        console.error("Failed to send lead status change notification:", notificationError);
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lead status" });
    }
  });
  app2.put("/api/leads/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = normalizeDateFields(req.body);
      try {
        console.debug(`PUT /api/leads/${id} raw pickupUpto:`, JSON.stringify(req.body.pickupUpto));
        console.debug(`PUT /api/leads/${id} normalized pickupUpto:`, JSON.stringify(updates.pickupUpto));
      } catch (e) {
      }
      const result = insertLeadSchema.partial().safeParse(updates);
      if (!result.success) {
        console.error(`Lead validation failed on PUT /api/leads/${id}:`, JSON.stringify(result.error.errors, null, 2));
        const rawPickup = req.body && req.body.pickupUpto;
        return res.status(400).json({ message: "Invalid lead data", errors: result.error.errors, fields: formatZodErrors(result.error), debug: { rawPickupUpto: rawPickup, normalizedPickupUpto: updates.pickupUpto } });
      }
      const lead = await storage.updateLead(id, result.data);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lead" });
    }
  });
  app2.post("/api/leads/:id/convert", async (req, res) => {
    try {
      const { id } = req.params;
      const sampleData = req.body;
      const lead = await storage.getLeadById(id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      if (lead.status !== "won") {
        return res.status(400).json({ message: "Lead must be in 'won' status before conversion" });
      }
      if (!sampleData.amount) {
        return res.status(400).json({ message: "Sample amount is required" });
      }
      const validatedSampleData = {
        ...sampleData,
        amount: String(sampleData.amount),
        paidAmount: sampleData.paidAmount ? String(sampleData.paidAmount) : "0",
        status: sampleData.status || "pickup_scheduled"
      };
      const conversion = await storage.convertLead(id, validatedSampleData);
      let createdGc = null;
      try {
        const requestGcFlag = !!sampleData?.createGeneticCounselling || !!sampleData?.createGc || !!sampleData?.create_genetic_counselling;
        if (requestGcFlag) {
          createdGc = await storage.createGeneticCounselling({ sampleId: conversion.sample.sampleId, gcName: "" });
          try {
            await notificationService.notifyGeneticCounsellingRequired(
              conversion.sample.sampleId,
              conversion.lead.patientClientName || "Unknown Patient",
              "system"
            );
          } catch (notificationError) {
            console.error("Failed to send genetic counselling notification:", notificationError);
          }
        }
      } catch (err) {
        console.error("Failed to create genetic counselling after conversion:", err.message);
      }
      try {
        await notificationService.notifyLeadConverted(
          conversion.lead.id,
          conversion.lead.organization,
          conversion.sample.sampleId,
          "system"
        );
        await notificationService.notifySampleReceived(
          conversion.sample.sampleId,
          conversion.lead.organization,
          "system"
        );
      } catch (notificationError) {
        console.error("Failed to send conversion notifications:", notificationError);
      }
      try {
        const operationsUsers = await storage.getAllUsers();
        const opsUsers = operationsUsers.filter((user) => user.role === "operations" && user.isActive);
        for (const user of opsUsers) {
          await storage.createNotification({
            userId: user.id,
            title: "New Lead Converted",
            message: `Lead from ${conversion.lead.organization} has been converted. Sample ID: ${conversion.sample.sampleId}`,
            type: "lead_converted",
            relatedId: conversion.sample.id,
            isRead: false
          });
        }
      } catch (legacyNotificationError) {
        console.error("Failed to send legacy notifications:", legacyNotificationError);
      }
      res.json({ ...conversion, geneticCounselling: createdGc });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to convert lead" });
    }
  });
  app2.get("/api/samples", async (req, res) => {
    try {
      const samples2 = await storage.getSamples();
      res.json(samples2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch samples" });
    }
  });
  app2.put("/api/samples/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.debug("PUT /api/samples/:id incoming body keys:", Object.keys(req.body || {}));
      console.debug("PUT /api/samples/:id incoming body sampleCollectedDate:", req.body?.sampleCollectedDate);
      const removeEmptyStrings = (obj) => {
        if (!obj || typeof obj !== "object") return obj;
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
          if (v === "") continue;
          out[k] = v;
        }
        return out;
      };
      const cleaned = removeEmptyStrings(req.body || {});
      const updates = normalizeDateFields(cleaned);
      console.debug("PUT /api/samples/:id normalized updates:", JSON.stringify(updates));
      for (const [k, v] of Object.entries(updates)) {
        if (typeof v === "string" && /date/i.test(k)) {
          const tryD = (() => {
            const t = v.trim();
            if (t === "") return null;
            const d1 = new Date(t);
            if (!isNaN(d1.getTime())) return d1;
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t)) {
              const d2 = /* @__PURE__ */ new Date(`${t}:00`);
              if (!isNaN(d2.getTime())) return d2;
            }
            try {
              const d3 = /* @__PURE__ */ new Date(`${t}Z`);
              if (!isNaN(d3.getTime())) return d3;
            } catch (e) {
            }
            return null;
          })();
          if (tryD) updates[k] = tryD;
        }
      }
      const parsed = insertSampleSchema.partial().safeParse(updates);
      if (!parsed.success) {
        console.error("Sample update validation errors:", JSON.stringify(parsed.error.errors, null, 2));
        return res.status(400).json({ message: "Invalid sample data", errors: parsed.error.errors, fields: formatZodErrors(parsed.error), debug: { cleanedPayload: updates } });
      }
      const currentSample = await storage.getSampleById(id);
      if (!currentSample) {
        return res.status(404).json({ message: "Sample not found" });
      }
      const sample = await storage.updateSample(id, parsed.data);
      if (!sample) {
        return res.status(404).json({ message: "Sample not found" });
      }
      if (parsed.data.status && parsed.data.status !== currentSample.status) {
        try {
          await notificationService.notifySampleStatusChanged(
            sample.sampleId,
            sample.organization || "Unknown Organization",
            currentSample.status || "unknown",
            parsed.data.status,
            "system"
          );
        } catch (notificationError) {
          console.error("Failed to send sample status change notification:", notificationError);
        }
      }
      res.json(sample);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sample" });
    }
  });
  app2.delete("/api/samples/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteSample(id);
      if (!ok) return res.status(500).json({ message: "Failed to delete sample" });
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete sample", error.message);
      res.status(500).json({ message: "Failed to delete sample" });
    }
  });
  app2.get("/api/lab-processing", async (req, res) => {
    try {
      const labQueue = await storage.getLabProcessingQueue();
      res.json(labQueue);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lab processing queue" });
    }
  });
  app2.post("/api/lab-processing", async (req, res) => {
    try {
      const result = insertLabProcessingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid lab processing data", errors: result.error.errors });
      }
      const labProcessing2 = await storage.createLabProcessing(result.data);
      await storage.updateSample(labProcessing2.sampleId, { status: "lab_processing" });
      try {
        const sample = await storage.getSampleById(labProcessing2.sampleId);
        if (sample) {
          const lead = await storage.getLeadById(sample.leadId);
          const testType = lead?.testName || "Unknown Test";
          await notificationService.notifyLabProcessingStarted(
            sample.sampleId || "Unknown Sample",
            testType,
            "system"
          );
        }
      } catch (notificationError) {
        console.error("Failed to send lab processing notification:", notificationError);
      }
      if (!result.data.isOutsourced) {
        try {
          const bioUsers = await storage.getAllUsers();
          const bioinformaticsUsers = bioUsers.filter((user) => user.role === "bioinformatics" && user.isActive);
          for (const user of bioinformaticsUsers) {
            await storage.createNotification({
              userId: user.id,
              title: "Sample Ready for Bioinformatics",
              message: `Lab processing completed for sample ${labProcessing2.labId}`,
              type: "bioinformatics_ready",
              relatedId: labProcessing2.sampleId,
              isRead: false
            });
          }
        } catch (legacyNotificationError) {
          console.error("Failed to send legacy bioinformatics notifications:", legacyNotificationError);
        }
      }
      res.json(labProcessing2);
    } catch (error) {
      res.status(500).json({ message: "Failed to create lab processing record" });
    }
  });
  app2.put("/api/lab-processing/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const normalize = (obj) => {
        if (!obj || typeof obj !== "object") return obj;
        const copy = { ...obj };
        const dateKeys = ["sampleDeliveryDate", "processedAt", "sampleDeliveryDate", "sampleDeliveryDate"];
        for (const k of dateKeys) {
          if (copy[k] && typeof copy[k] === "string") {
            const d = new Date(copy[k]);
            if (!isNaN(d.getTime())) copy[k] = d;
          }
        }
        return copy;
      };
      const updates = normalize(req.body);
      const parsed = insertLabProcessingSchema.partial().safeParse(updates);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid lab processing update data", errors: parsed.error.errors });
      }
      const updated = await storage.updateLabProcessing(id, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "Lab processing record not found" });
      }
      try {
        const sample = await storage.getSampleById(updated.sampleId);
        await notificationService.notifyLabProcessingCompleted(
          sample?.sampleId || updated.labId,
          "Lab Processing Update",
          "system"
        );
      } catch (notificationError) {
        console.error("Failed to send lab processing update notification:", notificationError);
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lab processing record" });
    }
  });
  app2.delete("/api/lab-processing/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteLabProcessing(id);
      if (!ok) return res.status(500).json({ message: "Failed to delete lab processing record" });
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete lab processing record", error.message);
      res.status(500).json({ message: "Failed to delete lab processing record" });
    }
  });
  app2.get("/api/bioinformatics", async (req, res) => {
    try {
      const lp = await storage.getLabProcessingQueue();
      const mapped = lp.map((item) => ({
        id: item.id,
        sample_id: item.sample ? item.sample.sampleId || item.sampleId : item.sampleId,
        sequencing_date: item.processedAt ? new Date(item.processedAt).toISOString() : null,
        analysis_status: item.qcStatus || "pending",
        total_mb_generated: item.totalMbGenerated || 0,
        result_report_link: item.reportLink || null,
        progenics_trf: item.progenicsTrf || item.titleUniqueId || null,
        progenics_raw_data: item.progenicsRawData || null,
        third_party_name: item.thirdPartyName || null,
        third_party_result_date: item.thirdPartyResultDate ? new Date(item.thirdPartyResultDate).toISOString() : null,
        alert_to_technical: !!item.alertToTechnical,
        alert_from_lab_team: !!item.alertFromLabTeam,
        alert_from_finance: !!item.alertFromFinance,
        report_related_status: item.completeStatus || "processing"
      }));
      res.json(mapped);
    } catch (error) {
      console.error("Failed to fetch bioinformatics data", error.message);
      res.status(500).json({ message: "Failed to fetch bioinformatics data" });
    }
  });
  app2.put("/api/bioinformatics/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const mappedUpdates = {};
      if (updates.analysis_status !== void 0) mappedUpdates.qcStatus = updates.analysis_status;
      if (updates.sequencing_date) mappedUpdates.processedAt = updates.sequencing_date;
      if (updates.total_mb_generated !== void 0) mappedUpdates.totalMbGenerated = updates.total_mb_generated;
      if (updates.result_report_link !== void 0) mappedUpdates.reportLink = updates.result_report_link;
      if (updates.progenics_trf !== void 0) mappedUpdates.progenicsTrf = updates.progenics_trf;
      if (updates.progenics_raw_data !== void 0) mappedUpdates.progenicsRawData = updates.progenics_raw_data;
      if (updates.third_party_name !== void 0) mappedUpdates.thirdPartyName = updates.third_party_name;
      if (updates.third_party_result_date !== void 0) mappedUpdates.thirdPartyResultDate = updates.third_party_result_date;
      if (updates.alert_to_technical !== void 0) mappedUpdates.alertToTechnical = updates.alert_to_technical;
      if (updates.alert_from_lab_team !== void 0) mappedUpdates.alertFromLabTeam = updates.alert_from_lab_team;
      if (updates.alert_from_finance !== void 0) mappedUpdates.alertFromFinance = updates.alert_from_finance;
      if (updates.report_related_status !== void 0) mappedUpdates.completeStatus = updates.report_related_status;
      const updated = await storage.updateLabProcessing(id, mappedUpdates);
      if (!updated) return res.status(404).json({ message: "Bioinformatics record not found" });
      const out = {
        id: updated.id,
        sample_id: updated.sampleId,
        sequencing_date: updated.processedAt ? new Date(updated.processedAt).toISOString() : null,
        analysis_status: updated.qcStatus || "pending",
        total_mb_generated: updated.totalMbGenerated || 0,
        result_report_link: updated.reportLink || null,
        progenics_trf: updated.progenicsTrf || null,
        progenics_raw_data: updated.progenicsRawData || null,
        third_party_name: updated.thirdPartyName || null,
        third_party_result_date: updated.thirdPartyResultDate ? new Date(updated.thirdPartyResultDate).toISOString() : null,
        alert_to_technical: !!updated.alertToTechnical,
        alert_from_lab_team: !!updated.alertFromLabTeam,
        alert_from_finance: !!updated.alertFromFinance,
        report_related_status: updated.completeStatus || "processing"
      };
      res.json(out);
    } catch (error) {
      console.error("Failed to update bioinformatics record", error.message);
      res.status(500).json({ message: "Failed to update bioinformatics record" });
    }
  });
  app2.delete("/api/bioinformatics/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteLabProcessing(id);
      if (!ok) return res.status(500).json({ message: "Failed to delete bioinformatics record" });
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete bioinformatics record", error.message);
      res.status(500).json({ message: "Failed to delete bioinformatics record" });
    }
  });
  app2.get("/api/genetic-counselling", async (_req, res) => {
    try {
      const rows = await storage.getGeneticCounselling();
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch genetic counselling records" });
    }
  });
  app2.post("/api/genetic-counselling", async (req, res) => {
    try {
      const body = req.body || {};
      const created = await storage.createGeneticCounselling({
        sampleId: body.sample_id || body.sampleId || "",
        gcName: body.gc_name || body.gcName || "",
        counsellingType: body.counselling_type || body.counsellingType || void 0,
        counsellingStartTime: body.counselling_start_time || body.counsellingStartTime || void 0,
        counsellingEndTime: body.counselling_end_time || body.counsellingEndTime || void 0,
        gcSummary: body.gc_summary || body.gcSummary || void 0,
        extendedFamilyTesting: body.extended_family_testing ?? body.extendedFamilyTesting ?? false,
        approvalStatus: body.approval_status || body.approvalStatus || "pending"
      });
      res.json(created);
    } catch (error) {
      console.error("Failed to create genetic counselling record", error.message);
      res.status(500).json({ message: "Failed to create genetic counselling record" });
    }
  });
  app2.put("/api/genetic-counselling/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const updated = await storage.updateGeneticCounselling(id, {
        sampleId: updates.sample_id || updates.sampleId,
        gcName: updates.gc_name || updates.gcName,
        counsellingType: updates.counselling_type || updates.counsellingType,
        counsellingStartTime: updates.counselling_start_time || updates.counsellingStartTime,
        counsellingEndTime: updates.counselling_end_time || updates.counsellingEndTime,
        gcSummary: updates.gc_summary || updates.gcSummary,
        extendedFamilyTesting: updates.extended_family_testing ?? updates.extendedFamilyTesting,
        approvalStatus: updates.approval_status || updates.approvalStatus
      });
      if (!updated) return res.status(404).json({ message: "Record not found" });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update genetic counselling record", error.message);
      res.status(500).json({ message: "Failed to update genetic counselling record" });
    }
  });
  app2.delete("/api/genetic-counselling/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteGeneticCounselling(id);
      if (!ok) return res.status(404).json({ message: "Record not found" });
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete genetic counselling record", error.message);
      res.status(500).json({ message: "Failed to delete genetic counselling record" });
    }
  });
  app2.get("/api/reports", async (req, res) => {
    try {
      const reports2 = await storage.getReports();
      res.json(reports2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });
  app2.post("/api/reports", async (req, res) => {
    try {
      const result = insertReportSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid report data", errors: result.error.errors });
      }
      const report = await storage.createReport(result.data);
      try {
        const sample = await storage.getSampleById(result.data.sampleId);
        const patientName = "Patient";
        const testType = "Test Report";
        await notificationService.notifyReportGenerated(
          report.id,
          patientName,
          testType,
          "system"
        );
      } catch (notificationError) {
        console.error("Failed to send report generation notification:", notificationError);
      }
      try {
        const financeUsers = await storage.getAllUsers();
        const finUsers = financeUsers.filter((user) => user.role === "finance" && user.isActive);
        for (const user of finUsers) {
          await storage.createNotification({
            userId: user.id,
            title: "Report Ready for Approval",
            message: `Report generated and awaiting financial approval`,
            type: "report_ready",
            relatedId: report.id,
            isRead: false
          });
        }
      } catch (legacyNotificationError) {
        console.error("Failed to send legacy finance notifications:", legacyNotificationError);
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to create report" });
    }
  });
  app2.put("/api/reports/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      const report = await storage.updateReport(id, {
        status: "approved",
        approvedAt: /* @__PURE__ */ new Date(),
        approvedBy
      });
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      try {
        await notificationService.notifyReportApproved(
          report.id,
          "Patient",
          // Would need to get from linked data
          "Test Report",
          // Would need to get from linked data
          "system"
        );
      } catch (notificationError) {
        console.error("Failed to send report approval notification:", notificationError);
      }
      try {
        const reportingUsers = await storage.getAllUsers();
        const repUsers = reportingUsers.filter((user) => user.role === "reporting" && user.isActive);
        for (const user of repUsers) {
          await storage.createNotification({
            userId: user.id,
            title: "Report Approved",
            message: `Report has been approved and can be delivered`,
            type: "report_approved",
            relatedId: report.id,
            isRead: false
          });
        }
      } catch (legacyNotificationError) {
        console.error("Failed to send legacy reporting notifications:", legacyNotificationError);
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve report" });
    }
  });
  app2.get("/api/finance/records", async (req, res) => {
    try {
      const page = parseInt(String(req.query.page || "1")) || 1;
      const pageSize = parseInt(String(req.query.pageSize || "25")) || 25;
      const sortBy = req.query.sortBy ? String(req.query.sortBy) : null;
      const sortDir = req.query.sortDir === "asc" ? "asc" : "desc";
      const query = req.query.query ? String(req.query.query) : null;
      const result = await storage.getFinanceRecords({ page, pageSize, sortBy, sortDir, query });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch finance records" });
    }
  });
  app2.post("/api/finance/records", async (req, res) => {
    try {
      const normalize = (obj) => {
        if (!obj || typeof obj !== "object") return obj;
        const copy = { ...obj };
        const dateKeys = ["paymentDate", "dueDate", "invoiceDate", "balanceAmountReceivedDate", "dateSampleCollected"];
        for (const k of dateKeys) {
          if (copy[k] && typeof copy[k] === "string") {
            const d = new Date(copy[k]);
            if (!isNaN(d.getTime())) copy[k] = d;
          }
        }
        if (copy.amount == null && copy.invoiceAmount != null) copy.amount = copy.invoiceAmount;
        if (copy.totalAmount == null) {
          if (copy.totalAmount == null && copy.amount != null && copy.taxAmount != null) {
            const a = Number(copy.amount);
            const t = Number(copy.taxAmount || 0);
            if (!isNaN(a)) copy.totalAmount = String(a + (isNaN(t) ? 0 : t));
          } else if (copy.invoiceAmount != null) {
            copy.totalAmount = copy.invoiceAmount;
          }
        }
        return copy;
      };
      const normalized = normalize(req.body);
      const result = insertFinanceRecordSchema.safeParse(normalized);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid finance record data", errors: result.error.errors });
      }
      const record = await storage.createFinanceRecord(result.data);
      try {
        const amount = parseFloat(record.amount?.toString() || "0");
        const organizationName = record.organization || "Unknown Organization";
        if (record.paymentStatus === "paid") {
          await notificationService.notifyPaymentReceived(
            record.id,
            amount,
            organizationName,
            "system"
          );
        } else if (record.paymentStatus === "pending") {
          await notificationService.notifyPaymentPending(
            record.id,
            amount,
            organizationName,
            "system"
          );
        }
      } catch (notificationError) {
        console.error("Failed to send finance notification:", notificationError);
      }
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to create finance record" });
    }
  });
  app2.delete("/api/finance/records/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteFinanceRecord(id);
      if (!ok) return res.status(500).json({ message: "Failed to delete finance record" });
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete finance record", error.message);
      res.status(500).json({ message: "Failed to delete finance record" });
    }
  });
  app2.get("/api/logistics", async (req, res) => {
    try {
      const tracking = await storage.getLogisticsTracking();
      res.json(tracking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logistics tracking" });
    }
  });
  app2.post("/api/logistics", async (req, res) => {
    try {
      const result = insertLogisticsTrackingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid logistics data", errors: result.error.errors });
      }
      const tracking = await storage.createLogisticsTracking(result.data);
      res.json(tracking);
    } catch (error) {
      res.status(500).json({ message: "Failed to create logistics tracking" });
    }
  });
  app2.get("/api/pricing", async (req, res) => {
    try {
      const pricing2 = await storage.getPricing();
      res.json(pricing2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pricing" });
    }
  });
  app2.post("/api/pricing", async (req, res) => {
    try {
      const result = insertPricingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid pricing data", errors: result.error.errors });
      }
      const pricing2 = await storage.createPricing(result.data);
      res.json(pricing2);
    } catch (error) {
      res.status(500).json({ message: "Failed to create pricing" });
    }
  });
  app2.get("/api/sales/activities", async (req, res) => {
    try {
      const activities = await storage.getSalesActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales activities" });
    }
  });
  app2.post("/api/sales/activities", async (req, res) => {
    try {
      const result = insertSalesActivitySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid sales activity data", errors: result.error.errors });
      }
      const activity = await storage.createSalesActivity(result.data);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sales activity" });
    }
  });
  app2.get("/api/clients", async (req, res) => {
    try {
      const clients2 = await storage.getClients();
      res.json(clients2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });
  app2.get("/api/project-samples", async (_req, res) => {
    try {
      try {
        const [rows] = await pool.execute("SELECT * FROM project_samples");
        return res.json(rows);
      } catch (e) {
        const rows = await storage.getSamples();
        return res.json(rows);
      }
    } catch (error) {
      console.error("Failed to fetch project samples", error.message);
      res.status(500).json({ message: "Failed to fetch project samples" });
    }
  });
  app2.post("/api/project-samples", async (req, res) => {
    try {
      try {
        const data = req.body || {};
        try {
          if (!data.unique_id && !data.uniqueId) {
            let roleForId = void 0;
            try {
              const hdr = req.headers["x-user-role"] || req.headers["x_user_role"] || req.headers["x-user"];
              if (hdr && typeof hdr === "string" && hdr.trim() !== "") roleForId = hdr.trim();
            } catch (e) {
            }
            if (!roleForId && data.createdBy) {
              try {
                const user = await storage.getUser(String(data.createdBy));
                if (user && user.role) roleForId = user.role;
              } catch (e) {
              }
            }
            if (!roleForId) roleForId = data.leadType || data.lead_type || "admin";
            const uid = generateRoleId(String(roleForId));
            data.unique_id = uid;
            data.uniqueId = uid;
          }
        } catch (e) {
          console.warn("generateRoleId failed for project-samples insert", e);
        }
        const keys = Object.keys(data);
        const cols = keys.map((k) => `\`${k}\``).join(",");
        const placeholders = keys.map(() => "?").join(",");
        const values = keys.map((k) => data[k]);
        const [result] = await pool.execute(`INSERT INTO project_samples (${cols}) VALUES (${placeholders})`, values);
        const insertId = result.insertId || null;
        const [rows] = await pool.execute("SELECT * FROM project_samples WHERE id = ?", [insertId]);
        return res.json(rows[0] ?? { id: insertId });
      } catch (e) {
        console.error("Insert into project_samples failed, table may not exist", e);
        return res.status(500).json({ message: "Failed to create project sample" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to create project sample" });
    }
  });
  app2.put("/api/project-samples/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const keys = Object.keys(updates);
      if (keys.length === 0) return res.status(400).json({ message: "No updates provided" });
      const set = keys.map((k) => `\`${k}\` = ?`).join(",");
      const values = keys.map((k) => updates[k]);
      values.push(id);
      await pool.execute(`UPDATE project_samples SET ${set} WHERE id = ?`, values);
      const [rows] = await pool.execute("SELECT * FROM project_samples WHERE id = ?", [id]);
      res.json(rows[0] ?? null);
    } catch (error) {
      console.error("Failed to update project sample", error.message);
      res.status(500).json({ message: "Failed to update project sample" });
    }
  });
  app2.delete("/api/project-samples/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute("DELETE FROM project_samples WHERE id = ?", [id]);
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete project sample", error.message);
      res.status(500).json({ message: "Failed to delete project sample" });
    }
  });
  app2.get("/api/logistic-sheet", async (_req, res) => {
    try {
      try {
        const [rows] = await pool.execute("SELECT * FROM logistic_sheet");
        return res.json(rows);
      } catch (e) {
        const rows = await storage.getLogisticsTracking();
        return res.json(rows);
      }
    } catch (error) {
      console.error("Failed to fetch logistic sheet", error.message);
      res.status(500).json({ message: "Failed to fetch logistic sheet" });
    }
  });
  app2.post("/api/logistic-sheet", async (req, res) => {
    try {
      try {
        const data = req.body || {};
        const keys = Object.keys(data);
        const cols = keys.map((k) => `\`${k}\``).join(",");
        const placeholders = keys.map(() => "?").join(",");
        const values = keys.map((k) => data[k]);
        const [result] = await pool.execute(`INSERT INTO logistic_sheet (${cols}) VALUES (${placeholders})`, values);
        const insertId = result.insertId || null;
        const [rows] = await pool.execute("SELECT * FROM logistic_sheet WHERE id = ?", [insertId]);
        return res.json(rows[0] ?? { id: insertId });
      } catch (e) {
        const created = await storage.createLogisticsTracking(req.body);
        return res.json(created);
      }
    } catch (error) {
      console.error("Failed to create logistic record", error.message);
      res.status(500).json({ message: "Failed to create logistic record" });
    }
  });
  app2.put("/api/logistic-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      try {
        const updates = req.body || {};
        const keys = Object.keys(updates);
        if (keys.length === 0) return res.status(400).json({ message: "No updates provided" });
        const set = keys.map((k) => `\`${k}\` = ?`).join(",");
        const values = keys.map((k) => updates[k]);
        values.push(id);
        await pool.execute(`UPDATE logistic_sheet SET ${set} WHERE id = ?`, values);
        const [rows] = await pool.execute("SELECT * FROM logistic_sheet WHERE id = ?", [id]);
        return res.json(rows[0] ?? null);
      } catch (e) {
        const updated = await storage.updateLogisticsTracking(id, req.body);
        return res.json(updated);
      }
    } catch (error) {
      console.error("Failed to update logistic record", error.message);
      res.status(500).json({ message: "Failed to update logistic record" });
    }
  });
  app2.delete("/api/logistic-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      try {
        await pool.execute("DELETE FROM logistic_sheet WHERE id = ?", [id]);
        return res.json({ id });
      } catch (e) {
        const ok = await storage.updateLogisticsTracking(id, { status: "deleted" });
        return res.json({ id, fallback: !!ok });
      }
    } catch (error) {
      console.error("Failed to delete logistic record", error.message);
      res.status(500).json({ message: "Failed to delete logistic record" });
    }
  });
  app2.get("/api/lab-process/discovery", async (_req, res) => {
    try {
      try {
        const [rows] = await pool.execute("SELECT * FROM lab_process_discovery_sheet");
        return res.json(rows);
      } catch (e) {
        const queue = await storage.getLabProcessingQueue();
        return res.json(queue.filter((r) => (r.sample?.lead?.category || "").toLowerCase() === "discovery"));
      }
    } catch (error) {
      console.error("Failed to fetch discovery lab process", error.message);
      res.status(500).json({ message: "Failed to fetch discovery lab process" });
    }
  });
  app2.get("/api/lab-process/clinical", async (_req, res) => {
    try {
      try {
        const [rows] = await pool.execute("SELECT * FROM lab_process_clinical_sheet");
        return res.json(rows);
      } catch (e) {
        const queue = await storage.getLabProcessingQueue();
        return res.json(queue.filter((r) => (r.sample?.lead?.category || "").toLowerCase() === "clinical"));
      }
    } catch (error) {
      console.error("Failed to fetch clinical lab process", error.message);
      res.status(500).json({ message: "Failed to fetch clinical lab process" });
    }
  });
  app2.get("/api/finance-sheet", async (req, res) => {
    try {
      try {
        const [rows] = await pool.execute("SELECT * FROM finance_sheet");
        return res.json({ rows, total: Array.isArray(rows) ? rows.length : 0 });
      } catch (e) {
        const result = await storage.getFinanceRecords({ page: 1, pageSize: 1e3 });
        return res.json(result);
      }
    } catch (error) {
      console.error("Failed to fetch finance sheet", error.message);
      res.status(500).json({ message: "Failed to fetch finance sheet" });
    }
  });
  app2.post("/api/finance-sheet", async (req, res) => {
    try {
      try {
        const data = req.body || {};
        const keys = Object.keys(data);
        const cols = keys.map((k) => `\`${k}\``).join(",");
        const placeholders = keys.map(() => "?").join(",");
        const values = keys.map((k) => data[k]);
        const [result] = await pool.execute(`INSERT INTO finance_sheet (${cols}) VALUES (${placeholders})`, values);
        const insertId = result.insertId || null;
        const [rows] = await pool.execute("SELECT * FROM finance_sheet WHERE id = ?", [insertId]);
        return res.json(rows[0] ?? { id: insertId });
      } catch (e) {
        const created = await storage.createFinanceRecord(req.body);
        return res.json(created);
      }
    } catch (error) {
      console.error("Failed to create finance record", error.message);
      res.status(500).json({ message: "Failed to create finance record" });
    }
  });
  app2.put("/api/finance-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      try {
        const updates = req.body || {};
        const keys = Object.keys(updates);
        if (keys.length === 0) return res.status(400).json({ message: "No updates provided" });
        const set = keys.map((k) => `\`${k}\` = ?`).join(",");
        const values = keys.map((k) => updates[k]);
        values.push(id);
        await pool.execute(`UPDATE finance_sheet SET ${set} WHERE id = ?`, values);
        const [rows] = await pool.execute("SELECT * FROM finance_sheet WHERE id = ?", [id]);
        return res.json(rows[0] ?? null);
      } catch (e) {
        const updated = await storage.updateFinanceRecord(id, req.body);
        return res.json(updated);
      }
    } catch (error) {
      console.error("Failed to update finance record", error.message);
      res.status(500).json({ message: "Failed to update finance record" });
    }
  });
  app2.delete("/api/finance-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      try {
        await pool.execute("DELETE FROM finance_sheet WHERE id = ?", [id]);
        return res.json({ id });
      } catch (e) {
        const ok = await storage.deleteFinanceRecord(id);
        return res.json({ id, fallback: !!ok });
      }
    } catch (error) {
      console.error("Failed to delete finance record", error.message);
      res.status(500).json({ message: "Failed to delete finance record" });
    }
  });
  app2.get("/api/bioinfo/discovery", async (_req, res) => {
    try {
      try {
        const [rows] = await pool.execute("SELECT * FROM discovery_bioinfo_sheet");
        return res.json(rows);
      } catch (e) {
        const lp = await storage.getLabProcessingQueue();
        return res.json(lp.filter((r) => (r.sample?.lead?.category || "").toLowerCase() === "discovery"));
      }
    } catch (error) {
      console.error("Failed to fetch discovery bioinfo", error.message);
      res.status(500).json({ message: "Failed to fetch discovery bioinfo" });
    }
  });
  app2.get("/api/bioinfo/clinical", async (_req, res) => {
    try {
      try {
        const [rows] = await pool.execute("SELECT * FROM clinical_bioinfo_sheet");
        return res.json(rows);
      } catch (e) {
        const lp = await storage.getLabProcessingQueue();
        return res.json(lp.filter((r) => (r.sample?.lead?.category || "").toLowerCase() === "clinical"));
      }
    } catch (error) {
      console.error("Failed to fetch clinical bioinfo", error.message);
      res.status(500).json({ message: "Failed to fetch clinical bioinfo" });
    }
  });
  app2.get("/api/nutrition-sheet", async (_req, res) => {
    try {
      try {
        const [rows] = await pool.execute("SELECT * FROM nutrition_sheet");
        return res.json(rows);
      } catch (e) {
        return res.json([]);
      }
    } catch (error) {
      console.error("Failed to fetch nutrition sheet", error.message);
      res.status(500).json({ message: "Failed to fetch nutrition sheet" });
    }
  });
  app2.post("/api/nutrition-sheet", async (req, res) => {
    try {
      const data = req.body || {};
      const keys = Object.keys(data);
      const cols = keys.map((k) => `\`${k}\``).join(",");
      const placeholders = keys.map(() => "?").join(",");
      const values = keys.map((k) => data[k]);
      const [result] = await pool.execute(`INSERT INTO nutrition_sheet (${cols}) VALUES (${placeholders})`, values);
      const insertId = result.insertId || null;
      const [rows] = await pool.execute("SELECT * FROM nutrition_sheet WHERE id = ?", [insertId]);
      return res.json(rows[0] ?? { id: insertId });
    } catch (error) {
      console.error("Failed to create nutrition record", error.message);
      res.status(500).json({ message: "Failed to create nutrition record" });
    }
  });
  app2.put("/api/nutrition-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const keys = Object.keys(updates);
      if (keys.length === 0) return res.status(400).json({ message: "No updates provided" });
      const set = keys.map((k) => `\`${k}\` = ?`).join(",");
      const values = keys.map((k) => updates[k]);
      values.push(id);
      await pool.execute(`UPDATE nutrition_sheet SET ${set} WHERE id = ?`, values);
      const [rows] = await pool.execute("SELECT * FROM nutrition_sheet WHERE id = ?", [id]);
      res.json(rows[0] ?? null);
    } catch (error) {
      console.error("Failed to update nutrition record", error.message);
      res.status(500).json({ message: "Failed to update nutrition record" });
    }
  });
  app2.delete("/api/nutrition-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute("DELETE FROM nutrition_sheet WHERE id = ?", [id]);
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete nutrition record", error.message);
      res.status(500).json({ message: "Failed to delete nutrition record" });
    }
  });
  app2.get("/api/gc-registration", async (_req, res) => {
    try {
      const rows = await storage.getGeneticCounselling();
      res.json(rows);
    } catch (error) {
      console.error("Failed to fetch gc registration", error.message);
      res.status(500).json({ message: "Failed to fetch gc registration" });
    }
  });
  app2.post("/api/gc-registration", async (req, res) => {
    try {
      const body = req.body || {};
      const created = await storage.createGeneticCounselling({
        sampleId: body.sample_id || body.sampleId || "",
        gcName: body.gc_name || body.gcName || "",
        counsellingType: body.counselling_type || body.counsellingType || void 0,
        counsellingStartTime: body.counselling_start_time || body.counsellingStartTime || void 0,
        counsellingEndTime: body.counselling_end_time || body.counsellingEndTime || void 0,
        gcSummary: body.gc_summary || body.gcSummary || void 0,
        extendedFamilyTesting: body.extended_family_testing ?? body.extendedFamilyTesting ?? false,
        approvalStatus: body.approval_status || body.approvalStatus || "pending"
      });
      res.json(created);
    } catch (error) {
      console.error("Failed to create gc registration", error.message);
      res.status(500).json({ message: "Failed to create gc registration" });
    }
  });
  app2.put("/api/gc-registration/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const updated = await storage.updateGeneticCounselling(id, {
        sampleId: updates.sample_id || updates.sampleId,
        gcName: updates.gc_name || updates.gcName,
        counsellingType: updates.counselling_type || updates.counsellingType,
        counsellingStartTime: updates.counselling_start_time || updates.counsellingStartTime,
        counsellingEndTime: updates.counselling_end_time || updates.counsellingEndTime,
        gcSummary: updates.gc_summary || updates.gcSummary,
        extendedFamilyTesting: updates.extended_family_testing ?? updates.extendedFamilyTesting,
        approvalStatus: updates.approval_status || updates.approvalStatus
      });
      if (!updated) return res.status(404).json({ message: "Record not found" });
      res.json(updated);
    } catch (error) {
      console.error("Failed to update gc registration", error.message);
      res.status(500).json({ message: "Failed to update gc registration" });
    }
  });
  app2.delete("/api/gc-registration/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteGeneticCounselling(id);
      if (!ok) return res.status(404).json({ message: "Record not found" });
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete gc registration", error.message);
      res.status(500).json({ message: "Failed to delete gc registration" });
    }
  });
  app2.post("/api/clients", async (req, res) => {
    try {
      const result = insertClientSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid client data", errors: result.error.errors });
      }
      const client = await storage.createClient(result.data);
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to create client" });
    }
  });
  app2.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  app2.get("/api/finance/stats", async (req, res) => {
    try {
      const stats = await storage.getFinanceStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch finance stats" });
    }
  });
  app2.get("/api/finance/pending-approvals", async (req, res) => {
    try {
      const approvals = await storage.getPendingFinanceApprovals();
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });
  app2.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications2 = await storage.getNotificationsByUserId(userId);
      res.json(notifications2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app2.get("/api/recycle", async (_req, res) => {
    try {
      const entries = await storage.listRecycleEntries();
      res.json(entries);
    } catch (error) {
      console.error("Failed to list recycle entries", error.message);
      res.status(500).json({ message: "Failed to list recycle entries" });
    }
  });
  app2.get("/api/recycle/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const entry = await storage.getRecycleEntry(id);
      if (!entry) return res.status(404).json({ message: "Not found" });
      res.json(entry);
    } catch (error) {
      console.error("Failed to fetch recycle entry", error.message);
      res.status(500).json({ message: "Failed to fetch recycle entry" });
    }
  });
  app2.post("/api/recycle", async (req, res) => {
    try {
      const body = req.body || {};
      const created = await storage.createRecycleEntry({ entityType: body.entityType, entityId: body.entityId, data: body.data, originalPath: body.originalPath, createdBy: body.createdBy });
      res.json(created);
    } catch (error) {
      console.error("Failed to create recycle entry", error.message);
      res.status(500).json({ message: "Failed to create recycle entry" });
    }
  });
  app2.delete("/api/recycle/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteRecycleEntry(id);
      if (!ok) return res.status(500).json({ message: "Failed to delete recycle entry" });
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete recycle entry", error.message);
      res.status(500).json({ message: "Failed to delete recycle entry" });
    }
  });
  app2.post("/api/recycle/:id/restore", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.restoreRecycleEntry(id);
      res.json(result);
    } catch (error) {
      console.error("Failed to restore recycle entry", error.message);
      res.status(500).json({ message: "Failed to restore recycle entry", details: error.message });
    }
  });
  app2.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.markNotificationAsRead(id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  app2.delete("/api/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteNotification(id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });
  app2.post("/api/test/notification", async (req, res) => {
    try {
      console.log("Test notification endpoint called");
      const result = await notificationService.notifyLeadCreated(
        "test-lead-" + Date.now(),
        "Test Organization",
        "system"
      );
      res.json({ success: true, notification: result });
    } catch (error) {
      console.error("Test notification failed:", error);
      res.status(500).json({ message: "Failed to create test notification", error: error.message });
    }
  });
  app2.get("/api/sharepoint/scan", async (_req, res) => {
    try {
      const dir = process.env.SHEETS_DIR || path.resolve(process.cwd(), "sharepoint sheets");
      if (!fs.existsSync(dir)) {
        return res.status(404).json({ message: `Directory not found: ${dir}` });
      }
      const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".xlsx") || f.toLowerCase().endsWith(".xls"));
      const result = [];
      for (const file of files) {
        const full = path.join(dir, file);
        try {
          const wb = xlsx.readFile(full, { cellDates: true });
          const sheets = wb.SheetNames.map((name) => {
            const ws = wb.Sheets[name];
            const aoa = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false });
            const headers = (aoa[0] || []).map((h) => String(h).trim());
            return { sheetName: name, headers, firstRows: aoa.slice(1, 6) };
          });
          result.push({ file, sheets });
        } catch (e) {
          result.push({ file, error: e?.message || String(e) });
        }
      }
      res.json({ ok: true, dir, files: files.length, summary: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to scan sharepoint sheets" });
    }
  });
  app2.post("/api/sharepoint/import/leads", async (req, res) => {
    try {
      const { fileName, sheetName } = req.body;
      if (!fileName) {
        return res.status(400).json({ message: "fileName is required" });
      }
      const dir = process.env.SHEETS_DIR || path.resolve(process.cwd(), "sharepoint sheets");
      const full = path.join(dir, fileName);
      if (!fs.existsSync(full)) {
        return res.status(404).json({ message: `File not found: ${fileName}` });
      }
      const wb = xlsx.readFile(full, { cellDates: true });
      const selectedSheetName = sheetName || wb.SheetNames[0];
      const ws = wb.Sheets[selectedSheetName];
      if (!ws) {
        return res.status(400).json({ message: `Sheet not found: ${selectedSheetName}` });
      }
      const rows = xlsx.utils.sheet_to_json(ws, { defval: null });
      const pick = (obj, keys) => {
        for (const k of keys) {
          if (obj[k] !== void 0 && obj[k] !== null && String(obj[k]).trim() !== "") return obj[k];
        }
        return null;
      };
      let created = 0;
      let updated = 0;
      const errors = [];
      for (const r of rows) {
        try {
          const organization = pick(r, ["Organization", "Clinic/Company", "Clinic Name", "Hospital/Clinic Name", "Organization Name"]) || "Unknown";
          const location = pick(r, ["Location", "City", "State", "Address"]) || "";
          const referredDoctor = pick(r, ["Doctor", "Referred Doctor", "Referrer", "Doctor Name"]) || "";
          const clinicHospitalName = pick(r, ["Clinic/Hospital", "Clinic Name", "Hospital Name", "Clinic/Hospital Name"]) || null;
          const phone = String(pick(r, ["Phone", "Contact", "Mobile", "Phone Number"]) || "");
          const email = String(pick(r, ["Email", "Email ID", "Client Email"]) || "").toLowerCase();
          const clientEmail = String(pick(r, ["Client Email", "Customer Email", "Patient Email"]) || email);
          const testName = pick(r, ["Test", "Test Name", "Panel", "Product"]) || "Unknown";
          const sampleType = pick(r, ["Sample Type", "Type", "Specimen"]) || "";
          const amountQuoted = Number(pick(r, ["Amount", "Quoted Amount", "Price", "Amount Quoted"]) || 0);
          const tat = Number(pick(r, ["TAT", "Turnaround", "Turnaround Time (days)"]) || 0);
          const status = String(pick(r, ["Status"]) || "quoted").toLowerCase();
          if (!email && !phone) continue;
          const existing = await storage.findLeadByEmailPhone(email || "", phone || "");
          if (existing) {
            await storage.updateLead(existing.id, {
              organization,
              location,
              referredDoctor,
              clinicHospitalName: clinicHospitalName || void 0,
              testName,
              sampleType,
              amountQuoted: isNaN(amountQuoted) ? existing.amountQuoted : amountQuoted,
              tat: isNaN(tat) ? existing.tat : tat,
              status: status || existing.status
            });
            updated++;
          } else {
            const parsed = insertLeadSchema.safeParse({
              organization,
              location,
              referredDoctor,
              clinicHospitalName: clinicHospitalName || void 0,
              phone,
              email: email || `${Date.now()}@placeholder.local`,
              clientEmail: clientEmail || email || `${Date.now()}@placeholder.local`,
              testName,
              sampleType,
              amountQuoted: isNaN(amountQuoted) ? 0 : amountQuoted,
              tat: isNaN(tat) ? 0 : tat,
              status: status || void 0
            });
            if (!parsed.success) {
              errors.push({ row: r, error: parsed.error.flatten() });
              continue;
            }
            await storage.createLead(parsed.data);
            created++;
          }
        } catch (e) {
          errors.push({ row: r, error: e?.message || String(e) });
        }
      }
      res.json({ ok: true, fileName, sheetName: selectedSheetName, created, updated, errorsCount: errors.length, errors: errors.slice(0, 10) });
    } catch (error) {
      res.status(500).json({ message: "Failed to import leads" });
    }
  });
  app2.post("/api/sharepoint/import/finance", async (req, res) => {
    try {
      const { fileName, sheetName } = req.body;
      if (!fileName) {
        return res.status(400).json({ message: "fileName is required" });
      }
      const dir = process.env.SHEETS_DIR || path.resolve(process.cwd(), "sharepoint sheets");
      const full = path.join(dir, fileName);
      if (!fs.existsSync(full)) {
        return res.status(404).json({ message: `File not found: ${fileName}` });
      }
      const wb = xlsx.readFile(full, { cellDates: true });
      const selectedSheetName = sheetName || wb.SheetNames[0];
      const ws = wb.Sheets[selectedSheetName];
      if (!ws) {
        return res.status(400).json({ message: `Sheet not found: ${selectedSheetName}` });
      }
      const rows = xlsx.utils.sheet_to_json(ws, { defval: null });
      const pick = (obj, keys) => {
        for (const k of keys) {
          if (obj[k] !== void 0 && obj[k] !== null && String(obj[k]).trim() !== "") return obj[k];
        }
        return null;
      };
      let created = 0;
      const errors = [];
      for (const r of rows) {
        try {
          const invoiceNumber = pick(r, ["Invoice Number", "Invoice", "Invoice ID", "Bill Number"]) || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const amount = Number(pick(r, ["Amount", "Base Amount", "Price", "Cost"]) || 0);
          const taxAmount = Number(pick(r, ["Tax", "Tax Amount", "GST", "CGST", "SGST"]) || 0);
          const totalAmount = amount + taxAmount;
          const paymentStatus = String(pick(r, ["Payment Status", "Status", "Payment"]) || "pending").toLowerCase();
          const paymentMethod = pick(r, ["Payment Method", "Method", "Mode of Payment"]) || null;
          const paymentDate = pick(r, ["Payment Date", "Paid Date", "Date"]) ? new Date(pick(r, ["Payment Date", "Paid Date", "Date"])) : null;
          const dueDate = pick(r, ["Due Date", "Payment Due", "Due"]) ? new Date(pick(r, ["Due Date", "Payment Due", "Due"])) : null;
          if (amount <= 0) continue;
          const parsed = insertFinanceRecordSchema.safeParse({
            invoiceNumber,
            amount,
            taxAmount,
            totalAmount,
            paymentStatus: paymentStatus || void 0,
            paymentMethod,
            paymentDate,
            dueDate
          });
          if (!parsed.success) {
            errors.push({ row: r, error: parsed.error.flatten() });
            continue;
          }
          await storage.createFinanceRecord(parsed.data);
          created++;
        } catch (e) {
          errors.push({ row: r, error: e?.message || String(e) });
        }
      }
      res.json({ ok: true, fileName, sheetName: selectedSheetName, created, errorsCount: errors.length, errors: errors.slice(0, 10) });
    } catch (error) {
      res.status(500).json({ message: "Failed to import finance records" });
    }
  });
  app2.post("/api/sharepoint/import/pricing", async (req, res) => {
    try {
      const { fileName, sheetName } = req.body;
      if (!fileName) {
        return res.status(400).json({ message: "fileName is required" });
      }
      const dir = process.env.SHEETS_DIR || path.resolve(process.cwd(), "sharepoint sheets");
      const full = path.join(dir, fileName);
      if (!fs.existsSync(full)) {
        return res.status(404).json({ message: `File not found: ${fileName}` });
      }
      const wb = xlsx.readFile(full, { cellDates: true });
      const selectedSheetName = sheetName || wb.SheetNames[0];
      const ws = wb.Sheets[selectedSheetName];
      if (!ws) {
        return res.status(400).json({ message: `Sheet not found: ${selectedSheetName}` });
      }
      const rows = xlsx.utils.sheet_to_json(ws, { defval: null });
      const pick = (obj, keys) => {
        for (const k of keys) {
          if (obj[k] !== void 0 && obj[k] !== null && String(obj[k]).trim() !== "") return obj[k];
        }
        return null;
      };
      let created = 0;
      const errors = [];
      for (const r of rows) {
        try {
          const testName = pick(r, ["Test Name", "Test", "Product", "Service", "Panel"]) || "Unknown Test";
          const testCode = pick(r, ["Test Code", "Code", "Product Code", "SKU"]) || `TEST-${Date.now()}`;
          const basePrice = Number(pick(r, ["Price", "Base Price", "Amount", "Cost"]) || 0);
          const discountedPrice = Number(pick(r, ["Discounted Price", "Sale Price", "Offer Price"]) || 0);
          const category = pick(r, ["Category", "Type", "Group"]) || null;
          const description = pick(r, ["Description", "Details", "Notes"]) || null;
          const turnaroundTime = Number(pick(r, ["TAT", "Turnaround Time", "Processing Time"]) || 0);
          if (basePrice <= 0) continue;
          const parsed = insertPricingSchema.safeParse({
            testName,
            testCode,
            basePrice,
            discountedPrice: discountedPrice > 0 ? discountedPrice : void 0,
            category,
            description,
            turnaroundTime: turnaroundTime > 0 ? turnaroundTime : void 0
          });
          if (!parsed.success) {
            errors.push({ row: r, error: parsed.error.flatten() });
            continue;
          }
          await storage.createPricing(parsed.data);
          created++;
        } catch (e) {
          errors.push({ row: r, error: e?.message || String(e) });
        }
      }
      res.json({ ok: true, fileName, sheetName: selectedSheetName, created, errorsCount: errors.length, errors: errors.slice(0, 10) });
    } catch (error) {
      res.status(500).json({ message: "Failed to import pricing" });
    }
  });
  app2.post("/api/sharepoint/import/clients", async (req, res) => {
    try {
      const { fileName, sheetName } = req.body;
      if (!fileName) {
        return res.status(400).json({ message: "fileName is required" });
      }
      const dir = process.env.SHEETS_DIR || path.resolve(process.cwd(), "sharepoint sheets");
      const full = path.join(dir, fileName);
      if (!fs.existsSync(full)) {
        return res.status(404).json({ message: `File not found: ${fileName}` });
      }
      const wb = xlsx.readFile(full, { cellDates: true });
      const selectedSheetName = sheetName || wb.SheetNames[0];
      const ws = wb.Sheets[selectedSheetName];
      if (!ws) {
        return res.status(400).json({ message: `Sheet not found: ${selectedSheetName}` });
      }
      const rows = xlsx.utils.sheet_to_json(ws, { defval: null });
      const pick = (obj, keys) => {
        for (const k of keys) {
          if (obj[k] !== void 0 && obj[k] !== null && String(obj[k]).trim() !== "") return obj[k];
        }
        return null;
      };
      let created = 0;
      const errors = [];
      for (const r of rows) {
        try {
          const organizationName = pick(r, ["Organization", "Company", "Hospital", "Clinic", "Organization Name"]) || "Unknown Organization";
          const contactPerson = pick(r, ["Contact Person", "Contact", "Name", "Representative"]) || null;
          const email = pick(r, ["Email", "Email ID", "Contact Email"]) || null;
          const phone = pick(r, ["Phone", "Contact", "Mobile", "Phone Number"]) || null;
          const address = pick(r, ["Address", "Location", "Street Address"]) || null;
          const city = pick(r, ["City", "Location"]) || null;
          const state = pick(r, ["State", "Province"]) || null;
          const clientType = pick(r, ["Type", "Client Type", "Category"]) || null;
          if (!organizationName || organizationName === "Unknown Organization") continue;
          const parsed = insertClientSchema.safeParse({
            organizationName,
            contactPerson,
            email,
            phone,
            address,
            city,
            state,
            clientType
          });
          if (!parsed.success) {
            errors.push({ row: r, error: parsed.error.flatten() });
            continue;
          }
          await storage.createClient(parsed.data);
          created++;
        } catch (e) {
          errors.push({ row: r, error: e?.message || String(e) });
        }
      }
      res.json({ ok: true, fileName, sheetName: selectedSheetName, created, errorsCount: errors.length, errors: errors.slice(0, 10) });
    } catch (error) {
      res.status(500).json({ message: "Failed to import clients" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname, "client", "src"),
      "@shared": path2.resolve(__dirname, "shared")
      // "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    }
  },
  root: path2.resolve(__dirname, "client"),
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path3.dirname(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(__dirname2, "..", "client", "index.html");
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname2, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/modules/registry.ts
var ModuleRegistry = class {
  modules = /* @__PURE__ */ new Map();
  register(module) {
    this.modules.set(module.name, module);
  }
  getModule(name) {
    return this.modules.get(name);
  }
  getEnabledModules() {
    return Array.from(this.modules.values()).filter((m) => m.enabled);
  }
  isModuleEnabled(name) {
    const module = this.modules.get(name);
    return module?.enabled || false;
  }
  checkDependencies(moduleName) {
    const module = this.modules.get(moduleName);
    if (!module) return false;
    return module.dependencies.every((dep) => this.isModuleEnabled(dep));
  }
};
var moduleRegistry = new ModuleRegistry();

// server/modules/auth/index.ts
import bcrypt3 from "bcrypt";

// server/modules/base/index.ts
var AbstractModule = class {
  enabled = true;
  storage;
  initialized = false;
  constructor(storage2) {
    this.storage = storage2;
  }
  async initialize() {
    console.log(`Initializing module: ${this.name}`);
    const schemaValid = await this.validateSchema();
    if (!schemaValid) {
      console.warn(`\u26A0\uFE0F Schema validation failed for module: ${this.name}`);
      this.enabled = false;
      return;
    }
    this.initialized = true;
    console.log(`\u2705 Module initialized: ${this.name}`);
  }
  async cleanup() {
    console.log(`Cleaning up module: ${this.name}`);
    this.initialized = false;
  }
  async healthCheck() {
    if (!this.enabled) {
      return { status: "unhealthy", message: "Module disabled" };
    }
    if (!this.initialized) {
      return { status: "unhealthy", message: "Module not initialized" };
    }
    return { status: "healthy" };
  }
};

// server/modules/auth/index.ts
init_schema();
import mysql2 from "mysql2/promise";
var AuthenticationModule = class extends AbstractModule {
  name = "authentication";
  version = "1.0.0";
  constructor(storage2) {
    super(storage2);
  }
  async validateSchema() {
    try {
      const connection = await mysql2.createConnection({
        host: process.env.DB_HOST || "192.168.29.12",
        user: process.env.DB_USER || "remote_user",
        password: decodeURIComponent(process.env.DB_PASSWORD || "Prolab%2305"),
        database: process.env.DB_NAME || "leadlab_lims"
      });
      const [rows] = await connection.execute("DESCRIBE users");
      await connection.end();
      const columns = rows.map((row) => row.Field);
      const requiredColumns = ["id", "name", "email", "password", "role", "is_active"];
      const hasAllColumns = requiredColumns.every((col) => columns.includes(col));
      console.log(`Authentication Schema Check: ${hasAllColumns ? "\u2705" : "\u274C"}`);
      return hasAllColumns;
    } catch (error) {
      console.error("Authentication schema validation error:", error);
      return false;
    }
  }
  registerRoutes(app2) {
    console.log("\u{1F517} Registering Authentication routes...");
    app2.post("/api/auth/login", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Authentication module is disabled" });
        }
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await this.storage.getUserByEmail(email);
        if (!user || !user.isActive) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
        const isValidPassword = await bcrypt3.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
        await this.storage.updateUser(user.id, { lastLogin: /* @__PURE__ */ new Date() });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    app2.get("/api/users", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Authentication module is disabled" });
        }
        const users2 = await this.storage.getAllUsers();
        const usersWithoutPasswords = users2.map(({ password, ...user }) => user);
        res.json(usersWithoutPasswords);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    });
    app2.post("/api/users", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Authentication module is disabled" });
        }
        const result = insertUserSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            message: "Invalid user data",
            errors: result.error.errors
          });
        }
        const existingUser = await this.storage.getUserByEmail(result.data.email);
        if (existingUser) {
          return res.status(400).json({ message: "User with this email already exists" });
        }
        const user = await this.storage.createUser(result.data);
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Failed to create user" });
      }
    });
    app2.put("/api/users/:id", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Authentication module is disabled" });
        }
        const { id } = req.params;
        const updates = req.body;
        if (updates.email) {
          const existing = await this.storage.getUserByEmail(updates.email);
          if (existing && existing.id !== id) {
            return res.status(400).json({ message: "Invalid user data", errors: { email: ["Email already exists"] } });
          }
        }
        if (updates.password) {
          updates.password = await bcrypt3.hash(updates.password, 10);
        }
        const user = await this.storage.updateUser(id, updates);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error updating user:", error);
        const e = error;
        if (e?.code === "ER_DUP_ENTRY" || e?.errno === 1062 || e?.message && /duplicate/i.test(e.message)) {
          return res.status(400).json({ message: "Invalid user data", errors: { email: ["Email already exists"] } });
        }
        res.status(500).json({ message: "Failed to update user" });
      }
    });
    app2.get("/api/modules/auth/health", async (req, res) => {
      const health = await this.healthCheck();
      res.status(health.status === "healthy" ? 200 : 503).json(health);
    });
    console.log("\u2705 Authentication routes registered");
  }
};

// server/modules/leads/index.ts
init_schema();
import mysql3 from "mysql2/promise";
var LeadManagementModule = class extends AbstractModule {
  name = "lead-management";
  version = "1.0.0";
  constructor(storage2) {
    super(storage2);
  }
  async validateSchema() {
    try {
      const connection = await mysql3.createConnection({
        host: process.env.DB_HOST || "192.168.29.12",
        user: process.env.DB_USER || "remote_user",
        password: decodeURIComponent(process.env.DB_PASSWORD || "Prolab%2305"),
        database: process.env.DB_NAME || "leadlab_lims"
      });
      const [rows] = await connection.execute("DESCRIBE leads");
      await connection.end();
      const columns = rows.map((row) => row.Field);
      const requiredColumns = [
        "id",
        "organization",
        "location",
        "referred_doctor",
        "phone",
        "email",
        "client_email",
        "test_name",
        "sample_type",
        "amount_quoted",
        "tat",
        "status",
        "category"
      ];
      const hasAllColumns = requiredColumns.every(
        (col) => columns.includes(col.replace(/([A-Z])/g, "_$1").toLowerCase())
      );
      console.log(`Lead Management Schema Check: ${hasAllColumns ? "\u2705" : "\u274C"}`);
      return hasAllColumns;
    } catch (error) {
      console.error("Lead Management schema validation error:", error);
      return false;
    }
  }
  registerRoutes(app2) {
    console.log("\u{1F517} Registering Lead Management routes...");
    app2.get("/api/leads", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Lead Management module is disabled" });
        }
        const leads2 = await this.storage.getLeads();
        res.json(leads2);
      } catch (error) {
        console.error("Error fetching leads:", error);
        res.status(500).json({ message: "Failed to fetch leads" });
      }
    });
    app2.post("/api/leads", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Lead Management module is disabled" });
        }
        const bodyCopy = { ...req.body };
        try {
          if (!bodyCopy.unique_id && !bodyCopy.uniqueId) {
            let roleForId = void 0;
            try {
              const hdr = req.headers["x-user-role"] || req.headers["x_user_role"] || req.headers["x-user"];
              if (hdr && typeof hdr === "string" && hdr.trim() !== "") roleForId = hdr.trim();
            } catch (e) {
            }
            if (!roleForId && bodyCopy.createdBy) {
              try {
                const user = await this.storage.getUser(String(bodyCopy.createdBy));
                if (user && user.role) roleForId = user.role;
              } catch (e) {
              }
            }
            if (!roleForId) roleForId = bodyCopy.leadType || bodyCopy.lead_type || "admin";
            const uid = generateRoleId(String(roleForId));
            bodyCopy.unique_id = uid;
            bodyCopy.uniqueId = uid;
          }
        } catch (e) {
          console.warn("generateRoleId failed for /api/leads", e);
        }
        const dateKeys = ["dateSampleCollected", "pickupUpto", "dateSampleReceived", "pickupDate", "sampleShippedDate"];
        for (const k of dateKeys) {
          if (bodyCopy[k] && typeof bodyCopy[k] === "string") {
            const d = new Date(bodyCopy[k]);
            if (!isNaN(d.getTime())) bodyCopy[k] = d;
          }
        }
        const result = insertLeadSchema.safeParse(bodyCopy);
        if (!result.success) {
          return res.status(400).json({
            message: "Invalid lead data",
            errors: result.error.errors
          });
        }
        const lead = await this.storage.createLead(result.data);
        console.log("Lead created in module, sending notification for:", lead.id, lead.organization);
        try {
          await notificationService.notifyLeadCreated(
            lead.id,
            lead.organization,
            lead.createdBy || "system"
          );
          console.log("Lead creation notification sent successfully from module");
        } catch (notificationError) {
          console.error("Failed to send lead creation notification from module:", notificationError);
        }
        res.json(lead);
      } catch (error) {
        console.error("Error creating lead:", error);
        res.status(500).json({ message: "Failed to create lead" });
      }
    });
    app2.put("/api/leads/:id", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Lead Management module is disabled" });
        }
        const { id } = req.params;
        const updatesRaw = { ...req.body };
        const dateKeys = ["dateSampleCollected", "pickupUpto", "dateSampleReceived", "pickupDate", "sampleShippedDate"];
        for (const k of dateKeys) {
          const v = updatesRaw[k];
          if (v && typeof v === "string") {
            const s = v.trim();
            let candidate = s;
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) candidate = s + ":00Z";
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) candidate = s + "T00:00:00Z";
            const d = new Date(candidate);
            if (!isNaN(d.getTime())) updatesRaw[k] = d;
          }
        }
        const result = insertLeadSchema.partial().safeParse(updatesRaw);
        if (!result.success) {
          const rawPickup = req.body && req.body.pickupUpto;
          const normalizedPickup = updatesRaw && updatesRaw.pickupUpto;
          return res.status(400).json({
            message: "Invalid lead data",
            errors: result.error.errors,
            debug: { rawPickupUpto: rawPickup, normalizedPickupUpto: normalizedPickup }
          });
        }
        const lead = await this.storage.updateLead(id, result.data);
        if (!lead) {
          return res.status(404).json({ message: "Lead not found" });
        }
        res.json(lead);
      } catch (error) {
        console.error("Error updating lead:", error);
        res.status(500).json({ message: "Failed to update lead" });
      }
    });
    app2.put("/api/leads/:id/status", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Lead Management module is disabled" });
        }
        const { id } = req.params;
        const { status } = req.body;
        if (!["quoted", "cold", "hot", "won", "converted", "closed"].includes(status)) {
          return res.status(400).json({ message: "Invalid status value" });
        }
        const lead = await this.storage.updateLeadStatus(id, status);
        if (!lead) {
          return res.status(404).json({ message: "Lead not found" });
        }
        res.json(lead);
      } catch (error) {
        console.error("Error updating lead status:", error);
        res.status(500).json({ message: "Failed to update lead status" });
      }
    });
    app2.post("/api/leads/:id/convert", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Lead Management module is disabled" });
        }
        const { id } = req.params;
        const sampleData = req.body;
        const lead = await this.storage.getLeadById(id);
        if (!lead) {
          return res.status(404).json({ message: "Lead not found" });
        }
        if (lead.status !== "won") {
          return res.status(400).json({
            message: "Lead must be in won status before conversion"
          });
        }
        if (!sampleData.amount) {
          return res.status(400).json({ message: "Sample amount is required" });
        }
        const validatedSampleData = {
          ...sampleData,
          amount: String(sampleData.amount),
          paidAmount: sampleData.paidAmount ? String(sampleData.paidAmount) : "0",
          status: sampleData.status || "pickup_scheduled"
        };
        const conversion = await this.storage.convertLead(id, validatedSampleData);
        console.log("Lead converted in module, sending notifications for:", conversion.lead?.id, conversion.sample?.id);
        try {
          if (conversion.lead && conversion.sample) {
            await notificationService.notifyLeadConverted(
              conversion.lead.id,
              conversion.lead.organization,
              conversion.sample.id,
              conversion.lead.createdBy || "system"
            );
            await notificationService.notifySampleReceived(
              conversion.sample.id,
              conversion.lead.organization,
              conversion.lead.createdBy || "system"
            );
            console.log("Lead conversion notifications sent successfully from module");
          }
        } catch (notificationError) {
          console.error("Failed to send lead conversion notifications from module:", notificationError);
        }
        res.json({
          lead: conversion.lead,
          sample: conversion.sample,
          finance: conversion.finance ?? null,
          labProcessing: conversion.labProcessing ?? null
        });
      } catch (error) {
        console.error("Error converting lead:", error);
        res.status(500).json({ message: "Failed to convert lead" });
      }
    });
    app2.get("/api/modules/leads/health", async (req, res) => {
      const health = await this.healthCheck();
      res.status(health.status === "healthy" ? 200 : 503).json(health);
    });
    app2.delete("/api/leads/:id", async (req, res) => {
      try {
        if (!this.enabled) return res.status(503).json({ message: "Lead Management module is disabled" });
        const { id } = req.params;
        const ok = await this.storage.deleteLead(id);
        if (!ok) return res.status(500).json({ message: "Failed to delete lead" });
        res.json({ id });
      } catch (error) {
        console.error("Error deleting lead:", error);
        res.status(500).json({ message: "Failed to delete lead" });
      }
    });
    console.log("\u2705 Lead Management routes registered");
  }
};

// server/modules/samples/index.ts
init_schema();
import mysql4 from "mysql2/promise";
var SampleTrackingModule = class extends AbstractModule {
  name = "sample-tracking";
  version = "1.0.0";
  constructor(storage2) {
    super(storage2);
  }
  async validateSchema() {
    try {
      const connection = await mysql4.createConnection({
        host: process.env.DB_HOST || "192.168.29.12",
        user: process.env.DB_USER || "remote_user",
        password: decodeURIComponent(process.env.DB_PASSWORD || "Prolab%2305"),
        database: process.env.DB_NAME || "leadlab_lims"
      });
      const [rows] = await connection.execute("DESCRIBE samples");
      await connection.end();
      const columns = rows.map((row) => row.Field);
      const requiredColumns = ["id", "sample_id", "lead_id", "status", "amount", "paid_amount"];
      const hasAllColumns = requiredColumns.every((col) => columns.includes(col));
      console.log(`Sample Tracking Schema Check: ${hasAllColumns ? "\u2705" : "\u274C"}`);
      return hasAllColumns;
    } catch (error) {
      console.error("Sample Tracking schema validation error:", error);
      return false;
    }
  }
  registerRoutes(app2) {
    console.log("\u{1F517} Registering Sample Tracking routes...");
    app2.get("/api/samples", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Sample Tracking module is disabled" });
        }
        const samples2 = await this.storage.getSamples();
        res.json(samples2);
      } catch (error) {
        console.error("Error fetching samples:", error);
        res.json([
          {
            id: "1",
            sampleId: "PG20240830001",
            leadId: "lead-1",
            status: "pickup_scheduled",
            amount: "45000",
            paidAmount: "0",
            createdAt: /* @__PURE__ */ new Date(),
            lead: {
              id: "lead-1",
              organization: "Apollo Hospitals",
              testName: "Whole Genome Sequencing"
            }
          }
        ]);
      }
    });
    app2.put("/api/samples/:id", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Sample Tracking module is disabled" });
        }
        const { id } = req.params;
        let updates = req.body;
        console.log("Sample PUT - raw req.body:", JSON.stringify(req.body));
        const normalizeDateFields2 = (obj) => {
          if (!obj || typeof obj !== "object") return obj;
          const copy = { ...obj };
          const datePairs = [
            ["sampleCollectedDate", "sample_collected_date"],
            ["sampleShippedDate", "sample_shipped_date"],
            ["sampleDeliveryDate", "sample_delivery_date"],
            ["thirdPartySentDate", "third_party_sent_date"],
            ["thirdPartyReceivedDate", "third_party_received_date"],
            ["pickupDate", "pickup_date"]
          ];
          for (const [camel, snake] of datePairs) {
            const rawVal = copy[camel] ?? copy[snake];
            if (rawVal === void 0 || rawVal === null) continue;
            if (typeof rawVal === "string") {
              const s = rawVal.trim();
              if (s === "" || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") {
                delete copy[camel];
                delete copy[snake];
                continue;
              }
            }
            if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
              copy[camel] = rawVal;
              delete copy[snake];
              continue;
            }
            if (typeof rawVal === "string") {
              const d = new Date(rawVal);
              if (!isNaN(d.getTime())) {
                copy[camel] = d;
                delete copy[snake];
                continue;
              }
              try {
                const parts = rawVal.split("T");
                if (parts.length === 2) {
                  const [datePart, timePart] = parts;
                  const [y, m, dd] = datePart.split("-").map((n) => Number(n));
                  const timeParts = timePart.split(":").map((n) => Number(n));
                  const hh = timeParts[0] || 0;
                  const mm = timeParts[1] || 0;
                  const ss = timeParts[2] || 0;
                  const dateObj = new Date(y, (m || 1) - 1, dd, hh, mm, ss);
                  if (!isNaN(dateObj.getTime())) {
                    copy[camel] = dateObj;
                    delete copy[snake];
                    continue;
                  }
                }
              } catch (e) {
              }
            }
            if (rawVal !== void 0) {
              copy[camel] = rawVal;
            }
          }
          for (const k of Object.keys(copy)) {
            if (typeof copy[k] === "string") {
              const s = copy[k].trim();
              if (s === "" || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") {
                delete copy[k];
              }
            }
          }
          return copy;
        };
        updates = normalizeDateFields2(updates);
        const normalizeDecimalFields = (obj) => {
          if (!obj || typeof obj !== "object") return obj;
          const copy = { ...obj };
          const decimalPairs = [
            ["amount", "amount"],
            ["shippingCost", "shipping_cost"],
            ["paidAmount", "paid_amount"]
          ];
          for (const [camel, snake] of decimalPairs) {
            const rawVal = copy[camel] ?? copy[snake];
            if (rawVal === void 0 || rawVal === null) continue;
            if (typeof rawVal === "number") {
              copy[camel] = rawVal.toFixed(2);
              if (snake !== camel) delete copy[snake];
              continue;
            }
            if (typeof rawVal === "string") {
              const s = rawVal.trim();
              if (s === "" || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") {
                delete copy[camel];
                delete copy[snake];
                continue;
              }
              const n = Number(s);
              if (!isNaN(n)) {
                copy[camel] = n.toFixed(2);
                if (snake !== camel) delete copy[snake];
                continue;
              }
              copy[camel] = s;
              if (snake !== camel) delete copy[snake];
            }
          }
          return copy;
        };
        updates = normalizeDecimalFields(updates);
        try {
          console.log("Sample PUT - post-decimal-norm types:", JSON.stringify({
            amountType: typeof updates.amount,
            amountValue: updates.amount,
            shippingType: typeof updates.shippingCost,
            shippingValue: updates.shippingCost
          }));
        } catch (e) {
          console.log("Sample PUT - failed to stringify debug types", e);
        }
        console.log("Sample PUT - normalized payload:", JSON.stringify(updates, (_k, v) => v instanceof Date ? v.toISOString() : v));
        const finalNumericToString = (obj) => {
          if (!obj || typeof obj !== "object") return obj;
          const copy = { ...obj };
          const amountLike = /(amount|cost|price|shipping|paid)/i;
          for (const k of Object.keys(copy)) {
            const v = copy[k];
            if (typeof v === "number" && amountLike.test(k)) {
              try {
                copy[k] = v.toFixed(2);
              } catch (e) {
              }
            }
          }
          return copy;
        };
        updates = finalNumericToString(updates);
        const parsed = insertSampleSchema.partial().safeParse(updates);
        if (!parsed.success) {
          const out = { message: "Invalid sample update data", errors: parsed.error.errors };
          if (req.query && req.query.debugNorm) {
            out.normalized = updates;
          }
          return res.status(400).json(out);
        }
        const sample = await this.storage.updateSample(id, parsed.data);
        if (!sample) {
          return res.status(404).json({ message: "Sample not found" });
        }
        res.json(sample);
      } catch (error) {
        console.error("Error updating sample:", error);
        res.status(500).json({ message: "Failed to update sample" });
      }
    });
    app2.get("/api/samples/:id", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Sample Tracking module is disabled" });
        }
        const { id } = req.params;
        const sample = await this.storage.getSampleById(id);
        if (!sample) {
          return res.status(404).json({ message: "Sample not found" });
        }
        res.json(sample);
      } catch (error) {
        console.error("Error fetching sample:", error);
        res.json({
          id: "1",
          sampleId: "PG20240830001",
          titleUniqueId: "T-0001",
          sampleUniqueId: "S-0001",
          leadId: "lead-1",
          status: "pickup_scheduled",
          amount: "45000",
          paidAmount: "0",
          sampleCollectedDate: /* @__PURE__ */ new Date(),
          trackingId: null,
          courierCompany: null,
          labAlertStatus: "pending",
          thirdPartyName: null,
          comments: null,
          createdAt: /* @__PURE__ */ new Date(),
          lead: {
            id: "lead-1",
            organization: "Apollo Hospitals",
            testName: "Whole Genome Sequencing"
          }
        });
      }
    });
    app2.get("/api/modules/samples/health", async (req, res) => {
      const health = await this.healthCheck();
      res.status(health.status === "healthy" ? 200 : 503).json(health);
    });
    console.log("\u2705 Sample Tracking routes registered");
  }
};

// server/modules/dashboard/index.ts
import mysql5 from "mysql2/promise";
var DashboardModule = class extends AbstractModule {
  name = "dashboard";
  version = "1.0.0";
  constructor(storage2) {
    super(storage2);
  }
  async validateSchema() {
    try {
      const connection = await mysql5.createConnection({
        host: process.env.DB_HOST || "192.168.29.12",
        user: process.env.DB_USER || "remote_user",
        password: decodeURIComponent(process.env.DB_PASSWORD || "Prolab%2305"),
        database: process.env.DB_NAME || "leadlab_lims"
      });
      const [tables] = await connection.execute("SHOW TABLES");
      await connection.end();
      const tableNames = tables.map((row) => Object.values(row)[0]);
      const requiredTables = ["leads", "samples", "users"];
      const hasAllTables = requiredTables.every((table) => tableNames.includes(table));
      console.log(`Dashboard Schema Check: ${hasAllTables ? "\u2705" : "\u274C"}`);
      return hasAllTables;
    } catch (error) {
      console.error("Dashboard schema validation error:", error);
      return false;
    }
  }
  registerRoutes(app2) {
    console.log("\u{1F517} Registering Dashboard routes...");
    app2.get("/api/dashboard/stats", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Dashboard module is disabled" });
        }
        let stats = {
          activeLeads: 0,
          samplesProcessing: 0,
          reportsPending: 0,
          pendingRevenue: 0
        };
        try {
          const connection = await mysql5.createConnection({
            host: process.env.DB_HOST || "192.168.29.12",
            user: process.env.DB_USER || "remote_user",
            password: decodeURIComponent(process.env.DB_PASSWORD || "Prolab%2305"),
            database: process.env.DB_NAME || "leadlab_lims"
          });
          const [leadRows] = await connection.execute(`
            SELECT COUNT(*) as count FROM leads 
            WHERE status IN ('quoted', 'cold', 'hot', 'won')
          `);
          stats.activeLeads = leadRows[0]?.count || 0;
          const [sampleRows] = await connection.execute(`
            SELECT COUNT(*) as count FROM samples 
            WHERE status IN ('pickup_scheduled', 'in_transit', 'received', 'lab_processing', 'bioinformatics', 'reporting')
          `);
          stats.samplesProcessing = sampleRows[0]?.count || 0;
          const [reportRows] = await connection.execute(`
            SELECT COUNT(*) as count FROM reports 
            WHERE status IN ('in_progress', 'awaiting_approval', 'approved')
          `);
          stats.reportsPending = reportRows[0]?.count || 0;
          const [revenueRows] = await connection.execute(`
            SELECT COALESCE(SUM(amount - COALESCE(paid_amount, 0)), 0) as pending
            FROM samples 
            WHERE amount > COALESCE(paid_amount, 0)
          `);
          stats.pendingRevenue = parseFloat(revenueRows[0]?.pending || 0);
          await connection.end();
        } catch (error) {
          console.warn("Dashboard stats query failed, using defaults:", error);
        }
        res.json(stats);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.json({
          activeLeads: 0,
          samplesProcessing: 0,
          reportsPending: 0,
          pendingRevenue: 0
        });
      }
    });
    app2.get("/api/dashboard/activities", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Dashboard module is disabled" });
        }
        const activities = [
          {
            id: "1",
            type: "lead_created",
            message: "New discovery lead created for Apollo Hospitals",
            timestamp: /* @__PURE__ */ new Date(),
            module: "leads"
          },
          {
            id: "2",
            type: "sample_received",
            message: "Sample PG20240830001 received in lab",
            timestamp: new Date(Date.now() - 36e5),
            module: "samples"
          },
          {
            id: "3",
            type: "report_ready",
            message: "Report for sample DG20240829001 is ready",
            timestamp: new Date(Date.now() - 72e5),
            module: "reports"
          }
        ];
        res.json(activities);
      } catch (error) {
        console.error("Error fetching dashboard activities:", error);
        res.status(500).json({ message: "Failed to fetch activities" });
      }
    });
    app2.get("/api/modules/dashboard/health", async (req, res) => {
      const health = await this.healthCheck();
      res.status(health.status === "healthy" ? 200 : 503).json(health);
    });
    console.log("\u2705 Dashboard routes registered");
  }
};

// server/modules/finance/index.ts
import mysql6 from "mysql2/promise";
var FinanceModule = class extends AbstractModule {
  name = "finance";
  version = "1.0.0";
  constructor(storage2) {
    super(storage2);
  }
  async searchFinanceRecords(query, page, pageSize, sortBy, sortDir = "desc") {
    const offset = (page - 1) * pageSize;
    const like = `%${query}%`;
    const searchCols = [
      "fr.invoice_number",
      "fr.id",
      "fr.sample_id",
      "s.sample_id",
      "fr.patient_name",
      "fr.organization",
      "l.organization",
      "fr.title_unique_id",
      "lp.title_unique_id",
      "fr.clinician",
      "l.referred_doctor",
      "fr.city",
      "l.location",
      "fr.service_name",
      "l.service_name",
      "fr.patient_name",
      "l.patient_client_name",
      "fr.sales_responsible_person",
      "l.sales_responsible_person",
      "fr.payment_status",
      "fr.payment_method",
      "COALESCE(fr.title_unique_id, lp.title_unique_id)"
    ];
    const whereClauses = searchCols.map((col) => `${col} LIKE ?`);
    const whereClause = `WHERE ${whereClauses.join(" OR ")}`;
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortDir.toUpperCase()}` : "ORDER BY fr.created_at DESC";
    const sql3 = `
      SELECT 
        fr.*,
        s.id as s_id,
        s.sample_id as s_sample_id,
        s.*,
        l.*,
        lp.title_unique_id as lp_title_unique_id,
        COALESCE(fr.title_unique_id, lp.title_unique_id) as effective_title_unique_id
      FROM finance_records fr
      LEFT JOIN samples s ON fr.sample_id = s.id OR fr.lead_id = s.lead_id
      LEFT JOIN leads l ON fr.lead_id = l.id OR s.lead_id = l.id
      LEFT JOIN lab_processing lp ON (s.id = lp.sample_id OR fr.sample_id = lp.sample_id)
      ${whereClause}
      GROUP BY fr.id
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    const countSql = `
      SELECT COUNT(DISTINCT fr.id) as cnt
      FROM finance_records fr
      LEFT JOIN samples s ON fr.sample_id = s.id OR fr.lead_id = s.lead_id
      LEFT JOIN leads l ON fr.lead_id = l.id OR s.lead_id = l.id
      LEFT JOIN lab_processing lp ON (s.id = lp.sample_id OR fr.sample_id = lp.sample_id)
      ${whereClause}
    `;
    try {
      const searchBindings = searchCols.map(() => like);
      const queryBindings = [...searchBindings, pageSize, offset];
      const countBindings = [...searchBindings];
      console.log("Search SQL:", sql3);
      console.log("Search bindings:", queryBindings);
      console.log("Count SQL:", countSql);
      console.log("Count bindings:", countBindings);
      const connection = await mysql6.createConnection({
        host: process.env.DB_HOST || "192.168.29.12",
        user: process.env.DB_USER || "remote_user",
        password: decodeURIComponent(process.env.DB_PASSWORD || "Prolab%2305"),
        database: process.env.DB_NAME || "leadlab_lims"
      });
      const [rows] = await connection.execute(sql3, queryBindings);
      const [countResult] = await connection.execute(countSql, countBindings);
      await connection.end();
      const total = countResult[0]?.cnt || 0;
      console.log(`Found ${rows.length} records out of ${total} total matches`);
      return { rows, total };
    } catch (error) {
      console.error("Finance search error:", error);
      throw error;
    }
  }
  async validateSchema() {
    try {
      const connection = await mysql6.createConnection({
        host: process.env.DB_HOST || "192.168.29.12",
        user: process.env.DB_USER || "remote_user",
        password: decodeURIComponent(process.env.DB_PASSWORD || "Prolab%2305"),
        database: process.env.DB_NAME || "leadlab_lims"
      });
      const [rows] = await connection.execute("DESCRIBE finance_records");
      await connection.end();
      const columns = rows.map((row) => row.Field);
      const requiredColumns = ["id", "sample_id", "lead_id", "invoice_number", "amount", "payment_status"];
      const hasAllColumns = requiredColumns.every((col) => columns.includes(col));
      console.log(`Finance Schema Check: ${hasAllColumns ? "\u2705" : "\u274C"}`);
      return hasAllColumns;
    } catch (error) {
      console.error("Finance schema validation error:", error);
      return false;
    }
  }
  registerRoutes(app2) {
    console.log("\u{1F517} Registering Finance routes...");
    app2.get("/api/finance/stats", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Finance module is disabled" });
        }
        const stats = await this.storage.getFinanceStats();
        res.json(stats);
      } catch (error) {
        console.error("Error fetching finance stats:", error);
        res.json({
          totalRevenue: 0,
          pendingPayments: 0,
          pendingApprovals: 0
        });
      }
    });
    app2.get("/api/finance/pending-approvals", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Finance module is disabled" });
        }
        const approvals = await this.storage.getPendingFinanceApprovals();
        res.json(approvals);
      } catch (error) {
        console.error("Error fetching pending approvals:", error);
        res.json([]);
      }
    });
    app2.get("/api/finance/records", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Finance module is disabled" });
        }
        const page = parseInt(String(req.query.page || "1")) || 1;
        const pageSize = parseInt(String(req.query.pageSize || "25")) || 25;
        const sortBy = req.query.sortBy ? String(req.query.sortBy) : null;
        const sortDir = req.query.sortDir === "asc" ? "asc" : "desc";
        const query = req.query.query ? String(req.query.query) : "";
        if (query) {
          try {
            const result = await this.searchFinanceRecords(query, page, pageSize, sortBy, sortDir);
            return res.json(result);
          } catch (searchError) {
            console.error("Error in finance search:", searchError);
            const result = await this.storage.getFinanceRecords({
              page,
              pageSize,
              sortBy,
              sortDir,
              query: null
            });
            return res.json(result);
          }
        } else {
          const result = await this.storage.getFinanceRecords({
            page,
            pageSize,
            sortBy,
            sortDir,
            query: null
          });
          return res.json(result);
        }
      } catch (error) {
        console.error("Error fetching finance records:", error);
        res.json({ rows: [], total: 0 });
      }
    });
    app2.put("/api/finance/records/:id", async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: "Finance module is disabled" });
        }
        const { id } = req.params;
        try {
          console.error("Finance PUT - raw req.body:", JSON.stringify(req.body));
        } catch (e) {
          console.error("Finance PUT - raw req.body (stringified failed):", req.body);
        }
        console.error("Finance PUT - req.query:", JSON.stringify(req.query));
        const normalizeDateFields2 = (obj) => {
          if (!obj || typeof obj !== "object") return obj;
          const copy = { ...obj };
          const dateKeys = ["paymentDate", "dueDate", "invoiceDate", "balanceAmountReceivedDate"];
          for (const k of dateKeys) {
            const v = copy[k];
            if (v == null) {
              delete copy[k];
              continue;
            }
            if (typeof v === "string") {
              const s = v.trim();
              if (s === "" || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") {
                delete copy[k];
                continue;
              }
              let candidate = s;
              if (/^\d{4}-\d{2}-\d{2}$/.test(s)) candidate = `${s}T00:00:00`;
              if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(candidate)) candidate = `${candidate}:00`;
              const d = new Date(candidate);
              if (!isNaN(d.getTime())) {
                copy[k] = d;
              } else {
                delete copy[k];
              }
              continue;
            }
            if (v instanceof Date) continue;
            delete copy[k];
          }
          return copy;
        };
        let normalized = normalizeDateFields2(req.body);
        const moneyKeys = [
          "amount",
          "totalAmount",
          "taxAmount",
          "discountAmount",
          "lateFees",
          "refundAmount",
          "invoiceAmount",
          "paymentReceivedAmount",
          "phlebotomistCharges",
          "sampleShipmentAmount",
          "thirdPartyCharges",
          "otherCharges",
          "budget"
        ];
        for (const k of moneyKeys) {
          if (!Object.prototype.hasOwnProperty.call(normalized, k)) continue;
          const v = normalized[k];
          if (v == null) continue;
          if (typeof v === "number") {
            normalized[k] = String(v);
            continue;
          }
          if (typeof v === "string") {
            const cleaned = v.replace(/,/g, "").trim();
            if (/^[+-]?\d+(?:\.\d+)?$/.test(cleaned)) {
              normalized[k] = cleaned;
            }
          }
        }
        const { insertFinanceRecordSchema: insertFinanceRecordSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const safeSerialize = (o) => {
          if (o == null) return o;
          if (o instanceof Date) return o.toISOString();
          if (Array.isArray(o)) return o.map(safeSerialize);
          if (typeof o === "object") {
            const out = {};
            for (const k of Object.keys(o)) {
              try {
                out[k] = safeSerialize(o[k]);
              } catch (e) {
                out[k] = String(o[k]);
              }
            }
            return out;
          }
          return o;
        };
        const normalizedSafe = safeSerialize(normalized);
        console.error("Finance PUT - normalized payload:", JSON.stringify(normalizedSafe));
        if (String(req.query.debugNorm) === "1") {
          return res.status(200).json({ normalized: normalizedSafe });
        }
        const parsed = insertFinanceRecordSchema2.partial().safeParse(normalized);
        Object.keys(normalized).forEach((k) => {
          if (normalized[k] === "") delete normalized[k];
        });
        const finalDateKeys = ["paymentDate", "dueDate", "invoiceDate", "balanceAmountReceivedDate", "dateSampleCollected"];
        for (const k of finalDateKeys) {
          if (!Object.prototype.hasOwnProperty.call(normalized, k)) continue;
          const v = normalized[k];
          if (v == null) {
            delete normalized[k];
            continue;
          }
          if (v instanceof Date) continue;
          if (typeof v === "string") {
            const s = v.trim();
            if (s === "") {
              delete normalized[k];
              continue;
            }
            let candidate = s;
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) candidate = `${s}T00:00:00`;
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(candidate)) candidate = `${candidate}:00`;
            const d = new Date(candidate);
            if (!isNaN(d.getTime())) normalized[k] = d;
            else delete normalized[k];
          } else {
            delete normalized[k];
          }
        }
        const parsedAfterCleanup = insertFinanceRecordSchema2.partial().safeParse(normalized);
        if (!parsedAfterCleanup.success) {
          console.error(`Finance validation failed on PUT /api/finance/records/${id}:`, JSON.stringify(parsedAfterCleanup.error.errors, null, 2));
          const normalizedSafe2 = safeSerialize(normalized);
          return res.status(400).json({ message: "Invalid finance record data", errors: parsedAfterCleanup.error.errors, normalized: normalizedSafe2 });
        }
        try {
          console.error("Finance PUT - parsed.data about to be saved:", JSON.stringify(parsedAfterCleanup.data, null, 2));
          const record = await this.storage.updateFinanceRecord(id, parsedAfterCleanup.data);
          if (!record) {
            return res.status(404).json({ message: "Finance record not found" });
          }
          res.json(record);
        } catch (err) {
          console.error("DB error updating finance record:", err.message || err);
          console.error(err.stack || err);
          return res.status(500).json({ message: "DB error updating finance record", error: err.message });
        }
      } catch (error) {
        console.error("Error updating finance record:", error);
        res.status(500).json({ message: "Failed to update finance record" });
      }
    });
    app2.get("/api/modules/finance/health", async (req, res) => {
      const health = await this.healthCheck();
      res.status(health.status === "healthy" ? 200 : 503).json(health);
    });
    console.log("\u2705 Finance routes registered");
  }
};

// server/modules/manager.ts
var ModuleManager = class {
  modules = [];
  storage;
  constructor(storage2) {
    this.storage = storage2;
  }
  async initializeModules() {
    console.log("\u{1F680} Initializing LIMS modules...");
    this.modules = [
      new AuthenticationModule(this.storage),
      new LeadManagementModule(this.storage),
      new SampleTrackingModule(this.storage),
      new FinanceModule(this.storage),
      new DashboardModule(this.storage)
    ];
    for (const module of this.modules) {
      try {
        await module.initialize();
        moduleRegistry.register({
          name: module.name,
          version: module.version,
          enabled: module.enabled,
          dependencies: this.getModuleDependencies(module.name),
          routes: `/api/modules/${module.name}`,
          dbTables: this.getModuleTables(module.name),
          initialized: true
        });
        console.log(`\u2705 Module ${module.name} initialized successfully`);
      } catch (error) {
        console.error(`\u274C Failed to initialize module ${module.name}:`, error);
        module.enabled = false;
      }
    }
    console.log(`\u{1F389} Module initialization complete. ${this.getEnabledModules().length}/${this.modules.length} modules enabled`);
  }
  registerRoutes(app2) {
    console.log("\u{1F517} Registering module routes...");
    for (const module of this.getEnabledModules()) {
      try {
        module.registerRoutes(app2);
      } catch (error) {
        console.error(`\u274C Failed to register routes for module ${module.name}:`, error);
        module.enabled = false;
      }
    }
    app2.get("/api/modules/status", (req, res) => {
      const moduleStatus = this.modules.map((module) => ({
        name: module.name,
        version: module.version,
        enabled: module.enabled,
        health: "unknown"
        // Will be updated by health checks
      }));
      res.json({
        totalModules: this.modules.length,
        enabledModules: this.getEnabledModules().length,
        modules: moduleStatus
      });
    });
    app2.get("/api/modules/health", async (req, res) => {
      const healthChecks = await Promise.all(
        this.modules.map(async (module) => ({
          name: module.name,
          ...await module.healthCheck()
        }))
      );
      const overallStatus = healthChecks.every((h) => h.status === "healthy") ? "healthy" : healthChecks.some((h) => h.status === "healthy") ? "degraded" : "unhealthy";
      res.json({
        overallStatus,
        modules: healthChecks
      });
    });
    console.log("\u2705 Module routes registered");
  }
  getEnabledModules() {
    return this.modules.filter((module) => module.enabled);
  }
  getModule(name) {
    return this.modules.find((module) => module.name === name);
  }
  async cleanup() {
    console.log("\u{1F9F9} Cleaning up modules...");
    for (const module of this.modules) {
      try {
        await module.cleanup();
      } catch (error) {
        console.error(`Error cleaning up module ${module.name}:`, error);
      }
    }
    console.log("\u2705 Module cleanup complete");
  }
  getModuleDependencies(moduleName) {
    const dependencies = {
      "authentication": [],
      "lead-management": ["authentication"],
      "sample-tracking": ["authentication", "lead-management"],
      "finance": ["authentication", "sample-tracking"],
      "dashboard": ["authentication", "lead-management", "sample-tracking", "finance"]
    };
    return dependencies[moduleName] || [];
  }
  getModuleTables(moduleName) {
    const tables = {
      "authentication": ["users"],
      "lead-management": ["leads"],
      "sample-tracking": ["samples"],
      "finance": ["finance_records"],
      "dashboard": []
      // Aggregates from other tables
    };
    return tables[moduleName] || [];
  }
};

// server/index.ts
import "dotenv/config";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, _res, next) => {
  try {
    if (!req.path.startsWith("/api/leads")) return next();
    if (!req.body || typeof req.body !== "object") return next();
    const dateKeys = [
      "dateSampleReceived",
      "dateSampleCollected",
      "pickupUpto",
      "pickupDate",
      "createdAt",
      "convertedAt",
      "sampleCollectedDate",
      "sampleShippedDate",
      "sampleDeliveryDate",
      "thirdPartySentDate",
      "thirdPartyReceivedDate"
    ];
    for (const k of dateKeys) {
      const v = req.body[k];
      if (v && typeof v === "string") {
        const s = v.trim();
        let candidate = s;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) candidate = s + ":00Z";
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) candidate = s + "T00:00:00Z";
        const d = new Date(candidate);
        if (!isNaN(d.getTime())) req.body[k] = d;
      }
    }
  } catch (e) {
  }
  return next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const moduleManager = new ModuleManager(storage);
  console.log("\u{1F680} Starting LIMS server with modular architecture...");
  try {
    await moduleManager.initializeModules();
    moduleManager.registerRoutes(app);
    console.log("\u2705 Modular routes registered successfully");
  } catch (error) {
    console.warn("\u26A0\uFE0F Module initialization failed, falling back to legacy routes:", error);
  }
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "0.0.0.0";
  const listenOptions = { port, host };
  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }
  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
    log(`\u{1F4CA} Module status available at: http://${host}:${port}/api/modules/status`);
    log(`\u{1F310} Health check available at: http://${host}:${port}/api/modules/health`);
  });
})();
