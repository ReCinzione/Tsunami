-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'idea',
  energy_required energy_level DEFAULT 'media',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can manage their projects" 
ON public.projects 
FOR ALL
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update energy_level enum to include very low and very high
ALTER TYPE energy_level ADD VALUE IF NOT EXISTS 'molto_bassa';
ALTER TYPE energy_level ADD VALUE IF NOT EXISTS 'molto_alta';