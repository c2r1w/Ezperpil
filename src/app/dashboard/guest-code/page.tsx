
'use client';

import * as React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc, Timestamp, setDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Ticket, Plus, Copy, Trash2, AlertCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';


interface UserProfile {
  uid: string;
  username?: string;
  fullName?: string;
  role: 'admin' | 'client' | 'user';
}

interface GuestCode {
  id: string;
  code: string;
  discountAmount: number;
  sponsorUid: string;
  sponsorUsername: string;
  sponsorFullName?: string;
  createdAt: Timestamp;
}

const guestCodeSchema = z.object({
  discountAmount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, {
    message: 'Discount must be a positive number.',
  }),
});

type GuestCodeFormValues = z.infer<typeof guestCodeSchema>;

export default function GuestCodePage() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();
  
  const [currentUserData, setCurrentUserData] = React.useState<UserProfile | null>(null);
  const [guestCodes, setGuestCodes] = React.useState<GuestCode[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [permissionError, setPermissionError] = React.useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [codeToDelete, setCodeToDelete] = React.useState<GuestCode | null>(null);

  const form = useForm<GuestCodeFormValues>({
    resolver: zodResolver(guestCodeSchema),
    defaultValues: { discountAmount: '10' },
  });

  const fetchUserDataAndCodes = React.useCallback(async (currentUser: typeof user) => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setPermissionError(false);

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const profile = { uid: currentUser.uid, ...userDoc.data() } as UserProfile;
        setCurrentUserData(profile);

        if (profile.username) {
          const codesQuery = query(collection(db, 'guestCodes'), where("sponsorUid", "==", currentUser.uid));
          const querySnapshot = await getDocs(codesQuery);
          const codesList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as GuestCode));
          setGuestCodes(codesList.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
        }
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      if (error.code === 'permission-denied') {
        setPermissionError(true);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load your data.' });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (!authLoading && user) {
      fetchUserDataAndCodes(user);
    } else if (!authLoading) {
        setLoading(false);
    }
  }, [user, authLoading, fetchUserDataAndCodes]);


  const generateRandomCode = (length: number = 6) => {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
  };
  
  const onSubmit = async (values: GuestCodeFormValues) => {
    if (!user || !currentUserData?.username) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot create code without a valid user profile and username.' });
        return;
    }
    setIsCreating(true);
    setPermissionError(false);
    try {
        const code = generateRandomCode();
        const newCodeData = {
            code: code,
            discountAmount: parseFloat(values.discountAmount),
            sponsorUid: user.uid,
            sponsorUsername: currentUserData.username,
            sponsorFullName: currentUserData.fullName || currentUserData.username,
            createdAt: Timestamp.now(),
        };

        await setDoc(doc(db, "guestCodes", code), newCodeData);
        toast({ title: 'Success!', description: 'Your new guest code has been created.' });
        form.reset();
        await fetchUserDataAndCodes(user); // Refresh list
    } catch (error: any) {
        console.error("Error creating guest code:", error);
        if (error.code === 'permission-denied') {
            setPermissionError(true);
        } else {
            toast({ variant: 'destructive', title: 'Creation Failed', description: 'Could not create the guest code.' });
        }
    } finally {
        setIsCreating(false);
    }
  };
  
  const getRegistrationLink = (code: string) => {
    if (typeof window === 'undefined' || !currentUserData?.username) return '';
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    return `${baseUrl}/register?sponsor=${currentUserData.username}&guestCode=${code}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };
  
  const handleDeleteClick = (code: GuestCode) => {
    setCodeToDelete(code);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!codeToDelete || !user) return;
    setPermissionError(false);
    try {
        await deleteDoc(doc(db, 'guestCodes', codeToDelete.id));
        toast({ title: "Code deleted", description: `The code "${codeToDelete.code}" has been removed.` });
        setIsDeleteDialogOpen(false);
        setCodeToDelete(null);
        await fetchUserDataAndCodes(user); // Refresh list
    } catch (error: any) {
        console.error('Error deleting code:', error);
        if (error.code === 'permission-denied') {
            setPermissionError(true);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the guest code.' });
        }
    }
  };


  if (loading || authLoading) {
    return (
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        <Skeleton className="h-10 w-64" />
        <Card>
            <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (permissionError) {
    return (
       <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
           <div className="flex items-center justify-between">
               <div>
                   <h1 className="text-3xl font-bold tracking-tight">Guest Codes</h1>
                   <p className="text-muted-foreground">
                       Create and manage discount codes for new user registrations.
                   </p>
               </div>
           </div>
           <Alert variant="destructive" className="mb-4">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Action Required: Firestore Permissions</AlertTitle>
               <AlertDescription>
                   Your account does not have permission to manage Guest Codes. To fix this, go to your Firebase Console, navigate to Firestore Database &gt; Rules, and ensure that users have permission to create, read, and delete documents in the `guestCodes` collection where their `sponsorUid` matches their user ID.
               </AlertDescription>
           </Alert>
       </div>
    );
  }

  if (!currentUserData?.username) {
     return (
        <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
            <h1 className="text-3xl font-bold tracking-tight">Guest Codes</h1>
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                   You must have a username set in your profile to generate guest codes. Please update your profile first.
                </AlertDescription>
            </Alert>
        </div>
     );
  }


  return (
    <>
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Guest Codes</h1>
        <p className="text-muted-foreground">
          Create and manage discount codes for new user registrations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Guest Code</CardTitle>
          <CardDescription>Generate a new discount code and a shareable registration link.</CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-start gap-4">
                <FormField
                  control={form.control}
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem className="w-full sm:w-auto flex-grow">
                      <FormLabel>Discount Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="text" inputMode="decimal" placeholder="e.g., 50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <Button type="submit" disabled={isCreating} className="w-full sm:w-auto mt-auto">
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Plus className="mr-2 h-4 w-4"/>}
                Generate Code
              </Button>
            </form>
           </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Your Generated Codes</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Shareable Link</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                   {guestCodes.length > 0 ? (
                    guestCodes.map(code => (
                        <TableRow key={code.id}>
                            <TableCell><Badge variant="outline">{code.code}</Badge></TableCell>
                            <TableCell className="font-medium">${code.discountAmount.toFixed(2)}</TableCell>
                            <TableCell>
                                <Input readOnly value={getRegistrationLink(code.code)} className="text-xs" />
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleCopy(getRegistrationLink(code.code))}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(code)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                   ) : (
                     <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">No guest codes created yet.</TableCell>
                     </TableRow>
                   )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>

    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the guest code "{codeToDelete?.code}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Yes, delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
