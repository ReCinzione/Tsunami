import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Trophy, Star, Zap, Target, Calendar, Award, Sparkles, TrendingUp, Crown, CheckCircle, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { progressionService } from '@/services/ProgressionService';
import InventorySystem from '@/components/InventorySystem';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  current_level: number | null;
  total_xp: number | null;
  dominant_archetype: string | null;
  visionario_percentage: number | null;
  costruttore_percentage: number | null;
  sognatore_percentage: number | null;
  silenzioso_percentage: number | null;
  combattente_percentage: number | null;
  test_completed: boolean | null;
  created_at: string;
  updated_at: string;
}

interface ArchetypeLevel {
  id: string;
  archetype: string;
  level_number: number;
  level_name: string;
  description: string;
  emerging_quality: string;
  shadow_aspect: string;
  imaginal_object_name: string;
  xp_required: number;
}

interface XPTransaction {
  id: string;
  amount: number;
  description: string;
  created_at: string;
}

interface TaskStats {
  total_completed: number;
  total_created: number;
  completion_rate: number;
  favorite_task_type: string;
  favorite_energy_level: string;
}

const CharacterSheet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [archetypeLevels, setArchetypeLevels] = useState<ArchetypeLevel[]>([]);
  const [xpTransactions, setXpTransactions] = useState<XPTransaction[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCharacterData();
    }
  }, [user]);

  const loadCharacterData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProfile(),
        loadArchetypeLevels(),
        loadXPTransactions(),
        loadTaskStats()
      ]);
    } catch (error) {
      console.error('Error loading character data:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati del personaggio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (error) throw error;
    setProfile(data);
  };

  const loadArchetypeLevels = async () => {
    const { data, error } = await supabase
      .from('archetype_levels')
      .select('*')
      .order('level_number');

    if (error) throw error;
    setArchetypeLevels(data || []);
  };

  const loadXPTransactions = async () => {
    const { data, error } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    setXpTransactions(data || []);
  };

  const loadTaskStats = async () => {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('status, task_type, energy_required')
      .eq('user_id', user?.id);

    if (error) throw error;

    const completed = tasks?.filter(t => t.status === 'completed').length || 0;
    const total = tasks?.length || 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calcola il tipo di task più frequente
    const taskTypeCounts = tasks?.reduce((acc, task) => {
      acc[task.task_type] = (acc[task.task_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    const favoriteTaskType = Object.entries(taskTypeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'azione';

    // Calcola il livello di energia più frequente
    const energyLevelCounts = tasks?.reduce((acc, task) => {
      acc[task.energy_required] = (acc[task.energy_required] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    const favoriteEnergyLevel = Object.entries(energyLevelCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'media';

    setTaskStats({
      total_completed: completed,
      total_created: total,
      completion_rate: completionRate,
      favorite_task_type: favoriteTaskType,
      favorite_energy_level: favoriteEnergyLevel
    });
  };



  const getXPForNextLevel = (currentLevel: number): number => {
    const xpThresholds = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250];
    if (currentLevel <= 10) {
      return xpThresholds[currentLevel] || 0;
    }
    return 3250 + (currentLevel - 10) * 600;
  };

  const getArchetypeEmoji = (archetype: string | null) => {
    const emojiMap: { [key: string]: string } = {
      visionario: '🔮',
      costruttore: '🔨',
      sognatore: '💭',
      silenzioso: '🤫',
      combattente: '⚔️'
    };
    return emojiMap[archetype || ''] || '✨';
  };

  const getArchetypeDescription = (archetype: string | null) => {
    const descriptions: { [key: string]: string } = {
      visionario: "Ama immaginare il futuro e creare nuove possibilità. È bravo a vedere le cose in grande e a ispirare gli altri.",
      costruttore: "Preferisce l'azione concreta e i risultati tangibili. È organizzato e sa trasformare le idee in realtà.",
      sognatore: "È creativo e sensibile, ama la bellezza e l'arte. Ha una ricca vita interiore e molta immaginazione.",
      silenzioso: "È riflessivo e attento, preferisce osservare prima di agire. È un buon ascoltatore e sa cogliere i dettagli.",
      combattente: "È energico e determinato, non si arrende facilmente. Ama le sfide e lotta per quello in cui crede."
    };
    return descriptions[archetype || ''] || "";
  };

  const getTaskTypeEmoji = (taskType: string) => {
    const emojiMap: { [key: string]: string } = {
      azione: '⚡',
      riflessione: '🤔',
      comunicazione: '💬',
      creativita: '🎨',
      organizzazione: '📋'
    };
    return emojiMap[taskType] || '📝';
  };

  const getEnergyLevelEmoji = (energyLevel: string) => {
    const emojiMap: { [key: string]: string } = {
      molto_bassa: '🟢',
      bassa: '🟡',
      media: '🟠',
      alta: '🔴',
      molto_alta: '🟣'
    };
    return emojiMap[energyLevel] || '⚪';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento scheda personaggio...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Profilo non trovato</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Torna alla Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const totalXP = profile.total_xp || 0;
  const calculatedLevel = progressionService.calculateLevelFromXP(totalXP);
  const currentLevel = calculatedLevel; // Usa il livello calcolato dall'XP
  const xpForCurrentLevel = currentLevel > 1 ? getXPForNextLevel(currentLevel - 1) : 0;
  const xpForNextLevel = getXPForNextLevel(currentLevel);
  const xpProgress = totalXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = Math.min((xpProgress / xpNeeded) * 100, 100);
  
  // Trova il livello attuale dell'archetipo dominante
  const currentArchetypeLevel = archetypeLevels.find(
    level => level.archetype === profile.dominant_archetype && level.level_number === currentLevel
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Torna alla Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Scheda Personaggio</h1>
          <div></div>
        </div>

        {/* Character Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Character Info */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/20 rounded-full flex items-center justify-center text-2xl md:text-3xl flex-shrink-0">
                    {getArchetypeEmoji(profile.dominant_archetype)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg md:text-2xl break-words">
                      {profile.display_name || 'Avventuriero'}
                    </CardTitle>
                    <CardDescription className="text-sm md:text-lg capitalize break-words">
                      {profile.dominant_archetype ? `Il ${profile.dominant_archetype}` : 'Tipo non definito'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-sm md:text-lg px-2 py-1 md:px-3 flex-shrink-0">
                    Lv. {currentLevel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-muted-foreground mb-2">
                    {getArchetypeDescription(profile.dominant_archetype)}
                  </p>
                </div>
                
                {/* Current Level Details */}
                {currentArchetypeLevel && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-primary flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {currentArchetypeLevel.level_name}
                      </h4>
                      <Badge variant="default">Livello {currentLevel}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentArchetypeLevel.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div className="bg-green-50 border border-green-200 p-2 rounded">
                        <div className="font-medium text-green-700">✨ Qualità Emergente</div>
                        <div className="text-green-600">{currentArchetypeLevel.emerging_quality}</div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 p-2 rounded">
                        <div className="font-medium text-orange-700">⚠️ Aspetto Ombra</div>
                        <div className="text-orange-600">{currentArchetypeLevel.shadow_aspect}</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 p-2 rounded">
                        <div className="font-medium text-purple-700">🎭 Oggetto Immaginale</div>
                        <div className="text-purple-600">{currentArchetypeLevel.imaginal_object_name}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* XP Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Esperienza</span>
                    <span className="text-sm text-muted-foreground">
                      {totalXP} / {xpForNextLevel} XP
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    {xpNeeded - xpProgress} XP al prossimo livello
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Statistiche
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Task Completati</span>
                  <Badge variant="outline">{taskStats?.total_completed || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tasso Completamento</span>
                  <Badge variant="outline">{taskStats?.completion_rate || 0}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tipo Preferito</span>
                  <Badge variant="outline" className="gap-1">
                    {getTaskTypeEmoji(taskStats?.favorite_task_type || 'azione')}
                    {taskStats?.favorite_task_type || 'azione'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Energia Preferita</span>
                  <Badge variant="outline" className="gap-1">
                    {getEnergyLevelEmoji(taskStats?.favorite_energy_level || 'media')}
                    {taskStats?.favorite_energy_level || 'media'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Informazioni
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Registrato il:</span>
                  <br />
                  {new Date(profile.created_at).toLocaleDateString('it-IT')}
                </div>
                <div>
                  <span className="text-muted-foreground">Test completato:</span>
                  <br />
                  {profile.test_completed ? '✅ Sì' : '❌ No'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="personality" className="space-y-6">
          <TabsList className="w-full flex overflow-x-auto md:grid md:grid-cols-5 gap-1 md:gap-0 p-1">
            <TabsTrigger value="personality" className="flex-shrink-0 text-xs md:text-sm px-2 md:px-3">Personalità</TabsTrigger>
            <TabsTrigger value="progression" className="flex-shrink-0 text-xs md:text-sm px-2 md:px-3">Progressione</TabsTrigger>
            <TabsTrigger value="achievements" className="flex-shrink-0 text-xs md:text-sm px-2 md:px-3">Obiettivi</TabsTrigger>
            <TabsTrigger value="inventory" className="flex-shrink-0 text-xs md:text-sm px-2 md:px-3">Inventario</TabsTrigger>
            <TabsTrigger value="history" className="flex-shrink-0 text-xs md:text-sm px-2 md:px-3">Storia</TabsTrigger>
          </TabsList>

          <TabsContent value="personality" className="space-y-6">
            {/* Archetype Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Composizione Personalità
                </CardTitle>
                <CardDescription>
                  La tua personalità è una combinazione unica di diversi archetipi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { 
                        name: 'Visionario', 
                        value: profile.visionario_percentage, 
                        emoji: '🔮', 
                        key: 'visionario',
                        influence: 'Aumenta la creatività e la capacità di vedere opportunità future. Migliora la pianificazione a lungo termine.',
                        traits: ['Immaginazione', 'Intuizione', 'Visione strategica']
                      },
                      { 
                        name: 'Costruttore', 
                        value: profile.costruttore_percentage, 
                        emoji: '🔨', 
                        key: 'costruttore',
                        influence: 'Potenzia l\'organizzazione e l\'efficienza nell\'esecuzione. Migliora la gestione dei task pratici.',
                        traits: ['Organizzazione', 'Pragmatismo', 'Risultati concreti']
                      },
                      { 
                        name: 'Sognatore', 
                        value: profile.sognatore_percentage, 
                        emoji: '💭', 
                        key: 'sognatore',
                        influence: 'Stimola la creatività artistica e l\'empatia. Favorisce l\'ispirazione e l\'innovazione.',
                        traits: ['Creatività', 'Sensibilità', 'Immaginazione']
                      },
                      { 
                        name: 'Silenzioso', 
                        value: profile.silenzioso_percentage, 
                        emoji: '🤫', 
                        key: 'silenzioso',
                        influence: 'Migliora la riflessione profonda e l\'attenzione ai dettagli. Favorisce l\'ascolto attivo.',
                        traits: ['Riflessione', 'Osservazione', 'Profondità']
                      },
                      { 
                        name: 'Combattente', 
                        value: profile.combattente_percentage, 
                        emoji: '⚔️', 
                        key: 'combattente',
                        influence: 'Aumenta la determinazione e la resistenza alle difficoltà. Potenzia la leadership.',
                        traits: ['Determinazione', 'Coraggio', 'Leadership']
                      }
                    ].map((archetype) => {
                      const isDominant = profile.dominant_archetype === archetype.key;
                      const percentage = archetype.value || 0;
                      
                      return (
                        <div 
                          key={archetype.name} 
                          className={`p-4 rounded-lg border space-y-3 ${
                            isDominant ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/20' : 'bg-muted/30'
                          }`}
                        >
                          <div className="text-center space-y-2">
                            <div className="text-3xl">{archetype.emoji}</div>
                            <div className="font-semibold">{archetype.name}</div>
                            <div className="text-2xl font-bold text-primary">{percentage}%</div>
                            {isDominant && (
                              <Badge variant="default" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Dominante
                              </Badge>
                            )}
                            <Progress value={percentage} className="h-2" />
                          </div>
                          
                          {percentage > 0 && (
                            <div className="space-y-2 text-left">
                              <div className="text-xs text-muted-foreground">
                                <strong>Influenza:</strong> {archetype.influence}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {archetype.traits.map((trait) => (
                                  <Badge key={trait} variant="outline" className="text-xs">
                                    {trait}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Archetype Synergy */}
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Sinergia degli Archetipi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        La combinazione dei tuoi archetipi crea un profilo unico che influenza il tuo approccio ai task e alle sfide:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="bg-white/50 p-3 rounded border">
                          <div className="font-medium text-green-700 mb-1">🎯 Punti di Forza</div>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            {profile.dominant_archetype === 'visionario' && <li>• Eccellente nella pianificazione strategica</li>}
                            {profile.dominant_archetype === 'costruttore' && <li>• Ottima esecuzione e organizzazione</li>}
                            {profile.dominant_archetype === 'sognatore' && <li>• Grande creatività e innovazione</li>}
                            {profile.dominant_archetype === 'silenzioso' && <li>• Profonda riflessione e analisi</li>}
                            {profile.dominant_archetype === 'combattente' && <li>• Forte determinazione e leadership</li>}
                            <li>• Approccio bilanciato grazie agli archetipi secondari</li>
                            <li>• Flessibilità nell'adattarsi a diverse situazioni</li>
                          </ul>
                        </div>
                        <div className="bg-white/50 p-3 rounded border">
                          <div className="font-medium text-orange-700 mb-1">⚡ Aree di Crescita</div>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            {(profile.costruttore_percentage || 0) < 20 && <li>• Sviluppare maggiore organizzazione</li>}
                            {(profile.visionario_percentage || 0) < 20 && <li>• Migliorare la visione a lungo termine</li>}
                            {(profile.sognatore_percentage || 0) < 20 && <li>• Coltivare la creatività</li>}
                            {(profile.silenzioso_percentage || 0) < 20 && <li>• Praticare la riflessione profonda</li>}
                            {(profile.combattente_percentage || 0) < 20 && <li>• Aumentare la determinazione</li>}
                            <li>• Bilanciare gli aspetti ombra degli archetipi dominanti</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progression" className="space-y-6">
            {/* Level Progression */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Progressione Livelli
                </CardTitle>
                <CardDescription>
                  I tuoi progressi attraverso i livelli del tuo archetipo dominante
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Current Level Highlight */}
                  {currentArchetypeLevel && (
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border-2 border-primary/30">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                          {currentLevel}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{currentArchetypeLevel.level_name}</h3>
                          <p className="text-sm text-muted-foreground">Livello Attuale - {currentArchetypeLevel.xp_required} XP</p>
                          <p className="text-sm mt-1">{currentArchetypeLevel.description}</p>
                        </div>
                        <Badge variant="default" className="ml-auto">
                          <Crown className="w-4 h-4 mr-1" />
                          Attuale
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white/50 p-3 rounded border">
                          <div className="font-medium text-green-700 mb-1">🌟 Qualità Emergente</div>
                          <p className="text-muted-foreground">{currentArchetypeLevel.emerging_quality}</p>
                        </div>
                        <div className="bg-white/50 p-3 rounded border">
                          <div className="font-medium text-red-700 mb-1">🌑 Aspetto Ombra</div>
                          <p className="text-muted-foreground">{currentArchetypeLevel.shadow_aspect}</p>
                        </div>
                        <div className="bg-white/50 p-3 rounded border">
                          <div className="font-medium text-purple-700 mb-1">🔮 Oggetto Immaginale</div>
                          <p className="text-muted-foreground">{currentArchetypeLevel.imaginal_object_name}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Complete Level Progression */}
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Progressione Completa - {getArchetypeEmoji(profile.dominant_archetype)} {getArchetypeDescription(profile.dominant_archetype)}
                    </h4>
                    <div className="space-y-3">
                      {archetypeLevels
                        .filter(level => level.archetype === profile.dominant_archetype)
                        .sort((a, b) => a.level_number - b.level_number)
                        .map((level) => {
                          const isUnlocked = level.level_number <= currentLevel;
                          const isCurrent = level.level_number === currentLevel;
                          const isNext = level.level_number === currentLevel + 1;
                          
                          return (
                            <div 
                              key={level.id}
                              className={`p-4 rounded-lg border space-y-3 transition-all ${
                                isCurrent 
                                  ? 'bg-primary/5 border-primary/50 shadow-md' 
                                  : isUnlocked 
                                    ? 'bg-green-50 border-green-200' 
                                    : isNext
                                      ? 'bg-blue-50 border-blue-200'
                                      : 'bg-muted/30 border-muted opacity-75'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                    isCurrent 
                                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' 
                                      : isUnlocked 
                                        ? 'bg-green-500 text-white' 
                                        : isNext
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {isUnlocked ? (
                                      <CheckCircle className="w-5 h-5" />
                                    ) : isNext ? (
                                      <Target className="w-5 h-5" />
                                    ) : (
                                      <Lock className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-semibold flex items-center gap-2">
                                      Livello {level.level_number}: {level.level_name}
                                      {isCurrent && <Badge variant="default" className="text-xs"><Sparkles className="w-3 h-3 mr-1" />Attuale</Badge>}
                                      {isNext && <Badge variant="outline" className="text-xs">Prossimo</Badge>}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {level.xp_required} XP richiesti
                                      {isNext && totalXP > 0 && (
                                        <span className="ml-2 text-blue-600">
                                          (mancano {level.xp_required - totalXP} XP)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {isUnlocked && (
                                    <div className="text-green-600 text-sm font-medium">✓ Sbloccato</div>
                                  )}
                                  {!isUnlocked && !isNext && (
                                    <div className="text-muted-foreground text-sm">🔒 Bloccato</div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-sm text-muted-foreground mb-3">
                                {level.description}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div className={`p-2 rounded border ${
                                  isUnlocked ? 'bg-green-50 border-green-200' : 'bg-muted/50'
                                }`}>
                                  <div className="font-medium text-green-700 mb-1">🌟 Qualità Emergente</div>
                                  <p className={isUnlocked ? 'text-foreground' : 'text-muted-foreground'}>
                                    {level.emerging_quality}
                                  </p>
                                </div>
                                <div className={`p-2 rounded border ${
                                  isUnlocked ? 'bg-red-50 border-red-200' : 'bg-muted/50'
                                }`}>
                                  <div className="font-medium text-red-700 mb-1">🌑 Aspetto Ombra</div>
                                  <p className={isUnlocked ? 'text-foreground' : 'text-muted-foreground'}>
                                    {level.shadow_aspect}
                                  </p>
                                </div>
                                <div className={`p-2 rounded border ${
                                  isUnlocked ? 'bg-purple-50 border-purple-200' : 'bg-muted/50'
                                }`}>
                                  <div className="font-medium text-purple-700 mb-1">🔮 Oggetto Immaginale</div>
                                  <p className={isUnlocked ? 'text-foreground' : 'text-muted-foreground'}>
                                    {level.imaginal_object_name}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            {/* Achievements/Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Obiettivi e Traguardi
                </CardTitle>
                <CardDescription>
                  I tuoi progressi e obiettivi raggiunti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Task Completion Milestones */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Traguardi Task</h4>
                    {[
                      { milestone: 10, icon: '🥉', title: 'Primo Passo' },
                      { milestone: 25, icon: '🥈', title: 'In Movimento' },
                      { milestone: 50, icon: '🥇', title: 'Produttivo' },
                      { milestone: 100, icon: '🏆', title: 'Maestro' },
                      { milestone: 250, icon: '👑', title: 'Leggenda' }
                    ].map((achievement) => {
                      const completed = (taskStats?.total_completed || 0) >= achievement.milestone;
                      return (
                        <div 
                          key={achievement.milestone}
                          className={`flex items-center gap-3 p-2 rounded ${
                            completed ? 'bg-green-50 border border-green-200' : 'bg-muted/30'
                          }`}
                        >
                          <span className="text-2xl">{achievement.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium">{achievement.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {achievement.milestone} task completati
                            </div>
                          </div>
                          {completed && <Badge variant="outline" className="text-green-600">✓</Badge>}
                        </div>
                      );
                    })}
                  </div>

                  {/* XP Milestones */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Traguardi XP</h4>
                    {[
                      { milestone: 100, icon: '⭐', title: 'Primo Livello' },
                      { milestone: 500, icon: '🌟', title: 'Esperto' },
                      { milestone: 1000, icon: '💫', title: 'Veterano' },
                      { milestone: 2500, icon: '✨', title: 'Campione' },
                      { milestone: 5000, icon: '🌠', title: 'Leggenda' }
                    ].map((achievement) => {
                      const completed = totalXP >= achievement.milestone;
                      return (
                        <div 
                          key={achievement.milestone}
                          className={`flex items-center gap-3 p-2 rounded ${
                            completed ? 'bg-blue-50 border border-blue-200' : 'bg-muted/30'
                          }`}
                        >
                          <span className="text-2xl">{achievement.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium">{achievement.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {achievement.milestone} XP totali
                            </div>
                          </div>
                          {completed && <Badge variant="outline" className="text-blue-600">✓</Badge>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {/* XP History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Storia XP Recente
                </CardTitle>
                <CardDescription>
                  Le tue ultime attività che hanno generato esperienza
                </CardDescription>
              </CardHeader>
              <CardContent>
                {xpTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {xpTransactions.map((transaction) => (
                      <div 
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString('it-IT')}
                          </div>
                        </div>
                        <Badge 
                          variant={transaction.amount > 0 ? "default" : "destructive"}
                          className="ml-3"
                        >
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nessuna transazione XP trovata</p>
                    <p className="text-sm">Completa alcuni task per iniziare a guadagnare esperienza!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <InventorySystem />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CharacterSheet;