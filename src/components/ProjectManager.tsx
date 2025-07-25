import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, Lightbulb } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  energy_required: 'molto_bassa' | 'bassa' | 'media' | 'alta' | 'molto_alta';
  created_at: string;
  updated_at: string;
}

interface ProjectManagerProps {
  userId: string;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ userId }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'idea',
    energy_required: 'media' as Project['energy_required']
  });

  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadProjects();
    }
  }, [userId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento dei progetti",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...formData,
          user_id: userId
        }])
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [data, ...prev]);
      resetForm();
      setDialogOpen(false);
      
      toast({
        title: "Progetto creato",
        description: "Il progetto è stato aggiunto con successo",
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Errore",
        description: "Errore nella creazione del progetto",
        variant: "destructive",
      });
    }
  };

  const updateProject = async () => {
    if (!editingProject) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .update(formData)
        .eq('id', editingProject.id)
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => prev.map(p => p.id === editingProject.id ? data : p));
      resetForm();
      setDialogOpen(false);
      setEditingProject(null);
      
      toast({
        title: "Progetto aggiornato",
        description: "Le modifiche sono state salvate",
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento del progetto",
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      toast({
        title: "Progetto eliminato",
        description: "Il progetto è stato rimosso",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione del progetto",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'idea',
      energy_required: 'media'
    });
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || '',
      status: project.status,
      energy_required: project.energy_required
    });
    setDialogOpen(true);
  };

  const getEnergyColor = (energy: Project['energy_required']) => {
    const colors = {
      'molto_bassa': 'bg-green-100 text-green-800',
      'bassa': 'bg-blue-100 text-blue-800',
      'media': 'bg-yellow-100 text-yellow-800',
      'alta': 'bg-orange-100 text-orange-800',
      'molto_alta': 'bg-red-100 text-red-800'
    };
    return colors[energy];
  };

  const getEnergyPoints = (energy: Project['energy_required']) => {
    const points = {
      'molto_bassa': 1,
      'bassa': 3,
      'media': 6,
      'alta': 10,
      'molto_alta': 15
    };
    return points[energy];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Progetti</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Progetto
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Modifica Progetto' : 'Nuovo Progetto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Titolo</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titolo del progetto"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Descrizione</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione del progetto"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Energia Richiesta</label>
              <Select
                value={formData.energy_required}
                onValueChange={(value: Project['energy_required']) => 
                  setFormData({ ...formData, energy_required: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="molto_bassa">Molto Bassa (1 XP)</SelectItem>
                  <SelectItem value="bassa">Bassa (3 XP)</SelectItem>
                  <SelectItem value="media">Media (6 XP)</SelectItem>
                  <SelectItem value="alta">Alta (10 XP)</SelectItem>
                  <SelectItem value="molto_alta">Molto Alta (15 XP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Stato</label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea</SelectItem>
                  <SelectItem value="in_corso">In Corso</SelectItem>
                  <SelectItem value="completato">Completato</SelectItem>
                  <SelectItem value="sospeso">Sospeso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={editingProject ? updateProject : createProject}
                disabled={!formData.title.trim()}
                className="flex-1"
              >
                {editingProject ? 'Aggiorna' : 'Crea'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingProject(null);
                  resetForm();
                }}
              >
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nessun progetto trovato</p>
              <p className="text-sm text-muted-foreground">Inizia creando il tuo primo progetto</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(project)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProject(project.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">
                    {project.status === 'idea' && 'Idea'}
                    {project.status === 'in_corso' && 'In Corso'}
                    {project.status === 'completato' && 'Completato'}
                    {project.status === 'sospeso' && 'Sospeso'}
                  </Badge>
                  <Badge className={getEnergyColor(project.energy_required)}>
                    {project.energy_required === 'molto_bassa' && 'Molto Bassa'}
                    {project.energy_required === 'bassa' && 'Bassa'}
                    {project.energy_required === 'media' && 'Media'}
                    {project.energy_required === 'alta' && 'Alta'}
                    {project.energy_required === 'molto_alta' && 'Molto Alta'}
                    {' '}({getEnergyPoints(project.energy_required)} XP)
                  </Badge>
                  <span className="text-muted-foreground ml-auto">
                    {formatDate(project.created_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectManager;