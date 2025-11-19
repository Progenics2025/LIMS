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
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { db, pool } from "./db";
import { and, eq, sql, asc, desc } from "drizzle-orm";

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
  createLeadTrf(leadTrf: { leadId: string; filename: string; data: Buffer }): Promise<{ id: string; filename: string }>;
  getLeadTrf(id: string): Promise<{ id: string; filename: string; data: Buffer } | undefined>;
  
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
  createGeneticCounselling(record: { sampleId: string; gcName: string; counsellingType?: string; counsellingStartTime?: Date | string | null; counsellingEndTime?: Date | string | null; gcSummary?: string | null; extendedFamilyTesting?: boolean; approvalStatus?: string; }): Promise<any>;
  getGeneticCounselling(): Promise<any[]>;
  updateGeneticCounselling(id: string, updates: Partial<any>): Promise<any | undefined>;
  deleteGeneticCounselling(id: string): Promise<boolean>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<boolean>;
  deleteNotification(id: string): Promise<boolean>;
  
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
      leadTypeDiscovery: insertLead.leadTypeDiscovery ?? null,
      budget: insertLead.budget ?? null,
      noOfSamples: insertLead.noOfSamples ?? null,
      patientClientName: insertLead.patientClientName ?? null,
      age: insertLead.age ?? null,
      gender: insertLead.gender ?? null,
      patientClientPhone: insertLead.patientClientPhone ?? null,
      patientClientEmail: insertLead.patientClientEmail ?? null,
      salesResponsiblePerson: insertLead.salesResponsiblePerson ?? null,
      geneticCounsellorRequired: (insertLead as any).geneticCounsellorRequired ?? false,
      dateSampleReceived: insertLead.dateSampleReceived ?? null,
      dateSampleCollected: (insertLead as any).dateSampleCollected ?? null,
      // Pickup / tracking fields
      pickupFrom: insertLead.pickupFrom ?? null,
      pickupUpto: insertLead.pickupUpto ?? null,
      shippingAmount: insertLead.shippingAmount ?? null,
      trackingId: insertLead.trackingId ?? null,
      courierCompany: insertLead.courierCompany ?? null,
      progenicsTRF: insertLead.progenicsTRF ?? null,
      phlebotomistCharges: insertLead.phlebotomistCharges ?? null,
    });
    const created = await this.getLeadById(id);
    if (!created) throw new Error("Failed to create lead");
    return created;
  }

  async createLeadTrf(leadTrf: { leadId: string; filename: string; data: Buffer }): Promise<{ id: string; filename: string }> {
    const id = randomUUID();
    try {
      // store binary data as base64 string in lead_trfs.data text column
      const base64 = leadTrf.data.toString('base64');
      await db.insert((await import('@shared/schema')).leadTrfs).values({ id, leadId: leadTrf.leadId, filename: leadTrf.filename, data: base64 });
      return { id, filename: leadTrf.filename };
    } catch (error) {
      console.error('Failed to insert lead TRF into DB', (error as Error).message);
      throw error;
    }
  }

  async getLeadTrf(id: string): Promise<{ id: string; filename: string; data: Buffer } | undefined> {
    try {
  const schema = await import('@shared/schema');
  const rows = await db.select().from(schema.leadTrfs).where(eq(schema.leadTrfs.id, id)).limit(1);
      const row = rows[0] as any;
      if (!row) return undefined;
      // data stored as base64 string
      const buf = Buffer.from(row.data || '', 'base64');
      return { id: row.id, filename: row.filename, data: buf };
    } catch (error) {
      console.error('Failed to fetch lead TRF from DB', (error as Error).message);
      return undefined;
    }
  }

  async getLeads(userRole?: string | null, userId?: string | null): Promise<LeadWithUser[]> {
    if (!this.connectionWorking) {
      // Return mock data when database is not available
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
          createdAt: new Date(),
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
          leadTypeDiscovery: null,
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
          createdAt: new Date(),
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
          leadTypeDiscovery: "Research",
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
          dateSampleReceived: new Date(),
          dateSampleCollected: null
        }
      ];
    }
    
    try {
      // Include the sample row (if any) so UI can show the generated sample_id immediately
      // Build optional where condition based on role
      let whereCondition = undefined;
      if (userRole && userRole.toLowerCase() === 'sales' && userId) {
        whereCondition = eq(leads.createdBy, userId);
      }

      // Construct query with conditional where clause
      let queryBuilder = db
        .select({ lead: leads, user: users, sample: samples })
        .from(leads)
        .leftJoin(samples, eq(samples.leadId, leads.id))
        .leftJoin(users, eq(leads.createdBy, users.id)) as any;

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
      // Return mock data on error
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
          createdAt: new Date(),
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
          leadTypeDiscovery: null,
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
      .where(and(eq(leads.email, email), eq(leads.phone, phone)))
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
      
      console.log('Converting lead:', lead.id, 'category:', lead.category);
      console.log('Sample data:', sampleData);

      return await db.transaction(async (tx) => {
        // Update lead status
        await tx.update(leads).set({ status: "converted", convertedAt: new Date() } as any).where(eq(leads.id, leadId));
        console.log('✅ Lead status updated to converted');
        
        // Generate sample ID
        const sampleIdStr = this.generateSampleId(lead.category || "clinical");
        const sampleId = randomUUID();
        console.log('✅ Generated sample ID:', sampleIdStr, 'UUID:', sampleId);
        
    // Create sample
  await tx.insert(samples).values({
          id: sampleId,
          sampleId: sampleIdStr,
          leadId: leadId,
              status: sampleData.status ?? "pickup_scheduled",
              courierDetails: sampleData.courierDetails ?? null,
              amount: sampleData.amount,
              paidAmount: sampleData.paidAmount ?? "0",
              // New tracking fields
      // Extra tracking fields (may not be in InsertSample type) - cast to any
      ...( { titleUniqueId: sampleData.titleUniqueId ?? null } as any),
      ...( { sampleUniqueId: sampleData.sampleUniqueId ?? null } as any),
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
        });
        console.log('✅ Sample created in database');
        
            // Create a minimal finance record linked to this sample
            const financeId = randomUUID();
            await tx.insert(financeRecords).values({
              id: financeId,
              sampleId: sampleId,
              leadId: leadId,
              invoiceNumber: sampleData.invoiceNumber ?? null,
              amount: sampleData.amount ?? "0",
              taxAmount: sampleData.taxAmount ?? "0",
              totalAmount: sampleData.totalAmount ?? sampleData.amount ?? "0",
              paymentStatus: 'pending',
              paymentMethod: sampleData.paymentMethod ?? null,
              paymentDate: null,
              dueDate: null,
              createdAt: new Date(),
              currency: sampleData.currency ?? 'INR',
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
              serviceName: sampleData.serviceName ?? null,
            });

            // Create a minimal lab_processing record linked to this sample
            const labId = randomUUID();
      await tx.insert(labProcessingTable).values({
              id: labId,
              sampleId: sampleId,
              labId: sampleData.labId ?? 'default',
              qcStatus: sampleData.qcStatus ?? 'pending',
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
              humidity: sampleData.humidity ?? null,
            });

            console.log('✅ Finance and lab_processing placeholders created');

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
                const gcId = randomUUID();
                await tx.insert((await import('@shared/schema')).geneticCounselling).values({
                  id: gcId,
                  sampleId: sampleIdStr,
                  gcName: '',
                  counsellingType: null,
                  counsellingStartTime: null,
                  counsellingEndTime: null,
                  gcSummary: null,
                  extendedFamilyTesting: false,
                  approvalStatus: 'pending',
                });
                const gcRows = await tx.select().from((await import('@shared/schema')).geneticCounselling).where(eq((await import('@shared/schema')).geneticCounselling.id, gcId)).limit(1);
                createdGc = gcRows[0] ?? null;
                console.log('✅ Genetic counselling record created for sample', sampleIdStr);
              }
            } catch (err) {
              console.error('Failed to create genetic counselling record during conversion:', (err as Error).message);
            }

            // Fetch the updated lead, created finance and lab rows to return a complete response
            const updatedLeadRows = await tx.select().from(leads).where(eq(leads.id, leadId)).limit(1);
            const updatedLead = updatedLeadRows[0] as Lead;

            const financeRows = await tx.select().from(financeRecords).where(eq(financeRecords.id, financeId)).limit(1);
            const createdFinance = financeRows[0] as FinanceRecord | undefined;

            const labRows = await tx.select().from(labProcessingTable).where(eq(labProcessingTable.id, labId)).limit(1);
            const createdLab = labRows[0] as LabProcessing | undefined;

            return { lead: updatedLead, sample: { 
          id: sampleId,
          sampleId: sampleIdStr,
          leadId: leadId,
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
    createdAt: new Date()
  } as any, finance: createdFinance, labProcessing: createdLab, geneticCounselling: createdGc };
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
      .leftJoin(leads, eq(samples.leadId, leads.id));
    return rows.map((row: any) => ({
      ...(row.sample as any),
      lead: row.lead as any,
    }));
  }

  async getSampleById(id: string): Promise<Sample | undefined> {
    const rows = await db.select().from(samples).where(eq(samples.id, id)).limit(1);
    return rows[0];
  }

  async updateSample(id: string, updates: Partial<Sample>): Promise<Sample | undefined> {
    await db.update(samples).set(updates as any).where(eq(samples.id, id));
    return this.getSampleById(id);
  }

  async deleteSample(id: string): Promise<boolean> {
    try {
      try {
        const rows = await db.select().from(samples).where(eq(samples.id, id)).limit(1);
        if (rows[0]) {
          const { recycleBin } = await import('@shared/schema');
          await db.insert(recycleBin).values({ id: randomUUID(), entityType: 'samples', entityId: id, data: rows[0], originalPath: `/samples/${id}` });
        }
      } catch (e) {
        console.error('Failed to create recycle snapshot for sample:', (e as Error).message);
      }

      await db.delete(samples).where(eq(samples.id, id));
      return true;
    } catch (error) {
      console.error('Failed to delete sample:', (error as Error).message);
      return false;
    }
  }

  async createLabProcessing(labData: InsertLabProcessing): Promise<LabProcessing> {
    const id = randomUUID();
    // Resolve sampleId: callers may provide either the internal UUID (samples.id)
    // or the human-readable sample code (samples.sampleId). Try to resolve to
    // the internal UUID so joins in getLabProcessingQueue() work reliably.
    let resolvedSampleId = labData.sampleId;
    try {
      const byId = await db.select().from(samples).where(eq(samples.id, labData.sampleId)).limit(1);
      if (!byId[0]) {
        const byHuman = await db.select().from(samples).where(eq(samples.sampleId, labData.sampleId)).limit(1);
        if (byHuman[0]) resolvedSampleId = (byHuman[0] as any).id;
        else throw new Error(`Sample not found for sample identifier: ${labData.sampleId}`);
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
      .leftJoin(leads, eq(samples.leadId, leads.id));
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
      .leftJoin(leads, eq(samples.leadId, leads.id));
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
      createdBy: financeData.createdBy ?? null,
    });
    const created = await this.getFinanceRecordById(id);
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
      invoiceDate: financeRecords.paymentDate,
      invoiceAmount: financeRecords.totalAmount,
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
        'fr.invoice_number',
        'fr.id',
        // ensure we match sample id whether it's stored on finance_records or samples
        'fr.sample_id',
        's.sample_id',
        'fr.patient_name',
        'fr.organization',
        'l.organization',
      ];
      const whereParts = searchCols.map(() => `?`).map((p, i) => `${searchCols[i]} LIKE ${p}`);
      const whereClause = `WHERE ${whereParts.join(' OR ')}`;
      const orderClause = orderExpr ? `ORDER BY ${typeof orderExpr === 'string' ? orderExpr : 'fr.created_at'} ${sortDir === 'asc' ? 'ASC' : 'DESC'}` : `ORDER BY fr.created_at DESC`;
  const sqlQuery = `SELECT fr.*, s.id as s_id, s.sample_id as s_sample_id, s.*, l.*, lp.title_unique_id as lp_title_unique_id FROM finance_records fr LEFT JOIN samples s ON fr.sample_id = s.id LEFT JOIN leads l ON fr.lead_id = l.id LEFT JOIN lab_processing lp ON lp.sample_id = s.id ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
      // bindings: one 'like' per search column, followed by pageSize and offset
      const likeBindings = searchCols.map(() => like);
      const bindings: any[] = [...likeBindings, pageSize, offset];
      try {
        const [resultRows] = await pool.execute(sqlQuery, bindings) as any;
        rows = resultRows as any[];
        // count total matching - reuse whereClause and likeBindings
        const countSql = `SELECT COUNT(*) as cnt FROM finance_records fr LEFT JOIN samples s ON fr.sample_id = s.id LEFT JOIN leads l ON fr.lead_id = l.id ${whereClause}`;
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
        .leftJoin(samples, eq(financeRecords.sampleId, samples.id))
        .leftJoin(leads, eq(financeRecords.leadId, leads.id))
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
        return {
          ...fr,
          ...(titleUniqueId != null ? { titleUniqueId } : {}),
          sample: sample ? { ...sample, lead: row.lead as any } : null,
        };
      });
    } else {
      // Raw SQL flat rows
      mapped = rows.map((r: any) => {
        const title_unique_id = r.title_unique_id ?? r.lp_title_unique_id ?? r.id /* lead.id may shadow; raw rows include l.* so r.id might be ambiguous */ ?? null;
        const obj: any = { ...r };
        if (title_unique_id != null) {
          obj.title_unique_id = title_unique_id;
          if (obj.titleUniqueId == null) obj.titleUniqueId = title_unique_id;
        }
        return obj;
      });
    }
    return { rows: mapped, total };
  }

  async getFinanceRecordById(id: string): Promise<FinanceRecord | undefined> {
    const rows = await db.select().from(financeRecords).where(eq(financeRecords.id, id)).limit(1);
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
        await db.update(financeRecords).set(safeUpdates as any).where(eq(financeRecords.id, id));
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
        const rows = await db.select().from(financeRecords).where(eq(financeRecords.id, id)).limit(1);
        if (rows[0]) {
          const { recycleBin } = await import('@shared/schema');
          await db.insert(recycleBin).values({ id: randomUUID(), entityType: 'finance_records', entityId: id, data: rows[0], originalPath: `/finance/records/${id}` });
        }
      } catch (e) {
        console.error('Failed to create recycle snapshot for finance record:', (e as Error).message);
      }

      await db.delete(financeRecords).where(eq(financeRecords.id, id));
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
      .leftJoin(leads, eq(samples.leadId, leads.id));
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
  async createGeneticCounselling(record: { sampleId: string; gcName: string; counsellingType?: string; counsellingStartTime?: Date | string | null; counsellingEndTime?: Date | string | null; gcSummary?: string | null; extendedFamilyTesting?: boolean; approvalStatus?: string; }): Promise<any> {
    const id = randomUUID();
    const toDbDate = (v: any) => {
      if (!v) return null;
      if (v instanceof Date) return v;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };
    await db.insert((await import('@shared/schema')).geneticCounselling).values({
      id,
      sampleId: record.sampleId,
      gcName: record.gcName,
      counsellingType: record.counsellingType ?? null,
      counsellingStartTime: toDbDate(record.counsellingStartTime),
      counsellingEndTime: toDbDate(record.counsellingEndTime),
      gcSummary: record.gcSummary ?? null,
      extendedFamilyTesting: record.extendedFamilyTesting ?? false,
      approvalStatus: record.approvalStatus ?? 'pending',
    });
    const rows = await db.select().from((await import('@shared/schema')).geneticCounselling).where(eq((await import('@shared/schema')).geneticCounselling.id, id)).limit(1);
    return rows[0];
  }

  async getGeneticCounselling(): Promise<any[]> {
    const rows = await db.select().from((await import('@shared/schema')).geneticCounselling);
    return rows;
  }

  async updateGeneticCounselling(id: string, updates: Partial<any>): Promise<any | undefined> {
    const safe: any = { ...updates };
    if (safe.counsellingStartTime) safe.counsellingStartTime = new Date(safe.counsellingStartTime);
    if (safe.counsellingEndTime) safe.counsellingEndTime = new Date(safe.counsellingEndTime);
    await db.update((await import('@shared/schema')).geneticCounselling).set(safe).where(eq((await import('@shared/schema')).geneticCounselling.id, id));
    const rows = await db.select().from((await import('@shared/schema')).geneticCounselling).where(eq((await import('@shared/schema')).geneticCounselling.id, id)).limit(1);
    return rows[0];
  }

  async deleteGeneticCounselling(id: string): Promise<boolean> {
    try {
      try {
        const gc = await db.select().from((await import('@shared/schema')).geneticCounselling).where(eq((await import('@shared/schema')).geneticCounselling.id, id)).limit(1);
        if (gc[0]) {
          const { recycleBin } = await import('@shared/schema');
          await db.insert(recycleBin).values({ id: randomUUID(), entityType: 'genetic_counselling', entityId: id, data: gc[0], originalPath: `/genetic-counselling/${id}` });
        }
      } catch (e) {
        console.error('Failed to create recycle snapshot for genetic counselling:', (e as Error).message);
      }

      await db.delete((await import('@shared/schema')).geneticCounselling).where(eq((await import('@shared/schema')).geneticCounselling.id, id));
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
    return db.select().from(recycleBin).orderBy(recycleBin.deletedAt as any /* drizzle types */);
  }

  async getRecycleEntry(id: string): Promise<any | undefined> {
    const { recycleBin } = await import('@shared/schema');
    const rows = await db.select().from(recycleBin).where(eq(recycleBin.id, id)).limit(1);
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
        case 'finance_records':
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
      .leftJoin(leads, eq(samples.leadId, leads.id))
      .where(eq(reportsTable.status, "awaiting_approval"));
    return rows.map((row: any) => ({
      ...(row.sample as any),
      lead: row.lead as any,
    }));
  }

}

export const storage = new DBStorage();
