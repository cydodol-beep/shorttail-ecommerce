'use client';

import { RotateCcw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <RotateCcw className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-brown-900 mb-4">Returns & Refunds</h1>
          <p className="text-brown-600">
            Our hassle-free return policy ensures your satisfaction.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Return Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-brown-600 mb-4">
              We want you to be completely satisfied with your purchase. If you are not happy with your order, 
              you may return eligible items within 7 days of delivery.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle className="text-green-700">Eligible for Return</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-brown-600 space-y-2">
                <li>Unopened products in original packaging</li>
                <li>Defective or damaged items</li>
                <li>Wrong item received</li>
                <li>Items not matching description</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <XCircle className="h-8 w-8 text-red-600 mb-2" />
              <CardTitle className="text-red-700">Not Eligible for Return</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-brown-600 space-y-2">
                <li>Opened pet food or treats</li>
                <li>Used products</li>
                <li>Items without original packaging</li>
                <li>Items returned after 7 days</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How to Return</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside text-brown-600 space-y-3">
              <li>Contact our customer support via email or phone</li>
              <li>Provide your order number and reason for return</li>
              <li>Wait for return approval and shipping instructions</li>
              <li>Pack the item securely in its original packaging</li>
              <li>Ship the item to our return address</li>
              <li>Refund will be processed within 5-7 business days after we receive the item</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <AlertCircle className="h-8 w-8 text-amber-600 mb-2" />
            <CardTitle>Refund Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-brown-600 space-y-2">
              <li>Refunds are processed to the original payment method</li>
              <li>Bank transfers may take 3-5 business days to appear</li>
              <li>Shipping costs are non-refundable unless the return is due to our error</li>
              <li>Store credit option available for faster processing</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
