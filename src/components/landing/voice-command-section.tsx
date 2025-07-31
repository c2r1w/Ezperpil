
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, AlertCircle, ClipboardCopy, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const SpeechRecognition =
  typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

export interface VoiceCommandSectionProps {
  headline: string;
  paragraph: string;
}

export function VoiceCommandSection({ headline, paragraph }: VoiceCommandSectionProps) {
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const { toast } = useToast();

  React.useEffect(() => {
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

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = `An unknown error occurred (${event.error}). Please try again.`;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings to use this feature.';
      } else if (event.error === 'no-speech') {
        errorMessage = 'No speech was detected. Please make sure your microphone is working and try again.';
      }
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const final_transcript = Array.from(event.results)
        .filter(result => result.isFinal)
        .map(result => result[0].transcript)
        .join(' ');
      
      const interim_transcript = Array.from(event.results)
        .filter(result => !result.isFinal)
        .map(result => result[0].transcript)
        .join('');

      setTranscript((final_transcript ? final_transcript + ' ' : '') + interim_transcript);
    };
    
    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      // Clear the transcript to start fresh. This is more reliable than appending.
      setTranscript('');
      recognitionRef.current?.start();
    }
  };

  const handleCopy = () => {
    const textToCopy = transcript.trim();
    if (!textToCopy) {
      toast({
        variant: 'destructive',
        title: 'Nothing to copy',
        description: 'Please generate some text first.',
      });
      return;
    }
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: 'Copied to clipboard!',
      description: 'The transcribed text has been copied.',
    });
  };

  const handleClear = () => {
    setTranscript('');
    if (isListening) {
        recognitionRef.current?.stop();
    }
    toast({
      title: 'Text cleared',
      description: 'The transcription has been removed.',
    });
  };

  return (
    <section id="voice-command-demo" className="w-full py-12 md:py-24 lg:py-32 bg-card scroll-mt-16">
      <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
         <div className="space-y-3">
          <h2 className="text-3xl font-bold font-headline tracking-tighter md:text-4xl/tight">
            {headline}
          </h2>
          <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            {paragraph}
          </p>
        </div>
        <Card className="w-full max-w-2xl mx-auto bg-background">
          <CardContent className="pt-6 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={handleToggleListening} size="lg" className="w-full sm:w-48">
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
              <Button onClick={handleCopy} size="lg" variant="outline" className="w-full sm:w-auto">
                <ClipboardCopy className="mr-2 h-5 w-5" />
                Copy Text
              </Button>
              <Button onClick={handleClear} size="lg" variant="outline" className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-5 w-5" />
                Clear Text
              </Button>
            </div>
            <Textarea
              placeholder="Your transcribed Spanish text will appear here..."
              value={transcript}
              readOnly
              className="min-h-[150px] text-base bg-muted/50"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
