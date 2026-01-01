'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Plus, PawPrint, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { RecommendedProducts } from '@/components/products/recommended-products';
import type { Pet } from '@/types/database';

export default function PetsPage() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPets = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load pets');
    } else {
      setPets(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPets();
    }
  }, [user, fetchPets]);

  const handleDelete = async () => {
    if (!deleteId) return;

    const supabase = createClient();
    const { error } = await supabase.from('pets').delete().eq('id', deleteId);

    if (error) {
      toast.error('Failed to delete pet');
    } else {
      toast.success('Pet removed successfully');
      setPets(pets.filter((p) => p.id !== deleteId));
    }
    setDeleteId(null);
  };

  const calculateAge = (birthday: string | null) => {
    if (!birthday) return 'Unknown';
    const birth = new Date(birthday);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    
    if (years < 1) {
      return `${months + 12} months`;
    }
    return `${years} year${years > 1 ? 's' : ''}`;
  };

  // Extract unique pet types for product recommendations
  const petTypes = useMemo(() => {
    const types = pets.map(pet => pet.pet_type).filter(Boolean);
    return [...new Set(types)];
  }, [pets]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">My Pets</h1>
          <p className="text-brown-600">Manage your pet profiles</p>
        </div>
        <Link href="/dashboard/pets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Pet
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-brown-200 animate-pulse">
              <CardContent className="pt-6">
                <div className="h-24 w-24 bg-brown-200 rounded-full mx-auto mb-4" />
                <div className="h-6 bg-brown-200 rounded w-1/2 mx-auto mb-2" />
                <div className="h-4 bg-brown-200 rounded w-1/3 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pets.length === 0 ? (
        <Card className="border-brown-200">
          <CardContent className="py-16 text-center">
            <PawPrint className="h-16 w-16 text-brown-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-brown-900 mb-2">No pets yet</h2>
            <p className="text-brown-600 mb-6">
              Add your furry friends to get personalized recommendations
            </p>
            <Link href="/dashboard/pets/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Pet
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <Card key={pet.id} className="border-brown-200 relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/pets/${pet.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(pet.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardContent className="pt-4 pb-4 text-center">
                <h3 className="text-base font-bold text-brown-900 mb-0.5">{pet.pet_name}</h3>
                <Badge variant="secondary" className="mb-2 capitalize text-xs">
                  {pet.pet_type}
                </Badge>
                <div className="grid grid-cols-3 gap-2 text-xs items-center">
                  <div className="p-2 bg-brown-50 rounded-lg">
                    <p className="text-brown-500">Age</p>
                    <p className="font-medium text-brown-900">{calculateAge(pet.pet_birthday)}</p>
                  </div>
                  <div className="h-14 w-14 bg-brown-100 rounded-full mx-auto overflow-hidden flex items-center justify-center">
                    {pet.pet_image_url ? (
                      <img
                        src={pet.pet_image_url}
                        alt={pet.pet_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <PawPrint className="h-7 w-7 text-brown-300" />
                    )}
                  </div>
                  <div className="p-2 bg-brown-50 rounded-lg">
                    <p className="text-brown-500">Gender</p>
                    <p className="font-medium text-brown-900 capitalize">{pet.pet_gender || 'Unknown'}</p>
                  </div>
                  {pet.pet_weight_kg && (
                    <div className="p-2 bg-brown-50 rounded-lg col-span-3">
                      <p className="text-brown-500">Weight</p>
                      <p className="font-medium text-brown-900">{pet.pet_weight_kg} kg</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recommended Products Section */}
      {!loading && (
        <RecommendedProducts
          petTypes={petTypes}
          title="Recommended Products"
          subtitle={petTypes.length > 0 
            ? `Products perfect for your ${petTypes.join(' & ').toLowerCase()}` 
            : 'Products we think your pets will love'}
          limit={8}
          className="mt-12 border-t border-brown-200 pt-8"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this pet from your profile. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
