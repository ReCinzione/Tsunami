import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Package, Star, Lock, Sparkles, Trophy, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'imaginal_object' | 'achievement' | 'skill' | 'trait';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  level_required: number;
  archetype?: string;
  icon: string;
  effect?: string;
}

interface Profile {
  current_level: number;
  total_xp: number;
  dominant_archetype: string;
}

interface ArchetypeLevel {
  id: string;
  archetype: string;
  level_number: number;
  level_name: string;
  imaginal_object_name: string;
  emerging_quality: string;
  shadow_aspect: string;
}

const InventorySystem: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [archetypeLevels, setArchetypeLevels] = useState<ArchetypeLevel[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadInventoryData();
    }
  }, [user]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProfile(),
        loadArchetypeLevels(),
        generateInventoryItems()
      ]);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('current_level, total_xp, dominant_archetype')
      .eq('user_id', user?.id)
      .single();

    if (error) throw error;
    setProfile(data);
  };

  const loadArchetypeLevels = async () => {
    const { data, error } = await supabase
      .from('archetype_levels')
      .select('*')
      .order('archetype, level_number');

    if (error) throw error;
    setArchetypeLevels(data || []);
  };

  const generateInventoryItems = async () => {
    // Genera oggetti immaginali basati sui livelli degli archetipi
    const imaginalObjects: InventoryItem[] = archetypeLevels.map(level => ({
      id: `imaginal_${level.id}`,
      name: level.imaginal_object_name,
      description: `Oggetto immaginale del ${level.level_name}. ${level.description}`,
      type: 'imaginal_object' as const,
      rarity: getRarityByLevel(level.level_number),
      unlocked: (profile?.current_level || 0) >= level.level_number && 
                profile?.dominant_archetype === level.archetype,
      level_required: level.level_number,
      archetype: level.archetype,
      icon: getArchetypeEmoji(level.archetype),
      effect: level.emerging_quality
    }));

    // Genera tratti di personalità
    const personalityTraits: InventoryItem[] = [
      {
        id: 'trait_focus',
        name: 'Concentrazione Profonda',
        description: 'Capacità di mantenere il focus per periodi prolungati',
        type: 'trait',
        rarity: 'uncommon',
        unlocked: (profile?.current_level || 0) >= 3,
        level_required: 3,
        icon: '🎯',
        effect: 'Migliora la produttività nei task complessi'
      },
      {
        id: 'trait_creativity',
        name: 'Scintilla Creativa',
        description: 'Abilità di trovare soluzioni innovative',
        type: 'trait',
        rarity: 'rare',
        unlocked: (profile?.current_level || 0) >= 5,
        level_required: 5,
        icon: '💡',
        effect: 'Sblocca nuove possibilità creative'
      },
      {
        id: 'trait_persistence',
        name: 'Determinazione Ferrea',
        description: 'Resistenza alle difficoltà e perseveranza',
        type: 'trait',
        rarity: 'epic',
        unlocked: (profile?.current_level || 0) >= 8,
        level_required: 8,
        icon: '🛡️',
        effect: 'Riduce l\'impatto degli ostacoli'
      }
    ];

    // Genera achievement
    const achievements: InventoryItem[] = [
      {
        id: 'achievement_first_task',
        name: 'Primo Passo',
        description: 'Hai completato il tuo primo task',
        type: 'achievement',
        rarity: 'common',
        unlocked: true, // Assumiamo che sia sempre sbloccato se si arriva qui
        level_required: 1,
        icon: '🥉',
        effect: 'Inizio del viaggio'
      },
      {
        id: 'achievement_level_5',
        name: 'Esploratore',
        description: 'Hai raggiunto il livello 5',
        type: 'achievement',
        rarity: 'uncommon',
        unlocked: (profile?.current_level || 0) >= 5,
        level_required: 5,
        icon: '🗺️',
        effect: 'Riconoscimento del progresso'
      },
      {
        id: 'achievement_level_10',
        name: 'Maestro',
        description: 'Hai raggiunto il livello 10',
        type: 'achievement',
        rarity: 'epic',
        unlocked: (profile?.current_level || 0) >= 10,
        level_required: 10,
        icon: '👑',
        effect: 'Simbolo di maestria'
      }
    ];

    setInventory([...imaginalObjects, ...personalityTraits, ...achievements]);
  };

  const getRarityByLevel = (level: number): InventoryItem['rarity'] => {
    if (level <= 2) return 'common';
    if (level <= 4) return 'uncommon';
    if (level <= 7) return 'rare';
    if (level <= 10) return 'epic';
    return 'legendary';
  };

  const getArchetypeEmoji = (archetype: string) => {
    const emojiMap: { [key: string]: string } = {
      visionario: '🔮',
      costruttore: '🔨',
      sognatore: '💭',
      silenzioso: '🤫',
      combattente: '⚔️'
    };
    return emojiMap[archetype] || '✨';
  };

  const getRarityColor = (rarity: string) => {
    const colorMap: { [key: string]: string } = {
      common: 'border-gray-300 bg-gray-50',
      uncommon: 'border-green-300 bg-green-50',
      rare: 'border-blue-300 bg-blue-50',
      epic: 'border-purple-300 bg-purple-50',
      legendary: 'border-yellow-300 bg-yellow-50'
    };
    return colorMap[rarity] || colorMap.common;
  };

  const getRarityBadgeColor = (rarity: string) => {
    const colorMap: { [key: string]: string } = {
      common: 'bg-gray-100 text-gray-800',
      uncommon: 'bg-green-100 text-green-800',
      rare: 'bg-blue-100 text-blue-800',
      epic: 'bg-purple-100 text-purple-800',
      legendary: 'bg-yellow-100 text-yellow-800'
    };
    return colorMap[rarity] || colorMap.common;
  };

  const getTypeIcon = (type: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      imaginal_object: <Sparkles className="w-4 h-4" />,
      achievement: <Trophy className="w-4 h-4" />,
      skill: <Zap className="w-4 h-4" />,
      trait: <Star className="w-4 h-4" />
    };
    return iconMap[type] || <Package className="w-4 h-4" />;
  };

  const filteredInventory = inventory.filter(item => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'unlocked') return item.unlocked;
    if (selectedCategory === 'locked') return !item.unlocked;
    return item.type === selectedCategory;
  });

  const unlockedCount = inventory.filter(item => item.unlocked).length;
  const totalCount = inventory.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inventory Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Inventario
          </h2>
          <p className="text-muted-foreground">
            I tuoi oggetti, tratti e achievement sbloccati
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{unlockedCount}/{totalCount}</div>
          <div className="text-sm text-muted-foreground">Completamento</div>
          <Progress value={completionPercentage} className="w-24 mt-1" />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Tutti</TabsTrigger>
          <TabsTrigger value="unlocked">Sbloccati</TabsTrigger>
          <TabsTrigger value="locked">Bloccati</TabsTrigger>
          <TabsTrigger value="imaginal_object">Oggetti</TabsTrigger>
          <TabsTrigger value="trait">Tratti</TabsTrigger>
          <TabsTrigger value="achievement">Achievement</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredInventory.map((item) => (
              <TooltipProvider key={item.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card 
                      className={`relative transition-all duration-200 hover:shadow-md ${
                        item.unlocked 
                          ? getRarityColor(item.rarity) 
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      {/* Rarity Indicator */}
                      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                        item.rarity === 'legendary' ? 'bg-yellow-400' :
                        item.rarity === 'epic' ? 'bg-purple-400' :
                        item.rarity === 'rare' ? 'bg-blue-400' :
                        item.rarity === 'uncommon' ? 'bg-green-400' :
                        'bg-gray-400'
                      }`} />

                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl">
                            {item.unlocked ? item.icon : '🔒'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-semibold truncate">
                              {item.unlocked ? item.name : '???'}
                            </CardTitle>
                            <div className="flex items-center gap-1 mt-1">
                              {getTypeIcon(item.type)}
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getRarityBadgeColor(item.rarity)}`}
                              >
                                {item.rarity}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <CardDescription className="text-xs line-clamp-2">
                          {item.unlocked 
                            ? item.description 
                            : `Sbloccato al livello ${item.level_required}`
                          }
                        </CardDescription>
                        
                        {item.unlocked && item.effect && (
                          <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                            <div className="font-medium text-primary">Effetto:</div>
                            <div>{item.effect}</div>
                          </div>
                        )}

                        {!item.unlocked && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="w-3 h-3" />
                            Livello {item.level_required} richiesto
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <div className="font-semibold">{item.unlocked ? item.name : 'Oggetto Bloccato'}</div>
                      <div className="text-sm mt-1">
                        {item.unlocked ? item.description : `Raggiungi il livello ${item.level_required} per sbloccare questo oggetto.`}
                      </div>
                      {item.archetype && (
                        <div className="text-xs mt-1 text-muted-foreground capitalize">
                          Archetipo: {item.archetype}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessun oggetto trovato</h3>
              <p className="text-muted-foreground">
                {selectedCategory === 'locked' 
                  ? 'Tutti gli oggetti sono stati sbloccati!' 
                  : 'Continua a completare task per sbloccare nuovi oggetti!'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventorySystem;