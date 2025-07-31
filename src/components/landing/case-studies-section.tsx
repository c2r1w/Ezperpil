
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { TrendingDown, TrendingUp, XCircle, CheckCircle } from 'lucide-react';

export interface CaseStudiesSectionProps {
  headline: string;
  paragraph: string;
  beforeImageUrl?: string; // No longer used, but kept for type safety
  afterImageUrl?: string; // No longer used, but kept for type safety
  beforeLabel?: string; // No longer used, but kept for type safety
  afterLabel?: string; // No longer used, but kept for type safety
}

const beforePoints = [
    "Baja conversión de leads",
    "Dificultad para explicar el valor",
    "Audiencia poco comprometida",
    "Ventas inconsistentes",
    "Falta de confianza del cliente"
];

const afterPoints = [
    "Conversión aumentada 300%",
    "Valor claramente comunicado",
    "Audiencia altamente comprometida",
    "Ventas predecibles y escalables",
    "Clientes que confían y compran"
];

export function CaseStudiesSection({ headline, paragraph }: CaseStudiesSectionProps) {
  return (
    <section id="antes-despues" className="py-12 lg:py-24 bg-background scroll-mt-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl text-foreground">{headline}</h2>
          <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl">
            {paragraph}
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Before Column */}
            <div className="space-y-4">
                <Card className="bg-[#2a1a2b] border-[#442c46] p-6 rounded-xl">
                    <CardContent className="p-0 space-y-4">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="bg-[#f97316] text-white rounded-full p-3">
                                <TrendingDown className="h-8 w-8" />
                            </div>
                            <h3 className="text-2xl font-semibold text-[#f87171]">ANTES del Webinar</h3>
                        </div>
                        <ul className="space-y-3 pt-4">
                            {beforePoints.map((point, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <XCircle className="h-5 w-5 text-[#f87171] shrink-0" />
                                    <span className="text-slate-300">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                <Card className="bg-[#1e293b]/50 border-[#334155] p-4 rounded-xl">
                     <blockquote className="text-center text-muted-foreground italic">
                        "Luchaba por convertir leads en clientes. Mis emails tenían baja apertura y las llamadas no funcionaban."
                        <footer className="mt-2 block font-semibold text-[#f87171] not-italic">- Pedro Sánchez, antes del webinar</footer>
                    </blockquote>
                </Card>
            </div>

            {/* After Column */}
            <div className="space-y-4">
                <Card className="bg-[#162a2d] border-[#2c4446] p-6 rounded-xl">
                    <CardContent className="p-0 space-y-4">
                         <div className="flex flex-col items-center gap-4 text-center">
                            <div className="bg-[#10b981] text-white rounded-full p-3">
                                <TrendingUp className="h-8 w-8" />
                            </div>
                            <h3 className="text-2xl font-semibold text-[#34d399]">DESPUÉS del Webinar</h3>
                        </div>
                         <ul className="space-y-3 pt-4">
                            {afterPoints.map((point, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-[#34d399] shrink-0" />
                                    <span className="text-slate-300">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                 <Card className="bg-[#1e293b]/50 border-[#334155] p-4 rounded-xl">
                     <blockquote className="text-center text-muted-foreground italic">
                        "Ahora mis webinars generan $50K mensuales consistentemente. La audiencia está comprometida y las ventas fluyen naturalmente."
                        <footer className="mt-2 block font-semibold text-[#34d399] not-italic">- Pedro Sánchez, después del webinar</footer>
                    </blockquote>
                </Card>
            </div>
        </div>
      </div>
    </section>
  );
}
