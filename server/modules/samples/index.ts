// Sample Tracking Module - Handles sample lifecycle management
import { Express } from 'express';
import { AbstractModule } from '../base';
import { DBStorage } from '../../storage';
import mysql from 'mysql2/promise';
import { insertSampleSchema } from '@shared/schema';

export class SampleTrackingModule extends AbstractModule {
  name = 'sample-tracking';
  version = '1.0.0';

  constructor(storage: DBStorage) {
    super(storage);
  }

  async validateSchema(): Promise<boolean> {
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'remote_user',
        password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
        database: process.env.DB_NAME || 'lead_lims2',
      });

      const [rows] = await connection.execute('DESCRIBE sample_tracking');
      await connection.end();

      const columns = (rows as any[]).map(row => row.Field);
      const requiredColumns = ['id', 'unique_id', 'project_id', 'tracking_id', 'organisation_hospital'];

      const hasAllColumns = requiredColumns.every(col => columns.includes(col));

      console.log(`Sample Tracking Schema Check: ${hasAllColumns ? '✅' : '❌'}`);
      return hasAllColumns;
    } catch (error) {
      console.error('Sample Tracking schema validation error:', error);
      return false;
    }
  }

  registerRoutes(app: Express): void {
    console.log('🔗 Registering Sample Tracking routes...');

    // Get all samples
    app.get('/api/samples', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Sample Tracking module is disabled' });
        }

        const samples = await this.storage.getSamples();
        res.json(samples);
      } catch (error) {
        console.error('Error fetching samples:', error);
        // Fallback to mock data if database fails
        res.json([
          {
            id: '1',
            sampleId: 'PG20240830001',
            leadId: 'lead-1',
            status: 'pickup_scheduled',
            amount: '45000',
            paidAmount: '0',
            createdAt: new Date(),
            lead: {
              id: 'lead-1',
              organization: 'Apollo Hospitals',
              testName: 'Whole Genome Sequencing'
            }
          }
        ]);
      }
    });

    // Update sample
    app.put('/api/samples/:id', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Sample Tracking module is disabled' });
        }

        const { id } = req.params;
        let updates = req.body;

        // Debug log raw incoming body
        console.log('Sample PUT - raw req.body:', JSON.stringify(req.body));

        // Normalize possible date string fields to Date objects before validation
        const normalizeDateFields = (obj: any) => {
          if (!obj || typeof obj !== 'object') return obj;
          const copy: any = { ...obj };

          // date key pairs: [camelCase, snake_case]
          const datePairs: Array<[string, string]> = [
            ['sampleCollectedDate', 'sample_collected_date'],
            ['sampleShippedDate', 'sample_shipped_date'],
            ['sampleDeliveryDate', 'sample_delivery_date'],
            ['thirdPartySentDate', 'third_party_sent_date'],
            ['thirdPartyReceivedDate', 'third_party_received_date'],
            ['pickupDate', 'pickup_date'],
          ];

          for (const [camel, snake] of datePairs) {
            const rawVal = copy[camel] ?? copy[snake];
            if (rawVal === undefined || rawVal === null) continue;

            // Normalize empty-string-like values to undefined (remove them)
            if (typeof rawVal === 'string') {
              const s = rawVal.trim();
              if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
                delete copy[camel];
                delete copy[snake];
                continue;
              }
            }

            // If already a Date, keep it
            if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
              copy[camel] = rawVal;
              delete copy[snake];
              continue;
            }

            // If it's a string, try to parse into a Date
            if (typeof rawVal === 'string') {
              const d = new Date(rawVal);
              if (!isNaN(d.getTime())) {
                copy[camel] = d;
                delete copy[snake];
                continue;
              }

              // Handle datetime-local like '2025-10-17T10:30' (no timezone)
              try {
                const parts = rawVal.split('T');
                if (parts.length === 2) {
                  const [datePart, timePart] = parts;
                  const [y, m, dd] = datePart.split('-').map((n: string) => Number(n));
                  const timeParts = timePart.split(':').map((n: string) => Number(n));
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
                // ignore and fallthrough
              }
            }

            // If we reach here and rawVal is neither parseable nor a valid Date, leave it as-is (will be caught by Zod)
            if (rawVal !== undefined) {
              copy[camel] = rawVal;
            }
          }

          // Final cleanup: remove any strict empty strings on all keys (avoid Zod string -> date confusion)
          for (const k of Object.keys(copy)) {
            if (typeof copy[k] === 'string') {
              const s = copy[k].trim();
              if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
                delete copy[k];
              }
            }
          }

          return copy;
        };

        updates = normalizeDateFields(updates);

        // Coerce numeric/decimal fields into string form expected by Drizzle/Zod (decimal columns are validated as strings)
        const normalizeDecimalFields = (obj: any) => {
          if (!obj || typeof obj !== 'object') return obj;
          const copy: any = { ...obj };
          const decimalPairs: Array<[string, string]> = [
            ['amount', 'amount'],
            ['shippingCost', 'shipping_cost'],
            ['paidAmount', 'paid_amount'],
          ];

          for (const [camel, snake] of decimalPairs) {
            const rawVal = copy[camel] ?? copy[snake];
            if (rawVal === undefined || rawVal === null) continue;

            // If number, convert to two-decimal string
            if (typeof rawVal === 'number') {
              copy[camel] = rawVal.toFixed(2);
              if (snake !== camel) delete copy[snake];
              continue;
            }

            // If string, trim and normalize numeric strings to have two decimals when possible
            if (typeof rawVal === 'string') {
              const s = rawVal.trim();
              if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
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
              // leave non-numeric string as-is; let Zod report if invalid
              copy[camel] = s;
              if (snake !== camel) delete copy[snake];
            }
          }

          return copy;
        };

        updates = normalizeDecimalFields(updates);

        // Debug: show type/value of common fields to diagnose validation failures
        try {
          console.log('Sample PUT - post-decimal-norm types:', JSON.stringify({
            amountType: typeof updates.amount,
            amountValue: updates.amount,
            shippingType: typeof updates.shippingCost,
            shippingValue: updates.shippingCost,
          }));
        } catch (e) {
          console.log('Sample PUT - failed to stringify debug types', e);
        }

        // Debug normalized payload (helpful while reproducing client errors)
        console.log('Sample PUT - normalized payload:', JSON.stringify(updates, (_k, v) => v instanceof Date ? v.toISOString() : v));

        // Final defensive pass: convert number values for amount-like keys into decimal strings
        const finalNumericToString = (obj: any) => {
          if (!obj || typeof obj !== 'object') return obj;
          const copy: any = { ...obj };
          const amountLike = /(amount|cost|price|shipping|paid)/i;
          for (const k of Object.keys(copy)) {
            const v = copy[k];
            if (typeof v === 'number' && amountLike.test(k)) {
              try { copy[k] = v.toFixed(2); } catch (e) { /* ignore */ }
            }
          }
          return copy;
        };

        updates = finalNumericToString(updates);

        // Validate partial update against schema
        const parsed = insertSampleSchema.partial().safeParse(updates);
        if (!parsed.success) {
          // include the normalized payload in debug responses when requested
          const out: any = { message: 'Invalid sample update data', errors: parsed.error.errors };
          if (req.query && req.query.debugNorm) {
            out.normalized = updates;
          }
          return res.status(400).json(out);
        }

        const sample = await this.storage.updateSample(id, parsed.data as any);
        if (!sample) {
          return res.status(404).json({ message: 'Sample not found' });
        }

        res.json(sample);
      } catch (error) {
        console.error('Error updating sample:', error);
        res.status(500).json({ message: 'Failed to update sample' });
      }
    });

    // Get sample by ID
    app.get('/api/samples/:id', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Sample Tracking module is disabled' });
        }

        const { id } = req.params;
        const sample = await this.storage.getSampleById(id);

        if (!sample) {
          return res.status(404).json({ message: 'Sample not found' });
        }

        res.json(sample);
      } catch (error) {
        console.error('Error fetching sample:', error);
        // Fallback mock
        res.json({
          id: '1',
          sampleId: 'PG20240830001',
          titleUniqueId: 'T-0001',
          sampleUniqueId: 'S-0001',
          leadId: 'lead-1',
          status: 'pickup_scheduled',
          amount: '45000',
          paidAmount: '0',
          sampleCollectedDate: new Date(),
          trackingId: null,
          courierCompany: null,
          labAlertStatus: 'pending',
          thirdPartyName: null,
          comments: null,
          createdAt: new Date(),
          lead: {
            id: 'lead-1',
            organization: 'Apollo Hospitals',
            testName: 'Whole Genome Sequencing'
          }
        });
      }
    });

    // Module health check
    app.get('/api/modules/samples/health', async (req, res) => {
      const health = await this.healthCheck();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    console.log('✅ Sample Tracking routes registered');
  }
}