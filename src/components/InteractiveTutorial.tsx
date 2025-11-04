import React, { useEffect } from 'react';
import { useTutorial, TutorialStep } from '@/hooks/useTutorial';
import { Button } from '@/components/ui/button';
import { BookOpen, RotateCcw, X } from 'lucide-react';

interface InteractiveTutorialProps {
  onComplete?: () => void;
}

// Esporta gli step per riuso da altre parti dell'app
export const tutorialSteps: TutorialStep[] = [
    // STEP 1: Benvenuto Dashboard
    {
      id: 'welcome',
      element: 'body',
      onNext: () => {
        const el = document.querySelector('[data-tutorial="tab-dashboard"]') as HTMLElement | null;
        el?.click();
      },
      popover: {
        title: '🌊 Benvenuto in Tsunami!',
        description: `
          <div class="space-y-3">
            <p class="text-base">Tsunami è il tuo compagno personale per la produttività.</p>
            <p class="text-sm text-gray-600">
              Questo tutorial ti guiderà attraverso le funzionalità principali dell'app, 
              evidenziando gli elementi interattivi che puoi usare subito.
            </p>
            <div class="bg-blue-50 p-3 rounded-lg text-sm">
              💡 <strong>Suggerimento:</strong> Puoi saltare il tutorial in qualsiasi momento 
              cliccando sulla X in alto a destra.
            </div>
          </div>
        `,
        side: 'bottom',
        align: 'center'
      }
    },

    // STEP 2: Statistiche Quick
    {
      id: 'quick-stats',
      element: '[data-tutorial="quick-stats"]',
      popover: {
        title: '📊 Le Tue Statistiche',
        description: `
          <div class="space-y-2">
            <p>Qui vedi a colpo d'occhio:</p>
            <ul class="list-disc list-inside space-y-1 text-sm">
              <li>Task completati questo mese</li>
              <li>Task attualmente attivi</li>
              <li>XP guadagnati e il tuo livello</li>
              <li>La tua streak (giorni consecutivi)</li>
            </ul>
            <p class="text-sm text-blue-600 mt-2">
              ✨ Ogni task completata ti fa guadagnare XP e mantiene viva la tua streak!
            </p>
          </div>
        `,
        side: 'bottom',
        align: 'start'
      }
    },

    // STEP 3: Tabs (Attivi, Fatti, Analisi)
    {
      id: 'tabs-navigation',
      element: '[data-tutorial="task-subtabs"]',
      onNext: () => {
        const el = document.querySelector('[data-tutorial="tab-tasks"]') as HTMLElement | null;
        el?.click();
      },
      popover: {
        title: '🗂️ Navigazione Task',
        description: `
          <div class="space-y-2">
            <p>Usa queste tab per navigare tra:</p>
            <ul class="list-disc list-inside space-y-1 text-sm">
              <li><strong>Attivi:</strong> Le tue task in corso</li>
              <li><strong>Fatti:</strong> Task completati (la storia dei tuoi successi!)</li>
              <li><strong>Analisi:</strong> Statistiche e pattern delle tue attività</li>
            </ul>
            <p class="text-sm bg-green-50 p-2 rounded mt-2">
              💡 Prova a cliccare tra le tab per vedere i diversi contenuti
            </p>
          </div>
        `,
        side: 'bottom',
        align: 'center'
      }
    },

    // STEP 4: Creare una Task
    {
      id: 'create-task',
      element: '[data-tutorial="new-task"]',
      onNext: () => {
        // L'utente può interagire con il pulsante prima di andare avanti
        // Manteniamo il tab Task attivo per i passaggi successivi
      },
      popover: {
        title: '➕ Creare una Nuova Task',
        description: `
          <div class="space-y-3">
            <p>Questo pulsante apre il form per creare una nuova task.</p>
            <p class="text-sm">Quando crei una task, puoi specificare:</p>
            <ul class="list-disc list-inside space-y-1 text-sm">
              <li><strong>Titolo:</strong> Cosa devi fare</li>
              <li><strong>Energia richiesta:</strong> Bassa, Media, Alta</li>
              <li><strong>Tipo:</strong> Azione, Riflessione, Creativa</li>
              <li><strong>Tag:</strong> Per organizzare le tue task</li>
            </ul>
            <div class="bg-purple-50 p-3 rounded-lg mt-2 text-sm">
              🎯 <strong>Prova ora!</strong> Clicca sul pulsante per creare la tua prima task.
            </div>
          </div>
        `,
        side: 'left',
        align: 'center'
      }
    },

    // STEP 5: Mental Inbox
    {
      id: 'mental-inbox',
      element: '[data-tutorial="tab-mental-inbox"]',
      onNext: () => {
        // Dopo aver visto la tab delle Note, torniamo alla Dashboard
        const el = document.querySelector('[data-tutorial="tab-dashboard"]') as HTMLElement | null;
        el?.click();
      },
      popover: {
        title: '🧠 Mental Inbox',
        description: `
          <div class="space-y-3">
            <p>Il <strong>Mental Inbox</strong> è uno spazio per "svuotare la mente".</p>
            <p class="text-sm">Usa questa funzione per:</p>
            <ul class="list-disc list-inside space-y-1 text-sm">
              <li>Catturare rapidamente idee e pensieri</li>
              <li>Annotare cose da ricordare più tardi</li>
              <li>Convertire note in task quando sei pronto</li>
            </ul>
            <div class="bg-indigo-50 p-3 rounded-lg mt-2 text-sm">
              💭 <strong>Tip:</strong> Non pensare troppo, scrivi subito quello che ti passa 
              per la testa. Potrai organizzarlo dopo!
            </div>
          </div>
        `,
        side: 'right',
        align: 'start'
      }
    },

    // STEP 6: Daily Mood
    {
      id: 'mood-tracker',
      element: '[data-tutorial="mood-selector"], [data-tutorial="smart-action-suggestion"]',
      popover: {
        title: '😊 Tracciamento Umore',
        description: `
          <div class="space-y-3">
            <p>Registra come ti senti oggi per ricevere suggerimenti personalizzati.</p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="bg-green-50 p-2 rounded">
                <div class="text-lg mb-1">🧊 Congelato</div>
                <p class="text-xs">Energie ferme, serve un piccolo passo</p>
              </div>
              <div class="bg-yellow-50 p-2 rounded">
                <div class="text-lg mb-1">⚡ Disorientato</div>
                <p class="text-xs">Energie alte ma senza direzione</p>
              </div>
              <div class="bg-orange-50 p-2 rounded">
                <div class="text-lg mb-1">🔥 In Flusso</div>
                <p class="text-xs">Pronto all'azione!</p>
              </div>
              <div class="bg-blue-50 p-2 rounded">
                <div class="text-lg mb-1">💡 Ispirato</div>
                <p class="text-xs">Modalità visione attiva</p>
              </div>
            </div>
            <p class="text-sm text-gray-600 mt-2">
              Ogni stato ha un micro-rituale suggerito per massimizzare la tua produttività.
            </p>
          </div>
        `,
        side: 'bottom',
        align: 'center'
      }
    },

    // STEP 7: Focus Mode
    {
      id: 'focus-mode',
      element: '[data-tutorial="focus-mode"]',
      popover: {
        title: '🎯 Modalità Focus',
        description: `
          <div class="space-y-3">
            <p>La <strong>Modalità Focus</strong> ti aiuta a concentrarti eliminando distrazioni.</p>
            <p class="text-sm">Quando la attivi:</p>
            <ul class="list-disc list-inside space-y-1 text-sm">
              <li>Mostra solo 3-5 task alla volta</li>
              <li>Nasconde notifiche non essenziali</li>
              <li>Suggerisce break regolari (Pomodoro)</li>
              <li>Blocca distrazioni nell'interfaccia</li>
            </ul>
            <div class="bg-red-50 p-3 rounded-lg mt-2 text-sm">
              🍅 <strong>Tecnica Pomodoro:</strong> 25 minuti di lavoro intenso + 5 minuti di pausa
            </div>
          </div>
        `,
        side: 'left',
        align: 'center'
      }
    },

    // STEP 8: Gamification - XP e Livelli
    {
      id: 'gamification',
      element: '[data-tutorial="xp-badge"]',
      popover: {
        title: '🎮 Sistema di Gamificazione',
        description: `
          <div class="space-y-3">
            <p>Tsunami usa la <strong>gamificazione</strong> per rendere la produttività più coinvolgente!</p>
            <div class="bg-yellow-50 p-3 rounded-lg">
              <p class="font-semibold mb-2">💎 Guadagna XP:</p>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li>Task Semplice: 10-20 XP</li>
                <li>Task Media: 25-50 XP</li>
                <li>Task Complessa: 60-100 XP</li>
                <li>Bonus Streak: XP extra ogni 7 giorni</li>
              </ul>
            </div>
            <div class="bg-green-50 p-3 rounded-lg mt-2">
              <p class="font-semibold mb-2">🏅 Sblocca Achievement:</p>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li>🔥 Streak Master: 30 giorni consecutivi</li>
                <li>⚡ Speed Demon: 10 task in un giorno</li>
                <li>🎯 Focus Ninja: 50 sessioni focus</li>
              </ul>
            </div>
          </div>
        `,
        side: 'bottom',
        align: 'center'
      }
    },

    // STEP 9: Impostazioni
    {
      id: 'settings',
      element: 'button[aria-label="Impostazioni"]',
      popover: {
        title: '⚙️ Impostazioni',
        description: `
          <div class="space-y-2">
            <p>Qui puoi personalizzare Tsunami secondo le tue preferenze:</p>
            <ul class="list-disc list-inside space-y-1 text-sm">
              <li>Modificare il tuo profilo</li>
              <li>Gestire notifiche e promemoria</li>
              <li>Configurare integrazioni (Google Calendar, ecc.)</li>
              <li>Esportare i tuoi dati</li>
            </ul>
          </div>
        `,
        side: 'left',
        align: 'start'
      }
    },

    // STEP 10: Conclusione
    {
      id: 'completion',
      element: 'body',
      popover: {
        title: '🎉 Tutorial Completato!',
        description: `
          <div class="space-y-4">
            <p class="text-lg">Complimenti! Ora conosci le basi di Tsunami.</p>
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <p class="font-semibold mb-2">🚀 Prossimi Passi:</p>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li>Crea la tua prima task</li>
                <li>Registra il tuo umore del giorno</li>
                <li>Prova la modalità Focus</li>
                <li>Esplora progetti e routine</li>
              </ul>
            </div>
            <p class="text-sm text-gray-600">
              💡 Puoi rivedere questo tutorial in qualsiasi momento dalle impostazioni.
            </p>
            <div class="text-center mt-4">
              <p class="text-2xl">🌊✨</p>
              <p class="font-semibold">Buon lavoro con Tsunami!</p>
            </div>
          </div>
        `,
        side: 'bottom',
        align: 'center'
      }
    }
];

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({ onComplete }) => {

  const { 
    startTutorial, 
    restartTutorial, 
    skipTutorial, 
    isTutorialActive,
    completedSteps 
  } = useTutorial(tutorialSteps);

  // Rimosso l'avvio automatico: il tutorial si avvia solo su richiesta tramite pulsante
  // (manteniamo il pulsante flottante in basso a destra per avvio/riavvio)

  // Pulsante per avviare/riavviare il tutorial
  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      {!isTutorialActive && (
        <>
          <Button
            onClick={startTutorial}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
            size="sm"
          >
            <BookOpen className="w-4 h-4" />
            Tutorial
          </Button>
          
          {completedSteps.length > 0 && (
            <Button
              onClick={restartTutorial}
              variant="outline"
              className="flex items-center gap-2 shadow-lg"
              size="sm"
            >
              <RotateCcw className="w-4 h-4" />
              Ricomincia
            </Button>
          )}
        </>
      )}
      
      {isTutorialActive && (
        <Button
          onClick={skipTutorial}
          variant="destructive"
          className="flex items-center gap-2 shadow-lg"
          size="sm"
        >
          <X className="w-4 h-4" />
          Salta Tutorial
        </Button>
      )}
    </div>
  );
};
