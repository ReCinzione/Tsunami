import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Zap, Focus, Timer, Brain, ChevronDown, X, Minimize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import new utility functions
import { enhanceResponseWithMoodContext, getMoodQuickActions } from '@/utils/moodEnhancements';
import { predictOptimalTasksWithMood, getMoodBasedStrategicSuggestion, getContextualSuggestions } from '@/utils/taskSuggestions';
import { generateContextualHelp, needsImmediateAction, getImmediateActionSuggestions, getQuickActionsForMood } from '@/utils/chatbotResponses';
import type { ChatMessage, ADHDContext, QuickAction } from '@/types/chatbot';
import type { Task, UserBehaviorPattern } from '@/types/adhd';
import QuickActionButtons from './QuickActionButtons';
import { getContextualQuickActions, getQuickActionResponse } from '@/utils/quickActions';
import { usePatternMining } from '@/hooks/usePatternMining';
import { createAIService, isAISupported } from '@/lib/AIService';

// Interfaces now imported from types files
interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  energy_required: 'molto_bassa' | 'bassa' | 'media' | 'alta' | 'molto_alta';
  created_at: string;
  updated_at: string;
}

interface LocalChatBotProps {
  userId: string;
  adhdContext?: ADHDContext;
  tasks?: Task[];
  onActionSuggested?: (action: string, params?: any) => void;
  onClose?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

// Interfaccia per il learning comportamentale
interface UserBehaviorPattern {
  preferredTaskTypes: string[];
  peakEnergyHours: number[];
  averageTaskDuration: number;
  procrastinationTriggers: string[];
  successfulStrategies: string[];
  completionRate: number;
}

// Database locale delle risposte
const CHATBOT_RESPONSES = {
  // Gestione Overwhelm
  overwhelm: [
    "Respira profondamente. Una cosa alla volta. Quale è il task più piccolo che puoi fare ora?",
    "Sento che ti senti sopraffatto. Proviamo a spezzare tutto in pezzi più piccoli?",
    "Overwhelm rilevato! Attivo la modalità Focus per mostrarti solo 3 task prioritari.",
    "Troppi task = paralisi decisionale. Nascondiamo tutto tranne i 3 più importanti. Focus Mode ON!",
    "Troppe opzioni possono bloccare. Riduciamo il carico cognitivo insieme."
  ],
  
  // Riorganizzazione Progetti
  project_organization: [
    "Ho analizzato le tue note e vedo dei pattern. Vuoi che organizzi tutto in progetti?",
    "Sembra che tu stia lavorando su temi simili. Creo dei progetti per raggrupparli?",
    "Ho trovato diverse note correlate. Le organizzo in un progetto?",
    "Rilevati task sparsi su un tema comune. Vuoi che crei un progetto dedicato?"
  ],
  
  // Rielaborazione Testi
  text_processing: [
    "Posso rielaborare questo testo per renderlo più chiaro e organizzato.",
    "Vuoi che estragga le azioni concrete da questo testo?",
    "Posso semplificare questo contenuto per renderlo più chiaro.",
    "Riorganizzo queste informazioni in una struttura più logica?"
  ],
  
  // Suggerimenti Proattivi Progetti
  project_suggestions: [
    "Ho notato diverse task su un tema comune. Vuoi creare un progetto?",
    "Hai diverse note su un argomento. Le raggruppo in un progetto?",
    "Pattern rilevato: stai lavorando su un'area specifica. Organizzo tutto insieme?"
  ],
  
  // Problemi di Focus
  focus: [
    "Difficoltà a concentrarti? Attivo il Focus Mode per eliminare le distrazioni.",
    "Prova la tecnica Pomodoro: 25 minuti di focus, poi 5 di pausa.",
    "Il tuo cervello ha bisogno di varietà. Cambiamo task per 10 minuti?"
  ],
  
  // Procrastinazione
  procrastination: [
    "Il perfetto è nemico del fatto. Inizia con 5 minuti, poi vedi come va.",
    "Procrastinazione? È normale. Quale è la parte più facile da cui iniziare?",
    "Timer di 2 minuti: fai solo l'inizio del task. Spesso è tutto quello che serve per sbloccarsi."
  ],
  
  // Energia Bassa
  energy_low: [
    "Energia bassa rilevata. Ecco alcuni task a bassa energia che puoi fare ora.",
    "Quando l'energia è bassa, fai le cose facili. Conserva l'energia per i task importanti.",
    "Pausa strategica? A volte 10 minuti di riposo ti danno più energia di 2 ore di lotta."
  ],
  
  // Energia Alta
  energy_high: [
    "Energia alta! È il momento perfetto per i task difficili. Quale vuoi affrontare?",
    "Hyperfocus mode attivato? Sfrutta questa energia per i progetti importanti!",
    "Momento perfetto per fare progressi significativi. Quale obiettivo vuoi raggiungere?"
  ],
  
  // Motivazione
  motivation: [
    "Ogni piccolo passo conta. Hai già fatto più di quanto pensi.",
    "Le sfide possono diventare punti di forza. La tua creatività è unica.",
    "Progresso > Perfezione. Celebra ogni vittoria, anche la più piccola."
  ],
  
  // Gestione del Tempo
  time_management: [
    "Usiamo timer visivi e promemoria per gestire meglio il tempo.",
    "Time blocking: assegna slot specifici ai task. La struttura aiuta.",
    "Stima sempre un po' più tempo del previsto. È meglio essere realistici."
  ],
  
  // Selezione Task
  task_selection: [
    "Perfetto! Le decisioni difficili possono bloccare. Inizia dal task più piccolo o da quello che ti dà più energia.",
    "Quando non sai da dove iniziare, scegli il task che richiede meno di 5 minuti. Momentum > Perfezione!",
    "Tre opzioni: 1) Il più urgente 2) Il più facile 3) Il più interessante. Quale ti attira di più?",
    "Attivo il Focus Mode per mostrarti solo i 3 task prioritari. Meno scelte = meno paralisi decisionale!",
    "Se non sai da dove iniziare, inizia da QUALSIASI punto. L'importante è muoversi!",
    "Task paralysis? Normale! Chiudi gli occhi, punta il dito e inizia da lì. Seriously, funziona."
  ],
  
  // Spiegazione suggerimenti
  why_suggestion: [
    "Te la spiego! Ho analizzato il tuo profilo e questa task è perfetta per te ora perché:",
    "Ottima domanda! Ecco perché ti ho suggerito proprio questa task:",
    "Ti spiego il ragionamento dietro il mio suggerimento:"
  ],
  
  // Aiuto App
  app_help: [
    "Tsunami è il tuo task manager! Hai 4 sezioni: Casa (overview), Attività (task), Note, Routine. Il Focus Mode ti mostra solo 3 task prioritari per evitare overwhelm.",
    "Ecco come funziona: 1) Aggiungi task in Attività 2) Usa Focus Mode quando ti senti sopraffatto 3) Note per pensieri e idee 4) Routine per abitudini.",
    "L'app ha algoritmi di priorità intelligenti, gamification con XP, e questo chatbot locale per supporto. Focus Mode è la killer feature: nasconde tutto tranne i 3 task più importanti."
  ],
  
  // Controllo Comprensione
  understanding_check: [
    "Sì, ti capisco perfettamente! Sono qui e funziono al 100%. Sono il tuo assistente locale, sempre pronto ad aiutarti.",
    "Certo che ti sento! Funziono completamente offline nel tuo browser. Nessun dato esce dal tuo dispositivo. Privacy totale.",
    "Eccomi! Ti ricevo forte e chiaro. Sono progettato per supportarti nella gestione delle tue attività. Dimmi pure tutto!"
  ],
  
  // Default/Saluto
  greeting: [
    "Benvenuto! Come posso aiutarti oggi?",
    "Ciao! Dimmi pure di cosa hai bisogno.",
    "Ehi! Sono qui per supportarti. Cosa posso fare per te?",
    "Salve! Pronto ad aiutarti con le tue task. Da dove iniziamo?",
    "Benvenuto! Di cosa vuoi parlare oggi?"
  ],
  
  // Nuove categorie per funzionalità agent avanzate
  emotional_state: [
    "Capisco come ti senti. Le emozioni influenzano molto la nostra produttività. Vuoi parlarne?",
    "È normale avere alti e bassi emotivi. Come posso aiutarti a gestire questo momento?",
    "Le emozioni sono informazioni preziose. Dimmi di più su come ti senti."
  ],
  progress_check: [
    "Ottima domanda! Facciamo un bilancio insieme. Nelle ultime settimane hai completato diverse task importanti.",
    "I progressi non sono sempre lineari, ma ogni piccolo passo conta. Vuoi che analizziamo i tuoi risultati?",
    "Stai facendo meglio di quanto pensi! Lascia che ti mostri i tuoi miglioramenti."
  ],
  strategy_request: [
    "Perfetto! Adoro condividere strategie efficaci. Su cosa vuoi concentrarti?",
    "Ho diverse tecniche che potrebbero aiutarti. Dimmi qual è la tua sfida principale.",
    "Le strategie giuste possono fare la differenza. Parliamo di cosa funziona meglio per te."
  ],
  break_request: [
    "Riconoscere quando hai bisogno di una pausa è una skill importante! Prenditi il tempo che ti serve.",
    "Le pause sono produttive quanto il lavoro. Vuoi che ti suggerisca una tecnica di rilassamento?",
    "Ascoltare il proprio corpo è fondamentale. Che tipo di pausa ti farebbe bene?"
  ],
  
  // Comandi di testo
  text_commands: [
    "Comando riconosciuto! Elaborando la tua richiesta...",
    "Perfetto! Eseguendo il comando specificato.",
    "Comando attivato! Procedo con l'elaborazione."
  ],
  
  // Fallback
  default: [
    "Non sono sicuro di aver capito. Puoi spiegarmi meglio cosa ti serve?",
    "Fammi capire meglio - di cosa stai parlando esattamente?",
    "Non ho afferrato completamente. Puoi riformulare o darmi più dettagli?",
    "Scusa, non sono riuscito a capire. Puoi essere più specifico?",
    "Aiutami a capirti meglio - cosa posso fare per te?"
  ],
  
  // General responses
  general: [
    "Capisco. Dimmi di più su questa situazione.",
    "Interessante. Come posso aiutarti con questo?",
    "Ok, vedo. Vuoi che ti dia qualche suggerimento?",
    "Capito. Cosa pensi che potrebbe funzionare meglio?",
    "Comprendo. Proviamo a trovare una soluzione insieme."
  ]
};

// Pattern matching avanzato per riconoscere intenti con analisi semantica
const INTENT_PATTERNS = {
  overwhelm: /sopraffatt|troppo|caos|confus|stress|ansia|panic|non so da dove|da dove cominci|quale.*task.*cominci|troppi.*task|tutto insieme|mi sento.*perso|non riesco.*gestire|è.*tutto.*un.*casino/i,
  focus: /concentr|focus|distraz|attenz|mente|non riesco.*concentr|perdo.*concentr|salto.*task|cambio.*continuamente|mi distraggo|perdo.*filo|mente.*va.*altrove|pensieri.*volano/i,
  procrastination: /procrastin|rimand|pigr|motivaz|inizi|non riesco.*inizia|non comincio|sempre.*dopo|faccio.*altro|evito|scappo.*da|non.*ho.*voglia|mi.*blocco/i,
  energy_low: /stanc|esaust|energia.*bass|sposs|fatic|non ho.*energia|senza.*forz|poco.*energia|mi sento.*scaric|sono.*a.*terra|non.*ce.*la.*faccio.*più/i,
  energy_high: /energia.*alt|caric|motivat|hyperfocus|produttiv|pieno.*energia|super.*caric|voglia.*fare|sono.*una.*scheggia|mi.*sento.*forte/i,
  motivation: /motivaz|scoragg|depress|triste|falliment|non ce la faccio|mi arrendo|inutile|non serve|perso.*speranza|non.*vale.*la.*pena|mi.*sento.*inutile/i,
  time_management: /tempo|scaden|ritard|organizz|pianific|non ho.*tempo|sempre.*ritardo|gestire.*tempo|calendario|programm|schedule|timing/i,
  task_selection: /quale.*task|da dove.*cominci|cosa.*fare.*prima|priorit|non so.*inizia|quale.*scegli|cosa.*mi.*consigli|da.*dove.*parto|(?:crea|aggiungi|fai|nuovo)\s*(?:una?\s*)?(?:task|attività)|voglio.*creare.*task/i,
  why_suggestion: /perch[eé]|come mai|motivo|ragione|spieg.*perch[eé]|perch[eé].*sugger|perch[eé].*questa|perch[eé].*quest|per.*quale.*motivo|perch[eé].*mi.*consig|perch[eé].*quella|perch[eé].*quello|spiegami|dimmi.*perch[eé]|giustifica|motiva.*scelta/i,
  app_help: /come funziona|come.*usa|come.*lavora|spieg.*app|cosa fa|tutorial|guida|istruzioni|help|aiuto.*app|come.*si.*usa/i,
  understanding_check: /mi capisci|mi senti|funzioni|ci sei|mi comprendi|mi ascolti|ricevi|mi.*stai.*seguendo|hai.*capito/i,
  greeting: /ciao|salve|buongiorno|buonasera|aiut|come stai|eccomi|presente|hey|ehi|salut/i,
  // Nuovi pattern avanzati
  emotional_state: /mi.*sento|sono.*triste|sono.*felice|sono.*arrabbiato|emozioni|umore|stato.*animo|mi.*va.*tutto.*storto/i,
  progress_check: /come.*sto.*andando|progressi|miglioramento|risultati|bilancio|quanto.*ho.*fatto|sono.*migliorato/i,
  strategy_request: /strategia|tecnica|metodo|approccio|come.*posso|suggerimento|consiglio|trucco|tip/i,
  break_request: /pausa|riposo|stacco|break|mi.*fermo|ho.*bisogno.*di.*fermarmi|sono.*stanco/i,
  // Nuovi pattern per riorganizzazione progetti
  project_organization: /riorganizza|organizza.*progetti|raggruppa|crea.*progetto|progetti.*da.*note|organizza.*note/i,
  // Nuovi pattern per rielaborazione testi
  text_processing: /riorganizza.*testo|rielabora|semplifica|estrai.*azioni|migliora.*testo|ristruttura|riassumi|categorizza/i,
  // Pattern per comandi specifici
  text_commands: /\/riorganizza|\/semplifica|\/estrai-task|\/raggruppa|\/progetti|\/analizza/i,
  // Pattern per approccio ai progetti
  project_approach: /come.*approcci|come.*inizi|da dove.*cominci|come.*procedi|strategia.*progetto|metodo.*progetto|come.*mi.*consigli.*di.*approcciarmi|come.*dovrei.*iniziare/i
};

// Analisi semantica avanzata per context awareness
const SEMANTIC_KEYWORDS = {
  urgency: ['urgente', 'subito', 'presto', 'scadenza', 'deadline', 'fretta'],
  difficulty: ['difficile', 'complesso', 'complicato', 'facile', 'semplice', 'banale'],
  emotion: ['felice', 'triste', 'arrabbiato', 'frustrato', 'soddisfatto', 'preoccupato'],
  time: ['mattina', 'pomeriggio', 'sera', 'notte', 'oggi', 'domani', 'settimana'],
  energy: ['energia', 'forza', 'stanco', 'carico', 'motivato', 'spossato']
};

export const LocalChatBot: React.FC<LocalChatBotProps> = ({ 
  userId, 
  adhdContext = {}, 
  tasks = [], 
  onActionSuggested,
  onClose,
  isMinimized = false,
  onToggleMinimize
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasReceivedFirstMessage, setHasReceivedFirstMessage] = useState(false);
  const [currentQuickActions, setCurrentQuickActions] = useState<QuickAction[]>([]);
  const [lastActionResult, setLastActionResult] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [userBehavior, setUserBehavior] = useState<UserBehaviorPattern>({
    preferredTaskTypes: [],
    peakEnergyHours: [],
    averageTaskDuration: 0,
    procrastinationTriggers: [],
    successfulStrategies: [],
    completionRate: 0
  });
  const [sessionInsights, setSessionInsights] = useState<{
    startTime: Date;
    messageCount: number;
    dominantEmotions: string[];
    suggestedActions: string[];
  }>({ startTime: new Date(), messageCount: 0, dominantEmotions: [], suggestedActions: [] });
  
  // Nuovi stati per la chat testuale
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, sender: 'user' | 'bot', timestamp: Date}>>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState<{lastIntent?: string, awaitingResponse?: boolean}>({});
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  // Stati per AI Service
  const [aiService, setAiService] = useState<any>(null);
  const [aiReady, setAiReady] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>('Inizializzazione...');
  
  // Ref per l'area di scroll
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { logChatbotInteraction } = usePatternMining();

  // Carica progetti da dati mock locali (chatbot completamente locale)
  const loadProjects = async () => {
    try {
      // Dati mock per progetti locali
      const mockProjects: Project[] = [
        {
          id: '1',
          title: 'Progetto di Studio',
          description: 'Completare il corso online',
          status: 'in_progress',
          energy_required: 'media',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Organizzazione Casa',
          description: 'Riordinare e organizzare gli spazi',
          status: 'pending',
          energy_required: 'alta',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setProjects(mockProjects);
    } catch (error) {
      console.error('Error loading mock projects:', error);
    }
  };

  // Effetto per auto-scroll ai nuovi messaggi
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatMessages]);
  
  // Inizializzazione con quick actions contestuali e messaggio di benvenuto
  useEffect(() => {
    const initializeComponents = async () => {
      const quickActions = getContextualQuickActions(adhdContext);
      setCurrentQuickActions(quickActions);
      loadProjects();
      
      // Debug: Verifica supporto AI con logging dettagliato
      console.log('🔍 Verifica supporto AI...');
      console.log('🌐 Navigator disponibile:', typeof navigator !== 'undefined');
      if (typeof navigator !== 'undefined') {
        console.log('🎮 WebGPU disponibile:', 'gpu' in navigator);
        console.log('🔧 Service Worker:', 'serviceWorker' in navigator);
        console.log('💾 Storage API:', 'storage' in navigator);
        console.log('📱 User Agent:', navigator.userAgent);
      }
      
      const aiSupported = await isAISupported();
      console.log('🤖 AI Supportato:', aiSupported);
      
      // Inizializza AI Service se supportato
      if (aiSupported) {
        try {
          setAiStatus('Caricamento AI...');
          console.log('🚀 Creazione AI Service...');
          const service = await createAIService();
          setAiService(service);
          console.log('✅ AI Service creato con successo');
          
          // Carica il modello AI in background
          const status = service.getStatus();
          console.log('📊 Status AI Service:', status);
          console.log('🔍 Status isLoaded:', status.isLoaded);
          
          if (!status.isLoaded) {
            setAiStatus('Caricamento modello AI...');
            console.log('🚀 Avvio caricamento modello AI...');
            service.loadModel().then(() => {
              setAiReady(true);
              setAiStatus('AI pronto! 🤖');
              console.log('✅ AI Service pronto! aiReady impostato a true');
            }).catch(error => {
              setAiReady(false);
              setAiStatus('AI non disponibile');
              console.warn('⚠️ Errore caricamento modello AI:', error);
            });
          } else {
            setAiReady(true);
            setAiStatus('AI pronto! 🤖');
            console.log('✅ AI Service già caricato! aiReady impostato a true');
          }
        } catch (error) {
          setAiStatus('AI non disponibile');
          console.warn('⚠️ Fallback a risposte predefinite:', error);
        }
      } else {
        setAiStatus('AI non supportato - Verifica console per dettagli');
        console.warn('❌ AI non supportato in questo ambiente');
      }
      
      // Aggiungi messaggio di benvenuto se è la prima volta
      if (chatMessages.length === 0) {
        const welcomeMessage = {
          id: 'welcome-' + Date.now(),
          text: `Ciao! 👋 Sono il tuo assistente ADHD completamente rinnovato!\n\n🎯 Ora puoi scrivermi direttamente:\n• "Crea task studiare matematica"\n• "Sono stanco, cosa posso fare?"\n• "Suddividi questa task in step"\n• "Come procedo con il progetto?"\n\n✨ Prova a scrivermi qualcosa!`,
          sender: 'bot' as const,
          timestamp: new Date()
        };
        
        setTimeout(() => {
          setChatMessages([welcomeMessage]);
        }, 500);
      }
    };
    
    initializeComponents();
  }, [userId, adhdContext]);

  // Aggiorna le quick actions quando cambiano task o contesto
  useEffect(() => {
    const quickActions = getContextualQuickActions(adhdContext);
    setCurrentQuickActions(quickActions);
  }, [adhdContext, tasks]);

  // Rimuovo la chiusura automatica - l'utente preferisce chiudere manualmente

  // Previeni chiusura accidentale del chatbot durante l'interazione
  useEffect(() => {
    // Mantieni il chatbot aperto se ci sono messaggi recenti
    if (chatMessages.length > 1) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      const timeSinceLastMessage = Date.now() - lastMessage.timestamp.getTime();
      
      // Se l'ultimo messaggio è recente (meno di 30 secondi), mantieni aperto
      if (timeSinceLastMessage < 30000 && !isOpen) {
        setIsOpen(true);
      }
    }
  }, [chatMessages, isOpen]);



  // Funzione per ottenere risposta casuale da una categoria
  const getRandomResponse = (intent: string): string => {
    const responses = CHATBOT_RESPONSES[intent as keyof typeof CHATBOT_RESPONSES] || CHATBOT_RESPONSES.default;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Analisi predittiva delle task basata su pattern comportamentali
  const predictOptimalTasks = (currentContext: ADHDContext): Task[] => {
    if (!tasks || tasks.length === 0) return [];
    
    const activeTasks = tasks.filter(task => task.status !== 'completed');
    const currentHour = new Date().getHours();
    const timeOfDay = adhdContext?.timeOfDay || 
      (currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : currentHour < 21 ? 'evening' : 'night');
    
    return activeTasks
      .map(task => {
        let score = 0;
        
        // Boost per task type preferiti
        if (userBehavior.preferredTaskTypes.includes(task.task_type)) {
          score += 20;
        }
        
        // Boost per orari di picco energetico
        if (userBehavior.peakEnergyHours.includes(currentHour)) {
          score += 15;
        }
        
        // Penalità per trigger di procrastinazione
        if (userBehavior.procrastinationTriggers.some(trigger => 
          task.title.toLowerCase().includes(trigger.toLowerCase()))) {
          score -= 10;
        }
        
        // Boost per compatibilità energetica
        const energyCompatibility = getEnergyCompatibility(task.energy_required, currentContext.energyLevel || 3);
        score += energyCompatibility * 10;
        
        // Urgency boost
        if (task.due_date) {
          const daysUntil = Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 1) score += 25;
          else if (daysUntil <= 3) score += 15;
        }
        
        return { ...task, predictedScore: score };
      })
      .sort((a, b) => (b.predictedScore || 0) - (a.predictedScore || 0))
      .slice(0, 5);
  };

  // Calcola compatibilità energetica
  const getEnergyCompatibility = (taskEnergy: string, userEnergy: number): number => {
    const energyMap = { 'molto_bassa': 1, 'bassa': 2, 'media': 3, 'alta': 4, 'molto_alta': 5 };
    const taskLevel = energyMap[taskEnergy as keyof typeof energyMap] || 3;
    const difference = Math.abs(taskLevel - userEnergy);
    return Math.max(0, 5 - difference);
  };

  // Learning comportamentale - aggiorna pattern utente
  const updateUserBehavior = (completedTask: Task, timeSpent: number, success: boolean) => {
    setUserBehavior(prev => {
      const updated = { ...prev };
      
      // Aggiorna task type preferiti
      if (success) {
        const taskTypeIndex = updated.preferredTaskTypes.indexOf(completedTask.task_type);
        if (taskTypeIndex === -1) {
          updated.preferredTaskTypes.push(completedTask.task_type);
        }
      }
      
      // Aggiorna orari di picco
      const currentHour = new Date().getHours();
      if (success && !updated.peakEnergyHours.includes(currentHour)) {
        updated.peakEnergyHours.push(currentHour);
      }
      
      // Aggiorna durata media
      updated.averageTaskDuration = (updated.averageTaskDuration + timeSpent) / 2;
      
      // Aggiorna completion rate
      const newRate = success ? Math.min(1, updated.completionRate + 0.1) : Math.max(0, updated.completionRate - 0.05);
      updated.completionRate = newRate;
      
      return updated;
    });
  };

  // Genera insights proattivi basati su sessione, comportamento e umore
  const generateProactiveInsights = (): string[] => {
    const insights: string[] = [];
    const { messageCount, dominantEmotions } = sessionInsights;
    
    // Priorità agli insight basati sull'umore (sempre disponibili)
    const moodInsights = generateMoodBasedInsights();
    insights.push(...moodInsights);
    
    // Solo se abbiamo dati sufficienti per fare insights significativi
    if (messageCount < 3) return insights.slice(0, 2);
    
    if (messageCount > 10) {
      insights.push("Noto che stiamo chattando da un po'. Forse è il momento di mettere in pratica qualche suggerimento?");
    }
    
    if (dominantEmotions.includes('stress') || dominantEmotions.includes('overwhelm')) {
      insights.push("Percepisco un po' di stress. Che ne dici di una pausa di 5 minuti con respirazione profonda?");
    }
    
    // Solo se abbiamo dati reali sul completion rate
    if (userBehavior.completionRate > 0 && userBehavior.completionRate < 0.3) {
      insights.push("Vedo che completare le task è una sfida. Proviamo a spezzarle in micro-task da 5 minuti?");
    }
    
    const currentHour = new Date().getHours();
    // Solo se abbiamo pattern consolidati
    if (userBehavior.peakEnergyHours.length > 0 && userBehavior.peakEnergyHours.includes(currentHour)) {
      insights.push("Questo è uno dei tuoi orari di picco energetico! Momento perfetto per task impegnative.");
    }
    
    // Nuovo: Analisi per suggerimenti progetti
    const projectInsights = analyzeProjectOpportunities();
    insights.push(...projectInsights);
    
    // Analisi Mental Inbox per progetti (asincrona)
    analyzeMentalInboxForProjects().then(inboxSuggestions => {
      if (inboxSuggestions.length > 0 && insights.length < 3) {
        const newInsight = {
          type: 'inbox_organization',
          message: inboxSuggestions[0],
          priority: 'high' as const
        };
        
        // Aggiorna gli insights se non è già presente
        const existingInsights = [...insights, newInsight];
        if (existingInsights.length <= 3) {
          // Trigger re-render con nuovo insight
          setTimeout(() => {
            setProactiveInsights(existingInsights);
          }, 1000);
        }
      }
    }).catch(error => {
      console.error('Error getting inbox suggestions:', error);
    });
    
    return insights.slice(0, 3); // Limita a 3 insight per non sovraccaricare
  };

  // Nuova funzione per generare insight basati sull'umore
  const generateMoodBasedInsights = (): string[] => {
    const todayMood = adhdContext.todayMood;
    if (!todayMood) return [];
    
    const currentHour = new Date().getHours();
    const insights: string[] = [];
    
    // Insight specifici per ogni umore basati sull'ora del giorno
    const moodTimeInsights = {
      'congelato': {
        morning: '🧊 Mattina + stato "congelato"? Inizia con 5 minuti di movimento leggero per sbloccarti.',
        afternoon: '🧊 Pomeriggio "congelato"? Prova la tecnica del "task da 2 minuti" per rompere il ghiaccio.',
        evening: '🧊 Sera "congelata"? Prepara 3 micro-task per domani mattina - ti aiuterà a iniziare.'
      },
      'disorientato': {
        morning: '⚡ Energia mattutina "disorientata"? Fai una lista di 3 priorità per dare direzione alla giornata.',
        afternoon: '⚡ Pomeriggio "disorientato"? Momento perfetto per riorganizzare e fare chiarezza sui prossimi passi.',
        evening: '⚡ Sera "disorientata"? Rifletti sulla giornata e pianifica 1 focus principale per domani.'
      },
      'in_flusso': {
        morning: '🔥 Mattina "in flusso"? Approfitta di questo stato per le task più impegnative della giornata!',
        afternoon: '🔥 Pomeriggio "in flusso"? Mantieni il momentum - quale progetto ti sta chiamando di più?',
        evening: '🔥 Sera "in flusso"? Ottimo momento per sessioni creative o per completare progetti importanti.'
      },
      'ispirato': {
        morning: '💡 Mattina "ispirata"? Cattura tutte le idee che emergono, poi scegline una per iniziare.',
        afternoon: '💡 Pomeriggio "ispirato"? Trasforma le visioni mattutine in azioni concrete - è il momento!',
        evening: '💡 Sera "ispirata"? Perfetto per brainstorming e pianificazione di nuovi progetti visionari.'
      }
    };
    
    const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening';
    const moodInsight = moodTimeInsights[todayMood.mood]?.[timeOfDay];
    
    if (moodInsight) {
      insights.push(moodInsight);
    }
    
    // Insight basati su task e umore
    if (tasks && tasks.length > 0) {
      const taskMoodInsight = generateTaskMoodInsight(todayMood, tasks);
      if (taskMoodInsight) {
        insights.push(taskMoodInsight);
      }
    }
    
    return insights;
  };

  // Genera insight specifici su task basati sull'umore
  const generateTaskMoodInsight = (todayMood: any, tasks: Task[]): string | null => {
    const activeTasks = tasks.filter(task => task.status !== 'completed');
    if (activeTasks.length === 0) return null;
    
    const moodState = todayMood.mood;
    
    // Analizza la distribuzione di energia delle task
    const energyDistribution = activeTasks.reduce((acc, task) => {
      const energy = task.energy_required || 'media';
      acc[energy] = (acc[energy] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const moodTaskInsights = {
      'congelato': () => {
        const lowEnergyTasks = (energyDistribution.molto_bassa || 0) + (energyDistribution.bassa || 0);
        if (lowEnergyTasks === 0) {
          return '🧊 Tutte le tue task richiedono molta energia, ma sei "congelato". Spezziamo qualcosa in micro-task!';
        }
        return `🧊 Hai ${lowEnergyTasks} task a bassa energia - perfette per il tuo stato "congelato". Iniziamo da lì!`;
      },
      'disorientato': () => {
        if (activeTasks.length > 5) {
          return '⚡ Hai molte task e ti senti "disorientato". Raggruppiamole in 3 categorie per fare chiarezza!';
        }
        return '⚡ Energia "disorientata"? Scegliamo UNA task e focalizziamoci solo su quella per i prossimi 25 minuti.';
      },
      'in_flusso': () => {
        const highEnergyTasks = (energyDistribution.alta || 0) + (energyDistribution.molto_alta || 0);
        if (highEnergyTasks > 0) {
          return `🔥 Sei "in flusso" e hai ${highEnergyTasks} task impegnative - momento perfetto per affrontarle!`;
        }
        return '🔥 Sei "in flusso" ma le task sono leggere. Vuoi crearne una più sfidante per sfruttare questo stato?';
      },
      'ispirato': () => {
        const creativeTasks = activeTasks.filter(task => task.task_type === 'creativita').length;
        if (creativeTasks > 0) {
          return `💡 Sei "ispirato" e hai ${creativeTasks} task creative - il momento perfetto per dare vita alle tue idee!`;
        }
        return '💡 Sei "ispirato" ma non vedo task creative. Vuoi trasformare qualche idea in un progetto concreto?';
      }
    };
    
    const insightGenerator = moodTaskInsights[moodState as keyof typeof moodTaskInsights];
    return insightGenerator ? insightGenerator() : null;
  };
  
  // Nuova funzione per analizzare opportunità di creazione progetti
  const analyzeProjectOpportunities = (): string[] => {
    const insights: string[] = [];
    
    if (!tasks || tasks.length < 3) return insights;
    
    // Raggruppa task per tipo
    const tasksByType = tasks.reduce((acc, task) => {
      if (!acc[task.task_type]) acc[task.task_type] = [];
      acc[task.task_type].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
    
    // Suggerisci progetti per tipi con molte task
    Object.entries(tasksByType).forEach(([type, typeTasks]) => {
      if (typeTasks.length >= 3) {
        const typeNames = {
          'azione': 'Operativo',
          'riflessione': 'Sviluppo Personale', 
          'comunicazione': 'Relazioni',
          'creativita': 'Creatività',
          'organizzazione': 'Organizzazione'
        };
        insights.push(`🎯 Hai ${typeTasks.length} task di tipo "${type}". Vuoi creare il progetto "${typeNames[type as keyof typeof typeNames]}"?`);
      }
    });
    
    // Analizza task con parole chiave simili nei titoli
    const keywords = extractCommonKeywords();
    if (keywords.length > 0) {
      insights.push(`📁 Ho rilevato pattern nei tuoi task: "${keywords[0]}". Organizziamo in un progetto dedicato?`);
    }
    
    return insights.slice(0, 2);
  };
  
  // Funzione per estrarre parole chiave comuni dai task
  const extractCommonKeywords = (): string[] => {
    if (!tasks || tasks.length < 2) return [];
    
    const words: Record<string, number> = {};
    
    tasks.forEach(task => {
      const taskWords = task.title.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !['task', 'fare', 'completare'].includes(word));
      
      taskWords.forEach(word => {
        words[word] = (words[word] || 0) + 1;
      });
    });
    
    return Object.entries(words)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .map(([word]) => word)
      .slice(0, 3);
  };

  // Analisi semantica avanzata per context awareness
  const analyzeSemanticContext = (message: string): { [key: string]: number } => {
    const context: { [key: string]: number } = {};
    const messageClean = message.toLowerCase();
    
    for (const [category, keywords] of Object.entries(SEMANTIC_KEYWORDS)) {
      let score = 0;
      keywords.forEach(keyword => {
        if (messageClean.includes(keyword)) {
          score += 1;
        }
      });
      if (score > 0) {
        context[category] = score / keywords.length;
      }
    }
    
    return context;
  };

  // Analisi dell'intent del messaggio utente con AI avanzata
  const analyzeIntent = (message: string): { intent: string; confidence: number; context?: any } => {
    let bestMatch = { intent: 'default', confidence: 0 };
    const messageClean = message.toLowerCase().trim();
    const semanticContext = analyzeSemanticContext(message);
    
    // Ordine di priorità per evitare conflitti
     const priorityOrder = [
       'app_help',
       'understanding_check', 
       'why_suggestion',
       'project_approach',
       'text_commands',
       'project_organization',
       'text_processing',
       'task_selection',
       'overwhelm',
       'procrastination',
       'focus',
       'energy_low',
       'energy_high',
       'motivation',
       'time_management',
       'emotional_state',
       'progress_check',
       'strategy_request',
       'break_request',
       'greeting'
     ];
    
    console.log('🎯 Analyzing intent for:', messageClean);
    console.log('🧠 Semantic context:', semanticContext);
    
    for (const intent of priorityOrder) {
      const pattern = INTENT_PATTERNS[intent as keyof typeof INTENT_PATTERNS];
      if (pattern && pattern.test(messageClean)) {
        // Confidence più alta per pattern più specifici
         let confidence = intent === 'app_help' ? 0.98 :
                         intent === 'understanding_check' ? 0.97 :
                         intent === 'why_suggestion' ? 0.96 :
                         intent === 'project_approach' ? 0.95 :
                         intent === 'text_commands' ? 0.99 :
                         intent === 'project_organization' ? 0.92 :
                         intent === 'text_processing' ? 0.90 :
                         intent === 'task_selection' ? 0.94 :
                         intent === 'emotional_state' ? 0.93 :
                         intent === 'progress_check' ? 0.91 :
                         intent === 'strategy_request' ? 0.93 :
                         intent === 'break_request' ? 0.89 :
                         intent === 'greeting' ? 0.7 : 0.85;
        
        // Boost semantico basato sul contesto
        if (semanticContext.urgency && intent === 'task_selection') confidence += 0.05;
        if (semanticContext.emotion && intent === 'emotional_state') confidence += 0.03;
        if (semanticContext.energy && (intent === 'energy_low' || intent === 'energy_high')) confidence += 0.04;
        
        if (confidence > bestMatch.confidence) {
          bestMatch = { intent, confidence };
          // Debug logging migliorato
          console.log(`🎯 Intent matched: ${intent} (confidence: ${confidence}) for: "${message}"`);
        }
      }
    }
    
    // Fallback intelligente con analisi semantica
    if (bestMatch.confidence === 0) {
      console.log('🔄 No pattern match, using semantic analysis');
      
      // Analisi semantica per fallback intelligente
      if (semanticContext.urgency || /task|fare|lavoro|attivit/i.test(messageClean)) {
        bestMatch = { intent: 'task_selection', confidence: 0.7 };
        console.log(`🔍 Fallback to task_selection for: "${message}"`);
      } else if (semanticContext.emotion) {
        bestMatch = { intent: 'emotional_state', confidence: 0.65 };
        console.log(`🔍 Fallback to emotional_state for: "${message}"`);
      } else if (/aiut|help|supporto/i.test(messageClean)) {
        bestMatch = { intent: 'greeting', confidence: 0.6 };
        console.log(`🔍 Fallback to greeting for: "${message}"`);
      } else if (messageClean.length < 10) {
        bestMatch = { intent: 'greeting', confidence: 0.6 };
        console.log(`🔍 Short message, fallback to greeting for: "${message}"`);
      } else {
        console.log(`❌ No intent matched for: "${message}"`);
      }
    }
    
    console.log(`✅ Intent: ${bestMatch.intent} (confidence: ${bestMatch.confidence})`);
    return { ...bestMatch, context: semanticContext };
  };

  // Personalizzazione risposta basata su contesto ADHD e umore giornaliero
  const personalizeResponse = (baseResponse: string, intent: string): string => {
    let response = baseResponse;
    
    // Integrazione intelligente con l'umore giornaliero
    const todayMood = adhdContext.todayMood;
    if (todayMood) {
      response = enhanceResponseWithMoodContext(response, intent, todayMood);
    }
    
    // Aggiunge contesto basato su ora del giorno
    if (adhdContext.timeOfDay === 'morning' && intent === 'energy_low') {
      response += " È mattina, potresti aver bisogno di più tempo per 'accenderti'.";
    }
    
    // Aggiunge contesto basato su focus mode
    if (adhdContext.focusMode && intent === 'overwhelm') {
      response += " Vedo che hai già il Focus Mode attivo. Ottima scelta!";
    }
    
    // Aggiunge contesto basato su numero di task
    if (adhdContext.activeTasks && adhdContext.activeTasks > 10 && intent === 'overwhelm') {
      response += ` Hai ${adhdContext.activeTasks} task attivi. Troppi da gestire insieme!`;
    }
    
    return response;
  };

  // Nuova funzione per migliorare le risposte basandosi sull'umore
  const enhanceResponseWithMoodContext = (baseResponse: string, intent: string, mood: any): string => {
    const moodState = mood.mood;
    const ritual = mood.suggested_ritual;
    
    // Suggerimenti specifici per ogni stato d'umore
    const moodEnhancements = {
      'congelato': {
        overwhelm: `🧊 Vedo che oggi ti senti "congelato". ${ritual} Iniziamo proprio da qui - quale task richiede solo 2 minuti?`,
        focus: `🧊 Quando siamo "congelati", la concentrazione è difficile. ${ritual} Poi proviamo con una tecnica di micro-focus.`,
        procrastination: `🧊 Il "congelamento" è spesso procrastinazione mascherata. ${ritual} È il primo passo per sbloccarti.`,
        task_selection: `🧊 Perfetto! Oggi sei "congelato" quindi: ${ritual} Quale task da 2 minuti vedi nella tua lista?`
      },
      'disorientato': {
        overwhelm: `⚡ Hai energie ma ti senti "disorientato". ${ritual} Questo ti aiuterà a canalizzare l'energia nel modo giusto.`,
        focus: `⚡ L'energia "disorientata" ha bisogno di direzione. ${ritual} Poi scegliamo UN focus per i prossimi 25 minuti.`,
        task_selection: `⚡ Ottima domanda! Sei "disorientato" ma hai energia. ${ritual} Quale delle 3 cose ti attira di più?`,
        motivation: `⚡ L'energia c'è, manca solo la direzione. ${ritual} Poi troviamo il tuo "perché" per oggi.`
      },
      'in_flusso': {
        overwhelm: `🔥 Sei "in flusso" ma ti senti sopraffatto? ${ritual} Il tuo istinto sa già cosa fare.`,
        focus: `🔥 Perfetto! Sei "in flusso". ${ritual} Questo è il momento ideale per task impegnative.`,
        task_selection: `🔥 Sei "in flusso"! ${ritual} Quale progetto ti sta chiamando di più in questo momento?`,
        energy_high: `🔥 Energia alta + stato di flusso = combinazione perfetta! ${ritual} Sfrutta questo momento d'oro.`
      },
      'ispirato': {
        overwhelm: `💡 Sei "ispirato" ma sopraffatto dalle possibilità? ${ritual} Poi scegliamo l'idea più promettente.`,
        focus: `💡 L'ispirazione ha bisogno di focus per diventare realtà. ${ritual} Poi concentriamoci su UNA idea.`,
        task_selection: `💡 Perfetto momento per essere "ispirato"! ${ritual} Quale idea vuoi trasformare in azione oggi?`,
        project_organization: `💡 Sei "ispirato"! ${ritual} È il momento perfetto per organizzare le tue visioni in progetti concreti.`
      }
    };
    
    const enhancement = moodEnhancements[moodState as keyof typeof moodEnhancements]?.[intent as keyof typeof moodEnhancements['congelato']];
    
    if (enhancement) {
      return enhancement;
    }
    
    // Fallback con contesto generale dell'umore
    const moodEmojis = {
      'congelato': '🧊',
      'disorientato': '⚡', 
      'in_flusso': '🔥',
      'ispirato': '💡'
    };
    
    const emoji = moodEmojis[moodState as keyof typeof moodEmojis] || '💭';
    return `${emoji} Considerando che oggi ti senti "${moodState}", ${baseResponse.toLowerCase()} Ricorda: ${ritual}`;
  };

  // Funzioni helper per suggerimenti basati sull'umore
  const getMoodBasedEmptyTaskSuggestion = (): string => {
    const todayMood = adhdContext.todayMood;
    if (!todayMood) return "Non vedo task disponibili. Vuoi crearne qualcuna insieme?";
    
    const moodSuggestions = {
      'congelato': '🧊 Non hai task? Perfetto per il tuo stato "congelato". Iniziamo creando una task di 2 minuti - cosa ti viene in mente?',
      'disorientato': '⚡ Hai energia ma nessuna task? Facciamo una lista di 3 cose che ti vengono in mente, poi le trasformiamo in task!',
      'in_flusso': '🔥 Sei "in flusso" ma senza task? Tuffiamoci subito nella creazione - quale progetto ti chiama di più?',
      'ispirato': '💡 Sei "ispirato" e senza task? Momento perfetto! Cattura tutte le idee che emergono e trasformiamole in azioni concrete.'
    };
    
    return moodSuggestions[todayMood.mood as keyof typeof moodSuggestions] || "Non vedo task disponibili. Vuoi crearne qualcuna insieme?";
  };

  const getMoodBasedNoTaskSuggestion = (): string => {
    const todayMood = adhdContext.todayMood;
    if (!todayMood) return "Tutte le tue task richiedono molta energia. Vuoi che ti aiuti a spezzarle in parti più piccole?";
    
    const moodSuggestions = {
      'congelato': '🧊 Le task sembrano troppo grandi per il tuo stato "congelato"? Spezziamole in micro-task da 2 minuti!',
      'disorientato': '⚡ Hai energia ma le task sembrano confuse? Riorganizziamole in 3 categorie chiare!',
      'in_flusso': '🔥 Sei "in flusso" ma le task non ti ispirano? Troviamo quella che risuona di più con te ora!',
      'ispirato': '💡 Sei "ispirato" ma le task attuali non catturano la tua visione? Creiamo qualcosa di nuovo insieme!'
    };
    
    return moodSuggestions[todayMood.mood as keyof typeof moodSuggestions] || "Tutte le tue task richiedono molta energia. Vuoi che ti aiuti a spezzarle in parti più piccole?";
  };

  const getMoodBasedHeader = (): string => {
    const todayMood = adhdContext.todayMood;
    if (!todayMood) return "🎯 **Suggerimenti AI personalizzati:**\n\n";
    
    const moodHeaders = {
      'congelato': '🧊 **Suggerimenti per il tuo stato "Congelato":**\n\n',
      'disorientato': '⚡ **Suggerimenti per canalizzare la tua energia "Disorientata":**\n\n',
      'in_flusso': '🔥 **Suggerimenti per il tuo "Flusso" perfetto:**\n\n',
      'ispirato': '💡 **Suggerimenti per trasformare la tua "Ispirazione" in azione:**\n\n'
    };
    
    return moodHeaders[todayMood.mood as keyof typeof moodHeaders] || "🎯 **Suggerimenti AI personalizzati:**\n\n";
  };

  const getMoodBasedTaskReasoning = (task: any, todayMood: any): string => {
    if (!todayMood) return '';
    
    const moodReasonings = {
      'congelato': {
        'molto_bassa': '❄️ *(perfetta per sbloccarti)*',
        'bassa': '🧊 *(ideale per iniziare)*',
        'media': '⚠️ *(potrebbe essere troppo per ora)*',
        'alta': '🚫 *(troppo impegnativa oggi)*',
        'molto_alta': '🚫 *(rimanda a domani)*'
      },
      'disorientato': {
        'molto_bassa': '⚡ *(per focalizzare l\'energia)*',
        'bassa': '⚡ *(buon punto di partenza)*',
        'media': '⚡ *(perfetta per te ora)*',
        'alta': '⚠️ *(potrebbe confonderti di più)*',
        'molto_alta': '🚫 *(troppo complessa ora)*'
      },
      'in_flusso': {
        'molto_bassa': '🔥 *(riscaldamento perfetto)*',
        'bassa': '🔥 *(ottimo inizio)*',
        'media': '🔥 *(nel tuo sweet spot)*',
        'alta': '🔥 *(sfida stimolante)*',
        'molto_alta': '🔥 *(massima sfida!)*'
      },
      'ispirato': {
        'molto_bassa': '💡 *(per concretizzare le idee)*',
        'bassa': '💡 *(trasforma visione in azione)*',
        'media': '💡 *(equilibrio perfetto)*',
        'alta': '💡 *(progetto ambizioso)*',
        'molto_alta': '💡 *(visione grandiosa!)*'
      }
    };
    
    const moodReasoning = moodReasonings[todayMood.mood as keyof typeof moodReasonings];
    if (!moodReasoning) return '';
    
    const energyLevel = task.energy_required || 'media';
    return moodReasoning[energyLevel as keyof typeof moodReasoning] || '';
  };

  const getMoodBasedStrategicSuggestion = (energyLevel?: number): string => {
    const todayMood = adhdContext.todayMood;
    if (!todayMood) {
      if (energyLevel && energyLevel <= 2) {
        return "💡 *Energia bassa rilevata - ho prioritizzato task leggere per te*";
      } else if (energyLevel && energyLevel >= 4) {
        return "🚀 *Energia alta rilevata - momento perfetto per task impegnative!*";
      }
      return "";
    }
    
    const moodStrategies = {
      'congelato': {
        low: '🧊 *Strategia "Congelato": Inizia dalla task più piccola per sbloccarti*',
        high: '🧊 *Hai energia ma sei "congelato"? Usa questa forza per rompere il ghiaccio!*',
        default: '🧊 *Ricorda: oggi è il giorno dei micro-passi. Ogni piccola azione conta.*'
      },
      'disorientato': {
        low: '⚡ *Strategia "Disorientato": Energia bassa + confusione = focus su UNA cosa sola*',
        high: '⚡ *Energia alta + disorientamento = momento perfetto per fare chiarezza!*',
        default: '⚡ *Ricorda: hai energia, serve solo direzione. Scegli e vai!*'
      },
      'in_flusso': {
        low: '🔥 *Sei "in flusso" ma con poca energia? Mantieni il ritmo con task leggere*',
        high: '🔥 *Flusso + energia alta = combinazione magica! Questo è il tuo momento!*',
        default: '🔥 *Ricorda: sei connesso al tuo istinto. Fidati di quello che senti.*'
      },
      'ispirato': {
        low: '💡 *Ispirazione + energia bassa = cattura le idee, agisci domani*',
        high: '💡 *Ispirazione + energia alta = trasforma le visioni in realtà ORA!*',
        default: '💡 *Ricorda: l\'ispirazione senza azione rimane solo un sogno.*'
      }
    };
    
    const moodStrategy = moodStrategies[todayMood.mood as keyof typeof moodStrategies];
    if (!moodStrategy) return "";
    
    if (energyLevel && energyLevel <= 2) {
      return moodStrategy.low;
    } else if (energyLevel && energyLevel >= 4) {
      return moodStrategy.high;
    }
    return moodStrategy.default;
  };

  // Versione migliorata della predizione task con contesto dell'umore
  const predictOptimalTasksWithMood = (context: any): Task[] => {
    if (!tasks || tasks.length === 0) return [];
    
    const activeTasks = tasks.filter(task => task.status !== 'completed');
    const todayMood = context.todayMood;
    
    return activeTasks
      .map(task => {
        let score = 0;
        
        // Score base dalla funzione originale
        const baseScore = calculateBaseTaskScore(task, context);
        score += baseScore;
        
        // Bonus/malus basato sull'umore
        if (todayMood) {
          const moodScore = calculateMoodTaskScore(task, todayMood);
          score += moodScore;
        }
        
        return { ...task, predictedScore: Math.max(0, Math.min(100, score)) };
      })
      .sort((a, b) => (b as any).predictedScore - (a as any).predictedScore);
  };

  const calculateMoodTaskScore = (task: any, todayMood: any): number => {
    const moodState = todayMood.mood;
    const energyRequired = task.energy_required || 'media';
    
    const moodEnergyMatrix = {
      'congelato': {
        'molto_bassa': 30,
        'bassa': 20,
        'media': -10,
        'alta': -25,
        'molto_alta': -40
      },
      'disorientato': {
        'molto_bassa': 15,
        'bassa': 25,
        'media': 30,
        'alta': -15,
        'molto_alta': -30
      },
      'in_flusso': {
        'molto_bassa': 10,
        'bassa': 15,
        'media': 25,
        'alta': 35,
        'molto_alta': 40
      },
      'ispirato': {
        'molto_bassa': 20,
        'bassa': 25,
        'media': 30,
        'alta': 35,
        'molto_alta': 25
      }
    };
    
    const moodMatrix = moodEnergyMatrix[moodState as keyof typeof moodEnergyMatrix];
    if (!moodMatrix) return 0;
    
    return moodMatrix[energyRequired as keyof typeof moodMatrix] || 0;
  };

  const calculateBaseTaskScore = (task: any, context: any): number => {
    // Implementazione semplificata del calcolo base
    let score = 50; // Score neutro
    
    // Priorità per urgenza
    if (task.due_date) {
      try {
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 1) score += 25;
        else if (daysUntil <= 3) score += 15;
        else if (daysUntil <= 7) score += 5;
      } catch (e) {
        // Ignora errori di parsing data
      }
    }
    
    // Bonus per XP reward
    if (task.xp_reward) {
      score += Math.min(task.xp_reward / 10, 15);
    }
    
    // Bonus per tipo preferito
    if (userBehavior.preferredTaskTypes.includes(task.task_type)) {
      score += 10;
    }
    
    return score;
  };

  // Suggerisce task specifiche basate su analisi predittiva avanzata e umore
  const suggestSpecificTasks = (intent: string, energyLevel?: number): string => {
    if (!tasks || tasks.length === 0) {
      return getMoodBasedEmptyTaskSuggestion();
    }

    const activeTasks = tasks.filter(task => task.status !== 'completed');
    
    if (activeTasks.length === 0) {
      return "Complimenti! Hai completato tutte le tue task! 🎉";
    }

    // Usa analisi predittiva avanzata con contesto dell'umore
    const predictedTasks = predictOptimalTasksWithMood(adhdContext);
    
    if (predictedTasks.length === 0) {
      return getMoodBasedNoTaskSuggestion();
    }

    let response = getMoodBasedHeader();
    
    // Aggiungi context awareness
    const currentHour = new Date().getHours();
    if (userBehavior.peakEnergyHours.includes(currentHour)) {
      response += "⚡ *Sei nel tuo orario di picco energetico!*\n\n";
    }
    
    predictedTasks.slice(0, 3).forEach((task, index) => {
      const energyEmoji = {
        'molto_bassa': '🟢',
        'bassa': '🟡', 
        'media': '🟠',
        'alta': '🔴',
        'molto_alta': '⚫'
      }[task.energy_required || 'media'] || '🟠';
      
      const score = (task as any).predictedScore || 0;
      const confidence = score > 50 ? '🔥' : score > 30 ? '⭐' : '💡';
      
      response += `${index + 1}. ${confidence} ${energyEmoji} **${task.title || 'Task senza titolo'}**`;
      
      // Aggiungi reasoning AI basato sull'umore
      const moodReasoning = getMoodBasedTaskReasoning(task, adhdContext.todayMood);
      if (moodReasoning) {
        response += ` ${moodReasoning}`;
      }
      
      // Aggiungi reasoning AI standard
      if (userBehavior.preferredTaskTypes.includes(task.task_type)) {
        response += " 💚 *(tipo preferito)*";
      }
      
      if (task.due_date) {
        try {
          const dueDate = new Date(task.due_date);
          const today = new Date();
          const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 1) response += " ⚡ *(URGENTE)*";
          else if (daysUntil <= 3) response += " ⏰ *(Scade presto)*";
        } catch (e) {
          console.warn('Errore nel parsing della data:', task.due_date);
        }
      }
      
      response += `\n   💎 ${task.xp_reward || 0} XP • 🎯 Score: ${score}\n\n`;
    });

    // Aggiungi suggerimento strategico basato su umore ed energia
    response += getMoodBasedStrategicSuggestion(energyLevel);

    return response.trim();
  };

  // Spiega l'ultimo suggerimento con analisi AI avanzata
  const explainLastSuggestion = (): string => {
    if (!tasks || tasks.length === 0) {
      return "Non ho ancora dato suggerimenti specifici perché non vedo task attive. Vuoi che ti aiuti a crearne qualcuna?";
    }

    const activeTasks = tasks.filter(task => task.status !== 'completed');
    if (activeTasks.length === 0) {
      return "Non ho suggerimenti da spiegare perché hai completato tutte le task! 🎉";
    }

    // Controlla se abbiamo effettivamente dato suggerimenti recenti
    if (sessionInsights.messageCount < 2) {
      return "Non ho ancora dato suggerimenti specifici. Vuoi che analizzi le tue task e ti dia qualche consiglio?";
    }

    // Usa la stessa analisi predittiva
    const predictedTasks = predictOptimalTasksWithMood(adhdContext).slice(0, 3);
    
    if (predictedTasks.length === 0) {
      return "Al momento non riesco a dare suggerimenti specifici. Vuoi condividere più informazioni sulle tue task o sul tuo stato attuale?";
    }

    let explanation = "🧠 **Ecco come ragiono sui suggerimenti:**\n\n";
    
    // Aggiungi context generale solo se appropriato
    const currentHour = new Date().getHours();
    const insights = generateProactiveInsights();
    
    // Solo se abbiamo insights reali e non generici
    if (insights.length > 0 && sessionInsights.messageCount > 3) {
      explanation += `📊 *Considerazione:* ${insights[0]}\n\n`;
    }
    
    predictedTasks.forEach((task, index) => {
      const score = (task as any).predictedScore || 0;
      explanation += `**${index + 1}. ${task.title || 'Task senza titolo'}** (Score: ${score})\n`;
      
      const reasons = [];
      
      // Analisi energetica avanzata
      const energyCompatibility = getEnergyCompatibility(task.energy_required, adhdContext.energyLevel || 3);
      if (energyCompatibility > 3) {
        reasons.push("⚡ Perfetta compatibilità energetica");
      } else if (energyCompatibility > 1) {
        reasons.push("🟡 Buona compatibilità energetica");
      }
      
      // Pattern comportamentali
      if (userBehavior.preferredTaskTypes.includes(task.task_type)) {
        reasons.push("💚 Tipo di task che preferisci storicamente");
      }
      
      if (userBehavior.peakEnergyHours.includes(currentHour)) {
        reasons.push("🚀 Sei nel tuo orario di picco energetico");
      }
      
      // Analisi temporale
      if (task.due_date) {
        try {
          const dueDate = new Date(task.due_date);
          const today = new Date();
          const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= 1) {
            reasons.push("⚡ Urgenza critica - scade oggi/domani");
          } else if (daysUntil <= 3) {
            reasons.push("⏰ Scadenza imminente");
          } else if (daysUntil <= 7) {
            reasons.push("📅 Scadenza settimanale");
          }
        } catch (e) {
          console.warn('Errore nel parsing della data:', task.due_date);
        }
      }
      
      // Analisi reward
      const xp = task.xp_reward || 0;
      if (xp >= 50) {
        reasons.push("💎 Alto valore motivazionale (XP elevato)");
      } else if (xp >= 20) {
        reasons.push("💰 Buon ritorno motivazionale");
      }
      
      // Analisi working memory
      if (adhdContext.workingMemoryLoad && adhdContext.workingMemoryLoad > 7 && task.energy_required === 'molto_bassa') {
        reasons.push("🧠 Task semplice per alleggerire il carico cognitivo");
      }
      
      if (reasons.length > 0) {
        explanation += reasons.map(reason => `   • ${reason}`).join('\n') + '\n';
      } else {
        explanation += "   • Task bilanciata secondo i tuoi pattern\n";
      }
      
      explanation += '\n';
    });
    
    // Aggiungi strategia generale
    explanation += "🎯 **Strategia AI:**\n";
    if (adhdContext.energyLevel && adhdContext.energyLevel <= 2) {
      explanation += "• Ho prioritizzato task a bassa energia per evitare overwhelm\n";
    } else if (adhdContext.energyLevel && adhdContext.energyLevel >= 4) {
      explanation += "• Ho sfruttato la tua alta energia per task impegnative\n";
    }
    
    explanation += `• Analisi basata su ${sessionInsights.messageCount} messaggi e pattern comportamentali\n`;
    explanation += "• Algoritmo ottimizzato con machine learning locale";
    
    return explanation;
  };

  // Suggerisce azioni basate sull'intent
  const suggestAction = (intent: string) => {
    const actions = {
      overwhelm: () => onActionSuggested?.('activate_focus_mode'),
      focus: () => onActionSuggested?.('start_pomodoro'),
      energy_low: () => onActionSuggested?.('show_low_energy_tasks'),
      energy_high: () => onActionSuggested?.('show_high_priority_tasks'),
      procrastination: () => onActionSuggested?.('start_2min_timer'),
      task_selection: () => onActionSuggested?.('activate_focus_mode'),
      project_organization: () => onActionSuggested?.('organize_projects'),
      text_processing: () => onActionSuggested?.('process_text'),
      text_commands: () => onActionSuggested?.('execute_command')
    };
    
    const action = actions[intent as keyof typeof actions];
    if (action) action();
  };

  // Processamento del messaggio utente
  const processMessage = async (message: string): Promise<string> => {
    // Simula tempo di "pensiero" per realismo
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Analizza intent
    const { intent, confidence } = analyzeIntent(message);
    
    // Gestione comandi specifici
    if (intent === 'text_commands') {
      const actions = extractActionsFromText(message);
      if (actions.length > 0) {
        const actionsList = actions.map(action => `• ${action}`).join('\n');
        return `🎯 Ho identificato queste azioni nel tuo testo:\n\n${actionsList}\n\n💡 Vuoi che le trasformi in task specifici?`;
      }
      
      // Se non ci sono azioni, offri semplificazione
      const simplified = simplifyText(message);
      return `📝 Ecco il testo semplificato:\n\n${simplified}\n\n✨ Più chiaro così?`;
    }
    
    // Gestione riorganizzazione progetti
    if (intent === 'project_organization') {
      return handleProjectOrganization(message);
    }
    
    // Gestione rielaborazione testi
    if (intent === 'text_processing') {
      return handleTextProcessing(message);
    }
    
    // Se l'utente chiede spiegazioni sui suggerimenti
    if (intent === 'why_suggestion') {
      return explainLastSuggestion();
    }
    
    // Gestione specifica per domande su dove fare liste o organizzare
    if (/dove.*lista|dove.*faccio|dove.*posso.*fare/i.test(message)) {
      const mood = adhdContext.todayMood?.mood;
      if (mood === 'disorientato') {
        return "Perfetto! Quando sei disorientato, fare una lista è la strategia migliore. Hai diverse opzioni:\n\n" +
               "📱 **Nell'app:**\n" +
               "• 📝 **Attività** - per task concrete con scadenze\n" +
               "• 🧠 **Note** - per scaricare tutti i pensieri che hai in testa\n\n" +
               "📝 **Su carta:** A volte scrivere a mano aiuta a sbloccarsi\n\n" +
               "💻 **Note digitali:** Qualsiasi app di note che preferisci\n\n" +
               "🎯 **Il mio consiglio:** Inizia con le Note per svuotare la mente, poi sposta le cose importanti nelle Attività. Quale preferisci provare?";
      }
      return "Hai diverse opzioni per fare liste:\n\n" +
             "📱 **Attività** - per task organizzate\n" +
             "🧠 **Note** - per pensieri liberi\n" +
             "📝 **Carta e penna** - per chi preferisce scrivere a mano\n\n" +
             "Quale ti sembra più adatta ora?";
    }
    
    // Gestione approccio ai progetti
    if (intent === 'project_approach') {
      return handleProjectApproachSuggestion(message);
    }
    
    // Se l'utente chiede task specifiche o vuole creare una task
    if (intent === 'task_selection' || /task|fare|lavoro|attivit|sugger|consig/i.test(message)) {
      // Controlla se è una richiesta di creazione task
      if (/(?:crea|aggiungi|fai|nuovo)\s*(?:una?\s*)?(?:task|attività)|voglio.*creare/i.test(message)) {
        const taskTitle = extractTaskTitle(message);
        
        // Aggiungi il messaggio alla chat
        const newMessage = {
          id: Date.now().toString(),
          text: `Perfetto! Ho capito che vuoi creare la task "${taskTitle}". \n\n🎯 Vuoi che la organizzi subito o preferisci prima suddividerla in micro-task?`,
          sender: 'bot' as const,
          timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, newMessage]);
        
        // Suggerisci azione di creazione task
        if (onActionSuggested) {
          onActionSuggested('create_task', { title: taskTitle, context: 'chat_creation' });
        }
        
        return `Perfetto! Ho capito che vuoi creare la task "${taskTitle}". \n\n🎯 Vuoi che la organizzi subito o preferisci prima suddividerla in micro-task?`;
      }
      
      // Altrimenti suggerisci task esistenti
      let taskSuggestions = suggestSpecificTasks(intent, adhdContext?.energyLevel);
      
      // Migliora i suggerimenti con il contesto dell'umore se disponibile
      if (adhdContext.todayMood) {
        taskSuggestions = enhanceResponseWithMoodContext(taskSuggestions, intent, adhdContext.todayMood);
      }
      
      // Suggerisci azione se appropriato
      if (confidence > 0.7) {
        suggestAction(intent);
      }
      
      return taskSuggestions;
    }
    
    // Genera risposta base
    const baseResponse = getRandomResponse(intent);
    
    // Personalizza con contesto ADHD
    let personalizedResponse = personalizeResponse(baseResponse, intent);
    
    // Migliora la risposta con il contesto dell'umore se disponibile
    if (adhdContext.todayMood) {
      personalizedResponse = enhanceResponseWithMoodContext(personalizedResponse, intent, adhdContext.todayMood);
    }
    
    // Suggerisci azione se appropriato
    if (confidence > 0.7) {
      suggestAction(intent);
    }
    
    return personalizedResponse;
  };

  // Funzione per gestire suggerimenti di approccio ai progetti
  const handleProjectApproachSuggestion = (message: string): string => {
    const mood = adhdContext.todayMood?.mood;
    const energyLevel = adhdContext.energyLevel || 3;
    
    // Se ci sono progetti reali, suggerisci quelli
    if (projects.length > 0) {
      let response = "🎯 Perfetto! Vedo che hai questi progetti attivi:\n\n";
      
      // Mostra i progetti basandosi sull'energia e umore
      const suitableProjects = projects.filter(project => {
        if (energyLevel <= 2) {
          return project.energy_required === 'molto_bassa' || project.energy_required === 'bassa';
        } else if (energyLevel >= 4) {
          return project.energy_required === 'alta' || project.energy_required === 'molto_alta';
        }
        return true;
      }).slice(0, 3);
      
      if (suitableProjects.length > 0) {
        response += "**📋 Progetti adatti al tuo stato attuale:**\n";
        suitableProjects.forEach((project, index) => {
          response += `${index + 1}. **${project.title}** (${project.status})\n`;
          if (project.description) {
            response += `   ${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}\n`;
          }
          response += `   Energia richiesta: ${project.energy_required}\n\n`;
        });
        
        response += "💡 **Suggerimento:** ";
        if (mood === 'in_flusso') {
          response += "Sei in flusso! Scegli il progetto che ti ispira di più e tuffati subito.";
        } else if (mood === 'disorientato') {
          response += "Quando sei disorientato, inizia dal progetto più semplice per creare momentum.";
        } else if (mood === 'congelato') {
          response += "Quando ti senti bloccato, scegli il progetto con energia più bassa per iniziare gradualmente.";
        } else if (mood === 'ispirato') {
          response += "Sei ispirato! È il momento perfetto per il progetto più creativo o ambizioso.";
        } else {
          response += "Scegli il progetto che ti attira di più in questo momento.";
        }
        
        response += "\n\n❓ **Su quale progetto vuoi concentrarti?**";
        return response;
      }
    }
    
    // Se non ci sono progetti o nessuno è adatto, dai consigli generali
    let response = "";
    
    if (mood === 'in_flusso') {
      response = "🔥 Perfetto! Sei 'in flusso' - questo è il momento ideale per lavorare su un progetto!\n\n";
      response += "**🎯 Strategia per il tuo progetto:**\n\n";
      response += "1. **🚀 Inizia subito** - Segui il tuo istinto\n";
      response += "2. **⏰ Imposta un timer** (45-90 min) per mantenere il focus\n";
      response += "3. **🔕 Elimina distrazioni** - telefono in modalità aereo\n";
      response += "4. **📝 Usa le Note** per catturare idee che emergono\n";
      response += "5. **🎵 Musica di sottofondo** se ti aiuta a concentrarti\n\n";
      response += "💡 **Suggerimento:** Inizia dalla parte che ti attira di più, non necessariamente dall'inizio logico.\n\n";
      
      response += "**🎯 Azioni immediate:**\n";
      response += "• 📂 **Apri il progetto** e guarda cosa c'è\n";
      response += "• 🔍 **Esplora i contenuti** per 15 minuti\n";
      response += "• 📝 **Scrivi 3 idee** di miglioramento\n";
      response += "• 🎨 **Migliora qualcosa di piccolo** che vedi subito\n\n";
      response += "🔥 *Quando sei in flusso, fidati del tuo istinto!*";
    } else if (mood === 'disorientato') {
      response = "⚡ Vedo che sei 'disorientato' ma hai energia! Perfetto per organizzare l'approccio al progetto.\n\n";
      response += "**🗺️ Strategia di orientamento:**\n\n";
      response += "1. **📋 Scarica tutto** - Scrivi tutto quello che sai del progetto (5 min)\n";
      response += "2. **🎯 Identifica l'obiettivo** - Cosa vuoi ottenere?\n";
      response += "3. **🔍 Primo passo concreto** - La cosa più piccola e specifica\n";
      response += "4. **📊 Dividi in fasi** - Massimo 3-4 macro-fasi\n";
      response += "5. **⏱️ Stima i tempi** - Sii realistico\n\n";
      
      response += "**🧭 Primi passi concreti:**\n";
      response += "• 🧠 **Note**: Scarica tutto quello che pensi del progetto\n";
      response += "• 📋 **Lista 3 obiettivi**: Cosa vuoi ottenere?\n";
      response += "• 🔍 **Identifica 1 azione**: La più piccola e concreta\n";
      response += "• ⏰ **Pianifica quando**: Oggi, domani, questa settimana?\n";
      response += "• 🎯 **Task Manager**: Trasforma tutto in task specifiche\n\n";
      response += "⚡ *L'energia ha bisogno di struttura per diventare produttiva!*";
    } else if (mood === 'congelato') {
      response = "🧊 Ti senti bloccato? È normale con progetti grandi. Iniziamo gradualmente!\n\n";
      response += "**❄️ Strategia per sbloccarsi:**\n\n";
      response += "1. **🔍 Trova la cosa più piccola** - Anche solo aprire un file\n";
      response += "2. **⏱️ Timer di 2 minuti** - Fai solo quello, poi fermati\n";
      response += "3. **🎯 Un'azione fisica** - Preparare l'ambiente, organizzare\n";
      response += "4. **👥 Lavora con qualcuno** - Anche virtualmente\n";
      response += "5. **🏆 Celebra ogni passo** - Anche il più piccolo conta\n\n";
      
      response += "**🔓 Micro-azioni per iniziare:**\n";
      response += "• 📂 **Apri la cartella** del progetto (30 secondi)\n";
      response += "• 👀 **Guarda un file** qualsiasi (1 minuto)\n";
      response += "• 📝 **Scrivi una riga** di nota\n";
      response += "• 🧹 **Organizza un file** o cartella\n";
      response += "• ☕ **Prepara l'ambiente** (caffè, musica, luce)\n\n";
      response += "🧊 *Il movimento crea movimento. Inizia da qualsiasi punto!*";
    } else if (mood === 'ispirato') {
      response = "💡 Sei ispirato! Momento perfetto per dare vita alle tue visioni.\n\n";
      response += "**✨ Strategia creativa:**\n\n";
      response += "1. **🎨 Cattura la visione** - Scrivi/disegna quello che immagini\n";
      response += "2. **🌟 Identifica l'essenza** - Qual è il cuore del progetto?\n";
      response += "3. **🚀 Prototipo rapido** - Crea una versione minima ma funzionante\n";
      response += "4. **🔄 Itera velocemente** - Migliora in cicli brevi\n";
      response += "5. **📱 Documenta tutto** - Le idee ispirate vanno e vengono\n\n";
      
      response += "**🎨 Azioni creative immediate:**\n";
      response += "• 💭 **Brainstorm 10 minuti**: Scrivi tutte le idee che hai\n";
      response += "• 🎯 **Definisci la visione**: In una frase, cosa vuoi creare?\n";
      response += "• 🚀 **Prototipo veloce**: Crea qualcosa di funzionante in 30 min\n";
      response += "• 📊 **Mappa le funzionalità**: Cosa deve fare il progetto?\n";
      response += "• 🎨 **Migliora l'estetica**: Colori, layout, user experience\n\n";
      response += "💡 *L'ispirazione senza azione rimane solo un sogno!*";
    } else {
      // Suggerimenti generali quando non c'è info sull'umore
      response = "🎯 Ottima domanda! Ecco come approcciarsi strategicamente a un progetto:\n\n";
      response += "**📋 Framework per progetti:**\n\n";
      response += "1. **🧠 Scarica tutto** - Scrivi tutto quello che sai (10 minuti)\n";
      response += "2. **🎯 Definisci l'obiettivo** - Una frase chiara\n";
      response += "3. **🔍 Primo passo concreto** - Cosa puoi fare nei prossimi 15 minuti?\n";
      response += "4. **📊 Spezza in micro-task** - Massimo 2 ore per task\n";
      response += "5. **⏰ Pianifica quando** - Orari specifici\n\n";
      
      response += "**🎯 Primi passi pratici:**\n";
      response += "• 📝 **Scarica le idee** - Scrivi tutto quello che sai\n";
      response += "• 🎯 **Definisci l'obiettivo** in una frase chiara\n";
      response += "• 🔍 **Identifica la prima azione** concreta e specifica\n";
      response += "• ⏰ **Pianifica quando farla** - oggi, domani, quando?\n";
      response += "• 📱 **Crea le task** nel Task Manager\n\n";
      response += "💡 **Suggerimento:** Inizia dalla parte che ti incuriosisce di più, non dall'inizio 'logico'.";
    }
    
    // Se non ci sono progetti specifici, suggerisci di crearne uno
    if (projects.length === 0) {
      response += "\n\n💡 **Suggerimento:** Non vedo progetti attivi. Vuoi crearne uno nuovo per organizzare meglio il tuo lavoro?";
    }
    
    response += "\n\n❓ **Come preferisci procedere?**";
    
    return response;
  };
  
  // Gestione comandi specifici
  const handleTextCommands = (message: string): string => {
    if (/\/riorganizza/i.test(message)) {
      return "🔄 Comando riorganizzazione attivato! Analizzando le tue note per creare una struttura più logica...";
    }
    if (/\/semplifica/i.test(message)) {
      return "✨ Comando semplificazione attivato! Rendendo il contenuto più chiaro...";
    }
    if (/\/estrai-task/i.test(message)) {
      return "📋 Comando estrazione task attivato! Identificando le azioni concrete dal testo...";
    }
    if (/\/raggruppa/i.test(message)) {
      return "📁 Comando raggruppamento attivato! Organizzando elementi simili insieme...";
    }
    if (/\/progetti/i.test(message)) {
      return "🎯 Comando progetti attivato! Creando progetti basati sui tuoi pattern di lavoro...";
    }
    if (/\/analizza/i.test(message)) {
      return "🔍 Comando analisi attivato! Esaminando i tuoi contenuti per insights e suggerimenti...";
    }
    return "❓ Comando non riconosciuto. Comandi disponibili: /riorganizza, /semplifica, /estrai-task, /raggruppa, /progetti, /analizza";
  };

  // Gestione riorganizzazione progetti
  const handleProjectOrganization = (message: string): string => {
    const responses = CHATBOT_RESPONSES.project_organization;
    const baseResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Aggiungi suggerimenti specifici se ci sono task
    if (tasks && tasks.length > 0) {
      const taskTypes = [...new Set(tasks.map(t => t.task_type))];
      if (taskTypes.length > 1) {
        return baseResponse + `\n\n💡 Ho rilevato task di tipo: ${taskTypes.join(', ')}. Posso creare progetti tematici per organizzarle meglio.`;
      }
    }
    
    return baseResponse;
  };

  // Gestione rielaborazione testi
   const handleTextProcessing = (message: string): string => {
     const responses = CHATBOT_RESPONSES.text_processing;
     const baseResponse = responses[Math.floor(Math.random() * responses.length)];
     
     // Aggiungi suggerimenti specifici basati sul messaggio
     if (/lungo|complesso|difficile/i.test(message)) {
       return baseResponse + "\n\n🎯 Perfetto per testi complessi! Posso spezzarli in sezioni più digeribili.";
     }
     
     if (/azioni|task|fare/i.test(message)) {
       return baseResponse + "\n\n📋 Ottimo! Posso identificare tutte le azioni concrete e trasformarle in task specifiche.";
     }
     
     return baseResponse;
   };
   
   // Funzione per analizzare le note del Mental Inbox
   const analyzeMentalInboxForProjects = async (): Promise<string[]> => {
     try {
       // Questa funzione sarà implementata quando il database sarà aggiornato
       // Per ora restituisce suggerimenti mock basati sui pattern esistenti
       const suggestions: string[] = [];
       
       if (tasks && tasks.length > 0) {
         const taskKeywords = extractCommonKeywords();
         if (taskKeywords.length > 0) {
           suggestions.push(`📝 Ho analizzato le tue note e task. Posso creare il progetto "${taskKeywords[0].charAt(0).toUpperCase() + taskKeywords[0].slice(1)}" per organizzare tutto?`);
         }
       }
       
       return suggestions;
     } catch (error) {
       console.error('Error analyzing mental inbox:', error);
       return [];
     }
   };
   
   // Funzione per estrarre azioni da testo
   const extractActionsFromText = (text: string): string[] => {
     const actions: string[] = [];
     
     // Pattern per identificare azioni
     const actionPatterns = [
       /(?:devo|dovrei|bisogna|occorre|serve)\s+([^.!?]+)/gi,
       /(?:fare|completare|finire|iniziare|chiamare|comprare|scrivere|inviare)\s+([^.!?]+)/gi,
       /(?:ricordare di|non dimenticare di)\s+([^.!?]+)/gi
     ];
     
     actionPatterns.forEach(pattern => {
       let match;
       while ((match = pattern.exec(text)) !== null) {
         const action = match[1].trim();
         if (action.length > 3 && action.length < 100) {
           actions.push(action);
         }
       }
     });
     
     return [...new Set(actions)]; // Rimuovi duplicati
   };
   
   // Funzione per semplificare testo
   const simplifyText = (text: string): string => {
     // Spezza frasi lunghe
     let simplified = text.replace(/([.!?])\s+/g, '$1\n\n');
     
     // Aggiungi bullet points per liste
     simplified = simplified.replace(/(?:^|\n)(?:\d+\.\s*|[-•]\s*)?([^\n]+)/gm, (match, content) => {
       if (content.trim().length > 0) {
         return `\n• ${content.trim()}`;
       }
       return match;
     });
     
     // Evidenzia parole chiave importanti
     const keywords = ['importante', 'urgente', 'scadenza', 'deadline', 'priorità'];
     keywords.forEach(keyword => {
       const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
       simplified = simplified.replace(regex, `**${keyword.toUpperCase()}**`);
     });
     
     return simplified.trim();
   };

  // Nuove funzioni per la chat testuale
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Assicurati che il chatbot rimanga aperto durante l'interazione
    if (!isOpen) {
      setIsOpen(true);
    }
    
    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user' as const,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    
    // Aggiorna contatore messaggi
    setSessionInsights(prev => ({
      ...prev,
      messageCount: prev.messageCount + 1
    }));
    
    // Analizza intent e genera risposta
    setTimeout(async () => {
      const botResponse = await generateBotResponse(userMessage.text);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse.text,
        sender: 'bot' as const,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // Esegui azioni se necessario
      if (botResponse.action && onActionSuggested) {
        onActionSuggested(botResponse.action.type, botResponse.action.data);
      }
      
      // Aggiorna quick actions se necessario
      if (botResponse.updateQuickActions) {
        const newQuickActions = getContextualQuickActions(adhdContext);
        setCurrentQuickActions(newQuickActions);
      }
    }, 1000 + Math.random() * 1000); // Simula tempo di "pensiero"
  };
  
  const generateBotResponse = async (userInput: string): Promise<{
    text: string;
    action?: { type: string; data: any };
    updateQuickActions?: boolean;
  }> => {
    const intent = detectIntent(userInput);
    const context = {
      ...adhdContext,
      tasks,
      projects,
      userBehavior,
      conversationHistory: chatMessages
    };
    
    // Aggiorna contesto conversazione
    setConversationContext({ lastIntent: intent, awaitingResponse: false });
    
    // Prova prima con AI Service se disponibile
    console.log('🔍 Controllo AI Service - aiService:', !!aiService, 'aiReady:', aiReady);
    if (aiService && aiReady) {
      console.log('✅ Usando AI Service per risposta');
      try {
        const aiResponse = await aiService.chatbot({
          message: userInput,
          context: {
            adhdContext: context,
            intent: intent,
            timestamp: new Date().toISOString()
          }
        });
        
        return {
          text: aiResponse.message,
          action: aiResponse.actions && aiResponse.actions.length > 0 ? {
            type: aiResponse.actions[0].action,
            data: aiResponse.actions[0]
          } : undefined,
          updateQuickActions: true
        };
      } catch (aiError) {
        console.warn('⚠️ AI Service error, fallback to predefined responses:', aiError);
      }
    }
    
    // Fallback a risposte predefinite
    console.log('⚠️ Usando risposte predefinite - aiService:', !!aiService, 'aiReady:', aiReady);
    switch (intent) {
      case 'task_creation':
        return handleTaskCreation(userInput, context);
      case 'task_breakdown':
        return handleTaskBreakdown(userInput, context);
      case 'energy_management':
        return handleEnergyManagement(userInput, context);
      case 'motivation_boost':
        return handleMotivationBoost(userInput, context);
      case 'progress_check':
        return handleProgressCheck(userInput, context);
      case 'overwhelm':
        return handleOverwhelm(userInput, context);
      case 'focus':
        return handleFocusHelp(userInput, context);
      case 'greeting':
        return handleGreeting(userInput, context);
      default:
        return handleGeneralQuery(userInput, context);
    }
  };
  
  const detectIntent = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    // Pattern per creazione task
    if (/(?:crea|aggiungi|fai|nuovo|potresti.*creare|puoi.*creare|vorrei.*creare)\s*(?:una?\s*)?(?:task|attività)|devo.*fare|ho.*da.*fare|task.*per|voglio.*creare|task.*che.*si.*chiami/i.test(input)) {
      return 'task_creation';
    }
    
    // Pattern per suddivisione task
    if (/suddividi|spezza|dividi|micro.*task|step|passi|come.*faccio/i.test(input)) {
      return 'task_breakdown';
    }
    
    // Pattern per gestione energia
    if (/energia|stanco|carico|motivato|forza|spossato/i.test(input)) {
      return 'energy_management';
    }
    
    // Pattern per motivazione
    if (/motivazione|scoraggiato|non.*ce.*la.*faccio|arrendo|inutile/i.test(input)) {
      return 'motivation_boost';
    }
    
    // Pattern per controllo progressi
    if (/progressi|come.*sto|risultati|bilancio|fatto.*oggi/i.test(input)) {
      return 'progress_check';
    }
    
    // Usa i pattern esistenti per altri intent
    for (const [intentName, pattern] of Object.entries(INTENT_PATTERNS)) {
      if (pattern.test(input)) {
        return intentName;
      }
    }
    
    return 'general';
  };
  
  const handleTaskCreation = async (input: string, context: any) => {
    // Estrai il titolo della task dall'input
    const taskTitle = extractTaskTitle(input);
    
    return {
      text: `Perfetto! Ho capito che vuoi creare la task "${taskTitle}". \n\n🎯 Vuoi che la organizzi subito o preferisci prima suddividerla in micro-task?`,
      action: {
        type: 'create_task',
        data: { title: taskTitle, context: 'chat_creation' }
      },
      updateQuickActions: true
    };
  };
  
  const handleTaskBreakdown = async (input: string, context: any) => {
    const taskToBreak = findTaskInInput(input, context.tasks) || 'la task che hai menzionato';
    
    return {
      text: `Ottima idea! Spezzare ${taskToBreak} in micro-task renderà tutto più gestibile. \n\n✨ Ecco come possiamo procedere:\n• Step 1: Definire l'obiettivo finale\n• Step 2: Identificare le azioni concrete\n• Step 3: Stimare il tempo per ogni step\n\n🚀 Iniziamo dal primo step?`,
      action: {
        type: 'breakdown_task',
        data: { task: taskToBreak }
      }
    };
  };
  
  const handleEnergyManagement = async (input: string, context: any) => {
    const energyLevel = context.energyLevel || 5;
    const isLowEnergy = /stanco|spossato|senza.*energia|scarico/i.test(input);
    const isHighEnergy = /carico|motivato|energia.*alta|pieno.*energia/i.test(input);
    
    if (isLowEnergy || energyLevel <= 3) {
      const lowEnergyTasks = context.tasks?.filter((t: any) => 
        t.energy_required === 'molto_bassa' || t.energy_required === 'bassa'
      ) || [];
      
      return {
        text: `Capisco, l'energia è bassa oggi. 🔋\n\n💡 Ho trovato ${lowEnergyTasks.length} task perfette per il tuo livello energetico attuale. Sono tutte leggere e ti daranno soddisfazione senza sfiniriti!\n\n🌟 Vuoi che te ne mostri una per iniziare dolcemente?`,
        action: {
          type: 'filter_low_energy_tasks',
          data: { tasks: lowEnergyTasks }
        }
      };
    } else if (isHighEnergy || energyLevel >= 7) {
      return {
        text: `Fantastico! Sento l'energia alta! ⚡\n\n🔥 È il momento perfetto per affrontare le task più impegnative. La tua energia è al top e puoi fare grandi cose!\n\n🎯 Quale progetto importante vuoi portare avanti oggi?`,
        action: {
          type: 'suggest_high_energy_tasks',
          data: { energyLevel }
        }
      };
    }
    
    return {
      text: `La tua energia sembra equilibrata! 🌟\n\nPerfetto per task di media intensità. Vuoi che ti suggerisca qualcosa di produttivo ma non troppo impegnativo?`
    };
  };
  
  const handleMotivationBoost = async (input: string, context: any) => {
    const motivationalMessages = [
      "🌟 Ehi, lo so che è dura, ma sei più forte di quanto pensi! Ogni piccolo passo conta.",
      "💪 Ricorda: non devi essere perfetto, devi solo iniziare. Un micro-task alla volta!",
      "🎯 Hai già superato momenti difficili prima d'ora. Questa volta non sarà diverso!",
      "✨ Il fatto che tu sia qui a chiedere aiuto dimostra già la tua determinazione. Sei sulla strada giusta!"
    ];
    
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    
    return {
      text: `${randomMessage}\n\n🚀 Che ne dici se iniziamo con qualcosa di piccolissimo? Anche 5 minuti possono fare la differenza!`,
      action: {
        type: 'motivation_boost',
        data: { type: 'encouragement' }
      }
    };
  };
  
  const handleProgressCheck = async (input: string, context: any) => {
    const completedToday = context.tasks?.filter((t: any) => 
      t.completed_at && new Date(t.completed_at).toDateString() === new Date().toDateString()
    ).length || 0;
    
    const totalTasks = context.tasks?.length || 0;
    
    return {
      text: `📊 Ecco il tuo bilancio di oggi:\n\n✅ Task completate: ${completedToday}\n📝 Task totali: ${totalTasks}\n\n${completedToday > 0 ? '🎉 Ottimo lavoro! Ogni task completata è una vittoria!' : '💪 Oggi può essere il giorno giusto per iniziare! Quale task ti ispira di più?'}`,
      action: {
        type: 'show_progress',
        data: { completed: completedToday, total: totalTasks }
      }
    };
  };
  
  const handleOverwhelm = async (input: string, context: any) => {
    return {
      text: `Respira. 🌬️ Lo so che sembra tutto troppo, ma sei al sicuro.\n\n🎯 Facciamo così: dimmi UNA cosa che ti preoccupa di più in questo momento. Solo una. Affrontiamola insieme, passo dopo passo.\n\n💡 Ricorda: non devi fare tutto oggi. Devi solo fare il prossimo piccolo passo.`,
      action: {
        type: 'handle_overwhelm',
        data: { strategy: 'one_thing_focus' }
      }
    };
  };
  
  const handleFocusHelp = async (input: string, context: any) => {
    return {
      text: `🎯 Capisco, la concentrazione è una sfida! \n\n💡 Proviamo la tecnica del "Focus Laser":\n• Scegli UNA task\n• Timer 15 minuti\n• Elimina distrazioni\n• Solo quella task, nient'altro\n\n🚀 Quale task vuoi provare con questa tecnica?`,
      action: {
        type: 'enable_focus_mode',
        data: { technique: 'laser_focus' }
      }
    };
  };

  const handleGreeting = async (input: string, context: any) => {
    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 12 ? 'mattina' : currentHour < 17 ? 'pomeriggio' : currentHour < 21 ? 'sera' : 'notte';
    
    // Risposte personalizzate basate su contesto e orario
    const greetings = {
      mattina: [
        "Ciao! ☀️ Buongiorno! Come ti senti oggi? Pronto per affrontare la giornata?",
        "Ehi, ciao! 🌅 Che energia hai stamattina? Vediamo cosa possiamo fare insieme!",
        "Ciao! 😊 Buongiorno! Come iniziamo questa giornata nel modo migliore?"
      ],
      pomeriggio: [
        "Ciao! 👋 Come va il pomeriggio? Come ti senti con l'energia?",
        "Ehi, ciao! ☀️ Come procede la giornata? Posso aiutarti con qualcosa?",
        "Ciao! 😊 Buon pomeriggio! Dimmi, come stai andando oggi?"
      ],
      sera: [
        "Ciao! 🌆 Buonasera! Come è andata la giornata?",
        "Ehi, ciao! 🌙 Come ti senti stasera? Vuoi fare il punto della giornata?",
        "Ciao! 😊 Buonasera! Rilassiamoci un po', come posso aiutarti?"
      ],
      notte: [
        "Ciao! 🌙 Ancora sveglio? Come posso aiutarti?",
        "Ehi, ciao! ✨ Notte fonda... tutto ok? Dimmi come stai.",
        "Ciao! 😊 Ciao nottambulo! Come posso supportarti?"
      ]
    };
    
    // Aggiungi contesto basato sull'umore se disponibile
    let contextualAddition = "";
    if (context.adhdContext?.todayMood?.mood) {
      const mood = context.adhdContext.todayMood.mood;
      switch (mood) {
        case 'energico':
          contextualAddition = " Vedo che oggi ti senti energico! 💪";
          break;
        case 'concentrato':
          contextualAddition = " Ottimo che ti senti concentrato oggi! 🎯";
          break;
        case 'disorientato':
          contextualAddition = " Vedo che oggi ti senti un po' disorientato, nessun problema! 🤗";
          break;
        case 'sopraffatto':
          contextualAddition = " Capisco che oggi ti senti sopraffatto, sono qui per aiutarti! 💙";
          break;
      }
    }
    
    const timeGreetings = greetings[timeOfDay as keyof typeof greetings];
    const selectedGreeting = timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
    
    return {
      text: selectedGreeting + contextualAddition,
      updateQuickActions: true
    };
  };
  
  const handleGeneralQuery = async (input: string, context: any) => {
    const responses = [
      "Interessante! Dimmi di più, così posso aiutarti meglio. 🤔",
      "Capisco. Come posso supportarti in questo? 💪",
      "Ok, vedo. Vuoi che ti dia qualche suggerimento pratico? ✨",
      "Comprendo la situazione. Affrontiamola insieme! 🎯"
    ];
    
    return {
      text: responses[Math.floor(Math.random() * responses.length)]
    };
  };
  
  // Funzioni di utilità
  const extractTaskTitle = (input: string): string => {
    // Pattern più intelligenti per estrarre il titolo della task
    let title = input.trim();
    
    // Rimuovi pattern di comando all'inizio
    title = title.replace(/^(crea|aggiungi|nuovo|fai|devo fare|ho da fare)\s*(una?\s*)?(task|attività)\s*(di|per|su)?\s*/gi, '');
    
    // Rimuovi articoli e preposizioni all'inizio
    title = title.replace(/^(un|una|il|la|lo|gli|le|di|per|su|con|da)\s+/gi, '');
    
    // Se il titolo è troppo corto o vuoto, usa un default
    if (!title || title.length < 2) {
      return 'Nuova task';
    }
    
    // Capitalizza la prima lettera
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    return title;
  };
  
  const findTaskInInput = (input: string, tasks: any[]): string | null => {
    if (!tasks) return null;
    
    for (const task of tasks) {
      if (input.toLowerCase().includes(task.title.toLowerCase())) {
        return task.title;
      }
    }
    return null;
  };

  // Gestione click su quick actions - Esegue azioni concrete
  const handleQuickActionClick = async (action: QuickAction) => {
    try {
      // Assicurati che il chatbot rimanga aperto durante l'interazione
      if (!isOpen) {
        setIsOpen(true);
      }
      
      // Log dell'interazione del chatbot
      logChatbotInteraction({
        actionType: action.action,
        actionLabel: action.label,
        context: {
          mood: adhdContext.dailyMood,
          energyLevel: adhdContext.energyLevel,
          focusMode: adhdContext.focusMode,
          activeTasks: adhdContext.activeTasks,
          timeOfDay: new Date().getHours()
        },
        metadata: {
          category: action.category || 'general',
          priority: action.priority || 'medium',
          expectedOutcome: action.context
        }
      });

      let result = '';
      
      // Esegui azioni concrete basate sul tipo
      switch (action.action) {
        case 'manage_energy':
          if (adhdContext.energyLevel && adhdContext.energyLevel <= 3) {
            // Filtra task a bassa energia
            const lowEnergyTasks = tasks?.filter(t => 
              t.energy_required === 'molto_bassa' || t.energy_required === 'bassa'
            ) || [];
            result = `Trovati ${lowEnergyTasks.length} task adatti alla tua energia attuale`;
            if (onActionSuggested) {
              onActionSuggested('filter_low_energy_tasks', { tasks: lowEnergyTasks });
            }
          } else if (adhdContext.energyLevel && adhdContext.energyLevel >= 7) {
            // Suggerisci task impegnativi
            const highEnergyTasks = tasks?.filter(t => 
              t.energy_required === 'alta' || t.energy_required === 'molto_alta'
            ) || [];
            result = `${highEnergyTasks.length} task impegnativi disponibili per la tua energia`;
            if (onActionSuggested) {
              onActionSuggested('suggest_high_energy_tasks', { tasks: highEnergyTasks });
            }
          }
          break;
          
        case 'organize_tasks':
          // Attiva modalità organizzazione
          result = `Organizzando ${tasks?.length || 0} task per priorità`;
          if (onActionSuggested) {
            onActionSuggested('organize_tasks_by_priority', { tasks });
          }
          break;
          
        case 'improve_focus':
          // Attiva focus mode
          result = 'Focus Mode attivato - Mostrando solo task prioritari';
          if (onActionSuggested) {
            onActionSuggested('enable_focus_mode', { focusMode: true });
          }
          break;
          
        case 'view_progress':
          // Mostra statistiche
          const completedToday = tasks?.filter(t => 
            t.completed_at && new Date(t.completed_at).toDateString() === new Date().toDateString()
          ).length || 0;
          result = `Completati oggi: ${completedToday} task`;
          if (onActionSuggested) {
            onActionSuggested('show_progress_stats', { completedToday });
          }
          break;
          
        case 'quick_action':
          // Suggerisci prossima azione immediata
          const nextTask = tasks?.find(t => !t.completed_at);
          result = nextTask ? `Prossimo: ${nextTask.title}` : 'Nessun task in sospeso';
          if (onActionSuggested && nextTask) {
            onActionSuggested('suggest_next_task', { task: nextTask });
          }
          break;
          
        case 'prioritize_tasks':
          // Apri modalità prioritizzazione
          result = 'Modalità prioritizzazione attivata';
          if (onActionSuggested) {
            onActionSuggested('open_prioritization_mode', { tasks });
          }
          break;
          
        case 'take_break':
          // Suggerisci pausa
          result = 'Pausa di 5 minuti consigliata';
          if (onActionSuggested) {
            onActionSuggested('suggest_break', { duration: 5 });
          }
          break;
          
        default:
          result = `Azione ${action.label} eseguita`;
          if (onActionSuggested) {
            onActionSuggested(action.action, { context: action.context });
          }
      }
      
      setLastActionResult(result);
      
      // Aggiorna le quick actions dopo l'azione
      const newQuickActions = getContextualQuickActions(adhdContext);
      setCurrentQuickActions(newQuickActions);
      
      // Mostra toast di conferma
      toast({
        title: "Azione eseguita",
        description: result,
        duration: 3000
      });
      
    } catch (error) {
      console.error('Errore nell\'eseguire l\'azione:', error);
      toast({
        title: "Errore",
        description: "Problema nell'eseguire l'azione. Riprova.",
        variant: "destructive"
      });
    }
  };



  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 z-40 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
        size="lg"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 z-50 w-full max-w-sm shadow-2xl border-2 border-primary/20 sm:w-80 flex flex-col transition-all duration-200 ${isMinimized ? 'h-auto' : 'h-[500px]'}`}>
      <CardHeader className="pb-2 p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Assistant</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Locale
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {onToggleMinimize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                title={isMinimized ? "Espandi" : "Minimizza"}
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('🔴 Pulsante X cliccato - Chiusura chatbot');
                if (onClose) {
                  console.log('🔴 Chiamata onClose prop');
                  onClose();
                } else {
                  console.log('🔴 Impostazione isOpen a false');
                  setIsOpen(false);
                }
              }}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              title="Chiudi"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Indicatori di contesto - solo se non minimizzato */}
        {!isMinimized && (
          <div className="flex gap-1 flex-wrap mt-2">
            {adhdContext.focusMode && (
              <Badge variant="outline" className="text-xs">
                <Focus className="w-3 h-3 mr-1" />
                Focus Mode
              </Badge>
            )}
            {adhdContext.energyLevel && (
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Energia: {adhdContext.energyLevel}/10
              </Badge>
            )}
            {adhdContext.activeTasks && (
              <Badge variant="outline" className="text-xs">
                <Timer className="w-3 h-3 mr-1" />
                {adhdContext.activeTasks} task
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="p-3 flex flex-col flex-1 min-h-0">
        {/* Area Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messaggi Chat */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 mb-3 h-0">
            <div className="flex flex-col gap-3 p-1">
              {chatMessages.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm mb-2">Ciao! Sono il tuo assistente ADHD 🧠</p>
                  <p className="text-xs">Scrivi qualsiasi cosa: "Crea task", "Sono stanco", "Come procedo?"...</p>
                </div>
              )}
              
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex w-full ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg text-sm break-words shadow-sm ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-muted-foreground rounded-bl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words word-wrap">{message.text}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground p-3 rounded-lg rounded-bl-sm text-sm shadow-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Input Chat */}
          <div className="flex gap-2 w-full flex-shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Scrivi un comando..."
              className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              size="sm"
              className="px-3 flex-shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
        

        
        {/* Risultato ultima azione */}
        {lastActionResult && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <p className="text-xs text-green-800">{lastActionResult}</p>
            </div>
          </div>
        )}
        
        {/* Info locale e stato AI */}
        <div className="mt-2 pt-2 border-t space-y-1 flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            🔒 Sistema completamente locale - Nessun dato inviato online
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              aiReady ? 'bg-green-500' : 
              aiService ? 'bg-yellow-500' : 
              'bg-gray-400'
            }`} />
            <p className="text-xs text-muted-foreground">
              {aiStatus}
            </p>
          </div>
        </div>
        </CardContent>
      )}
    </Card>
  );
};

export default LocalChatBot;