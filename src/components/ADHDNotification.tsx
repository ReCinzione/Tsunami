import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Zap, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ADHDNotificationProps {
  id: string;
  type: 'success' | 'warning' | 'info' | 'celebration';
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
  showConfetti?: boolean;
}

const notificationIcons = {
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info,
  celebration: Sparkles
};

const notificationEmojis = {
  success: '✅',
  warning: '⚠️',
  info: 'ℹ️',
  celebration: '🎉'
};

export const ADHDNotification: React.FC<ADHDNotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  showConfetti = false
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  
  const Icon = notificationIcons[type];
  const emoji = notificationEmojis[type];

  useEffect(() => {
    if (duration > 0) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 300);
      }, duration);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(timer);
      };
    }
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(
      "adhd-notification",
      type,
      "relative overflow-hidden",
      !isVisible && "opacity-0 translate-x-full scale-95"
    )}>
      {/* Confetti effect per celebrazioni */}
      {showConfetti && type === 'celebration' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100 ease-linear"
             style={{ width: `${progress}%` }} />
      )}
      
      <div className="flex items-start gap-3 relative z-10">
        {/* Icon con animazione */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          type === 'success' && "bg-green-100 text-green-600",
          type === 'warning' && "bg-yellow-100 text-yellow-600",
          type === 'info' && "bg-blue-100 text-blue-600",
          type === 'celebration' && "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 animate-pulse"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{emoji}</span>
            <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          
          {/* Celebration extras */}
          {type === 'celebration' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-purple-600">
              <Heart className="w-3 h-3 animate-pulse" />
              <span>Ottimo lavoro! Continua così! 💪</span>
            </div>
          )}
        </div>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors adhd-focus-ring"
          aria-label="Chiudi notifica"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// Hook per gestire le notifiche ADHD
export const useADHDNotifications = () => {
  const [notifications, setNotifications] = useState<ADHDNotificationProps[]>([]);

  const addNotification = (notification: Omit<ADHDNotificationProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString();
    const newNotification: ADHDNotificationProps = {
      ...notification,
      id,
      onClose: removeNotification
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const celebrate = (title: string, message: string) => {
    return addNotification({
      type: 'celebration',
      title,
      message,
      duration: 6000,
      showConfetti: true
    });
  };

  const success = (title: string, message: string) => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration: 4000
    });
  };

  const warning = (title: string, message: string) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 6000
    });
  };

  const info = (title: string, message: string) => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration: 4000
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    celebrate,
    success,
    warning,
    info
  };
};

// Container per le notifiche
export const ADHDNotificationContainer: React.FC = () => {
  const { notifications } = useADHDNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <ADHDNotification key={notification.id} {...notification} />
      ))}
    </div>
  );
};