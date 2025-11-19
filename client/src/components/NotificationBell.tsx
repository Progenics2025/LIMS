import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator 
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // For now, using 'system' as userId - in real app, get from auth context
      const response = await fetch('/api/notifications/system');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      // Mark all as read
      const unreadNotifications = notifications.filter(n => !n.isRead);
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const deleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent marking as read when deleting
    event.preventDefault(); // Prevent any default behavior
    try {
      console.log('Deleting notification:', notificationId); // Debug log
      // Trigger local fade-out animation
      setDeletingIds(prev => Array.from(new Set([...prev, notificationId])));

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('Delete successful'); // Debug log
        // allow animation to play then remove from state
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notificationId));
          setDeletingIds(prev => prev.filter(id => id !== notificationId));
          setUnreadCount(prev => {
            const notification = notifications.find(n => n.id === notificationId);
            return notification && !notification.isRead ? Math.max(0, prev - 1) : prev;
          });
          toast({ title: 'Notification deleted', description: 'The notification was removed.' });
        }, 180);
      } else {
        console.error('Delete failed with status:', response.status);
        setDeletingIds(prev => prev.filter(id => id !== notificationId));
        toast({ title: 'Delete failed', description: 'Could not delete notification', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setDeletingIds(prev => prev.filter(id => id !== notificationId));
      toast({ title: 'Delete failed', description: 'Network error', variant: 'destructive' });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lead_created':
      case 'lead_converted':
      case 'lead_status_changed':
        return '👤';
      case 'sample_received':
      case 'sample_status_changed':
        return '🧪';
      case 'genetic_counselling_required':
      case 'genetic_counselling_completed':
        return '🧬';
      case 'payment_received':
      case 'payment_pending':
        return '💰';
      case 'lab_processing_started':
      case 'lab_processing_completed':
        return '🔬';
      case 'bioinformatics_started':
      case 'bioinformatics_completed':
      case 'bioinformatics_ready':
        return '💻';
      case 'report_generated':
      case 'report_approved':
      case 'report_delivered':
      case 'report_ready':
        return '📄';
      case 'system_alert':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'lead_created':
      case 'lead_converted':
        return 'text-blue-600';
      case 'payment_received':
        return 'text-green-600';
      case 'payment_pending':
        return 'text-orange-600';
      case 'report_generated':
      case 'report_approved':
        return 'text-purple-600';
      case 'system_alert':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown time';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      
      // Always show the actual creation date instead of "Just now"
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting time ago:', error, dateString);
      return 'Unknown time';
    }
  };

  const formatFullDateTime = (dateString: string) => {
    if (!dateString) return 'No date';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return date.toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } else {
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (error) {
      console.error('Error formatting full date time:', error, dateString);
      return 'No date';
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reusable list component used both inside dropdown and modal.
  // Defined inside NotificationBell so it can access helper functions above.
  const NotificationsList = ({ notifications, markAsRead, deleteNotification, deletingIds }: {
    notifications: Notification[];
    markAsRead: (id: string) => void;
    deleteNotification: (id: string, e: React.MouseEvent) => Promise<void>;
    deletingIds?: string[];
  }) => {
    return (
      <>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "p-3 border-b hover:bg-muted/50 transition-colors relative group",
              !notification.isRead && "bg-blue-50 dark:bg-blue-950/20",
              deletingIds && deletingIds.includes(notification.id) ? 'opacity-0 transition-opacity duration-150' : 'opacity-100'
            )}
          >
            <div className="flex items-start space-x-3">
              <div className="text-lg flex-shrink-0">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1 min-w-0 cursor-pointer pr-8" onClick={() => markAsRead(notification.id)}>
                <div className="flex items-center justify-between mb-1">
                  <p className={cn("text-sm font-medium truncate", getNotificationColor(notification.type))}>
                    {notification.title}
                  </p>
                  {!notification.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground" title={formatFullDateTime(notification.createdAt)}>
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900 focus-visible:opacity-100 z-10"
                onClick={(e) => deleteNotification(notification.id, e)}
                aria-label="Delete notification"
                title="Delete notification"
              >
                <X className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllNotifications}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-96">
          {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No notifications
              </div>
            ) : (
              <NotificationsList
                notifications={notifications}
                markAsRead={markAsRead}
                deleteNotification={deleteNotification}
                deletingIds={deletingIds}
              />
            )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  // Open modal with full notifications list
                  setIsOpen(false);
                  setShowAllModal(true);
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
      
      {/* Full notifications modal - reuse same list markup and behavior */}
      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Notifications</DialogTitle>
            <DialogDescription>All system notifications (interactive)</DialogDescription>
          </DialogHeader>

          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">No notifications</div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <NotificationsList
                  notifications={notifications}
                  markAsRead={markAsRead}
                  deleteNotification={deleteNotification}
                  deletingIds={deletingIds}
                />
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}
 