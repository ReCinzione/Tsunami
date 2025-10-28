import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Coffee, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useADHDNotifications } from './ADHDNotification';

interface ADHDPomodoroTimerProps {
  className?: string;
  onSessionComplete?: (type: 'work' | 'break') => void;
  autoStart?: boolean;
}

type TimerPhase = 'work' | 'shortBreak' | 'longBreak';

const TIMER_DURATIONS = {
  work: 25 * 60, // 25 minuti
  shortBreak: 5 * 60, // 5 minuti
  longBreak: 15 * 60 // 15 minuti
};

const PHASE_CONFIG = {
  work: {
    label: 'Focus Time',
    emoji: '🎯',
    color: 'from-blue-500 to-purple-600',
    bgColor: 'bg-gradient-to-br from-blue-50 to-purple-50',
    message: 'Concentrati su un task alla volta'
  },
  shortBreak: {
    label: 'Pausa Breve',
    emoji: '☕',
    color: 'from-green-500 to-teal-600',
    bgColor: 'bg-gradient-to-br from-green-50 to-teal-50',
    message: 'Rilassati e ricarica le energie'
  },
  longBreak: {
    label: 'Pausa Lunga',
    emoji: '🌟',
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
    message: 'Tempo per una pausa più lunga'
  }
};

export const ADHDPomodoroTimer: React.FC<ADHDPomodoroTimerProps> = ({
  className,
  onSessionComplete,
  autoStart = false
}) => {
  const [currentPhase, setCurrentPhase] = useState<TimerPhase>('work');
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATIONS.work);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const { celebrate, success, info } = useADHDNotifications();
  
  const currentConfig = PHASE_CONFIG[currentPhase];
  const totalTime = TIMER_DURATIONS[currentPhase];
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const progressDegrees = (progress / 100) * 360;

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handlePhaseComplete = useCallback(() => {
    setIsRunning(false);
    
    if (soundEnabled) {
      playCompletionSound();
    }
    
    if (currentPhase === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Celebra il completamento
      celebrate(
        '🎉 Sessione Completata!',
        `Hai completato ${newCompletedSessions} sessioni di focus oggi!`
      );
      
      // Determina il tipo di pausa
      const nextPhase = newCompletedSessions % 4 === 0 ? 'longBreak' : 'shortBreak';
      setCurrentPhase(nextPhase);
      setTimeLeft(TIMER_DURATIONS[nextPhase]);
      
      onSessionComplete?.('work');
    } else {
      // Fine pausa, torna al lavoro
      success(
        '✨ Pausa Terminata',
        'Pronto per un\'altra sessione di focus?'
      );
      
      setCurrentPhase('work');
      setTimeLeft(TIMER_DURATIONS.work);
      onSessionComplete?.('break');
    }
  }, [currentPhase, completedSessions, soundEnabled, celebrate, success, onSessionComplete]);

  const playCompletionSound = () => {
    // Suono gentile per ADHD
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Sequenza di note piacevoli
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.2);
    });
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    
    if (!isRunning) {
      info(
        '⏰ Timer Avviato',
        `${currentConfig.label} - ${currentConfig.message}`
      );
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(TIMER_DURATIONS[currentPhase]);
    
    info('🔄 Timer Resettato', 'Pronto per ricominciare!');
  };

  const switchPhase = (phase: TimerPhase) => {
    setCurrentPhase(phase);
    setTimeLeft(TIMER_DURATIONS[phase]);
    setIsRunning(false);
  };

  return (
    <div className={cn(
      "relative p-6 rounded-2xl",
      currentConfig.bgColor,
      "border-2 border-white/50 backdrop-blur-sm",
      "adhd-hover-lift transition-all duration-300",
      className
    )}>
      {/* Header con fase corrente */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl">{currentConfig.emoji}</span>
          <Badge className={cn(
            "text-white border-0",
            `bg-gradient-to-r ${currentConfig.color}`
          )}>
            {currentConfig.label}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 font-medium">
          {currentConfig.message}
        </p>
      </div>

      {/* Timer circolare */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full bg-white/30 backdrop-blur-sm" />
          
          {/* Progress circle */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="3"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Timer display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-gray-800 font-mono">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {isRunning ? '⏱️ In corso' : '⏸️ In pausa'}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <Button
          onClick={toggleTimer}
          className="adhd-btn-primary adhd-click-bounce w-16 h-16 rounded-full p-0"
          size="lg"
        >
          {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </Button>
        
        <Button
          onClick={resetTimer}
          variant="outline"
          size="lg"
          className="adhd-hover-lift adhd-click-bounce w-12 h-12 rounded-full p-0"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        
        <Button
          onClick={() => setSoundEnabled(!soundEnabled)}
          variant="outline"
          size="lg"
          className="adhd-hover-lift adhd-click-bounce w-12 h-12 rounded-full p-0"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
      </div>

      {/* Phase selector */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {Object.entries(PHASE_CONFIG).map(([phase, config]) => (
          <Button
            key={phase}
            onClick={() => switchPhase(phase as TimerPhase)}
            variant={currentPhase === phase ? "default" : "outline"}
            size="sm"
            className={cn(
              "adhd-hover-lift adhd-click-bounce text-xs",
              currentPhase === phase && "adhd-pulse-success"
            )}
          >
            <span className="mr-1">{config.emoji}</span>
            {config.label}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full backdrop-blur-sm">
          <Zap className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-gray-700">
            {completedSessions} sessioni completate oggi
          </span>
        </div>
      </div>
    </div>
  );
};