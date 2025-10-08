import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Star, Trophy, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LevelUpNotificationProps {
  isVisible: boolean;
  newLevel: number;
  archetype?: string;
  xpGained: number;
  onClose: () => void;
  onViewCharacterSheet?: () => void;
}

const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({
  isVisible,
  newLevel,
  archetype,
  xpGained,
  onClose,
  onViewCharacterSheet
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      // Auto-close after 8 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const getArchetypeEmoji = (archetype?: string) => {
    const emojiMap: { [key: string]: string } = {
      visionario: '🔮',
      costruttore: '🔨',
      sognatore: '💭',
      silenzioso: '🤫',
      combattente: '⚔️'
    };
    return emojiMap[archetype || ''] || '✨';
  };

  const getLevelTitle = (level: number) => {
    if (level <= 3) return 'Novizio';
    if (level <= 6) return 'Apprendista';
    if (level <= 10) return 'Esperto';
    if (level <= 15) return 'Maestro';
    if (level <= 20) return 'Gran Maestro';
    return 'Leggenda';
  };

  const getLevelColor = (level: number) => {
    if (level <= 3) return 'from-green-400 to-green-600';
    if (level <= 6) return 'from-blue-400 to-blue-600';
    if (level <= 10) return 'from-purple-400 to-purple-600';
    if (level <= 15) return 'from-orange-400 to-orange-600';
    if (level <= 20) return 'from-red-400 to-red-600';
    return 'from-yellow-400 to-yellow-600';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -50 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20,
            duration: 0.6
          }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
        >
          <Card className={`relative overflow-hidden border-2 bg-gradient-to-br ${getLevelColor(newLevel)} shadow-2xl`}>
            {/* Confetti Effect */}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      opacity: 1, 
                      y: -10, 
                      x: Math.random() * 400 - 200,
                      rotate: 0
                    }}
                    animate={{ 
                      opacity: 0, 
                      y: 400, 
                      rotate: 360
                    }}
                    transition={{ 
                      duration: 3, 
                      delay: Math.random() * 2,
                      ease: "easeOut"
                    }}
                    className="absolute text-2xl"
                    style={{ left: `${Math.random() * 100}%` }}
                  >
                    {['🎉', '✨', '⭐', '🌟', '💫'][Math.floor(Math.random() * 5)]}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-2 right-2 text-white hover:bg-white/20 z-10"
            >
              <X className="w-4 h-4" />
            </Button>

            <CardContent className="p-6 text-center text-white relative">
              {/* Main Level Up Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="mb-4"
              >
                <div className="text-6xl mb-2">
                  {getArchetypeEmoji(archetype)}
                </div>
                <Trophy className="w-12 h-12 mx-auto mb-2 text-yellow-300" />
              </motion.div>

              {/* Level Up Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <h2 className="text-2xl font-bold mb-1">
                  🎉 LIVELLO AUMENTATO! 🎉
                </h2>
                
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-lg px-3 py-1 bg-white/20 text-white border-white/30">
                    <Star className="w-4 h-4 mr-1" />
                    Livello {newLevel}
                  </Badge>
                </div>

                <p className="text-lg font-semibold mb-2">
                  {getLevelTitle(newLevel)}
                </p>

                {archetype && (
                  <p className="text-sm opacity-90 mb-3 capitalize">
                    {archetype} • +{xpGained} XP
                  </p>
                )}

                <div className="bg-white/10 rounded-lg p-3 mb-4">
                  <p className="text-sm">
                    Hai sbloccato nuove abilità e caratteristiche!
                  </p>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-2"
              >
                {onViewCharacterSheet && (
                  <Button
                    onClick={onViewCharacterSheet}
                    variant="secondary"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Visualizza Scheda Personaggio
                  </Button>
                )}
                
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="w-full text-white hover:bg-white/10"
                >
                  Continua
                </Button>
              </motion.div>
            </CardContent>

            {/* Animated Border */}
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.5 }}
              className="absolute inset-0 pointer-events-none"
            >
              <svg className="w-full h-full">
                <motion.rect
                  x="2"
                  y="2"
                  width="calc(100% - 4px)"
                  height="calc(100% - 4px)"
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="2"
                  rx="8"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.5 }}
                />
              </svg>
            </motion.div>

            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpNotification;