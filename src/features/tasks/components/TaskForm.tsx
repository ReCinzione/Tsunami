import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Save, 
  X, 
  Calendar as CalendarIcon, 
  Focus, 
  Timer, 
  Target,
  Lightbulb,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { TaskFormProps, TaskFormData } from '../types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Form per la creazione e modifica delle task con design ADHD-friendly
 */
export const TaskForm: React.FC<TaskFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false,
  mode 
}) => {
  // LOG: Verifica props ricevute
  console.log('🔍 TaskForm - Props ricevute:', {
    initialData,
    hasInitialData: !!initialData,
    mode,
    loading,
    taskId: initialData?.id,
    taskTitle: initialData?.title,
    taskDescription: initialData?.description,
    taskType: initialData?.task_type,
    taskEnergy: initialData?.energy_required,
    taskXP: initialData?.xp_reward,
    taskDueDate: initialData?.due_date,
    taskTags: initialData?.tags
  });

  const [formData, setFormData] = useState<TaskFormData>(() => {
    const initialFormData = {
      title: initialData?.title || '',
      description: initialData?.description || '',
      task_type: initialData?.task_type || 'azione',
      energy_required: initialData?.energy_required || 'media',
      priority: initialData?.priority || 'media',
      xp_reward: initialData?.xp_reward || 10,
      due_date: initialData?.due_date ? new Date(initialData.due_date) : null,
      planned_date: initialData?.planned_date ? new Date(initialData.planned_date) : null
    };
    
    console.log('🔍 TaskForm - Stato iniziale formData:', initialFormData);
    return initialFormData;
  });

  // Aggiorna formData quando cambia initialData
  useEffect(() => {
    console.log('🔍 TaskForm - useEffect triggered, initialData:', initialData);
    
    if (initialData) {
      const updatedData = {
        title: initialData.title || '',
        description: initialData.description || '',
        task_type: initialData.task_type || 'azione',
        energy_required: initialData.energy_required || 'media',
        priority: initialData.priority || 'media',
        xp_reward: initialData.xp_reward || 10,
        due_date: initialData.due_date ? new Date(initialData.due_date) : null,
        planned_date: initialData.planned_date ? new Date(initialData.planned_date) : null
      };
      
      console.log('🔍 TaskForm - Aggiornamento formData:', updatedData);
      setFormData(updatedData);
      
      const newSelectedTime = initialData.due_date ? format(new Date(initialData.due_date), 'HH:mm') : '23:59';
      console.log('🔍 TaskForm - Aggiornamento selectedTime:', newSelectedTime);
      setSelectedTime(newSelectedTime);
    } else {
      console.log('🔍 TaskForm - initialData è null/undefined, resetting form');
      setFormData({
        title: '',
        description: '',
        task_type: 'azione',
        energy_required: 'media',
        priority: 'media',
        xp_reward: 10,
        due_date: null,
        planned_date: null
      });
      setSelectedTime('23:59');
    }
  }, [initialData]);

  const [selectedTime, setSelectedTime] = useState<string>(() => 
    initialData?.due_date ? format(new Date(initialData.due_date), 'HH:mm') : '23:59'
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const [selectedPlannedTime, setSelectedPlannedTime] = useState<string>(() => 
    initialData?.planned_date ? format(new Date(initialData.planned_date), 'HH:mm') : '09:00'
  );
  const [isPlannedCalendarOpen, setIsPlannedCalendarOpen] = useState(false);

  const [errors, setErrors] = useState<Partial<TaskFormData>>({});

  // Validazione in tempo reale
  useEffect(() => {
    const newErrors: Partial<TaskFormData> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Il titolo è obbligatorio';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Il titolo è troppo lungo (max 100 caratteri)';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'La descrizione è troppo lunga (max 500 caratteri)';
    }
    
    // estimated_duration validation removed
    
    setErrors(newErrors);
  }, [formData]);

  // Gestisce l'invio del form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    onSubmit(formData);
  };



  // Calcola XP suggeriti basati su difficoltà e durata
  const calculateSuggestedXP = () => {
    const baseXP = 25; // Base XP value
    const durationBonus = 0; // Duration bonus removed
    const focusBonus = 0; // formData.requires_deep_focus ? 5 : 0; // Removed - not in database schema
    return baseXP + durationBonus + focusBonus;
  };



  const isFormValid = !errors.title && formData.title.trim();

  return (
    <Card className="w-full max-w-sm md:max-w-md mx-auto p-2 md:p-4 rounded-lg">
      <CardHeader className="pb-2 md:pb-4 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl font-semibold pr-8">
            {initialData ? 'Modifica Task' : 'Nuova Task'}
          </CardTitle>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="absolute right-1 md:right-3 top-1 md:top-3 w-8 h-8 p-0"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        

      </CardHeader>

      <CardContent className="p-2 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Titolo */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Titolo *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Cosa devi fare?"
              className={cn(
                "w-full transition-colors",
                errors.title && "border-red-500 focus:border-red-500"
              )}
              maxLength={100}
            />
            {errors.title && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title}
              </p>
            )}
            <div className="text-xs text-gray-500 text-right">
              {formData.title.length}/100
            </div>
          </div>

          {/* Descrizione */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrizione (opzionale)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Dettagli aggiuntivi, note, link utili..."
              className={cn(
                "min-h-[80px] resize-none",
                errors.description && "border-red-300 focus:border-red-500"
              )}
              maxLength={500}
            />
            {errors.description && (
              <div className="flex items-center gap-1 text-red-600 text-xs">
                <AlertCircle className="h-3 w-3" />
                {errors.description}
              </div>
            )}
            <div className="text-xs text-gray-500 text-right">
              {formData.description.length}/500
            </div>
          </div>

          {/* Tipo, Energia e Priorità - Layout responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label className="text-xs md:text-sm font-medium">Tipo di task</Label>
              <Select
                value={formData.task_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, task_type: value as any }))}
              >
                <SelectTrigger className="w-full text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="azione">🎯 Azione</SelectItem>
                  <SelectItem value="riflessione">🤔 Riflessione</SelectItem>
                  <SelectItem value="comunicazione">💬 Comunicazione</SelectItem>
                  <SelectItem value="creativita">🎨 Creatività</SelectItem>
                  <SelectItem value="organizzazione">📋 Organizzazione</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs md:text-sm font-medium">Energia richiesta</Label>
              <Select
                value={formData.energy_required}
                onValueChange={(value) => setFormData(prev => ({ ...prev, energy_required: value as any }))}
              >
                <SelectTrigger className="w-full text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="molto_bassa">🍃 Molto Bassa</SelectItem>
                  <SelectItem value="bassa">🌊 Bassa</SelectItem>
                  <SelectItem value="media">💡 Media</SelectItem>
                  <SelectItem value="alta">🔥 Alta</SelectItem>
                  <SelectItem value="molto_alta">🌋 Molto Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priorità e Ricompensa XP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label className="text-xs md:text-sm font-medium">Priorità</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger className="w-full text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bassa">🟢 Bassa</SelectItem>
                  <SelectItem value="media">🟡 Media</SelectItem>
                  <SelectItem value="alta">🔴 Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs md:text-sm font-medium">
                Ricompensa XP
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData.xp_reward}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    xp_reward: parseInt(e.target.value) || 0 
                  }))}
                  min={0}
                  max={100}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    xp_reward: calculateSuggestedXP() 
                  }))}
                  className="text-xs px-2"
                >
                  <Lightbulb className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Data di scadenza */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data di Scadenza (opzionale)</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? (
                    `${format(formData.due_date, "PPP", { locale: it })} alle ${selectedTime}`
                  ) : (
                    "Seleziona data e ora"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date}
                  onSelect={(date) => {
                    if (date) {
                      // Combina la data selezionata con l'ora
                      const [hours, minutes] = selectedTime.split(':').map(Number);
                      const dateWithTime = new Date(date);
                      dateWithTime.setHours(hours, minutes, 0, 0);
                      setFormData(prev => ({ ...prev, due_date: dateWithTime }));
                      // Non chiudere automaticamente, lascia che l'utente confermi
                    }
                  }}
                  // Rimuovi la disabilitazione delle date passate per permettere la selezione di oggi
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selectedDate = new Date(date);
                    selectedDate.setHours(0, 0, 0, 0);
                    return selectedDate < today;
                  }}
                  initialFocus
                />
                <div className="p-3 border-t space-y-3">
                  {/* Selettore ora */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ora scadenza</Label>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => {
                          setSelectedTime(e.target.value);
                          // Se c'è già una data selezionata, aggiorna anche quella
                          if (formData.due_date) {
                            const [hours, minutes] = e.target.value.split(':').map(Number);
                            const updatedDate = new Date(formData.due_date);
                            updatedDate.setHours(hours, minutes, 0, 0);
                            setFormData(prev => ({ ...prev, due_date: updatedDate }));
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const now = new Date();
                          const currentTime = format(now, 'HH:mm');
                          setSelectedTime(currentTime);
                          if (formData.due_date) {
                            const updatedDate = new Date(formData.due_date);
                            updatedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
                            setFormData(prev => ({ ...prev, due_date: updatedDate }));
                          }
                        }}
                      >
                        Ora
                      </Button>
                    </div>
                  </div>
                  
                  {/* Pulsante di conferma */}
                   <Button
                     onClick={() => setIsCalendarOpen(false)}
                     className="w-full"
                     size="sm"
                   >
                     Conferma
                   </Button>

                  {formData.due_date && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, due_date: null }));
                        setSelectedTime('23:59');
                        setIsCalendarOpen(false);
                      }}
                      className="w-full"
                    >
                      Rimuovi data
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Pianificazione */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pianificazione (opzionale)</Label>
            <p className="text-xs text-muted-foreground">Quando vuoi svolgere questa attività</p>
            <Popover open={isPlannedCalendarOpen} onOpenChange={setIsPlannedCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.planned_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.planned_date ? (
                    `${format(formData.planned_date, "PPP", { locale: it })} alle ${selectedPlannedTime}`
                  ) : (
                    "Seleziona quando svolgere l'attività"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.planned_date}
                  onSelect={(date) => {
                    if (date) {
                      // Combina la data selezionata con l'ora
                      const [hours, minutes] = selectedPlannedTime.split(':').map(Number);
                      const dateWithTime = new Date(date);
                      dateWithTime.setHours(hours, minutes, 0, 0);
                      setFormData(prev => ({ ...prev, planned_date: dateWithTime }));
                    }
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selectedDate = new Date(date);
                    selectedDate.setHours(0, 0, 0, 0);
                    return selectedDate < today;
                  }}
                  initialFocus
                />
                <div className="p-3 border-t space-y-3">
                  {/* Selettore ora */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ora pianificata</Label>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={selectedPlannedTime}
                        onChange={(e) => {
                          setSelectedPlannedTime(e.target.value);
                          // Se c'è già una data selezionata, aggiorna anche quella
                          if (formData.planned_date) {
                            const [hours, minutes] = e.target.value.split(':').map(Number);
                            const updatedDate = new Date(formData.planned_date);
                            updatedDate.setHours(hours, minutes, 0, 0);
                            setFormData(prev => ({ ...prev, planned_date: updatedDate }));
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const now = new Date();
                          const currentTime = format(now, 'HH:mm');
                          setSelectedPlannedTime(currentTime);
                          if (formData.planned_date) {
                            const updatedDate = new Date(formData.planned_date);
                            updatedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
                            setFormData(prev => ({ ...prev, planned_date: updatedDate }));
                          }
                        }}
                      >
                        Ora
                      </Button>
                    </div>
                  </div>
                  
                  {/* Pulsante di conferma */}
                   <Button
                     onClick={() => setIsPlannedCalendarOpen(false)}
                     className="w-full"
                     size="sm"
                   >
                     Conferma
                   </Button>

                  {formData.planned_date && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, planned_date: null }));
                        setSelectedPlannedTime('09:00');
                        setIsPlannedCalendarOpen(false);
                      }}
                      className="w-full"
                    >
                      Rimuovi pianificazione
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Azioni */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-3 pt-3 md:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 text-sm"
              disabled={loading}
            >
              Annulla
            </Button>
            
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="flex-1 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  {isFormValid ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{initialData ? 'Aggiorna Task' : 'Crea Task'}</span>
                  <span className="sm:hidden">{initialData ? 'Aggiorna' : 'Crea'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};