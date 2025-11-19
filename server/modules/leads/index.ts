
// Lead Management Module - Handles all lead-related operations
import { Express } from 'express';
import { AbstractModule } from '../base';
import { DBStorage } from '../../storage';
import { insertLeadSchema } from '@shared/schema';
import { notificationService } from '../../services/NotificationService';
import mysql from 'mysql2/promise';
import { generateRoleId } from '../../lib/generateRoleId';

export class LeadManagementModule extends AbstractModule {
  name = 'lead-management';
  version = '1.0.0';
  
  constructor(storage: DBStorage) {
    super(storage);
  }
  
  async validateSchema(): Promise<boolean> {
    try {
      // Check if leads table exists and has required columns
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '192.168.29.12',
        user: process.env.DB_USER || 'remote_user',
        password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
        database: process.env.DB_NAME || 'leadlab_lims',
      });
      
      const [rows] = await connection.execute('DESCRIBE leads');
      await connection.end();
      
      const columns = (rows as any[]).map(row => row.Field);
      const requiredColumns = [
        'id', 'organization', 'location', 'referred_doctor', 'phone',
        'email', 'client_email', 'test_name', 'sample_type', 'amount_quoted',
        'tat', 'status', 'category'
      ];
      
      const hasAllColumns = requiredColumns.every(col => 
        columns.includes(col.replace(/([A-Z])/g, '_$1').toLowerCase())
      );
      
      console.log(`Lead Management Schema Check: ${hasAllColumns ? '✅' : '❌'}`);
      return hasAllColumns;
    } catch (error) {
      console.error('Lead Management schema validation error:', error);
      return false;
    }
  }
  
  registerRoutes(app: Express): void {
    console.log('🔗 Registering Lead Management routes...');
    
    // Get all leads
    app.get('/api/leads', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Lead Management module is disabled' });
        }
        
        const leads = await this.storage.getLeads();
        res.json(leads);
      } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ message: 'Failed to fetch leads' });
      }
    });
    
    // Create new lead
    app.post('/api/leads', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Lead Management module is disabled' });
        }
        
        // Normalize date-like fields so zod `date()` validators accept ISO/date strings
        const bodyCopy = { ...req.body } as any;
        // Server-side authoritative Unique ID: generate if not provided
        try {
          if (!bodyCopy.unique_id && !bodyCopy.uniqueId) {
            // Try to read role from an auth header (if a proxy or client sets it)
            let roleForId: string | undefined = undefined;
            try {
              const hdr = (req.headers['x-user-role'] || req.headers['x_user_role'] || req.headers['x-user']) as string | undefined;
              if (hdr && typeof hdr === 'string' && hdr.trim() !== '') roleForId = hdr.trim();
            } catch (e) { /* ignore */ }

            // If no header, try to resolve the user referenced by createdBy
            if (!roleForId && bodyCopy.createdBy) {
              try {
                const user = await this.storage.getUser(String(bodyCopy.createdBy));
                if (user && user.role) roleForId = user.role;
              } catch (e) { /* ignore */ }
            }

            if (!roleForId) roleForId = bodyCopy.leadType || bodyCopy.lead_type || 'admin';

            const uid = generateRoleId(String(roleForId));
            bodyCopy.unique_id = uid;
            bodyCopy.uniqueId = uid;
          }
        } catch (e) {
          console.warn('generateRoleId failed for /api/leads', e);
        }
        const dateKeys = ['dateSampleCollected', 'pickupUpto', 'dateSampleReceived', 'pickupDate', 'sampleShippedDate'];
        for (const k of dateKeys) {
          if (bodyCopy[k] && typeof bodyCopy[k] === 'string') {
            const d = new Date(bodyCopy[k]);
            if (!isNaN(d.getTime())) bodyCopy[k] = d;
          }
        }

        const result = insertLeadSchema.safeParse(bodyCopy);
        if (!result.success) {
          return res.status(400).json({ 
            message: 'Invalid lead data', 
            errors: result.error.errors 
          });
        }
        
        const lead = await this.storage.createLead(result.data);
        
        // Send notification for new lead creation
        console.log('Lead created in module, sending notification for:', lead.id, lead.organization);
        try {
          await notificationService.notifyLeadCreated(
            lead.id, 
            lead.organization, 
            lead.createdBy || 'system'
          );
          console.log('Lead creation notification sent successfully from module');
        } catch (notificationError) {
          console.error('Failed to send lead creation notification from module:', notificationError);
          // Don't fail the request if notification fails
        }
        
        res.json(lead);
      } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ message: 'Failed to create lead' });
      }
    });
    
    // Update lead
    app.put('/api/leads/:id', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Lead Management module is disabled' });
        }
        
        const { id } = req.params;
        // Normalize incoming date-like fields before validation
        const updatesRaw = { ...req.body } as any;
        const dateKeys = ['dateSampleCollected', 'pickupUpto', 'dateSampleReceived', 'pickupDate', 'sampleShippedDate'];
        for (const k of dateKeys) {
          const v = updatesRaw[k];
          if (v && typeof v === 'string') {
            const s = v.trim();
            let candidate = s;
            // Accept datetime-local format without seconds/timezone (YYYY-MM-DDTHH:mm)
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) candidate = s + ':00Z';
            // Accept date-only YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) candidate = s + 'T00:00:00Z';
            const d = new Date(candidate);
            if (!isNaN(d.getTime())) updatesRaw[k] = d;
          }
        }

        const result = insertLeadSchema.partial().safeParse(updatesRaw);
        if (!result.success) {
          // include raw/normalized pickupUpto to help debug client payloads
          const rawPickup = req.body && (req.body as any).pickupUpto;
          const normalizedPickup = updatesRaw && updatesRaw.pickupUpto;
          return res.status(400).json({ 
            message: 'Invalid lead data', 
            errors: result.error.errors,
            debug: { rawPickupUpto: rawPickup, normalizedPickupUpto: normalizedPickup }
          });
        }
        
        const lead = await this.storage.updateLead(id, result.data);
        if (!lead) {
          return res.status(404).json({ message: 'Lead not found' });
        }
        
        res.json(lead);
      } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ message: 'Failed to update lead' });
      }
    });
    
    // Update lead status
    app.put('/api/leads/:id/status', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Lead Management module is disabled' });
        }
        
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['quoted', 'cold', 'hot', 'won', 'converted', 'closed'].includes(status)) {
          return res.status(400).json({ message: 'Invalid status value' });
        }
        
        const lead = await this.storage.updateLeadStatus(id, status);
        if (!lead) {
          return res.status(404).json({ message: 'Lead not found' });
        }
        
        res.json(lead);
      } catch (error) {
        console.error('Error updating lead status:', error);
        res.status(500).json({ message: 'Failed to update lead status' });
      }
    });
    
    // Convert lead to sample
    app.post('/api/leads/:id/convert', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Lead Management module is disabled' });
        }
        
        const { id } = req.params;
        const sampleData = req.body;
        
        // Check if lead is in 'won' status before conversion
        const lead = await this.storage.getLeadById(id);
        if (!lead) {
          return res.status(404).json({ message: 'Lead not found' });
        }
        
        if (lead.status !== 'won') {
          return res.status(400).json({ 
            message: 'Lead must be in won status before conversion' 
          });
        }
        
        // Validate required fields
        if (!sampleData.amount) {
          return res.status(400).json({ message: 'Sample amount is required' });
        }
        
        const validatedSampleData = {
          ...sampleData,
          amount: String(sampleData.amount),
          paidAmount: sampleData.paidAmount ? String(sampleData.paidAmount) : '0',
          status: sampleData.status || 'pickup_scheduled'
        };
        
        const conversion = await this.storage.convertLead(id, validatedSampleData);
        
        // Send lead conversion notifications
        console.log('Lead converted in module, sending notifications for:', conversion.lead?.id, conversion.sample?.id);
        try {
          if (conversion.lead && conversion.sample) {
            await notificationService.notifyLeadConverted(
              conversion.lead.id,
              conversion.lead.organization,
              conversion.sample.id,
              conversion.lead.createdBy || 'system'
            );
            
            await notificationService.notifySampleReceived(
              conversion.sample.id,
              conversion.lead.organization,
              conversion.lead.createdBy || 'system'
            );
            
            console.log('Lead conversion notifications sent successfully from module');
          }
        } catch (notificationError) {
          console.error('Failed to send lead conversion notifications from module:', notificationError);
        }
        
        // conversion may now include finance and labProcessing entries
        res.json({
          lead: conversion.lead,
          sample: conversion.sample,
          finance: conversion.finance ?? null,
          labProcessing: conversion.labProcessing ?? null,
        });
      } catch (error) {
        console.error('Error converting lead:', error);
        res.status(500).json({ message: 'Failed to convert lead' });
      }
    });
    
    // Module health check
    app.get('/api/modules/leads/health', async (req, res) => {
      const health = await this.healthCheck();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    // Delete lead
    app.delete('/api/leads/:id', async (req, res) => {
      try {
        if (!this.enabled) return res.status(503).json({ message: 'Lead Management module is disabled' });
        const { id } = req.params;
        const ok = await this.storage.deleteLead(id);
        if (!ok) return res.status(500).json({ message: 'Failed to delete lead' });
        res.json({ id });
      } catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ message: 'Failed to delete lead' });
      }
    });
    
    console.log('✅ Lead Management routes registered');
  }
}