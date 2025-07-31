
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
import {
  Plus,
  Trash2,
  Video,
  Pencil,
  Loader2,
  Save,
  Wrench,
  Link as LinkIcon,
  Upload,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Interfaces
interface HowToVideo {
  id: string;
  title: string;
  sourceType: 'url' | 'upload';
  url: string;
  createdAt: string;
}

interface UserData {
  role?: 'admin' | 'client' | 'user';
}

const LOCAL_STORAGE_KEY = 'howToVideosState';

// Main Component
export default function HerramientasPage() {
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const [userData, setUserData] = React.useState<UserData | null>(null);

  const [videos, setVideos] = React.useState<HowToVideo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Dialog states for Admin
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingVideo, setEditingVideo] = React.useState<HowToVideo | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [videoToDelete, setVideoToDelete] = React.useState<HowToVideo | null>(null);

  // Form state for Admin
  const [formState, setFormState] = React.useState<Omit<HowToVideo, 'id' | 'createdAt'>>({
    title: '',
    sourceType: 'url',
    url: '',
  });

  const [videoFile, setVideoFile] = React.useState<File | null>(null);


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
        const storedVideos = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedVideos) {
            setVideos(JSON.parse(storedVideos));
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load video data from local storage.' });
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
  
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setVideoFile(file);
        handleFormChange('url', URL.createObjectURL(file));
    }
  };

  const openCreateDialog = () => {
    setEditingVideo(null);
    setFormState({ title: '', sourceType: 'url', url: '' });
    setVideoFile(null);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (video: HowToVideo) => {
    setEditingVideo(video);
    setFormState({
      title: video.title,
      sourceType: video.sourceType,
      url: video.url,
    });
    setVideoFile(null);
    setIsFormDialogOpen(true);
  };
  
  // Cleanup blob URLs
  React.useEffect(() => {
    return () => {
        if (formState.sourceType === 'upload' && formState.url.startsWith('blob:')) {
            URL.revokeObjectURL(formState.url);
        }
    }
  }, [formState]);

  const handleSaveVideo = () => {
    if (!formState.title || !formState.url) {
        toast({ variant: 'destructive', title: 'Faltan datos', description: 'El título y la URL/archivo son obligatorios.' });
        return;
    }
    setIsSaving(true);
    let updatedVideos: HowToVideo[];

    const dataToSave = { ...formState };
    if (dataToSave.sourceType === 'upload' && !videoFile && editingVideo?.sourceType !== 'upload') {
        toast({ variant: 'destructive', title: 'Falta archivo', description: 'Por favor, selecciona un archivo de video para subir.' });
        setIsSaving(false);
        return;
    }


    if (editingVideo) {
      updatedVideos = videos.map(v => v.id === editingVideo.id ? { ...editingVideo, ...dataToSave } : v);
    } else {
      const newVideo: HowToVideo = {
        id: `video_${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...dataToSave
      };
      updatedVideos = [...videos, newVideo];
    }
    
    setVideos(updatedVideos);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVideos));
    toast({ title: 'Éxito', description: 'El video ha sido guardado.' });
    
    setIsSaving(false);
    setIsFormDialogOpen(false);
  };

  const openDeleteDialog = (video: HowToVideo) => {
    setVideoToDelete(video);
    setIsDeleteAlertOpen(true);
  };

  const confirmDeleteVideo = () => {
    if (!videoToDelete) return;
    const updatedVideos = videos.filter(v => v.id !== videoToDelete.id);
    setVideos(updatedVideos);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedVideos));
    toast({ title: 'Video Eliminado', description: `"${videoToDelete.title}" ha sido eliminado.` });
    setIsDeleteAlertOpen(false);
  };
  
  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
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
              <h1 className="text-3xl font-bold tracking-tight">Herramientas: How-To Videos</h1>
              <p className="text-muted-foreground">Gestiona los videos tutoriales para tus usuarios.</p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Video
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Videos</CardTitle>
              <CardDescription>Aquí puedes ver, editar y eliminar los videos existentes.</CardDescription>
            </CardHeader>
            <CardContent>
              {videos.length > 0 ? (
                <div className="space-y-4">
                  {videos.map(video => (
                    <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                           <Video className="h-6 w-6 text-primary" />
                           <p className="font-semibold">{video.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(video)}><Pencil className="mr-2 h-4 w-4"/> Editar</Button>
                            <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(video)}><Trash2 className="mr-2 h-4 w-4"/> Eliminar</Button>
                        </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No hay videos tutoriales todavía.</p>
                    <p>Haz clic en "Agregar Video" para empezar a crear tu biblioteca.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Form Dialog */}
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingVideo ? 'Editar Video' : 'Agregar Nuevo Video'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="video-title">Título del Video</Label>
                <Input id="video-title" value={formState.title} onChange={(e) => handleFormChange('title', e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Fuente del Video</Label>
                 <RadioGroup value={formState.sourceType} onValueChange={(value) => handleFormChange('sourceType', value)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="url" id="video-url-option" />
                        <Label htmlFor="video-url-option" className="flex items-center gap-2"><LinkIcon/>Desde URL</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="upload" id="video-upload-option" />
                        <Label htmlFor="video-upload-option" className="flex items-center gap-2"><Upload/>Subir Video</Label>
                    </div>
                </RadioGroup>
              </div>

              {formState.sourceType === 'url' ? (
                 <div className="space-y-2">
                    <Label htmlFor="video-url">URL del Video (YouTube o enlace directo)</Label>
                    <Input id="video-url" value={formState.url} onChange={(e) => handleFormChange('url', e.target.value)} placeholder="https://youtube.com/watch?v=..."/>
                 </div>
              ) : (
                 <div className="space-y-2">
                    <Label htmlFor="video-file">Subir Archivo de Video</Label>
                    <Input id="video-file" type="file" accept="video/*" onChange={handleVideoFileChange} />
                    {videoFile && <p className="text-sm text-muted-foreground">Archivo seleccionado: {videoFile.name}</p>}
                 </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveVideo} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                Guardar Video
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Dialog */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>Esta acción eliminará permanentemente el video "{videoToDelete?.title}". No se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDeleteVideo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, eliminar</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ==== CLIENT/USER VIEW ====
  return (
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Herramientas: Videos Tutoriales</h1>
            <p className="text-muted-foreground">Encuentra respuestas a tus preguntas y aprende a usar la plataforma con estos videos.</p>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Biblioteca de Videos</CardTitle>
                <CardDescription>Expande una sección para ver el video tutorial.</CardDescription>
            </CardHeader>
            <CardContent>
                {videos.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                    {videos.map(video => (
                        <AccordionItem value={video.id} key={video.id}>
                            <AccordionTrigger className="text-lg hover:no-underline">
                                <div className="flex items-center gap-4">
                                    <Video className="h-5 w-5 text-primary" />
                                    <span>{video.title}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <div className="aspect-video bg-black rounded-md overflow-hidden">
                                    {(() => {
                                        const embedUrl = getYouTubeEmbedUrl(video.url);
                                        if (embedUrl) {
                                            return <iframe src={embedUrl} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"/>;
                                        }
                                        return <video src={video.url} controls className="w-full h-full"/>;
                                    })()}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <Video className="h-12 w-12 mx-auto mb-4" />
                        <p className="font-semibold">Próximamente habrá videos tutoriales.</p>
                        <p>Vuelve a consultar pronto para ver contenido de aprendizaje.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

    