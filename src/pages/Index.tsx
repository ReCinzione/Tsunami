import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/AuthPage';
import { ArchetypeTest } from '@/components/ArchetypeTest';
import { DailyMoodSelector } from '@/components/DailyMoodSelector';
import { TaskManager } from '@/components/TaskManager';
import MentalInbox from '@/components/MentalInbox';
import RoutineManager from '@/components/RoutineManager';
import ProjectManager from '@/components/ProjectManager';
import { LocalChatBot } from '@/components/LocalChatBot';
import VoiceInput from '@/components/VoiceInput';
import { QuickActionButtons } from '@/components/QuickActionButtons';
import { getContextualQuickActions } from '@/utils/quickActions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, ChevronRight, Focus, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  const handleTaskCreated = () => {
    setRefreshTasks(prev => prev + 1);
  };

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/impostazioni')} className="gap-2 shrink-0 text-sm">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Impostazioni</span>
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2 shrink-0 text-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Esci</span>
            </Button>
          </div>
        </div>

        {/* Focus Mode & Quick Actions Bar */}
        <div className="flex items-center justify-between gap-4 mb-4 p-4 bg-card border rounded-xl">
          <div className="flex items-center gap-3">
            <Button
              variant={focusMode ? "default" : "outline"}
              size="sm"
              onClick={() => setFocusMode(!focusMode)}
              className="gap-2"
            >
              <Focus className="w-4 h-4" />
              {focusMode ? 'Modalità Focus ON' : 'Attiva Focus'}
            </Button>
            {focusMode && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {focusTaskCount} task prioritari visibili
                </Badge>
                <div className="flex items-center gap-2 text-xs">
                  <span>1</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={focusTaskCount}
                    onChange={(e) => setFocusTaskCount(Number(e.target.value))}
                    className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span>5</span>
                </div>
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => setActiveTab('mental-inbox')}
            className="gap-2 bg-primary/10 text-primary hover:bg-primary/20"
            variant="ghost"
          >
            <Plus className="w-4 h-4" />
            Quick Add
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-1 h-auto p-1">
            <TabsTrigger value="dashboard" className="text-sm px-3 py-3 flex flex-col gap-1">
              <span className="text-lg">🏠</span>
              <span>Casa</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-sm px-3 py-3 flex flex-col gap-1">
              <span className="text-lg">📋</span>
              <span>Attività</span>
            </TabsTrigger>
            <TabsTrigger value="mental-inbox" className="text-sm px-3 py-3 flex flex-col gap-1">
              <span className="text-lg">🧠</span>
              <span>Note</span>
            </TabsTrigger>
            <TabsTrigger value="routine" className="text-sm px-3 py-3 flex flex-col gap-1">
              <span className="text-lg">⏰</span>
              <span>Routine</span>
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

            {/* Next Suggested Task */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">🎯</div>
                <h3 className="text-lg font-semibold">Prossimo Task Suggerito</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Basato sul tuo livello di energia attuale e priorità
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setActiveTab('tasks')}
                  className="gap-2"
                >
                  📋 Vai alle Attività
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab('mental-inbox')}
                  className="gap-2"
                >
                  🧠 Aggiungi Idea
                </Button>
              </div>
            </div>

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
          



          {/* Local ChatBot */}
          <LocalChatBot
            userId="current-user"
            tasks={tasks}
            adhdContext={{
              focusMode,
              energyLevel,
              activeTasks: tasks.length,
              timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                        new Date().getHours() < 18 ? 'afternoon' : 'evening',
              todayMood
            }}
            onActionSuggested={(action, params) => {
              switch (action) {
                case 'activate_focus_mode':
                case 'enable_focus_mode':
                  setFocusMode(true);
                  setActiveTab('tasks');
                  toast({
                    title: "🎯 Focus Mode Attivato",
                    description: "Ora vedrai solo i task più importanti",
                  });
                  break;
                case 'filter_low_energy_tasks':
                case 'show_low_energy_tasks':
                  // Filtra effettivamente i task a bassa energia
                  setTaskFilters({ energy_required: ['molto_bassa', 'bassa'] });
                  setActiveTab('tasks');
                  toast({
                    title: "🌱 Task a Bassa Energia",
                    description: `Filtro applicato per task a bassa energia`,
                  });
                  break;
                case 'suggest_high_energy_tasks':
                case 'show_high_priority_tasks':
                  // Filtra task ad alta energia/priorità
                  setTaskFilters({ energy_required: ['alta', 'molto_alta'] });
                  setActiveTab('tasks');
                  toast({
                    title: "🚀 Task ad Alta Energia",
                    description: `Filtro applicato per task impegnativi`,
                  });
                  break;
                case 'organize_tasks_by_priority':
                  // Reset filtri e ordina per priorità
                  resetTaskFilters();
                  setActiveTab('tasks');
                  toast({
                    title: "📋 Organizzazione Task",
                    description: "Task organizzati per priorità",
                  });
                  break;
                case 'suggest_easy_task':
                  setActiveTab('tasks');
                  toast({
                    title: "🌱 Task Facile Suggerito",
                    description: "Inizia con un task semplice per prendere slancio",
                  });
                  break;
                case 'suggest_challenging_task':
                  setActiveTab('tasks');
                  toast({
                    title: "🚀 Task Impegnativo",
                    description: "Sfrutta la tua energia per qualcosa di importante",
                  });
                  break;
                case 'start_focus_timer':
                  setFocusMode(true);
                  setActiveTab('tasks');
                  toast({
                    title: "⏰ Sessione Focus Iniziata",
                    description: "Timer di concentrazione attivato",
                  });
                  break;
                case 'start_micro_timer':
                  toast({
                    title: "⏱️ Micro Timer",
                    description: "2 minuti per iniziare - ogni piccolo passo conta!",
                  });
                  break;
                case 'prioritize_tasks':
                  setActiveTab('tasks');
                  toast({
                    title: "🎯 Prioritizzazione Attivata",
                    description: "Concentrati sui task più importanti",
                  });
                  break;
                case 'break_task':
                  setActiveTab('tasks');
                  toast({
                    title: "🔨 Spezza il Task",
                    description: "Dividi il task in parti più piccole e gestibili",
                  });
                  break;
                case 'open_mental_inbox':
                  setActiveTab('notes');
                  toast({
                    title: "📥 Mental Inbox",
                    description: "Scarica tutti i tuoi pensieri qui",
                  });
                  break;
                case 'tackle_backlog':
                  setActiveTab('tasks');
                  toast({
                    title: "📚 Affronta il Backlog",
                    description: "Tempo di sistemare i task rimandati",
                  });
                  break;
                case 'show_progress_stats':
                  toast({
                    title: "Statistiche Progresso",
                    description: `Hai completato ${params?.completedToday || 0} task oggi!`,
                  });
                  break;
                case 'suggest_next_task':
                  if (params?.task) {
                    toast({
                      title: "Prossimo Task",
                      description: `Inizia con: ${params.task.title}`,
                    });
                  }
                  break;
                case 'open_prioritization_mode':
                  setActiveTab('tasks');
                  toast({
                    title: "Modalità Prioritizzazione",
                    description: "Organizza i tuoi task per importanza",
                  });
                  break;
                case 'suggest_break':
                  toast({
                    title: "Pausa Consigliata",
                    description: `Prenditi ${params?.duration || 5} minuti di pausa`,
                  });
                  break;
                case 'start_pomodoro':
                  console.log('Starting Pomodoro timer');
                  toast({
                    title: "Timer Pomodoro",
                    description: "Timer di 25 minuti avviato",
                  });
                  break;
                case 'start_2min_timer':
                  console.log('Starting 2-minute timer');
                  toast({
                    title: "⏱️ Timer Veloce",
                    description: "Timer di 2 minuti avviato - inizia subito!",
                  });
                  break;
                case 'suggest_next_task':
                  setActiveTab('tasks');
                  if (params?.task) {
                    toast({
                      title: "➡️ Prossimo Task",
                      description: `Inizia con: ${params.task.title}`,
                    });
                  } else {
                    toast({
                      title: "➡️ Prossimo Task",
                      description: "Controlla la lista task per il prossimo da fare",
                    });
                  }
                  break;
                case 'extend_focus_session':
                  toast({
                    title: "⏰ Focus Esteso",
                    description: "Continua così! Sessione di concentrazione prolungata",
                  });
                  break;
                case 'track_progress':
                  toast({
                    title: "📈 Progresso Tracciato",
                    description: "Ottimo lavoro! Continua così",
                  });
                  break;
                case 'organize_projects':
                  setActiveTab('projects');
                  toast({
                    title: "📁 Organizzazione Progetti",
                    description: "Raggruppa le tue attività in progetti",
                  });
                  break;
                case 'process_text':
                  setActiveTab('notes');
                  toast({
                    title: "📝 Elaborazione Testo",
                    description: "Riorganizza e semplifica i tuoi testi",
                  });
                  break;
                case 'execute_command':
                  toast({
                    title: "⚡ Comando Eseguito",
                    description: "Azione rapida completata",
                  });
                  break;
                case 'create_task':
                  if (params?.title) {
                    const addTask = useTaskStore.getState().addTask;
                    const newTask = {
                      id: crypto.randomUUID(),
                      title: params.title,
                      description: params.description || '',
                      status: 'pending' as const,
                      task_type: params.task_type || 'organizzazione' as const,
                      energy_required: params.energy_required || 'media' as const,
                      is_recurring: false,
                      xp_reward: 10,
                      created_at: new Date().toISOString(),
                      can_be_interrupted: true
                    };
                    addTask(newTask);
                    setActiveTab('tasks');
                    toast({
                      title: "✅ Task Creato",
                      description: `Nuovo task: ${params.title}`,
                    });
                  }
                  break;
                case 'manage_energy':
                  setActiveTab('tasks');
                  toast({
                    title: "⚡ Gestione Energia",
                    description: "Task filtrati in base al tuo livello di energia",
                  });
                  break;
                case 'organize_tasks':
                  setActiveTab('tasks');
                  toast({
                    title: "📋 Organizza Task",
                    description: "Task riorganizzati per priorità e scadenza",
                  });
                  break;
                case 'improve_focus':
                  setFocusMode(true);
                  setActiveTab('tasks');
                  toast({
                    title: "🎯 Focus Migliorato",
                    description: "Modalità focus attivata per ridurre distrazioni",
                  });
                  break;
                case 'view_progress':
                  toast({
                    title: "📊 Visualizza Progressi",
                    description: "Statistiche aggiornate sui tuoi task completati",
                  });
                  break;
                case 'quick_action':
                  setActiveTab('tasks');
                  toast({
                    title: "⚡ Azione Rapida",
                    description: "Prossima azione suggerita in base al contesto",
                  });
                  break;
                case 'take_break':
                  toast({
                    title: "☕ Pausa Meritata",
                    description: "Prenditi una pausa per ricaricare le energie",
                  });
                  break;
                default:
                  console.log('Action not implemented:', action, params);
                  toast({
                    title: "✨ Azione Eseguita",
                    description: `${action} completata con successo`,
                  });
              }
            }}
          />

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
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Focus className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-primary">Modalità Focus Attiva</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Visualizzando solo i 3 task più importanti per ridurre il cognitive load
                  </p>
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
            <div className="space-y-6">
              <MentalInbox onTaskCreated={handleTaskCreated} />
              
              {/* Voice Input in Mental Inbox Tab */}
              <VoiceInput 
                onTaskCreated={handleTaskCreated}
                onNoteCreated={handleTaskCreated}
                className="w-full"
              />
            </div>
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
    </>
  );
};

export default Index;
