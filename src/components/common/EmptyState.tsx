import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { 
  Plus, 
  CheckCircle2, 
  Calendar, 
  Target, 
  Lightbulb, 
  Heart, 
  Sparkles, 
  Coffee, 
  Zap,
  BookOpen,
  Smile,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center p-8 rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700",
        gentle: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800",
        encouraging: "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800",
        success: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800",
        minimal: "bg-transparent",
      },
      size: {
        sm: "p-6 min-h-[200px]",
        default: "p-8 min-h-[300px]",
        lg: "p-12 min-h-[400px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  suggestions?: string[];
  showEmoji?: boolean;
  customContent?: React.ReactNode;
}

function EmptyState({
  className,
  variant,
  size,
  icon,
  title,
  description,
  action,
  secondaryAction,
  suggestions,
  showEmoji = true,
  customContent,
  ...props
}: EmptyStateProps) {
  const getRandomEmoji = () => {
    const emojis = ['🌟', '✨', '💫', '🎯', '🚀', '💙', '🌈', '🎨', '🎪', '🎭'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  return (
    <div
      className={cn(emptyStateVariants({ variant, size }), className)}
      {...props}
    >
      {/* Icona principale */}
      <div className="mb-4">
        {icon ? (
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-white/50 dark:bg-slate-800/50 shadow-sm">
            {icon}
          </div>
        ) : (
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50">
            <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        )}
      </div>

      {/* Titolo con emoji opzionale */}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
        {title}
        {showEmoji && (
          <span className="text-xl animate-bounce" style={{ animationDelay: '0.5s' }}>
            {getRandomEmoji()}
          </span>
        )}
      </h3>

      {/* Descrizione */}
      {description && (
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {/* Suggerimenti ADHD-friendly */}
      {suggestions && suggestions.length > 0 && (
        <div className="mb-6 p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Suggerimenti gentili:
            </span>
          </div>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contenuto personalizzato */}
      {customContent && (
        <div className="mb-6">
          {customContent}
        </div>
      )}

      {/* Azioni */}
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
          >
            {action.icon}
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant={secondaryAction.variant || 'outline'}
            className="flex items-center gap-2"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// Componenti predefiniti per casi comuni

// Empty State per Task
interface TaskEmptyStateProps {
  onCreateTask: () => void;
  onImportTasks?: () => void;
  className?: string;
}

function TaskEmptyState({ onCreateTask, onImportTasks, className }: TaskEmptyStateProps) {
  return (
    <EmptyState
      variant="gentle"
      className={className}
      icon={<CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
      title="Nessuna task ancora"
      description="Inizia il tuo viaggio di produttività creando la tua prima task! Ogni grande obiettivo inizia con un piccolo passo."
      suggestions={[
        "Inizia con qualcosa di piccolo e gestibile",
        "Usa template predefiniti per risparmiare tempo",
        "Ricorda: fatto è meglio che perfetto! 💙"
      ]}
      action={{
        label: "Crea la tua prima task",
        onClick: onCreateTask,
        icon: <Plus className="w-4 h-4" />
      }}
      secondaryAction={onImportTasks ? {
        label: "Importa task esistenti",
        onClick: onImportTasks,
        variant: "outline"
      } : undefined}
    />
  );
}

// Empty State per Routine
interface RoutineEmptyStateProps {
  onCreateRoutine: () => void;
  onBrowseTemplates?: () => void;
  className?: string;
}

function RoutineEmptyState({ onCreateRoutine, onBrowseTemplates, className }: RoutineEmptyStateProps) {
  return (
    <EmptyState
      variant="encouraging"
      className={className}
      icon={<Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
      title="Le tue routine ti aspettano"
      description="Crea routine che si adattano al tuo ritmo. Piccoli passi costanti portano a grandi cambiamenti!"
      suggestions={[
        "Inizia con 2-3 attività semplici",
        "Scegli orari che funzionano per te",
        "Celebra ogni piccola vittoria! ✨"
      ]}
      action={{
        label: "Crea routine personalizzata",
        onClick: onCreateRoutine,
        icon: <Plus className="w-4 h-4" />
      }}
      secondaryAction={onBrowseTemplates ? {
        label: "Esplora template",
        onClick: onBrowseTemplates,
        variant: "outline"
      } : undefined}
    />
  );
}

// Empty State per Progetti
interface ProjectEmptyStateProps {
  onCreateProject: () => void;
  onJoinProject?: () => void;
  className?: string;
}

function ProjectEmptyState({ onCreateProject, onJoinProject, className }: ProjectEmptyStateProps) {
  return (
    <EmptyState
      variant="success"
      className={className}
      icon={<Target className="w-8 h-8 text-green-600 dark:text-green-400" />}
      title="Il tuo primo progetto"
      description="Organizza le tue idee in progetti strutturati. Trasforma i sogni in piani concreti, un passo alla volta."
      suggestions={[
        "Definisci un obiettivo chiaro e raggiungibile",
        "Suddividi in milestone piccole",
        "Ricorda: il progresso è più importante della perfezione"
      ]}
      action={{
        label: "Avvia nuovo progetto",
        onClick: onCreateProject,
        icon: <Zap className="w-4 h-4" />
      }}
      secondaryAction={onJoinProject ? {
        label: "Unisciti a progetto",
        onClick: onJoinProject,
        variant: "outline"
      } : undefined}
    />
  );
}

// Empty State per Ricerca
interface SearchEmptyStateProps {
  query: string;
  onClearSearch: () => void;
  onCreateNew?: () => void;
  className?: string;
}

function SearchEmptyState({ query, onClearSearch, onCreateNew, className }: SearchEmptyStateProps) {
  return (
    <EmptyState
      variant="minimal"
      size="sm"
      className={className}
      icon={<BookOpen className="w-6 h-6 text-slate-500" />}
      title={`Nessun risultato per "${query}"`}
      description="Non preoccuparti! Prova con termini diversi o crea qualcosa di nuovo."
      suggestions={[
        "Controlla l'ortografia",
        "Usa parole chiave più generiche",
        "Prova sinonimi o termini correlati"
      ]}
      action={{
        label: "Cancella ricerca",
        onClick: onClearSearch,
        variant: "outline"
      }}
      secondaryAction={onCreateNew ? {
        label: "Crea nuovo",
        onClick: onCreateNew,
        icon: <Plus className="w-4 h-4" />
      } : undefined}
      showEmoji={false}
    />
  );
}

// Empty State per Errori gentili
interface ErrorEmptyStateProps {
  title?: string;
  description?: string;
  onRetry: () => void;
  onGoHome?: () => void;
  className?: string;
}

function ErrorEmptyState({ 
  title = "Qualcosa è andato storto", 
  description = "Non preoccuparti, capita a tutti! Proviamo di nuovo insieme.",
  onRetry, 
  onGoHome, 
  className 
}: ErrorEmptyStateProps) {
  return (
    <EmptyState
      variant="gentle"
      className={className}
      icon={<Heart className="w-8 h-8 text-pink-600 dark:text-pink-400" />}
      title={title}
      description={description}
      suggestions={[
        "Controlla la tua connessione internet",
        "Riprova tra qualche secondo",
        "Se il problema persiste, non esitare a contattarci 💙"
      ]}
      action={{
        label: "Riprova",
        onClick: onRetry,
        icon: <ArrowRight className="w-4 h-4" />
      }}
      secondaryAction={onGoHome ? {
        label: "Torna alla home",
        onClick: onGoHome,
        variant: "outline"
      } : undefined}
    />
  );
}

// Empty State per Onboarding
interface OnboardingEmptyStateProps {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  onNext: () => void;
  onSkip?: () => void;
  className?: string;
}

function OnboardingEmptyState({ 
  step, 
  totalSteps, 
  title, 
  description, 
  onNext, 
  onSkip, 
  className 
}: OnboardingEmptyStateProps) {
  return (
    <EmptyState
      variant="encouraging"
      className={className}
      icon={<Smile className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
      title={title}
      description={description}
      customContent={
        <div className="flex items-center gap-2 mb-4">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index < step 
                  ? "bg-purple-500" 
                  : index === step 
                  ? "bg-purple-300" 
                  : "bg-slate-200 dark:bg-slate-700"
              )}
            />
          ))}
          <span className="text-sm text-slate-500 ml-2">
            {step + 1} di {totalSteps}
          </span>
        </div>
      }
      action={{
        label: step === totalSteps - 1 ? "Inizia!" : "Continua",
        onClick: onNext,
        icon: <ArrowRight className="w-4 h-4" />
      }}
      secondaryAction={onSkip ? {
        label: "Salta",
        onClick: onSkip,
        variant: "ghost"
      } : undefined}
    />
  );
}

export {
  EmptyState,
  TaskEmptyState,
  RoutineEmptyState,
  ProjectEmptyState,
  SearchEmptyState,
  ErrorEmptyState,
  OnboardingEmptyState,
};