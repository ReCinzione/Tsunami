import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, CheckCircle, Plus, ArrowRight, Trash2 } from 'lucide-react';
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

  const convertToTask = async (item: MentalInboxItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: item.content.substring(0, 100), // Limit title length
          description: item.content,
          task_type: 'azione',
          energy_required: 'media',
          status: 'pending'
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
      
      toast({
        title: "Task creato",
        description: "La nota è stata convertita in un task."
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
              {pendingItems.map((item) => (
                <div key={item.id} className="p-3 border rounded-lg bg-muted/30 space-y-3">
                  <p className="text-sm">{item.content}</p>
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
              ))}
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