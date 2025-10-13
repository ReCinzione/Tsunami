-- Migration: Add missing add_xp_to_profile function
-- Created: 2025-01-21
-- Purpose: Fix 404 error when assigning XP to user profiles

-- Aggiungi campi per il supporto vocale alle tabelle esistenti
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS voice_created BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS voice_confidence DECIMAL(3,2);
ALTER TABLE mental_inbox ADD COLUMN IF NOT EXISTS voice_confidence DECIMAL(3,2);

-- Aggiungi colonna priority per gestire la priorità dei task
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Create the add_xp_to_profile function
CREATE OR REPLACE FUNCTION public.add_xp_to_profile(
  user_id uuid,
  xp_amount integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_profile RECORD;
  new_total_xp integer;
  new_level integer;
  old_level integer;
  level_up boolean := false;
  result json;
BEGIN
  -- Get current profile data
  SELECT * INTO current_profile
  FROM profiles
  WHERE profiles.user_id = add_xp_to_profile.user_id;
  
  -- Check if profile exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user_id: %', user_id;
  END IF;
  
  -- Calculate new XP total
  new_total_xp := current_profile.total_xp + xp_amount;
  old_level := current_profile.current_level;
  
  -- Calculate new level based on XP
  -- Find the highest level where required XP <= new_total_xp
  SELECT COALESCE(MAX(level_num), 1) INTO new_level
  FROM (
    SELECT 1 as level_num, 0 as required_xp
    UNION ALL
    SELECT generate_series(2, 10) as level_num, 
           calculate_xp_for_level(generate_series(2, 10)) as required_xp
  ) levels
  WHERE required_xp <= new_total_xp;
  
  -- Check if level up occurred
  IF new_level > old_level THEN
    level_up := true;
  END IF;
  
  -- Update profile with new XP and level
  UPDATE profiles
  SET 
    total_xp = new_total_xp,
    current_level = new_level,
    updated_at = now()
  WHERE profiles.user_id = add_xp_to_profile.user_id;
  
  -- Create XP transaction record
  INSERT INTO xp_transactions (
    user_id,
    amount,
    source,
    source_id,
    description,
    created_at
  ) VALUES (
    add_xp_to_profile.user_id,
    xp_amount,
    'task_completion',
    NULL, -- We could pass task_id if needed
    format('XP reward: +%s points', xp_amount),
    now()
  );
  
  -- Prepare result JSON
  result := json_build_object(
    'success', true,
    'old_xp', current_profile.total_xp,
    'new_xp', new_total_xp,
    'xp_gained', xp_amount,
    'old_level', old_level,
    'new_level', new_level,
    'level_up', level_up
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error information
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_xp_to_profile(uuid, integer) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.add_xp_to_profile(uuid, integer) IS 
'Adds XP to user profile, recalculates level, and creates transaction record. Returns JSON with operation results.';