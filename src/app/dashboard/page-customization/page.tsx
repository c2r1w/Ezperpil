
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Palette, Save, Loader2, AlertCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Schemas for each section
const heroContentSchema = z.object({
  headline: z.string().min(1, 'Headline is required.'),
  paragraph: z.string().min(1, 'Description is required.'),
  ctaButton1Text: z.string().min(1, 'Button text is required.'),
  ctaButton2Text: z.string().min(1, 'Button text is required.'),
});

const featuresContentSchema = z.object({
  headline: z.string().min(1),
  paragraph: z.string().min(1),
});

const caseStudiesContentSchema = z.object({
  headline: z.string().min(1),
  paragraph: z.string().min(1),
});

const processContentSchema = z.object({
  headline: z.string().min(1),
  paragraph: z.string().min(1),
});

const incentivesContentSchema = z.object({
  headline: z.string().min(1),
  paragraph: z.string().min(1),
});

const subscriptionContentSchema = z.object({
  headline: z.string().min(1),
  paragraph: z.string().min(1),
});

const footerContentSchema = z.object({
  companyName: z.string().min(1),
  address: z.string().min(1),
  supportEmail: z.string().email(),
  socialLinks: z.object({
    facebook: z.string().url(),
    twitter: z.string().url(),
    linkedin: z.string().url(),
  }),
});

// Form Value Types
type HeroContentValues = z.infer<typeof heroContentSchema>;
type FeaturesContentValues = z.infer<typeof featuresContentSchema>;
type CaseStudiesValues = z.infer<typeof caseStudiesContentSchema>;
type ProcessValues = z.infer<typeof processContentSchema>;
type IncentivesValues = z.infer<typeof incentivesContentSchema>;
type SubscriptionValues = z.infer<typeof subscriptionContentSchema>;
type FooterContentValues = z.infer<typeof footerContentSchema>;


// Default Values
const defaultHeroContent: HeroContentValues = { headline: "Plataforma de Webinars #1 para Negocios", paragraph: "Crea, gestiona y monetiza webinars profesionales que convierten audiencias en clientes leales.", ctaButton1Text: "Únete al Webinar", ctaButton2Text: "Iniciar Sesión" };
const defaultFeaturesContent: FeaturesContentValues = { headline: "Todo lo que Necesitas para Webinars Exitosos", paragraph: "Herramientas profesionales diseñadas para maximizar tu engagement y conversiones" };
const defaultCaseStudiesContent: CaseStudiesValues = { headline: "El Poder Transformador de los Webinars", paragraph: "Descubre cómo los webinars pueden revolucionar tu negocio y multiplicar tus resultados" };
const defaultProcessContent: ProcessValues = { headline: "El Camino del Webinar Exitoso", paragraph: "Cada paso diseñado para maximizar la participación y conversión de tu audiencia" };
const defaultIncentivesContent: IncentivesValues = { headline: "¡Atrae más asistentes y multiplica tu impacto!", paragraph: "Descubre nuestro plan exclusivo de incentivos, diseñado para captar la atención de potenciales clientes y socios de negocio." };
const defaultSubscriptionContent: SubscriptionValues = { headline: "Listo para Transformar Tu Negocio", paragraph: "Únete a nuestra comunidad y recibe las últimas estrategias en webinars, consejos de expertos y ofertas exclusivas directamente en tu correo." };
const defaultFooterContent: FooterContentValues = { companyName: "EZ Perfil Webinars", address: "Oxnard, California 93036", supportEmail: "contacto@ezperfilwebinars.com", socialLinks: { facebook: "#", twitter: "#", linkedin: "#" } };

type UserData = {
  role?: 'admin' | 'client' | 'user';
}

export default function PageCustomizationPage() {
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Initialize forms for each section
  const heroForm = useForm<HeroContentValues>({ resolver: zodResolver(heroContentSchema), defaultValues: defaultHeroContent });
  const featuresForm = useForm<FeaturesContentValues>({ resolver: zodResolver(featuresContentSchema), defaultValues: defaultFeaturesContent });
  const caseStudiesForm = useForm<CaseStudiesValues>({ resolver: zodResolver(caseStudiesContentSchema), defaultValues: defaultCaseStudiesContent });
  const processForm = useForm<ProcessValues>({ resolver: zodResolver(processContentSchema), defaultValues: defaultProcessContent });
  const incentivesForm = useForm<IncentivesValues>({ resolver: zodResolver(incentivesContentSchema), defaultValues: defaultIncentivesContent });
  const subscriptionForm = useForm<SubscriptionValues>({ resolver: zodResolver(subscriptionContentSchema), defaultValues: defaultSubscriptionContent });
  const footerForm = useForm<FooterContentValues>({ resolver: zodResolver(footerContentSchema), defaultValues: defaultFooterContent });
  
  React.useEffect(() => {
    const fetchUserData = async () => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                setUserData(userDoc.data() as UserData);
            }
        }
    };
    if (!authLoading) fetchUserData();
  }, [user, authLoading]);

  React.useEffect(() => {
    const fetchContent = async (docId: string, form: any, defaultValues: any) => {
        const docRef = doc(db, 'pageContent', docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            form.reset(docSnap.data());
        } else {
            // Pre-populate with defaults if it doesn't exist
            await setDoc(docRef, defaultValues);
            form.reset(defaultValues);
        }
    };

    const fetchAllContent = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchContent('hero', heroForm, defaultHeroContent),
                fetchContent('features', featuresForm, defaultFeaturesContent),
                fetchContent('caseStudies', caseStudiesForm, defaultCaseStudiesContent),
                fetchContent('process', processForm, defaultProcessContent),
                fetchContent('incentives', incentivesForm, defaultIncentivesContent),
                fetchContent('subscription', subscriptionForm, defaultSubscriptionContent),
                fetchContent('footer', footerForm, defaultFooterContent),
            ]);
        } catch (error) {
            console.error("Error fetching page content:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load page content." });
        } finally {
            setLoading(false);
        }
    };
    
    if (userData?.role === 'admin') fetchAllContent();
    else if (!authLoading) setLoading(false);

  }, [heroForm, featuresForm, caseStudiesForm, processForm, incentivesForm, subscriptionForm, footerForm, toast, user, authLoading, userData?.role]);

  const createSubmitHandler = (docId: string, formName: string) => async (values: any) => {
    try {
      const docRef = doc(db, 'pageContent', docId);
      await setDoc(docRef, values, { merge: true });
      toast({ title: "Success!", description: `${formName} section has been updated.` });
    } catch (error) {
       console.error(`Error updating ${formName} section:`, error);
       toast({ variant: "destructive", title: "Update Failed", description: `Could not update the ${formName} section.` });
    }
  };

  if (authLoading || loading) {
    return (
        <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Page Customization</h2>
            <Card><CardHeader><Skeleton className="h-8 w-40" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        </div>
    );
  }
  
  if (userData?.role !== 'admin') {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You must be an administrator to manage page content.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Page Customization</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-6 w-6" />Customize Your Landing Page</CardTitle>
          <CardDescription>Manage content for each section of your public page. Click a section to expand and edit.</CardDescription>
        </CardHeader>
        <CardContent>
           <Accordion type="multiple" defaultValue={['hero-section']} className="w-full">
            {/* Hero Section */}
            <AccordionItem value="hero-section">
              <AccordionTrigger className="text-xl font-semibold">Hero Section</AccordionTrigger>
              <AccordionContent className="pt-4"><Form {...heroForm}><form onSubmit={heroForm.handleSubmit(createSubmitHandler('hero', 'Hero'))} className="space-y-6">
                  <FormField control={heroForm.control} name="headline" render={({ field }) => (<FormItem><FormLabel>Headline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={heroForm.control} name="paragraph" render={({ field }) => (<FormItem><FormLabel>Description Paragraph</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={heroForm.control} name="ctaButton1Text" render={({ field }) => (<FormItem><FormLabel>Primary Button Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={heroForm.control} name="ctaButton2Text" render={({ field }) => (<FormItem><FormLabel>Secondary Button Text</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <Button type="submit" disabled={heroForm.formState.isSubmitting}>{heroForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}Save Hero</Button>
              </form></Form></AccordionContent>
            </AccordionItem>
            
            {/* Features Section */}
            <AccordionItem value="features-section">
                <AccordionTrigger className="text-xl font-semibold">Features Section</AccordionTrigger>
                <AccordionContent className="pt-4"><Form {...featuresForm}><form onSubmit={featuresForm.handleSubmit(createSubmitHandler('features', 'Features'))} className="space-y-6">
                    <FormField control={featuresForm.control} name="headline" render={({ field }) => (<FormItem><FormLabel>Headline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={featuresForm.control} name="paragraph" render={({ field }) => (<FormItem><FormLabel>Paragraph</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="submit" disabled={featuresForm.formState.isSubmitting}>{featuresForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}Save Features</Button>
                </form></Form></AccordionContent>
            </AccordionItem>
            
            {/* Case Studies Section */}
            <AccordionItem value="case-studies-section">
                <AccordionTrigger className="text-xl font-semibold">Case Studies Section</AccordionTrigger>
                <AccordionContent className="pt-4"><Form {...caseStudiesForm}><form onSubmit={caseStudiesForm.handleSubmit(createSubmitHandler('caseStudies', 'Case Studies'))} className="space-y-6">
                    <FormField control={caseStudiesForm.control} name="headline" render={({ field }) => (<FormItem><FormLabel>Headline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={caseStudiesForm.control} name="paragraph" render={({ field }) => (<FormItem><FormLabel>Paragraph</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="submit" disabled={caseStudiesForm.formState.isSubmitting}>{caseStudiesForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}Save Case Studies</Button>
                </form></Form></AccordionContent>
            </AccordionItem>
            
            {/* Process Section */}
            <AccordionItem value="process-section">
                <AccordionTrigger className="text-xl font-semibold">Process Section</AccordionTrigger>
                <AccordionContent className="pt-4"><Form {...processForm}><form onSubmit={processForm.handleSubmit(createSubmitHandler('process', 'Process'))} className="space-y-6">
                    <FormField control={processForm.control} name="headline" render={({ field }) => (<FormItem><FormLabel>Headline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={processForm.control} name="paragraph" render={({ field }) => (<FormItem><FormLabel>Paragraph</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="submit" disabled={processForm.formState.isSubmitting}>{processForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}Save Process</Button>
                </form></Form></AccordionContent>
            </AccordionItem>

            {/* Incentives Section */}
            <AccordionItem value="incentives-section">
                <AccordionTrigger className="text-xl font-semibold">Incentives Section</AccordionTrigger>
                <AccordionContent className="pt-4"><Form {...incentivesForm}><form onSubmit={incentivesForm.handleSubmit(createSubmitHandler('incentives', 'Incentives'))} className="space-y-6">
                    <FormField control={incentivesForm.control} name="headline" render={({ field }) => (<FormItem><FormLabel>Headline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={incentivesForm.control} name="paragraph" render={({ field }) => (<FormItem><FormLabel>Paragraph</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="submit" disabled={incentivesForm.formState.isSubmitting}>{incentivesForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}Save Incentives</Button>
                </form></Form></AccordionContent>
            </AccordionItem>
            
             {/* Subscription Section */}
            <AccordionItem value="subscription-section">
                <AccordionTrigger className="text-xl font-semibold">Subscription Section</AccordionTrigger>
                <AccordionContent className="pt-4"><Form {...subscriptionForm}><form onSubmit={subscriptionForm.handleSubmit(createSubmitHandler('subscription', 'Subscription'))} className="space-y-6">
                    <FormField control={subscriptionForm.control} name="headline" render={({ field }) => (<FormItem><FormLabel>Headline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={subscriptionForm.control} name="paragraph" render={({ field }) => (<FormItem><FormLabel>Paragraph</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="submit" disabled={subscriptionForm.formState.isSubmitting}>{subscriptionForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}Save Subscription Content</Button>
                </form></Form></AccordionContent>
            </AccordionItem>
            {/* Footer Section */}
            <AccordionItem value="footer-section">
              <AccordionTrigger className="text-xl font-semibold">Footer</AccordionTrigger>
              <AccordionContent className="pt-4"><Form {...footerForm}><form onSubmit={footerForm.handleSubmit(createSubmitHandler('footer', 'Footer'))} className="space-y-6">
                  <FormField control={footerForm.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={footerForm.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={footerForm.control} name="supportEmail" render={({ field }) => (<FormItem><FormLabel>Support Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={footerForm.control} name="socialLinks.facebook" render={({ field }) => (<FormItem><FormLabel>Facebook URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={footerForm.control} name="socialLinks.twitter" render={({ field }) => (<FormItem><FormLabel>Twitter URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={footerForm.control} name="socialLinks.linkedin" render={({ field }) => (<FormItem><FormLabel>LinkedIn URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <Button type="submit" disabled={footerForm.formState.isSubmitting}>{footerForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}Save Footer</Button>
              </form></Form></AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
