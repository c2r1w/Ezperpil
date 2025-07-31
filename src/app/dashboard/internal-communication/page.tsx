'use client';

import * as React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquareText, Plus, Download, RefreshCw, LifeBuoy, Users, Ticket as TicketIcon, Send, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Interfaces and Schemas
interface UserProfile {
  uid: string;
  role?: 'admin' | 'client' | 'impulsor_de_impacto';
  fullName?: string;
  username?: string;
  email?: string;
  
  avatarUrl?: string;
  sponsorUsername?: string;
}

const TICKET_CATEGORIES = [
  'Billing', 'Comisiones', 'Bono', 'Parte técnica', 
  'Transferencia', 'Activacion', 'Cancelacion', 'General'
] as const;

const TICKET_STATUSES = ['Open', 'In Progress', 'Closed'] as const;

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: typeof TICKET_CATEGORIES[number];
  subject: string;
  message: string;
  status: typeof TICKET_STATUSES[number];
  createdAt: string; // ISO string
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

const ticketSchema = z.object({
  category: z.enum(TICKET_CATEGORIES, { required_error: 'Category is required.' }),
  subject: z.string().min(5, 'Subject must be at least 5 characters long.'),
  message: z.string().min(20, 'Message must be at least 20 characters long.'),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

// LocalStorage Keys
const ADMIN_TICKETS_KEY = 'allSupportTickets';
const USER_TICKETS_KEY_PREFIX = 'userSupportTickets_';

export default function InternalCommunicationPage() {
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const [userData, setUserData] = React.useState<UserProfile | null>(null);
  
  // Support Ticket State
  const [allTickets, setAllTickets] = React.useState<SupportTicket[]>([]); // For admin
  const [userTickets, setUserTickets] = React.useState<SupportTicket[]>([]); // For client/user
  
  // Chat State
  const [allUsers, setAllUsers] = React.useState<UserProfile[]>([]);
  const [selectedChatUser, setSelectedChatUser] = React.useState<UserProfile | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = React.useState('');
  
  const [loading, setLoading] = React.useState(true);
  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = React.useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = React.useState(false);
  const [expandedTicketId, setExpandedTicketId] = React.useState<string | null>(null);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { category: 'General', subject: '', message: '' },
  });

  React.useEffect(() => {
    const loadData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const profile = userDoc.exists() ? { uid: user.uid, ...userDoc.data() } as UserProfile : null;
        setUserData(profile);
        
        try {
          if (profile?.role === 'admin') {
            const storedAdminTickets = localStorage.getItem(ADMIN_TICKETS_KEY);
            if (storedAdminTickets) setAllTickets(JSON.parse(storedAdminTickets));
            
            const usersQuery = query(collection(db, 'users'));
            const querySnapshot = await getDocs(usersQuery);
            const usersList = querySnapshot.docs
                .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
                .filter(u => u.uid !== user.uid);
            setAllUsers(usersList);

          } else if (profile?.username) {
            const team: UserProfile[] = [];
            if (profile.sponsorUsername) {
              const sponsorQuery = query(collection(db, 'users'), where("username", "==", profile.sponsorUsername));
              const sponsorSnapshot = await getDocs(sponsorQuery);
              if (!sponsorSnapshot.empty) {
                team.push({ uid: sponsorSnapshot.docs[0].id, ...sponsorSnapshot.docs[0].data() } as UserProfile);
              }
            }
            const referralsQuery = query(collection(db, 'users'), where("sponsorUsername", "==", profile.username));
            const referralsSnapshot = await getDocs(referralsQuery);
            referralsSnapshot.forEach(doc => {
              team.push({ uid: doc.id, ...doc.data() } as UserProfile);
            });
            setAllUsers(team);
          }

          const userTicketsKey = `${USER_TICKETS_KEY_PREFIX}${user.uid}`;
          const storedUserTickets = localStorage.getItem(userTicketsKey);
          if (storedUserTickets) setUserTickets(JSON.parse(storedUserTickets));
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load saved data.' });
        }
      }
      setLoading(false);
    };
    if (!authLoading) loadData();
  }, [user, authLoading, toast]);


  const getChatKey = React.useCallback((otherUserId: string) => {
    if (!user) return null;
    const ids = [user.uid, otherUserId].sort();
    return `chatMessages_${ids[0]}_${ids[1]}`;
  }, [user]);

  React.useEffect(() => {
    if (selectedChatUser) {
      const chatKey = getChatKey(selectedChatUser.uid);
      if (chatKey) {
        const storedMessages = localStorage.getItem(chatKey);
        setMessages(storedMessages ? JSON.parse(storedMessages) : []);
        // Clear unread flag for this chat
        if (user) {
            const unreadKey = `unreadMessages_${user.uid}`;
            const unreadData = JSON.parse(localStorage.getItem(unreadKey) || '{}');
            if (unreadData[selectedChatUser.uid]) {
                delete unreadData[selectedChatUser.uid];
                localStorage.setItem(unreadKey, JSON.stringify(unreadData));
                window.dispatchEvent(new Event('storage'));
            }
        }
      }
    } else {
      setMessages([]);
    }
  }, [selectedChatUser, getChatKey, user]);

  const handleSendMessage = () => {
    if (!user || !selectedChatUser || !chatMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: user.uid,
      text: chatMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    const chatKey = getChatKey(selectedChatUser.uid);
    if (chatKey) {
      localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
      // Set unread flag for recipient
      const unreadKey = `unreadMessages_${selectedChatUser.uid}`;
      const unreadData = JSON.parse(localStorage.getItem(unreadKey) || '{}');
      unreadData[user.uid] = true; // Mark sender as having unread messages
      localStorage.setItem(unreadKey, JSON.stringify(unreadData));
      // Dispatch custom event to notify other components (like layout)
      window.dispatchEvent(new CustomEvent('storage', { detail: { key: unreadKey } }));
    }
    setChatMessage('');
  };

  const onSubmitTicket = (values: TicketFormValues) => {
    if (!user || !userData) return;
    const newTicket: SupportTicket = {
      id: `ticket_${Date.now()}`,
      userId: user.uid,
      userName: userData.fullName || 'N/A',
      userEmail: userData.email || 'N/A',
      status: 'Open',
      createdAt: new Date().toISOString(), ...values,
    };
    const updatedUserTickets = [...userTickets, newTicket];
    setUserTickets(updatedUserTickets);
    localStorage.setItem(`${USER_TICKETS_KEY_PREFIX}${user.uid}`, JSON.stringify(updatedUserTickets));
    const currentAdminTickets = JSON.parse(localStorage.getItem(ADMIN_TICKETS_KEY) || '[]');
    const updatedAdminTickets = [...currentAdminTickets, newTicket];
    localStorage.setItem(ADMIN_TICKETS_KEY, JSON.stringify(updatedAdminTickets));
    if (userData.role === 'admin') setAllTickets(updatedAdminTickets);
    toast({ title: 'Ticket Enviado', description: 'Tu solicitud de soporte ha sido recibida.' });
    form.reset();
    setIsNewTicketDialogOpen(false);
  };

  const handleStatusChange = (ticketId: string, newStatus: typeof TICKET_STATUSES[number]) => {
    const updatedTickets = allTickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t);
    setAllTickets(updatedTickets);
    localStorage.setItem(ADMIN_TICKETS_KEY, JSON.stringify(updatedTickets));
    const ticketToUpdate = updatedTickets.find(t => t.id === ticketId);
    if (ticketToUpdate) {
        const userKey = `${USER_TICKETS_KEY_PREFIX}${ticketToUpdate.userId}`;
        const userTicketsStored = localStorage.getItem(userKey);
        if (userTicketsStored) {
            let parsedUserTickets = JSON.parse(userTicketsStored);
            parsedUserTickets = parsedUserTickets.map((t: SupportTicket) => t.id === ticketId ? { ...t, status: newStatus } : t);
            localStorage.setItem(userKey, JSON.stringify(parsedUserTickets));
        }
    }
  };

  const handleExport = () => {
    const list = userData?.role === 'admin' ? allTickets : userTickets;
    if (list.length === 0) return toast({ variant: 'destructive', title: 'No hay datos para exportar.' });
    const headers = Object.keys(list[0]);
    const csvContent = [headers.join(','), ...list.map(row => headers.map(header => JSON.stringify((row as any)[header])).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `support_tickets_${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: '¡Exportado!', description: 'La lista de tickets ha sido descargada.' });
  };
  
  const confirmReset = () => {
    if (userData?.role === 'admin') {
      localStorage.removeItem(ADMIN_TICKETS_KEY);
      setAllTickets([]);
      toast({ title: 'Reseteado', description: 'Todos los tickets de soporte han sido borrados.' });
    } else if (user) {
      localStorage.removeItem(`${USER_TICKETS_KEY_PREFIX}${user.uid}`);
      setUserTickets([]);
      toast({ title: 'Reseteado', description: 'Tu historial de tickets ha sido borrado.' });
    }
    setIsResetDialogOpen(false);
  };
  
  const statusColors: Record<typeof TICKET_STATUSES[number], string> = { 'Open': 'bg-blue-500/80', 'In Progress': 'bg-yellow-500/80 text-background', 'Closed': 'bg-green-500/80' };
  
  if (loading || authLoading) {
     return (
        <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
          <Skeleton className="h-10 w-80" />
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
     );
  }
  
  return (
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Comunicación Interna</h1>
            <p className="text-muted-foreground">{userData?.role === 'admin' ? 'Gestiona tickets de soporte y comunícate con tu equipo.' : 'Envía solicitudes de soporte y chatea con tu equipo.'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Support Tickets Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2"><LifeBuoy className="h-6 w-6"/>Tickets de Soporte</CardTitle>
                <CardDescription>{userData?.role === 'admin' ? 'Visualiza y gestiona todos los tickets.' : 'Crea y visualiza tus tickets de soporte.'}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4"/>Exportar</Button>
                <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <AlertDialogTrigger asChild><Button variant="destructive"><RefreshCw className="mr-2 h-4 w-4"/>Resetear</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará permanentemente la lista de tickets. No se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, resetear lista</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                    {userData?.role === 'admin' && <TableHead>Usuario</TableHead>}
                    <TableHead>Categoría</TableHead><TableHead>Asunto</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Estado</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(userData?.role === 'admin' ? allTickets : userTickets).length > 0 ? 
                    (userData?.role === 'admin' ? allTickets : userTickets).map(ticket => (
                    <React.Fragment key={ticket.id}>
                        <TableRow 
                            onClick={() => setExpandedTicketId(prev => prev === ticket.id ? null : ticket.id)}
                            className="cursor-pointer"
                        >
                           {userData?.role === 'admin' && <TableCell className="font-medium">{ticket.userName}<br/><span className="text-xs text-muted-foreground">{ticket.userEmail}</span></TableCell>}
                          <TableCell><Badge variant="outline">{ticket.category}</Badge></TableCell>
                          <TableCell>{ticket.subject}</TableCell>
                          <TableCell>{format(new Date(ticket.createdAt), 'dd MMM yyyy')}</TableCell>
                          <TableCell className="text-right">
                            {userData?.role === 'admin' ? (
                                <Select value={ticket.status} onValueChange={(value: typeof TICKET_STATUSES[number]) => handleStatusChange(ticket.id, value)}>
                                    <SelectTrigger 
                                        className="w-36 h-9 ml-auto"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>{TICKET_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            ) : (<Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>)}
                          </TableCell>
                        </TableRow>
                        {expandedTicketId === ticket.id && (
                            <TableRow>
                                <TableCell colSpan={userData?.role === 'admin' ? 5 : 4}>
                                    <div className="p-2 bg-muted/30 rounded-md">
                                        <p className="font-semibold text-sm mb-2">Mensaje del Ticket:</p>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.message}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </React.Fragment>
                  )) : ( <TableRow><TableCell colSpan={userData?.role === 'admin' ? 5 : 4} className="h-24 text-center">No hay tickets de soporte.</TableCell></TableRow> )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        {/* Side Panel */}
        <div className="space-y-8">
            <Card><CardHeader>
                    <CardTitle className="flex items-center gap-2"><TicketIcon className="h-6 w-6"/>Crear Nuevo Ticket</CardTitle>
                    <CardDescription>¿Necesitas ayuda? Envíanos una solicitud de soporte.</CardDescription>
                </CardHeader><CardContent>
                    <Dialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen}>
                        <DialogTrigger asChild><Button className="w-full"><Plus className="mr-2 h-4 w-4"/>Abrir un Ticket</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                           <DialogHeader><DialogTitle>Nueva Solicitud de Soporte</DialogTitle><DialogDescription>Completa los campos a continuación. Te responderemos lo antes posible.</DialogDescription></DialogHeader>
                            <Form {...form}><form onSubmit={form.handleSubmit(onSubmitTicket)} className="space-y-4 pt-4">
                                <FormField control={form.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger></FormControl><SelectContent>{TICKET_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="subject" render={({ field }) => ( <FormItem><FormLabel>Asunto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="message" render={({ field }) => ( <FormItem><FormLabel>Mensaje</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem> )} />
                                <DialogFooter><Button type="button" variant="outline" onClick={() => setIsNewTicketDialogOpen(false)}>Cancelar</Button><Button type="submit" disabled={form.formState.isSubmitting}>Enviar Ticket</Button></DialogFooter>
                            </form></Form>
                        </DialogContent>
                    </Dialog>
                </CardContent></Card>

            <Card className="flex flex-col h-[480px]"><CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquareText className="h-6 w-6"/>Chat de Equipo</CardTitle>
                    <CardDescription>Chatea con tu equipo y otros usuarios de la plataforma.</CardDescription>
                </CardHeader><CardContent className="flex-1 flex flex-col p-0">
                  {selectedChatUser ? (
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-2 p-3 border-b">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedChatUser(null)}><ArrowLeft className="h-4 w-4"/></Button>
                        <Avatar className="h-8 w-8"><AvatarImage src={selectedChatUser.avatarUrl} /><AvatarFallback>{getInitials(selectedChatUser.fullName)}</AvatarFallback></Avatar>
                        <p className="font-semibold">{selectedChatUser.fullName}</p>
                      </div>
                      <ScrollArea className="flex-1 p-4"><div className="space-y-4">
                          {messages.map(msg => (
                            <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                              {msg.senderId !== user?.uid && <Avatar className="h-6 w-6"><AvatarImage src={selectedChatUser.avatarUrl} /><AvatarFallback>{getInitials(selectedChatUser.fullName)}</AvatarFallback></Avatar>}
                              <p className={cn("max-w-[70%] rounded-lg px-3 py-2 text-sm", msg.senderId === user?.uid ? "bg-primary text-primary-foreground" : "bg-muted")}>{msg.text}</p>
                            </div>
                          ))}
                      </div></ScrollArea>
                      <div className="p-3 border-t flex items-center gap-2">
                        <Input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Escribe un mensaje..." />
                        <Button onClick={handleSendMessage}><Send className="h-4 w-4"/></Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full p-4 space-y-4">
                        <Select onValueChange={(userId) => {
                            const userToChat = allUsers.find(u => u.uid === userId);
                            if (userToChat) {
                                setSelectedChatUser(userToChat);
                            }
                        }}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar miembro del equipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {allUsers.length > 0 ? allUsers.map(u => (
                                    <SelectItem key={u.uid} value={u.uid}>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={u.avatarUrl} />
                                                <AvatarFallback>{getInitials(u.fullName)}</AvatarFallback>
                                            </Avatar>
                                            <span>{u.fullName || u.username}</span>
                                        </div>
                                    </SelectItem>
                                )) : <SelectItem value="no-users" disabled>No hay usuarios en el equipo.</SelectItem>}
                            </SelectContent>
                        </Select>
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-4 rounded-md border-2 border-dashed">
                            <MessageSquareText className="h-10 w-10 mb-2 text-muted-foreground/50"/>
                            <p className="font-semibold text-foreground">Inicia una Conversación</p>
                            <p className="text-sm">Selecciona una persona de la lista de arriba para empezar a chatear.</p>
                        </div>
                    </div>
                  )}
                </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
