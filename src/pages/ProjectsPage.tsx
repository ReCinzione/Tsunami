import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import ProjectManager from '@/components/ProjectManager';
import { AuthPage } from '@/components/AuthPage';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectsPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Torna alla Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              I tuoi Progetti
            </h1>
            <p className="text-muted-foreground">
              Gestisci le tue idee e trasformale in realtà
            </p>
          </div>
        </div>

        <ProjectManager userId={user.id} />
      </div>
    </div>
  );
};

export default ProjectsPage;