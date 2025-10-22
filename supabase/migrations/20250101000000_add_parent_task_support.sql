-- Add parent_task_id support for subtasks
ALTER TABLE public.tasks 
ADD COLUMN parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Create index for better performance when querying subtasks
CREATE INDEX idx_tasks_parent_task_id ON public.tasks(parent_task_id);

-- Add constraint to prevent circular references (task cannot be parent of itself)
ALTER TABLE public.tasks 
ADD CONSTRAINT check_no_self_parent 
CHECK (id != parent_task_id);

-- Update RLS policies to include parent_task_id access
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
CREATE POLICY "Users can insert their own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Add function to get task with subtasks
CREATE OR REPLACE FUNCTION get_task_with_subtasks(task_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  energy_required energy_level,
  task_type task_type,
  is_recurring BOOLEAN,
  recurrence_pattern TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  postponed_count INTEGER,
  xp_reward INTEGER,
  status TEXT,
  google_calendar_event_id TEXT,
  parent_task_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  subtask_count INTEGER,
  completed_subtasks INTEGER
)
LANGUAGE sql
AS $$
  SELECT 
    t.*,
    COALESCE(st.subtask_count, 0) as subtask_count,
    COALESCE(st.completed_subtasks, 0) as completed_subtasks
  FROM tasks t
  LEFT JOIN (
    SELECT 
      parent_task_id,
      COUNT(*) as subtask_count,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_subtasks
    FROM tasks 
    WHERE parent_task_id IS NOT NULL
    GROUP BY parent_task_id
  ) st ON t.id = st.parent_task_id
  WHERE t.id = task_id;
$$;