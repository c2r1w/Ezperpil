'use client';

import * as React from 'react';
import { Mic, MicOff } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const VoiceTextarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, onChange, ...props }, ref) => {
    const { toast } = useToast();
    const [isListening, setIsListening] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(false);
    const recognitionRef = React.useRef<any>(null);
    
    const SpeechRecognition = React.useMemo(() => 
      typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null,
    []);

    React.useEffect(() => {
      setIsMounted(true);
    }, []);

    React.useEffect(() => {
      if (!isMounted || !SpeechRecognition) {
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-MX';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        toast({
            variant: 'destructive',
            title: 'Voice Recognition Error',
            description: `Error: ${event.error}. Please ensure microphone permission is granted.`,
        });
        setIsListening(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        if (onChange) {
            const syntheticEvent = {
                target: { value: transcript }
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(syntheticEvent);
        }
      };

      recognitionRef.current = recognition;

      return () => {
        recognitionRef.current?.stop();
      };
    }, [isMounted, SpeechRecognition, onChange, toast]);

    const handleToggleListening = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isMounted || !SpeechRecognition) {
            toast({
                variant: 'destructive',
                title: 'Not Supported',
                description: 'Speech recognition is not supported in your browser.',
            });
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    };

    return (
      <div className="relative w-full">
        <Textarea
          ref={ref}
          className={cn('pr-10', className)}
          onChange={onChange}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-1 top-2 h-7 w-7 text-muted-foreground",
            isListening && "text-primary animate-pulse"
          )}
          onClick={handleToggleListening}
          disabled={!isMounted || !SpeechRecognition}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      </div>
    );
  }
);
VoiceTextarea.displayName = 'VoiceTextarea';

export { VoiceTextarea };
