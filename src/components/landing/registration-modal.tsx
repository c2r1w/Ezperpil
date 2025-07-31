
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { UserPlus, LogIn, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const newVisitorSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  phoneNumber: z.string().min(10, 'Número de teléfono inválido').optional().or(z.literal('')),
});
type NewVisitorFormValues = z.infer<typeof newVisitorSchema>;

const existingMemberSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es requerido'),
  phoneNumber: z.string().min(10, 'Número de teléfono inválido'),
});
type ExistingMemberFormValues = z.infer<typeof existingMemberSchema>;

interface RegistrationModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function RegistrationModal({ isOpen, onOpenChange }: RegistrationModalProps) {
    const { toast } = useToast();

    const newVisitorForm = useForm<NewVisitorFormValues>({
        resolver: zodResolver(newVisitorSchema),
        defaultValues: { fullName: '', email: '', phoneNumber: '' },
    });

    const existingMemberForm = useForm<ExistingMemberFormValues>({
        resolver: zodResolver(existingMemberSchema),
        defaultValues: { fullName: '', phoneNumber: '' },
    });
    
    const onNewVisitorSubmit = (values: NewVisitorFormValues) => {
        console.log('New Visitor Data:', values);
        try {
            const existingVisitors = JSON.parse(localStorage.getItem('webinarVisitors') || '[]');
            const newVisitor = { ...values, registeredAt: new Date().toISOString() };
            localStorage.setItem('webinarVisitors', JSON.stringify([...existingVisitors, newVisitor]));
        } catch (e) {
            console.error("Failed to save visitor to localStorage", e);
        }

        toast({
            title: '¡Registro Exitoso!',
            description: 'Hemos guardado tu lugar. Revisa tu correo para más detalles.',
        });
        onOpenChange(false);
    };

    const onExistingMemberSubmit = (values: ExistingMemberFormValues) => {
        console.log('Existing Member Data:', values);
        try {
            const existingMembers = JSON.parse(localStorage.getItem('webinarMembers') || '[]');
            const newMember = { fullName: values.fullName, phoneNumber: values.phoneNumber, registeredAt: new Date().toISOString() };
            localStorage.setItem('webinarMembers', JSON.stringify([...existingMembers, newMember]));
        } catch (e) {
            console.error("Failed to save member to localStorage", e);
        }
        
        toast({
            title: '¡Bienvenido de Nuevo!',
            description: 'Tu lugar ha sido reservado.',
        });
        onOpenChange(false);
    };

    React.useEffect(() => {
        if (!isOpen) {
            newVisitorForm.reset();
            existingMemberForm.reset();
        }
    }, [isOpen, newVisitorForm, existingMemberForm]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Reserva tu lugar en el Webinar</DialogTitle>
                    <DialogDescription>
                        Regístrate para obtener acceso instantáneo.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="new" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="new"><UserPlus className="mr-2 h-4 w-4"/> Nuevo Visitante</TabsTrigger>
                        <TabsTrigger value="existing"><LogIn className="mr-2 h-4 w-4"/>Miembro Existente</TabsTrigger>
                    </TabsList>
                    <TabsContent value="new">
                        <Form {...newVisitorForm}>
                            <form onSubmit={newVisitorForm.handleSubmit(onNewVisitorSubmit)} className="space-y-4 pt-4">
                                <FormField
                                    control={newVisitorForm.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre Completo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={newVisitorForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Correo Electrónico</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="john.doe@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={newVisitorForm.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número de Teléfono</FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="(123) 456-7890" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={newVisitorForm.formState.isSubmitting}>
                                    {newVisitorForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Reservando...</> : "Reservar mi lugar"}
                                </Button>
                            </form>
                        </Form>
                    </TabsContent>
                    <TabsContent value="existing">
                       <Form {...existingMemberForm}>
                            <form onSubmit={existingMemberForm.handleSubmit(onExistingMemberSubmit)} className="space-y-4 pt-4">
                                <FormField
                                    control={existingMemberForm.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre Completo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={existingMemberForm.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número de Teléfono</FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="(123) 456-7890" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={existingMemberForm.formState.isSubmitting}>
                                    {existingMemberForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Accediendo...</> : "Iniciar Sesión y Reservar"}
                                </Button>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
