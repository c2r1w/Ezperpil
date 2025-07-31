
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, Edit, ExternalLink, ImageUp, Loader2, Lock, Package, Plus, Save, Trash2, Unlock, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUploadDialog } from '@/components/ui/FileUploadDialog';
import Rh from '@/lib/rh';

interface PackageData {
  _id?: string; // MongoDB _id
  id?: string; // For compatibility
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

interface UserData {
  role?: 'admin' | 'client' | 'impulsor_de_impacto';
}

const initialPackages: PackageData[] = [
  {
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

export default function BusinessPackagesPage() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [dataLoading, setDataLoading] = React.useState(true);
  
  const [packages, setPackages] = React.useState<PackageData[]>([]);
  const [packagesLoading, setPackagesLoading] = React.useState(true);

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  const [currentPackage, setCurrentPackage] = React.useState<PackageData | null>(null);
  const [editFormData, setEditFormData] = React.useState<Omit<PackageData, 'id' | 'features'> & { features: string } | null>(null);
  const [packageToDelete, setPackageToDelete] = React.useState<PackageData | null>(null);


  const [isSaving, setIsSaving] = React.useState(false);

  // Load user data
  React.useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            if (user.email === 'ezperfilsystem@gmail.com' && data.role !== 'admin') {
                await setDoc(userDocRef, { role: 'admin' }, { merge: true });
                data.role = 'admin';
                toast({ title: 'Acceso de Administrador Concedido', description: 'Tu cuenta ha sido actualizada a administrador.' });
            }
            setUserData(data);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not load user data." });
        }
      }
      setDataLoading(false);
    };
    if (!authLoading) fetchUserData();
  }, [user, authLoading, toast]);

  // Load packages from MongoDB
  React.useEffect(() => {
    refreshPackages();
  }, []);

  const refreshPackages = () => {
    setPackagesLoading(true);
    fetch('/api/business-packages')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch packages');
        const result = await res.json();
        if (result.success && Array.isArray(result.packages)) {
          setPackages(result.packages);
        } else {
          setPackages([]);
        }
      })
      .catch((error) => {
        console.error('Could not fetch packages from DB', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load packages.' });
      })
      .finally(() => setPackagesLoading(false));
  };
  
  const packagesToShow = React.useMemo(() => {
    if (userData?.role === 'admin') {
      return packages; // Admins see all packages (active and inactive)
    }
    const activePackages = packages.filter(p => p.active);
    if (userData?.role === 'client') {
      return activePackages.filter(p => p.targetRole === 'client' || p.targetRole === 'all');
    }
    if (userData?.role === 'impulsor_de_impacto') {
      return activePackages.filter(p => p.targetRole === 'impulsor_de_impacto' || p.targetRole === 'all');
    }
    // Fallback for users with no specific role, show all active packages.
    // This can happen briefly while user data is loading.
    return activePackages; 
  }, [packages, userData?.role]);


  const handleEditClick = (pkg: PackageData) => {
    setCurrentPackage(pkg);
    setEditFormData({ ...pkg, features: pkg.features.join('\n') });

    setIsEditDialogOpen(true);
  };

  const handleCreateClick = () => {
     setCurrentPackage(null); // Indicates a new package
     setEditFormData({
        name: '',
        activationFee: 0,
        price: 0,
        description: '',
        features: '',
        imageUrl: '',
        paymentLink: '',
        active: true,
        targetRole: 'impulsor_de_impacto',
     });
     setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (pkg: PackageData) => {
    setPackageToDelete(pkg);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!packageToDelete) return;
    const packageId = packageToDelete._id || packageToDelete.id;
    if (!packageId) return;
    
    try {
      const res = await fetch(`/api/business-packages/${packageId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete package');
      
      toast({ title: "Paquete eliminado", description: `El paquete "${packageToDelete.name}" ha sido eliminado.` });
      refreshPackages(); // Refresh from DB
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el paquete.' });
    }
    
    setIsDeleteDialogOpen(false);
    setPackageToDelete(null);
  };

  const handleToggleActive = async (pkg: PackageData, newActiveState: boolean) => {
    const packageId = pkg._id || pkg.id;
    if (!packageId) return;
    
    try {
      const res = await fetch(`/api/business-packages/${packageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActiveState }),
      });
      
      if (!res.ok) throw new Error('Failed to update package');
      
      toast({
        title: "Estado del paquete actualizado",
        description: `El paquete ha sido ${newActiveState ? 'activado' : 'desactivado'}.`,
      });
      refreshPackages(); // Refresh from DB
    } catch (error) {
      console.error('Error updating package:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el paquete.' });
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editFormData) return;
    const { name, value } = e.target;
    setEditFormData(prev => prev ? { ...prev, [name]: (name === 'price' || name === 'activationFee') ? parseFloat(value) || 0 : value } : null);
  };
  
  const handleImageFileChange = (e:string) => {
        setEditFormData(prev => prev ? { ...prev, imageUrl: e } : null);
     
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    setIsSaving(true);
    
    try {
      const packageData = {
        ...editFormData,
        features: editFormData.features.split('\n').filter(f => f.trim() !== ''),
      };

      let res;
      if (currentPackage) {
        // Update existing package
        const packageId = currentPackage._id || currentPackage.id;
        res = await fetch(`/api/business-packages/${packageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(packageData),
        });
      } else {
        // Create new package
        res = await fetch('/api/business-packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(packageData),
        });
      }

      if (!res.ok) throw new Error('Failed to save package');

      toast({ title: '¡Guardado!', description: 'El paquete de negocio ha sido guardado exitosamente.' });
      refreshPackages(); // Refresh from DB
      
      setIsEditDialogOpen(false);
      setCurrentPackage(null);
      setEditFormData(null);
    } catch (error) {
      console.error('Error saving package:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el paquete.' });
    }
    
    setIsSaving(false);
  };

  const isLoading = authLoading || dataLoading || packagesLoading;

  if (isLoading) {
    return (
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-80 w-full"/></CardContent></Card>)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Paquetes de Negocio</h1>
            <p className="text-muted-foreground">
              {userData?.role === 'admin' 
                ? "Crea y gestiona los planes de suscripción para tus usuarios."
                : "Explora nuestros planes y encuentra el que mejor se adapte a tus necesidades."
              }
            </p>
          </div>
          {userData?.role === 'admin' && (
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Paquete
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packagesToShow.map(pkg => (
            <Card key={pkg._id || pkg.id} className="flex flex-col">
              <div className="relative h-48 w-full">
                <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover rounded-t-lg" data-ai-hint="business plan abstract" />
                <Badge variant={pkg.active ? 'default' : 'secondary'} className="absolute top-3 right-3">{pkg.active ? 'Activo' : 'Inactivo'}</Badge>
              </div>
              <CardHeader>
                <CardTitle>{pkg.name}</CardTitle>
                 <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Cuota de Activación</p>
                    <p className="text-3xl font-bold text-primary">${pkg.activationFee}</p>
                </div>
                <div className="mt-1">
                    <p className="text-2xl font-bold">${pkg.price}<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <p className="text-muted-foreground text-sm">{pkg.description}</p>
                <ul className="space-y-2 text-sm">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                 {userData?.role === 'admin' ? (
                    <div className="flex flex-col w-full gap-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="text-sm font-medium">Estado Activo</span>
                          <Switch 
                            checked={pkg.active} 
                            onCheckedChange={(checked) => handleToggleActive(pkg, checked)}
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row w-full gap-2">
                            <Button variant="outline" className="w-full" asChild>
                                <a href={pkg.paymentLink} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Enlace de Pago
                                </a>
                            </Button>
                            <div className="flex w-full gap-2">
                                <Button variant="secondary" className="w-full" onClick={() => handleEditClick(pkg)}><Edit className="mr-2 h-4 w-4"/>Editar</Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(pkg)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    </div>
                 ) : (
                    <Button className="w-full" asChild>
                      <a href={pkg.paymentLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Subscribirse Ahora
                      </a>
                    </Button>
                 )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Dialogs for Admin only */}
      {userData?.role === 'admin' && (
        <>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{currentPackage ? 'Editar Paquete' : 'Crear Nuevo Paquete'}</DialogTitle>
                <DialogDescription>
                  {currentPackage ? 'Modifica los detalles del paquete.' : 'Completa los detalles para el nuevo paquete.'}
                </DialogDescription>
              </DialogHeader>
              {editFormData && (
                <form onSubmit={handleSave} className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Paquete</Label>
                    <Input id="name" name="name" value={editFormData.name} onChange={handleFormChange} required />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="targetRole">Dirigido a</Label>
                      <Select
                        value={editFormData.targetRole}
                        onValueChange={(value: 'impulsor_de_impacto' | 'client' | 'all') =>
                          setEditFormData(prev => prev ? { ...prev, targetRole: value } : null)
                        }
                      >
                        <SelectTrigger id="targetRole">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="impulsor_de_impacto">Impulsores de Impacto (Creadores)</SelectItem>
                          <SelectItem value="client">Modificador de consumo (Espectadores)</SelectItem>
                          <SelectItem value="all">Todos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  <div className="space-y-2">
                    <Label>Precios (USD)</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="activationFee" className="text-sm font-normal">Cuota de Activación</Label>
                            <Input id="activationFee" name="activationFee" type="number" value={editFormData.activationFee} onChange={handleFormChange} required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="price" className="text-sm font-normal">Suscripción Mensual</Label>
                            <Input id="price" name="price" type="number" value={editFormData.price} onChange={handleFormChange} required />
                        </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea id="description" name="description" value={editFormData.description} onChange={handleFormChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="features">Características (una por línea)</Label>
                    <Textarea id="features" name="features" value={editFormData.features} onChange={handleFormChange} rows={5} />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="imageUrl">Imagen del Paquete</Label>
                     <div className="flex items-center gap-4">
                        <Image src={editFormData.imageUrl || 'https://placehold.co/100x100.png'} alt="preview" width={80} height={80} className="rounded-md object-cover" />
                        
                        <FileUploadDialog onChange={e=>{
                          handleImageFileChange(Rh.ImgUrl+( e??"dp.png"));
                        }}
                        />
                        
                        {/* <Input id="imageUrl" type="file" accept="image/*" onChange={handleImageFileChange} className="flex-1"/> */}
                     </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentLink">Enlace de Pago (Stripe/PayPal)</Label>
                    <Input id="paymentLink" name="paymentLink" value={editFormData.paymentLink} onChange={handleFormChange} required />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                     <Label htmlFor="active">Paquete Activo</Label>
                     <Switch id="active" checked={editFormData.active} onCheckedChange={(checked) => setEditFormData(prev => prev ? { ...prev, active: checked } : null)} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Guardando...</> : <><Save className="mr-2 h-4 w-4"/> Guardar Cambios</>}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
          
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente el paquete "{packageToDelete?.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sí, eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
