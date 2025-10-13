-- Create task_interventions table for storing multiple interventions per task
CREATE TABLE public.task_interventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.task_interventions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can manage their task interventions" 
ON public.task_interventions 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_task_interventions_updated_at
BEFORE UPDATE ON public.task_interventions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint (optional for better data integrity)
ALTER TABLE public.task_interventions 
ADD CONSTRAINT fk_task_interventions_task_id 
FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;