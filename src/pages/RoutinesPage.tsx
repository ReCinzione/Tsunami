import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import RoutineManager from '@/components/RoutineManager';
import { AuthPage } from '@/components/AuthPage';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RoutinesPage: React.FC = () => {
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
              Le tue Routine
            </h1>
            <p className="text-muted-foreground">
              Crea e gestisci le tue abitudini quotidiane per raggiungere i tuoi obiettivi
            </p>
          </div>
        </div>

        <RoutineManager userId={user.id} />
      </div>
    </div>
  );
};

export default RoutinesPage;