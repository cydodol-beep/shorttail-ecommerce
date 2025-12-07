'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Loader2, Upload, X } from 'lucide-react';
import { StoreLogo } from '@/components/ui/store-logo';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';

const petSchema = z.object({
  pet_name: z.string().min(1, 'Pet name is required'),
  pet_type: z.string().min(1, 'Pet type is required'),
  pet_birthday: z.string().optional(),
  pet_gender: z.string().optional(),
  pet_weight_kg: z.number().optional(),
  pet_chip_id: z.string().optional(),
  pet_image_url: z.string().optional(),
});

type PetForm = z.infer<typeof petSchema>;

const petTypes = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'fish', label: 'Fish' },
  { value: 'hamster', label: 'Hamster' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'other', label: 'Other' },
];

export default function NewPetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<PetForm>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      pet_name: '',
      pet_type: '',
      pet_birthday: '',
      pet_gender: '',
      pet_weight_kg: undefined,
      pet_chip_id: '',
      pet_image_url: '',
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Create image element to load the file
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.src = event.target?.result as string;
      };

      img.onload = () => {
        try {
          // Create canvas for WebP conversion
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            toast.error('Failed to process image');
            setUploadingImage(false);
            return;
          }

          // Resize to max 600x600 while maintaining aspect ratio
          const maxSize = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP with quality 0.8
          const webpDataUrl = canvas.toDataURL('image/webp', 0.8);

          // Set the WebP data URL in the form
          form.setValue('pet_image_url', webpDataUrl);
          setImagePreview(webpDataUrl);
          toast.success('Image uploaded successfully');
        } catch (err) {
          console.error('Exception processing image:', err);
          toast.error('Failed to process image');
        } finally {
          setUploadingImage(false);
        }
      };

      img.onerror = () => {
        toast.error('Failed to load image');
        setUploadingImage(false);
      };

      reader.onerror = () => {
        toast.error('Failed to read image file');
        setUploadingImage(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Exception handling image upload:', err);
      toast.error('Failed to upload image');
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    form.setValue('pet_image_url', '');
    setImagePreview(null);
  };

  const onSubmit = async (data: PetForm) => {
    if (!user) {
      toast.error('Please login to continue');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from('pets').insert({
      owner_id: user.id,
      pet_name: data.pet_name,
      pet_type: data.pet_type,
      pet_birthday: data.pet_birthday || null,
      pet_gender: data.pet_gender || null,
      pet_weight_kg: data.pet_weight_kg || null,
      pet_chip_id: data.pet_chip_id || null,
      pet_image_url: data.pet_image_url || null,
    });

    if (error) {
      toast.error('Failed to add pet');
      setLoading(false);
      return;
    }

    toast.success('Pet added successfully!');
    router.push('/dashboard/pets');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.back()}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="border-brown-200">
        <CardHeader className="text-center">
          <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
            <div className="w-8 h-8">
              <StoreLogo className="w-full h-full" iconClassName="h-8 w-8 text-primary" fallbackSize="lg" />
            </div>
          </div>
          <CardTitle>Add New Pet</CardTitle>
          <CardDescription>
            Tell us about your furry friend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pet_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pet Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Buddy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pet_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pet Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {petTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pet_birthday"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birthday (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pet_gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pet_weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight in kg (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="5.5"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pet_chip_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Microchip ID (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="pet_image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pet Photo (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Pet preview"
                              className="w-full h-48 object-cover rounded-lg border-2 border-brown-200"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={removeImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label
                            htmlFor="pet-image-upload"
                            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-brown-300 rounded-lg cursor-pointer hover:bg-brown-50 transition-colors"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {uploadingImage ? (
                                <Loader2 className="h-10 w-10 text-brown-400 animate-spin mb-3" />
                              ) : (
                                <Upload className="h-10 w-10 text-brown-400 mb-3" />
                              )}
                              <p className="mb-2 text-sm text-brown-600">
                                <span className="font-semibold">Click to upload</span> pet photo
                              </p>
                              <p className="text-xs text-brown-500">
                                PNG, JPG, GIF (max 2MB)
                              </p>
                            </div>
                            <input
                              id="pet-image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                          </label>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Pet
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
