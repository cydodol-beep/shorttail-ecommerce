'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  Image as ImageIcon,
  Hash,
  Tag,
  UserRound,
  CalendarCheck,
  Quote,
  LayoutDashboard
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';

// Types for About Us page data
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

interface Value {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
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

interface Testimonial {
  id: string;
  customer_name: string;
  customer_role: string;
  testimonial_text: string;
  rating: number;
  customer_image_url?: string;
  is_verified: boolean;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
}

export default function AboutPageManagement() {
  const [sections, setSections] = useState<Record<string, AboutPageSection>>({});
  const [values, setValues] = useState<Value[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sections' | 'values' | 'team' | 'milestones' | 'testimonials'>('sections');
  const supabase = createClient();

  // Fetch sections data
  const fetchSections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('about_page_sections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching sections:', error);
      } else {
        const sectionsMap: Record<string, AboutPageSection> = {};
        (data || []).forEach((section: any) => {
          sectionsMap[section.section_key] = section;
        });
        setSections(sectionsMap);
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch values data
  const fetchValues = async () => {
    try {
      const { data, error } = await supabase
        .from('about_values')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching values:', error);
      } else {
        setValues(data || []);
      }
    } catch (err) {
      console.error('Error fetching values:', err);
    }
  };

  // Fetch team members data
  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('about_team_members')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching team members:', error);
      } else {
        setTeamMembers(data || []);
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };

  // Fetch milestones data
  const fetchMilestones = async () => {
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
    }
  };

  // Fetch testimonials data
  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('about_testimonials')
        .select('*')
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching testimonials:', error);
      } else {
        setTestimonials(data || []);
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
    }
  };

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchSections(),
        fetchValues(),
        fetchTeamMembers(),
        fetchMilestones(),
        fetchTestimonials(),
      ]);
    };

    loadData();
  }, []);

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
      case 'upload':
        return <UploadIcon {...iconProps} />;
      case 'image':
        return <ImageIcon {...iconProps} />;
      case 'quote':
        return <Quote {...iconProps} />;
      case 'dashboard':
        return <LayoutDashboard {...iconProps} />;
      default:
        return <Star {...iconProps} />;
    }
  };

  // Handle save section
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);

  const [editingSection, setEditingSection] = useState<AboutPageSection | null>(null);
  const [editingValue, setEditingValue] = useState<Value | null>(null);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  // Handle save section
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

  // Handle save value
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

  // Handle save team member
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

  // Handle save milestone
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

  // Handle save testimonial
  const saveTestimonial = async () => {
    if (!editingTestimonial) return;

    try {
      if (editingTestimonial.id) {
        // Update existing testimonial
        const { error } = await supabase
          .from('about_testimonials')
          .update({
            customer_name: editingTestimonial.customer_name,
            customer_role: editingTestimonial.customer_role,
            testimonial_text: editingTestimonial.testimonial_text,
            rating: editingTestimonial.rating,
            customer_image_url: editingTestimonial.customer_image_url,
            is_verified: editingTestimonial.is_verified,
            is_featured: editingTestimonial.is_featured
          })
          .eq('id', editingTestimonial.id);

        if (error) throw error;
      } else {
        // Create new testimonial
        const { error } = await supabase
          .from('about_testimonials')
          .insert([{
            customer_name: editingTestimonial.customer_name,
            customer_role: editingTestimonial.customer_role,
            testimonial_text: editingTestimonial.testimonial_text,
            rating: editingTestimonial.rating,
            customer_image_url: editingTestimonial.customer_image_url,
            is_verified: editingTestimonial.is_verified,
            is_featured: editingTestimonial.is_featured
          }]);

        if (error) throw error;
      }

      // Refresh data
      fetchTestimonials();
      setTestimonialDialogOpen(false);
      setEditingTestimonial(null);
    } catch (err) {
      console.error('Error saving testimonial:', err);
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

      // Refresh data
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

      // Refresh data
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

      // Refresh data
      fetchTeamMembers();
    } catch (err) {
      console.error('Error deleting team member:', err);
    }
  };

  // Handle delete milestone
  const deleteMilestone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;

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

  // Handle delete testimonial
  const deleteTestimonial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const { error } = await supabase
        .from('about_testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh data
      fetchTestimonials();
    } catch (err) {
      console.error('Error deleting testimonial:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-teal font-medium">Loading About Us management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-teal p-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-teal">About Us Page Management</h1>
        <p className="text-teal/70 mt-2">Manage content for the About Us page sections</p>
      </div>

      {/* Tabs Navigation - Mobile-friendly */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-teal/20 pb-4">
        {[
          { key: 'sections', label: 'Page Sections', icon: Hash },
          { key: 'values', label: 'Core Values', icon: Heart },
          { key: 'team', label: 'Team Members', icon: Users },
          { key: 'milestones', label: 'Milestones', icon: Award },
          { key: 'testimonials', label: 'Testimonials', icon: Quote },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-accent text-white shadow-md'
                : 'bg-white/50 text-teal hover:bg-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Sections Tab */}
        {activeTab === 'sections' && (
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-teal">
                    <Hash className="w-5 h-5" /> Page Sections
                  </CardTitle>
                  <CardDescription>Configure the visibility and content of About Page sections</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  className="bg-accent hover:bg-accent/90 text-white"
                  onClick={() => {
                    setEditingSection({
                      id: '',
                      section_key: 'hero',
                      title: '',
                      subtitle: '',
                      content: '',
                      image_url: '',
                      is_active: true,
                      sort_order: 0,
                      settings: {},
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    });
                    setSectionDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Section
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(sections).map((section) => (
                    <Card key={section.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-lg text-teal capitalize">{section.section_key.replace('_', ' ')}</h3>
                            <p className="text-sm text-teal/70 truncate">{section.title}</p>
                          </div>
                          <Switch
                            checked={section.is_active}
                            onCheckedChange={async (checked) => {
                              await supabase
                                .from('about_page_sections')
                                .update({ is_active: checked })
                                .eq('id', section.id);
                              fetchSections(); // Refresh data
                            }}
                          />
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setEditingSection(section);
                              setSectionDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteSection(section.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Core Values Tab */}
        {activeTab === 'values' && (
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-teal">
                    <Heart className="w-5 h-5" /> Core Values
                  </CardTitle>
                  <CardDescription>Manage your company's core values displayed on the About page</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  className="bg-accent hover:bg-accent/90 text-white"
                  onClick={() => {
                    setEditingValue({
                      id: '',
                      title: '',
                      description: '',
                      icon: 'heart',
                      sort_order: 0,
                      is_active: true,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    });
                    setValueDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Value
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {values.map((value) => (
                    <Card key={value.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-accent/10 rounded-lg text-accent">
                            {getIconComponent(value.icon)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-teal">{value.title}</h3>
                            <p className="text-sm text-teal/70">{value.description.substring(0, 60)}...</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setEditingValue(value);
                              setValueDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteValue(value.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Team Members Tab */}
        {activeTab === 'team' && (
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-teal">
                    <Users className="w-5 h-5" /> Team Members
                  </CardTitle>
                  <CardDescription>Manage your team members and their profiles</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  className="bg-accent hover:bg-accent/90 text-white"
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
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    });
                    setTeamDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamMembers.map((member) => (
                    <Card key={member.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4 mb-3">
                          {member.image_url ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-teal/20 to-accent/20 flex items-center justify-center">
                              <img 
                                src={member.image_url} 
                                alt={member.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null; // Prevent infinite loop
                                  target.src = `https://placehold.co/100x100/e6dcc8/006d77?text=${member.name.charAt(0)}`;
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal/20 to-accent/20 flex items-center justify-center">
                              <span className="text-white font-bold">{member.name.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-teal">{member.name}</h3>
                            <p className="text-sm text-accent">{member.role}</p>
                          </div>
                        </div>
                        <p className="text-sm text-teal/70 mb-3 line-clamp-2">{member.bio}</p>
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setEditingTeamMember(member);
                              setTeamDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteTeamMember(member.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-teal">
                    <Award className="w-5 h-5" /> Milestones
                  </CardTitle>
                  <CardDescription>Track your company's achievements and timeline</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  className="bg-accent hover:bg-accent/90 text-white"
                  onClick={() => {
                    setEditingMilestone({
                      id: '',
                      year: new Date().getFullYear(),
                      title: '',
                      description: '',
                      icon: 'award',
                      is_featured: false,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    });
                    setMilestoneDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Milestone
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {milestones.map((milestone) => (
                    <Card key={milestone.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-accent/10 rounded-lg text-accent">
                            {getIconComponent(milestone.icon)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-teal">{milestone.year}</h3>
                            <p className="text-accent">{milestone.title}</p>
                          </div>
                        </div>
                        <p className="text-sm text-teal/70 mt-3">{milestone.description}</p>
                        <div className="flex gap-2 mt-4 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setEditingMilestone(milestone);
                              setMilestoneDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteMilestone(milestone.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Testimonials Tab */}
        {activeTab === 'testimonials' && (
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-teal">
                    <Quote className="w-5 h-5" /> Testimonials
                  </CardTitle>
                  <CardDescription>Manage customer testimonials and feedback</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  className="bg-accent hover:bg-accent/90 text-white"
                  onClick={() => {
                    setEditingTestimonial({
                      id: '',
                      customer_name: '',
                      customer_role: '',
                      testimonial_text: '',
                      rating: 5,
                      customer_image_url: '',
                      is_verified: true,
                      is_featured: false,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    });
                    setTestimonialDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Testimonial
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testimonials.map((testimonial) => (
                    <Card key={testimonial.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < testimonial.rating ? 'text-accent fill-accent' : 'text-teal/20'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-teal/80 italic mb-3">"{testimonial.testimonial_text.substring(0, 80)}..."</p>
                        <div className="flex items-center gap-3">
                          {testimonial.customer_image_url ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                              <img 
                                src={testimonial.customer_image_url} 
                                alt={testimonial.customer_name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null; // Prevent infinite loop
                                  target.src = `https://placehold.co/100x100/e6dcc8/006d77?text=${testimonial.customer_name.charAt(0)}`;
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal/20 to-accent/20 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{testimonial.customer_name.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-sm text-teal">{testimonial.customer_name}</h4>
                            <p className="text-xs text-accent">{testimonial.customer_role}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setEditingTestimonial(testimonial);
                              setTestimonialDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteTestimonial(testimonial.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modals for Editing */}
      
      {/* Section Edit Modal */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSection?.id ? 'Edit' : 'Add'} Page Section</DialogTitle>
            <DialogDescription>
              {editingSection?.id 
                ? `Update settings for "${editingSection.section_key}" section`
                : 'Add a new section to the About Us page'}
            </DialogDescription>
          </DialogHeader>
          
          {editingSection && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="sectionKey">Section Type</Label>
                <Select 
                  value={editingSection.section_key} 
                  onValueChange={(value) => setEditingSection({ ...editingSection, section_key: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero Section</SelectItem>
                    <SelectItem value="mission">Mission Section</SelectItem>
                    <SelectItem value="values">Values Section</SelectItem>
                    <SelectItem value="team">Team Section</SelectItem>
                    <SelectItem value="milestones">Milestones Section</SelectItem>
                    <SelectItem value="testimonials">Testimonials Section</SelectItem>
                    <SelectItem value="cta">Call to Action Section</SelectItem>
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
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sectionActive">Active</Label>
                <Switch
                  id="sectionActive"
                  checked={editingSection.is_active}
                  onCheckedChange={(checked) => setEditingSection({ ...editingSection, is_active: checked })}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setSectionDialogOpen(false);
                setEditingSection(null);
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={saveSection}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Value Edit Modal */}
      <Dialog open={valueDialogOpen} onOpenChange={setValueDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingValue?.id ? 'Edit' : 'Add'} Value</DialogTitle>
            <DialogDescription>
              {editingValue?.id 
                ? `Update settings for "${editingValue.title}" value`
                : 'Add a new core value for your company'}
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
                  placeholder="Value title"
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
                  onValueChange={(value) => setEditingValue({ ...editingValue, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paw">Paw Print</SelectItem>
                    <SelectItem value="heart">Heart</SelectItem>
                    <SelectItem value="shield">Shield</SelectItem>
                    <SelectItem value="award">Award</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="leaf">Leaf</SelectItem>
                    <SelectItem value="globe">Globe</SelectItem>
                    <SelectItem value="star">Star</SelectItem>
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
            <Button 
              variant="outline" 
              onClick={() => {
                setValueDialogOpen(false);
                setEditingValue(null);
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={saveValue}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Member Edit Modal */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTeamMember?.id ? 'Edit' : 'Add'} Team Member</DialogTitle>
            <DialogDescription>
              {editingTeamMember?.id 
                ? `Update information for "${editingTeamMember.name}"`
                : 'Add a new team member to display'}
            </DialogDescription>
          </DialogHeader>
          
          {editingTeamMember && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="teamName">Name</Label>
                <Input
                  id="teamName"
                  value={editingTeamMember.name}
                  onChange={(e) => setEditingTeamMember({ ...editingTeamMember, name: e.target.value })}
                  placeholder="Team member full name"
                />
              </div>
              
              <div>
                <Label htmlFor="teamRole">Role</Label>
                <Input
                  id="teamRole"
                  value={editingTeamMember.role}
                  onChange={(e) => setEditingTeamMember({ ...editingTeamMember, role: e.target.value })}
                  placeholder="Team member role/title"
                />
              </div>
              
              <div>
                <Label htmlFor="teamBio">Bio</Label>
                <Textarea
                  id="teamBio"
                  value={editingTeamMember.bio}
                  onChange={(e) => setEditingTeamMember({ ...editingTeamMember, bio: e.target.value })}
                  placeholder="Team member bio/information"
                  rows={3}
                />
              </div>
              
              <div>
                <ImageUpload
                  value={editingTeamMember.image_url || ''}
                  onChange={(imageData) =>
                    setEditingTeamMember({ ...editingTeamMember, image_url: imageData })
                  }
                  label="Profile Image"
                  quality={0.8}
                  maxWidth={400}
                  maxHeight={400}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="teamActive">Active</Label>
                <Switch
                  id="teamActive"
                  checked={editingTeamMember.is_active}
                  onCheckedChange={(checked) => setEditingTeamMember({ ...editingTeamMember, is_active: checked })}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setTeamDialogOpen(false);
                setEditingTeamMember(null);
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={saveTeamMember}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Milestone Edit Modal */}
      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent className="max-w-lg">
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
                    <SelectItem value="briefcase">Briefcase</SelectItem>
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
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={saveMilestone}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Testimonial Edit Modal */}
      <Dialog open={testimonialDialogOpen} onOpenChange={setTestimonialDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTestimonial?.id ? 'Edit' : 'Add'} Testimonial</DialogTitle>
            <DialogDescription>
              {editingTestimonial?.id 
                ? `Update information for "${editingTestimonial.customer_name}"`
                : 'Add a new customer testimonial'}
            </DialogDescription>
          </DialogHeader>
          
          {editingTestimonial && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="testimonialName">Customer Name</Label>
                <Input
                  id="testimonialName"
                  value={editingTestimonial.customer_name}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, customer_name: e.target.value })}
                  placeholder="Customer's name"
                />
              </div>
              
              <div>
                <Label htmlFor="testimonialRole">Customer Role</Label>
                <Input
                  id="testimonialRole"
                  value={editingTestimonial.customer_role}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, customer_role: e.target.value })}
                  placeholder="Customer's role (e.g. Dog Owner)"
                />
              </div>
              
              <div>
                <Label htmlFor="testimonialText">Testimonial</Label>
                <Textarea
                  id="testimonialText"
                  value={editingTestimonial.testimonial_text}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, testimonial_text: e.target.value })}
                  placeholder="Customer's testimonial text"
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="testimonialRating">Rating</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEditingTestimonial({ ...editingTestimonial, rating: num })}
                      className={`p-1 ${num <= editingTestimonial.rating ? 'text-accent' : 'text-gray-300'}`}
                    >
                      <Star className={`w-6 h-6 ${num <= editingTestimonial.rating ? 'fill-accent' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <ImageUpload
                  value={editingTestimonial.customer_image_url || ''}
                  onChange={(imageData) =>
                    setEditingTestimonial({ ...editingTestimonial, customer_image_url: imageData })
                  }
                  label="Customer Image"
                  quality={0.8}
                  maxWidth={100}
                  maxHeight={100}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="testimonialVerified">Verified</Label>
                <Switch
                  id="testimonialVerified"
                  checked={editingTestimonial.is_verified}
                  onCheckedChange={(checked) => setEditingTestimonial({ ...editingTestimonial, is_verified: checked })}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setTestimonialDialogOpen(false);
                setEditingTestimonial(null);
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={saveTestimonial}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}