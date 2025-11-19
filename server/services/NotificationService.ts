import { storage } from '../storage';
import { InsertNotification } from '../../shared/schema';

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Lead Management Notifications
  async notifyLeadCreated(leadId: string, organizationName: string, userId?: string) {
    console.log('NotificationService: Creating notification for lead:', leadId, organizationName, userId);
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'New Lead Created',
      message: `A new lead has been created for ${organizationName}`,
      type: 'lead_created',
      relatedId: leadId,
      isRead: false
    };
    
    try {
      const result = await storage.createNotification(notification);
      console.log('NotificationService: Notification created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('NotificationService: Failed to create notification:', error);
      throw error;
    }
  }

  async notifyLeadConverted(leadId: string, organizationName: string, sampleId: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Lead Converted to Sample',
      message: `Lead for ${organizationName} has been converted to sample (ID: ${sampleId})`,
      type: 'lead_converted',
      relatedId: leadId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  async notifyLeadStatusChanged(leadId: string, organizationName: string, oldStatus: string, newStatus: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Lead Status Updated',
      message: `Lead for ${organizationName} status changed from ${oldStatus} to ${newStatus}`,
      type: 'lead_status_changed',
      relatedId: leadId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  // Sample Tracking Notifications
  async notifySampleReceived(sampleId: string, organizationName: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Sample Received',
      message: `Sample from ${organizationName} has been received (ID: ${sampleId})`,
      type: 'sample_received',
      relatedId: sampleId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  async notifySampleStatusChanged(sampleId: string, organizationName: string, oldStatus: string, newStatus: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Sample Status Updated',
      message: `Sample from ${organizationName} status changed from ${oldStatus} to ${newStatus}`,
      type: 'sample_status_changed',
      relatedId: sampleId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  // Genetic Counselling Notifications
  async notifyGeneticCounsellingRequired(sampleId: string, patientName: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Genetic Counselling Required',
      message: `Genetic counselling is required for patient ${patientName} (Sample ID: ${sampleId})`,
      type: 'genetic_counselling_required',
      relatedId: sampleId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  async notifyGeneticCounsellingCompleted(gcId: string, patientName: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Genetic Counselling Completed',
      message: `Genetic counselling has been completed for patient ${patientName}`,
      type: 'genetic_counselling_completed',
      relatedId: gcId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  // Finance Notifications
  async notifyPaymentReceived(financeId: string, amount: number, organizationName: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Payment Received',
      message: `Payment of ₹${amount.toLocaleString()} received from ${organizationName}`,
      type: 'payment_received',
      relatedId: financeId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  async notifyPaymentPending(financeId: string, amount: number, organizationName: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Payment Pending',
      message: `Payment of ₹${amount.toLocaleString()} is pending from ${organizationName}`,
      type: 'payment_pending',
      relatedId: financeId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  // Lab Processing Notifications
  async notifyLabProcessingStarted(sampleId: string, testType: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Lab Processing Started',
      message: `Lab processing has started for ${testType} (Sample ID: ${sampleId})`,
      type: 'lab_processing_started',
      relatedId: sampleId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  async notifyLabProcessingCompleted(sampleId: string, testType: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Lab Processing Completed',
      message: `Lab processing has been completed for ${testType} (Sample ID: ${sampleId})`,
      type: 'lab_processing_completed',
      relatedId: sampleId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  // Bioinformatics Notifications
  async notifyBioinformaticsStarted(sampleId: string, analysisType: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Bioinformatics Analysis Started',
      message: `Bioinformatics analysis has started for ${analysisType} (Sample ID: ${sampleId})`,
      type: 'bioinformatics_started',
      relatedId: sampleId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  async notifyBioinformaticsCompleted(sampleId: string, analysisType: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Bioinformatics Analysis Completed',
      message: `Bioinformatics analysis has been completed for ${analysisType} (Sample ID: ${sampleId})`,
      type: 'bioinformatics_completed',
      relatedId: sampleId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  // Report Notifications
  async notifyReportGenerated(reportId: string, patientName: string, testType: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Report Generated',
      message: `Report has been generated for ${patientName} - ${testType}`,
      type: 'report_generated',
      relatedId: reportId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  async notifyReportApproved(reportId: string, patientName: string, testType: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Report Approved',
      message: `Report has been approved for ${patientName} - ${testType}`,
      type: 'report_approved',
      relatedId: reportId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  async notifyReportDelivered(reportId: string, patientName: string, testType: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: 'Report Delivered',
      message: `Report has been delivered to patient ${patientName} - ${testType}`,
      type: 'report_delivered',
      relatedId: reportId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  // Admin Panel Notifications
  async notifySystemAlert(title: string, message: string, userId?: string) {
    const notification: InsertNotification = {
      userId: userId || 'system',
      title: title,
      message: message,
      type: 'system_alert',
      relatedId: null,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  // General utility methods
  async notifyAllUsers(title: string, message: string, type: string) {
    // Get all users and create notifications for each
    // This would require getting user list from storage
    const notification: InsertNotification = {
      userId: 'all',
      title: title,
      message: message,
      type: type,
      relatedId: null,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  }

  async markAsRead(notificationId: string) {
    return await storage.markNotificationAsRead(notificationId);
  }

  async getUserNotifications(userId: string) {
    return await storage.getNotificationsByUserId(userId);
  }
}

export const notificationService = NotificationService.getInstance();