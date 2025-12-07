'use client';

import { Truck, Clock, MapPin, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShippingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Truck className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-brown-900 mb-4">Shipping Information</h1>
          <p className="text-brown-600">
            Learn about our shipping options, delivery times, and coverage areas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Standard Shipping</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brown-600 mb-2">2-5 business days</p>
              <p className="text-sm text-brown-500">Free for orders above Rp 200.000</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Truck className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Express Shipping</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brown-600 mb-2">1-2 business days</p>
              <p className="text-sm text-brown-500">Additional fee applies</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <MapPin className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Coverage Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-brown-600 mb-4">
              We ship to all major cities and regions across Indonesia. Delivery times may vary based on your location.
            </p>
            <ul className="list-disc list-inside text-brown-600 space-y-2">
              <li>Jabodetabek: 1-2 days</li>
              <li>Java: 2-3 days</li>
              <li>Sumatra, Bali, Kalimantan: 3-4 days</li>
              <li>Sulawesi, Papua, other regions: 4-7 days</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Package className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Order Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-brown-600 space-y-2">
              <li>Orders placed before 2 PM will be processed the same day</li>
              <li>Orders placed after 2 PM will be processed the next business day</li>
              <li>You will receive a tracking number via email once your order is shipped</li>
              <li>Track your order status in your account dashboard</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
