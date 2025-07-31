
'use client';

import * as React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Save, Loader2, AlertCircle, Percent, Users, User, Settings, Plus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// State structures
interface CommissionLevelSetting {
  percentage: number;
  active: boolean;
}

interface ForcedMatrixLevelSetting {
  percentage: number;
}

interface ForcedMatrixState {
  active: boolean;
  levels: ForcedMatrixLevelSetting[];
  activationLink: string;
  activationPrice: number;
}

interface ServiceSetting {
  id: number;
  name: string;
  active: boolean;
  price?: number;
}

// LocalStorage Keys
const AFFILIATE_COMMISSIONS_KEY = 'paymentPlanAffiliateCommissions';
const CLIENT_COMMISSIONS_KEY = 'paymentPlanClientCommissions';
const FORCED_MATRIX_KEY = 'paymentPlanForcedMatrix';
const AFFILIATE_SERVICES_KEY = 'paymentPlanAffiliateServices';
const CLIENT_SERVICES_KEY = 'paymentPlanClientServices';

// Default values factory functions
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

const getDefaultForcedMatrixSettings = (): ForcedMatrixState => ({
    active: false,
    levels: Array(10).fill(0).map(() => ({ percentage: 5 })),
    activationLink: 'https://buy.stripe.com/test_forced_matrix',
    activationPrice: 25,
});

const getDefaultServiceSettings = (): ServiceSetting[] =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Servicio ${i + 1}`,
    active: true,
    price: 0,
  }));


interface UserData {
  role?: 'admin' | 'client' | 'impulsor_de_impacto';
}

export default function PaymentPlanPage() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();
  
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [dataLoading, setDataLoading] = React.useState(true);
  
  const [affiliateCommissions, setAffiliateCommissions] = React.useState<CommissionLevelSetting[]>(getDefaultAffiliateCommissionSettings);
  const [clientCommissions, setClientCommissions] = React.useState<CommissionLevelSetting[]>(getDefaultClientCommissionSettings);
  const [forcedMatrix, setForcedMatrix] = React.useState<ForcedMatrixState>(getDefaultForcedMatrixSettings);
  const [affiliateServices, setAffiliateServices] = React.useState<ServiceSetting[]>(getDefaultServiceSettings);
  const [clientServices, setClientServices] = React.useState<ServiceSetting[]>(getDefaultServiceSettings);

  const [isSaving, setIsSaving] = React.useState(false);

  // Fetch user role
  React.useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      }
      setDataLoading(false);
    };
    if (!authLoading) fetchUserData();
  }, [user, authLoading]);
  
  // Load settings from localStorage
  React.useEffect(() => {
    try {
      const storedAffiliateCommissions = localStorage.getItem(AFFILIATE_COMMISSIONS_KEY);
      if (storedAffiliateCommissions) setAffiliateCommissions(JSON.parse(storedAffiliateCommissions));
      
      const storedClientCommissions = localStorage.getItem(CLIENT_COMMISSIONS_KEY);
      if (storedClientCommissions) setClientCommissions(JSON.parse(storedClientCommissions));

      const storedForcedMatrix = localStorage.getItem(FORCED_MATRIX_KEY);
      if (storedForcedMatrix) setForcedMatrix(JSON.parse(storedForcedMatrix));
      
      const storedAffiliateServices = localStorage.getItem(AFFILIATE_SERVICES_KEY);
      if (storedAffiliateServices) {
        const parsed = JSON.parse(storedAffiliateServices);
        const withIds = parsed.map((s: any, i: number) => ({ ...s, id: s.id ?? Date.now() + i, price: s.price ?? 0 }));
        setAffiliateServices(withIds);
      }
        
      const storedClientServices = localStorage.getItem(CLIENT_SERVICES_KEY);
      if (storedClientServices) {
          const parsed = JSON.parse(storedClientServices);
          const withIds = parsed.map((s: any, i: number) => ({ ...s, id: s.id ?? Date.now() + i, price: s.price ?? 0 }));
          setClientServices(withIds);
      }

    } catch (error) {
      console.error("Could not load payment plan settings from localStorage", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load saved settings.' });
    }
  }, [toast]);
  
  const handleAffiliateCommissionChange = (index: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
    setAffiliateCommissions(prev => prev.map((item, i) => i === index ? { ...item, percentage: numValue } : item));
  };
  
  const handleAffiliateLevelToggle = (index: number, checked: boolean) => {
    setAffiliateCommissions(prev => prev.map((item, i) => i === index ? { ...item, active: checked } : item));
  };
  
  const handleClientCommissionChange = (index: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
    setClientCommissions(prev => prev.map((item, i) => i === index ? { ...item, percentage: numValue } : item));
  };

  const handleClientLevelToggle = (index: number, checked: boolean) => {
    setClientCommissions(prev => prev.map((item, i) => i === index ? { ...item, active: checked } : item));
  };

  const handleForcedMatrixPercentageChange = (index: number, value: string) => {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) return;
      setForcedMatrix(prev => ({ ...prev, levels: prev.levels.map((item, i) => i === index ? { ...item, percentage: numValue } : item)}));
  };

  const handleForcedMatrixInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setForcedMatrix(prev => ({
          ...prev,
          [name]: name === 'activationPrice' ? parseFloat(value) || 0 : value,
      }));
  };

  const handleForcedMatrixToggle = (checked: boolean) => {
      setForcedMatrix(prev => ({ ...prev, active: checked }));
  };
  
    // Handlers for Affiliate Services
    const handleAffiliateServiceNameChange = (id: number, name: string) => {
        setAffiliateServices(prev => prev.map(s => s.id === id ? { ...s, name } : s));
    };
    const handleAffiliateServiceToggle = (id: number, checked: boolean) => {
        setAffiliateServices(prev => prev.map(s => s.id === id ? { ...s, active: checked } : s));
    };
    const handleAddAffiliateService = () => {
        setAffiliateServices(prev => [...prev, { id: Date.now(), name: `Nuevo Servicio ${prev.length + 1}`, active: true, price: 0 }]);
    };
    const handleRemoveAffiliateService = (id: number) => {
        setAffiliateServices(prev => prev.filter(s => s.id !== id));
    };
    const handleAffiliateServicePriceChange = (id: number, value: string) => {
        const price = parseFloat(value);
        if (!isNaN(price) && price >= 0) {
            setAffiliateServices(prev => prev.map(s => (s.id === id ? { ...s, price } : s)));
        } else if (value === '') {
            setAffiliateServices(prev => prev.map(s => (s.id === id ? { ...s, price: 0 } : s)));
        }
    };

    // Handlers for Client Services
    const handleClientServiceNameChange = (id: number, name: string) => {
        setClientServices(prev => prev.map(s => s.id === id ? { ...s, name } : s));
    };
    const handleClientServiceToggle = (id: number, checked: boolean) => {
        setClientServices(prev => prev.map(s => s.id === id ? { ...s, active: checked } : s));
    };
    const handleAddClientService = () => {
        setClientServices(prev => [...prev, { id: Date.now(), name: `Nuevo Servicio ${prev.length + 1}`, active: true, price: 0 }]);
    };
    const handleRemoveClientService = (id: number) => {
        setClientServices(prev => prev.filter(s => s.id !== id));
    };
    const handleClientServicePriceChange = (id: number, value: string) => {
        const price = parseFloat(value);
        if (!isNaN(price) && price >= 0) {
            setClientServices(prev => prev.map(s => (s.id === id ? { ...s, price } : s)));
        } else if (value === '') {
            setClientServices(prev => prev.map(s => (s.id === id ? { ...s, price: 0 } : s)));
        }
    };
  
  const handleSaveSettings = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(AFFILIATE_COMMISSIONS_KEY, JSON.stringify(affiliateCommissions));
      localStorage.setItem(CLIENT_COMMISSIONS_KEY, JSON.stringify(clientCommissions));
      localStorage.setItem(FORCED_MATRIX_KEY, JSON.stringify(forcedMatrix));
      localStorage.setItem(AFFILIATE_SERVICES_KEY, JSON.stringify(affiliateServices));
      localStorage.setItem(CLIENT_SERVICES_KEY, JSON.stringify(clientServices));
      toast({ title: '¡Guardado!', description: 'El plan de pago ha sido actualizado.' });
    } catch (error) {
      console.error("Failed to save settings to localStorage", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = authLoading || dataLoading;

  if (isLoading) {
    return (
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <Skeleton className="h-10 w-64" />
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full"/></CardContent></Card>
      </div>
    );
  }
  
  if (userData?.role !== 'admin') {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>Debes ser administrador para gestionar el plan de pago.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderCommissionCard = (
    title: string, icon: React.ReactNode, description: string, settings: CommissionLevelSetting[],
    handlePercentageChange: (index: number, value: string) => void,
    handleToggleChange: (index: number, checked: boolean) => void
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{icon} {title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.map((level, index) => (
          <div key={index} className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor={`level-${title}-${index}`} className="text-base font-medium">Nivel {index + 1}</Label>
            <div className="flex items-center gap-4">
                <div className="relative w-24">
                  <Input id={`level-percentage-${title}-${index}`} type="number" value={level.percentage} onChange={(e) => handlePercentageChange(index, e.target.value)} className="pr-6"/>
                  <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <Switch id={`level-active-${title}-${index}`} checked={level.active} onCheckedChange={(checked) => handleToggleChange(index, checked)}/>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderServiceActivationCard = (
    title: string,
    icon: React.ReactNode,
    description: string,
    services: ServiceSetting[],
    handleNameChange: (id: number, name: string) => void,
    handleToggleChange: (id: number, checked: boolean) => void,
    handleAddService: () => void,
    handleRemoveService: (id: number) => void,
    handlePriceChange?: (id: number, value: string) => void
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{icon} {title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            {services.map((service) => (
                <div key={service.id} className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-lg border p-3">
                    <Input 
                        id={`service-name-${title}-${service.id}`}
                        value={service.name}
                        onChange={(e) => handleNameChange(service.id, e.target.value)}
                        className="h-9 w-full flex-1"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {handlePriceChange && (
                            <div className="relative flex-1 sm:flex-initial sm:w-28">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                                <Input
                                    id={`service-price-${title}-${service.id}`}
                                    type="number"
                                    value={service.price ?? ''}
                                    onChange={(e) => handlePriceChange(service.id, e.target.value)}
                                    className="h-9 pl-7"
                                    placeholder="0.00"
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                            <Switch id={`service-active-${title}-${service.id}`} checked={service.active} onCheckedChange={(checked) => handleToggleChange(service.id, checked)} />
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveService(service.id)} className="text-destructive hover:bg-destructive/10 h-9 w-9">
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <Button variant="outline" className="w-full" onClick={handleAddService}>
            <Plus className="mr-2 h-4 w-4"/>
            Añadir Servicio
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan de Pago</h1>
          <p className="text-muted-foreground">
            Configura los porcentajes y estados de comisiones para Impulsores de Impacto y Modificadores de Consumo.
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
            {renderCommissionCard( "Impulsores de Impacto: Comisiones por Nivel", <Users className="h-6 w-6" />, "Define las comisiones para los Impulsores de Impacto.", affiliateCommissions, handleAffiliateCommissionChange, handleAffiliateLevelToggle )}
            {renderServiceActivationCard( 
                "Activación de Servicios (Impulsores de Impacto)", 
                <Settings className="h-6 w-6" />, 
                "Habilita o deshabilita servicios para Impulsores de Impacto. Añade un precio para un servicio de pago único.", 
                affiliateServices, 
                handleAffiliateServiceNameChange, 
                handleAffiliateServiceToggle, 
                handleAddAffiliateService, 
                handleRemoveAffiliateService,
                handleAffiliateServicePriceChange
            )}
        </div>
        <div className="space-y-8">
            {renderCommissionCard( "Modificador de consumo: Comisiones por Nivel", <User className="h-6 w-6" />, "Define las comisiones para los Modificadores de Consumo.", clientCommissions, handleClientCommissionChange, handleClientLevelToggle )}
            {renderServiceActivationCard( 
                "Activación de Servicios (Modificador de consumo)", 
                <Settings className="h-6 w-6" />, 
                "Habilita o deshabilita servicios para Modificadores de Consumo. Añade un precio para que sea un servicio de pago mensual.", 
                clientServices, 
                handleClientServiceNameChange, 
                handleClientServiceToggle, 
                handleAddClientService, 
                handleRemoveClientService,
                handleClientServicePriceChange
            )}
        </div>
      </div>

       <div className="pt-8">
          <Card>
              <CardHeader>
                  <div className="flex items-center justify-between">
                      <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                              <Users className="h-6 w-6" /> Matriz Forzada 3x10
                          </CardTitle>
                          <CardDescription>Define las comisiones para la matriz forzada. Actívala para aplicarla.</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                          <Label htmlFor="forced-matrix-active" className="text-sm font-medium">
                              {forcedMatrix.active ? 'Activa' : 'Inactiva'}
                          </Label>
                          <Switch id="forced-matrix-active" checked={forcedMatrix.active} onCheckedChange={handleForcedMatrixToggle}/>
                      </div>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1">
                        <Label htmlFor="forced-matrix-activation-price">Precio de Activación ($)</Label>
                        <Input
                            id="forced-matrix-activation-price"
                            name="activationPrice"
                            type="number"
                            value={forcedMatrix.activationPrice}
                            onChange={handleForcedMatrixInputChange}
                            placeholder="Ej. 25"
                            disabled={!forcedMatrix.active}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="forced-matrix-activation-link">Enlace de Pago</Label>
                        <Input
                            id="forced-matrix-activation-link"
                            name="activationLink"
                            value={forcedMatrix.activationLink}
                            onChange={handleForcedMatrixInputChange}
                            placeholder="https://stripe.com/..."
                            disabled={!forcedMatrix.active}
                        />
                    </div>
                  </div>
                  <Separator className="mb-4" />
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {forcedMatrix.levels.map((level, index) => (
                          <div key={index} className="space-y-1">
                              <Label htmlFor={`forced-matrix-level-${index}`} className="text-sm font-medium">
                                  Nivel {index + 1}
                              </Label>
                              <div className="relative">
                                  <Input id={`forced-matrix-level-percentage-${index}`} type="number" value={level.percentage} onChange={(e) => handleForcedMatrixPercentageChange(index, e.target.value)} className="pr-6" disabled={!forcedMatrix.active} />
                                  <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              </div>
                          </div>
                      ))}
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
