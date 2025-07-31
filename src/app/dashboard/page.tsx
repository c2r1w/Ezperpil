
'use client';

import * as React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Video, BarChart as BarChartIcon, RefreshCw, TrendingUp } from "lucide-react";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
  } from "@/components/ui/chart"
import { BarChart as RechartsBarChart, CartesianGrid, XAxis, Bar } from "recharts"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { fetchBusinessPackages } from '@/lib/packages';

// --- NEW INTERFACES & DEFAULTS ---
interface CommissionLevelSetting {
  percentage: number;
  active: boolean;
}

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
// --- END NEW ---

interface UserData {
  fullName?: string;
  role?: 'admin' | 'client' | 'impulsor_de_impacto';
  selectedPackageId?: string;
  discountApplied?: number;
  sponsorUsername?: string;
  username?: string;
  uid: string;
}

interface PackageData {
  id: string;
  name: string;
  activationFee: number;
}


interface Visitor {
  fullName: string;
  email: string;
  inviter?: string;
}

interface Member {
    fullName: string;
    phoneNumber: string;
    inviter?: string;
}

const initialStats = {
    totalRevenue: 0,
    netRevenue: 0,
    attendees: 0,
    webinarsHosted: 0,
    engagementRate: 0,
    revenueChange: 0,
    netRevenueChange: 0,
    attendeesChange: 0,
    webinarsChange: 0,
    engagementChange: 0,
};

const initialChartData = [
    { month: "January", attendees: 186 },
    { month: "February", attendees: 305 },
    { month: "March", attendees: 237 },
    { month: "April", attendees: 273 },
    { month: "May", attendees: 209 },
    { month: "June", attendees: 214 },
];

const initialPackages: PackageData[] = [
    {
      id: 'basic-plan-01',
      name: 'Paquete Modificador de Consumo',
      activationFee: 199,
    },
    {
      id: 'pro-plan-02',
      name: 'Paquete Impulsor de Impacto',
      activationFee: 475,
    },
    {
      id: 'enterprise-plan-03',
      name: 'Paquete Acelerador de Vision',
      activationFee: 199,
    },
];
  
const chartConfig = {
  attendees: {
    label: "Attendees",
    color: "hsl(var(--primary))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
}

const DASHBOARD_STATS_KEY = 'dashboardStats';
const CHART_DATA_KEY = 'dashboardChartData';
const VISITORS_KEY = 'webinarVisitors';
const MEMBERS_KEY = 'webinarMembers';
const DASHBOARD_RESET_FLAG = 'dashboardIsReset';


export default function DashboardPage() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();

  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [dataLoading, setDataLoading] = React.useState(true);

  const [stats, setStats] = React.useState(initialStats);
  const [chartData, setChartData] = React.useState(initialChartData);
  const [registeredVisitors, setRegisteredVisitors] = React.useState<Visitor[]>([]);
  const [registeredMembers, setRegisteredMembers] = React.useState<Member[]>([]);
  const [isReset, setIsReset] = React.useState(false);

  // Load static data and reset flag from localStorage on mount
  React.useEffect(() => {
    if (authLoading) return;
    
    const loadAndFilterRegistrationData = async () => {
        try {
            const resetFlag = localStorage.getItem(DASHBOARD_RESET_FLAG);
            let userProfile: UserData | null = null;
            
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    userProfile = userDoc.data() as UserData;
                }
            }

            if (resetFlag === 'true') {
                setIsReset(true);
                setRegisteredVisitors([]);
                setRegisteredMembers([]);
            } else {
                const allVisitors: Visitor[] = JSON.parse(localStorage.getItem(VISITORS_KEY) || '[]');
                const allMembers: Member[] = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]');
                
                if (userProfile?.role === 'admin') {
                    setRegisteredVisitors(allVisitors);
                    setRegisteredMembers(allMembers);
                } else if (userProfile?.username) {
                    setRegisteredVisitors(allVisitors.filter(v => v.inviter === userProfile?.username));
                    setRegisteredMembers(allMembers.filter(m => m.inviter === userProfile?.username));
                } else {
                    setRegisteredVisitors([]);
                    setRegisteredMembers([]);
                }
                
                const storedStatsJSON = localStorage.getItem(DASHBOARD_STATS_KEY);
                if (storedStatsJSON) {
                    const storedStats = JSON.parse(storedStatsJSON);
                    setStats(prev => ({ ...initialStats, ...prev, ...storedStats }));
                }
    
                const storedChartData = localStorage.getItem(CHART_DATA_KEY);
                if (storedChartData) setChartData(JSON.parse(storedChartData));
            }
        } catch (e) {
            console.error("Failed to load dashboard data from localStorage", e);
        }
    };

    loadAndFilterRegistrationData();
    
  }, [user, authLoading]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setDataLoading(false);
        return;
    }

    if (isReset) {
      setStats(initialStats);
      setChartData(initialChartData.map(d => ({...d, attendees: 0})));
      setDataLoading(false);
      return;
    }

    const loadAllDataAndCalculate = async () => {
        setDataLoading(true);
        try {
            // 1. Load Packages from MongoDB
            let loadedPackages: PackageData[] = [];
            try {
                const packages = await fetchBusinessPackages();
                loadedPackages = packages.map((p: any) => ({
                    id: p._id || p.id,
                    name: p.name,
                    activationFee: parseFloat(String(p.activationFee)) || 0,
                }));
                
                if (loadedPackages.length === 0) {
                    loadedPackages = initialPackages;
                }
            } catch (e) {
                console.error("Failed to load packages from MongoDB", e);
                loadedPackages = initialPackages; // Fallback
            }

            // 2. Fetch current user data
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
                setDataLoading(false);
                return;
            }
            const currentUserData = { uid: user.uid, ...userDoc.data() } as UserData;
            setUserData(currentUserData);

            // 3. Perform calculations based on role
            if (currentUserData.role === 'admin') {
                const usersQuery = query(collection(db, 'users'));
                const usersSnapshot = await getDocs(usersQuery);
                const allUsers = usersSnapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserData));

                let totalRevenue = 0;
                allUsers.forEach(purchaser => {
                    if (purchaser.selectedPackageId) {
                        const pkg = loadedPackages.find(p => p.id === purchaser.selectedPackageId);
                        if (pkg) {
                            const amountPaid = (pkg.activationFee || 0) - (purchaser.discountApplied || 0);
                            totalRevenue += amountPaid;
                        }
                    }
                });
                
                let totalDeductions = 0;
                const adminId = user.uid;
                const transfersQuery = query(collection(db, 'transfers'), where('senderId', '==', adminId), where('type', 'in', ['Comisión', 'Bono']));
                const transfersSnapshot = await getDocs(transfersQuery);

                transfersSnapshot.forEach(doc => {
                    const transferData = doc.data();
                    if (transferData.type === 'Comisión' || transferData.type === 'Bono') {
                        totalDeductions += transferData.amount;
                    }
                });
                
                const netRevenue = totalRevenue - totalDeductions;
                
                setStats(prevStats => {
                    const newStats = { ...prevStats, totalRevenue, netRevenue };
                    localStorage.setItem(DASHBOARD_STATS_KEY, JSON.stringify(newStats));
                    return newStats;
                });
            } else {
                // Logic for non-admin users ('impulsor_de_impacto' and 'client')
                let affiliateCommissions: CommissionLevelSetting[];
                let clientCommissions: CommissionLevelSetting[];

                try {
                    const storedAffiliate = localStorage.getItem('paymentPlanAffiliateCommissions');
                    affiliateCommissions = storedAffiliate ? JSON.parse(storedAffiliate) : getDefaultAffiliateCommissionSettings();

                    const storedClient = localStorage.getItem('paymentPlanClientCommissions');
                    clientCommissions = storedClient ? JSON.parse(storedClient) : getDefaultClientCommissionSettings();
                } catch (error) {
                    affiliateCommissions = getDefaultAffiliateCommissionSettings();
                    clientCommissions = getDefaultClientCommissionSettings();
                }

                if (!currentUserData.username) {
                    setStats(prev => ({...prev, totalRevenue: 0}));
                    setDataLoading(false);
                    return;
                }

                const fetchReferrals = async (usernames: string[]): Promise<UserData[]> => {
                  if (usernames.length === 0) return [];
                  const allReferrals: UserData[] = [];
                  for (let i = 0; i < usernames.length; i += 30) {
                      const batchUsernames = usernames.slice(i, i + 30);
                      const q = query(collection(db, 'users'), where("sponsorUsername", "in", batchUsernames));
                      const querySnapshot = await getDocs(q);
                      allReferrals.push(...querySnapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserData)));
                  }
                  return allReferrals;
                };
                
                const l1Query = query(collection(db, "users"), where("sponsorUsername", "==", currentUserData.username));
                const l1Users = (await getDocs(l1Query)).docs.map(d => ({ uid: d.id, ...d.data() } as UserData));
                
                const l2Users = await fetchReferrals(l1Users.map(u => u.username!).filter(Boolean));
                const l3Users = await fetchReferrals(l2Users.map(u => u.username!).filter(Boolean));
                const l4Users = await fetchReferrals(l3Users.map(u => u.username!).filter(Boolean));
                
                const team = [l1Users, l2Users, l3Users, l4Users];
                let totalTeamRevenue = 0;

                const isImpulsor = currentUserData.role === 'impulsor_de_impacto';
                const commissionSettings = isImpulsor ? affiliateCommissions : clientCommissions;

                team.forEach((levelUsers, index) => {
                    const level = index + 1;
                    if (level > commissionSettings.length || !commissionSettings[level - 1].active) return;
                    
                    const commissionRate = commissionSettings[level - 1].percentage / 100;
                    if (commissionRate <= 0) return;

                    levelUsers.forEach(u => {
                        const pkg = loadedPackages.find(p => p.id === u.selectedPackageId);
                        if (pkg && pkg.activationFee > 0) {
                            const amountPaid = pkg.activationFee - (u.discountApplied || 0);
                            totalTeamRevenue += amountPaid * commissionRate;
                        }
                    });
                });

                setStats(prevStats => ({ ...prevStats, totalRevenue: totalTeamRevenue, netRevenue: 0 }));
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            toast({
                variant: "destructive",
                title: "Dashboard Error",
                description: "Could not load all necessary dashboard data."
            });
        } finally {
            setDataLoading(false);
        }
    };
    
    loadAllDataAndCalculate();
  }, [user, authLoading, isReset, toast]);
  
  const handleToggleReset = () => {
    const newResetState = !isReset;
    setIsReset(newResetState);
    
    if (newResetState) {
        // We are resetting, so clear everything
        const emptyStats = {
            totalRevenue: 0,
            netRevenue: 0,
            attendees: 0,
            webinarsHosted: 0,
            engagementRate: 0,
            revenueChange: 0,
            netRevenueChange: 0,
            attendeesChange: 0,
            webinarsChange: 0,
            engagementChange: 0,
        };
        const emptyChartData = initialChartData.map(d => ({ ...d, attendees: 0 }));

        try {
            localStorage.setItem(DASHBOARD_RESET_FLAG, 'true');
            localStorage.removeItem(DASHBOARD_STATS_KEY);
            localStorage.removeItem(CHART_DATA_KEY);
            localStorage.removeItem(VISITORS_KEY);
            localStorage.removeItem(MEMBERS_KEY);

            setStats(emptyStats);
            setChartData(emptyChartData);
            setRegisteredVisitors([]);
            setRegisteredMembers([]);
            
            toast({
                title: "Stats Reset",
                description: "Dashboard statistics have been reset to zero.",
            });
        } catch (e) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Could not reset stats.",
            });
        }
    } else {
        // We are toggling back to live data, just remove the flag.
        // The useEffect for calculation will automatically re-run.
        try {
            localStorage.removeItem(DASHBOARD_RESET_FLAG);
            toast({
                title: "Live Stats Restored",
                description: "Dashboard is now showing live data.",
            });
        } catch(e) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Could not restore stats.",
            });
        }
    }
  };


  if (authLoading || dataLoading) {
    return (
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-80" />
          <Skeleton className="col-span-3 h-80" />
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
            {userData?.role === 'admin' 
                ? 'Admin Dashboard' 
                : userData?.role === 'client' 
                    ? 'Dashboard Modificador de Consumo' 
                    : 'Dashboard Impulsor de Impacto'
            }
        </h2>
         {userData?.role === 'admin' && (
             <Button variant="outline" onClick={handleToggleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isReset ? 'Show Live Stats' : 'Reset Stats'}
            </Button>
        )}
      </div>
      {userData?.role !== 'admin' && (
         <p className="text-muted-foreground">
            ¡Bienvenido de nuevo, {userData?.fullName || (userData?.role === 'client' ? 'Modificador de Consumo' : 'Impulsor de Impacto')}!
         </p>
      )}
      <div className={cn(
        "grid gap-4 md:grid-cols-2",
        userData?.role === 'admin' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
      )}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.revenueChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        {userData?.role === 'admin' && (
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Net Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">${stats.netRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">
                +{stats.netRevenueChange.toFixed(1)}% from last month
                </p>
            </CardContent>
            </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.attendees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.attendeesChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webinars Hosted</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.webinarsHosted}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.webinarsChange} since last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engagement Rate
            </CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.engagementRate}%</div>
            <p className="text-xs text-muted-foreground">
              +{stats.engagementChange}% from last webinar
            </p>
          </CardContent>
        </Card>
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <RechartsBarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="attendees" fill="var(--color-attendees)" radius={4} />
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="col-span-4 md:col-span-3">
            <CardHeader>
              <CardTitle>Recent Registrations</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                {[...registeredVisitors].reverse().slice(0, 5).map((visitor, index) => (
                    <div key={index} className="flex items-center">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(visitor.fullName)}`} alt="Avatar" data-ai-hint="person avatar"/>
                            <AvatarFallback>{getInitials(visitor.fullName)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">{visitor.fullName}</p>
                            <p className="text-sm text-muted-foreground">{visitor.email}</p>
                        </div>
                    </div>
                ))}
                 {registeredVisitors.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No recent registrations.</p>
                 )}
               </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Audience</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="visitors">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="visitors">Visitantes Registrados</TabsTrigger>
                  <TabsTrigger value="webinar-members">Miembros del Próximo Webinar</TabsTrigger>
                </TabsList>
                <TabsContent value="visitors" className="pt-4">
                  <div className="space-y-4">
                    {registeredVisitors.length > 0 ? (
                        [...registeredVisitors].reverse().map((visitor, index) => (
                             <div key={index} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(visitor.fullName)}`} alt="Avatar" data-ai-hint="person avatar" />
                                    <AvatarFallback>{getInitials(visitor.fullName)}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{visitor.fullName}</p>
                                    <p className="text-sm text-muted-foreground">{visitor.email}</p>
                                </div>
                                <div className="ml-auto font-medium text-sm text-muted-foreground">Nuevo Visitante</div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No visitors registered.</p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="webinar-members" className="pt-4">
                   <div className="space-y-4">
                    {registeredMembers.length > 0 ? (
                        [...registeredMembers].reverse().map((member, index) => (
                            <div key={index} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(member.fullName)}`} alt="Avatar" data-ai-hint="person avatar" />
                                    <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{member.fullName}</p>
                                    <p className="text-sm text-muted-foreground">{member.phoneNumber}</p>
                                </div>
                                <div className="ml-auto font-medium text-sm text-muted-foreground">Inscrito al Webinar</div>
                            </div>
                        ))
                    ) : (
                         <p className="text-sm text-muted-foreground text-center py-8">No members registered.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
    </div>
    </>
  );
}
