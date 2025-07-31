
'use client';

import * as React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isSameDay, parseISO, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Phone, Mail, Clock, Loader2, PhoneCall, MessageSquareText } from 'lucide-react';
import { VoiceInput } from '@/components/ui/voice-input';
import { VoiceTextarea } from '@/components/ui/voice-textarea';


// Data structures and schemas
const CATEGORIES = [
  "Recordatorio", "Cita con Cliente", "Cita con Impulsor de Impacto", "Dar seguimiento", 
  "Interesado", "No interesado", "Destacar", "Conectar en un futuro"
] as const;

const eventSchema = z.object({
  fullName: z.string().min(1, 'El nombre es requerido.'),
  dateTime: z.date({ required_error: 'La fecha y hora son requeridas.'}),
  email: z.string().email('Correo electrónico inválido.'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos.'),
  notes: z.string().optional(),
  category: z.enum(CATEGORIES),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface CalendarEvent extends EventFormValues {
  id: string;
}

const LOCAL_STORAGE_KEY_PREFIX = 'calendarEvents_';

// Main Component
export default function CalendarPage() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();

  const [date, setDate] = React.useState<Date | undefined>();
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | null>(null);
  const [eventToDelete, setEventToDelete] = React.useState<CalendarEvent | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      notes: '',
      category: 'Cita con Cliente',
    },
  });

  // Data persistence
  React.useEffect(() => {
    if (user) {
      try {
        const key = `${LOCAL_STORAGE_KEY_PREFIX}${user.uid}`;
        const storedEvents = localStorage.getItem(key);
        if (storedEvents) {
          const parsedEvents = JSON.parse(storedEvents).map((e: any) => ({
            ...e,
            dateTime: parseISO(e.dateTime),
          }));
          setEvents(parsedEvents);
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load calendar data.' });
      }
    }
    setLoading(false);
  }, [user, toast]);

  React.useEffect(() => {
    if (user && !loading) {
      try {
        const key = `${LOCAL_STORAGE_KEY_PREFIX}${user.uid}`;
        localStorage.setItem(key, JSON.stringify(events));
      } catch (error) {
        console.error('Failed to save events to local storage', error);
      }
    }
  }, [events, user, loading]);

  // Set date on client side to avoid hydration errors
  React.useEffect(() => {
    setDate(new Date());
  }, []);

  const openCreateDialog = () => {
    form.reset({
        fullName: '',
        dateTime: new Date(),
        email: '',
        phone: '',
        notes: '',
        category: 'Cita con Cliente',
    });
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event);
    form.reset(event);
    setIsFormOpen(true);
  };
  
  const openDeleteDialog = (event: CalendarEvent) => {
    setEventToDelete(event);
    setIsDeleteAlertOpen(true);
  };

  const onSubmit = (values: EventFormValues) => {
    if (editingEvent) {
      // Update
      setEvents(prevEvents => prevEvents.map(e => e.id === editingEvent.id ? { ...editingEvent, ...values } : e));
      toast({ title: 'Actividad Actualizada', description: `Se ha actualizado "${values.fullName}".` });
    } else {
      // Create
      setEvents(prevEvents => {
        const newEvent: CalendarEvent = { id: `evt_${Date.now()}`, ...values };
        return [...prevEvents, newEvent];
      });
      toast({ title: 'Actividad Creada', description: `Se ha añadido "${values.fullName}" al calendario.` });
    }
    setIsFormOpen(false);
  };

  const handleDeleteEvent = () => {
    if (!eventToDelete) return;
    setEvents(prevEvents => prevEvents.filter(e => e.id !== eventToDelete.id));
    toast({ title: 'Actividad Eliminada', description: `"${eventToDelete.fullName}" ha sido eliminada.` });
    setIsDeleteAlertOpen(false);
  };
  
  const handleDateAndTimeChange = (date: Date | undefined, time: string) => {
    if (!date) return;
    const [hours, minutes] = time.split(':').map(Number);
    let newDateTime = setHours(date, hours);
    newDateTime = setMinutes(newDateTime, minutes);
    form.setValue('dateTime', newDateTime);
  };
  
  const categoryColors: Record<typeof CATEGORIES[number], string> = {
    "Recordatorio": "bg-blue-500/80 hover:bg-blue-500/90",
    "Cita con Cliente": "bg-green-500/80 hover:bg-green-500/90",
    "Cita con Impulsor de Impacto": "bg-teal-500/80 hover:bg-teal-500/90",
    "Dar seguimiento": "bg-yellow-500/80 hover:bg-yellow-500/90 text-background",
    "Interesado": "bg-sky-500/80 hover:bg-sky-500/90",
    "No interesado": "bg-gray-500/80 hover:bg-gray-500/90",
    "Destacar": "bg-pink-500/80 hover:bg-pink-500/90",
    "Conectar en un futuro": "bg-indigo-500/80 hover:bg-indigo-500/90",
  };

  const filteredEvents = React.useMemo(() => 
    date ? events.filter(event => isSameDay(event.dateTime, date)).sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime()) : [],
  [events, date]);

  if (authLoading || loading || !date) {
    return (
        <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
            <div className="flex items-center justify-between"><Skeleton className="h-10 w-80" /></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1"><Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card></div>
              <div className="md:col-span-2"><Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card></div>
            </div>
        </div>
    );
  }

  return (
    <>
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario de Actividades</h1>
          <p className="text-muted-foreground">
            Organiza tus eventos, citas y recordatorios en un solo lugar.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Actividad
        </Button>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Calendar Picker */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-2 sm:p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border-none shadow-none"
                locale={es}
                modifiers={{
                  hasEvent: events.map(e => e.dateTime),
                }}
                modifiersStyles={{
                  hasEvent: { position: 'relative' }
                }}
                components={{
                    DayContent: (props) => {
                        const originalContent = <div className="absolute inset-0 flex items-center justify-center">{props.date.getDate()}</div>;
                        if (props.displayMonth.getMonth() !== props.date.getMonth()) {
                           return originalContent;
                        }
                        const dayHasEvent = events.some(e => isSameDay(e.dateTime, props.date));
                        return (
                            <>
                               {originalContent}
                               {dayHasEvent && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary" />}
                            </>
                        )
                    }
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Actividades para el {format(date, 'dd MMMM, yyyy', {locale: es})}</CardTitle>
                    <CardDescription>Lista de todas las actividades programadas para el día seleccionado.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hora</TableHead>
                                <TableHead>Detalle</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEvents.length > 0 ? (
                                filteredEvents.map(event => (
                                    <TableRow key={event.id}>
                                        <TableCell className="font-medium">{format(event.dateTime, 'p', {locale: es})}</TableCell>
                                        <TableCell>
                                            <p className="font-semibold">{event.fullName}</p>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <a href={`mailto:${event.email}`} className="hover:underline flex items-center gap-1"><Mail className="h-3 w-3"/>{event.email}</a>
                                                <a href={`tel:${event.phone}`} className="hover:underline flex items-center gap-1"><Phone className="h-3 w-3"/>{event.phone}</a>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="default" className={cn("text-white", categoryColors[event.category])}>
                                                {event.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(event)}><Edit className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(event)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={4} className="h-24 text-center">No hay actividades para este día.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
    
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>{editingEvent ? 'Editar Actividad' : 'Crear Nueva Actividad'}</DialogTitle>
                <DialogDescription>Completa los detalles para tu cita o recordatorio.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><VoiceInput {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                        <Controller
                            control={form.control}
                            name="dateTime"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Fecha</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, 'PPP', {locale: es}) : <span>Elige una fecha</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={(d) => handleDateAndTimeChange(d, field.value ? format(field.value, 'HH:mm') : '09:00')} initialFocus/>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <Controller
                            control={form.control}
                            name="dateTime"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Hora</FormLabel>
                                    <FormControl>
                                        <Input type="time" value={field.value ? format(field.value, 'HH:mm') : ''} onChange={(e) => handleDateAndTimeChange(field.value || new Date(), e.target.value)} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><VoiceInput type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><VoiceInput type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>Categoría</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger></FormControl>
                            <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                         </Select>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem><FormLabel>Notas</FormLabel><FormControl><VoiceTextarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {editingEvent ? 'Actualizar Actividad' : 'Guardar Actividad'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>

    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente la actividad con "{eventToDelete?.fullName}".</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
