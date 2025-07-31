
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { Skeleton } from './ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EzPerfilIcon } from '@/components/icons/ezperfil-icon';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';


const navItems = [
    { href: "#", label: "Inicio"},
    { href: "#features", label: "Características" },
    { href: "#antes-despues", label: "Antes/Después" },
    { href: "#proceso", label: "Proceso" },
    { href: "#incentivos", label: "Incentivos" },
    { href: "#testimonios", label: "Testimonios" },
    { href: "#precios", label: "Precios" },
];

export function MainNav() {
  const pathname = usePathname();
  const [user, loading] = useAuthState(auth);
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Sign out error', error);
    }
  };

  const getInitials = (email?: string | null) => {
    if (!email) return '??';
    return email.substring(0, 2).toUpperCase();
  };

  const desktopNavLinks = navItems.map((item) => (
    <Button variant="ghost" asChild key={item.label} className={cn("text-muted-foreground", pathname === item.href && "text-foreground")}>
        <Link href={item.href}>{item.label}</Link>
    </Button>
  ));
  
  const mobileNavLinks = navItems.map((item) => (
      <Button variant="ghost" asChild key={item.label} className="w-full justify-start" onClick={() => setOpen(false)}>
          <Link href={item.href}>{item.label}</Link>
      </Button>
  ));
  
  const renderAuthButtons = () => {
    if (loading) {
        return (
            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
            </div>
        );
    }

    if (user) {
        return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.email || '')}`} />
                    <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Mi Cuenta</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Ir al Panel</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <>
          <Button variant="outline" asChild>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
          <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
            <Link href="/register">Registrarse</Link>
          </Button>
        </>
    );
  };
      
  const renderMobileAuthButtons = () => {
    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-9 w-full"/>
                <Skeleton className="h-9 w-full"/>
            </div>
        );
    }
    
    if (user) {
        return (
            <>
                <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/dashboard" onClick={() => setOpen(false)}>Ir al Panel</Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { handleSignOut(); setOpen(false); }}>
                    Cerrar Sesión
                </Button>
            </>
        );
    }

    return (
        <>
            <Button variant="ghost" asChild className="w-full justify-start">
                <Link href="/login" onClick={() => setOpen(false)}>Iniciar Sesión</Link>
            </Button>
            <Button variant="default" asChild className="w-full justify-start">
                <Link href="/register" onClick={() => setOpen(false)}>Registrarse</Link>
            </Button>
        </>
    );
  };

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-card text-card-foreground sticky top-0 z-50 border-b border-border/50">
       <Link href="/" className="flex items-center justify-center gap-2 mr-6">
        <EzPerfilIcon className="h-8 w-auto text-primary" />
        <span className="text-lg font-bold font-headline leading-tight">EZ Webinar<br/>Hub</span>
      </Link>
      
      {/* Desktop Navigation */}
      <nav className="ml-auto hidden lg:flex gap-1 items-center">
        {desktopNavLinks}
        <Button asChild className="ml-2 bg-primary/10 text-primary hover:bg-primary/20">
            <Link href="#contacto">Contacto</Link>
        </Button>
        <div className="flex items-center gap-2 pl-4">
            {renderAuthButtons()}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="ml-auto lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <nav className="grid gap-6 text-lg font-medium mt-8">
               <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4" onClick={() => setOpen(false)}>
                <EzPerfilIcon className="h-8 w-auto text-primary" />
                <span className="text-lg font-bold font-headline leading-tight">EZ Webinar<br/>Hub</span>
              </Link>
              <div className="flex flex-col gap-2">
                {mobileNavLinks}
                 <Button asChild className="w-full justify-start mt-2" onClick={() => setOpen(false)}>
                    <Link href="#contacto">Contacto</Link>
                </Button>
                <Separator className="my-4"/>
                {renderMobileAuthButtons()}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
