'use client';

import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <FileText className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-brown-900 mb-4">Terms of Service</h1>
          <p className="text-brown-600">
            Last updated: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="text-brown-600">
              <p>
                By accessing and using ShortTail.id, you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Account Registration</CardTitle>
            </CardHeader>
            <CardContent className="text-brown-600 space-y-4">
              <ul className="list-disc list-inside space-y-2">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must be at least 18 years old to create an account</li>
                <li>One person may not maintain more than one account</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Orders and Payment</CardTitle>
            </CardHeader>
            <CardContent className="text-brown-600 space-y-4">
              <ul className="list-disc list-inside space-y-2">
                <li>All prices are listed in Indonesian Rupiah (IDR)</li>
                <li>We reserve the right to refuse or cancel any order</li>
                <li>Payment must be completed before order processing</li>
                <li>Prices are subject to change without notice</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Shipping and Delivery</CardTitle>
            </CardHeader>
            <CardContent className="text-brown-600">
              <p>
                Delivery times are estimates and may vary. We are not responsible for delays 
                caused by shipping carriers or circumstances beyond our control. Risk of loss 
                transfers to you upon delivery to the carrier.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Returns and Refunds</CardTitle>
            </CardHeader>
            <CardContent className="text-brown-600">
              <p>
                Returns and refunds are subject to our Return Policy. Please review our 
                Returns & Refunds page for detailed information on eligibility and procedures.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Product Information</CardTitle>
            </CardHeader>
            <CardContent className="text-brown-600">
              <p>
                We strive to provide accurate product descriptions and images. However, we do not 
                warrant that product descriptions or other content is accurate, complete, or error-free. 
                Colors may vary depending on your display settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="text-brown-600">
              <p>
                To the maximum extent permitted by law, ShortTail.id shall not be liable for any 
                indirect, incidental, special, consequential, or punitive damages arising from your 
                use of our services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="text-brown-600">
              <p>
                We reserve the right to modify these terms at any time. Changes will be effective 
                immediately upon posting. Your continued use of our services constitutes acceptance 
                of the modified terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-brown-600">
              <p>
                For questions about these Terms of Service, please contact us through our Help Center.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
