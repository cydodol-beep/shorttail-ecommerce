'use client';

import { useState } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  FolderOpen,
  Loader2,
  GripVertical,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ImageUpload } from '@/components/ui/image-upload';
import { 
  useCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  type Category 
} from '@/hooks/use-categories';

export default function CategoriesPage() {
  const { categories, loading, refresh } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true,
  });
  const [generatingIcon, setGeneratingIcon] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const generateAIIcon = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a category name first');
      return;
    }

    setGeneratingIcon(true);
    
    try {
      const response = await fetch('/api/ai/generate-category-icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryName: formData.name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate icon');
      }

      setFormData({ ...formData, image_url: data.imageUrl });
      toast.success('Icon generated successfully!');
    } catch (error) {
      console.error('Error generating icon:', error);
      toast.error('Failed to generate icon');
    } finally {
      setGeneratingIcon(false);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingCategory ? formData.slug : generateSlug(name),
    });
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      is_active: category.is_active,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Category slug is required');
      return;
    }

    // Check for duplicate slug
    const duplicateSlug = categories.find(
      (c) => c.slug === formData.slug && c.id !== editingCategory?.id
    );
    if (duplicateSlug) {
      toast.error('A category with this slug already exists');
      return;
    }

    setSaving(true);

    if (editingCategory) {
      // Update existing
      const { error } = await updateCategory(editingCategory.id, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
      });
      
      if (error) {
        toast.error('Failed to update category');
      } else {
        toast.success('Category updated successfully');
        setDialogOpen(false);
      }
    } else {
      // Add new
      const { error } = await createCategory({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        sort_order: categories.length + 1,
      });
      
      if (error) {
        toast.error('Failed to create category');
      } else {
        toast.success('Category added successfully');
        setDialogOpen(false);
      }
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    const { error } = await deleteCategory(deletingCategory.id);
    
    if (error) {
      toast.error('Failed to delete category');
    } else {
      toast.success('Category deleted successfully');
    }
    
    setDeleteDialogOpen(false);
    setDeletingCategory(null);
  };

  const handleToggleActive = async (category: Category) => {
    const { error } = await updateCategory(category.id, { 
      is_active: !category.is_active 
    });
    
    if (error) {
      toast.error('Failed to update category');
    } else {
      toast.success(`Category ${!category.is_active ? 'activated' : 'deactivated'}`);
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const currentCategory = categories[index];
    const swapCategory = categories[newIndex];

    // Swap sort_order values
    await updateCategory(currentCategory.id, { sort_order: swapCategory.sort_order });
    await updateCategory(swapCategory.id, { sort_order: currentCategory.sort_order });
    
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Categories</h1>
          <p className="text-brown-600">Manage product categories</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card className="border-brown-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-brown-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brown-900 mb-2">No categories yet</h3>
              <p className="text-brown-600 mb-4">Create your first product category</p>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category, index) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveCategory(index, 'up')}
                          disabled={index === 0}
                        >
                          <GripVertical className="h-4 w-4 rotate-90" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-brown-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {category.image_url ? (
                            <img
                              src={category.image_url}
                              alt={category.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FolderOpen className="h-5 w-5 text-brown-400" />
                          )}
                        </div>
                        <span className="font-medium text-brown-900">{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-brown-100 px-2 py-1 rounded">
                        {category.slug}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-brown-600">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={category.is_active}
                          onCheckedChange={() => handleToggleActive(category)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category details below.'
                : 'Create a new product category.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Dog Food"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., dog-food"
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs: /products?category={formData.slug || 'slug'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the category"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category Icon</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateAIIcon}
                  disabled={generatingIcon || !formData.name.trim()}
                  className="gap-1.5 h-7 text-xs"
                >
                  {generatingIcon ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  {generatingIcon ? 'Generating...' : 'AI Generate'}
                </Button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-lg border-2 border-dashed border-brown-200 bg-brown-50 flex items-center justify-center overflow-hidden">
                    {formData.image_url ? (
                      <img
                        src={formData.image_url}
                        alt="Category icon"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Sparkles className="h-5 w-5 text-brown-300" />
                    )}
                  </div>
                </div>
                <div className="w-12 h-12">
                  <ImageUpload
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    aspectRatio="square"
                    placeholder=""
                  />
                </div>
                {formData.image_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-7 text-xs"
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Visible to customers</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingCategory?.name}&quot;? 
              This action cannot be undone. Products in this category will not be deleted 
              but will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
