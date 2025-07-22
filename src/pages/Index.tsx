import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/AuthPage';
import { ArchetypeTest } from '@/components/ArchetypeTest';
import { DailyMoodSelector } from '@/components/DailyMoodSelector';
import { TaskManager } from '@/components/TaskManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [todayMood, setTodayMood] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserProfile();
      checkTodayMood();
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
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold gradient-text">
            Il tuo universo personale
          </h1>
          <p className="text-xl text-muted-foreground">
            Archetipo dominante: <span className="text-primary font-semibold">{profile?.dominant_archetype}</span>
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">🏠 Dashboard</TabsTrigger>
            <TabsTrigger value="tasks">📋 Task</TabsTrigger>
            <TabsTrigger value="mental-inbox">🧠 Mental Inbox</TabsTrigger>
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

            {/* Archetype Breakdown */}
            <div className="bg-card border rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">La tua composizione archetipica</h3>
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
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <TaskManager userId={user.id} />
          </TabsContent>

          <TabsContent value="mental-inbox" className="mt-6">
            <div className="bg-card border rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Mental Inbox</h3>
              <p className="text-muted-foreground">
                Il Mental Inbox sarà disponibile presto - uno spazio per catturare pensieri e idee rapide.
              </p>
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
