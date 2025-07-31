
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { FileUploadDialog } from '@/components/ui/FileUploadDialog';
import {
  fetchAdditionalServices,
  createAdditionalService,
  updateAdditionalService,
  deleteAdditionalService,
  fetchActivationRequests,
  createActivationRequest,
  updateActivationRequestStatus,
  deleteAllActivationRequests,
  fetchCancellationRequests,
  createCancellationRequest,
  updateCancellationRequestStatus,
  deleteAllCancellationRequests,
  fetchUserServices,
  updateUserService,
  createUserService,
  type AdditionalServiceData,
  type ActivationRequestData,
  type CancellationRequestData,
  type UserSubscribedServiceData
} from '@/lib/additional-services';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Briefcase,
  Plus,
  Trash2,
  Download,
  RefreshCw,
  AlertCircle,
  Video,
  Link as LinkIcon,
  Check,
  X,
  Loader2,
  Pencil,
  UserCheck,
  UserX,
  PlayCircle,
  Clock,
  CheckCircle,
  Ban
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import Rh from '@/lib/rh';

// Interfaces (kept for compatibility, now using MongoDB types)
interface VideoData {
  title: string;
  sourceType: 'url' | 'upload';
  url: string;
}

interface AdditionalService {
  id: string;
  name: string;
  paymentLink: string;
  addServiceButtonText: string;
  activateServiceButtonText: string;
  cancelServiceButtonText: string;
  videoES: VideoData;
  videoEN: VideoData;
  active: boolean;
  createdAt: string;
}

interface ActivationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface CancellationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  requestedAt: string;
  status: 'pending' | 'processed';
}

interface UserData {
  role?: 'admin' | 'client' | 'impulsor_de_impacto';
  fullName?: string;
  email?: string;
}

interface UserSubscribedService {
  serviceId: string;
  status: 'pending_activation' | 'active' | 'pending_cancellation';
  activatedAt?: string;
}


// Main Component
export default function AdditionalServicesPage() {
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const [userData, setUserData] = React.useState<UserData | null>(null);

  const [services, setServices] = React.useState<AdditionalService[]>([]);
  const [requests, setRequests] = React.useState<ActivationRequest[]>([]);
  const [cancellationRequests, setCancellationRequests] = React.useState<CancellationRequest[]>([]);
  const [userServices, setUserServices] = React.useState<UserSubscribedService[]>([]);
  
  const [loading, setLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Dialog states for Admin
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<AdditionalService | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [serviceToDelete, setServiceToDelete] = React.useState<AdditionalService | null>(null);
  const [isResetAlertOpen, setIsResetAlertOpen] = React.useState(false);
  const [isCancelResetAlertOpen, setIsCancelResetAlertOpen] = React.useState(false);

  // Dialog states for Client/User
  const [selectedService, setSelectedService] = React.useState<AdditionalService | null>(null);
  const [playingVideoUrl, setPlayingVideoUrl] = React.useState<string | null>(null);
  const [playingVideoTitle, setPlayingVideoTitle] = React.useState<string | null>(null);

  // Form state for Admin
  const [formState, setFormState] = React.useState<Omit<AdditionalService, 'id' | 'createdAt'>>({
    name: '',
    paymentLink: '',
    addServiceButtonText: 'Agregar Servicio',
    activateServiceButtonText: 'Activar Servicio',
    cancelServiceButtonText: 'Cancelar Servicio',
    videoES: { title: '', sourceType: 'url', url: '' },
    videoEN: { title: '', sourceType: 'url', url: '' },
    active: true,
  });

  // Fetch user role & data
  React.useEffect(() => {
    const fetchAllData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      }
      
      try {
        // Fetch services from MongoDB
        const servicesData = await fetchAdditionalServices();
        // Convert to AdditionalService type
        const convertedServices: AdditionalService[] = servicesData.map(service => ({
          id: service.id!,
          name: service.name,
          paymentLink: service.paymentLink,
          addServiceButtonText: service.addServiceButtonText,
          activateServiceButtonText: service.activateServiceButtonText,
          cancelServiceButtonText: service.cancelServiceButtonText,
          videoES: service.videoES,
          videoEN: service.videoEN,
          active: service.active,
          createdAt: service.createdAt || new Date().toISOString()
        }));
        setServices(convertedServices);

        // Fetch activation requests from MongoDB
        const requestsData = await fetchActivationRequests();
        // Convert to ActivationRequest type
        const convertedRequests: ActivationRequest[] = requestsData.map(request => ({
          id: request.id!,
          userId: request.userId,
          userName: request.userName,
          userEmail: request.userEmail,
          serviceId: request.serviceId,
          serviceName: request.serviceName,
          requestedAt: request.requestedAt || new Date().toISOString(),
          status: request.status
        }));
        setRequests(convertedRequests);
        
        // Fetch cancellation requests from MongoDB
        const cancellationRequestsData = await fetchCancellationRequests();
        // Convert to CancellationRequest type
        const convertedCancellationRequests: CancellationRequest[] = cancellationRequestsData.map(request => ({
          id: request.id!,
          userId: request.userId,
          userName: request.userName,
          userEmail: request.userEmail,
          serviceId: request.serviceId,
          serviceName: request.serviceName,
          requestedAt: request.requestedAt || new Date().toISOString(),
          status: request.status
        }));
        setCancellationRequests(convertedCancellationRequests);

        // Fetch user services from MongoDB if user is logged in
        if (user) {
          const userServicesData = await fetchUserServices(user.uid);
          // Transform to match the interface
          const transformedUserServices = userServicesData.map(us => ({
            serviceId: us.serviceId,
            status: us.status,
            activatedAt: us.activatedAt
          }));
          setUserServices(transformedUserServices);
        }

      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load data from database.' });
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) fetchAllData();
  }, [user, authLoading, toast]);


  // === ADMIN HANDLERS ===
const handleFormChange = (field: keyof typeof formState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleVideoChange = (lang: 'ES' | 'EN', field: keyof VideoData, value: any) => {
    const key = lang === 'ES' ? 'videoES' : 'videoEN';
    setFormState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };
  
  const handleVideoFileUpload = (fileName: string | null, lang: 'ES' | 'EN') => {
    if (fileName) {
      const fileUrl = `${Rh.ImgUrl}/${fileName}`;
      handleVideoChange(lang, 'url', fileUrl);
    }
  };

  const openCreateDialog = () => {
    setEditingService(null);
    setFormState({
      name: '',
      paymentLink: '',
      addServiceButtonText: 'Agregar Servicio',
      activateServiceButtonText: 'Activar Servicio',
      cancelServiceButtonText: 'Cancelar Servicio',
      videoES: { title: '', sourceType: 'url', url: '' },
      videoEN: { title: '', sourceType: 'url', url: '' },
      active: true,
    });
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (service: AdditionalService) => {
    setEditingService(service);
    setFormState({
      name: service.name,
      paymentLink: service.paymentLink,
      addServiceButtonText: service.addServiceButtonText || 'Agregar Servicio',
      activateServiceButtonText: service.activateServiceButtonText || 'Activar Servicio',
      cancelServiceButtonText: service.cancelServiceButtonText || 'Cancelar Servicio',
      videoES: service.videoES,
      videoEN: service.videoEN,
      active: service.active,
    });
    setIsFormDialogOpen(true);
  };

  const handleSaveService = async () => {
    setIsSaving(true);
    try {
      if (editingService) {
        // Update existing service
        const updatedService = await updateAdditionalService(editingService.id, formState);
        // Convert to AdditionalService type
        const convertedService: AdditionalService = {
          id: updatedService.id!,
          name: updatedService.name,
          paymentLink: updatedService.paymentLink,
          addServiceButtonText: updatedService.addServiceButtonText,
          activateServiceButtonText: updatedService.activateServiceButtonText,
          cancelServiceButtonText: updatedService.cancelServiceButtonText,
          videoES: updatedService.videoES,
          videoEN: updatedService.videoEN,
          active: updatedService.active,
          createdAt: updatedService.createdAt || new Date().toISOString()
        };
        setServices(services.map(s => s.id === editingService.id ? convertedService : s));
      } else {
        // Create new service
        const newService = await createAdditionalService(formState);
        // Convert to AdditionalService type
        const convertedService: AdditionalService = {
          id: newService.id!,
          name: newService.name,
          paymentLink: newService.paymentLink,
          addServiceButtonText: newService.addServiceButtonText,
          activateServiceButtonText: newService.activateServiceButtonText,
          cancelServiceButtonText: newService.cancelServiceButtonText,
          videoES: newService.videoES,
          videoEN: newService.videoEN,
          active: newService.active,
          createdAt: newService.createdAt || new Date().toISOString()
        };
        setServices([...services, convertedService]);
      }
      
      toast({ title: 'Éxito', description: 'El servicio ha sido guardado.' });
      setIsFormDialogOpen(false);
    } catch (error) {
      console.error('Error saving service:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el servicio.' });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (service: AdditionalService) => {
    setServiceToDelete(service);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      await deleteAdditionalService(serviceToDelete.id);
      setServices(services.filter(s => s.id !== serviceToDelete.id));
      toast({ title: 'Servicio Eliminado', description: `"${serviceToDelete.name}" ha sido eliminado.` });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el servicio.' });
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  const handleRequestStatusChange = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      await updateActivationRequestStatus(requestId, status);
      setRequests(requests.map(r => r.id === requestId ? {...r, status} : r));
      toast({ title: 'Solicitud Actualizada', description: `La solicitud ha sido marcada como ${status}.`});
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la solicitud.' });
    }
  };

  const handleExport = () => {
    if (requests.length === 0) {
      toast({ variant: 'destructive', title: 'No hay datos para exportar.' });
      return;
    }
    const headers = Object.keys(requests[0]);
    const csvContent = [
      headers.join(','),
      ...requests.map(row => headers.map(header => JSON.stringify((row as any)[header])).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `service_requests_${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: '¡Exportado!', description: 'La lista de solicitudes ha sido descargada.' });
  };
  
  const confirmReset = async () => {
    try {
      await deleteAllActivationRequests();
      setRequests([]);
      toast({ title: 'Lista Reseteada', description: 'La lista de solicitudes de activación ha sido borrada.' });
    } catch (error) {
      console.error('Error resetting requests:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron eliminar las solicitudes.' });
    } finally {
      setIsResetAlertOpen(false);
    }
  };

  const handleCancellationStatusChange = async (requestId: string) => {
    try {
      await updateCancellationRequestStatus(requestId);
      setCancellationRequests(cancellationRequests.map(r => r.id === requestId ? {...r, status: 'processed' as const} : r));
      toast({ title: 'Solicitud Procesada', description: `La solicitud de cancelación ha sido marcada como procesada.`});
    } catch (error) {
      console.error('Error updating cancellation request:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo procesar la solicitud de cancelación.' });
    }
  };

  const handleExportCancellations = () => {
    if (cancellationRequests.length === 0) {
      toast({ variant: 'destructive', title: 'No hay datos para exportar.' });
      return;
    }
    const headers = Object.keys(cancellationRequests[0]);
    const csvContent = [
      headers.join(','),
      ...cancellationRequests.map(row => headers.map(header => JSON.stringify((row as any)[header])).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `service_cancellations_${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: '¡Exportado!', description: 'La lista de solicitudes de cancelación ha sido descargada.' });
  };

  const confirmResetCancellations = async () => {
    try {
      await deleteAllCancellationRequests();
      setCancellationRequests([]);
      toast({ title: 'Lista Reseteada', description: 'La lista de solicitudes de cancelación ha sido borrada.' });
    } catch (error) {
      console.error('Error resetting cancellation requests:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron eliminar las solicitudes de cancelación.' });
    } finally {
      setIsCancelResetAlertOpen(false);
    }
  };

  // === CLIENT/USER HANDLERS ===
  const handlePlayVideo = (video: { title: string; url: string }) => {
    if (video.url) {
        setPlayingVideoUrl(video.url);
        setPlayingVideoTitle(video.title);
    } else {
        toast({ variant: 'destructive', title: 'Video no disponible', description: 'No se ha configurado un video para esta opción.' });
    }
  };

  const handleRequestActivation = async (service: AdditionalService) => {
    if (!user || !userData) return;

    try {
      // 1. Create user service record
      await createUserService(user.uid, service.id, 'pending_activation');
      
      // 2. Create activation request
      await createActivationRequest({
        userId: user.uid,
        userName: userData.fullName || 'N/A',
        userEmail: userData.email || 'N/A',
        serviceId: service.id,
        serviceName: service.name
      });

      // 3. Update local state
      const updatedUserServices = [...userServices.filter(s => s.serviceId !== service.id), { serviceId: service.id, status: 'pending_activation' as const }];
      setUserServices(updatedUserServices);

      // Refresh requests list
      const requestsData = await fetchActivationRequests();
      const convertedRequests: ActivationRequest[] = requestsData.map(request => ({
        id: request.id!,
        userId: request.userId,
        userName: request.userName,
        userEmail: request.userEmail,
        serviceId: request.serviceId,
        serviceName: request.serviceName,
        requestedAt: request.requestedAt || new Date().toISOString(),
        status: request.status
      }));
      setRequests(convertedRequests);

      toast({ title: 'Solicitud Enviada', description: `Se ha enviado tu solicitud para activar "${service.name}".`});
    } catch (error) {
      console.error('Error requesting activation:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la solicitud de activación.' });
    }
  };

  const handleRequestCancellation = async (service: AdditionalService) => {
    if (!user || !userData) return;

    try {
      // 1. Update user service status
      await updateUserService(user.uid, service.id, 'pending_cancellation');
      
      // 2. Create cancellation request
      await createCancellationRequest({
        userId: user.uid,
        userName: userData.fullName || 'N/A',
        userEmail: userData.email || 'N/A',
        serviceId: service.id,
        serviceName: service.name
      });

      // 3. Update local state
      const updatedUserServices = userServices.map(s => s.serviceId === service.id ? { ...s, status: 'pending_cancellation' as const } : s);
      setUserServices(updatedUserServices);

      // Refresh cancellation requests list
      const cancellationRequestsData = await fetchCancellationRequests();
      const convertedCancellationRequests: CancellationRequest[] = cancellationRequestsData.map(request => ({
        id: request.id!,
        userId: request.userId,
        userName: request.userName,
        userEmail: request.userEmail,
        serviceId: request.serviceId,
        serviceName: request.serviceName,
        requestedAt: request.requestedAt || new Date().toISOString(),
        status: request.status
      }));
      setCancellationRequests(convertedCancellationRequests);

      toast({ title: 'Solicitud Enviada', description: `Se ha enviado tu solicitud para cancelar "${service.name}".`});
    } catch (error) {
      console.error('Error requesting cancellation:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la solicitud de cancelación.' });
    }
  };
  
  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
    }
    return null;
  };


  if (authLoading || loading) {
    return (
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <Skeleton className="h-10 w-80" />
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  // ==== ADMIN VIEW ====
  if (userData?.role === 'admin') {
    return (
      <>
        <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Servicios Adicionales</h1>
              <p className="text-muted-foreground">Gestiona los servicios de valor añadido para tus Impulsores de Impacto y Modificadores de Consumo.</p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Servicio
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Servicios</CardTitle>
              <CardDescription>Haz clic en un servicio para ver sus detalles y editarlo.</CardDescription>
            </CardHeader>
            <CardContent>
              {services.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {services.map(service => (
                    <AccordionItem value={service.id} key={service.id}>
                      <AccordionTrigger className="text-lg hover:no-underline">
                        <div className="flex items-center gap-4">
                          <Briefcase className="h-5 w-5 text-primary" />
                          <span>{service.name}</span>
                          <Badge variant={service.active ? 'default' : 'secondary'}>{service.active ? 'Activo' : 'Inactivo'}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                         <p><span className="font-semibold">Enlace de Pago:</span> <a href={service.paymentLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{service.paymentLink || 'No definido'}</a></p>
                         <p><span className="font-semibold">Texto Botón Agregar:</span> {service.addServiceButtonText || 'No definido'}</p>
                         <p><span className="font-semibold">Texto Botón Activar:</span> {service.activateServiceButtonText || 'No definido'}</p>
                         <p><span className="font-semibold">Texto Botón Cancelar:</span> {service.cancelServiceButtonText || 'No definido'}</p>
                         <p><span className="font-semibold">Video (ES):</span> {service.videoES?<a href={service.videoES.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{service.videoES.title || 'No definido'}</a> :  'No definido'}</p>
                         <p> <span className="font-semibold">Video (EN):</span> {service.videoEN?<a href={service.videoEN.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{service.videoEN.title || 'No definido'}</a> : 'No definido'}</p>
                         <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(service)}><Pencil className="mr-2 h-4 w-4"/> Editar</Button>
                            <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(service)}><Trash2 className="mr-2 h-4 w-4"/> Eliminar</Button>
                         </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-muted-foreground text-center p-8">No se han agregado servicios adicionales. Haz clic en "Agregar Servicio" para empezar.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5"/>Solicitudes de Activación</CardTitle>
                <CardDescription>Impulsores de Impacto y Modificadores de Consumo que han solicitado la activación de un servicio.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4"/>Exportar</Button>
                <AlertDialog open={isResetAlertOpen} onOpenChange={setIsResetAlertOpen}>
                  <AlertDialogTrigger asChild>
                      <Button variant="destructive"><RefreshCw className="mr-2 h-4 w-4"/>Resetear</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción eliminará permanentemente la lista de solicitudes de activación. No se puede deshacer.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={confirmReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, resetear lista</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Servicio Solicitado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length > 0 ? requests.map(req => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.userName}<br/><span className="text-xs text-muted-foreground">{req.userEmail}</span></TableCell>
                      <TableCell>{req.serviceName}</TableCell>
                      <TableCell>{new Date(req.requestedAt).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant={req.status === 'pending' ? 'secondary' : req.status === 'approved' ? 'default' : 'destructive'}>{req.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        {req.status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleRequestStatusChange(req.id, 'approved')}><Check className="mr-2 h-4 w-4"/>Aprobar</Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleRequestStatusChange(req.id, 'rejected')}><X className="mr-2 h-4 w-4"/>Rechazar</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">No hay solicitudes pendientes.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                      <CardTitle className="flex items-center gap-2"><UserX className="h-5 w-5"/>Solicitudes de Cancelación</CardTitle>
                      <CardDescription>Impulsores de Impacto que han solicitado la cancelación de un servicio activo.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="outline" onClick={handleExportCancellations}><Download className="mr-2 h-4 w-4"/>Exportar</Button>
                      <AlertDialog open={isCancelResetAlertOpen} onOpenChange={setIsCancelResetAlertOpen}>
                          <AlertDialogTrigger asChild>
                              <Button variant="destructive"><RefreshCw className="mr-2 h-4 w-4"/>Resetear</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción eliminará permanentemente la lista de solicitudes de cancelación. No se puede deshacer.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={confirmResetCancellations} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, resetear lista</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  </div>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Usuario</TableHead>
                              <TableHead>Servicio a Cancelar</TableHead>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {cancellationRequests.length > 0 ? cancellationRequests.map(req => (
                              <TableRow key={req.id}>
                                  <TableCell className="font-medium">{req.userName}<br/><span className="text-xs text-muted-foreground">{req.userEmail}</span></TableCell>
                                  <TableCell>{req.serviceName}</TableCell>
                                  <TableCell>{new Date(req.requestedAt).toLocaleDateString()}</TableCell>
                                  <TableCell><Badge variant={req.status === 'pending' ? 'secondary' : 'default'}>{req.status}</Badge></TableCell>
                                  <TableCell className="text-right">
                                      {req.status === 'pending' && (
                                          <div className="flex gap-2 justify-end">
                                              <Button size="sm" variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-100 hover:text-orange-700" onClick={() => handleCancellationStatusChange(req.id)}><Check className="mr-2 h-4 w-4"/>Confirmar</Button>
                                          </div>
                                      )}
                                  </TableCell>
                              </TableRow>
                          )) : (
                              <TableRow><TableCell colSpan={5} className="h-24 text-center">No hay solicitudes de cancelación pendientes.</TableCell></TableRow>
                          )}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>

        </div>

        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingService ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="service-name">Nombre del Servicio</Label>
                <Input id="service-name" value={formState.name} onChange={(e) => handleFormChange('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-link">Enlace de Pago</Label>
                <Input id="payment-link" value={formState.paymentLink} onChange={(e) => handleFormChange('paymentLink', e.target.value)} placeholder="https://stripe.com/..."/>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="add-service-button-text">Texto del Botón "Agregar Servicio"</Label>
                  <Input id="add-service-button-text" value={formState.addServiceButtonText} onChange={(e) => handleFormChange('addServiceButtonText', e.target.value)} placeholder="Agregar Servicio"/>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="activate-service-button-text">Texto del Botón "Activar Servicio"</Label>
                  <Input id="activate-service-button-text" value={formState.activateServiceButtonText} onChange={(e) => handleFormChange('activateServiceButtonText', e.target.value)} placeholder="Activar Servicio"/>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="cancel-service-button-text">Texto del Botón "Cancelar Servicio"</Label>
                  <Input id="cancel-service-button-text" value={formState.cancelServiceButtonText} onChange={(e) => handleFormChange('cancelServiceButtonText', e.target.value)} placeholder="Cancelar Servicio"/>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="service-active">Servicio Activo</Label>
                <Switch id="service-active" checked={formState.active} onCheckedChange={(checked) => handleFormChange('active', checked)} />
              </div>

              {/* Video en Español */}
              <div className="space-y-4 rounded-md border p-4">
                <h4 className="font-semibold">Video en Español</h4>
                <div className="space-y-2">
                  <Label htmlFor="video-es-title">Título del Video (ES)</Label>
                  <Input id="video-es-title" value={formState.videoES.title} onChange={(e) => handleVideoChange('ES', 'title', e.target.value)} />
                </div>
                <RadioGroup value={formState.videoES.sourceType} onValueChange={(value) => handleVideoChange('ES', 'sourceType', value)}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="url" id="es-url" /><Label htmlFor="es-url">Desde URL</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="upload" id="es-upload" /><Label htmlFor="es-upload">Subir Video</Label></div>
                </RadioGroup>
                {formState.videoES.sourceType === 'url' ? (
                   <Input value={formState.videoES.url} onChange={(e) => handleVideoChange('ES', 'url', e.target.value)} placeholder="https://youtube.com/..."/>
                ) : (
                   <FileUploadDialog
                     valuex={formState.videoES.url}
                     onChange={(fileName) =>{

handleVideoChange('ES', 'url', `${Rh.ImgUrl}/${fileName}`);
handleVideoChange('ES', 'sourceType', 'url');

                     }
                    }

                     placeholder="Haz clic para subir video en español"
                     inpname="videoES"
                   />
                )}
              </div>

               {/* Video en Inglés */}
               <div className="space-y-4 rounded-md border p-4">
                <h4 className="font-semibold">Video en Inglés</h4>
                <div className="space-y-2">
                  <Label htmlFor="video-en-title">Título del Video (EN)</Label>
                  <Input id="video-en-title" value={formState.videoEN.title} onChange={(e) => handleVideoChange('EN', 'title', e.target.value)} />
                </div>
                <RadioGroup value={formState.videoEN.sourceType} onValueChange={(value) => handleVideoChange('EN', 'sourceType', value)}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="url" id="en-url" /><Label htmlFor="en-url">Desde URL</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="upload" id="en-upload" /><Label htmlFor="en-upload">Subir Video</Label></div>
                </RadioGroup>
                {formState.videoEN.sourceType === 'url' ? (
                   <Input value={formState.videoEN.url} onChange={(e) => handleVideoChange('EN', 'url', e.target.value)} placeholder="https://youtube.com/..."/>
                ) : (
                   <FileUploadDialog
                     valuex={formState.videoEN.url}
                     onChange={(fileName) => {
                       handleFormChange('videoEN', { url: `${Rh.ImgUrl}/${fileName}` });
                       handleFormChange('videoEN', { sourceType: 'url' });
                      }}
                     placeholder="Haz clic para subir video en inglés"
                     inpname="videoEN"
                   />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveService} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}
                Guardar Servicio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>Esta acción eliminará permanentemente el servicio "{serviceToDelete?.name}". No se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDeleteService} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, eliminar</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ==== CLIENT/USER VIEW ====
  const activeServices = services.filter(s => s.active);

  return (
    <>
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Servicios Adicionales</h1>
            <p className="text-muted-foreground">Explora y gestiona los servicios de valor añadido disponibles para ti.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {activeServices.length > 0 ? (
                activeServices.map(service => (
                    <Button
                        key={service.id}
                        variant="outline"
                        className="w-full justify-start p-6 text-lg bg-card hover:bg-card/90 border-border h-auto"
                        onClick={() => setSelectedService(service)}
                    >
                        {service.name}
                    </Button>
                ))
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Actualmente no hay servicios adicionales disponibles.</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
      
      <Dialog open={!!selectedService} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setSelectedService(null);
                setPlayingVideoUrl(null);
                setPlayingVideoTitle(null);
            }
        }}>
          <DialogContent className={cn(playingVideoUrl ? 'sm:max-w-3xl' : 'sm:max-w-md')}>
              <DialogHeader>
                  <DialogTitle>{playingVideoUrl ? playingVideoTitle : selectedService?.name}</DialogTitle>
                   {!playingVideoUrl && 
                    <DialogDescription>
                        Visualiza los videos de capacitación o gestiona el estado de tu servicio.
                    </DialogDescription>
                   }
              </DialogHeader>
              {selectedService && (
                  <div className="space-y-4 pt-4">
                      {playingVideoUrl ? (
                          <div className="space-y-2">
                               <div className="aspect-video bg-black rounded-md">
                                  {(() => {
                                      const embedUrl = getYouTubeEmbedUrl(playingVideoUrl);
                                      if (embedUrl) {
                                          return (
                                              <iframe
                                                  src={embedUrl}
                                                  title={playingVideoTitle || 'Video'}
                                                  frameBorder="0"
                                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                  allowFullScreen
                                                  className="w-full h-full rounded-md"
                                              />
                                          );
                                      }
                                      return <video src={playingVideoUrl} controls autoPlay className="w-full h-full rounded-md" />;
                                  })()}
                              </div>
                              <Button variant="link" onClick={() => setPlayingVideoUrl(null)}>Volver a opciones de video</Button>
                          </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label>Video en español</Label>
                            <Button variant="outline" className="w-full justify-start" onClick={() => handlePlayVideo(selectedService.videoES)} disabled={!selectedService.videoES.url}>
                                <PlayCircle className="mr-2 h-4 w-4" /> {selectedService.videoES.title || 'Ver video'}
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label>Video en inglés</Label>
                            <Button variant="outline" className="w-full justify-start" onClick={() => handlePlayVideo(selectedService.videoEN)} disabled={!selectedService.videoEN.url}>
                                <PlayCircle className="mr-2 h-4 w-4" /> {selectedService.videoEN.title || 'Ver video'}
                            </Button>
                          </div>
                        </>
                      )}
                      
                      <Separator className="my-4" />

                      <div className="space-y-2">
                        <Button className="w-full" asChild>
                            <Link href={selectedService.paymentLink || '#'} target="_blank" rel="noopener noreferrer">{selectedService.addServiceButtonText}</Link>
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => handleRequestActivation(selectedService)}>
                            {selectedService.activateServiceButtonText}
                        </Button>
                        <Button variant="destructive" className="w-full" onClick={() => handleRequestCancellation(selectedService)}>
                            {selectedService.cancelServiceButtonText}
                        </Button>
                      </div>

                      <div className="pt-2">
                          {(() => {
                              const userService = userServices.find(s => s.serviceId === selectedService.id);
                              if (!userService) {
                                  return null;
                              }
                              switch (userService.status) {
                                  case 'pending_activation':
                                      return (
                                          <Badge className="w-full justify-center" variant="secondary">
                                              <Clock className="mr-2 h-4 w-4" />
                                              Pendiente de Activación
                                          </Badge>
                                      );
                                  case 'active':
                                      return (
                                          <Badge className="w-full justify-center" variant="default">
                                              <CheckCircle className="mr-2 h-4 w-4" />
                                              Servicio Activo
                                          </Badge>
                                      );
                                  case 'pending_cancellation':
                                      return (
                                          <Badge className="w-full justify-center" variant="secondary">
                                              <Ban className="mr-2 h-4 w-4" />
                                              Cancelación Pendiente
                                          </Badge>
                                      );
                                  default:
                                      return null;
                              }
                          })()}
                      </div>
                  </div>
              )}
          </DialogContent>
      </Dialog>
    </>
  );
}
