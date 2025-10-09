import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  Sparkles, 
  Coffee, 
  Heart, 
  Zap,
  Brain,
  Target,
  Smile
} from 'lucide-react';

interface LoadingProps {
  /** Messaggio di caricamento personalizzato */
  message?: string;
  /** Mostra la progress bar */
  showProgress?: boolean;
  /** Valore della progress (0-100) */
  progress?: number;
  /** Dimensione del loader */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Variante del design */
  variant?: 'default' | 'gentle' | 'encouraging' | 'minimal';
  /** Mostra suggerimenti ADHD-friendly */
  showTips?: boolean;
  /** Timeout per mostrare suggerimenti (ms) */
  tipTimeout?: number;
  /** Classe CSS personalizzata */
  className?: string;
}

const encouragingMessages = [
  "Sto preparando tutto per te... 🌟",
  "Un momento di pazienza, ci siamo quasi! ✨",
  "Sto organizzando le tue cose... 📋",
  "Caricamento in corso, respira profondamente 🌸",
  "Quasi pronto, stai facendo benissimo! 💪",
  "Sto sincronizzando tutto... ⚡",
  "Un attimo ancora, vale la pena aspettare! 🎯",
  "Preparando la tua esperienza perfetta... 🎨"
];

const adhdTips = [
  "💡 Mentre aspetti, fai 3 respiri profondi",
  "🌱 Ricorda: ogni piccolo passo conta",
  "⭐ Stai facendo progressi, anche se non li vedi",
  "🎯 Focus su una cosa alla volta",
  "💚 Sii gentile con te stesso oggi",
  "🌈 Ogni giorno è una nuova opportunità",
  "🚀 I tuoi sforzi stanno dando frutti",
  "☕ Prenditi il tempo che ti serve"
];

/**
 * Componente di loading con design ADHD-friendly
 */
export const Loading: React.FC<LoadingProps> = ({
  message,
  showProgress = false,
  progress = 0,
  size = 'md',
  variant = 'default',
  showTips = false,
  tipTimeout = 3000,
  className
}) => {
  const [currentTip, setCurrentTip] = React.useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = React.useState(message);

  // Mostra suggerimenti dopo un timeout
  React.useEffect(() => {
    if (!showTips) return;

    const timer = setTimeout(() => {
      const randomTip = adhdTips[Math.floor(Math.random() * adhdTips.length)];
      setCurrentTip(randomTip);
    }, tipTimeout);

    return () => clearTimeout(timer);
  }, [showTips, tipTimeout]);

  // Cambia messaggio incoraggiante se non specificato
  React.useEffect(() => {
    if (message || variant !== 'encouraging') return;

    const interval = setInterval(() => {
      const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
      setCurrentMessage(randomMessage);
    }, 2000);

    return () => clearInterval(interval);
  }, [message, variant]);

  // Configurazioni per dimensioni
  const sizeConfig = {
    sm: {
      spinner: 'h-4 w-4',
      container: 'p-4',
      text: 'text-sm',
      icon: 'h-4 w-4'
    },
    md: {
      spinner: 'h-6 w-6',
      container: 'p-6',
      text: 'text-base',
      icon: 'h-5 w-5'
    },
    lg: {
      spinner: 'h-8 w-8',
      container: 'p-8',
      text: 'text-lg',
      icon: 'h-6 w-6'
    },
    xl: {
      spinner: 'h-12 w-12',
      container: 'p-12',
      text: 'text-xl',
      icon: 'h-8 w-8'
    }
  };

  const config = sizeConfig[size];

  // Componente spinner animato
  const Spinner = () => {
    if (variant === 'minimal') {
      return (
        <div className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          config.spinner
        )} />
      );
    }

    return (
      <div className="relative">
        <Loader2 className={cn(
          "animate-spin text-blue-600",
          config.spinner
        )} />
        {variant === 'encouraging' && (
          <Sparkles className={cn(
            "absolute -top-1 -right-1 text-yellow-500 animate-pulse",
            size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
          )} />
        )}
      </div>
    );
  };

  // Icona decorativa basata sulla variante
  const getDecorativeIcon = () => {
    switch (variant) {
      case 'gentle':
        return <Heart className={cn("text-pink-500", config.icon)} />;
      case 'encouraging':
        return <Zap className={cn("text-yellow-500", config.icon)} />;
      default:
        return <Brain className={cn("text-blue-500", config.icon)} />;
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center justify-center", config.container, className)}>
        <Spinner />
        {currentMessage && (
          <span className={cn("ml-3 text-gray-600", config.text)}>
            {currentMessage}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center min-h-[200px]", className)}>
      <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className={cn("text-center", config.container)}>
          {/* Spinner principale */}
          <div className="flex justify-center mb-4">
            <Spinner />
          </div>

          {/* Messaggio principale */}
          {currentMessage && (
            <div className="mb-4">
              <p className={cn(
                "text-gray-700 font-medium",
                config.text
              )}>
                {currentMessage}
              </p>
            </div>
          )}

          {/* Progress bar */}
          {showProgress && (
            <div className="mb-4 space-y-2">
              <Progress 
                value={progress} 
                className="h-2 bg-gray-200" 
              />
              <p className="text-xs text-gray-500">
                {progress}% completato
              </p>
            </div>
          )}

          {/* Suggerimento ADHD */}
          {currentTip && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Smile className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-800">Suggerimento</span>
              </div>
              <p className="text-sm text-green-700">
                {currentTip}
              </p>
            </div>
          )}

          {/* Icona decorativa */}
          {variant !== 'default' && (
            <div className="mt-4 flex justify-center opacity-50">
              {getDecorativeIcon()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Componente skeleton per liste
interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 3,
  showAvatar = false,
  className
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {showAvatar && (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
              )}
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16" />
                  <div className="h-6 bg-gray-200 rounded-full w-12" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Componente skeleton per form
export const SkeletonForm: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <Card className={cn("animate-pulse", className)}>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <div className="h-10 bg-gray-200 rounded flex-1" />
          <div className="h-10 bg-gray-200 rounded flex-1" />
        </div>
      </CardContent>
    </Card>
  );
};

// Hook per gestire stati di loading con timeout
export const useLoadingWithTimeout = (initialLoading = false, timeout = 10000) => {
  const [isLoading, setIsLoading] = React.useState(initialLoading);
  const [showSlowWarning, setShowSlowWarning] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setShowSlowWarning(false);
    
    timeoutRef.current = setTimeout(() => {
      setShowSlowWarning(true);
    }, timeout);
  }, [timeout]);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    setShowSlowWarning(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    showSlowWarning,
    startLoading,
    stopLoading
  };
};