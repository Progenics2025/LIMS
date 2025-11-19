// Finance Module - Handles financial records and payments
import { Express } from 'express';
import { AbstractModule } from '../base';
import { DBStorage } from '../../storage';
import mysql from 'mysql2/promise';

export class FinanceModule extends AbstractModule {
  name = 'finance';
  version = '1.0.0';
  
  constructor(storage: DBStorage) {
    super(storage);
  }

  private async searchFinanceRecords(query: string, page: number, pageSize: number, sortBy?: string | null, sortDir: 'asc' | 'desc' = 'desc') {
    const offset = (page - 1) * pageSize;
    const like = `%${query}%`;

    // Define searchable columns
    const searchCols = [
      'fr.invoice_number',
      'fr.id',
      'fr.sample_id',
      's.sample_id',
      'fr.patient_name',
      'fr.organization',
      'l.organization',
      'fr.title_unique_id',
      'lp.title_unique_id',
      'fr.clinician',
      'l.referred_doctor',
      'fr.city',
      'l.location',
      'fr.service_name', 
      'l.service_name',
      'fr.patient_name',
      'l.patient_client_name',
      'fr.sales_responsible_person',
      'l.sales_responsible_person',
      'fr.payment_status',
      'fr.payment_method',
      'COALESCE(fr.title_unique_id, lp.title_unique_id)'
    ];

    // Build WHERE clause
    const whereClauses = searchCols.map(col => `${col} LIKE ?`);
    const whereClause = `WHERE ${whereClauses.join(' OR ')}`;
    
    // Build ORDER BY clause
    const orderClause = sortBy 
      ? `ORDER BY ${sortBy} ${sortDir.toUpperCase()}`
      : 'ORDER BY fr.created_at DESC';

    // Main query
    const sql = `
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

    // Count query
    const countSql = `
      SELECT COUNT(DISTINCT fr.id) as cnt
      FROM finance_records fr
      LEFT JOIN samples s ON fr.sample_id = s.id OR fr.lead_id = s.lead_id
      LEFT JOIN leads l ON fr.lead_id = l.id OR s.lead_id = l.id
      LEFT JOIN lab_processing lp ON (s.id = lp.sample_id OR fr.sample_id = lp.sample_id)
      ${whereClause}
    `;

    try {
      // Create bindings arrays
      const searchBindings = searchCols.map(() => like);
      const queryBindings = [...searchBindings, pageSize, offset];
      const countBindings = [...searchBindings];

      // Debug logging
      console.log('Search SQL:', sql);
      console.log('Search bindings:', queryBindings);
      console.log('Count SQL:', countSql);
      console.log('Count bindings:', countBindings);

      // Execute queries using module's connection pool
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '192.168.29.12',
        user: process.env.DB_USER || 'remote_user',
        password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
        database: process.env.DB_NAME || 'leadlab_lims',
      });

      const [rows] = await connection.execute(sql, queryBindings);
      const [countResult] = await connection.execute(countSql, countBindings);
      await connection.end();

      const total = (countResult as any)[0]?.cnt || 0;
      console.log(`Found ${(rows as any[]).length} records out of ${total} total matches`);
      
      return { rows, total };
    } catch (error) {
      console.error('Finance search error:', error);
      throw error;
    }
  }
  
  async validateSchema(): Promise<boolean> {
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '192.168.29.12',
        user: process.env.DB_USER || 'remote_user',
        password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
        database: process.env.DB_NAME || 'leadlab_lims',
      });
      
      const [rows] = await connection.execute('DESCRIBE finance_records');
      await connection.end();
      
      const columns = (rows as any[]).map(row => row.Field);
      const requiredColumns = ['id', 'sample_id', 'lead_id', 'invoice_number', 'amount', 'payment_status'];
      
      const hasAllColumns = requiredColumns.every(col => columns.includes(col));
      
      console.log(`Finance Schema Check: ${hasAllColumns ? '✅' : '❌'}`);
      return hasAllColumns;
    } catch (error) {
      console.error('Finance schema validation error:', error);
      return false;
    }
  }
  
  registerRoutes(app: Express): void {
    console.log('🔗 Registering Finance routes...');
    
    // Get finance stats
    app.get('/api/finance/stats', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Finance module is disabled' });
        }
        
        const stats = await this.storage.getFinanceStats();
        res.json(stats);
      } catch (error) {
        console.error('Error fetching finance stats:', error);
        // Fallback stats
        res.json({
          totalRevenue: 0,
          pendingPayments: 0,
          pendingApprovals: 0
        });
      }
    });
    
    // Get pending approvals
    app.get('/api/finance/pending-approvals', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Finance module is disabled' });
        }
        
        const approvals = await this.storage.getPendingFinanceApprovals();
        res.json(approvals);
      } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.json([]);
      }
    });
    
    // Get all finance records (supports pagination, sorting and simple search)
    app.get('/api/finance/records', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Finance module is disabled' });
        }

        const page = parseInt(String(req.query.page || '1')) || 1;
        const pageSize = parseInt(String(req.query.pageSize || '25')) || 25;
        const sortBy = req.query.sortBy ? String(req.query.sortBy) : null;
        const sortDir = req.query.sortDir === 'asc' ? 'asc' : 'desc';
        const query = req.query.query ? String(req.query.query) : '';

        if (query) {
          try {
            // Use the new direct SQL search for queries
            const result = await this.searchFinanceRecords(query, page, pageSize, sortBy, sortDir);
            return res.json(result);
          } catch (searchError) {
            console.error('Error in finance search:', searchError);
            // Fall back to standard method on search error
            const result = await this.storage.getFinanceRecords({ 
              page, 
              pageSize, 
              sortBy, 
              sortDir: sortDir as any,
              query: null 
            });
            return res.json(result);
          }
        } else {
          // Use standard method for no-search case
          const result = await this.storage.getFinanceRecords({ 
            page, 
            pageSize, 
            sortBy, 
            sortDir: sortDir as any,
            query: null 
          });
          return res.json(result);
        }
      } catch (error) {
        console.error('Error fetching finance records:', error);
        res.json({ rows: [], total: 0 });
      }
    });
    
    // Update finance record
    // Update finance record
    app.put('/api/finance/records/:id', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Finance module is disabled' });
        }

        const { id } = req.params;
        // Temporary debug: log raw incoming body and query
        try {
          console.error('Finance PUT - raw req.body:', JSON.stringify(req.body));
        } catch (e) {
          console.error('Finance PUT - raw req.body (stringified failed):', req.body);
        }
        console.error('Finance PUT - req.query:', JSON.stringify(req.query));
        // Normalize date strings to Date objects so schema and DB accept them
        const normalizeDateFields = (obj: any) => {
          if (!obj || typeof obj !== 'object') return obj;
          const copy = { ...obj };
          const dateKeys = ['paymentDate', 'dueDate', 'invoiceDate', 'balanceAmountReceivedDate'];
          for (const k of dateKeys) {
            const v = copy[k];
            // Treat null/undefined explicitly as missing
            if (v == null) {
              delete copy[k];
              continue;
            }
            // If an empty string or whitespace, remove the key so validation won't see it
            if (typeof v === 'string') {
              const s = v.trim();
              if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
                delete copy[k];
                continue;
              }

              // Accept common date-only formats (YYYY-MM-DD) by adding a time component
              let candidate = s;
              if (/^\d{4}-\d{2}-\d{2}$/.test(s)) candidate = `${s}T00:00:00`;
              // Also accept datetime-local strings without timezone (YYYY-MM-DDTHH:MM)
              if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(candidate)) candidate = `${candidate}:00`;
              const d = new Date(candidate);
              if (!isNaN(d.getTime())) {
                copy[k] = d;
              } else {
                // Unparseable string -> remove key to avoid validation errors
                delete copy[k];
              }
              continue;
            }

            // If it's already a Date, keep it; otherwise remove unexpected types
            if (v instanceof Date) continue;
            delete copy[k];
          }
          return copy;
        };

        let normalized: any = normalizeDateFields(req.body);
        // Coerce money/decimal fields that may come as numeric strings into Numbers
        const moneyKeys = [
          'amount','totalAmount','taxAmount','discountAmount','lateFees','refundAmount',
          'invoiceAmount','paymentReceivedAmount','phlebotomistCharges','sampleShipmentAmount',
          'thirdPartyCharges','otherCharges','budget'
        ];
        for (const k of moneyKeys) {
          if (!Object.prototype.hasOwnProperty.call(normalized, k)) continue;
          const v = normalized[k];
          if (v == null) continue;
          if (typeof v === 'number') {
            // convert numbers to decimal string
            normalized[k] = String(v);
            continue;
          }
          if (typeof v === 'string') {
            const cleaned = v.replace(/,/g, '').trim();
            if (/^[+-]?\d+(?:\.\d+)?$/.test(cleaned)) {
              // keep as string because insert schema expects decimal string
              normalized[k] = cleaned;
            }
          }
        }
        const { insertFinanceRecordSchema } = await import('@shared/schema');
        // Helper to safely serialize Dates for debugging
        const safeSerialize = (o: any): any => {
          if (o == null) return o;
          if (o instanceof Date) return o.toISOString();
          if (Array.isArray(o)) return o.map(safeSerialize);
          if (typeof o === 'object') {
            const out: any = {};
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

        // Debug: show normalized payload shape right before validation (dates are ISO)
        const normalizedSafe = safeSerialize(normalized);
        console.error('Finance PUT - normalized payload:', JSON.stringify(normalizedSafe));

        // If client supplies ?debugNorm=1 we'll return the normalized payload for local debugging
        if (String(req.query.debugNorm) === '1') {
          return res.status(200).json({ normalized: normalizedSafe });
        }

        const parsed = insertFinanceRecordSchema.partial().safeParse(normalized);
        // Defensive: drop any remaining empty-string values (client may send "" from date inputs)
        Object.keys(normalized).forEach((k) => {
          if (normalized[k] === '') delete normalized[k];
        });

        // Final pass: ensure date-like string fields are converted to Date or removed
        const finalDateKeys = ['paymentDate', 'dueDate', 'invoiceDate', 'balanceAmountReceivedDate', 'dateSampleCollected'];
        for (const k of finalDateKeys) {
          if (!Object.prototype.hasOwnProperty.call(normalized, k)) continue;
          const v = normalized[k];
          if (v == null) { delete normalized[k]; continue; }
          if (v instanceof Date) continue;
          if (typeof v === 'string') {
            const s = v.trim();
            if (s === '') { delete normalized[k]; continue; }
            let candidate = s;
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) candidate = `${s}T00:00:00`;
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(candidate)) candidate = `${candidate}:00`;
            const d = new Date(candidate);
            if (!isNaN(d.getTime())) normalized[k] = d; else delete normalized[k];
          } else {
            delete normalized[k];
          }
        }

        const parsedAfterCleanup = insertFinanceRecordSchema.partial().safeParse(normalized);
        if (!parsedAfterCleanup.success) {
          console.error(`Finance validation failed on PUT /api/finance/records/${id}:`, JSON.stringify(parsedAfterCleanup.error.errors, null, 2));
          // Include normalized payload to help debug validation issues in local/dev
          const normalizedSafe = safeSerialize(normalized);
          return res.status(400).json({ message: 'Invalid finance record data', errors: parsedAfterCleanup.error.errors, normalized: normalizedSafe });
        }

        try {
          console.error('Finance PUT - parsed.data about to be saved:', JSON.stringify(parsedAfterCleanup.data, null, 2));
          const record = await this.storage.updateFinanceRecord(id, parsedAfterCleanup.data as any);
          if (!record) {
            return res.status(404).json({ message: 'Finance record not found' });
          }
          res.json(record);
        } catch (err) {
          console.error('DB error updating finance record:', (err as any).message || err);
          console.error((err as any).stack || err);
          return res.status(500).json({ message: 'DB error updating finance record', error: (err as Error).message });
        }
      } catch (error) {
        console.error('Error updating finance record:', error);
        res.status(500).json({ message: 'Failed to update finance record' });
      }
    });
    
    // Module health check
    app.get('/api/modules/finance/health', async (req, res) => {
      const health = await this.healthCheck();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });
    
    console.log('✅ Finance routes registered');
  }
}