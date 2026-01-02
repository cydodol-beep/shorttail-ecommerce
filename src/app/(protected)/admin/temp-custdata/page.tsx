'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Download, Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface TempCustData {
  id: string;
  user_name: string;
  user_phoneno: string;
  recipient_name: string;
  recipient_phoneno: string;
  recipient_address_line1: string;
  recipient_city: string;
  recipient_region: string;
  recipient_postal_code: string;
  created_at: string;
  updated_at: string;
}

export default function TempCustDataPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TempCustData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<TempCustData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<TempCustData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // Fetch all temp customer data
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('temp_custdata')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(data || []);
      setFilteredData(data || []);
    } catch (error) {
      console.error('Error fetching temp customer data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = data.filter(item => 
        item.user_name?.toLowerCase().includes(term) ||
        item.user_phoneno?.toLowerCase().includes(term) ||
        item.recipient_name?.toLowerCase().includes(term) ||
        item.recipient_phoneno?.toLowerCase().includes(term) ||
        item.recipient_city?.toLowerCase().includes(term) ||
        item.recipient_region?.toLowerCase().includes(term) ||
        item.recipient_postal_code?.toLowerCase().includes(term)
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [searchTerm, data]);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Handle form submission for create/update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentRecord) return;
    
    try {
      if (isEditing) {
        // Update existing record
        const { error } = await supabase
          .from('temp_custdata')
          .update({
            user_name: currentRecord.user_name,
            user_phoneno: currentRecord.user_phoneno,
            recipient_name: currentRecord.recipient_name,
            recipient_phoneno: currentRecord.recipient_phoneno,
            recipient_address_line1: currentRecord.recipient_address_line1,
            recipient_city: currentRecord.recipient_city,
            recipient_region: currentRecord.recipient_region,
            recipient_postal_code: currentRecord.recipient_postal_code,
          })
          .eq('id', currentRecord.id);

        if (error) throw error;
        toast.success('Record updated successfully');
      } else {
        // Create new record
        const { error } = await supabase
          .from('temp_custdata')
          .insert([{
            user_name: currentRecord.user_name,
            user_phoneno: currentRecord.user_phoneno,
            recipient_name: currentRecord.recipient_name,
            recipient_phoneno: currentRecord.recipient_phoneno,
            recipient_address_line1: currentRecord.recipient_address_line1,
            recipient_city: currentRecord.recipient_city,
            recipient_region: currentRecord.recipient_region,
            recipient_postal_code: currentRecord.recipient_postal_code,
          }]);

        if (error) throw error;
        toast.success('Record created successfully');
      }

      setIsDialogOpen(false);
      setCurrentRecord(null);
      setIsEditing(false);
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error(isEditing ? 'Failed to update record' : 'Failed to create record');
    }
  };

  // Handle record deletion
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const { error } = await supabase
        .from('temp_custdata')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Record deleted successfully');
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };

  // Handle edit record
  const handleEdit = (record: TempCustData) => {
    setCurrentRecord(record);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Handle add new record
  const handleAddNew = () => {
    setCurrentRecord({
      id: '',
      user_name: '',
      user_phoneno: '',
      recipient_name: '',
      recipient_phoneno: '',
      recipient_address_line1: '',
      recipient_city: '',
      recipient_region: '',
      recipient_postal_code: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  // Handle file selection for import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;

        // Send raw CSV content to API endpoint for processing
        const response = await fetch('/api/admin/import-temp-custdata', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/csv',
          },
          body: content,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to import data');
        }

        toast.success(result.message);
        fetchData(); // Refresh the list
      } catch (error) {
        console.error('Error importing data:', error);
        toast.error('Error importing data: ' + (error as Error).message);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  // Handle export to CSV
  const handleExport = async () => {
    try {
      // Fetch CSV data from API
      const response = await fetch('/api/admin/export-temp-custdata');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export data');
      }

      // Create a download link for the CSV
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `temp_custdata_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error exporting data: ' + (error as Error).message);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-900">Temporary Customer Data</h1>
        <p className="text-brown-600">Manage temporary customer data for import/export operations</p>
      </div>

      <Card className="border-brown-200">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Customer Data Management</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-brown-500 h-4 w-4" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full sm:w-64"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-brown-500 hover:text-brown-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleFileImport}
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()} 
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleExport} 
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>User Phone</TableHead>
                    <TableHead>Recipient Name</TableHead>
                    <TableHead>Recipient Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Postal Code</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.user_name || '-'}</TableCell>
                        <TableCell>{record.user_phoneno || '-'}</TableCell>
                        <TableCell>{record.recipient_name || '-'}</TableCell>
                        <TableCell>{record.recipient_phoneno || '-'}</TableCell>
                        <TableCell>{record.recipient_address_line1 || '-'}</TableCell>
                        <TableCell>{record.recipient_city || '-'}</TableCell>
                        <TableCell>{record.recipient_region || '-'}</TableCell>
                        <TableCell>{record.recipient_postal_code || '-'}</TableCell>
                        <TableCell>
                          {format(new Date(record.created_at), 'dd MMM yyyy', { locale: id })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(record)}
                              className="text-primary hover:text-primary/90"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(record.id)}
                              className="text-destructive hover:text-destructive/90"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-brown-500">
                        No records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Record' : 'Add New Record'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the customer information below.' 
                : 'Add a new customer record to the database.'}
            </DialogDescription>
          </DialogHeader>
          
          {currentRecord && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user_name">User Name</Label>
                  <Input
                    id="user_name"
                    value={currentRecord.user_name || ''}
                    onChange={(e) => 
                      setCurrentRecord({...currentRecord, user_name: e.target.value})
                    }
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="user_phoneno">User Phone No</Label>
                  <Input
                    id="user_phoneno"
                    value={currentRecord.user_phoneno || ''}
                    onChange={(e) => 
                      setCurrentRecord({...currentRecord, user_phoneno: e.target.value})
                    }
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="recipient_name">Recipient Name</Label>
                  <Input
                    id="recipient_name"
                    value={currentRecord.recipient_name || ''}
                    onChange={(e) => 
                      setCurrentRecord({...currentRecord, recipient_name: e.target.value})
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="recipient_phoneno">Recipient Phone No</Label>
                  <Input
                    id="recipient_phoneno"
                    value={currentRecord.recipient_phoneno || ''}
                    onChange={(e) => 
                      setCurrentRecord({...currentRecord, recipient_phoneno: e.target.value})
                    }
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="recipient_address_line1">Recipient Address</Label>
                  <Input
                    id="recipient_address_line1"
                    value={currentRecord.recipient_address_line1 || ''}
                    onChange={(e) => 
                      setCurrentRecord({...currentRecord, recipient_address_line1: e.target.value})
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="recipient_city">Recipient City</Label>
                  <Input
                    id="recipient_city"
                    value={currentRecord.recipient_city || ''}
                    onChange={(e) => 
                      setCurrentRecord({...currentRecord, recipient_city: e.target.value})
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="recipient_region">Recipient Region</Label>
                  <Input
                    id="recipient_region"
                    value={currentRecord.recipient_region || ''}
                    onChange={(e) => 
                      setCurrentRecord({...currentRecord, recipient_region: e.target.value})
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="recipient_postal_code">Recipient Postal Code</Label>
                  <Input
                    id="recipient_postal_code"
                    value={currentRecord.recipient_postal_code || ''}
                    onChange={(e) => 
                      setCurrentRecord({...currentRecord, recipient_postal_code: e.target.value})
                    }
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? 'Update Record' : 'Create Record'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}