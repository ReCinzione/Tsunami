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
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  isSelected 
                    ? 'ring-2 ring-primary shadow-xl scale-105' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleMoodSelect(option)}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 relative">
                    <div className="text-6xl mb-2">{option.emoji}</div>
                  </div>
                  <CardTitle className="text-2xl">{option.label}</CardTitle>
                  <CardDescription className="text-base">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium text-primary mb-2">
                      Micro-rituale suggerito:
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {option.ritual}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="mt-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Preparando il tuo spazio...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};