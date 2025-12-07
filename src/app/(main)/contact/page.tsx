'use client';

import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStoreSettings } from '@/hooks/use-store-settings';

export default function ContactPage() {
  const { settings } = useStoreSettings();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Mail className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-brown-900 mb-4">Contact Us</h1>
          <p className="text-brown-600">
            We would love to hear from you. Get in touch with our team.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Mail className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brown-600">{settings?.storeEmail || 'support@shorttail.id'}</p>
              <p className="text-sm text-brown-500 mt-2">We reply within 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Phone className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Phone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brown-600">{settings?.storePhone || '+62 812 3456 7890'}</p>
              <p className="text-sm text-brown-500 mt-2">Mon-Sat, 9 AM - 9 PM</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brown-600">
                {settings?.storeAddress || 'Jl. Pet Lovers No. 123'}
              </p>
              <p className="text-brown-600">
                {settings?.storeCity || 'Jakarta'}, {settings?.storeProvince || 'DKI Jakarta'}
              </p>
              <p className="text-brown-600">{settings?.storePostalCode || '12345'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brown-600">Monday - Friday: 9 AM - 9 PM</p>
              <p className="text-brown-600">Saturday: 10 AM - 6 PM</p>
              <p className="text-brown-600">Sunday: Closed</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
