'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Heart, 
  PawPrint, 
  Star, 
  Globe, 
  Leaf, 
  Shield, 
  Award, 
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';

// Define TypeScript interfaces
interface AboutPageSection {
  id: string;
  section_key: 'hero' | 'mission' | 'values' | 'team' | 'milestones' | 'testimonials' | 'cta';
  title?: string;
  subtitle?: string;
  content?: string;
  is_active: boolean;
  sort_order: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface AboutValue {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AboutTeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  social_links?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export default function AboutPageManagement() {
  // State for sections
  const [sections, setSections] = useState<AboutPageSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  
  // State for values
  const [values, setValues] = useState<AboutValue[]>([]);
  const [loadingValues, setLoadingValues] = useState(true);
  
  // State for team members
  const [teamMembers, setTeamMembers] = useState<AboutTeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  
  // Dialog states
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  
  const [editingSection, setEditingSection] = useState<AboutPageSection | null>(null);
  const [editingValue, setEditingValue] = useState<AboutValue | null>(null);
  const [editingTeamMember, setEditingTeamMember] = useState<AboutTeamMember | null>(null);
  
  const supabase = createClient();

  // Fetch sections data
  const fetchSections = async () => {
    setLoadingSections(true);
    try {
      const { data, error } = await supabase
        .from('about_page_sections')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching sections:', error);
      } else {
        setSections(data || []);
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
    } finally {
      setLoadingSections(false);
    }
  };

  // Fetch values data
  const fetchValues = async () => {
    setLoadingValues(true);
    try {
      const { data, error } = await supabase
        .from('about_values')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching values:', error);
      } else {
        setValues(data || []);
      }
    } catch (err) {
      console.error('Error fetching values:', err);
    } finally {
      setLoadingValues(false);
    }
  };

  // Fetch team members data
  const fetchTeamMembers = async () => {
    setLoadingTeam(true);
    try {
      const { data, error } = await supabase
        .from('about_team_members')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching team members:', error);
      } else {
        setTeamMembers(data || []);
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
    } finally {
      setLoadingTeam(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchSections();
    fetchValues();
    fetchTeamMembers();
  }, []);

  // Handle saving a section
  const saveSection = async () => {
    if (!editingSection) return;

    try {
      if (editingSection.id) {
        // Update existing section
        const { error } = await supabase
          .from('about_page_sections')
          .update({
            title: editingSection.title,
            subtitle: editingSection.subtitle,
            content: editingSection.content,
            is_active: editingSection.is_active,
            sort_order: editingSection.sort_order,
            settings: editingSection.settings
          })
          .eq('id', editingSection.id);

        if (error) throw error;
      } else {
        // Create new section
        const { error } = await supabase
          .from('about_page_sections')
          .insert([{
            section_key: editingSection.section_key,
            title: editingSection.title,
            subtitle: editingSection.subtitle,
            content: editingSection.content,
            is_active: editingSection.is_active,
            sort_order: editingSection.sort_order,
            settings: editingSection.settings
          }]);

        if (error) throw error;
      }

      // Refresh data
      fetchSections();
      setSectionDialogOpen(false);
      setEditingSection(null);
    } catch (err) {
      console.error('Error saving section:', err);
    }
  };

  // Handle saving a value
  const saveValue = async () => {
    if (!editingValue) return;

    try {
      if (editingValue.id) {
        // Update existing value
        const { error } = await supabase
          .from('about_values')
          .update({
            title: editingValue.title,
            description: editingValue.description,
            icon: editingValue.icon,
            sort_order: editingValue.sort_order,
            is_active: editingValue.is_active
          })
          .eq('id', editingValue.id);

        if (error) throw error;
      } else {
        // Create new value
        const { error } = await supabase
          .from('about_values')
          .insert([{
            title: editingValue.title,
            description: editingValue.description,
            icon: editingValue.icon,
            sort_order: editingValue.sort_order,
            is_active: editingValue.is_active
          }]);

        if (error) throw error;
      }

      // Refresh data
      fetchValues();
      setValueDialogOpen(false);
      setEditingValue(null);
    } catch (err) {
      console.error('Error saving value:', err);
    }
  };

  // Handle saving a team member
  const saveTeamMember = async () => {
    if (!editingTeamMember) return;

    try {
      if (editingTeamMember.id) {
        // Update existing team member
        const { error } = await supabase
          .from('about_team_members')
          .update({
            name: editingTeamMember.name,
            role: editingTeamMember.role,
            bio: editingTeamMember.bio,
            image_url: editingTeamMember.image_url,
            sort_order: editingTeamMember.sort_order,
            is_active: editingTeamMember.is_active,
            social_links: editingTeamMember.social_links
          })
          .eq('id', editingTeamMember.id);

        if (error) throw error;
      } else {
        // Create new team member
        const { error } = await supabase
          .from('about_team_members')
          .insert([{
            name: editingTeamMember.name,
            role: editingTeamMember.role,
            bio: editingTeamMember.bio,
            image_url: editingTeamMember.image_url,
            sort_order: editingTeamMember.sort_order,
            is_active: editingTeamMember.is_active,
            social_links: editingTeamMember.social_links
          }]);

        if (error) throw error;
      }

      // Refresh data
      fetchTeamMembers();
      setTeamDialogOpen(false);
      setEditingTeamMember(null);
    } catch (err) {
      console.error('Error saving team member:', err);
    }
  };

  // Handle delete section
  const deleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const { error } = await supabase
        .from('about_page_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchSections();
    } catch (err) {
      console.error('Error deleting section:', err);
    }
  };

  // Handle delete value
  const deleteValue = async (id: string) => {
    if (!confirm('Are you sure you want to delete this value?')) return;

    try {
      const { error } = await supabase
        .from('about_values')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchValues();
    } catch (err) {
      console.error('Error deleting value:', err);
    }
  };

  // Handle delete team member
  const deleteTeamMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      const { error } = await supabase
        .from('about_team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchTeamMembers();
    } catch (err) {
      console.error('Error deleting team member:', err);
    }
  };

  // Section icons mapping
  const getSectionIcon = (key: string) => {
    switch(key) {
      case 'hero': return <PawPrint className="h-5 w-5" />;
      case 'mission': return <Target className="h-5 w-5" />;
      case 'values': return <Heart className="h-5 w-5" />;
      case 'team': return <Users className="h-5 w-5" />;
      case 'milestones': return <Award className="h-5 w-5" />;
      case 'testimonials': return <Star className="h-5 w-5" />;
      case 'cta': return <Gift className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  // Value icons mapping
  const getValueIcon = (iconName: string) => {
    switch(iconName) {
      case 'paw': return <PawPrint className="h-6 w-6" />;
      case 'heart': return <Heart className="h-6 w-6" />;
      case 'star': return <Star className="h-6 w-6" />;
      case 'globe': return <Globe className="h-6 w-6" />;
      case 'leaf': return <Leaf className="h-6 w-6" />;
      case 'shield': return <Shield className="h-6 w-6" />;
      case 'award': return <Award className="h-6 w-6" />;
      case 'briefcase': return <Briefcase className="h-6 w-6" />;
      default: return <Star className="h-6 w-6" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-teal-900">About Us Page Management</h1>
          <p className="text-teal-600 mt-1">Manage content and sections for the About Us page</p>
        </div>
      </div>

      {/* Sections Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Page Sections</CardTitle>
            <p className="text-sm text-teal-600">Manage visibility and content of page sections</p>
          </div>
          <Button onClick={() => {
            setEditingSection({
              id: '',
              section_key: 'mission',
              title: '',
              subtitle: '',
              content: '',
              is_active: true,
              sort_order: 0,
              settings: {},
              created_at: '',
              updated_at: ''
            });
            setSectionDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </CardHeader>
        <CardContent>
          {loadingSections ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 bg-teal-500"></div>
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center py-8">
              <PawPrint className="h-12 w-12 text-teal-200 mx-auto mb-3" />
              <p className="text-teal-600">No sections configured</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setEditingSection({
                    id: '',
                    section_key: 'mission',
                    title: '',
                    subtitle: '',
                    content: '',
                    is_active: true,
                    sort_order: 0,
                    settings: {},
                    created_at: '',
                    updated_at: ''
                  });
                  setSectionDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Section
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sections.map((section) => (
                <Card key={section.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
                          {getSectionIcon(section.section_key)}
                        </div>
                        <div>
                          <h3 className="font-bold text-teal-900 capitalize">{section.section_key.replace('_', ' ')}</h3>
                          <p className="text-sm text-teal-600 truncate max-w-xs">{section.title || section.content?.substring(0, 50) + '...' || 'No content'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={section.is_active}
                          onCheckedChange={(checked) => {
                            const updatedSection = { ...section, is_active: checked };
                            setSections(prev => 
                              prev.map(s => s.id === section.id ? updatedSection : s)
                            );
                            
                            // Update in database
                            supabase
                              .from('about_page_sections')
                              .update({ is_active: checked })
                              .eq('id', section.id);
                          }}
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingSection(section);
                            setSectionDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => deleteSection(section.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Values Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Company Values</CardTitle>
            <p className="text-sm text-teal-600">Manage your company's core values displayed on the About page</p>
          </div>
          <Button onClick={() => {
            setEditingValue({
              id: '',
              title: '',
              description: '',
              icon: 'heart',
              sort_order: 0,
              is_active: true,
              created_at: '',
              updated_at: ''
            });
            setValueDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Value
          </Button>
        </CardHeader>
        <CardContent>
          {loadingValues ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 bg-teal-500"></div>
            </div>
          ) : values.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-teal-200 mx-auto mb-3" />
              <p className="text-teal-600">No values configured</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setEditingValue({
                    id: '',
                    title: '',
                    description: '',
                    icon: 'heart',
                    sort_order: 0,
                    is_active: true,
                    created_at: '',
                    updated_at: ''
                  });
                  setValueDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Value
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {values.map((value) => (
                <Card key={value.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
                          {getValueIcon(value.icon)}
                        </div>
                        <div>
                          <h3 className="font-bold text-teal-900">{value.title}</h3>
                          <p className="text-sm text-teal-600 truncate max-w-xs">{value.description.substring(0, 50) + '...'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={value.is_active}
                          onCheckedChange={(checked) => {
                            const updatedValue = { ...value, is_active: checked };
                            setValues(prev => 
                              prev.map(v => v.id === value.id ? updatedValue : v)
                            );
                            
                            // Update in database
                            supabase
                              .from('about_values')
                              .update({ is_active: checked })
                              .eq('id', value.id);
                          }}
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingValue(value);
                            setValueDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => deleteValue(value.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <p className="text-sm text-teal-600">Manage team members displayed on the About page</p>
          </div>
          <Button onClick={() => {
            setEditingTeamMember({
              id: '',
              name: '',
              role: '',
              bio: '',
              image_url: '',
              sort_order: 0,
              is_active: true,
              social_links: {},
              created_at: '',
              updated_at: ''
            });
            setTeamDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent>
          {loadingTeam ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 bg-teal-500"></div>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-teal-200 mx-auto mb-3" />
              <p className="text-teal-600">No team members configured</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setEditingTeamMember({
                    id: '',
                    name: '',
                    role: '',
                    bio: '',
                    image_url: '',
                    sort_order: 0,
                    is_active: true,
                    social_links: {},
                    created_at: '',
                    updated_at: ''
                  });
                  setTeamDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <Card key={member.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-300 to-accent-300 flex items-center justify-center text-white font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-teal-900">{member.name}</h3>
                          <p className="text-sm text-teal-600">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={member.is_active}
                          onCheckedChange={(checked) => {
                            const updatedMember = { ...member, is_active: checked };
                            setTeamMembers(prev => 
                              prev.map(m => m.id === member.id ? updatedMember : m)
                            );
                            
                            // Update in database
                            supabase
                              .from('about_team_members')
                              .update({ is_active: checked })
                              .eq('id', member.id);
                          }}
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingTeamMember(member);
                            setTeamDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => deleteTeamMember(member.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Edit Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSection?.id ? 'Edit' : 'Add'} Section</DialogTitle>
            <DialogDescription>
              {editingSection?.id 
                ? `Update settings for the ${editingSection.section_key} section` 
                : 'Add a new section to the About Us page'}
            </DialogDescription>
          </DialogHeader>
          
          {editingSection && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="sectionKey">Section Type</Label>
                <Select 
                  value={editingSection.section_key} 
                  onValueChange={(value) => setEditingSection({...editingSection, section_key: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero</SelectItem>
                    <SelectItem value="mission">Mission</SelectItem>
                    <SelectItem value="values">Values</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="milestones">Milestones</SelectItem>
                    <SelectItem value="testimonials">Testimonials</SelectItem>
                    <SelectItem value="cta">Call to Action</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sectionTitle">Title</Label>
                <Input
                  id="sectionTitle"
                  value={editingSection.title || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  placeholder="Section title"
                />
              </div>
              
              <div>
                <Label htmlFor="sectionSubtitle">Subtitle</Label>
                <Input
                  id="sectionSubtitle"
                  value={editingSection.subtitle || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })}
                  placeholder="Section subtitle"
                />
              </div>
              
              <div>
                <Label htmlFor="sectionContent">Content</Label>
                <Textarea
                  id="sectionContent"
                  value={editingSection.content || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                  placeholder="Section content"
                  rows={4}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sectionActive">Active</Label>
                <Switch
                  id="sectionActive"
                  checked={editingSection.is_active}
                  onCheckedChange={(checked) => setEditingSection({ ...editingSection, is_active: checked })}
                />
              </div>
              
              <div>
                <Label htmlFor="sectionOrder">Display Order</Label>
                <Input
                  id="sectionOrder"
                  type="number"
                  value={editingSection.sort_order}
                  onChange={(e) => setEditingSection({ ...editingSection, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setSectionDialogOpen(false);
              setEditingSection(null);
            }}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={saveSection}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Value Edit Dialog */}
      <Dialog open={valueDialogOpen} onOpenChange={setValueDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingValue?.id ? 'Edit' : 'Add'} Value</DialogTitle>
            <DialogDescription>
              {editingValue?.id 
                ? `Update settings for the ${editingValue.title} value` 
                : 'Add a new company value to display'}
            </DialogDescription>
          </DialogHeader>
          
          {editingValue && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="valueTitle">Title</Label>
                <Input
                  id="valueTitle"
                  value={editingValue.title}
                  onChange={(e) => setEditingValue({ ...editingValue, title: e.target.value })}
                  placeholder="Value title (e.g. Quality First)"
                />
              </div>
              
              <div>
                <Label htmlFor="valueDescription">Description</Label>
                <Textarea
                  id="valueDescription"
                  value={editingValue.description}
                  onChange={(e) => setEditingValue({ ...editingValue, description: e.target.value })}
                  placeholder="Value description"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="valueIcon">Icon</Label>
                <Select 
                  value={editingValue.icon} 
                  onValueChange={(value) => setEditingValue({...editingValue, icon: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paw">Paw Print</SelectItem>
                    <SelectItem value="heart">Heart</SelectItem>
                    <SelectItem value="star">Star</SelectItem>
                    <SelectItem value="globe">Globe</SelectItem>
                    <SelectItem value="leaf">Leaf</SelectItem>
                    <SelectItem value="shield">Shield</SelectItem>
                    <SelectItem value="award">Award</SelectItem>
                    <SelectItem value="briefcase">Briefcase</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="valueActive">Active</Label>
                <Switch
                  id="valueActive"
                  checked={editingValue.is_active}
                  onCheckedChange={(checked) => setEditingValue({ ...editingValue, is_active: checked })}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setValueDialogOpen(false);
              setEditingValue(null);
            }}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={saveValue}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Member Edit Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTeamMember?.id ? 'Edit' : 'Add'} Team Member</DialogTitle>
            <DialogDescription>
              {editingTeamMember?.id 
                ? `Update information for ${editingTeamMember.name}` 
                : 'Add a new team member to display'}
            </DialogDescription>
          </DialogHeader>
          
          {editingTeamMember && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="memberName">Name</Label>
                <Input
                  id="memberName"
                  value={editingTeamMember.name}
                  onChange={(e) => setEditingTeamMember({ ...editingTeamMember, name: e.target.value })}
                  placeholder="Team member name"
                />
              </div>
              
              <div>
                <Label htmlFor="memberRole">Role</Label>
                <Input
                  id="memberRole"
                  value={editingTeamMember.role}
                  onChange={(e) => setEditingTeamMember({ ...editingTeamMember, role: e.target.value })}
                  placeholder="Team member role"
                />
              </div>
              
              <div>
                <Label htmlFor="memberBio">Bio</Label>
                <Textarea
                  id="memberBio"
                  value={editingTeamMember.bio}
                  onChange={(e) => setEditingTeamMember({ ...editingTeamMember, bio: e.target.value })}
                  placeholder="Team member bio"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="memberImageUrl">Image URL</Label>
                <Input
                  id="memberImageUrl"
                  value={editingTeamMember.image_url || ''}
                  onChange={(e) => setEditingTeamMember({ ...editingTeamMember, image_url: e.target.value })}
                  placeholder="URL to team member image"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="memberActive">Active</Label>
                <Switch
                  id="memberActive"
                  checked={editingTeamMember.is_active}
                  onCheckedChange={(checked) => setEditingTeamMember({ ...editingTeamMember, is_active: checked })}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setTeamDialogOpen(false);
              setEditingTeamMember(null);
            }}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={saveTeamMember}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}