import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

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

  // Temporary local data for demo purposes (until database types are updated)
  const sampleRoutines: Routine[] = [
    {
      id: '1',
      user_id: userId,
      name: 'Routine Mattutina',
      description: 'La mia routine per iniziare bene la giornata',
      type: 'daily',
      category: 'benessere',
      time: '07:00',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      user_id: userId,
      name: 'Allenamento Settimanale',
      description: 'Sessioni di fitness programmate',
      type: 'weekly',
      category: 'fitness',
      time: '18:30',
      days_of_week: [1, 3, 5],
      is_active: true,
      created_at: new Date().toISOString()
    }
  ];

  const sampleItems: { [key: string]: RoutineItem[] } = {
    '1': [
      { id: '1a', routine_id: '1', name: 'Meditazione', is_completed: false, order_index: 0 },
      { id: '1b', routine_id: '1', name: 'Stretching leggero', is_completed: false, order_index: 1 },
      { id: '1c', routine_id: '1', name: 'Colazione sana', is_completed: false, order_index: 2 }
    ],
    '2': [
      { id: '2a', routine_id: '2', name: 'Riscaldamento', is_completed: false, order_index: 0 },
      { id: '2b', routine_id: '2', name: 'Allenamento cardio', is_completed: false, order_index: 1 },
      { id: '2c', routine_id: '2', name: 'Defaticamento', is_completed: false, order_index: 2 }
    ]
  };

  const sampleGoals: { [key: string]: RoutineGoal[] } = {
    '1': [
      { id: '1g', routine_id: '1', goal_text: 'Meditare per almeno 10 minuti', target_value: 10, current_value: 0, unit: 'minuti', is_achieved: false }
    ],
    '2': [
      { id: '2g', routine_id: '2', goal_text: 'Bruciare 300 calorie', target_value: 300, current_value: 0, unit: 'calorie', is_achieved: false }
    ]
  };

  // Initialize with sample data
  useState(() => {
    setRoutines(sampleRoutines);
    setRoutineItems(sampleItems);
    setRoutineGoals(sampleGoals);
  });

  const createRoutine = () => {
    if (!routineName.trim()) {
      toast.error("Il nome della routine è obbligatorio");
      return;
    }

    const newRoutine: Routine = {
      id: Date.now().toString(),
      user_id: userId,
      name: routineName,
      description: routineDescription || undefined,
      type: routineType,
      category: routineCategory,
      time: routineTime || undefined,
      days_of_week: routineType === 'weekly' ? selectedDays : undefined,
      day_of_month: routineType === 'monthly' ? dayOfMonth : undefined,
      is_active: true,
      created_at: new Date().toISOString()
    };

    setRoutines(prev => [newRoutine, ...prev]);

    // Add items
    const items = newItems.filter(item => item.trim()).map((item, index) => ({
      id: `${newRoutine.id}_item_${index}`,
      routine_id: newRoutine.id,
      name: item.trim(),
      is_completed: false,
      order_index: index
    }));

    if (items.length > 0) {
      setRoutineItems(prev => ({
        ...prev,
        [newRoutine.id]: items
      }));
    }

    // Add goals
    const goals = newGoals.filter(goal => goal.text.trim()).map((goal, index) => ({
      id: `${newRoutine.id}_goal_${index}`,
      routine_id: newRoutine.id,
      goal_text: goal.text.trim(),
      target_value: goal.target,
      unit: goal.unit,
      current_value: 0,
      is_achieved: false
    }));

    if (goals.length > 0) {
      setRoutineGoals(prev => ({
        ...prev,
        [newRoutine.id]: goals
      }));
    }

    resetForm();
    setIsCreating(false);
    toast.success("Routine creata con successo!");
  };

  const toggleRoutineActive = (routineId: string, isActive: boolean) => {
    setRoutines(prev => prev.map(routine => 
      routine.id === routineId 
        ? { ...routine, is_active: !isActive }
        : routine
    ));
    toast.success(!isActive ? "Routine attivata" : "Routine messa in pausa");
  };

  const toggleItemComplete = (routineId: string, itemId: string, isCompleted: boolean) => {
    setRoutineItems(prev => ({
      ...prev,
      [routineId]: prev[routineId]?.map(item => 
        item.id === itemId 
          ? { ...item, is_completed: !isCompleted }
          : item
      ) || []
    }));
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
                    {routine.description && (
                      <p className="text-muted-foreground mb-2">{routine.description}</p>
                    )}
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
                  
                  <TabsContent value="checklist" className="space-y-2">
                    {routineItems[routine.id]?.length > 0 ? (
                      routineItems[routine.id].map(item => (
                        <div key={item.id} className="flex items-center space-x-2 p-3 rounded-lg bg-muted/30 border border-border">
                          <Checkbox
                            checked={item.is_completed}
                            onCheckedChange={() => toggleItemComplete(routine.id, item.id, item.is_completed)}
                          />
                          <span className={item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}>
                            {item.name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed border-border">
                        <p className="text-muted-foreground">
                          Nessuna attività nella checklist
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="goals" className="space-y-2">
                    {routineGoals[routine.id]?.length > 0 ? (
                      routineGoals[routine.id].map(goal => (
                        <div key={goal.id} className="p-4 rounded-lg bg-muted/30 border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{goal.goal_text}</span>
                            <Badge variant={goal.is_achieved ? "default" : "secondary"}>
                              {goal.is_achieved ? "Raggiunto" : "In corso"}
                            </Badge>
                          </div>
                          {goal.target_value && (
                            <div className="text-sm text-muted-foreground">
                              Progresso: {goal.current_value} / {goal.target_value} {goal.unit}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed border-border">
                        <p className="text-muted-foreground">
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