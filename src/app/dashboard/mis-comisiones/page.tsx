'use client';

import * as React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { fetchBusinessPackages } from '@/lib/packages';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, DollarSign, Download, RefreshCw } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


// Interfaces
interface PackageData {
  _id: string;
  name: string;
  activationFee: number;
  price: number;
  targetRole: 'impulsor_de_impacto' | 'client' | 'all';
  description: string;
  features: string[];
  imageUrl: string;
  paymentLink: string;
  active: boolean;
}

interface UserProfile {
  uid: string;
  fullName?: string;
  username?: string;
  email?: string;
  role: 'admin' | 'client' | 'impulsor_de_impacto';
  createdAt?: Timestamp;
  sponsorUsername?: string;
  selectedPackageId?: string;
  discountApplied?: number;
}

interface Team {
  level1: UserProfile[];
  level2: UserProfile[];
  level3: UserProfile[];
  level4: UserProfile[];
}

interface CommissionEntry {
    fromUser: string;
    fromUserAvatar: string;
    fromUserUsername: string;
    amountPaid: number;
    commission: number;
}

interface CommissionData {
    totalEarnings: number;
    personalEarnings: number;
    teamEarnings: number;
    levelBreakdown: {
        level: number;
        earnings: number;
        count: number;
        commissions: CommissionEntry[];
    }[];
}

interface CommissionLevelSetting {
  percentage: number;
  active: boolean;
}

const initialPackages: PackageData[] = [
  {
    _id: 'basic-plan-01',
    name: 'Paquete Modificador de Consumo',
    price: 19.99,
    activationFee: 199,
    description: 'Perfecto para individuos y pequeños equipos que desean empezar.',
    features: ['1 Webinar al Mes', 'Hasta 50 Asistentes', 'Análisis Básico', 'Soporte por Email'],
    imageUrl: 'https://placehold.co/600x400.png',
    paymentLink: 'https://buy.stripe.com/test_1',
    active: true,
    targetRole: 'client',
  },
  {
    _id: 'pro-plan-02',
    name: 'Paquete Impulsor de Impacto',
    price: 29.99,
    activationFee: 475,
    description: 'Herramientas avanzadas para profesionales que buscan maximizar su alcance.',
    features: ['Webinars Ilimitados', 'Hasta 250 Asistentes', 'Análisis Avanzado', 'Soporte Prioritario 24/7', 'Integraciones CRM'],
    imageUrl: 'https://placehold.co/600x400.png',
    paymentLink: 'https://buy.stripe.com/test_2',
    active: true,
    targetRole: 'impulsor_de_impacto',
  },
  {
    _id: 'enterprise-plan-03',
    name: 'Paquete Acelerador de Vision',
    price: 0,
    activationFee: 199,
    description: 'Soluciones a medida para visionarios que requieren escalabilidad y personalización.',
    features: ['Todo en Pro', 'Hasta 1000 Asistentes', 'Manager de Cuenta Dedicado', 'Marca Blanca Completa', 'APIs de Integración'],
    imageUrl: 'https://placehold.co/600x400.png',
    paymentLink: 'https://buy.stripe.com/test_3',
    active: true,
    targetRole: 'impulsor_de_impacto',
  },
];

const getDefaultAffiliateCommissionSettings = (): CommissionLevelSetting[] => ([
  { percentage: 25, active: true },
  { percentage: 10, active: true },
  { percentage: 5, active: true },
  { percentage: 5, active: true },
]);

const getDefaultClientCommissionSettings = (): CommissionLevelSetting[] => ([
    { percentage: 20, active: true },
    { percentage: 10, active: true },
    { percentage: 5, active: true },
    { percentage: 0, active: false },
]);


export default function MisComisionesPage() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();
  
  const [dataLoading, setDataLoading] = React.useState(true);
  const [team, setTeam] = React.useState<Team | null>(null);
  const [packages, setPackages] = React.useState<PackageData[]>([]);
  const [commissionData, setCommissionData] = React.useState<CommissionData | null>(null);
  
  const [currentUserData, setCurrentUserData] = React.useState<UserProfile | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchAllData = async () => {
      if (!user) {
        setDataLoading(false);
        return;
      }
      
      try {
        // Load packages first
        try {
            const fetchedPackages = await fetchBusinessPackages();
            if (fetchedPackages && fetchedPackages.length > 0) {
              setPackages(fetchedPackages);
            } else {
              setPackages(initialPackages);
            }
        } catch (error) {
            console.error("Could not load business packages", error);
            setPackages(initialPackages);
        }

        // Then fetch user and team data
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists() || !userDoc.data().username) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not find your user profile or username.' });
          setDataLoading(false);
          return;
        }
        const currentUserProfile = { uid: user.uid, ...userDoc.data() } as UserProfile;
        setCurrentUserData(currentUserProfile);
        
        const teamData: Team = { level1: [], level2: [], level3: [], level4: [] };
        
        const fetchReferrals = async (usernames: string[]): Promise<UserProfile[]> => {
          if (usernames.length === 0) return [];
          const allReferrals: UserProfile[] = [];
          for (let i = 0; i < usernames.length; i += 30) {
              const batchUsernames = usernames.slice(i, i + 30);
              const q = query(collection(db, 'users'), where("sponsorUsername", "in", batchUsernames));
              const querySnapshot = await getDocs(q);
              allReferrals.push(...querySnapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
          }
          return allReferrals;
        };
        
        const l1Query = query(collection(db, "users"), where("sponsorUsername", "==", currentUserProfile.username!));
        const l1Snapshot = await getDocs(l1Query);
        teamData.level1 = l1Snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
        
        let l1Usernames = teamData.level1.map(u => u.username).filter((u): u is string => !!u);
        if(l1Usernames.length > 0) teamData.level2 = await fetchReferrals(l1Usernames);

        let l2Usernames = teamData.level2.map(u => u.username).filter((u): u is string => !!u);
        if(l2Usernames.length > 0) teamData.level3 = await fetchReferrals(l2Usernames);

        let l3Usernames = teamData.level3.map(u => u.username).filter((u): u is string => !!u);
        if(l3Usernames.length > 0) teamData.level4 = await fetchReferrals(l3Usernames);

        setTeam(teamData);
      } catch (error: any) {
        console.error("Error fetching team data:", error);
        toast({ variant: "destructive", title: "Error", description: `Could not fetch team data: ${error.message}` });
      } finally {
        setDataLoading(false);
      }
    };

    if (!authLoading) {
        fetchAllData();
    }
  }, [user, authLoading, toast]);

  React.useEffect(() => {
    // This effect recalculates commissions whenever the team or packages change.
    // It reads the commission settings directly from localStorage to ensure it's always up-to-date.
    if (!team || packages.length === 0 || !currentUserData) {
        setCommissionData(null);
        return;
    }
    
    let affiliateCommissions: CommissionLevelSetting[];
    let clientCommissions: CommissionLevelSetting[];

    try {
        const storedAffiliate = localStorage.getItem('paymentPlanAffiliateCommissions');
        const parsedAffiliate = storedAffiliate ? JSON.parse(storedAffiliate) : null;
        affiliateCommissions = Array.isArray(parsedAffiliate) && parsedAffiliate.length > 0
          ? parsedAffiliate
          : getDefaultAffiliateCommissionSettings();

        const storedClient = localStorage.getItem('paymentPlanClientCommissions');
        const parsedClient = storedClient ? JSON.parse(storedClient) : null;
        clientCommissions = Array.isArray(parsedClient) && parsedClient.length > 0
            ? parsedClient
            : getDefaultClientCommissionSettings();
    } catch (error) {
        console.error("Could not load payment plan settings from localStorage", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load commission settings. Using defaults.' });
        affiliateCommissions = getDefaultAffiliateCommissionSettings();
        clientCommissions = getDefaultClientCommissionSettings();
    }

    const calculatedData: CommissionData = {
        totalEarnings: 0,
        personalEarnings: 0,
        teamEarnings: 0,
        levelBreakdown: [],
    };

    const processLevel = (levelUsers: UserProfile[], level: number): { earnings: number, commissions: CommissionEntry[] } => {
        let levelEarnings = 0;
        const commissions: CommissionEntry[] = [];

        const sponsorIsImpulsor = currentUserData?.role === 'impulsor_de_impacto' || currentUserData?.role === 'admin';
        const commissionSettings = sponsorIsImpulsor ? affiliateCommissions : clientCommissions;

        for (const u of levelUsers) {
            const pkg = packages.find(p => p._id === u.selectedPackageId);
            if (!pkg || !pkg.activationFee || pkg.activationFee <= 0) continue;
            
            if (level > 0 && level <= commissionSettings.length && commissionSettings[level - 1].active) {
                const commissionRate = commissionSettings[level - 1].percentage / 100;
                const amountPaid = (pkg.activationFee || 0) - (u.discountApplied || 0);
                const commission = amountPaid * commissionRate;
                
                if (commission > 0) {
                    levelEarnings += commission;

                    commissions.push({
                        fromUser: u.fullName || 'No Name',
                        fromUserAvatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(u.fullName || u.email || 'user')}`,
                        fromUserUsername: u.username || 'no-username',
                        amountPaid: amountPaid,
                        commission: commission,
                    });
                }
            }
        }
        return { earnings: levelEarnings, commissions };
    };

    const levels = [team.level1, team.level2, team.level3, team.level4];
    levels.forEach((levelUsers, index) => {
        const level = index + 1;
        const { earnings, commissions } = processLevel(levelUsers, level);
        
        calculatedData.totalEarnings += earnings;
        if (level === 1) {
            calculatedData.personalEarnings = earnings;
        } else {
            calculatedData.teamEarnings += earnings;
        }

        calculatedData.levelBreakdown.push({
            level,
            earnings,
            count: commissions.length,
            commissions,
        });
    });

    setCommissionData(calculatedData);
  }, [team, packages, toast, currentUserData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleExport = () => {
    if (!commissionData || commissionData.totalEarnings === 0) {
        toast({ variant: 'destructive', title: 'No hay comisiones para exportar.' });
        return;
    }
    const headers = ['Level', 'From User', 'Username', 'Amount Paid', 'Commission'];
    const rows: string[] = [];

    commissionData.levelBreakdown.forEach(levelData => {
        levelData.commissions.forEach(commission => {
            const row = [
                levelData.level,
                `"${commission.fromUser.replace(/"/g, '""')}"`,
                `"${commission.fromUserUsername.replace(/"/g, '""')}"`,
                commission.amountPaid.toFixed(2),
                commission.commission.toFixed(2)
            ].join(',');
            rows.push(row);
        });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comisiones_${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: '¡Exportado!', description: 'La lista de comisiones ha sido descargada.' });
  };

  const handleReset = () => {
      try {
          localStorage.removeItem('paymentPlanAffiliateCommissions');
          localStorage.removeItem('paymentPlanClientCommissions');
          // We don't need to set state here, the calculation effect will pick up the changes on next run.
          toast({ title: 'Comisiones Reseteadas', description: 'Los porcentajes de comisión han sido reiniciados a sus valores por defecto en la página de Plan de Pago.' });
      } catch (e) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron resetear las comisiones.' });
      }
      setIsResetDialogOpen(false);
  };

  if (authLoading || dataLoading) {
     return (
        <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-80 mt-2" />
                </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full"/></CardContent></Card>)}
            </div>
            <Card><CardContent className="p-6"><Skeleton className="h-64 w-full"/></CardContent></Card>
        </div>
     );
  }

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Comisiones</h1>
          <p className="text-muted-foreground">
            Resumen y detalle de tus comisiones generadas por tu red.
          </p>
        </div>
        {currentUserData?.role === 'admin' && (
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4"/>
                    Exportar
                </Button>
                <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <RefreshCw className="mr-2 h-4 w-4"/>
                            Resetear Comisiones
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción reseteará todos los porcentajes de comisión a cero, lo que resultará en que todas las ganancias futuras sean $0 hasta que se configuren nuevamente en la página "Plan de Pago". Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Sí, resetear
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ganancias Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(commissionData?.totalEarnings || 0)}</div>
                <p className="text-xs text-muted-foreground">De todos los niveles</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ganancias Personales</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(commissionData?.personalEarnings || 0)}</div>
                <p className="text-xs text-muted-foreground">De tus referidos directos (Nivel 1)</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ganancias de Equipo</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(commissionData?.teamEarnings || 0)}</div>
                <p className="text-xs text-muted-foreground">De Niveles 2, 3 y 4</p>
            </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Desglose de Comisiones por Nivel</CardTitle>
                <CardDescription>
                    Expande cada nivel para ver el detalle de las comisiones generadas.
                </CardDescription>
            </CardHeader>
            <CardContent>
            {commissionData && commissionData.levelBreakdown.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                {commissionData.levelBreakdown.map(levelData => (
                    <AccordionItem value={`level-${levelData.level}`} key={levelData.level}>
                        <AccordionTrigger>
                            <span className="font-semibold text-lg">Nivel {levelData.level}</span>
                             <div className="flex items-center gap-4 mr-4">
                                <Badge variant="secondary">{levelData.count} Miembros</Badge>
                                <Badge variant="default">{formatCurrency(levelData.earnings)}</Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead className="text-right">Monto Pagado</TableHead>
                                        <TableHead className="text-right">Comisión</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {levelData.commissions.length > 0 ? (
                                        levelData.commissions.map((entry, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={entry.fromUserAvatar} />
                                                            <AvatarFallback>{getInitials(entry.fromUser)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{entry.fromUser}</p>
                                                            <p className="text-sm text-muted-foreground">@{entry.fromUserUsername}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(entry.amountPaid)}</TableCell>
                                                <TableCell className="text-right font-medium text-primary">{formatCurrency(entry.commission)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                         <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                No se generaron comisiones en este nivel.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                    <DollarSign className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">No se encontraron datos de comisiones.</p>
                </div>
            )}
            </CardContent>
       </Card>
    </div>
  );
}
