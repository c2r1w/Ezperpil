
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Lightbulb, TrendingUp, Users, UserCheck, ArrowRight } from 'lucide-react';

export interface IncentivesSectionProps {
  headline: string;
  paragraph: string;
}

const results = [
    {
        icon: TrendingUp,
        title: "+300% de asistencia",
        description: "Incremento promedio en la participación de webinars"
    },
    {
        icon: Users,
        title: "Mayor compromiso",
        description: "Participantes más activos durante todo el evento"
    },
    {
        icon: UserCheck,
        title: "Incentivos personalizados",
        description: "Adaptados a las necesidades específicas de tu audiencia"
    }
];

export function IncentivesSection({ headline, paragraph }: IncentivesSectionProps) {
  return (
    <section id="incentivos" className="py-12 lg:py-24 bg-white scroll-mt-16">
      <div className="container mx-auto px-4 md:px-6">
        <Card className="grid lg:grid-cols-2 overflow-hidden shadow-2xl border-none">
          {/* Left Column (Purple Gradient) */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-8 md:p-12 flex flex-col justify-center">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full">
                        <Gift className="h-6 w-6"/>
                    </div>
                    <h2 className="text-3xl font-bold font-headline tracking-tighter">
                        {headline}
                    </h2>
                </div>
              <p className="text-lg text-purple-200">
                {paragraph}
              </p>
              <div className="bg-white/10 border border-white/20 rounded-lg p-4 flex items-start gap-4">
                <Lightbulb className="h-5 w-5 text-yellow-300 mt-1 shrink-0"/>
                <p className="text-purple-200">
                  Con recompensas estratégicas y beneficios irresistibles, verás cómo se incrementa el número de participantes de forma natural y efectiva.
                </p>
              </div>
              <p className="text-xl font-semibold">
                Haz que tu próxima presentación sea inolvidable... ¡e inigualable!
              </p>
              <Button size="lg" className="bg-white text-primary hover:bg-slate-200 w-fit">
                Activa tus incentivos ahora
                <ArrowRight className="ml-2 h-4 w-4"/>
              </Button>
            </div>
          </div>
          
          {/* Right Column (White) */}
          <div className="bg-white text-slate-800 p-8 md:p-12">
            <div className="space-y-8">
              <h3 className="text-2xl font-bold">Resultados que hablan por sí mismos</h3>
              <ul className="space-y-6">
                {results.map((result, index) => {
                    const Icon = result.icon;
                    return(
                        <li key={index} className="flex items-start gap-4">
                            <div className="bg-primary/10 text-primary rounded-full p-3 flex-shrink-0">
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-lg text-slate-900">{result.title}</h4>
                                <p className="text-slate-600">{result.description}</p>
                            </div>
                        </li>
                    )
                })}
              </ul>
              <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
                <blockquote className="text-slate-600 italic">
                  "Implementamos el plan de incentivos y duplicamos nuestra tasa de conversión en el primer webinar. La mejor inversión que hemos hecho."
                  <footer className="mt-2 block font-semibold text-slate-800 not-italic">- María Rodríguez, CEO de Marketing Digital</footer>
                </blockquote>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
