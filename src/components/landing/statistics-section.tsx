
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Video, LayoutTemplate, BarChart3, ShieldCheck } from 'lucide-react';

interface Benefit {
  title: string;
  description: string;
}

export interface StatisticsSectionProps {
  headline: string;
  paragraph: string;
  benefits: Benefit[];
  imageUrl: string; // This prop is no longer used but kept for compatibility
}

const icons = [Video, LayoutTemplate, BarChart3];

export function StatisticsSection({ headline, paragraph, benefits }: StatisticsSectionProps) {
  return (
    <section className="py-12 lg:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl">{headline}</h2>
          <p className="max-w-[800px] mx-auto text-muted-foreground md:text-xl">
            {paragraph}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {(benefits || []).map((benefit, index) => {
            const Icon = icons[index] || ShieldCheck;
            return (
              <Card key={index} className="bg-card border-border/50 flex flex-col text-center p-6">
                <CardContent className="flex flex-col items-center gap-4 p-0">
                  <div className="bg-primary/10 text-primary rounded-full p-4">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
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
