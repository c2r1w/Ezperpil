
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, type User } from 'firebase/auth';
import { doc, setDoc, updateDoc, Timestamp, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { VoiceInput } from '@/components/ui/voice-input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, CreditCard, ArrowLeft } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getInitials } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { fetchBusinessPackages } from '@/lib/packages';

const STRIPE_PUBLIC_KEY = 'pk_test_51RePbIDH5IrdUh93LpBCPK029XCSv3T1FclVkaUrphNAV5lVWMUkl5My0fa95aw86c6DrGEhUEEdW9K1Igq7EJwQ00UbMO2NMs';
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);


// Package data and interface
interface PackageData {
  id: string;
  name: string;
  activationFee: number;
  price: number;
  description: string;
  features: string[];
  imageUrl: string;
  paymentLink: string;
  active: boolean;
  targetRole: 'impulsor_de_impacto' | 'client' | 'all';
}

const registerSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es requerido'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  phoneNumber: z.string().min(10, 'Número de teléfono es requerido'),
  sponsorUsername: z.string().min(1, 'El nombre de usuario del patrocinador es requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  selectedPackageId: z.string({
    required_error: "Debes seleccionar un paquete.",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterComponentProps {
  discountAmount: number;
  setDiscountAmount: React.Dispatch<React.SetStateAction<number>>;
  guestCodeApplied: string | null;
  setGuestCodeApplied: React.Dispatch<React.SetStateAction<string | null>>;
}

interface PaymentDetails {
  pkg: PackageData;
  finalFee: number;
}


function RegisterComponent({ discountAmount, setDiscountAmount, guestCodeApplied, setGuestCodeApplied }: RegisterComponentProps): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();

  const [isPackageDialogOpen, setIsPackageDialogOpen] = React.useState(false);
  const [dialogStep, setDialogStep] = React.useState<'pay' | 'success'>('pay');
  const [paymentDetails, setPaymentDetails] = React.useState<PaymentDetails | null>(null);
  
  const [packages, setPackages] = React.useState<PackageData[]>([]);
  const [packagesLoading, setPackagesLoading] = React.useState(true);
  
  const [newlyCreatedUser, setNewlyCreatedUser] = React.useState<User | null>(null);
  const [createdUserEmail, setCreatedUserEmail] = React.useState<string | null>(null);
  
  const [isPaying, setIsPaying] = React.useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = React.useState(false);
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);
  const [xpaid, setXpaid] = React.useState(false);
  
  // State for sponsor confirmation flow
  const [isVerifyingSponsor, setIsVerifyingSponsor] = React.useState(false);
  const [sponsorProfile, setSponsorProfile] = React.useState<{ fullName: string, avatarUrl: string } | null>(null);
  const [needsSponsorConfirmation, setNeedsSponsorConfirmation] = React.useState(false);
  const [sponsorVerified, setSponsorVerified] = React.useState(false);


  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      phoneNumber: '',
      sponsorUsername: '',
      password: '',
      selectedPackageId: '',
    },
  });
  
  React.useEffect(() => {
    const sponsorUsernameParam = searchParams?.get('sponsor');
    const guestCodeParam = searchParams?.get('guestCode');
    const packageIdParam = searchParams?.get('package');

    if (packageIdParam) {
        form.setValue('selectedPackageId', packageIdParam);
    }

    const verifySponsorAndCode = async () => {
        if (sponsorUsernameParam && guestCodeParam && !sponsorVerified) {
            setIsVerifyingSponsor(true);
            form.setValue('sponsorUsername', sponsorUsernameParam);
            try {
                const codeDocRef = doc(db, 'guestCodes', guestCodeParam);
                const docSnap = await getDoc(codeDocRef);

                if (docSnap.exists() && docSnap.data().sponsorUsername === sponsorUsernameParam) {
                    const codeData = docSnap.data();
                    const sponsorName = codeData.sponsorFullName || sponsorUsernameParam;
                    setSponsorProfile({
                        fullName: sponsorName,
                        avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(sponsorName)}`
                    });
                    setNeedsSponsorConfirmation(true);
                } else {
                    toast({ variant: 'destructive', title: 'Invalid Sponsor/Code', description: `The guest code is not valid for sponsor "${sponsorUsernameParam}".` });
                    form.setValue('sponsorUsername', ''); // Clear invalid sponsor
                    setSponsorVerified(true); // Stop retrying
                }
            } catch (error) {
                console.error("Error verifying sponsor/code:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not verify the sponsor.' });
                setSponsorVerified(true);
            } finally {
                setIsVerifyingSponsor(false);
            }
        } else if (sponsorUsernameParam && !sponsorVerified) {
            form.setValue('sponsorUsername', sponsorUsernameParam);
            setSponsorVerified(true);
        } else if (!sponsorUsernameParam) {
            setSponsorVerified(true);
        }
    };

    verifySponsorAndCode();
  }, [searchParams, form, toast, sponsorVerified]);


  React.useEffect(() => {
    const loadPackages = async () => {
      setPackagesLoading(true);
      try {
        const loadedPackages = await fetchBusinessPackages();
        if (loadedPackages && loadedPackages.length > 0) {
          // Sanitize data to ensure numeric types for pricing
          const sanitizedPackages = loadedPackages.map((pkg: any) => ({
            id: pkg._id || pkg.id,
            name: pkg.name,
            activationFee: parseFloat(String(pkg.activationFee)) || 0,
            price: parseFloat(String(pkg.price)) || 0,
            description: pkg.description,
            features: pkg.features || [],
            imageUrl: pkg.imageUrl,
            paymentLink: pkg.paymentLink,
            active: pkg.active,
            targetRole: pkg.targetRole,
          }));
          setPackages(sanitizedPackages.filter((p: any) => p.active));
        } else {
          // No packages available from database
          setPackages([]);
          console.warn("No packages found in database");
        }
      } catch (error) {
        console.error("Could not fetch packages from MongoDB", error);
        setPackages([]);
      } finally {
        setPackagesLoading(false);
      }
    };
    
    loadPackages();
  }, []);

  const onSubmit = async (values: RegisterFormValues) => {
    if (!xpaid) {
      // Payment required first
      const selectedPkg = packages.find(p => p.id === values.selectedPackageId);
      if (!selectedPkg) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un paquete válido.' });
        return;
      }
      
      const feeToPay = Math.max(0, selectedPkg.activationFee - discountAmount);
      setPaymentDetails({ pkg: selectedPkg, finalFee: feeToPay });
      setDialogStep('pay');
      setIsPackageDialogOpen(true);
      return;
    }

    // Registration after successful payment
    setIsCreatingAccount(true);
    
    const selectedPkg = packages.find(p => p.id === values.selectedPackageId);
    if (!selectedPkg) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un paquete válido.' });
      setIsCreatingAccount(false);
      return;
    }
    
    const role = (selectedPkg.targetRole || '').trim().toLowerCase() === 'client' ? 'client' : 'impulsor_de_impacto';
  
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;
  
      await setDoc(doc(db, 'users', user.uid), {
        fullName: values.fullName,
        username: values.username,
        email: values.email,
        phoneNumber: values.phoneNumber,
        sponsorUsername: values.sponsorUsername,
        role: role,
        createdAt: Timestamp.now(),
        active: true, // Active since payment is complete
        selectedPackageId: selectedPkg.id,
        appliedGuestCode: guestCodeApplied,
        discountApplied: discountAmount,
        balance: 0,
        xpaid: true, // Mark as paid
      });
  
  
      // Send welcome email
      try {
        await fetch('/api/send-welcome-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: values.email,
            firstName: values.fullName,
            tempPassword: values.password,
            loginUrl: 'https://ezperfilwebinars.com/login'
          }),
        })
        
        ;

              // await sendEmailVerification(user);

      } catch (emailError) {
           await sendEmailVerification(user);

      }

      setNewlyCreatedUser(user);
      setCreatedUserEmail(values.email);
      setDialogStep('success');
      setIsPackageDialogOpen(true);
  
    } catch (error: any) {
      console.error('Registration Error:', error);
      
      let title = 'Registration Failed';
      let description = 'An unexpected error occurred. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            description = 'This email address is already in use. Please use another email or sign in.';
            break;
          case 'auth/weak-password':
            description = 'The password is too weak. Please choose a stronger password.';
            break;
          case 'auth/invalid-email':
            description = 'The email address is not valid. Please check and try again.';
            break;
          case 'permission-denied':
            title = 'Database Error';
            description = 'Your profile could not be saved due to a permission issue. Please contact support and check your Firestore security rules.';
            break;
          default:
             if (String(error.message).includes('Unsupported field value')) {
                title = 'Invalid Data';
                description = `There was a problem with the data provided for your profile: ${error.message}. Please check the form and try again.`;
            }
            break;
        }
      }
      
      toast({
        variant: 'destructive',
        title: title,
        description: description,
        duration: 9000,
      });
    } finally {
        setIsCreatingAccount(false);
    }
  };
  
  const handlePayment = async () => {
    if (!paymentDetails || !stripe || !elements) return;
    setIsPaying(true);

    try {
      // Create PaymentIntent on backend with customer email
      const res = await fetch('/api/stripe-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: paymentDetails.finalFee,
          email: form.getValues('email')
        }),
      });
      const data = await res.json();
      if (!data.clientSecret) throw new Error('No client secret returned');
      
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('CardElement not found');
      
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: form.getValues('email'),
            name: form.getValues('fullName'),
          },
        },
      });
      
      if (stripeError) throw stripeError;
      
      // Payment successful
      setXpaid(true);
      setPaymentSuccess(true);
      setIsPackageDialogOpen(false);
      
      toast({
        title: 'Payment Successful!',
        description: 'Now complete your registration below.',
      });

    } catch (error: any) {
      console.error("Payment Error:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Payment Failed', 
        description: error.message || 'Could not process payment. Please try again.' 
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleCloseDialog = () => {
    setIsPackageDialogOpen(false);
    if (dialogStep === 'success') {
        router.push('/login');
    } else {
        // If closing payment dialog without success, reset payment state
        setXpaid(false);
        setPaymentSuccess(false);
    }
    setTimeout(() => {
        setDialogStep('pay');
        setPaymentDetails(null);
    }, 300);
  };

  const handleConfirmSponsor = async () => {
    setSponsorVerified(true);
    const guestCode = searchParams?.get('guestCode');

    if (guestCode) {
        try {
            const codeDocRef = doc(db, 'guestCodes', guestCode);
            const docSnap = await getDoc(codeDocRef);
            if (docSnap.exists()) {
                const codeData = docSnap.data();
                setDiscountAmount(codeData.discountAmount);
                setGuestCodeApplied(guestCode);
                toast({
                    title: 'Discount Applied!',
                    description: `A $${codeData.discountAmount.toFixed(2)} discount from your sponsor has been applied.`,
                });
            }
        } catch (e) {
            console.error("Error applying discount after confirmation:", e);
        }
    }
    setNeedsSponsorConfirmation(false);
  };

  const handleRejectSponsor = () => {
    setSponsorVerified(true);
    setNeedsSponsorConfirmation(false);
    setSponsorProfile(null);
    form.setValue('sponsorUsername', '');
    setDiscountAmount(0);
    setGuestCodeApplied(null);
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
    toast({ title: "Sponsor Cleared", description: "You can now enter a sponsor's username manually if you have one." });
  };
  
  if (isVerifyingSponsor) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Verifying sponsor...</p>
        </div>
    );
  }

  if (needsSponsorConfirmation && sponsorProfile) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background p-4">
            <Card className="mx-auto max-w-md w-full text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">Confirm Your Sponsor</CardTitle>
                    <CardDescription>
                        Please confirm that the person below referred you.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24 border-4 border-primary/50">
                        <AvatarImage src={sponsorProfile.avatarUrl} />
                        <AvatarFallback>{getInitials(sponsorProfile.fullName)}</AvatarFallback>
                    </Avatar>
                    <p className="text-xl font-semibold">{sponsorProfile.fullName}</p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" onClick={handleConfirmSponsor}>
                        <Check className="mr-2 h-4 w-4" />
                        Yes, this is my sponsor
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleRejectSponsor}>
                        No, that's not them
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background p-4">
        <Card className="mx-auto max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Regístrate</CardTitle>
            <CardDescription>
              Ingresa tu información para crear una cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <VoiceInput placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de Usuario</FormLabel>
                      <FormControl>
                        <VoiceInput placeholder="johndoe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="m@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="(123) 456-7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sponsorUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de Usuario del Patrocinador</FormLabel>
                      <FormControl>
                        <VoiceInput placeholder="sponsor" {...field} readOnly={!!searchParams?.get('sponsor')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isPackageDialogOpen && !xpaid && <FormField
                  control={form.control}
                  name="selectedPackageId"
                  render={({ field }) => (
                    <FormItem className="space-y-3 pt-2">
                      <FormLabel>Selecciona tu Paquete de Activación</FormLabel>
                      <FormMessage />
                      {packagesLoading ? (
                        <div className="flex justify-center items-center h-24">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : (
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 gap-4"
                        >
                          {packages.map((pkg) => {
                            const discountedFee = Math.max(0, pkg.activationFee - discountAmount);
                            const isDiscounted = discountAmount > 0 && discountedFee < pkg.activationFee;

                            return (
                                <FormItem key={pkg.id}>
                                <FormControl>
                                    <Label className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5">
                                    <RadioGroupItem value={pkg.id} className="h-5 w-5" />
                                    <div className="flex-1 text-left"
                                    
                                    // onClick={() => {
                                    //   // Reset payment state when selecting a new package
                                    //   setXpaid(false);
                                    //   setPaymentSuccess(false);
                                    //   field.onChange(pkg.id);
                                    //   setPaymentDetails({ pkg, finalFee: discountedFee });
                                    //   setDialogStep('pay');
                                    //   setIsPackageDialogOpen(true);
                                    // }}
                                    >
                                        <p className="font-semibold">{pkg.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                        Cuota de Activación:
                                        {isDiscounted ? (
                                            <>
                                                <span className="line-through text-destructive/80 mx-1">${pkg.activationFee.toFixed(2)}</span>
                                                <span className="font-bold text-primary">${discountedFee.toFixed(2)}</span>
                                            </>
                                        ) : (
                                            <span className="font-bold text-primary ml-1">${pkg.activationFee.toFixed(2)}</span>
                                        )}
                                        {pkg.price > 0 && ` + $${pkg.price.toFixed(2)}/mes`}
                                        </p>
                                    </div>
                                    </Label>
                                </FormControl>
                                </FormItem>
                            );
                          })}
                        </RadioGroup>
                      )}
                    </FormItem>
                  )}
                />}

                {!xpaid && (
                  <Button 
                    type="button"
                    onClick={() => {
                      const selectedPkg = packages.find(p => p.id === form.getValues('selectedPackageId'));
                      if (!selectedPkg) {
                        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un paquete válido.' });
                        return;
                      }
                      const feeToPay = Math.max(0, selectedPkg.activationFee - discountAmount);
                      setPaymentDetails({ pkg: selectedPkg, finalFee: feeToPay });
                      setDialogStep('pay');
                      setIsPackageDialogOpen(true);
                    }}
                    className="w-full" 
                    disabled={!form.getValues('selectedPackageId') || packagesLoading}
                  >
                    Proceder al Pago
                  </Button>
                )}

                {xpaid && paymentSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      ¡Pago completado exitosamente! Ahora completa tu registro.
                    </p>
                  </div>
                )}

                {xpaid && (
                  <Button type="submit" className="w-full" disabled={isCreatingAccount || packagesLoading}>
                    {isCreatingAccount ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creando Cuenta...</> : 'Crear una cuenta'}
                  </Button>
                )}
              </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="underline">
                Iniciar Sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPackageDialogOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            {dialogStep === 'pay' && paymentDetails && (
                <>
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Activa tu Cuenta</DialogTitle>
                        <DialogDescription>
                            Completa el pago para activar tu {paymentDetails.pkg.name}.
                        </DialogDescription>
                    </DialogHeader>

                    
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{paymentDetails.pkg.name}</span>
                                 <span className="text-primary">
                                    {paymentDetails.finalFee < paymentDetails.pkg.activationFee ? (
                                        <>
                                            <span className="text-base font-normal text-muted-foreground line-through mr-2">${paymentDetails.pkg.activationFee.toFixed(2)}</span>
                                            ${paymentDetails.finalFee.toFixed(2)}
                                        </>
                                    ) : (
                                        `$${paymentDetails.pkg.activationFee.toFixed(2)}`
                                    )}
                                </span>
                            </CardTitle>
                            <CardDescription>Cuota de activación única</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="mb-2">
                                <Label>Detalles de la tarjeta</Label>
                                <div className="border rounded p-3 mt-2">
                                    <CardElement options={{ 
                                        hidePostalCode: true,
                                        style: {
                                            base: {
                                                color: '#ffffff',
                                                fontSize: '16px',
                                                '::placeholder': {
                                                    color: '#9ca3af',
                                                },
                                            },
                                        },
                                    }} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handlePayment} disabled={isPaying}>
                                {isPaying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando Pago...</> : `Pagar $${paymentDetails.finalFee.toFixed(2)} Activación`}
                            </Button>
                        </CardFooter>
                    </Card>
                </>
            )}

            {dialogStep === 'success' && (
                <>
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-center">¡Cuenta Activada Exitosamente!</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center text-center gap-4 py-8">
                         <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-full">
                            <Check className="h-16 w-16 text-green-500"/>
                        </div>
                        <p className="text-lg font-medium">¡Felicitaciones!</p>
                        <p className="text-muted-foreground max-w-md">
                           Se ha enviado un correo de verificación. Por favor, revisa tu bandeja de entrada.
                           Por tu seguridad, **nunca** te enviaremos tu contraseña por correo.
                        </p>
                        <Card className="w-full max-w-sm bg-accent/50 border-accent border-dashed">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base text-accent-foreground">Tus Credenciales de Inicio de Sesión</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-left text-sm pt-2">
                                <p><strong>Email:</strong> <span className="font-mono bg-muted px-2 py-1 rounded">{createdUserEmail}</span></p>
                                <p><strong>Contraseña:</strong> <span className="font-medium">La que acabas de crear.</span></p>
                            </CardContent>
                        </Card>
                        <Button className="w-full max-w-sm mt-4" onClick={() => router.push('/login')}>
                            Ir a Iniciar Sesión
                        </Button>
                    </div>
                </>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}


export default function RegisterPage() {
    const [discountAmount, setDiscountAmount] = React.useState(0);
    const [guestCodeApplied, setGuestCodeApplied] = React.useState<string | null>(null);

    return (
        <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading...</p>
            </div>
        }>
            <Elements stripe={stripePromise}>
                <RegisterComponent 
                  discountAmount={discountAmount}
                  setDiscountAmount={setDiscountAmount}
                  guestCodeApplied={guestCodeApplied}
                  setGuestCodeApplied={setGuestCodeApplied}
                />
            </Elements>
        </React.Suspense>
    )
}
