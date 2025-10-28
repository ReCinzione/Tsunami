import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MoodOption {
  id: 'congelato' | 'disorientato' | 'in_flusso' | 'ispirato';
  emoji: string;
  label: string;
  description: string;
  ritual: string;
}

const moodOptions: MoodOption[] = [
  {
    id: 'congelato',
    emoji: '🧊',
    label: 'Congelato',
    description: 'Senti di essere bloccato, le energie sono ferme',
    ritual: 'Scegli un compito piccolissimo, di 2 minuti massimo'
  },
  {
    id: 'disorientato',
    emoji: '⚡',
    label: 'Disorientato',
    description: 'Hai energie ma non sai dove dirigerle',
    ritual: 'Fai una lista di 3 cose che ti vengono in mente'
  },
  {
    id: 'in_flusso',
    emoji: '🔥',
    label: 'In Flusso',
    description: 'Ti senti connesso e pronto all\'azione',
    ritual: 'Tuffati nel progetto che ti chiama di più'
  },
  {
    id: 'ispirato',
    emoji: '💡',
    label: 'Ispirato',
    description: 'Vedi possibilità ovunque, sei in modalità visione',
    ritual: 'Cattura tutte le idee che emergono, poi scegline una'
  }
];

interface DailyMoodSelectorProps {
  onMoodSelect: (mood: string, ritual: string) => void;
}

export const DailyMoodSelector = ({ onMoodSelect }: DailyMoodSelectorProps) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleMoodSelect = (option: MoodOption) => {
    setSelectedMood(option.id);
    setTimeout(() => {
      onMoodSelect(option.id, option.ritual);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Come ti senti oggi?
          </h1>
          <p className="text-xl text-muted-foreground">
            La tua giornata inizia con la consapevolezza del tuo stato interno
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {moodOptions.map((option) => {
            const isSelected = selectedMood === option.id;
            
            return (
              <div
                key={option.id}
                className={`adhd-mood-card adhd-hover-lift adhd-click-bounce adhd-focus-ring ${
                  isSelected ? 'selected' : ''
                }`}
                onClick={() => handleMoodSelect(option)}
              >
                <div className="text-center">
                  <div className="mx-auto mb-4 relative">
                    <div className="adhd-mood-emoji">{option.emoji}</div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{option.label}</h3>
                  <p className="text-base mb-4 opacity-90">
                    {option.description}
                  </p>
                </div>
                <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="text-lg">✨</span>
                    Micro-rituale suggerito:
                  </p>
                  <p className="text-sm opacity-90">
                    {option.ritual}
                  </p>
                 </div>
                 {isSelected && (
                   <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl animate-pulse" />
                 )}
               </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};