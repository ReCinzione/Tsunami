import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { 
  Eye, 
  EyeOff, 
  Focus, 
  Timer, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  RotateCcw,
  Settings,
  Zap,
  Heart,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUIStore } from '@/store/uiStore';

const focusModeVariants = cva(
  "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm transition-all duration-300",
  {
    variants: {
      intensity: {
        minimal: "bg-background/80",
        medium: "bg-background/90",
        maximum: "bg-background/98",
      },
    },
    defaultVariants: {
      intensity: "medium",
    },
  }
);

interface FocusModeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof focusModeVariants> {
  isActive: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  showTimer?: boolean;
  timerDuration?: number; // in minutes
  onTimerComplete?: () => void;
  allowedElements?: string[]; // CSS selectors for elements that should remain visible
}

function FocusMode({
  className,
  intensity,
  isActive,
  onToggle,
  children,
  showTimer = false,
  timerDuration = 25,
  onTimerComplete,
  allowedElements = [],
  ...props
}: FocusModeProps) {
  const [timeLeft, setTimeLeft] = React.useState(timerDuration * 60);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Gestione timer
  React.useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            onTimerComplete?.();
            if (soundEnabled) {
              // Suono gentile di completamento
              playCompletionSound();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTimerRunning, timeLeft, onTimerComplete, soundEnabled]);

  // Nascondi elementi non essenziali quando la modalità focus è attiva
  React.useEffect(() => {
    if (isActive) {
      const elementsToHide = [
        '[data-focus-hide]',
        '.sidebar:not([data-focus-keep])',
        '.notification:not([data-focus-keep])',
        '.advertisement',
        '.social-widget',
        '.chat-widget:not([data-focus-keep])',
        ...allowedElements.map(el => `:not(${el})`)
      ];

      const style = document.createElement('style');
      style.id = 'focus-mode-styles';
      style.textContent = `
        ${elementsToHide.join(', ')} {
          opacity: 0.1 !important;
          pointer-events: none !important;
          transition: opacity 0.3s ease !important;
        }
        
        [data-focus-highlight] {
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5) !important;
          border-radius: 8px !important;
        }
        
        body {
          overflow: hidden !important;
        }
      `;
      
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.getElementById('focus-mode-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
        document.body.style.overflow = '';
      };
    }
  }, [isActive, allowedElements]);

  const playCompletionSound = () => {
    // Suono gentile usando Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.4); // G5
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setTimeLeft(timerDuration * 60);
    setIsTimerRunning(false);
  };

  const progress = ((timerDuration * 60 - timeLeft) / (timerDuration * 60)) * 100;

  if (!isActive) {
    return (
      <>
        {children}
        {/* Pulsante per attivare la modalità focus */}
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-40 shadow-lg hover:shadow-xl transition-shadow bg-white/90 backdrop-blur-sm"
          data-focus-keep
        >
          <Focus className="w-4 h-4 mr-2" />
          Modalità Focus
        </Button>
      </>
    );
  }

  return (
    <div
      className="adhd-focus-overlay"
      {...props}
    >
      {/* Header della modalità focus */}
      <div className="fixed top-0 left-0 right-0 z-60 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                <Zap className="w-3 h-3 mr-1" />
                Modalità Focus Attiva
              </Badge>
            </div>
            
            {showTimer && (
              <div className="adhd-timer" style={{ '--progress': `${progress}%` } as React.CSSProperties}>
                <div className="adhd-timer-text">
                  {formatTime(timeLeft)}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showTimer && (
              <>
                <Button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {isTimerRunning ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                
                <Button
                  onClick={resetTimer}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </Button>
              </>
            )}
            
            <Button
              onClick={onToggle}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress bar del timer */}
        {showTimer && isTimerRunning && (
          <div className="px-4 pb-2">
            <Progress 
              value={progress} 
              className="h-1 bg-slate-200 dark:bg-slate-700"
            />
          </div>
        )}
      </div>

      {/* Contenuto principale */}
      <div className="pt-20 pb-8 px-4 h-full overflow-auto">
        <div className="adhd-focus-content">
          {children}
        </div>
      </div>

      {/* Messaggi motivazionali */}
      <FocusMotivation timeLeft={timeLeft} isTimerRunning={isTimerRunning} />
    </div>
  );
}

// Componente per messaggi motivazionali
interface FocusMotivationProps {
  timeLeft: number;
  isTimerRunning: boolean;
}

function FocusMotivation({ timeLeft, isTimerRunning }: FocusMotivationProps) {
  const [currentMessage, setCurrentMessage] = React.useState(0);
  
  const motivationalMessages = [
    { text: "Stai andando alla grande! 🌟", icon: <Sparkles className="w-4 h-4" /> },
    { text: "Ogni minuto conta 💙", icon: <Heart className="w-4 h-4" /> },
    { text: "Focus = Superpotere ⚡", icon: <Zap className="w-4 h-4" /> },
    { text: "Respira e continua 🧘‍♀️", icon: <Heart className="w-4 h-4" /> },
    { text: "Sei più forte di quanto pensi! 💪", icon: <Sparkles className="w-4 h-4" /> },
  ];

  // Cambia messaggio ogni 5 minuti
  React.useEffect(() => {
    if (isTimerRunning) {
      const interval = setInterval(() => {
        setCurrentMessage(prev => (prev + 1) % motivationalMessages.length);
      }, 300000); // 5 minuti

      return () => clearInterval(interval);
    }
  }, [isTimerRunning, motivationalMessages.length]);

  // Mostra messaggi speciali a certi momenti
  const getSpecialMessage = () => {
    if (timeLeft <= 60 && timeLeft > 0) {
      return { text: "Ultimo minuto! Dai il massimo! 🚀", icon: <Zap className="w-4 h-4" /> };
    }
    if (timeLeft <= 300 && timeLeft > 60) {
      return { text: "Ultimi 5 minuti, ce la fai! 💪", icon: <Heart className="w-4 h-4" /> };
    }
    return null;
  };

  const specialMessage = getSpecialMessage();
  const message = specialMessage || motivationalMessages[currentMessage];

  if (!isTimerRunning) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-60">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-border/50 flex items-center gap-2 animate-fade-in">
        {message.icon}
        <span className="text-sm font-medium text-foreground">
          {message.text}
        </span>
      </div>
    </div>
  );
}

// Hook per gestire la modalità focus
export const useFocusMode = () => {
  const focusMode = useUIStore(state => state.focusMode);
  const setFocusMode = useUIStore(state => state.setFocusMode);
  const preferences = useUIStore(state => state.preferences);

  const toggleFocusMode = React.useCallback(() => {
    setFocusMode(!focusMode);
  }, [focusMode, setFocusMode]);

  const startFocusSession = React.useCallback((duration: number = 25) => {
    // TODO: Implement focus session settings when needed
    setFocusMode(true);
  }, [setFocusMode]);

  const endFocusSession = React.useCallback(() => {
    setFocusMode(false);
  }, [setFocusMode]);

  return {
    isActive: focusMode,
    settings: preferences,
    toggleFocusMode,
    startFocusSession,
    endFocusSession
  };
};

// Componente wrapper per elementi che devono rimanere visibili in modalità focus
interface FocusKeepProps {
  children: React.ReactNode;
  highlight?: boolean;
}

export function FocusKeep({ children, highlight = false }: FocusKeepProps) {
  return (
    <div 
      data-focus-keep
      data-focus-highlight={highlight ? 'true' : undefined}
    >
      {children}
    </div>
  );
}

// Componente per nascondere elementi in modalità focus
interface FocusHideProps {
  children: React.ReactNode;
  condition?: boolean;
}

export function FocusHide({ children, condition = true }: FocusHideProps) {
  return (
    <div data-focus-hide={condition ? 'true' : undefined}>
      {children}
    </div>
  );
}

export { FocusMode, FocusMotivation };

// CSS personalizzato da aggiungere al file globale:
/*
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
*/