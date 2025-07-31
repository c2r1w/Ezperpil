
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { fetchBusinessPackages } from '@/lib/packages';

interface Plan {
    id: string;
    name: string;
    activation: string;
    monthly: string;
    description: string;
    features: string[];
    buttonText: string;
    popular: boolean;
    offer?: {
        text: string;
        buttonText: string;
    };
    paymentLink?: string;
    active: boolean;
}

const plans = [
    {
        id: "basic-plan-01",
        name: "Modificador de Consumo",
        activation: "$199",
        monthly: "$19.99/mes",
        description: "Perfecto para emprendedores",
        features: [
            "Acceso como consumidor",
            "Beneficios exclusivos de cliente",
            "Soporte al cliente",
            "Dashboard personal"
        ],
        buttonText: "Activar por $199",
        popular: false,
    },
    {
        id: "pro-plan-02",
        name: "Impulsor de Impacto",
        activation: "$325",
        monthly: "$34.99/mes",
        description: "Para equipos en crecimiento",
        features: [
            "Todo lo del plan anterior",
            "Sistema de afiliados",
            "Comisiones por referidos",
            "Herramientas de marketing",
            "Soporte prioritario"
        ],
        buttonText: "Activar por $325",
        popular: true,
    },
    {
        id: "enterprise-plan-03",
        name: "Acelerador de Visionarios",
        activation: "$475",
        monthly: "$54.99/mes",
        description: "Para grandes organizaciones",
        features: [
            "Todo lo del plan anterior",
            "Enfoque empresarial avanzado",
            "Funciones premium exclusivas",
            "Comisiones premium"
        ],
        buttonText: "Activar por $475",
        offer: {
            text: "Oferta especial: $235 pago único sin mensualidad",
            buttonText: "Oferta: $235 (pago único)"
        },
        popular: false,
    }
];

export function PricingSection() {
    const [packages, setPackages] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadPackages = async () => {
            try {
                const fetchedPackages = await fetchBusinessPackages();
                if (fetchedPackages && fetchedPackages.length > 0) {
                    setPackages(fetchedPackages);
                } else {
                    // Fallback to hardcoded plans if no packages from DB
                    setPackages(plans);
                }
            } catch (error) {
                console.error('Error loading packages:', error);
                setPackages(plans);
            } finally {
                setLoading(false);
            }
        };

        loadPackages();
    }, []);

    // Convert MongoDB packages to display format
    const displayPackages: Plan[] = packages.map(pkg => {
        const isEnterprise = pkg.name?.toLowerCase().includes('acelerador') || pkg.name?.toLowerCase().includes('visionarios');
        return {
            id: pkg._id || pkg.id,
            name: pkg.name,
            activation: `$${pkg.activationFee || pkg.price || 0}`,
            monthly: pkg.price ? `$${pkg.price}/mes` : '$0/mes',
            description: pkg.description || 'Plan de negocio',
            features: Array.isArray(pkg.features) ? pkg.features : ['Acceso completo al sistema'],
            buttonText: `Activar por $${pkg.activationFee || pkg.price || 0}`,
            popular: pkg.name?.toLowerCase().includes('impulsor') || pkg.name?.toLowerCase().includes('pro'),
            paymentLink: pkg.paymentLink,
            active: pkg.active !== false,
            offer: isEnterprise ? {
                text: "Oferta especial: $235 pago único sin mensualidad",
                buttonText: "Oferta: $235 (pago único)"
            } : undefined
        };
    }).filter(pkg => pkg.active);

    if (loading) {
        return (
            <section id="precios" className="py-12 lg:py-24 bg-gradient-to-b from-[#f8fafc] to-[#e0f2f1] scroll-mt-16">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl text-slate-900">
                            Planes Diseñados para Tu Crecimiento
                        </h2>
                        <p className="max-w-[700px] mx-auto text-slate-600 md:text-xl">
                            Desde emprendedores hasta grandes empresas, tenemos la solución perfecta
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </div>
            </section>
        );
    }
    return (
        <section id="precios" className="py-12 lg:py-24 bg-gradient-to-b from-[#f8fafc] to-[#e0f2f1] scroll-mt-16">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl md:text-5xl text-slate-900">
                        Planes Diseñados para Tu Crecimiento
                    </h2>
                    <p className="max-w-[700px] mx-auto text-slate-600 md:text-xl">
                        Desde emprendedores hasta grandes empresas, tenemos la solución perfecta
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {displayPackages.map((plan, index) => (
                        <Card key={index} className={`relative bg-white shadow-lg rounded-xl flex flex-col ${plan.popular ? 'border-2 border-primary' : 'border'}`}>
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                                    Más Popular
                                </div>
                            )}
                            <CardHeader className="text-center pt-8">
                                <CardTitle className="text-2xl font-bold text-slate-800">{plan.name}</CardTitle>
                                <div className="mt-4">
                                    <span className="text-5xl font-bold text-slate-900">{plan.activation.split(' ')[0]}</span>
                                    <span className="text-xl text-muted-foreground ml-1">activación</span>
                                </div>
                                <p className="text-lg text-muted-foreground">{plan.monthly}</p>
                                <CardDescription className="pt-2">{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow pt-4">
                                <ul className="space-y-4">
                                    {plan.features.map((feature: string, i: number) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <div className="bg-green-100 rounded-full p-1">
                                                <Check className="h-4 w-4 text-green-600"/>
                                            </div>
                                            <span className="text-slate-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                {plan.offer && (
                                    <div className="mt-6 bg-orange-100/70 border border-orange-200 text-orange-800 p-3 rounded-md text-center text-sm">
                                        {plan.offer.text}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-col gap-2 p-6 pt-4">
                                 <Button 
                                    asChild
                                    className={`w-full ${!plan.popular && !plan.offer ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : ''} ${plan.offer ? 'hidden' : ''}`}
                                    variant={plan.popular ? 'default' : 'secondary'}
                                >
                                    <Link href={`/register?package=${plan.id}`}>
                                        {plan.buttonText}
                                    </Link>
                                </Button>
                                {plan.offer && (
                                    <>
                                        <Button className="w-full bg-slate-200 text-slate-600 hover:bg-slate-300" disabled>
                                            {plan.buttonText}
                                        </Button>
                                        <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
                                            <Link href={`/register?package=${plan.id}`}>
                                                {plan.offer.buttonText}
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
