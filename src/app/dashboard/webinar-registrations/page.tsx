
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2, Users, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
  username?: string;
  role?: 'admin' | 'client' | 'user';
}

interface Visitor {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  registeredAt: string;
  inviter: string;
}

interface Member {
  _id: string;
  fullName: string;
  phoneNumber: string;
  registeredAt: string;
  inviter: string;
}

export default function WebinarRegistrationsPage() {
  const { toast } = useToast();
  const [user, loadingAuth] = useAuthState(auth);
  const [userData, setUserData] = React.useState<UserProfile | null>(null);
  const [loadingData, setLoadingData] = React.useState(true);

  const [visitors, setVisitors] = React.useState<Visitor[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [listToReset, setListToReset] = React.useState<'visitors' | 'members' | null>(null);

  React.useEffect(() => {
    // This effect handles fetching and filtering the registration data
    // once the user's data (including their role and username) is available.
    const loadAndFilterData = async () => {
      if (!user) {
        setLoadingData(false);
        return;
      }
      setLoadingData(true);
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const currentUserData = userDoc.exists() ? userDoc.data() as UserProfile : null;
        setUserData(currentUserData);
        
        let visitorsRes, membersRes;
        if (currentUserData?.role === 'admin') {
          visitorsRes = await fetch('/api/get-registrations?type=visitor&admin=true');
          membersRes = await fetch('/api/get-registrations?type=member&admin=true');
        } else if (currentUserData?.username) {
          visitorsRes = await fetch(`/api/get-registrations?type=visitor&inviter=${encodeURIComponent(currentUserData.username)}`);
          membersRes = await fetch(`/api/get-registrations?type=member&inviter=${encodeURIComponent(currentUserData.username)}`);
        } else {
          setVisitors([]);
          setMembers([]);
          setLoadingData(false);
          return;
        }
        const visitorsData = await visitorsRes.json();
        const membersData = await membersRes.json();
        setVisitors(visitorsData.success ? visitorsData.data : []);
        setMembers(membersData.success ? membersData.data : []);
      } catch (error) {
        console.error("Error loading registration data:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load registration data.',
        });
      } finally {
        setLoadingData(false);
      }
    };
    
    if (!loadingAuth) {
        loadAndFilterData();
    }

  }, [user, loadingAuth, toast]);

  const handleExport = (list: 'visitors' | 'members') => {
    const dataToExport = list === 'visitors' ? visitors : members;
    if (dataToExport.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Data',
        description: 'There is no data to export.',
      });
      return;
    }

    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => headers.map(header => JSON.stringify((row as any)[header])).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `${list}_export_${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
        title: 'Exported!',
        description: `The ${list} list has been downloaded.`,
    })
  };

  const openResetDialog = (list: 'visitors' | 'members') => {
    if (userData?.role !== 'admin') {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only admins can reset lists.'});
      return;
    }
    setListToReset(list);
    setIsResetDialogOpen(true);
  };

  const handleReset = () => {
    if (!listToReset) return;

    // Optionally, implement a reset API for MongoDB. For now, just clear UI.
    setVisitors([]);
    setMembers([]);
    toast({
      title: 'Success!',
      description: `The ${listToReset} list has been reset (UI only).`,
    });

    setIsResetDialogOpen(false);
    setListToReset(null);
  };
  
  if (loadingAuth || loadingData) {
    return (
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <Skeleton className="h-10 w-80 mb-4" />
        <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <>
        <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Webinar Registrations</h1>
                <p className="text-muted-foreground">
                    Manage and view all registrations for your upcoming webinar.
                </p>
            </div>
            
            <div className="grid gap-8">
                {/* Registered Visitors Card */}
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6"/>Visitantes Registrados</CardTitle>
                            <CardDescription>Lista de nuevos visitantes que se han registrado.</CardDescription>
                        </div>
                         {userData?.role === 'admin' ? (
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleExport('visitors')}>
                                    <Download className="mr-2 h-4 w-4"/>
                                    Exportar Lista
                                </Button>
                                <Button variant="destructive" onClick={() => openResetDialog('visitors')}>
                                    <Trash2 className="mr-2 h-4 w-4"/>
                                    Resetear Lista
                                </Button>
                            </div>
                         ): (
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleExport('visitors')}>
                                    <Download className="mr-2 h-4 w-4"/>
                                    Exportar Lista
                                </Button>
                            </div>
                         )
                        
                        }
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre Completo</TableHead>
                                    <TableHead>Correo Electrónico</TableHead>
                                    <TableHead>Número de Teléfono</TableHead>
                                    <TableHead>Fecha de Registro</TableHead>
                                    {userData?.role === 'admin' && <TableHead>Invitado por</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visitors.length > 0 ? (
                                    visitors.map((visitor, index) => (
                                        <TableRow key={visitor._id || index}>
                                            <TableCell className="font-medium">{visitor.fullName}</TableCell>
                                            <TableCell>    <a href={`mailto:${visitor.email}`} className="text-blue-600 hover:underline">
                                                {visitor.email}
                                              </a>
                                               </TableCell>
                                            <TableCell>{visitor.phoneNumber ? (
                                                <a href={`tel:${visitor.phoneNumber}`} className="text-blue-600 hover:underline">
                                                  {visitor.phoneNumber}
                                                </a>
                                              ) : (
                                                'N/A'
                                              )}</TableCell>
                                            <TableCell>{format(new Date(visitor.registeredAt), 'PPP p')}</TableCell>
                                            {userData?.role === 'admin' && <TableCell>{visitor.inviter}</TableCell>}
                                            {userData?.role === 'admin' && (
                                                <TableCell>
                                                  <Button size="icon" variant="ghost" onClick={async () => {
                                                    if (!window.confirm('¿Eliminar este visitante?')) return;
                                                    const res = await fetch(`/api/get-registrations?type=visitor&id=${visitor._id}`, { method: 'DELETE' });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                  setVisitors(v => v.filter(vv => (vv._id || vv.email+vv.fullName) !== (visitor._id || visitor.email+visitor.fullName)));
                                                  toast({ title: 'Eliminado', description: 'Visitante eliminado.' });
                                                } else {
                                                  toast({ variant: 'destructive', title: 'Error', description: data.error || 'No se pudo eliminar.' });
                                                }
                                              }}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                              </Button>
                                            </TableCell>
                                        )}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={userData?.role === 'admin' ? 6 : 4} className="text-center h-24">No hay visitantes registrados aún.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                 {/* Registered Members Card */}
                 <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                         <div>
                            <CardTitle className="flex items-center gap-2"><UserCheck className="h-6 w-6"/>Miembros Registrados</CardTitle>
                            <CardDescription>Lista de miembros existentes que se han registrado.</CardDescription>
                        </div>
                         {userData?.role === 'admin' ? (
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleExport('members')}>
                                    <Download className="mr-2 h-4 w-4"/>
                                    Exportar Lista
                                </Button>
                                 <Button variant="destructive" onClick={() => openResetDialog('members')}>
                                    <Trash2 className="mr-2 h-4 w-4"/>
                                    Resetear Lista
                                </Button>
                            </div>
                         ):(
                           <div className="flex gap-2">
                               <Button variant="outline" onClick={() => handleExport('members')}>
                                   <Download className="mr-2 h-4 w-4"/>
                                   Exportar Lista
                               </Button>
                           </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre Completo</TableHead>
                                    <TableHead>Número de Teléfono</TableHead>
                                    <TableHead>Fecha de Registro</TableHead>
                                    {userData?.role === 'admin' && <TableHead>Invitado por</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {members.length > 0 ? (
                                    members.map((member, index) => (
                                        <TableRow key={member._id || index}>
                                            <TableCell className="font-medium">{member.fullName}</TableCell>
                                            <TableCell>{member.phoneNumber ? (
                                                <a href={`tel:${member.phoneNumber}`} className="text-blue-600 hover:underline">
                                                  {member.phoneNumber}
                                                </a>
                                              ) : (
                                                'N/A'
                                              )}</TableCell>
                                            <TableCell>{format(new Date(member.registeredAt), 'PPP p')}</TableCell>
                                            {userData?.role === 'admin' && <TableCell>{member.inviter}</TableCell>}
                                          
                                          {userData?.role === 'admin' && (
                                            <TableCell>
                                              <Button size="icon" variant="ghost" onClick={async () => {
                                                if (!window.confirm('¿Eliminar este miembro?')) return;
                                                const res = await fetch(`/api/get-registrations?type=member&id=${member._id}`, { method: 'DELETE' });
                                                const data = await res.json();
                                                if (data.success) {
                                                  setMembers(m => m.filter(mm => (mm._id || mm.phoneNumber+mm.fullName) !== (member._id || member.phoneNumber+member.fullName)));
                                                  toast({ title: 'Eliminado', description: 'Miembro eliminado.' });
                                                } else {
                                                  toast({ variant: 'destructive', title: 'Error', description: data.error || 'No se pudo eliminar.' });
                                                }
                                              }}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                              </Button>
                                            </TableCell>
                                          )}

                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={userData?.role === 'admin' ? 5 : 3} className="text-center h-24">No hay miembros registrados aún.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>

        <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la lista de{' '}
                    <span className="font-semibold">{listToReset}</span>.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setListToReset(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sí, resetear lista
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
