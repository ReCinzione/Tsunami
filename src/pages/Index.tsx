import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/AuthPage';
import { ArchetypeTest } from '@/components/ArchetypeTest';
import { DailyMoodSelector } from '@/components/DailyMoodSelector';
import { TaskManager } from '@/components/TaskManager';
import MentalInbox from '@/components/MentalInbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AppContent = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [todayMood, setTodayMood] = useState<any>(null);
  const [archetypeLevels, setArchetypeLevels] = useState<any[]>([]);
  const [refreshTasks, setRefreshTasks] = useState(0);
  const { toast } = useToast();

  const handleTaskCreated = () => {
    setRefreshTasks(prev => prev + 1);
  };

  useEffect(() => {
    if (user) {
      loadUserProfile();
      checkTodayMood();
      loadArchetypeLevels();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile caricare il profilo",
        variant: "destructive"
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const checkTodayMood = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_moods')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setTodayMood(data);
    } catch (error: any) {
      console.error('Error checking today mood:', error);
    }
  };

  const loadArchetypeLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('archetype_levels')
        .select('*')
        .eq('archetype', profile?.dominant_archetype)
        .order('level_number');

      if (error) throw error;
      setArchetypeLevels(data || []);
    } catch (error) {
      console.error('Error loading archetype levels:', error);
    }
  };

  const getArchetypeDescription = (archetype: string) => {
    const descriptions: { [key: string]: string } = {
      visionario: "Traccia mappe simboliche e guarda oltre l'orizzonte. Vive di visioni e di traiettorie non ancora disegnate.",
      costruttore: "Plasma il reale attraverso azione e volontà. Trasforma le idee in forma concreta step by step.",
      sognatore: "Nutre il mondo interiore di immagini e possibilità. Crea spazi di bellezza e immaginazione.",
      silenzioso: "Osserva, ascolta, comprende. Si muove con attenzione sottile e presenza silenziosa.",
      combattente: "Affronta le sfide con energia e determinazione. Lotta per ciò che considera giusto e importante."
    };
    return descriptions[archetype] || "";
  };

  const handleTestComplete = (results: any) => {
    setProfile(prev => ({
      ...prev,
      test_completed: true,
      dominant_archetype: results.dominantArchetype
    }));
  };

  const handleMoodSelect = async (mood: string, ritual: string) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('daily_moods')
        .insert({
          user_id: user.id,
          mood: mood as any,
          suggested_ritual: ritual,
          date: today
        });

      if (error) throw error;

      setTodayMood({ mood, suggested_ritual: ritual, date: today });
      
      toast({
        title: "Stato emotivo registrato",
        description: `Rituale per oggi: ${ritual}`
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile salvare lo stato emotivo",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout effettuato",
        description: "Ci vediamo presto!"
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Errore durante il logout",
        variant: "destructive"
      });
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!profile?.test_completed) {
    return <ArchetypeTest onTestComplete={handleTestComplete} />;
  }

  if (!todayMood) {
    return <DailyMoodSelector onMoodSelect={handleMoodSelect} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">
              Il tuo spazio personale
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
              Tipo di personalità: <span className="text-primary font-semibold capitalize">{profile?.dominant_archetype}</span>
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 shrink-0 text-sm">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Esci</span>
          </Button>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 gap-1 h-auto p-1">
            <TabsTrigger value="dashboard" className="text-xs px-2 py-2 md:text-sm">
              <span className="hidden sm:inline">🏠 </span>Casa
            </TabsTrigger>
            <TabsTrigger value="character" className="text-xs px-2 py-2 md:text-sm">
              <span className="hidden sm:inline">👤 </span>Profilo
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs px-2 py-2 md:text-sm">
              <span className="hidden sm:inline">📋 </span>Attività
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs px-2 py-2 md:text-sm">
              <span className="hidden sm:inline">✅ </span>Fatte
            </TabsTrigger>
            <TabsTrigger value="mental-inbox" className="text-xs px-2 py-2 md:text-sm">
              <span className="hidden sm:inline">🧠 </span>Note
            </TabsTrigger>
            <TabsTrigger value="routine" className="text-xs px-2 py-2 md:text-sm">
              <span className="hidden sm:inline">⏰ </span>Routine
            </TabsTrigger>
            <TabsTrigger value="personality" className="text-xs px-2 py-2 md:text-sm">
              <span className="hidden sm:inline">🔮 </span>Personalità
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Today's Mood Card */}
            <div className="bg-card border rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">
                  {todayMood?.mood === 'disorientato' ? '🌀' : 
                   todayMood?.mood === 'congelato' ? '❄️' :
                   todayMood?.mood === 'in_flusso' ? '🌊' :
                   todayMood?.mood === 'ispirato' ? '✨' : '🎭'}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold capitalize">
                    {todayMood?.mood?.replace('_', ' ')}
                  </h2>
                  <p className="text-muted-foreground">Il tuo stato di oggi</p>
                </div>
              </div>
              <div className="bg-primary/10 rounded-lg p-4">
                <h3 className="font-semibold mb-2">🎯 Rituale suggerito:</h3>
                <p className="text-foreground">{todayMood?.suggested_ritual}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">{profile?.current_level}</div>
                <div className="text-sm text-muted-foreground">Livello Attuale</div>
              </div>
              <div className="bg-card border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">{profile?.total_xp}</div>
                <div className="text-sm text-muted-foreground">XP Totali</div>
              </div>
              <div className="bg-card border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary capitalize">{profile?.dominant_archetype}</div>
                <div className="text-sm text-muted-foreground">Tipo Dominante</div>
              </div>
            </div>
          </TabsContent>
          

          <TabsContent value="character" className="space-y-6 mt-6">
            {/* Dominant Archetype Description */}
            <div className="bg-card border rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Il tuo Tipo di Personalità</h3>
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">
                  {profile?.dominant_archetype === 'visionario' ? '🔮' :
                   profile?.dominant_archetype === 'costruttore' ? '🔨' :
                   profile?.dominant_archetype === 'sognatore' ? '💭' :
                   profile?.dominant_archetype === 'silenzioso' ? '🤫' :
                   profile?.dominant_archetype === 'combattente' ? '⚔️' : '✨'}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold capitalize mb-2">
                    {profile?.dominant_archetype}
                  </h4>
                  <p className="text-muted-foreground">
                    {getArchetypeDescription(profile?.dominant_archetype)}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/personalita')}
                className="w-full gap-2"
              >
                Esplora tutti i Tipi di Personalità <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Archetype Breakdown */}
            <div className="bg-card border rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">La tua composizione di personalità</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { name: 'Visionario', value: profile?.visionario_percentage, emoji: '🔮' },
                  { name: 'Costruttore', value: profile?.costruttore_percentage, emoji: '🔨' },
                  { name: 'Sognatore', value: profile?.sognatore_percentage, emoji: '💭' },
                  { name: 'Silenzioso', value: profile?.silenzioso_percentage, emoji: '🤫' },
                  { name: 'Combattente', value: profile?.combattente_percentage, emoji: '⚔️' }
                ].map((archetype) => (
                  <div key={archetype.name} className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl mb-1">{archetype.emoji}</div>
                    <div className="font-semibold">{archetype.name}</div>
                    <div className="text-xl text-primary">{archetype.value}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Archetype Levels */}
            <div className="bg-card border rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Livelli della tua Personalità</h3>
              <div className="space-y-3">
                {archetypeLevels.map((level) => (
                  <div 
                    key={level.id} 
                    className={`border rounded-lg p-4 ${
                      level.level_number <= (profile?.current_level || 1) 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-muted/30 border-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={level.level_number <= (profile?.current_level || 1) ? "default" : "secondary"}
                        >
                          Livello {level.level_number}
                        </Badge>
                        <h5 className="font-semibold">{level.level_name}</h5>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {level.xp_required} XP
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {level.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="text-xs">
                        <span className="font-medium text-green-600">Qualità: </span>
                        <span className="text-muted-foreground">{level.emerging_quality}</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium text-red-600">Ombra: </span>
                        <span className="text-muted-foreground">{level.shadow_aspect}</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium text-purple-600">Oggetto: </span>
                        <span className="text-muted-foreground">{level.imaginal_object_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Level Progress */}
            <div className="bg-card border rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Progressione</h3>
              <div className="flex items-center justify-between mb-2">
                <span>Livello {profile?.current_level}</span>
                <span>{profile?.total_xp} XP</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((profile?.total_xp || 0) / 100 * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Continua il tuo viaggio per sbloccare nuovi livelli
              </p>
            </div>

            {/* Character Info */}
            <div className="bg-card border rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Informazioni Personaggio</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nome utente:</span>
                  <span className="font-medium">{profile?.display_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Test completato:</span>
                  <span className="font-medium">{profile?.test_completed ? '✅ Sì' : '❌ No'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data registrazione:</span>
                  <span className="font-medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('it-IT') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <TaskManager userId={user.id} showCompleted={false} key={`tasks-${refreshTasks}`} />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <TaskManager userId={user.id} showCompleted={true} key={`completed-${refreshTasks}`} />
          </TabsContent>

          <TabsContent value="mental-inbox" className="mt-6">
            <MentalInbox onTaskCreated={handleTaskCreated} />
          </TabsContent>

          <TabsContent value="archetypes" className="mt-6">
            <div className="bg-card border rounded-xl p-6 shadow-lg text-center">
              <h3 className="text-xl font-semibold mb-4">Esplora il Mondo degli Archetipi</h3>
              <p className="text-muted-foreground mb-6">
                Scopri tutti gli archetipi, i loro livelli e le trasformazioni che accompagnano il viaggio interiore.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/archetipi')} size="lg" className="gap-2">
                  🔮 Archetipi <ChevronRight className="w-4 h-4" />
                </Button>
                <Button onClick={() => navigate('/progetti')} size="lg" className="gap-2" variant="outline">
                  💡 Progetti <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
};

export default Index;
