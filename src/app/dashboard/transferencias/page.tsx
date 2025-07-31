
'use client';

import * as React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, runTransaction, Timestamp, addDoc, writeBatch } from 'firebase/firestore';
import { fetchBusinessPackages } from '@/lib/packages';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DollarSign, Send, ArrowUpRight, ArrowDownLeft, Loader2, AlertCircle, Copy, Search, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  uid: string;
  fullName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  role: 'admin' | 'client' | 'impulsor_de_impacto';
  balance: number;
  selectedPackageId?: string;
  discountApplied?: number;
  sponsorUsername?: string;
  createdAt?: Timestamp;
}

interface Transfer {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  amount: number;
  type: string;
  note?: string;
  createdAt: Timestamp;
}

interface PackageData {
  id: string;
  name: string;
  activationFee: number;
  price: number;
  targetRole: 'impulsor_de_impacto' | 'client' | 'all';
}

const transferSchema = z.object({
  recipientUsername: z.string().min(1, "Debes seleccionar un destinatario."),
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "La cantidad debe ser un número positivo.",
  }),
  type: z.string({ required_error: "Debes seleccionar un tipo de transferencia." }),
  note: z.string().max(100, "La nota no puede exceder los 100 caracteres.").optional(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

const TRANSFERS_RESET_FLAG = 'transfersPageResetFlag';

export default function TransferenciasPage() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();

  const [currentUserData, setCurrentUserData] = React.useState<UserProfile | null>(null);
  const [balance, setBalance] = React.useState(0);
  const [transferHistory, setTransferHistory] = React.useState<Transfer[]>([]);
  
  const [allUsers, setAllUsers] = React.useState<UserProfile[]>([]);
  const [isRecipientDialogOpen, setIsRecipientDialogOpen] = React.useState(false);
  const [recipientSearchTerm, setRecipientSearchTerm] = React.useState('');

  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [permissionError, setPermissionError] = React.useState(false);
  
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [isReset, setIsReset] = React.useState(false);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      recipientUsername: '',
      amount: '',
      type: 'Transferencia General',
      note: '',
    },
  });

  const fetchHistory = React.useCallback(async (uid: string) => {
    try {
        const sentQuery = query(collection(db, 'transfers'), where('senderId', '==', uid));
        const receivedQuery = query(collection(db, 'transfers'), where('recipientId', '==', uid));
        
        const [sentSnapshot, receivedSnapshot] = await Promise.all([getDocs(sentQuery), getDocs(receivedQuery)]);
        
        const sentTransfers = sentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transfer));
        const receivedTransfers = receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transfer));
        
        const allTransfers = [...sentTransfers, ...receivedTransfers]
            .filter(t => t.createdAt && typeof t.createdAt.toMillis === 'function')
            .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        setTransferHistory(allTransfers.slice(0, 20));
    } catch (error: any) {
        console.error("Error fetching transfer history:", error);
        if (error.code === 'permission-denied') {
            setPermissionError(true);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not refresh transfer history.' });
        }
    }
  }, [toast]);

  React.useEffect(() => {
      try {
          const resetFlag = localStorage.getItem(TRANSFERS_RESET_FLAG);
          if (resetFlag === 'true') {
              setIsReset(true);
          }
      } catch (e) {
          console.error("Could not read reset flag", e)
      }
  }, []);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserDataAndHistory = async () => {
      setLoading(true);
      setPermissionError(false);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = { uid: user.uid, ...userDoc.data() } as UserProfile;
          setCurrentUserData(data);

          const usersQuery = query(collection(db, 'users'));
          const usersSnapshot = await getDocs(usersQuery);
          const allUsersList = usersSnapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
          const filteredForRecipient = allUsersList.filter(u => u.uid !== user.uid);
          setAllUsers(filteredForRecipient);

          if (data.role === 'admin') {
            const packages: PackageData[] = await fetchBusinessPackages() || [];
            
            let totalRevenue = 0;
            allUsersList.forEach(purchaser => {
                if (purchaser.selectedPackageId) {
                    const pkg = packages.find(p => p.id === purchaser.selectedPackageId);
                    if (pkg) {
                        const amountPaid = (pkg.activationFee || 0) - (purchaser.discountApplied || 0);
                        totalRevenue += amountPaid;
                    }
                }
            });

            let totalDeductions = 0;
            const transfersQuery = query(collection(db, 'transfers'), where('senderId', '==', user.uid), where('type', 'in', ['Comisión', 'Bono']));
            const transfersSnapshot = await getDocs(transfersQuery);
            transfersSnapshot.forEach(doc => {
                totalDeductions += doc.data().amount;
            });
            
            const netRevenue = totalRevenue - totalDeductions;
            setBalance(netRevenue);

          } else {
            setBalance(data.balance || 0);
          }

          await fetchHistory(user.uid);
        } else {
          setPermissionError(true);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        if (error.code === 'permission-denied') {
            setPermissionError(true);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (isReset) {
      setBalance(0);
      setTransferHistory([]);
      setLoading(false);
    } else {
      fetchUserDataAndHistory();
    }
  }, [user, authLoading, toast, fetchHistory, isReset]);
  
  const handleSelectRecipient = (recipient: UserProfile) => {
    form.setValue('recipientUsername', recipient.username || '');
    setIsRecipientDialogOpen(false);
  };

  const onSubmit = async (values: TransferFormValues) => {
    setIsSubmitting(true);
    if (!user || !currentUserData) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo verificar tu sesión." });
      setIsSubmitting(false);
      return;
    }
    
    const amount = parseFloat(values.amount);

    if (values.recipientUsername === currentUserData.username) {
        toast({ variant: "destructive", title: "Transferencia Inválida", description: "No puedes enviarte fondos a ti mismo." });
        setIsSubmitting(false);
        return;
    }

    try {
        const recipient = allUsers.find(u => u.username === values.recipientUsername);
        if (!recipient) {
            toast({ variant: "destructive", title: "Usuario No Encontrado", description: `No se encontró ningún usuario con el nombre de usuario "${values.recipientUsername}".` });
            setIsSubmitting(false);
            return;
        }

        if (balance < amount) {
             throw new Error("Fondos insuficientes para realizar esta transferencia.");
        }
        
        await runTransaction(db, async (transaction) => {
            const recipientDocRef = doc(db, 'users', recipient.uid);
            const recipientDoc = await transaction.get(recipientDocRef);

            if (!recipientDoc.exists()) {
                throw new Error("La cuenta del destinatario no existe.");
            }

            const recipientBalance = recipientDoc.data().balance || 0;
            const newRecipientBalance = recipientBalance + amount;
            transaction.update(recipientDocRef, { balance: newRecipientBalance });
            
            if (currentUserData.role !== 'admin') {
                const senderDocRef = doc(db, 'users', user.uid);
                const senderDoc = await transaction.get(senderDocRef);
                if (!senderDoc.exists()) {
                    throw new Error("Tu cuenta de remitente no existe.");
                }
                 const senderBalance = senderDoc.data().balance || 0;
                 if (senderBalance < amount) {
                     throw new Error("Fondos insuficientes para realizar esta transferencia.");
                 }
                const newSenderBalance = senderBalance - amount;
                transaction.update(senderDocRef, { balance: newSenderBalance });
            }
            
            const newTransferRef = doc(collection(db, 'transfers'));
            transaction.set(newTransferRef, {
                senderId: user.uid,
                senderName: currentUserData.fullName || currentUserData.username,
                recipientId: recipient.uid,
                recipientName: recipient.fullName || recipient.username,
                amount: amount,
                type: values.type,
                note: values.note || '',
                createdAt: Timestamp.now(),
            });
        });

        toast({ title: '¡Éxito!', description: `Se han transferido $${amount.toFixed(2)} a ${recipient.fullName || recipient.username}.` });
        setBalance(prev => prev - amount);
        form.reset();

        await fetchHistory(user.uid);

    } catch (error: any) {
        console.error("Transfer error:", error);
        toast({ variant: "destructive", title: "Error en la Transferencia", description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleToggleReset = async () => {
    if (!user || currentUserData?.role !== 'admin') return;

    const newResetState = !isReset;
    setIsResetting(true);
    
    if (newResetState) {
        try {
            const transfersQuery = query(collection(db, 'transfers'));
            const usersQuery = query(collection(db, 'users'));

            const [transfersSnapshot, usersSnapshot] = await Promise.all([
                getDocs(transfersQuery),
                getDocs(usersQuery),
            ]);

            const batch = writeBatch(db);
            transfersSnapshot.forEach(doc => batch.delete(doc.ref));
            usersSnapshot.forEach(userDoc => {
                if ((userDoc.data().balance || 0) !== 0) {
                    batch.update(userDoc.ref, { balance: 0 });
                }
            });
            await batch.commit();

            localStorage.setItem(TRANSFERS_RESET_FLAG, 'true');
            setIsReset(true);
            toast({ title: "¡Éxito!", description: "El historial y los saldos han sido reseteados." });
        } catch (error) {
            console.error("Error resetting history:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo borrar el historial y los saldos." });
        } finally {
            setIsResetting(false);
            setIsResetDialogOpen(false);
        }
    } else {
        localStorage.removeItem(TRANSFERS_RESET_FLAG);
        setIsReset(false);
        toast({ title: "Datos en Vivo Restaurados" });
        setIsResetting(false);
        setIsResetDialogOpen(false);
    }
  };
  
  const handleExport = () => {
    if (transferHistory.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No hay datos para exportar',
      });
      return;
    }

    const headers = ['id', 'senderId', 'senderName', 'recipientId', 'recipientName', 'type', 'amount', 'note', 'createdAt'];
    const csvRows = [
      headers.join(','),
      ...transferHistory.map(row =>
        headers.map(header => {
            const value = (row as any)[header];
            if (header === 'createdAt' && value && typeof value.toDate === 'function') {
                return JSON.stringify(value.toDate().toISOString());
            }
            return JSON.stringify(value);
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'historial_transferencias.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: '¡Exportado!',
      description: 'El historial de transferencias ha sido descargado.',
    });
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  
  const filteredUsers = React.useMemo(() => {
    if (!recipientSearchTerm) return allUsers;
    const term = recipientSearchTerm.toLowerCase();
    return allUsers.filter(u => 
        u.fullName?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term) ||
        u.phoneNumber?.includes(term) ||
        u.email?.toLowerCase().includes(term)
    );
  }, [allUsers, recipientSearchTerm]);


  if (loading || authLoading) {
    return (
        <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid md:grid-cols-2 gap-6">
                <Card><CardContent className="p-6"><Skeleton className="h-40 w-full"/></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-40 w-full"/></CardContent></Card>
            </div>
            <Card><CardContent className="p-6"><Skeleton className="h-64 w-full"/></CardContent></Card>
        </div>
    );
  }
  
  if (permissionError) {
    return (
       <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transferencias</h1>
          <p className="text-muted-foreground">Envía y recibe fondos de otros usuarios.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de Permisos</AlertTitle>
          <AlertDescription>
            No se pudieron cargar los datos. Parece que hay un problema con los permisos de la base de datos. Por favor, contacta a un administrador para que revise las reglas de seguridad de Firestore.
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
                <h1 className="text-3xl font-bold tracking-tight">Transferencias</h1>
                <p className="text-muted-foreground">Envía y recibe fondos de otros usuarios.</p>
            </div>
            {currentUserData?.role === 'admin' && (
                <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive">
                            <RefreshCw className="mr-2 h-4 w-4" />
                             {isReset ? 'Restaurar Datos' : 'Resetear Historial'}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente todo el historial de transferencias y se resetearán todos los saldos de los usuarios a cero.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleToggleReset} disabled={isResetting}>
                                {isResetting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reseteando...</> : "Sí, resetear historial"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Disponible</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
                        <p className="text-xs text-muted-foreground">Tu balance actual para transferencias.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Realizar una Transferencia</CardTitle>
                        <CardDescription>Envía fondos a otro usuario de la plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="recipientUsername" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Destinatario</FormLabel>
                                        <FormControl>
                                            <Dialog open={isRecipientDialogOpen} onOpenChange={setIsRecipientDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                        {field.value ? field.value : "Seleccionar un destinatario"}
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-lg">
                                                     <DialogHeader>
                                                        <DialogTitle>Seleccionar Destinatario</DialogTitle>
                                                        <DialogDescription>
                                                            Busca y selecciona el usuario al que deseas enviar fondos.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                                        <Input 
                                                            placeholder="Buscar por nombre, usuario, email, teléfono..." 
                                                            className="pl-9"
                                                            value={recipientSearchTerm}
                                                            onChange={(e) => setRecipientSearchTerm(e.target.value)}
                                                        />
                                                    </div>
                                                    <ScrollArea className="h-72">
                                                        <div className="space-y-2 p-1">
                                                            {filteredUsers.map(u => (
                                                                <div key={u.uid} onClick={() => handleSelectRecipient(u)} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer">
                                                                    <Avatar>
                                                                        <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(u.fullName || u.email || 'user')}`} />
                                                                        <AvatarFallback>{getInitials(u.fullName || u.email)}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="font-medium">{u.fullName}</p>
                                                                        <p className="text-sm text-muted-foreground">@{u.username}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </ScrollArea>
                                                </DialogContent>
                                            </Dialog>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="amount" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cantidad (USD)</FormLabel>
                                        <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="type" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Transferencia</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Transferencia General">Transferencia General</SelectItem>
                                                <SelectItem value="Comisión">Comisión</SelectItem>
                                                <SelectItem value="Bono">Bono</SelectItem>
                                                <SelectItem value="Refund">Refund</SelectItem>
                                                <SelectItem value="Préstamo">Préstamo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="note" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nota (Opcional)</FormLabel>
                                        <FormControl><Input placeholder="Para el café de la mañana" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Enviando...</> : <><Send className="mr-2 h-4 w-4"/> Enviar Fondos</>}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-3">
                 <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle>Historial de Transferencias</CardTitle>
                                <CardDescription>Tus 20 transacciones más recientes.</CardDescription>
                            </div>
                            <Button variant="outline" onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Exportar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead></TableHead>
                                    <TableHead>Detalle</TableHead>
                                    <TableHead className="text-right">Tipo</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transferHistory.length > 0 ? (
                                    transferHistory.map(t => {
                                        const isSent = t.senderId === user?.uid;
                                        return (
                                            <TableRow key={t.id}>
                                                <TableCell className="w-12">
                                                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", isSent ? 'bg-red-100 dark:bg-red-500/20' : 'bg-green-100 dark:bg-green-500/20')}>
                                                        {isSent ? <ArrowUpRight className="h-4 w-4 text-red-500"/> : <ArrowDownLeft className="h-4 w-4 text-green-500"/>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{isSent ? `Enviaste a ${t.recipientName}` : `Recibiste de ${t.senderName}`}</div>
                                                    <div className="text-sm text-muted-foreground italic">{t.note ? `"${t.note}"` : t.createdAt.toDate().toLocaleString()}</div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="outline">{t.type}</Badge>
                                                </TableCell>
                                                <TableCell className={cn("text-right font-semibold", isSent ? 'text-red-500' : 'text-green-500')}>
                                                    {isSent ? '-' : '+'} {formatCurrency(t.amount)}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No hay historial de transferencias.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
    </>
  );
}
