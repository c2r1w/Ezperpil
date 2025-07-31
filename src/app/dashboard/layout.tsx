
'use client';

import { auth, db } from '@/lib/firebase';
import { XlocalStorage } from '@/lib/Xlocalstorage';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  Home,
  LogOut,
  Mountain,
  User,
  Users,
  Video,
  BarChart,
  Mic,
  Tv2,
  Palette,
  Presentation,
  ClipboardList,
  Package,
  Ticket,
  DollarSign,
  CreditCard,
  QrCode,
  Send,
  Briefcase,
  Calendar,
  MessageSquareText,
  Network,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';


interface UserData {
  fullName?: string;
  email?: string;
  role?: 'admin' | 'client' | 'impulsor_de_impacto';
  uid: string;
}

interface ServiceSetting {
  name: string;
  active: boolean;
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hasUnread, setHasUnread] = React.useState(false);

  const [affiliateServices, setAffiliateServices] = React.useState<ServiceSetting[]>([]);
  const [clientServices, setClientServices] = React.useState<ServiceSetting[]>([]);
  const [servicesLoading, setServicesLoading] = React.useState(true);


  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData({ uid: currentUser.uid, ...userDoc.data() } as UserData);
        } else {
          // If no firestore doc, create a fallback with email
          setUserData({ uid: currentUser.uid, email: currentUser.email || undefined });
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Load service settings from XlocalStorage
  React.useEffect(() => {
    if (!userData) return;
    setServicesLoading(true);
    (async () => {
      try {
        const storedAffiliate = await XlocalStorage.getItem('paymentPlanAffiliateServices');
        if (storedAffiliate) setAffiliateServices(JSON.parse(storedAffiliate));
        const storedClient = await XlocalStorage.getItem('paymentPlanClientServices');
        if (storedClient) setClientServices(JSON.parse(storedClient));
      } catch (error) {
        console.error("Could not load service settings from XlocalStorage", error);
      } finally {
        setServicesLoading(false);
      }
    })();
  }, [userData]);
  
  const checkUnread = React.useCallback(async () => {
    if (user) {
      const unreadKey = `unreadMessages_${user.uid}`;
      const unreadRaw = await XlocalStorage.getItem(unreadKey);
      const unreadData = JSON.parse(unreadRaw || '{}');
      setHasUnread(Object.keys(unreadData).length > 0);
    }
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    checkUnread();

    // Note: XlocalStorage is async and does not trigger 'storage' events across tabs.
    // If you want cross-tab sync, you need to implement a polling or websocket solution.
    // For now, we just check on mount/user change.
  }, [user, checkUnread]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Sign out error', error);
    }
  };

  const isServiceActive = (serviceIndex: number) => {
    if (userData?.role === 'admin' || servicesLoading) return true;

    const services = userData?.role === 'impulsor_de_impacto' ? affiliateServices : clientServices;
    if (services && services.length > serviceIndex) {
      return services[serviceIndex].active;
    }
    return false; // Default to false if settings are not loaded or index is out of bounds
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
            <Mountain className="h-8 w-8 text-primary animate-pulse" />
            <p className="text-muted-foreground">Loading Your Dashboard...</p>
        </div>
      </div>
    );
  }
  
  const displayName = userData?.fullName || 'No Name';
  const displayEmail = userData?.email || 'No Email';
  const avatarSeed = typeof userData?.fullName === 'string' && userData.fullName.length > 0 ? userData.fullName : displayEmail;


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">EZ Perfil Webinars</span>
            <SidebarTrigger className="ml-auto" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                <Link href="/dashboard">
                  <Home />
                  {userData?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton disabled isActive={pathname?.startsWith('/dashboard/webinars') || false}>
                <Video />
                Webinars
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/my-webinar-room') || false}>
                  <Link href="/dashboard/my-webinar-room">
                    <Tv2 />
                    My webinar room
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/proximo-webinar') || false}>
                <Link href="/dashboard/proximo-webinar">
                  <Presentation />
                  Próximo webinar
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/calendar') || false}>
                <Link href="/dashboard/calendar">
                  <Calendar />
                  Calendario
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/webinar-registrations') || false}>
                <Link href="/dashboard/webinar-registrations">
                  <ClipboardList />
                  Webinar Registrations
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/business-packages') || false}>
                <Link href="/dashboard/business-packages">
                  <Package />
                  Paquetes de negocio
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/guest-code') || false}>
                <Link href="/dashboard/guest-code">
                  <Ticket />
                  Gest Code
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/qr-code-generator') || false}>
                <Link href="/dashboard/qr-code-generator">
                  <QrCode />
                  QR Code Generator
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton disabled isActive={pathname?.startsWith('/dashboard/analytics') || false}>
                <BarChart />
                Analytics
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/customers') || false}>
                <Link href="/dashboard/customers">
                  <Users />
                  Clientes y Impulsores
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/internal-communication') || false}>
                <Link href="/dashboard/internal-communication">
                  <span className="relative">
                    <MessageSquareText />
                    {hasUnread && (
                      <span className="absolute top-[-2px] right-[-2px] block h-2 w-2 rounded-full bg-accent" />
                    )}
                  </span>
                  Comunicación Interna
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/profile') || false}>
                <Link href="/dashboard/profile">
                  <User />
                  Perfil
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/my-team') || false}>
                <Link href="/dashboard/my-team">
                  <Users />
                  Mi Equipo
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/mis-comisiones') || false}>
                <Link href="/dashboard/mis-comisiones">
                  <DollarSign />
                  Mis comisiones
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/pagos') || false}>
                <Link href="/dashboard/pagos">
                  <CreditCard />
                  Pagos
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/transferencias') || false}>
                <Link href="/dashboard/transferencias">
                  <Send />
                  Transferencias
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/additional-services') || false}>
                <Link href="/dashboard/additional-services">
                    <Briefcase />
                    Servicios Adicionales
                </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/epl-community') || false}>
                <Link href="/dashboard/epl-community">
                    <Network />
                    EPL Community
                </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/herramientas') || false}>
                <Link href="/dashboard/herramientas">
                    <Wrench />
                    Herramientas
                </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>

            {userData?.role === 'admin' && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/payment-plan') || false}>
                    <Link href="/dashboard/payment-plan">
                      <ClipboardList />
                      Plan de pago
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/voice-command') || false}>
                    <Link href="/dashboard/voice-command">
                      <Mic />
                      Voice Command
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname?.startsWith('/dashboard/page-customization') || false}>
                    <Link href="/dashboard/page-customization">
                      <Palette />
                      Page Customization
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {userData ? (
             <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(avatarSeed)}`} />
                <AvatarFallback>{getInitials(userData.fullName || userData.email)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate">{displayName}</span>
                <span className="text-sm text-muted-foreground truncate">{displayEmail}</span>
              </div>
               <Button variant="ghost" size="icon" className="ml-auto flex-shrink-0" onClick={handleSignOut} aria-label="Sign out">
                  <LogOut />
               </Button>
            </div>
          ) : (
             <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset style={{ background: 'linear-gradient(to right, #1e3a8a, #4c1d95)' }}>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 h-10 w-10 md:h-8 md:w-8" />
          <div className="h-4 w-px bg-sidebar-border" />
          <nav className="flex items-center gap-2 text-sm">
            <span className="text-sidebar-foreground/70">Dashboard</span>
          </nav>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
