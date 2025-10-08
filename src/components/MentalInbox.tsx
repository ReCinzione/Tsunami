import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, CheckCircle, Plus, ArrowRight, Trash2, ChevronDown, Lightbulb, Zap, Clock, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageToTaskOCR from './ImageToTaskOCR';

interface MentalInboxItem {
  id: string;
  content: string;
  content_type: string;
  is_processed: boolean;
  converted_to_task: boolean;
  task_id: string | null;
  created_at: string;
  processed_at: string | null;
}

interface MentalInboxProps {
  onTaskCreated?: () => void;
}

const MentalInbox = ({ onTaskCreated }: MentalInboxProps) => {
  const [items, setItems] = useState<MentalInboxItem[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInboxItems();
  }, []);

  const loadInboxItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mental_inbox')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading inbox items:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le note.",
        variant: "destructive"
      });
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('mental_inbox')
        .insert({
          user_id: user.id,
          content: newNote.trim(),
          content_type: 'text'
        });

      if (error) throw error;

      setNewNote('');
      await loadInboxItems();
      
      toast({
        title: "Nota aggiunta",
        description: "La tua nota è stata salvata nel mental inbox."
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere la nota.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Analisi intelligente del contenuto per suggerimenti
  const analyzeNoteContent = (content: string) => {
    const text = content.toLowerCase();
    
    // Analisi tipo di task
    let suggestedType = 'azione';
    if (text.includes('pensare') || text.includes('riflettere') || text.includes('considerare') || text.includes('valutare')) {
      suggestedType = 'riflessione';
    } else if (text.includes('chiamare') || text.includes('scrivere') || text.includes('email') || text.includes('messaggio') || text.includes('contattare')) {
      suggestedType = 'comunicazione';
    } else if (text.includes('creare') || text.includes('disegnare') || text.includes('progettare') || text.includes('inventare') || text.includes('scrivere')) {
      suggestedType = 'creativita';
    } else if (text.includes('organizzare') || text.includes('pianificare') || text.includes('sistemare') || text.includes('ordinare')) {
      suggestedType = 'organizzazione';
    }
    
    // Analisi energia richiesta
    let suggestedEnergy = 'media';
    if (text.includes('veloce') || text.includes('semplice') || text.includes('facile') || text.includes('breve')) {
      suggestedEnergy = 'bassa';
    } else if (text.includes('complesso') || text.includes('difficile') || text.includes('impegnativo') || text.includes('lungo')) {
      suggestedEnergy = 'alta';
    } else if (text.includes('molto') && (text.includes('difficile') || text.includes('complesso'))) {
      suggestedEnergy = 'molto_alta';
    } else if (text.includes('piccolissimo') || text.includes('minimo') || text.includes('micro')) {
      suggestedEnergy = 'molto_bassa';
    }
    
    // Estrazione titolo intelligente
    let suggestedTitle = content.substring(0, 100);
    const sentences = content.split(/[.!?]/);
    if (sentences.length > 0 && sentences[0].trim().length > 0) {
      suggestedTitle = sentences[0].trim().substring(0, 100);
    }
    
    // Rilevamento urgenza
    const isUrgent = text.includes('urgente') || text.includes('subito') || text.includes('oggi') || text.includes('asap');
    
    return {
      suggestedType,
      suggestedEnergy,
      suggestedTitle,
      isUrgent,
      confidence: calculateConfidence(text, suggestedType, suggestedEnergy)
    };
  };
  
  const calculateConfidence = (text: string, type: string, energy: string) => {
    let confidence = 0.5; // Base confidence
    
    // Aumenta confidence basandosi su parole chiave specifiche
    const typeKeywords = {
      'riflessione': ['pensare', 'riflettere', 'considerare', 'valutare'],
      'comunicazione': ['chiamare', 'scrivere', 'email', 'messaggio', 'contattare'],
      'creativita': ['creare', 'disegnare', 'progettare', 'inventare'],
      'organizzazione': ['organizzare', 'pianificare', 'sistemare', 'ordinare']
    };
    
    const energyKeywords = {
      'bassa': ['veloce', 'semplice', 'facile', 'breve'],
      'alta': ['complesso', 'difficile', 'impegnativo', 'lungo'],
      'molto_alta': ['molto difficile', 'molto complesso'],
      'molto_bassa': ['piccolissimo', 'minimo', 'micro']
    };
    
    if (typeKeywords[type as keyof typeof typeKeywords]?.some(keyword => text.includes(keyword))) {
      confidence += 0.3;
    }
    
    if (energyKeywords[energy as keyof typeof energyKeywords]?.some(keyword => text.includes(keyword))) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  };

  const convertToTask = async (item: MentalInboxItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Analisi intelligente del contenuto
      const analysis = analyzeNoteContent(item.content);
      
      // Calcola XP reward basato su energia e tipo
      const xpRewards = {
        'molto_bassa': 1,
        'bassa': 3,
        'media': 6,
        'alta': 10,
        'molto_alta': 15
      };
      
      const baseXP = xpRewards[analysis.suggestedEnergy as keyof typeof xpRewards];
      const urgencyBonus = analysis.isUrgent ? 2 : 0;
      const finalXP = baseXP + urgencyBonus;

      // Create task con suggerimenti intelligenti
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: analysis.suggestedTitle,
          description: item.content,
          task_type: analysis.suggestedType,
          energy_required: analysis.suggestedEnergy,
          xp_reward: finalXP,
          status: 'pending',
          due_date: analysis.isUrgent ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null // Se urgente, scadenza domani
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Update inbox item
      const { error: updateError } = await supabase
        .from('mental_inbox')
        .update({
          converted_to_task: true,
          task_id: taskData.id,
          is_processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      await loadInboxItems();
      onTaskCreated?.();
      
      const confidenceText = analysis.confidence > 0.7 ? 'alta' : analysis.confidence > 0.5 ? 'media' : 'bassa';
      
      toast({
        title: "🎯 Task creato intelligentemente",
        description: `Tipo: ${analysis.suggestedType} | Energia: ${analysis.suggestedEnergy} | XP: ${finalXP} (confidenza: ${confidenceText})`
      });
    } catch (error) {
      console.error('Error converting to task:', error);
      toast({
        title: "Errore",
        description: "Impossibile convertire la nota in task.",
        variant: "destructive"
      });
    }
  };

  const markAsProcessed = async (item: MentalInboxItem) => {
    try {
      const { error } = await supabase
        .from('mental_inbox')
        .update({
          is_processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      await loadInboxItems();
      
      toast({
        title: "Nota processata",
        description: "La nota è stata marcata come processata."
      });
    } catch (error) {
      console.error('Error marking as processed:', error);
      toast({
        title: "Errore",
        description: "Impossibile marcare la nota come processata.",
        variant: "destructive"
      });
    }
  };

  const deleteNote = async (item: MentalInboxItem) => {
    try {
      const { error } = await supabase
        .from('mental_inbox')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      await loadInboxItems();
      
      toast({
        title: "Nota eliminata",
        description: "La nota è stata eliminata."
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la nota.",
        variant: "destructive"
      });
    }
  };

  const pendingItems = items.filter(item => !item.is_processed);
  const processedItems = items.filter(item => item.is_processed);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes">📝 Note Testuali</TabsTrigger>
          <TabsTrigger value="ocr">📷 Immagine a Task</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Mental Inbox
              </CardTitle>
              <CardDescription>
                Cattura pensieri e note che puoi trasformare in task quando sei pronto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add new note */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Scrivi una nota, un'idea, un pensiero..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={addNote} 
                  disabled={!newNote.trim() || isLoading}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Nota
                </Button>
              </div>

        {/* Pending notes */}
        {pendingItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              Note da processare
              <Badge variant="secondary">{pendingItems.length}</Badge>
            </h4>
            
            <div className="space-y-2">
              {pendingItems.map((item) => {
                const suggestions = analyzeNoteContent(item.content);
                const confidence = suggestions.confidence;
                
                return (
                  <div key={item.id} className="p-3 border rounded-lg bg-muted/30 space-y-3">
                    <p className="text-sm">{item.content}</p>
                    
                    {/* Smart Suggestions Preview */}
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2 text-xs p-1 h-auto">
                          <Lightbulb className="w-3 h-3" />
                          Anteprima suggerimenti AI
                          <Badge variant={confidence >= 0.8 ? "default" : confidence >= 0.6 ? "secondary" : "outline"} className="text-xs">
                            {Math.round(confidence * 100)}% sicurezza
                          </Badge>
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="bg-background/50 rounded-md p-3 space-y-2 border">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-blue-500" />
                              <span className="font-medium">Tipo:</span>
                              <Badge variant="outline" className="text-xs">{suggestions.suggestedType}</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-yellow-500" />
                              <span className="font-medium">Energia:</span>
                              <Badge variant="outline" className="text-xs">{suggestions.suggestedEnergy}</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-green-500" />
                              <span className="font-medium">Urgenza:</span>
                              <Badge variant={suggestions.isUrgent ? "destructive" : "secondary"} className="text-xs">
                                {suggestions.isUrgent ? "Alta" : "Normale"}
                              </Badge>
                            </div>
                          </div>
                          {suggestions.suggestedTitle !== item.content.slice(0, 50) && (
                            <div className="text-xs">
                              <span className="font-medium">Titolo suggerito:</span>
                              <p className="text-muted-foreground mt-1 italic">"{suggestions.suggestedTitle}"</p>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => convertToTask(item)}
                        className="gap-1"
                      >
                        <ArrowRight className="w-3 h-3" />
                        Converti in Task
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsProcessed(item)}
                        className="gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Processa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteNote(item)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                        Elimina
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Processed notes */}
        {processedItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              Note processate
              <Badge variant="outline">{processedItems.length}</Badge>
            </h4>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {processedItems.map((item) => (
                <div key={item.id} className="p-2 border rounded-lg bg-muted/10 opacity-60">
                  <p className="text-xs text-muted-foreground">{item.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.converted_to_task && (
                      <Badge variant="secondary" className="text-xs">
                        Convertita in Task
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.processed_at!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Il tuo mental inbox è vuoto</p>
                  <p className="text-sm">Aggiungi la prima nota per iniziare</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ocr" className="mt-4">
          <ImageToTaskOCR onTaskCreated={onTaskCreated} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MentalInbox;