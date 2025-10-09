import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "bg-slate-200 dark:bg-slate-700",
        gentle: "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700",
        shimmer: "bg-gradient-to-r from-transparent via-white/20 to-transparent relative overflow-hidden",
      },
      size: {
        sm: "h-4",
        default: "h-6",
        lg: "h-8",
        xl: "h-12",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        default: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
);

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number;
  height?: string | number;
}

function Skeleton({
  className,
  variant,
  size,
  rounded,
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const customStyle = {
    ...style,
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
  };

  return (
    <div
      className={cn(skeletonVariants({ variant, size, rounded, className }))}
      style={customStyle}
      {...props}
    >
      {variant === 'shimmer' && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      )}
    </div>
  );
}

// Skeleton per Task Item
interface TaskSkeletonProps {
  count?: number;
  showPriority?: boolean;
  showDueDate?: boolean;
  className?: string;
}

function TaskSkeleton({ 
  count = 1, 
  showPriority = true, 
  showDueDate = true,
  className 
}: TaskSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
          {/* Checkbox */}
          <Skeleton variant="gentle" rounded="sm" width={20} height={20} />
          
          <div className="flex-1 space-y-2">
            {/* Titolo task */}
            <Skeleton 
              variant="shimmer" 
              height={20} 
              width={`${Math.random() * 40 + 60}%`} 
            />
            
            {/* Descrizione */}
            <Skeleton 
              variant="gentle" 
              size="sm" 
              width={`${Math.random() * 30 + 40}%`} 
            />
            
            <div className="flex items-center space-x-2">
              {/* Badge priorità */}
              {showPriority && (
                <Skeleton 
                  variant="gentle" 
                  size="sm" 
                  width={60} 
                  rounded="full" 
                />
              )}
              
              {/* Badge energia */}
              <Skeleton 
                variant="gentle" 
                size="sm" 
                width={45} 
                rounded="full" 
              />
              
              {/* Data scadenza */}
              {showDueDate && (
                <Skeleton 
                  variant="gentle" 
                  size="sm" 
                  width={80} 
                />
              )}
            </div>
          </div>
          
          {/* Azioni */}
          <div className="flex space-x-2">
            <Skeleton variant="gentle" width={32} height={32} rounded="default" />
            <Skeleton variant="gentle" width={32} height={32} rounded="default" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton per Form
interface FormSkeletonProps {
  fields?: number;
  showSubmit?: boolean;
  className?: string;
}

function FormSkeleton({ 
  fields = 4, 
  showSubmit = true,
  className 
}: FormSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          {/* Label */}
          <Skeleton 
            variant="gentle" 
            size="sm" 
            width={`${Math.random() * 30 + 20}%`} 
          />
          
          {/* Input field */}
          <Skeleton 
            variant="shimmer" 
            height={40} 
            width="100%" 
            rounded="default" 
          />
        </div>
      ))}
      
      {showSubmit && (
        <div className="flex justify-end space-x-2 pt-4">
          <Skeleton 
            variant="gentle" 
            height={40} 
            width={80} 
            rounded="default" 
          />
          <Skeleton 
            variant="shimmer" 
            height={40} 
            width={100} 
            rounded="default" 
          />
        </div>
      )}
    </div>
  );
}

// Skeleton per Card
interface CardSkeletonProps {
  showHeader?: boolean;
  showFooter?: boolean;
  contentLines?: number;
  className?: string;
}

function CardSkeleton({ 
  showHeader = true, 
  showFooter = false, 
  contentLines = 3,
  className 
}: CardSkeletonProps) {
  return (
    <div className={cn("border rounded-lg p-6 space-y-4", className)}>
      {showHeader && (
        <div className="space-y-2">
          <Skeleton variant="shimmer" height={24} width="60%" />
          <Skeleton variant="gentle" size="sm" width="40%" />
        </div>
      )}
      
      <div className="space-y-2">
        {Array.from({ length: contentLines }).map((_, index) => (
          <Skeleton 
            key={index}
            variant="gentle" 
            size="sm" 
            width={index === contentLines - 1 ? "70%" : "100%"} 
          />
        ))}
      </div>
      
      {showFooter && (
        <div className="flex justify-between items-center pt-2">
          <Skeleton variant="gentle" size="sm" width={100} />
          <Skeleton variant="gentle" height={32} width={80} rounded="default" />
        </div>
      )}
    </div>
  );
}

// Skeleton per Lista
interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  className?: string;
}

function ListSkeleton({ 
  items = 5, 
  showAvatar = false, 
  showActions = true,
  className 
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-3 border rounded-md">
          {showAvatar && (
            <Skeleton 
              variant="gentle" 
              width={40} 
              height={40} 
              rounded="full" 
            />
          )}
          
          <div className="flex-1 space-y-1">
            <Skeleton 
              variant="shimmer" 
              height={18} 
              width={`${Math.random() * 40 + 50}%`} 
            />
            <Skeleton 
              variant="gentle" 
              size="sm" 
              width={`${Math.random() * 30 + 30}%`} 
            />
          </div>
          
          {showActions && (
            <Skeleton 
              variant="gentle" 
              width={24} 
              height={24} 
              rounded="default" 
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Skeleton per Dashboard Stats
interface StatsSkeletonProps {
  cards?: number;
  className?: string;
}

function StatsSkeleton({ cards = 4, className }: StatsSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="border rounded-lg p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton variant="gentle" width={24} height={24} rounded="default" />
            <Skeleton variant="gentle" size="sm" width={60} />
          </div>
          
          <Skeleton variant="shimmer" height={32} width="80%" />
          
          <div className="flex items-center space-x-2">
            <Skeleton variant="gentle" size="sm" width={16} height={16} />
            <Skeleton variant="gentle" size="sm" width={100} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton per Profilo Utente
function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header profilo */}
      <div className="flex items-center space-x-4">
        <Skeleton 
          variant="gentle" 
          width={80} 
          height={80} 
          rounded="full" 
        />
        
        <div className="space-y-2">
          <Skeleton variant="shimmer" height={24} width={200} />
          <Skeleton variant="gentle" size="sm" width={150} />
          <div className="flex space-x-2">
            <Skeleton variant="gentle" size="sm" width={60} rounded="full" />
            <Skeleton variant="gentle" size="sm" width={80} rounded="full" />
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="text-center space-y-2">
            <Skeleton variant="shimmer" height={32} width="100%" />
            <Skeleton variant="gentle" size="sm" width="80%" className="mx-auto" />
          </div>
        ))}
      </div>
      
      {/* Contenuto aggiuntivo */}
      <div className="space-y-4">
        <Skeleton variant="gentle" height={20} width="30%" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton 
              key={index}
              variant="gentle" 
              size="sm" 
              width={index === 3 ? "60%" : "100%"} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export {
  Skeleton,
  TaskSkeleton,
  FormSkeleton,
  CardSkeleton,
  ListSkeleton,
  StatsSkeleton,
  ProfileSkeleton,
};

// CSS personalizzato per l'animazione shimmer
// Aggiungi questo al tuo file CSS globale:
/*
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
*/