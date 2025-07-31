
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "María González",
    title: "CEO, TechStart",
    quote: "Aumentamos nuestras ventas en un 300% después de implementar webinars regulares.",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=120&h=120&facepad=2",
    initials: "MG"
  },
  {
    name: "Julie Martinez",
    title: "Marketing Director",
    quote: "La plataforma más completa que he usado. El ROI es impresionante.",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=1200&h=1200&facepad=2",
    initials: "CR"
  },
  {
    name: "Ana Martínez",
    title: "Consultora",
    quote: "Mis webinars ahora tienen 85% de asistencia. Los resultados hablan por sí solos.",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=1200&h=120&facepad=2",
    initials: "AM"
  }
];

export function TestimonialsSection() {
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
  
    setLoading(true);
  

  }, [])
  
  return (
   (loading&& <section id="testimonios" className="py-12 lg:py-24 bg-slate-100 scroll-mt-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl text-slate-900">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="max-w-[700px] mx-auto text-slate-600 md:text-xl">
            Resultados reales de empresarios que transformaron sus negocios
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-transparent border-none shadow-none text-center">
              <CardContent className="p-0 flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-4 border-2 border-primary/20">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint="person portrait" />
                  <AvatarFallback>{testimonial.initials}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold text-slate-900">{testimonial.name}</h3>
                <p className="text-sm text-slate-500 mb-2">{testimonial.title}</p>
                <div className="flex justify-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-slate-700 italic">
                  "{testimonial.quote}"
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>)
  );
}
