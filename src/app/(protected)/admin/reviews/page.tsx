'use client';

import { useState } from 'react';
import { 
  Star, 
  Search,
  Filter,
  Loader2,
  Check,
  X,
  Trash2,
  User,
  Package,
  MessageSquare,
  Calendar,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useReviews, approveReview, rejectReview, deleteReview, type Review } from '@/hooks/use-reviews';

export default function AdminReviewsPage() {
  useAuth();
  const { reviews, loading, refresh } = useReviews();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [processing, setProcessing] = useState(false);

  // Filter reviews
  const filteredReviews = reviews.filter((review: Review) => {
    const matchesSearch = 
      review.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && review.is_approved) ||
      (statusFilter === 'pending' && !review.is_approved);
    
    const matchesRating = ratingFilter === 'all' || 
      review.rating === parseInt(ratingFilter);
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  // Handle approve
  const handleApprove = async (review: Review) => {
    setProcessing(true);
    try {
      const success = await approveReview(review.id);
      if (success) {
        toast.success('Review approved successfully');
        refresh();
      } else {
        toast.error('Failed to approve review');
      }
    } catch (err) {
      console.error('Error approving review:', err);
      toast.error('Failed to approve review');
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async (review: Review) => {
    setProcessing(true);
    try {
      const success = await rejectReview(review.id);
      if (success) {
        toast.success('Review rejected');
        refresh();
      } else {
        toast.error('Failed to reject review');
      }
    } catch (err) {
      console.error('Error rejecting review:', err);
      toast.error('Failed to reject review');
    } finally {
      setProcessing(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedReview) return;

    setProcessing(true);
    try {
      const success = await deleteReview(selectedReview.id);
      if (success) {
        toast.success('Review deleted successfully');
        setDeleteOpen(false);
        refresh();
      } else {
        toast.error('Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      toast.error('Failed to delete review');
    } finally {
      setProcessing(false);
    }
  };

  // Render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate stats
  const totalReviews = reviews.length;
  const approvedReviews = reviews.filter(r => r.is_approved).length;
  const pendingReviews = reviews.filter(r => !r.is_approved).length;
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Reviews & Ratings</h1>
          <p className="text-brown-600 mt-1">Moderate and manage product reviews</p>
        </div>
        <Button onClick={refresh} disabled={loading}>
          <Star className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">{totalReviews}</p>
                <p className="text-xs text-brown-600">Total Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-800">
                <ThumbsUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">{approvedReviews}</p>
                <p className="text-xs text-brown-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 text-yellow-800">
                <ThumbsDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">{pendingReviews}</p>
                <p className="text-xs text-brown-600">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-800">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">{averageRating}</p>
                <p className="text-xs text-brown-600">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>Approve, reject, or delete customer reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brown-400" />
              <Input
                placeholder="Search by user, product, or comment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]" suppressHydrationWarning>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full md:w-[150px]" suppressHydrationWarning>
                <Star className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-brown-300 mx-auto mb-3" />
              <p className="text-brown-600">No reviews found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review: Review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-brown-100 rounded-full">
                            <User className="h-3.5 w-3.5 text-brown-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{review.user_name || 'Unknown'}</p>
                            <p className="text-xs text-brown-500">{review.user_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-brown-400" />
                          <span className="text-sm">{review.product_name || 'Unknown Product'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderStars(review.rating)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {review.comment ? (
                          <p className="text-sm text-brown-700 line-clamp-2">
                            {review.comment}
                          </p>
                        ) : (
                          <span className="text-sm text-brown-400 italic">No comment</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-brown-600">
                          <Calendar className="h-3 w-3" />
                          {formatDate(review.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={review.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {review.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReview(review);
                              setViewOpen(true);
                            }}
                            title="View details"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          {!review.is_approved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(review)}
                              disabled={processing}
                              title="Approve"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {review.is_approved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(review)}
                              disabled={processing}
                              title="Reject"
                            >
                              <X className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReview(review);
                              setDeleteOpen(true);
                            }}
                            disabled={processing}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Review Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>
              Complete review information
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-brown-900">User</p>
                  <p className="text-sm text-brown-600">{selectedReview.user_name || 'Unknown'}</p>
                  <p className="text-xs text-brown-500">{selectedReview.user_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-brown-900">Product</p>
                  <p className="text-sm text-brown-600">{selectedReview.product_name || 'Unknown Product'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-brown-900 mb-2">Rating</p>
                <div className="flex items-center gap-2">
                  {renderStars(selectedReview.rating)}
                  <span className="text-sm font-semibold">{selectedReview.rating}/5</span>
                </div>
              </div>

              {selectedReview.comment && (
                <div>
                  <p className="text-sm font-medium text-brown-900 mb-2">Comment</p>
                  <div className="p-4 bg-brown-50 rounded-lg">
                    <p className="text-sm text-brown-700">{selectedReview.comment}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-brown-900">Status</p>
                  <Badge className={selectedReview.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {selectedReview.is_approved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-brown-900">Submitted</p>
                  <p className="text-sm text-brown-600">{formatDate(selectedReview.created_at)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                {!selectedReview.is_approved ? (
                  <Button 
                    onClick={() => {
                      handleApprove(selectedReview);
                      setViewOpen(false);
                    }}
                    disabled={processing}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Review
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      handleReject(selectedReview);
                      setViewOpen(false);
                    }}
                    disabled={processing}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Review
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    setViewOpen(false);
                    setDeleteOpen(true);
                  }}
                  disabled={processing}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
