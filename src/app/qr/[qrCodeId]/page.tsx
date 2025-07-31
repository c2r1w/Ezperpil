'use client';

import { useEffect } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter, useParams, notFound } from 'next/navigation';

export default function QrRedirectPage() {
    const router = useRouter();
    const params = useParams();
    const qrCodeId = params.qrCodeId as string;

    useEffect(() => {
        if (!qrCodeId) {
            return;
        }

        const handleRedirect = async () => {
            const qrDocRef = doc(db, 'qrCodes', qrCodeId);
            
            try {
                const qrDoc = await getDoc(qrDocRef);

                if (!qrDoc.exists() || !qrDoc.data().active) {
                    console.warn(`QR Code with ID ${qrCodeId} not found or inactive.`);
                    notFound();
                    return;
                }

                const qrData = qrDoc.data();
                
                const urlEntries: { url: string; active: boolean }[] = (qrData.destinationUrls || []).map((entry: string | {url: string, active: boolean}) =>
                    typeof entry === 'string' ? { url: entry, active: true } : entry
                );

                const activeUrlEntries = urlEntries.filter(entry => entry.active);

                if (activeUrlEntries.length === 0) {
                    console.warn(`QR Code ${qrCodeId} has no ACTIVE destination URLs.`);
                    notFound();
                    return;
                }
                
                const lastUsedIndex = qrData.lastRotationIndex ?? -1;
                let nextIndex = -1;

                for (let i = 0; i < urlEntries.length; i++) {
                    const potentialIndex = (lastUsedIndex + 1 + i) % urlEntries.length;
                    if (urlEntries[potentialIndex].active) {
                        nextIndex = potentialIndex;
                        break;
                    }
                }
                
                if (nextIndex === -1) {
                    console.warn(`Could not find an active URL for QR Code ${qrCodeId}.`);
                    notFound();
                    return;
                }
                
                const destination = urlEntries[nextIndex].url;

                updateDoc(qrDocRef, { 
                    clicks: increment(1),
                    lastRotationIndex: nextIndex 
                }).catch(updateError => {
                    console.error(`Failed to update click count for QR Code ${qrCodeId}:`, updateError);
                });

                router.replace(destination);

            } catch (error) {
                console.error(`An error occurred while processing QR Code ${qrCodeId}:`, error);
                notFound();
            }
        };

        handleRedirect();
    }, [qrCodeId, router]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
            <div className="flex flex-col items-center gap-4">
                 <svg
                    className="h-8 w-8 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    ></circle>
                    <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
                <p>Redirecting...</p>
            </div>
        </div>
    );
}
