import React from 'react';
import { Plus, Search, Focus, CheckCircle2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyTaskStateProps {
  hasFilters: boolean;
  focusMode: boolean;
  onCreateTask: () => void;
  className?: string;
}

/**
 * Componente per gestire gli stati vuoti nella lista task
 * Mostra messaggi diversi in base al contesto (filtri, focus mode, ecc.)
 */
export const EmptyTaskState: React.FC<EmptyTaskStateProps> = ({
  hasFilters,
  focusMode,
  onCreateTask,
  className
}) => {
  // Stato vuoto con filtri attivi
  if (hasFilters) {
    return (
      <Card className={cn("bg-slate-50 border-slate-200", className)}>
        <CardContent className="flex flex-col items-center justify-center text-center p-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Nessun risultato trovato
          </h3>
          
          <p className="text-slate-600 mb-6 max-w-md">
            Non ci sono task che corrispondono ai filtri selezionati. 
            Prova a modificare i criteri di ricerca o rimuovi alcuni filtri.
          </p>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                // Questa logica dovrebbe essere gestita dal container
                console.log('Clear filters');
              }}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Rimuovi filtri
            </Button>
            
            <Button
              onClick={onCreateTask}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crea nuova task
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Stato vuoto in modalità focus
  if (focusMode) {
    return (
      <Card className={cn("bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200", className)}>
        <CardContent className="flex flex-col items-center justify-center text-center p-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Focus className="w-8 h-8 text-blue-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Modalità Focus Attiva 🎯
          </h3>
          
          <p className="text-blue-700 mb-6 max-w-md">
            Ottimo lavoro! Hai completato tutte le task prioritarie. 
            È il momento perfetto per una pausa o per aggiungere nuove task.
          </p>
          
          <div className="bg-blue-100 rounded-lg p-4 mb-6 max-w-sm">
            <p className="text-sm text-blue-800 font-medium mb-2">
              💡 Suggerimento ADHD-friendly:
            </p>
            <p className="text-xs text-blue-700">
              Celebra questo momento! Hai mantenuto il focus e completato le tue priorità. 
              Prenditi 5-10 minuti di pausa prima di continuare.
            </p>
          </div>
          
          <Button
            onClick={onCreateTask}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Aggiungi nuova task
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Stato vuoto generale (nessuna task)
  return (
    <Card className={cn("bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200", className)}>
      <CardContent className="flex flex-col items-center justify-center text-center p-12">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-purple-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-purple-900 mb-2">
          Benvenuto nel tuo spazio task! ✨
        </h3>
        
        <p className="text-purple-700 mb-6 max-w-md">
          Inizia il tuo viaggio di produttività creando la tua prima task. 
          Ogni grande obiettivo inizia con un piccolo passo!
        </p>
        
        <div className="bg-purple-100 rounded-lg p-4 mb-6 max-w-sm">
          <p className="text-sm text-purple-800 font-medium mb-2">
            🧠 Suggerimenti per iniziare:
          </p>
          <ul className="text-xs text-purple-700 space-y-1 text-left">
            <li>• Inizia con qualcosa di piccolo e gestibile</li>
            <li>• Usa template predefiniti per risparmiare tempo</li>
            <li>• Ricorda: fatto è meglio che perfetto! 💙</li>
          </ul>
        </div>
        
        <Button
          onClick={onCreateTask}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Crea la tua prima task
        </Button>
      </CardContent>
    </Card>
  );
};

EmptyTaskState.displayName = 'EmptyTaskState';