'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  Users,
  Heart,
  PawPrint,
  Star,
  Globe,
  Leaf,
  Shield,
  Award,
  Briefcase,
  Calendar,
  Target,
  Sparkles,
  Mountain,
  Plane,
  Building,
  X,
  Volume2,
  VolumeX,
  Play,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

// Types for About Us page data
interface AboutSection {
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

export default function AboutPage() {
  const [sections, setSections] = useState<Record<string, AboutSection>>({});
  const [values, setValues] = useState<Value[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const supabase = createClient();

  // Fetch About Us page content from database
  const fetchAboutContent = async () => {
    try {
      setLoading(true);

      // Fetch all section content
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('about_page_sections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (sectionsError) {
        console.error('Error fetching sections:', sectionsError);
        // Continue even if sections fail to load
      } else if (sectionsData) {
        const sectionsMap: Record<string, AboutSection> = {};
        sectionsData.forEach((section: any) => {
          sectionsMap[section.section_key] = section;
        });
        setSections(sectionsMap);
      }

      // Fetch company values
      const { data: valuesData, error: valuesError } = await supabase
        .from('about_values')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (valuesError) {
        console.error('Error fetching values:', valuesError);
      } else {
        setValues(valuesData || []);
      }

      // Fetch team members
      const { data: teamData, error: teamError } = await supabase
        .from('about_team_members')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (teamError) {
        console.error('Error fetching team members:', teamError);
      } else {
        setTeamMembers(teamData || []);
      }

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('about_milestones')
        .select('*')
        .order('year', { ascending: false });

      if (milestonesError) {
        console.error('Error fetching milestones:', milestonesError);
      } else {
        setMilestones(milestonesData || []);
      }

      // Fetch testimonials
      const { data: testimonialsData, error: testimonialsError } = await supabase
        .from('about_testimonials')
        .select('*')
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (testimonialsError) {
        console.error('Error fetching testimonials:', testimonialsError);
      } else {
        setTestimonials(testimonialsData || []);
      }
    } catch (error) {
      console.error('Unexpected error in fetchAboutContent:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAboutContent();
  }, []);

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
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
      default:
        return <Star {...iconProps} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-teal font-medium">Loading About Us page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-teal">
      {/* Navigation Dots (Desktop) */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 hidden lg:flex flex-col gap-3">
        {['hero', 'mission', 'values', 'team', 'milestones', 'testimonials'].map((section) => (
          <button
            key={section}
            onClick={() => scrollToSection(section)}
            className={`w-3 h-3 rounded-full transition-all ${
              activeSection === section ? 'bg-accent scale-125' : 'bg-teal/50'
            }`}
            aria-label={`Go to ${section} section`}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section 
        id="hero" 
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal to-teal/80 pt-16 relative overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-accent/10 blur-xl"
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div 
            className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full bg-accent/5 blur-2xl"
            animate={{ 
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 1.5, 1]
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5
            }}
          />
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge className="bg-white/20 text-accent border-accent/30 mb-6 backdrop-blur-sm">
              Our Story
            </Badge>
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {sections.hero?.title || "Dedicated to Pet Wellness & Happiness"}
            </motion.h1>
            <motion.p 
              className="text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {sections.hero?.content || "At ShortTail.id, we believe every pet deserves the best care, nutrition, and love. Founded in 2020 with a passion for animal welfare, we've grown into Indonesia's premier destination for premium pet supplies."}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-white text-lg px-8 py-6 rounded-full shadow-xl"
                onClick={() => scrollToSection('mission')}
              >
                Discover Our Journey
                <ChevronDown className="ml-2 h-5 w-5 animate-bounce" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-teal/10 text-teal border-teal/20 mb-4">
              Our Mission
            </Badge>
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-teal mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {sections.mission?.title || "Nurturing the Bond Between Pets and Their Humans"}
            </motion.h2>
            <motion.p 
              className="text-lg text-teal/70"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {sections.mission?.content || "We're committed to enhancing the lives of pets and their families through premium products, expert advice, and compassionate service. Our mission extends beyond selling products – we aim to foster lasting bonds between pets and their humans."}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.length > 0 ? (
              values.map((value, index) => (
                <motion.div
                  key={value.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="border-0 bg-cream/50 hover:bg-cream/70 transition-all duration-300 h-full group">
                    <CardContent className="p-8 text-center">
                      <motion.div 
                        className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent group-hover:scale-110 transition-transform duration-300"
                        whileHover={{ scale: 1.1 }}
                      >
                        {getIconComponent(value.icon)}
                      </motion.div>
                      <h3 className="text-xl font-bold text-teal mb-3">{value.title}</h3>
                      <p className="text-teal/70">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              // Fallback content if no values in DB
              <>
                {[
                  { 
                    title: "Quality First", 
                    description: "We source only the highest quality products from trusted manufacturers", 
                    icon: "shield"
                  },
                  { 
                    title: "Pet-Centric Approach", 
                    description: "Every decision we make puts the wellbeing of pets first", 
                    icon: "heart"
                  },
                  { 
                    title: "Expert Knowledge", 
                    description: "Our team consists of passionate pet experts ready to help", 
                    icon: "star"
                  }
                ].map((value, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="border-0 bg-cream/50 hover:bg-cream/70 transition-all duration-300 h-full group">
                      <CardContent className="p-8 text-center">
                        <motion.div 
                          className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent group-hover:scale-110 transition-transform duration-300"
                          whileHover={{ scale: 1.1 }}
                        >
                          {getIconComponent(value.icon)}
                        </motion.div>
                        <h3 className="text-xl font-bold text-teal mb-3">{value.title}</h3>
                        <p className="text-teal/70">{value.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 bg-gradient-to-r from-teal/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-accent/10 text-accent border-accent/20 mb-4">
              Meet Our Team
            </Badge>
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-teal mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {sections.team?.title || "The Passionate People Behind ShortTail.id"}
            </motion.h2>
            <motion.p 
              className="text-lg text-teal/70"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {sections.team?.content || "Our diverse team brings together animal lovers, industry experts, and technology enthusiasts united by a shared passion for pet wellness."}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.length > 0 ? (
              teamMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="border-0 bg-white/80 backdrop-blur-sm overflow-hidden text-center group hover:shadow-xl transition-all duration-300">
                    <div className="relative">
                      {member.image_url ? (
                        <motion.img
                          src={member.image_url}
                          alt={member.name}
                          className="w-full h-64 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite loop
                            target.src = "https://placehold.co/400x400/e6dcc8/006d77?text=" + encodeURIComponent(member.name.split(' ')[0]);
                          }}
                          initial={{ scale: 1 }}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : (
                        <div className="w-full h-64 bg-gradient-to-br from-teal/20 to-accent/20 flex items-center justify-center">
                          <div className="text-center p-4">
                            <motion.div 
                              className="bg-teal/20 p-4 rounded-full inline-block mb-3"
                              whileHover={{ scale: 1.1 }}
                            >
                              <PawPrint className="h-8 w-8 text-teal" />
                            </motion.div>
                            <p className="text-teal font-medium">{member.name.split(' ')[0]}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-teal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-teal mb-1">{member.name}</h3>
                      <p className="text-accent font-medium mb-3">{member.role}</p>
                      <p className="text-teal/70 text-sm">{member.bio}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              // Fallback team members if none in DB
              <>
                {[
                  { 
                    name: "Siti Rahayu", 
                    role: "Founder & CEO", 
                    bio: "Veterinary graduate with 10+ years in pet care industry",
                    image: "https://placehold.co/400x400/e6dcc8/006d77?text=Siti"
                  },
                  { 
                    name: "Ahmad Prasetyo", 
                    role: "Head of Operations", 
                    bio: "Supply chain expert focused on quality assurance",
                    image: "https://placehold.co/400x400/e6dcc8/006d77?text=Ahmad"
                  },
                  { 
                    name: "Dewi Kartika", 
                    role: "Pet Nutrition Specialist", 
                    bio: "Animal nutritionist dedicated to healthy pet diets",
                    image: "https://placehold.co/400x400/e6dcc8/006d77?text=Dewi"
                  }
                ].map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="border-0 bg-white/80 backdrop-blur-sm overflow-hidden text-center group hover:shadow-xl transition-all duration-300">
                      <div className="relative">
                        <motion.img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-64 object-cover"
                          initial={{ scale: 1 }}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-teal mb-1">{member.name}</h3>
                        <p className="text-accent font-medium mb-3">{member.role}</p>
                        <p className="text-teal/70 text-sm">{member.bio}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Milestones Timeline */}
      <section id="milestones" className="py-20 bg-cream relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-teal/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-teal/10 text-teal border-teal/20 mb-4">
              Our Journey
            </Badge>
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-teal mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {sections.milestones?.title || "Milestones & Achievements"}
            </motion.h2>
            <motion.p 
              className="text-lg text-teal/70"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {sections.milestones?.content || "Our growth story filled with significant achievements and memorable moments."}
            </motion.p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Vertical timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-teal to-accent hidden md:block"></div>

            <div className="space-y-12 md:space-y-24">
              {milestones.length > 0 ? (
                milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`relative flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:pr-8 md:text-left' : 'md:pl-8 md:text-right'} mb-4 md:mb-0`}>
                      <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            {index % 2 === 0 && (
                              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 text-accent">
                                {getIconComponent(milestone.icon)}
                              </div>
                            )}
                            <div className={`${index % 2 !== 0 ? 'md:ml-auto' : ''} flex-1`}>
                              <span className="text-accent font-bold text-lg">{milestone.year}</span>
                              <h3 className="text-xl font-bold text-teal mt-2">{milestone.title}</h3>
                              <p className="text-teal/70 mt-2">{milestone.description}</p>
                            </div>
                            {index % 2 !== 0 && (
                              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 text-accent">
                                {getIconComponent(milestone.icon)}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Timeline dot */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-accent border-4 border-white shadow-lg z-10 md:flex items-center justify-center hidden">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    
                    {/* Mobile timeline */}
                    <div className="w-0.5 h-8 bg-teal/30 md:hidden mx-auto"></div>
                  </motion.div>
                ))
              ) : (
                // Default milestones if none in DB
                <>
                  {[
                    { year: 2020, title: "Company Founded", description: "ShortTail.id launched with a vision to revolutionize pet care in Indonesia", icon: "award" },
                    { year: 2021, title: "First Store Opening", description: "Opened our flagship physical store in Jakarta", icon: "building" },
                    { year: 2022, title: "10,000 Happy Pets", description: "Reached 10,000 pets served with premium care products", icon: "pawprint" },
                    { year: 2023, title: "Mobile App Launch", description: "Launched our mobile app for convenient pet care access", icon: "globe" },
                    { year: 2024, title: "100,000 Customers", description: "Served 100,000+ pet parents across Indonesia", icon: "users" },
                    { year: 2025, title: "Sustainability Initiative", description: "Launched eco-friendly packaging for all products", icon: "leaf" }
                  ].map((milestone, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className={`relative flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    >
                      <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:pr-8 md:text-left' : 'md:pl-8 md:text-right'} mb-4 md:mb-0`}>
                        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                              {index % 2 === 0 && (
                                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 text-accent">
                                  {getIconComponent(milestone.icon)}
                                </div>
                              )}
                              <div className={`${index % 2 !== 0 ? 'md:ml-auto' : ''} flex-1`}>
                                <span className="text-accent font-bold text-lg">{milestone.year}</span>
                                <h3 className="text-xl font-bold text-teal mt-2">{milestone.title}</h3>
                                <p className="text-teal/70 mt-2">{milestone.description}</p>
                              </div>
                              {index % 2 !== 0 && (
                                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 text-accent">
                                  {getIconComponent(milestone.icon)}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Timeline dot */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-accent border-4 border-white shadow-lg z-10 md:flex items-center justify-center hidden">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      
                      {/* Mobile timeline */}
                      <div className="w-0.5 h-8 bg-teal/30 md:hidden mx-auto"></div>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-teal to-teal/80 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <motion.div 
            className="absolute top-1/3 left-1/4 w-48 h-48 bg-white/10 rounded-full blur-2xl"
            animate={{ 
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-accent/10 rounded-full blur-2xl"
            animate={{ 
              x: [0, -40, 0],
              y: [0, 20, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3
            }}
          />
        </div>

        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-white/20 text-white border-white/30 mb-4 backdrop-blur-sm">
              What Our Customers Say
            </Badge>
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {sections.testimonials?.title || "Pawsitive Feedback from Pet Parents"}
            </motion.h2>
            <motion.p 
              className="text-white/90"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {sections.testimonials?.content || "Hear from pet parents who trust us with their beloved companions."}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.length > 0 ? (
              testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="border-0 bg-white/90 backdrop-blur-sm h-full hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-8">
                      <div className="flex mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-5 h-5 ${i < testimonial.rating ? 'text-accent fill-accent' : 'text-teal/20'}`} 
                          />
                        ))}
                      </div>
                      <blockquote className="text-teal/80 italic mb-6 relative pl-6 before:content-['“'] before:absolute before:left-0 before:top-0 before:text-4xl before:text-accent before:opacity-20">
                        {testimonial.testimonial_text}
                      </blockquote>
                      <div className="flex items-center">
                        {testimonial.customer_image_url ? (
                          <div className="relative">
                            <img
                              src={testimonial.customer_image_url}
                              alt={testimonial.customer_name}
                              className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-accent"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Prevent infinite loop
                                target.src = "https://placehold.co/100x100/e6dcc8/006d77?text=" + testimonial.customer_name.charAt(0);
                              }}
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                              <PawPrint className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal to-accent flex items-center justify-center text-white mr-4 relative">
                            <span className="font-bold">{testimonial.customer_name.charAt(0)}</span>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                              <PawPrint className="w-3 h-3 text-accent" />
                            </div>
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-teal">{testimonial.customer_name}</h4>
                          <p className="text-teal/60 text-sm">{testimonial.customer_role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              // Default testimonials if none in DB
              <>
                {[
                  { 
                    name: "Budi Santoso", 
                    role: "Dog Parent", 
                    text: "ShortTail.id has transformed how I care for my Golden Retriever. The premium food has made his coat shinier and his energy levels amazing!", 
                    rating: 5,
                    image: "https://placehold.co/100x100/e6dcc8/006d77?text=B"
                  },
                  { 
                    name: "Ani Lestari", 
                    role: "Cat Parent", 
                    text: "Their cat toys are exceptional quality. My cats actually play with them instead of ignoring them like toys from other shops!", 
                    rating: 5,
                    image: "https://placehold.co/100x100/e6dcc8/006d77?text=A"
                  },
                  { 
                    name: "Rizki Pratama", 
                    role: "Pet Shop Owner", 
                    text: "As a retailer, I'm impressed with ShortTail.id's product quality and customer service. They're my go-to supplier for premium pet products.", 
                    rating: 5,
                    image: "https://placehold.co/100x100/e6dcc8/006d77?text=R"
                  }
                ].map((testimonial, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="border-0 bg-white/90 backdrop-blur-sm h-full hover:shadow-xl transition-shadow duration-300">
                      <CardContent className="p-8">
                        <div className="flex mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-5 h-5 ${i < testimonial.rating ? 'text-accent fill-accent' : 'text-teal/20'}`} 
                            />
                          ))}
                        </div>
                        <blockquote className="text-teal/80 italic mb-6 relative pl-6 before:content-['“'] before:absolute before:left-0 before:top-0 before:text-4xl before:text-accent before:opacity-20">
                          {testimonial.text}
                        </blockquote>
                        <div className="flex items-center">
                          <div className="relative">
                            <img
                              src={testimonial.image}
                              alt={testimonial.name}
                              className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-accent"
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                              <PawPrint className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-teal">{testimonial.name}</h4>
                            <p className="text-teal/60 text-sm">{testimonial.role}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="bg-accent/10 text-accent border-accent/20 mb-6">
                Join Our Family
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-teal mb-6">
                Ready to Pamper Your Pet?
              </h2>
              <p className="text-xl text-teal/70 mb-10 max-w-2xl mx-auto">
                Join thousands of happy pet parents who trust ShortTail.id for premium pet care essentials.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8 py-6 text-lg rounded-full">
                  Shop Now
                </Button>
                <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/5 px-8 py-6 text-lg rounded-full">
                  Contact Us
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}