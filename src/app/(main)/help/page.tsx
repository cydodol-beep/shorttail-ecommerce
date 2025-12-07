'use client';

import { HelpCircle, Mail, Phone, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStoreSettings } from '@/hooks/use-store-settings';

export default function HelpPage() {
  const { settings } = useStoreSettings();

  const faqs = [
    {
      question: 'How do I track my order?',
      answer: 'Once your order is shipped, you will receive an email with a tracking number. You can also check your order status in your account dashboard.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept bank transfer, credit/debit cards, and various e-wallet options including GoPay, OVO, and Dana.',
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 2-5 business days depending on your location. Express shipping is available for faster delivery.',
    },
    {
      question: 'Can I return or exchange products?',
      answer: 'Yes, we offer returns and exchanges within 7 days of delivery for unused products in original packaging. Please visit our Returns page for more details.',
    },
    {
      question: 'Are your products authentic?',
      answer: 'Yes, all our products are 100% authentic and sourced directly from authorized distributors and manufacturers.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <HelpCircle className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-brown-900 mb-4">Help Center</h1>
          <p className="text-brown-600">
            Find answers to common questions or get in touch with our support team.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center">
              <Mail className="h-8 w-8 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Email Support</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-brown-600 text-sm">{settings?.storeEmail || 'support@shorttail.id'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Phone className="h-8 w-8 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Phone Support</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-brown-600 text-sm">{settings?.storePhone || '+62 812 3456 7890'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <MessageCircle className="h-8 w-8 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Live Chat</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-brown-600 text-sm">Available 9 AM - 9 PM</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold text-brown-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brown-600">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
