
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Pencil, Save, X, ImageUp, Loader2, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';


// Mock data for the upcoming webinar - this would typically come from a database
const initialWebinarData = {
  title: "Nueva Herramienta para explotar cualquier negocio",
  description: "Aprende a escalar tu negocio con técnicas probadas y una nueva herramienta revolucionaria que cambiará tu forma de trabajar. No te pierdas la oportunidad de estar a la vanguardia.",
  presenter: "Eddie Partida",
  date: "20 de Diciembre, 2024",
  time: "16:00 (Hora del Pacífico)",
  imageUrl: "https://placehold.co/1280x720.png",
  templateId: "video-template-1",
};

export default function ProximoWebinarPage() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  
  // State to hold the current details being displayed
  const [webinarData, setWebinarData] = React.useState(initialWebinarData);
  
  // State to hold changes during editing
  const [editData, setEditData] = React.useState(initialWebinarData);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  
  // New state for sharing
  const [user] = useAuthState(auth);
  const [username, setUsername] = React.useState<string | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);
  const [canShare, setCanShare] = React.useState(false);

  const imagePreview = imageFile ? URL.createObjectURL(imageFile) : editData.imageUrl;

  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
        setCanShare(true);
    }

    const fetchUsername = async () => {
        if (user) {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUsername(userDoc.data()?.username || null);
                }
            } catch (error) {
                console.error("Error fetching username:", error);
            }
        }
        setLoadingUser(false);
    };

    fetchUsername();
  }, [user]);

  const shareLink = username && webinarData.templateId ? `https://www.ezperfilwebinars.com/${username}/${webinarData.templateId}` : '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
       if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'Archivo demasiado grande',
          description: 'La imagen no puede superar los 5MB.',
        });
        return;
      }
      setImageFile(file);
      setEditData(prev => ({...prev, imageUrl: URL.createObjectURL(file)}));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // In a real app, you would save `editData` and the `imageFile` to your database/storage.
    // Here we'll just simulate a save.
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create the final data object to be saved
    const finalData = { ...editData };
    if (imageFile) {
        // In a real app, you'd get the URL from your storage service after upload
        finalData.imageUrl = URL.createObjectURL(imageFile);
    }

    setWebinarData(finalData);
    setIsSaving(false);
    setIsEditing(false);
    setImageFile(null); // Clear the file after "saving"
    toast({
      title: '¡Guardado!',
      description: 'Los detalles del próximo webinar han sido actualizados.',
    });
  };

  const handleCancel = () => {
    setEditData(webinarData);
    setImageFile(null);
    setIsEditing(false);
  };
  
    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: 'Enlace copiado al portapapeles' });
    }

    const handleShare = async () => {
        const shareData = {
            title: `Webinar: ${webinarData.title}`,
            text: `¡No te pierdas este webinar! ${webinarData.description}`,
            url: shareLink,
        };
        try {
            if (navigator.share && shareLink) {
                await navigator.share(shareData);
            } else {
                throw new Error('Web Share API not supported or link not available');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            handleCopy(shareLink);
            toast({
                title: 'Enlace copiado',
                description: 'No se pudo compartir, pero hemos copiado el enlace por ti.',
            });
        }
    };


  React.useEffect(() => {
    // Cleanup blob URL
    return () => {
        if (editData.imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(editData.imageUrl);
        }
    }
  }, [editData.imageUrl]);


  return (
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Próximo Webinar</h1>
            <p className="text-muted-foreground">
            Aquí tienes los detalles del siguiente gran evento.
            </p>
        </div>
        {!isEditing ? (
            <div className="flex gap-2">
                {canShare && (
                    <Button variant="outline" onClick={handleShare} disabled={!shareLink || loadingUser}>
                        {loadingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4"/>}
                        Compartir
                    </Button>
                )}
                <Button onClick={() => { setEditData(webinarData); setIsEditing(true); }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar Detalles
                </Button>
            </div>
        ) : (
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    <X className="mr-2 h-4 w-4"/>
                    Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
        )}
      </div>
      
      <Card className="overflow-hidden">
        <div className="relative w-full h-64 md:h-80 group">
          <Image
            src={isEditing ? imagePreview : webinarData.imageUrl}
            alt={`Banner de ${webinarData.title}`}
            fill
            className="object-cover"
            data-ai-hint="business presentation"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            {isEditing ? (
                <Input
                    name="title"
                    value={editData.title}
                    onChange={handleInputChange}
                    className="text-2xl md:text-4xl font-bold text-white bg-transparent border-2 border-dashed border-white/50 h-auto p-2"
                />
            ) : (
                <h2 className="text-2xl md:text-4xl font-bold text-white shadow-lg">{webinarData.title}</h2>
            )}
          </div>
          {isEditing && (
             <div 
                className={cn(
                    "absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                )}
                onClick={() => imageInputRef.current?.click()}
             >
                <div className="text-center text-white p-4 rounded-lg bg-black/50">
                    <ImageUp className="h-12 w-12 mx-auto"/>
                    <p className="font-semibold mt-2">Subir nueva imagen</p>
                    <p className="text-sm">Recomendado: 1280x720px</p>
                </div>
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png, image/jpeg"
                    className="sr-only"
                    onChange={handleImageChange}
                />
             </div>
          )}
        </div>
        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <CardHeader className="p-0">
              <CardTitle>Descripción del Webinar</CardTitle>
            </CardHeader>
            {isEditing ? (
                 <Textarea
                    name="description"
                    value={editData.description}
                    onChange={handleInputChange}
                    className="text-base min-h-[120px]"
                 />
            ): (
                <p className="text-muted-foreground">{webinarData.description}</p>
            )}
            
            {isEditing && (
                <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()}>
                    <ImageUp className="mr-2 h-4 w-4"/>
                    Cambiar Imagen de Banner
                </Button>
            )}

            <Button asChild>
                <Link href={`/dashboard/my-webinar-room/edit?id=${webinarData.templateId}`}>
                    Editar Plantilla de Página
                </Link>
            </Button>
          </div>
          <div className="space-y-4 rounded-lg border bg-card-foreground/5 p-4">
            <h3 className="font-semibold text-lg">Detalles Clave</h3>
            {isEditing ? (
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="presenter">Presentador</Label>
                        <Input id="presenter" name="presenter" value={editData.presenter} onChange={handleInputChange}/>
                    </div>
                     <div>
                        <Label htmlFor="date">Fecha</Label>
                        <Input id="date" name="date" value={editData.date} onChange={handleInputChange}/>
                    </div>
                     <div>
                        <Label htmlFor="time">Hora</Label>
                        <Input id="time" name="time" value={editData.time} onChange={handleInputChange}/>
                    </div>
                </div>
            ) : (
                <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">{webinarData.presenter}</span>
                </li>
                <li className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>{webinarData.date}</span>
                </li>
                <li className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>{webinarData.time}</span>
                </li>
                </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
