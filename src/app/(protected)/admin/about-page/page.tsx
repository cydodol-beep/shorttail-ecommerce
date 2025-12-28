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
  RotateCcw,
  Target,
  Package,
  Truck,
  Calendar,
  Sparkles,
  Mountain,
  Plane,
  Building,
  Volume2,
  VolumeX,
  Play,
  Gift,
  Upload as UploadIcon,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
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
  image_url?: string;
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

interface Milestone {
  id: string;
  year: number;
  title: string;
  description: string;
  icon: string;
  is_featured?: boolean;
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

  // State for milestones
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  
  // Dialog states
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);

  const [editingSection, setEditingSection] = useState<AboutPageSection | null>(null);
  const [editingValue, setEditingValue] = useState<AboutValue | null>(null);
  const [editingTeamMember, setEditingTeamMember] = useState<AboutTeamMember | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  
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

  // Fetch milestones data
  const fetchMilestones = async () => {
    setLoadingMilestones(true);
    try {
      const { data, error } = await supabase
        .from('about_milestones')
        .select('*')
        .order('year', { ascending: false });

      if (error) {
        console.error('Error fetching milestones:', error);
      } else {
        setMilestones(data || []);
      }
    } catch (err) {
      console.error('Error fetching milestones:', err);
    } finally {
      setLoadingMilestones(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchSections();
    fetchValues();
    fetchTeamMembers();
    fetchMilestones();
  }, []);

  // Handle saving a milestone
  const saveMilestone = async () => {
    if (!editingMilestone) return;

    try {
      if (editingMilestone.id) {
        // Update existing milestone
        const { error } = await supabase
          .from('about_milestones')
          .update({
            year: editingMilestone.year,
            title: editingMilestone.title,
            description: editingMilestone.description,
            icon: editingMilestone.icon,
            is_featured: editingMilestone.is_featured
          })
          .eq('id', editingMilestone.id);

        if (error) throw error;
      } else {
        // Create new milestone
        const { error } = await supabase
          .from('about_milestones')
          .insert([{
            year: editingMilestone.year,
            title: editingMilestone.title,
            description: editingMilestone.description,
            icon: editingMilestone.icon,
            is_featured: editingMilestone.is_featured
          }]);

        if (error) throw error;
      }

      // Refresh data
      fetchMilestones();
      setMilestoneDialogOpen(false);
      setEditingMilestone(null);
    } catch (err) {
      console.error('Error saving milestone:', err);
    }
  };

  // Handle delete milestone
  const deleteMilestone = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;

    try {
      const { error } = await supabase
        .from('about_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh data
      fetchMilestones();
    } catch (err) {
      console.error('Error deleting milestone:', err);
    }
  };

  // Get icon component based on name
  const getIconComponent = (iconName: string) => {
    const iconProps = { className: "w-6 h-6" };

    switch (iconName?.toLowerCase()) {
      case 'pawprint':
      case 'paw':
        return <PawPrint {...iconProps} />;
      case 'heart':
        return <Heart {...iconProps} />;
      case 'users':
      case 'team':
        return <Users {...iconProps} />;
      case 'globe':
        return <Globe {...iconProps} />;
      case 'leaf':
      case 'eco':
      case 'environment':
        return <Leaf {...iconProps} />;
      case 'shield':
      case 'secure':
      case 'security':
        return <Shield {...iconProps} />;
      case 'award':
      case 'achievement':
      case 'medal':
        return <Award {...iconProps} />;
      case 'briefcase':
      case 'business':
      case 'work':
        return <Briefcase {...iconProps} />;
      case 'calendar':
      case 'date':
        return <Calendar {...iconProps} />;
      case 'target':
      case 'goal':
        return <Target {...iconProps} />;
      case 'sparkles':
      case 'stars':
        return <Sparkles {...iconProps} />;
      case 'mountain':
      case 'peak':
        return <Mountain {...iconProps} />;
      case 'plane':
      case 'airplane':
      case 'travel':
        return <Plane {...iconProps} />;
      case 'building':
      case 'office':
        return <Building {...iconProps} />;
      case 'gift':
        return <Gift {...iconProps} />;
      case 'play':
        return <Play {...iconProps} />;
      case 'volume2':
      case 'volume':
        return <Volume2 {...iconProps} />;
      case 'x':
      case 'close':
        return <X {...iconProps} />;
      case 'rotateccw':
      case 'refresh':
        return <RotateCcw {...iconProps} />;
      default:
        return <Star {...iconProps} />;
    }
  };

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
            image_url: editingSection.image_url,
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
            image_url: editingSection.image_url,
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

      {/* Milestone Section */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Milestones</CardTitle>
            <CardDescription>Manage company achievements and timeline</CardDescription>
          </div>
          <Button onClick={() => {
            setEditingMilestone({
              id: '',
              year: new Date().getFullYear(),
              title: '',
              description: '',
              icon: 'award',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            setMilestoneDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </CardHeader>
        <CardContent>
          {loadingMilestones ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mx-auto"></div>
            </div>
          ) : milestones.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-teal/30 mx-auto mb-3" />
              <p className="text-teal/60">No milestones added yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {milestones.map((milestone) => (
                <Card key={milestone.id} className="group hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                          {getIconComponent(milestone.icon)}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-teal">{milestone.year}</p>
                          <p className="text-sm text-accent">{milestone.title}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMilestone(milestone);
                            setMilestoneDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteMilestone(milestone.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-teal/70">{milestone.description}</p>
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

              {/* Image Upload for Section */}
              <div>
                <ImageUpload
                  value={editingSection.image_url || ''}
                  onChange={(imageData) =>
                    setEditingSection({ ...editingSection, image_url: imageData })
                  }
                  label="Section Image"
                  quality={0.8}
                  maxWidth={1920}
                  maxHeight={1080}
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
                <ImageUpload
                  value={editingTeamMember.image_url || ''}
                  onChange={(imageData) =>
                    setEditingTeamMember({ ...editingTeamMember, image_url: imageData })
                  }
                  label="Team Member Image"
                  quality={0.8}
                  maxWidth={400}
                  maxHeight={400}
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

      {/* Milestone Edit Dialog */}
      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMilestone?.id ? 'Edit' : 'Add'} Milestone</DialogTitle>
            <DialogDescription>
              {editingMilestone?.id
                ? `Update information for "${editingMilestone.title}"`
                : 'Add a new company milestone or achievement'}
            </DialogDescription>
          </DialogHeader>

          {editingMilestone && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="milestoneYear">Year</Label>
                <Input
                  id="milestoneYear"
                  type="number"
                  min="2000"
                  max="2030"
                  value={editingMilestone.year}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  placeholder="Year (e.g. 2025)"
                />
              </div>

              <div>
                <Label htmlFor="milestoneTitle">Title</Label>
                <Input
                  id="milestoneTitle"
                  value={editingMilestone.title}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                  placeholder="Milestone title"
                />
              </div>

              <div>
                <Label htmlFor="milestoneDescription">Description</Label>
                <Textarea
                  id="milestoneDescription"
                  value={editingMilestone.description}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
                  placeholder="Milestone description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="milestoneIcon">Icon</Label>
                <Select
                  value={editingMilestone.icon}
                  onValueChange={(value) => setEditingMilestone({ ...editingMilestone, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="award">Award/Trophy</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="paw">Paw Print</SelectItem>
                    <SelectItem value="gift">Gift</SelectItem>
                    <SelectItem value="users">Users/Customers</SelectItem>
                    <SelectItem value="leaf">Leaf/Eco</SelectItem>
                    <SelectItem value="heart">Heart</SelectItem>
                    <SelectItem value="star">Star</SelectItem>
                    <SelectItem value="globe">Globe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="milestoneFeatured">Featured</Label>
                <Switch
                  id="milestoneFeatured"
                  checked={!!editingMilestone.is_featured}
                  onCheckedChange={(checked) => setEditingMilestone({ ...editingMilestone, is_featured: checked })}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMilestoneDialogOpen(false);
                setEditingMilestone(null);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={saveMilestone}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}