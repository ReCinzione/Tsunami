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
  Zap, 
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
  task, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    task_type: task?.task_type || 'azione',
    energy_required: task?.energy_required || 'media',
    // estimated_duration removed - not in database schema
    // difficulty_level removed
    xp_reward: task?.xp_reward || 10,
    due_date: task?.due_date ? new Date(task.due_date) : null,
    // requires_deep_focus: task?.requires_deep_focus || false, // Removed - not in database schema
    tags: task?.tags || []
  });

  const [errors, setErrors] = useState<Partial<TaskFormData>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentTag, setCurrentTag] = useState('');

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

  // Aggiunge un tag
  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  // Rimuove un tag
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Calcola XP suggeriti basati su difficoltà e durata
  const calculateSuggestedXP = () => {
    const baseXP = 25; // Base XP value
    const durationBonus = 0; // Duration bonus removed
    const focusBonus = 0; // formData.requires_deep_focus ? 5 : 0; // Removed - not in database schema
    return baseXP + durationBonus + focusBonus;
  };

  // Template rapidi per task comuni
  const quickTemplates = [
    {
      name: '📧 Email veloce',
      data: { task_type: 'comunicazione', energy_required: 'bassa' }
    },
    {
      name: '📞 Chiamata importante',
      data: { task_type: 'comunicazione', energy_required: 'media' }
    },
    {
      name: '📝 Scrittura creativa',
      data: { task_type: 'creativita', energy_required: 'alta' } // requires_deep_focus removed
    },
    {
      name: '🧹 Organizzazione rapida',
      data: { task_type: 'organizzazione', energy_required: 'media' }
    }
  ];

  const applyTemplate = (template: typeof quickTemplates[0]) => {
    setFormData(prev => ({ ...prev, ...template.data }));
  };

  const isFormValid = !errors.title && formData.title.trim();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            {task ? 'Modifica Task' : 'Nuova Task'}
          </CardTitle>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Template rapidi */}
        {!task && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-sm text-gray-600 mr-2">Template rapidi:</span>
            {quickTemplates.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => applyTemplate(template)}
                className="text-xs h-7"
              >
                {template.name}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
                "transition-colors",
                errors.title && "border-red-300 focus:border-red-500"
              )}
              maxLength={100}
            />
            {errors.title && (
              <div className="flex items-center gap-1 text-red-600 text-xs">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </div>
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

          {/* Tipo e Energia - Layout a due colonne */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo di Task</Label>
              <Select
                value={formData.task_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, task_type: value as any }))}
              >
                <SelectTrigger>
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
              <Label className="text-sm font-medium">Energia Richiesta</Label>
              <Select
                value={formData.energy_required}
                onValueChange={(value) => setFormData(prev => ({ ...prev, energy_required: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="molto_bassa">💤 Molto Bassa</SelectItem>
                  <SelectItem value="bassa">🌱 Bassa</SelectItem>
                  <SelectItem value="media">⚡ Media</SelectItem>
                  <SelectItem value="alta">🔥 Alta</SelectItem>
                  <SelectItem value="molto_alta">🚀 Molto Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data di scadenza */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data di Scadenza (opzionale)</Label>
            <Popover>
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
                    format(formData.due_date, "PPP", { locale: it })
                  ) : (
                    "Seleziona una data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
                {formData.due_date && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, due_date: null }))}
                      className="w-full"
                    >
                      Rimuovi data
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Opzioni avanzate */}
          <div className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full justify-between p-0 h-auto font-normal"
            >
              <span className="text-sm font-medium">Opzioni Avanzate</span>
              <span className={cn(
                "transition-transform",
                showAdvanced && "rotate-180"
              )}>
                ▼
              </span>
            </Button>

            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                {/* Durata stimata e difficoltà */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Estimated duration field removed - not in database schema */}

                  {/* Difficulty level field removed */}
                </div>

                {/* XP Reward */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Ricompensa XP
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        xp_reward: calculateSuggestedXP() 
                      }))}
                      className="text-xs h-6"
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Suggerisci ({calculateSuggestedXP()} XP)
                    </Button>
                  </div>
                  <Input
                    type="number"
                    value={formData.xp_reward}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      xp_reward: parseInt(e.target.value) || 0 
                    }))}
                    min={0}
                    max={100}
                  />
                </div>

                {/* Focus profondo - removed (requires_deep_focus not in database schema) */}
                {/* <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Focus className="h-3 w-3" />
                      Richiede Focus Profondo
                    </Label>
                    <p className="text-xs text-gray-600">
                      Attiva quando la task richiede concentrazione senza interruzioni
                    </p>
                  </div>
                  <Switch
                    checked={formData.requires_deep_focus}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      requires_deep_focus: checked 
                    }))}
                  />
                </div> */}

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tag</Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Aggiungi tag..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      disabled={!currentTag.trim()}
                    >
                      Aggiungi
                    </Button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-red-100"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Azioni */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Annulla
            </Button>
            
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="flex-1 flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  {isFormValid ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {task ? 'Aggiorna Task' : 'Crea Task'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};