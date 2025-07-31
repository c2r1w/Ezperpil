
'use client';

import * as React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, Timestamp, where, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { fetchBusinessPackages } from '@/lib/packages';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Interfaces
interface PackageData {
  _id:string;
  id: string;
  name: string;
  activationFee: number;
  price: number;
  description: string;
  features: string[];
  imageUrl: string;
  paymentLink: string;
  active: boolean;
  targetRole: 'impulsor_de_impacto' | 'client' | 'all';
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

interface CommissionLevelSetting {
  percentage: number;
  active: boolean;
}

const initialPackages: PackageData[] = [
  {
    _id: 'basic-plan-01',
    id: 'basic-plan-01',
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
    id: 'pro-plan-02',
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
    id: 'enterprise-plan-03',
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


export default function MyTeamPage() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();
  
  const [currentUserData, setCurrentUserData] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [team, setTeam] = React.useState<Team | null>(null);
  const [packages, setPackages] = React.useState<PackageData[]>([]);
  const [affiliateCommissions, setAffiliateCommissions] = React.useState<CommissionLevelSetting[]>([]);
  const [clientCommissions, setClientCommissions] = React.useState<CommissionLevelSetting[]>([]);
  const [packagesLoading, setPackagesLoading] = React.useState(true);
  const [permissionError, setPermissionError] = React.useState(false);

  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  const fetchTeamData = React.useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setPermissionError(false);
    setLoading(true);
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists() || !userDoc.data().username) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find your user profile or username.' });
        setLoading(false);
        setTeam({ level1: [], level2: [], level3: [], level4: [] });
        return;
      }
      const currentUserProfile = { uid: user.uid, ...userDoc.data() } as UserProfile;
      setCurrentUserData(currentUserProfile);
      
      const teamData: Team = {
          level1: [],
          level2: [],
          level3: [],
          level4: [],
      };
      
      const fetchReferrals = async (usernames: string[]): Promise<UserProfile[]> => {
        if (usernames.length === 0) return [];
        const allReferrals: UserProfile[] = [];
        
        for (let i = 0; i < usernames.length; i += 30) {
            const batchUsernames = usernames.slice(i, i + 30);
            const q = query(collection(db, 'users'), where("sponsorUsername", "in", batchUsernames));
            const querySnapshot = await getDocs(q);
            const batchReferrals = querySnapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
            allReferrals.push(...batchReferrals);
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
      if (error.code === 'permission-denied') {
          setPermissionError(true);
      } else {
          toast({ variant: "destructive", title: "Error", description: `An unexpected error occurred: ${error.message}` });
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (!authLoading) {
        fetchTeamData();
    }
  }, [user, authLoading, fetchTeamData]);

  React.useEffect(() => {
    const loadPackages = async () => {
      setPackagesLoading(true);
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
      } finally {
        setPackagesLoading(false);
      }
    };

    loadPackages();

    // Load commissions
    try {
        const storedAffiliate = localStorage.getItem('paymentPlanAffiliateCommissions');
        const parsedAffiliate = storedAffiliate ? JSON.parse(storedAffiliate) : null;
        setAffiliateCommissions(Array.isArray(parsedAffiliate) && parsedAffiliate.length > 0
          ? parsedAffiliate
          : getDefaultAffiliateCommissionSettings());

        const storedClient = localStorage.getItem('paymentPlanClientCommissions');
        const parsedClient = storedClient ? JSON.parse(storedClient) : null;
        setClientCommissions(Array.isArray(parsedClient) && parsedClient.length > 0
            ? parsedClient
            : getDefaultClientCommissionSettings());
    } catch (error) {
        console.error("Could not load payment plan settings from localStorage", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load commission settings. Using defaults.' });
        setAffiliateCommissions(getDefaultAffiliateCommissionSettings());
        setClientCommissions(getDefaultClientCommissionSettings());
    }
    
    setPackagesLoading(false);
  }, [toast]);
  
  const handleResetTeam = async () => {
    if (!user || currentUserData?.role !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to perform this action.' });
      return;
    }

    setIsResetting(true);
    try {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);

      const usersToDelete = usersSnapshot.docs.filter(doc => doc.id !== user.uid);

      if (usersToDelete.length === 0) {
        toast({ title: 'No users to reset.' });
        setIsResetting(false);
        setIsResetDialogOpen(false);
        return;
      }

      const batch = writeBatch(db);
      usersToDelete.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      setTeam(null);
      
      toast({ title: "Success!", description: "All teams have been reset. All user documents (except yours) have been deleted." });

    } catch (error: any) {
        console.error("Error resetting teams:", error);
        if (error.code === 'permission-denied') {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'Could not delete user documents. Check Firestore security rules.' });
        } else {
            toast({ variant: "destructive", title: "Error", description: "Could not reset the teams." });
        }
    } finally {
        setIsResetting(false);
        setIsResetDialogOpen(false);
    }
  };


  const getPackagePrice = (user: UserProfile) => {
    if (!user.selectedPackageId || packages.length === 0) {
        return 'N/A';
    }
    const pkg = packages.find(p => p._id === user.selectedPackageId);
    if (!pkg) {
        return 'Unknown Pkg';
    }
    const finalPrice = (pkg.activationFee || 0) - (user.discountApplied || 0);
    return `$${finalPrice.toFixed(2)}`;
  };
  
    const getCommission = (user: UserProfile, level: number) => {
        if (!currentUserData || !user.selectedPackageId || packages.length === 0 || affiliateCommissions.length === 0 || clientCommissions.length === 0) {
            return 'N/A';
        }

        const pkg = packages.find(p => p._id === user.selectedPackageId);
        if (!pkg || !pkg.activationFee || pkg.activationFee <= 0) return 'N/A';
        
        const sponsorIsImpulsor = currentUserData.role === 'impulsor_de_impacto' || currentUserData.role === 'admin';
        const commissionSettings = sponsorIsImpulsor ? affiliateCommissions : clientCommissions;
        
        if (level > 0 && level <= commissionSettings.length && commissionSettings[level - 1].active) {
            const commissionRate = commissionSettings[level - 1].percentage / 100;
            const amountPaid = (pkg.activationFee || 0) - (user.discountApplied || 0);
            const commission = amountPaid * commissionRate;
            
            if (commission > 0) {
                return `$${commission.toFixed(2)}`;
            }
        }
        
        return '$0.00';
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);


  const renderUserTable = (users: UserProfile[], roleToShow: 'impulsor_de_impacto' | 'client', level: number) => {
    const filteredUsers = users.filter(u => u.role === roleToShow);

    if (filteredUsers.length === 0) {
        return <div className="text-center text-muted-foreground p-8">No {roleToShow === 'impulsor_de_impacto' ? 'Impulsores de Impacto' : 'Modificadores de Consumo'} en este nivel.</div>;
    }

    return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead>Price Paid</TableHead>
              <TableHead className="text-right">Commission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(u => (
                <TableRow key={u.uid}>
                    <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(u.fullName || u.email || 'user')}`} />
                            <AvatarFallback>{getInitials(u.fullName || u.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{u.fullName || 'No Name'}</p>
                            <p className="text-sm text-muted-foreground">@{u.username || 'no-username'}</p>
                        </div>
                    </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                    {u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">
                        {getPackagePrice(u)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                        {getCommission(u, level)}
                    </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
    );
  };
  
  const renderLevel = (level: number, users: UserProfile[]) => {
      const levelConsumidores = users.filter(u => u.role === 'client');
      const levelUsers = users.filter(u => u.role === 'impulsor_de_impacto');
      const totalMembers = levelConsumidores.length + levelUsers.length;

      const totalCommission = users.reduce((acc, u) => {
        const commissionStr = getCommission(u, level);
        if (typeof commissionStr === 'string' && commissionStr.startsWith('$')) {
            return acc + parseFloat(commissionStr.substring(1));
        }
        return acc;
      }, 0);

      return (
          <AccordionItem value={`level-${level}`}>
              <AccordionTrigger>
                  <span className="font-semibold text-lg">Nivel {level}</span>
                  <div className="flex items-center gap-4 mr-4">
                      <Badge variant="secondary">{totalMembers} Miembros</Badge>
                      <Badge variant="outline">{levelUsers.length} Impulsores</Badge>
                      <Badge variant="outline">{levelConsumidores.length} Modificadores de Consumo</Badge>
                      <Badge variant="default">Comisión: {formatCurrency(totalCommission)}</Badge>
                  </div>
              </AccordionTrigger>
              <AccordionContent>
                  <Tabs defaultValue="users">
                      <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="users">Impulsores de Impacto</TabsTrigger>
                          <TabsTrigger value="clients">Modificadores de Consumo</TabsTrigger>
                      </TabsList>
                      <TabsContent value="users">
                          {renderUserTable(users, 'impulsor_de_impacto', level)}
                      </TabsContent>
                      <TabsContent value="clients">
                          {renderUserTable(users, 'client', level)}
                      </TabsContent>
                  </Tabs>
              </AccordionContent>
          </AccordionItem>
      );
  }

  const isLoading = authLoading || loading || packagesLoading;

  if (isLoading) {
    return (
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-80 mt-2" />
          </div>
        </div>
        <Card>
            <CardContent className="p-6">
                <Skeleton className="h-64 w-full"/>
            </CardContent>
        </Card>
      </div>
    );
  }

    if (permissionError) {
        return (
            <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mi Equipo</h1>
                    <p className="text-muted-foreground">
                        Gestiona y visualiza tu red de referidos hasta 4 niveles.
                    </p>
                    </div>
                </div>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Action Required: Firestore Security Rules</AlertTitle>
                    <AlertDescription>
                    Your current security rules do not allow you to view other users' data, which is necessary to build your team list. An administrator needs to update the Firestore rules to allow authenticated users to read from the 'users' collection.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
  
  return (
    <>
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Equipo</h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza tu red de referidos hasta 4 niveles.
          </p>
        </div>
        {currentUserData?.role === 'admin' && (
            <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4"/>
                        Resetear Equipos
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta acción es irreversible y eliminará a TODOS los usuarios (excepto a ti) de la base de datos. Todos los equipos serán eliminados permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetTeam} disabled={isResetting}>
                            {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Sí, resetear todo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </div>
      
        <Card>
            <CardHeader>
            <CardTitle>Estructura de Referidos</CardTitle>
            <CardDescription>
                Expande cada nivel para ver la lista de Impulsores de Impacto y Modificadores de Consumo.
            </CardDescription>
            </CardHeader>
            <CardContent>
            {team && (team.level1.length > 0 || team.level2.length > 0 || team.level3.length > 0 || team.level4.length > 0) ? (
                <Accordion type="single" collapsible className="w-full">
                {renderLevel(1, team.level1)}
                {renderLevel(2, team.level2)}
                {renderLevel(3, team.level3)}
                {renderLevel(4, team.level4)}
                </Accordion>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">No se encontraron datos del equipo.</p>
                    <p className="text-xs text-muted-foreground max-w-md text-center mt-2">Aún no tienes referidos en tu equipo. ¡Comparte tu enlace para empezar a construir tu red!</p>
                </div>
            )}
            </CardContent>
        </Card>
    </div>
    </>
  );
}
