import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import ProjectManager from '@/components/ProjectManager';
import { AuthPage } from '@/components/AuthPage';

const ProjectsPage: React.FC = () => {
  const { user, loading } = useAuth();

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
    <div className="container mx-auto px-4 py-8">
      <ProjectManager userId={user.id} />
    </div>
  );
};

export default ProjectsPage;