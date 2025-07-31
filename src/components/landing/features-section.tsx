
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Users, BarChart3, Zap } from 'lucide-react';

export interface FeaturesSectionProps {
  headline: string;
  paragraph: string;
}

const features = [
  {
    icon: Video,
    title: "Webinars en Vivo",
    description: "Transmisiones interactivas con Q&A en tiempo real"
  },
  {
    icon: Users,
    title: "Gestión de Audiencia",
    description: "Herramientas avanzadas para engagement y conversión"
  },
  {
    icon: BarChart3,
    title: "Analytics Detallados",
    description: "Métricas completas de asistencia y conversión"
  },
  {
    icon: Zap,
    title: "Automatización",
    description: "Secuencias automáticas de email y seguimiento"
  }
];

export function FeaturesSection({ headline, paragraph }: FeaturesSectionProps) {
  return (
    <section id="features" className="py-12 lg:py-24 bg-white scroll-mt-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl text-slate-900">{headline}</h2>
          <p className="max-w-[800px] mx-auto text-slate-600 md:text-xl">
            {paragraph}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="bg-white text-slate-800 border-slate-200 flex flex-col text-center items-center p-6 shadow-sm">
                <CardContent className="flex flex-col items-center gap-4 p-0">
                  <div className="bg-purple-100 text-purple-600 rounded-lg p-4">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-slate-500">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
