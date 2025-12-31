'use client';

import { useState, useEffect } from 'react';
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
  ChevronDown,
  Calendar,
  Target,
  Sparkles,
  Mountain,
  Plane,
  Building,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { StoreLogo } from '@/components/ui/store-logo';
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

// Simple in-memory cache with TTL
const ABOUT_PAGE_CACHE = {
  data: null as any,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes

  get() {
    if (this.data && (Date.now() - this.timestamp) < this.ttl) {
      return this.data;
    }
    return null;
  },

  set(data: any) {
    this.data = data;
    this.timestamp = Date.now();
  },

  clear() {
    this.data = null;
    this.timestamp = 0;
  }
};

export default function AboutPage() {
  const [sections, setSections] = useState<Record<string, AboutSection>>({});
  const [values, setValues] = useState<Value[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isMobile, setIsMobile] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Fetch About Us page content from database with improved performance
  const fetchAboutContent = async () => {
    // Try to get cached data first
    const cachedData = ABOUT_PAGE_CACHE.get();
    if (cachedData) {
      setSections(cachedData.sections);
      setValues(cachedData.values);
      setTeamMembers(cachedData.teamMembers);
      setMilestones(cachedData.milestones);
      setTestimonials(cachedData.testimonials);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Execute all queries in parallel for better performance with retry
      const [sectionsResponse, valuesResponse, teamResponse, milestonesResponse, testimonialsResponse] =
        await Promise.allSettled([
          fetchWithRetry(() =>
            supabase
              .from('about_page_sections')
              .select('*')
              .eq('is_active', true)
              .order('sort_order', { ascending: true })
          ),
          fetchWithRetry(() =>
            supabase
              .from('about_values')
              .select('*')
              .eq('is_active', true)
              .order('sort_order', { ascending: true })
          ),
          fetchWithRetry(() =>
            supabase
              .from('about_team_members')
              .select('*')
              .eq('is_active', true)
              .order('sort_order', { ascending: true })
          ),
          fetchWithRetry(() =>
            supabase
              .from('about_milestones')
              .select('*')
              .order('year', { ascending: false })
          ),
          fetchWithRetry(() =>
            supabase
              .from('about_testimonials')
              .select('*')
              .eq('is_verified', true)
              .order('created_at', { ascending: false })
              .limit(6)
          )
        ]);

      let sections: Record<string, AboutSection> = {};
      let values: Value[] = [];
      let teamMembers: TeamMember[] = [];
      let milestones: Milestone[] = [];
      let testimonials: Testimonial[] = [];

      // Handle sections data
      if (sectionsResponse.status === 'fulfilled' && sectionsResponse.value) {
        const { data: sectionsData, error: sectionsError } = sectionsResponse.value;
        if (sectionsError) {
          console.error('Error fetching sections:', sectionsError);
        } else if (sectionsData) {
          sectionsData.forEach((section: any) => {
            sections[section.section_key] = section;
          });
        }
      } else {
        console.error('Promise rejected for sections:', sectionsResponse.status === 'rejected' ? sectionsResponse.reason : 'unknown');
      }

      // Handle values data
      if (valuesResponse.status === 'fulfilled' && valuesResponse.value) {
        const { data: valuesData, error: valuesError } = valuesResponse.value;
        if (valuesError) {
          console.error('Error fetching values:', valuesError);
        } else {
          values = valuesData || [];
        }
      } else {
        console.error('Promise rejected for values:', valuesResponse.status === 'rejected' ? valuesResponse.reason : 'unknown');
      }

      // Handle team members data
      if (teamResponse.status === 'fulfilled' && teamResponse.value) {
        const { data: teamData, error: teamError } = teamResponse.value;
        if (teamError) {
          console.error('Error fetching team members:', teamError);
        } else {
          teamMembers = teamData || [];
        }
      } else {
        console.error('Promise rejected for team:', teamResponse.status === 'rejected' ? teamResponse.reason : 'unknown');
      }

      // Handle milestones data
      if (milestonesResponse.status === 'fulfilled' && milestonesResponse.value) {
        const { data: milestonesData, error: milestonesError } = milestonesResponse.value;
        if (milestonesError) {
          console.error('Error fetching milestones:', milestonesError);
        } else {
          milestones = milestonesData || [];
        }
      } else {
        console.error('Promise rejected for milestones:', milestonesResponse.status === 'rejected' ? milestonesResponse.reason : 'unknown');
      }

      // Handle testimonials data
      if (testimonialsResponse.status === 'fulfilled' && testimonialsResponse.value) {
        const { data: testimonialsData, error: testimonialsError } = testimonialsResponse.value;
        if (testimonialsError) {
          console.error('Error fetching testimonials:', testimonialsError);
        } else {
          testimonials = testimonialsData || [];
        }
      } else {
        console.error('Promise rejected for testimonials:', testimonialsResponse.status === 'rejected' ? testimonialsResponse.reason : 'unknown');
      }

      // Update state with fetched data
      setSections(sections);
      setValues(values);
      setTeamMembers(teamMembers);
      setMilestones(milestones);
      setTestimonials(testimonials);

      // Cache the data
      ABOUT_PAGE_CACHE.set({
        sections,
        values,
        teamMembers,
        milestones,
        testimonials
      });
    } catch (error) {
      console.error('Unexpected error in fetchAboutContent:', error);
      // Even if we have partial data, we should display it rather than remain in loading state
    } finally {
      setLoading(false);
    }
  };

  // Helper function to retry failed requests
  const fetchWithRetry = async (requestFn: () => any, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const result = await requestFn();
        if (result.error) {
          console.warn(`Attempt ${i+1} failed:`, result.error.message);
          if (i === retries - 1) return result; // Last attempt, return error
        } else {
          return result; // Success, return result
        }
      } catch (error) {
        console.warn(`Attempt ${i+1} threw error:`, error);
        if (i === retries - 1) throw error; // Last attempt, rethrow
      }
      // Wait a bit before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 500));
    }
  };

  // Function to clear cache when needed
  const clearCache = () => {
    ABOUT_PAGE_CACHE.clear();
  };

  useEffect(() => {
    fetchAboutContent();

    // Clear cache on component unmount to ensure fresh data on next visit if needed
    return () => {
      // Optionally clear cache after some time
    };
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf6ec' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff911d] mx-auto"></div>
          <p className="mt-4 text-[#006d77] font-medium">Loading About Us page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf6ec', color: '#006d77' }}>
      <Header />

      <main className="flex-1">
        {loading && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff911d] mb-4"></div>
              <p className="text-[#006d77]/70 font-medium">Loading about information...</p>
            </div>
          </div>
        )}

        {!loading && (
          <div> {/* Wrapper div for multiple elements */}
        {/* Hero Section */}
        <section
          id="hero"
          className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden"
          style={{ backgroundColor: 'linear-gradient(to bottom, #008a90, #006d77)' }}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-[#ff911d]/10 blur-xl"></div>
            <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full bg-[#ff911d]/5 blur-2xl"></div>
          </div>

          <div className="absolute inset-0 bg-[#006d77]/80"></div>

          <div className="container mx-auto px-4 py-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center flex flex-col items-center"
            >
              <div className="mb-6">
                <StoreLogo
                  className="mx-auto rounded-full bg-white p-4 shadow-lg"
                  iconClassName="h-14 w-14 text-[#ff911d]"
                  fallbackSize="xl"
                />
              </div>

              <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1
                  className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight"
                >
                  {sections.hero?.title || "Dedicated to Pet Wellness & Happiness"}
                </h1>
                <p
                  className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed"
                >
                  {sections.hero?.content || "At ShortTail.id, we believe every pet deserves the best care, nutrition, and love. Founded in 2020 with a passion for animal welfare, we've grown into Indonesia's premier destination for premium pet supplies."}
                </p>
              </motion.div>

              <motion.div
                className="mt-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Button
                  size="lg"
                  className="bg-[#ff911d] hover:bg-[#e6821a] text-white text-lg px-10 py-4 rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
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
              <Badge className="bg-[#006d77]/10 text-[#006d77] border-[#006d77]/20 mb-4">
                Our Mission
              </Badge>
              <motion.h2 
                className="text-3xl md:text-4xl font-bold text-[#006d77] mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {sections.mission?.title || "Nurturing the Bond Between Pets and Their Humans"}
              </motion.h2>
              <motion.p 
                className="text-lg text-[#006d77]/70"
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
                    <Card className="border-0 bg-[#fdf6ec]/50 hover:bg-[#fdf6ec]/70 transition-all duration-300 h-full group" 
                      style={{ backgroundColor: 'rgba(253, 246, 236, 0.5)' }}>
                      <CardContent className="p-8 text-center">
                        <motion.div 
                          className="w-16 h-16 bg-[#ff911d]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#ff911d] group-hover:scale-110 transition-transform duration-300"
                          whileHover={{ scale: 1.1 }}
                        >
                          {getIconComponent(value.icon)}
                        </motion.div>
                        <h3 className="text-xl font-bold text-[#006d77] mb-3">{value.title}</h3>
                        <p className="text-[#006d77]/70">{value.description}</p>
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
                      <Card className="border-0 bg-[#fdf6ec]/50 hover:bg-[#fdf6ec]/70 transition-all duration-300 h-full group"
                        style={{ backgroundColor: 'rgba(253, 246, 236, 0.5)' }}>
                        <CardContent className="p-8 text-center">
                          <motion.div 
                            className="w-16 h-16 bg-[#ff911d]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#ff911d] group-hover:scale-110 transition-transform duration-300"
                            whileHover={{ scale: 1.1 }}
                          >
                            {getIconComponent(value.icon)}
                          </motion.div>
                          <h3 className="text-xl font-bold text-[#006d77] mb-3">{value.title}</h3>
                          <p className="text-[#006d77]/70">{value.description}</p>
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
        <section
          id="team"
          className="py-20 bg-[#006d77] relative overflow-hidden"
          style={{ backgroundColor: '#006d77' }}
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <motion.div
              className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#ff911d]/10 rounded-full blur-3xl"
              animate={{
                x: [0, 30, 0],
                y: [0, -20, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-cream/10 rounded-full blur-3xl"
              animate={{
                x: [0, -40, 0],
                y: [0, 20, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 3
              }}
            />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="bg-[#fdf6ec]/20 text-[#fdf6ec] border-[#fdf6ec]/30 mb-4 backdrop-blur-sm">
                Meet Our Team
              </Badge>
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-[#fdf6ec] mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {sections.team?.title || "The Passionate People Behind ShortTail.id"}
              </motion.h2>
              <motion.p
                className="text-lg text-[#fdf6ec]/90 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {sections.team?.content || "Our diverse team brings together animal lovers, industry experts, and technology enthusiasts united by a shared passion for pet wellness."}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {teamMembers.length > 0 ? (
                teamMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group"
                  >
                    <Card className="border-0 bg-white/80 backdrop-blur-sm overflow-visible text-center group hover:shadow-2xl transition-all duration-500 h-full flex flex-col"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                      <div className="relative overflow-visible -mt-8">
                        {member.image_url ? (
                          <motion.div
                            className="relative mx-auto w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg"
                            whileHover={{ y: -5 }}
                            transition={{ duration: 0.3 }}
                          >
                            <img
                              src={member.image_url}
                              alt={member.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Prevent infinite loop
                                target.src = "https://placehold.co/400x400/e6dcc8/006d77?text=" + encodeURIComponent(member.name.split(' ')[0]);
                              }}
                            />
                            {/* Decorative overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#006d77]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* Decorative border */}
                            <div className="absolute inset-0 rounded-full border-2 border-[#ff911d]/30 pointer-events-none"></div>
                          </motion.div>
                        ) : (
                          <motion.div
                            className="relative mx-auto w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center bg-gradient-to-br from-[#006d77]/20 to-[#ff911d]/20"
                            whileHover={{ y: -5 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="text-center p-4">
                              <motion.div
                                className="bg-[#006d77]/20 p-5 rounded-full inline-block mb-3"
                                whileHover={{ scale: 1.1 }}
                              >
                                <PawPrint className="h-10 w-10 text-[#006d77]" />
                              </motion.div>
                              <p className="text-[#006d77] font-medium text-xl">{member.name.split(' ')[0]}</p>
                            </div>

                            {/* Decorative overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#006d77]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* Decorative border */}
                            <div className="absolute inset-0 rounded-full border-2 border-[#ff911d]/30 pointer-events-none"></div>
                          </motion.div>
                        )}
                      </div>

                      <CardContent className="p-8 pt-4 flex flex-col flex-1">
                        <h3 className="text-xl font-bold text-[#006d77] mb-1">{member.name}</h3>
                        <p className="text-[#ff911d] font-semibold mb-4 text-lg">{member.role}</p>
                        <p className="text-[#006d77]/80 text-base flex-1">{member.bio}</p>
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
                      bio: "Veterinary graduate with 10+ years in pet care industry, passionate about bringing premium products to Indonesian pet parents.",
                      image: "https://placehold.co/400x400/e6dcc8/006d77?text=Siti"
                    },
                    {
                      name: "Ahmad Prasetyo",
                      role: "Head of Operations",
                      bio: "Supply chain expert focused on quality assurance and sustainable sourcing practices, ensuring every product meets our high standards.",
                      image: "https://placehold.co/400x400/e6dcc8/006d77?text=Ahmad"
                    },
                    {
                      name: "Dewi Kartika",
                      role: "Pet Nutrition Specialist",
                      bio: "Animal nutritionist dedicated to helping pet parents make informed dietary choices, with expertise in species-specific nutritional needs.",
                      image: "https://placehold.co/400x400/e6dcc8/006d77?text=Dewi"
                    }
                  ].map((member, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="group"
                    >
                      <Card className="border-0 bg-white/80 backdrop-blur-sm overflow-visible text-center group hover:shadow-2xl transition-all duration-500 h-full flex flex-col"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                        <div className="relative overflow-visible -mt-8">
                          <motion.div
                            className="relative mx-auto w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg"
                            whileHover={{ y: -5 }}
                            transition={{ duration: 0.3 }}
                          >
                            <img
                              src={member.image}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                            {/* Decorative overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#006d77]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* Decorative border */}
                            <div className="absolute inset-0 rounded-full border-2 border-[#ff911d]/30 pointer-events-none"></div>
                          </motion.div>
                        </div>

                        <CardContent className="p-8 pt-4 flex flex-col flex-1">
                          <h3 className="text-xl font-bold text-[#006d77] mb-1">{member.name}</h3>
                          <p className="text-[#ff911d] font-semibold mb-4 text-lg">{member.role}</p>
                          <p className="text-[#006d77]/80 text-base flex-1">{member.bio}</p>
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
        <section id="milestones" className="py-20 bg-[#fdf6ec] relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#ff911d]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-[#006d77]/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <Badge className="bg-[#006d77]/10 text-[#006d77] border-[#006d77]/20 mb-4">
                Our Journey
              </Badge>
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-[#006d77] mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {sections.milestones?.title || "Milestones & Achievements"}
              </motion.h2>
              <motion.p
                className="text-lg text-[#006d77]/70"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {sections.milestones?.content || "Our growth story filled with significant achievements and memorable moments."}
              </motion.p>
            </div>

            {/* Mobile View (Stacked) */}
            <div className="md:hidden space-y-8">
              {milestones.length > 0 ? (
                milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-[#ff911d] rounded-full flex items-center justify-center text-white z-10 flex-shrink-0">
                        <span className="font-bold text-sm">{milestone.year.toString().slice(-2)}</span>
                      </div>
                      <div className="h-1 flex-1 bg-gradient-to-r from-[#ff911d] to-[#006d77]"></div>
                    </div>

                    <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative z-0 ${index % 2 === 0 ? 'bg-white' : 'bg-[#006d77]'}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${index % 2 === 0 ? 'bg-[#ff911d]/10 text-[#ff911d]' : 'bg-[#e6dcc8]/20 text-[#e6dcc8]'}`}>
                            {getIconComponent(milestone.icon)}
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className={`text-lg font-bold ${index % 2 === 0 ? 'text-[#006d77]' : 'text-[#ff911d]'}`}>{milestone.title}</h3>
                            <div className={`${index % 2 === 0 ? 'text-[#006d77]/80' : 'text-[#e6dcc8]/90'} mt-1`}>
                              {milestone.description.split('\n').map((line, i) => (
                                <div key={i} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{line}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                // Default milestones if none in DB
                [
                  { year: 2020, title: "Company Founded", description: "ShortTail.id launched with a vision to revolutionize pet care in Indonesia\nStarted with a small team of animal lovers\nCommitted to premium products", icon: "award" },
                  { year: 2021, title: "First Store Opening", description: "Opened our flagship physical store in Jakarta\nEstablished local customer base\nExpanded product range", icon: "building" },
                  { year: 2022, title: "10,000 Happy Pets", description: "Reached 10,000 pets served with premium care products\nReceived positive customer feedback\nExpanded team to 15 members", icon: "pawprint" },
                  { year: 2023, title: "Mobile App Launch", description: "Launched our mobile app for convenient pet care access\nEnabled online ordering system\nIntegrated loyalty program", icon: "globe" },
                  { year: 2024, title: "100,000 Customers", description: "Served 100,000+ pet parents across Indonesia\nExpanded to 5 major cities\nAchieved 4.8 star rating", icon: "users" },
                  { year: 2025, title: "Sustainability Initiative", description: "Launched eco-friendly packaging for all products\nPartnered with green suppliers\nIntroduced recycling program", icon: "leaf" }
                ].map((milestone, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-[#ff911d] rounded-full flex items-center justify-center text-white z-10 flex-shrink-0">
                        <span className="font-bold text-sm">{milestone.year.toString().slice(-2)}</span>
                      </div>
                      <div className="h-1 flex-1 bg-gradient-to-r from-[#ff911d] to-[#006d77]"></div>
                    </div>

                    <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative z-0 ${index % 2 === 0 ? 'bg-white' : 'bg-[#006d77]'}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${index % 2 === 0 ? 'bg-[#ff911d]/10 text-[#ff911d]' : 'bg-[#e6dcc8]/20 text-[#e6dcc8]'}`}>
                            {getIconComponent(milestone.icon)}
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className={`text-lg font-bold ${index % 2 === 0 ? 'text-[#006d77]' : 'text-[#ff911d]'}`}>{milestone.title}</h3>
                            <div className={`${index % 2 === 0 ? 'text-[#006d77]/80' : 'text-[#e6dcc8]/90'} mt-1`}>
                              {milestone.description.split('\n').map((line, i) => (
                                <div key={i} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{line}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {/* Desktop View (Timeline) */}
            <div className="hidden md:block relative max-w-4xl mx-auto">
              {/* Vertical timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-[#006d77] to-[#ff911d] h-full"></div>

              <div className="space-y-24">
                {milestones.length > 0 ? (
                  milestones.map((milestone, index) => (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.7, delay: index * 0.15 }}
                      className={`relative flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                      <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-left' : 'pl-8 text-right'}`}>
                        <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group ${index % 2 === 0 ? 'bg-white' : 'bg-[#006d77]'}`}>
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                              {index % 2 === 0 ? (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${index % 2 === 0 ? 'bg-[#ff911d]/10 text-[#ff911d]' : 'bg-[#e6dcc8]/20 text-[#e6dcc8]'}`}>
                                  {getIconComponent(milestone.icon)}
                                </div>
                              ) : null}

                              <div className={`${index % 2 !== 0 ? 'ml-auto' : ''} text-left`}>
                                <span className={`font-bold text-lg px-3 py-1 rounded-full inline-block ${index % 2 === 0 ? 'bg-[#ff911d]/10 text-[#ff911d]' : 'bg-[#e6dcc8]/20 text-[#e6dcc8]'}`}>
                                  {milestone.year}
                                </span>
                                <h3 className={`text-xl font-bold mt-2 ${index % 2 === 0 ? 'text-[#006d77]' : 'text-[#ff911d]'}`}>{milestone.title}</h3>
                                <div className={`mt-2 ${index % 2 === 0 ? 'text-[#006d77]/80' : 'text-[#e6dcc8]/90'}`}>
                                  {milestone.description.split('\n').map((line, i) => (
                                    <div key={i} className="flex items-start">
                                      <span className="mr-2">•</span>
                                      <span>{line}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {index % 2 !== 0 ? (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${index % 2 === 0 ? 'bg-[#ff911d]/10 text-[#ff911d]' : 'bg-[#e6dcc8]/20 text-[#e6dcc8]'}`}>
                                  {getIconComponent(milestone.icon)}
                                </div>
                              ) : null}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Timeline dot */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-[#ff911d] border-4 border-white shadow-lg z-10 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  // Default milestones if none in DB
                  [
                    { year: 2020, title: "Company Founded", description: "ShortTail.id launched with a vision to revolutionize pet care in Indonesia\nStarted with a small team of animal lovers\nCommitted to premium products", icon: "award" },
                    { year: 2021, title: "First Store Opening", description: "Opened our flagship physical store in Jakarta\nEstablished local customer base\nExpanded product range", icon: "building" },
                    { year: 2022, title: "10,000 Happy Pets", description: "Reached 10,000 pets served with premium care products\nReceived positive customer feedback\nExpanded team to 15 members", icon: "pawprint" },
                    { year: 2023, title: "Mobile App Launch", description: "Launched our mobile app for convenient pet care access\nEnabled online ordering system\nIntegrated loyalty program", icon: "globe" },
                    { year: 2024, title: "100,000 Customers", description: "Served 100,000+ pet parents across Indonesia\nExpanded to 5 major cities\nAchieved 4.8 star rating", icon: "users" },
                    { year: 2025, title: "Sustainability Initiative", description: "Launched eco-friendly packaging for all products\nPartnered with green suppliers\nIntroduced recycling program", icon: "leaf" }
                  ].map((milestone, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.7, delay: index * 0.15 }}
                      className={`relative flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                      <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-left' : 'pl-8 text-right'}`}>
                        <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group ${index % 2 === 0 ? 'bg-white' : 'bg-[#006d77]'}`}>
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                              {index % 2 === 0 ? (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${index % 2 === 0 ? 'bg-[#ff911d]/10 text-[#ff911d]' : 'bg-[#e6dcc8]/20 text-[#e6dcc8]'}`}>
                                  {getIconComponent(milestone.icon)}
                                </div>
                              ) : null}

                              <div className={`${index % 2 !== 0 ? 'ml-auto' : ''} text-left`}>
                                <span className={`font-bold text-lg px-3 py-1 rounded-full inline-block ${index % 2 === 0 ? 'bg-[#ff911d]/10 text-[#ff911d]' : 'bg-[#e6dcc8]/20 text-[#e6dcc8]'}`}>
                                  {milestone.year}
                                </span>
                                <h3 className={`text-xl font-bold mt-2 ${index % 2 === 0 ? 'text-[#006d77]' : 'text-[#ff911d]'}`}>{milestone.title}</h3>
                                <div className={`mt-2 ${index % 2 === 0 ? 'text-[#006d77]/80' : 'text-[#e6dcc8]/90'}`}>
                                  {milestone.description.split('\n').map((line, i) => (
                                    <div key={i} className="flex items-start">
                                      <span className="mr-2">•</span>
                                      <span>{line}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {index % 2 !== 0 ? (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${index % 2 === 0 ? 'bg-[#ff911d]/10 text-[#ff911d]' : 'bg-[#e6dcc8]/20 text-[#e6dcc8]'}`}>
                                  {getIconComponent(milestone.icon)}
                                </div>
                              ) : null}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Timeline dot */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-[#ff911d] border-4 border-white shadow-lg z-10 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20 bg-gradient-to-br from-[#006d77] to-[#006d77]/80 relative overflow-hidden">
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
              className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-[#ff911d]/10 rounded-full blur-2xl"
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
                              className={`w-5 h-5 ${i < testimonial.rating ? 'text-[#ff911d] fill-[#ff911d]' : 'text-[#006d77]/20'}`} 
                            />
                          ))}
                        </div>
                        <blockquote className="text-[#006d77]/80 italic mb-6 relative pl-6 before:content-[open-quote] before:absolute before:left-0 before:top-0 before:text-4xl before:text-[#ff911d] before:opacity-20">
                          {testimonial.testimonial_text}
                        </blockquote>
                        <div className="flex items-center">
                          {testimonial.customer_image_url ? (
                            <div className="relative">
                              <img
                                src={testimonial.customer_image_url}
                                alt={testimonial.customer_name}
                                className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-[#ff911d]"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null; // Prevent infinite loop
                                  target.src = "https://placehold.co/100x100/e6dcc8/006d77?text=" + testimonial.customer_name.charAt(0);
                                }}
                              />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#ff911d] flex items-center justify-center">
                                <PawPrint className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#006d77] to-[#ff911d] flex items-center justify-center text-white mr-4 relative">
                              <span className="font-bold">{testimonial.customer_name.charAt(0)}</span>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                <PawPrint className="w-3 h-3 text-[#ff911d]" />
                              </div>
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-[#006d77]">{testimonial.customer_name}</h4>
                            <p className="text-[#006d77]/60 text-sm">{testimonial.customer_role}</p>
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
                                className={`w-5 h-5 ${i < testimonial.rating ? 'text-[#ff911d] fill-[#ff911d]' : 'text-[#006d77]/20'}`} 
                              />
                            ))}
                          </div>
                          <blockquote className="text-[#006d77]/80 italic mb-6 relative pl-6 before:content-[open-quote] before:absolute before:left-0 before:top-0 before:text-4xl before:text-[#ff911d] before:opacity-20">
                            {testimonial.text}
                          </blockquote>
                          <div className="flex items-center">
                            <div className="relative">
                              <img
                                src={testimonial.image}
                                alt={testimonial.name}
                                className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-[#ff911d]"
                              />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#ff911d] flex items-center justify-center">
                                <PawPrint className="w-3 h-3 text-white" />
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-[#006d77]">{testimonial.name}</h4>
                              <p className="text-[#006d77]/60 text-sm">{testimonial.role}</p>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge className="bg-[#ff911d]/10 text-[#ff911d] border-[#ff911d]/20 mb-6">
                Join Our Family
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-[#006d77] mb-6">
                Ready to Pamper Your Pet?
              </h2>
              <p className="text-xl text-[#006d77]/70 mb-10 max-w-2xl mx-auto">
                Join thousands of happy pet parents who trust ShortTail.id for premium pet care essentials.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="bg-[#ff911d] hover:bg-[#e6821a] text-white px-8 py-6 text-lg rounded-full">
                  Shop Now
                </Button>
                <Button size="lg" variant="outline" className="border-[#ff911d] text-[#ff911d] hover:bg-[#ff911d]/5 px-8 py-6 text-lg rounded-full">
                  Contact Us
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
        </div>
      )}

      <Footer />
    </main>
    </div>
  );
}