
"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function BusinessFormSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formData, setFormData] = useState({
    businessAge: '',
    phone: '',
    challenge: '',
    improvement: '',
    fullName: '',
    email: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    // Map HTML IDs to state field names
    const fieldMapping: { [key: string]: string } = {
      'business-age': 'businessAge',
      'phone': 'phone',
      'challenge': 'challenge',
      'improvement': 'improvement',
      'full-name': 'fullName',
      'email': 'email'
    };
    
    const fieldName = fieldMapping[id] || id;
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/send-business-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          to: 'ezperfilagency@gmail.com'
        }),
      });

      if (response.ok) {
        setShowSuccessDialog(true);
        setFormData({
          businessAge: '',
          phone: '',
          challenge: '',
          improvement: '',
          fullName: '',
          email: ''
        });
      } else {
        throw new Error('Failed to send form');
      }
    } catch (error) {
      console.error('Error sending form:', error);
      alert('Error al enviar el formulario. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="contacto" className="py-12 lg:py-24 scroll-mt-16" style={{ backgroundColor: '#f0fdf4' }}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl text-slate-900">
            Ayúdanos a entender tu negocio
          </h2>
          <p className="max-w-[700px] mx-auto text-slate-600 md:text-xl">
            Comparte tus desafíos y objetivos para que podamos ofrecerte soluciones personalizadas
          </p>
        </div>
        
        <Card className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl">
            <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="business-age">¿Cuánto tiempo llevas en tu negocio?</Label>
                            <Input 
                              id="business-age" 
                              placeholder="Ej. 2 años" 
                              className="bg-slate-50 text-black placeholder:text-gray-500"
                              value={formData.businessAge}
                              onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="phone">Número de teléfono (opcional)</Label>
                             <Input 
                               id="phone" 
                               placeholder="+1 (555) 123-4567" 
                               className="bg-slate-50 text-black placeholder:text-gray-500"
                               value={formData.phone}
                               onChange={handleInputChange}
                             />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="challenge">¿Cuál ha sido el reto más grande para establecer tu negocio?</Label>
                        <Textarea 
                          id="challenge" 
                          placeholder="Describe tu mayor desafío..." 
                          className="bg-slate-50 text-black placeholder:text-gray-500"
                          value={formData.challenge}
                          onChange={handleInputChange}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="improvement">¿En qué área crees que necesitas mejorar?</Label>
                        <Textarea 
                          id="improvement" 
                          placeholder="Describe las áreas que quieres mejorar..." 
                          className="bg-slate-50 text-black placeholder:text-gray-500"
                          value={formData.improvement}
                          onChange={handleInputChange}
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label htmlFor="full-name">Nombre completo *</Label>
                            <Input 
                              id="full-name" 
                              placeholder="Tu nombre completo" 
                              required 
                              className="bg-slate-50 text-black placeholder:text-gray-500"
                              value={formData.fullName}
                              onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico *</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              placeholder="tu@email.com" 
                              required 
                              className="bg-slate-50 text-black placeholder:text-gray-500"
                              value={formData.email}
                              onChange={handleInputChange}
                            />
                        </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50"
                      disabled={isLoading}
                    >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Enviando...
                          </div>
                        ) : (
                          'Enviar'
                        )}
                    </Button>
                    <p className="text-xs text-center text-slate-500">
                        Al enviar este formulario, aceptas nuestra política de privacidad y términos de servicio.
                    </p>
                </form>
            </CardContent>
        </Card>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <DialogTitle className="text-2xl font-bold text-green-700">
                ¡Formulario Enviado!
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Gracias por compartir la información de tu negocio. Hemos recibido tu mensaje y nos pondremos en contacto contigo pronto para ayudarte a alcanzar tus objetivos.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center mt-6">
              <Button 
                onClick={() => setShowSuccessDialog(false)}
                className="bg-green-500 hover:bg-green-600 px-8"
              >
                Perfecto
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </section>
  );
}
