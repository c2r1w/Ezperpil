
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Ticket, Gift, Edit, Save, Loader2, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Interfaces
interface UserData {
  role?: 'admin' | 'client' | 'user';
}

interface TranslatableContent {
  title: string;
  description: string;
  nextEventDate: string;
  ticketButtonText: string;
}

interface EplEvent {
  id: 'community' | 'special' | 'pet' | 'talent' | 'idea';
  content: {
    es: TranslatableContent;
    en: TranslatableContent;
  };
  imageUrl: string;
  ticketPaymentLink: string;
  raffleLink: string;
}

type EditableEvent = Omit<EplEvent, 'id'>;

const LOCAL_STORAGE_KEY = 'eplCommunityEvents_bilingual';

const initialEvents: EplEvent[] = [
  { id: 'community', content: { es: { title: 'Apoyo Comunitario', description: 'Únete a nosotros para apoyar y hacer crecer nuestra comunidad juntos.', nextEventDate: 'Próximo Evento: Por Anunciar', ticketButtonText: 'Comprar Ticket' }, en: { title: 'Community Support', description: 'Join us to support and grow our community together.', nextEventDate: 'Next Event: TBA', ticketButtonText: 'Buy Ticket' } }, imageUrl: 'https://placehold.co/600x400.png', ticketPaymentLink: '#', raffleLink: '#' },
  { id: 'special', content: { es: { title: 'Apoyo a Eventos Especiales', description: 'Sé parte de nuestros eventos especiales. Tu apoyo marca la diferencia.', nextEventDate: 'Próximo Evento: Este Viernes', ticketButtonText: 'Comprar Ticket' }, en: { title: 'Special Event Support', description: 'Be a part of our special events. Your support makes a difference.', nextEventDate: 'Next Event: This Friday', ticketButtonText: 'Buy Ticket' } }, imageUrl: 'https://placehold.co/600x400.png', ticketPaymentLink: '#', raffleLink: '#' },
  { id: 'pet', content: { es: { title: 'Apoyo a Mi Mascota', description: 'Ayúdanos a cuidar de nuestros amigos peludos. Cada contribución cuenta.', nextEventDate: 'Próximo Evento: Primero del Mes', ticketButtonText: 'Comprar Ticket' }, en: { title: 'My Pet Support', description: 'Help us care for our furry friends. Every contribution counts.', nextEventDate: 'Next Event: First of Month', ticketButtonText: 'Buy Ticket' } }, imageUrl: 'https://placehold.co/600x400.png', ticketPaymentLink: '#', raffleLink: '#' },
  { id: 'talent', content: { es: { title: 'Apoyo a la Creación de Talentos', description: 'Apoya a la próxima generación de talento e innovación.', nextEventDate: 'Próximo Evento: Trimestral', ticketButtonText: 'Comprar Ticket' }, en: { title: 'Building Talent Support', description: 'Support the next generation of talent and innovation.', nextEventDate: 'Next Event: Quarterly', ticketButtonText: 'Buy Ticket' } }, imageUrl: 'https://placehold.co/600x400.png', ticketPaymentLink: '#', raffleLink: '#' },
  { id: 'idea', content: { es: { title: 'Apoyo a Mi Idea', description: '¿Tienes una gran idea? Construyámosla juntos con el apoyo de la comunidad.', nextEventDate: 'Próximo Evento: Siempre Abierto', ticketButtonText: 'Comprar Ticket' }, en: { title: 'My Idea Support', description: 'Have a great idea? Let\'s build it together with community support.', nextEventDate: 'Next Event: Always Open', ticketButtonText: 'Buy Ticket' } }, imageUrl: 'https://placehold.co/600x400.png', ticketPaymentLink: '#', raffleLink: '#' },
];

export default function EplCommunityPage() {
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const [userData, setUserData] = React.useState<UserData | null>(null);
  
  const [language, setLanguage] = React.useState<'es' | 'en'>('en');
  const [eplEvents, setEplEvents] = React.useState<EplEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Dialog and form state for admin
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<EplEvent | null>(null);
  const [editFormData, setEditFormData] = React.useState<Partial<EditableEvent>>({});
  const [imageSourceType, setImageSourceType] = React.useState<'url' | 'upload'>('url');
  const [imageFile, setImageFile] = React.useState<File | null>(null);
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
    };
    if (!authLoading) fetchUserData();
  }, [user, authLoading]);

  // Load events from localStorage
  React.useEffect(() => {
    try {
      const storedEvents = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedEvents) {
        setEplEvents(JSON.parse(storedEvents));
      } else {
        setEplEvents(initialEvents);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialEvents));
      }
    } catch (error) {
      console.error("Could not load EPL events from localStorage", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load event data.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleEditClick = (event: EplEvent) => {
    setEditingEvent(event);
    setEditFormData({
      content: event.content,
      imageUrl: event.imageUrl,
      ticketPaymentLink: event.ticketPaymentLink,
      raffleLink: event.raffleLink
    });
    setImageFile(null);
    setImageSourceType('url');
    setIsEditDialogOpen(true);
  };
  
  const handleLangFormChange = (lang: 'es' | 'en', field: keyof TranslatableContent, value: string) => {
    setEditFormData(prev => {
        if (!prev || !prev.content) return prev;
        const newContent = { ...prev.content, [lang]: { ...prev.content[lang], [field]: value }};
        return { ...prev, content: newContent };
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ variant: "destructive", title: "File too large", description: "Image cannot exceed 5MB." });
        return;
      }
      setImageFile(file);
      const currentImageUrl = editFormData.imageUrl;
      if (currentImageUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(currentImageUrl);
      }
      setEditFormData(prev => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
    }
  };

  const handleSave = () => {
    if (!editingEvent) return;
    setIsSaving(true);
    
    const updatedEvents = eplEvents.map(event => 
      event.id === editingEvent.id ? { ...event, ...editFormData } as EplEvent : event
    );

    setEplEvents(updatedEvents);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedEvents));
      toast({ title: "¡Guardado!", description: "Los detalles del evento han sido actualizados." });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save event data.' });
    } finally {
      setIsSaving(false);
      setIsEditDialogOpen(false);
    }
  };

  React.useEffect(() => {
    return () => {
        if (editFormData.imageUrl && editFormData.imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(editFormData.imageUrl);
        }
    }
  }, [editFormData.imageUrl]);
  
  if (loading || authLoading) {
    return (
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-80 w-full"/></CardContent></Card>)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">EPL Community</h1>
            <p className="text-muted-foreground">
              {language === 'es' ? 'Conéctate y encuentra apoyo dentro de la Comunidad EPL.' : 'Connect and find support within the EPL Community.'}
            </p>
          </div>
          <RadioGroup defaultValue="en" onValueChange={(value) => setLanguage(value as 'es' | 'en')} className="flex items-center gap-4 bg-card p-1 rounded-full border">
            <Label htmlFor="lang-es" className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
              <RadioGroupItem value="es" id="lang-es" className="sr-only" />
              Español
            </Label>
            <Label htmlFor="lang-en" className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
              <RadioGroupItem value="en" id="lang-en" className="sr-only" />
              English
            </Label>
          </RadioGroup>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {eplEvents.map(event => (
            <Card key={event.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow">
              <div className="relative h-48 w-full">
                <Image src={event.imageUrl} alt={event.content[language].title} fill className="object-cover" data-ai-hint="community event support" />
              </div>
              <CardHeader className="flex-grow">
                <CardTitle>{event.content[language].title}</CardTitle>
                <CardDescription>{event.content[language].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>{event.content[language].nextEventDate}</span>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-2 pt-4">
                <Button asChild>
                  <a href={event.ticketPaymentLink} target="_blank" rel="noopener noreferrer">
                    <Ticket className="mr-2 h-4 w-4" /> {event.content[language].ticketButtonText}
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={event.raffleLink} target="_blank" rel="noopener noreferrer">
                    <Gift className="mr-2 h-4 w-4" /> {language === 'es' ? 'Ir a la Rifa' : 'Go to Raffle'}
                  </a>
                </Button>
                {userData?.role === 'admin' && (
                  <Button variant="secondary" className="mt-2" onClick={() => handleEditClick(event)}>
                    <Edit className="mr-2 h-4 w-4" /> {language === 'es' ? 'Editar' : 'Edit'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit: {editingEvent?.content.en.title}</DialogTitle>
            <DialogDescription>
              Update the details for this event category. Changes will be saved locally.
            </DialogDescription>
          </DialogHeader>
          {editFormData && editFormData.content && (
            <div className="grid gap-4 py-4">
              <Tabs defaultValue="es" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="es">Español</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
                <TabsContent value="es" className="space-y-4 pt-4">
                  <div className="space-y-2"><Label htmlFor="title-es">Título del Evento</Label><Input id="title-es" name="title" value={editFormData.content.es.title} onChange={(e) => handleLangFormChange('es', 'title', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="description-es">Descripción del Evento</Label><Textarea id="description-es" name="description" value={editFormData.content.es.description} onChange={(e) => handleLangFormChange('es', 'description', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="nextEventDate-es">Texto del Próximo Evento</Label><Input id="nextEventDate-es" name="nextEventDate" value={editFormData.content.es.nextEventDate} onChange={(e) => handleLangFormChange('es', 'nextEventDate', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="ticketButtonText-es">Texto del Botón de Ticket</Label><Input id="ticketButtonText-es" name="ticketButtonText" value={editFormData.content.es.ticketButtonText} onChange={(e) => handleLangFormChange('es', 'ticketButtonText', e.target.value)} /></div>
                </TabsContent>
                <TabsContent value="en" className="space-y-4 pt-4">
                   <div className="space-y-2"><Label htmlFor="title-en">Event Title</Label><Input id="title-en" name="title" value={editFormData.content.en.title} onChange={(e) => handleLangFormChange('en', 'title', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="description-en">Event Description</Label><Textarea id="description-en" name="description" value={editFormData.content.en.description} onChange={(e) => handleLangFormChange('en', 'description', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="nextEventDate-en">Next Event Text</Label><Input id="nextEventDate-en" name="nextEventDate" value={editFormData.content.en.nextEventDate} onChange={(e) => handleLangFormChange('en', 'nextEventDate', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="ticketButtonText-en">Ticket Button Text</Label><Input id="ticketButtonText-en" name="ticketButtonText" value={editFormData.content.en.ticketButtonText} onChange={(e) => handleLangFormChange('en', 'ticketButtonText', e.target.value)} /></div>
                </TabsContent>
              </Tabs>
              
              <div className="space-y-2 pt-4">
                <Label>Event Image</Label>
                <RadioGroup value={imageSourceType} onValueChange={(v) => setImageSourceType(v as any)} className="grid grid-cols-2 gap-2 pt-1">
                    <Label htmlFor="img-url" className="flex items-center justify-center rounded-md border-2 p-2 hover:bg-accent cursor-pointer h-10 text-xs">
                        <RadioGroupItem value="url" id="img-url" /> <span className="ml-2">From URL</span>
                    </Label>
                    <Label htmlFor="img-upload" className="flex items-center justify-center rounded-md border-2 p-2 hover:bg-accent cursor-pointer h-10 text-xs">
                        <RadioGroupItem value="upload" id="img-upload" /><span className="ml-2">Upload File</span>
                    </Label>
                </RadioGroup>
                 {imageSourceType === 'url' ? (
                    <Input name="imageUrl" value={editFormData.imageUrl?.startsWith('blob:') ? '' : editFormData.imageUrl || ''} onChange={handleFormChange} placeholder="https://example.com/image.png" />
                 ) : (
                    <Input type="file" accept="image/*" onChange={handleImageFileChange} />
                 )}
                 {editFormData.imageUrl && <Image src={editFormData.imageUrl} alt="preview" width={100} height={100} className="rounded-md object-cover mt-2" />}
              </div>

              <div className="space-y-2"><Label htmlFor="ticketPaymentLink">Ticket Payment Link</Label><Input id="ticketPaymentLink" name="ticketPaymentLink" value={editFormData.ticketPaymentLink || ''} onChange={handleFormChange} /></div>
              <div className="space-y-2"><Label htmlFor="raffleLink">Raffle Link</Label><Input id="raffleLink" name="raffleLink" value={editFormData.raffleLink || ''} onChange={handleFormChange} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
