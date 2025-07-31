
'use client';

import * as React from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, Timestamp, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { fetchBusinessPackages } from '@/lib/packages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, CreditCard, Crown, Save, X, Camera, UserSquare, Loader2, FileText, RefreshCw, Copy, Share2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


interface UserData {
  fullName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role?: 'admin' | 'client' | 'impulsor_de_impacto';
  createdAt?: Timestamp;
  voiceCommandEnabled?: boolean;
  sponsorUsername?: string;
  selectedPackageId?: string;
}

interface PackageData {
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

const profileFormSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es requerido'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  phoneNumber: z.string().min(10, 'El número de teléfono es requerido').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const paymentFormSchema = z.object({
  cardName: z.string().min(1, 'El nombre es requerido.'),
  cardNumber: z.string().refine((val) => /^\d{4} \d{4} \d{4} \d{4}$/.test(val), 'Debe ser un número de tarjeta válido.'),
  cardExpiry: z.string().refine((val) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(val), 'La fecha debe ser MM/YY.'),
  cardCvc: z.string().min(3, 'CVC debe tener 3-4 dígitos.').max(4),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;


interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'Completado' | 'Pendiente';
}

const initialBillingHistory: Transaction[] = [
    { id: 'txn_1', date: '2025-07-05', description: 'Cuota de Activación - Plan Pro', amount: 475.00, status: 'Completado' },
    { id: 'txn_2', date: '2025-08-04', description: 'Suscripción Mensual - Plan Pro', amount: 29.99, status: 'Completado' },
    { id: 'txn_3', date: '2025-09-04', description: 'Suscripción Mensual - Plan Pro', amount: 29.99, status: 'Pendiente' },
];

const BILLING_HISTORY_KEY = 'userBillingHistory_';
const PAYMENT_METHOD_KEY = 'userPaymentMethod_';

export default function ProfilePage() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [sponsorData, setSponsorData] = React.useState<UserData | null>(null);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isBillingHistoryOpen, setIsBillingHistoryOpen] = React.useState(false);
  const [billingHistory, setBillingHistory] = React.useState<Transaction[]>([]);
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);

  const [referralLink, setReferralLink] = React.useState('');
  const [canShare, setCanShare] = React.useState(false);
  
  const [packages, setPackages] = React.useState<PackageData[]>([]);
  const [packagesLoading, setPackagesLoading] = React.useState(true);

  // State for payment method
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentFormValues>({
      cardName: 'John M. Doe',
      cardNumber: '1234 5678 9012 1234',
      cardExpiry: '12/25',
      cardCvc: '123',
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: '',
      username: '',
      phoneNumber: '',
    },
  });
  
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: paymentMethod,
  });

  React.useEffect(() => {
    if (user) {
      try {
        const storedHistory = localStorage.getItem(BILLING_HISTORY_KEY + user.uid);
        if (storedHistory) {
          setBillingHistory(JSON.parse(storedHistory));
        } else {
          setBillingHistory([]);
        }

        const storedPayment = localStorage.getItem(PAYMENT_METHOD_KEY + user.uid);
        if (storedPayment) {
            const data = JSON.parse(storedPayment);
            setPaymentMethod(data);
            paymentForm.reset(data);
        }

      } catch (error) {
        console.error("Could not access localStorage for user data", error);
      }
    }
  }, [user, paymentForm]);

  React.useEffect(() => {
    // Load packages from MongoDB
    const loadPackages = async () => {
      setPackagesLoading(true);
      try {
        const fetchedPackages = await fetchBusinessPackages();
        if (fetchedPackages && fetchedPackages.length > 0) {
          setPackages(fetchedPackages);
        }
      } catch (error) {
        console.error("Could not load business packages", error);
      } finally {
        setPackagesLoading(false);
      }
    };

    loadPackages();
  }, []);


  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && !!navigator.share) {
      setCanShare(true);
    }
  }, []);

  React.useEffect(() => {
    if (userData?.username) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        setReferralLink(`${origin}/register?sponsor=${userData.username}`);
    } else {
        setReferralLink('');
    }
  }, [userData?.username]);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: '¡Enlace copiado!' });
  };

  const handleShare = async () => {
    if (!referralLink) return;
    const shareData = {
        title: 'Únete a mi equipo en EZ Perfil Webinars',
        text: `¡Regístrate usando mi enlace y empecemos a crecer juntos!`,
        url: referralLink,
    };
    try {
        await navigator.share(shareData);
        toast({ title: '¡Enlace compartido!' });
    } catch (err) {
        console.error("Share failed:", err);
        handleCopy(referralLink);
    }
  };

  const handleResetBilling = () => {
    if (!user) return;
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith(BILLING_HISTORY_KEY) || key.startsWith(PAYMENT_METHOD_KEY))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        setBillingHistory([]);
        setPaymentMethod({ cardName: 'John M. Doe', cardNumber: '1234 5678 9012 1234', cardExpiry: '12/25', cardCvc: '123' });

        toast({
            title: "Datos de Facturación Reseteados",
            description: "El historial de facturación y los métodos de pago de todos los usuarios han sido borrados.",
        });
    } catch(e) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron resetear los datos de facturación.",
        });
    }
    setIsResetDialogOpen(false);
  };


  React.useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            if (!data.email && user.email) data.email = user.email;

            // Ensure admin has the correct package
            if (user.email === 'ezperfilsystem@gmail.com' && data.selectedPackageId !== 'pro-plan-02') {
                const adminUpdate = { selectedPackageId: 'pro-plan-02' };
                await updateDoc(userDocRef, adminUpdate);
                Object.assign(data, adminUpdate); // Update local data to avoid re-fetch
            }

            setUserData(data);
            profileForm.reset({
              fullName: data.fullName || '',
              username: data.username || '',
              phoneNumber: data.phoneNumber || '',
            });

            if (data.sponsorUsername) {
              try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where("username", "==", data.sponsorUsername));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const sponsorDoc = querySnapshot.docs[0];
                    setSponsorData(sponsorDoc.data() as UserData);
                } else {
                    console.warn(`Sponsor with username "${data.sponsorUsername}" not found.`);
                }
              } catch (sponsorError) {
                  console.error("Could not fetch sponsor data due to permissions:", sponsorError);
              }
            }

          } else {
             const isAdmin = user.email === 'ezperfilsystem@gmail.com';
             const defaultData: UserData = {
                 fullName: user.displayName || (isAdmin ? 'Admin User' : ''),
                 email: user.email || '',
                 username: user.email?.split('@')[0] || (isAdmin ? 'admin' : ''),
                 phoneNumber: user.phoneNumber || '',
                 avatarUrl: user.photoURL || '',
                 role: isAdmin ? 'admin' : 'impulsor_de_impacto',
                 createdAt: Timestamp.now(),
                 ...(isAdmin && { selectedPackageId: 'pro-plan-02' })
             }
             await setDoc(userDocRef, defaultData);
             setUserData(defaultData);
             profileForm.reset({
                fullName: defaultData.fullName || '',
                username: defaultData.username || '',
                phoneNumber: defaultData.phoneNumber || '',
             });
          }
        } catch (error) {
            console.error("Error fetching user data:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudieron cargar los datos del perfil.',
            });
        } finally {
            setDataLoading(false);
        }
      } else if (!authLoading) {
        setDataLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, authLoading, profileForm, toast]);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setAvatarFile(null);
      return;
    }
    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
        toast({
            variant: "destructive",
            title: "Tipo de archivo no válido",
            description: "Por favor, selecciona un archivo de imagen (PNG, JPEG, GIF).",
        });
        setAvatarFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
        toast({
            variant: "destructive",
            title: "Archivo demasiado grande",
            description: "La imagen no puede superar los 5 MB.",
        });
        setAvatarFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
    }

    setAvatarFile(file);
  };

  const onSubmitProfile = async (values: ProfileFormValues) => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Error de Autenticación',
            description: 'No se pudo verificar tu sesión. Por favor, recarga la página.',
        });
        return;
    }
    setIsSaving(true);

    try {
      let avatarUrlToSave = userData?.avatarUrl || '';

      if (avatarFile) {
        const fileRef = storageRef(storage, `users/${user.uid}/avatar/${Date.now()}-${avatarFile.name}`);
        const snapshot = await uploadBytes(fileRef, avatarFile);
        avatarUrlToSave = await getDownloadURL(snapshot.ref);
      }

      const dataToUpdate = {
        fullName: values.fullName,
        username: values.username,
        phoneNumber: values.phoneNumber,
        avatarUrl: avatarUrlToSave,
      };

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, dataToUpdate, { merge: true });

      setUserData((prev) => (prev ? { ...prev, ...dataToUpdate } : null));
      setAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      toast({
        title: '¡Éxito!',
        description: 'Tu perfil ha sido actualizado correctamente.',
      });
      setIsEditing(false);

    } catch (error: any) {
      console.error('Error al actualizar el perfil:', error);
      
      let title = 'Error al Guardar';
      let description = 'No se pudo actualizar tu perfil. Por favor, inténtalo de nuevo.';

      const errorMessage = String(error.message).toLowerCase();
      
      if (errorMessage.includes('cors') || errorMessage.includes('network request failed')) {
          title = 'Error de Conexión (CORS)';
          description = 'La subida fue bloqueada por una política de seguridad (CORS). Por favor, ve a la Google Cloud Console, busca tu bucket de Storage, y en la pestaña de Permisos, cambia el control de acceso a "Uniforme".';
      } else if (error.code) {
        switch (error.code) {
          case 'storage/unauthorized':
            title = 'Error de Permisos de Storage';
            description = 'No tienes permiso para subir archivos. Esto suele ser un problema de CORS en la Google Cloud Console. Asegúrate de que el control de acceso del bucket sea "Uniforme".';
            break;
          case 'permission-denied':
            title = 'Error de Permisos de Firestore';
            description = 'El guardado fue bloqueado. Por favor, revisa tus Reglas de Seguridad de Firestore para permitir la escritura en la ruta "users".';
            break;
          default:
            title = 'Error Inesperado';
            description = `Ocurrió un error: ${error.message} (código: ${error.code})`;
            break;
        }
      }
      
      toast({
        variant: 'destructive',
        title: title,
        description: description,
        duration: 9000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitPayment = async (values: PaymentFormValues) => {
      if (!user) return;
      try {
          localStorage.setItem(PAYMENT_METHOD_KEY + user.uid, JSON.stringify(values));
          setPaymentMethod(values);
          toast({ title: 'Éxito', description: 'Tu método de pago ha sido actualizado.' });
          setIsPaymentDialogOpen(false);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el método de pago.' });
      }
  };


  const getInitials = (name?: string) => {
    if (!name?.trim()) return '??';
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
    return (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : '')).toUpperCase();
  };

  const isLoading = authLoading || dataLoading || packagesLoading;
  const selectedPackage = packages.find(p => p.id === userData?.selectedPackageId);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Perfil</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3 space-y-6">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                           <Skeleton className="h-7 w-40" />
                           <Skeleton className="h-4 w-48" />
                           <Skeleton className="h-5 w-16" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-card-foreground/5 border">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Plan Actual</p>
                        <Skeleton className="h-7 w-32 mt-1" />
                      </div>
                      <Crown className="h-8 w-8 text-muted-foreground"/>
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-full" />
                </CardFooter>
            </Card>
        </div>
      </div>
    );
  }

  if (!user || !userData) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              No se pudieron cargar los datos del usuario. Es posible que no hayas iniciado sesión. Por favor, intenta recargar la página o volver a iniciar sesión.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  const displayName = userData.fullName || userData.username || 'Usuario';
  const displayEmail = userData.email || 'No hay correo electrónico';
  const displayRole = userData.role === 'impulsor_de_impacto' ? 'Impulsor de Impacto' : userData.role === 'client' ? 'Modificador de Consumo' : userData.role;
  const avatarUrl = avatarFile ? URL.createObjectURL(avatarFile) : userData.avatarUrl;
  const avatarSeed = userData.fullName || userData.email || 'default-user';
  
  const roleColors = {
    admin: 'bg-primary text-primary-foreground',
    client: 'bg-accent text-accent-foreground',
    impulsor_de_impacto: 'bg-secondary text-secondary-foreground',
  };

  const nextPaymentDate = userData.createdAt?.toDate ? format(addDays(userData.createdAt.toDate(), 30), "dd 'de' MMMM, yyyy", { locale: es }) : 'N/A';
  const memberSinceDate = userData.createdAt?.toDate ? format(userData.createdAt.toDate(), "dd 'de' MMMM, yyyy", { locale: es }) : 'N/A';
  const cardLastFour = paymentMethod.cardNumber.slice(-4);

  return (
    <>
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Perfil</h2>
          {userData?.role === 'admin' && (
             <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resetear Historial de Facturación
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta acción no se puede deshacer. Esto eliminará permanentemente el historial de facturación de todos los usuarios y clientes del sistema de la memoria local.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetBilling} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Sí, resetear
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
                      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                        <Avatar className="h-16 w-16 border">
                          <AvatarImage src={avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(avatarSeed)}`} />
                          <AvatarFallback>{getInitials(userData.fullName)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1.5 flex-1">
                          <CardTitle className="text-2xl">{displayName}</CardTitle>
                          <CardDescription className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4" />
                            {displayEmail}
                          </CardDescription>
                          <Badge className={cn("w-fit capitalize", roleColors[userData.role || 'client'])}>{displayRole}</Badge>
                        </div>
                        {!isEditing && (
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Editar Perfil</Button>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Separator className="mb-6"/>
                        <div className="space-y-6">
                              {isEditing && (
                                  <div className="space-y-2">
                                      <Label htmlFor='avatar-upload'>Foto de Perfil</Label>
                                      <div className="flex items-center gap-2">
                                          <Input
                                            id="avatar-upload"
                                            type="file"
                                            ref={fileInputRef}
                                            className="flex-1"
                                            accept="image/png, image/jpeg, image/gif"
                                            onChange={handleFileSelect}
                                          />
                                      </div>
                                      {avatarFile && <p className="text-sm text-muted-foreground">Nuevo archivo: {avatarFile.name}</p>}
                                  </div>
                              )}
                            <div className="grid md:grid-cols-2 gap-6">
                              <FormField
                                control={profileForm.control}
                                name="fullName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nombre Completo</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Tu nombre completo" {...field} disabled={!isEditing} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nombre de Usuario</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Tu nombre de usuario" {...field} disabled={!isEditing}/>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Número de Teléfono</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Tu número de teléfono" {...field} disabled={!isEditing} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="space-y-2">
                                  <Label>Correo Electrónico</Label>
                                  <Input value={displayEmail} disabled />
                              </div>
                            </div>
                            {isEditing && (
                              <div className="flex justify-end gap-2 mt-6">
                                <Button variant="ghost" type="button" onClick={() => { setIsEditing(false); profileForm.reset({ fullName: userData.fullName || '', username: userData.username || '', phoneNumber: userData.phoneNumber || '' }); setAvatarFile(null); }}>
                                  <X className="mr-2 h-4 w-4"/> Cancelar
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                  {isSaving ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Guardando...</>
                                  ) : (
                                    <><Save className="mr-2 h-4 w-4"/> Guardar Cambios</>
                                  )}
                                </Button>
                              </div>
                            )}
                        </div>
                      </CardContent>
                  </form>
                </Form>
              {sponsorData && (
                  <>
                  <CardContent className="pt-0">
                      <Separator/>
                  </CardContent>
                  <CardHeader className="pt-4">
                      <CardTitle className="text-xl flex items-center gap-2">
                          <UserSquare className="h-5 w-5"/>
                          Información de tu Sponsor
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border">
                              <AvatarImage src={sponsorData.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(sponsorData.fullName || sponsorData.email || 'sponsor')}`} />
                              <AvatarFallback>{getInitials(sponsorData.fullName)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-semibold">{sponsorData.fullName || sponsorData.username}</p>
                              <p className="text-sm text-muted-foreground">{sponsorData.email}</p>
                          </div>
                      </div>
                  </CardContent>
                  </>
              )}
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Suscripción y Facturación</CardTitle>
                <CardDescription>Administra tu plan y detalles de pago.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-card-foreground/5 border">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plan Actual</p>
                    <p className="text-lg font-semibold text-primary">{selectedPackage?.name || 'No Plan'}</p>
                  </div>
                  <Crown className="h-8 w-8 text-primary"/>
                </div>
                <div className="space-y-2 text-sm">
                  {memberSinceDate !== 'N/A' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Miembro desde:</span>
                      <span className="font-medium">{memberSinceDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Próximo Pago:</span>
                    <span className="font-medium">{nextPaymentDate}</span>
                  </div>
                </div>
                <Separator/>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Método de Pago</p>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-6 w-6"/>
                      <div>
                        <p className="font-medium">Visa terminada en {cardLastFour}</p>
                        <p className="text-xs text-muted-foreground">Expira {paymentMethod.cardExpiry}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsPaymentDialogOpen(true)}>Actualizar</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-secondary hover:bg-secondary/80" onClick={() => setIsBillingHistoryOpen(true)}>
                    Ver Historial de Facturación
                </Button>
              </CardFooter>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Enlace de Referido</CardTitle>
                    <CardDescription>Comparte este enlace para que nuevos Impulsores de Impacto se unan a tu equipo.</CardDescription>
                </CardHeader>
                <CardContent>
                    {userData?.username ? (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Input value={referralLink} readOnly className="flex-1" />
                                <Button size="icon" className="shrink-0" onClick={() => handleCopy(referralLink)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            {canShare && (
                                <Button className="w-full" onClick={handleShare}>
                                    <Share2 className="mr-2 h-4 w-4"/>
                                    Compartir Enlace
                                </Button>
                            )}
                        </div>
                    ) : (
                         <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Falta el nombre de usuario</AlertTitle>
                            <AlertDescription>
                               Debes tener un nombre de usuario definido en tu perfil para generar un enlace de referido.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

          </div>
        </div>
      </div>
      <Dialog open={isBillingHistoryOpen} onOpenChange={setIsBillingHistoryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historial de Facturación</DialogTitle>
            <DialogDescription>
              Aquí está un registro de todos tus pagos y transacciones.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Recibo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.length > 0 ? (
                  billingHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{format(new Date(item.date), "dd MMM, yyyy", { locale: es })}</TableCell>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Completado' ? 'default' : 'secondary'} className={cn(item.status === 'Completado' && 'bg-green-500/80 hover:bg-green-500/90')}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">Ver Recibo</span>
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No hay historial de facturación disponible.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
       <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Actualizar Método de Pago</DialogTitle>
            <DialogDescription>
              Introduce la nueva información de tu tarjeta.
            </DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)} className="space-y-4 pt-4">
               <FormField
                control={paymentForm.control}
                name="cardName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre en la Tarjeta</FormLabel>
                    <FormControl>
                      <Input placeholder="John M. Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Tarjeta</FormLabel>
                    <FormControl>
                      <Input placeholder="1234 5678 9012 1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={paymentForm.control}
                    name="cardExpiry"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Expiración (MM/YY)</FormLabel>
                        <FormControl>
                         <Input placeholder="MM/YY" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={paymentForm.control}
                    name="cardCvc"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>CVC</FormLabel>
                        <FormControl>
                         <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsPaymentDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar Método de Pago</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

