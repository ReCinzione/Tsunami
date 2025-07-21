import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/AuthPage';
import { ArchetypeTest } from '@/components/ArchetypeTest';
import { DailyMoodSelector } from '@/components/DailyMoodSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

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
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">
          Dashboard - {profile?.dominant_archetype}
        </h1>
        <div className="bg-muted/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Stato di oggi: {todayMood.mood}</h2>
          <p className="text-muted-foreground">
            Rituale: {todayMood.suggested_ritual}
          </p>
        </div>
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
