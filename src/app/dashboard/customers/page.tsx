
'use client';

import * as React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, updateDoc, deleteDoc, Timestamp, setDoc, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { fetchBusinessPackages } from '@/lib/packages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Loader2, Package, AlertCircle, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, getInitials } from '@/lib/utils';

interface PackageData {
  _id: any;
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
    _id: undefined
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
    _id: undefined
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
    _id: undefined
  },
];

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

export default function CustomersPage() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();
  
  const [currentUserData, setCurrentUserData] = React.useState<UserProfile | null>(null);
  const [displayedUsers, setDisplayedUsers] = React.useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = React.useState(true);
  const [dataLoading, setDataLoading] = React.useState(true);

  const [packages, setPackages] = React.useState<PackageData[]>([]);
  const [packagesLoading, setPackagesLoading] = React.useState(true);

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  const [currentUserToEdit, setCurrentUserToEdit] = React.useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [listToReset, setListToReset] = React.useState<'clients' | 'users' | null>(null);
  const [isResetting, setIsResetting] = React.useState(false);

  const [permissionError, setPermissionError] = React.useState(false);

  const fetchUsers = React.useCallback(async (profile: UserProfile | null) => {
    if (!profile) {
      setUsersLoading(false);
      return;
    }

    setUsersLoading(true);
    setPermissionError(false);
    
    let usersQuery;
    if (profile.role === 'admin') {
      usersQuery = query(collection(db, 'users'));
    } else if ((profile.role === 'impulsor_de_impacto' || profile.role === 'client') && profile.username) {
      usersQuery = query(collection(db, 'users'), where("sponsorUsername", "==", profile.username));
    } else {
      setDisplayedUsers([]);
      setUsersLoading(false);
      return;
    }

    try {
      const querySnapshot = await getDocs(usersQuery);
      const usersList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          role: data.role || 'impulsor_de_impacto',
        } as UserProfile;
      });
      setDisplayedUsers(usersList);
    } catch (error: any) {
      console.error("Error fetching users list:", error);
      if (error.code === 'permission-denied') {
        setPermissionError(true);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load the user list.' });
      }
      setDisplayedUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [toast]);
  
  React.useEffect(() => {
    const fetchCurrentUserData = async () => {
      if (!user) {
        setDataLoading(false);
        setUsersLoading(false);
        return;
      }

      setDataLoading(true);
      const userDocRef = doc(db, 'users', user.uid);

      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const profile = { uid: user.uid, ...userDoc.data() } as UserProfile;
          setCurrentUserData(profile);
          await fetchUsers(profile);
        } else {
          setCurrentUserData(null);
          setUsersLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setCurrentUserData(null);
        setUsersLoading(false);
      } finally {
        setDataLoading(false);
      }
    };

    if (!authLoading) {
      fetchCurrentUserData();
    }
  }, [user, authLoading, fetchUsers]);

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
  }, []);


  const handleEditClick = (userToEdit: UserProfile) => {
    setCurrentUserToEdit(userToEdit);
    setIsEditDialogOpen(true);
  };
  
  const handleRoleChange = (newRole: 'admin' | 'client' | 'impulsor_de_impacto') => {
      if (currentUserToEdit) {
          setCurrentUserToEdit({...currentUserToEdit, role: newRole});
      }
  };

  const handleSaveUser = async () => {
      if (!currentUserToEdit) return;
      setIsSaving(true);
      try {
          const userDocRef = doc(db, 'users', currentUserToEdit.uid);
          await updateDoc(userDocRef, {
              role: currentUserToEdit.role,
              fullName: currentUserToEdit.fullName,
          });
          toast({ title: 'Success', description: 'User has been updated successfully.' });
          setIsEditDialogOpen(false);
          setCurrentUserToEdit(null);
          await fetchUsers(currentUserData);
      } catch (error) {
          console.error('Error updating user:', error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not update the user.' });
      } finally {
          setIsSaving(false);
      }
  };

  const handleDeleteClick = (userToDel: UserProfile) => {
    setUserToDelete(userToDel);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
        await deleteDoc(doc(db, 'users', userToDelete.uid));
        toast({ title: "User document deleted", description: `The user "${userToDelete.fullName}" has been removed from the database.` });
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
        await fetchUsers(currentUserData);
    } catch (error) {
        console.error('Error deleting user:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the user document.' });
    }
  };

  const handleExport = (usersToExport: UserProfile[], listName: string) => {
    if (usersToExport.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Data',
        description: `There are no ${listName} to export.`,
      });
      return;
    }

    const getPricePaid = (user: UserProfile) => {
        if (!user.selectedPackageId || packages.length === 0) return '';
        const pkg = packages.find(p => p._id === user.selectedPackageId);
        if (!pkg) return '';
        const finalPrice = (pkg.activationFee || 0) - (user.discountApplied || 0);
        return finalPrice.toFixed(2);
    };

    const headers = ['uid', 'fullName', 'username', 'email', 'role', 'sponsorUsername', 'createdAt', 'packagePricePaid'];
    const csvRows = usersToExport.map(user => {
        const row = {
            uid: user.uid,
            fullName: user.fullName || '',
            username: user.username || '',
            email: user.email || '',
            role: user.role,
            sponsorUsername: user.sponsorUsername || '',
            createdAt: user.createdAt ? user.createdAt.toDate().toISOString() : '',
            packagePricePaid: getPricePaid(user),
        };
        return headers.map(header => `"${String(row[header as keyof typeof row]).replace(/"/g, '""')}"`).join(',');
    });
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `${listName}_export_${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
        title: 'Exported!',
        description: `The ${listName} list has been downloaded.`,
    })
  };

  const openResetDialog = (list: 'clients' | 'users') => {
    setListToReset(list);
    setIsResetDialogOpen(true);
  };

  const confirmReset = async () => {
    if (!listToReset || !user) return; 

    const listToProcess = listToReset === 'clients' ? consumidores : regularUsers;
    const usersToDelete = listToProcess.filter(u => u.uid !== user.uid);

    if (usersToDelete.length === 0) {
        toast({ title: 'No users to reset.' });
        setIsResetDialogOpen(false);
        return;
    }
    
    setIsResetting(true);
    try {
        const deletePromises = usersToDelete.map(u => deleteDoc(doc(db, 'users', u.uid)));
        await Promise.all(deletePromises);
        
        toast({
            title: 'Success!',
            description: `The ${listToReset} list has been reset successfully.`,
        });
        
        await fetchUsers(currentUserData);

    } catch (error) {
        console.error(`Firebase Reset Error for ${listToReset} list:`, error);
        toast({
            variant: 'destructive',
            title: 'Error al Resetear',
            description: `No se pudo resetear la lista. Revisa la consola del desarrollador (F12) para ver el error específico de Firebase.`,
            duration: 9000,
        });
    } finally {
        setIsResetting(false);
        setIsResetDialogOpen(false);
        setListToReset(null);
    }
  };


  const roleColors: { [key in 'admin' | 'client' | 'impulsor_de_impacto']: string } = {
    admin: 'bg-primary text-primary-foreground',
    client: 'bg-accent text-accent-foreground',
    impulsor_de_impacto: 'bg-secondary text-secondary-foreground',
  };

  const consumidores = displayedUsers.filter(u => u.role === 'client');
  const regularUsers = displayedUsers.filter(u => u.role === 'impulsor_de_impacto');

  const isLoading = authLoading || dataLoading || usersLoading || packagesLoading;

  if (isLoading) {
    return (
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <div className="space-y-2">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-5 w-96" />
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full"/></CardContent></Card>
      </div>
    );
  }

  if (permissionError) {
    return (
        <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
             <div className="flex items-center justify-between">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {currentUserData?.role === 'admin' ? 'Modificadores de Consumo e Impulsores de Impacto' : 'Mis Impulsores Registrados'}
                    </h1>
                    <p className="text-muted-foreground">
                        {currentUserData?.role === 'admin' 
                            ? 'Gestiona todas las cuentas registradas.'
                            : 'Ver los Impulsores de Impacto registrados bajo tu patrocinio.'
                        }
                    </p>
                 </div>
            </div>
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Action Required: Firestore Security Rules</AlertTitle>
                <AlertDescription>
                   Your current security rules do not allow you to view other users' data. An administrator needs to update the Firestore rules to allow authenticated users to read from the 'users' collection to see their sponsored users.
                </AlertDescription>
            </Alert>
        </div>
    );
  }
  
  const renderUserTable = (users: UserProfile[], title: string, listType: 'clients' | 'users') => {
    const getPackagePrice = (user: UserProfile) => {
        if (!user.selectedPackageId || packages.length === 0) {
            return 'N/A';
        }
        const pkg = packages.find(p => p._id === user.selectedPackageId);
        if (!pkg) {
            return 'OLD PKG-->'+user.selectedPackageId; // Debugging line to check if pkg is undefined
                }


        const op=packages.map( r => r._id)
        console.log(op);

        const finalPrice = (pkg.activationFee || 0) - (user.discountApplied || 0);
        return `$${finalPrice.toFixed(2)}`;
    };

    return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Una lista de todos los {listType === 'clients' ? 'Modificadores de Consumo' : 'Impulsores de Impacto'} en el sistema.</CardDescription>
          </div>
          {currentUserData?.role === 'admin' && (
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport(users, listType)}>
                    <Download className="mr-2 h-4 w-4"/>
                    Exportar
                </Button>
                <Button variant="destructive" onClick={() => openResetDialog(listType)}>
                    <Trash2 className="mr-2 h-4 w-4"/>
                    Resetear
                </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead>Price Paid</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map(u => (
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
                    <Badge variant="outline" className={cn("capitalize border", roleColors[u.role])}>{u.role === 'impulsor_de_impacto' ? 'Impulsor de Impacto' : u.role === 'client' ? 'Modificador de Consumo' : u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {getPackagePrice(u)}
                  </TableCell>
                  <TableCell className="text-right">
                    {currentUserData?.role === 'admin' && (
                        <>
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(u)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(u)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No se encontraron {listType === 'clients' ? 'Modificadores de Consumo' : 'Impulsores de Impacto'}.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    );
  };

  return (
    <>
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
                {currentUserData?.role === 'admin' ? 'Modificadores de Consumo e Impulsores de Impacto' : 'Mis Impulsores Registrados'}
            </h1>
            <p className="text-muted-foreground">
                {currentUserData?.role === 'admin' 
                    ? 'Gestiona todas las cuentas registradas.'
                    : 'Ver los Impulsores de Impacto registrados bajo tu patrocinio.'
                }
            </p>
          </div>
        </div>

        <Tabs defaultValue="clients">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="clients">Modificadores de Consumo</TabsTrigger>
                <TabsTrigger value="users">Impulsores de Impacto</TabsTrigger>
            </TabsList>
            <TabsContent value="clients" className="pt-4">
                {renderUserTable(consumidores, 'Modificadores de Consumo', 'clients')}
            </TabsContent>
            <TabsContent value="users" className="pt-4">
                {renderUserTable(regularUsers, 'Impulsores de Impacto', 'users')}
            </TabsContent>
        </Tabs>
      </div>

      {/* Admin Only Dialogs */}
      {currentUserData?.role === 'admin' && (
        <>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Modify the user's details and role.
                    </DialogDescription>
                </DialogHeader>
                {currentUserToEdit && (
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                value={currentUserToEdit.fullName || ''}
                                onChange={(e) => setCurrentUserToEdit({...currentUserToEdit, fullName: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={currentUserToEdit.email || ''}
                                disabled
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={currentUserToEdit.role} onValueChange={handleRoleChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="impulsor_de_impacto">Impulsor de Impacto</SelectItem>
                                    <SelectItem value="client">Modificador de consumo</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveUser} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user document for "{userToDelete?.fullName}". This does not delete the user account from Firebase Authentication, so their email cannot be reused.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, delete document
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all user documents in the "{listToReset}" list from the Firestore database. It does not delete the user accounts from Firebase Authentication, so their emails cannot be reused for new registrations.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmReset} disabled={isResetting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Yes, reset list
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </>
      )}
    </>
  );
}
