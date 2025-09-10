import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Routine {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly';
  category: string;
  time?: string;
  days_of_week?: number[];
  day_of_month?: number;
  is_active: boolean;
  created_at: string;
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
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const { toast } = useToast();

  // Form states
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [routineType, setRoutineType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [routineCategory, setRoutineCategory] = useState('benessere');
  const [routineTime, setRoutineTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [newItems, setNewItems] = useState<string[]>(['']);
  const [newGoals, setNewGoals] = useState<{ text: string; target?: number; unit?: string }[]>([{ text: '', target: undefined, unit: '' }]);

  useEffect(() => {
    loadRoutines();
  }, [userId]);

  const loadRoutines = async () => {
    try {
      const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (routinesError) throw routinesError;

      setRoutines(routinesData || []);

      // Load items and goals for each routine
      for (const routine of routinesData || []) {
        await loadRoutineItems(routine.id);
        await loadRoutineGoals(routine.id);
      }
    } catch (error) {
      console.error('Error loading routines:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le routine",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoutineItems = async (routineId: string) => {
    try {
      const { data, error } = await supabase
        .from('routine_items')
        .select('*')
        .eq('routine_id', routineId)
        .order('order_index');

      if (error) throw error;

      setRoutineItems(prev => ({
        ...prev,
        [routineId]: data || []
      }));
    } catch (error) {
      console.error('Error loading routine items:', error);
    }
  };

  const loadRoutineGoals = async (routineId: string) => {
    try {
      const { data, error } = await supabase
        .from('routine_goals')
        .select('*')
        .eq('routine_id', routineId);

      if (error) throw error;

      setRoutineGoals(prev => ({
        ...prev,
        [routineId]: data || []
      }));
    } catch (error) {
      console.error('Error loading routine goals:', error);
    }
  };

  const createRoutine = async () => {
    if (!routineName.trim()) {
      toast({
        title: "Errore",
        description: "Il nome della routine è obbligatorio",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const routineData = {
        user_id: userId,
        name: routineName,
        description: routineDescription || null,
        type: routineType,
        category: routineCategory,
        time: routineTime || null,
        days_of_week: routineType === 'weekly' ? selectedDays : null,
        day_of_month: routineType === 'monthly' ? dayOfMonth : null,
        is_active: true
      };

      const { data: routine, error: routineError } = await supabase
        .from('routines')
        .insert(routineData)
        .select()
        .single();

      if (routineError) throw routineError;

      // Create routine items
      const items = newItems.filter(item => item.trim()).map((item, index) => ({
        routine_id: routine.id,
        name: item.trim(),
        order_index: index,
        is_completed: false
      }));

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('routine_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      // Create routine goals
      const goals = newGoals.filter(goal => goal.text.trim()).map(goal => ({
        routine_id: routine.id,
        goal_text: goal.text.trim(),
        target_value: goal.target || null,
        unit: goal.unit || null,
        current_value: 0,
        is_achieved: false
      }));

      if (goals.length > 0) {
        const { error: goalsError } = await supabase
          .from('routine_goals')
          .insert(goals);

        if (goalsError) throw goalsError;
      }

      resetForm();
      setIsCreating(false);
      await loadRoutines();

      toast({
        title: "Routine creata!",
        description: "La tua nuova routine è stata salvata con successo"
      });
    } catch (error) {
      console.error('Error creating routine:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare la routine",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRoutineActive = async (routineId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('routines')
        .update({ is_active: !isActive })
        .eq('id', routineId);

      if (error) throw error;

      setRoutines(prev => prev.map(routine => 
        routine.id === routineId 
          ? { ...routine, is_active: !isActive }
          : routine
      ));

      toast({
        title: !isActive ? "Routine attivata" : "Routine messa in pausa",
        description: !isActive ? "La routine è ora attiva" : "La routine è stata messa in pausa"
      });
    } catch (error) {
      console.error('Error toggling routine:', error);
      toast({
        title: "Errore",
        description: "Impossibile modificare lo stato della routine",
        variant: "destructive"
      });
    }
  };

  const toggleItemComplete = async (routineId: string, itemId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('routine_items')
        .update({ is_completed: !isCompleted })
        .eq('id', itemId);

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
      console.error('Error toggling item:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'elemento",
        variant: "destructive"
      });
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

  const formatTimeDisplay = (time: string) => {
    if (!time) return '';
    return time.slice(0, 5); // HH:MM format
  };

  const getRoutineSchedule = (routine: Routine) => {
    if (routine.type === 'daily') {
      return routine.time ? `Ogni giorno alle ${formatTimeDisplay(routine.time)}` : 'Ogni giorno';
    } else if (routine.type === 'weekly') {
      const days = routine.days_of_week?.map(day => daysOfWeek.find(d => d.value === day)?.label).join(', ') || '';
      return `${days}${routine.time ? ` alle ${formatTimeDisplay(routine.time)}` : ''}`;
    } else {
      return `Il ${routine.day_of_month} di ogni mese${routine.time ? ` alle ${formatTimeDisplay(routine.time)}` : ''}`;
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

              {/* Checklist Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Lista delle attività</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addNewItem}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {newItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateNewItem(index, e.target.value)}
                        placeholder="Descrivi un'attività..."
                      />
                      {newItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeNewItem(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Obiettivi (opzionali)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addNewGoal}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {newGoals.map((goal, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={goal.text}
                        onChange={(e) => updateNewGoal(index, 'text', e.target.value)}
                        placeholder="Descrivi l'obiettivo..."
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={goal.target || ''}
                        onChange={(e) => updateNewGoal(index, 'target', parseInt(e.target.value))}
                        placeholder="Meta"
                        className="w-20"
                      />
                      <Input
                        value={goal.unit || ''}
                        onChange={(e) => updateNewGoal(index, 'unit', e.target.value)}
                        placeholder="Unità"
                        className="w-20"
                      />
                      {newGoals.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeNewGoal(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Annulla
                </Button>
                <Button onClick={createRoutine}>
                  Crea Routine
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Routines List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Tutte</TabsTrigger>
          <TabsTrigger value="daily">Giornaliere</TabsTrigger>
          <TabsTrigger value="weekly">Settimanali</TabsTrigger>
          <TabsTrigger value="monthly">Mensili</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {routines.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessuna routine creata</h3>
                <p className="text-muted-foreground mb-4">
                  Inizia creando la tua prima routine personalizzata
                </p>
                <Button onClick={() => setIsCreating(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Crea la tua prima routine
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {routines.map(routine => (
                <Card key={routine.id} className={`${!routine.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryEmoji(routine.category)}</span>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {routine.name}
                            {!routine.is_active && <Badge variant="secondary">In pausa</Badge>}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {getRoutineSchedule(routine)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRoutineActive(routine.id, routine.is_active)}
                        >
                          {routine.is_active ? 'Pausa' : 'Attiva'}
                        </Button>
                      </div>
                    </div>
                    {routine.description && (
                      <p className="text-sm text-muted-foreground">{routine.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {/* Checklist */}
                    {routineItems[routine.id]?.length > 0 && (
                      <div className="space-y-3 mb-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Lista attività
                        </h4>
                        <div className="space-y-2">
                          {routineItems[routine.id].map(item => (
                            <div key={item.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={item.is_completed}
                                onCheckedChange={() => toggleItemComplete(routine.id, item.id, item.is_completed)}
                              />
                              <span className={`text-sm ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                {item.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Goals */}
                    {routineGoals[routine.id]?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Obiettivi
                        </h4>
                        <div className="space-y-2">
                          {routineGoals[routine.id].map(goal => (
                            <div key={goal.id} className="flex items-center justify-between text-sm">
                              <span>{goal.goal_text}</span>
                              {goal.target_value && (
                                <Badge variant="outline">
                                  {goal.current_value}/{goal.target_value} {goal.unit}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {['daily', 'weekly', 'monthly'].map(type => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="grid gap-4">
              {routines.filter(r => r.type === type).map(routine => (
                <Card key={routine.id} className={`${!routine.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryEmoji(routine.category)}</span>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {routine.name}
                            {!routine.is_active && <Badge variant="secondary">In pausa</Badge>}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {getRoutineSchedule(routine)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRoutineActive(routine.id, routine.is_active)}
                        >
                          {routine.is_active ? 'Pausa' : 'Attiva'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Same content as above for checklist and goals */}
                    {routineItems[routine.id]?.length > 0 && (
                      <div className="space-y-3 mb-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Lista attività
                        </h4>
                        <div className="space-y-2">
                          {routineItems[routine.id].map(item => (
                            <div key={item.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={item.is_completed}
                                onCheckedChange={() => toggleItemComplete(routine.id, item.id, item.is_completed)}
                              />
                              <span className={`text-sm ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                {item.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {routineGoals[routine.id]?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Obiettivi
                        </h4>
                        <div className="space-y-2">
                          {routineGoals[routine.id].map(goal => (
                            <div key={goal.id} className="flex items-center justify-between text-sm">
                              <span>{goal.goal_text}</span>
                              {goal.target_value && (
                                <Badge variant="outline">
                                  {goal.current_value}/{goal.target_value} {goal.unit}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default RoutineManager;