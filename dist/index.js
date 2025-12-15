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
  bioinformaticsSheetClinical: () => bioinformaticsSheetClinical,
  bioinformaticsSheetDiscovery: () => bioinformaticsSheetDiscovery,
  clients: () => clients,
  financeRecords: () => financeRecords,
  geneticCounselling: () => geneticCounselling,
  insertBioinformaticsSheetClinicalSchema: () => insertBioinformaticsSheetClinicalSchema,
  insertBioinformaticsSheetDiscoverySchema: () => insertBioinformaticsSheetDiscoverySchema,
  insertClientSchema: () => insertClientSchema,
  insertFinanceRecordSchema: () => insertFinanceRecordSchema,
  insertGeneticCounsellingSchema: () => insertGeneticCounsellingSchema,
  insertLabProcessClinicalSheetSchema: () => insertLabProcessClinicalSheetSchema,
  insertLabProcessDiscoverySheetSchema: () => insertLabProcessDiscoverySheetSchema,
  insertLabProcessingSchema: () => insertLabProcessingSchema,
  insertLeadSchema: () => insertLeadSchema,
  insertLogisticsTrackingSchema: () => insertLogisticsTrackingSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertNutritionalManagementSchema: () => insertNutritionalManagementSchema,
  insertPricingSchema: () => insertPricingSchema,
  insertProcessMasterSheetSchema: () => insertProcessMasterSheetSchema,
  insertRecycleBinSchema: () => insertRecycleBinSchema,
  insertReportSchema: () => insertReportSchema,
  insertSalesActivitySchema: () => insertSalesActivitySchema,
  insertSampleSchema: () => insertSampleSchema,
  insertUserSchema: () => insertUserSchema,
  labProcessClinicalSheet: () => labProcessClinicalSheet,
  labProcessDiscoverySheet: () => labProcessDiscoverySheet,
  labProcessing: () => labProcessing,
  leadTrfs: () => leadTrfs,
  leads: () => leads,
  logisticsTracking: () => logisticsTracking,
  notifications: () => notifications,
  nutritionalManagement: () => nutritionalManagement,
  pricing: () => pricing,
  processMasterSheet: () => processMasterSheet,
  recycleBin: () => recycleBin,
  reports: () => reports,
  salesActivities: () => salesActivities,
  samples: () => samples,
  users: () => users
});
import { sql } from "drizzle-orm";
import { mysqlTable, varchar, text, int, timestamp, boolean, decimal, json, bigint } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var emptyToNull, users, leads, leadTrfs, samples, labProcessing, labProcessDiscoverySheet, labProcessClinicalSheet, reports, geneticCounselling, financeRecords, logisticsTracking, pricing, salesActivities, clients, notifications, recycleBin, insertRecycleBinSchema, insertUserSchema, insertLeadSchema, insertSampleSchema, insertLabProcessingSchema, insertLabProcessDiscoverySheetSchema, insertLabProcessClinicalSheetSchema, insertReportSchema, insertGeneticCounsellingSchema, insertFinanceRecordSchema, insertLogisticsTrackingSchema, insertPricingSchema, insertSalesActivitySchema, insertClientSchema, insertNotificationSchema, bioinformaticsSheetClinical, insertBioinformaticsSheetClinicalSchema, bioinformaticsSheetDiscovery, insertBioinformaticsSheetDiscoverySchema, nutritionalManagement, insertNutritionalManagementSchema, processMasterSheet, insertProcessMasterSheetSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    emptyToNull = (val) => val === "" || val === null || val === void 0 ? null : val;
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
    leads = mysqlTable("lead_management", {
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
      deliveryUpTo: timestamp("delivery_up_to", { mode: "date" }),
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
      leadModified: timestamp("lead_modified", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`)
    });
    leadTrfs = mysqlTable("lead_trfs", {
      id: varchar("id", { length: 36 }).primaryKey(),
      leadId: varchar("lead_id", { length: 36 }),
      filename: varchar("filename", { length: 255 }),
      data: text("data"),
      // drizzle mysql-core doesn't have LONGBLOB helper; store as text for now and use raw SQL if needed
      createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`)
    });
    samples = mysqlTable("sample_tracking", {
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
      remarkComment: text("remark_comment")
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
    labProcessDiscoverySheet = mysqlTable("labprocess_discovery_sheet", {
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
      remarkComment: text("remark_comment")
    });
    labProcessClinicalSheet = mysqlTable("labprocess_clinical_sheet", {
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
      remarkComment: text("remark_comment")
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
    geneticCounselling = mysqlTable("genetic_counselling_records", {
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
      remarkComment: text("remark_comment")
    });
    financeRecords = mysqlTable("finance_sheet", {
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
      remarkComment: text("remark_comment")
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
      leadCreated: true,
      leadModified: true
    }).extend({
      // Preprocess date fields: convert empty strings to null, then coerce to Date
      deliveryUpTo: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
      sampleCollectionDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
      sampleReceivedDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional()
    });
    insertSampleSchema = createInsertSchema(samples).omit({
      id: true,
      createdAt: true
    }).extend({
      // Preprocess date fields: convert empty strings to null, then coerce to Date
      sampleCollectionDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
      sampleShippedDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
      sampleDeliveryDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
      sampleReceivedDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
      sampleSentToThirdPartyDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
      sampleReceivedToThirdPartyDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional()
    });
    insertLabProcessingSchema = createInsertSchema(labProcessing).omit({
      id: true,
      processedAt: true
    });
    insertLabProcessDiscoverySheetSchema = createInsertSchema(labProcessDiscoverySheet).omit({
      id: true,
      createdAt: true,
      modifiedAt: true
    }).extend({
      // Preprocess date fields: convert empty strings to null, then coerce to Date
      sampleReceivedDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional()
    }).passthrough();
    insertLabProcessClinicalSheetSchema = createInsertSchema(labProcessClinicalSheet).omit({
      id: true,
      createdAt: true,
      modifiedAt: true
    }).extend({
      // Preprocess date fields: convert empty strings to null, then coerce to Date
      sampleReceivedDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional()
    }).passthrough();
    insertReportSchema = createInsertSchema(reports).omit({
      id: true,
      generatedAt: true,
      approvedAt: true,
      deliveredAt: true
    });
    insertGeneticCounsellingSchema = createInsertSchema(geneticCounselling).omit({
      id: true,
      createdAt: true,
      modifiedAt: true
    });
    insertFinanceRecordSchema = createInsertSchema(financeRecords).omit({
      id: true,
      createdAt: true,
      modifiedAt: true
    }).extend({
      // Preprocess date fields: convert empty strings to null, then coerce to Date
      sampleCollectionDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
      invoiceDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
      paymentReceiptDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
      balanceAmountReceivedDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
      thirdPartyPaymentDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional()
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
    bioinformaticsSheetClinical = mysqlTable("bioinformatics_sheet_clinical", {
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
      remarkComment: text("remark_comment")
    });
    insertBioinformaticsSheetClinicalSchema = createInsertSchema(bioinformaticsSheetClinical).omit({
      id: true,
      createdAt: true,
      modifiedAt: true
    });
    bioinformaticsSheetDiscovery = mysqlTable("bioinformatics_sheet_discovery", {
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
      remarkComment: text("remark_comment")
    });
    insertBioinformaticsSheetDiscoverySchema = createInsertSchema(bioinformaticsSheetDiscovery).omit({
      id: true,
      createdAt: true,
      modifiedAt: true
    });
    nutritionalManagement = mysqlTable("nutritional_management", {
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
      remarkComment: text("remark_comment")
    });
    insertNutritionalManagementSchema = createInsertSchema(nutritionalManagement).omit({
      id: true,
      createdAt: true,
      modifiedAt: true
    }).extend({
      // Make all fields more lenient and allow coercion
      uniqueId: z.string().optional(),
      projectId: z.union([z.string(), z.number()]).optional(),
      sampleId: z.string().optional(),
      serviceName: z.string().optional(),
      patientClientName: z.string().optional(),
      age: z.union([z.string(), z.number()]).transform((v) => v === "" ? null : Number(v)).nullable().optional(),
      gender: z.string().optional(),
      progenicsTrf: z.string().optional(),
      questionnaire: z.string().optional(),
      questionnaireCallRecording: z.string().optional(),
      dataAnalysisSheet: z.string().optional(),
      progenicsReport: z.string().optional(),
      nutritionChart: z.string().optional(),
      counsellingSessionDate: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
      furtherCounsellingRequired: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true" || v === "on").optional(),
      counsellingStatus: z.string().optional(),
      counsellingSessionRecording: z.string().optional(),
      alertToTechnicalLead: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true" || v === "on").optional(),
      alertToReportTeam: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true" || v === "on").optional(),
      createdBy: z.string().optional(),
      modifiedBy: z.string().optional(),
      modifiedAt: z.preprocess(emptyToNull, z.coerce.date().nullable()).optional(),
      remarkComment: z.string().optional(),
      remarksComment: z.string().optional()
    }).passthrough();
    processMasterSheet = mysqlTable("process_master_sheet", {
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
      modifiedBy: varchar("modified_by", { length: 255 })
    });
    insertProcessMasterSheetSchema = createInsertSchema(processMasterSheet).omit({
      id: true,
      createdAt: true,
      modifiedAt: true
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
    database: process.env.DB_NAME || "lead_lims2",
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
import { and, eq, sql as sql2, asc, desc } from "drizzle-orm";
var collateUtf8Unicode = (column) => sql2`${column} COLLATE utf8mb4_unicode_ci`;
var eqUtf8Columns = (left, right) => eq(collateUtf8Unicode(left), collateUtf8Unicode(right));
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
      uniqueId: insertLead.uniqueId,
      projectId: insertLead.projectId ?? null,
      leadType: insertLead.leadType ?? null,
      status: insertLead.status ?? "quoted",
      organisationHospital: insertLead.organisationHospital ?? null,
      clinicianResearcherName: insertLead.clinicianResearcherName ?? null,
      speciality: insertLead.speciality ?? null,
      clinicianResearcherEmail: insertLead.clinicianResearcherEmail ?? null,
      clinicianResearcherPhone: insertLead.clinicianResearcherPhone ?? null,
      clinicianResearcherAddress: insertLead.clinicianResearcherAddress ?? null,
      patientClientName: insertLead.patientClientName ?? null,
      age: insertLead.age ?? null,
      gender: insertLead.gender ?? null,
      patientClientEmail: insertLead.patientClientEmail ?? null,
      patientClientPhone: insertLead.patientClientPhone ?? null,
      patientClientAddress: insertLead.patientClientAddress ?? null,
      serviceName: insertLead.serviceName ?? null,
      sampleType: insertLead.sampleType ?? null,
      testCategory: insertLead.testCategory ?? null,
      noOfSamples: insertLead.noOfSamples ?? null,
      budget: insertLead.budget ?? null,
      amountQuoted: insertLead.amountQuoted ?? null,
      tat: insertLead.tat ?? null,
      sampleShipmentAmount: insertLead.sampleShipmentAmount ?? null,
      phlebotomistCharges: insertLead.phlebotomistCharges ?? null,
      geneticCounselorRequired: insertLead.geneticCounselorRequired ?? false,
      nutritionalCounsellingRequired: insertLead.nutritionalCounsellingRequired ?? false,
      samplePickUpFrom: insertLead.samplePickUpFrom ?? null,
      deliveryUpTo: insertLead.deliveryUpTo ?? null,
      sampleCollectionDate: insertLead.sampleCollectionDate ?? null,
      sampleShippedDate: insertLead.sampleShippedDate ?? null,
      sampleReceivedDate: insertLead.sampleReceivedDate ?? null,
      trackingId: insertLead.trackingId ?? null,
      courierCompany: insertLead.courierCompany ?? null,
      progenicsTrf: insertLead.progenicsTrf ?? null,
      followUp: insertLead.followUp ?? null,
      remarkComment: insertLead.remarkComment ?? null,
      leadCreatedBy: insertLead.leadCreatedBy ?? null,
      salesResponsiblePerson: insertLead.salesResponsiblePerson ?? null
    });
    const created = await this.getLeadById(id);
    if (!created) throw new Error("Failed to create lead");
    return created;
  }
  async getLeads(userRole, userId) {
    if (!this.connectionWorking) {
      return [
        {
          id: "1",
          uniqueId: "LEAD001",
          projectId: null,
          leadType: "clinical",
          status: "hot",
          organisationHospital: "Apollo Hospitals",
          clinicianResearcherName: "Dr. Smith",
          speciality: null,
          clinicianResearcherEmail: "contact@apollo.com",
          clinicianResearcherPhone: "+91-9876543210",
          clinicianResearcherAddress: null,
          patientClientName: null,
          age: null,
          gender: null,
          patientClientEmail: "patient@apollo.com",
          patientClientPhone: null,
          patientClientAddress: null,
          serviceName: "Whole Genome Sequencing",
          sampleType: "Blood",
          testCategory: null,
          noOfSamples: 1,
          budget: null,
          amountQuoted: "45000",
          tat: "14",
          sampleShipmentAmount: null,
          phlebotomistCharges: null,
          geneticCounselorRequired: false,
          nutritionalCounsellingRequired: false,
          samplePickUpFrom: null,
          deliveryUpTo: null,
          sampleCollectionDate: null,
          sampleShippedDate: null,
          sampleReceivedDate: null,
          trackingId: null,
          courierCompany: null,
          progenicsTrf: null,
          followUp: null,
          remarkComment: null,
          leadCreatedBy: null,
          salesResponsiblePerson: null,
          leadCreated: /* @__PURE__ */ new Date(),
          leadModified: /* @__PURE__ */ new Date(),
          createdBy: null
        },
        {
          id: "2",
          uniqueId: "LEAD002",
          projectId: null,
          leadType: "Research",
          status: "quoted",
          organisationHospital: "Fortis Healthcare",
          clinicianResearcherName: "Dr. Patel",
          speciality: "Genetics Research",
          clinicianResearcherEmail: "contact@fortis.com",
          clinicianResearcherPhone: "+91-9876543211",
          clinicianResearcherAddress: null,
          patientClientName: "Research Subject 001",
          age: 35,
          gender: "Male",
          patientClientEmail: "subject@research.com",
          patientClientPhone: "+91-9876543213",
          patientClientAddress: null,
          serviceName: "Discovery Sequencing Service",
          sampleType: "Saliva",
          testCategory: null,
          noOfSamples: 20,
          budget: "50000",
          amountQuoted: "25000",
          tat: "10",
          sampleShipmentAmount: null,
          phlebotomistCharges: null,
          geneticCounselorRequired: false,
          nutritionalCounsellingRequired: false,
          samplePickUpFrom: null,
          deliveryUpTo: null,
          sampleCollectionDate: null,
          sampleShippedDate: null,
          sampleReceivedDate: /* @__PURE__ */ new Date(),
          trackingId: null,
          courierCompany: null,
          progenicsTrf: null,
          followUp: "Weekly updates",
          remarkComment: null,
          leadCreatedBy: null,
          salesResponsiblePerson: "John Sales Manager",
          leadCreated: /* @__PURE__ */ new Date(),
          leadModified: /* @__PURE__ */ new Date(),
          createdBy: null
        }
      ];
    }
    try {
      let whereCondition = void 0;
      if (userRole && userRole.toLowerCase() === "sales" && userId) {
        whereCondition = eq(leads.leadCreatedBy, userId);
      }
      let queryBuilder = db.select({ lead: leads, user: users, sample: samples }).from(leads).leftJoin(samples, eqUtf8Columns(samples.projectId, leads.projectId)).leftJoin(users, eq(leads.leadCreatedBy, users.id));
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
      return [];
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
    const rows = await db.select().from(leads).where(and(eq(leads.clinicianResearcherEmail, email), eq(leads.clinicianResearcherPhone, phone))).limit(1);
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
      console.log("Converting lead:", lead.id);
      console.log("Sample data:", sampleData);
      return await db.transaction(async (tx) => {
        await tx.update(leads).set({ status: "converted" }).where(eq(leads.id, leadId));
        console.log("\u2705 Lead status updated to converted");
        await tx.insert(samples).values({
          uniqueId: lead.uniqueId ?? null,
          projectId: lead.projectId ?? null,
          sampleCollectionDate: lead.sampleCollectionDate ?? null,
          sampleShippedDate: lead.sampleShippedDate ?? null,
          sampleDeliveryDate: lead.sampleReceivedDate ?? null,
          samplePickUpFrom: lead.samplePickUpFrom ?? null,
          deliveryUpTo: lead.deliveryUpTo ?? null,
          trackingId: lead.trackingId ?? null,
          courierCompany: lead.courierCompany ?? null,
          sampleShipmentAmount: lead.sampleShipmentAmount ?? null,
          organisationHospital: lead.organisationHospital ?? null,
          clinicianResearcherName: lead.clinicianResearcherName ?? null,
          clinicianResearcherPhone: lead.clinicianResearcherPhone ?? null,
          patientClientName: lead.patientClientName ?? null,
          patientClientPhone: lead.patientClientPhone ?? null,
          sampleReceivedDate: lead.sampleReceivedDate ?? null,
          salesResponsiblePerson: lead.salesResponsiblePerson ?? null
        });
        console.log("\u2705 Sample tracking created from lead");
        const createdSamples = await tx.select().from(samples).where(eq(samples.uniqueId, lead.uniqueId)).orderBy(desc(samples.createdAt)).limit(1);
        const createdSample = createdSamples && createdSamples[0] ? createdSamples[0] : null;
        let createdFinanceRecord = null;
        try {
          const financeData = {
            uniqueId: lead.uniqueId,
            projectId: lead.projectId ?? "",
            // Required field - NOT NULL in database
            sampleCollectionDate: lead.sampleCollectionDate ?? null,
            organisationHospital: lead.organisationHospital ?? null,
            clinicianResearcherName: lead.clinicianResearcherName ?? null,
            clinicianResearcherEmail: lead.clinicianResearcherEmail ?? null,
            clinicianResearcherPhone: lead.clinicianResearcherPhone ?? null,
            clinicianResearcherAddress: lead.clinicianResearcherAddress ?? null,
            patientClientName: lead.patientClientName ?? null,
            patientClientEmail: lead.patientClientEmail ?? null,
            patientClientPhone: lead.patientClientPhone ?? null,
            patientClientAddress: lead.patientClientAddress ?? null,
            serviceName: lead.serviceName ?? null,
            budget: lead.amountQuoted ? String(lead.amountQuoted) : null,
            phlebotomistCharges: lead.phlebotomistCharges ?? null,
            salesResponsiblePerson: lead.salesResponsiblePerson ?? null,
            sampleShipmentAmount: lead.sampleShipmentAmount ?? null,
            createdBy: lead.leadCreatedBy || "system",
            createdAt: /* @__PURE__ */ new Date()
          };
          console.log("Creating finance_sheet with data:", { uniqueId: financeData.uniqueId, projectId: financeData.projectId });
          const insertResult = await tx.insert(financeRecords).values(financeData);
          console.log("\u2705 Finance sheet record created from converted lead:", financeData.uniqueId);
          const createdRecords = await tx.select().from(financeRecords).where(eq(financeRecords.uniqueId, lead.uniqueId)).orderBy(desc(financeRecords.createdAt)).limit(1);
          createdFinanceRecord = createdRecords && createdRecords[0] ? createdRecords[0] : null;
          console.log("\u2705 Fetched finance record:", createdFinanceRecord?.id ?? "No record found");
        } catch (e) {
          console.error("\u274C Failed to create finance_sheet record:", e.message);
          console.error("Error details:", e);
        }
        try {
          await tx.insert(processMasterSheet).values({
            uniqueId: lead.uniqueId ?? null,
            projectId: lead.projectId ?? null,
            sampleId: createdSample?.uniqueId ?? null,
            clientId: lead.clientId ?? null,
            organisationHospital: lead.organisationHospital ?? null,
            clinicianResearcherName: lead.clinicianResearcherName ?? null,
            speciality: lead.speciality ?? null,
            clinicianResearcherEmail: lead.clinicianResearcherEmail ?? null,
            clinicianResearcherPhone: lead.clinicianResearcherPhone ?? null,
            clinicianResearcherAddress: lead.clinicianResearcherAddress ?? null,
            patientClientName: lead.patientClientName ?? null,
            age: lead.age ?? null,
            gender: lead.gender ?? null,
            patientClientEmail: lead.patientClientEmail ?? null,
            patientClientPhone: lead.patientClientPhone ?? null,
            patientClientAddress: lead.patientClientAddress ?? null,
            sampleCollectionDate: lead.sampleCollectionDate ?? null,
            sampleReceviedDate: lead.sampleReceivedDate ?? null,
            serviceName: lead.serviceName ?? null,
            sampleType: lead.sampleType ?? null,
            noOfSamples: lead.noOfSamples ?? null,
            tat: lead.tat ?? null,
            salesResponsiblePerson: lead.salesResponsiblePerson ?? null,
            progenicsTrf: null,
            thirdPartyTrf: null,
            progenicsReport: null,
            sampleSentToThirdPartyDate: null,
            thirdPartyName: null,
            thirdPartyReport: null,
            resultsRawDataReceivedFromThirdPartyDate: null,
            logisticStatus: "pending",
            financeStatus: "pending",
            labProcessStatus: "pending",
            bioinformaticsStatus: "pending",
            nutritionalManagementStatus: lead.nutritionalCounsellingRequired ? "pending" : "not_required",
            progenicsReportReleaseDate: null,
            remarkComment: null,
            createdBy: lead.leadCreatedBy || "system",
            modifiedAt: null,
            modifiedBy: null
          });
          console.log("\u2705 Process master sheet record created from converted lead");
        } catch (e) {
          console.error("Failed to create process_master_sheet record:", e.message);
          console.error("Error details:", JSON.stringify(e));
        }
        let createdGc = null;
        try {
          const leadServiceName = lead.serviceName || lead.service_name || "";
          const gcRequired = lead.geneticCounsellorRequired ?? lead.genetic_counsellor_required ?? false;
          const leadFollowUp = lead.followUp || lead.follow_up || "";
          const requestGcFlag = !!sampleData?.createGeneticCounselling || !!sampleData?.createGc || !!sampleData?.create_genetic_counselling;
          const shouldCreateGc = requestGcFlag || (String(leadServiceName).toLowerCase().includes("wes") || String(leadFollowUp).toLowerCase().includes("gc")) && !!gcRequired;
          console.log("GC decision: leadServiceName=", leadServiceName, "leadFollowUp=", leadFollowUp, "gcRequired=", gcRequired, "requestGcFlag=", requestGcFlag, "shouldCreateGc=", shouldCreateGc);
          if (shouldCreateGc) {
            console.log("\u2139\uFE0F Skipping automatic genetic counselling creation due to schema change");
          }
        } catch (err) {
          console.error("Failed to create genetic counselling record during conversion:", err.message);
        }
        const updatedLeadRows = await tx.select().from(leads).where(eq(leads.id, leadId)).limit(1);
        const updatedLead = updatedLeadRows[0];
        return {
          lead: updatedLead,
          sample: createdSample,
          finance: createdFinanceRecord,
          labProcessing: void 0,
          geneticCounselling: createdGc
        };
      });
    } catch (error) {
      console.error("\u274C Error in convertLead:", error);
      throw error;
    }
  }
  async getSamples() {
    const rows = await db.select({ sample: samples, lead: leads }).from(samples).leftJoin(leads, eqUtf8Columns(samples.projectId, leads.projectId));
    return rows.map((row) => ({
      ...row.sample,
      lead: row.lead
    }));
  }
  async getSampleById(id) {
    const rows = await db.select().from(samples).where(eq(samples.id, Number(id))).limit(1);
    return rows[0];
  }
  async updateSample(id, updates) {
    await db.update(samples).set(updates).where(eq(samples.id, Number(id)));
    return this.getSampleById(id);
  }
  async deleteSample(id) {
    try {
      try {
        const rows = await db.select().from(samples).where(eq(samples.id, Number(id))).limit(1);
        if (rows[0]) {
          const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          await db.insert(recycleBin2).values({ id: randomUUID(), entityType: "samples", entityId: id, data: rows[0], originalPath: `/samples/${id}` });
        }
      } catch (e) {
        console.error("Failed to create recycle snapshot for sample:", e.message);
      }
      await db.delete(samples).where(eq(samples.id, Number(id)));
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
      const sampleIdNum = Number(labData.sampleId);
      if (!isNaN(sampleIdNum)) {
        const byId = await db.select().from(samples).where(eq(samples.id, sampleIdNum)).limit(1);
        if (byId[0]) {
          resolvedSampleId = sampleIdNum.toString();
        } else {
          const byUnique = await db.select().from(samples).where(eq(samples.uniqueId, labData.sampleId)).limit(1);
          if (byUnique[0]) {
            resolvedSampleId = byUnique[0].id.toString();
          } else {
            throw new Error(`Sample not found for sample identifier: ${labData.sampleId}`);
          }
        }
      } else {
        const byUnique = await db.select().from(samples).where(eq(samples.uniqueId, labData.sampleId)).limit(1);
        if (byUnique[0]) {
          resolvedSampleId = byUnique[0].id.toString();
        } else {
          throw new Error(`Sample not found for sample identifier: ${labData.sampleId}`);
        }
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
    const rows = await db.select({ lp: labProcessing, sample: samples, lead: leads }).from(labProcessing).leftJoin(samples, eq(labProcessing.sampleId, samples.id)).leftJoin(leads, eqUtf8Columns(samples.projectId, leads.projectId));
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
    const rows = await db.select({ r: reports, sample: samples, lead: leads }).from(reports).leftJoin(samples, eq(reports.sampleId, samples.id)).leftJoin(leads, eqUtf8Columns(samples.projectId, leads.projectId));
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
    await db.insert(financeRecords).values({
      uniqueId: financeData.uniqueId,
      projectId: financeData.projectId ?? null,
      sampleCollectionDate: financeData.sampleCollectionDate ?? null,
      organisationHospital: financeData.organisationHospital ?? null,
      clinicianResearcherName: financeData.clinicianResearcherName ?? null,
      clinicianResearcherEmail: financeData.clinicianResearcherEmail ?? null,
      clinicianResearcherPhone: financeData.clinicianResearcherPhone ?? null,
      clinicianResearcherAddress: financeData.clinicianResearcherAddress ?? null,
      patientClientName: financeData.patientClientName ?? null,
      patientClientEmail: financeData.patientClientEmail ?? null,
      patientClientPhone: financeData.patientClientPhone ?? null,
      patientClientAddress: financeData.patientClientAddress ?? null,
      serviceName: financeData.serviceName ?? null,
      budget: financeData.budget ?? null,
      phlebotomistCharges: financeData.phlebotomistCharges ?? null,
      salesResponsiblePerson: financeData.salesResponsiblePerson ?? null,
      sampleShipmentAmount: financeData.sampleShipmentAmount ?? null,
      invoiceNumber: financeData.invoiceNumber ?? null,
      invoiceAmount: financeData.invoiceAmount ?? null,
      invoiceDate: financeData.invoiceDate ?? null,
      paymentReceiptAmount: financeData.paymentReceiptAmount ?? null,
      balanceAmount: financeData.balanceAmount ?? null,
      paymentReceiptDate: financeData.paymentReceiptDate ?? null,
      modeOfPayment: financeData.modeOfPayment ?? null,
      transactionalNumber: financeData.transactionalNumber ?? null,
      balanceAmountReceivedDate: financeData.balanceAmountReceivedDate ?? null,
      totalAmountReceivedStatus: financeData.totalAmountReceivedStatus ?? false,
      utrDetails: financeData.utrDetails ?? null,
      thirdPartyCharges: financeData.thirdPartyCharges ?? null,
      otherCharges: financeData.otherCharges ?? null,
      otherChargesReason: financeData.otherChargesReason ?? null,
      thirdPartyName: financeData.thirdPartyName ?? null,
      thirdPartyPhone: financeData.thirdPartyPhone ?? null,
      thirdPartyPaymentDate: financeData.thirdPartyPaymentDate ?? null,
      thirdPartyPaymentStatus: financeData.thirdPartyPaymentStatus ?? false,
      alertToLabprocessTeam: financeData.alertToLabprocessTeam ?? false,
      alertToReportTeam: financeData.alertToReportTeam ?? false,
      alertToTechnicalLead: financeData.alertToTechnicalLead ?? false,
      createdBy: financeData.createdBy ?? null,
      remarkComment: financeData.remarkComment ?? null
    });
    const rows = await db.select().from(financeRecords).where(eq(financeRecords.uniqueId, financeData.uniqueId)).limit(1);
    const created = rows[0];
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
      invoiceDate: financeRecords.invoiceDate,
      invoiceAmount: financeRecords.invoiceAmount,
      createdAt: financeRecords.createdAt
    };
    const orderExpr = sortBy ? mapping[sortBy] ?? financeRecords[sortBy] ?? void 0 : void 0;
    let rows = [];
    let total = 0;
    if (q) {
      const like = `%${q}%`;
      const searchCols = [
        "fr.unique_id",
        "fr.invoice_number",
        "fr.patient_client_name",
        "fr.organisation_hospital",
        "fr.service_name",
        "fr.sales_responsible_person",
        "fr.mode_of_payment",
        "fr.transactional_number",
        "fr.third_party_name",
        "s.organisation_hospital",
        "s.patient_client_name",
        "l.organisation_hospital",
        "l.patient_client_name"
      ];
      const whereParts = searchCols.map(() => `?`).map((p, i) => `${searchCols[i]} LIKE ${p}`);
      const whereClause = `WHERE ${whereParts.join(" OR ")}`;
      const orderClause = orderExpr ? `ORDER BY ${typeof orderExpr === "string" ? orderExpr : "fr.created_at"} ${sortDir === "asc" ? "ASC" : "DESC"}` : `ORDER BY fr.created_at DESC`;
      const sqlQuery = `SELECT fr.*, s.organisation_hospital AS sample_organisation, l.organisation_hospital AS lead_organisation FROM finance_sheet fr LEFT JOIN sample_tracking s ON s.project_id = fr.project_id LEFT JOIN lead_management l ON l.project_id = fr.project_id ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
      const likeBindings = searchCols.map(() => like);
      const bindings = [...likeBindings, pageSize, offset];
      try {
        const [resultRows] = await pool.execute(sqlQuery, bindings);
        rows = resultRows;
        const countSql = `SELECT COUNT(DISTINCT fr.id) as cnt FROM finance_sheet fr LEFT JOIN sample_tracking s ON s.project_id = fr.project_id LEFT JOIN lead_management l ON l.project_id = fr.project_id ${whereClause}`;
        const [countRes] = await pool.execute(countSql, likeBindings);
        total = countRes && countRes[0] && countRes[0].cnt ? Number(countRes[0].cnt) : 0;
      } catch (err) {
        console.error("Raw SQL finance search failed:", err);
        rows = [];
        total = 0;
      }
    } else {
      const qb = db.select({ fr: financeRecords, sample: samples, lead: leads, lp: labProcessing }).from(financeRecords).leftJoin(samples, eq(financeRecords.projectId, samples.projectId)).leftJoin(leads, eq(financeRecords.projectId, leads.projectId)).leftJoin(labProcessing, eq(labProcessing.sampleId, samples.id)).limit(pageSize).offset(offset).orderBy(orderExpr ? sortDir === "asc" ? asc(orderExpr) : desc(orderExpr) : desc(financeRecords.createdAt));
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
        const projectId = fr.projectId ?? sample?.projectId ?? null;
        return {
          ...fr,
          ...titleUniqueId != null ? { titleUniqueId } : {},
          ...projectId != null ? { projectId } : {},
          sample: sample ? { ...sample, lead: row.lead } : null
        };
      });
    } else {
      mapped = rows.map((r) => {
        const title_unique_id = r.title_unique_id ?? r.lp_title_unique_id ?? r.id ?? null;
        const project_id = r.project_id ?? r.projectId ?? null;
        const obj = { ...r };
        if (title_unique_id != null) {
          obj.title_unique_id = title_unique_id;
          if (obj.titleUniqueId == null) obj.titleUniqueId = title_unique_id;
        }
        if (project_id != null) {
          obj.project_id = project_id;
          if (obj.projectId == null) obj.projectId = project_id;
        }
        return obj;
      });
    }
    return { rows: mapped, total };
  }
  async getFinanceRecordById(id) {
    const rows = await db.select().from(financeRecords).where(eq(financeRecords.id, Number(id))).limit(1);
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
        await db.update(financeRecords).set(safeUpdates).where(eq(financeRecords.id, Number(id)));
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
        const rows = await db.select().from(financeRecords).where(eq(financeRecords.id, Number(id))).limit(1);
        if (rows[0]) {
          const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          await db.insert(recycleBin2).values({ id: randomUUID(), entityType: "finance_sheet", entityId: id, data: rows[0], originalPath: `/finance/records/${id}` });
        }
      } catch (e) {
        console.error("Failed to create recycle snapshot for finance record:", e.message);
      }
      await db.delete(financeRecords).where(eq(financeRecords.id, Number(id)));
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
    const rows = await db.select({ lt: logisticsTracking, sample: samples, lead: leads }).from(logisticsTracking).leftJoin(samples, eq(logisticsTracking.sampleId, samples.id)).leftJoin(leads, eqUtf8Columns(samples.projectId, leads.projectId));
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
    const toDbDate = (v) => {
      if (!v) return null;
      if (v instanceof Date) return v;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };
    const toDecimal = (v) => {
      if (v === null || v === void 0 || v === "") return null;
      const num = Number(v);
      return isNaN(num) ? null : String(num);
    };
    const toBoolean = (v) => !!v;
    const toString = (v) => {
      if (v === null || v === void 0) return null;
      return String(v).trim() === "" ? null : String(v).trim();
    };
    console.log("createGeneticCounselling received record:", {
      uniqueId: record.uniqueId,
      patientClientName: record.patientClientName,
      age: record.age,
      serviceName: record.serviceName,
      budget: record.budget,
      sampleType: record.sampleType
    });
    const dbRecord = {
      uniqueId: toString(record.uniqueId || record.unique_id || record.sampleId || record.sample_id) || "",
      projectId: record.projectId || record.project_id ? Number(record.projectId || record.project_id) : null,
      counsellingDate: toDbDate(record.counsellingDate || record.counselling_date || record.createdAt),
      gcRegistrationStartTime: toString(record.gcRegistrationStartTime || record.gc_registration_start_time),
      gcRegistrationEndTime: toString(record.gcRegistrationEndTime || record.gc_registration_end_time),
      patientClientName: toString(record.patientClientName || record.patient_client_name),
      age: record.age ? Number(record.age) : null,
      gender: toString(record.gender),
      patientClientEmail: toString(record.patientClientEmail || record.patient_client_email),
      patientClientPhone: toString(record.patientClientPhone || record.patient_client_phone),
      patientClientAddress: toString(record.patientClientAddress || record.patient_client_address),
      paymentStatus: toString(record.paymentStatus || record.payment_status),
      modeOfPayment: toString(record.modeOfPayment || record.mode_of_payment),
      approvalFromHead: toBoolean(record.approvalFromHead ?? record.approval_from_head ?? record.approvalStatus === "approved"),
      clinicianResearcherName: toString(record.clinicianResearcherName || record.clinician_researcher_name),
      organisationHospital: toString(record.organisationHospital || record.organisation_hospital),
      speciality: toString(record.speciality),
      querySuspection: toString(record.querySuspection || record.query_suspection),
      gcName: toString(record.gcName || record.gc_name) || "",
      gcOtherMembers: toString(record.gcOtherMembers || record.gc_other_members),
      serviceName: toString(record.serviceName || record.service_name),
      counselingType: toString(record.counselingType || record.counselling_type),
      counselingStartTime: toString(record.counselingStartTime || record.counselling_start_time),
      counselingEndTime: toString(record.counselingEndTime || record.counselling_end_time),
      budgetForTestOpted: toDecimal(record.budgetForTestOpted || record.budget_for_test_opted),
      testingStatus: toString(record.testingStatus || record.testing_status),
      actionRequired: toString(record.actionRequired || record.action_required),
      potentialPatientForTestingInFuture: toBoolean(record.potentialPatientForTestingInFuture ?? record.potential_patient_for_testing_in_future),
      extendedFamilyTestingRequirement: toBoolean(record.extendedFamilyTestingRequirement ?? record.extended_family_testing_requirement),
      budget: toDecimal(record.budget),
      sampleType: toString(record.sampleType || record.sample_type),
      gcSummarySheet: toString(record.gcSummarySheet || record.gc_summary || record.gc_summary_sheet),
      gcVideoLink: toString(record.gcVideoLink || record.gc_video_link),
      gcAudioLink: toString(record.gcAudioLink || record.gc_audio_link),
      salesResponsiblePerson: toString(record.salesResponsiblePerson || record.sales_responsible_person),
      createdBy: toString(record.createdBy || record.created_by),
      modifiedBy: toString(record.modifiedBy || record.modified_by),
      remarkComment: toString(record.remarkComment || record.remark_comment)
    };
    console.log("createGeneticCounselling mapped dbRecord:", {
      uniqueId: dbRecord.uniqueId,
      patientClientName: dbRecord.patientClientName,
      age: dbRecord.age,
      serviceName: dbRecord.serviceName,
      budget: dbRecord.budget,
      sampleType: dbRecord.sampleType
    });
    const existingRows = await db.select().from((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).where(eq((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.uniqueId, dbRecord.uniqueId)).limit(1);
    if (existingRows && existingRows.length > 0) {
      console.log("GC record already exists for uniqueId:", dbRecord.uniqueId, "- returning existing record instead of creating duplicate");
      return existingRows[0];
    }
    await db.insert((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).values(dbRecord);
    const rows = await db.select().from((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).where(eq((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.uniqueId, dbRecord.uniqueId)).orderBy(desc((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.id)).limit(1);
    return rows[0];
  }
  async getGeneticCounselling() {
    const rows = await db.select().from((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling);
    return rows;
  }
  async updateGeneticCounselling(id, updates) {
    const toDecimal = (v) => {
      if (v === null || v === void 0 || v === "") return null;
      const num = Number(v);
      return isNaN(num) ? null : String(num);
    };
    const toBoolean = (v) => v !== null && v !== void 0 && v !== "" ? !!v : void 0;
    const safe = {};
    if (updates.uniqueId || updates.unique_id) safe.uniqueId = updates.uniqueId || updates.unique_id;
    if (updates.projectId || updates.project_id) safe.projectId = Number(updates.projectId || updates.project_id);
    if (updates.counsellingDate || updates.counselling_date) safe.counsellingDate = updates.counsellingDate || updates.counselling_date;
    if (updates.gcRegistrationStartTime || updates.gc_registration_start_time) safe.gcRegistrationStartTime = updates.gcRegistrationStartTime || updates.gc_registration_start_time;
    if (updates.gcRegistrationEndTime || updates.gc_registration_end_time) safe.gcRegistrationEndTime = updates.gcRegistrationEndTime || updates.gc_registration_end_time;
    if (updates.patientClientName || updates.patient_client_name) safe.patientClientName = updates.patientClientName || updates.patient_client_name;
    if (updates.age !== void 0) safe.age = updates.age ? Number(updates.age) : null;
    if (updates.gender) safe.gender = updates.gender;
    if (updates.patientClientEmail || updates.patient_client_email) safe.patientClientEmail = updates.patientClientEmail || updates.patient_client_email;
    if (updates.patientClientPhone || updates.patient_client_phone) safe.patientClientPhone = updates.patientClientPhone || updates.patient_client_phone;
    if (updates.patientClientAddress || updates.patient_client_address) safe.patientClientAddress = updates.patientClientAddress || updates.patient_client_address;
    if (updates.paymentStatus || updates.payment_status) safe.paymentStatus = updates.paymentStatus || updates.payment_status;
    if (updates.modeOfPayment || updates.mode_of_payment) safe.modeOfPayment = updates.modeOfPayment || updates.mode_of_payment;
    if (updates.approvalFromHead !== void 0 || updates.approval_from_head !== void 0) safe.approvalFromHead = toBoolean(updates.approvalFromHead ?? updates.approval_from_head);
    if (updates.clinicianResearcherName || updates.clinician_researcher_name) safe.clinicianResearcherName = updates.clinicianResearcherName || updates.clinician_researcher_name;
    if (updates.organisationHospital || updates.organisation_hospital) safe.organisationHospital = updates.organisationHospital || updates.organisation_hospital;
    if (updates.speciality) safe.speciality = updates.speciality;
    if (updates.querySuspection || updates.query_suspection) safe.querySuspection = updates.querySuspection || updates.query_suspection;
    if (updates.gcName || updates.gc_name) safe.gcName = updates.gcName || updates.gc_name;
    if (updates.gcOtherMembers || updates.gc_other_members) safe.gcOtherMembers = updates.gcOtherMembers || updates.gc_other_members;
    if (updates.serviceName || updates.service_name) safe.serviceName = updates.serviceName || updates.service_name;
    if (updates.counselingType || updates.counselling_type) safe.counselingType = updates.counselingType || updates.counselling_type;
    if (updates.counselingStartTime || updates.counselling_start_time) safe.counselingStartTime = updates.counselingStartTime || updates.counselling_start_time;
    if (updates.counselingEndTime || updates.counselling_end_time) safe.counselingEndTime = updates.counselingEndTime || updates.counselling_end_time;
    if (updates.budgetForTestOpted || updates.budget_for_test_opted) safe.budgetForTestOpted = toDecimal(updates.budgetForTestOpted || updates.budget_for_test_opted);
    if (updates.testingStatus || updates.testing_status) safe.testingStatus = updates.testingStatus || updates.testing_status;
    if (updates.actionRequired || updates.action_required) safe.actionRequired = updates.actionRequired || updates.action_required;
    if (updates.potentialPatientForTestingInFuture !== void 0 || updates.potential_patient_for_testing_in_future !== void 0) safe.potentialPatientForTestingInFuture = toBoolean(updates.potentialPatientForTestingInFuture ?? updates.potential_patient_for_testing_in_future);
    if (updates.extendedFamilyTestingRequirement !== void 0 || updates.extended_family_testing_requirement !== void 0) safe.extendedFamilyTestingRequirement = toBoolean(updates.extendedFamilyTestingRequirement ?? updates.extended_family_testing_requirement);
    if (updates.budget) safe.budget = toDecimal(updates.budget);
    if (updates.sampleType || updates.sample_type) safe.sampleType = updates.sampleType || updates.sample_type;
    if (updates.gcSummarySheet || updates.gc_summary || updates.gc_summary_sheet) safe.gcSummarySheet = updates.gcSummarySheet || updates.gc_summary || updates.gc_summary_sheet;
    if (updates.gcVideoLink || updates.gc_video_link) safe.gcVideoLink = updates.gcVideoLink || updates.gc_video_link;
    if (updates.gcAudioLink || updates.gc_audio_link) safe.gcAudioLink = updates.gcAudioLink || updates.gc_audio_link;
    if (updates.salesResponsiblePerson || updates.sales_responsible_person) safe.salesResponsiblePerson = updates.salesResponsiblePerson || updates.sales_responsible_person;
    if (updates.modifiedBy || updates.modified_by) safe.modifiedBy = updates.modifiedBy || updates.modified_by;
    if (updates.remarkComment || updates.remark_comment) safe.remarkComment = updates.remarkComment || updates.remark_comment;
    if (Object.keys(safe).length === 0) {
      const numId2 = Number(id);
      const rows2 = await db.select().from((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).where(eq((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.id, numId2)).limit(1);
      return rows2[0];
    }
    const numId = Number(id);
    await db.update((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).set(safe).where(eq((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.id, numId));
    const rows = await db.select().from((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).where(eq((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.id, numId)).limit(1);
    return rows[0];
  }
  async deleteGeneticCounselling(id) {
    try {
      try {
        const numId2 = Number(id);
        const gc = await db.select().from((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).where(eq((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.id, numId2)).limit(1);
        if (gc[0]) {
          const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          await db.insert(recycleBin2).values({ id: randomUUID(), entityType: "genetic_counselling", entityId: id, data: gc[0], originalPath: `/genetic-counselling/${id}` });
        }
      } catch (e) {
        console.error("Failed to create recycle snapshot for genetic counselling:", e.message);
      }
      const numId = Number(id);
      await db.delete((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling).where(eq((await Promise.resolve().then(() => (init_schema(), schema_exports))).geneticCounselling.id, numId));
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
    const rows = await db.select().from(recycleBin2).orderBy(desc(recycleBin2.deletedAt));
    return rows;
  }
  async getRecycleEntry(id) {
    const { recycleBin: recycleBin2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const rows = await db.select().from(recycleBin2).where(eq(recycleBin2.id, id)).limit(1);
    if (!rows[0]) return void 0;
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
        case "finance_sheet":
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
    const rows = await db.select({ r: reports, sample: samples, lead: leads }).from(reports).leftJoin(samples, eq(reports.sampleId, samples.id)).leftJoin(leads, eqUtf8Columns(samples.projectId, leads.projectId)).where(eq(reports.status, "awaiting_approval"));
    return rows.map((row) => ({
      ...row.sample,
      lead: row.lead
    }));
  }
  // BIOINFORMATICS METHODS
  async sendLabProcessingToBioinformatics(recordId, tableType) {
    try {
      const labSheet = tableType === "discovery" ? labProcessDiscoverySheet : labProcessClinicalSheet;
      const labRows = await db.select().from(labSheet).where(eq(labSheet.uniqueId, recordId)).limit(1);
      if (labRows.length === 0) throw new Error("Lab processing record not found");
      const labRecord = labRows[0];
      const leadRows = await db.select().from(leads).where(eqUtf8Columns(leads.uniqueId, labRecord.uniqueId)).limit(1);
      const leadRecord = leadRows[0];
      const bioData = {
        uniqueId: labRecord.uniqueId,
        projectId: labRecord.projectId || (leadRecord?.projectId ? parseInt(String(leadRecord.projectId)) : void 0),
        sampleId: labRecord.sampleId || leadRecord?.id,
        clientId: labRecord.clientId || leadRecord?.id,
        organisationHospital: labRecord.organisationHospital || leadRecord?.organisationHospital,
        clinicianResearcherName: labRecord.clinicianResearcherName || leadRecord?.clinicianResearcherName,
        patientClientName: labRecord.patientClientName || leadRecord?.patientClientName,
        age: labRecord.age ?? leadRecord?.age,
        gender: labRecord.gender || leadRecord?.gender,
        serviceName: labRecord.serviceName || leadRecord?.serviceName,
        noOfSamples: labRecord.noOfSamples ?? leadRecord?.noOfSamples,
        tat: leadRecord?.tat,
        createdBy: "System"
      };
      const bioSheet = tableType === "discovery" ? bioinformaticsSheetDiscovery : bioinformaticsSheetClinical;
      const existingRows = await db.select().from(bioSheet).where(eq(bioSheet.uniqueId, labRecord.uniqueId)).limit(1);
      let bioRecord;
      if (existingRows.length > 0) {
        bioRecord = existingRows[0];
        await db.update(bioSheet).set({
          ...bioData,
          modifiedAt: /* @__PURE__ */ new Date(),
          modifiedBy: "System"
        }).where(eq(bioSheet.uniqueId, labRecord.uniqueId));
      } else {
        await db.insert(bioSheet).values(bioData);
        const newRows = await db.select().from(bioSheet).where(eq(bioSheet.uniqueId, labRecord.uniqueId)).limit(1);
        bioRecord = newRows[0];
      }
      await db.update(labSheet).set({
        alertToBioinformaticsTeam: true,
        modifiedAt: /* @__PURE__ */ new Date(),
        modifiedBy: "System"
      }).where(eq(labSheet.uniqueId, labRecord.uniqueId));
      return bioRecord;
    } catch (error) {
      console.error("Error sending lab processing to bioinformatics:", error.message);
      throw error;
    }
  }
  async createBioinformaticsRecord(data, tableType) {
    const bioSheet = tableType === "discovery" ? bioinformaticsSheetDiscovery : bioinformaticsSheetClinical;
    await db.insert(bioSheet).values(data);
    const rows = await db.select().from(bioSheet).where(eq(bioSheet.uniqueId, data.uniqueId)).limit(1);
    if (rows.length === 0) throw new Error("Failed to create bioinformatics record");
    return rows[0];
  }
  // ============================================================================
  // File Upload Tracking (stores metadata about uploaded files)
  // ============================================================================
  async createFileUpload(uploadData) {
    try {
      const id = randomUUID();
      const query = `
        INSERT INTO file_uploads (
          id, filename, original_name, storage_path, category, 
          file_size, mime_type, uploaded_by, related_entity_type, related_entity_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      await pool.execute(query, [
        id,
        uploadData.filename,
        uploadData.originalName,
        uploadData.storagePath,
        uploadData.category,
        uploadData.fileSize,
        uploadData.mimeType,
        uploadData.uploadedBy || null,
        uploadData.relatedEntityType || null,
        uploadData.relatedEntityId || null
      ]);
      return { id, ...uploadData, createdAt: /* @__PURE__ */ new Date() };
    } catch (error) {
      console.error("Failed to create file upload record:", error.message);
      throw error;
    }
  }
  async getFileUploadsByCategory(category) {
    try {
      const query = `
        SELECT * FROM file_uploads 
        WHERE category = ? AND is_deleted = 0
        ORDER BY created_at DESC
      `;
      const [rows] = await pool.execute(query, [category]);
      return rows || [];
    } catch (error) {
      console.error("Failed to get file uploads by category:", error.message);
      return [];
    }
  }
  async getFileUploadsByEntity(entityType, entityId) {
    try {
      const query = `
        SELECT * FROM file_uploads 
        WHERE related_entity_type = ? AND related_entity_id = ? AND is_deleted = 0
        ORDER BY created_at DESC
      `;
      const [rows] = await pool.execute(query, [entityType, entityId]);
      return rows || [];
    } catch (error) {
      console.error("Failed to get file uploads by entity:", error.message);
      return [];
    }
  }
  async getFileUploadById(id) {
    try {
      const query = `
        SELECT * FROM file_uploads 
        WHERE id = ? AND is_deleted = 0
        LIMIT 1
      `;
      const [rows] = await pool.execute(query, [id]);
      return rows?.[0];
    } catch (error) {
      console.error("Failed to get file upload by ID:", error.message);
      return void 0;
    }
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
import path2 from "path";
import fs2 from "fs";

// server/lib/generateRoleId.ts
var roleMap = {
  administration: "AD",
  admin: "AD",
  manager: "MG",
  discovery: "DG",
  production: "PG",
  finance: "FN",
  hr: "HR"
};
var SAFE_CHARS = "0123456789ABCDEFGHJKMNPQRSTUVWXYZ";
function generateRandomSuffix(length = 6) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += SAFE_CHARS.charAt(Math.floor(Math.random() * SAFE_CHARS.length));
  }
  return result;
}
async function idExists(uniqueId) {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT id FROM lead_management WHERE unique_id = ? LIMIT 1",
        [uniqueId]
      );
      return Array.isArray(rows) && rows.length > 0;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error checking if ID exists:", error);
    return false;
  }
}
async function generateRoleId(role) {
  const code = roleMap[role?.toLowerCase()] || (role ? role.substring(0, 2).toUpperCase() : "AD");
  const now = /* @__PURE__ */ new Date();
  const yy = String(now.getFullYear()).slice(2);
  let attempts = 0;
  const maxAttempts = 10;
  while (attempts < maxAttempts) {
    const suffix = generateRandomSuffix(6);
    const uniqueId = `${yy}${code}${suffix}`;
    const exists = await idExists(uniqueId);
    if (!exists) {
      return uniqueId;
    }
    attempts++;
    console.warn(`Generated ID ${uniqueId} already exists, regenerating... (attempt ${attempts}/${maxAttempts})`);
  }
  const timestamp2 = Date.now().toString().slice(-6);
  return `${yy}${code}${timestamp2}`;
}

// server/lib/generateProjectId.ts
function padZero(num) {
  return String(num).padStart(2, "0");
}
function getPrefix(category) {
  const cat = category?.toLowerCase().trim();
  if (cat === "discovery" || cat === "dg") {
    return "DG";
  } else if (cat === "clinical" || cat === "pg") {
    return "PG";
  }
  return "PG";
}
function generateTimestamp() {
  const now = /* @__PURE__ */ new Date();
  const yy = padZero(now.getFullYear() % 100);
  const mm = padZero(now.getMonth() + 1);
  const dd = padZero(now.getDate());
  const hh = padZero(now.getHours());
  const min = padZero(now.getMinutes());
  const ss = padZero(now.getSeconds());
  return `${yy}${mm}${dd}${hh}${min}${ss}`;
}
async function projectIdExists(projectId) {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT id FROM lead_management WHERE id = ? LIMIT 1",
        [projectId]
      );
      if (Array.isArray(rows) && rows.length > 0) {
        return true;
      }
      try {
        const [projRows] = await connection.query(
          "SELECT id FROM lead_management WHERE id = ? LIMIT 1",
          [projectId]
        );
        return Array.isArray(projRows) && projRows.length > 0;
      } catch {
        return false;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error checking if project ID exists:", error);
    return false;
  }
}
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function generateProjectId(category) {
  const prefix = getPrefix(category);
  const maxAttempts = 10;
  let attempts = 0;
  while (attempts < maxAttempts) {
    const timestamp3 = generateTimestamp();
    const projectId = `${prefix}${timestamp3}`;
    const exists = await projectIdExists(projectId);
    if (!exists) {
      console.log(`\u2713 Generated unique project ID: ${projectId} (attempt ${attempts + 1})`);
      return projectId;
    }
    attempts++;
    console.warn(`\u26A0 Project ID collision detected: ${projectId} (attempt ${attempts}/${maxAttempts})`);
    if (attempts < maxAttempts) {
      await sleep(1e3);
      console.log(`Retrying in 1 second... (attempt ${attempts + 1}/${maxAttempts})`);
    }
  }
  const timestamp2 = generateTimestamp();
  const ms = String(Date.now() % 1e3).padStart(3, "0");
  const fallbackId = `${prefix}${timestamp2}${ms.slice(0, 2)}`;
  console.warn(`\u26A0 Max attempts reached, using fallback ID: ${fallbackId}`);
  return fallbackId;
}

// server/lib/uploadHandler.ts
import fs from "fs";
import path from "path";
var CATEGORY_FOLDER_MAP = {
  "Progenics_TRF": "Progenics_TRF",
  "Thirdparty_TRF": "Thirdparty_TRF",
  "Progenics_Report": "Progenics_Report",
  "Thirdparty_Report": "Thirdparty_Report",
  // Finance attachments (screenshots, payment receipts, documents)
  "Finance_Screenshot_Document": "Finance_Screenshot_Document"
};
function ensureUploadDirectories() {
  const uploadsDir2 = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir2)) {
    fs.mkdirSync(uploadsDir2, { recursive: true });
    console.log(`\u2713 Created uploads directory: ${uploadsDir2}`);
  }
  Object.values(CATEGORY_FOLDER_MAP).forEach((folderName) => {
    const categoryDir = path.join(uploadsDir2, folderName);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
      console.log(`\u2713 Created uploads subdirectory: ${categoryDir}`);
    }
  });
}
function getCategoryFolder(category) {
  const folderName = CATEGORY_FOLDER_MAP[category];
  if (!folderName) {
    throw new Error(
      `Invalid category: "${category}". Valid categories are: ${Object.keys(CATEGORY_FOLDER_MAP).join(", ")}`
    );
  }
  return path.join(process.cwd(), "uploads", folderName);
}
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}
function generateUniqueFilename(originalFilename) {
  const sanitized = sanitizeFilename(originalFilename);
  return `${Date.now()}-${sanitized}`;
}
function validateFile(file, maxSize) {
  if (!file) {
    return { valid: false, error: "No file uploaded" };
  }
  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }
  if (!file.originalname || file.originalname.trim().length === 0) {
    return { valid: false, error: "Invalid filename" };
  }
  return { valid: true };
}
function handleFileUpload(file, category, userId) {
  const validation = validateFile(file);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.error || "File validation failed"
    };
  }
  try {
    const categoryFolder = getCategoryFolder(category);
    const uniqueFilename = generateUniqueFilename(file.originalname);
    const filePath = path.join(categoryFolder, uniqueFilename);
    if (!fs.existsSync(categoryFolder)) {
      fs.mkdirSync(categoryFolder, { recursive: true });
    }
    if (file.destination !== categoryFolder) {
      fs.renameSync(file.path, filePath);
    }
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
    return {
      success: true,
      filePath: relativePath,
      filename: uniqueFilename,
      message: `File uploaded successfully to ${category} folder`,
      category,
      fileSize: file.size,
      mimeType: file.mimetype
    };
  } catch (error) {
    console.error("File upload error:", error);
    return {
      success: false,
      message: `File upload failed: ${error.message}`
    };
  }
}

// server/routes.ts
import xlsx from "xlsx";
import multer from "multer";
var uploadsDir = path2.join(process.cwd(), "uploads");
if (!fs2.existsSync(uploadsDir)) fs2.mkdirSync(uploadsDir, { recursive: true });
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
var financeUploadsDir = path2.join(uploadsDir, "finance");
if (!fs2.existsSync(financeUploadsDir)) fs2.mkdirSync(financeUploadsDir, { recursive: true });
var storageFinance = multer.diskStorage({
  destination: function(_req, _file, cb) {
    cb(null, financeUploadsDir);
  },
  filename: function(_req, file, cb) {
    const unique = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "_")}`;
    cb(null, unique);
  }
});
var uploadFinance = multer({ storage: storageFinance, limits: { fileSize: 20 * 1024 * 1024 } });
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
    "thirdPartyReceivedDate",
    "sampleCollectionDate",
    "sampleDeliveryDate",
    "sampleSentToThirdPartyDate",
    "sampleReceivedToThirdPartyDate",
    "leadCreated",
    "leadModified",
    "deliveryUpTo",
    "sampleReceivedDate"
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
async function syncLeadToProcessMaster(lead, isUpdate = false) {
  try {
    console.log("[Sync Debug] syncLeadToProcessMaster called with lead:", {
      id: lead.id,
      uniqueId: lead.uniqueId || lead.unique_id,
      projectId: lead.projectId || lead.project_id,
      isUpdate
    });
    const pmRecord = {
      unique_id: lead.uniqueId || lead.unique_id,
      project_id: lead.projectId || lead.project_id,
      sample_id: lead.sampleId || lead.sample_id || null,
      client_id: lead.clientId || lead.client_id || null,
      organisation_hospital: lead.organisationHospital || lead.organisation_hospital || null,
      clinician_researcher_name: lead.clinicianResearcherName || lead.clinician_researcher_name || null,
      speciality: lead.speciality || null,
      clinician_researcher_email: lead.clinicianResearcherEmail || lead.clinician_researcher_email || null,
      clinician_researcher_phone: lead.clinicianResearcherPhone || lead.clinician_researcher_phone || null,
      clinician_researcher_address: lead.clinicianResearcherAddress || lead.clinician_researcher_address || null,
      patient_client_name: lead.patientClientName || lead.patient_client_name || null,
      age: lead.age || null,
      gender: lead.gender || null,
      patient_client_email: lead.patientClientEmail || lead.patient_client_email || null,
      patient_client_phone: lead.patientClientPhone || lead.patient_client_phone || null,
      patient_client_address: lead.patientClientAddress || lead.patient_client_address || null,
      sample_collection_date: lead.sampleCollectionDate || lead.sample_collection_date || null,
      sample_recevied_date: lead.sampleReceivedDate || lead.sample_recevied_date || null,
      service_name: lead.serviceName || lead.service_name || null,
      sample_type: lead.sampleType || lead.sample_type || null,
      no_of_samples: lead.noOfSamples || lead.no_of_samples || null,
      tat: lead.tat || null,
      sales_responsible_person: lead.salesResponsiblePerson || lead.sales_responsible_person || null,
      progenics_trf: lead.progenicsTrf || lead.progenics_trf || null,
      third_party_trf: null,
      // Not in lead_management
      progenics_report: null,
      // Not directly in lead_management
      sample_sent_to_third_party_date: null,
      // Not directly in lead_management
      third_party_name: null,
      // Not directly in lead_management
      third_party_report: null,
      // Not directly in lead_management
      results_raw_data_received_from_third_party_date: null,
      // Not directly in lead_management
      logistic_status: null,
      // Set separately
      finance_status: null,
      // Set separately
      lab_process_status: null,
      // Set separately
      bioinformatics_status: null,
      // Set separately
      nutritional_management_status: null,
      // Set separately
      progenics_report_release_date: null,
      // Set separately
      Remark_Comment: lead.remarkComment || lead.Remark_Comment || null
    };
    const [existing] = await pool.execute(
      "SELECT id FROM process_master_sheet WHERE unique_id = ?",
      [pmRecord.unique_id]
    );
    console.log("[Sync Debug] Existing PM record check:", {
      unique_id: pmRecord.unique_id,
      found: existing && existing.length > 0,
      existingCount: existing?.length
    });
    if (isUpdate || existing && existing.length > 0) {
      const keys = Object.keys(pmRecord).filter((k) => pmRecord[k] !== null);
      const set = keys.map((k) => `\`${k}\` = ?`).join(",");
      const values = keys.map((k) => pmRecord[k]);
      values.push(pmRecord.unique_id);
      console.log("[Sync Debug] Updating PM record with fields:", keys);
      await pool.execute(
        `UPDATE process_master_sheet SET ${set}, modified_at = NOW() WHERE unique_id = ?`,
        values
      );
      console.log("[Sync] Lead updated in ProcessMaster:", pmRecord.unique_id);
    } else {
      const keys = Object.keys(pmRecord).filter((k) => pmRecord[k] !== null);
      const cols = keys.map((k) => `\`${k}\``).join(",");
      const placeholders = keys.map(() => "?").join(",");
      const values = keys.map((k) => pmRecord[k]);
      console.log("[Sync Debug] Creating new PM record with fields:", keys);
      console.log("[Sync Debug] SQL:", `INSERT INTO process_master_sheet (${cols}, created_at) VALUES (${placeholders}, NOW())`);
      await pool.execute(
        `INSERT INTO process_master_sheet (${cols}, created_at) VALUES (${placeholders}, NOW())`,
        values
      );
      console.log("[Sync] Lead created in ProcessMaster:", pmRecord.unique_id);
    }
  } catch (error) {
    console.error("Failed to sync lead to ProcessMaster:", error);
  }
}
async function registerRoutes(app2) {
  ensureUploadDirectories();
  console.log("\u2705 File upload directories initialized");
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
      const allowed = ["sales", "operations", "finance", "lab", "bioinformatics", "reporting", "nutritionist", "manager", "admin"];
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
  const wesReportDir = path2.join(process.cwd(), "WES report code", "wes_report");
  if (fs2.existsSync(wesReportDir)) {
    app2.use("/wes-report", (await import("express")).static(wesReportDir));
  }
  app2.post("/api/uploads/categorized", uploadDisk.single("file"), async (req, res) => {
    try {
      const { category, entityType, entityId } = req.query;
      const file = req.file;
      if (!category || typeof category !== "string") {
        return res.status(400).json({
          success: false,
          message: "Category parameter is required and must be a string"
        });
      }
      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }
      const uploadResult = handleFileUpload(file, category);
      if (!uploadResult.success) {
        try {
          fs2.unlinkSync(file.path);
        } catch (e) {
        }
        return res.status(400).json(uploadResult);
      }
      try {
        const uploadRecord = await storage.createFileUpload({
          filename: uploadResult.filename || "",
          originalName: file.originalname,
          storagePath: uploadResult.filePath || "",
          category,
          fileSize: uploadResult.fileSize || 0,
          mimeType: uploadResult.mimeType || "",
          uploadedBy: req.user?.id || "anonymous",
          relatedEntityType: entityType || void 0,
          relatedEntityId: entityId || void 0
        });
        return res.json({
          success: true,
          filePath: uploadResult.filePath,
          filename: uploadResult.filename,
          message: uploadResult.message,
          category: uploadResult.category,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          uploadId: uploadRecord.id
        });
      } catch (dbError) {
        console.error("Failed to store upload metadata:", dbError);
        return res.json({
          success: true,
          filePath: uploadResult.filePath,
          filename: uploadResult.filename,
          message: uploadResult.message + " (metadata storage failed)",
          category: uploadResult.category,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          uploadId: null
        });
      }
    } catch (error) {
      console.error("Upload categorized endpoint error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during file upload",
        error: error.message
      });
    }
  });
  app2.post("/api/uploads/trf", uploadDisk.single("trf"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.originalname });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  app2.post("/api/uploads/file", uploadDisk.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.originalname });
    } catch (error) {
      console.error("File upload failed:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  app2.get("/api/uploads/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const uploads = await storage.getFileUploadsByCategory(category);
      res.json({
        success: true,
        category,
        uploads,
        total: uploads.length
      });
    } catch (error) {
      console.error("Failed to fetch uploads by category:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch uploads"
      });
    }
  });
  app2.get("/api/uploads/entity/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const uploads = await storage.getFileUploadsByEntity(entityType, entityId);
      res.json({
        success: true,
        entityType,
        entityId,
        uploads,
        total: uploads.length
      });
    } catch (error) {
      console.error("Failed to fetch uploads by entity:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch uploads"
      });
    }
  });
  app2.post("/api/uploads/trf", uploadDisk.single("trf"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.originalname });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  app2.post("/api/sync/leads-to-process-master", async (req, res) => {
    try {
      console.log("[SYNC] Starting manual sync of all leads to ProcessMaster...");
      const leads2 = await storage.getLeads();
      let synced = 0;
      let failed = 0;
      for (const lead of leads2) {
        try {
          await syncLeadToProcessMaster(lead, false);
          synced++;
        } catch (error) {
          console.error("[SYNC] Failed to sync lead:", lead.uniqueId, error);
          failed++;
        }
      }
      res.json({
        message: `Sync completed: ${synced} leads synced, ${failed} failed`,
        synced,
        failed,
        total: leads2.length
      });
      console.log(`[SYNC] Sync completed: ${synced}/${leads2.length} leads synced to ProcessMaster`);
    } catch (error) {
      console.error("[SYNC] Error during bulk sync:", error);
      res.status(500).json({ message: "Failed to sync leads", error: error.message });
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
      try {
        if (!normalized.projectId && !normalized.project_id) {
          const category = normalized.testCategory || normalized.category || normalized.lead_type || "clinical";
          const projectId = await generateProjectId(String(category));
          normalized.projectId = projectId;
          normalized.project_id = projectId;
        }
      } catch (e) {
        console.warn("generateProjectId failed for POST /api/leads", e);
      }
      const result = insertLeadSchema.safeParse(normalized);
      if (!result.success) {
        console.error("Lead validation failed on POST /api/leads:", JSON.stringify(result.error.errors, null, 2));
        const rawDateSampleCollected = req.body && req.body.dateSampleCollected;
        const rawPickupUpto = req.body && req.body.pickupUpto;
        return res.status(400).json({ message: "Invalid lead data", errors: result.error.errors, fields: formatZodErrors(result.error), debug: { rawDateSampleCollected, rawPickupUpto } });
      }
      const lead = await storage.createLead(result.data);
      await syncLeadToProcessMaster(lead, false);
      console.log("Lead nutritionalCounsellingRequired check:", lead.nutritionalCounsellingRequired, "Type:", typeof lead.nutritionalCounsellingRequired);
      if (lead.nutritionalCounsellingRequired === true) {
        try {
          const [existingNM] = await pool.execute(
            "SELECT id FROM nutritional_management WHERE unique_id = ? LIMIT 1",
            [lead.uniqueId]
          );
          if (existingNM && existingNM.length > 0) {
            console.log("Nutrition record already exists for unique_id:", lead.uniqueId, "- skipping auto-creation");
          } else {
            console.log("TRIGGERING nutrition auto-creation for lead:", lead.id);
            const nutritionRecord = {
              uniqueId: lead.uniqueId,
              projectId: lead.projectId,
              serviceName: lead.serviceName || "",
              patientClientName: lead.patientClientName || "",
              age: lead.age,
              gender: lead.gender || "",
              createdBy: lead.leadCreatedBy || "system",
              createdAt: /* @__PURE__ */ new Date()
            };
            const [result2] = await pool.execute(
              `INSERT INTO nutritional_management (unique_id, project_id, service_name, patient_client_name, age, gender, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [nutritionRecord.uniqueId, nutritionRecord.projectId, nutritionRecord.serviceName, nutritionRecord.patientClientName, nutritionRecord.age, nutritionRecord.gender, nutritionRecord.createdBy, nutritionRecord.createdAt]
            );
            console.log("Auto-created nutrition record for lead:", lead.id);
          }
        } catch (err) {
          console.error("Failed to auto-create nutrition record for lead:", err.message);
        }
      }
      console.log("Lead geneticCounselorRequired check:", lead.geneticCounselorRequired, "Lead keys:", Object.keys(lead).filter((k) => k.includes("genetic")));
      console.log("[GC Auto-Create] Full lead object keys:", Object.keys(lead));
      console.log("[GC Auto-Create] Lead.patientClientAddress:", lead.patientClientAddress);
      console.log("[GC Auto-Create] Lead.patient_client_address:", lead.patient_client_address);
      if (lead.geneticCounselorRequired) {
        try {
          const [existingGC] = await pool.execute(
            "SELECT id FROM genetic_counselling_records WHERE unique_id = ? LIMIT 1",
            [lead.uniqueId]
          );
          if (existingGC && existingGC.length > 0) {
            console.log("GC record already exists for unique_id:", lead.uniqueId, "- skipping auto-creation");
          } else {
            console.log("TRIGGERING genetic counselling auto-creation for lead:", lead.id);
            const toString = (v) => {
              if (v === null || v === void 0) return null;
              return String(v).trim() === "" ? null : String(v).trim();
            };
            const geneticCounsellingRecord = {
              unique_id: toString(lead.uniqueId) || "",
              project_id: lead.projectId || null,
              patient_client_name: toString(lead.patientClientName),
              patient_client_address: toString(lead.patientClientAddress || lead.patient_client_address),
              age: lead.age ? Number(lead.age) : null,
              gender: toString(lead.gender),
              patient_client_email: toString(lead.patientClientEmail),
              patient_client_phone: toString(lead.patientClientPhone),
              clinician_researcher_name: toString(lead.clinicianResearcherName),
              organisation_hospital: toString(lead.organisationHospital),
              speciality: toString(lead.speciality),
              service_name: toString(lead.serviceName),
              budget: lead.amountQuoted ? Number(lead.amountQuoted) : null,
              sample_type: toString(lead.sampleType),
              sales_responsible_person: toString(lead.salesResponsiblePerson),
              created_by: toString(lead.leadCreatedBy) || "system",
              created_at: /* @__PURE__ */ new Date()
            };
            console.log("Auto-creating genetic counselling record with data:", {
              unique_id: geneticCounsellingRecord.unique_id,
              patient_client_name: geneticCounsellingRecord.patient_client_name,
              patient_client_address: geneticCounsellingRecord.patient_client_address,
              age: geneticCounsellingRecord.age,
              service_name: geneticCounsellingRecord.service_name,
              sample_type: geneticCounsellingRecord.sample_type
            });
            console.log("[GC Auto-Create Debug] Lead source address - patientClientAddress:", lead.patientClientAddress, "patient_client_address:", lead.patient_client_address);
            const keys = Object.keys(geneticCounsellingRecord).filter((k) => geneticCounsellingRecord[k] !== void 0);
            console.log("[GC Auto-Create Debug] Fields being inserted:", keys);
            console.log("[GC Auto-Create Debug] Full record object:", JSON.stringify(geneticCounsellingRecord, null, 2));
            const cols = keys.map((k) => `\`${k}\``).join(",");
            const placeholders = keys.map(() => "?").join(",");
            const values = keys.map((k) => geneticCounsellingRecord[k]);
            const [result2] = await pool.execute(
              `INSERT INTO genetic_counselling_records (${cols}) VALUES (${placeholders})`,
              values
            );
            console.log("Auto-created genetic counselling record for lead:", lead.id, "GC Record ID:", result2.insertId);
          }
        } catch (err) {
          console.error("Failed to auto-create genetic counselling record for lead:", err.message);
        }
      }
      console.log("Lead created successfully, sending notification for:", lead.id, lead.organisationHospital);
      try {
        await notificationService.notifyLeadCreated(
          lead.id,
          lead.organisationHospital || "Unknown Organization",
          lead.leadCreatedBy || "system"
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
          lead.organisationHospital || "Unknown Organization",
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
      await syncLeadToProcessMaster(lead, true);
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
          const [existingGC] = await pool.execute(
            "SELECT id FROM genetic_counselling_records WHERE unique_id = ? LIMIT 1",
            [conversion.sample.uniqueId]
          );
          if (existingGC && existingGC.length > 0) {
            console.log("[convert-lead] GC record already exists for unique_id:", conversion.sample.uniqueId, "- skipping auto-creation");
            createdGc = { id: existingGC[0].id, uniqueId: conversion.sample.uniqueId, alreadyExists: true };
          } else {
            createdGc = await storage.createGeneticCounselling({ sampleId: conversion.sample.uniqueId || "", gcName: "" });
            try {
              await notificationService.notifyGeneticCounsellingRequired(
                conversion.sample.uniqueId || "Unknown Sample",
                conversion.lead.patientClientName || "Unknown Patient",
                "system"
              );
            } catch (notificationError) {
              console.error("Failed to send genetic counselling notification:", notificationError);
            }
          }
        }
      } catch (err) {
        console.error("Failed to create genetic counselling after conversion:", err.message);
      }
      let createdNutrition = null;
      try {
        console.log("[convert-lead] nutritionalCounsellingRequired check:", lead.nutritionalCounsellingRequired, "Type:", typeof lead.nutritionalCounsellingRequired);
        if (lead.nutritionalCounsellingRequired === true) {
          const [existingNM] = await pool.execute(
            "SELECT id FROM nutritional_management WHERE unique_id = ? LIMIT 1",
            [conversion.lead.uniqueId]
          );
          if (existingNM && existingNM.length > 0) {
            console.log("[convert-lead] Nutrition record already exists for unique_id:", conversion.lead.uniqueId, "- skipping auto-creation");
            createdNutrition = { id: existingNM[0].id, uniqueId: conversion.lead.uniqueId, alreadyExists: true };
          } else {
            console.log("[convert-lead] TRIGGERING nutrition auto-creation for lead:", conversion.lead.id);
            const nutritionRecord = {
              uniqueId: conversion.lead.uniqueId,
              projectId: conversion.lead.projectId,
              sampleId: conversion.sample.uniqueId,
              serviceName: conversion.lead.serviceName || "",
              patientClientName: conversion.lead.patientClientName || "",
              age: conversion.lead.age,
              gender: conversion.lead.gender || "",
              createdBy: conversion.lead.leadCreatedBy || "system",
              createdAt: /* @__PURE__ */ new Date()
            };
            const [result] = await pool.execute(
              `INSERT INTO nutritional_management (unique_id, project_id, sample_id, service_name, patient_client_name, age, gender, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [nutritionRecord.uniqueId, nutritionRecord.projectId, nutritionRecord.sampleId, nutritionRecord.serviceName, nutritionRecord.patientClientName, nutritionRecord.age, nutritionRecord.gender, nutritionRecord.createdBy, nutritionRecord.createdAt]
            );
            const insertId = result.insertId;
            const [rows] = await pool.execute("SELECT * FROM nutritional_management WHERE id = ?", [insertId]);
            createdNutrition = rows && rows[0] ? rows[0] : null;
            console.log("Auto-created nutrition record for converted lead:", conversion.lead.id);
            try {
              await notificationService.notifyGeneticCounsellingRequired(
                conversion.sample.uniqueId || "Unknown Sample",
                conversion.lead.patientClientName || "Unknown Patient",
                "system"
              );
            } catch (notificationError) {
              console.error("Failed to send nutrition counselling notification:", notificationError);
            }
          }
        }
      } catch (err) {
        console.error("Failed to auto-create nutrition record after conversion:", err.message);
      }
      try {
        await notificationService.notifyLeadConverted(
          conversion.lead.id,
          conversion.lead.organisationHospital || "Unknown Organization",
          conversion.sample.uniqueId || "Unknown Sample",
          "system"
        );
        await notificationService.notifySampleReceived(
          conversion.sample.uniqueId || "Unknown Sample",
          conversion.lead.organisationHospital || "Unknown Organization",
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
            message: `Lead from ${conversion.lead.organisationHospital || "Unknown Organization"} has been converted. Sample ID: ${conversion.sample.uniqueId || "Unknown Sample"}`,
            type: "lead_converted",
            relatedId: String(conversion.sample.id),
            isRead: false
          });
        }
      } catch (legacyNotificationError) {
        console.error("Failed to send legacy notifications:", legacyNotificationError);
      }
      res.json({ ...conversion, geneticCounselling: createdGc, nutritionCounselling: createdNutrition });
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
      try {
        const sample = await storage.getSampleById(labProcessing2.sampleId);
        if (sample) {
          await notificationService.notifyLabProcessingStarted(
            sample.uniqueId || "Unknown Sample",
            "Sample Lab Processing",
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
          sample?.uniqueId || updated.labId,
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
      const created = await storage.createGeneticCounselling(body);
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
      const updated = await storage.updateGeneticCounselling(id, updates);
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
  app2.post("/api/send-to-reports", async (req, res) => {
    try {
      const {
        bioinformaticsId,
        sampleId,
        projectId,
        uniqueId,
        serviceName,
        analysisDate,
        createdBy
      } = req.body;
      console.log("Send to Reports triggered for bioinformatics:", bioinformaticsId, "Project ID:", projectId);
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }
      const isDiscovery = projectId.startsWith("DG");
      const isClinical = projectId.startsWith("PG");
      console.log("Project ID analysis - Discovery:", isDiscovery, "Clinical:", isClinical);
      if (!isDiscovery && !isClinical) {
        return res.status(400).json({ message: "Project ID must start with DG (Discovery) or PG (Clinical)" });
      }
      let leadData = { service_name: serviceName };
      try {
        const [leadRows] = await pool.execute(
          "SELECT service_name FROM lead_management WHERE unique_id = ? LIMIT 1",
          [uniqueId]
        );
        if (leadRows && leadRows.length > 0) {
          const lead = leadRows[0];
          leadData.service_name = serviceName || lead.service_name || null;
          console.log("Fetched lead data from lead_management table:", leadData);
        }
      } catch (leadError) {
        console.log("Note: Could not fetch lead data -", leadError.message);
      }
      const reportData = {
        unique_id: uniqueId || "",
        project_id: projectId,
        bioinformatics_id: bioinformaticsId || null,
        sample_id: sampleId || null
      };
      if (leadData.service_name) reportData.service_name = leadData.service_name;
      if (analysisDate) {
        const dateObj = new Date(analysisDate);
        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getUTCDate()).padStart(2, "0");
        reportData.report_date = `${year}-${month}-${day}`;
      }
      reportData.created_by = createdBy || "system";
      reportData.created_at = /* @__PURE__ */ new Date();
      reportData.status = "pending_review";
      const keys = Object.keys(reportData);
      const cols = keys.map((k) => `\`${k}\``).join(",");
      const placeholders = keys.map(() => "?").join(",");
      const values = keys.map((k) => reportData[k]);
      let insertResult;
      let tableName;
      if (isDiscovery) {
        tableName = "report_discovery_sheet";
        console.log(`Inserting into ${tableName} for discovery project:`, projectId);
        const result = await pool.execute(
          `INSERT INTO report_discovery_sheet (${cols}) VALUES (${placeholders})`,
          values
        );
        insertResult = result[0];
      } else {
        tableName = "report_clinical_sheet";
        console.log(`Inserting into ${tableName} for clinical project:`, projectId);
        const result = await pool.execute(
          `INSERT INTO report_clinical_sheet (${cols}) VALUES (${placeholders})`,
          values
        );
        insertResult = result[0];
      }
      const insertId = insertResult.insertId || null;
      console.log(`Inserted into ${tableName} with ID:`, insertId);
      try {
        const bioTableName = isDiscovery ? "bioinfo_discovery_sheet" : "bioinfo_clinical_sheet";
        await pool.execute(
          `UPDATE ${bioTableName} SET alert_to_report_team = ?, updated_at = ? WHERE id = ?`,
          [true, /* @__PURE__ */ new Date(), bioinformaticsId]
        );
        console.log("Updated bioinformatics flag for:", bioinformaticsId);
      } catch (updateError) {
        console.error("Warning: Failed to update bioinformatics flag", updateError.message);
      }
      try {
        await notificationService.notifyReportGenerated(
          insertId,
          "Bioinformatics Analysis Report",
          leadData.service_name || "Analysis Report",
          createdBy || "system"
        );
      } catch (notificationError) {
        console.error("Failed to send report notification:", notificationError);
      }
      res.json({
        success: true,
        reportId: insertId,
        bioinformaticsId,
        table: tableName,
        message: "Bioinformatics record sent to Reports module"
      });
    } catch (error) {
      console.error("Error in send-to-reports:", error);
      res.status(500).json({
        message: "Failed to send bioinformatics record to Reports",
        error: error.message
      });
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
      if (!normalized.projectId) {
        console.warn("[API] Finance record created without projectId:", {
          sampleId: normalized.sampleId,
          uniqueId: normalized.uniqueId,
          payload: normalized
        });
      }
      const result = insertFinanceRecordSchema.safeParse(normalized);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid finance record data", errors: result.error.errors });
      }
      const record = await storage.createFinanceRecord(result.data);
      try {
        const totalAmount = parseFloat(record.totalAmount?.toString() || "0");
        const organisationHospital = record.organisationHospital || "Unknown Organization";
        const paymentStatus = record.paymentStatus;
        if (paymentStatus === "paid") {
          await notificationService.notifyPaymentReceived(
            String(record.id),
            totalAmount,
            organisationHospital,
            "system"
          );
        } else if (paymentStatus === "pending") {
          await notificationService.notifyPaymentPending(
            String(record.id),
            totalAmount,
            organisationHospital,
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
  app2.get("/api/sample-tracking", async (req, res) => {
    try {
      const samples2 = await storage.getSamples();
      res.json(samples2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sample tracking records" });
    }
  });
  app2.put("/api/sample-tracking/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = normalizeDateFields(req.body);
      const result = insertSampleSchema.partial().safeParse(updates);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid sample data", errors: result.error.errors });
      }
      const sample = await storage.updateSample(id, result.data);
      if (!sample) return res.status(404).json({ message: "Sample not found" });
      res.json(sample);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sample tracking record" });
    }
  });
  app2.delete("/api/sample-tracking/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteSample(id);
      if (!ok) return res.status(500).json({ message: "Failed to delete sample tracking record" });
      res.json({ id });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sample tracking record" });
    }
  });
  app2.get("/api/finance", async (req, res) => {
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
  app2.post("/api/finance", async (req, res) => {
    try {
      const result = insertFinanceRecordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid finance data", errors: result.error.errors });
      }
      const record = await storage.createFinanceRecord(result.data);
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to create finance record" });
    }
  });
  app2.put("/api/finance/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = normalizeDateFields(req.body);
      const result = insertFinanceRecordSchema.partial().safeParse(updates);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid finance data", errors: result.error.errors });
      }
      const record = await storage.updateFinanceRecord(id, result.data);
      if (!record) return res.status(404).json({ message: "Finance record not found" });
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to update finance record" });
    }
  });
  app2.delete("/api/finance/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteFinanceRecord(id);
      if (!ok) return res.status(500).json({ message: "Failed to delete finance record" });
      res.json({ id });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete finance record" });
    }
  });
  app2.get("/api/labprocess-discovery", async (req, res) => {
    try {
      const queue = await storage.getLabProcessingQueue();
      const filtered = queue.filter((r) => (r.sample?.lead?.category || r.category || "").toLowerCase() === "discovery");
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch discovery lab processing records" });
    }
  });
  app2.get("/api/labprocess-clinical", async (req, res) => {
    try {
      const queue = await storage.getLabProcessingQueue();
      const filtered = queue.filter((r) => (r.sample?.lead?.category || r.category || "").toLowerCase() === "clinical");
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clinical lab processing records" });
    }
  });
  app2.get("/api/bioinfo-discovery", async (req, res) => {
    try {
      const lp = await storage.getLabProcessingQueue();
      const filtered = lp.filter((r) => (r.sample?.lead?.category || r.category || "").toLowerCase() === "discovery");
      const mapped = filtered.map((item) => ({
        id: item.id,
        sample_id: item.sampleId,
        sequencing_date: item.processedAt ? new Date(item.processedAt).toISOString() : null,
        analysis_status: item.qcStatus || "pending",
        total_mb_generated: item.totalMbGenerated || 0,
        result_report_link: item.reportLink || null,
        progenics_trf: item.progenicsTrf || null,
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
      res.status(500).json({ message: "Failed to fetch discovery bioinformatics records" });
    }
  });
  app2.get("/api/bioinfo-clinical", async (req, res) => {
    try {
      const lp = await storage.getLabProcessingQueue();
      const filtered = lp.filter((r) => (r.sample?.lead?.category || r.category || "").toLowerCase() === "clinical");
      const mapped = filtered.map((item) => ({
        id: item.id,
        sample_id: item.sampleId,
        sequencing_date: item.processedAt ? new Date(item.processedAt).toISOString() : null,
        analysis_status: item.qcStatus || "pending",
        total_mb_generated: item.totalMbGenerated || 0,
        result_report_link: item.reportLink || null,
        progenics_trf: item.progenicsTrf || null,
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
      res.status(500).json({ message: "Failed to fetch clinical bioinformatics records" });
    }
  });
  app2.get("/api/nutrition", async (req, res) => {
    try {
      const { uniqueId } = req.query;
      let query = "SELECT * FROM nutritional_management";
      let params = [];
      if (uniqueId) {
        query += " WHERE unique_id = ?";
        params.push(uniqueId);
      }
      const [rows] = await pool.execute(query, params);
      res.json(rows || []);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nutrition records" });
    }
  });
  app2.post("/api/nutrition", async (req, res) => {
    try {
      const data = req.body || {};
      const keys = Object.keys(data);
      const cols = keys.map((k) => `\`${k}\``).join(",");
      const placeholders = keys.map(() => "?").join(",");
      const values = keys.map((k) => data[k]);
      const [result] = await pool.execute(`INSERT INTO nutritional_management (${cols}) VALUES (${placeholders})`, values);
      const insertId = result.insertId || null;
      const [rows] = await pool.execute("SELECT * FROM nutritional_management WHERE id = ?", [insertId]);
      res.json(rows[0] ?? { id: insertId });
    } catch (error) {
      res.status(500).json({ message: "Failed to create nutrition record" });
    }
  });
  app2.put("/api/nutrition/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("[Nutrition PUT] ID:", id, "Body:", JSON.stringify(req.body, null, 2));
      const updates = normalizeDateFields(req.body);
      console.log("[Nutrition PUT] After normalizeDateFields:", JSON.stringify(updates, null, 2));
      const result = insertNutritionalManagementSchema.partial().safeParse(updates);
      if (!result.success) {
        console.error("[Nutrition PUT] Validation failed:", JSON.stringify(result.error.errors, null, 2));
        return res.status(400).json({ message: "Invalid nutrition data", errors: result.error.errors });
      }
      const validatedUpdates = result.data;
      console.log("[Nutrition PUT] Validated updates:", JSON.stringify(validatedUpdates, null, 2));
      const fieldMapping = {
        uniqueId: "unique_id",
        projectId: "project_id",
        sampleId: "sample_id",
        serviceName: "service_name",
        patientClientName: "patient_client_name",
        age: "age",
        gender: "gender",
        questionnaire: "questionnaire",
        progenicsTrf: "progenics_trf",
        questionnaireCallRecording: "questionnaire_call_recording",
        dataAnalysisSheet: "data_analysis_sheet",
        progenicsReport: "progenics_report",
        nutritionChart: "nutrition_chart",
        counsellingSessionDate: "counselling_session_date",
        furtherCounsellingRequired: "further_counselling_required",
        counsellingStatus: "counselling_status",
        counsellingSessionRecording: "counselling_session_recording",
        alertToTechnicalLead: "alert_to_technical_lead",
        alertToReportTeam: "alert_to_report_team",
        createdBy: "created_by",
        modifiedBy: "modified_by",
        modifiedAt: "modified_at",
        remarksComment: "remark_comment",
        remarkComment: "remark_comment"
      };
      const dbUpdates = {};
      Object.keys(validatedUpdates).forEach((k) => {
        const dbKey = fieldMapping[k] || k;
        dbUpdates[dbKey] = validatedUpdates[k];
      });
      const keys = Object.keys(dbUpdates);
      if (keys.length === 0) return res.status(400).json({ message: "No updates provided" });
      const set = keys.map((k) => `\`${k}\` = ?`).join(",");
      const values = keys.map((k) => dbUpdates[k]);
      values.push(id);
      console.log("[Nutrition PUT] SQL:", `UPDATE nutritional_management SET ${set} WHERE id = ?`);
      console.log("[Nutrition PUT] Values:", values);
      await pool.execute(`UPDATE nutritional_management SET ${set} WHERE id = ?`, values);
      const [rows] = await pool.execute("SELECT * FROM nutritional_management WHERE id = ?", [id]);
      console.log("[Nutrition PUT] Success! Updated record:", rows[0]?.id);
      res.json(rows[0] ?? null);
    } catch (error) {
      console.error("[Nutrition PUT] Error:", error.message);
      console.error("[Nutrition PUT] Stack:", error.stack);
      res.status(500).json({ message: "Failed to update nutrition record", error: error.message });
    }
  });
  app2.delete("/api/nutrition/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute("DELETE FROM nutritional_management WHERE id = ?", [id]);
      res.json({ id });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete nutrition record" });
    }
  });
  app2.get("/api/labprocess-discovery-sheet", async (_req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM labprocess_discovery_sheet ORDER BY created_at DESC");
      res.json(rows || []);
    } catch (error) {
      console.error("Failed to fetch lab process discovery sheet", error.message);
      res.status(500).json({ message: "Failed to fetch lab process discovery sheet" });
    }
  });
  app2.post("/api/labprocess-discovery-sheet", async (req, res) => {
    try {
      const data = req.body || {};
      const fieldMapping = {
        titleUniqueId: "unique_id",
        projectId: "project_id",
        sampleId: "sample_id",
        clientId: "client_id",
        serviceName: "service_name",
        sampleType: "sample_type",
        numberOfSamples: "no_of_samples",
        sampleDeliveryDate: "sample_received_date",
        extractionProtocol: "extraction_protocol",
        extractionQualityCheck: "extraction_quality_check",
        extractionQCStatus: "extraction_qc_status",
        extractionProcess: "extraction_process",
        libraryPreparationProtocol: "library_preparation_protocol",
        libraryPreparationQualityCheck: "library_preparation_quality_check",
        libraryQCStatus: "library_preparation_qc_status",
        libraryProcess: "library_preparation_process",
        purificationProtocol: "purification_protocol",
        purificationQualityCheck: "purification_quality_check",
        purificationQCStatus: "purification_qc_status",
        purificationProcess: "purification_process",
        alertToBioinformaticsTeam: "alert_to_bioinformatics_team",
        alertToTechnicalLead: "alert_to_technical_lead",
        progenicsTrf: "progenics_trf",
        createdBy: "created_by",
        remarksComment: "remark_comment"
      };
      const mappedData = {};
      Object.keys(data).forEach((k) => {
        const dbKey = fieldMapping[k] || k;
        mappedData[dbKey] = data[k];
      });
      const keys = Object.keys(mappedData);
      const cols = keys.map((k) => `\`${k}\``).join(",");
      const placeholders = keys.map(() => "?").join(",");
      const values = keys.map((k) => mappedData[k]);
      console.log("[Lab Process Discovery POST] Creating record with columns:", keys);
      const [result] = await pool.execute(
        `INSERT INTO labprocess_discovery_sheet (${cols}) VALUES (${placeholders})`,
        values
      );
      const insertId = result.insertId || null;
      console.log("[Lab Process Discovery POST] Inserted with ID:", insertId);
      if (insertId) {
        const [rows] = await pool.execute("SELECT * FROM labprocess_discovery_sheet WHERE id = ?", [insertId]);
        return res.json(rows[0] ?? { id: insertId });
      }
      res.json({ id: insertId });
    } catch (error) {
      console.error("[Lab Process Discovery POST] Error:", error.message);
      res.status(500).json({ message: "Failed to create lab process discovery record", error: error.message });
    }
  });
  app2.put("/api/labprocess-discovery-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("[Lab Process Discovery PUT] Request body:", JSON.stringify(req.body, null, 2));
      const updates = normalizeDateFields(req.body);
      if (updates.alertToBioinformaticsTeam !== void 0) {
        updates.alertToBioinformaticsTeam = updates.alertToBioinformaticsTeam === 1 || updates.alertToBioinformaticsTeam === true;
      }
      if (updates.alertToTechnicalLead !== void 0) {
        updates.alertToTechnicalLead = updates.alertToTechnicalLead === 1 || updates.alertToTechnicalLead === true;
      }
      console.log("[Lab Process Discovery PUT] Normalized updates:", JSON.stringify(updates, null, 2));
      const result = insertLabProcessDiscoverySheetSchema.partial().safeParse(updates);
      if (!result.success) {
        console.error("[Lab Process Discovery PUT] Validation failed:", result.error.errors);
        return res.status(400).json({ message: "Invalid lab process data", errors: result.error.errors });
      }
      const validatedUpdates = result.data;
      console.log("[Lab Process Discovery PUT] Validated updates:", JSON.stringify(validatedUpdates, null, 2));
      const fieldMapping = {
        titleUniqueId: "unique_id",
        projectId: "project_id",
        sampleId: "sample_id",
        clientId: "client_id",
        serviceName: "service_name",
        sampleType: "sample_type",
        numberOfSamples: "no_of_samples",
        sampleDeliveryDate: "sample_received_date",
        extractionProtocol: "extraction_protocol",
        extractionQualityCheck: "extraction_quality_check",
        extractionQCStatus: "extraction_qc_status",
        extractionProcess: "extraction_process",
        libraryPreparationProtocol: "library_preparation_protocol",
        libraryPreparationQualityCheck: "library_preparation_quality_check",
        libraryQCStatus: "library_preparation_qc_status",
        libraryProcess: "library_preparation_process",
        purificationProtocol: "purification_protocol",
        purificationQualityCheck: "purification_quality_check",
        purificationQCStatus: "purification_qc_status",
        purificationProcess: "purification_process",
        alertToBioinformaticsTeam: "alert_to_bioinformatics_team",
        alertToTechnicalLead: "alert_to_technical_lead",
        progenicsTrf: "progenics_trf",
        createdAt: "created_at",
        createdBy: "created_by",
        modifiedAt: "modified_at",
        modifiedBy: "modified_by",
        remarksComment: "remark_comment"
      };
      const dbUpdates = {};
      Object.keys(validatedUpdates).forEach((k) => {
        const dbKey = fieldMapping[k] || k;
        let value = validatedUpdates[k];
        if (typeof value === "boolean") {
          value = value ? 1 : 0;
        }
        dbUpdates[dbKey] = value;
      });
      const keys = Object.keys(dbUpdates);
      if (keys.length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }
      const set = keys.map((k) => `\`${k}\` = ?`).join(",");
      const values = keys.map((k) => dbUpdates[k]);
      values.push(id);
      console.log("[Lab Process Discovery PUT] SQL Query:", `UPDATE labprocess_discovery_sheet SET ${set} WHERE id = ?`);
      console.log("[Lab Process Discovery PUT] Query values:", values);
      const result_query = await pool.execute(
        `UPDATE labprocess_discovery_sheet SET ${set} WHERE id = ?`,
        values
      );
      console.log("[Lab Process Discovery PUT] Update succeeded, fetching updated record");
      const [rows] = await pool.execute("SELECT * FROM labprocess_discovery_sheet WHERE id = ?", [id]);
      const updatedRecord = rows[0] ?? null;
      console.log("[Lab Process Discovery PUT] Success! Updated record:", JSON.stringify(updatedRecord, null, 2));
      res.json(updatedRecord);
    } catch (error) {
      console.error("[Lab Process Discovery PUT] Error:", error.message, error.stack);
      res.status(500).json({ message: "Failed to update lab process discovery record" });
    }
  });
  app2.delete("/api/labprocess-discovery-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute("DELETE FROM labprocess_discovery_sheet WHERE id = ?", [id]);
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete lab process discovery record", error.message);
      res.status(500).json({ message: "Failed to delete lab process discovery record" });
    }
  });
  app2.get("/api/labprocess-clinical-sheet", async (_req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM labprocess_clinical_sheet ORDER BY created_at DESC");
      res.json(rows || []);
    } catch (error) {
      console.error("Failed to fetch lab process clinical sheet", error.message);
      res.status(500).json({ message: "Failed to fetch lab process clinical sheet" });
    }
  });
  app2.post("/api/labprocess-clinical-sheet", async (req, res) => {
    try {
      const data = req.body || {};
      const fieldMapping = {
        titleUniqueId: "unique_id",
        projectId: "project_id",
        sampleId: "sample_id",
        clientId: "client_id",
        serviceName: "service_name",
        sampleType: "sample_type",
        numberOfSamples: "no_of_samples",
        sampleDeliveryDate: "sample_received_date",
        extractionProtocol: "extraction_protocol",
        extractionQualityCheck: "extraction_quality_check",
        extractionQCStatus: "extraction_qc_status",
        extractionProcess: "extraction_process",
        libraryPreparationProtocol: "library_preparation_protocol",
        libraryPreparationQualityCheck: "library_preparation_quality_check",
        libraryQCStatus: "library_preparation_qc_status",
        libraryProcess: "library_preparation_process",
        purificationProtocol: "purification_protocol",
        purificationQualityCheck: "purification_quality_check",
        purificationQCStatus: "purification_qc_status",
        purificationProcess: "purification_process",
        alertToBioinformaticsTeam: "alert_to_bioinformatics_team",
        alertToTechnicalLead: "alert_to_technical_lead",
        progenicsTrf: "progenics_trf",
        createdBy: "created_by",
        remarksComment: "remark_comment"
      };
      const mappedData = {};
      Object.keys(data).forEach((k) => {
        const dbKey = fieldMapping[k] || k;
        mappedData[dbKey] = data[k];
      });
      const keys = Object.keys(mappedData);
      const cols = keys.map((k) => `\`${k}\``).join(",");
      const placeholders = keys.map(() => "?").join(",");
      const values = keys.map((k) => mappedData[k]);
      console.log("[Lab Process Clinical POST] Creating record with columns:", keys);
      const [result] = await pool.execute(
        `INSERT INTO labprocess_clinical_sheet (${cols}) VALUES (${placeholders})`,
        values
      );
      const insertId = result.insertId || null;
      console.log("[Lab Process Clinical POST] Inserted with ID:", insertId);
      if (insertId) {
        const [rows] = await pool.execute("SELECT * FROM labprocess_clinical_sheet WHERE id = ?", [insertId]);
        return res.json(rows[0] ?? { id: insertId });
      }
      res.json({ id: insertId });
    } catch (error) {
      console.error("[Lab Process Clinical POST] Error:", error.message);
      res.status(500).json({ message: "Failed to create lab process clinical record", error: error.message });
    }
  });
  app2.put("/api/labprocess-clinical-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("[Lab Process Clinical PUT] Request body:", JSON.stringify(req.body, null, 2));
      const updates = normalizeDateFields(req.body);
      if (updates.alertToBioinformaticsTeam !== void 0) {
        updates.alertToBioinformaticsTeam = updates.alertToBioinformaticsTeam === 1 || updates.alertToBioinformaticsTeam === true;
      }
      if (updates.alertToTechnicalLead !== void 0) {
        updates.alertToTechnicalLead = updates.alertToTechnicalLead === 1 || updates.alertToTechnicalLead === true;
      }
      console.log("[Lab Process Clinical PUT] Normalized updates:", JSON.stringify(updates, null, 2));
      const result = insertLabProcessClinicalSheetSchema.partial().safeParse(updates);
      if (!result.success) {
        console.error("[Lab Process Clinical PUT] Validation failed:", result.error.errors);
        return res.status(400).json({ message: "Invalid lab process data", errors: result.error.errors });
      }
      const validatedUpdates = result.data;
      console.log("[Lab Process Clinical PUT] Validated updates:", JSON.stringify(validatedUpdates, null, 2));
      const fieldMapping = {
        titleUniqueId: "unique_id",
        projectId: "project_id",
        sampleId: "sample_id",
        clientId: "client_id",
        serviceName: "service_name",
        sampleType: "sample_type",
        numberOfSamples: "no_of_samples",
        sampleDeliveryDate: "sample_received_date",
        extractionProtocol: "extraction_protocol",
        extractionQualityCheck: "extraction_quality_check",
        extractionQCStatus: "extraction_qc_status",
        extractionProcess: "extraction_process",
        libraryPreparationProtocol: "library_preparation_protocol",
        libraryPreparationQualityCheck: "library_preparation_quality_check",
        libraryQCStatus: "library_preparation_qc_status",
        libraryProcess: "library_preparation_process",
        purificationProtocol: "purification_protocol",
        purificationQualityCheck: "purification_quality_check",
        purificationQCStatus: "purification_qc_status",
        purificationProcess: "purification_process",
        alertToBioinformaticsTeam: "alert_to_bioinformatics_team",
        alertToTechnicalLead: "alert_to_technical_lead",
        progenicsTrf: "progenics_trf",
        createdAt: "created_at",
        createdBy: "created_by",
        modifiedAt: "modified_at",
        modifiedBy: "modified_by",
        remarksComment: "remark_comment"
      };
      const dbUpdates = {};
      Object.keys(validatedUpdates).forEach((k) => {
        const dbKey = fieldMapping[k] || k;
        let value = validatedUpdates[k];
        if (typeof value === "boolean") {
          value = value ? 1 : 0;
        }
        dbUpdates[dbKey] = value;
      });
      const keys = Object.keys(dbUpdates);
      if (keys.length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }
      const set = keys.map((k) => `\`${k}\` = ?`).join(",");
      const values = keys.map((k) => dbUpdates[k]);
      values.push(id);
      console.log("[Lab Process Clinical PUT] SQL Query:", `UPDATE labprocess_clinical_sheet SET ${set} WHERE id = ?`);
      console.log("[Lab Process Clinical PUT] Query values:", values);
      const result_query = await pool.execute(
        `UPDATE labprocess_clinical_sheet SET ${set} WHERE id = ?`,
        values
      );
      console.log("[Lab Process Clinical PUT] Update succeeded, fetching updated record");
      const [rows] = await pool.execute("SELECT * FROM labprocess_clinical_sheet WHERE id = ?", [id]);
      const updatedRecord = rows[0] ?? null;
      console.log("[Lab Process Clinical PUT] Success! Updated record:", JSON.stringify(updatedRecord, null, 2));
      res.json(updatedRecord);
    } catch (error) {
      console.error("[Lab Process Clinical PUT] Error:", error.message, error.stack);
      res.status(500).json({ message: "Failed to update lab process clinical record" });
    }
  });
  app2.delete("/api/labprocess-clinical-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute("DELETE FROM labprocess_clinical_sheet WHERE id = ?", [id]);
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete lab process clinical record", error.message);
      res.status(500).json({ message: "Failed to delete lab process clinical record" });
    }
  });
  app2.get("/api/bioinfo-discovery-sheet", async (_req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM bioinformatics_sheet_discovery ORDER BY created_at DESC");
      res.json(rows || []);
    } catch (error) {
      console.error("Failed to fetch bioinformatics discovery sheet", error.message);
      res.status(500).json({ message: "Failed to fetch bioinformatics discovery sheet" });
    }
  });
  app2.post("/api/bioinfo-discovery-sheet", async (req, res) => {
    try {
      const data = req.body || {};
      const keys = Object.keys(data);
      const cols = keys.map((k) => `\`${k}\``).join(",");
      const placeholders = keys.map(() => "?").join(",");
      const values = keys.map((k) => data[k]);
      const insertQuery = `
        INSERT IGNORE INTO bioinformatics_sheet_discovery (${cols}) 
        VALUES (${placeholders})
      `;
      console.log("Inserting bioinformatics_sheet_discovery record with columns:", keys);
      const [result] = await pool.execute(insertQuery, values);
      const recordId = result.insertId || data.id;
      console.log("Inserted bioinformatics_sheet_discovery with ID:", recordId);
      if (data.sample_id) {
        const [rows] = await pool.execute("SELECT * FROM bioinformatics_sheet_discovery WHERE sample_id = ? ORDER BY id DESC LIMIT 1", [data.sample_id]);
        return res.json(rows[0] ?? { id: recordId });
      }
      if (data.unique_id) {
        const [rows] = await pool.execute("SELECT * FROM bioinformatics_sheet_discovery WHERE unique_id = ? ORDER BY id DESC LIMIT 1", [data.unique_id]);
        return res.json(rows[0] ?? { id: recordId });
      }
      res.json({ id: recordId });
    } catch (error) {
      console.error("Failed to create bioinformatics discovery record", error.message);
      res.status(500).json({ message: "Failed to create bioinformatics discovery record", error: error.message });
    }
  });
  app2.put("/api/bioinfo-discovery-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const keys = Object.keys(updates);
      if (keys.length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }
      const set = keys.map((k) => `\`${k}\` = ?`).join(",");
      const values = keys.map((k) => updates[k]);
      values.push(id);
      await pool.execute(
        `UPDATE bioinformatics_sheet_discovery SET ${set} WHERE id = ?`,
        values
      );
      const [rows] = await pool.execute("SELECT * FROM bioinformatics_sheet_discovery WHERE id = ?", [id]);
      res.json(rows[0] ?? null);
    } catch (error) {
      console.error("Failed to update bioinformatics discovery record", error.message);
      res.status(500).json({ message: "Failed to update bioinformatics discovery record" });
    }
  });
  app2.delete("/api/bioinfo-discovery-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute("DELETE FROM bioinformatics_sheet_discovery WHERE id = ?", [id]);
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete bioinformatics discovery record", error.message);
      res.status(500).json({ message: "Failed to delete bioinformatics discovery record" });
    }
  });
  app2.get("/api/bioinfo-clinical-sheet", async (_req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM bioinformatics_sheet_clinical ORDER BY created_at DESC");
      res.json(rows || []);
    } catch (error) {
      console.error("Failed to fetch bioinformatics clinical sheet", error.message);
      res.status(500).json({ message: "Failed to fetch bioinformatics clinical sheet" });
    }
  });
  app2.post("/api/bioinfo-clinical-sheet", async (req, res) => {
    try {
      const data = req.body || {};
      const keys = Object.keys(data);
      const cols = keys.map((k) => `\`${k}\``).join(",");
      const placeholders = keys.map(() => "?").join(",");
      const values = keys.map((k) => data[k]);
      const insertQuery = `
        INSERT IGNORE INTO bioinformatics_sheet_clinical (${cols}) 
        VALUES (${placeholders})
      `;
      console.log("Inserting bioinformatics_sheet_clinical record with columns:", keys);
      const [result] = await pool.execute(insertQuery, values);
      const recordId = result.insertId || data.id;
      console.log("Inserted bioinformatics_sheet_clinical with ID:", recordId);
      if (data.sample_id) {
        const [rows] = await pool.execute("SELECT * FROM bioinformatics_sheet_clinical WHERE sample_id = ? ORDER BY id DESC LIMIT 1", [data.sample_id]);
        return res.json(rows[0] ?? { id: recordId });
      }
      if (data.unique_id) {
        const [rows] = await pool.execute("SELECT * FROM bioinformatics_sheet_clinical WHERE unique_id = ? ORDER BY id DESC LIMIT 1", [data.unique_id]);
        return res.json(rows[0] ?? { id: recordId });
      }
      res.json({ id: recordId });
    } catch (error) {
      console.error("Failed to create bioinformatics clinical record", error.message);
      res.status(500).json({ message: "Failed to create bioinformatics clinical record", error: error.message });
    }
  });
  app2.put("/api/bioinfo-clinical-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const keys = Object.keys(updates);
      if (keys.length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }
      const set = keys.map((k) => `\`${k}\` = ?`).join(",");
      const values = keys.map((k) => updates[k]);
      values.push(id);
      await pool.execute(
        `UPDATE bioinformatics_sheet_clinical SET ${set} WHERE id = ?`,
        values
      );
      const [rows] = await pool.execute("SELECT * FROM bioinformatics_sheet_clinical WHERE id = ?", [id]);
      res.json(rows[0] ?? null);
    } catch (error) {
      console.error("Failed to update bioinformatics clinical record", error.message);
      res.status(500).json({ message: "Failed to update bioinformatics clinical record" });
    }
  });
  app2.delete("/api/bioinfo-clinical-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute("DELETE FROM bioinformatics_sheet_clinical WHERE id = ?", [id]);
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete bioinformatics clinical record", error.message);
      res.status(500).json({ message: "Failed to delete bioinformatics clinical record" });
    }
  });
  app2.post("/api/alert-lab-process", async (req, res) => {
    try {
      const { sampleId, projectId, uniqueId, sampleType, clientId, serviceName, sampleDeliveryDate, createdBy } = req.body;
      console.log("Alert Lab Process triggered for sample:", sampleId, "Project ID:", projectId);
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }
      const isDiscovery = projectId.startsWith("DG");
      const isClinical = projectId.startsWith("PG");
      console.log("Project ID analysis - Discovery:", isDiscovery, "Clinical:", isClinical);
      if (!isDiscovery && !isClinical) {
        return res.status(400).json({ message: "Project ID must start with DG (Discovery) or PG (Clinical)" });
      }
      let leadData = { service_name: serviceName, sample_type: sampleType };
      try {
        const [leadRows] = await pool.execute(
          "SELECT service_name, sample_type, no_of_samples FROM lead_management WHERE unique_id = ? LIMIT 1",
          [uniqueId]
        );
        if (leadRows && leadRows.length > 0) {
          const lead = leadRows[0];
          leadData.service_name = serviceName || lead.service_name || null;
          leadData.sample_type = sampleType || lead.sample_type || null;
          leadData.no_of_samples = lead.no_of_samples || null;
          console.log("Fetched lead data from lead_management table:", leadData);
        }
      } catch (leadError) {
        console.log("Note: Could not fetch lead data -", leadError.message);
      }
      const numberOfSamples = leadData.no_of_samples ? parseInt(String(leadData.no_of_samples), 10) : 1;
      console.log(`Creating ${numberOfSamples} sample record(s) in lab process sheet...`);
      const baseLabProcessData = {
        unique_id: uniqueId || "",
        project_id: projectId
      };
      if (clientId) baseLabProcessData.client_id = clientId;
      if (leadData.service_name) baseLabProcessData.service_name = leadData.service_name;
      if (leadData.sample_type) baseLabProcessData.sample_type = leadData.sample_type;
      if (leadData.no_of_samples) baseLabProcessData.no_of_samples = leadData.no_of_samples;
      if (sampleDeliveryDate) {
        const dateObj = new Date(sampleDeliveryDate);
        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getUTCDate()).padStart(2, "0");
        baseLabProcessData.sample_received_date = `${year}-${month}-${day}`;
      }
      baseLabProcessData.created_by = createdBy || "system";
      baseLabProcessData.created_at = /* @__PURE__ */ new Date();
      let tableName = isDiscovery ? "labprocess_discovery_sheet" : "labprocess_clinical_sheet";
      const insertedIds = [];
      for (let sampleNum = 1; sampleNum <= numberOfSamples; sampleNum++) {
        const baseSampleId = sampleId || uniqueId || "";
        let recordSampleId = baseSampleId;
        if (numberOfSamples > 1) {
          recordSampleId = `${baseSampleId}_${sampleNum}`;
        }
        const labProcessData = {
          ...baseLabProcessData,
          sample_id: recordSampleId
        };
        const keys = Object.keys(labProcessData);
        const cols = keys.map((k) => `\`${k}\``).join(",");
        const placeholders = keys.map(() => "?").join(",");
        const values = keys.map((k) => labProcessData[k]);
        try {
          let insertResult;
          if (isDiscovery) {
            console.log(`Inserting sample ${sampleNum}/${numberOfSamples} into ${tableName} for discovery project:`, projectId);
            const result = await pool.execute(
              `INSERT INTO labprocess_discovery_sheet (${cols}) VALUES (${placeholders})`,
              values
            );
            insertResult = result[0];
          } else {
            console.log(`Inserting sample ${sampleNum}/${numberOfSamples} into ${tableName} for clinical project:`, projectId);
            const result = await pool.execute(
              `INSERT INTO labprocess_clinical_sheet (${cols}) VALUES (${placeholders})`,
              values
            );
            insertResult = result[0];
          }
          const insertId = insertResult.insertId || null;
          insertedIds.push(insertId);
          console.log(`Inserted sample ${sampleNum}/${numberOfSamples} into ${tableName} with ID:`, insertId);
        } catch (insertError) {
          console.error(`Failed to insert sample ${sampleNum}/${numberOfSamples}:`, insertError.message);
          throw insertError;
        }
      }
      try {
        await pool.execute(
          "UPDATE sample_tracking SET alert_to_labprocess_team = ?, updated_at = ? WHERE id = ?",
          [true, /* @__PURE__ */ new Date(), sampleId]
        );
        console.log("Updated sample_tracking flag for sample:", sampleId);
      } catch (updateError) {
        console.error("Warning: Failed to update sample_tracking flag", updateError.message);
      }
      res.json({
        success: true,
        recordIds: insertedIds,
        numberOfRecordsCreated: insertedIds.length,
        table: tableName,
        message: `${insertedIds.length} lab process record(s) created in ${tableName}`
      });
    } catch (error) {
      console.error("Failed to alert lab process", error.message);
      res.status(500).json({ message: "Failed to alert lab process", error: error.message });
    }
  });
  app2.get("/api/process-master", async (req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM process_master_sheet");
      res.json(rows || []);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch process master records" });
    }
  });
  app2.post("/api/process-master", async (req, res) => {
    try {
      const data = req.body || {};
      const keys = Object.keys(data);
      const cols = keys.map((k) => `\`${k}\``).join(",");
      const placeholders = keys.map(() => "?").join(",");
      const values = keys.map((k) => data[k]);
      const [result] = await pool.execute(`INSERT INTO process_master_sheet (${cols}) VALUES (${placeholders})`, values);
      const insertId = result.insertId || null;
      const [rows] = await pool.execute("SELECT * FROM process_master_sheet WHERE id = ?", [insertId]);
      res.json(rows[0] ?? { id: insertId });
    } catch (error) {
      res.status(500).json({ message: "Failed to create process master record" });
    }
  });
  app2.put("/api/process-master/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const keys = Object.keys(updates);
      if (keys.length === 0) return res.status(400).json({ message: "No updates provided" });
      const set = keys.map((k) => `\`${k}\` = ?`).join(",");
      const values = keys.map((k) => updates[k]);
      values.push(id);
      await pool.execute(`UPDATE process_master_sheet SET ${set}, modified_at = NOW() WHERE id = ?`, values);
      const [rows] = await pool.execute("SELECT * FROM process_master_sheet WHERE id = ?", [id]);
      const result = rows[0] ?? null;
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to update process master record" });
    }
  });
  app2.delete("/api/process-master/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute("DELETE FROM process_master_sheet WHERE id = ?", [id]);
      res.json({ id });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete process master record" });
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
            const uid = await generateRoleId(String(roleForId));
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
        const [rows] = await pool.execute("SELECT * FROM labprocess_discovery_sheet");
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
        const [rows] = await pool.execute("SELECT * FROM labprocess_clinical_sheet");
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
      const [rows] = await pool.execute("SELECT * FROM finance_sheet ORDER BY created_at DESC");
      res.json(rows || []);
    } catch (error) {
      console.error("Failed to fetch finance sheet", error.message);
      res.status(500).json({ message: "Failed to fetch finance sheet" });
    }
  });
  app2.post("/api/finance-sheet", async (req, res) => {
    try {
      const data = req.body || {};
      const keys = Object.keys(data);
      const cols = keys.map((k) => `\`${k}\``).join(",");
      const placeholders = keys.map(() => "?").join(",");
      const values = keys.map((k) => data[k]);
      console.log("Creating finance_sheet record with columns:", keys);
      const [result] = await pool.execute(
        `INSERT INTO finance_sheet (${cols}) VALUES (${placeholders})`,
        values
      );
      const insertId = result.insertId || null;
      console.log("Inserted finance_sheet with ID:", insertId);
      if (insertId) {
        const [rows] = await pool.execute("SELECT * FROM finance_sheet WHERE id = ?", [insertId]);
        return res.json(rows[0] ?? { id: insertId });
      }
      res.json({ id: insertId });
    } catch (error) {
      console.error("Failed to create finance record", error.message);
      res.status(500).json({ message: "Failed to create finance record", error: error.message });
    }
  });
  app2.put("/api/finance-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const normalizeDateStrings = (obj) => {
        if (!obj || typeof obj !== "object") return obj;
        const copy = { ...obj };
        const dateKeys = ["sampleCollectionDate", "invoiceDate", "paymentReceiptDate", "balanceAmountReceivedDate", "thirdPartyPaymentDate"];
        const datetimeKeys = ["createdAt", "modifiedAt"];
        const pad = (n) => String(n).padStart(2, "0");
        for (const k of dateKeys) {
          if (copy[k] && typeof copy[k] === "string") {
            const d = new Date(copy[k]);
            if (!isNaN(d.getTime())) {
              copy[k] = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            }
          }
        }
        for (const k of datetimeKeys) {
          if (copy[k] && typeof copy[k] === "string") {
            const d = new Date(copy[k]);
            if (!isNaN(d.getTime())) {
              copy[k] = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            }
          }
        }
        return copy;
      };
      const normalizedInput = normalizeDateStrings(updates);
      if (Object.keys(normalizedInput).length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }
      const snakeCaseUpdates = {};
      Object.keys(normalizedInput).forEach((k) => {
        const snakeKey = k.replace(/([A-Z])/g, "_$1").toLowerCase();
        snakeCaseUpdates[snakeKey] = normalizedInput[k];
      });
      const keys = Object.keys(snakeCaseUpdates);
      const set = keys.map((k) => `\`${k}\` = ?`).join(",");
      const values = keys.map((k) => snakeCaseUpdates[k]);
      values.push(id);
      console.log("Updating finance_sheet ID:", id, "with fields:", keys);
      await pool.execute(
        `UPDATE finance_sheet SET ${set} WHERE id = ?`,
        values
      );
      const [rows] = await pool.execute("SELECT * FROM finance_sheet WHERE id = ?", [id]);
      const result = rows[0] ?? null;
      console.log("Updated finance_sheet ID:", id);
      res.json(result);
    } catch (error) {
      console.error("Failed to update finance record", error.message);
      res.status(500).json({ message: "Failed to update finance record", error: error.message });
    }
  });
  app2.delete("/api/finance-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Deleting finance_sheet ID:", id);
      await pool.execute("DELETE FROM finance_sheet WHERE id = ?", [id]);
      res.json({ id });
    } catch (error) {
      console.error("Failed to delete finance record", error.message);
      res.status(500).json({ message: "Failed to delete finance record", error: error.message });
    }
  });
  app2.post("/api/finance-sheet/:id/upload-screenshot", uploadFinance.single("file"), async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const storagePath = `/uploads/finance/${file.filename}`;
      const filename = file.originalname || file.filename;
      const mimeType = file.mimetype || null;
      const sizeBytes = file.size || null;
      const uploadedBy = req.headers["x-user-id"] || req.body && req.body.uploaded_by || null;
      const [result] = await pool.execute(
        `INSERT INTO finance_sheet_attachments (finance_id, filename, storage_path, mime_type, size_bytes, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, filename, storagePath, mimeType, sizeBytes, uploadedBy, /* @__PURE__ */ new Date()]
      );
      const insertId = result.insertId || null;
      try {
        await pool.execute('UPDATE finance_sheet SET screenshot_document = ? WHERE id = ? AND (screenshot_document IS NULL OR screenshot_document = "")', [storagePath, id]);
      } catch (e) {
        console.warn("Failed to update finance_sheet.screenshot_document", e.message);
      }
      const [rows] = await pool.execute("SELECT * FROM finance_sheet_attachments WHERE id = ?", [insertId]);
      const attachment = rows[0] ?? { id: insertId, filename, storage_path: storagePath };
      res.json({ attachment, url: storagePath });
    } catch (error) {
      console.error("Finance screenshot upload failed:", error.message);
      res.status(500).json({ message: "Failed to upload screenshot", error: error.message });
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
  app2.get("/api/genetic-counselling-sheet", async (_req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM genetic_counselling_records ORDER BY created_at DESC");
      console.log("Fetched genetic_counselling_records:", Array.isArray(rows) ? rows.length : 0, "records");
      res.json(rows || []);
    } catch (error) {
      console.error("Failed to fetch genetic counselling sheet", error.message);
      res.status(500).json({ message: "Failed to fetch genetic counselling sheet" });
    }
  });
  app2.post("/api/genetic-counselling-sheet", async (req, res) => {
    try {
      const data = req.body || {};
      console.log("[GC POST] Request body:", JSON.stringify(data, null, 2));
      if (data.approval_from_head !== void 0) {
        data.approval_from_head = data.approval_from_head === 1 || data.approval_from_head === true;
      }
      if (data.potential_patient_for_testing_in_future !== void 0) {
        data.potential_patient_for_testing_in_future = data.potential_patient_for_testing_in_future === 1 || data.potential_patient_for_testing_in_future === true;
      }
      if (data.extended_family_testing_requirement !== void 0) {
        data.extended_family_testing_requirement = data.extended_family_testing_requirement === 1 || data.extended_family_testing_requirement === true;
      }
      if (!data.created_at) {
        data.created_at = /* @__PURE__ */ new Date();
      }
      const keys = Object.keys(data).filter((k) => k && data[k] !== void 0);
      if (keys.length === 0) {
        return res.status(400).json({ message: "No data provided" });
      }
      const processedData = {};
      keys.forEach((k) => {
        let value = data[k];
        if (typeof value === "boolean") {
          value = value ? 1 : 0;
        }
        processedData[k] = value;
      });
      const processedKeys = Object.keys(processedData);
      const cols = processedKeys.map((k) => `\`${k}\``).join(",");
      const placeholders = processedKeys.map(() => "?").join(",");
      const values = processedKeys.map((k) => processedData[k]);
      console.log("[GC POST] Inserting with columns:", processedKeys);
      console.log("[GC POST] SQL:", `INSERT INTO genetic_counselling_records (${cols}) VALUES (${placeholders})`);
      console.log("[GC POST] Values:", values);
      const [result] = await pool.execute(
        `INSERT INTO genetic_counselling_records (${cols}) VALUES (${placeholders})`,
        values
      );
      const insertId = result.insertId || null;
      console.log("[GC POST] Insert succeeded with ID:", insertId);
      if (insertId) {
        const [rows] = await pool.execute("SELECT * FROM genetic_counselling_records WHERE id = ?", [insertId]);
        const createdRecord = rows[0] ?? { id: insertId };
        console.log("[GC POST] Success! Created record:", JSON.stringify(createdRecord, null, 2));
        return res.json(createdRecord);
      }
      res.json({ id: insertId });
    } catch (error) {
      console.error("[GC POST] Error:", error.message, error.stack);
      res.status(500).json({ message: "Failed to create genetic counselling record", error: error.message });
    }
  });
  app2.put("/api/genetic-counselling-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      console.log("[GC PUT] Request ID:", id);
      console.log("[GC PUT] Request body:", JSON.stringify(updates, null, 2));
      delete updates.id;
      if (updates.approval_from_head !== void 0) {
        updates.approval_from_head = updates.approval_from_head === 1 || updates.approval_from_head === true;
      }
      if (updates.potential_patient_for_testing_in_future !== void 0) {
        updates.potential_patient_for_testing_in_future = updates.potential_patient_for_testing_in_future === 1 || updates.potential_patient_for_testing_in_future === true;
      }
      if (updates.extended_family_testing_requirement !== void 0) {
        updates.extended_family_testing_requirement = updates.extended_family_testing_requirement === 1 || updates.extended_family_testing_requirement === true;
      }
      updates.modified_at = /* @__PURE__ */ new Date();
      const keys = Object.keys(updates).filter((k) => updates[k] !== void 0);
      if (keys.length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }
      const processedUpdates = {};
      keys.forEach((k) => {
        let value = updates[k];
        if (typeof value === "boolean") {
          value = value ? 1 : 0;
        }
        processedUpdates[k] = value;
      });
      const decimalFieldPairs = [
        ["budget_for_test_opted", "budgetForTestOpted"],
        ["budget", "budget"]
      ];
      for (const [snake, camel] of decimalFieldPairs) {
        if (Object.prototype.hasOwnProperty.call(processedUpdates, snake) || Object.prototype.hasOwnProperty.call(processedUpdates, camel)) {
          const key = Object.prototype.hasOwnProperty.call(processedUpdates, snake) ? snake : camel;
          const v = processedUpdates[key];
          if (v === "" || v === null || v === void 0) {
            processedUpdates[key] = null;
          } else {
            const n = Number(v);
            processedUpdates[key] = Number.isNaN(n) ? null : n;
          }
        }
      }
      console.log("[GC PUT] Incoming updates (after preliminary processing):", updates);
      console.log("[GC PUT] Processed updates (after coercion):", processedUpdates);
      const processedKeys = Object.keys(processedUpdates);
      const set = processedKeys.map((k) => `\`${k}\` = ?`).join(",");
      const values = processedKeys.map((k) => processedUpdates[k]);
      values.push(id);
      console.log("[GC PUT] SQL Query:", `UPDATE genetic_counselling_records SET ${set} WHERE id = ?`);
      console.log("[GC PUT] Values:", values);
      const result = await pool.execute(
        `UPDATE genetic_counselling_records SET ${set} WHERE id = ?`,
        values
      );
      const [rows] = await pool.execute("SELECT * FROM genetic_counselling_records WHERE id = ?", [id]);
      const updatedRecord = rows[0] ?? null;
      console.log("[GC PUT] Success! Updated record:", JSON.stringify(updatedRecord, null, 2));
      res.json(updatedRecord);
    } catch (error) {
      console.error("[GC PUT] Error:", error.message, error.stack);
      res.status(500).json({ message: "Failed to update genetic counselling record", error: error.message });
    }
  });
  app2.delete("/api/genetic-counselling-sheet/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log("[GC DELETE] Deleting record ID:", id);
      const [checkRows] = await pool.execute("SELECT id FROM genetic_counselling_records WHERE id = ?", [id]);
      if (checkRows.length === 0) {
        console.log("[GC DELETE] Record not found, ID:", id);
        return res.status(404).json({ message: "Record not found" });
      }
      const result = await pool.execute("DELETE FROM genetic_counselling_records WHERE id = ?", [id]);
      console.log("[GC DELETE] Delete result:", result);
      console.log("[GC DELETE] Successfully deleted record ID:", id);
      res.json({ id });
    } catch (error) {
      console.error("[GC DELETE] Error:", error.message, error.stack);
      res.status(500).json({ message: "Failed to delete genetic counselling record", error: error.message });
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
      const created = await storage.createGeneticCounselling(body);
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
      const updated = await storage.updateGeneticCounselling(id, updates);
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
      const dir = process.env.SHEETS_DIR || path2.resolve(process.cwd(), "sharepoint sheets");
      if (!fs2.existsSync(dir)) {
        return res.status(404).json({ message: `Directory not found: ${dir}` });
      }
      const files = fs2.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".xlsx") || f.toLowerCase().endsWith(".xls"));
      const result = [];
      for (const file of files) {
        const full = path2.join(dir, file);
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
      const dir = process.env.SHEETS_DIR || path2.resolve(process.cwd(), "sharepoint sheets");
      const full = path2.join(dir, fileName);
      if (!fs2.existsSync(full)) {
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
      const dir = process.env.SHEETS_DIR || path2.resolve(process.cwd(), "sharepoint sheets");
      const full = path2.join(dir, fileName);
      if (!fs2.existsSync(full)) {
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
      const dir = process.env.SHEETS_DIR || path2.resolve(process.cwd(), "sharepoint sheets");
      const full = path2.join(dir, fileName);
      if (!fs2.existsSync(full)) {
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
      const dir = process.env.SHEETS_DIR || path2.resolve(process.cwd(), "sharepoint sheets");
      const full = path2.join(dir, fileName);
      if (!fs2.existsSync(full)) {
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
  app2.get("/api/report_management", async (req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM report_management ORDER BY created_at DESC LIMIT 500");
      res.json(rows);
    } catch (error) {
      console.error("GET /api/report_management failed:", error.message);
      res.status(500).json({ message: "Failed to fetch report_management records" });
    }
  });
  app2.get("/api/report_management/:unique_id", async (req, res) => {
    try {
      const { unique_id } = req.params;
      const [rows] = await pool.execute("SELECT * FROM report_management WHERE unique_id = ? LIMIT 1", [unique_id]);
      if (!rows || rows.length === 0) return res.status(404).json({ message: "Not found" });
      res.json(rows[0]);
    } catch (error) {
      console.error("GET /api/report_management/:unique_id failed:", error.message);
      res.status(500).json({ message: "Failed to fetch record" });
    }
  });
  app2.post("/api/report_management", async (req, res) => {
    try {
      const body = req.body || {};
      const keys = Object.keys(body);
      if (keys.length === 0) return res.status(400).json({ message: "No data provided" });
      const cols = keys.map((k) => `\`${k}\``).join(",");
      const placeholders = keys.map(() => "?").join(",");
      const values = keys.map((k) => body[k]);
      const sql3 = `INSERT INTO report_management (${cols}, created_at) VALUES (${placeholders}, NOW())`;
      const [result] = await pool.execute(sql3, values);
      res.json({ ok: true, insertId: result.insertId });
    } catch (error) {
      console.error("POST /api/report_management failed:", error.message);
      res.status(500).json({ message: "Failed to create record", error: error.message });
    }
  });
  app2.put("/api/report_management/:unique_id", async (req, res) => {
    try {
      const { unique_id } = req.params;
      const updates = req.body || {};
      const keys = Object.keys(updates);
      if (keys.length === 0) return res.status(400).json({ message: "No updates provided" });
      const set = keys.map((k) => `\`${k}\` = ?`).join(",");
      const values = keys.map((k) => updates[k]);
      values.push(unique_id);
      const sql3 = `UPDATE report_management SET ${set}, lead_modified = NOW() WHERE unique_id = ?`;
      const [result] = await pool.execute(sql3, values);
      res.json({ ok: true, affectedRows: result.affectedRows });
    } catch (error) {
      console.error("PUT /api/report_management/:unique_id failed:", error.message);
      res.status(500).json({ message: "Failed to update record" });
    }
  });
  app2.delete("/api/report_management/:unique_id", async (req, res) => {
    try {
      const { unique_id } = req.params;
      const [result] = await pool.execute("DELETE FROM report_management WHERE unique_id = ?", [unique_id]);
      res.json({ ok: true, affectedRows: result.affectedRows });
    } catch (error) {
      console.error("DELETE /api/report_management/:unique_id failed:", error.message);
      res.status(500).json({ message: "Failed to delete record" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path3.dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path3.resolve(__dirname, "client", "src"),
      "@shared": path3.resolve(__dirname, "shared")
      // "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    }
  },
  root: path3.resolve(__dirname, "client"),
  build: {
    outDir: path3.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    watch: {
      usePolling: true,
      interval: 1e3,
      ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/uploads/**"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path4.dirname(__filename2);
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
    server: {
      ...vite_config_default.server,
      ...serverOptions
    },
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(__dirname2, "..", "client", "index.html");
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
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
  const distPath = path4.resolve(__dirname2, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
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
        host: process.env.DB_HOST || "192.168.29.11",
        user: process.env.DB_USER || "remote_user",
        password: decodeURIComponent(process.env.DB_PASSWORD || "Prolab%2305"),
        database: process.env.DB_NAME || "lead_lims2"
      });
      const [rows] = await connection.execute("DESCRIBE lead_management");
      await connection.end();
      const columns = rows.map((row) => row.Field);
      const requiredColumns = [
        "id",
        "unique_id",
        "project_id",
        "lead_type",
        "status",
        "organisation_hospital",
        "patient_client_name"
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
            const uid = await generateRoleId(String(roleForId));
            bodyCopy.unique_id = uid;
            bodyCopy.uniqueId = uid;
          }
        } catch (e) {
          console.warn("generateRoleId failed for /api/leads", e);
        }
        try {
          if (!bodyCopy.projectId && !bodyCopy.project_id) {
            const category = bodyCopy.testCategory || bodyCopy.category || bodyCopy.lead_type || "clinical";
            const projectId = await generateProjectId(String(category));
            bodyCopy.projectId = projectId;
            bodyCopy.project_id = projectId;
          }
        } catch (e) {
          console.warn("generateProjectId failed for /api/leads", e);
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
        console.log("Lead nutritionalCounsellingRequired check:", lead.nutritionalCounsellingRequired, "Type:", typeof lead.nutritionalCounsellingRequired);
        if (lead.nutritionalCounsellingRequired === true) {
          try {
            const [existingNM] = await pool.execute(
              "SELECT id FROM nutritional_management WHERE unique_id = ? LIMIT 1",
              [lead.uniqueId]
            );
            if (existingNM && existingNM.length > 0) {
              console.log("Nutrition record already exists for unique_id:", lead.uniqueId, "- skipping auto-creation");
            } else {
              console.log("TRIGGERING nutritional management auto-creation for lead:", lead.id);
              const nutritionData = {
                unique_id: lead.uniqueId || "",
                project_id: lead.projectId || null,
                service_name: lead.serviceName || null,
                patient_client_name: lead.patientClientName || null,
                age: lead.age ? Number(lead.age) : null,
                gender: lead.gender || null,
                created_by: lead.leadCreatedBy || "system",
                created_at: /* @__PURE__ */ new Date()
              };
              console.log("Auto-creating nutritional record with data:", {
                unique_id: nutritionData.unique_id,
                patient_client_name: nutritionData.patient_client_name,
                age: nutritionData.age,
                service_name: nutritionData.service_name
              });
              const keys = Object.keys(nutritionData);
              const cols = keys.map((k) => `\`${k}\``).join(",");
              const placeholders = keys.map(() => "?").join(",");
              const values = keys.map((k) => nutritionData[k]);
              console.log("Executing SQL:", `INSERT INTO nutritional_management (${cols}) VALUES (${placeholders})`);
              console.log("With values:", values);
              const [result2] = await pool.execute(
                `INSERT INTO nutritional_management (${cols}) VALUES (${placeholders})`,
                values
              );
              console.log("SQL execution result:", result2);
              console.log("Auto-created nutritional record for lead:", lead.id, "NM Record ID:", result2.insertId);
            }
          } catch (err) {
            console.error("Failed to auto-create nutritional record for lead:", err.message);
            console.error("Stack trace:", err.stack);
          }
        }
        console.log("Lead geneticCounselorRequired check:", lead.geneticCounselorRequired, "Lead keys:", Object.keys(lead).filter((k) => k.includes("genetic")));
        if (lead.geneticCounselorRequired) {
          try {
            console.log("TRIGGERING genetic counselling auto-creation for lead:", lead.id);
            const gcData = {
              unique_id: lead.uniqueId || "",
              project_id: lead.projectId || null,
              patient_client_name: lead.patientClientName || null,
              patient_client_address: lead.patientClientAddress || null,
              age: lead.age ? Number(lead.age) : null,
              gender: lead.gender || null,
              patient_client_email: lead.patientClientEmail || null,
              patient_client_phone: lead.patientClientPhone || null,
              clinician_researcher_name: lead.clinicianResearcherName || null,
              organisation_hospital: lead.organisationHospital || null,
              speciality: lead.speciality || null,
              service_name: lead.serviceName || null,
              budget: lead.amountQuoted ? Number(lead.amountQuoted) : null,
              sample_type: lead.sampleType || null,
              sales_responsible_person: lead.salesResponsiblePerson || null,
              created_by: lead.leadCreatedBy || "system",
              created_at: /* @__PURE__ */ new Date()
            };
            console.log("Auto-creating genetic counselling record with data:", {
              unique_id: gcData.unique_id,
              patient_client_name: gcData.patient_client_name,
              patient_client_address: gcData.patient_client_address,
              age: gcData.age,
              service_name: gcData.service_name,
              sample_type: gcData.sample_type
            });
            const keys = Object.keys(gcData);
            const cols = keys.map((k) => `\`${k}\``).join(",");
            const placeholders = keys.map(() => "?").join(",");
            const values = keys.map((k) => gcData[k]);
            console.log("Executing SQL:", `INSERT INTO genetic_counselling_records (${cols}) VALUES (${placeholders})`);
            console.log("With values:", values);
            const [result2] = await pool.execute(
              `INSERT INTO genetic_counselling_records (${cols}) VALUES (${placeholders})`,
              values
            );
            console.log("SQL execution result:", result2);
            console.log("Auto-created genetic counselling record for lead:", lead.id, "GC Record ID:", result2.insertId);
          } catch (err) {
            console.error("Failed to auto-create genetic counselling record for lead:", err.message);
            console.error("Stack trace:", err.stack);
          }
        }
        console.log("Lead created in module, sending notification for:", lead.id, lead.organisationHospital);
        try {
          await notificationService.notifyLeadCreated(
            lead.id,
            String(lead.organisationHospital ?? ""),
            lead.leadCreatedBy ?? "system"
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
              String(conversion.lead.organisationHospital ?? ""),
              String(conversion.sample.id),
              conversion.lead.leadCreatedBy || "system"
            );
            await notificationService.notifySampleReceived(
              String(conversion.sample.id),
              String(conversion.lead.organisationHospital ?? ""),
              conversion.lead.leadCreatedBy || "system"
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
      const [rows] = await connection.execute("DESCRIBE sample_tracking");
      await connection.end();
      const columns = rows.map((row) => row.Field);
      const requiredColumns = ["id", "unique_id", "project_id", "tracking_id", "organisation_hospital"];
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
      const requiredTables = ["lead_management", "sample_tracking", "users"];
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
            SELECT COUNT(*) as count FROM lead_management 
            WHERE status IN ('quoted', 'cold', 'hot', 'won')
          `);
          stats.activeLeads = leadRows[0]?.count || 0;
          const [sampleRows] = await connection.execute(`
            SELECT COUNT(*) as count FROM sample_tracking
          `);
          stats.samplesProcessing = sampleRows[0]?.count || 0;
          const [reportRows] = await connection.execute(`
            SELECT COUNT(*) as count FROM reports 
            WHERE status IN ('in_progress', 'awaiting_approval', 'approved')
          `);
          stats.reportsPending = reportRows[0]?.count || 0;
          const [revenueRows] = await connection.execute(`
            SELECT COALESCE(SUM(sample_shipment_amount), 0) as pending
            FROM sample_tracking
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
      "fr.unique_id",
      "fr.invoice_number",
      "fr.patient_client_name",
      "fr.organisation_hospital",
      "fr.service_name",
      "fr.sales_responsible_person",
      "fr.mode_of_payment",
      "fr.transactional_number",
      "fr.third_party_name",
      "s.organisation_hospital",
      "s.patient_client_name",
      "l.organisation_hospital",
      "l.patient_client_name"
    ];
    const whereClauses = searchCols.map((col) => `${col} LIKE ?`);
    const whereClause = `WHERE ${whereClauses.join(" OR ")}`;
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortDir.toUpperCase()}` : "ORDER BY fr.created_at DESC";
    const sql3 = `
      SELECT 
        fr.*, 
        s.organisation_hospital AS sample_organisation,
        l.organisation_hospital AS lead_organisation
      FROM finance_sheet fr
      LEFT JOIN sample_tracking s ON s.project_id = fr.project_id
      LEFT JOIN lead_management l ON l.project_id = fr.project_id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    const countSql = `
      SELECT COUNT(DISTINCT fr.id) as cnt
      FROM finance_sheet fr
      LEFT JOIN sample_tracking s ON s.project_id = fr.project_id
      LEFT JOIN lead_management l ON l.project_id = fr.project_id
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
      const [rows] = await connection.execute("DESCRIBE finance_sheet");
      await connection.end();
      const columns = rows.map((row) => row.Field);
      const requiredColumns = ["id", "unique_id", "project_id", "invoice_number", "organisation_hospital"];
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
      "lead-management": ["lead_management"],
      "sample-tracking": ["sample_tracking"],
      "finance": ["finance_sheet"],
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
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
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
