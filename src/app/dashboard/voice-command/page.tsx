'use client';

import * as React from 'react';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, AlertCircle, Siren } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const SpeechRecognition =
  typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

interface UserData {
  role: 'admin' | 'client' | 'user';
  voiceCommandEnabled?: boolean;
}

export default function VoiceCommandPage() {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  const voiceCommandEnabled = userData?.voiceCommandEnabled ?? false;

  React.useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [user]);

  React.useEffect(() => {
    if (userData?.role !== 'admin' || !voiceCommandEnabled) {
      recognitionRef.current?.stop();
      return;
    }

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-MX';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Speech recognition error: ${event.error}. Please ensure your microphone is enabled.`);
      setIsListening(false);
    };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const currentTranscript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setTranscript(currentTranscript);
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
    };
  }, [userData?.role, voiceCommandEnabled]);

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
    }
  };

  const handleVoiceCommandToggle = async (enabled: boolean) => {
    if (!user) return;
    setUserData((prev) => (prev ? { ...prev, voiceCommandEnabled: enabled } : null));
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { voiceCommandEnabled: enabled });
      toast({
        title: 'Success!',
        description: `Voice Command feature has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Voice command toggle error', error);
      setUserData((prev) => (prev ? { ...prev, voiceCommandEnabled: !enabled } : null));
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update voice command settings.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userData?.role !== 'admin') {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You must be an administrator to access this page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Voice Command</h2>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Voice Control Center</CardTitle>
              <CardDescription>
                Enable or disable the voice command feature for the dashboard.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <Label htmlFor="voice-command-switch" className="text-sm font-medium text-muted-foreground">
                {voiceCommandEnabled ? 'Enabled' : 'Disabled'}
              </Label>
              <Switch
                id="voice-command-switch"
                checked={voiceCommandEnabled}
                onCheckedChange={handleVoiceCommandToggle}
                aria-label="Toggle Voice Command"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {voiceCommandEnabled ? (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-center">
                <Button onClick={handleToggleListening} size="lg" className="w-48">
                  {isListening ? (
                    <>
                      <MicOff className="mr-2 h-5 w-5 animate-pulse text-red-400" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Start Listening
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                placeholder="Your transcribed Spanish text will appear here..."
                value={transcript}
                readOnly
                className="min-h-[200px] text-base bg-muted/50"
              />
            </>
          ) : (
            <Alert>
              <Siren className="h-4 w-4" />
              <AlertTitle>Feature Disabled</AlertTitle>
              <AlertDescription>
                The voice-to-text transcription feature is currently turned off. Enable it using the switch above to begin.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
