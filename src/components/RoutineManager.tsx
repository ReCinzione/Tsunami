import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Clock, Target, Check, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Routine {
  id: string;
  user_id: string;
  name: string;
  type: string;
  category: string;
  start_time?: string | null;
  end_time?: string | null;
  days_of_week?: string[] | null;
  day_of_month?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RoutineItem {
  id: string;
  routine_id: string;
  name: string;
  description?: string;
  is_completed: boolean;
  order_index: number;
}

interface RoutineGoal {
  id: string;
  routine_id: string;
  goal_text: string;
  target_value?: number;
  current_value: number;
  unit?: string;
  is_achieved: boolean;
}

const categories = [
  { value: 'benessere', label: '🧘 Benessere', emoji: '🧘' },
  { value: 'fitness', label: '💪 Fitness', emoji: '💪' },
  { value: 'studio', label: '📚 Studio', emoji: '📚' },
  { value: 'lavoro', label: '💼 Lavoro', emoji: '💼' },
  { value: 'creativita', label: '🎨 Creatività', emoji: '🎨' },
  { value: 'relazioni', label: '❤️ Relazioni', emoji: '❤️' },
  { value: 'casa', label: '🏠 Casa', emoji: '🏠' },
  { value: 'altro', label: '✨ Altro', emoji: '✨' }
];

const daysOfWeek = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Gio' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sab' }
];

interface RoutineManagerProps {
  userId: string;
}

const RoutineManager: React.FC<RoutineManagerProps> = ({ userId }) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineItems, setRoutineItems] = useState<{ [key: string]: RoutineItem[] }>({});
  const [routineGoals, setRoutineGoals] = useState<{ [key: string]: RoutineGoal[] }>({});
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  // Form states
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [routineType, setRoutineType] = useState<string>('daily');
  const [routineCategory, setRoutineCategory] = useState('benessere');
  const [routineTime, setRoutineTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [newItems, setNewItems] = useState<string[]>(['']);
  const [newGoals, setNewGoals] = useState<{ text: string; target?: number; unit?: string }[]>([{ text: '', target: undefined, unit: '' }]);



  // Load data from database
  useEffect(() => {
    loadRoutines();
  }, [userId]);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      
      // Load routines
      const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (routinesError) throw routinesError;
      setRoutines(routinesData || []);

      // Load routine items for all routines
      if (routinesData && routinesData.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('routine_items')
          .select('*')
          .eq('user_id', userId)
          .order('order_index');

        if (itemsError) throw itemsError;
        
        // Group items by routine_id
        const groupedItems = (itemsData || []).reduce((acc, item) => {
          if (!acc[item.routine_id]) acc[item.routine_id] = [];
          acc[item.routine_id].push(item);
          return acc;
        }, {} as { [key: string]: RoutineItem[] });
        
        setRoutineItems(groupedItems);

        // Load routine goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('routine_goals')
          .select('*')
          .eq('user_id', userId);

        if (goalsError) throw goalsError;
        
        // Group goals by routine_id
        const groupedGoals = (goalsData || []).reduce((acc, goal) => {
          if (!acc[goal.routine_id]) acc[goal.routine_id] = [];
          acc[goal.routine_id].push({
            id: goal.id,
            routine_id: goal.routine_id,
            goal_text: `${goal.category}: ${goal.target_value} ${goal.unit}`,
            target_value: goal.target_value,
            current_value: goal.current_value,
            unit: goal.unit,
            is_achieved: goal.current_value >= goal.target_value
          });
          return acc;
        }, {} as { [key: string]: RoutineGoal[] });
        
        setRoutineGoals(groupedGoals);
      }
    } catch (error) {
      console.error('Error loading routines:', error);
      toast.error("Errore nel caricamento delle routine");
    } finally {
      setLoading(false);
    }
  };

  const createRoutine = async () => {
    if (!routineName.trim()) {
      toast.error("Il nome della routine è obbligatorio");
      return;
    }

    try {
      setLoading(true);

      // Create routine
      const { data: routineData, error: routineError } = await supabase
        .from('routines')
        .insert({
          user_id: userId,
          name: routineName,
          type: routineType,
          category: routineCategory,
          start_time: routineTime || null,
          days_of_week: routineType === 'weekly' ? selectedDays.map(String) : null,
          day_of_month: routineType === 'monthly' ? dayOfMonth : null,
          is_active: true
        })
        .select()
        .single();

      if (routineError) throw routineError;

      // Add items
      const items = newItems.filter(item => item.trim());
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('routine_items')
          .insert(
            items.map((item, index) => ({
              routine_id: routineData.id,
              user_id: userId,
              name: item.trim(),
              order_index: index,
              is_completed: false
            }))
          );

        if (itemsError) throw itemsError;
      }

      // Add goals
      const goals = newGoals.filter(goal => goal.text.trim() && goal.target);
      if (goals.length > 0) {
        const { error: goalsError } = await supabase
          .from('routine_goals')
          .insert(
            goals.map(goal => ({
              routine_id: routineData.id,
              user_id: userId,
              category: goal.text.trim(),
              target_value: goal.target!,
              unit: goal.unit || '',
              current_value: 0
            }))
          );

        if (goalsError) throw goalsError;
      }

      resetForm();
      setIsCreating(false);
      toast.success("Routine creata con successo!");
      loadRoutines(); // Reload data
    } catch (error) {
      console.error('Error creating routine:', error);
      toast.error("Errore nella creazione della routine");
    } finally {
      setLoading(false);
    }
  };

  const toggleRoutineActive = async (routineId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('routines')
        .update({ is_active: !isActive })
        .eq('id', routineId)
        .eq('user_id', userId);

      if (error) throw error;

      setRoutines(prev => prev.map(routine => 
        routine.id === routineId 
          ? { ...routine, is_active: !isActive }
          : routine
      ));
      toast.success(!isActive ? "Routine attivata" : "Routine messa in pausa");
    } catch (error) {
      console.error('Error updating routine:', error);
      toast.error("Errore nell'aggiornamento della routine");
    }
  };

  const toggleItemComplete = async (routineId: string, itemId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('routine_items')
        .update({ is_completed: !isCompleted })
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) throw error;

      setRoutineItems(prev => ({
        ...prev,
        [routineId]: prev[routineId]?.map(item => 
          item.id === itemId 
            ? { ...item, is_completed: !isCompleted }
            : item
        ) || []
      }));
    } catch (error) {
      console.error('Error updating routine item:', error);
      toast.error("Errore nell'aggiornamento dell'elemento");
    }
  };

  const resetForm = () => {
    setRoutineName('');
    setRoutineDescription('');
    setRoutineType('daily');
    setRoutineCategory('benessere');
    setRoutineTime('');
    setSelectedDays([]);
    setDayOfMonth(1);
    setNewItems(['']);
    setNewGoals([{ text: '', target: undefined, unit: '' }]);
  };

  const addNewItem = () => {
    setNewItems([...newItems, '']);
  };

  const updateNewItem = (index: number, value: string) => {
    const updated = [...newItems];
    updated[index] = value;
    setNewItems(updated);
  };

  const removeNewItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const addNewGoal = () => {
    setNewGoals([...newGoals, { text: '', target: undefined, unit: '' }]);
  };

  const updateNewGoal = (index: number, field: string, value: any) => {
    const updated = [...newGoals];
    updated[index] = { ...updated[index], [field]: value };
    setNewGoals(updated);
  };

  const removeNewGoal = (index: number) => {
    setNewGoals(newGoals.filter((_, i) => i !== index));
  };

  const getCategoryEmoji = (category: string) => {
    return categories.find(c => c.value === category)?.emoji || '✨';
  };

  const formatTimeDisplay = (time: string | null) => {
    if (!time) return '';
    return time.slice(0, 5); // HH:MM format
  };

  const getRoutineSchedule = (routine: Routine) => {
    if (routine.type === 'daily') {
      return routine.start_time ? `Ogni giorno alle ${formatTimeDisplay(routine.start_time)}` : 'Ogni giorno';
    } else if (routine.type === 'weekly') {
      const days = routine.days_of_week?.map(day => daysOfWeek.find(d => d.value === parseInt(day))?.label).join(', ') || '';
      return `${days}${routine.start_time ? ` alle ${formatTimeDisplay(routine.start_time)}` : ''}`;
    } else {
      return `Il ${routine.day_of_month} di ogni mese${routine.start_time ? ` alle ${formatTimeDisplay(routine.start_time)}` : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Le tue Routine</h2>
          <p className="text-muted-foreground">Organizza le tue abitudini quotidiane, settimanali e mensili</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuova Routine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crea una nuova routine</DialogTitle>
              <DialogDescription>
                Imposta una routine personalizzata con orari e obiettivi specifici
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="routine-name">Nome della routine *</Label>
                  <Input
                    id="routine-name"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    placeholder="Es. Routine mattutina, Allenamento serale..."
                  />
                </div>
                <div>
                  <Label htmlFor="routine-description">Descrizione</Label>
                  <Textarea
                    id="routine-description"
                    value={routineDescription}
                    onChange={(e) => setRoutineDescription(e.target.value)}
                    placeholder="Descrivi brevemente la tua routine..."
                  />
                </div>
              </div>

              {/* Type and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Frequenza</Label>
                  <Select value={routineType} onValueChange={(value: any) => setRoutineType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Giornaliera</SelectItem>
                      <SelectItem value="weekly">Settimanale</SelectItem>
                      <SelectItem value="monthly">Mensile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={routineCategory} onValueChange={setRoutineCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <Label>Pianificazione</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="routine-time">Orario (opzionale)</Label>
                    <Input
                      id="routine-time"
                      type="time"
                      value={routineTime}
                      onChange={(e) => setRoutineTime(e.target.value)}
                    />
                  </div>
                  {routineType === 'weekly' && (
                    <div>
                      <Label>Giorni della settimana</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {daysOfWeek.map(day => (
                          <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={selectedDays.includes(day.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDays([...selectedDays, day.value]);
                                } else {
                                  setSelectedDays(selectedDays.filter(d => d !== day.value));
                                }
                              }}
                            />
                            <span className="text-sm">{day.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {routineType === 'monthly' && (
                    <div>
                      <Label htmlFor="day-of-month">Giorno del mese</Label>
                      <Input
                        id="day-of-month"
                        type="number"
                        min="1"
                        max="31"
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Items Checklist */}
              <div className="space-y-4">
                <Label>Checklist Attività</Label>
                {newItems.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateNewItem(index, e.target.value)}
                      placeholder="Es. Fare stretching, Bere un bicchiere d'acqua..."
                    />
                    {newItems.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeNewItem(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addNewItem} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Attività
                </Button>
              </div>

              {/* Goals */}
              <div className="space-y-4">
                <Label>Obiettivi</Label>
                {newGoals.map((goal, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex gap-2">
                      <Input
                        value={goal.text}
                        onChange={(e) => updateNewGoal(index, 'text', e.target.value)}
                        placeholder="Descrizione obiettivo..."
                        className="flex-1"
                      />
                      {newGoals.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeNewGoal(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={goal.target || ''}
                        onChange={(e) => updateNewGoal(index, 'target', parseInt(e.target.value) || undefined)}
                        placeholder="Valore target"
                        className="flex-1"
                      />
                      <Input
                        value={goal.unit || ''}
                        onChange={(e) => updateNewGoal(index, 'unit', e.target.value)}
                        placeholder="Unità (es. minuti, km...)"
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addNewGoal} className="w-full">
                  <Target className="w-4 h-4 mr-2" />
                  Aggiungi Obiettivo
                </Button>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={createRoutine} disabled={loading} className="flex-1">
                  {loading ? "Creazione..." : "Crea Routine"}
                </Button>
                <Button variant="outline" onClick={() => {
                  resetForm();
                  setIsCreating(false);
                }}>
                  Annulla
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Routines List */}
      {routines.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nessuna routine ancora</h3>
            <p className="text-muted-foreground mb-4">
              Crea la tua prima routine per organizzare le tue abitudini
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crea la tua prima routine
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {routines.map(routine => (
            <Card key={routine.id} className={`${routine.is_active ? '' : 'opacity-60'}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getCategoryEmoji(routine.category)}</span>
                      <CardTitle className="text-xl">{routine.name}</CardTitle>
                      <Badge variant={routine.is_active ? "default" : "secondary"}>
                        {routine.is_active ? "Attiva" : "In pausa"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getRoutineSchedule(routine)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRoutineActive(routine.id, routine.is_active)}
                    >
                      {routine.is_active ? "Pausa" : "Attiva"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="checklist" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="checklist">Checklist</TabsTrigger>
                    <TabsTrigger value="goals">Obiettivi</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="checklist" className="space-y-3 mt-4">
                    {routineItems[routine.id]?.length > 0 ? (
                      routineItems[routine.id].map(item => (
                        <div key={item.id} className="flex items-center space-x-3 p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors">
                          <Checkbox
                            checked={item.is_completed}
                            onCheckedChange={() => toggleItemComplete(routine.id, item.id, item.is_completed)}
                          />
                          <span className={item.is_completed ? 'line-through text-muted-foreground' : 'text-card-foreground font-medium'}>
                            {item.name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-secondary/30 rounded-lg border-2 border-dashed border-border">
                        <p className="text-muted-foreground font-medium">
                          Nessuna attività nella checklist
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="goals" className="space-y-3 mt-4">
                    {routineGoals[routine.id]?.length > 0 ? (
                      routineGoals[routine.id].map(goal => (
                        <div key={goal.id} className="p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-card-foreground">{goal.goal_text}</span>
                            <Badge variant={goal.is_achieved ? "default" : "secondary"}>
                              {goal.is_achieved ? "Raggiunto" : "In corso"}
                            </Badge>
                          </div>
                          {goal.target_value && (
                            <div className="text-sm text-muted-foreground font-medium">
                              Progresso: {goal.current_value} / {goal.target_value} {goal.unit}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-secondary/30 rounded-lg border-2 border-dashed border-border">
                        <p className="text-muted-foreground font-medium">
                          Nessun obiettivo configurato
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoutineManager;