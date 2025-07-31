
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, ListChecks, Radio, UserPlus, LogIn, Loader2, Video, Maximize, Ticket, UserCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export type Testimonial = {
  id: number;
  name: string;
  problem: string;
  solution: string;
  personAvatarUrl: string;
  personAvatarFile: File | null;
  beforeImageUrl: string;
  beforeImageFile: File | null;
  afterImageUrl: string;
  afterImageFile: File | null;
};

const newVisitorSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  phoneNumber: z.string().min(10, 'Número de teléfono inválido').optional().or(z.literal('')),
  inviter: z.string(),
});
type NewVisitorFormValues = z.infer<typeof newVisitorSchema>;

const existingMemberSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es requerido'),
  phoneNumber: z.string().min(10, 'Número de teléfono inválido'),
  inviter: z.string(),
});
type ExistingMemberFormValues = z.infer<typeof existingMemberSchema>;

interface RegistrationModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    inviterUsername: string;
}

function RegistrationModal({ isOpen, onOpenChange, inviterUsername }: RegistrationModalProps) {
    const { toast } = useToast();

    const newVisitorForm = useForm<NewVisitorFormValues>({
        resolver: zodResolver(newVisitorSchema),
        defaultValues: { fullName: '', email: '', phoneNumber: '', inviter: inviterUsername },
    });

    const existingMemberForm = useForm<ExistingMemberFormValues>({
        resolver: zodResolver(existingMemberSchema),
        defaultValues: { fullName: '', phoneNumber: '', inviter: inviterUsername },
    });

    React.useEffect(() => {
        if (isOpen) {
            newVisitorForm.reset({ fullName: '', email: '', phoneNumber: '', inviter: inviterUsername });
            existingMemberForm.reset({ fullName: '', phoneNumber: '', inviter: inviterUsername });
        }
    }, [isOpen, inviterUsername, newVisitorForm, existingMemberForm]);

    const onNewVisitorSubmit = async (values: NewVisitorFormValues) => {
        try {
            const res = await fetch('/api/register-visitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'visitor',
                    ...values,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast({
                    title: '¡Registro Exitoso!',
                    description: 'Hemos guardado tu lugar. Revisa tu correo para más detalles.',
                });
                onOpenChange(false);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error de Guardado',
                    description: data.error || 'No se pudo guardar tu registro. Inténtalo de nuevo.',
                });
            }
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: 'Error de Guardado',
                description: e.message || 'No se pudo guardar tu registro. Inténtalo de nuevo.',
            });
        }
    };

    const onExistingMemberSubmit = async (values: ExistingMemberFormValues) => {
        try {
            const res = await fetch('/api/register-visitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'member',
                    ...values,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast({
                    title: '¡Bienvenido de Nuevo!',
                    description: 'Tu lugar ha sido reservado.',
                });
                onOpenChange(false);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error de Guardado',
                    description: data.error || 'No se pudo guardar tu registro. Inténtalo de nuevo.',
                });
            }
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: 'Error de Guardado',
                description: e.message || 'No se pudo guardar tu registro. Inténtalo de nuevo.',
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Reserva tu lugar en el Webinar</DialogTitle>
                    <DialogDescription>
                        Regístrate para obtener acceso instantáneo.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="new" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="new"><UserPlus className="mr-2 h-4 w-4"/> Nuevo Visitante</TabsTrigger>
                        <TabsTrigger value="existing"><LogIn className="mr-2 h-4 w-4"/>Miembro Existente</TabsTrigger>
                    </TabsList>
                    <TabsContent value="new">
                        <Form {...newVisitorForm}>
                            <form onSubmit={newVisitorForm.handleSubmit(onNewVisitorSubmit)} className="space-y-4 pt-4">
                                <FormField
                                    control={newVisitorForm.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre Completo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={newVisitorForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Correo Electrónico</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="john.doe@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={newVisitorForm.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número de Teléfono</FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="(123) 456-7890" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={newVisitorForm.control}
                                    name="inviter"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Invitado por</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <UserCircle className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="Username" {...field} defaultValue={"raju"} readOnly disabled className="pl-8"/>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={newVisitorForm.formState.isSubmitting}>
                                    {newVisitorForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Reservando...</> : "Reservar mi lugar"}
                                </Button>
                            </form>
                        </Form>
                    </TabsContent>
                    <TabsContent value="existing">
                       <Form {...existingMemberForm}>
                            <form onSubmit={existingMemberForm.handleSubmit(onExistingMemberSubmit)} className="space-y-4 pt-4">
                                <FormField
                                    control={existingMemberForm.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre Completo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={existingMemberForm.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número de Teléfono</FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="(123) 456-7890" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={existingMemberForm.control}
                                    name="inviter"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Invitado por</FormLabel>
                                            <FormControl>
                                                 <div className="relative">
                                                    <UserCircle className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="Username" {...field} readOnly disabled className="pl-8"/>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={existingMemberForm.formState.isSubmitting}>
                                    {existingMemberForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Accediendo...</> : "Iniciar Sesión y Reservar"}
                                </Button>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

export interface WebinarLandingPageProps {
  inviterUsername: string;
  templateType: 'video' | 'text';
  headerHeadline: string;
  headerSubheadline: string;
  headerHeadlineSize: number;
  headerHeadlineColor: string;
  isHeaderHeadlineBold: boolean;
  headerSubheadlineSize: number;
  headerSubheadlineColor: string;
  isHeaderSubheadlineBold: boolean;
  headerBackgroundType: 'gradient' | 'color' | 'image';
  headerGradientStart: string;
  headerGradientEnd: string;
  headerSolidColor: string;
  headerImagePreview: string;
  headerOverlayColor: string;
  headerOverlayOpacity: number;
  titleSize: number;
  titleColor: string;
  isTitleBold: boolean;
  learnSectionTitle: string;
  presenterSectionTitle: string;
  includedSectionTitle: string;
  considerationSectionTitle: string;
  testimonialsSectionTitle: string;
  opportunitySectionTitle: string;
  accessSectionTitle: string;
  webinarDateTime: Date;
  countdownSize: number;
  countdownColor: string;
  isCountdownBold: boolean;
  previewVideoUrl: string;
  learningPoints: string[];
  caseStudyHeadline: string;
  caseStudyDescription: string;
  caseStudyImageUrl: string;
  caseStudyImageFile: File | null;
  caseStudyHeadlineSize: number;
  caseStudyHeadlineColor: string;
  isCaseStudyHeadlineBold: boolean;
  caseStudyDescriptionSize: number;
  caseStudyDescriptionColor: string;
  isCaseStudyDescriptionBold: boolean;
  includedPoints: string[];
  includedItemSize: number;
  includedItemColor: string;
  isIncludedItemBold: boolean;
  presenterName: string;
  presenterDescription: string;
  presenterNameSize: number;
  presenterNameColor: string;
  isPresenterNameBold: boolean;
  presenterDescriptionSize: number;
  presenterDescriptionColor: string;
  isPresenterDescriptionBold: boolean;
  presenterAvatar: string;
  presenterAvatarFile: File | null;
  considerationPoints: string[];
  considerationItemSize: number;
  considerationItemColor: string;
  isConsiderationItemBold: boolean;
  testimonials: Testimonial[];
  testimonialNameSize: number;
  testimonialNameColor: string;
  isTestimonialNameBold: boolean;
  testimonialDescriptionSize: number;
  testimonialDescriptionColor: string;
  isTestimonialDescriptionBold: boolean;
  testimonialBeforeLabelColor: string;
  testimonialAfterLabelColor: string;
  testimonialSectionDescription: string;
  testimonialSectionDescriptionSize: number;
  testimonialSectionDescriptionColor: string;
  isTestimonialSectionDescriptionBold: boolean;
  isPaymentEnabled: boolean;
  paymentLink: string;
  paymentButtonText: string;
  paymentSectionTitle: string;
  opportunitySectionDescription: string;
  opportunitySectionDescriptionSize: number;
  opportunitySectionDescriptionColor: string;
  isOpportunitySectionDescriptionBold: boolean;
  accessSectionDescription: string;
  accessSectionDescriptionSize: number;
  accessSectionDescriptionColor: string;
  isAccessSectionDescriptionBold: boolean;
  userMode?: boolean;
  replayCode: string;
  replayUrl: string;
  liveCode: string;
    liveUrl: string;
}

export function WebinarLandingPage(props: WebinarLandingPageProps) {
    const [timeLeft, setTimeLeft] = React.useState<{ days: string; hours: string; minutes: string; seconds: string; } | null>(null);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = React.useState(false);
    const [selectedTestimonial, setSelectedTestimonial] = React.useState<Testimonial | null>(null);

    const [gol,setGol] = React.useState(false);
    React.useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const target = new Date(props.webinarDateTime);
            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeLeft({
                days: days.toString().padStart(2, '0'),
                hours: hours.toString().padStart(2, '0'),
                minutes: minutes.toString().padStart(2, '0'),
                seconds: seconds.toString().padStart(2, '0'),
            });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [props.webinarDateTime]);

    React.useEffect(() => {
        if (gol) {
           setGol(true);
        }
    }, []);

    const getInitials = (name: string) => {
        if (!name?.trim()) return '??';
        const nameParts = name.trim().split(' ').filter(Boolean);
        if (nameParts.length === 0) return '??';
        if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
        return (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : '')).toUpperCase();
    };

    return (
        <div className="flex-1">
            <div className={props.userMode ?  " mx-auto  " :"max-w-4xl mx-auto" }>
                <div className="w-full rounded-lg overflow-hidden shadow-2xl bg-card">
                    <div 
                        className="relative text-center p-8 sm:p-12 text-white overflow-hidden"
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                ...(props.headerBackgroundType === 'color' && { backgroundColor: props.headerSolidColor }),
                                ...(props.headerBackgroundType === 'gradient' && { background: `linear-gradient(45deg, ${props.headerGradientStart}, ${props.headerGradientEnd})` }),
                                ...(props.headerBackgroundType === 'image' && props.headerImagePreview && { backgroundImage: `url(${props.headerImagePreview})` }),
                            }}
                        />
                        {props.headerBackgroundType === 'image' && props.headerImagePreview && (
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundColor: props.headerOverlayColor,
                                    opacity: props.headerOverlayOpacity,
                                }}
                            />
                        )}
                        <div className="relative z-10">
                            <h2
                                style={{
                                    fontSize: `${props.headerHeadlineSize}px`,
                                    color: props.headerHeadlineColor,
                                    fontWeight: props.isHeaderHeadlineBold ? 'bold' : 'normal',
                                    lineHeight: 1.2
                                }}
                                className="mb-3"
                            >
                                {props.headerHeadline}
                            </h2>
                            <p
                                style={{
                                    fontSize: `${props.headerSubheadlineSize}px`,
                                    color: props.headerSubheadlineColor,
                                    fontWeight: props.isHeaderSubheadlineBold ? 'bold' : 'normal',
                                }}
                            >
                                {props.headerSubheadline}
                            </p>
                        </div>
                    </div>

                    <Card className="w-full bg-white text-slate-900 p-6 sm:p-8 rounded-none border-none shadow-none">
                        {/* Countdown Timer */}
                        <div className="text-center mb-6">
                            <div 
                                className="flex flex-wrap justify-center gap-2 sm:gap-4"
                                style={{
                                    fontSize: `${props.countdownSize}px`,
                                    color: props.countdownColor,
                                    fontWeight: props.isCountdownBold ? 'bold' : 'normal',
                                }}
                            >
                               {timeLeft ? (
                                    <>
                                        <span>{timeLeft.days}</span>:<span>{timeLeft.hours}</span>:<span>{timeLeft.minutes}</span>:<span>{timeLeft.seconds}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>00</span>:<span>00</span>:<span>00</span>:<span>00</span>
                                    </>
                                )}
                            </div>
                            <p 
                                className="text-lg sm:text-xl mt-2 text-blue-600 font-semibold"
                            >
                                {format(props.webinarDateTime, "dd 'de' MMMM, yyyy | hh:mm a", { locale: es })} | 60 minutes
                            </p>
                        </div>
                        
                        <Separator className="my-8 bg-slate-200" />

                        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                            {/* Left column */}
                            <div className="space-y-8">
                                {props.templateType === 'video' ? (
                                    <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center relative">
                                        {props.previewVideoUrl ? (
                                            <video key={props.previewVideoUrl} controls src={props.previewVideoUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-slate-500 flex flex-col items-center gap-2">
                                                <Video className="h-12 w-12" />
                                                <span>No video selected</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                         <h3 className="flex items-center gap-2 text-2xl mb-2" style={{ fontSize: `${props.titleSize}px`, color: props.titleColor, fontWeight: props.isTitleBold ? 'bold' : 'normal' }}>
                                            <ListChecks className="text-primary h-6 w-6"/>
                                            {props.learnSectionTitle}
                                        </h3>
                                        <ul className="list-disc list-inside space-y-2 text-slate-700">
                                            {props.learningPoints.map((point, index) => (
                                                <li key={index}>{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                <Card className="overflow-hidden bg-white shadow-lg border-slate-200">
                                    <div className="relative aspect-[4/3] bg-slate-200">
                                        <Image 
                                            src={props.caseStudyImageUrl} 
                                            alt="Case study image" 
                                            fill 
                                            className="object-cover"
                                            data-ai-hint="business success"
                                        />
                                    </div>
                                    <div className="p-6">
                                        <h4 
                                            className="mb-2"
                                            style={{
                                                fontSize: `${props.caseStudyHeadlineSize}px`,
                                                color: props.caseStudyHeadlineColor,
                                                fontWeight: props.isCaseStudyHeadlineBold ? 'bold' : 'normal'
                                            }}
                                        >
                                            {props.caseStudyHeadline}
                                        </h4>
                                        <p
                                            style={{
                                                fontSize: `${props.caseStudyDescriptionSize}px`,
                                                color: props.caseStudyDescriptionColor,
                                                fontWeight: props.isCaseStudyDescriptionBold ? 'bold' : 'normal'
                                            }}
                                        >
                                            {props.caseStudyDescription}
                                        </p>
                                    </div>
                                </Card>
                            </div>
                            
                            {/* Right column */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-2xl mb-2" style={{ fontSize: `${props.titleSize}px`, color: props.titleColor, fontWeight: props.isTitleBold ? 'bold' : 'normal' }}>{props.presenterSectionTitle}</h3>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-14 w-14">
                                            <AvatarImage src={props.presenterAvatar} />
                                            <AvatarFallback>{getInitials(props.presenterName)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p
                                                style={{
                                                    fontSize: `${props.presenterNameSize}px`,
                                                    color: props.presenterNameColor,
                                                    fontWeight: props.isPresenterNameBold ? 'bold' : 'normal',
                                                }}
                                            >
                                                {props.presenterName}
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: `${props.presenterDescriptionSize}px`,
                                                    color: props.presenterDescriptionColor,
                                                    fontWeight: props.isPresenterDescriptionBold ? 'bold' : 'normal',
                                                }}
                                            >
                                                {props.presenterDescription}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsRegisterModalOpen(true)}>Reserve Your Spot Now</Button>
                                
                                <div>
                                    <h3 className="flex items-center gap-2 text-2xl mb-2" style={{ fontSize: `${props.titleSize}px`, color: props.titleColor, fontWeight: props.isTitleBold ? 'bold' : 'normal' }}>
                                        <Crown className="text-yellow-500 h-6 w-6"/>
                                        {props.includedSectionTitle}
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {props.includedPoints.map((point, index) => (
                                            <li 
                                                key={index}
                                                style={{
                                                    fontSize: `${props.includedItemSize}px`,
                                                    color: props.includedItemColor,
                                                    fontWeight: props.isIncludedItemBold ? 'bold' : 'normal',
                                                }}
                                            >
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div>
                                    <h3 className="text-2xl mb-4" style={{ fontSize: `${props.titleSize}px`, color: props.titleColor, fontWeight: props.isTitleBold ? 'bold' : 'normal' }}>
                                        {props.considerationSectionTitle}
                                    </h3>
                                    <ul className="space-y-3">
                                        {props.considerationPoints.map((point, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                                <span
                                                    style={{
                                                        fontSize: `${props.considerationItemSize}px`,
                                                        color: props.considerationItemColor,
                                                        fontWeight: props.isConsiderationItemBold ? 'bold' : 'normal',
                                                    }}
                                                >{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                            </div>
                        </div>

                        <Separator className="my-8 bg-slate-200" />
                        
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl" style={{ fontSize: `${props.titleSize}px`, color: props.titleColor, fontWeight: props.isTitleBold ? 'bold' : 'normal' }}>
                                {props.testimonialsSectionTitle}
                            </h2>
                             <p
                                className="text-slate-500 max-w-lg mx-auto"
                                style={{
                                    fontSize: `${props.testimonialSectionDescriptionSize}px`,
                                    color: props.testimonialSectionDescriptionColor,
                                    fontWeight: props.isTestimonialSectionDescriptionBold ? 'bold' : 'normal',
                                }}
                            >
                                {props.testimonialSectionDescription}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left pt-4">
                                {props.testimonials.map((testimonial) => (
                                    <Card 
                                        key={testimonial.id} 
                                        className="p-4 bg-slate-50 border-slate-200 shadow-sm flex flex-col text-center cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 group"
                                        onClick={() => setSelectedTestimonial(testimonial)}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <Avatar className="h-10 w-10 border-2 border-primary">
                                                <AvatarImage src={testimonial.personAvatarUrl} />
                                                <AvatarFallback>{getInitials(testimonial.name)}</AvatarFallback>
                                            </Avatar>
                                            <p className="text-slate-800 text-left"
                                                style={{
                                                    fontSize: `${props.testimonialNameSize}px`,
                                                    color: props.testimonialNameColor,
                                                    fontWeight: props.isTestimonialNameBold ? 'bold' : 'normal',
                                                }}
                                            >
                                                {testimonial.name}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <h4 className="font-semibold text-sm mb-1" style={{ color: props.testimonialBeforeLabelColor }}>Antes</h4>
                                                <div className="aspect-square relative w-full rounded-md overflow-hidden bg-slate-200">
                                                    <Image src={testimonial.beforeImageUrl} alt="Testimonial before" fill className="object-cover" data-ai-hint="sad empty" />
                                                </div>
                                                <p className="mt-2 italic" 
                                                   style={{
                                                        fontSize: `${props.testimonialDescriptionSize}px`,
                                                        color: props.testimonialDescriptionColor,
                                                        fontWeight: props.isTestimonialDescriptionBold ? 'bold' : 'normal',
                                                   }}
                                                >"{testimonial.problem}"</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm mb-1" style={{ color: props.testimonialAfterLabelColor }}>Después</h4>
                                                <div className="aspect-square relative w-full rounded-md overflow-hidden bg-slate-200">
                                                    <Image src={testimonial.afterImageUrl} alt="Testimonial after" fill className="object-cover" data-ai-hint="happy success" />
                                                 </div>
                                                <p className="mt-2 italic" 
                                                   style={{
                                                        fontSize: `${props.testimonialDescriptionSize}px`,
                                                        color: props.testimonialDescriptionColor,
                                                        fontWeight: props.isTestimonialDescriptionBold ? 'bold' : 'normal',
                                                   }}
                                                >"{testimonial.solution}"</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <Separator className="my-8 bg-slate-200" />
                        
                        <div className="text-center space-y-4">
                        <h2 className="text-3xl" style={{ fontSize: `${props.titleSize}px`, color: props.titleColor, fontWeight: props.isTitleBold ? 'bold' : 'normal' }}>{props.opportunitySectionTitle}</h2>
                        <p 
                            className="text-lg"
                            style={{
                                fontSize: `${props.opportunitySectionDescriptionSize}px`,
                                color: props.opportunitySectionDescriptionColor,
                                fontWeight: props.isOpportunitySectionDescriptionBold ? 'bold' : 'normal',
                            }}
                        >
                            {props.opportunitySectionDescription}
                        </p>
                        <div className="mt-6 flex justify-center">
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsRegisterModalOpen(true)}>Reserve Your Spot Now</Button>
                        </div>
                        </div>
                        
                        {props.isPaymentEnabled && (
                            <>
                                <Separator className="my-8 bg-slate-200" />
                                <div className="text-center space-y-4">
                                    <h2 className="text-3xl" style={{ fontSize: `${props.titleSize}px`, color: props.titleColor, fontWeight: props.isTitleBold ? 'bold' : 'normal' }}>
                                        {props.paymentSectionTitle}
                                    </h2>
                                    <div className="mt-6 flex justify-center">
                                        <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white" asChild>
                                            <Link href={props.paymentLink} target="_blank" rel="noopener noreferrer">
                                                <Ticket className="mr-2 h-5 w-5" />
                                                {props.paymentButtonText}
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                        
                        <Separator className="my-8 bg-slate-200" />


                     
                     
                    

                        <div className="text-center space-y-8">
                            <h2 className="text-3xl" style={{ fontSize: `${props.titleSize}px`, color: props.titleColor, fontWeight: props.isTitleBold ? 'bold' : 'normal' }}>
                                {props.accessSectionTitle}
                            </h2>
                            <p 
                                className="text-lg mb-6"
                                style={{
                                    fontSize: `${props.accessSectionDescriptionSize}px`,
                                    color: props.accessSectionDescriptionColor,
                                    fontWeight: props.isAccessSectionDescriptionBold ? 'bold' : 'normal',
                                }}
                            >
                                {props.accessSectionDescription}
                            </p>
                            <div className="flex flex-col md:flex-row gap-8 items-stretch justify-center w-full max-w-4xl mx-auto">
                                {/* Replay Card */}
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <Card className="h-full flex flex-col items-center justify-center p-8 bg-white border border-slate-200 shadow-md rounded-2xl">
                                        <div className="flex flex-col items-center mb-4">
                                            <Video className="h-12 w-12 text-blue-500 mb-2" />
                                            <div className="font-bold text-xl text-blue-900 mb-1">Ver la Repetición</div>
                                            <div className="text-slate-500 mb-3 text-center">Accede al webinar pregrabado cuando quieras.</div>
                                        </div>
                                        <div className="w-full">
                                            <Label htmlFor="replay-code-input" className="text-slate-700 font-medium">Código de Acceso</Label>
                                            <Input id="replay-code-input" placeholder="Introduce tu código" className="w-full border-slate-300 focus:border-blue-500 px-4 py-2 text-base rounded-md mt-1 mb-2" />
                                            <Button
                                                size="lg"
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md"
                                                onClick={() => {
                                                    const code = (document.getElementById('replay-code-input') as HTMLInputElement)?.value;
                                                    const trimmedCode = code.trim();
                                                    if (trimmedCode === props.replayCode) {
                                                        window.location.href = props.replayUrl;
                                                    } else {
                                                        // Show alert if code does not match
                                                        const alertDiv = document.createElement('div');
                                                        alertDiv.className = "fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded shadow-lg z-50 text-center";
                                                        alertDiv.innerText = 'El código no coincide. Intenta de nuevo.';
                                                        document.body.appendChild(alertDiv);
                                                        setTimeout(() => {
                                                            alertDiv.remove();
                                                        }, 2500);
                                                    }
                                                }}
                                            >
                                                <Video className="h-4 w-4 mr-2" /> Acceder
                                            </Button>
                                        </div>
                                    </Card>
                                </div>
                                {/* Divider */}
                                <div className="hidden md:flex flex-col items-center justify-center">
                                    <div className="h-full w-0.5 bg-slate-200" style={{ minHeight: '260px' }} />
                                </div>
                                {/* Live Card */}
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <Card className="h-full flex flex-col items-center justify-center p-8 bg-white border border-slate-200 shadow-md rounded-2xl">
                                        <div className="flex flex-col items-center mb-4">
                                            <Radio className="h-12 w-12 text-green-500 mb-2" />
                                            <div className="font-bold text-xl text-green-900 mb-1">Entrar al Webinar en Vivo</div>
                                            <div className="text-slate-500 mb-3 text-center">Únete a la sesión en directo y participa.</div>
                                        </div>
                                        <div className="w-full">
                                            <Label htmlFor="live-code-input" className="text-slate-700 font-medium">Código de Acceso</Label>
                                            <Input id="live-code-input" placeholder="Introduce tu código" className="w-full border-slate-300 focus:border-green-500 px-4 py-2 text-base rounded-md mt-1 mb-2" />
                                            <Button
                                                size="lg"
                                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
                                                onClick={() => {
                                                    const code = (document.getElementById('live-code-input') as HTMLInputElement)?.value;
                                                    const trimmedCode = code.trim();
                                                    if (trimmedCode === props.liveCode) {
                                                        window.location.href = props.liveUrl;
                                                    } else {
                                                        // Show alert if code does not match
                                                        const alertDiv = document.createElement('div');
                                                        alertDiv.className = "fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded shadow-lg z-50 text-center";
                                                        alertDiv.innerText = 'El código no coincide. Intenta de nuevo.';
                                                        document.body.appendChild(alertDiv);
                                                        setTimeout(() => {
                                                            alertDiv.remove();
                                                        }, 2500);
                                                    }
                                                }}
                                            >
                                                <Radio className="h-4 w-4 mr-2" /> Entrar
                                            </Button>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                            </div>


                    
                    
                    </Card>
                </div>
            </div>




            

            {/* This key change forces the modal and its forms to re-render with fresh default values when the inviter username changes */}
            <RegistrationModal
                key={props.inviterUsername} 
                isOpen={isRegisterModalOpen}
                onOpenChange={setIsRegisterModalOpen}
                inviterUsername={props.inviterUsername}
            />


            <Dialog open={!!selectedTestimonial} onOpenChange={(isOpen) => !isOpen && setSelectedTestimonial(null)}>
                <DialogContent className="max-w-5xl p-4 sm:p-6">
                    {selectedTestimonial && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-center text-3xl">Testimonio de {selectedTestimonial.name}</DialogTitle>
                            </DialogHeader>
                            <div className="grid md:grid-cols-2 gap-6 items-start pt-4">
                                {/* Before Column */}
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-semibold text-center" style={{ color: props.testimonialBeforeLabelColor }}>Antes</h3>
                                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted border">
                                        <Image src={selectedTestimonial.beforeImageUrl} alt={`Antes - ${selectedTestimonial.name}`} fill className="object-cover"/>
                                    </div>
                                    <DialogDescription className="text-base text-center italic">"{selectedTestimonial.problem}"</DialogDescription>
                                </div>
                                {/* After Column */}
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-semibold text-center" style={{ color: props.testimonialAfterLabelColor }}>Después</h3>
                                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted border">
                                        <Image src={selectedTestimonial.afterImageUrl} alt={`Después - ${selectedTestimonial.name}`} fill className="object-cover"/>
                                    </div>
                                    <DialogDescription className="text-base text-center italic">"{selectedTestimonial.solution}"</DialogDescription>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

    