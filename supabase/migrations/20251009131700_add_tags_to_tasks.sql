-- Migration: Add tags column to tasks table
-- Date: 2025-10-09
-- Description: Adds a tags column (text array) to the tasks table if it doesn't exist
--              Maintains compatibility across environments and includes RLS policy updates

-- Add tags column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN tags text[] DEFAULT '{}'::text[];
        RAISE NOTICE 'Column tags added to tasks table';
    ELSE
        RAISE NOTICE 'Column tags already exists in tasks table';
    END IF;
END $$;

-- Update RLS policies to ensure tags column visibility
-- Drop existing select policy if it exists
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;

-- Recreate select policy with explicit column access including tags
CREATE POLICY "Users can view their own tasks"
    ON public.tasks
    FOR SELECT
    USING (auth.uid() = user_id);

-- Ensure insert policy allows tags
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;

CREATE POLICY "Users can insert their own tasks"
    ON public.tasks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Ensure update policy allows tags
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;

CREATE POLICY "Users can update their own tasks"
    ON public.tasks
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Ensure delete policy is correct
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

CREATE POLICY "Users can delete their own tasks"
    ON public.tasks
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comment to document the tags column
COMMENT ON COLUMN public.tasks.tags IS 'Array of tags associated with this task. Standard PostgreSQL text[] type.';

-- Verify RLS is enabled
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
