import {
  users,
  leads,
  samples,
  labProcessing as labProcessingTable,
  reports as reportsTable,
  notifications as notificationsTable,
  financeRecords,
  logisticsTracking,
  pricing,
  salesActivities,
  clients,
  labProcessDiscoverySheet,
  labProcessClinicalSheet,
  bioinformaticsSheetDiscovery,
  bioinformaticsSheetClinical,
  processMasterSheet,
  type User,
  type InsertUser,
  type Lead,
  type InsertLead,
  type Sample,
  type InsertSample,
  type LabProcessing,
  type InsertLabProcessing,
  type Report,
  type InsertReport,
  type Notification,
  type InsertNotification,
  type FinanceRecord,
  type InsertFinanceRecord,
  type LogisticsTracking,
  type InsertLogisticsTracking,
  type Pricing,
  type InsertPricing,
  type SalesActivity,
  type InsertSalesActivity,
  type Client,
  type InsertClient,
  type LeadWithUser,
  type SampleWithLead,
  type LabProcessingWithSample,
  type ReportWithSample,
  type FinanceRecordWithSample,
  type LogisticsTrackingWithSample,
  type BioinformaticsSheetClinical,
  type BioinformaticsSheetDiscovery,
  type InsertBioinformaticsSheetClinical,
  type InsertBioinformaticsSheetDiscovery,
  type ProcessMasterSheet,
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { db, pool } from "./db";
import { and, eq, sql, asc, desc } from "drizzle-orm";

const collateUtf8Unicode = (column: any) => sql`${column} COLLATE utf8mb4_unicode_ci`;
const eqUtf8Columns = (left: any, right: any) => eq(collateUtf8Unicode(left), collateUtf8Unicode(right));

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  // Delete a user
  deleteUser(id: string): Promise<boolean>;
  // Delete a lead
  deleteLead(id: string): Promise<boolean>;


  // Lead management
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(userRole?: string | null, userId?: string | null): Promise<LeadWithUser[]>;
  getLeadById(id: string): Promise<Lead | undefined>;
  updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined>;
  updateLeadStatus(id: string, status: string): Promise<Lead | undefined>;
  findLeadByEmailPhone(email: string, phone: string): Promise<Lead | undefined>;
  convertLead(leadId: string, sampleData: Omit<InsertSample, 'leadId'>): Promise<{ lead: Lead; sample: Sample; finance?: FinanceRecord; labProcessing?: LabProcessing }>;

  // Sample management
  getSamples(): Promise<SampleWithLead[]>;
  getSampleById(id: string): Promise<Sample | undefined>;
  updateSample(id: string, updates: Partial<Sample>): Promise<Sample | undefined>;
  generateSampleId(category: string): string;
  // Delete a sample
  deleteSample(id: string): Promise<boolean>;

  // Lab processing
  createLabProcessing(labData: InsertLabProcessing): Promise<LabProcessing>;
  getLabProcessingBySampleId(sampleId: string): Promise<LabProcessing | undefined>;
  getLabProcessingById(id: string): Promise<LabProcessing | undefined>;
  getLabProcessingQueue(): Promise<LabProcessingWithSample[]>;
  updateLabProcessing(id: string, updates: Partial<LabProcessing>): Promise<LabProcessing | undefined>;
  // Delete a lab processing record
  deleteLabProcessing(id: string): Promise<boolean>;

  // Reports
  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<ReportWithSample[]>;
  getReportById(id: string): Promise<Report | undefined>;
  updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined>;

  // Finance records
  createFinanceRecord(financeData: InsertFinanceRecord): Promise<FinanceRecord>;
  getFinanceRecords(opts?: { page?: number; pageSize?: number; sortBy?: string | null; sortDir?: 'asc' | 'desc' | null; query?: string | null; }): Promise<{ rows: FinanceRecordWithSample[]; total: number }>;
  getFinanceRecordById(id: string): Promise<FinanceRecord | undefined>;
  updateFinanceRecord(id: string, updates: Partial<FinanceRecord>): Promise<FinanceRecord | undefined>;

  // Bioinformatics sheets
  sendLabProcessingToBioinformatics(recordId: string, tableType: 'discovery' | 'clinical'): Promise<BioinformaticsSheetDiscovery | BioinformaticsSheetClinical | undefined>;
  createBioinformaticsRecord(data: InsertBioinformaticsSheetDiscovery | InsertBioinformaticsSheetClinical, tableType: 'discovery' | 'clinical'): Promise<BioinformaticsSheetDiscovery | BioinformaticsSheetClinical>;

  // Logistics tracking
  createLogisticsTracking(logisticsData: InsertLogisticsTracking): Promise<LogisticsTracking>;
  getLogisticsTracking(): Promise<LogisticsTrackingWithSample[]>;
  getLogisticsTrackingById(id: string): Promise<LogisticsTracking | undefined>;
  updateLogisticsTracking(id: string, updates: Partial<LogisticsTracking>): Promise<LogisticsTracking | undefined>;

  // Pricing
  createPricing(pricingData: InsertPricing): Promise<Pricing>;
  getPricing(): Promise<Pricing[]>;
  getPricingById(id: string): Promise<Pricing | undefined>;
  updatePricing(id: string, updates: Partial<Pricing>): Promise<Pricing | undefined>;

  // Sales activities
  createSalesActivity(activityData: InsertSalesActivity): Promise<SalesActivity>;
  getSalesActivities(): Promise<SalesActivity[]>;
  getSalesActivityById(id: string): Promise<SalesActivity | undefined>;
  updateSalesActivity(id: string, updates: Partial<SalesActivity>): Promise<SalesActivity | undefined>;

  // Clients
  createClient(clientData: InsertClient): Promise<Client>;
  getClients(): Promise<Client[]>;
  getClientById(id: string): Promise<Client | undefined>;
  updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined>;

  // Genetic counselling
  createGeneticCounselling(record: Partial<any>): Promise<any>;
  getGeneticCounselling(): Promise<any[]>;
  updateGeneticCounselling(id: string, updates: Partial<any>): Promise<any | undefined>;
  deleteGeneticCounselling(id: string): Promise<boolean>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<boolean>;
  deleteNotification(id: string): Promise<boolean>;

  // File uploads tracking
  createFileUpload(uploadData: {
    filename: string;
    originalName: string;
    storagePath: string;
    category: string;
    fileSize: number;
    mimeType: string;
    uploadedBy?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }): Promise<any>;
  getFileUploadsByCategory(category: string): Promise<any[]>;
  getFileUploadsByEntity(entityType: string, entityId: string): Promise<any[]>;
  getFileUploadById(id: string): Promise<any | undefined>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    activeLeads: number;
    samplesProcessing: number;
    pendingRevenue: number;
    reportsPending: number;
  }>;

  // Finance
  getFinanceStats(): Promise<{
    totalRevenue: number;
    pendingPayments: number;
    pendingApprovals: number;
  }>;

  getPendingFinanceApprovals(): Promise<SampleWithLead[]>;

  // Recycle bin operations
  createRecycleEntry(payload: { entityType: string; entityId?: string | null; data: any; originalPath?: string | null; createdBy?: string | null }): Promise<any>;
  listRecycleEntries(): Promise<any[]>;
  getRecycleEntry(id: string): Promise<any | undefined>;
  deleteRecycleEntry(id: string): Promise<boolean>;
  restoreRecycleEntry(id: string): Promise<any>;
}

export class DBStorage implements IStorage {
  private connectionWorking = false;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      await this.testConnection();
      // Ensure recycle table exists before any snapshot attempts
      try {
        await this.ensureRecycleTable();
      } catch (e) {
        console.error('Failed to ensure recycle table exists:', (e as Error).message);
      }
      await this.ensureDefaultAdmin();
    } catch (error) {
      console.error('Failed to initialize database connection:', (error as Error).message);
      console.log('⚠️ Application will run in mock data mode');
    }
  }

  // Create recycle_bin table if it does not exist to avoid runtime errors
  private async ensureRecycleTable() {
    try {
      const sql = `
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
      await pool.execute(sql);
      console.log('✅ Ensured recycle_bin table exists');
    } catch (err) {
      console.error('Failed to create recycle_bin table:', (err as any)?.message || err);
      throw err;
    }
  }

  private async testConnection() {
    try {
      console.log('Testing database connection...');
      const testQuery = await db.select().from(users).limit(1);
      console.log('✅ Database connection successful');
      this.connectionWorking = true;
    } catch (error) {
      console.error('❌ Database connection failed:', (error as Error).message);
      console.log('⚠️ Using mock data mode due to database connection issues');
      this.connectionWorking = false;
      throw error; // Re-throw to be caught by initializeConnection
    }
  }

  private async ensureDefaultAdmin() {
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
        isActive: true,
      });
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    await db.insert(users).values({
      id,
      name: insertUser.name,
      email: insertUser.email,
      password: hashedPassword,
      role: insertUser.role,
      isActive: insertUser.isActive ?? true,
      lastLogin: null,
    });
    const created = await this.getUser(id);
    if (!created) throw new Error("Failed to create user");
    return created;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    await db.update(users).set(updates as any).where(eq(users.id, id));
    return this.getUser(id);
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      // snapshot into recycle bin
      try {
        const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (rows[0]) {
          const { recycleBin } = await import('@shared/schema');
          await db.insert(recycleBin).values({ id: randomUUID(), entityType: 'users', entityId: id, data: rows[0], originalPath: `/users/${id}` });
        }
      } catch (e) {
        console.error('Failed to create recycle snapshot for user:', (e as Error).message);
      }

      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error('Failed to delete user:', (error as Error).message);
      return false;
    }
  }

  async deleteLead(id: string): Promise<boolean> {
    try {
      try {
        const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
        if (rows[0]) {
          const { recycleBin } = await import('@shared/schema');
          await db.insert(recycleBin).values({ id: randomUUID(), entityType: 'leads', entityId: id, data: rows[0], originalPath: `/leads/${id}` });
        }
      } catch (e) {
        console.error('Failed to create recycle snapshot for lead:', (e as Error).message);
      }

      await db.delete(leads).where(eq(leads.id, id));
      return true;
    } catch (error) {
      console.error('Failed to delete lead:', (error as Error).message);
      return false;
    }
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    // Insert using the updated columns from shared/schema.ts (lead_management)
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
      testCategory: (insertLead as any).testCategory ?? null,
      noOfSamples: insertLead.noOfSamples ?? null,
      budget: insertLead.budget ?? null,
      amountQuoted: insertLead.amountQuoted ?? null,
      tat: insertLead.tat ?? null,
      sampleShipmentAmount: insertLead.sampleShipmentAmount ?? null,
      phlebotomistCharges: insertLead.phlebotomistCharges ?? null,
      geneticCounselorRequired: (insertLead as any).geneticCounselorRequired ?? false,
      nutritionalCounsellingRequired: (insertLead as any).nutritionalCounsellingRequired ?? false,
      samplePickUpFrom: (insertLead as any).samplePickUpFrom ?? null,
      deliveryUpTo: (insertLead as any).deliveryUpTo ?? null,
      sampleCollectionDate: (insertLead as any).sampleCollectionDate ?? null,
      sampleShippedDate: (insertLead as any).sampleShippedDate ?? null,
      sampleReceivedDate: (insertLead as any).sampleReceivedDate ?? null,
      trackingId: insertLead.trackingId ?? null,
      courierCompany: insertLead.courierCompany ?? null,
      progenicsTrf: (insertLead as any).progenicsTrf ?? null,
      followUp: insertLead.followUp ?? null,
      remarkComment: (insertLead as any).remarkComment ?? null,
      leadCreatedBy: (insertLead as any).leadCreatedBy ?? null,
      salesResponsiblePerson: insertLead.salesResponsiblePerson ?? null,
    } as any);
    const created = await this.getLeadById(id);
    if (!created) throw new Error("Failed to create lead");
    return created;
  }



  async getLeads(userRole?: string | null, userId?: string | null): Promise<LeadWithUser[]> {
    if (!this.connectionWorking) {
      // Return mock data when database is not available
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
          leadCreated: new Date(),
          leadModified: new Date(),
          createdBy: null,
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
          sampleReceivedDate: new Date(),
          trackingId: null,
          courierCompany: null,
          progenicsTrf: null,
          followUp: "Weekly updates",
          remarkComment: null,
          leadCreatedBy: null,
          salesResponsiblePerson: "John Sales Manager",
          leadCreated: new Date(),
          leadModified: new Date(),
          createdBy: null,
        }
      ];
    }

    try {
      // Include the sample row (if any) so UI can show the generated sample_id immediately
      // Build optional where condition based on role
      let whereCondition = undefined;
      if (userRole && userRole.toLowerCase() === 'sales' && userId) {
        whereCondition = eq(leads.leadCreatedBy, userId);
      }

      // Construct query with conditional where clause
      let queryBuilder = db
        .select({ lead: leads, user: users, sample: samples })
        .from(leads)
        .leftJoin(samples, eqUtf8Columns(samples.projectId, leads.projectId))
        .leftJoin(users, eq(leads.leadCreatedBy, users.id)) as any;

      // Apply where if condition exists (for sales users only)
      if (whereCondition) {
        queryBuilder = queryBuilder.where(whereCondition);
      }

      const rows = await queryBuilder;

      return rows.map((row: any) => {
        const leadObj: any = { ...(row.lead as any) };
        // Attach createdBy user if present
        leadObj.createdBy = (row.user as any) ?? null;
        // Attach sample object (may be null) so front-end normalization can pick sample.sampleId
        leadObj.sample = row.sample ? { ...(row.sample as any) } : null;
        // Also expose a top-level sampleId for convenience (prefers attached sample.sampleId)
        leadObj.sampleId = (row.sample as any)?.sampleId ?? (leadObj as any).sampleId ?? null;
        return leadObj;
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      // Return empty array on error
      return [];
    }
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return rows[0];
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | undefined> {

    await db.update(leads).set(updates as any).where(eq(leads.id, id));
    return this.getLeadById(id);
  }

  async updateLeadStatus(id: string, status: string): Promise<Lead | undefined> {
    await db.update(leads).set({ status } as any).where(eq(leads.id, id));
    return this.getLeadById(id);
  }

  async findLeadByEmailPhone(email: string, phone: string): Promise<Lead | undefined> {
    const rows = await db
      .select()
      .from(leads)
      .where(and(eq(leads.clinicianResearcherEmail, email), eq(leads.clinicianResearcherPhone, phone)))
      .limit(1);
    return rows[0];
  }

  generateSampleId(category: string): string {
    const now = new Date();
    const prefix = category && category.toLowerCase() === "discovery" ? "DG" : "PG";
    const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const date = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${prefix}${year}${month}${date}${hours}${minutes}${seconds}`;
  }

  async convertLead(leadId: string, sampleData: any): Promise<{ lead: Lead; sample: Sample; finance?: FinanceRecord; labProcessing?: LabProcessing }> {
    try {
      const lead = await this.getLeadById(leadId);
      if (!lead) throw new Error("Lead not found");

      console.log('Converting lead:', lead.id);
      console.log('Sample data:', sampleData);

      return await db.transaction(async (tx) => {
        // Update lead status
        await tx.update(leads).set({ status: "converted" } as any).where(eq(leads.id, leadId));
        console.log('✅ Lead status updated to converted');

        // Create sample_tracking row using fields available on lead
        await tx.insert(samples).values({
          uniqueId: (lead as any).uniqueId ?? null,
          projectId: (lead as any).projectId ?? null,
          sampleCollectionDate: (lead as any).sampleCollectionDate ?? null,
          sampleShippedDate: (lead as any).sampleShippedDate ?? null,
          sampleDeliveryDate: (lead as any).sampleReceivedDate ?? null,
          samplePickUpFrom: (lead as any).samplePickUpFrom ?? null,
          deliveryUpTo: (lead as any).deliveryUpTo ?? null,
          trackingId: (lead as any).trackingId ?? null,
          courierCompany: (lead as any).courierCompany ?? null,
          sampleShipmentAmount: (lead as any).sampleShipmentAmount ?? null,
          organisationHospital: (lead as any).organisationHospital ?? null,
          clinicianResearcherName: (lead as any).clinicianResearcherName ?? null,
          clinicianResearcherPhone: (lead as any).clinicianResearcherPhone ?? null,
          patientClientName: (lead as any).patientClientName ?? null,
          patientClientPhone: (lead as any).patientClientPhone ?? null,
          sampleReceivedDate: (lead as any).sampleReceivedDate ?? null,
          salesResponsiblePerson: (lead as any).salesResponsiblePerson ?? null,
        } as any);
        console.log('✅ Sample tracking created from lead');

        // Fetch the created sample (latest by uniqueId/projectId)
        const createdSamples = await tx
          .select()
          .from(samples)
          .where(eq(samples.uniqueId as any, (lead as any).uniqueId))
          .orderBy(desc(samples.createdAt as any))
          .limit(1);
        const createdSample = (createdSamples && createdSamples[0]) ? (createdSamples[0] as any) : null;

        // Create a finance_sheet record from the converted lead with comprehensive field mapping
        let createdFinanceRecord: any = null;
        try {
          const financeData: any = {
            uniqueId: (lead as any).uniqueId,
            projectId: (lead as any).projectId ?? '', // Required field - NOT NULL in database
            sampleCollectionDate: (lead as any).sampleCollectionDate ?? null,
            organisationHospital: (lead as any).organisationHospital ?? null,
            clinicianResearcherName: (lead as any).clinicianResearcherName ?? null,
            clinicianResearcherEmail: (lead as any).clinicianResearcherEmail ?? null,
            clinicianResearcherPhone: (lead as any).clinicianResearcherPhone ?? null,
            clinicianResearcherAddress: (lead as any).clinicianResearcherAddress ?? null,
            patientClientName: (lead as any).patientClientName ?? null,
            patientClientEmail: (lead as any).patientClientEmail ?? null,
            patientClientPhone: (lead as any).patientClientPhone ?? null,
            patientClientAddress: (lead as any).patientClientAddress ?? null,
            serviceName: (lead as any).serviceName ?? null,
            budget: (lead as any).amountQuoted ? String((lead as any).amountQuoted) : null,
            phlebotomistCharges: (lead as any).phlebotomistCharges ?? null,
            salesResponsiblePerson: (lead as any).salesResponsiblePerson ?? null,
            sampleShipmentAmount: (lead as any).sampleShipmentAmount ?? null,
            createdBy: (lead as any).leadCreatedBy || 'system',
            createdAt: new Date(),
          };

          console.log('Creating finance_sheet with data:', { uniqueId: financeData.uniqueId, projectId: financeData.projectId });
          const insertResult = await tx.insert(financeRecords).values(financeData as any);
          console.log('✅ Finance sheet record created from converted lead:', financeData.uniqueId);

          // Fetch the created record
          const createdRecords = await tx
            .select()
            .from(financeRecords)
            .where(eq(financeRecords.uniqueId as any, (lead as any).uniqueId))
            .orderBy(desc(financeRecords.createdAt as any))
            .limit(1);
          createdFinanceRecord = (createdRecords && createdRecords[0]) ? (createdRecords[0] as any) : null;
          console.log('✅ Fetched finance record:', createdFinanceRecord?.id ?? 'No record found');
        } catch (e) {
          console.error('❌ Failed to create finance_sheet record:', (e as Error).message);
          console.error('Error details:', (e as Error));
        }

        // Create a process_master_sheet record from the converted lead
        try {
          await tx.insert(processMasterSheet).values({
            uniqueId: (lead as any).uniqueId ?? null,
            projectId: (lead as any).projectId ?? null,
            sampleId: (createdSample as any)?.uniqueId ?? null,
            clientId: (lead as any).clientId ?? null,
            organisationHospital: (lead as any).organisationHospital ?? null,
            clinicianResearcherName: (lead as any).clinicianResearcherName ?? null,
            speciality: (lead as any).speciality ?? null,
            clinicianResearcherEmail: (lead as any).clinicianResearcherEmail ?? null,
            clinicianResearcherPhone: (lead as any).clinicianResearcherPhone ?? null,
            clinicianResearcherAddress: (lead as any).clinicianResearcherAddress ?? null,
            patientClientName: (lead as any).patientClientName ?? null,
            age: (lead as any).age ?? null,
            gender: (lead as any).gender ?? null,
            patientClientEmail: (lead as any).patientClientEmail ?? null,
            patientClientPhone: (lead as any).patientClientPhone ?? null,
            patientClientAddress: (lead as any).patientClientAddress ?? null,
            sampleCollectionDate: (lead as any).sampleCollectionDate ?? null,
            sampleReceviedDate: (lead as any).sampleReceivedDate ?? null,
            serviceName: (lead as any).serviceName ?? null,
            sampleType: (lead as any).sampleType ?? null,
            noOfSamples: (lead as any).noOfSamples ?? null,
            tat: (lead as any).tat ?? null,
            salesResponsiblePerson: (lead as any).salesResponsiblePerson ?? null,
            progenicsTrf: null,
            thirdPartyTrf: null,
            progenicsReport: null,
            sampleSentToThirdPartyDate: null,
            thirdPartyName: null,
            thirdPartyReport: null,
            resultsRawDataReceivedFromThirdPartyDate: null,
            logisticStatus: 'pending',
            financeStatus: 'pending',
            labProcessStatus: 'pending',
            bioinformaticsStatus: 'pending',
            nutritionalManagementStatus: (lead as any).nutritionalCounsellingRequired ? 'pending' : 'not_required',
            progenicsReportReleaseDate: null,
            remarkComment: null,
            createdBy: (lead as any).leadCreatedBy || 'system',
            modifiedAt: null,
            modifiedBy: null,
          } as any);
          console.log('✅ Process master sheet record created from converted lead');
        } catch (e) {
          console.error('Failed to create process_master_sheet record:', (e as Error).message);
          console.error('Error details:', JSON.stringify(e));
        }

        // Create genetic counselling record if requested or if this lead requires it (WES + gc required)
        let createdGc: any = null;
        try {
          const leadServiceName = (lead as any).serviceName || (lead as any).service_name || '';
          const gcRequired = (lead as any).geneticCounsellorRequired ?? (lead as any).genetic_counsellor_required ?? false;
          const leadFollowUp = (lead as any).followUp || (lead as any).follow_up || '';
          // allow callers to force creation via convert payload flags
          const requestGcFlag = !!sampleData?.createGeneticCounselling || !!sampleData?.createGc || !!sampleData?.create_genetic_counselling;

          const shouldCreateGc = requestGcFlag || ((String(leadServiceName).toLowerCase().includes('wes') || String(leadFollowUp).toLowerCase().includes('gc')) && !!gcRequired);

          console.log('GC decision: leadServiceName=', leadServiceName, 'leadFollowUp=', leadFollowUp, 'gcRequired=', gcRequired, 'requestGcFlag=', requestGcFlag, 'shouldCreateGc=', shouldCreateGc);

          if (shouldCreateGc) {
            // genetic_counselling_records schema does not include sampleId; create a minimal row is handled via dedicated APIs
            console.log('ℹ️ Skipping automatic genetic counselling creation due to schema change');
          }
        } catch (err) {
          console.error('Failed to create genetic counselling record during conversion:', (err as Error).message);
        }

        // Fetch the updated lead
        const updatedLeadRows = await tx.select().from(leads).where(eq(leads.id, leadId)).limit(1);
        const updatedLead = updatedLeadRows[0] as Lead;

        return {
          lead: updatedLead,
          sample: createdSample as any,
          finance: createdFinanceRecord,
          labProcessing: undefined as any,
          geneticCounselling: createdGc
        };
      });
    } catch (error) {
      console.error('❌ Error in convertLead:', error);
      throw error;
    }
  }

  async getSamples(): Promise<SampleWithLead[]> {
    const rows = await db
      .select({ sample: samples, lead: leads })
      .from(samples)
      .leftJoin(leads, eqUtf8Columns(samples.projectId, leads.projectId));
    return rows.map((row: any) => ({
      ...(row.sample as any),
      lead: row.lead as any,
    }));
  }

  async getSampleById(id: string): Promise<Sample | undefined> {
    const rows = await db.select().from(samples).where(eq(samples.id, Number(id))).limit(1);
    return rows[0];
  }

  async updateSample(id: string, updates: Partial<Sample>): Promise<Sample | undefined> {
    await db.update(samples).set(updates as any).where(eq(samples.id, Number(id)));
    return this.getSampleById(id);
  }

  async deleteSample(id: string): Promise<boolean> {
    try {
      try {
        const rows = await db.select().from(samples).where(eq(samples.id, Number(id))).limit(1);
        if (rows[0]) {
          const { recycleBin } = await import('@shared/schema');
          await db.insert(recycleBin).values({ id: randomUUID(), entityType: 'samples', entityId: id, data: rows[0], originalPath: `/samples/${id}` });
        }
      } catch (e) {
        console.error('Failed to create recycle snapshot for sample:', (e as Error).message);
      }

      await db.delete(samples).where(eq(samples.id, Number(id)));
      return true;
    } catch (error) {
      console.error('Failed to delete sample:', (error as Error).message);
      return false;
    }
  }

  async createLabProcessing(labData: InsertLabProcessing): Promise<LabProcessing> {
    const id = randomUUID();
    // Resolve sampleId: callers may provide either the internal ID (samples.id as number)
    // or the human-readable sample code (samples.uniqueId). Try to resolve to
    // the internal ID so joins in getLabProcessingQueue() work reliably.
    let resolvedSampleId: any = labData.sampleId;
    try {
      // First try to parse as a number and match against samples.id (bigint)
      const sampleIdNum = Number(labData.sampleId);
      if (!isNaN(sampleIdNum)) {
        const byId = await db.select().from(samples).where(eq(samples.id, sampleIdNum)).limit(1);
        if (byId[0]) {
          resolvedSampleId = sampleIdNum.toString();
        } else {
          // If not found by ID, try to find by uniqueId
          const byUnique = await db.select().from(samples).where(eq(samples.uniqueId, labData.sampleId)).limit(1);
          if (byUnique[0]) {
            resolvedSampleId = (byUnique[0].id as number).toString();
          } else {
            throw new Error(`Sample not found for sample identifier: ${labData.sampleId}`);
          }
        }
      } else {
        // Not a number, so try to find by uniqueId
        const byUnique = await db.select().from(samples).where(eq(samples.uniqueId, labData.sampleId)).limit(1);
        if (byUnique[0]) {
          resolvedSampleId = (byUnique[0].id as number).toString();
        } else {
          throw new Error(`Sample not found for sample identifier: ${labData.sampleId}`);
        }
      }
    } catch (err) {
      // Bubble up - route handler will translate to 500/400 as appropriate
      console.error('Failed to resolve sampleId for lab processing:', (err as Error).message);
      throw err;
    }

    await db.insert(labProcessingTable).values({
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
      humidity: labData.humidity ?? null,
    });
    const created = await this.getLabProcessingBySampleId(resolvedSampleId);
    if (!created) throw new Error("Failed to create lab processing");
    return created;
  }

  async getLabProcessingBySampleId(sampleId: string): Promise<LabProcessing | undefined> {
    const rows = await db.select().from(labProcessingTable).where(eq(labProcessingTable.sampleId, sampleId)).limit(1);
    return rows[0];
  }

  async getLabProcessingById(id: string): Promise<LabProcessing | undefined> {
    const rows = await db.select().from(labProcessingTable).where(eq(labProcessingTable.id, id)).limit(1);
    return rows[0];
  }

  async getLabProcessingQueue(): Promise<LabProcessingWithSample[]> {
    const rows = await db
      .select({ lp: labProcessingTable, sample: samples, lead: leads })
      .from(labProcessingTable)
      .leftJoin(samples, eq(labProcessingTable.sampleId, samples.id))
      .leftJoin(leads, eqUtf8Columns(samples.projectId, leads.projectId));
    return rows.map((row: any) => ({
      ...(row.lp as any),
      sample: {
        ...(row.sample as any),
        lead: row.lead as any,
      },
    }));
  }

  async updateLabProcessing(id: string, updates: Partial<LabProcessing>): Promise<LabProcessing | undefined> {
    let safeUpdates: any;
    try {
      safeUpdates = { ...updates };
      const toDbDate = (v: any) => {
        if (v == null) return v;
        if (v instanceof Date) return v;
        // if it's a string, try parsing
        if (typeof v === 'string') {
          // only treat strings that look like dates (YYYY-MM-DD or ISO-like) as dates
          if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?/.test(v)) {
            const d = new Date(v);
            if (!isNaN(d.getTime())) return d;
          }
          return v; // leave as-is if not date-like or unparsable
        }
        return v;
      };
      for (const k of Object.keys(safeUpdates)) {
        (safeUpdates as any)[k] = toDbDate((safeUpdates as any)[k]);
      }
      await db.update(labProcessingTable).set(safeUpdates as any).where(eq(labProcessingTable.id, id));
      const rows = await db.select().from(labProcessingTable).where(eq(labProcessingTable.id, id)).limit(1);
      return rows[0];
    } catch (error) {
      console.error('Error in updateLabProcessing:', (error as Error).message);
      try { console.error('Safe updates:', JSON.stringify((safeUpdates as any) || updates, null, 2)); } catch (e) { console.error('Failed to stringify safeUpdates', e); }
      console.error((error as Error).stack);
      throw error;
    }
  }

  async deleteLabProcessing(id: string): Promise<boolean> {
    try {
      try {
        const rows = await db.select().from(labProcessingTable).where(eq(labProcessingTable.id, id)).limit(1);
        if (rows[0]) {
          const { recycleBin } = await import('@shared/schema');
          await db.insert(recycleBin).values({ id: randomUUID(), entityType: 'lab_processing', entityId: id, data: rows[0], originalPath: `/lab-processing/${id}` });
        }
      } catch (e) {
        console.error('Failed to create recycle snapshot for lab processing:', (e as Error).message);
      }

      await db.delete(labProcessingTable).where(eq(labProcessingTable.id, id));
      return true;
    } catch (error) {
      console.error('Failed to delete lab processing record:', (error as Error).message);
      return false;
    }
  }

  async createReport(report: InsertReport): Promise<Report> {
    const id = randomUUID();
    await db.insert(reportsTable).values({
      id,
      sampleId: report.sampleId,
      status: report.status ?? "in_progress",
      reportPath: report.reportPath ?? null,
      generatedAt: new Date(),
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
      recipientEmail: report.recipientEmail ?? null,
    });
    const created = await this.getReportById(id);
    if (!created) throw new Error("Failed to create report");
    return created;
  }

  async getReports(): Promise<ReportWithSample[]> {
    const rows = await db
      .select({ r: reportsTable, sample: samples, lead: leads })
      .from(reportsTable)
      .leftJoin(samples, eq(reportsTable.sampleId, samples.id))
      .leftJoin(leads, eqUtf8Columns(samples.projectId, leads.projectId));
    return rows.map((row: any) => ({
      ...(row.r as any),
      sample: {
        ...(row.sample as any),
        lead: row.lead as any,
      },
    }));
  }

  async getReportById(id: string): Promise<Report | undefined> {
    const rows = await db.select().from(reportsTable).where(eq(reportsTable.id, id)).limit(1);
    return rows[0];
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined> {
    await db.update(reportsTable).set(updates as any).where(eq(reportsTable.id, id));
    return this.getReportById(id);
  }

  // Finance Records
  async createFinanceRecord(financeData: InsertFinanceRecord): Promise<FinanceRecord> {
    // Insert only columns that exist in finance_sheet per shared/schema.ts
    await db.insert(financeRecords).values({
      uniqueId: financeData.uniqueId,
      projectId: (financeData as any).projectId ?? null,
      sampleCollectionDate: (financeData as any).sampleCollectionDate ?? null,
      organisationHospital: (financeData as any).organisationHospital ?? null,
      clinicianResearcherName: (financeData as any).clinicianResearcherName ?? null,
      clinicianResearcherEmail: (financeData as any).clinicianResearcherEmail ?? null,
      clinicianResearcherPhone: (financeData as any).clinicianResearcherPhone ?? null,
      clinicianResearcherAddress: (financeData as any).clinicianResearcherAddress ?? null,
      patientClientName: (financeData as any).patientClientName ?? null,
      patientClientEmail: (financeData as any).patientClientEmail ?? null,
      patientClientPhone: (financeData as any).patientClientPhone ?? null,
      patientClientAddress: (financeData as any).patientClientAddress ?? null,
      serviceName: (financeData as any).serviceName ?? null,
      budget: (financeData as any).budget ?? null,
      phlebotomistCharges: (financeData as any).phlebotomistCharges ?? null,
      salesResponsiblePerson: (financeData as any).salesResponsiblePerson ?? null,
      sampleShipmentAmount: (financeData as any).sampleShipmentAmount ?? null,
      invoiceNumber: (financeData as any).invoiceNumber ?? null,
      invoiceAmount: (financeData as any).invoiceAmount ?? null,
      invoiceDate: (financeData as any).invoiceDate ?? null,
      paymentReceiptAmount: (financeData as any).paymentReceiptAmount ?? null,
      balanceAmount: (financeData as any).balanceAmount ?? null,
      paymentReceiptDate: (financeData as any).paymentReceiptDate ?? null,
      modeOfPayment: (financeData as any).modeOfPayment ?? null,
      transactionalNumber: (financeData as any).transactionalNumber ?? null,
      balanceAmountReceivedDate: (financeData as any).balanceAmountReceivedDate ?? null,
      totalAmountReceivedStatus: (financeData as any).totalAmountReceivedStatus ?? false,
      utrDetails: (financeData as any).utrDetails ?? null,
      thirdPartyCharges: (financeData as any).thirdPartyCharges ?? null,
      otherCharges: (financeData as any).otherCharges ?? null,
      otherChargesReason: (financeData as any).otherChargesReason ?? null,
      thirdPartyName: (financeData as any).thirdPartyName ?? null,
      thirdPartyPhone: (financeData as any).thirdPartyPhone ?? null,
      thirdPartyPaymentDate: (financeData as any).thirdPartyPaymentDate ?? null,
      thirdPartyPaymentStatus: (financeData as any).thirdPartyPaymentStatus ?? false,
      alertToLabprocessTeam: (financeData as any).alertToLabprocessTeam ?? false,
      alertToReportTeam: (financeData as any).alertToReportTeam ?? false,
      alertToTechnicalLead: (financeData as any).alertToTechnicalLead ?? false,
      createdBy: (financeData as any).createdBy ?? null,
      remarkComment: (financeData as any).remarkComment ?? null,
    } as any);
    // Fetch created by uniqueId
    const rows = await db.select().from(financeRecords).where(eq(financeRecords.uniqueId as any, financeData.uniqueId)).limit(1);
    const created = rows[0] as any;
    if (!created) throw new Error("Failed to create finance record");
    return created;
  }

  async getFinanceRecords(opts?: { page?: number; pageSize?: number; sortBy?: string | null; sortDir?: 'asc' | 'desc' | null; query?: string | null; }): Promise<{ rows: FinanceRecordWithSample[]; total: number }> {
    let page = opts?.page ?? 1;
    let pageSize = opts?.pageSize ?? 25;
    const sortBy = opts?.sortBy ?? null;
    const sortDir = opts?.sortDir ?? 'desc';
    const q = (opts?.query || '').trim();

    let offset = (page - 1) * pageSize;

    if (q) {
      pageSize = 10000;
      offset = 0;
    }

    // determine ordering expression
    const mapping: Record<string, any> = {
      invoiceDate: financeRecords.invoiceDate,
      invoiceAmount: financeRecords.invoiceAmount,
      createdAt: financeRecords.createdAt,
    };
    const orderExpr: any = sortBy ? (mapping[sortBy] ?? (financeRecords as any)[sortBy as string] ?? undefined) : undefined;

    // If a free-text query is provided, run a raw SQL query using the connection pool
    let rows: any[] = [];
    let total = 0;
    if (q) {
      const like = `%${q}%`;
      // build safe SQL with parameter placeholders programmatically to avoid mismatch bugs
      const searchCols = [
        'fr.unique_id',
        'fr.invoice_number',
        'fr.patient_client_name',
        'fr.organisation_hospital',
        'fr.service_name',
        'fr.sales_responsible_person',
        'fr.mode_of_payment',
        'fr.transactional_number',
        'fr.third_party_name',
        's.organisation_hospital',
        's.patient_client_name',
        'l.organisation_hospital',
        'l.patient_client_name',
      ];
      const whereParts = searchCols.map(() => `?`).map((p, i) => `${searchCols[i]} LIKE ${p}`);
      const whereClause = `WHERE ${whereParts.join(' OR ')}`;
      const orderClause = orderExpr ? `ORDER BY ${typeof orderExpr === 'string' ? orderExpr : 'fr.created_at'} ${sortDir === 'asc' ? 'ASC' : 'DESC'}` : `ORDER BY fr.created_at DESC`;
      const sqlQuery = `SELECT fr.*, s.organisation_hospital AS sample_organisation, l.organisation_hospital AS lead_organisation FROM finance_sheet fr LEFT JOIN sample_tracking s ON s.project_id = fr.project_id LEFT JOIN lead_management l ON l.project_id = fr.project_id ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
      // bindings: one 'like' per search column, followed by pageSize and offset
      const likeBindings = searchCols.map(() => like);
      const bindings: any[] = [...likeBindings, pageSize, offset];
      try {
        const [resultRows] = await pool.execute(sqlQuery, bindings) as any;
        rows = resultRows as any[];
        // count total matching - reuse whereClause and likeBindings
        const countSql = `SELECT COUNT(DISTINCT fr.id) as cnt FROM finance_sheet fr LEFT JOIN sample_tracking s ON s.project_id = fr.project_id LEFT JOIN lead_management l ON l.project_id = fr.project_id ${whereClause}`;
        const [countRes] = await pool.execute(countSql, likeBindings) as any;
        total = (countRes && countRes[0] && countRes[0].cnt) ? Number(countRes[0].cnt) : 0;
      } catch (err) {
        console.error('Raw SQL finance search failed:', err);
        rows = [];
        total = 0;
      }
    } else {
      // build drizzle query for the simple (no-search) case
      const qb = db
        .select({ fr: financeRecords, sample: samples, lead: leads, lp: labProcessingTable })
        .from(financeRecords)
        .leftJoin(samples, eq(financeRecords.projectId, samples.projectId))
        .leftJoin(leads, eq(financeRecords.projectId, leads.projectId))
        .leftJoin(labProcessingTable, eq(labProcessingTable.sampleId, samples.id))
        .limit(pageSize)
        .offset(offset)
        .orderBy(orderExpr ? (sortDir === 'asc' ? asc(orderExpr) : desc(orderExpr)) : desc(financeRecords.createdAt));

      rows = await qb;
      const totalRows = await db.select().from(financeRecords).execute();
      total = Array.isArray(totalRows) ? totalRows.length : (totalRows as any).length || 0;
    }

    // Map results for both drizzle object-shaped rows and raw SQL flat rows
    let mapped: any[] = [];
    if (rows.length && rows[0].fr !== undefined) {
      // Drizzle object shape
      mapped = rows.map((row: any) => {
        const fr = { ...(row.fr as any) };
        const sample = row.sample ? { ...(row.sample as any) } : null;
        const lp = row.lp ? { ...(row.lp as any) } : null;
        // Server-side fallback for titleUniqueId: finance -> sample -> lab_processing
        const titleUniqueId = fr.titleUniqueId ?? sample?.titleUniqueId ?? lp?.titleUniqueId ?? (row.lead as any)?.id ?? null;
        // Server-side fallback for projectId: finance -> sample
        const projectId = fr.projectId ?? sample?.projectId ?? null;
        return {
          ...fr,
          ...(titleUniqueId != null ? { titleUniqueId } : {}),
          ...(projectId != null ? { projectId } : {}),
          sample: sample ? { ...sample, lead: row.lead as any } : null,
        };
      });
    } else {
      // Raw SQL flat rows
      mapped = rows.map((r: any) => {
        const title_unique_id = r.title_unique_id ?? r.lp_title_unique_id ?? r.id /* lead.id may shadow; raw rows include l.* so r.id might be ambiguous */ ?? null;
        const project_id = r.project_id ?? r.projectId ?? null;
        const obj: any = { ...r };
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

  async getFinanceRecordById(id: string): Promise<FinanceRecord | undefined> {
    const rows = await db.select().from(financeRecords).where(eq(financeRecords.id, Number(id))).limit(1);
    return rows[0];
  }

  async updateFinanceRecord(id: string, updates: Partial<FinanceRecord>): Promise<FinanceRecord | undefined> {
    let safeUpdates: any;
    try {
      safeUpdates = { ...updates };
      const toDbDate = (v: any) => {
        if (v == null) return v;
        if (v instanceof Date) return v;
        if (typeof v === 'string') {
          if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?/.test(v)) {
            const d = new Date(v);
            if (!isNaN(d.getTime())) return d;
          }
          return v;
        }
        return v;
      };
      for (const k of Object.keys(safeUpdates)) {
        (safeUpdates as any)[k] = toDbDate((safeUpdates as any)[k]);
      }
      // Log types of safeUpdates to detect any non-Date values that might cause driver errors
      try {
        const typesReport: any = {};
        for (const k of Object.keys(safeUpdates)) {
          const v = (safeUpdates as any)[k];
          typesReport[k] = { typeof: typeof v, constructor: v && v.constructor ? v.constructor.name : null };
        }
        console.error('updateFinanceRecord - typesReport:', JSON.stringify(typesReport));
      } catch (e) {
        console.error('Failed to build typesReport', e);
      }
      try {
        await db.update(financeRecords).set(safeUpdates as any).where(eq(financeRecords.id, Number(id)));
      } catch (dbErr) {
        console.error('DB update failed in updateFinanceRecord');
        try { console.error('Safe updates:', JSON.stringify(safeUpdates, null, 2)); } catch (e) { console.error('SafeUpdates stringify failed', e); }
        console.error('DB error stack:', (dbErr as Error).stack || (dbErr as any));
        throw dbErr;
      }
      return this.getFinanceRecordById(id);
    } catch (error) {
      console.error('Error in updateFinanceRecord:', (error as Error).message);
      try { console.error('Safe updates:', JSON.stringify((safeUpdates as any) || updates, null, 2)); } catch (e) { console.error('Failed to stringify safeUpdates', e); }
      console.error((error as Error).stack);
      throw error;
    }
  }

  async deleteFinanceRecord(id: string): Promise<boolean> {
    try {
      try {
        const rows = await db.select().from(financeRecords).where(eq(financeRecords.id, Number(id))).limit(1);
        if (rows[0]) {
          const { recycleBin } = await import('@shared/schema');
          await db.insert(recycleBin).values({ id: randomUUID(), entityType: 'finance_sheet', entityId: id, data: rows[0], originalPath: `/finance/records/${id}` });
        }
      } catch (e) {
        console.error('Failed to create recycle snapshot for finance record:', (e as Error).message);
      }

      await db.delete(financeRecords).where(eq(financeRecords.id, Number(id)));
      return true;
    } catch (error) {
      console.error('Failed to delete finance record:', (error as Error).message);
      return false;
    }
  }

  // Logistics Tracking
  async createLogisticsTracking(logisticsData: InsertLogisticsTracking): Promise<LogisticsTracking> {
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
      deliveryNotes: logisticsData.deliveryNotes ?? null,
    });
    const created = await this.getLogisticsTrackingById(id);
    if (!created) throw new Error("Failed to create logistics tracking");
    return created;
  }

  async getLogisticsTracking(): Promise<LogisticsTrackingWithSample[]> {
    const rows = await db
      .select({ lt: logisticsTracking, sample: samples, lead: leads })
      .from(logisticsTracking)
      .leftJoin(samples, eq(logisticsTracking.sampleId, samples.id))
      .leftJoin(leads, eqUtf8Columns(samples.projectId, leads.projectId));
    return rows.map((row: any) => ({
      ...(row.lt as any),
      sample: row.sample ? {
        ...(row.sample as any),
        lead: row.lead as any,
      } : null,
    }));
  }

  async getLogisticsTrackingById(id: string): Promise<LogisticsTracking | undefined> {
    const rows = await db.select().from(logisticsTracking).where(eq(logisticsTracking.id, id)).limit(1);
    return rows[0];
  }

  async updateLogisticsTracking(id: string, updates: Partial<LogisticsTracking>): Promise<LogisticsTracking | undefined> {
    await db.update(logisticsTracking).set(updates as any).where(eq(logisticsTracking.id, id));
    return this.getLogisticsTrackingById(id);
  }

  // Pricing
  async createPricing(pricingData: InsertPricing): Promise<Pricing> {
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
      notes: pricingData.notes ?? null,
    });
    const created = await this.getPricingById(id);
    if (!created) throw new Error("Failed to create pricing");
    return created;
  }

  async getPricing(): Promise<Pricing[]> {
    return db.select().from(pricing);
  }

  async getPricingById(id: string): Promise<Pricing | undefined> {
    const rows = await db.select().from(pricing).where(eq(pricing.id, id)).limit(1);
    return rows[0];
  }

  async updatePricing(id: string, updates: Partial<Pricing>): Promise<Pricing | undefined> {
    await db.update(pricing).set(updates as any).where(eq(pricing.id, id));
    return this.getPricingById(id);
  }

  // Genetic counselling implementations
  async createGeneticCounselling(record: Partial<any>): Promise<any> {
    const toDbDate = (v: any) => {
      if (!v) return null;
      if (v instanceof Date) return v;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };
    const toDecimal = (v: any) => {
      if (v === null || v === undefined || v === '') return null;
      const num = Number(v);
      return isNaN(num) ? null : String(num);
    };
    const toBoolean = (v: any) => !!v;
    const toString = (v: any) => {
      if (v === null || v === undefined) return null;
      return String(v).trim() === '' ? null : String(v).trim();
    };

    // Debug: log incoming record
    console.log('createGeneticCounselling received record:', {
      uniqueId: record.uniqueId,
      patientClientName: record.patientClientName,
      age: record.age,
      serviceName: record.serviceName,
      budget: record.budget,
      sampleType: record.sampleType
    });

    // Map incoming fields (from frontend camelCase or snake_case) to schema fields
    // Properly handle all field mappings from lead data
    const dbRecord: any = {
      uniqueId: toString(record.uniqueId || record.unique_id || record.sampleId || record.sample_id) || '',
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
      approvalFromHead: toBoolean(record.approvalFromHead ?? record.approval_from_head ?? record.approvalStatus === 'approved'),
      clinicianResearcherName: toString(record.clinicianResearcherName || record.clinician_researcher_name),
      organisationHospital: toString(record.organisationHospital || record.organisation_hospital),
      speciality: toString(record.speciality),
      querySuspection: toString(record.querySuspection || record.query_suspection),
      gcName: toString(record.gcName || record.gc_name) || '',
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
      remarkComment: toString(record.remarkComment || record.remark_comment),
    };

    // Debug: log mapped record before insert
    console.log('createGeneticCounselling mapped dbRecord:', {
      uniqueId: dbRecord.uniqueId,
      patientClientName: dbRecord.patientClientName,
      age: dbRecord.age,
      serviceName: dbRecord.serviceName,
      budget: dbRecord.budget,
      sampleType: dbRecord.sampleType
    });

    // Check if record already exists for this uniqueId to prevent duplicates
    const existingRows = await db.select().from((await import('@shared/schema')).geneticCounselling)
      .where(eq((await import('@shared/schema')).geneticCounselling.uniqueId as any, dbRecord.uniqueId))
      .limit(1);

    if (existingRows && existingRows.length > 0) {
      console.log('GC record already exists for uniqueId:', dbRecord.uniqueId, '- returning existing record instead of creating duplicate');
      return existingRows[0];
    }

    await db.insert((await import('@shared/schema')).geneticCounselling).values(dbRecord as any);
    // Return the latest row for this uniqueId
    const rows = await db.select().from((await import('@shared/schema')).geneticCounselling)
      .where(eq((await import('@shared/schema')).geneticCounselling.uniqueId as any, dbRecord.uniqueId))
      .orderBy(desc((await import('@shared/schema')).geneticCounselling.id as any))
      .limit(1);
    return rows[0];
  }

  async getGeneticCounselling(): Promise<any[]> {
    const rows = await db.select().from((await import('@shared/schema')).geneticCounselling);
    return rows;
  }

  async updateGeneticCounselling(id: string, updates: Partial<any>): Promise<any | undefined> {
    const toDecimal = (v: any) => {
      if (v === null || v === undefined || v === '') return null;
      const num = Number(v);
      return isNaN(num) ? null : String(num);
    };
    const toBoolean = (v: any) => v !== null && v !== undefined && v !== '' ? !!v : undefined;

    const safe: any = {};
    // Map incoming fields to schema fields, handling both camelCase and snake_case
    if (updates.uniqueId || updates.unique_id) safe.uniqueId = updates.uniqueId || updates.unique_id;
    if (updates.projectId || updates.project_id) safe.projectId = Number(updates.projectId || updates.project_id);
    if (updates.counsellingDate || updates.counselling_date) safe.counsellingDate = updates.counsellingDate || updates.counselling_date;
    if (updates.gcRegistrationStartTime || updates.gc_registration_start_time) safe.gcRegistrationStartTime = updates.gcRegistrationStartTime || updates.gc_registration_start_time;
    if (updates.gcRegistrationEndTime || updates.gc_registration_end_time) safe.gcRegistrationEndTime = updates.gcRegistrationEndTime || updates.gc_registration_end_time;
    if (updates.patientClientName || updates.patient_client_name) safe.patientClientName = updates.patientClientName || updates.patient_client_name;
    if (updates.age !== undefined) safe.age = updates.age ? Number(updates.age) : null;
    if (updates.gender) safe.gender = updates.gender;
    if (updates.patientClientEmail || updates.patient_client_email) safe.patientClientEmail = updates.patientClientEmail || updates.patient_client_email;
    if (updates.patientClientPhone || updates.patient_client_phone) safe.patientClientPhone = updates.patientClientPhone || updates.patient_client_phone;
    if (updates.patientClientAddress || updates.patient_client_address) safe.patientClientAddress = updates.patientClientAddress || updates.patient_client_address;
    if (updates.paymentStatus || updates.payment_status) safe.paymentStatus = updates.paymentStatus || updates.payment_status;
    if (updates.modeOfPayment || updates.mode_of_payment) safe.modeOfPayment = updates.modeOfPayment || updates.mode_of_payment;
    if (updates.approvalFromHead !== undefined || updates.approval_from_head !== undefined) safe.approvalFromHead = toBoolean(updates.approvalFromHead ?? updates.approval_from_head);
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
    if (updates.potentialPatientForTestingInFuture !== undefined || updates.potential_patient_for_testing_in_future !== undefined) safe.potentialPatientForTestingInFuture = toBoolean(updates.potentialPatientForTestingInFuture ?? updates.potential_patient_for_testing_in_future);
    if (updates.extendedFamilyTestingRequirement !== undefined || updates.extended_family_testing_requirement !== undefined) safe.extendedFamilyTestingRequirement = toBoolean(updates.extendedFamilyTestingRequirement ?? updates.extended_family_testing_requirement);
    if (updates.budget) safe.budget = toDecimal(updates.budget);
    if (updates.sampleType || updates.sample_type) safe.sampleType = updates.sampleType || updates.sample_type;
    if (updates.gcSummarySheet || updates.gc_summary || updates.gc_summary_sheet) safe.gcSummarySheet = updates.gcSummarySheet || updates.gc_summary || updates.gc_summary_sheet;
    if (updates.gcVideoLink || updates.gc_video_link) safe.gcVideoLink = updates.gcVideoLink || updates.gc_video_link;
    if (updates.gcAudioLink || updates.gc_audio_link) safe.gcAudioLink = updates.gcAudioLink || updates.gc_audio_link;
    if (updates.salesResponsiblePerson || updates.sales_responsible_person) safe.salesResponsiblePerson = updates.salesResponsiblePerson || updates.sales_responsible_person;
    if (updates.modifiedBy || updates.modified_by) safe.modifiedBy = updates.modifiedBy || updates.modified_by;
    if (updates.remarkComment || updates.remark_comment) safe.remarkComment = updates.remarkComment || updates.remark_comment;

    if (Object.keys(safe).length === 0) {
      const numId = Number(id);
      const rows = await db.select().from((await import('@shared/schema')).geneticCounselling).where(eq((await import('@shared/schema')).geneticCounselling.id as any, numId as any)).limit(1);
      return rows[0];
    }

    const numId = Number(id);
    await db.update((await import('@shared/schema')).geneticCounselling).set(safe).where(eq((await import('@shared/schema')).geneticCounselling.id as any, numId as any));
    const rows = await db.select().from((await import('@shared/schema')).geneticCounselling).where(eq((await import('@shared/schema')).geneticCounselling.id as any, numId as any)).limit(1);
    return rows[0];
  }

  async deleteGeneticCounselling(id: string): Promise<boolean> {
    try {
      try {
        const numId = Number(id);
        const gc = await db.select().from((await import('@shared/schema')).geneticCounselling).where(eq((await import('@shared/schema')).geneticCounselling.id as any, numId as any)).limit(1);
        if (gc[0]) {
          const { recycleBin } = await import('@shared/schema');
          await db.insert(recycleBin).values({ id: randomUUID(), entityType: 'genetic_counselling', entityId: id, data: gc[0], originalPath: `/genetic-counselling/${id}` });
        }
      } catch (e) {
        console.error('Failed to create recycle snapshot for genetic counselling:', (e as Error).message);
      }

      const numId = Number(id);
      await db.delete((await import('@shared/schema')).geneticCounselling).where(eq((await import('@shared/schema')).geneticCounselling.id as any, numId as any));
      return true;
    } catch (error) {
      console.error('Failed to delete genetic counselling record:', (error as Error).message);
      return false;
    }
  }

  // Recycle implementations
  async createRecycleEntry(payload: { entityType: string; entityId?: string | null; data: any; originalPath?: string | null; createdBy?: string | null }): Promise<any> {
    const id = randomUUID();
    const { recycleBin } = await import('@shared/schema');
    await db.insert(recycleBin).values({ id, entityType: payload.entityType, entityId: payload.entityId ?? null, data: payload.data ?? null, originalPath: payload.originalPath ?? null, createdBy: payload.createdBy ?? null });
    const row = await db.select().from(recycleBin).where(eq(recycleBin.id, id)).limit(1);
    return row[0];
  }

  async listRecycleEntries(): Promise<any[]> {
    const { recycleBin } = await import('@shared/schema');
    const rows = await db.select().from(recycleBin).orderBy(desc(recycleBin.deletedAt));
    // Return timestamps as-is from database (already in server timezone)
    // Don't convert to ISO which would shift the timezone
    return rows;
  }

  async getRecycleEntry(id: string): Promise<any | undefined> {
    const { recycleBin } = await import('@shared/schema');
    const rows = await db.select().from(recycleBin).where(eq(recycleBin.id, id)).limit(1);
    if (!rows[0]) return undefined;
    // Return as-is from database (already in server timezone)
    return rows[0];
  }

  async deleteRecycleEntry(id: string): Promise<boolean> {
    try {
      const { recycleBin } = await import('@shared/schema');
      await db.delete(recycleBin).where(eq(recycleBin.id, id));
      return true;
    } catch (error) {
      console.error('Failed to delete recycle entry:', (error as Error).message);
      return false;
    }
  }

  async restoreRecycleEntry(id: string): Promise<any> {
    // conservative restore: attempt to re-insert the data back into its original table
    const entry = await this.getRecycleEntry(id);
    if (!entry) throw new Error('Recycle entry not found');

    const entityType = entry.entityType;
    const data = entry.data || {};

    try {
      // Normalize date-like strings into JS Date objects so the DB driver
      // doesn't attempt to call .toISOString on non-Date values.
      const normalizeDates = (v: any): any => {
        if (v == null) return v;
        if (typeof v === 'string') {
          // Try creating a Date; if valid, use it. This is permissive but
          // avoids false positives by checking getTime().
          const d = new Date(v);
          if (!isNaN(d.getTime())) return d;
          return v;
        }
        if (Array.isArray(v)) return v.map(normalizeDates);
        if (typeof v === 'object') {
          const out: any = {};
          for (const k of Object.keys(v)) out[k] = normalizeDates(v[k]);
          return out;
        }
        return v;
      };

      // Normalize the data first so all insertion paths operate on the same
      // date-normalized payload. This prevents driver code from calling
      // toISOString on plain strings (the root cause of the earlier error).
      const normalizedData = normalizeDates(data);

      // Before attempting insertion, log a concise types report to help
      // debug failures caused by unexpected value shapes
      try {
        const buildTypesReport = (v: any): any => {
          if (v == null) return { type: String(v) };
          if (Array.isArray(v)) return v.slice(0, 5).map(buildTypesReport);
          if (typeof v === 'object') {
            const out: any = {};
            for (const k of Object.keys(v)) {
              const val = v[k];
              out[k] = val == null ? String(val) : (val instanceof Date ? 'Date' : typeof val === 'object' ? (Array.isArray(val) ? 'Array' : 'Object') : typeof val);
            }
            return out;
          }
          return typeof v;
        };

        const typesReport = buildTypesReport(normalizedData);
        console.error('Restore types report for', entityType, ':', JSON.stringify(typesReport));
      } catch (logErr) {
        console.error('Failed to build types report for restore:', (logErr as Error).message);
      }

      switch (entityType) {
        case 'users':
          // beware of password field; if present, keep it
          await db.insert(users).values(normalizedData as any);
          break;
        case 'leads':
          await db.insert(leads).values(normalizedData as any);
          break;
        case 'samples':
          await db.insert(samples).values(normalizedData as any);
          break;
        case 'lab_processing':
          await db.insert(labProcessingTable).values(normalizedData as any);
          break;
        case 'finance_sheet':
          await db.insert(financeRecords).values(normalizedData as any);
          break;
        case 'genetic_counselling':
          await db.insert((await import('@shared/schema')).geneticCounselling).values(normalizedData as any);
          break;
        case 'reports':
          await db.insert(reportsTable).values(normalizedData as any);
          break;
        default:
          // If unknown type, just return the data - client can re-create via existing APIs
          return data;
      }

      // on success, remove the recycle entry
      await this.deleteRecycleEntry(id);
      return { ok: true, restored: true, entityType };
    } catch (err) {
      console.error('Failed to restore recycle entry:', (err as Error).message);
      throw err;
    }
  }

  // Sales Activities
  async createSalesActivity(activityData: InsertSalesActivity): Promise<SalesActivity> {
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
      attachments: activityData.attachments ?? null,
    });
    const created = await this.getSalesActivityById(id);
    if (!created) throw new Error("Failed to create sales activity");
    return created;
  }

  async getSalesActivities(): Promise<SalesActivity[]> {
    return db.select().from(salesActivities);
  }

  async getSalesActivityById(id: string): Promise<SalesActivity | undefined> {
    const rows = await db.select().from(salesActivities).where(eq(salesActivities.id, id)).limit(1);
    return rows[0];
  }

  async updateSalesActivity(id: string, updates: Partial<SalesActivity>): Promise<SalesActivity | undefined> {
    await db.update(salesActivities).set(updates as any).where(eq(salesActivities.id, id));
    return this.getSalesActivityById(id);
  }

  // Clients
  async createClient(clientData: InsertClient): Promise<Client> {
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
      tags: clientData.tags ?? null,
    });
    const created = await this.getClientById(id);
    if (!created) throw new Error("Failed to create client");
    return created;
  }

  async getClients(): Promise<Client[]> {
    return db.select().from(clients);
  }

  async getClientById(id: string): Promise<Client | undefined> {
    const rows = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return rows[0];
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined> {
    await db.update(clients).set(updates as any).where(eq(clients.id, id));
    return this.getClientById(id);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const now = new Date();
    await db.insert(notificationsTable).values({
      id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead ?? false,
      relatedId: notification.relatedId ?? null,
      createdAt: now,
    });
    const rows = await db.select().from(notificationsTable).where(eq(notificationsTable.id, id)).limit(1);
    if (!rows[0]) throw new Error("Failed to create notification");
    return rows[0];
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return db.select().from(notificationsTable).where(eq(notificationsTable.userId, userId));
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const res = await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id));
    // If needed, check affected rows by fetching back
    const row = await db.select().from(notificationsTable).where(eq(notificationsTable.id, id)).limit(1);
    return !!row[0]?.isRead;
  }

  async deleteNotification(id: string): Promise<boolean> {
    console.log('Attempting to delete notification with ID:', id);

    try {
      const res = await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
      console.log('Delete executed');

      // Always return true if the notification no longer exists after the delete operation
      // This handles the case where the notification was successfully deleted
      const check = await db.select().from(notificationsTable).where(eq(notificationsTable.id, id)).limit(1);
      const success = check.length === 0;
      console.log('Notification exists after delete:', check.length > 0, 'Success:', success);

      return success; // Return true if notification no longer exists (deletion successful)
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  async getDashboardStats(): Promise<{ activeLeads: number; samplesProcessing: number; pendingRevenue: number; reportsPending: number; }> {
    if (!this.connectionWorking) {
      // Return mock data when database is not available
      return {
        activeLeads: 12,
        samplesProcessing: 8,
        pendingRevenue: 145000,
        reportsPending: 3
      };
    }

    try {
      const leadsRows = await db.select().from(leads).where(eq(leads.status, "cold"));
      const samplesRows = await db.select().from(samples);
      const reportsRows = await db.select().from(reportsTable).where(eq(reportsTable.status, "awaiting_approval"));
      const activeLeads = leadsRows.length;
      const samplesProcessing = samplesRows.filter((s: any) => ["received", "lab_processing", "bioinformatics"].includes((s as any).status ?? "")).length;
      const pendingRevenue = samplesRows.reduce((sum: number, s: any) => sum + Number(s.amount ?? 0) - Number(s.paidAmount ?? 0), 0);
      const reportsPending = reportsRows.length;
      return { activeLeads, samplesProcessing, pendingRevenue, reportsPending };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data on error
      return {
        activeLeads: 12,
        samplesProcessing: 8,
        pendingRevenue: 145000,
        reportsPending: 3
      };
    }
  }

  async getFinanceStats(): Promise<{ totalRevenue: number; pendingPayments: number; pendingApprovals: number; }> {
    const samplesRows = await db.select().from(samples);
    const reportsRows = await db.select().from(reportsTable).where(eq(reportsTable.status, "awaiting_approval"));
    const totalRevenue = samplesRows.reduce((sum: number, s: any) => sum + Number(s.paidAmount ?? 0), 0);
    const pendingPayments = samplesRows.reduce((sum: number, s: any) => sum + (Number(s.amount ?? 0) - Number(s.paidAmount ?? 0)), 0);
    const pendingApprovals = reportsRows.length;
    return { totalRevenue, pendingPayments, pendingApprovals };
  }

  async getPendingFinanceApprovals(): Promise<SampleWithLead[]> {
    const rows = await db
      .select({ r: reportsTable, sample: samples, lead: leads })
      .from(reportsTable)
      .leftJoin(samples, eq(reportsTable.sampleId, samples.id))
      .leftJoin(leads, eqUtf8Columns(samples.projectId, leads.projectId))
      .where(eq(reportsTable.status, "awaiting_approval"));
    return rows.map((row: any) => ({
      ...(row.sample as any),
      lead: row.lead as any,
    }));
  }

  // BIOINFORMATICS METHODS

  async sendLabProcessingToBioinformatics(
    recordId: string,
    tableType: 'discovery' | 'clinical'
  ): Promise<BioinformaticsSheetDiscovery | BioinformaticsSheetClinical | undefined> {
    try {
      // Get the lab processing record
      const labSheet = tableType === 'discovery' ? labProcessDiscoverySheet : labProcessClinicalSheet;
      const labRows = await db.select().from(labSheet).where(eq(labSheet.uniqueId, recordId)).limit(1);
      if (labRows.length === 0) throw new Error("Lab processing record not found");

      const labRecord = labRows[0] as any;

      // Get matching lead data
      const leadRows = await db
        .select()
        .from(leads)
        .where(eqUtf8Columns(leads.uniqueId, labRecord.uniqueId))
        .limit(1);
      const leadRecord = leadRows[0] as any;

      // Prepare bioinformatics payload
      const bioData: any = {
        uniqueId: labRecord.uniqueId,
        projectId: labRecord.projectId || (leadRecord?.projectId ? parseInt(String(leadRecord.projectId)) : undefined),
        sampleId: labRecord.sampleId || (leadRecord?.id),
        clientId: labRecord.clientId || (leadRecord?.id),
        organisationHospital: labRecord.organisationHospital || leadRecord?.organisationHospital,
        clinicianResearcherName: labRecord.clinicianResearcherName || leadRecord?.clinicianResearcherName,
        patientClientName: labRecord.patientClientName || leadRecord?.patientClientName,
        age: labRecord.age ?? leadRecord?.age,
        gender: labRecord.gender || leadRecord?.gender,
        serviceName: labRecord.serviceName || leadRecord?.serviceName,
        noOfSamples: labRecord.noOfSamples ?? leadRecord?.noOfSamples,
        tat: leadRecord?.tat,
        createdBy: 'System',
      };

      // Check if record already exists (by uniqueId)
      const bioSheet = tableType === 'discovery' ? bioinformaticsSheetDiscovery : bioinformaticsSheetClinical;
      const existingRows = await db
        .select()
        .from(bioSheet)
        .where(eq(bioSheet.uniqueId, labRecord.uniqueId))
        .limit(1);

      let bioRecord: any;
      if (existingRows.length > 0) {
        // Update existing record
        bioRecord = existingRows[0];
        // Update fields (do not create duplicate)
        await db
          .update(bioSheet)
          .set({
            ...bioData,
            modifiedAt: new Date(),
            modifiedBy: 'System',
          })
          .where(eq(bioSheet.uniqueId, labRecord.uniqueId));
      } else {
        // Create new record
        await db.insert(bioSheet).values(bioData as any);
        const newRows = await db
          .select()
          .from(bioSheet)
          .where(eq(bioSheet.uniqueId, labRecord.uniqueId))
          .limit(1);
        bioRecord = newRows[0];
      }

      // Update lab processing record to mark as sent
      await db
        .update(labSheet)
        .set({
          alertToBioinformaticsTeam: true,
          modifiedAt: new Date(),
          modifiedBy: 'System',
        })
        .where(eq(labSheet.uniqueId, labRecord.uniqueId));

      return bioRecord;
    } catch (error) {
      console.error('Error sending lab processing to bioinformatics:', (error as Error).message);
      throw error;
    }
  }

  async createBioinformaticsRecord(
    data: InsertBioinformaticsSheetDiscovery | InsertBioinformaticsSheetClinical,
    tableType: 'discovery' | 'clinical'
  ): Promise<BioinformaticsSheetDiscovery | BioinformaticsSheetClinical> {
    const bioSheet = tableType === 'discovery' ? bioinformaticsSheetDiscovery : bioinformaticsSheetClinical;
    await db.insert(bioSheet).values(data as any);
    const rows = await db
      .select()
      .from(bioSheet)
      .where(eq(bioSheet.uniqueId, (data as any).uniqueId))
      .limit(1);
    if (rows.length === 0) throw new Error("Failed to create bioinformatics record");
    return rows[0] as any;
  }

  // ============================================================================
  // File Upload Tracking (stores metadata about uploaded files)
  // ============================================================================

  async createFileUpload(uploadData: {
    filename: string;
    originalName: string;
    storagePath: string;
    category: string;
    fileSize: number;
    mimeType: string;
    uploadedBy?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }): Promise<any> {
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
        uploadData.relatedEntityId || null,
      ]);
      return { id, ...uploadData, createdAt: new Date() };
    } catch (error) {
      console.error('Failed to create file upload record:', (error as Error).message);
      throw error;
    }
  }

  async getFileUploadsByCategory(category: string): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM file_uploads 
        WHERE category = ? AND is_deleted = 0
        ORDER BY created_at DESC
      `;
      const [rows] = await pool.execute(query, [category]);
      return (rows as any[]) || [];
    } catch (error) {
      console.error('Failed to get file uploads by category:', (error as Error).message);
      return [];
    }
  }

  async getFileUploadsByEntity(entityType: string, entityId: string): Promise<any[]> {
    try {
      const query = `
        SELECT * FROM file_uploads 
        WHERE related_entity_type = ? AND related_entity_id = ? AND is_deleted = 0
        ORDER BY created_at DESC
      `;
      const [rows] = await pool.execute(query, [entityType, entityId]);
      return (rows as any[]) || [];
    } catch (error) {
      console.error('Failed to get file uploads by entity:', (error as Error).message);
      return [];
    }
  }

  async getFileUploadById(id: string): Promise<any | undefined> {
    try {
      const query = `
        SELECT * FROM file_uploads 
        WHERE id = ? AND is_deleted = 0
        LIMIT 1
      `;
      const [rows] = await pool.execute(query, [id]);
      return (rows as any[])?.[0];
    } catch (error) {
      console.error('Failed to get file upload by ID:', (error as Error).message);
      return undefined;
    }
  }

}

export const storage = new DBStorage();
