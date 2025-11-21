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
  insertClientSchema
} from "@shared/schema";
import path from "path";
import fs from "fs";
import { db, pool } from './db';
import { sql } from 'drizzle-orm';
import { generateRoleId } from './lib/generateRoleId';
import { generateProjectId } from './lib/generateProjectId';
import xlsx from "xlsx";
import { ZodError } from 'zod';
import multer from 'multer';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer setup: disk storage (existing) and memory storage for DB insert
const storageM = multer.diskStorage({
  destination: function (_req: any, _file: any, cb: any) { cb(null, uploadsDir); },
  filename: function (_req: any, file: any, cb: any) { const unique = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_')}`; cb(null, unique); }
});
const uploadDisk = multer({ storage: storageM, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
    'sampleCollectedDate', 'sampleShippedDate', 'sampleDeliveryDate', 'thirdPartySentDate', 'thirdPartyReceivedDate'
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

export async function registerRoutes(app: Express): Promise<Server> {
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
      const allowed = ['sales', 'operations', 'finance', 'lab', 'bioinformatics', 'reporting', 'manager', 'admin'];
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

  // Lead management routes
  // Serve uploaded files statically
  app.use('/uploads', (await import('express')).static(uploadsDir));
  // Serve WES report static HTML and assets (allows opening the WES report HTML directly)
  const wesReportDir = path.join(process.cwd(), 'WES report code', 'wes_report');
  if (fs.existsSync(wesReportDir)) {
    app.use('/wes-report', (await import('express')).static(wesReportDir));
  }
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
  app.post('/api/uploads/trf-db', uploadMemory.single('trf'), async (req, res) => {
    try {
  if (!(req as any).file) return res.status(400).json({ message: 'No file uploaded' });
  const { originalname, buffer } = (req as any).file as any;
      const { leadId } = req.body;
      if (!leadId) return res.status(400).json({ message: 'leadId is required to associate TRF' });
      // storage.createLeadTrf should store the buffer in the DB
      const trf = await storage.createLeadTrf({ leadId, filename: originalname, data: buffer });
      res.json({ id: trf.id, filename: trf.filename });
    } catch (error) {
      console.error('TRF DB upload failed', error);
      res.status(500).json({ message: 'Failed to upload TRF to DB' });
    }
  });

  // Endpoint to download TRF by id (fetch blob from DB)
  app.get('/api/uploads/trf/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const trf = await storage.getLeadTrf(id);
      if (!trf) return res.status(404).json({ message: 'TRF not found' });
      res.setHeader('Content-Disposition', `attachment; filename="${trf.filename}"`);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(trf.data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch TRF' });
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
          const category = normalized.category || normalized.lead_type || 'clinical';
          const projectId = await generateProjectId(String(category));
          normalized.projectId = projectId;
          normalized.project_id = projectId;
          console.log(`Generated project ID for ${category} lead:`, projectId);
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
      
      // Send notification for new lead creation
      console.log('Lead created successfully, sending notification for:', lead.id, lead.organization);
      try {
        await notificationService.notifyLeadCreated(
          lead.id, 
          lead.organization, 
          lead.createdBy || 'system'
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
          lead.organization,
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
          // createGeneticCounselling expects sampleId (human readable) and gcName at minimum
          createdGc = await storage.createGeneticCounselling({ sampleId: conversion.sample.sampleId, gcName: '' });
          
          // Send genetic counselling notification
          try {
            await notificationService.notifyGeneticCounsellingRequired(
              conversion.sample.sampleId,
              conversion.lead.patientClientName || 'Unknown Patient',
              'system'
            );
          } catch (notificationError) {
            console.error('Failed to send genetic counselling notification:', notificationError);
          }
        }
      } catch (err) {
        console.error('Failed to create genetic counselling after conversion:', (err as Error).message);
      }
      
      // Send lead conversion notifications
      try {
        await notificationService.notifyLeadConverted(
          conversion.lead.id,
          conversion.lead.organization,
          conversion.sample.sampleId,
          'system'
        );
        
        await notificationService.notifySampleReceived(
          conversion.sample.sampleId,
          conversion.lead.organization,
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
            message: `Lead from ${conversion.lead.organization} has been converted. Sample ID: ${conversion.sample.sampleId}`,
            type: "lead_converted",
            relatedId: conversion.sample.id,
            isRead: false,
          });
        }
      } catch (legacyNotificationError) {
        console.error('Failed to send legacy notifications:', legacyNotificationError);
      }

      res.json({ ...conversion, geneticCounselling: createdGc });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to convert lead" });
    }
  });

  // Sample management routes
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

      // Send notification if status changed
      if (parsed.data.status && parsed.data.status !== currentSample.status) {
        try {
          await notificationService.notifySampleStatusChanged(
            sample.sampleId,
            sample.organization || 'Unknown Organization',
            currentSample.status || 'unknown',
            parsed.data.status,
            'system'
          );
        } catch (notificationError) {
          console.error('Failed to send sample status change notification:', notificationError);
        }
      }

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

  // Lab processing routes
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
      await storage.updateSample(labProcessing.sampleId, { status: "lab_processing" });

      // Send comprehensive lab processing notifications
      try {
        const sample = await storage.getSampleById(labProcessing.sampleId);
        if (sample) {
          // Get lead information for test type
          const lead = await storage.getLeadById(sample.leadId);
          const testType = lead?.testName || 'Unknown Test';
          
          await notificationService.notifyLabProcessingStarted(
            sample.sampleId || 'Unknown Sample',
            testType,
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
          sample?.sampleId || updated.labId,
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
      const created = await storage.createGeneticCounselling({
        sampleId: body.sample_id || body.sampleId || '',
        gcName: body.gc_name || body.gcName || '',
        counsellingType: body.counselling_type || body.counsellingType || undefined,
        counsellingStartTime: body.counselling_start_time || body.counsellingStartTime || undefined,
        counsellingEndTime: body.counselling_end_time || body.counsellingEndTime || undefined,
        gcSummary: body.gc_summary || body.gcSummary || undefined,
        extendedFamilyTesting: body.extended_family_testing ?? body.extendedFamilyTesting ?? false,
        approvalStatus: body.approval_status || body.approvalStatus || 'pending',
      });
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
      const updated = await storage.updateGeneticCounselling(id, {
        sampleId: updates.sample_id || updates.sampleId,
        gcName: updates.gc_name || updates.gcName,
        counsellingType: updates.counselling_type || updates.counsellingType,
        counsellingStartTime: updates.counselling_start_time || updates.counsellingStartTime,
        counsellingEndTime: updates.counselling_end_time || updates.counsellingEndTime,
        gcSummary: updates.gc_summary || updates.gcSummary,
        extendedFamilyTesting: updates.extended_family_testing ?? updates.extendedFamilyTesting,
        approvalStatus: updates.approval_status || updates.approvalStatus,
      });
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

  // Finance routes
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
      const result = insertFinanceRecordSchema.safeParse(normalized);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid finance record data", errors: result.error.errors });
      }

      const record = await storage.createFinanceRecord(result.data);
      
      // Send payment notification
      try {
        const amount = parseFloat(record.amount?.toString() || '0');
        const organizationName = record.organization || 'Unknown Organization';
        
        if (record.paymentStatus === 'paid') {
          await notificationService.notifyPaymentReceived(
            record.id,
            amount,
            organizationName,
            'system'
          );
        } else if (record.paymentStatus === 'pending') {
          await notificationService.notifyPaymentPending(
            record.id,
            amount,
            organizationName,
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

  // ---------------------------------------------------------------------------
  // New adapter endpoints for requested sheet/table names
  // These endpoints try to read/write the explicitly-named tables (if present)
  // and fall back to existing storage methods when helpful.
  // ---------------------------------------------------------------------------

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
        const [rows] = await pool.execute('SELECT * FROM lab_process_discovery_sheet');
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
        const [rows] = await pool.execute('SELECT * FROM lab_process_clinical_sheet');
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
      try {
        const [rows] = await pool.execute('SELECT * FROM finance_sheet');
        return res.json({ rows, total: Array.isArray(rows) ? (rows as any).length : 0 });
      } catch (e) {
        const result = await storage.getFinanceRecords({ page: 1, pageSize: 1000 });
        return res.json(result);
      }
    } catch (error) {
      console.error('Failed to fetch finance sheet', (error as Error).message);
      res.status(500).json({ message: 'Failed to fetch finance sheet' });
    }
  });

  app.post('/api/finance-sheet', async (req, res) => {
    try {
      try {
        const data = req.body || {};
        const keys = Object.keys(data);
        const cols = keys.map(k => `\`${k}\``).join(',');
        const placeholders = keys.map(() => '?').join(',');
        const values = keys.map(k => data[k]);
        const [result]: any = await pool.execute(`INSERT INTO finance_sheet (${cols}) VALUES (${placeholders})`, values);
        const insertId = result.insertId || null;
        const [rows] = await pool.execute('SELECT * FROM finance_sheet WHERE id = ?', [insertId]);
        return res.json((rows as any)[0] ?? { id: insertId });
      } catch (e) {
        const created = await storage.createFinanceRecord(req.body as any);
        return res.json(created);
      }
    } catch (error) {
      console.error('Failed to create finance record', (error as Error).message);
      res.status(500).json({ message: 'Failed to create finance record' });
    }
  });

  app.put('/api/finance-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      try {
        const updates = req.body || {};
        const keys = Object.keys(updates);
        if (keys.length === 0) return res.status(400).json({ message: 'No updates provided' });
        const set = keys.map(k => `\`${k}\` = ?`).join(',');
        const values = keys.map(k => updates[k]);
        values.push(id);
        await pool.execute(`UPDATE finance_sheet SET ${set} WHERE id = ?`, values);
        const [rows] = await pool.execute('SELECT * FROM finance_sheet WHERE id = ?', [id]);
        return res.json((rows as any)[0] ?? null);
      } catch (e) {
        const updated = await storage.updateFinanceRecord(id, req.body as any);
        return res.json(updated);
      }
    } catch (error) {
      console.error('Failed to update finance record', (error as Error).message);
      res.status(500).json({ message: 'Failed to update finance record' });
    }
  });

  app.delete('/api/finance-sheet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      try {
        await pool.execute('DELETE FROM finance_sheet WHERE id = ?', [id]);
        return res.json({ id });
      } catch (e) {
        const ok = await storage.deleteFinanceRecord(id);
        return res.json({ id, fallback: !!ok });
      }
    } catch (error) {
      console.error('Failed to delete finance record', (error as Error).message);
      res.status(500).json({ message: 'Failed to delete finance record' });
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
      const created = await storage.createGeneticCounselling({
        sampleId: body.sample_id || body.sampleId || '',
        gcName: body.gc_name || body.gcName || '',
        counsellingType: body.counselling_type || body.counsellingType || undefined,
        counsellingStartTime: body.counselling_start_time || body.counsellingStartTime || undefined,
        counsellingEndTime: body.counselling_end_time || body.counsellingEndTime || undefined,
        gcSummary: body.gc_summary || body.gcSummary || undefined,
        extendedFamilyTesting: body.extended_family_testing ?? body.extendedFamilyTesting ?? false,
        approvalStatus: body.approval_status || body.approvalStatus || 'pending',
      });
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
      const updated = await storage.updateGeneticCounselling(id, {
        sampleId: updates.sample_id || updates.sampleId,
        gcName: updates.gc_name || updates.gcName,
        counsellingType: updates.counselling_type || updates.counsellingType,
        counsellingStartTime: updates.counselling_start_time || updates.counsellingStartTime,
        counsellingEndTime: updates.counselling_end_time || updates.counsellingEndTime,
        gcSummary: updates.gc_summary || updates.gcSummary,
        extendedFamilyTesting: updates.extended_family_testing ?? updates.extendedFamilyTesting,
        approvalStatus: updates.approval_status || updates.approvalStatus,
      });
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

  const httpServer = createServer(app);
  return httpServer;
}
