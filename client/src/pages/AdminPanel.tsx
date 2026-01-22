import React, { useState, useMemo } from "react";
import { ConfirmationDialog, useConfirmationDialog } from "@/components/ConfirmationDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Edit, Trash2, Shield, Lock, Unlock } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRecycle } from '@/contexts/RecycleContext';
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useColumnPreferences, ColumnConfig } from '@/hooks/useColumnPreferences';
import { ColumnSettings } from '@/components/ColumnSettings';
import { sortData } from '@/lib/utils';

const userFormSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function AdminPanel() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const confirmation = useConfirmationDialog();
  const { user } = useAuth(); // Get current user for tracking deletions

  // Column configuration for hide/show feature
  const adminColumns: ColumnConfig[] = useMemo(() => [
    { id: 'name', label: 'Name', canHide: false },
    { id: 'email', label: 'Email', defaultVisible: true },
    { id: 'role', label: 'Role', defaultVisible: true },
    { id: 'status', label: 'Status', defaultVisible: true },
    { id: 'lastLogin', label: 'Last Login', defaultVisible: true },
    { id: 'actions', label: 'Actions', canHide: false },
  ], []);

  const adminColumnPrefs = useColumnPreferences('admin_panel_table', adminColumns);

  const { data: usersData = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  const [users, setUsers] = useState<User[]>(usersData);
  const [sortKey, setSortKey] = useState<keyof User | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Keep local users in sync with query data
  React.useEffect(() => {
    setUsers(usersData);
  }, [usersData]);

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiRequest('POST', '/api/users', data);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'all' });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "User created",
        description: "New user has been successfully created",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating user",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      try {
        const response = await apiRequest('PUT', `/api/users/${id}`, updates);
        // Some APIs return 204 No Content. Try to parse JSON but fallback to updates
        try {
          const body = await response.json();
          return body;
        } catch (_) {
          return { id, ...updates } as any;
        }
      } catch (err: any) {
        // apiRequest attaches .body when available. Prefer server-provided message
        if (err?.body) {
          const body = err.body;
          // If the server returned structured errors (e.g. { message, errors }) surface the main message
          if (body?.message) throw new Error(body.message);
          // If server returned validation errors object, stringify a short summary
          if (body?.errors) throw new Error(JSON.stringify(body.errors));
          // Fallback to stringified body
          throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
        }
        throw err;
      }
    },
    onSuccess: async (updatedUser: User) => {
      // Ensure query cache is fresh and update local state
      await queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'all' });
      setUsers((prev) => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
      toast({
        title: "User updated",
        description: "User has been successfully updated",
      });
    },
    onError: (err: any) => {
      toast({ title: 'Update failed', description: err.message || 'Could not update user', variant: 'destructive' });
    }
  });

  // Separate mutation for role changes (optimistic)
  const roleChangeMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const response = await apiRequest('PUT', `/api/users/${id}/role`, { role });
      return response.json();
    },
    onMutate: async ({ id, role }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/users'] });
      const previous = users;
      setUsers((prev) => prev.map(u => u.id === id ? { ...u, role } : u));
      return { previous };
    },
    onError: (err: any, _vars, context: any) => {
      // rollback
      if (context?.previous) setUsers(context.previous);
      toast({ title: 'Role change failed', description: err.message || 'Could not change role', variant: 'destructive' });
    },
    onSuccess: async (updatedUser: User) => {
      // ensure the returned user from server replaces local copy
      setUsers((prev) => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
      await queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'all' });
      toast({ title: 'Role updated', description: `Role updated to ${updatedUser.role}` });
    },
    onSettled: async () => {
      // keep cache consistent
      await queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'all' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      // Send deletedBy as query parameter since DELETE requests may not support body
      const deletedBy = user?.id || '';
      const url = deletedBy ? `/api/users/${id}?deletedBy=${encodeURIComponent(deletedBy)}` : `/api/users/${id}`;
      const response = await apiRequest('DELETE', url);
      return { id };
    },
    onSuccess: async ({ id }) => {
      setUsers((prev) => prev.filter(u => u.id !== id));
      await queryClient.invalidateQueries({ queryKey: ['/api/users'], refetchType: 'all' });
      toast({ title: 'User deleted', description: 'User has been removed' });
      // Notify recycle UI to refresh (server snapshots deleted users)
      window.dispatchEvent(new Event('ll:recycle:update'));
    },
    onError: (err: any) => {
      toast({ title: 'Delete failed', description: err.message || 'Could not delete user', variant: 'destructive' });
    }
  });

  const { add } = useRecycle();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'sales',
      password: '',
      isActive: true,
    },
  });

  // Separate form for editing (no password validation enforced here)
  const editForm = useForm<UserFormData>({
    defaultValues: {
      name: '',
      email: '',
      role: 'sales',
      password: '',
      isActive: true,
    },
  });

  const onSubmit = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };

  // Handler for opening edit modal with selected user
  const [isEditOpen, setIsEditOpen] = useState(false);
  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    editForm.reset({ ...user, password: '' } as any);
    setIsEditOpen(true);
  };

  const handleSaveEdit = (values: UserFormData) => {
    if (!selectedUser) return;
    // Only allow name, role, password, isActive to be updated via this modal. Email is immutable here.
    const updates: Partial<User> = { name: values.name, role: values.role, isActive: values.isActive } as any;
    if (values.password && values.password.length > 0) updates.password = values.password as any;
    // Use mutateAsync so we only close the dialog when the server confirms the update
    (async () => {
      try {
        await updateUserMutation.mutateAsync({ id: selectedUser.id, updates });
        setIsEditOpen(false);
        setSelectedUser(null);
      } catch (err: any) {
        // If server returned a JSON validation object (like { errors: { email: ['...'] } }) attempt to set field errors
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && typeof parsed === 'object' && parsed.errors) {
            // parsed.errors is a map of field -> messages[]; set first message for each field
            for (const key of Object.keys(parsed.errors)) {
              const messages = parsed.errors[key];
              if (Array.isArray(messages) && messages.length > 0) {
                editForm.setError(key as any, { message: messages[0] });
              }
            }
            return;
          }
        } catch (_) {
          // not JSON, fall through to toast below
        }
        // error toast handled by mutation; keep modal open so user can retry
      }
    })();
  };

  const handleDeleteUser = (id: string) => {
    const userToDelete = users?.find(u => u.id === id);
    confirmation.confirmDelete({
      title: 'Delete User',
      description: `Are you sure you want to delete user "${userToDelete?.name || id}"? This action cannot be undone.`,
      onConfirm: () => {
        deleteUserMutation.mutate(id);
        confirmation.hideConfirmation();
      }
    });
  };

  const handleDeactivateUser = (user: User) => {
    updateUserMutation.mutate({
      id: user.id,
      updates: { isActive: !user.isActive },
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      manager: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      sales: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      operations: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      finance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      lab: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      bioinformatics: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      reporting: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      nutritionist: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    };
    return colors[role as keyof typeof colors] || colors.sales;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  };

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return "Never";
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage users, roles, and system settings
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="John Smith"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="john.smith@lab.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select onValueChange={(value) => form.setValue('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="lab">Lab Associate</SelectItem>
                    <SelectItem value="bioinformatics">Bioinformatics</SelectItem>
                    <SelectItem value="nutritionist">Nutritionist</SelectItem>
                    <SelectItem value="reporting">Reporting</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-red-600">{form.formState.errors.role.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Temporary Password *</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register('password')}
                  placeholder="Minimum 6 characters"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit(handleSaveEdit)} className="space-y-6">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" {...editForm.register('name')} />
                {editForm.formState.errors.name && <p className="text-sm text-red-600">{editForm.formState.errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...editForm.register('email')} disabled />
                <p className="text-xs text-gray-500">Email is fixed and cannot be changed here.</p>
                {editForm.formState.errors.email && <p className="text-sm text-red-600">{editForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select onValueChange={(value) => editForm.setValue('role', value)} value={editForm.watch('role')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="lab">Lab Associate</SelectItem>
                    <SelectItem value="bioinformatics">Bioinformatics</SelectItem>
                    <SelectItem value="nutritionist">Nutritionist</SelectItem>
                    <SelectItem value="reporting">Reporting</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                {editForm.formState.errors.role && <p className="text-sm text-red-600">{editForm.formState.errors.role.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>{updateUserMutation.isPending ? 'Saving...' : 'Save'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            User Management
          </CardTitle>
          <ColumnSettings
            columns={adminColumns}
            isColumnVisible={adminColumnPrefs.isColumnVisible}
            toggleColumn={adminColumnPrefs.toggleColumn}
            resetToDefaults={adminColumnPrefs.resetToDefaults}
            showAllColumns={adminColumnPrefs.showAllColumns}
            showCompactView={adminColumnPrefs.showCompactView}
            visibleCount={adminColumnPrefs.visibleCount}
            totalCount={adminColumnPrefs.totalCount}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {adminColumnPrefs.isColumnVisible('name') && <TableHead onClick={() => { setSortKey('name'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer py-1">Name{sortKey === 'name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {adminColumnPrefs.isColumnVisible('email') && <TableHead onClick={() => { setSortKey('email'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer py-1">Email{sortKey === 'email' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {adminColumnPrefs.isColumnVisible('role') && <TableHead onClick={() => { setSortKey('role'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer py-1">Role{sortKey === 'role' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {adminColumnPrefs.isColumnVisible('status') && <TableHead onClick={() => { setSortKey('isActive'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer py-1">Status{sortKey === 'isActive' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {adminColumnPrefs.isColumnVisible('lastLogin') && <TableHead onClick={() => { setSortKey('lastLogin'); setSortDir(s => s === 'asc' ? 'desc' : 'asc'); }} className="cursor-pointer py-1">Last Login{sortKey === 'lastLogin' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</TableHead>}
                    {adminColumnPrefs.isColumnVisible('actions') && <TableHead className="py-1">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortData(users, sortKey, sortDir).map((user) => (
                    <TableRow key={user.id}>
                      {adminColumnPrefs.isColumnVisible('name') && <TableCell className="py-1">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarFallback className="bg-primary-500 text-white text-sm">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>}
                      {adminColumnPrefs.isColumnVisible('email') && <TableCell className="text-gray-900 dark:text-white py-1">
                        {user.email}
                      </TableCell>}
                      {adminColumnPrefs.isColumnVisible('role') && <TableCell className="py-1">
                        <div className="flex items-center space-x-2">
                          <Select value={user.role} onValueChange={(val) => roleChangeMutation.mutate({ id: user.id, role: val })}>
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="operations">Operations</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="lab">Lab Associate</SelectItem>
                              <SelectItem value="bioinformatics">Bioinformatics</SelectItem>
                              <SelectItem value="nutritionist">Nutritionist</SelectItem>
                              <SelectItem value="reporting">Reporting</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                          </Select>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>}
                      {adminColumnPrefs.isColumnVisible('status') && <TableCell className="py-1">
                        <Badge className={getStatusBadge(!!user.isActive)}>
                          {user.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>}
                      {adminColumnPrefs.isColumnVisible('lastLogin') && <TableCell className="text-gray-900 dark:text-white py-1">
                        {formatLastLogin(user.lastLogin?.toString() || null)}
                      </TableCell>}
                      {adminColumnPrefs.isColumnVisible('actions') && <TableCell className="py-1">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-7 w-7 p-1" onClick={() => handleOpenEdit(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              const action = user.isActive ? 'lock' : 'unlock';
                              confirmation.showConfirmation({
                                type: user.isActive ? 'warning' : 'info',
                                title: `${user.isActive ? 'Lock' : 'Unlock'} User Login`,
                                description: `Are you sure you want to ${action} login for ${user.name}?`,
                                confirmText: user.isActive ? 'Lock' : 'Unlock',
                                onConfirm: () => {
                                  updateUserMutation.mutate({ id: user.id, updates: { isActive: !user.isActive } });
                                  confirmation.hideConfirmation();
                                }
                              });
                            }}
                            className={cn(
                              'flex items-center justify-center h-7 w-7 p-1',
                              user.isActive ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'
                            )}
                          >
                            {user.isActive ? (
                              <Unlock className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="destructive" size="sm" className="h-7 w-7 p-1" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {users.filter(u => u.isActive !== false).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        open={confirmation.open}
        onOpenChange={confirmation.onOpenChange}
        title={confirmation.title}
        description={confirmation.description}
        confirmText={confirmation.confirmText}
        onConfirm={confirmation.onConfirm}
        type={confirmation.type}
        isLoading={confirmation.isLoading}
      />
    </div >
  );
}
