'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search,
  Filter,
  Eye,
  Loader2,
  Shield,
  ShoppingBag,
  Award,
  UserCog,
  Mail,
  Phone,
  Calendar,
  Plus,
  Pencil,
  Save,
  CheckCircle,
  Clock,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useUsers, updateUserRole, createUser, updateUser, approveUser, deleteUser, type UserProfile } from '@/hooks/use-users';
import { createClient } from '@/lib/supabase/client';

const ROLE_CONFIG = {
  master_admin: { label: 'Master Admin', color: 'bg-red-100 text-red-800', icon: Shield },
  normal_admin: { label: 'Admin', color: 'bg-orange-100 text-orange-800', icon: UserCog },
  kasir: { label: 'Kasir', color: 'bg-blue-100 text-blue-800', icon: ShoppingBag },
  normal_user: { label: 'User', color: 'bg-green-100 text-green-800', icon: Users },
};

const TIER_CONFIG = {
  Newborn: { label: 'Newborn', color: 'bg-gray-100 text-gray-800' },
  Transitional: { label: 'Transitional', color: 'bg-blue-100 text-blue-800' },
  Juvenile: { label: 'Juvenile', color: 'bg-purple-100 text-purple-800' },
  Adolescence: { label: 'Adolescence', color: 'bg-pink-100 text-pink-800' },
  Adulthood: { label: 'Adulthood', color: 'bg-yellow-100 text-yellow-800' },
};

export default function AdminUsersPage() {
  useAuth();
  const { users, loading, refresh } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    user_phoneno: '',
    password: '',
    role: 'normal_user',
    tier: 'Newborn',
    points_balance: 0,
    address_line1: '',
    city: '',
    province_id: '', // stores province_id
    postal_code: '',
    recipient_name: '',
    recipient_phoneno: '',
    recipient_address_line1: '',
    recipient_city: '',
    recipient_province_id: '', // stores recipient_province_id
    recipient_postal_code: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [sameAsUser, setSameAsUser] = useState(false);

  // Provinces
  const [provinces, setProvinces] = useState<Array<{ id: number; province_name: string }>>([]);

  // Fetch provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('provinces')
        .select('id, province_name')
        .eq('is_active', true)
        .order('province_name');
      
      if (data) {
        setProvinces(data);
      }
    };
    fetchProvinces();
  }, []);

  // Filter users
  const filteredUsers = users.filter((user: UserProfile) => {
    const matchesSearch = 
      user.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_phoneno?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(true);
    try {
      const success = await updateUserRole(userId, newRole);
      if (success) {
        toast.success('User role updated');
        refresh();
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, role: newRole });
        }
      } else {
        toast.error('Failed to update user role');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Failed to update user role');
    } finally {
      setUpdating(false);
    }
  };

  // Handle user approval
  const handleApproveUser = async (userId: string) => {
    setApproving(userId);
    try {
      const success = await approveUser(userId);
      if (success) {
        toast.success('User approved successfully');
        refresh();
      } else {
        toast.error('Failed to approve user');
      }
    } catch (err) {
      console.error('Error approving user:', err);
      toast.error('Failed to approve user');
    } finally {
      setApproving(null);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setDeleting(userToDelete.id);
    try {
      const success = await deleteUser(userToDelete.id);
      if (success) {
        toast.success('User deleted successfully');
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
        refresh();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Open add user dialog
  const handleAddUser = () => {
    setIsEditing(false);
    setFormData({
      user_name: '',
      user_email: '',
      user_phoneno: '',
      password: '',
      role: 'normal_user',
      tier: 'Newborn',
      points_balance: 0,
      address_line1: '',
      city: '',
      province_id: '',
      postal_code: '',
      recipient_name: '',
      recipient_phoneno: '',
      recipient_address_line1: '',
      recipient_city: '',
      recipient_province_id: '',
      recipient_postal_code: '',
    });
    setShowPassword(false);
    setSameAsUser(false);
    setEditOpen(true);
  };

  // Open edit user dialog
  const handleEditUser = (user: UserProfile) => {
    setIsEditing(true);
    setSelectedUser(user);
    setFormData({
      user_name: user.user_name || '',
      user_email: user.user_email || '',
      user_phoneno: user.user_phoneno || '',
      password: '',
      role: user.role,
      tier: user.tier,
      points_balance: user.points_balance || 0,
      address_line1: user.address_line1 || '',
      city: user.city || '',
      province_id: user.province_id ? user.province_id.toString() : '',
      postal_code: user.postal_code || '',
      recipient_name: user.recipient_name || '',
      recipient_phoneno: user.recipient_phoneno || '',
      recipient_address_line1: user.recipient_address_line1 || '',
      recipient_city: user.recipient_city || '',
      recipient_province_id: user.recipient_province_id ? user.recipient_province_id.toString() : '',
      recipient_postal_code: user.recipient_postal_code || '',
    });
    setShowPassword(false);
    
    // Check if recipient data matches user data
    const isSame = user.recipient_name === user.user_name &&
                   user.recipient_phoneno === user.user_phoneno &&
                   user.recipient_address_line1 === user.address_line1 &&
                   user.recipient_city === user.city &&
                   user.recipient_province_id === user.province_id &&
                   user.recipient_postal_code === user.postal_code;
    setSameAsUser(isSame);
    
    setEditOpen(true);
  };

  // Handle toggle for same as user data
  const handleSameAsUserToggle = (checked: boolean) => {
    setSameAsUser(checked);
    if (checked) {
      // Copy user data to recipient fields
      setFormData({
        ...formData,
        recipient_name: formData.user_name,
        recipient_phoneno: formData.user_phoneno,
        recipient_address_line1: formData.address_line1,
        recipient_city: formData.city,
        recipient_province_id: formData.province_id,
        recipient_postal_code: formData.postal_code,
      });
    }
  };

  // Save user (create or update)
  const handleSaveUser = async () => {
    // Validation
    if (!formData.user_phoneno) {
      toast.error('Phone number is required');
      return;
    }
    
    if (!isEditing && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }
    
    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      let success = false;

      if (isEditing && selectedUser) {
        // Update existing user
        success = await updateUser(selectedUser.id, formData);
        if (success) {
          toast.success('User updated successfully');
        }
      } else {
        // Create new user
        const newUser = await createUser(formData);
        if (newUser) {
          toast.success('User created successfully');
          success = true;
        }
      }

      if (success) {
        setEditOpen(false);
        refresh();
      } else {
        toast.error(isEditing ? 'Failed to update user' : 'Failed to create user');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      toast.error(isEditing ? 'Failed to update user' : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">User Management</h1>
          <p className="text-brown-600 mt-1">Manage user accounts and roles</p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(ROLE_CONFIG).map(([role, config]) => {
          const count = users.filter((u: UserProfile) => u.role === role).length;
          const Icon = config.icon;
          return (
            <Card key={role}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-brown-900">{count}</p>
                    <p className="text-xs text-brown-600">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>View and manage all registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brown-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[200px]" suppressHydrationWarning>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="master_admin">Master Admin</SelectItem>
                <SelectItem value="normal_admin">Admin</SelectItem>
                <SelectItem value="kasir">Kasir</SelectItem>
                <SelectItem value="super_user">Super User</SelectItem>
                <SelectItem value="normal_user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-brown-300 mx-auto mb-3" />
              <p className="text-brown-600">No users found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: UserProfile) => {
                    const roleConfig = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG];
                    const tierConfig = TIER_CONFIG[user.tier as keyof typeof TIER_CONFIG];
                    const RoleIcon = roleConfig.icon;
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.user_avatar_url} />
                              <AvatarFallback className="bg-primary text-white">
                                {getInitials(user.user_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.user_name || 'Unnamed User'}</p>
                              <p className="text-xs text-brown-500 font-mono">
                                {user.id.split('-')[0]}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {user.user_email && (
                              <div className="flex items-center gap-1 text-xs text-brown-600">
                                <Mail className="h-3 w-3" />
                                {user.user_email}
                              </div>
                            )}
                            {user.user_phoneno && (
                              <div className="flex items-center gap-1 text-xs text-brown-600">
                                <Phone className="h-3 w-3" />
                                {user.user_phoneno}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleConfig.color}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {roleConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.is_approved ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={tierConfig.color}>
                            <Award className="h-3 w-3 mr-1" />
                            {tierConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-primary">
                            {user.points_balance?.toLocaleString() || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-brown-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(user.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!user.is_approved && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApproveUser(user.id)}
                                disabled={approving === user.id}
                              >
                                {approving === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                                <span className="ml-1">Approve</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setDetailsOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setUserToDelete(user);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              User ID: {selectedUser?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedUser.user_avatar_url} />
                  <AvatarFallback className="bg-primary text-white text-2xl">
                    {getInitials(selectedUser.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.user_name || 'Unnamed User'}</h3>
                  <p className="text-sm text-brown-600">{selectedUser.user_email}</p>
                  <p className="text-sm text-brown-600">{selectedUser.user_phoneno}</p>
                </div>
              </div>

              {/* Account Details */}
              <div>
                <h3 className="font-semibold mb-2">Account Information</h3>
                <div className="bg-brown-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-brown-600">Role:</span>
                    <Badge className={ROLE_CONFIG[selectedUser.role as keyof typeof ROLE_CONFIG].color}>
                      {ROLE_CONFIG[selectedUser.role as keyof typeof ROLE_CONFIG].label}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brown-600">Membership Tier:</span>
                    <Badge className={TIER_CONFIG[selectedUser.tier as keyof typeof TIER_CONFIG].color}>
                      {TIER_CONFIG[selectedUser.tier as keyof typeof TIER_CONFIG].label}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brown-600">Points Balance:</span>
                    <span className="font-semibold text-primary">
                      {selectedUser.points_balance?.toLocaleString() || 0} pts
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brown-600">Referral Code:</span>
                    <code className="px-2 py-1 bg-brown-100 rounded text-xs font-mono">
                      {selectedUser.referral_code || 'N/A'}
                    </code>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {(selectedUser.address_line1 || selectedUser.city) && (
                <div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  <div className="bg-brown-50 p-4 rounded-lg text-sm space-y-1">
                    {selectedUser.address_line1 && <p>{selectedUser.address_line1}</p>}
                    {selectedUser.city && (
                      <p>
                        {selectedUser.city}
                        {selectedUser.region_state_province && `, ${selectedUser.region_state_province}`}
                        {selectedUser.postal_code && ` ${selectedUser.postal_code}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Role Management */}
              <div>
                <h3 className="font-semibold mb-2">Update Role</h3>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value) => handleRoleChange(selectedUser.id, value)}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal_user">User</SelectItem>
                    <SelectItem value="super_user">Super User</SelectItem>
                    <SelectItem value="kasir">Kasir</SelectItem>
                    <SelectItem value="normal_admin">Admin</SelectItem>
                    <SelectItem value="master_admin">Master Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-brown-500 mt-2">
                  ⚠️ Changing roles will affect user permissions immediately
                </p>
              </div>

              {/* Metadata */}
              <div className="text-xs text-brown-500 space-y-1">
                <p>Account Created: {formatDate(selectedUser.created_at)}</p>
                <p>Last Updated: {formatDate(selectedUser.updated_at)}</p>
                {selectedUser.referred_by && (
                  <p>Referred by User: {selectedUser.referred_by}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update user information' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user_name">Full Name *</Label>
                  <Input
                    id="user_name"
                    value={formData.user_name}
                    onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_phoneno">Phone Number *</Label>
                  <Input
                    id="user_phoneno"
                    value={formData.user_phoneno}
                    onChange={(e) => setFormData({ ...formData, user_phoneno: e.target.value })}
                    placeholder="+628123456789"
                    disabled={isEditing}
                  />
                  {isEditing && (
                    <p className="text-xs text-brown-500">Phone number cannot be changed</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_email">Email</Label>
                <Input
                  id="user_email"
                  type="email"
                  value={formData.user_email}
                  onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {isEditing ? '(Leave blank to keep unchanged)' : '*'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={isEditing ? 'Enter new password to change' : 'Minimum 6 characters'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </Button>
                </div>
                <p className="text-xs text-brown-500">
                  {isEditing 
                    ? 'Only enter a password if you want to change it'
                    : 'User will use this password to login (minimum 6 characters)'}
                </p>
              </div>
            </div>

            {/* Role & Tier */}
            <div className="space-y-4">
              <h3 className="font-semibold">Account Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal_user">User</SelectItem>
                      <SelectItem value="super_user">Super User</SelectItem>
                      <SelectItem value="kasir">Kasir</SelectItem>
                      <SelectItem value="normal_admin">Admin</SelectItem>
                      <SelectItem value="master_admin">Master Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tier">Membership Tier</Label>
                  <Select 
                    value={formData.tier} 
                    onValueChange={(value) => setFormData({ ...formData, tier: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Newborn">Newborn</SelectItem>
                      <SelectItem value="Transitional">Transitional</SelectItem>
                      <SelectItem value="Juvenile">Juvenile</SelectItem>
                      <SelectItem value="Adolescence">Adolescence</SelectItem>
                      <SelectItem value="Adulthood">Adulthood</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points_balance">Points Balance</Label>
                <Input
                  id="points_balance"
                  type="number"
                  value={formData.points_balance}
                  onChange={(e) => setFormData({ ...formData, points_balance: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-semibold">Address (Optional)</h3>
              
              <div className="space-y-2">
                <Label htmlFor="address_line1">Street Address</Label>
                <Input
                  id="address_line1"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  placeholder="Jl. Example No. 123"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Jakarta"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region_state_province">Province/State</Label>
                  <Select
                    value={formData.province_id}
                    onValueChange={(value) => setFormData({ ...formData, province_id: value })}
                  >
                    <SelectTrigger id="region_state_province">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id.toString()}>
                          {province.province_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="12345"
                />
              </div>
            </div>

            {/* Recipient Information for Shipping */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Recipient Information (For Shipping)</h3>
                <div className="flex items-center gap-2">
                  <Switch
                    id="same-as-user"
                    checked={sameAsUser}
                    onCheckedChange={handleSameAsUserToggle}
                  />
                  <Label htmlFor="same-as-user" className="text-sm cursor-pointer">
                    Same as user info
                  </Label>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient_name">Recipient Name</Label>
                  <Input
                    id="recipient_name"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    placeholder="Recipient full name"
                    disabled={sameAsUser}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient_phoneno">Recipient Phone</Label>
                  <Input
                    id="recipient_phoneno"
                    value={formData.recipient_phoneno}
                    onChange={(e) => setFormData({ ...formData, recipient_phoneno: e.target.value })}
                    placeholder="+628123456789"
                    disabled={sameAsUser}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient_address_line1">Recipient Street Address</Label>
                <Input
                  id="recipient_address_line1"
                  value={formData.recipient_address_line1}
                  onChange={(e) => setFormData({ ...formData, recipient_address_line1: e.target.value })}
                  placeholder="Jl. Delivery Address No. 456"
                  disabled={sameAsUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient_city">Recipient City</Label>
                  <Input
                    id="recipient_city"
                    value={formData.recipient_city}
                    onChange={(e) => setFormData({ ...formData, recipient_city: e.target.value })}
                    placeholder="Jakarta"
                    disabled={sameAsUser}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient_region">Recipient Province/State</Label>
                  <Select
                    value={formData.recipient_province_id}
                    onValueChange={(value) => setFormData({ ...formData, recipient_province_id: value })}
                    disabled={sameAsUser}
                  >
                    <SelectTrigger id="recipient_region">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id.toString()}>
                          {province.province_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient_postal_code">Recipient Postal Code</Label>
                <Input
                  id="recipient_postal_code"
                  value={formData.recipient_postal_code}
                  onChange={(e) => setFormData({ ...formData, recipient_postal_code: e.target.value })}
                  placeholder="12345"
                  disabled={sameAsUser}
                />
              </div>

              <p className="text-xs text-brown-500">
                💡 Toggle "Same as user info" to auto-fill recipient details with user's information. 
                This is useful when the user receives packages at their own address.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update User' : 'Create User'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {userToDelete && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <Avatar>
                <AvatarImage src={userToDelete.user_avatar_url} />
                <AvatarFallback className="bg-red-200 text-red-800">
                  {userToDelete.user_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{userToDelete.user_name || 'Unnamed User'}</p>
                <p className="text-sm text-brown-600">{userToDelete.user_email}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteConfirmOpen(false);
                setUserToDelete(null);
              }}
              disabled={deleting !== null}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={deleting !== null}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
