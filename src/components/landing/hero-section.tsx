
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Rocket, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface HeroSectionProps {
  headline?: string;
  paragraph?: string;
  backgroundImageUrl?: string;
  ctaButton1Text?: string;
  ctaButton2Text?: string;
  onRegisterClick: () => void;
}

export function HeroSection({ headline, paragraph, ctaButton1Text, ctaButton2Text, onRegisterClick }: HeroSectionProps) {
  return (
    <section 
        className="relative w-full h-[75vh] min-h-[500px] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{ background: 'linear-gradient(45deg, #4c1d95, #1e1b4b)' }}
    >
      <div className="relative z-10 container mx-auto px-4 md:px-6 space-y-6">
        <Badge variant="secondary" className="bg-white/10 text-primary-foreground border-primary/30">
          <Rocket className="h-4 w-4 mr-2"/>
          Plataforma #1 en Webinars
        </Badge>
        <h1 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl md:text-6xl text-balance">
          {headline || "Transforma Tu Negocio con Webinars de Alto Impacto"}
        </h1>
        <p className="max-w-[700px] mx-auto text-lg text-slate-200 md:text-xl text-balance">
          {paragraph || "Crea, gestiona y monetiza webinars profesionales que convierten audiencias en clientes leales"}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-white/20 hover:bg-white/30" onClick={onRegisterClick}>
              {ctaButton1Text || "Únete al Webinar"}
              <ArrowRight className="h-4 w-4 ml-2"/>
          </Button>
          <Button size="lg" variant="ghost" className="bg-transparent hover:bg-white/10 border-white/50 border" asChild>
             <Link href="/login">
                {ctaButton2Text || "Iniciar Sesión"}
             </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
