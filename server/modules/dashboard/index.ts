// Dashboard Module - Provides overview and statistics from all modules
import { Express } from 'express';
import { AbstractModule } from '../base';
import { DBStorage } from '../../storage';
import mysql from 'mysql2/promise';

export class DashboardModule extends AbstractModule {
  name = 'dashboard';
  version = '1.0.0';

  constructor(storage: DBStorage) {
    super(storage);
  }

  async validateSchema(): Promise<boolean> {
    try {
      // Dashboard doesn't have its own tables, it aggregates from other modules
      // Check if core tables exist
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'remote_user',
        password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
        database: process.env.DB_NAME || 'lead_lims2',
      });

      const [tables] = await connection.execute('SHOW TABLES');
      await connection.end();

      const tableNames = (tables as any[]).map(row => Object.values(row)[0]);
      const requiredTables = ['lead_management', 'sample_tracking', 'users'];

      const hasAllTables = requiredTables.every(table => tableNames.includes(table));

      console.log(`Dashboard Schema Check: ${hasAllTables ? '✅' : '❌'}`);
      return hasAllTables;
    } catch (error) {
      console.error('Dashboard schema validation error:', error);
      return false;
    }
  }

  registerRoutes(app: Express): void {
    console.log('🔗 Registering Dashboard routes...');

    // Get dashboard statistics
    app.get('/api/dashboard/stats', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Dashboard module is disabled' });
        }

        // Get stats with fallback to prevent errors
        let stats = {
          activeLeads: 0,
          samplesProcessing: 0,
          reportsPending: 0,
          pendingRevenue: 0
        };

        try {
          const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'remote_user',
            password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
            database: process.env.DB_NAME || 'lead_lims2',
          });

          // Count active leads (not converted, not closed) from lead_management table
          const [leadRows] = await connection.execute(`
            SELECT COUNT(*) as count FROM lead_management 
            WHERE status IN ('quoted', 'cold', 'hot', 'won')
          `);
          stats.activeLeads = (leadRows as any[])[0]?.count || 0;

          // Count samples in processing (all samples in sample_tracking)
          const [sampleRows] = await connection.execute(`
            SELECT COUNT(*) as count FROM sample_tracking
          `);
          stats.samplesProcessing = (sampleRows as any[])[0]?.count || 0;

          // Count all reports that are NOT delivered yet (pending reports)
          // This includes: in_progress, awaiting_approval, approved
          const [reportRows] = await connection.execute(`
            SELECT COUNT(*) as count FROM reports 
            WHERE status IN ('in_progress', 'awaiting_approval', 'approved')
          `);
          stats.reportsPending = (reportRows as any[])[0]?.count || 0;

          // Calculate pending revenue as CUMULATIVE SUM of all budget values from finance_sheet
          // where payment is not complete (total_amount_received_status = 0 or NULL)
          let pendingRevenue = 0;
          try {
            const [revenueRows] = await connection.execute(`
              SELECT COALESCE(SUM(COALESCE(budget, 0)), 0) as pending
              FROM finance_sheet
              WHERE total_amount_received_status = 0 OR total_amount_received_status IS NULL
            `);
            pendingRevenue = parseFloat((revenueRows as any[])[0]?.pending || 0);

            // If no pending from finance_sheet, try from lead_management for converted leads
            if (pendingRevenue === 0) {
              const [leadBudgetRows] = await connection.execute(`
                SELECT COALESCE(SUM(COALESCE(budget, 0)), 0) as pending
                FROM lead_management
                WHERE status = 'converted'
              `);
              pendingRevenue = parseFloat((leadBudgetRows as any[])[0]?.pending || 0);
            }

            // If still no data, try sample_tracking table
            if (pendingRevenue === 0) {
              const [sampleBudgetRows] = await connection.execute(`
                SELECT COALESCE(SUM(COALESCE(sample_shipment_amount, 0)), 0) as pending 
                FROM sample_tracking
              `);
              pendingRevenue = parseFloat((sampleBudgetRows as any[])[0]?.pending || 0);
            }
          } catch (err) {
            console.warn('Pending revenue query failed:', err);
          }
          stats.pendingRevenue = pendingRevenue;

          await connection.end();
        } catch (error) {
          console.warn('Dashboard stats query failed, using defaults:', error);
        }

        res.json(stats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Return fallback stats with correct field names
        res.json({
          activeLeads: 0,
          samplesProcessing: 0,
          reportsPending: 0,
          pendingRevenue: 0
        });
      }
    });

    // Get recent activities
    app.get('/api/dashboard/activities', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Dashboard module is disabled' });
        }

        // Return mock activities for now
        const activities = [
          {
            id: '1',
            type: 'lead_created',
            message: 'New discovery lead created for Apollo Hospitals',
            timestamp: new Date(),
            module: 'leads'
          },
          {
            id: '2',
            type: 'sample_received',
            message: 'Sample PG20240830001 received in lab',
            timestamp: new Date(Date.now() - 3600000),
            module: 'samples'
          },
          {
            id: '3',
            type: 'report_ready',
            message: 'Report for sample DG20240829001 is ready',
            timestamp: new Date(Date.now() - 7200000),
            module: 'reports'
          }
        ];

        res.json(activities);
      } catch (error) {
        console.error('Error fetching dashboard activities:', error);
        res.status(500).json({ message: 'Failed to fetch activities' });
      }
    });

    // Module health check
    app.get('/api/modules/dashboard/health', async (req, res) => {
      const health = await this.healthCheck();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    console.log('✅ Dashboard routes registered');
  }
}