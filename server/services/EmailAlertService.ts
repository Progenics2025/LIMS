/**
 * Email Alert Service
 * 
 * Sends email notifications to relevant team members when alerts are triggered:
 * - Lab Process Team: users with roles 'lab', 'manager', 'admin'
 * - Bioinformatics Team: users with roles 'bioinformatics', 'manager', 'admin'
 * - Report Team: users with roles 'reporting', 'manager', 'admin'
 */

import nodemailer from 'nodemailer';
import { storage } from '../storage';

// Email transporter configuration - matches existing SMTP setup
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '465') === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.log('📧 Email Alert Service - SMTP Connection Error:', error.message);
    } else {
        console.log('📧 Email Alert Service - SMTP Server is ready');
    }
});

interface AlertEmailData {
    sampleId?: string;
    projectId?: string;
    uniqueId?: string;
    patientName?: string;
    serviceName?: string;
    organisationHospital?: string;
    clinicianName?: string;
    alertType: 'lab_process' | 'bioinformatics' | 'report';
    tableName?: string;
    triggeredBy?: string;
}

export class EmailAlertService {
    private static instance: EmailAlertService;

    static getInstance(): EmailAlertService {
        if (!EmailAlertService.instance) {
            EmailAlertService.instance = new EmailAlertService();
        }
        return EmailAlertService.instance;
    }

    /**
     * Get email addresses of users by their roles
     */
    private async getUserEmailsByRoles(roles: string[]): Promise<string[]> {
        try {
            const allUsers = await storage.getAllUsers();
            const emails = allUsers
                .filter((user: any) =>
                    user.isActive &&
                    user.email &&
                    roles.includes(user.role?.toLowerCase())
                )
                .map((user: any) => user.email);

            return Array.from(new Set(emails)); // Remove duplicates
        } catch (error) {
            console.error('Error fetching user emails by roles:', error);
            return [];
        }
    }

    /**
     * Send email to Lab Process team
     * Recipients: users with 'lab', 'manager', 'admin' roles
     */
    async sendLabProcessAlert(data: AlertEmailData): Promise<boolean> {
        const roles = ['lab', 'manager', 'admin'];
        const recipients = await this.getUserEmailsByRoles(roles);

        if (recipients.length === 0) {
            console.log('📧 No recipients found for Lab Process alert (roles: lab, manager, admin)');
            return false;
        }

        const subject = `🔬 New Sample Alert - Lab Processing Required`;
        const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0B1139 0%, #1a2255 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0; display: flex; align-items: center;">
            <span style="font-size: 24px; margin-right: 10px;">🔬</span>
            Lab Processing Alert
          </h2>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px;">A new sample has been sent for lab processing and requires your attention.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #e8f4fd;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Unique ID</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.uniqueId || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Project ID</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.projectId || '-'}</td>
            </tr>
            <tr style="background: #e8f4fd;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Sample ID</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.sampleId || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Patient Name</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.patientName || '-'}</td>
            </tr>
            <tr style="background: #e8f4fd;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Service Name</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.serviceName || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Organisation</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.organisationHospital || '-'}</td>
            </tr>
            <tr style="background: #e8f4fd;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Clinician</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.clinicianName || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Routed To</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.tableName || 'Lab Processing Sheet'}</td>
            </tr>
          </table>
          
          <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <strong>⚡ Action Required:</strong> Please log in to the LIMS system to view and process this sample.
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px;">
            This is an automated notification from Progenics LIMS. 
            ${data.triggeredBy ? `Triggered by: ${data.triggeredBy}` : ''}
          </p>
        </div>
      </div>
    `;

        return await this.sendEmail(recipients, subject, html);
    }

    /**
     * Send email to Bioinformatics team
     * Recipients: users with 'bioinformatics', 'manager', 'admin' roles
     */
    async sendBioinformaticsAlert(data: AlertEmailData): Promise<boolean> {
        const roles = ['bioinformatics', 'manager', 'admin'];
        const recipients = await this.getUserEmailsByRoles(roles);

        if (recipients.length === 0) {
            console.log('📧 No recipients found for Bioinformatics alert (roles: bioinformatics, manager, admin)');
            return false;
        }

        const subject = `🧬 New Sample Alert - Bioinformatics Analysis Required`;
        const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0; display: flex; align-items: center;">
            <span style="font-size: 24px; margin-right: 10px;">🧬</span>
            Bioinformatics Alert
          </h2>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px;">A sample has completed lab processing and is ready for bioinformatics analysis.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #e8f5e9;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Unique ID</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.uniqueId || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Project ID</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.projectId || '-'}</td>
            </tr>
            <tr style="background: #e8f5e9;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Sample ID</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.sampleId || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Patient Name</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.patientName || '-'}</td>
            </tr>
            <tr style="background: #e8f5e9;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Service Name</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.serviceName || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Organisation</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.organisationHospital || '-'}</td>
            </tr>
            <tr style="background: #e8f5e9;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Clinician</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.clinicianName || '-'}</td>
            </tr>
          </table>
          
          <div style="background: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <strong>🔄 Action Required:</strong> Please begin bioinformatics analysis for this sample.
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px;">
            This is an automated notification from Progenics LIMS.
            ${data.triggeredBy ? `Triggered by: ${data.triggeredBy}` : ''}
          </p>
        </div>
      </div>
    `;

        return await this.sendEmail(recipients, subject, html);
    }

    /**
     * Send email to Report team
     * Recipients: users with 'reporting', 'manager', 'admin' roles
     */
    async sendReportTeamAlert(data: AlertEmailData): Promise<boolean> {
        const roles = ['reporting', 'manager', 'admin'];
        const recipients = await this.getUserEmailsByRoles(roles);

        if (recipients.length === 0) {
            console.log('📧 No recipients found for Report Team alert (roles: reporting, manager, admin)');
            return false;
        }

        const subject = `📊 New Sample Alert - Report Generation Required`;
        const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4a1c6b 0%, #6b2d8f 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0; display: flex; align-items: center;">
            <span style="font-size: 24px; margin-right: 10px;">📊</span>
            Report Team Alert
          </h2>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px;">Bioinformatics analysis is complete. A new report needs to be generated.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f3e5f5;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Unique ID</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.uniqueId || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Project ID</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.projectId || '-'}</td>
            </tr>
            <tr style="background: #f3e5f5;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Sample ID</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.sampleId || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Patient Name</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.patientName || '-'}</td>
            </tr>
            <tr style="background: #f3e5f5;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Service Name</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.serviceName || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Organisation</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.organisationHospital || '-'}</td>
            </tr>
            <tr style="background: #f3e5f5;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Clinician</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${data.clinicianName || '-'}</td>
            </tr>
          </table>
          
          <div style="background: #e1bee7; border: 1px solid #9c27b0; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <strong>📝 Action Required:</strong> Please generate and review the report for this sample.
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px;">
            This is an automated notification from Progenics LIMS.
            ${data.triggeredBy ? `Triggered by: ${data.triggeredBy}` : ''}
          </p>
        </div>
      </div>
    `;

        return await this.sendEmail(recipients, subject, html);
    }

    /**
     * Generic email sender
     */
    private async sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
        try {
            if (!process.env.SMTP_USER) {
                console.log('📧 Email not sent - SMTP not configured');
                return false;
            }

            const mailOptions = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: to.join(', '),
                subject,
                html,
            };

            await transporter.sendMail(mailOptions);
            console.log(`📧 Email sent successfully to: ${to.join(', ')}`);
            return true;
        } catch (error) {
            console.error('📧 Failed to send email:', (error as Error).message);
            return false;
        }
    }
}

export const emailAlertService = EmailAlertService.getInstance();
