
'use client';

import * as React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, getDocs, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { fetchBusinessPackages } from '@/lib/packages';
import { format, parseISO, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Bar, Tooltip } from "recharts";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, CheckCircle, Clock, RefreshCw, Download, Search, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Interfaces
interface UserProfile {
  role?: 'admin' | 'client' | 'impulsor_de_impacto';
  fullName?: string;
  username?: string;
  uid: string;
  selectedPackageId?: string;
  discountApplied?: number;
  sponsorUsername?: string;
  createdAt?: { toDate: () => Date };
  balance?: number;
}

interface Payment {
  id: string;
  userId: string;
  userName:string;
  type: 'Referido Personal' | 'Bono de Equipo' | 'Comisión' | 'Bono' | 'Refund' | 'Préstamo';
  amount: number;
  date: string; // ISO string
  status: 'Pendiente' | 'Pagado' | 'Incompleto';
  sourceUser: string;
  note?: string;
}

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

const PAYMENTS_KEY = 'pagos_payment_statuses';

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

const chartConfig = {
    Ganancias: { label: "Ganancias", color: "hsl(var(--primary))" },
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};


export default function PagosPage() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();
  
  const [userData, setUserData] = React.useState<UserProfile | null>(null);
  const [balance, setBalance] = React.useState(0);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  
  const [loading, setLoading] = React.useState(true);
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  React.useEffect(() => {
    const fetchAndProcessData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const currentUserProfile = userDoc.exists() ? ({ uid: user.uid, ...userDoc.data() } as UserProfile) : null;
        setUserData(currentUserProfile);
        if (currentUserProfile) {
            setBalance(currentUserProfile.balance || 0);
        }

        let loadedPackages: PackageData[] = [];
        try {
            const fetchedPackages = await fetchBusinessPackages();
            if (fetchedPackages && fetchedPackages.length > 0) {
              loadedPackages = fetchedPackages;
            } else {
              loadedPackages = initialPackages;
            }
        } catch (error) {
            console.error("Could not load business packages", error);
            loadedPackages = initialPackages;
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
        
        if (!currentUserProfile) {
            setLoading(false);
            return;
        }

        let calculatedPayments: Payment[] = [];

        if (currentUserProfile.role === 'admin') {
          const usersQuery = query(collection(db, 'users'));
          const usersSnapshot = await getDocs(usersQuery);
          const allUsersList = usersSnapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
          
          const usersByUsername = new Map(allUsersList.map(u => [u.username, u]));
          
          allUsersList.forEach(purchaser => {
            if (purchaser.selectedPackageId && purchaser.sponsorUsername) {
              const pkg = loadedPackages.find(p => p._id === purchaser.selectedPackageId);
              if (!pkg || !pkg.activationFee || pkg.activationFee <= 0) return;

              const amountPaid = pkg.activationFee - (purchaser.discountApplied || 0);
              let currentSponsorUsername = purchaser.sponsorUsername;
              
              for (let level = 1; level <= 4; level++) {
                if (!currentSponsorUsername) break;
                const sponsor = usersByUsername.get(currentSponsorUsername);
                if (!sponsor) break;

                const sponsorIsImpulsor = sponsor.role === 'impulsor_de_impacto' || sponsor.role === 'admin';
                const commissionSettings = sponsorIsImpulsor ? affiliateCommissions : clientCommissions;
                
                if (level > 0 && level <= commissionSettings.length && commissionSettings[level - 1].active) {
                    const commissionRate = commissionSettings[level - 1].percentage / 100;
                    const commissionAmount = amountPaid * commissionRate;
                    if(commissionAmount > 0) {
                        calculatedPayments.push({
                            id: `com-${purchaser.uid}-l${level}`,
                            userId: sponsor.uid,
                            userName: sponsor.fullName || sponsor.username || 'N/A',
                            type: level === 1 ? 'Referido Personal' : 'Bono de Equipo',
                            amount: commissionAmount,
                            date: purchaser.createdAt?.toDate().toISOString() || new Date().toISOString(),
                            status: 'Pendiente',
                            sourceUser: purchaser.fullName || purchaser.username || 'N/A',
                        });
                    }
                }
                
                currentSponsorUsername = sponsor.sponsorUsername || '';
              }
            }
          });
        } else {
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
          const l1Users = (await getDocs(l1Query)).docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
          
          const l2Users = await fetchReferrals(l1Users.map(u => u.username!).filter(Boolean));
          const l3Users = await fetchReferrals(l2Users.map(u => u.username!).filter(Boolean));
          const l4Users = await fetchReferrals(l3Users.map(u => u.username!).filter(Boolean));
          
          const processLevelForUser = (levelUsers: UserProfile[], level: number) => {
            const sponsorIsImpulsor = currentUserProfile?.role === 'impulsor_de_impacto' || currentUserProfile?.role === 'admin';
            const commissionSettings = sponsorIsImpulsor ? affiliateCommissions : clientCommissions;

            for (const purchaser of levelUsers) {
                const pkg = loadedPackages.find(p => p._id === purchaser.selectedPackageId);
                if (pkg && pkg.activationFee > 0) {
                                        
                    if(level > 0 && level <= commissionSettings.length && commissionSettings[level-1].active) {
                        const commissionRate = commissionSettings[level-1].percentage / 100;
                        const amountPaid = pkg.activationFee - (purchaser.discountApplied || 0);
                        const commissionAmount = amountPaid * commissionRate;
                        
                        if(commissionAmount > 0) {
                            calculatedPayments.push({
                                id: `com-${purchaser.uid}-l${level}`,
                                userId: user.uid,
                                userName: currentUserProfile.fullName || currentUserProfile.username || 'N/A',
                                type: level === 1 ? 'Referido Personal' : 'Bono de Equipo',
                                amount: commissionAmount,
                                date: purchaser.createdAt?.toDate().toISOString() || new Date().toISOString(),
                                status: 'Pendiente',
                                sourceUser: purchaser.fullName || purchaser.username || 'N/A',
                            });
                        }
                    }
                }
            }
          };

          processLevelForUser(l1Users, 1);
          processLevelForUser(l2Users, 2);
          processLevelForUser(l3Users, 3);
          processLevelForUser(l4Users, 4);
        }

        const storedStatuses = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '{}');
        const finalPayments = calculatedPayments.map(p => ({
            ...p,
            status: storedStatuses[p.id] || 'Pendiente'
        }));
        setPayments(finalPayments);

      } catch (error: any) {
        console.error("Error processing payments:", error);
        toast({ variant: 'destructive', title: 'Error', description: `No se pudieron cargar los datos de pago: ${error.message}` });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
        fetchAndProcessData();
    }
  }, [user, authLoading, toast]);


  const handleStatusChange = (paymentId: string, newStatus: 'Pendiente' | 'Pagado' | 'Incompleto') => {
    if (userData?.role !== 'admin') return;

    const updatedPayments = payments.map(p => (p.id === paymentId ? { ...p, status: newStatus } : p));
    setPayments(updatedPayments);

    try {
        const storedStatuses = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '{}');
        storedStatuses[paymentId] = newStatus;
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify(storedStatuses));
    } catch (e) {
        console.error("Failed to save payment status to localStorage", e);
    }

    toast({
      title: 'Estado Actualizado',
      description: `La comisión ${paymentId} ha sido marcada como ${newStatus}.`,
    });
  };
  
  const handleReset = () => {
    try {
        localStorage.removeItem(PAYMENTS_KEY);
        setPayments(payments.map(p => ({ ...p, status: 'Pendiente' })));
        toast({
            title: "Datos Reseteados",
            description: "Todos los estados de pago han sido reiniciados a 'Pendiente'."
        });
    } catch (e) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron resetear las estadísticas."
        });
    }
    setIsResetDialogOpen(false);
  };

  const paymentsForDisplay = React.useMemo(() => {
    let userFiltered = (userData?.role === 'admin')
        ? payments
        : payments.filter(p => p.userId === userData?.uid);

    if (!searchTerm) return userFiltered;

    const lowercasedFilter = searchTerm.toLowerCase();
    return userFiltered.filter(p =>
      p.userName.toLowerCase().includes(lowercasedFilter)
    );
  }, [payments, userData, searchTerm]);

  const { paidBalance, pendingBalance, chartData } = React.useMemo(() => {
    const balances = paymentsForDisplay.reduce(
        (acc, p) => {
            if (p.status === 'Pagado') acc.paidBalance += p.amount;
            else acc.pendingBalance += p.amount;
            return acc;
        }, { paidBalance: 0, pendingBalance: 0 }
    );

    const generateChartData = () => {
        const dailyMap = new Map<string, number>();
        const weeklyMap = new Map<string, number>();
        const monthlyMap = new Map<string, number>();

        paymentsForDisplay.forEach(p => {
            const date = parseISO(p.date);
            if (p.status !== 'Pagado') return; // Only chart paid commissions

            // Daily
            const dayKey = format(startOfDay(date), 'yyyy-MM-dd');
            dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + p.amount);

            // Weekly
            const weekKey = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + p.amount);
            
            // Monthly
            const monthKey = format(startOfMonth(date), 'yyyy-MM-01');
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + p.amount);
        });

        const formatMap = (map: Map<string, number>, formatStr: string) => 
             Array.from(map.entries())
                .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                .map(([date, amount]) => ({ date: format(parseISO(date), formatStr, { locale: es }), Ganancias: amount }));

        return {
            daily: formatMap(dailyMap, 'MMM d'),
            weekly: formatMap(weeklyMap, "'Sem' w"),
            monthly: formatMap(monthlyMap, 'MMM')
        };
    };

    return { ...balances, chartData: generateChartData() };
  }, [paymentsForDisplay]);
  
  const handleExport = () => {
    if (paymentsForDisplay.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No hay datos para exportar',
      });
      return;
    }

    const headers = ['id', 'userId', 'userName', 'type', 'amount', 'date', 'status', 'sourceUser', 'note'];
    const csvRows = [
      headers.join(','),
      ...paymentsForDisplay.map(row =>
        headers.map(header =>
          JSON.stringify((row as any)[header])
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'historial_pagos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: '¡Exportado!',
      description: 'El historial de pagos ha sido descargado.',
    });
  };
  
  const renderChart = (data: {date: string; Ganancias: number}[]) => (
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <RechartsBarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="Ganancias" fill="var(--color-Ganancias)" radius={4} />
          </RechartsBarChart>
      </ChartContainer>
  );


  if (authLoading || loading) {
    return (
        <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full"/></CardContent></Card>)}
            </div>
            <Card><CardContent className="p-6"><Skeleton className="h-80 w-full"/></CardContent></Card>
        </div>
    );
  }

  return (
    <>
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagos y Comisiones</h1>
          <p className="text-muted-foreground">
            {userData?.role === 'admin' 
                ? 'Gestiona y visualiza todos los pagos de comisiones.'
                : 'Revisa tus ganancias y el estado de tus pagos.'
            }
          </p>
        </div>
        {userData?.role === 'admin' && (
          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <AlertDialogTrigger asChild>
                  <Button variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resetear Estados
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto reiniciará los estados de todas las comisiones a 'Pendiente'. No borrará los datos.
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
        )}
      </div>
      
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance Disponible</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(balance)}</div>
                <p className="text-xs text-muted-foreground">Tu saldo actual para transferencias.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagos Recibidos</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(paidBalance)}</div>
                <p className="text-xs text-muted-foreground">Fondos que han sido procesados y pagados.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(pendingBalance)}</div>
                <p className="text-xs text-muted-foreground">Comisiones generadas pendientes de pago.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ganancias Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(paidBalance + pendingBalance)}</div>
                <p className="text-xs text-muted-foreground">Suma de balance pagado y pendiente.</p>
            </CardContent>
        </Card>
      </div>

      {/* Chart and Table */}
      <div className="grid gap-4 grid-cols-1">
        <Card>
            <CardHeader>
                <CardTitle>Resumen de Ganancias</CardTitle>
                <CardDescription>Visualiza tus ganancias pagadas a lo largo del tiempo.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="monthly">
                    <TabsList className="grid w-full sm:w-auto sm:grid-cols-3 mb-4">
                        <TabsTrigger value="daily">Diario</TabsTrigger>
                        <TabsTrigger value="weekly">Semanal</TabsTrigger>
                        <TabsTrigger value="monthly">Mensual</TabsTrigger>
                    </TabsList>
                    <TabsContent value="daily">{renderChart(chartData.daily)}</TabsContent>
                    <TabsContent value="weekly">{renderChart(chartData.weekly)}</TabsContent>
                    <TabsContent value="monthly">{renderChart(chartData.monthly)}</TabsContent>
                </Tabs>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle>Historial de Pagos</CardTitle>
                        <CardDescription>Detalle de todas las comisiones generadas.</CardDescription>
                    </div>
                     <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
                        <div className="relative flex-1 sm:flex-initial sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar por beneficiario..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Beneficiario</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead>Tipo</TableHead>
                             <TableHead>Originado por</TableHead>
                             <TableHead>Nota</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paymentsForDisplay.length > 0 ? (
                            paymentsForDisplay.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.userName}</TableCell>
                                    <TableCell className="text-right font-semibold text-primary">{formatCurrency(p.amount)}</TableCell>
                                    <TableCell>{p.type}</TableCell>
                                    <TableCell>{p.sourceUser}</TableCell>
                                    <TableCell>{p.note || '-'}</TableCell>
                                    <TableCell>{format(parseISO(p.date), 'dd MMM, yyyy')}</TableCell>
                                    <TableCell className="text-center">
                                        {userData?.role === 'admin' ? (
                                            <Select value={p.status} onValueChange={(value: 'Pendiente' | 'Pagado' | 'Incompleto') => handleStatusChange(p.id, value)}>
                                                <SelectTrigger className="w-32 mx-auto h-9">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                                                    <SelectItem value="Pagado">Pagado</SelectItem>
                                                    <SelectItem value="Incompleto">Incompleto</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge variant={p.status === 'Pagado' ? 'default' : 'secondary'} className={cn(
                                                p.status === 'Pagado' && 'bg-green-500/80 hover:bg-green-500/90',
                                                p.status === 'Incompleto' && 'bg-yellow-500/80 text-background hover:bg-yellow-500/90'
                                            )}>
                                                {p.status}
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No se encontraron pagos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
