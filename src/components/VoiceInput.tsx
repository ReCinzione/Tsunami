import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { supabase } from '@/integrations/supabase/client';

interface VoiceInputProps {
  onTaskCreated?: () => void;
  onNoteCreated?: () => void;
  className?: string;
  buttonOnly?: boolean;
  tooltip?: string;
}



const VoiceInput: React.FC<VoiceInputProps> = ({ onTaskCreated, onNoteCreated, className, buttonOnly = false, tooltip }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const {
    isSupported,
    isListening,
    transcript,
    confidence,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition({
    language: 'it-IT',
    continuous: false,
    interimResults: true,
    onResult: (transcript: string, confidence: number, isFinal: boolean) => {
      if (isFinal && transcript.trim()) {
        processVoiceCommand(transcript.trim(), confidence);
      }
    }
  });





  const handleStartListening = () => {
    resetTranscript();
    startListening();
  };

  const processVoiceCommand = async (text: string, confidence: number) => {
    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utente non autenticato');
      }

      // Analizza il comando per determinare se è un task o una nota
      const analysis = analyzeVoiceCommand(text);
      
      if (analysis.type === 'task') {
        await createTaskFromVoice(text, analysis, user.id, confidence);
        onTaskCreated?.();
      } else {
        await createNoteFromVoice(text, user.id, confidence);
        onNoteCreated?.();
      }
      
    } catch (error: any) {
      console.error('Error processing voice command:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile processare il comando vocale",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeVoiceCommand = (text: string) => {
    const taskKeywords = [
      'devo', 'devo fare', 'task', 'attività', 'compito', 'fare',
      'ricordami di', 'ricorda di', 'programma', 'pianifica',
      'entro', 'scadenza', 'urgente', 'importante', 'priorità'
    ];
    
    const noteKeywords = [
      'nota', 'appunto', 'idea', 'pensiero', 'ricorda che',
      'annotazione', 'memo', 'osservazione'
    ];

    const lowerText = text.toLowerCase();
    
    const taskScore = taskKeywords.reduce((score, keyword) => {
      return score + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);
    
    const noteScore = noteKeywords.reduce((score, keyword) => {
      return score + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);

    // Estrai informazioni aggiuntive per i task
    const urgencyKeywords = ['urgente', 'subito', 'presto', 'importante'];
    const timeKeywords = ['oggi', 'domani', 'settimana', 'mese', 'entro'];
    
    const isUrgent = urgencyKeywords.some(keyword => lowerText.includes(keyword));
    const hasTimeReference = timeKeywords.some(keyword => lowerText.includes(keyword));
    
    return {
      type: taskScore > noteScore ? 'task' : 'note',
      isUrgent,
      hasTimeReference,
      confidence: Math.max(taskScore, noteScore) / Math.max(taskKeywords.length, noteKeywords.length)
    };
  };

  const createTaskFromVoice = async (text: string, analysis: any, userId: string, confidence: number) => {
    // Pulisci il testo per il titolo del task
    let title = text
      .replace(/^(devo fare|devo|ricordami di|ricorda di|task|attività|compito)\s*/i, '')
      .replace(/\s+(oggi|domani|entro|urgente|importante).*$/i, '')
      .trim();
    
    if (!title) {
      title = text.substring(0, 50) + (text.length > 50 ? '...' : '');
    }

    // Determina energia richiesta basata sull'analisi
    let energyRequired = 'media';
    if (analysis.isUrgent) energyRequired = 'alta';
    if (text.length < 20) energyRequired = 'bassa';
    
    // Calcola XP reward
    const baseXP = 10;
    const urgencyBonus = analysis.isUrgent ? 5 : 0;
    const confidenceBonus = Math.floor(confidence * 5);
    const xpReward = baseXP + urgencyBonus + confidenceBonus;

    // Determina scadenza se presente
    let dueDate = null;
    if (analysis.hasTimeReference) {
      const today = new Date();
      if (text.toLowerCase().includes('oggi')) {
        dueDate = today.toISOString().split('T')[0];
      } else if (text.toLowerCase().includes('domani')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dueDate = tomorrow.toISOString().split('T')[0];
      }
    }

    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: title,
        description: `Creato tramite comando vocale: "${text}"`,
        energy_required: energyRequired,
        xp_reward: xpReward,
        due_date: dueDate,
        priority: analysis.isUrgent ? 'high' : 'medium',
        status: 'pending',
        voice_created: true,
        voice_confidence: confidence
      });

    if (error) throw error;

    toast({
      title: "✅ Task creato con successo!",
      description: `"${title}" - ${xpReward} XP reward`,
    });
  };

  const createNoteFromVoice = async (text: string, userId: string, confidence: number) => {
    const { error } = await supabase
      .from('mental_inbox')
      .insert({
        user_id: userId,
        content: text,
        content_type: 'voice',
        voice_confidence: confidence,
        is_processed: false
      });

    if (error) throw error;

    toast({
      title: "📝 Nota vocale salvata!",
      description: "Aggiunta alla Mental Inbox",
    });
  };

  if (!isSupported) {
    if (buttonOnly) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                disabled
                size="lg"
                className={`rounded-full w-14 h-14 shadow-lg ${className}`}
              >
                <VolumeX className="w-6 h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Comando vocale non supportato</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <VolumeX className="h-5 w-5" />
            Comando Vocale Non Supportato
          </CardTitle>
          <CardDescription>
            Il tuo browser non supporta il riconoscimento vocale. 
            Prova con Chrome, Edge o Safari.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (buttonOnly) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={isListening ? stopListening : handleStartListening}
              disabled={isProcessing}
              size="lg"
              variant={isListening ? "destructive" : "default"}
              className={`rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 ${className}`}
            >
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isListening ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip || "Comando vocale"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Comando Vocale
        </CardTitle>
        <CardDescription>
          Crea task e note usando la tua voce. Parla chiaramente in italiano.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <Button
            onClick={isListening ? stopListening : handleStartListening}
            disabled={isProcessing}
            size="lg"
            variant={isListening ? "destructive" : "default"}
            className="w-full max-w-xs"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Elaborando...
              </>
            ) : isListening ? (
              <>
                <MicOff className="mr-2 h-4 w-4" />
                Ferma Ascolto
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Inizia Comando Vocale
              </>
            )}
          </Button>
        </div>

        {isListening && (
          <div className="text-center">
            <div className="animate-pulse">
              <div className="flex justify-center space-x-1 mb-2">
                <div className="w-2 h-8 bg-primary rounded animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-6 bg-primary rounded animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-10 bg-primary rounded animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-2 h-4 bg-primary rounded animate-bounce" style={{ animationDelay: '450ms' }}></div>
              </div>
              <p className="text-sm text-muted-foreground">🎤 Sto ascoltando...</p>
            </div>
          </div>
        )}

        {transcript && (
          <div className="space-y-2">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Testo riconosciuto:</p>
              <p className="text-sm">"{transcript}"</p>
            </div>
            {confidence > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant={confidence > 0.8 ? "default" : confidence > 0.6 ? "secondary" : "outline"}>
                  Confidenza: {Math.round(confidence * 100)}%
                </Badge>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>💡 Esempi di comandi:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>"Devo comprare il latte oggi"</li>
            <li>"Ricordami di chiamare il dottore"</li>
            <li>"Task urgente: finire il report"</li>
            <li>"Nota: idea per il progetto nuovo"</li>
            <li>"Appunto: riunione alle 15"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceInput;