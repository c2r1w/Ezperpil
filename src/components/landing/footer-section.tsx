
"use client";

import Link from 'next/link';
import { EzPerfilIcon } from '@/components/icons/ezperfil-icon';
import { Clock, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export interface FooterContentProps {
  companyName: string;
  address: string;
  supportEmail: string;
  officeHours: string; // This prop is no longer directly used in the new design
  socialLinks: {
    facebook: string;
    twitter: string;
    linkedin: string;
  };
}

const platformLinks = [
  { href: "#features", label: "Características" },
  { href: "#", label: "Perfil de la Compañía" },
  { href: "#precios", label: "Precios" },
  { href: "#testimonios", label: "Testimonios" },
  { href: "#", label: "Blog" },
];

const supportLinks = [
  { href: "#", label: "Centro de Ayuda" },
  { href: "#contacto", label: "Contacto" },
  { href: "#", label: "Comunidad" },
  { href: "#", label: "Tutoriales" },
  { href: "#", label: "Webinars" },
];

const legalLinks = [
  { href: "/terms-and-conditions", label: "Términos de Servicio" },
  { href: "/privacy-policy", label: "Política de Privacidad" },
  { href: "#", label: "Cookies" },
  { href: "#", label: "GDPR" },
  { href: "#", label: "Licencias" },
];

export function FooterSection(props: FooterContentProps) {
  return (
    <footer className="bg-[#0F172A] text-slate-300">
      <div className="container mx-auto px-4 md:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Column 1: Company Info */}
          <div className="md:col-span-2 lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <EzPerfilIcon className="h-8 w-auto text-primary" />
              <span className="text-lg font-bold font-headline leading-tight text-white">EZ Perfil<br/>Webinars</span>
            </Link>
            <p className="text-sm text-slate-400">
              Transformando la manera en que los profesionales conectan con su audiencia a través de webinars de alto impacto.
            </p>
            <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0"/>
                    <span>333 N Lantana Ave Suite 138 Camarillo Ca, 93010</span>
                </li>
                <li className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-0.5 shrink-0"/>
                    <span>+1 8057073720</span>
                </li>
                 <li className="flex items-start gap-3">
                    <Mail className="h-4 w-4 mt-0.5 shrink-0"/>
                    <a href={`mailto:contacto@ezperfilwebinars.com`} className="hover:text-primary transition-colors">contacto@ezperfilwebinars.com</a>
                </li>
            </ul>
          </div>
          
          {/* Column 2: Opening Hours */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Horario de Atención</h4>
            <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-3"><Clock className="h-4 w-4 shrink-0"/><span>Lunes - Viernes: 9:00 AM - 5:00 PM</span></li>
                <li className="flex items-center gap-3"><Clock className="h-4 w-4 shrink-0"/><span>Sábados: 10:00 AM - 2:00 PM</span></li>
                <li className="flex items-center gap-3"><Clock className="h-4 w-4 shrink-0"/><span>Domingos: Cerrado</span></li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div className="space-y-4">
             <h4 className="font-semibold text-white">Plataforma</h4>
             <ul className="space-y-2 text-sm">
                {platformLinks.map(link => (
                    <li key={link.label}><Link href={link.href} className="text-slate-400 hover:text-primary transition-colors">{link.label}</Link></li>
                ))}
             </ul>
          </div>

           {/* Column 4: Support */}
          <div className="space-y-4">
             <h4 className="font-semibold text-white">Soporte</h4>
             <ul className="space-y-2 text-sm">
                {supportLinks.map(link => (
                    <li key={link.label}><Link href={link.href} className="text-slate-400 hover:text-primary transition-colors">{link.label}</Link></li>
                ))}
             </ul>
          </div>
          
          {/* Column 5: Legal */}
          <div className="space-y-4">
             <h4 className="font-semibold text-white">Legal</h4>
             <ul className="space-y-2 text-sm">
                {legalLinks.map(link => (
                    <li key={link.label}><Link href={link.href} className="text-slate-400 hover:text-primary transition-colors">{link.label}</Link></li>
                ))}
             </ul>
          </div>
        </div>
      </div>
      
      <div className="border-t border-slate-700">
        <div className="container mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
            <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} EZ Perfil Webinars. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <a href="#" className="text-slate-500 hover:text-primary"><Facebook className="h-5 w-5"/></a>
                <a href="#" className="text-slate-500 hover:text-primary"><Twitter className="h-5 w-5"/></a>
                <a href="#" className="text-slate-500 hover:text-primary"><Instagram className="h-5 w-5"/></a>
                <a href="#" className="text-slate-500 hover:text-primary"><Linkedin className="h-5 w-5"/></a>
            </div>
        </div>
      </div>
    </footer>
  );
}
