
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface SubscriptionSectionProps {
  headline: string;
  paragraph: string;
}

export function SubscriptionSection({ headline, paragraph }: SubscriptionSectionProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-[#1e1b4b] to-[#4c1d95]">
      <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold font-headline tracking-tighter md:text-4xl/tight text-white">
            {headline}
          </h2>
          <p className="mx-auto max-w-[600px] text-slate-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            {paragraph}
          </p>
        </div>
        <div className="mx-auto w-full max-w-sm space-y-4">
          <form className="flex space-x-2" onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="Ingresa tu correo electrónico"
              className="max-w-lg flex-1 bg-white/10 border-slate-500 text-white placeholder:text-slate-400"
              aria-label="Email"
            />
            <Button type="submit" className="bg-white text-primary hover:bg-slate-200">
              Suscribirme
            </Button>
          </form>
          <div className="flex items-center space-x-2 justify-center">
            <Checkbox id="terms-sub" className="border-slate-400" />
            <Label htmlFor="terms-sub" className="text-xs text-slate-400">
              Acepto recibir comunicaciones de marketing de EZ Perfil Webinars.
            </Label>
          </div>
        </div>
      </div>
    </section>
  );
}
