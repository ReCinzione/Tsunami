import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

interface UseVoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, confidence: number, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseVoiceRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useVoiceRecognition = ({
  language = 'it-IT',
  continuous = false,
  interimResults = true,
  onResult,
  onError
}: UseVoiceRecognitionOptions = {}): UseVoiceRecognitionReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Inizializza il riconoscimento vocale
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      setupRecognition();
    } else {
      setIsSupported(false);
      const errorMsg = 'Il tuo browser non supporta il riconoscimento vocale. Prova con Chrome o Edge.';
      setError(errorMsg);
      onError?.(errorMsg);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const setupRecognition = useCallback(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      
      if (maxConfidence > 0) {
        setConfidence(maxConfidence);
      }

      // Chiama il callback se fornito
      if (onResult && currentTranscript) {
        onResult(currentTranscript, maxConfidence, !!finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      
      let errorMessage = 'Errore nel riconoscimento vocale';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Nessun audio rilevato. Riprova parlando più chiaramente.';
          break;
        case 'audio-capture':
          errorMessage = 'Impossibile accedere al microfono. Verifica le autorizzazioni.';
          break;
        case 'not-allowed':
          errorMessage = 'Accesso al microfono negato. Abilita le autorizzazioni per questo sito.';
          break;
        case 'network':
          errorMessage = 'Errore di rete. Verifica la connessione internet.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Servizio di riconoscimento vocale non disponibile.';
          break;
        case 'bad-grammar':
          errorMessage = 'Errore nella grammatica del riconoscimento.';
          break;
        case 'language-not-supported':
          errorMessage = 'Lingua non supportata.';
          break;
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
      
      toast({
        title: "Errore riconoscimento vocale",
        description: errorMessage,
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }, [continuous, interimResults, language, onResult, onError, toast]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening || !isSupported) return;
    
    try {
      setTranscript('');
      setConfidence(0);
      setError(null);
      recognitionRef.current.start();
      
      toast({
        title: "🎤 Ascolto attivo",
        description: "Parla ora per creare un task o una nota...",
      });
    } catch (error) {
      const errorMsg = 'Impossibile avviare il riconoscimento vocale';
      setError(errorMsg);
      onError?.(errorMsg);
      
      toast({
        title: "Errore",
        description: errorMsg,
        variant: "destructive"
      });
    }
  }, [isListening, isSupported, onError, toast]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
};

export default useVoiceRecognition;