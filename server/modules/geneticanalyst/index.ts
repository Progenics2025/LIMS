// Genetic Analyst Module - Handles all genetic analysis records
import { Express } from 'express';
import { AbstractModule } from '../base';
import { DBStorage } from '../../storage';
import mysql from 'mysql2/promise';
import { pool } from '../../db';

export interface GeneticAnalystRecord {
  id: string;
  uniqueId: string;
  projectId: string;
  sampleId: string;
  receivedDateForAnalysis?: string;
  completedAnalysis?: string;
  analyzedBy?: string;
  reviewerComments?: string;
  reportPreparationDate?: string;
  reportReviewDate?: string;
  reportReleaseDate?: string;
  remarks?: string;
  createdAt?: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export class GeneticAnalystModule extends AbstractModule {
  name = 'genetic-analyst';
  version = '1.0.0';

  constructor(storage: DBStorage) {
    super(storage);
  }

  async validateSchema(): Promise<boolean> {
    try {
      // Check if geneticanalyst table exists and has required columns
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'remote_user',
        password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
        database: process.env.DB_NAME || 'lead_lims2',
      });

      const [rows] = await connection.execute('DESCRIBE geneticanalyst');
      await connection.end();

      const columns = (rows as any[]).map(row => row.Field);
      const requiredColumns = [
        'id', 'unique_id', 'project_id', 'sample_id'
      ];

      const hasAllColumns = requiredColumns.every(col =>
        columns.includes(col)
      );

      console.log(`Genetic Analyst Schema Check: ${hasAllColumns ? '✅' : '❌'}`);
      return hasAllColumns;
    } catch (error) {
      console.error('Genetic Analyst schema validation error:', error);
      return false;
    }
  }

  registerRoutes(app: Express): void {
    console.log('🔗 Registering Genetic Analyst routes...');

    // Get all genetic analyst records
    app.get('/api/genetic-analyst', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Genetic Analyst module is disabled' });
        }

        const [rows] = await pool.execute('SELECT * FROM geneticanalyst ORDER BY created_at DESC');
        const records = (rows as any[]).map(row => this.mapRowToRecord(row));
        res.json(records);
      } catch (error) {
        console.error('Error fetching genetic analyst records:', error);
        res.status(500).json({ message: 'Failed to fetch genetic analyst records' });
      }
    });

    // Get single record by ID
    app.get('/api/genetic-analyst/:id', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Genetic Analyst module is disabled' });
        }

        const { id } = req.params;
        const [rows] = await pool.execute('SELECT * FROM geneticanalyst WHERE id = ?', [id]);

        if ((rows as any[]).length === 0) {
          return res.status(404).json({ message: 'Record not found' });
        }

        const record = this.mapRowToRecord((rows as any[])[0]);
        res.json(record);
      } catch (error) {
        console.error('Error fetching genetic analyst record:', error);
        res.status(500).json({ message: 'Failed to fetch genetic analyst record' });
      }
    });

    // Create new genetic analyst record
    app.post('/api/genetic-analyst', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Genetic Analyst module is disabled' });
        }

        const {
          id,
          uniqueId,
          projectId,
          sampleId,
          receivedDateForAnalysis,
          completedAnalysis,
          analyzedBy,
          reviewerComments,
          reportPreparationDate,
          reportReviewDate,
          reportReleaseDate,
          remarks,
          createdBy
        } = req.body;

        // Validate required fields
        if (!id || !uniqueId || !projectId || !sampleId) {
          return res.status(400).json({
            message: 'Missing required fields: id, uniqueId, projectId, sampleId'
          });
        }

        const [result] = await pool.execute(
          `INSERT INTO geneticanalyst (
            id, unique_id, project_id, sample_id,
            received_date_for_analysis, completed_analysis, analyzed_by,
            reviewer_comments, report_preparation_date, report_review_date,
            report_release_date, remarks, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            id, uniqueId, projectId, sampleId,
            receivedDateForAnalysis || null,
            completedAnalysis || null,
            analyzedBy || null,
            reviewerComments || null,
            reportPreparationDate || null,
            reportReviewDate || null,
            reportReleaseDate || null,
            remarks || null,
            createdBy || 'system'
          ]
        );

        const record: GeneticAnalystRecord = {
          id,
          uniqueId,
          projectId,
          sampleId,
          receivedDateForAnalysis,
          completedAnalysis,
          analyzedBy,
          reviewerComments,
          reportPreparationDate,
          reportReviewDate,
          reportReleaseDate,
          remarks,
          createdBy,
          createdAt: new Date().toISOString()
        };

        res.status(201).json(record);
      } catch (error: any) {
        console.error('Error creating genetic analyst record:', error);
        res.status(500).json({
          message: 'Failed to create genetic analyst record',
          error: error.message
        });
      }
    });

    // Update genetic analyst record
    app.put('/api/genetic-analyst/:id', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Genetic Analyst module is disabled' });
        }

        const { id } = req.params;
        const {
          receivedDateForAnalysis,
          completedAnalysis,
          analyzedBy,
          reviewerComments,
          reportPreparationDate,
          reportReviewDate,
          reportReleaseDate,
          remarks,
          modifiedBy
        } = req.body;

        // Check if record exists
        const [rows] = await pool.execute('SELECT * FROM geneticanalyst WHERE id = ?', [id]);
        if ((rows as any[]).length === 0) {
          return res.status(404).json({ message: 'Record not found' });
        }

        await pool.execute(
          `UPDATE geneticanalyst SET
            received_date_for_analysis = ?,
            completed_analysis = ?,
            analyzed_by = ?,
            reviewer_comments = ?,
            report_preparation_date = ?,
            report_review_date = ?,
            report_release_date = ?,
            remarks = ?,
            modified_by = ?,
            modified_at = NOW()
          WHERE id = ?`,
          [
            receivedDateForAnalysis || null,
            completedAnalysis || null,
            analyzedBy || null,
            reviewerComments || null,
            reportPreparationDate || null,
            reportReviewDate || null,
            reportReleaseDate || null,
            remarks || null,
            modifiedBy || 'system',
            id
          ]
        );

        const [updatedRows] = await pool.execute('SELECT * FROM geneticanalyst WHERE id = ?', [id]);
        const record = this.mapRowToRecord((updatedRows as any[])[0]);
        res.json(record);
      } catch (error: any) {
        console.error('Error updating genetic analyst record:', error);
        res.status(500).json({
          message: 'Failed to update genetic analyst record',
          error: error.message
        });
      }
    });

    // Delete genetic analyst record
    app.delete('/api/genetic-analyst/:id', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Genetic Analyst module is disabled' });
        }

        const { id } = req.params;

        // Check if record exists
        const [rows] = await pool.execute('SELECT * FROM geneticanalyst WHERE id = ?', [id]);
        if ((rows as any[]).length === 0) {
          return res.status(404).json({ message: 'Record not found' });
        }

        const record = this.mapRowToRecord((rows as any[])[0]);

        await pool.execute('DELETE FROM geneticanalyst WHERE id = ?', [id]);

        res.json({
          message: 'Record deleted successfully',
          deletedRecord: record
        });
      } catch (error: any) {
        console.error('Error deleting genetic analyst record:', error);
        res.status(500).json({
          message: 'Failed to delete genetic analyst record',
          error: error.message
        });
      }
    });



    // Deploy to Reports (Transition from Genetic Analyst -> Reports)
    app.post('/api/genetic-analyst/:id/deploy-to-reports', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Genetic Analyst module is disabled' });
        }

        const { id } = req.params;

        // 1. Get Genetic Analyst Record
        const [gaRows]: any = await pool.execute('SELECT * FROM geneticanalyst WHERE id = ?', [id]);
        if (gaRows.length === 0) {
          return res.status(404).json({ message: 'Genetic Analyst record not found' });
        }
        const gaRecord = gaRows[0];

        // 2. Check if Report already exists
        const [existingReport]: any = await pool.execute(
          'SELECT id FROM report_management WHERE unique_id = ? LIMIT 1',
          [gaRecord.unique_id]
        );
        if (existingReport.length > 0) {
          return res.status(409).json({
            success: true,
            alreadyExists: true,
            message: 'Report has already been released for this sample.',
          });
        }

        // 3. Find parent Bioinformatics record to get rich data (Patient Name, etc.)
        // Try Discovery first, then Clinical
        let bioRecord: any = null;
        let [bioRows]: any = await pool.execute(
          'SELECT * FROM bioinformatics_sheet_discovery WHERE project_id = ? LIMIT 1',
          [gaRecord.project_id]
        );
        if (bioRows.length > 0) {
          bioRecord = bioRows[0];
        } else {
          [bioRows] = await pool.execute(
            'SELECT * FROM bioinformatics_sheet_clinical WHERE project_id = ? LIMIT 1',
            [gaRecord.project_id]
          );
          if (bioRows.length > 0) {
            bioRecord = bioRows[0];
          }
        }

        if (!bioRecord) {
          console.warn(`Genetic Analyst Deploy: No parent bioinformatics record found for project ${gaRecord.project_id}. Proceeding with minimal data.`);
          // We will proceed, but patient data will be missing
        }

        // 4. Construct Report Management Payload
        const reportData: any = {
          unique_id: gaRecord.unique_id,
          project_id: gaRecord.project_id,
          sample_id: gaRecord.sample_id,
          created_at: new Date(),
          lead_created_by: req.body.createdBy || gaRecord.analyzed_by || 'system',
          lead_modified: new Date(),

          // Map fields from Genetic Analyst
          // (If GA had fields mapping to Report, we'd map them here. Currently mainly dates)

          // Map fields from Bioinformatics (Rich Data)
          patient_client_name: bioRecord?.patient_client_name || null,
          age: bioRecord?.age || null,
          gender: bioRecord?.gender || null,
          clinician_researcher_name: bioRecord?.clinician_researcher_name || null,
          organisation_hospital: bioRecord?.organisation_hospital || null,
          service_name: bioRecord?.service_name || null,
          no_of_samples: bioRecord?.no_of_samples || null,
          tat: bioRecord?.tat || null,
          remark_comment: gaRecord.remarks || bioRecord?.remark_comment || null, // Prefer GA remarks if present
        };

        // 5. Insert into report_management
        const keys = Object.keys(reportData);
        const cols = keys.map(k => `\`${k}\``).join(',');
        const placeholders = keys.map(() => '?').join(',');
        const values = keys.map(k => reportData[k]);

        await pool.execute(
          `INSERT INTO report_management (${cols}) VALUES (${placeholders})`,
          values
        );

        // 6. Update Genetic Analyst record to show it was released
        await pool.execute(
          'UPDATE geneticanalyst SET report_release_date = COALESCE(report_release_date, CURDATE()) WHERE id = ?',
          [id]
        );

        res.json({ success: true, message: 'Successfully deployed to Reports' });

      } catch (error: any) {
        console.error('Error deploying to reports:', error);
        res.status(500).json({
          message: 'Failed to deploy to reports',
          error: error.message
        });
      }
    });

    // Filter records by project or sample
    app.get('/api/genetic-analyst/filter/:type/:value', async (req, res) => {
      try {
        if (!this.enabled) {
          return res.status(503).json({ message: 'Genetic Analyst module is disabled' });
        }

        const { type, value } = req.params;

        let query = 'SELECT * FROM geneticanalyst WHERE ';
        if (type === 'project') {
          query += 'project_id = ?';
        } else if (type === 'sample') {
          query += 'sample_id = ?';
        } else {
          return res.status(400).json({ message: 'Invalid filter type. Use "project" or "sample"' });
        }

        const [rows] = await pool.execute(query + ' ORDER BY created_at DESC', [value]);
        const records = (rows as any[]).map(row => this.mapRowToRecord(row));
        res.json(records);
      } catch (error) {
        console.error('Error filtering genetic analyst records:', error);
        res.status(500).json({ message: 'Failed to filter genetic analyst records' });
      }
    });
  }

  private mapRowToRecord(row: any): GeneticAnalystRecord {
    return {
      id: row.id,
      uniqueId: row.unique_id,
      projectId: row.project_id,
      sampleId: row.sample_id,
      receivedDateForAnalysis: row.received_date_for_analysis,
      completedAnalysis: row.completed_analysis,
      analyzedBy: row.analyzed_by,
      reviewerComments: row.reviewer_comments,
      reportPreparationDate: row.report_preparation_date,
      reportReviewDate: row.report_review_date,
      reportReleaseDate: row.report_release_date,
      remarks: row.remarks,
      createdAt: row.created_at,
      createdBy: row.created_by,
      modifiedAt: row.modified_at,
      modifiedBy: row.modified_by
    };
  }

  async cleanup(): Promise<void> {
    console.log(`Cleaning up module: ${this.name}`);
    this.initialized = false;
  }
}
