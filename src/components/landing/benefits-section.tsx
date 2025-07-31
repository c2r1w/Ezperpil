"use client";

import React from 'react';
import Image from 'next/image';
import { Video, LayoutTemplate, BarChart3, ShieldCheck } from 'lucide-react';

interface Benefit {
  title: string;
  description: string;
}

export interface BenefitsSectionProps {
  headline: string;
  paragraph: string;
  benefits: Benefit[];
}

const icons = [Video, LayoutTemplate, BarChart3];

export function BenefitsSection({ headline, paragraph, benefits }: BenefitsSectionProps) {
  return (
    <section className="py-12 lg:py-24 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-2xl">
            <Image 
                src="https://placehold.co/600x450.png" 
                alt="Platform dashboard" 
                fill
                className="object-cover"
                data-ai-hint="dashboard interface"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">{headline}</h2>
            <p className="mt-4 text-muted-foreground md:text-xl">
              {paragraph}
            </p>
            <ul className="mt-8 space-y-6">
              {benefits.map((benefit, index) => {
                const Icon = icons[index] || ShieldCheck;
                return (
                  <li key={index} className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground rounded-full p-2 flex-shrink-0 mt-1">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
