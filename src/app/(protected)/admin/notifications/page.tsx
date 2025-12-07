'use client';

import { useState, useMemo } from 'react';
import { useNotificationsAdmin, markAsRead, markAllAsRead, deleteNotification, createNotification } from '@/hooks/use-notifications-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bell, Plus, Eye, Trash2, Check, CheckCheck, Search, Mail, MailOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Notification } from '@/store/notifications-admin-store';

type StatusFilter = 'all' | 'read' | 'unread';
type TypeFilter = 'all' | 'system' | 'user';

export default function AdminNotificationsPage() {
  const { notifications, loading } = useNotificationsAdmin();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'system',
    title: '',
    message: '',
    action_link: '',
  });

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      // Status filter
      if (statusFilter === 'read' && !notification.is_read) return false;
      if (statusFilter === 'unread' && notification.is_read) return false;

      // Type filter
      if (typeFilter === 'system' && notification.user_id) return false;
      if (typeFilter === 'user' && !notification.user_id) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query) ||
          notification.user_name?.toLowerCase().includes(query) ||
          notification.user_email?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [notifications, statusFilter, typeFilter, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.is_read).length;
    const system = notifications.filter((n) => !n.user_id).length;
    const user = notifications.filter((n) => n.user_id).length;

    return { total, unread, system, user };
  }, [notifications]);

  const handleMarkAsRead = async (id: string) => {
    const success = await markAsRead(id);
    if (success) {
      toast.success('Notification marked as read');
    } else {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      toast.success('All notifications marked as read');
    } else {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteNotification(id);
    if (success) {
      toast.success('Notification deleted successfully');
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
      if (selectedNotification?.id === id) {
        setSelectedNotification(null);
      }
    } else {
      toast.error('Failed to delete notification');
    }
  };

  const handleCreateNotification = async () => {
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required');
      return;
    }

    const notification = await createNotification({
      user_id: formData.type === 'system' ? undefined : undefined, // For now, only system
      title: formData.title,
      message: formData.message,
      action_link: formData.action_link || undefined,
    });

    if (notification) {
      toast.success('Notification created successfully');
      setCreateDialogOpen(false);
      setFormData({ type: 'system', title: '', message: '', action_link: '' });
    } else {
      toast.error('Failed to create notification');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Notifications</h1>
              <p className="text-muted-foreground">Manage system and user notifications</p>
            </div>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading notifications...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">Manage system and user notifications</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All as Read
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Notification
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{stats.unread}</p>
              </div>
              <Mail className="w-8 h-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System</p>
                <p className="text-2xl font-bold">{stats.system}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User</p>
                <p className="text-2xl font-bold">{stats.user}</p>
              </div>
              <MailOpen className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by title, message, user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-full md:w-[200px]" suppressHydrationWarning>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TypeFilter)}>
              <SelectTrigger className="w-full md:w-[200px]" suppressHydrationWarning>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="system">System Notifications</SelectItem>
                <SelectItem value="user">User Notifications</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Notifications Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Title</th>
                  <th className="text-left p-4 font-medium">Message</th>
                  <th className="text-left p-4 font-medium">User</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      No notifications found
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((notification) => (
                    <tr key={notification.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <Badge variant={notification.user_id ? 'default' : 'secondary'}>
                          {notification.user_id ? 'User' : 'System'}
                        </Badge>
                      </td>
                      <td className="p-4 font-medium">{notification.title}</td>
                      <td className="p-4">
                        <div className="max-w-xs truncate text-muted-foreground">
                          {notification.message}
                        </div>
                      </td>
                      <td className="p-4">
                        {notification.user_id ? (
                          <div className="text-sm">
                            <div className="font-medium">{notification.user_name || 'N/A'}</div>
                            <div className="text-muted-foreground">{notification.user_email || 'N/A'}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant={notification.is_read ? 'outline' : 'default'}>
                          {notification.is_read ? 'Read' : 'Unread'}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(notification.created_at)}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedNotification(notification)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNotificationToDelete(notification.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* View Details Dialog */}
        <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Notification Details</DialogTitle>
              <DialogDescription>
                {selectedNotification?.user_id ? 'User Notification' : 'System Notification'}
              </DialogDescription>
            </DialogHeader>
            {selectedNotification && (
              <div className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <div className="mt-1">
                    <Badge variant={selectedNotification.user_id ? 'default' : 'secondary'}>
                      {selectedNotification.user_id ? 'User Notification' : 'System Notification'}
                    </Badge>
                  </div>
                </div>

                {selectedNotification.user_id && (
                  <div>
                    <Label>User</Label>
                    <div className="mt-1 text-sm">
                      <div className="font-medium">{selectedNotification.user_name || 'N/A'}</div>
                      <div className="text-muted-foreground">{selectedNotification.user_email || 'N/A'}</div>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Title</Label>
                  <div className="mt-1 font-medium">{selectedNotification.title}</div>
                </div>

                <div>
                  <Label>Message</Label>
                  <div className="mt-1 text-sm text-muted-foreground">{selectedNotification.message}</div>
                </div>

                {selectedNotification.action_link && (
                  <div>
                    <Label>Action Link</Label>
                    <div className="mt-1 text-sm text-blue-500">{selectedNotification.action_link}</div>
                  </div>
                )}

                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge variant={selectedNotification.is_read ? 'outline' : 'default'}>
                      {selectedNotification.is_read ? 'Read' : 'Unread'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>Created At</Label>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {formatDate(selectedNotification.created_at)}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              {selectedNotification && !selectedNotification.is_read && (
                <Button
                  onClick={() => {
                    handleMarkAsRead(selectedNotification.id);
                    setSelectedNotification(null);
                  }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Read
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedNotification) {
                    setNotificationToDelete(selectedNotification.id);
                    setSelectedNotification(null);
                    setDeleteDialogOpen(true);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Notification Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Notification</DialogTitle>
              <DialogDescription>
                Create a system-wide notification for all admins
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter notification title"
                />
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Enter notification message"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="action_link">Action Link (Optional)</Label>
                <Input
                  id="action_link"
                  value={formData.action_link}
                  onChange={(e) => setFormData({ ...formData, action_link: e.target.value })}
                  placeholder="/admin/orders"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateNotification}>
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Notification</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this notification? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNotificationToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => notificationToDelete && handleDelete(notificationToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
