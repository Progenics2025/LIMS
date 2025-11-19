import { notificationService } from './services/NotificationService';

// Test notification creation
async function testNotificationCreation() {
  try {
    console.log('Testing notification creation...');
    
    const result = await notificationService.notifyLeadCreated(
      'test-lead-123',
      'Test Organization',
      'system'
    );
    
    console.log('Notification created successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to create test notification:', error);
    throw error;
  }
}

export { testNotificationCreation };