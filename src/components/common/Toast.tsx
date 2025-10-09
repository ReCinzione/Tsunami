import React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle2, AlertTriangle, Info, Heart, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        success: "border-green-200 bg-green-50 text-green-900 shadow-green-100",
        error: "border-red-200 bg-red-50 text-red-900 shadow-red-100",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-900 shadow-yellow-100",
        info: "border-blue-200 bg-blue-50 text-blue-900 shadow-blue-100",
        gentle: "border-pink-200 bg-pink-50 text-pink-900 shadow-pink-100",
        encouraging: "border-purple-200 bg-purple-50 text-purple-900 shadow-purple-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};

// Componente ADHD-friendly Toast personalizzato
interface ADHDToastProps {
  variant?: 'success' | 'error' | 'warning' | 'info' | 'gentle' | 'encouraging';
  title: string;
  description?: string;
  action?: ToastActionElement;
  duration?: number;
  showIcon?: boolean;
  showProgress?: boolean;
  onClose?: () => void;
}

export const ADHDToast: React.FC<ADHDToastProps> = ({
  variant = 'info',
  title,
  description,
  action,
  duration = 5000,
  showIcon = true,
  showProgress = true,
  onClose
}) => {
  const [progress, setProgress] = React.useState(100);
  const [isVisible, setIsVisible] = React.useState(true);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Gestisce la progress bar
  React.useEffect(() => {
    if (!showProgress || duration <= 0) return;

    const interval = 50; // Update ogni 50ms
    const decrement = (100 * interval) / duration;

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          setIsVisible(false);
          onClose?.();
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [duration, showProgress, onClose]);

  // Pausa la progress bar quando si fa hover
  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (!showProgress || duration <= 0) return;

    const interval = 50;
    const decrement = (100 * interval) / duration;

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          setIsVisible(false);
          onClose?.();
          return 0;
        }
        return newProgress;
      });
    }, interval);
  };

  // Icone per ogni variante
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      case 'gentle':
        return <Heart className="h-5 w-5 text-pink-600" />;
      case 'encouraging':
        return <Zap className="h-5 w-5 text-purple-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  // Emoji decorative per varianti speciali
  const getEmoji = () => {
    switch (variant) {
      case 'success':
        return '🎉';
      case 'gentle':
        return '💙';
      case 'encouraging':
        return '✨';
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <Toast
      variant={variant}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden"
    >
      <div className="flex items-start gap-3 w-full">
        {/* Icona */}
        {showIcon && (
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
        )}

        {/* Contenuto */}
        <div className="flex-1 min-w-0">
          <ToastTitle className="flex items-center gap-2">
            {title}
            {getEmoji() && (
              <span className="text-base">{getEmoji()}</span>
            )}
            {variant === 'encouraging' && (
              <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
            )}
          </ToastTitle>
          
          {description && (
            <ToastDescription className="mt-1">
              {description}
            </ToastDescription>
          )}
        </div>

        {/* Azione personalizzata */}
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
          <div 
            className={cn(
              "h-full transition-all duration-75 ease-linear",
              {
                'bg-green-500': variant === 'success',
                'bg-red-500': variant === 'error',
                'bg-yellow-500': variant === 'warning',
                'bg-blue-500': variant === 'info',
                'bg-pink-500': variant === 'gentle',
                'bg-purple-500': variant === 'encouraging',
              }
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <ToastClose />
    </Toast>
  );
};

// Hook per toast ADHD-friendly
export const useADHDToast = () => {
  const [toasts, setToasts] = React.useState<Array<{
    id: string;
    props: ADHDToastProps;
  }>>([]);

  const addToast = React.useCallback((props: ADHDToastProps) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setToasts(prev => [...prev, { id, props }]);

    // Auto-remove dopo la durata specificata
    if (props.duration && props.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, props.duration);
    }

    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = React.useCallback((title: string, description?: string) => {
    return addToast({
      variant: 'success',
      title,
      description,
      duration: 4000
    });
  }, [addToast]);

  const showError = React.useCallback((title: string, description?: string) => {
    return addToast({
      variant: 'error',
      title: `Ops! ${title}`,
      description: description ? `${description} 💙 Non preoccuparti, puoi riprovare!` : undefined,
      duration: 6000
    });
  }, [addToast]);

  const showWarning = React.useCallback((title: string, description?: string) => {
    return addToast({
      variant: 'warning',
      title,
      description,
      duration: 5000
    });
  }, [addToast]);

  const showInfo = React.useCallback((title: string, description?: string) => {
    return addToast({
      variant: 'info',
      title,
      description,
      duration: 4000
    });
  }, [addToast]);

  const showGentle = React.useCallback((title: string, description?: string) => {
    return addToast({
      variant: 'gentle',
      title,
      description,
      duration: 5000
    });
  }, [addToast]);

  const showEncouraging = React.useCallback((title: string, description?: string) => {
    return addToast({
      variant: 'encouraging',
      title: `🌟 ${title}`,
      description,
      duration: 6000
    });
  }, [addToast]);

  const ToastContainer = React.useCallback(() => (
    <ToastProvider>
      {toasts.map(({ id, props }) => (
        <ADHDToast
          key={id}
          {...props}
          onClose={() => removeToast(id)}
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  ), [toasts, removeToast]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showGentle,
    showEncouraging,
    addToast,
    removeToast,
    ToastContainer
  };
};