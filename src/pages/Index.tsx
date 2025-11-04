import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/AuthPage';
import { ArchetypeTest } from '@/components/ArchetypeTest';
import { DailyMoodSelector } from '@/components/DailyMoodSelector';
import { TaskManager } from '@/components/TaskManager';
import MentalInbox from '@/components/MentalInbox';
import RoutineManager from '@/components/RoutineManager';
import ProjectManager from '@/components/ProjectManager';

import { SmartActionSuggestion } from '@/components/SmartActionSuggestion';
import VoiceInput from '@/components/VoiceInput';
import { QuickActionButtons } from '@/components/QuickActionButtons';
import { getContextualQuickActions } from '@/utils/quickActions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Toaster } from '@/components/ui/toaster';
import { ADHDPomodoroTimer } from '@/components/ADHDPomodoroTimer';
import { ADHDNotificationContainer } from '@/components/ADHDNotification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tutorialSteps } from '@/components/InteractiveTutorial';
import { useTutorial } from '@/hooks/useTutorial';
import '@/styles/tutorial.css';
import { LogOut, User, ChevronRight, Focus, Plus, Settings, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { useTaskStore } from '@/store/taskStore';

const AppContent = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [todayMood, setTodayMood] = useState<any>(null);
  const [archetypeLevels, setArchetypeLevels] = useState<any[]>([]);
  const [refreshTasks, setRefreshTasks] = useState(0);
  const [showTasks, setShowTasks] = useState(false);
  const [showMentalInbox, setShowMentalInbox] = useState(false);
  const [showArchetypeTest, setShowArchetypeTest] = useState(false);
  // Usa focus mode dallo store invece dello stato locale
  const focusMode = useUIStore(state => state.focusMode);
  const setFocusMode = useUIStore(state => state.setFocusMode);
  
  // Integrazione con TaskStore per filtri chatbot
  const setTaskFilters = useTaskStore(state => state.setFilters);
  const resetTaskFilters = useTaskStore(state => state.resetFilters);
  const [focusTaskCount, setFocusTaskCount] = useState(3);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'dashboard';
    const saved = window.localStorage.getItem('activeTab');
    return saved || 'dashboard';
  });
  const [tasks, setTasks] = useState([]);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [showVoiceInput, setShowVoiceInput] = useState(false);

  // Setup Tutorial: avvio su richiesta
  const { startTutorial } = useTutorial(tutorialSteps);

  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const location = useLocation();

  const handleTaskCreated = () => {
    setRefreshTasks(prev => prev + 1);
  };

  // Persisti il tab attivo per evitare reset al primo caricamento
  useEffect(() => {
    try {
      window.localStorage.setItem('activeTab', activeTab);
    } catch {}
  }, [activeTab]);

  // Supporto deep-link: /inbox, ?tab=mental-inbox, #mental-inbox
  useEffect(() => {
    try {
      const path = location.pathname?.toLowerCase() || '';
      const params = new URLSearchParams(location.search || '');
      const hash = (location.hash || '').toLowerCase();

      if (path.includes('/inbox') || path.includes('/note')) {
        setActiveTab('mental-inbox');
        return;
      }
      const tabParam = params.get('tab');
      if (tabParam === 'mental-inbox' || hash === '#mental-inbox') {
        setActiveTab('mental-inbox');
      }
    } catch {}
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (user) {
      loadUserProfile();
      checkTodayMood();
      loadTasks();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [refreshTasks]);

  useEffect(() => {
    if (profile?.dominant_archetype) {
      loadArchetypeLevels();
    }
  }, [profile?.dominant_archetype]);

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
      handleError(error, {
        component: 'Index',
        action: 'load_profile',
        userId: user?.id
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const checkTodayMood = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_moods')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', todayString)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setTodayMood(data);
    } catch (error: any) {
      console.error('Error checking today mood:', error);
    }
  };

  const loadTasks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadArchetypeLevels = async () => {
    if (!profile?.dominant_archetype) return;
    
    try {
      const { data, error } = await supabase
        .from('archetype_levels')
        .select('*')
        .eq('archetype', profile.dominant_archetype)
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
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('daily_moods')
        .insert({
          user_id: user.id,
          mood: mood as any,
          suggested_ritual: ritual,
          date: todayString
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
        {/* Focus Mode & Quick Actions Bar */}
        <div className="mb-4 space-y-3">
          {/* Riga dei pulsanti principali */}
          <div className="flex items-center justify-between gap-2 p-3 sm:p-4 bg-card rounded-xl">
            <Button
              data-tutorial="focus-mode"
              className={`flex items-center gap-2 flex-1 h-auto py-2.5 px-4 rounded-xl font-semibold text-[#2E2E2E] bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0 shadow-[0_2px_6px_rgba(0,0,0,0.1)] transition-all duration-200 ${
                focusMode ? 'ring-2 ring-blue-300' : ''
              }`}
              onClick={() => {
                setFocusMode(!focusMode);
                if (!focusMode) {
                  setActiveTab('tasks');
                }
              }}
            >
              <Focus className="w-4 h-4" />
              <span className="hidden sm:inline">{focusMode ? '🎯 Focus Mode ON' : 'Attiva Focus'}</span>
              <span className="sm:hidden">{focusMode ? '🎯 Focus' : 'Focus'}</span>
            </Button>
            
            <Button 
               onClick={() => navigate('/impostazioni')} 
               aria-label="Impostazioni"
               className="flex items-center justify-center flex-1 h-auto py-2.5 px-4 rounded-xl font-semibold text-[#2E2E2E] bg-[#F9D57A] hover:bg-[#F7D066] border-0 shadow-[0_2px_6px_rgba(0,0,0,0.1)] transition-all duration-200"
             >
               <Settings className="w-5 h-5" />
             </Button>
             
             <Button 
               onClick={handleLogout} 
               className="flex items-center justify-center flex-1 h-auto py-2.5 px-4 rounded-xl font-semibold text-[#2E2E2E] bg-[#F5A5A5] hover:bg-[#F39191] border-0 shadow-[0_2px_6px_rgba(0,0,0,0.1)] transition-all duration-200"
             >
               <LogOut className="w-5 h-5" />
             </Button>
          </div>
          
          {/* Controlli modalità focus */}
          {focusMode && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 bg-muted/50 border rounded-xl">
              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                {focusTaskCount} task prioritari
              </Badge>
              <div className="flex items-center gap-2 text-xs">
                <span>1</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={focusTaskCount}
                  onChange={(e) => setFocusTaskCount(Number(e.target.value))}
                  className="w-16 sm:w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span>5</span>
              </div>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-1 h-auto p-1">
            <TabsTrigger value="dashboard" data-tutorial="tab-dashboard" className="text-sm px-3 py-3 flex flex-col gap-1">
              <span className="text-lg">🏠</span>
              <span>Casa</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" data-tutorial="tab-tasks" className="text-sm px-3 py-3 flex flex-col gap-1">
              <span className="text-lg">📋</span>
              <span>Attività</span>
            </TabsTrigger>
            <TabsTrigger value="mental-inbox" data-tutorial="tab-mental-inbox" className="text-sm px-3 py-3 flex flex-col gap-1">
              <span className="text-lg">🧠</span>
              <span>Note</span>
            </TabsTrigger>
            <TabsTrigger value="routine" data-tutorial="tab-routine" className="text-sm px-3 py-3 flex flex-col gap-1">
              <span className="text-lg">⏰</span>
              <span>Routine</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-tutorial="quick-stats">
              <div className="bg-card border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">{profile?.current_level}</div>
                <div className="text-sm text-muted-foreground">Livello Attuale</div>
              </div>
              <div className="bg-card border rounded-xl p-4 text-center" data-tutorial="xp-badge">
                <div className="text-2xl font-bold text-primary">{profile?.total_xp}</div>
                <div className="text-sm text-muted-foreground">XP Totali</div>
              </div>
              <div className="bg-card border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary capitalize">{profile?.dominant_archetype}</div>
                <div className="text-sm text-muted-foreground">Tipo Dominante</div>
              </div>
            </div>

            {/* Smart Action Suggestion */}
            <SmartActionSuggestion 
              mood={todayMood?.mood}
              suggestedRitual={todayMood?.suggested_ritual}
              onActionClick={(action) => {
                if (action === 'tasks') setActiveTab('tasks');
                else if (action === 'mental-inbox') setActiveTab('mental-inbox');
                else if (action === 'focus') setActiveTab('focus');
              }}
            />

            {/* Quick Access to Other Features */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/personalita')}
                className="h-20 flex flex-col gap-2"
              >
                <span className="text-2xl">🔮</span>
                <span>Esplora Personalità</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/progetti')}
                className="h-20 flex flex-col gap-2"
              >
                <span className="text-2xl">💡</span>
                <span>Gestisci Progetti</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/personaggio')}
                className="h-20 flex flex-col gap-2"
              >
                <span className="text-2xl">🎭</span>
                <span>Scheda Personaggio</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowVoiceInput(!showVoiceInput)}
                className="h-20 flex flex-col gap-2"
              >
                <span className="text-2xl">🎤</span>
                <span>Comando Vocale</span>
              </Button>
              {/* Trigger Tutorial Interattivo integrato */}
              <Button
                onClick={startTutorial}
                className="h-20 w-full justify-start gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
              >
                <span className="text-xl">📖</span>
                <span className="font-medium">Tutorial Interattivo</span>
              </Button>
            </div>
            
            {/* Voice Input Component */}
            {showVoiceInput && (
              <div className="mt-6">
                <VoiceInput 
                  onTaskCreated={handleTaskCreated}
                  onNoteCreated={handleTaskCreated}
                  className="w-full"
                />
              </div>
            )}

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
            <div className="space-y-4">
              {focusMode && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Focus className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-primary">Modalità Focus Attiva</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Visualizzando solo i {focusTaskCount} task più importanti per ridurre il cognitive load
                    </p>
                  </div>
                  
                  {/* Timer Pomodoro ADHD */}
                  <div className="flex justify-center">
                    <ADHDPomodoroTimer 
                      className="max-w-md"
                      autoStart={false}
                      onSessionComplete={(type) => {
                        if (type === 'work') {
                          // Refresh tasks dopo una sessione completata
                          setRefreshTasks(prev => prev + 1);
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              <TaskManager
                  userId={user.id}
                  showCompleted={false}
                  focusMode={focusMode}
                  focusTaskCount={focusTaskCount}
                  onProfileUpdate={loadUserProfile}
                  key={`tasks-${refreshTasks}-${focusMode}-${focusTaskCount}`}
                />
            </div>
          </TabsContent>

          <TabsContent value="mental-inbox" className="mt-6">
            <MentalInbox onTaskCreated={handleTaskCreated} />
          </TabsContent>

          <TabsContent value="routine" className="mt-6">
            <RoutineManager userId={user.id} />
          </TabsContent>


        </Tabs>


      </div>
    </div>
  );
};

const Index = () => {
  return (
    <>
      <AppContent />
      <Toaster />
      <ADHDNotificationContainer />
    </>
  );
};

export default Index;
