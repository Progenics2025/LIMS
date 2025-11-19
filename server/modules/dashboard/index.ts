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
        host: process.env.DB_HOST || '192.168.29.12',
        user: process.env.DB_USER || 'remote_user',
        password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
        database: process.env.DB_NAME || 'leadlab_lims',
      });
      
      const [tables] = await connection.execute('SHOW TABLES');
      await connection.end();
      
      const tableNames = (tables as any[]).map(row => Object.values(row)[0]);
      const requiredTables = ['leads', 'samples', 'users'];
      
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
            host: process.env.DB_HOST || '192.168.29.12',
            user: process.env.DB_USER || 'remote_user',
            password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
            database: process.env.DB_NAME || 'leadlab_lims',
          });
          
          // Count active leads (not converted, not closed)
          const [leadRows] = await connection.execute(`
            SELECT COUNT(*) as count FROM leads 
            WHERE status IN ('quoted', 'cold', 'hot', 'won')
          `);
          stats.activeLeads = (leadRows as any[])[0]?.count || 0;
          
          // Count samples in processing (not completed)
          const [sampleRows] = await connection.execute(`
            SELECT COUNT(*) as count FROM samples 
            WHERE status IN ('pickup_scheduled', 'in_transit', 'received', 'lab_processing', 'bioinformatics', 'reporting')
          `);
          stats.samplesProcessing = (sampleRows as any[])[0]?.count || 0;
          
          // Count reports pending (not delivered)
          const [reportRows] = await connection.execute(`
            SELECT COUNT(*) as count FROM reports 
            WHERE status IN ('in_progress', 'awaiting_approval', 'approved')
          `);
          stats.reportsPending = (reportRows as any[])[0]?.count || 0;
          
          // Calculate pending revenue (samples where amount > paid_amount)
          const [revenueRows] = await connection.execute(`
            SELECT COALESCE(SUM(amount - COALESCE(paid_amount, 0)), 0) as pending
            FROM samples 
            WHERE amount > COALESCE(paid_amount, 0)
          `);
          stats.pendingRevenue = parseFloat((revenueRows as any[])[0]?.pending || 0);
          
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