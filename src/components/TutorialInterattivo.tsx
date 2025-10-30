import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Target, 
  Brain, 
  Settings, 
  Trophy,
  ArrowRight,
  ArrowLeft,
  Home,
  Star,
  Zap,
  Heart,
  Users,
  Lightbulb
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  completed: boolean;
  content: React.ReactNode;
}

interface TutorialPhase {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  steps: TutorialStep[];
}

const TutorialInterattivo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Definizione delle fasi del tutorial
  const phases: TutorialPhase[] = [
    {
      id: 'fase-1',
      title: 'Primi Passi',
      description: 'Archetipi e panoramica dashboard',
      icon: <Home className="w-5 h-5" />,
      color: 'bg-blue-500',
      steps: [

        {
          id: 'archetipi',
          title: 'Test degli Archetipi',
          description: 'Scopri il tuo archetipo dominante',
          duration: 5,
          completed: false,
          content: (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🎭 Test degli Archetipi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">🔮 Visionario</h4>
                  <p className="text-xs sm:text-sm">Creativo, innovativo, vede il quadro generale</p>
                </div>
                <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">🏗️ Costruttore</h4>
                  <p className="text-xs sm:text-sm">Pratico, metodico, orientato ai risultati</p>
                </div>
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">🌙 Sognatore</h4>
                  <p className="text-xs sm:text-sm">Intuitivo, emotivo, sensibile all'ambiente</p>
                </div>
                <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">🤫 Silenzioso</h4>
                  <p className="text-xs sm:text-sm">Riflessivo, analitico, preferisce lavorare solo</p>
                </div>
                <div className="bg-red-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">⚔️ Combattente</h4>
                  <p className="text-xs sm:text-sm">Energico, competitivo, ama le sfide</p>
                </div>
              </div>
            </div>
          )
        },
        {
          id: 'dashboard',
          title: 'Panoramica Dashboard',
          description: 'Familiarizza con l\'interfaccia principale',
          duration: 4,
          completed: false,
          content: (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🏠 Panoramica Dashboard</h3>
              <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
                <div className="border border-gray-300 p-2 mb-2">🌊 Tsunami &nbsp;&nbsp;&nbsp;&nbsp; 🔔 📊 ⚙️ 🚪</div>
                <div className="border border-gray-300 p-2 mb-2">🎯 Focus &nbsp; ⚙️ Impostazioni &nbsp; 🚪 Esci</div>
                <div className="border border-gray-300 p-2 mb-2">📊 Attivi | ✅ Fatti | 📈 Analisi</div>
                <div className="border border-gray-300 p-4 mb-2">
                  📝 Lista Task<br/>
                  🧠 Mental Inbox<br/>
                  📊 Mood Tracker
                </div>
                <div className="border border-gray-300 p-2">➕ Nuova Attività</div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'fase-2',
      title: 'Funzionalità Base',
      description: 'Task, Mental Inbox e tracciamento umore',
      icon: <Target className="w-5 h-5" />,
      color: 'bg-green-500',
      steps: [
        {
          id: 'task',
          title: 'Creare la Prima Task',
          description: 'Impara a creare e gestire le attività',
          duration: 5,
          completed: false,
          content: (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">📝 Creare la Prima Task</h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Passo-Passo:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Clicca "➕ Nuova Attività"</li>
                  <li>Compila i campi:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><strong>Titolo</strong>: "Completare tutorial Tsunami" ✨</li>
                      <li><strong>Energia Richiesta</strong>: Bassa/Media/Alta</li>
                      <li><strong>Tipo</strong>: Azione/Riflessione/Creativa</li>
                    </ul>
                  </li>
                  <li>Aggiungi tag (opzionale): #tutorial #primo-giorno</li>
                  <li>Clicca "Crea Task"</li>
                </ol>
              </div>
            </div>
          )
        },
        {
          id: 'inbox',
          title: 'Usare Mental Inbox',
          description: 'Cattura rapidamente idee e pensieri',
          duration: 4,
          completed: false,
          content: (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🧠 Usare Mental Inbox</h3>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="mb-3">Uno spazio per "svuotare la mente" e catturare tutto ciò che ti passa per la testa.</p>
                <h4 className="font-medium mb-2">Come Usarlo:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Clicca sull'icona 🧠 nella dashboard</li>
                  <li>Scrivi rapidamente la tua idea</li>
                  <li>Premi Invio per salvare</li>
                  <li>Continua con quello che stavi facendo</li>
                </ol>
              </div>
            </div>
          )
        },
        {
          id: 'mood',
          title: 'Tracciare l\'Umore',
          description: 'Monitora il tuo stato emotivo',
          duration: 3,
          completed: false,
          content: (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">📊 Tracciare l'Umore</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-green-50 p-2 sm:p-3 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl mb-1">😊</div>
                  <div className="font-medium text-xs sm:text-sm">Energico</div>
                </div>
                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl mb-1">😌</div>
                  <div className="font-medium text-xs sm:text-sm">Calmo</div>
                </div>
                <div className="bg-yellow-50 p-2 sm:p-3 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl mb-1">😴</div>
                  <div className="font-medium text-xs sm:text-sm">Stanco</div>
                </div>
                <div className="bg-orange-50 p-2 sm:p-3 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl mb-1">😤</div>
                  <div className="font-medium text-xs sm:text-sm">Stressato</div>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl mb-1">😔</div>
                  <div className="font-medium text-xs sm:text-sm">Giù</div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'fase-3',
      title: 'Funzionalità Avanzate',
      description: 'Focus, routine e progetti',
      icon: <Zap className="w-5 h-5" />,
      color: 'bg-purple-500',
      steps: [
        {
          id: 'focus',
          title: 'Modalità Focus',
          description: 'Elimina distrazioni e massimizza la concentrazione',
          duration: 6,
          completed: false,
          content: (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🎯 Modalità Focus</h3>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Cosa Fa:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Riduce le task visibili (max 3-5)</li>
                  <li>Nasconde notifiche non essenziali</li>
                  <li>Suggerisce break ogni 25 minuti</li>
                  <li>Blocca distrazioni nell'interfaccia</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">🎵 Tecniche di Focus:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>🍅 Pomodoro: 25min lavoro + 5min pausa</li>
                  <li>⏰ Timeboxing: Blocchi di tempo dedicati</li>
                  <li>🎯 Single-tasking: Una cosa alla volta</li>
                </ul>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'fase-4',
      title: 'Ottimizzazione',
      description: 'Gamificazione, personalizzazione e analytics',
      icon: <Trophy className="w-5 h-5" />,
      color: 'bg-yellow-500',
      steps: [
        {
          id: 'gamification',
          title: 'Sistema di Gamificazione',
          description: 'Sfrutta la motivazione attraverso il gioco',
          duration: 5,
          completed: false,
          content: (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🎮 Sistema di Gamificazione</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">💎 Sistema XP</h4>
                  <ul className="text-xs sm:text-sm space-y-1">
                    <li>Task Semplice: 10-20 XP</li>
                    <li>Task Media: 25-50 XP</li>
                    <li>Task Complessa: 60-100 XP</li>
                    <li>Streak 7 giorni: 100 XP</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">🏅 Achievement</h4>
                  <ul className="text-xs sm:text-sm space-y-1">
                    <li>🔥 Streak Master: 30 giorni</li>
                    <li>⚡ Speed Demon: 10 task/giorno</li>
                    <li>🎯 Focus Ninja: 50 sessioni</li>
                    <li>🧠 Mind Cleaner: 100 inbox</li>
                  </ul>
                </div>
              </div>
            </div>
          )
        }
      ]
    }
  ];

  const totalSteps = phases.reduce((acc, phase) => acc + phase.steps.length, 0);
  const completedCount = completedSteps.size;
  const progressPercentage = (completedCount / totalSteps) * 100;

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const nextStep = () => {
    const currentPhaseSteps = phases[currentPhase].steps;
    if (currentStep < currentPhaseSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentPhase < phases.length - 1) {
      setCurrentPhase(currentPhase + 1);
      setCurrentStep(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1);
      setCurrentStep(phases[currentPhase - 1].steps.length - 1);
    }
  };

  const currentStepData = phases[currentPhase]?.steps[currentStep];
  const isStepCompleted = currentStepData ? completedSteps.has(currentStepData.id) : false;

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
      >
        <BookOpen className="w-4 h-4" />
        📚 Tutorial Interattivo
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                🌊 Tutorial Interattivo Tsunami
              </CardTitle>
              <CardDescription className="text-blue-100">
                Guida passo-passo per padroneggiare Tsunami
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              ✕
            </Button>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progresso Totale</span>
              <span>{completedCount}/{totalSteps} completati</span>
            </div>
            <Progress value={progressPercentage} className="bg-white/20" />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row h-[70vh] sm:h-[60vh]">
            {/* Sidebar con fasi - Mobile: collapsible, Desktop: fixed */}
            <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r bg-gray-50 overflow-y-auto max-h-48 lg:max-h-none">
              <div className="p-3 sm:p-4">
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Fasi del Tutorial</h3>
                <div className="space-y-2">
                  {phases.map((phase, phaseIndex) => {
                    const phaseCompleted = phase.steps.every(step => completedSteps.has(step.id));
                    const isCurrentPhase = phaseIndex === currentPhase;
                    
                    return (
                      <div key={phase.id} className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-colors ${
                        isCurrentPhase ? 'bg-blue-100 border-2 border-blue-300' : 'bg-white hover:bg-gray-100'
                      }`} onClick={() => {
                        setCurrentPhase(phaseIndex);
                        setCurrentStep(0);
                      }}>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className={`p-1.5 sm:p-2 rounded-full text-white ${phase.color}`}>
                            {React.cloneElement(phase.icon as React.ReactElement, { className: 'w-3 h-3 sm:w-5 sm:h-5' })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="font-medium text-sm sm:text-base truncate">{phase.title}</span>
                              {phaseCompleted && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{phase.description}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {phase.steps.reduce((acc, step) => acc + step.duration, 0)} min
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Steps preview - Hidden on mobile for space */}
                        <div className="mt-2 ml-8 sm:ml-11 space-y-1 hidden sm:block">
                          {phase.steps.map((step, stepIndex) => {
                            const stepCompleted = completedSteps.has(step.id);
                            const isCurrentStep = isCurrentPhase && stepIndex === currentStep;
                            
                            return (
                              <div key={step.id} className={`text-xs p-1 rounded flex items-center gap-2 ${
                                isCurrentStep ? 'bg-blue-200' : stepCompleted ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
                                {stepCompleted ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full border border-gray-300" />
                                )}
                                <span className={`truncate ${stepCompleted ? 'line-through text-gray-500' : ''}`}>
                                  {step.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Contenuto principale */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 sm:p-4 lg:p-6">
                {currentStepData && (
                  <div className="space-y-6">
                    {/* Header step */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Fase {currentPhase + 1} - Step {currentStep + 1}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {currentStepData.duration} min
                          </Badge>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold mb-1">{currentStepData.title}</h2>
                        <p className="text-sm sm:text-base text-gray-600">{currentStepData.description}</p>
                      </div>
                      {isStepCompleted && (
                        <div className="flex items-center gap-2 text-green-600 self-start sm:self-center">
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span className="font-medium text-sm sm:text-base">Completato!</span>
                        </div>
                      )}
                    </div>

                    {/* Contenuto step */}
                    <div className="prose prose-sm sm:prose max-w-none">
                      {currentStepData.content}
                    </div>

                    {/* Azioni step */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 sm:pt-6 border-t">
                      <Button 
                        variant="outline" 
                        onClick={prevStep}
                        disabled={currentPhase === 0 && currentStep === 0}
                        className="flex items-center justify-center gap-2 text-sm sm:text-base"
                        size="sm"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Precedente
                      </Button>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        {!isStepCompleted && (
                          <Button 
                            onClick={() => markStepCompleted(currentStepData.id)}
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Segna come Completato</span>
                            <span className="sm:hidden">Completato</span>
                          </Button>
                        )}
                        
                        <Button 
                          onClick={nextStep}
                          disabled={currentPhase === phases.length - 1 && currentStep === phases[currentPhase].steps.length - 1}
                          className="flex items-center justify-center gap-2 text-sm sm:text-base"
                          size="sm"
                        >
                          Successivo
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorialInterattivo;