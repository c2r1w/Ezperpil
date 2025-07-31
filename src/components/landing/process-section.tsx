
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, CheckCircle, Bell, Video, Target, Icon } from 'lucide-react';

export interface ProcessSectionProps {
  headline: string;
  paragraph: string;
}

const processSteps = [
  {
    icon: UserPlus,
    title: "1. Registro",
    description: "Formulario simple y rápido para capturar leads interesados",
    iconColor: "text-blue-400",
    bgColor: "bg-blue-500",
  },
  {
    icon: CheckCircle,
    title: "2. Confirmación",
    description: "Email automático con detalles del evento y acceso",
    iconColor: "text-purple-400",
    bgColor: "bg-purple-500",
  },
  {
    icon: Bell,
    title: "3. Recordatorio",
    description: "Notificaciones previas para maximizar asistencia",
    iconColor: "text-orange-400",
    bgColor: "bg-orange-500",
  },
  {
    icon: Video,
    title: "4. Participación",
    description: "Experiencia interactiva en vivo con Q&A",
    iconColor: "text-green-400",
    bgColor: "bg-green-500",
  },
  {
    icon: Target,
    title: "5. Conversión",
    description: "Llamada a la acción clara para generar ventas",
    iconColor: "text-red-400",
    bgColor: "bg-red-500",
  },
];

export function ProcessSection({ headline, paragraph }: ProcessSectionProps) {
  return (
    <section id="proceso" className="py-12 lg:py-24 bg-gradient-to-b from-[#1e1b4b] to-[#4c1d95] scroll-mt-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl text-white">
            {headline}
          </h2>
          <p className="max-w-[700px] mx-auto text-slate-300 md:text-xl">
            {paragraph}
          </p>
        </div>
        
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 -translate-y-1/2">
             <div className="w-full h-full bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm text-center transform hover:-translate-y-2 transition-transform duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      <div className={`p-4 rounded-full ${step.bgColor} shadow-lg shadow-black/30`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-slate-400 text-sm">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
