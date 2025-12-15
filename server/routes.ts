import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { notificationService } from "./services/NotificationService";
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
    'leadCreated', 'leadModified', 'deliveryUpTo', 'sampleReceivedDate'
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
      patient_client_address: lead.patientClientAddress || lead.patient_client_address || null,
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
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // true for 465, false for other ports
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
      const ok = await storage.deleteUser(id);
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
      console.log('[GC Auto-Create] Lead.patientClientAddress:', lead.patientClientAddress);
      console.log('[GC Auto-Create] Lead.patient_client_address:', lead.patient_client_address);
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
            console.log('[GC Auto-Create Debug] Lead source address - patientClientAddress:', lead.patientClientAddress, 'patient_client_address:', lead.patient_client_address);

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

  // Send bioinformatics record to Reports module
  app.post("/api/send-to-reports", async (req, res) => {
    try {
      const {
        bioinformaticsId,
        sampleId,
        projectId,
        uniqueId,
        serviceName,
        analysisDate,
        createdBy,
      } = req.body;

      console.log('Send to Reports triggered for bioinformatics:', bioinformaticsId, 'Project ID:', projectId);

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

      // Fetch lead data to get additional info if needed
      let leadData: any = { service_name: serviceName };
      try {
        const [leadRows]: any = await pool.execute(
          'SELECT service_name FROM lead_management WHERE unique_id = ? LIMIT 1',
          [uniqueId]
        );
        if (leadRows && leadRows.length > 0) {
          const lead = leadRows[0];
          leadData.service_name = serviceName || lead.service_name || null;
          console.log('Fetched lead data from lead_management table:', leadData);
        }
      } catch (leadError) {
        console.log('Note: Could not fetch lead data -', (leadError as Error).message);
      }

      // Prepare report data with required database columns
      const reportData: Record<string, any> = {
        unique_id: uniqueId || '',
        project_id: projectId,
        bioinformatics_id: bioinformaticsId || null,
        sample_id: sampleId || null,
      };

      // Add optional fields if provided
      if (leadData.service_name) reportData.service_name = leadData.service_name;
      if (analysisDate) {
        // Convert ISO date string to DATE format (YYYY-MM-DD)
        const dateObj = new Date(analysisDate);
        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        reportData.report_date = `${year}-${month}-${day}`;
      }

      reportData.created_by = createdBy || 'system';
      reportData.created_at = new Date();
      reportData.status = 'pending_review';

      const keys = Object.keys(reportData);
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => reportData[k]);

      let insertResult;
      let tableName;

      if (isDiscovery) {
        tableName = 'report_discovery_sheet';
        console.log(`Inserting into ${tableName} for discovery project:`, projectId);
        const result: any = await pool.execute(
          `INSERT INTO report_discovery_sheet (${cols}) VALUES (${placeholders})`,
          values
        );
        insertResult = result[0];
      } else {
        tableName = 'report_clinical_sheet';
        console.log(`Inserting into ${tableName} for clinical project:`, projectId);
        const result: any = await pool.execute(
          `INSERT INTO report_clinical_sheet (${cols}) VALUES (${placeholders})`,
          values
        );
        insertResult = result[0];
      }

      const insertId = (insertResult as any).insertId || null;
      console.log(`Inserted into ${tableName} with ID:`, insertId);

      // Update bioinformatics table to set alert_to_report_team flag
      try {
        const bioTableName = isDiscovery ? 'bioinfo_discovery_sheet' : 'bioinfo_clinical_sheet';
        await pool.execute(
          `UPDATE ${bioTableName} SET alert_to_report_team = ?, updated_at = ? WHERE id = ?`,
          [true, new Date(), bioinformaticsId]
        );
        console.log('Updated bioinformatics flag for:', bioinformaticsId);
      } catch (updateError) {
        console.error('Warning: Failed to update bioinformatics flag', (updateError as Error).message);
        // Don't fail the entire request if bioinformatics update fails
      }

      // Send notifications
      try {
        await notificationService.notifyReportGenerated(
          insertId,
          'Bioinformatics Analysis Report',
          leadData.service_name || 'Analysis Report',
          createdBy || 'system'
        );
      } catch (notificationError) {
        console.error('Failed to send report notification:', notificationError);
        // Don't fail the request if notification fails
      }

      res.json({
        success: true,
        reportId: insertId,
        bioinformaticsId: bioinformaticsId,
        table: tableName,
        message: 'Bioinformatics record sent to Reports module',
      });
    } catch (error) {
      console.error('Error in send-to-reports:', error);
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
      const keys = Object.keys(data);
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => data[k]);
      const [result]: any = await pool.execute(`INSERT INTO nutritional_management (${cols}) VALUES (${placeholders})`, values);
      const insertId = result.insertId || null;
      const [rows] = await pool.execute('SELECT * FROM nutritional_management WHERE id = ?', [insertId]);
      res.json((rows as any)[0] ?? { id: insertId });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create nutrition record' });
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

      // Fetch and return the record by sample_id (most specific identifier)
      if (data.sample_id) {
        const [rows] = await pool.execute('SELECT * FROM bioinformatics_sheet_discovery WHERE sample_id = ? ORDER BY id DESC LIMIT 1', [data.sample_id]);
        return res.json((rows as any)[0] ?? { id: recordId });
      }

      // Fallback: fetch by unique_id (but this will only return ONE record due to UNIQUE constraint)
      if (data.unique_id) {
        const [rows] = await pool.execute('SELECT * FROM bioinformatics_sheet_discovery WHERE unique_id = ? ORDER BY id DESC LIMIT 1', [data.unique_id]);
        return res.json((rows as any)[0] ?? { id: recordId });
      }

      res.json({ id: recordId });
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
      const keys = Object.keys(data);
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => data[k]);

      // 🔑 FIX: Use INSERT IGNORE to create separate records per sample_id
      // Each sample_id (with suffix _1, _2, _3, _4) must be a SEPARATE bioinformatics record
      // NOT an upsert on unique_id (which is shared across all samples in a batch)
      const insertQuery = `
        INSERT IGNORE INTO bioinformatics_sheet_clinical (${cols}) 
        VALUES (${placeholders})
      `;

      console.log('Inserting bioinformatics_sheet_clinical record with columns:', keys);
      const [result]: any = await pool.execute(insertQuery, values);

      // Get the inserted row ID
      const recordId = result.insertId || data.id;
      console.log('Inserted bioinformatics_sheet_clinical with ID:', recordId);

      // Fetch and return the record by sample_id (most specific identifier)
      if (data.sample_id) {
        const [rows] = await pool.execute('SELECT * FROM bioinformatics_sheet_clinical WHERE sample_id = ? ORDER BY id DESC LIMIT 1', [data.sample_id]);
        return res.json((rows as any)[0] ?? { id: recordId });
      }

      // Fallback: fetch by unique_id (but this will only return ONE record due to UNIQUE constraint)
      if (data.unique_id) {
        const [rows] = await pool.execute('SELECT * FROM bioinformatics_sheet_clinical WHERE unique_id = ? ORDER BY id DESC LIMIT 1', [data.unique_id]);
        return res.json((rows as any)[0] ?? { id: recordId });
      }

      res.json({ id: recordId });
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
          'SELECT service_name, sample_type, no_of_samples FROM lead_management WHERE unique_id = ? LIMIT 1',
          [uniqueId]
        );
        if (leadRows && leadRows.length > 0) {
          const lead = leadRows[0];
          leadData.service_name = serviceName || lead.service_name || null;
          leadData.sample_type = sampleType || lead.sample_type || null;
          leadData.no_of_samples = lead.no_of_samples || null;
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
        // Convert ISO date string to DATE format (YYYY-MM-DD)
        const dateObj = new Date(sampleDeliveryDate);
        const year = dateObj.getUTCFullYear();
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        baseLabProcessData.sample_received_date = `${year}-${month}-${day}`;
      }

      baseLabProcessData.created_by = createdBy || 'system';
      baseLabProcessData.created_at = new Date();

      let tableName = isDiscovery ? 'labprocess_discovery_sheet' : 'labprocess_clinical_sheet';
      const insertedIds: any[] = [];

      // Loop through numberOfSamples and create a record for each
      for (let sampleNum = 1; sampleNum <= numberOfSamples; sampleNum++) {
        // Create sample_id with suffix for each sample record
        // Use sampleId if provided, otherwise fall back to uniqueId
        // If only 1 sample, use the base ID
        // If multiple samples, append the sample number (e.g., TEST-ID_1, _2, _3, _4)
        const baseSampleId = sampleId || uniqueId || '';
        let recordSampleId = baseSampleId;
        if (numberOfSamples > 1) {
          recordSampleId = `${baseSampleId}_${sampleNum}`;
        }

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

      // Update sample tracking to set alertToLabprocessTeam flag
      try {
        await pool.execute(
          'UPDATE sample_tracking SET alert_to_labprocess_team = ?, updated_at = ? WHERE id = ?',
          [true, new Date(), sampleId]
        );
        console.log('Updated sample_tracking flag for sample:', sampleId);
      } catch (updateError) {
        console.error('Warning: Failed to update sample_tracking flag', (updateError as Error).message);
        // Don't fail the entire request if sample update fails
      }

      res.json({
        success: true,
        recordIds: insertedIds,
        numberOfRecordsCreated: insertedIds.length,
        table: tableName,
        message: `${insertedIds.length} lab process record(s) created in ${tableName}`
      });
    } catch (error) {
      console.error('Failed to alert lab process', (error as Error).message);
      res.status(500).json({ message: 'Failed to alert lab process', error: (error as Error).message });
    }
  });

  // Process Master Canonical Routes - maps to process_master_sheet table
  app.get('/api/process-master', async (req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM process_master_sheet');
      res.json(rows || []);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch process master records' });
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

  // Finance routes
  app.get("/api/finance/stats", async (req, res) => {
    try {
      const stats = await storage.getFinanceStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch finance stats" });
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
  // Report Management API
  // CRUD endpoints for `report_management` table
  // -----------------------------
  app.get('/api/report_management', async (req, res) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM report_management ORDER BY created_at DESC LIMIT 500');
      res.json(rows);
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
      // Build dynamic insert based on provided keys
      const keys = Object.keys(body);
      if (keys.length === 0) return res.status(400).json({ message: 'No data provided' });
      const cols = keys.map(k => `\`${k}\``).join(',');
      const placeholders = keys.map(() => '?').join(',');
      const values = keys.map(k => body[k]);
      const sql = `INSERT INTO report_management (${cols}, created_at) VALUES (${placeholders}, NOW())`;
      const [result]: any = await pool.execute(sql, values);
      res.json({ ok: true, insertId: result.insertId });
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
      const set = keys.map(k => `\`${k}\` = ?`).join(',');
      const values = keys.map(k => updates[k]);
      values.push(unique_id);
      const sql = `UPDATE report_management SET ${set}, lead_modified = NOW() WHERE unique_id = ?`;
      const [result]: any = await pool.execute(sql, values);
      res.json({ ok: true, affectedRows: result.affectedRows });
    } catch (error) {
      console.error('PUT /api/report_management/:unique_id failed:', (error as Error).message);
      res.status(500).json({ message: 'Failed to update record' });
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
