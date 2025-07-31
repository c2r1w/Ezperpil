
'use client';

import * as React from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  QrCode,
  Download,
  Copy,
  Pencil,
  Eye,
  BarChart2,
  Users,
  Link as LinkIcon,
  Plus,
  Power,
  PowerOff,
  Trash2,
  Save,
  X,
  Loader2,
  Megaphone,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
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
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';


// Data Interfaces
interface UserData {
  role?: 'admin' | 'client' | 'user';
}

interface UrlEntry {
  url: string;
  active: boolean;
}

interface QrCodeData {
  id: string;
  name: string;
  destinationUrls: UrlEntry[];
  userId: string;
  clicks: number;
  createdAt: any;
  active: boolean;
  sourceName?: string;
  sourceInitials?: string;
  partnerName?: string;
  partnerInitials?: string;
  colorDark?: string;
  colorLight?: string;
  lastRotationIndex?: number;
}

interface QrCodeClientData extends QrCodeData {
  shortUrl: string;
  qrCodeUrl: string;
}

// Main Component
export default function QrCodeGeneratorPage() {
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const [userData, setUserData] = React.useState<UserData | null>(null);

  const [qrCodes, setQrCodes] = React.useState<QrCodeClientData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [permissionError, setPermissionError] = React.useState(false);
  
  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  // State for forms and deletion
  const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');
  const [qrToEdit, setQrToEdit] = React.useState<QrCodeClientData | null>(null);
  const [qrToDelete, setQrToDelete] = React.useState<QrCodeClientData | null>(null);
  
  // Form fields state
  const [formName, setFormName] = React.useState('');
  const [formUrls, setFormUrls] = React.useState<UrlEntry[]>([{ url: '', active: true }]);
  const [formSourceName, setFormSourceName] = React.useState('');
  const [formSourceInitials, setFormSourceInitials] = React.useState('');
  const [formPartnerName, setFormPartnerName] = React.useState('');
  const [formPartnerInitials, setFormPartnerInitials] = React.useState('');
  const [formColorDark, setFormColorDark] = React.useState('#000000');
  const [formColorLight, setFormColorLight] = React.useState('#ffffff');

  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const generateClientData = async (code: QrCodeData): Promise<QrCodeClientData> => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shortUrl = `${origin}/qr/${code.id}`;
    let qrCodeUrl = '';
    try {
      qrCodeUrl = await QRCode.toDataURL(shortUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.9,
        margin: 1,
        width: 128,
        color: {
          dark: code.colorDark || '#000000',
          light: code.colorLight || '#ffffff',
        },
      });
    } catch (err) {
      console.error('QR Generation failed:', err);
    }
    return { ...code, shortUrl, qrCodeUrl };
  };

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserDataAndSubscribe = async () => {
      setLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }
        const currentUserData = userDoc.data() as UserData;
        setUserData(currentUserData);
        
        const q = currentUserData.role === 'admin'
          ? query(collection(db, 'qrCodes'))
          : query(collection(db, 'qrCodes'), where('userId', '==', user.uid));
          
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          setPermissionError(false);
          const codesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as QrCodeData));
          const clientCodes = await Promise.all(codesData.map(generateClientData));
          
          const sortedCodes = clientCodes.sort((a, b) => {
            const aTime = a.createdAt?.toMillis() ?? 0;
            const bTime = b.createdAt?.toMillis() ?? 0;
            return bTime - aTime;
          });

          setQrCodes(sortedCodes);
          setLoading(false);
        }, (error) => {
          console.error("Firestore Error:", error);
          if (error.code === 'permission-denied') {
              setPermissionError(true);
          } else {
              toast({ variant: 'destructive', title: 'Error', description: 'Could not load QR codes.' });
          }
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
         console.error("Error fetching user data:", error);
         setLoading(false);
         toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your profile data.' });
         return () => {};
      }
    };

    const unsubscribePromise = fetchUserDataAndSubscribe();
    
    return () => {
        unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [user, authLoading, toast]);

  const resetFormState = () => {
    setFormName('');
    setFormUrls([{ url: '', active: true }]);
    setFormSourceName('');
    setFormSourceInitials('');
    setFormPartnerName('');
    setFormPartnerInitials('');
    setFormColorDark('#000000');
    setFormColorLight('#ffffff');
    setQrToEdit(null);
  };
  
  const handleOpenCreateDialog = () => {
    setFormMode('create');
    resetFormState();
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (e: React.MouseEvent, qr: QrCodeClientData) => {
    e.stopPropagation();
    setFormMode('edit');
    setQrToEdit(qr);
    setFormName(qr.name);
    // Compatibility for old string-based URLs
    const urlsToEdit = (qr.destinationUrls || []).map(entry => 
        typeof entry === 'string' ? { url: entry, active: true } : entry
    );
    setFormUrls(urlsToEdit.length > 0 ? urlsToEdit : [{ url: '', active: true }]);
    setFormSourceName(qr.sourceName || '');
    setFormSourceInitials(qr.sourceInitials || '');
    setFormPartnerName(qr.partnerName || '');
    setFormPartnerInitials(qr.partnerInitials || '');
    setFormColorDark(qr.colorDark || '#000000');
    setFormColorLight(qr.colorLight || '#ffffff');
    setIsFormDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !formName || formUrls.some(url => !url.url)) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a name and at least one destination URL.' });
      return;
    }
    setIsSaving(true);
    
    try {
      let finalName = formName;
      // This naming logic may need refinement if both are present
      if (formPartnerInitials) {
        finalName = `${formName} (${formPartnerInitials})`;
      } else if (formSourceInitials) {
        finalName = `${formName} (${formSourceInitials})`;
      }

      const dataToSave = {
        name: finalName,
        destinationUrls: formUrls.filter(url => url.url.trim() !== ''),
        userId: user.uid,
        active: qrToEdit?.active ?? true,
        sourceName: formSourceName || null,
        sourceInitials: formSourceInitials || null,
        partnerName: formPartnerName || null,
        partnerInitials: formPartnerInitials || null,
        colorDark: formColorDark,
        colorLight: formColorLight,
      };

      if (formMode === 'create') {
        await addDoc(collection(db, 'qrCodes'), {
          ...dataToSave,
          clicks: 0,
          createdAt: serverTimestamp(),
          lastRotationIndex: -1,
        });
        toast({ title: 'Success!', description: 'Your new dynamic QR code has been created.' });
      } else if (qrToEdit) {
        const docRef = doc(db, 'qrCodes', qrToEdit.id);
        await updateDoc(docRef, dataToSave);
        toast({ title: 'Success!', description: `"${finalName}" has been updated.` });
      }

      setIsFormDialogOpen(false);
      resetFormState();

    } catch (error) {
      console.error('Error saving QR code:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the QR code.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (e: React.MouseEvent, qr: QrCodeClientData) => {
    e.stopPropagation();
    const docRef = doc(db, 'qrCodes', qr.id);
    try {
      await updateDoc(docRef, { active: !qr.active });
      toast({ title: 'Status Updated', description: `"${qr.name}" is now ${!qr.active ? 'active' : 'inactive'}.` });
    } catch (error) {
      console.error('Error toggling active state:', error);
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update the status.' });
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, qr: QrCodeClientData) => {
    e.stopPropagation();
    setQrToDelete(qr);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!qrToDelete) return;
    const docRef = doc(db, 'qrCodes', qrToDelete.id);
    try {
      await deleteDoc(docRef);
      toast({ title: 'QR Code Deleted', description: `"${qrToDelete.name}" has been removed.` });
      setIsDeleteDialogOpen(false);
      setQrToDelete(null);
    } catch (error) {
      console.error('Error deleting QR code:', error);
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete the QR code.' });
    }
  };
  
  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast({ title: 'URL Copied!' });
  };
  
  const handleDownload = (e: React.MouseEvent, url: string, name: string) => {
    e.stopPropagation();
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUrlInputChange = (value: string, index: number) => {
    const newUrls = [...formUrls];
    newUrls[index].url = value;
    setFormUrls(newUrls);
  };

  const handleUrlStatusChange = (checked: boolean, index: number) => {
    const newUrls = [...formUrls];
    newUrls[index].active = checked;
    setFormUrls(newUrls);
  };

  const addUrlInput = () => {
    setFormUrls([...formUrls, { url: '', active: true }]);
  };

  const removeUrlInput = (index: number) => {
    if (formUrls.length <= 1) return;
    const newUrls = formUrls.filter((_, i) => i !== index);
    setFormUrls(newUrls);
  };


  const filteredQrCodes = React.useMemo(() => {
    if (!searchTerm) {
        return qrCodes;
    }
    return qrCodes.filter(qr =>
        qr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (qr.destinationUrls || []).some(entry => entry.url.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [qrCodes, searchTerm]);

  const totalQrCodes = filteredQrCodes.length;
  const activeQrCodes = filteredQrCodes.filter(qr => qr.active).length;
  const totalClicks = filteredQrCodes.reduce((sum, qr) => sum + qr.clicks, 0);

  if (authLoading || loading) {
     return (
        <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-80" />
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full"/></CardContent></Card>)}
            </div>
            <Card className="p-6"><Skeleton className="h-60 w-full" /></Card>
        </div>
     );
  }

  return (
    <>
    <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
       {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Códigos QR</h1>
            <p className="text-muted-foreground">
                Crea y gestiona tus códigos QR dinámicos con funciones avanzadas
            </p>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
                <Input 
                type="search" 
                placeholder="Buscar código..." 
                className="flex-1 sm:flex-initial"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button className="bg-primary hover:bg-primary/90" onClick={handleOpenCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Código QR
                </Button>
            </div>
        </div>
        
        {permissionError && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Permission Denied</AlertTitle>
                <AlertDescription>
                    Your account does not have permission to view QR codes. Please check your Firestore security rules or contact an administrator.
                </AlertDescription>
            </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-md">
                    <QrCode className="h-5 w-5 text-blue-500" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalQrCodes}</div>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">QR Codes Activos</CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-md">
                    <Eye className="h-5 w-5 text-green-500" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{activeQrCodes}</div>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-md">
                    <BarChart2 className="h-5 w-5 text-purple-500" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalClicks}</div>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Únicos</CardTitle>
                <div className="p-2 bg-orange-100 dark:bg-orange-500/10 rounded-md">
                    <Users className="h-5 w-5 text-orange-500" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">0</div>
            </CardContent>
            </Card>
        </div>

        {/* QR Code List */}
        <div className="space-y-4">
            {filteredQrCodes.map(qr => {
                const activeUrlsCount = qr.destinationUrls?.filter(u => u.active).length || 0;
                return (
                    <Card key={qr.id}>
                        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold">{qr.name}</h3>
                                    <Badge variant={qr.active ? 'default' : 'secondary'} className={cn(qr.active ? 'bg-green-500/80 hover:bg-green-500/90' : 'bg-gray-500/80 hover:bg-gray-500/90', 'cursor-pointer')} onClick={(e) => handleToggleActive(e, qr)}>
                                        {qr.active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                    {activeUrlsCount > 1 && (
                                        <Badge variant="outline" className="border-blue-500 text-blue-500">
                                            <RotateCw className="mr-1 h-3 w-3" />
                                            Rotando {activeUrlsCount} URLs
                                        </Badge>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">URL Corta: <a href={qr.shortUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{qr.shortUrl}</a></p>
                                    <p className="text-xs text-muted-foreground">Scans: {qr.clicks} | Creado: {qr.createdAt?.toDate ? qr.createdAt.toDate().toLocaleDateString() : 'Just now'}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`dest-url-${qr.id}`} className="text-xs">URL de Destino:</Label>
                                    <Input 
                                        id={`dest-url-${qr.id}`} 
                                        value={qr.destinationUrls?.[0]?.url || 'No URL'} 
                                        className="flex-1" 
                                        readOnly
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Button variant="secondary" size="sm" onClick={(e) => handleOpenEditDialog(e, qr)}><Pencil className="mr-2"/>Editar QR</Button>
                                    <Button variant="outline" size="sm" onClick={(e) => handleCopy(e, qr.shortUrl)}><Copy className="mr-2"/>Copiar URL</Button>
                                    <Button variant="outline" size="sm" onClick={(e) => handleDownload(e, qr.qrCodeUrl, qr.name)}><Download className="mr-2"/>Descargar</Button>
                                    <Button variant="destructive" size="sm" onClick={(e) => handleToggleActive(e, qr)}>
                                        {qr.active ? <PowerOff className="mr-2" /> : <Power className="mr-2" />}
                                        {qr.active ? 'Desactivar' : 'Activar'}
                                    </Button>
                                    <Button variant="ghost" className="text-destructive hover:bg-destructive/10" size="sm" onClick={(e) => handleDeleteClick(e, qr)}>
                                        <Trash2 className="mr-2"/>Eliminar
                                    </Button>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                {qr.qrCodeUrl ? <Image src={qr.qrCodeUrl} alt={`QR Code for ${qr.name}`} width={128} height={128} /> : <div className="h-32 w-32 bg-muted rounded-md animate-pulse" />}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
            {filteredQrCodes.length === 0 && !loading && (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No QR codes found. Click "Crear Código QR" to get started.
                    </CardContent>
                </Card>
            )}
        </div>
    </div>

    {/* Create/Edit QR Dialog */}
    <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formMode === 'create' ? 'Crear Nuevo Código QR' : 'Editar Código QR'}</DialogTitle>
          <DialogDescription>
            {formMode === 'create' 
              ? 'Completa los detalles para tu nuevo código QR dinámico.'
              : `Editando los detalles para "${qrToEdit?.name}".`
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="form-qr-name">Nombre de la Campaña</Label>
            <Input id="form-qr-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ej. Menú del Restaurante" />
          </div>
          <div className="space-y-2">
            <Label>URLs de Destino (Rotación)</Label>
            {formUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                    <Input 
                        value={url.url} 
                        onChange={(e) => handleUrlInputChange(e.target.value, index)}
                        placeholder="https://ejemplo.com"
                    />
                     <Switch
                        checked={url.active}
                        onCheckedChange={(checked) => handleUrlStatusChange(checked, index)}
                        aria-label={`Toggle URL ${index + 1}`}
                    />
                    {formUrls.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeUrlInput(index)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                    )}
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={addUrlInput}>
                <Plus className="mr-2 h-4 w-4" /> Añadir URL para rotación
            </Button>
          </div>
          <div className="border-t pt-4 mt-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Seguimiento por Fuente (Opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="form-qr-source-name">Nombre de Fuente</Label>
                <Input id="form-qr-source-name" value={formSourceName} onChange={(e) => setFormSourceName(e.target.value)} placeholder="Ej. Facebook" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-qr-source-initials">Iniciales</Label>
                <Input id="form-qr-source-initials" value={formSourceInitials} onChange={(e) => setFormSourceInitials(e.target.value)} placeholder="Ej. FB" />
              </div>
            </div>
          </div>
           <div className="border-t pt-4 mt-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Seguimiento por Partner (Opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="form-qr-partner-name">Nombre del Partner</Label>
                <Input id="form-qr-partner-name" value={formPartnerName} onChange={(e) => setFormPartnerName(e.target.value)} placeholder="Ej. Juan Pérez" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-qr-partner-initials">Iniciales</Label>
                <Input id="form-qr-partner-initials" value={formPartnerInitials} onChange={(e) => setFormPartnerInitials(e.target.value)} placeholder="Ej. JP" />
              </div>
            </div>
          </div>
          <div className="border-t pt-4 mt-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Colores del QR (Opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="form-qr-color-dark">Color Principal</Label>
                <Input id="form-qr-color-dark" type="color" value={formColorDark} onChange={(e) => setFormColorDark(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-qr-color-light">Color de Fondo</Label>
                <Input id="form-qr-color-light" type="color" value={formColorLight} onChange={(e) => setFormColorLight(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            {formMode === 'create' ? 'Crear Código' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Delete Dialog */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el código QR "{qrToDelete?.name}".
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
  );
}
