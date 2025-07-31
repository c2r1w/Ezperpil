
'use client';

import dynamic from 'next/dynamic';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as React from 'react';
import { RegistrationModal } from '@/components/landing/registration-modal';

const HeroSection = dynamic(() => import('@/components/landing/hero-section').then(mod => mod.HeroSection));
const FeaturesSection = dynamic(() => import('@/components/landing/features-section').then(mod => mod.FeaturesSection));
const CaseStudiesSection = dynamic(() => import('@/components/landing/case-studies-section').then(mod => mod.CaseStudiesSection));
const ProcessSection = dynamic(() => import('@/components/landing/process-section').then(mod => mod.ProcessSection));
const IncentivesSection = dynamic(() => import('@/components/landing/incentives-section').then(mod => mod.IncentivesSection));
const TestimonialsSection = dynamic(() => import('@/components/landing/testimonials-section').then(mod => mod.TestimonialsSection));
const PricingSection = dynamic(() => import('@/components/landing/pricing-section').then(mod => mod.PricingSection));
const BusinessFormSection = dynamic(() => import('@/components/landing/business-form-section').then(mod => mod.BusinessFormSection));
const SubscriptionSection = dynamic(() => import('@/components/landing/subscription-section').then(mod => mod.SubscriptionSection));
const FooterSection = dynamic(() => import('@/components/landing/footer-section').then(mod => mod.FooterSection));


// Default values in case fetching fails or for initial render
const defaultContent = {
  hero: { headline: "Plataforma de Webinars #1 para Negocios", paragraph: "Crea, gestiona y monetiza webinars profesionales que convierten audiencias en clientes leales.", backgroundImageUrl: "https://placehold.co/1920x1080.png", ctaButton1Text: "Únete al Webinar", ctaButton2Text: "Iniciar Sesión" },
  features: { headline: "Todo lo que Necesitas para Webinars Exitosos", paragraph: "Herramientas profesionales diseñadas para maximizar tu engagement y conversiones" },
  caseStudies: { headline: "El Poder Transformador de los Webinars", paragraph: "Descubre cómo los webinars pueden revolucionar tu negocio y multiplicar tus resultados" },
  process: { headline: "El Camino del Webinar Exitoso", paragraph: "Cada paso diseñado para maximizar la participación y conversión de tu audiencia" },
  incentives: { headline: "¡Atrae más asistentes y multiplica tu impacto!", paragraph: "Descubre nuestro plan exclusivo de incentivos, diseñado para captar la atención de potenciales clientes y socios de negocio." },
  subscription: { headline: "Listo para Transformar Tu Negocio", paragraph: "Únete a nuestra comunidad y recibe las últimas estrategias en webinars, consejos de expertos y ofertas exclusivas directamente en tu correo." },
  footer: { companyName: "EZ Perfil Webinars", address: "Oxnard, California 93036", supportEmail: "contacto@ezperfilwebinars.com", officeHours: "Mon - Fri, 9am - 5pm PST", socialLinks: { facebook: "#", twitter: "#", linkedin: "#" } }
};


export default function Home() {
 
  const [content, setContent] = React.useState(defaultContent);
  const [loading, setLoading] = React.useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = React.useState(false);

  React.useEffect(() => {
    async function fetchAllContent() {
      try {
        const contentIds = ['hero', 'features', 'caseStudies', 'process', 'incentives', 'subscription', 'footer'];
        const contentPromises = contentIds.map(id => getDoc(doc(db, 'pageContent', id)));
        const docSnaps = await Promise.all(contentPromises);
        
        const fetchedContent: any = {};
        docSnaps.forEach((docSnap, index) => {
          const id = contentIds[index];
          if (docSnap.exists()) {
            fetchedContent[id] = docSnap.data();
          }
        });

        setContent(currentContent => ({...currentContent, ...fetchedContent}));

      } catch (error) {
        console.error("Could not fetch page content, using defaults. Error:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAllContent();
  }, []);

  const [lxp, setLxp] = React.useState(false);

  React.useEffect(() => {
   
      setLxp(true);
      // Simulate loading for 1 second
    }, []); // Simulate loading for 1 second

  return (
    lxp ?
      <><main className="flex min-h-screen flex-col">
        <HeroSection
          headline={content.hero.headline}
          paragraph={content.hero.paragraph}
          backgroundImageUrl={content.hero.backgroundImageUrl}
          ctaButton1Text={content.hero.ctaButton1Text}
          ctaButton2Text={content.hero.ctaButton2Text}
          onRegisterClick={() => setIsRegisterModalOpen(true)} />
        <FeaturesSection
          headline={content.features.headline}
          paragraph={content.features.paragraph} />
        <CaseStudiesSection
          headline={content.caseStudies.headline}
          paragraph={content.caseStudies.paragraph} />
        <ProcessSection
          headline={content.process.headline}
          paragraph={content.process.paragraph} />
        <IncentivesSection
          headline={content.incentives.headline}
          paragraph={content.incentives.paragraph} />
        <TestimonialsSection />
        <PricingSection />
        <BusinessFormSection />
        <SubscriptionSection
          headline={content.subscription.headline}
          paragraph={content.subscription.paragraph} />
        <FooterSection
          companyName={content.footer.companyName}
          address={content.footer.address}
          supportEmail={content.footer.supportEmail}
          officeHours={content.footer.officeHours}
          socialLinks={content.footer.socialLinks} />
      </main><RegistrationModal
          isOpen={isRegisterModalOpen}
          onOpenChange={setIsRegisterModalOpen} /></>:
          <> 
          
          <div className="flex min-h-screen items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
                <p className="text-lg font-semibold text-gray-700">Cargando...</p>
              </div>
            </div>
            
            </>
  );
}
