import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { notificationService } from "./services/NotificationService";
import { emailAlertService } from "./services/EmailAlertService";
import {
  insertUserSchema,
  insertLeadSchema,
  insertSampleSchema,
  insertLabProcessingSchema,
  insertReportSchema,
  insertFinanceRecordSchema,
  insertLogisticsTrackingSchema,
  insertPricingSchema,
  insertSalesActivitySchema,
  insertClientSchema,
  insertLabProcessDiscoverySheetSchema,
  insertLabProcessClinicalSheetSchema,
  insertNutritionalManagementSchema
} from "@shared/schema";
import path from "path";
import fs from "fs";
import { db, pool } from './db';
import { sql } from 'drizzle-orm';
import { generateRoleId } from './lib/generateRoleId';
import { generateProjectId } from './lib/generateProjectId';
import { ensureUploadDirectories, handleFileUpload } from './lib/uploadHandler';
import xlsx from "xlsx";
import { ZodError } from 'zod';
import multer from 'multer';
import nodemailer from 'nodemailer';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer setup: disk storage (existing) and memory storage for DB insert
const storageM = multer.diskStorage({
  destination: function (_req: any, _file: any, cb: any) { cb(null, uploadsDir); },
  filename: function (_req: any, file: any, cb: any) { const unique = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_')}`; cb(null, unique); }
});
const uploadDisk = multer({ storage: storageM, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Finance-specific uploads directory and multer instance
const financeUploadsDir = path.join(uploadsDir, 'finance');
if (!fs.existsSync(financeUploadsDir)) fs.mkdirSync(financeUploadsDir, { recursive: true });
const storageFinance = multer.diskStorage({
  destination: function (_req: any, _file: any, cb: any) { cb(null, financeUploadsDir); },
  filename: function (_req: any, file: any, cb: any) { const unique = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_')}`; cb(null, unique); }
});
const uploadFinance = multer({ storage: storageFinance, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit for finance uploads


function formatZodErrors(err: ZodError) {
  const out: Record<string, string[]> = {};
  for (const e of err.errors) {
    const key = e.path.join('.') || '_';
    if (!out[key]) out[key] = [];
    out[key].push(e.message || `${e.code}`);
  }
  return out;
}

// Normalize known date fields: convert ISO/date strings to Date objects so Zod date() validators accept them
function normalizeDateFields(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = { ...obj };
  // include sample-related date fields added in the client
  const dateKeys = [
    'dateSampleReceived', 'dateSampleCollected', 'pickupUpto', 'pickupDate', 'createdAt', 'convertedAt',
    'sampleCollectedDate', 'sampleShippedDate', 'sampleDeliveryDate', 'thirdPartySentDate', 'thirdPartyReceivedDate',
    'sampleCollectionDate', 'sampleDeliveryDate', 'sampleSentToThirdPartyDate', 'sampleReceivedToThirdPartyDate',
    'leadCreated', 'leadModified', 'sampleReceivedDate'
  ];
  // helper to try several parsing strategies for a date-string
  const tryParseDate = (val: string) => {
    if (!val || typeof val !== 'string') return null;
    let trimmed = val.trim();
    // If value is an empty string, return null
    if (trimmed === '') return null;
    // Try native parsing first
    let d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
    // If missing seconds (e.g. 2025-10-17T10:30), append :00
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
      d = new Date(`${trimmed}:00`);
      if (!isNaN(d.getTime())) return d;
    }
    // Try treating as local by appending a Z (UTC)
    try {
      d = new Date(`${trimmed}Z`);
      if (!isNaN(d.getTime())) return d;
    } catch (e) {
      // ignore
    }
    return null;
  };

  for (const k of dateKeys) {
    if (copy[k] && typeof copy[k] === 'string') {
      const parsed = tryParseDate(copy[k]);
      if (parsed) copy[k] = parsed;
      else {
        // If we couldn't parse, remove empty/invalid date so Zod doesn't see a string
        delete copy[k];
      }
    }
  }
  return copy;
}

// ============================================================================
// BIDIRECTIONAL SYNC HELPERS: Lead Management <-> Process Master
// ============================================================================

// Helper function to sync lead data to ProcessMaster table
async function syncLeadToProcessMaster(lead: any, isUpdate: boolean = false) {
  try {
    console.log('[Sync Debug] syncLeadToProcessMaster called with lead:', {
      id: lead.id,
      uniqueId: lead.uniqueId || lead.unique_id,
      projectId: lead.projectId || lead.project_id,
      isUpdate
    });

    // Build ProcessMaster record from lead data - include ALL available fields
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
      patient_client_address: lead.patientClientAddress || null,
      sample_collection_date: lead.sampleCollectionDate || lead.sample_collection_date || null,
      sample_recevied_date: lead.sampleReceivedDate || lead.sample_recevied_date || null,
      service_name: lead.serviceName || lead.service_name || null,
      sample_type: lead.sampleType || lead.sample_type || null,
      no_of_samples: lead.noOfSamples || lead.no_of_samples || null,
      tat: lead.tat || null,
      sales_responsible_person: lead.salesResponsiblePerson || lead.sales_responsible_person || null,
      progenics_trf: lead.progenicsTrf || lead.progenics_trf || null,
      third_party_trf: null, // Not in lead_management
      progenics_report: null, // Not directly in lead_management
      sample_sent_to_third_party_date: null, // Not directly in lead_management
      third_party_name: null, // Not directly in lead_management
      third_party_report: null, // Not directly in lead_management
      results_raw_data_received_from_third_party_date: null, // Not directly in lead_management
      logistic_status: null, // Set separately
      finance_status: null, // Set separately
      lab_process_status: null, // Set separately
      bioinformatics_status: null, // Set separately
      nutritional_management_status: null, // Set separately
      progenics_report_release_date: null, // Set separately
      Remark_Comment: lead.remarkComment || lead.Remark_Comment || null,
      created_by: lead.leadCreatedBy || lead.lead_created_by || null,
      modified_by: lead.modifiedBy || lead.modified_by || null,
    };

    // Check if record exists in ProcessMaster
    const [existing]: any = await pool.execute(
      'SELECT id FROM process_master_sheet WHERE unique_id = ?',
      [pmRecord.unique_id]
    );

    console.log('[Sync Debug] Existing PM record check:', {
      unique_id: pmRecord.unique_id,
      found: existing && existing.length > 0,
      existingCount: existing?.length
    });

    if (isUpdate || (existing && existing.length > 0)) {
      // Update existing ProcessMaster record
      const keys = Object.keys(pmRecord).filter(k => pmRecord[k as keyof typeof pmRecord] !== null);
      const set = keys.map(k => `\`${k}\` = ?`).join(',');
      const values = keys.map(k => pmRecord[k as keyof typeof pmRecord]);
      values.push(pmRecord.unique_id);

      console.log('[Sync Debug] Updating PM record with fields:', keys);
      await pool.execute(
        `UPDATE process_master_sheet SET ${set}, modified_at = NOW() WHERE unique_id = ?`,
        values
      );
      console.log('[Sync] Lead updated in ProcessMaster:', pmRecord.unique_id);
    } else {
      // Create new ProcessMaster record
      const keys = Object.keys(pmRecord).filter(k => pmRecord[k as keyof typeof pmRecord] !== null);
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => pmRecord[k as keyof typeof pmRecord]);

      console.log('[Sync Debug] Creating new PM record with fields:', keys);
      console.log('[Sync Debug] SQL:', `INSERT INTO process_master_sheet (${cols}, created_at) VALUES (${placeholders}, NOW())`);

      await pool.execute(
        `INSERT INTO process_master_sheet (${cols}, created_at) VALUES (${placeholders}, NOW())`,
        values
      );
      console.log('[Sync] Lead created in ProcessMaster:', pmRecord.unique_id);
    }
  } catch (error) {
    console.error('Failed to sync lead to ProcessMaster:', error);
    // Non-fatal: log but don't fail the lead creation/update
  }
}

// Helper function to sync ProcessMaster data back to Lead (bidirectional sync)
async function syncProcessMasterToLead(pmRecord: any) {
  try {
    const unique_id = pmRecord.unique_id;
    if (!unique_id) {
      console.log('[Sync Debug] No unique_id in PM record, skipping sync');
      return;
    }

    console.log('[Sync Debug] syncProcessMasterToLead called for:', unique_id);

    // Map ProcessMaster fields (snake_case) to Lead database columns (also snake_case)
    // Both tables use snake_case in database, so we map PM field → Lead column directly
    const leadUpdate: any = {};
    const fieldMapping: Record<string, string> = {
      'organisation_hospital': 'organisation_hospital',
      'clinician_researcher_name': 'clinician_researcher_name',
      'clinician_researcher_email': 'clinician_researcher_email',
      'clinician_researcher_phone': 'clinician_researcher_phone',
      'clinician_researcher_address': 'clinician_researcher_address',
      'patient_client_name': 'patient_client_name',
      'patient_client_email': 'patient_client_email',
      'patient_client_phone': 'patient_client_phone',
      'patient_client_address': 'patient_client_address',
      'sample_collection_date': 'sample_collection_date',
      'sample_recevied_date': 'sample_recevied_date', // Note: typo in DB
      'service_name': 'service_name',
      'sample_type': 'sample_type',
      'no_of_samples': 'no_of_samples',
      'tat': 'tat',
      'sales_responsible_person': 'sales_responsible_person',
      'progenics_trf': 'progenics_trf',
      'Remark_Comment': 'Remark_Comment',
      'speciality': 'speciality',
      'age': 'age',
      'gender': 'gender',
    };

    // Build leadUpdate from pmRecord using field mapping
    for (const [pmField, leadColumn] of Object.entries(fieldMapping)) {
      if (pmRecord[pmField] !== undefined) {
        leadUpdate[leadColumn] = pmRecord[pmField];
      }
    }

    if (Object.keys(leadUpdate).length === 0) {
      console.log('[Sync Debug] No fields to update for lead:', unique_id);
      return;
    }

    console.log('[Sync Debug] Fields to update:', Object.keys(leadUpdate));

    // Find the lead by unique_id and update it
    const [leads]: any = await pool.execute(
      'SELECT id FROM lead_management WHERE unique_id = ?',
      [unique_id]
    );

    if (leads && leads.length > 0) {
      const leadId = leads[0].id;
      const keys = Object.keys(leadUpdate);
      const set = keys.map(k => `\`${k}\` = ?`).join(',');
      const values = keys.map(k => leadUpdate[k]);
      values.push(leadId);

      console.log('[Sync Debug] Executing UPDATE on lead_management for ID:', leadId);
      await pool.execute(
        `UPDATE lead_management SET ${set}, lead_modified = NOW() WHERE id = ?`,
        values
      );
      console.log('[Sync] ✓ ProcessMaster synced to Lead:', unique_id);
    } else {
      console.log('[Sync Debug] No lead found with unique_id:', unique_id);
    }
  } catch (error) {
    console.error('[Sync Error] Failed to sync ProcessMaster to Lead:', error);
    // Non-fatal: log but don't fail the ProcessMaster update
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================================
  // INITIALIZE UPLOAD DIRECTORY STRUCTURE
  // ============================================================================
  ensureUploadDirectories();
  console.log('✅ File upload directories initialized');

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      await storage.updateUser(user.id, { lastLogin: new Date() });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // OTP Store (In-Memory)
  const otpStore = new Map<string, { code: string; expires: number }>();

  // Configure Nodemailer Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.log('SMTP Connection Error:', error);
    } else {
      console.log('SMTP Server is ready to take our messages');
    }
  });

  // Create a global transporter for email sending (reusable across endpoints)
  const emailTransporter = transporter;

  // Route: Send OTP
  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const { email, type } = req.body; // type can be 'login', 'register', 'forgot-password'

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP (expires in 5 minutes)
      otpStore.set(email, {
        code: otp,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes
      });

      // Email Template
      const mailOptions = {
        from: process.env.SMTP_USER, // Use the authenticated user as sender
        to: email,
        subject: 'Your Verification Code - Progenics LIMS',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0891b2;">Verification Required</h2>
            <p>Your verification code is:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #7c3aed;">${otp}</h1>
            <p>This code will expire in 5 minutes.</p>
            <p>If you did not request this code, please ignore this email.</p>
          </div>
        `
      };

      // Send Email
      await transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${email}`);
      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Send OTP Error:', error);
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  });

  // Route: Verify OTP
  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;
      const storedData = otpStore.get(email);

      if (!storedData) {
        return res.status(400).json({ message: 'OTP not requested or expired' });
      }

      if (Date.now() > storedData.expires) {
        otpStore.delete(email);
        return res.status(400).json({ message: 'OTP expired' });
      }

      if (storedData.code !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      // OTP Verified Successfully
      // Keep the OTP in store for a short while or mark as verified if you want to enforce strict flow
      // For this implementation, we'll verify it again during password reset or just trust the client flow 
      // (Ideally, issue a temporary token here, but we'll keep it simple as per guide)

      res.json({ message: 'OTP verified successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Route: Reset Password
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, newPassword, otp } = req.body;

      // Verify OTP again to ensure security
      const storedData = otpStore.get(email);
      if (!storedData || storedData.code !== otp) {
        return res.status(400).json({ message: 'Invalid or expired OTP session' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword });

      // Clear OTP
      otpStore.delete(email);

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset Password Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
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

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // If email is being updated, check uniqueness and return a structured validation response
      if (updates.email) {
        const existing = await storage.getUserByEmail(updates.email);
        if (existing && existing.id !== id) {
          return res.status(400).json({ message: 'Invalid user data', errors: { email: ['Email already exists'] } });
        }
      }

      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user (legacy route):', error);
      const e: any = error;
      if (e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062 || (e?.message && /duplicate/i.test(e.message))) {
        return res.status(400).json({ message: 'Invalid user data', errors: { email: ['Email already exists'] } });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { deletedBy } = req.query; // Read from query parameter
      const ok = await storage.deleteUser(id, deletedBy as string);
      if (!ok) return res.status(500).json({ message: 'Failed to delete user' });
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete user', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Lock a user (disable login)
  app.post('/api/users/:id/lock', async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUser(id, { isActive: false });
      if (!user) return res.status(404).json({ message: 'User not found' });
      const { password, ...userWithoutPassword } = user as any;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Failed to lock user', (error as Error).message);
      res.status(500).json({ message: 'Failed to lock user' });
    }
  });

  // Unlock a user (enable login)
  app.post('/api/users/:id/unlock', async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUser(id, { isActive: true });
      if (!user) return res.status(404).json({ message: 'User not found' });
      const { password, ...userWithoutPassword } = user as any;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Failed to unlock user', (error as Error).message);
      res.status(500).json({ message: 'Failed to unlock user' });
    }
  });

  // Fetch a single user (for client-side auth refresh)
  app.get('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const { password, ...userWithoutPassword } = user as any;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Failed to fetch user', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Update only the user's role
  app.put('/api/users/:id/role', async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body as { role?: string };
      const allowed = ['sales', 'operations', 'finance', 'lab', 'bioinformatics', 'reporting', 'nutritionist', 'manager', 'admin'];
      if (!role || typeof role !== 'string' || !allowed.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      const user = await storage.updateUser(id, { role });
      if (!user) return res.status(404).json({ message: 'User not found' });
      const { password, ...userWithoutPassword } = user as any;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Failed to update user role', (error as Error).message);
      res.status(500).json({ message: 'Failed to update role' });
    }
  });

  // ============================================================================
  // Lead Management Routes (LeadManagement.tsx -> lead_management table)
  // ============================================================================
  // Serve uploaded files statically
  app.use('/uploads', (await import('express')).static(uploadsDir));
  // Serve WES report static HTML and assets (allows opening the WES report HTML directly)
  const wesReportDir = path.join(process.cwd(), 'WES report code', 'wes_report');
  if (fs.existsSync(wesReportDir)) {
    app.use('/wes-report', (await import('express')).static(wesReportDir));
  }

  // ============================================================================
  // UNIFIED FILE UPLOAD ENDPOINT WITH CATEGORY-BASED ROUTING
  // ============================================================================
  /**
   * POST /api/uploads/categorized
   * 
   * Upload a file and automatically route it to the correct folder based on category.
   * 
   * Query Parameters:
   *   - category (required): One of ['Progenics_TRF', 'Thirdparty_TRF', 'Progenics_Report', 'Thirdparty_Report']
   *   - entityType (optional): Type of entity (e.g., 'lead', 'sample', 'lab_process')
   *   - entityId (optional): ID of the related entity
   * 
   * Request: multipart/form-data with file field
   * 
   * Response: { success, filePath, filename, message, category, fileSize, mimeType }
   */
  app.post('/api/uploads/categorized', uploadDisk.single('file'), async (req, res) => {
    try {
      const { category, entityType, entityId } = req.query;
      const file = (req as any).file;

      // Validate required parameters
      if (!category || typeof category !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Category parameter is required and must be a string',
        });
      }

      // Validate file was uploaded
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      // Call the unified upload handler
      const uploadResult = handleFileUpload(file, category);

      if (!uploadResult.success) {
        // Clean up the file if it was uploaded but handler failed
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
        return res.status(400).json(uploadResult);
      }

      // Store upload metadata in database
      try {
        const uploadRecord = await storage.createFileUpload({
          filename: uploadResult.filename || '',
          originalName: file.originalname,
          storagePath: uploadResult.filePath || '',
          category: category as string,
          fileSize: uploadResult.fileSize || 0,
          mimeType: uploadResult.mimeType || '',
          uploadedBy: (req as any).user?.id || 'anonymous',
          relatedEntityType: (entityType as string) || undefined,
          relatedEntityId: (entityId as string) || undefined,
        });

        return res.json({
          success: true,
          filePath: uploadResult.filePath,
          filename: uploadResult.filename,
          message: uploadResult.message,
          category: uploadResult.category,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          uploadId: uploadRecord.id,
        });
      } catch (dbError) {
        console.error('Failed to store upload metadata:', dbError);
        // Still return success for the upload, but note the DB issue
        return res.json({
          success: true,
          filePath: uploadResult.filePath,
          filename: uploadResult.filename,
          message: uploadResult.message + ' (metadata storage failed)',
          category: uploadResult.category,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          uploadId: null,
        });
      }
    } catch (error) {
      console.error('Upload categorized endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during file upload',
        error: (error as Error).message,
      });
    }
  });

  // Endpoint to upload progenics TRF file to filesystem (existing)
  app.post('/api/uploads/trf', uploadDisk.single('trf'), async (req, res) => {
    try {
      if (!(req as any).file) return res.status(400).json({ message: 'No file uploaded' });
      const url = `/uploads/${(req as any).file.filename}`;
      res.json({ url, filename: (req as any).file.originalname });
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // New: Endpoint to upload progenics TRF directly into DB as blob


  // Endpoint to download TRF by id (fetch blob from DB)


  // Generic file upload endpoint (saves to disk)
  app.post('/api/uploads/file', uploadDisk.single('file'), async (req, res) => {
    try {
      if (!(req as any).file) return res.status(400).json({ message: 'No file uploaded' });
      const url = `/uploads/${(req as any).file.filename}`;
      res.json({ url, filename: (req as any).file.originalname });
    } catch (error) {
      console.error('File upload failed:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // ============================================================================
  // FILE UPLOAD RETRIEVAL ENDPOINTS
  // ============================================================================

  /**
   * GET /api/uploads/category/:category
   * Get all uploads for a specific category
   */
  app.get('/api/uploads/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const uploads = await storage.getFileUploadsByCategory(category);
      res.json({
        success: true,
        category,
        uploads,
        total: uploads.length,
      });
    } catch (error) {
      console.error('Failed to fetch uploads by category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch uploads',
      });
    }
  });

  /**
   * GET /api/uploads/entity/:entityType/:entityId
   * Get all uploads for a specific entity
   */
  app.get('/api/uploads/entity/:entityType/:entityId', async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const uploads = await storage.getFileUploadsByEntity(entityType, entityId);
      res.json({
        success: true,
        entityType,
        entityId,
        uploads,
        total: uploads.length,
      });
    } catch (error) {
      console.error('Failed to fetch uploads by entity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch uploads',
      });
    }
  });

  // Endpoint to upload progenics TRF file to filesystem (existing)
  app.post('/api/uploads/trf', uploadDisk.single('trf'), async (req, res) => {
    try {
      if (!(req as any).file) return res.status(400).json({ message: 'No file uploaded' });
      const url = `/uploads/${(req as any).file.filename}`;
      res.json({ url, filename: (req as any).file.originalname });
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // New: Endpoint to upload progenics TRF directly into DB as blob


  // Endpoint to download TRF by id (fetch blob from DB)

  // ADMIN ENDPOINT: Manually sync all existing leads to ProcessMaster (one-time initialization)
  app.post("/api/sync/leads-to-process-master", async (req, res) => {
    try {
      console.log('[SYNC] Starting manual sync of all leads to ProcessMaster...');
      const leads = await storage.getLeads();
      let synced = 0;
      let failed = 0;

      for (const lead of leads) {
        try {
          await syncLeadToProcessMaster(lead, false);
          synced++;
        } catch (error) {
          console.error('[SYNC] Failed to sync lead:', lead.uniqueId, error);
          failed++;
        }
      }

      res.json({
        message: `Sync completed: ${synced} leads synced, ${failed} failed`,
        synced,
        failed,
        total: leads.length
      });
      console.log(`[SYNC] Sync completed: ${synced}/${leads.length} leads synced to ProcessMaster`);
    } catch (error) {
      console.error('[SYNC] Error during bulk sync:', error);
      res.status(500).json({ message: 'Failed to sync leads', error: (error as Error).message });
    }
  });

  app.get("/api/leads", async (req, res) => {
    try {
      // Extract user context from request
      // This can come from session middleware, JWT token, or query params
      // For now, we support optional headers x-user-id and x-user-role
      let userRole: string | null = null;
      let userId: string | null = null;

      // Try to get from custom headers (set by client or auth middleware)
      const headerUserId = req.headers['x-user-id'] as string | undefined;
      const headerUserRole = req.headers['x-user-role'] as string | undefined;

      if (headerUserId) userId = headerUserId;
      if (headerUserRole) userRole = headerUserRole;

      // Future: if using Express session, uncomment:
      // if ((req as any).user) {
      //   userId = (req as any).user.id;
      //   userRole = (req as any).user.role;
      // }

      const leads = await storage.getLeads(userRole, userId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      // Debug: log incoming body keys and raw date field values to diagnose validation issues
      try {
        // eslint-disable-next-line no-console
        console.debug('POST /api/leads incoming keys:', Object.keys(req.body));
        // eslint-disable-next-line no-console
        console.debug('raw dateSampleCollected:', JSON.stringify(req.body.dateSampleCollected));
        // eslint-disable-next-line no-console
        console.debug('raw pickupUpto:', JSON.stringify(req.body.pickupUpto));
      } catch (e) {
        // ignore logging errors
      }

      const normalized = normalizeDateFields(req.body);

      // Generate Project ID based on category (Clinical/Discovery) with timestamp
      try {
        if (!normalized.projectId && !normalized.project_id) {
          const category = normalized.testCategory || normalized.category || normalized.lead_type || 'clinical';
          const projectId = await generateProjectId(String(category));
          normalized.projectId = projectId;
          normalized.project_id = projectId;
        }
      } catch (e) {
        console.warn('generateProjectId failed for POST /api/leads', e);
      }

      const result = insertLeadSchema.safeParse(normalized);
      if (!result.success) {
        console.error('Lead validation failed on POST /api/leads:', JSON.stringify(result.error.errors, null, 2));
        // Include raw incoming date fields for easier debugging
        const rawDateSampleCollected = req.body && req.body.dateSampleCollected;
        const rawPickupUpto = req.body && req.body.pickupUpto;
        return res.status(400).json({ message: "Invalid lead data", errors: result.error.errors, fields: formatZodErrors(result.error), debug: { rawDateSampleCollected, rawPickupUpto } });
      }

      const lead = await storage.createLead(result.data);

      // Automatically sync lead to ProcessMaster table
      await syncLeadToProcessMaster(lead, false);

      // If nutritional counselling is required, auto-create a nutrition record
      console.log('Lead nutritionalCounsellingRequired check:', lead.nutritionalCounsellingRequired, 'Type:', typeof lead.nutritionalCounsellingRequired);
      if (lead.nutritionalCounsellingRequired === true) {
        try {
          // Check if nutrition record already exists for this unique_id
          const [existingNM] = await pool.execute(
            'SELECT id FROM nutritional_management WHERE unique_id = ? LIMIT 1',
            [lead.uniqueId]
          ) as [any[], any];

          if (existingNM && existingNM.length > 0) {
            console.log('Nutrition record already exists for unique_id:', lead.uniqueId, '- skipping auto-creation');
          } else {
            console.log('TRIGGERING nutrition auto-creation for lead:', lead.id);
            const nutritionRecord = {
              uniqueId: lead.uniqueId,
              projectId: lead.projectId,
              serviceName: lead.serviceName || '',
              patientClientName: lead.patientClientName || '',
              age: lead.age,
              gender: lead.gender || '',
              createdBy: lead.leadCreatedBy || 'system',
              createdAt: new Date(),
            };
            const [result]: any = await pool.execute(
              `INSERT INTO nutritional_management (unique_id, project_id, service_name, patient_client_name, age, gender, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [nutritionRecord.uniqueId, nutritionRecord.projectId, nutritionRecord.serviceName, nutritionRecord.patientClientName, nutritionRecord.age, nutritionRecord.gender, nutritionRecord.createdBy, nutritionRecord.createdAt]
            );
            console.log('Auto-created nutrition record for lead:', lead.id);
          }
        } catch (err) {
          console.error('Failed to auto-create nutrition record for lead:', (err as Error).message);
          // Don't fail the request if nutrition record creation fails
        }
      }

      // If genetic counselling is required, auto-create a genetic counselling record
      console.log('Lead geneticCounselorRequired check:', lead.geneticCounselorRequired, 'Lead keys:', Object.keys(lead).filter(k => k.includes('genetic')));
      console.log('[GC Auto-Create] Full lead object keys:', Object.keys(lead));
      if (lead.geneticCounselorRequired) {
        try {
          // Check if GC record already exists for this unique_id
          const [existingGC] = await pool.execute(
            'SELECT id FROM genetic_counselling_records WHERE unique_id = ? LIMIT 1',
            [lead.uniqueId]
          ) as [any[], any];

          if (existingGC && existingGC.length > 0) {
            console.log('GC record already exists for unique_id:', lead.uniqueId, '- skipping auto-creation');
          } else {
            console.log('TRIGGERING genetic counselling auto-creation for lead:', lead.id);
            // Prepare data with proper field mapping and null handling
            const toString = (v: any) => {
              if (v === null || v === undefined) return null;
              return String(v).trim() === '' ? null : String(v).trim();
            };

            const geneticCounsellingRecord = {
              unique_id: toString(lead.uniqueId) || '',
              project_id: lead.projectId || null,
              patient_client_name: toString(lead.patientClientName),
              patient_client_address: toString(lead.patientClientAddress),
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
              created_by: toString(lead.leadCreatedBy) || 'system',
              created_at: new Date(),
            };

            console.log('Auto-creating genetic counselling record with data:', {
              unique_id: geneticCounsellingRecord.unique_id,
              patient_client_name: geneticCounsellingRecord.patient_client_name,
              patient_client_address: geneticCounsellingRecord.patient_client_address,
              age: geneticCounsellingRecord.age,
              service_name: geneticCounsellingRecord.service_name,
              sample_type: geneticCounsellingRecord.sample_type
            });
            console.log('[GC Auto-Create Debug] Lead source address - patientClientAddress:', lead.patientClientAddress);

            // Direct table insert
            const keys = Object.keys(geneticCounsellingRecord).filter(k => geneticCounsellingRecord[k as keyof typeof geneticCounsellingRecord] !== undefined);
            console.log('[GC Auto-Create Debug] Fields being inserted:', keys);
            console.log('[GC Auto-Create Debug] Full record object:', JSON.stringify(geneticCounsellingRecord, null, 2));
            const cols = keys.map(k => `\`${k}\``).join(',');
            const placeholders = keys.map(() => '?').join(',');
            const values = keys.map(k => geneticCounsellingRecord[k as keyof typeof geneticCounsellingRecord]);

            const [result]: any = await pool.execute(
              `INSERT INTO genetic_counselling_records (${cols}) VALUES (${placeholders})`,
              values
            );

            console.log('Auto-created genetic counselling record for lead:', lead.id, 'GC Record ID:', result.insertId);
          }
        } catch (err) {
          console.error('Failed to auto-create genetic counselling record for lead:', (err as Error).message);
          // Don't fail the request if genetic counselling record creation fails
        }
      }

      // Send notification for new lead creation
      console.log('Lead created successfully, sending notification for:', lead.id, lead.organisationHospital);
      try {
        await notificationService.notifyLeadCreated(
          lead.id,
          lead.organisationHospital || 'Unknown Organization',
          lead.leadCreatedBy || 'system'
        );
        console.log('Lead creation notification sent successfully');
      } catch (notificationError) {
        console.error('Failed to send lead creation notification:', notificationError);
        // Don't fail the request if notification fails
      }

      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  // Update lead status (Cold -> Hot -> Won)
  app.put("/api/leads/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['cold', 'hot', 'won'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be cold, hot, or won" });
      }

      // Get current lead to track status change
      const currentLead = await storage.getLeadById(id);
      if (!currentLead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      const lead = await storage.updateLeadStatus(id, status);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Send status change notification
      try {
        await notificationService.notifyLeadStatusChanged(
          lead.id,
          lead.organisationHospital || 'Unknown Organization',
          currentLead.status || 'unknown',
          status,
          'system'
        );
      } catch (notificationError) {
        console.error('Failed to send lead status change notification:', notificationError);
      }

      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lead status" });
    }
  });

  // Update full lead data
  app.put("/api/leads/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = normalizeDateFields(req.body);
      // Debug: log raw and normalized pickupUpto for troubleshooting
      try {
        // eslint-disable-next-line no-console
        console.debug(`PUT /api/leads/${id} raw pickupUpto:`, JSON.stringify(req.body.pickupUpto));
        // eslint-disable-next-line no-console
        console.debug(`PUT /api/leads/${id} normalized pickupUpto:`, JSON.stringify(updates.pickupUpto));
      } catch (e) { /* ignore */ }

      // Validate the update data (partial schema)
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

      // Automatically sync updated lead to ProcessMaster table
      await syncLeadToProcessMaster(lead, true);

      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.post("/api/leads/:id/convert", async (req, res) => {
    try {
      const { id } = req.params;
      const sampleData = req.body;

      // Check if lead is in 'won' status before conversion
      const lead = await storage.getLeadById(id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      if (lead.status !== 'won') {
        return res.status(400).json({ message: "Lead must be in 'won' status before conversion" });
      }

      // Basic validation for required fields only
      if (!sampleData.amount) {
        return res.status(400).json({ message: "Sample amount is required" });
      }

      // Ensure amount is a string for decimal handling
      const validatedSampleData = {
        ...sampleData,
        amount: String(sampleData.amount),
        paidAmount: sampleData.paidAmount ? String(sampleData.paidAmount) : "0",
        status: sampleData.status || "pickup_scheduled"
      };

      const conversion = await storage.convertLead(id, validatedSampleData);

      // If caller asked to create genetic counselling explicitly, create it now and attach to response
      let createdGc: any = null;
      try {
        const requestGcFlag = !!sampleData?.createGeneticCounselling || !!sampleData?.createGc || !!sampleData?.create_genetic_counselling;
        if (requestGcFlag) {
          // Check if GC record already exists for this unique_id
          const [existingGC] = await pool.execute(
            'SELECT id FROM genetic_counselling_records WHERE unique_id = ? LIMIT 1',
            [conversion.sample.uniqueId]
          ) as [any[], any];

          if (existingGC && existingGC.length > 0) {
            console.log('[convert-lead] GC record already exists for unique_id:', conversion.sample.uniqueId, '- skipping auto-creation');
            createdGc = { id: existingGC[0].id, uniqueId: conversion.sample.uniqueId, alreadyExists: true };
          } else {
            // createGeneticCounselling expects sampleId (human readable) and gcName at minimum
            createdGc = await storage.createGeneticCounselling({ sampleId: conversion.sample.uniqueId || '', gcName: '' });

            // Send genetic counselling notification
            try {
              await notificationService.notifyGeneticCounsellingRequired(
                conversion.sample.uniqueId || 'Unknown Sample',
                conversion.lead.patientClientName || 'Unknown Patient',
                'system'
              );
            } catch (notificationError) {
              console.error('Failed to send genetic counselling notification:', notificationError);
            }
          }
        }
      } catch (err) {
        console.error('Failed to create genetic counselling after conversion:', (err as Error).message);
      }

      // If nutritional counselling is required, auto-create a nutrition record
      let createdNutrition: any = null;
      try {
        console.log('[convert-lead] nutritionalCounsellingRequired check:', lead.nutritionalCounsellingRequired, 'Type:', typeof lead.nutritionalCounsellingRequired);
        if (lead.nutritionalCounsellingRequired === true) {
          // Check if nutrition record already exists for this unique_id
          const [existingNM] = await pool.execute(
            'SELECT id FROM nutritional_management WHERE unique_id = ? LIMIT 1',
            [conversion.lead.uniqueId]
          ) as [any[], any];

          if (existingNM && existingNM.length > 0) {
            console.log('[convert-lead] Nutrition record already exists for unique_id:', conversion.lead.uniqueId, '- skipping auto-creation');
            createdNutrition = { id: existingNM[0].id, uniqueId: conversion.lead.uniqueId, alreadyExists: true };
          } else {
            console.log('[convert-lead] TRIGGERING nutrition auto-creation for lead:', conversion.lead.id);
            const nutritionRecord = {
              uniqueId: conversion.lead.uniqueId,
              projectId: conversion.lead.projectId,
              sampleId: conversion.sample.uniqueId,
              serviceName: conversion.lead.serviceName || '',
              patientClientName: conversion.lead.patientClientName || '',
              age: conversion.lead.age,
              gender: conversion.lead.gender || '',
              createdBy: conversion.lead.leadCreatedBy || 'system',
              createdAt: new Date(),
            };
            const [result]: any = await pool.execute(
              `INSERT INTO nutritional_management (unique_id, project_id, sample_id, service_name, patient_client_name, age, gender, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [nutritionRecord.uniqueId, nutritionRecord.projectId, nutritionRecord.sampleId, nutritionRecord.serviceName, nutritionRecord.patientClientName, nutritionRecord.age, nutritionRecord.gender, nutritionRecord.createdBy, nutritionRecord.createdAt]
            );
            const insertId = result.insertId;
            const [rows]: any = await pool.execute('SELECT * FROM nutritional_management WHERE id = ?', [insertId]);
            createdNutrition = rows && rows[0] ? rows[0] : null;
            console.log('Auto-created nutrition record for converted lead:', conversion.lead.id);

            // Send nutrition counselling notification
            try {
              await notificationService.notifyGeneticCounsellingRequired(
                conversion.sample.uniqueId || 'Unknown Sample',
                conversion.lead.patientClientName || 'Unknown Patient',
                'system'
              );
            } catch (notificationError) {
              console.error('Failed to send nutrition counselling notification:', notificationError);
            }
          }
        }
      } catch (err) {
        console.error('Failed to auto-create nutrition record after conversion:', (err as Error).message);
      }

      // Send lead conversion notifications
      try {
        await notificationService.notifyLeadConverted(
          conversion.lead.id,
          conversion.lead.organisationHospital || 'Unknown Organization',
          conversion.sample.uniqueId || 'Unknown Sample',
          'system'
        );

        await notificationService.notifySampleReceived(
          conversion.sample.uniqueId || 'Unknown Sample',
          conversion.lead.organisationHospital || 'Unknown Organization',
          'system'
        );
      } catch (notificationError) {
        console.error('Failed to send conversion notifications:', notificationError);
      }

      // Legacy notification system for operations team (keeping for compatibility)
      try {
        const operationsUsers = await storage.getAllUsers();
        const opsUsers = operationsUsers.filter(user => user.role === 'operations' && user.isActive);

        for (const user of opsUsers) {
          await storage.createNotification({
            userId: user.id,
            title: "New Lead Converted",
            message: `Lead from ${conversion.lead.organisationHospital || 'Unknown Organization'} has been converted. Sample ID: ${conversion.sample.uniqueId || 'Unknown Sample'}`,
            type: "lead_converted",
            relatedId: String(conversion.sample.id),
            isRead: false,
          });
        }
      } catch (legacyNotificationError) {
        console.error('Failed to send legacy notifications:', legacyNotificationError);
      }

      res.json({ ...conversion, geneticCounselling: createdGc, nutritionCounselling: createdNutrition });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to convert lead" });
    }
  });

  // ============================================================================
  // Sample Management Routes (SampleTracking.tsx -> sample_tracking table)
  // ============================================================================
  app.get("/api/samples", async (req, res) => {
    try {
      const samples = await storage.getSamples();
      res.json(samples);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch samples" });
    }
  });

  app.put("/api/samples/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Log incoming body for debugging
      console.debug('PUT /api/samples/:id incoming body keys:', Object.keys(req.body || {}));
      console.debug('PUT /api/samples/:id incoming body sampleCollectedDate:', req.body?.sampleCollectedDate);

      // First, remove any empty-string fields from the payload (these often come from datetime-local inputs)
      const removeEmptyStrings = (obj: any) => {
        if (!obj || typeof obj !== 'object') return obj;
        const out: any = {};
        for (const [k, v] of Object.entries(obj)) {
          if (v === '') continue; // skip empty strings
          out[k] = v;
        }
        return out;
      };

      const cleaned = removeEmptyStrings(req.body || {});
      const updates = normalizeDateFields(cleaned);

      console.debug('PUT /api/samples/:id normalized updates:', JSON.stringify(updates));

      // Defensive: ensure any remaining date-like string fields are converted to Date objects
      for (const [k, v] of Object.entries(updates as any)) {
        if (typeof v === 'string' && /date/i.test(k)) {
          const tryD = (() => {
            const t = v.trim();
            if (t === '') return null;
            const d1 = new Date(t);
            if (!isNaN(d1.getTime())) return d1;
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t)) {
              const d2 = new Date(`${t}:00`);
              if (!isNaN(d2.getTime())) return d2;
            }
            try {
              const d3 = new Date(`${t}Z`);
              if (!isNaN(d3.getTime())) return d3;
            } catch (e) { /* ignore */ }
            return null;
          })();
          if (tryD) (updates as any)[k] = tryD;
        }
      }

      const parsed = insertSampleSchema.partial().safeParse(updates);
      if (!parsed.success) {
        console.error('Sample update validation errors:', JSON.stringify(parsed.error.errors, null, 2));
        // Return cleaned/normalized payload in debug field to help client-side debugging
        return res.status(400).json({ message: "Invalid sample data", errors: parsed.error.errors, fields: formatZodErrors(parsed.error), debug: { cleanedPayload: updates } });
      }

      // Get current sample to track status changes
      const currentSample = await storage.getSampleById(id);
      if (!currentSample) {
        return res.status(404).json({ message: "Sample not found" });
      }

      const sample = await storage.updateSample(id, parsed.data as any);
      if (!sample) {
        return res.status(404).json({ message: "Sample not found" });
      }

      // Note: sample table does not have status field, so status change notifications are not sent
      // Status tracking is handled through labProcess or other related tables if needed

      res.json(sample);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sample" });
    }
  });

  // Delete sample
  app.delete('/api/samples/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteSample(id);
      if (!ok) return res.status(500).json({ message: 'Failed to delete sample' });
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete sample', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete sample' });
    }
  });

  // ============================================================================
  // Lab Processing Routes (LabProcessing.tsx -> labprocess_discovery_sheet, labprocess_clinical_sheet tables)
  // ============================================================================
  app.get("/api/lab-processing", async (req, res) => {
    try {
      const labQueue = await storage.getLabProcessingQueue();
      res.json(labQueue);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lab processing queue" });
    }
  });

  app.post("/api/lab-processing", async (req, res) => {
    try {
      const result = insertLabProcessingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid lab processing data", errors: result.error.errors });
      }

      const labProcessing = await storage.createLabProcessing(result.data);

      // Use the resolved sampleId returned on the labProcessing row so we update
      // the correct internal sample UUID regardless of what the client submitted.
      // Note: sample table does not have a status field, so we skip this update
      // await storage.updateSample(labProcessing.sampleId, { status: "lab_processing" });

      // Send comprehensive lab processing notifications
      try {
        const sample = await storage.getSampleById(labProcessing.sampleId);
        if (sample) {
          // Note: Sample does not have leadId; projects are tracked via projectId in sample table
          // Use sample's own details for notification

          await notificationService.notifyLabProcessingStarted(
            sample.uniqueId || 'Unknown Sample',
            'Sample Lab Processing',
            'system'
          );
        }
      } catch (notificationError) {
        console.error('Failed to send lab processing notification:', notificationError);
      }

      // Legacy notification system for bioinformatics team (keeping for compatibility)
      if (!result.data.isOutsourced) {
        try {
          const bioUsers = await storage.getAllUsers();
          const bioinformaticsUsers = bioUsers.filter(user => user.role === 'bioinformatics' && user.isActive);

          for (const user of bioinformaticsUsers) {
            await storage.createNotification({
              userId: user.id,
              title: "Sample Ready for Bioinformatics",
              message: `Lab processing completed for sample ${labProcessing.labId}`,
              type: "bioinformatics_ready",
              relatedId: labProcessing.sampleId,
              isRead: false,
            });
          }
        } catch (legacyNotificationError) {
          console.error('Failed to send legacy bioinformatics notifications:', legacyNotificationError);
        }
      }

      res.json(labProcessing);
    } catch (error) {
      res.status(500).json({ message: "Failed to create lab processing record" });
    }
  });

  // Update lab processing record
  app.put("/api/lab-processing/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Normalize incoming date strings to Date objects for schema validation
      const normalize = (obj: any) => {
        if (!obj || typeof obj !== 'object') return obj;
        const copy = { ...obj };
        const dateKeys = ['sampleDeliveryDate', 'processedAt', 'sampleDeliveryDate', 'sampleDeliveryDate'];
        for (const k of dateKeys) {
          if (copy[k] && typeof copy[k] === 'string') {
            const d = new Date(copy[k]);
            if (!isNaN(d.getTime())) copy[k] = d;
          }
        }
        return copy;
      };

      const updates = normalize(req.body);

      // Allow partial updates - validate shape without requiring all fields
      const parsed = insertLabProcessingSchema.partial().safeParse(updates);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid lab processing update data", errors: parsed.error.errors });
      }

      const updated = await storage.updateLabProcessing(id, parsed.data as any);
      if (!updated) {
        return res.status(404).json({ message: "Lab processing record not found" });
      }

      // Send completion notification if processing stage advances
      try {
        const sample = await storage.getSampleById(updated.sampleId);

        await notificationService.notifyLabProcessingCompleted(
          sample?.uniqueId || updated.labId,
          'Lab Processing Update',
          'system'
        );
      } catch (notificationError) {
        console.error('Failed to send lab processing update notification:', notificationError);
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lab processing record" });
    }
  });

  // Delete lab processing record
  app.delete('/api/lab-processing/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteLabProcessing(id);
      if (!ok) return res.status(500).json({ message: 'Failed to delete lab processing record' });
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete lab processing record', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete lab processing record' });
    }
  });

  // ============================================================================
  // Bioinformatics Routes (Bioinformatics.tsx -> bioinformatics_sheet_discovery, bioinformatics_sheet_clinical tables)
  // ============================================================================
  // Bioinformatics endpoints - expose lab processing records as bioinformatics items
  app.get('/api/bioinformatics', async (req, res) => {
    try {
      const lp = await storage.getLabProcessingQueue();
      // Map lab processing rows to the BIRecord shape expected by the client
      const mapped = lp.map((item: any) => ({
        id: item.id,
        sample_id: item.sample ? (item.sample.sampleId || item.sampleId) : item.sampleId,
        sequencing_date: item.processedAt ? new Date(item.processedAt).toISOString() : null,
        analysis_status: item.qcStatus || 'pending',
        total_mb_generated: item.totalMbGenerated || 0,
        result_report_link: item.reportLink || null,
        progenics_trf: item.progenicsTrf || item.titleUniqueId || null,
        progenics_raw_data: item.progenicsRawData || null,
        third_party_name: item.thirdPartyName || null,
        third_party_result_date: item.thirdPartyResultDate ? new Date(item.thirdPartyResultDate).toISOString() : null,
        alert_to_technical: !!item.alertToTechnical,
        alert_from_lab_team: !!item.alertFromLabTeam,
        alert_from_finance: !!item.alertFromFinance,
        report_related_status: item.completeStatus || 'processing',
      }));
      res.json(mapped);
    } catch (error) {
      console.error('Failed to fetch bioinformatics data', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch bioinformatics data' });
    }
  });

  app.put('/api/bioinformatics/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      // Map incoming BI fields to labProcessing fields where sensible
      const mappedUpdates: any = {};
      if (updates.analysis_status !== undefined) mappedUpdates.qcStatus = updates.analysis_status;
      if (updates.sequencing_date) mappedUpdates.processedAt = updates.sequencing_date;
      if (updates.total_mb_generated !== undefined) mappedUpdates.totalMbGenerated = updates.total_mb_generated;
      if (updates.result_report_link !== undefined) mappedUpdates.reportLink = updates.result_report_link;
      if (updates.progenics_trf !== undefined) mappedUpdates.progenicsTrf = updates.progenics_trf;
      if (updates.progenics_raw_data !== undefined) mappedUpdates.progenicsRawData = updates.progenics_raw_data;
      if (updates.third_party_name !== undefined) mappedUpdates.thirdPartyName = updates.third_party_name;
      if (updates.third_party_result_date !== undefined) mappedUpdates.thirdPartyResultDate = updates.third_party_result_date;
      if (updates.alert_to_technical !== undefined) mappedUpdates.alertToTechnical = updates.alert_to_technical;
      if (updates.alert_from_lab_team !== undefined) mappedUpdates.alertFromLabTeam = updates.alert_from_lab_team;
      if (updates.alert_from_finance !== undefined) mappedUpdates.alertFromFinance = updates.alert_from_finance;
      if (updates.report_related_status !== undefined) mappedUpdates.completeStatus = updates.report_related_status;

      const updated = await storage.updateLabProcessing(id, mappedUpdates);
      if (!updated) return res.status(404).json({ message: 'Bioinformatics record not found' });
      // Return the same shape as GET
      const out = {
        id: updated.id,
        sample_id: updated.sampleId,
        sequencing_date: updated.processedAt ? new Date(updated.processedAt).toISOString() : null,
        analysis_status: updated.qcStatus || 'pending',
        total_mb_generated: (updated as any).totalMbGenerated || 0,
        result_report_link: (updated as any).reportLink || null,
        progenics_trf: updated.progenicsTrf || null,
        progenics_raw_data: (updated as any).progenicsRawData || null,
        third_party_name: (updated as any).thirdPartyName || null,
        third_party_result_date: (updated as any).thirdPartyResultDate ? new Date((updated as any).thirdPartyResultDate).toISOString() : null,
        alert_to_technical: !!(updated as any).alertToTechnical,
        alert_from_lab_team: !!(updated as any).alertFromLabTeam,
        alert_from_finance: !!(updated as any).alertFromFinance,
        report_related_status: (updated as any).completeStatus || 'processing',
      };
      res.json(out);
    } catch (error) {
      console.error('Failed to update bioinformatics record', (error as Error).message);
      res.status(500).json({ message: 'Failed to update bioinformatics record' });
    }
  });

  app.delete('/api/bioinformatics/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteLabProcessing(id);
      if (!ok) return res.status(500).json({ message: 'Failed to delete bioinformatics record' });
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete bioinformatics record', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete bioinformatics record' });
    }
  });

  // ============================================================================
  // Genetic Counselling Routes (GeneticCounselling.tsx -> genetic_counselling_records table)
  // ============================================================================
  // Genetic Counselling endpoints - persist to DB via storage
  app.get('/api/genetic-counselling', async (_req, res) => {
    try {
      const rows = await storage.getGeneticCounselling();
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch genetic counselling records' });
    }
  });

  app.post('/api/genetic-counselling', async (req, res) => {
    try {
      const body = req.body || {};
      const created = await storage.createGeneticCounselling(body);
      res.json(created);
    } catch (error) {
      console.error('Failed to create genetic counselling record', (error as Error).message);
      res.status(500).json({ message: 'Failed to create genetic counselling record' });
    }
  });

  app.put('/api/genetic-counselling/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const updated = await storage.updateGeneticCounselling(id, updates);
      if (!updated) return res.status(404).json({ message: 'Record not found' });
      res.json(updated);
    } catch (error) {
      console.error('Failed to update genetic counselling record', (error as Error).message);
      res.status(500).json({ message: 'Failed to update genetic counselling record' });
    }
  });

  app.delete('/api/genetic-counselling/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteGeneticCounselling(id);
      if (!ok) return res.status(404).json({ message: 'Record not found' });
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete genetic counselling record', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete genetic counselling record' });
    }
  });

  // Reports routes
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const result = insertReportSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid report data", errors: result.error.errors });
      }

      const report = await storage.createReport(result.data);

      // Send comprehensive report notifications
      try {
        const sample = await storage.getSampleById(result.data.sampleId);
        const patientName = 'Patient'; // Would need to get from lead/sample data
        const testType = 'Test Report'; // Would need to get from sample/lead data

        await notificationService.notifyReportGenerated(
          report.id,
          patientName,
          testType,
          'system'
        );
      } catch (notificationError) {
        console.error('Failed to send report generation notification:', notificationError);
      }

      // Legacy notification system for finance team (keeping for compatibility)
      try {
        const financeUsers = await storage.getAllUsers();
        const finUsers = financeUsers.filter(user => user.role === 'finance' && user.isActive);

        for (const user of finUsers) {
          await storage.createNotification({
            userId: user.id,
            title: "Report Ready for Approval",
            message: `Report generated and awaiting financial approval`,
            type: "report_ready",
            relatedId: report.id,
            isRead: false,
          });
        }
      } catch (legacyNotificationError) {
        console.error('Failed to send legacy finance notifications:', legacyNotificationError);
      }

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  app.put("/api/reports/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;

      const report = await storage.updateReport(id, {
        status: "approved",
        approvedAt: new Date(),
        approvedBy,
      });

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Send comprehensive report approval notifications
      try {
        await notificationService.notifyReportApproved(
          report.id,
          'Patient', // Would need to get from linked data
          'Test Report', // Would need to get from linked data
          'system'
        );
      } catch (notificationError) {
        console.error('Failed to send report approval notification:', notificationError);
      }

      // Legacy notification system for reporting team (keeping for compatibility)
      try {
        const reportingUsers = await storage.getAllUsers();
        const repUsers = reportingUsers.filter(user => user.role === 'reporting' && user.isActive);

        for (const user of repUsers) {
          await storage.createNotification({
            userId: user.id,
            title: "Report Approved",
            message: `Report has been approved and can be delivered`,
            type: "report_approved",
            relatedId: report.id,
            isRead: false,
          });
        }
      } catch (legacyNotificationError) {
        console.error('Failed to send legacy reporting notifications:', legacyNotificationError);
      }

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve report" });
    }
  });

  // Send bioinformatics record to Reports module (report_management table)
  app.post("/api/send-to-reports", async (req, res) => {
    try {
      const {
        // IDs
        uniqueId,
        projectId,
        bioinformaticsId,
        sampleId,
        clientId,
        // Patient info
        patientClientName,
        age,
        gender,
        // Clinician info
        clinicianResearcherName,
        organisationHospital,
        // Service info
        serviceName,
        noOfSamples,
        // TAT and comments
        tat,
        remarkComment,
        // Optional lead fields
        createdBy,
        modifiedBy,
        // Additional fields
        analysisDate,
        sampleReceivedDate,
      } = req.body;

      console.log('Send to Reports triggered for bioinformatics:', bioinformaticsId, 'Project ID:', projectId);

      if (!uniqueId) {
        return res.status(400).json({ message: 'Unique ID is required' });
      }

      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }

      // 🔍 CHECK: See if report already exists for this unique_id
      try {
        const [existingReport] = await pool.execute(
          'SELECT id FROM report_management WHERE unique_id = ? LIMIT 1',
          [uniqueId]
        );

        if ((existingReport as any[]).length > 0) {
          // Report already exists - return success with existing flag
          console.log('Report already exists for unique_id:', uniqueId);
          return res.status(409).json({
            success: true,
            alreadyExists: true,
            recordId: uniqueId,
            message: 'Report has already been released for this sample.',
          });
        }
      } catch (checkError) {
        console.error('Error checking for existing report:', (checkError as Error).message);
        // Continue with insertion - let the duplicate key error handle it if needed
      }

      // Prepare report data to insert into report_management table
      const reportData: Record<string, any> = {
        unique_id: uniqueId,
        project_id: projectId,
      };

      // Add patient info if provided
      if (patientClientName) reportData.patient_client_name = patientClientName;
      if (age) reportData.age = parseInt(age) || null;
      if (gender) reportData.gender = gender;

      // Add clinician info if provided
      if (clinicianResearcherName) reportData.clinician_researcher_name = clinicianResearcherName;
      if (organisationHospital) reportData.organisation_hospital = organisationHospital;

      // Add service info if provided
      if (serviceName) reportData.service_name = serviceName;
      if (noOfSamples) reportData.no_of_samples = parseInt(noOfSamples) || null;
      if (sampleId) reportData.sample_id = sampleId;

      // Add TAT and comments
      if (tat) reportData.tat = parseInt(tat) || null;
      if (remarkComment) reportData.remark_comment = remarkComment;

      // Add lead/audit fields
      if (createdBy) reportData.lead_created_by = createdBy;
      if (modifiedBy) {
        reportData.lead_modified = modifiedBy;
      } else {
        reportData.lead_modified = new Date();
      }

      // Handle sample received date if provided
      if (sampleReceivedDate) {
        try {
          const dateObj = new Date(sampleReceivedDate);
          const year = dateObj.getUTCFullYear();
          const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getUTCDate()).padStart(2, '0');
          reportData.sample_received_date = `${year}-${month}-${day}`;
        } catch (e) {
          console.log('Warning: Could not parse sample_received_date');
        }
      }

      // Set created_at timestamp
      reportData.created_at = new Date();

      console.log('Prepared report data for report_management:', reportData);

      // Build dynamic INSERT query
      const keys = Object.keys(reportData);
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => reportData[k]);

      // Insert into report_management table
      const result: any = await pool.execute(
        `INSERT INTO report_management (${cols}) VALUES (${placeholders})`,
        values
      );

      console.log('Inserted into report_management:', result);

      // Update bioinformatics table to set alert_to_report_team flag
      try {
        const isDiscovery = projectId.startsWith('DG');
        const bioTableName = isDiscovery ? 'bioinformatics_sheet_discovery' : 'bioinformatics_sheet_clinical';
        await pool.execute(
          `UPDATE ${bioTableName} SET alert_to_report_team = ?, modified_at = ? WHERE id = ?`,
          [1, new Date(), bioinformaticsId]
        );
        console.log('Updated bioinformatics flag for:', bioinformaticsId);
      } catch (updateError) {
        console.error('Warning: Failed to update bioinformatics flag', (updateError as Error).message);
        // Don't fail the entire request if bioinformatics update fails
      }

      // Send notifications
      try {
        await notificationService.notifyReportGenerated(
          uniqueId,
          'Bioinformatics Analysis Report',
          serviceName || 'Analysis Report',
          createdBy || 'system'
        );
      } catch (notificationError) {
        console.error('Failed to send report notification:', notificationError);
        // Don't fail the request if notification fails
      }

      // Send email notification to Report team
      try {
        await emailAlertService.sendReportTeamAlert({
          alertType: 'report',
          uniqueId: uniqueId,
          projectId: projectId,
          sampleId: sampleId,
          patientName: patientClientName || '',
          serviceName: serviceName || '',
          organisationHospital: organisationHospital || '',
          clinicianName: clinicianResearcherName || '',
          triggeredBy: createdBy || 'system'
        });
        console.log('📧 Report Team alert email sent successfully');
      } catch (emailError) {
        console.error('Warning: Failed to send Report Team alert email', (emailError as Error).message);
        // Don't fail the request if email fails
      }

      res.json({
        success: true,
        recordId: uniqueId,
        bioinformaticsId: bioinformaticsId,
        table: 'report_management',
        message: 'Bioinformatics record sent to report_management table',
      });
    } catch (error) {
      console.error('Error in send-to-reports:', error);

      // 🔍 Handle duplicate key error specifically
      if ((error as any).code === 'ER_DUP_ENTRY' || (error as any).sqlState === '23000') {
        console.log('Duplicate entry error - report already exists');
        return res.status(409).json({
          success: true,
          alreadyExists: true,
          message: 'Report has already been released for this sample.',
          error: (error as Error).message,
        });
      }

      res.status(500).json({
        message: 'Failed to send bioinformatics record to Reports',
        error: (error as Error).message,
      });
    }
  });

  // ============================================================================
  // Finance Routes (FinanceManagement.tsx -> finance_sheet table)
  // ============================================================================
  app.get("/api/finance/records", async (req, res) => {
    try {
      const page = parseInt(String(req.query.page || '1')) || 1;
      const pageSize = parseInt(String(req.query.pageSize || '25')) || 25;
      const sortBy = req.query.sortBy ? String(req.query.sortBy) : null;
      const sortDir = req.query.sortDir === 'asc' ? 'asc' : 'desc';
      const query = req.query.query ? String(req.query.query) : null;
      const result = await storage.getFinanceRecords({ page, pageSize, sortBy, sortDir: sortDir as any, query });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch finance records" });
    }
  });

  app.post("/api/finance/records", async (req, res) => {
    try {
      // Normalize incoming payload: convert date strings to Date objects and fill amount/totalAmount from invoiceAmount if missing
      const normalize = (obj: any) => {
        if (!obj || typeof obj !== 'object') return obj;
        const copy = { ...obj };
        const dateKeys = ['paymentDate', 'dueDate', 'invoiceDate', 'balanceAmountReceivedDate', 'dateSampleCollected'];
        for (const k of dateKeys) {
          if (copy[k] && typeof copy[k] === 'string') {
            const d = new Date(copy[k]);
            if (!isNaN(d.getTime())) copy[k] = d;
          }
        }
        // Ensure required numeric fields are present
        if (copy.amount == null && copy.invoiceAmount != null) copy.amount = copy.invoiceAmount;
        if (copy.totalAmount == null) {
          if (copy.totalAmount == null && copy.amount != null && copy.taxAmount != null) {
            // try compute if numeric
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

      // Warn if projectId is missing - this is crucial for data integrity
      if (!normalized.projectId) {
        console.warn('[API] Finance record created without projectId:', {
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

      // Send payment notification
      try {
        const totalAmount = parseFloat((record as any).totalAmount?.toString() || '0');
        const organisationHospital = (record as any).organisationHospital || 'Unknown Organization';
        const paymentStatus = (record as any).paymentStatus;

        if (paymentStatus === 'paid') {
          await notificationService.notifyPaymentReceived(
            String(record.id),
            totalAmount,
            organisationHospital,
            'system'
          );
        } else if (paymentStatus === 'pending') {
          await notificationService.notifyPaymentPending(
            String(record.id),
            totalAmount,
            organisationHospital,
            'system'
          );
        }
      } catch (notificationError) {
        console.error('Failed to send finance notification:', notificationError);
      }

      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to create finance record" });
    }
  });

  // Delete finance record
  app.delete('/api/finance/records/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteFinanceRecord(id);
      if (!ok) return res.status(500).json({ message: 'Failed to delete finance record' });
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete finance record', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete finance record' });
    }
  });

  // Logistics routes
  app.get("/api/logistics", async (req, res) => {
    try {
      const tracking = await storage.getLogisticsTracking();
      res.json(tracking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logistics tracking" });
    }
  });

  app.post("/api/logistics", async (req, res) => {
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

  // Pricing routes
  app.get("/api/pricing", async (req, res) => {
    try {
      const pricing = await storage.getPricing();
      res.json(pricing);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pricing" });
    }
  });

  app.post("/api/pricing", async (req, res) => {
    try {
      const result = insertPricingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid pricing data", errors: result.error.errors });
      }

      const pricing = await storage.createPricing(result.data);
      res.json(pricing);
    } catch (error) {
      res.status(500).json({ message: "Failed to create pricing" });
    }
  });

  // Sales activities routes
  app.get("/api/sales/activities", async (req, res) => {
    try {
      const activities = await storage.getSalesActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales activities" });
    }
  });

  app.post("/api/sales/activities", async (req, res) => {
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

  // Clients routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // ============================================================================
  // Canonical Endpoints (Preferred Routes)
  // ============================================================================
  // These are the canonical endpoints that frontend pages should use:
  // - /api/leads (LeadManagement.tsx -> lead_management table)
  // - /api/sample-tracking (SampleTracking.tsx -> sample_tracking table)
  // - /api/finance (FinanceManagement.tsx -> finance_sheet table)
  // - /api/genetic-counselling (GeneticCounselling.tsx -> genetic_counselling_records table)
  // - /api/labprocess-discovery (LabProcessing Discovery -> labprocess_discovery_sheet table)
  // - /api/labprocess-clinical (LabProcessing Clinical -> labprocess_clinical_sheet table)
  // - /api/bioinfo-discovery (Bioinformatics Discovery -> bioinformatics_sheet_discovery table)
  // - /api/bioinfo-clinical (Bioinformatics Clinical -> bioinformatics_sheet_clinical table)
  // - /api/nutrition (Nutrition.tsx -> nutritional_management table)
  // - /api/process-master (ProcessMaster.tsx -> process_master_sheet table)
  // ============================================================================

  // Note: /api/leads is already defined above. Sample tracking routes below...

  // Sample Tracking Canonical Routes - maps to sample_tracking table (via storage)
  // These route requests directly to the same storage methods as /api/samples
  app.get('/api/sample-tracking', async (req, res) => {
    try {
      const samples = await storage.getSamples();
      res.json(samples);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch sample tracking records' });
    }
  });

  app.put('/api/sample-tracking/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = normalizeDateFields(req.body);
      const result = insertSampleSchema.partial().safeParse(updates);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid sample data', errors: result.error.errors });
      }
      const sample = await storage.updateSample(id, result.data as any);
      if (!sample) return res.status(404).json({ message: 'Sample not found' });
      res.json(sample);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update sample tracking record' });
    }
  });

  app.delete('/api/sample-tracking/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteSample(id);
      if (!ok) return res.status(500).json({ message: 'Failed to delete sample tracking record' });
      res.json({ id });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete sample tracking record' });
    }
  });

  // Finance Canonical Routes - maps to finance_sheet table
  app.get('/api/finance', async (req, res) => {
    try {
      const page = parseInt(String(req.query.page || '1')) || 1;
      const pageSize = parseInt(String(req.query.pageSize || '25')) || 25;
      const sortBy = req.query.sortBy ? String(req.query.sortBy) : null;
      const sortDir = req.query.sortDir === 'asc' ? 'asc' : 'desc';
      const query = req.query.query ? String(req.query.query) : null;
      const result = await storage.getFinanceRecords({ page, pageSize, sortBy, sortDir: sortDir as any, query });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch finance records' });
    }
  });

  app.post('/api/finance', async (req, res) => {
    try {
      const result = insertFinanceRecordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid finance data', errors: result.error.errors });
      }
      const record = await storage.createFinanceRecord(result.data);
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create finance record' });
    }
  });

  app.put('/api/finance/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = normalizeDateFields(req.body);
      const result = insertFinanceRecordSchema.partial().safeParse(updates);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid finance data', errors: result.error.errors });
      }
      const record = await storage.updateFinanceRecord(id, result.data as any);
      if (!record) return res.status(404).json({ message: 'Finance record not found' });
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update finance record' });
    }
  });

  app.delete('/api/finance/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteFinanceRecord(id);
      if (!ok) return res.status(500).json({ message: 'Failed to delete finance record' });
      res.json({ id });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete finance record' });
    }
  });

  // Lab Processing Discovery Canonical Routes
  app.get('/api/labprocess-discovery', async (req, res) => {
    try {
      const queue = await storage.getLabProcessingQueue();
      const filtered = queue.filter((r: any) => (r.sample?.lead?.category || r.category || '').toLowerCase() === 'discovery');
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch discovery lab processing records' });
    }
  });

  // Lab Processing Clinical Canonical Routes
  app.get('/api/labprocess-clinical', async (req, res) => {
    try {
      const queue = await storage.getLabProcessingQueue();
      const filtered = queue.filter((r: any) => (r.sample?.lead?.category || r.category || '').toLowerCase() === 'clinical');
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch clinical lab processing records' });
    }
  });

  // Bioinformatics Discovery Canonical Routes
  app.get('/api/bioinfo-discovery', async (req, res) => {
    try {
      const lp = await storage.getLabProcessingQueue();
      const filtered = lp.filter((r: any) => (r.sample?.lead?.category || r.category || '').toLowerCase() === 'discovery');
      const mapped = filtered.map((item: any) => ({
        id: item.id,
        sample_id: item.sampleId,
        sequencing_date: item.processedAt ? new Date(item.processedAt).toISOString() : null,
        analysis_status: item.qcStatus || 'pending',
        total_mb_generated: (item as any).totalMbGenerated || 0,
        result_report_link: (item as any).reportLink || null,
        progenics_trf: item.progenicsTrf || null,
        progenics_raw_data: (item as any).progenicsRawData || null,
        third_party_name: (item as any).thirdPartyName || null,
        third_party_result_date: (item as any).thirdPartyResultDate ? new Date((item as any).thirdPartyResultDate).toISOString() : null,
        alert_to_technical: !!(item as any).alertToTechnical,
        alert_from_lab_team: !!(item as any).alertFromLabTeam,
        alert_from_finance: !!(item as any).alertFromFinance,
        report_related_status: (item as any).completeStatus || 'processing',
      }));
      res.json(mapped);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch discovery bioinformatics records' });
    }
  });

  // Bioinformatics Clinical Canonical Routes
  app.get('/api/bioinfo-clinical', async (req, res) => {
    try {
      const lp = await storage.getLabProcessingQueue();
      const filtered = lp.filter((r: any) => (r.sample?.lead?.category || r.category || '').toLowerCase() === 'clinical');
      const mapped = filtered.map((item: any) => ({
        id: item.id,
        sample_id: item.sampleId,
        sequencing_date: item.processedAt ? new Date(item.processedAt).toISOString() : null,
        analysis_status: item.qcStatus || 'pending',
        total_mb_generated: (item as any).totalMbGenerated || 0,
        result_report_link: (item as any).reportLink || null,
        progenics_trf: item.progenicsTrf || null,
        progenics_raw_data: (item as any).progenicsRawData || null,
        third_party_name: (item as any).thirdPartyName || null,
        third_party_result_date: (item as any).thirdPartyResultDate ? new Date((item as any).thirdPartyResultDate).toISOString() : null,
        alert_to_technical: !!(item as any).alertToTechnical,
        alert_from_lab_team: !!(item as any).alertFromLabTeam,
        alert_from_finance: !!(item as any).alertFromFinance,
        report_related_status: (item as any).completeStatus || 'processing',
      }));
      res.json(mapped);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch clinical bioinformatics records' });
    }
  });

  // Nutrition Canonical Routes - maps to nutritional_management table
  app.get('/api/nutrition', async (req, res) => {
    try {
      const { uniqueId } = req.query;
      let query = 'SELECT * FROM nutritional_management';
      let params: any[] = [];

      if (uniqueId) {
        query += ' WHERE unique_id = ?';
        params.push(uniqueId);
      }

      const [rows] = await pool.execute(query, params);
      res.json(rows || []);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch nutrition records' });
    }
  });

  app.post('/api/nutrition', async (req, res) => {
    try {
      const data = req.body || {};

      // === DATA SYNC VALIDATION (STRICT MODE): Verify parent Bioinformatics record exists ===
      if (data.project_id) {
        const [bioRows]: any = await pool.execute(
          `SELECT COUNT(*) as cnt FROM (
            SELECT project_id FROM bioinformatics_sheet_discovery WHERE project_id = ?
            UNION
            SELECT project_id FROM bioinformatics_sheet_clinical WHERE project_id = ?
          ) as combined`,
          [data.project_id, data.project_id]
        );
        if (bioRows[0]?.cnt === 0) {
          console.error(`❌ Data Sync BLOCKED: Nutrition record rejected for ${data.project_id} - no Bioinformatics record exists`);
          return res.status(400).json({
            message: 'Cannot create Nutrition record: Bioinformatics record must exist first',
            error: 'PARENT_RECORD_MISSING',
            projectId: data.project_id,
            requiredParent: 'bioinformatics_sheet_discovery OR bioinformatics_sheet_clinical'
          });
        } else {
          console.log(`✅ Data Sync Validation: Bioinformatics record verified for ${data.project_id}`);
        }
      }

      const keys = Object.keys(data);
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => data[k]);
      const [result]: any = await pool.execute(`INSERT INTO nutritional_management (${cols}) VALUES (${placeholders})`, values);
      const insertId = result.insertId || null;

      // === POST-INSERT VALIDATION: Verify record was created ===
      const [rows] = await pool.execute('SELECT * FROM nutritional_management WHERE id = ?', [insertId]);
      const insertVerified = (rows as any).length > 0;
      if (insertVerified) {
        console.log(`✅ Data Sync Validation: Nutrition record verified with ID ${insertId}`);
      } else {
        console.error(`❌ Data Sync Validation FAILED: Nutrition record NOT found for ID ${insertId}`);
      }

      res.json({ ...(rows as any)[0] ?? { id: insertId }, validation: { insertVerified } });
    } catch (error) {
      console.error('Failed to create nutrition record:', (error as Error).message);
      res.status(500).json({ message: 'Failed to create nutrition record', error: (error as Error).message });
    }
  });

  app.put('/api/nutrition/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[Nutrition PUT] ID:', id, 'Body:', JSON.stringify(req.body, null, 2));
      const updates = normalizeDateFields(req.body);
      console.log('[Nutrition PUT] After normalizeDateFields:', JSON.stringify(updates, null, 2));
      const result = insertNutritionalManagementSchema.partial().safeParse(updates);
      if (!result.success) {
        console.error('[Nutrition PUT] Validation failed:', JSON.stringify(result.error.errors, null, 2));
        return res.status(400).json({ message: 'Invalid nutrition data', errors: result.error.errors });
      }
      const validatedUpdates = result.data as any;
      console.log('[Nutrition PUT] Validated updates:', JSON.stringify(validatedUpdates, null, 2));

      // Convert camelCase keys to snake_case for database
      const fieldMapping: Record<string, string> = {
        uniqueId: 'unique_id',
        projectId: 'project_id',
        sampleId: 'sample_id',
        serviceName: 'service_name',
        patientClientName: 'patient_client_name',
        age: 'age',
        gender: 'gender',
        questionnaire: 'questionnaire',
        progenicsTrf: 'progenics_trf',
        questionnaireCallRecording: 'questionnaire_call_recording',
        dataAnalysisSheet: 'data_analysis_sheet',
        progenicsReport: 'progenics_report',
        nutritionChart: 'nutrition_chart',
        counsellingSessionDate: 'counselling_session_date',
        furtherCounsellingRequired: 'further_counselling_required',
        counsellingStatus: 'counselling_status',
        counsellingSessionRecording: 'counselling_session_recording',
        alertToTechnicalLead: 'alert_to_technical_lead',
        alertToReportTeam: 'alert_to_report_team',
        createdBy: 'created_by',
        modifiedBy: 'modified_by',
        modifiedAt: 'modified_at',
        remarksComment: 'remark_comment',
        remarkComment: 'remark_comment',
      };

      // Map camelCase keys to snake_case
      const dbUpdates: any = {};
      Object.keys(validatedUpdates).forEach(k => {
        const dbKey = fieldMapping[k] || k;
        dbUpdates[dbKey] = validatedUpdates[k];
      });

      const keys = Object.keys(dbUpdates);
      if (keys.length === 0) return res.status(400).json({ message: 'No updates provided' });
      const set = keys.map(k => `\`${k}\` = ?`).join(',');
      const values = keys.map(k => dbUpdates[k]);
      values.push(id);
      console.log('[Nutrition PUT] SQL:', `UPDATE nutritional_management SET ${set} WHERE id = ?`);
      console.log('[Nutrition PUT] Values:', values);
      await pool.execute(`UPDATE nutritional_management SET ${set} WHERE id = ?`, values);
      const [rows] = await pool.execute('SELECT * FROM nutritional_management WHERE id = ?', [id]);
      console.log('[Nutrition PUT] Success! Updated record:', (rows as any)[0]?.id);
      res.json((rows as any)[0] ?? null);
    } catch (error) {
      console.error('[Nutrition PUT] Error:', (error as Error).message);
      console.error('[Nutrition PUT] Stack:', (error as Error).stack);
      res.status(500).json({ message: 'Failed to update nutrition record', error: (error as Error).message });
    }
  });

  app.delete('/api/nutrition/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM nutritional_management WHERE id = ?', [id]);
      res.json({ id });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete nutrition record' });
    }
  });

  // Lab Process Discovery Sheet Direct Table Routes
  app.get('/api/labprocess-discovery-sheet', async (_req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM labprocess_discovery_sheet ORDER BY created_at DESC');
      res.json(rows || []);
    } catch (error) {
      console.error('Failed to fetch lab process discovery sheet', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch lab process discovery sheet' });
    }
  });

  // Lab Processing Discovery Sheet Routes - maps to labprocess_discovery_sheet table
  app.post('/api/labprocess-discovery-sheet', async (req, res) => {
    try {
      const data = req.body || {};

      // Field mapping: camelCase to snake_case
      const fieldMapping: Record<string, string> = {
        titleUniqueId: 'unique_id',
        projectId: 'project_id',
        sampleId: 'sample_id',
        clientId: 'client_id',
        serviceName: 'service_name',
        sampleType: 'sample_type',
        numberOfSamples: 'no_of_samples',
        sampleDeliveryDate: 'sample_received_date',
        extractionProtocol: 'extraction_protocol',
        extractionQualityCheck: 'extraction_quality_check',
        extractionQCStatus: 'extraction_qc_status',
        extractionProcess: 'extraction_process',
        libraryPreparationProtocol: 'library_preparation_protocol',
        libraryPreparationQualityCheck: 'library_preparation_quality_check',
        libraryQCStatus: 'library_preparation_qc_status',
        libraryProcess: 'library_preparation_process',
        purificationProtocol: 'purification_protocol',
        purificationQualityCheck: 'purification_quality_check',
        purificationQCStatus: 'purification_qc_status',
        purificationProcess: 'purification_process',
        alertToBioinformaticsTeam: 'alert_to_bioinformatics_team',
        alertToTechnicalLead: 'alert_to_technical_lead',
        progenicsTrf: 'progenics_trf',
        createdBy: 'created_by',
        remarksComment: 'remark_comment',
      };

      // Map camelCase keys to snake_case
      const mappedData: any = {};
      Object.keys(data).forEach(k => {
        const dbKey = fieldMapping[k] || k;
        mappedData[dbKey] = data[k];
      });

      const keys = Object.keys(mappedData);
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => mappedData[k]);

      console.log('[Lab Process Discovery POST] Creating record with columns:', keys);
      const [result]: any = await pool.execute(
        `INSERT INTO labprocess_discovery_sheet (${cols}) VALUES (${placeholders})`,
        values
      );

      const insertId = result.insertId || null;
      console.log('[Lab Process Discovery POST] Inserted with ID:', insertId);

      if (insertId) {
        const [rows] = await pool.execute('SELECT * FROM labprocess_discovery_sheet WHERE id = ?', [insertId]);
        return res.json((rows as any)[0] ?? { id: insertId });
      }

      res.json({ id: insertId });
    } catch (error) {
      console.error('[Lab Process Discovery POST] Error:', (error as Error).message);
      res.status(500).json({ message: 'Failed to create lab process discovery record', error: (error as Error).message });
    }
  });

  app.put('/api/labprocess-discovery-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[Lab Process Discovery PUT] Request body:', JSON.stringify(req.body, null, 2));

      const updates = normalizeDateFields(req.body);

      // Convert numeric booleans (0/1) to actual booleans for Zod validation
      if (updates.alertToBioinformaticsTeam !== undefined) {
        updates.alertToBioinformaticsTeam = updates.alertToBioinformaticsTeam === 1 || updates.alertToBioinformaticsTeam === true;
      }
      if (updates.alertToTechnicalLead !== undefined) {
        updates.alertToTechnicalLead = updates.alertToTechnicalLead === 1 || updates.alertToTechnicalLead === true;
      }

      console.log('[Lab Process Discovery PUT] Normalized updates:', JSON.stringify(updates, null, 2));

      const result = insertLabProcessDiscoverySheetSchema.partial().safeParse(updates);
      if (!result.success) {
        console.error('[Lab Process Discovery PUT] Validation failed:', result.error.errors);
        return res.status(400).json({ message: 'Invalid lab process data', errors: result.error.errors });
      }
      const validatedUpdates = result.data as any;
      console.log('[Lab Process Discovery PUT] Validated updates:', JSON.stringify(validatedUpdates, null, 2));

      // Convert camelCase keys to snake_case for database
      const fieldMapping: Record<string, string> = {
        titleUniqueId: 'unique_id',
        projectId: 'project_id',
        sampleId: 'sample_id',
        clientId: 'client_id',
        serviceName: 'service_name',
        sampleType: 'sample_type',
        numberOfSamples: 'no_of_samples',
        sampleDeliveryDate: 'sample_received_date',
        extractionProtocol: 'extraction_protocol',
        extractionQualityCheck: 'extraction_quality_check',
        extractionQCStatus: 'extraction_qc_status',
        extractionProcess: 'extraction_process',
        libraryPreparationProtocol: 'library_preparation_protocol',
        libraryPreparationQualityCheck: 'library_preparation_quality_check',
        libraryQCStatus: 'library_preparation_qc_status',
        libraryProcess: 'library_preparation_process',
        purificationProtocol: 'purification_protocol',
        purificationQualityCheck: 'purification_quality_check',
        purificationQCStatus: 'purification_qc_status',
        purificationProcess: 'purification_process',
        alertToBioinformaticsTeam: 'alert_to_bioinformatics_team',
        alertToTechnicalLead: 'alert_to_technical_lead',
        progenicsTrf: 'progenics_trf',
        createdAt: 'created_at',
        createdBy: 'created_by',
        modifiedAt: 'modified_at',
        modifiedBy: 'modified_by',
        remarksComment: 'remark_comment',
      };

      // Map camelCase keys to snake_case
      const dbUpdates: any = {};
      Object.keys(validatedUpdates).forEach(k => {
        const dbKey = fieldMapping[k] || k;
        let value = validatedUpdates[k];
        // Convert boolean back to number for database storage (TINYINT)
        if (typeof value === 'boolean') {
          value = value ? 1 : 0;
        }
        dbUpdates[dbKey] = value;
      });

      const keys = Object.keys(dbUpdates);
      if (keys.length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      const set = keys.map(k => `\`${k}\` = ?`).join(',');
      const values = keys.map(k => dbUpdates[k]);
      values.push(id);

      console.log('[Lab Process Discovery PUT] SQL Query:', `UPDATE labprocess_discovery_sheet SET ${set} WHERE id = ?`);
      console.log('[Lab Process Discovery PUT] Query values:', values);

      const result_query = await pool.execute(
        `UPDATE labprocess_discovery_sheet SET ${set} WHERE id = ?`,
        values
      );

      console.log('[Lab Process Discovery PUT] Update succeeded, fetching updated record');

      const [rows] = await pool.execute('SELECT * FROM labprocess_discovery_sheet WHERE id = ?', [id]);
      const updatedRecord = (rows as any)[0] ?? null;
      console.log('[Lab Process Discovery PUT] Success! Updated record:', JSON.stringify(updatedRecord, null, 2));
      res.json(updatedRecord);
    } catch (error) {
      console.error('[Lab Process Discovery PUT] Error:', (error as Error).message, (error as Error).stack);
      res.status(500).json({ message: 'Failed to update lab process discovery record' });
    }
  });

  app.delete('/api/labprocess-discovery-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM labprocess_discovery_sheet WHERE id = ?', [id]);
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete lab process discovery record', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete lab process discovery record' });
    }
  });

  // Lab Process Clinical Sheet Direct Table Routes
  app.get('/api/labprocess-clinical-sheet', async (_req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM labprocess_clinical_sheet ORDER BY created_at DESC');
      res.json(rows || []);
    } catch (error) {
      console.error('Failed to fetch lab process clinical sheet', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch lab process clinical sheet' });
    }
  });

  // Lab Processing Clinical Sheet Routes - maps to labprocess_clinical_sheet table
  app.post('/api/labprocess-clinical-sheet', async (req, res) => {
    try {
      const data = req.body || {};

      // Field mapping: camelCase to snake_case
      const fieldMapping: Record<string, string> = {
        titleUniqueId: 'unique_id',
        projectId: 'project_id',
        sampleId: 'sample_id',
        clientId: 'client_id',
        serviceName: 'service_name',
        sampleType: 'sample_type',
        numberOfSamples: 'no_of_samples',
        sampleDeliveryDate: 'sample_received_date',
        extractionProtocol: 'extraction_protocol',
        extractionQualityCheck: 'extraction_quality_check',
        extractionQCStatus: 'extraction_qc_status',
        extractionProcess: 'extraction_process',
        libraryPreparationProtocol: 'library_preparation_protocol',
        libraryPreparationQualityCheck: 'library_preparation_quality_check',
        libraryQCStatus: 'library_preparation_qc_status',
        libraryProcess: 'library_preparation_process',
        purificationProtocol: 'purification_protocol',
        purificationQualityCheck: 'purification_quality_check',
        purificationQCStatus: 'purification_qc_status',
        purificationProcess: 'purification_process',
        alertToBioinformaticsTeam: 'alert_to_bioinformatics_team',
        alertToTechnicalLead: 'alert_to_technical_lead',
        progenicsTrf: 'progenics_trf',
        createdBy: 'created_by',
        remarksComment: 'remark_comment',
      };

      // Map camelCase keys to snake_case
      const mappedData: any = {};
      Object.keys(data).forEach(k => {
        const dbKey = fieldMapping[k] || k;
        mappedData[dbKey] = data[k];
      });

      const keys = Object.keys(mappedData);
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => mappedData[k]);

      console.log('[Lab Process Clinical POST] Creating record with columns:', keys);
      const [result]: any = await pool.execute(
        `INSERT INTO labprocess_clinical_sheet (${cols}) VALUES (${placeholders})`,
        values
      );

      const insertId = result.insertId || null;
      console.log('[Lab Process Clinical POST] Inserted with ID:', insertId);

      if (insertId) {
        const [rows] = await pool.execute('SELECT * FROM labprocess_clinical_sheet WHERE id = ?', [insertId]);
        return res.json((rows as any)[0] ?? { id: insertId });
      }

      res.json({ id: insertId });
    } catch (error) {
      console.error('[Lab Process Clinical POST] Error:', (error as Error).message);
      res.status(500).json({ message: 'Failed to create lab process clinical record', error: (error as Error).message });
    }
  });

  app.put('/api/labprocess-clinical-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[Lab Process Clinical PUT] Request body:', JSON.stringify(req.body, null, 2));

      const updates = normalizeDateFields(req.body);

      // Convert numeric booleans (0/1) to actual booleans for Zod validation
      if (updates.alertToBioinformaticsTeam !== undefined) {
        updates.alertToBioinformaticsTeam = updates.alertToBioinformaticsTeam === 1 || updates.alertToBioinformaticsTeam === true;
      }
      if (updates.alertToTechnicalLead !== undefined) {
        updates.alertToTechnicalLead = updates.alertToTechnicalLead === 1 || updates.alertToTechnicalLead === true;
      }

      console.log('[Lab Process Clinical PUT] Normalized updates:', JSON.stringify(updates, null, 2));

      const result = insertLabProcessClinicalSheetSchema.partial().safeParse(updates);
      if (!result.success) {
        console.error('[Lab Process Clinical PUT] Validation failed:', result.error.errors);
        return res.status(400).json({ message: 'Invalid lab process data', errors: result.error.errors });
      }
      const validatedUpdates = result.data as any;
      console.log('[Lab Process Clinical PUT] Validated updates:', JSON.stringify(validatedUpdates, null, 2));

      // Convert camelCase keys to snake_case for database
      const fieldMapping: Record<string, string> = {
        titleUniqueId: 'unique_id',
        projectId: 'project_id',
        sampleId: 'sample_id',
        clientId: 'client_id',
        serviceName: 'service_name',
        sampleType: 'sample_type',
        numberOfSamples: 'no_of_samples',
        sampleDeliveryDate: 'sample_received_date',
        extractionProtocol: 'extraction_protocol',
        extractionQualityCheck: 'extraction_quality_check',
        extractionQCStatus: 'extraction_qc_status',
        extractionProcess: 'extraction_process',
        libraryPreparationProtocol: 'library_preparation_protocol',
        libraryPreparationQualityCheck: 'library_preparation_quality_check',
        libraryQCStatus: 'library_preparation_qc_status',
        libraryProcess: 'library_preparation_process',
        purificationProtocol: 'purification_protocol',
        purificationQualityCheck: 'purification_quality_check',
        purificationQCStatus: 'purification_qc_status',
        purificationProcess: 'purification_process',
        alertToBioinformaticsTeam: 'alert_to_bioinformatics_team',
        alertToTechnicalLead: 'alert_to_technical_lead',
        progenicsTrf: 'progenics_trf',
        createdAt: 'created_at',
        createdBy: 'created_by',
        modifiedAt: 'modified_at',
        modifiedBy: 'modified_by',
        remarksComment: 'remark_comment',
      };

      // Map camelCase keys to snake_case
      const dbUpdates: any = {};
      Object.keys(validatedUpdates).forEach(k => {
        const dbKey = fieldMapping[k] || k;
        let value = validatedUpdates[k];
        // Convert boolean back to number for database storage (TINYINT)
        if (typeof value === 'boolean') {
          value = value ? 1 : 0;
        }
        dbUpdates[dbKey] = value;
      });

      const keys = Object.keys(dbUpdates);
      if (keys.length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      const set = keys.map(k => `\`${k}\` = ?`).join(',');
      const values = keys.map(k => dbUpdates[k]);
      values.push(id);

      console.log('[Lab Process Clinical PUT] SQL Query:', `UPDATE labprocess_clinical_sheet SET ${set} WHERE id = ?`);
      console.log('[Lab Process Clinical PUT] Query values:', values);

      const result_query = await pool.execute(
        `UPDATE labprocess_clinical_sheet SET ${set} WHERE id = ?`,
        values
      );

      console.log('[Lab Process Clinical PUT] Update succeeded, fetching updated record');

      const [rows] = await pool.execute('SELECT * FROM labprocess_clinical_sheet WHERE id = ?', [id]);
      const updatedRecord = (rows as any)[0] ?? null;
      console.log('[Lab Process Clinical PUT] Success! Updated record:', JSON.stringify(updatedRecord, null, 2));
      res.json(updatedRecord);
    } catch (error) {
      console.error('[Lab Process Clinical PUT] Error:', (error as Error).message, (error as Error).stack);
      res.status(500).json({ message: 'Failed to update lab process clinical record' });
    }
  });

  app.delete('/api/labprocess-clinical-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM labprocess_clinical_sheet WHERE id = ?', [id]);
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete lab process clinical record', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete lab process clinical record' });
    }
  });

  // ============================================================================
  // Bioinformatics Sheet Routes - Direct table access for bioinformatics_sheet_discovery and bioinformatics_sheet_clinical
  // ============================================================================

  // Bioinformatics Discovery Sheet Routes
  app.get('/api/bioinfo-discovery-sheet', async (_req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM bioinformatics_sheet_discovery ORDER BY created_at DESC');
      res.json(rows || []);
    } catch (error) {
      console.error('Failed to fetch bioinformatics discovery sheet', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch bioinformatics discovery sheet' });
    }
  });

  app.post('/api/bioinfo-discovery-sheet', async (req, res) => {
    try {
      const data = req.body || {};

      // === DATA SYNC VALIDATION (STRICT MODE): Verify parent Lab Processing record exists ===
      if (data.project_id) {
        const [labProcessRows]: any = await pool.execute(
          'SELECT COUNT(*) as cnt FROM labprocess_discovery_sheet WHERE project_id = ?',
          [data.project_id]
        );
        if (labProcessRows[0]?.cnt === 0) {
          console.error(`❌ Data Sync BLOCKED: Bioinformatics record rejected for ${data.project_id} - no Lab Processing record exists`);
          return res.status(400).json({
            message: 'Cannot create Bioinformatics record: Lab Processing record must exist first',
            error: 'PARENT_RECORD_MISSING',
            projectId: data.project_id,
            requiredParent: 'labprocess_discovery_sheet'
          });
        } else {
          console.log(`✅ Data Sync Validation: Lab Processing record verified for ${data.project_id}`);
        }
      }

      const keys = Object.keys(data);
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => data[k]);

      // 🔑 FIX: Use INSERT IGNORE to create separate records per sample_id
      // Each sample_id (with suffix _1, _2, _3, _4) must be a SEPARATE bioinformatics record
      // NOT an upsert on unique_id (which is shared across all samples in a batch)
      const insertQuery = `
        INSERT IGNORE INTO bioinformatics_sheet_discovery (${cols}) 
        VALUES (${placeholders})
      `;

      console.log('Inserting bioinformatics_sheet_discovery record with columns:', keys);
      const [result]: any = await pool.execute(insertQuery, values);

      // Get the inserted row ID
      const recordId = result.insertId || data.id;
      console.log('Inserted bioinformatics_sheet_discovery with ID:', recordId);

      // === POST-INSERT VALIDATION: Verify record was actually created ===
      let insertVerified = false;
      if (data.sample_id) {
        const [verifyRows]: any = await pool.execute(
          'SELECT id FROM bioinformatics_sheet_discovery WHERE sample_id = ? LIMIT 1',
          [data.sample_id]
        );
        insertVerified = verifyRows.length > 0;
        if (insertVerified) {
          console.log(`✅ Data Sync Validation: Bioinformatics record verified for sample ${data.sample_id}`);
        } else {
          console.error(`❌ Data Sync Validation FAILED: Bioinformatics record NOT found for sample ${data.sample_id}`);
        }
      }

      // Send email notification to Bioinformatics team
      try {
        await emailAlertService.sendBioinformaticsAlert({
          alertType: 'bioinformatics',
          uniqueId: data.unique_id || '',
          projectId: data.project_id || '',
          sampleId: data.sample_id || '',
          patientName: data.patient_client_name || '',
          serviceName: data.service_name || '',
          organisationHospital: data.organisation_hospital || '',
          clinicianName: data.clinician_researcher_name || '',
          triggeredBy: data.created_by || 'system'
        });
        console.log('📧 Bioinformatics alert email sent successfully (Discovery)');
      } catch (emailError) {
        console.error('Warning: Failed to send Bioinformatics alert email', (emailError as Error).message);
        // Don't fail the request if email fails
      }

      // Fetch and return the record by sample_id (most specific identifier)
      if (data.sample_id) {
        const [rows] = await pool.execute('SELECT * FROM bioinformatics_sheet_discovery WHERE sample_id = ? ORDER BY id DESC LIMIT 1', [data.sample_id]);
        return res.json({
          ...(rows as any)[0] ?? { id: recordId },
          validation: { insertVerified }
        });
      }

      // Fallback: fetch by unique_id (but this will only return ONE record due to UNIQUE constraint)
      if (data.unique_id) {
        const [rows] = await pool.execute('SELECT * FROM bioinformatics_sheet_discovery WHERE unique_id = ? ORDER BY id DESC LIMIT 1', [data.unique_id]);
        return res.json({
          ...(rows as any)[0] ?? { id: recordId },
          validation: { insertVerified }
        });
      }

      res.json({ id: recordId, validation: { insertVerified } });
    } catch (error) {
      console.error('Failed to create bioinformatics discovery record', (error as Error).message);
      res.status(500).json({ message: 'Failed to create bioinformatics discovery record', error: (error as Error).message });
    }
  });

  app.put('/api/bioinfo-discovery-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const keys = Object.keys(updates);

      if (keys.length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      const set = keys.map(k => `\`${k}\` = ?`).join(',');
      const values = keys.map(k => updates[k]);
      values.push(id);

      await pool.execute(
        `UPDATE bioinformatics_sheet_discovery SET ${set} WHERE id = ?`,
        values
      );

      const [rows] = await pool.execute('SELECT * FROM bioinformatics_sheet_discovery WHERE id = ?', [id]);
      res.json((rows as any)[0] ?? null);
    } catch (error) {
      console.error('Failed to update bioinformatics discovery record', (error as Error).message);
      res.status(500).json({ message: 'Failed to update bioinformatics discovery record' });
    }
  });

  app.delete('/api/bioinfo-discovery-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM bioinformatics_sheet_discovery WHERE id = ?', [id]);
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete bioinformatics discovery record', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete bioinformatics discovery record' });
    }
  });

  // Bioinformatics Clinical Sheet Routes
  app.get('/api/bioinfo-clinical-sheet', async (_req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM bioinformatics_sheet_clinical ORDER BY created_at DESC');
      res.json(rows || []);
    } catch (error) {
      console.error('Failed to fetch bioinformatics clinical sheet', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch bioinformatics clinical sheet' });
    }
  });

  app.post('/api/bioinfo-clinical-sheet', async (req, res) => {
    try {
      const data = req.body || {};

      // === DATA SYNC VALIDATION (STRICT MODE): Verify parent Lab Processing record exists ===
      if (data.project_id) {
        const [labProcessRows]: any = await pool.execute(
          'SELECT COUNT(*) as cnt FROM labprocess_clinical_sheet WHERE project_id = ?',
          [data.project_id]
        );
        if (labProcessRows[0]?.cnt === 0) {
          console.error(`❌ Data Sync BLOCKED: Bioinformatics Clinical record rejected for ${data.project_id} - no Lab Processing Clinical record exists`);
          return res.status(400).json({
            message: 'Cannot create Bioinformatics Clinical record: Lab Processing Clinical record must exist first',
            error: 'PARENT_RECORD_MISSING',
            projectId: data.project_id,
            requiredParent: 'labprocess_clinical_sheet'
          });
        } else {
          console.log(`✅ Data Sync Validation: Lab Processing Clinical record verified for ${data.project_id}`);
        }
      }

      const keys = Object.keys(data);
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => data[k]);

      // 🔑 FIX: Use INSERT IGNORE to create separate records per sample_id
      const insertQuery = `
        INSERT IGNORE INTO bioinformatics_sheet_clinical (${cols}) 
        VALUES (${placeholders})
      `;

      console.log('🔍 Inserting bioinformatics_sheet_clinical record with columns:', keys);
      const [result]: any = await pool.execute(insertQuery, values);

      // Get the inserted row ID
      const recordId = result.insertId || data.id;
      console.log('✅ Inserted bioinformatics_sheet_clinical with ID:', recordId);

      // === POST-INSERT VALIDATION: Verify record was actually created ===
      let insertVerified = false;
      if (data.sample_id) {
        const [verifyRows]: any = await pool.execute(
          'SELECT id FROM bioinformatics_sheet_clinical WHERE sample_id = ? LIMIT 1',
          [data.sample_id]
        );
        insertVerified = verifyRows.length > 0;
        if (insertVerified) {
          console.log(`✅ Data Sync Validation: Bioinformatics Clinical record verified for sample ${data.sample_id}`);
        } else {
          console.error(`❌ Data Sync Validation FAILED: Bioinformatics Clinical record NOT found for sample ${data.sample_id}`);
        }
      }

      // Send email notification to Bioinformatics team
      try {
        await emailAlertService.sendBioinformaticsAlert({
          alertType: 'bioinformatics',
          uniqueId: data.unique_id || '',
          projectId: data.project_id || '',
          sampleId: data.sample_id || '',
          patientName: data.patient_client_name || '',
          serviceName: data.service_name || '',
          organisationHospital: data.organisation_hospital || '',
          clinicianName: data.clinician_researcher_name || '',
          triggeredBy: data.created_by || 'system'
        });
        console.log('📧 Bioinformatics alert email sent successfully (Clinical)');
      } catch (emailError) {
        console.error('Warning: Failed to send Bioinformatics alert email', (emailError as Error).message);
        // Don't fail the request if email fails
      }

      // Fetch and return the record by sample_id (most specific identifier)
      if (data.sample_id) {
        const [rows] = await pool.execute('SELECT * FROM bioinformatics_sheet_clinical WHERE sample_id = ? ORDER BY id DESC LIMIT 1', [data.sample_id]);
        return res.json({
          ...(rows as any)[0] ?? { id: recordId },
          validation: { insertVerified }
        });
      }

      // Fallback: fetch by unique_id
      if (data.unique_id) {
        const [rows] = await pool.execute('SELECT * FROM bioinformatics_sheet_clinical WHERE unique_id = ? ORDER BY id DESC LIMIT 1', [data.unique_id]);
        return res.json({
          ...(rows as any)[0] ?? { id: recordId },
          validation: { insertVerified }
        });
      }

      res.json({ id: recordId, validation: { insertVerified } });
    } catch (error) {
      console.error('Failed to create bioinformatics clinical record', (error as Error).message);
      res.status(500).json({ message: 'Failed to create bioinformatics clinical record', error: (error as Error).message });
    }
  });

  app.put('/api/bioinfo-clinical-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const keys = Object.keys(updates);

      if (keys.length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      const set = keys.map(k => `\`${k}\` = ?`).join(',');
      const values = keys.map(k => updates[k]);
      values.push(id);

      await pool.execute(
        `UPDATE bioinformatics_sheet_clinical SET ${set} WHERE id = ?`,
        values
      );

      const [rows] = await pool.execute('SELECT * FROM bioinformatics_sheet_clinical WHERE id = ?', [id]);
      res.json((rows as any)[0] ?? null);
    } catch (error) {
      console.error('Failed to update bioinformatics clinical record', (error as Error).message);
      res.status(500).json({ message: 'Failed to update bioinformatics clinical record' });
    }
  });

  app.delete('/api/bioinfo-clinical-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM bioinformatics_sheet_clinical WHERE id = ?', [id]);
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete bioinformatics clinical record', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete bioinformatics clinical record' });
    }
  });

  // Alert Lab Process - Routes based on project ID prefix
  app.post('/api/alert-lab-process', async (req, res) => {
    try {
      const { sampleId, projectId, uniqueId, sampleType, clientId, serviceName, sampleDeliveryDate, createdBy } = req.body;

      console.log('Alert Lab Process triggered for sample:', sampleId, 'Project ID:', projectId);

      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }

      // Determine destination table based on project ID prefix
      const isDiscovery = projectId.startsWith('DG');
      const isClinical = projectId.startsWith('PG');

      console.log('Project ID analysis - Discovery:', isDiscovery, 'Clinical:', isClinical);

      if (!isDiscovery && !isClinical) {
        return res.status(400).json({ message: 'Project ID must start with DG (Discovery) or PG (Clinical)' });
      }

      // Fetch lead data to get serviceName, sampleType, numberOfSamples if not provided
      let leadData: any = { service_name: serviceName, sample_type: sampleType };
      try {
        const [leadRows]: any = await pool.execute(
          'SELECT service_name, sample_type, no_of_samples, lead_created_by FROM lead_management WHERE unique_id = ? LIMIT 1',
          [uniqueId]
        );
        if (leadRows && leadRows.length > 0) {
          const lead = leadRows[0];
          leadData.service_name = serviceName || lead.service_name || null;
          leadData.sample_type = sampleType || lead.sample_type || null;
          leadData.no_of_samples = lead.no_of_samples || null;
          leadData.lead_created_by = lead.lead_created_by || null;
          console.log('Fetched lead data from lead_management table:', leadData);
        }
      } catch (leadError) {
        console.log('Note: Could not fetch lead data -', (leadError as Error).message);
      }

      // Determine number of samples to create
      const numberOfSamples = leadData.no_of_samples ? parseInt(String(leadData.no_of_samples), 10) : 1;
      console.log(`Creating ${numberOfSamples} sample record(s) in lab process sheet...`);

      // Create a base lab process data object
      const baseLabProcessData: Record<string, any> = {
        unique_id: uniqueId || '',
        project_id: projectId,
      };

      // Add optional fields if provided
      if (clientId) baseLabProcessData.client_id = clientId;
      if (leadData.service_name) baseLabProcessData.service_name = leadData.service_name;
      if (leadData.sample_type) baseLabProcessData.sample_type = leadData.sample_type;
      if (leadData.no_of_samples) baseLabProcessData.no_of_samples = leadData.no_of_samples;
      if (sampleDeliveryDate) {
        // Validate and convert ISO date string to DATE format (YYYY-MM-DD)
        const dateObj = new Date(sampleDeliveryDate);
        // Only use the date if it's valid (not NaN and looks like a valid year)
        if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() >= 1900 && dateObj.getFullYear() <= 2100) {
          const year = dateObj.getUTCFullYear();
          const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getUTCDate()).padStart(2, '0');
          baseLabProcessData.sample_received_date = `${year}-${month}-${day}`;
        } else {
          console.warn('Invalid sample delivery date received, skipping:', sampleDeliveryDate);
        }
      }

      baseLabProcessData.created_by = createdBy || leadData.lead_created_by || 'system';
      baseLabProcessData.created_at = new Date();

      let tableName = isDiscovery ? 'labprocess_discovery_sheet' : 'labprocess_clinical_sheet';
      const insertedIds: any[] = [];

      // Loop through numberOfSamples and create a record for each
      for (let sampleNum = 1; sampleNum <= numberOfSamples; sampleNum++) {
        // Create sample_id using PROJECT_ID as base with sequential number suffix
        // Sample ID format: PROJECT_ID_N (e.g., DG251227165628_1, DG251227165628_2, etc.)
        // This ensures Sample ID is distinct from Unique ID
        const recordSampleId = `${projectId}_${sampleNum}`;

        // Prepare lab process data for this sample
        // unique_id remains the same, only sample_id changes
        const labProcessData: Record<string, any> = {
          ...baseLabProcessData,
          sample_id: recordSampleId
        };

        const keys = Object.keys(labProcessData);
        const cols = keys.map(k => `\`${k}\``).join(',');
        const placeholders = keys.map(() => '?').join(',');
        const values = keys.map(k => labProcessData[k]);

        try {
          let insertResult;

          if (isDiscovery) {
            console.log(`Inserting sample ${sampleNum}/${numberOfSamples} into ${tableName} for discovery project:`, projectId);
            const result: any = await pool.execute(
              `INSERT INTO labprocess_discovery_sheet (${cols}) VALUES (${placeholders})`,
              values
            );
            insertResult = result[0];
          } else {
            console.log(`Inserting sample ${sampleNum}/${numberOfSamples} into ${tableName} for clinical project:`, projectId);
            const result: any = await pool.execute(
              `INSERT INTO labprocess_clinical_sheet (${cols}) VALUES (${placeholders})`,
              values
            );
            insertResult = result[0];
          }

          const insertId = (insertResult as any).insertId || null;
          insertedIds.push(insertId);
          console.log(`Inserted sample ${sampleNum}/${numberOfSamples} into ${tableName} with ID:`, insertId);
        } catch (insertError) {
          console.error(`Failed to insert sample ${sampleNum}/${numberOfSamples}:`, (insertError as Error).message);
          throw insertError;
        }
      }

      // Verify records were actually created in Lab Processing (Data Sync Validation)
      let verificationPassed = false;
      try {
        const verifyQuery = isDiscovery
          ? 'SELECT COUNT(*) as cnt FROM labprocess_discovery_sheet WHERE project_id = ?'
          : 'SELECT COUNT(*) as cnt FROM labprocess_clinical_sheet WHERE project_id = ?';
        const [verifyRows]: any = await pool.execute(verifyQuery, [projectId]);
        const recordCount = verifyRows[0]?.cnt || 0;
        if (recordCount >= numberOfSamples) {
          verificationPassed = true;
          console.log(`✅ Data Sync Validation PASSED: ${recordCount} record(s) verified in ${tableName} for project ${projectId}`);
        } else {
          console.error(`❌ Data Sync Validation FAILED: Expected ${numberOfSamples} records, found ${recordCount} in ${tableName}`);
        }
      } catch (verifyError) {
        console.error('Warning: Data sync verification failed', (verifyError as Error).message);
      }

      // Update sample tracking to set alertToLabprocessTeam flag
      // NOTE: Removed 'updated_at' column as it doesn't exist in sample_tracking table
      let sampleTrackingUpdated = false;
      try {
        const updateResult: any = await pool.execute(
          'UPDATE sample_tracking SET alert_to_labprocess_team = 1 WHERE id = ?',
          [sampleId]
        );
        if (updateResult[0]?.affectedRows > 0) {
          sampleTrackingUpdated = true;
          console.log('✅ Updated sample_tracking flag for sample:', sampleId);
        } else {
          console.warn('⚠️ Warning: Sample tracking record not found for ID:', sampleId);
        }
      } catch (updateError) {
        console.error('Warning: Failed to update sample_tracking flag', (updateError as Error).message);
        // Don't fail the entire request if sample update fails, but log prominently
      }

      // Send email notification to Lab Process team
      try {
        // Fetch patient name and clinician info from sample tracking or lead
        let patientName = '';
        let clinicianName = '';
        let organisationHospital = '';
        try {
          const [sampleRows]: any = await pool.execute(
            'SELECT patient_client_name, clinician_researcher_name, organisation_hospital FROM sample_tracking WHERE unique_id = ? LIMIT 1',
            [uniqueId]
          );
          if (sampleRows && sampleRows.length > 0) {
            patientName = sampleRows[0].patient_client_name || '';
            clinicianName = sampleRows[0].clinician_researcher_name || '';
            organisationHospital = sampleRows[0].organisation_hospital || '';
          }
        } catch (fetchErr) {
          console.log('Warning: Could not fetch sample details for email');
        }

        await emailAlertService.sendLabProcessAlert({
          alertType: 'lab_process',
          uniqueId: uniqueId,
          projectId: projectId,
          sampleId: sampleId,
          patientName: patientName,
          serviceName: leadData.service_name || serviceName,
          organisationHospital: organisationHospital,
          clinicianName: clinicianName,
          tableName: tableName,
          triggeredBy: createdBy || 'system'
        });
        console.log('📧 Lab Process alert email sent successfully');
      } catch (emailError) {
        console.error('Warning: Failed to send Lab Process alert email', (emailError as Error).message);
        // Don't fail the entire request if email fails
      }

      res.json({
        success: true,
        recordIds: insertedIds,
        numberOfRecordsCreated: insertedIds.length,
        table: tableName,
        message: `${insertedIds.length} lab process record(s) created in ${tableName}`,
        // Include validation results in response for transparency
        validation: {
          labProcessingVerified: verificationPassed,
          sampleTrackingFlagUpdated: sampleTrackingUpdated
        }
      });
    } catch (error) {
      console.error('Failed to alert lab process', (error as Error).message);
      res.status(500).json({ message: 'Failed to alert lab process', error: (error as Error).message });
    }
  });

  // Process Master Canonical Routes - DYNAMIC aggregation from all source tables
  // This provides real-time updates across all sections
  app.get('/api/process-master', async (req, res) => {
    try {
      // Comprehensive query that aggregates data from all source tables
      // Using subqueries instead of JOINs to avoid row multiplication when labprocess tables have multiple samples per unique_id
      // NOTE: COLLATE clause added to fix collation mismatch between tables
      const query = `
        SELECT 
          pm.id,
          pm.unique_id,
          pm.project_id,
          pm.sample_id,
          -- Get client_id from labprocess tables (where it's actually stored)
          COALESCE(
            (SELECT lpd2.client_id FROM labprocess_discovery_sheet lpd2 WHERE lpd2.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            (SELECT lpc2.client_id FROM labprocess_clinical_sheet lpc2 WHERE lpc2.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            pm.client_id
          ) as client_id,
          COALESCE(
            (SELECT st2.organisation_hospital FROM sample_tracking st2 WHERE st2.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1), 
            pm.organisation_hospital
          ) as organisation_hospital,
          COALESCE(
            (SELECT st3.clinician_researcher_name FROM sample_tracking st3 WHERE st3.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1), 
            pm.clinician_researcher_name
          ) as clinician_researcher_name,
          pm.speciality,
          pm.clinician_researcher_email,
          COALESCE(
            (SELECT st4.clinician_researcher_phone FROM sample_tracking st4 WHERE st4.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1), 
            pm.clinician_researcher_phone
          ) as clinician_researcher_phone,
          pm.clinician_researcher_address,
          COALESCE(
            (SELECT st5.patient_client_name FROM sample_tracking st5 WHERE st5.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1), 
            pm.patient_client_name
          ) as patient_client_name,
          pm.age,
          pm.gender,
          pm.patient_client_email,
          COALESCE(
            (SELECT st6.patient_client_phone FROM sample_tracking st6 WHERE st6.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1), 
            pm.patient_client_phone
          ) as patient_client_phone,
          pm.patient_client_address,
          COALESCE(
            (SELECT st7.sample_collection_date FROM sample_tracking st7 WHERE st7.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1), 
            pm.sample_collection_date
          ) as sample_collection_date,
          COALESCE(
            (SELECT st8.sample_recevied_date FROM sample_tracking st8 WHERE st8.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1), 
            pm.sample_recevied_date
          ) as sample_recevied_date,
          COALESCE(
            (SELECT lpd3.service_name FROM labprocess_discovery_sheet lpd3 WHERE lpd3.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            (SELECT lpc3.service_name FROM labprocess_clinical_sheet lpc3 WHERE lpc3.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            pm.service_name
          ) as service_name,
          COALESCE(
            (SELECT lpd4.sample_type FROM labprocess_discovery_sheet lpd4 WHERE lpd4.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            (SELECT lpc4.sample_type FROM labprocess_clinical_sheet lpc4 WHERE lpc4.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            pm.sample_type
          ) as sample_type,
          COALESCE(
            (SELECT lpd5.no_of_samples FROM labprocess_discovery_sheet lpd5 WHERE lpd5.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            (SELECT lpc5.no_of_samples FROM labprocess_clinical_sheet lpc5 WHERE lpc5.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            pm.no_of_samples
          ) as no_of_samples,
          pm.tat,
          COALESCE(
            (SELECT st9.sales_responsible_person FROM sample_tracking st9 WHERE st9.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1), 
            pm.sales_responsible_person
          ) as sales_responsible_person,
          COALESCE(
            (SELECT lpd6.progenics_trf FROM labprocess_discovery_sheet lpd6 WHERE lpd6.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            (SELECT lpc6.progenics_trf FROM labprocess_clinical_sheet lpc6 WHERE lpc6.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            pm.progenics_trf
          ) as progenics_trf,
          COALESCE(
            (SELECT st10.third_party_trf FROM sample_tracking st10 WHERE st10.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1), 
            pm.third_party_trf
          ) as third_party_trf,
          pm.progenics_report,
          COALESCE(
            (SELECT st11.sample_sent_to_third_party_date FROM sample_tracking st11 WHERE st11.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1), 
            pm.sample_sent_to_third_party_date
          ) as sample_sent_to_third_party_date,
          COALESCE(
            (SELECT st12.third_party_name FROM sample_tracking st12 WHERE st12.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1), 
            pm.third_party_name
          ) as third_party_name,
          COALESCE(
            (SELECT st13.third_party_report FROM sample_tracking st13 WHERE st13.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1), 
            pm.third_party_report
          ) as third_party_report,
          pm.results_raw_data_received_from_third_party_date,
          pm.logistic_status,
          COALESCE(
            (SELECT 
              CASE 
                WHEN fs2.total_amount_received_status = 1 OR fs2.total_amount_received_status = true THEN 'Completed'
                WHEN fs2.payment_receipt_amount > 0 THEN 'Partial'
                ELSE NULL
              END
            FROM finance_sheet fs2 WHERE fs2.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            pm.finance_status
          ) as finance_status,
          COALESCE(
            (SELECT lpd7.extraction_qc_status FROM labprocess_discovery_sheet lpd7 WHERE lpd7.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            (SELECT lpc7.extraction_qc_status FROM labprocess_clinical_sheet lpc7 WHERE lpc7.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            pm.lab_process_status
          ) as lab_process_status,
          COALESCE(
            (SELECT bid2.analysis_status FROM bioinformatics_sheet_discovery bid2 WHERE bid2.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            (SELECT bic2.analysis_status FROM bioinformatics_sheet_clinical bic2 WHERE bic2.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            pm.bioinformatics_status
          ) as bioinformatics_status,
          COALESCE(
            (SELECT nm2.counselling_status FROM nutritional_management nm2 WHERE nm2.unique_id COLLATE utf8mb4_unicode_ci = pm.unique_id COLLATE utf8mb4_unicode_ci LIMIT 1),
            pm.nutritional_management_status
          ) as nutritional_management_status,
          pm.progenics_report_release_date,
          pm.Remark_Comment,
          pm.created_at,
          pm.created_by,
          pm.modified_at,
          pm.modified_by
        FROM process_master_sheet pm
        ORDER BY pm.created_at DESC
      `;

      const [rows] = await pool.execute(query);
      res.json(rows || []);
    } catch (error) {
      console.error('Failed to fetch process master records:', (error as Error).message);
      // Fallback to basic query if JOINs fail (e.g., missing tables)
      try {
        const [rows] = await pool.execute('SELECT * FROM process_master_sheet ORDER BY created_at DESC');
        res.json(rows || []);
      } catch (fallbackError) {
        res.status(500).json({ message: 'Failed to fetch process master records' });
      }
    }
  });

  app.post('/api/process-master', async (req, res) => {
    try {
      const data = req.body || {};
      const keys = Object.keys(data);
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => data[k]);
      const [result]: any = await pool.execute(`INSERT INTO process_master_sheet (${cols}) VALUES (${placeholders})`, values);
      const insertId = result.insertId || null;
      const [rows] = await pool.execute('SELECT * FROM process_master_sheet WHERE id = ?', [insertId]);
      res.json((rows as any)[0] ?? { id: insertId });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create process master record' });
    }
  });

  app.put('/api/process-master/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const keys = Object.keys(updates);
      if (keys.length === 0) return res.status(400).json({ message: 'No updates provided' });
      const set = keys.map(k => `\`${k}\` = ?`).join(',');
      const values = keys.map(k => updates[k]);
      values.push(id);
      await pool.execute(`UPDATE process_master_sheet SET ${set}, modified_at = NOW() WHERE id = ?`, values);
      const [rows] = await pool.execute('SELECT * FROM process_master_sheet WHERE id = ?', [id]);
      const result = (rows as any)[0] ?? null;

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update process master record' });
    }
  });

  app.delete('/api/process-master/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM process_master_sheet WHERE id = ?', [id]);
      res.json({ id });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete process master record' });
    }
  });

  // Migration endpoint to fix existing sample_id values to use PROJECT_ID_N format
  // This is a one-time fix for data created before the proper format was implemented
  app.post('/api/migrate-sample-ids', async (req, res) => {
    try {
      console.log('Starting sample_id migration...');

      // Get all records from discovery sheet where sample_id doesn't follow PROJECT_ID_N format
      const [discoveryRows]: any = await pool.execute(
        `SELECT id, unique_id, project_id, sample_id FROM labprocess_discovery_sheet 
         WHERE sample_id NOT LIKE CONCAT(project_id, '_%') OR sample_id IS NULL`
      );

      let discoveryUpdated = 0;
      for (const row of discoveryRows) {
        if (row.project_id) {
          // Count existing samples with this project_id to get the next number
          const [countResult]: any = await pool.execute(
            `SELECT COUNT(*) as cnt FROM labprocess_discovery_sheet WHERE project_id = ? AND id < ?`,
            [row.project_id, row.id]
          );
          const sampleNum = (countResult[0]?.cnt || 0) + 1;
          const newSampleId = `${row.project_id}_${sampleNum}`;

          await pool.execute(
            'UPDATE labprocess_discovery_sheet SET sample_id = ? WHERE id = ?',
            [newSampleId, row.id]
          );
          discoveryUpdated++;
          console.log(`Updated discovery sheet ID ${row.id}: sample_id = ${newSampleId}`);
        }
      }

      // Get all records from clinical sheet where sample_id doesn't follow PROJECT_ID_N format
      const [clinicalRows]: any = await pool.execute(
        `SELECT id, unique_id, project_id, sample_id FROM labprocess_clinical_sheet 
         WHERE sample_id NOT LIKE CONCAT(project_id, '_%') OR sample_id IS NULL`
      );

      let clinicalUpdated = 0;
      for (const row of clinicalRows) {
        if (row.project_id) {
          const [countResult]: any = await pool.execute(
            `SELECT COUNT(*) as cnt FROM labprocess_clinical_sheet WHERE project_id = ? AND id < ?`,
            [row.project_id, row.id]
          );
          const sampleNum = (countResult[0]?.cnt || 0) + 1;
          const newSampleId = `${row.project_id}_${sampleNum}`;

          await pool.execute(
            'UPDATE labprocess_clinical_sheet SET sample_id = ? WHERE id = ?',
            [newSampleId, row.id]
          );
          clinicalUpdated++;
          console.log(`Updated clinical sheet ID ${row.id}: sample_id = ${newSampleId}`);
        }
      }

      // Also update process_master_sheet to match
      const [pmRows]: any = await pool.execute(
        `SELECT pm.id, pm.unique_id, pm.project_id, 
                COALESCE(lpd.sample_id, lpc.sample_id) as correct_sample_id
         FROM process_master_sheet pm
         LEFT JOIN labprocess_discovery_sheet lpd ON pm.unique_id = lpd.unique_id
         LEFT JOIN labprocess_clinical_sheet lpc ON pm.unique_id = lpc.unique_id
         WHERE COALESCE(lpd.sample_id, lpc.sample_id) IS NOT NULL 
           AND pm.sample_id != COALESCE(lpd.sample_id, lpc.sample_id)`
      );

      let pmUpdated = 0;
      for (const row of pmRows) {
        if (row.correct_sample_id) {
          await pool.execute(
            'UPDATE process_master_sheet SET sample_id = ? WHERE id = ?',
            [row.correct_sample_id, row.id]
          );
          pmUpdated++;
          console.log(`Updated process master ID ${row.id}: sample_id = ${row.correct_sample_id}`);
        }
      }

      console.log(`Migration complete: ${discoveryUpdated} discovery, ${clinicalUpdated} clinical, ${pmUpdated} process master records updated`);

      res.json({
        success: true,
        updated: {
          discovery: discoveryUpdated,
          clinical: clinicalUpdated,
          processMaster: pmUpdated
        }
      });
    } catch (error) {
      console.error('Migration failed:', (error as Error).message);
      res.status(500).json({ message: 'Migration failed', error: (error as Error).message });
    }
  });

  // ============================================================================
  // Adapter Endpoints for Component/Table Mapping (LEGACY - for backward compatibility)
  // ============================================================================
  // Maps component-specific table names to storage API methods:
  // - /api/project-samples (LeadManagement.tsx -> lead_management) [DEPRECATED: use /api/leads]
  // - /api/finance-sheet (FinanceManagement.tsx -> finance_sheet) [DEPRECATED: use /api/finance]
  // - /api/nutrition-sheet (Nutrition.tsx -> nutritional_management) [DEPRECATED: use /api/nutrition]
  // - /api/gc-registration (GeneticCounselling.tsx -> genetic_counselling_records) [already canonical]
  // - /api/lab-process/* (LabProcessing.tsx) [DEPRECATED: use /api/labprocess-discovery/clinical]
  // - /api/bioinfo/* (Bioinformatics.tsx) [DEPRECATED: use /api/bioinfo-discovery/clinical]
  // - /api/process-master (ProcessMaster.tsx) [already canonical]
  // ============================================================================

  // Project samples (adapter -> existing `samples` table)
  app.get('/api/project-samples', async (_req, res) => {
    try {
      // Prefer direct table if it exists
      try {
        const [rows] = await pool.execute('SELECT * FROM project_samples');
        return res.json(rows);
      } catch (e) {
        // fallback to storage.getSamples
        const rows = await storage.getSamples();
        return res.json(rows);
      }
    } catch (error) {
      console.error('Failed to fetch project samples', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch project samples' });
    }
  });

  app.post('/api/project-samples', async (req, res) => {
    try {
      try {
        const data = req.body || {};
        // Server-side authoritative Unique ID: generate if not provided
        try {
          if (!data.unique_id && !data.uniqueId) {
            // Prefer explicit role header from authenticated proxy/client
            let roleForId: string | undefined = undefined;
            try {
              const hdr = (req.headers['x-user-role'] || req.headers['x_user_role'] || req.headers['x-user']) as string | undefined;
              if (hdr && typeof hdr === 'string' && hdr.trim() !== '') roleForId = hdr.trim();
            } catch (e) {
              // ignore header parsing errors
            }

            // If no header role, try to resolve from createdBy field if provided
            if (!roleForId && data.createdBy) {
              try {
                const user = await storage.getUser(String(data.createdBy));
                if (user && user.role) roleForId = user.role;
              } catch (e) {
                // ignore lookup errors
              }
            }

            // fallback to leadType or default
            if (!roleForId) roleForId = data.leadType || data.lead_type || 'admin';

            const uid = await generateRoleId(String(roleForId));
            data.unique_id = uid;
            data.uniqueId = uid;
          }
        } catch (e) {
          console.warn('generateRoleId failed for project-samples insert', e);
        }
        const keys = Object.keys(data);
        const cols = keys.map(k => `\`${k}\``).join(',');
        const placeholders = keys.map(() => '?').join(',');
        const values = keys.map(k => data[k]);
        const [result]: any = await pool.execute(`INSERT INTO project_samples (${cols}) VALUES (${placeholders})`, values);
        const insertId = result.insertId || null;
        const [rows] = await pool.execute('SELECT * FROM project_samples WHERE id = ?', [insertId]);
        return res.json((rows as any)[0] ?? { id: insertId });
      } catch (e) {
        // If underlying table doesn't exist, reject
        console.error('Insert into project_samples failed, table may not exist', e);
        return res.status(500).json({ message: 'Failed to create project sample' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to create project sample' });
    }
  });

  app.put('/api/project-samples/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const keys = Object.keys(updates);
      if (keys.length === 0) return res.status(400).json({ message: 'No updates provided' });
      const set = keys.map(k => `\`${k}\` = ?`).join(',');
      const values = keys.map(k => updates[k]);
      values.push(id);
      await pool.execute(`UPDATE project_samples SET ${set} WHERE id = ?`, values);
      const [rows] = await pool.execute('SELECT * FROM project_samples WHERE id = ?', [id]);
      res.json((rows as any)[0] ?? null);
    } catch (error) {
      console.error('Failed to update project sample', (error as Error).message);
      res.status(500).json({ message: 'Failed to update project sample' });
    }
  });

  app.delete('/api/project-samples/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM project_samples WHERE id = ?', [id]);
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete project sample', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete project sample' });
    }
  });

  // Logistic sheet (adapter -> try logistic_sheet then fallback to logistics_tracking)
  app.get('/api/logistic-sheet', async (_req, res) => {
    try {
      try {
        const [rows] = await pool.execute('SELECT * FROM logistic_sheet');
        return res.json(rows);
      } catch (e) {
        const rows = await storage.getLogisticsTracking();
        return res.json(rows);
      }
    } catch (error) {
      console.error('Failed to fetch logistic sheet', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch logistic sheet' });
    }
  });

  app.post('/api/logistic-sheet', async (req, res) => {
    try {
      try {
        const data = req.body || {};
        const keys = Object.keys(data);
        const cols = keys.map(k => `\`${k}\``).join(',');
        const placeholders = keys.map(() => '?').join(',');
        const values = keys.map(k => data[k]);
        const [result]: any = await pool.execute(`INSERT INTO logistic_sheet (${cols}) VALUES (${placeholders})`, values);
        const insertId = result.insertId || null;
        const [rows] = await pool.execute('SELECT * FROM logistic_sheet WHERE id = ?', [insertId]);
        return res.json((rows as any)[0] ?? { id: insertId });
      } catch (e) {
        // fallback
        const created = await storage.createLogisticsTracking(req.body as any);
        return res.json(created);
      }
    } catch (error) {
      console.error('Failed to create logistic record', (error as Error).message);
      res.status(500).json({ message: 'Failed to create logistic record' });
    }
  });

  app.put('/api/logistic-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      try {
        const updates = req.body || {};
        const keys = Object.keys(updates);
        if (keys.length === 0) return res.status(400).json({ message: 'No updates provided' });
        const set = keys.map(k => `\`${k}\` = ?`).join(',');
        const values = keys.map(k => updates[k]);
        values.push(id);
        await pool.execute(`UPDATE logistic_sheet SET ${set} WHERE id = ?`, values);
        const [rows] = await pool.execute('SELECT * FROM logistic_sheet WHERE id = ?', [id]);
        return res.json((rows as any)[0] ?? null);
      } catch (e) {
        const updated = await storage.updateLogisticsTracking(id, req.body as any);
        return res.json(updated);
      }
    } catch (error) {
      console.error('Failed to update logistic record', (error as Error).message);
      res.status(500).json({ message: 'Failed to update logistic record' });
    }
  });

  app.delete('/api/logistic-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      try {
        await pool.execute('DELETE FROM logistic_sheet WHERE id = ?', [id]);
        return res.json({ id });
      } catch (e) {
        const ok = await storage.updateLogisticsTracking(id, { status: 'deleted' } as any);
        return res.json({ id, fallback: !!ok });
      }
    } catch (error) {
      console.error('Failed to delete logistic record', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete logistic record' });
    }
  });

  // Lab process sheets (discovery & clinical) - try table names, fallback to storage aggregation
  app.get('/api/lab-process/discovery', async (_req, res) => {
    try {
      try {
        const [rows] = await pool.execute('SELECT * FROM labprocess_discovery_sheet');
        return res.json(rows);
      } catch (e) {
        const queue = await storage.getLabProcessingQueue();
        return res.json(queue.filter((r: any) => (r.sample?.lead?.category || '').toLowerCase() === 'discovery'));
      }
    } catch (error) {
      console.error('Failed to fetch discovery lab process', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch discovery lab process' });
    }
  });

  app.get('/api/lab-process/clinical', async (_req, res) => {
    try {
      try {
        const [rows] = await pool.execute('SELECT * FROM labprocess_clinical_sheet');
        return res.json(rows);
      } catch (e) {
        const queue = await storage.getLabProcessingQueue();
        return res.json(queue.filter((r: any) => (r.sample?.lead?.category || '').toLowerCase() === 'clinical'));
      }
    } catch (error) {
      console.error('Failed to fetch clinical lab process', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch clinical lab process' });
    }
  });

  // Finance sheet adapter
  app.get('/api/finance-sheet', async (req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM finance_sheet ORDER BY created_at DESC');
      res.json(rows || []);
    } catch (error) {
      console.error('Failed to fetch finance sheet', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch finance sheet' });
    }
  });

  app.post('/api/finance-sheet', async (req, res) => {
    try {
      const data = req.body || {};
      const keys = Object.keys(data);
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => data[k]);

      console.log('Creating finance_sheet record with columns:', keys);
      const [result]: any = await pool.execute(
        `INSERT INTO finance_sheet (${cols}) VALUES (${placeholders})`,
        values
      );

      const insertId = result.insertId || null;
      console.log('Inserted finance_sheet with ID:', insertId);

      if (insertId) {
        const [rows] = await pool.execute('SELECT * FROM finance_sheet WHERE id = ?', [insertId]);
        return res.json((rows as any)[0] ?? { id: insertId });
      }

      res.json({ id: insertId });
    } catch (error) {
      console.error('Failed to create finance record', (error as Error).message);
      res.status(500).json({ message: 'Failed to create finance record', error: (error as Error).message });
    }
  });

  app.put('/api/finance-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};

      // Normalize incoming date/datetime strings to DB-friendly formats
      const normalizeDateStrings = (obj: any) => {
        if (!obj || typeof obj !== 'object') return obj;
        const copy = { ...obj };
        const dateKeys = ['sampleCollectionDate', 'invoiceDate', 'paymentReceiptDate', 'balanceAmountReceivedDate', 'thirdPartyPaymentDate'];
        const datetimeKeys = ['createdAt', 'modifiedAt'];
        const pad = (n: number) => String(n).padStart(2, '0');

        for (const k of dateKeys) {
          if (copy[k] && typeof copy[k] === 'string') {
            const d = new Date(copy[k]);
            if (!isNaN(d.getTime())) {
              copy[k] = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // YYYY-MM-DD
            }
          }
        }

        for (const k of datetimeKeys) {
          if (copy[k] && typeof copy[k] === 'string') {
            const d = new Date(copy[k]);
            if (!isNaN(d.getTime())) {
              copy[k] = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; // YYYY-MM-DD HH:MM:SS
            }
          }
        }

        return copy;
      };

      const normalizedInput = normalizeDateStrings(updates);

      if (Object.keys(normalizedInput).length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      // Convert camelCase keys to snake_case for database compatibility
      const snakeCaseUpdates: any = {};
      Object.keys(normalizedInput).forEach(k => {
        const snakeKey = k.replace(/([A-Z])/g, '_$1').toLowerCase();
        snakeCaseUpdates[snakeKey] = normalizedInput[k];
      });

      const keys = Object.keys(snakeCaseUpdates);
      const set = keys.map(k => `\`${k}\` = ?`).join(',');
      const values = keys.map(k => snakeCaseUpdates[k]);
      values.push(id);

      console.log('Updating finance_sheet ID:', id, 'with fields:', keys);
      await pool.execute(
        `UPDATE finance_sheet SET ${set} WHERE id = ?`,
        values
      );

      const [rows] = await pool.execute('SELECT * FROM finance_sheet WHERE id = ?', [id]);
      const result = (rows as any)[0] ?? null;

      console.log('Updated finance_sheet ID:', id);
      res.json(result);
    } catch (error) {
      console.error('Failed to update finance record', (error as Error).message);
      res.status(500).json({ message: 'Failed to update finance record', error: (error as Error).message });
    }
  });

  app.delete('/api/finance-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Deleting finance_sheet ID:', id);
      await pool.execute('DELETE FROM finance_sheet WHERE id = ?', [id]);
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete finance record', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete finance record', error: (error as Error).message });
    }
  });

  // Endpoint: upload screenshot/document for a finance record
  app.post('/api/finance-sheet/:id/upload-screenshot', uploadFinance.single('file'), async (req, res) => {
    try {
      const { id } = req.params;
      // Accept either the form field 'file' (preferred) or 'screenshot' (backwards-compat)
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const storagePath = `/uploads/finance/${file.filename}`;
      const filename = file.originalname || file.filename;
      const mimeType = file.mimetype || null;
      const sizeBytes = file.size || null;
      const uploadedBy = (req.headers['x-user-id'] as string) || (req.body && req.body.uploaded_by) || null;

      // Insert into finance_sheet_attachments
      const [result]: any = await pool.execute(
        `INSERT INTO finance_sheet_attachments (finance_id, filename, storage_path, mime_type, size_bytes, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, filename, storagePath, mimeType, sizeBytes, uploadedBy, new Date()]
      );

      const insertId = result.insertId || null;

      // If finance_sheet.screenshot_document is empty, set this upload as the primary screenshot_document
      try {
        await pool.execute('UPDATE finance_sheet SET screenshot_document = ? WHERE id = ? AND (screenshot_document IS NULL OR screenshot_document = "")', [storagePath, id]);
      } catch (e) {
        console.warn('Failed to update finance_sheet.screenshot_document', (e as Error).message);
      }

      const [rows] = await pool.execute('SELECT * FROM finance_sheet_attachments WHERE id = ?', [insertId]);
      const attachment = (rows as any)[0] ?? { id: insertId, filename, storage_path: storagePath };

      res.json({ attachment, url: storagePath });
    } catch (error) {
      console.error('Finance screenshot upload failed:', (error as Error).message);
      res.status(500).json({ message: 'Failed to upload screenshot', error: (error as Error).message });
    }
  });

  // Bioinformatics adapters (discovery & clinical)
  app.get('/api/bioinfo/discovery', async (_req, res) => {
    try {
      try {
        const [rows] = await pool.execute('SELECT * FROM discovery_bioinfo_sheet');
        return res.json(rows);
      } catch (e) {
        const lp = await storage.getLabProcessingQueue();
        return res.json(lp.filter((r: any) => (r.sample?.lead?.category || '').toLowerCase() === 'discovery'));
      }
    } catch (error) {
      console.error('Failed to fetch discovery bioinfo', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch discovery bioinfo' });
    }
  });

  app.get('/api/bioinfo/clinical', async (_req, res) => {
    try {
      try {
        const [rows] = await pool.execute('SELECT * FROM clinical_bioinfo_sheet');
        return res.json(rows);
      } catch (e) {
        const lp = await storage.getLabProcessingQueue();
        return res.json(lp.filter((r: any) => (r.sample?.lead?.category || '').toLowerCase() === 'clinical'));
      }
    } catch (error) {
      console.error('Failed to fetch clinical bioinfo', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch clinical bioinfo' });
    }
  });

  // Nutrition sheet adapter
  app.get('/api/nutrition-sheet', async (_req, res) => {
    try {
      try {
        const [rows] = await pool.execute('SELECT * FROM nutrition_sheet');
        return res.json(rows);
      } catch (e) {
        // no fallback table - return empty
        return res.json([]);
      }
    } catch (error) {
      console.error('Failed to fetch nutrition sheet', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch nutrition sheet' });
    }
  });

  app.post('/api/nutrition-sheet', async (req, res) => {
    try {
      const data = req.body || {};
      const keys = Object.keys(data);
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => data[k]);
      const [result]: any = await pool.execute(`INSERT INTO nutrition_sheet (${cols}) VALUES (${placeholders})`, values);
      const insertId = result.insertId || null;
      const [rows] = await pool.execute('SELECT * FROM nutrition_sheet WHERE id = ?', [insertId]);
      return res.json((rows as any)[0] ?? { id: insertId });
    } catch (error) {
      console.error('Failed to create nutrition record', (error as Error).message);
      res.status(500).json({ message: 'Failed to create nutrition record' });
    }
  });

  app.put('/api/nutrition-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const keys = Object.keys(updates);
      if (keys.length === 0) return res.status(400).json({ message: 'No updates provided' });
      const set = keys.map(k => `\`${k}\` = ?`).join(',');
      const values = keys.map(k => updates[k]);
      values.push(id);
      await pool.execute(`UPDATE nutrition_sheet SET ${set} WHERE id = ?`, values);
      const [rows] = await pool.execute('SELECT * FROM nutrition_sheet WHERE id = ?', [id]);
      res.json((rows as any)[0] ?? null);
    } catch (error) {
      console.error('Failed to update nutrition record', (error as Error).message);
      res.status(500).json({ message: 'Failed to update nutrition record' });
    }
  });

  app.delete('/api/nutrition-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM nutrition_sheet WHERE id = ?', [id]);
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete nutrition record', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete nutrition record' });
    }
  });

  // ============================================================================
  // Genetic Counselling ID Generation Endpoint
  // Generates GC-specific unique_id and project_id
  // ============================================================================
  app.post('/api/genetic-counselling/generate-ids', async (req, res) => {
    try {
      console.log('[GC ID Generation] Request received');
      // Generate unique_id using the SAME logic as Lead Management (role-based)
      // Note: Client-side generation now handles this, but keeping for backwards compatibility
      const roleForId = 'production'; // Default to production role for GC records
      const unique_id = await generateRoleId(String(roleForId));
      const project_id = ''; // GC records have empty project_id

      console.log('[GC ID Generation] Generated unique_id:', unique_id, 'using role:', roleForId);
      const responseData = { unique_id, project_id };
      console.log('[GC ID Generation] Sending response:', JSON.stringify(responseData));
      res.json(responseData);
    } catch (error) {
      console.error('[GC ID Generation] Error:', (error as Error).message);
      console.error('[GC ID Generation] Stack:', (error as Error).stack);
      res.status(500).json({ message: 'Failed to generate GC IDs', error: (error as Error).message });
    }
  });

  // Generate Project ID for GC (with GC prefix)
  app.post('/api/genetic-counselling/generate-project-id', async (req, res) => {
    try {
      console.log('[GC Project ID Generation] Request received');
      // Generate GC Project ID using generateProjectId with 'genetic-counselling' category
      // This will produce format like GCYYMMDDHHMMSS
      const projectId = await generateProjectId('genetic-counselling');
      console.log('[GC Project ID Generation] Generated project_id:', projectId);
      res.json({ project_id: projectId });
    } catch (error) {
      console.error('[GC Project ID Generation] Error:', (error as Error).message);
      res.status(500).json({ message: 'Failed to generate GC Project ID', error: (error as Error).message });
    }
  });

  // ============================================================================
  // Genetic Counselling Sheet Direct Table Routes (Direct SQL)
  // Maps to genetic_counselling_records table with proper field mapping
  // ============================================================================
  app.get('/api/genetic-counselling-sheet', async (_req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM genetic_counselling_records ORDER BY created_at DESC');
      console.log('Fetched genetic_counselling_records:', Array.isArray(rows) ? (rows as any).length : 0, 'records');
      res.json(rows || []);
    } catch (error) {
      console.error('Failed to fetch genetic counselling sheet', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch genetic counselling sheet' });
    }
  });

  app.post('/api/genetic-counselling-sheet', async (req, res) => {
    try {
      const data = req.body || {};
      console.log('[GC POST] Request body:', JSON.stringify(data, null, 2));

      // Convert numeric booleans to actual booleans
      if (data.approval_from_head !== undefined) {
        data.approval_from_head = data.approval_from_head === 1 || data.approval_from_head === true;
      }
      if (data.potential_patient_for_testing_in_future !== undefined) {
        data.potential_patient_for_testing_in_future = data.potential_patient_for_testing_in_future === 1 || data.potential_patient_for_testing_in_future === true;
      }
      if (data.extended_family_testing_requirement !== undefined) {
        data.extended_family_testing_requirement = data.extended_family_testing_requirement === 1 || data.extended_family_testing_requirement === true;
      }

      // Generate created_at if not provided
      if (!data.created_at) {
        data.created_at = new Date();
      }

      const keys = Object.keys(data).filter(k => k && data[k] !== undefined);
      if (keys.length === 0) {
        return res.status(400).json({ message: 'No data provided' });
      }

      // Convert booleans to numbers for database storage (TINYINT)
      const processedData: any = {};
      keys.forEach(k => {
        let value = data[k];
        if (typeof value === 'boolean') {
          value = value ? 1 : 0;
        }
        processedData[k] = value;
      });

      const processedKeys = Object.keys(processedData);
      const cols = processedKeys.map(k => `\`${k}\``).join(',');
      const placeholders = processedKeys.map(() => '?').join(',');
      const values = processedKeys.map(k => processedData[k]);

      console.log('[GC POST] Inserting with columns:', processedKeys);
      console.log('[GC POST] SQL:', `INSERT INTO genetic_counselling_records (${cols}) VALUES (${placeholders})`);
      console.log('[GC POST] Values:', values);

      const [result]: any = await pool.execute(
        `INSERT INTO genetic_counselling_records (${cols}) VALUES (${placeholders})`,
        values
      );

      const insertId = result.insertId || null;
      console.log('[GC POST] Insert succeeded with ID:', insertId);

      if (insertId) {
        const [rows] = await pool.execute('SELECT * FROM genetic_counselling_records WHERE id = ?', [insertId]);
        const createdRecord = (rows as any)[0] ?? { id: insertId };
        console.log('[GC POST] Success! Created record:', JSON.stringify(createdRecord, null, 2));
        return res.json(createdRecord);
      }

      res.json({ id: insertId });
    } catch (error) {
      console.error('[GC POST] Error:', (error as Error).message, (error as Error).stack);
      res.status(500).json({ message: 'Failed to create genetic counselling record', error: (error as Error).message });
    }
  });

  app.put('/api/genetic-counselling-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      console.log('[GC PUT] Request ID:', id);
      console.log('[GC PUT] Request body:', JSON.stringify(updates, null, 2));

      // Remove id from updates to prevent updating the primary key
      delete updates.id;

      // Convert numeric booleans to actual booleans
      if (updates.approval_from_head !== undefined) {
        updates.approval_from_head = updates.approval_from_head === 1 || updates.approval_from_head === true;
      }
      if (updates.potential_patient_for_testing_in_future !== undefined) {
        updates.potential_patient_for_testing_in_future = updates.potential_patient_for_testing_in_future === 1 || updates.potential_patient_for_testing_in_future === true;
      }
      if (updates.extended_family_testing_requirement !== undefined) {
        updates.extended_family_testing_requirement = updates.extended_family_testing_requirement === 1 || updates.extended_family_testing_requirement === true;
      }

      // Add modified_at timestamp
      updates.modified_at = new Date();

      const keys = Object.keys(updates).filter(k => updates[k] !== undefined);

      if (keys.length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      // Convert booleans to numbers for database storage (TINYINT)
      const processedUpdates: any = {};
      keys.forEach(k => {
        let value = updates[k];
        if (typeof value === 'boolean') {
          value = value ? 1 : 0;
        }
        processedUpdates[k] = value;
      });

      // Coerce known decimal fields (handle both snake_case and camelCase):
      // convert empty string -> null, numeric-like -> number
      const decimalFieldPairs: Array<[string, string]> = [
        ['budget_for_test_opted', 'budgetForTestOpted'],
        ['budget', 'budget']
      ];
      for (const [snake, camel] of decimalFieldPairs) {
        if (Object.prototype.hasOwnProperty.call(processedUpdates, snake) || Object.prototype.hasOwnProperty.call(processedUpdates, camel)) {
          const key = Object.prototype.hasOwnProperty.call(processedUpdates, snake) ? snake : camel;
          const v = processedUpdates[key];
          if (v === '' || v === null || v === undefined) {
            processedUpdates[key] = null;
          } else {
            const n = Number(v);
            processedUpdates[key] = Number.isNaN(n) ? null : n;
          }
        }
      }

      // Debug: log processed updates and values to diagnose decimal coercion issues
      console.log('[GC PUT] Incoming updates (after preliminary processing):', updates);
      console.log('[GC PUT] Processed updates (after coercion):', processedUpdates);

      const processedKeys = Object.keys(processedUpdates);
      const set = processedKeys.map(k => `\`${k}\` = ?`).join(',');
      const values = processedKeys.map(k => processedUpdates[k]);
      values.push(id);

      console.log('[GC PUT] SQL Query:', `UPDATE genetic_counselling_records SET ${set} WHERE id = ?`);
      console.log('[GC PUT] Values:', values);

      const result = await pool.execute(
        `UPDATE genetic_counselling_records SET ${set} WHERE id = ?`,
        values
      );

      const [rows] = await pool.execute('SELECT * FROM genetic_counselling_records WHERE id = ?', [id]);
      const updatedRecord = (rows as any)[0] ?? null;

      console.log('[GC PUT] Success! Updated record:', JSON.stringify(updatedRecord, null, 2));
      res.json(updatedRecord);
    } catch (error) {
      console.error('[GC PUT] Error:', (error as Error).message, (error as Error).stack);
      res.status(500).json({ message: 'Failed to update genetic counselling record', error: (error as Error).message });
    }
  });

  app.delete('/api/genetic-counselling-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[GC DELETE] Deleting record ID:', id);

      // First, fetch the record before deletion to confirm it exists
      const [checkRows] = await pool.execute('SELECT id FROM genetic_counselling_records WHERE id = ?', [id]);
      if ((checkRows as any).length === 0) {
        console.log('[GC DELETE] Record not found, ID:', id);
        return res.status(404).json({ message: 'Record not found' });
      }

      const result = await pool.execute('DELETE FROM genetic_counselling_records WHERE id = ?', [id]);
      console.log('[GC DELETE] Delete result:', result);
      console.log('[GC DELETE] Successfully deleted record ID:', id);
      res.json({ id });
    } catch (error) {
      console.error('[GC DELETE] Error:', (error as Error).message, (error as Error).stack);
      res.status(500).json({ message: 'Failed to delete genetic counselling record', error: (error as Error).message });
    }
  });

  // GC registration adapter -> maps to genetic counselling storage methods
  app.get('/api/gc-registration', async (_req, res) => {
    try {
      const rows = await storage.getGeneticCounselling();
      res.json(rows);
    } catch (error) {
      console.error('Failed to fetch gc registration', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch gc registration' });
    }
  });

  app.post('/api/gc-registration', async (req, res) => {
    try {
      const body = req.body || {};
      const created = await storage.createGeneticCounselling(body);
      res.json(created);
    } catch (error) {
      console.error('Failed to create gc registration', (error as Error).message);
      res.status(500).json({ message: 'Failed to create gc registration' });
    }
  });

  app.put('/api/gc-registration/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const updated = await storage.updateGeneticCounselling(id, updates);
      if (!updated) return res.status(404).json({ message: 'Record not found' });
      res.json(updated);
    } catch (error) {
      console.error('Failed to update gc registration', (error as Error).message);
      res.status(500).json({ message: 'Failed to update gc registration' });
    }
  });

  app.delete('/api/gc-registration/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteGeneticCounselling(id);
      if (!ok) return res.status(404).json({ message: 'Record not found' });
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete gc registration', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete gc registration' });
    }
  });

  app.post("/api/clients", async (req, res) => {
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

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Recent Activities API - Aggregates recent activities from all major tables
  app.get("/api/dashboard/recent-activities", async (req, res) => {
    try {
      const activities: Array<{
        id: string;
        action: string;
        entity: string;
        timestamp: string;
        type: 'lead' | 'sample' | 'report' | 'payment';
        userId: string;
        details?: string;
      }> = [];

      // Get recent leads (last 50)
      try {
        const [leadRows]: any = await pool.execute(`
          SELECT id, unique_id, patient_client_name, service_name, status, lead_created, lead_created_by, organisation_hospital
          FROM lead_management 
          ORDER BY lead_created DESC 
          LIMIT 50
        `);

        for (const lead of leadRows || []) {
          activities.push({
            id: `lead-${lead.id}`,
            action: lead.status === 'converted' ? 'Lead converted' : `New lead created`,
            entity: lead.patient_client_name || lead.organisation_hospital || 'Unknown',
            timestamp: lead.lead_created,
            type: 'lead',
            userId: lead.lead_created_by || 'system',
            details: lead.service_name ? `Service: ${lead.service_name}` : undefined
          });
        }
      } catch (leadError) {
        console.log('lead_management query skipped:', (leadError as Error).message);
      }

      // Get recent samples (last 50)
      try {
        const [sampleRows]: any = await pool.execute(`
          SELECT id, unique_id, patient_client_name, organisation_hospital, created_at, created_by, sample_recevied_date
          FROM sample_tracking 
          ORDER BY created_at DESC 
          LIMIT 50
        `);

        for (const sample of sampleRows || []) {
          activities.push({
            id: `sample-${sample.id}`,
            action: sample.sample_recevied_date ? 'Sample received' : 'Sample registered',
            entity: sample.patient_client_name || sample.organisation_hospital || sample.unique_id || 'Unknown',
            timestamp: sample.created_at,
            type: 'sample',
            userId: sample.created_by || 'system',
            details: sample.unique_id ? `Sample ID: ${sample.unique_id}` : undefined
          });
        }
      } catch (sampleError) {
        console.log('sample_tracking query skipped:', (sampleError as Error).message);
      }

      // Get recent reports from report_management (last 50)
      try {
        const [reportRows]: any = await pool.execute(`
          SELECT unique_id, project_id, patient_client_name, service_name, created_at, sales_responsible_person, report_release_date
          FROM report_management 
          ORDER BY COALESCE(created_at, report_release_date) DESC 
          LIMIT 50
        `);

        for (const report of reportRows || []) {
          const hasReleaseDate = report.report_release_date != null;
          activities.push({
            id: `report-${report.unique_id}`,
            action: hasReleaseDate ? 'Report released' : 'Report created',
            entity: report.patient_client_name || report.unique_id || 'Unknown',
            timestamp: report.created_at || new Date().toISOString(),
            type: 'report',
            userId: report.sales_responsible_person || 'system',
            details: report.service_name ? `Service: ${report.service_name}` : undefined
          });
        }
      } catch (reportError) {
        console.log('report_management query skipped:', (reportError as Error).message);
      }

      // Get recent finance activities (last 50)
      try {
        const [financeRows]: any = await pool.execute(`
          SELECT id, unique_id, patient_client_name, organisation_hospital, payment_receipt_amount, invoice_amount, created_at, created_by, mode_of_payment
          FROM finance_sheet 
          ORDER BY created_at DESC 
          LIMIT 50
        `);

        for (const finance of financeRows || []) {
          const amount = finance.payment_receipt_amount || finance.invoice_amount || 0;
          activities.push({
            id: `payment-${finance.id}`,
            action: finance.payment_receipt_amount ? 'Payment received' : 'Invoice generated',
            entity: finance.patient_client_name || finance.organisation_hospital || finance.unique_id || 'Unknown',
            timestamp: finance.created_at,
            type: 'payment',
            userId: finance.created_by || 'system',
            details: amount > 0 ? `Amount: ₹${amount}` : undefined
          });
        }
      } catch (financeError) {
        console.log('finance_sheet query skipped:', (financeError as Error).message);
      }

      // Sort all activities by timestamp (most recent first) and return top 20
      activities.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();
        return dateB - dateA;
      });

      res.json(activities.slice(0, 20));
    } catch (error) {
      console.error('Failed to fetch recent activities:', (error as Error).message);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  // Performance Metrics API - Calculates key performance indicators
  app.get("/api/dashboard/performance-metrics", async (req, res) => {
    try {
      let leadConversionRate = 0;
      let exceedingTAT = 0;
      let monthlyRevenue = 0;
      let lastMonthRevenue = 0;
      let revenueGrowth = 0;
      let activeSamples = 0;
      let completedReports = 0;
      let pendingApprovals = 0;
      const customerSatisfaction = 95; // Default placeholder

      // Lead Conversion Rate: (converted leads / total leads) * 100
      try {
        const [leadStats]: any = await pool.execute(`
          SELECT 
            COUNT(*) as total_leads,
            SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_leads
          FROM lead_management
        `);
        const totalLeads = Number(leadStats?.[0]?.total_leads || 0);
        const convertedLeads = Number(leadStats?.[0]?.converted_leads || 0);
        leadConversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
      } catch (e) { console.log('Lead stats query skipped:', (e as Error).message); }

      // Exceeding TAT: count from lead_management where TAT has passed
      try {
        const [tatStats]: any = await pool.execute(`
          SELECT COUNT(*) as exceeding_tat
          FROM lead_management
          WHERE status = 'converted'
          AND sample_recevied_date IS NOT NULL
          AND tat IS NOT NULL
          AND DATE_ADD(sample_recevied_date, INTERVAL CAST(tat AS UNSIGNED) DAY) < NOW()
        `);
        exceedingTAT = Number(tatStats?.[0]?.exceeding_tat || 0);
      } catch (e) { console.log('TAT stats query skipped:', (e as Error).message); }

      // Monthly Revenue from finance_sheet - use payment_receipt_date or invoice_date, or fallback to total
      try {
        // First try payment_receipt_date for current month
        const [monthlyRevenueStats]: any = await pool.execute(`
          SELECT COALESCE(SUM(payment_receipt_amount), 0) as monthly_revenue
          FROM finance_sheet
          WHERE (
            (payment_receipt_date IS NOT NULL AND MONTH(payment_receipt_date) = MONTH(CURRENT_DATE()) AND YEAR(payment_receipt_date) = YEAR(CURRENT_DATE()))
            OR (payment_receipt_date IS NULL AND invoice_date IS NOT NULL AND MONTH(invoice_date) = MONTH(CURRENT_DATE()) AND YEAR(invoice_date) = YEAR(CURRENT_DATE()))
          )
        `);
        monthlyRevenue = Number(monthlyRevenueStats?.[0]?.monthly_revenue || 0);

        // If still 0, get total revenue instead as a fallback for display
        if (monthlyRevenue === 0) {
          const [totalRevenueStats]: any = await pool.execute(`
            SELECT COALESCE(SUM(payment_receipt_amount), 0) as total_revenue FROM finance_sheet
          `);
          monthlyRevenue = Number(totalRevenueStats?.[0]?.total_revenue || 0);
        }
      } catch (e) { console.log('Monthly revenue query skipped:', (e as Error).message); }

      // Last Month Revenue (for growth calculation)
      try {
        const [lastMonthRevenueStats]: any = await pool.execute(`
          SELECT COALESCE(SUM(payment_receipt_amount), 0) as last_month_revenue
          FROM finance_sheet
          WHERE (
            (payment_receipt_date IS NOT NULL AND MONTH(payment_receipt_date) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(payment_receipt_date) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)))
            OR (payment_receipt_date IS NULL AND invoice_date IS NOT NULL AND MONTH(invoice_date) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(invoice_date) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)))
          )
        `);
        lastMonthRevenue = Number(lastMonthRevenueStats?.[0]?.last_month_revenue || 0);
        revenueGrowth = lastMonthRevenue > 0
          ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
          : 0;
      } catch (e) { console.log('Last month revenue query skipped:', (e as Error).message); }

      // Active Samples: samples currently in sample_tracking
      try {
        const [activeSamplesStats]: any = await pool.execute(`
          SELECT COUNT(*) as active_samples FROM sample_tracking
        `);
        activeSamples = Number(activeSamplesStats?.[0]?.active_samples || 0);
      } catch (e) { console.log('Active samples query skipped:', (e as Error).message); }

      // Completed Reports: count from report_management with report_release_date, or total count as fallback
      try {
        const [completedReportsStats]: any = await pool.execute(`
          SELECT COUNT(*) as completed_reports FROM report_management WHERE report_release_date IS NOT NULL
        `);
        completedReports = Number(completedReportsStats?.[0]?.completed_reports || 0);

        // If 0, get total count as fallback
        if (completedReports === 0) {
          const [totalReportsStats]: any = await pool.execute(`
            SELECT COUNT(*) as total_reports FROM report_management
          `);
          completedReports = Number(totalReportsStats?.[0]?.total_reports || 0);
        }
      } catch (e) {
        console.log('Completed reports query skipped:', (e as Error).message);
      }

      // Pending Approvals: count from report_management where approval_from_finance is false/null
      try {
        const [pendingApprovalsStats]: any = await pool.execute(`
          SELECT COUNT(*) as pending_approvals FROM report_management WHERE approval_from_finance = 0 OR approval_from_finance IS NULL
        `);
        pendingApprovals = Number(pendingApprovalsStats?.[0]?.pending_approvals || 0);
      } catch (e) {
        console.log('Pending approvals query skipped:', (e as Error).message);
      }

      res.json({
        leadConversionRate,
        exceedingTAT,
        customerSatisfaction,
        monthlyRevenue,
        activeSamples,
        completedReports,
        pendingApprovals,
        revenueGrowth
      });
    } catch (error) {
      console.error('Failed to fetch performance metrics:', (error as Error).message);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  // Revenue Analytics API
  app.get("/api/dashboard/revenue-analytics", async (req, res) => {
    try {
      // Get all finance records with date and amount data
      const [financeRows]: any = await pool.execute(`
        SELECT 
          id,
          created_at,
          budget,
          payment_receipt_amount,
          invoice_amount,
          service_name,
          organisation_hospital
        FROM finance_sheet
        ORDER BY created_at DESC
      `);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Get revenue targets
      const [targetRows]: any = await pool.execute('SELECT period_type, target_amount FROM revenue_targets');
      const targets: Record<string, number> = {};

      // Default fallback values
      targets['weekly'] = 50000;
      targets['monthly'] = 200000;
      targets['yearly'] = 2400000;

      // Override with DB values
      for (const row of targetRows) {
        targets[row.period_type] = parseFloat(row.target_amount);
      }

      // Weekly data (last 12 weeks)
      const weeklyData: { week: string; actual: number; target: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        let actual = 0;
        for (const row of financeRows) {
          const createdAt = new Date(row.created_at);
          if (createdAt >= weekStart && createdAt < weekEnd) {
            actual += parseFloat(row.payment_receipt_amount || row.budget || 0);
          }
        }

        const weekLabel = `Week ${12 - i}`;
        weeklyData.push({
          week: weekLabel,
          actual: Math.round(actual),
          target: targets['weekly'] // Use dynamic target
        });
      }

      // Monthly data (last 12 months)
      const monthlyData: { month: string; actual: number; target: number }[] = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const targetMonth = (currentMonth - i + 12) % 12;
        const targetYear = currentMonth - i < 0 ? currentYear - 1 : currentYear;

        let actual = 0;
        for (const row of financeRows) {
          const createdAt = new Date(row.created_at);
          if (createdAt.getMonth() === targetMonth && createdAt.getFullYear() === targetYear) {
            actual += parseFloat(row.payment_receipt_amount || row.budget || 0);
          }
        }

        monthlyData.push({
          month: `${monthNames[targetMonth]} ${targetYear}`,
          actual: Math.round(actual),
          target: targets['monthly'] // Use dynamic target
        });
      }

      // Yearly data (last 5 years)
      const yearlyData: { year: string; actual: number; target: number }[] = [];
      for (let i = 4; i >= 0; i--) {
        const targetYear = currentYear - i;

        let actual = 0;
        for (const row of financeRows) {
          const createdAt = new Date(row.created_at);
          if (createdAt.getFullYear() === targetYear) {
            actual += parseFloat(row.payment_receipt_amount || row.budget || 0);
          }
        }

        yearlyData.push({
          year: targetYear.toString(),
          actual: Math.round(actual),
          target: targets['yearly'] // Use dynamic target
        });
      }

      // Revenue breakdown by service
      const serviceBreakdown: { [key: string]: number } = {};
      for (const row of financeRows) {
        const service = row.service_name || 'Other';
        const amount = parseFloat(row.payment_receipt_amount || row.budget || 0);
        serviceBreakdown[service] = (serviceBreakdown[service] || 0) + amount;
      }

      // Calculate total revenue for percentage calculation
      const totalServiceRevenue = Object.values(serviceBreakdown).reduce((sum, val) => sum + val, 0);

      const breakdownData = Object.entries(serviceBreakdown)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          category: name || 'Other',
          revenue: Math.round(value),
          percentage: totalServiceRevenue > 0 ? Math.round((value / totalServiceRevenue) * 100) : 0,
          color: getRandomColor(name)
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10 services

      // Summary stats
      const totalRecords = financeRows.length;
      const totalRevenue = financeRows.reduce((sum: number, row: any) =>
        sum + parseFloat(row.payment_receipt_amount || row.budget || 0), 0
      );
      const thisMonthRevenue = monthlyData[monthlyData.length - 1]?.actual || 0;
      const lastMonthRevenue = monthlyData[monthlyData.length - 2]?.actual || 0;
      const monthlyGrowth = lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
        : '0';

      res.json({
        weekly: weeklyData,
        monthly: monthlyData,
        yearly: yearlyData,
        breakdown: breakdownData,
        summary: {
          totalRecords,
          totalRevenue: Math.round(totalRevenue),
          thisMonth: Math.round(thisMonthRevenue),
          lastMonth: Math.round(lastMonthRevenue),
          monthlyGrowth: parseFloat(monthlyGrowth)
        }
      });
    } catch (error) {
      console.error('Failed to fetch revenue analytics:', (error as Error).message);
      res.status(500).json({ message: "Failed to fetch revenue analytics" });
    }
  });

  // Update Revenue Targets API
  app.post("/api/dashboard/revenue-targets", async (req, res) => {
    try {
      const { weekly, monthly, yearly } = req.body;

      // Upsert weekly
      if (weekly !== undefined) {
        await pool.execute(
          'INSERT INTO revenue_targets (period_type, target_amount) VALUES (?, ?) ON DUPLICATE KEY UPDATE target_amount = VALUES(target_amount)',
          ['weekly', weekly]
        );
      }

      // Upsert monthly
      if (monthly !== undefined) {
        await pool.execute(
          'INSERT INTO revenue_targets (period_type, target_amount) VALUES (?, ?) ON DUPLICATE KEY UPDATE target_amount = VALUES(target_amount)',
          ['monthly', monthly]
        );
      }

      // Upsert yearly
      if (yearly !== undefined) {
        await pool.execute(
          'INSERT INTO revenue_targets (period_type, target_amount) VALUES (?, ?) ON DUPLICATE KEY UPDATE target_amount = VALUES(target_amount)',
          ['yearly', yearly]
        );
      }

      res.json({ message: "Targets updated successfully" });
    } catch (error) {
      console.error('Failed to update revenue targets:', error);
      res.status(500).json({ message: "Failed to update revenue targets" });
    }
  });

  // Helper function for chart colors
  // Helper function for chart colors
  const getRandomColor = (seed: string): string => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Finance routes
  app.get("/api/finance/stats", async (req, res) => {
    try {
      const stats = await storage.getFinanceStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch finance stats" });
    }
  });

  // ============================================================================
  // NEW STATS API ENDPOINTS
  // ============================================================================

  // Lead Management Stats (Projected Revenue & Actual Revenue)
  app.get("/api/leads/stats", async (req, res) => {
    try {
      const stats = await storage.getLeadsStats();
      res.json(stats);
    } catch (error) {
      console.error('Failed to fetch leads stats:', error);
      res.status(500).json({ message: "Failed to fetch leads stats" });
    }
  });

  // Sample Tracking Stats
  app.get("/api/sample-tracking/stats", async (req, res) => {
    try {
      const stats = await storage.getSampleTrackingStats();
      res.json(stats);
    } catch (error) {
      console.error('Failed to fetch sample tracking stats:', error);
      res.status(500).json({ message: "Failed to fetch sample tracking stats" });
    }
  });

  // Lab Processing Stats
  app.get("/api/lab-processing/stats", async (req, res) => {
    try {
      const stats = await storage.getLabProcessingStats();
      res.json(stats);
    } catch (error) {
      console.error('Failed to fetch lab processing stats:', error);
      res.status(500).json({ message: "Failed to fetch lab processing stats" });
    }
  });

  app.get("/api/finance/pending-approvals", async (req, res) => {
    try {
      const approvals = await storage.getPendingFinanceApprovals();
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  // Notifications routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Recycle bin routes
  app.get('/api/recycle', async (_req, res) => {
    try {
      const entries = await storage.listRecycleEntries();
      res.json(entries);
    } catch (error) {
      console.error('Failed to list recycle entries', (error as Error).message);
      res.status(500).json({ message: 'Failed to list recycle entries' });
    }
  });

  app.get('/api/recycle/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const entry = await storage.getRecycleEntry(id);
      if (!entry) return res.status(404).json({ message: 'Not found' });
      res.json(entry);
    } catch (error) {
      console.error('Failed to fetch recycle entry', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch recycle entry' });
    }
  });

  app.post('/api/recycle', async (req, res) => {
    try {
      const body = req.body || {};
      const created = await storage.createRecycleEntry({ entityType: body.entityType, entityId: body.entityId, data: body.data, originalPath: body.originalPath, createdBy: body.createdBy });
      res.json(created);
    } catch (error) {
      console.error('Failed to create recycle entry', (error as Error).message);
      res.status(500).json({ message: 'Failed to create recycle entry' });
    }
  });

  app.delete('/api/recycle/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const ok = await storage.deleteRecycleEntry(id);
      if (!ok) return res.status(500).json({ message: 'Failed to delete recycle entry' });
      res.json({ id });
    } catch (error) {
      console.error('Failed to delete recycle entry', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete recycle entry' });
    }
  });

  app.post('/api/recycle/:id/restore', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.restoreRecycleEntry(id);
      res.json(result);
    } catch (error) {
      console.error('Failed to restore recycle entry', (error as Error).message);
      res.status(500).json({ message: 'Failed to restore recycle entry', details: (error as Error).message });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
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

  // Delete notification
  app.delete("/api/notifications/:id", async (req, res) => {
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

  // Test notification creation endpoint
  app.post("/api/test/notification", async (req, res) => {
    try {
      console.log('Test notification endpoint called');
      const result = await notificationService.notifyLeadCreated(
        'test-lead-' + Date.now(),
        'Test Organization',
        'system'
      );
      res.json({ success: true, notification: result });
    } catch (error) {
      console.error('Test notification failed:', error);
      res.status(500).json({ message: "Failed to create test notification", error: (error as Error).message });
    }
  });

  // SharePoint sheets scan (diagnostic)
  app.get("/api/sharepoint/scan", async (_req, res) => {
    try {
      const dir = process.env.SHEETS_DIR || path.resolve(process.cwd(), "sharepoint sheets");
      if (!fs.existsSync(dir)) {
        return res.status(404).json({ message: `Directory not found: ${dir}` });
      }
      const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".xlsx") || f.toLowerCase().endsWith(".xls"));
      const result: any[] = [];
      for (const file of files) {
        const full = path.join(dir, file);
        try {
          const wb = xlsx.readFile(full, { cellDates: true });
          const sheets = wb.SheetNames.map((name) => {
            const ws = wb.Sheets[name];
            const aoa: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false });
            const headers = (aoa[0] || []).map((h) => String(h).trim());
            return { sheetName: name, headers, firstRows: aoa.slice(1, 6) };
          });
          result.push({ file, sheets });
        } catch (e: any) {
          result.push({ file, error: e?.message || String(e) });
        }
      }
      res.json({ ok: true, dir, files: files.length, summary: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to scan sharepoint sheets" });
    }
  });

  // Import leads from a specified Excel file and sheet
  app.post("/api/sharepoint/import/leads", async (req, res) => {
    try {
      const { fileName, sheetName } = req.body as { fileName: string; sheetName?: string };
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
      const rows: any[] = xlsx.utils.sheet_to_json(ws, { defval: null });

      // Basic column mapping; we'll refine after scanning results
      // Tries common header variants from your attachments
      const pick = (obj: any, keys: string[]): any => {
        for (const k of keys) {
          if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") return obj[k];
        }
        return null;
      }

      let created = 0;
      let updated = 0;
      const errors: any[] = [];

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

          if (!email && !phone) continue; // skip unusable row

          const existing = await storage.findLeadByEmailPhone(email || "", phone || "");
          if (existing) {
            await storage.updateLead(existing.id, {
              organization,
              location,
              referredDoctor,
              clinicHospitalName: clinicHospitalName || undefined,
              testName,
              sampleType,
              amountQuoted: isNaN(amountQuoted) ? (existing as any).amountQuoted : amountQuoted,
              tat: isNaN(tat) ? (existing as any).tat : tat,
              status: (status as any) || (existing as any).status,
            } as any);
            updated++;
          } else {
            const parsed = insertLeadSchema.safeParse({
              organization,
              location,
              referredDoctor,
              clinicHospitalName: clinicHospitalName || undefined,
              phone,
              email: email || `${Date.now()}@placeholder.local`,
              clientEmail: clientEmail || email || `${Date.now()}@placeholder.local`,
              testName,
              sampleType,
              amountQuoted: isNaN(amountQuoted) ? 0 : amountQuoted,
              tat: isNaN(tat) ? 0 : tat,
              status: (status as any) || undefined,
            });
            if (!parsed.success) {
              errors.push({ row: r, error: parsed.error.flatten() });
              continue;
            }
            await storage.createLead(parsed.data);
            created++;
          }
        } catch (e: any) {
          errors.push({ row: r, error: e?.message || String(e) });
        }
      }

      res.json({ ok: true, fileName, sheetName: selectedSheetName, created, updated, errorsCount: errors.length, errors: errors.slice(0, 10) });
    } catch (error) {
      res.status(500).json({ message: "Failed to import leads" });
    }
  });

  // Import finance records
  app.post("/api/sharepoint/import/finance", async (req, res) => {
    try {
      const { fileName, sheetName } = req.body as { fileName: string; sheetName?: string };
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
      const rows: any[] = xlsx.utils.sheet_to_json(ws, { defval: null });

      const pick = (obj: any, keys: string[]): any => {
        for (const k of keys) {
          if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") return obj[k];
        }
        return null;
      }

      let created = 0;
      const errors: any[] = [];

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

          if (amount <= 0) continue; // skip rows without valid amounts

          const parsed = insertFinanceRecordSchema.safeParse({
            invoiceNumber,
            amount,
            taxAmount,
            totalAmount,
            paymentStatus: (paymentStatus as any) || undefined,
            paymentMethod,
            paymentDate,
            dueDate,
          });
          if (!parsed.success) {
            errors.push({ row: r, error: parsed.error.flatten() });
            continue;
          }
          await storage.createFinanceRecord(parsed.data);
          created++;
        } catch (e: any) {
          errors.push({ row: r, error: e?.message || String(e) });
        }
      }

      res.json({ ok: true, fileName, sheetName: selectedSheetName, created, errorsCount: errors.length, errors: errors.slice(0, 10) });
    } catch (error) {
      res.status(500).json({ message: "Failed to import finance records" });
    }
  });

  // Import pricing
  app.post("/api/sharepoint/import/pricing", async (req, res) => {
    try {
      const { fileName, sheetName } = req.body as { fileName: string; sheetName?: string };
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
      const rows: any[] = xlsx.utils.sheet_to_json(ws, { defval: null });

      const pick = (obj: any, keys: string[]): any => {
        for (const k of keys) {
          if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") return obj[k];
        }
        return null;
      }

      let created = 0;
      const errors: any[] = [];

      for (const r of rows) {
        try {
          const testName = pick(r, ["Test Name", "Test", "Product", "Service", "Panel"]) || "Unknown Test";
          const testCode = pick(r, ["Test Code", "Code", "Product Code", "SKU"]) || `TEST-${Date.now()}`;
          const basePrice = Number(pick(r, ["Price", "Base Price", "Amount", "Cost"]) || 0);
          const discountedPrice = Number(pick(r, ["Discounted Price", "Sale Price", "Offer Price"]) || 0);
          const category = pick(r, ["Category", "Type", "Group"]) || null;
          const description = pick(r, ["Description", "Details", "Notes"]) || null;
          const turnaroundTime = Number(pick(r, ["TAT", "Turnaround Time", "Processing Time"]) || 0);

          if (basePrice <= 0) continue; // skip rows without valid prices

          const parsed = insertPricingSchema.safeParse({
            testName,
            testCode,
            basePrice,
            discountedPrice: discountedPrice > 0 ? discountedPrice : undefined,
            category,
            description,
            turnaroundTime: turnaroundTime > 0 ? turnaroundTime : undefined,
          });
          if (!parsed.success) {
            errors.push({ row: r, error: parsed.error.flatten() });
            continue;
          }
          await storage.createPricing(parsed.data);
          created++;
        } catch (e: any) {
          errors.push({ row: r, error: e?.message || String(e) });
        }
      }

      res.json({ ok: true, fileName, sheetName: selectedSheetName, created, errorsCount: errors.length, errors: errors.slice(0, 10) });
    } catch (error) {
      res.status(500).json({ message: "Failed to import pricing" });
    }
  });

  // Import clients
  app.post("/api/sharepoint/import/clients", async (req, res) => {
    try {
      const { fileName, sheetName } = req.body as { fileName: string; sheetName?: string };
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
      const rows: any[] = xlsx.utils.sheet_to_json(ws, { defval: null });

      const pick = (obj: any, keys: string[]): any => {
        for (const k of keys) {
          if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") return obj[k];
        }
        return null;
      }

      let created = 0;
      const errors: any[] = [];

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
            clientType,
          });
          if (!parsed.success) {
            errors.push({ row: r, error: parsed.error.flatten() });
            continue;
          }
          await storage.createClient(parsed.data);
          created++;
        } catch (e: any) {
          errors.push({ row: r, error: e?.message || String(e) });
        }
      }

      res.json({ ok: true, fileName, sheetName: selectedSheetName, created, errorsCount: errors.length, errors: errors.slice(0, 10) });
    } catch (error) {
      res.status(500).json({ message: "Failed to import clients" });
    }
  });

  // -----------------------------
  // Email API
  // Send email notifications
  // -----------------------------
  app.post('/api/email/send', async (req, res) => {
    try {
      const { to, subject, body } = req.body;

      // Validate input
      if (!to || !subject || !body) {
        return res.status(400).json({ message: 'Missing required fields: to, subject, body' });
      }

      // Send email using the global emailTransporter (Zoho SMTP)
      const mailOptions = {
        from: process.env.SMTP_USER || 'itsupportprogenics@progenicslaboratories.in',
        to,
        subject,
        text: body,
      };

      await emailTransporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to: ${to}`);
      res.json({ ok: true, message: 'Email sent successfully' });
    } catch (error) {
      console.error('Failed to send email:', (error as Error).message);
      res.status(500).json({ message: 'Failed to send email', error: (error as Error).message });
    }
  });

  // -----------------------------
  // Report Management API
  // CRUD endpoints for `report_management` table
  // -----------------------------
  app.get('/api/report_management', async (req, res) => {
    try {
      // Join with lab process sheets to get client_id and correct unique_id
      // report_management.sample_id is like "25DS00067_1" where prefix is the business unique_id
      // labprocess tables have unique_id field which matches this prefix
      // We join on project_id and extract the matching unique_id and client_id
      // Note: COLLATE clause added to fix collation mismatch between tables
      const query = `
        SELECT 
          rm.*,
          -- Get client_id from lab process sheets - use subquery to get first match
          (
            SELECT lpd2.client_id 
            FROM labprocess_discovery_sheet lpd2 
            WHERE lpd2.project_id COLLATE utf8mb4_unicode_ci = rm.project_id COLLATE utf8mb4_unicode_ci
            LIMIT 1
          ) as discovery_client_id,
          (
            SELECT lpc2.client_id 
            FROM labprocess_clinical_sheet lpc2 
            WHERE lpc2.project_id COLLATE utf8mb4_unicode_ci = rm.project_id COLLATE utf8mb4_unicode_ci
            LIMIT 1
          ) as clinical_client_id,
          -- Get the business unique_id from lab process sheets
          (
            SELECT lpd3.unique_id 
            FROM labprocess_discovery_sheet lpd3 
            WHERE lpd3.project_id COLLATE utf8mb4_unicode_ci = rm.project_id COLLATE utf8mb4_unicode_ci
            LIMIT 1
          ) as discovery_unique_id,
          (
            SELECT lpc3.unique_id 
            FROM labprocess_clinical_sheet lpc3 
            WHERE lpc3.project_id COLLATE utf8mb4_unicode_ci = rm.project_id COLLATE utf8mb4_unicode_ci
            LIMIT 1
          ) as clinical_unique_id
        FROM report_management rm
        ORDER BY rm.created_at DESC 
        LIMIT 500
      `;
      const [rows]: any = await pool.execute(query);
      // Post-process to merge discovery/clinical fields
      const processedRows = rows.map((row: any) => ({
        ...row,
        client_id: row.discovery_client_id || row.clinical_client_id || null,
        display_unique_id: row.discovery_unique_id || row.clinical_unique_id || null,
      }));
      res.json(processedRows);
    } catch (error) {
      console.error('GET /api/report_management failed:', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch report_management records' });
    }
  });

  app.get('/api/report_management/:unique_id', async (req, res) => {
    try {
      const { unique_id } = req.params;
      const [rows]: any = await pool.execute('SELECT * FROM report_management WHERE unique_id = ? LIMIT 1', [unique_id]);
      if (!rows || rows.length === 0) return res.status(404).json({ message: 'Not found' });
      res.json(rows[0]);
    } catch (error) {
      console.error('GET /api/report_management/:unique_id failed:', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch record' });
    }
  });

  app.post('/api/report_management', async (req, res) => {
    try {
      const body = req.body || {};

      // === DATA SYNC VALIDATION (STRICT MODE): Verify parent Bioinformatics record exists ===
      if (body.project_id) {
        const [bioRows]: any = await pool.execute(
          `SELECT COUNT(*) as cnt FROM (
            SELECT project_id FROM bioinformatics_sheet_discovery WHERE project_id = ?
            UNION
            SELECT project_id FROM bioinformatics_sheet_clinical WHERE project_id = ?
          ) as combined`,
          [body.project_id, body.project_id]
        );
        if (bioRows[0]?.cnt === 0) {
          console.error(`❌ Data Sync BLOCKED: Report Management record rejected for ${body.project_id} - no Bioinformatics record exists`);
          return res.status(400).json({
            message: 'Cannot create Report Management record: Bioinformatics record must exist first',
            error: 'PARENT_RECORD_MISSING',
            projectId: body.project_id,
            requiredParent: 'bioinformatics_sheet_discovery OR bioinformatics_sheet_clinical'
          });
        } else {
          console.log(`✅ Data Sync Validation: Bioinformatics record verified for ${body.project_id}`);
        }
      }

      // Build dynamic insert based on provided keys
      const keys = Object.keys(body);
      if (keys.length === 0) return res.status(400).json({ message: 'No data provided' });
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => body[k]);
      const sql = `INSERT INTO report_management (${cols}, created_at) VALUES (${placeholders}, NOW())`;
      const [result]: any = await pool.execute(sql, values);

      // === POST-INSERT VALIDATION: Verify record was created ===
      const insertId = result.insertId;
      const [verifyRows]: any = await pool.execute('SELECT id FROM report_management WHERE id = ?', [insertId]);
      const insertVerified = verifyRows.length > 0;
      if (insertVerified) {
        console.log(`✅ Data Sync Validation: Report Management record verified with ID ${insertId}`);
      } else {
        console.error(`❌ Data Sync Validation FAILED: Report Management record NOT found for ID ${insertId}`);
      }

      res.json({ ok: true, insertId: result.insertId, validation: { insertVerified } });
    } catch (error) {
      console.error('POST /api/report_management failed:', (error as Error).message);
      res.status(500).json({ message: 'Failed to create record', error: (error as Error).message });
    }
  });

  app.put('/api/report_management/:unique_id', async (req, res) => {
    try {
      const { unique_id } = req.params;
      const updates = req.body || {};
      const keys = Object.keys(updates);
      if (keys.length === 0) return res.status(400).json({ message: 'No updates provided' });

      // Filter out undefined/null keys and build safe SQL
      const safeKeys = keys.filter(k => updates[k] !== undefined);
      if (safeKeys.length === 0) return res.status(400).json({ message: 'No valid updates provided' });

      const set = safeKeys.map(k => `\`${k}\` = ?`).join(', ');
      const values = safeKeys.map(k => {
        const v = updates[k];
        // Convert booleans to 0/1 for MySQL TINYINT(1)
        if (typeof v === 'boolean') return v ? 1 : 0;
        return v;
      });
      values.push(unique_id);
      const sql = `UPDATE report_management SET ${set}, lead_modified = NOW() WHERE unique_id = ?`;
      console.log('PUT SQL:', sql, 'Values:', values);
      const [result]: any = await pool.execute(sql, values);
      res.json({ ok: true, affectedRows: result.affectedRows });
    } catch (error) {
      console.error('PUT /api/report_management/:unique_id failed:', (error as Error).message);
      res.status(500).json({ message: 'Failed to update record', error: (error as Error).message });
    }
  });

  app.delete('/api/report_management/:unique_id', async (req, res) => {
    try {
      const { unique_id } = req.params;
      const [result]: any = await pool.execute('DELETE FROM report_management WHERE unique_id = ?', [unique_id]);
      res.json({ ok: true, affectedRows: result.affectedRows });
    } catch (error) {
      console.error('DELETE /api/report_management/:unique_id failed:', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete record' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
