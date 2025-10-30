-- Fix XP calculation to match ProgressionService logic
-- This migration updates the calculate_xp_for_level function to use the same formula as ProgressionService

-- Drop the old function
DROP FUNCTION IF EXISTS public.calculate_xp_for_level(INTEGER);

-- Create new function that matches ProgressionService logic
CREATE OR REPLACE FUNCTION public.calculate_xp_for_level(level_num INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Use the same formula as ProgressionService: LEVEL_BASE * (LEVEL_MULTIPLIER ^ (level - 2))
  -- LEVEL_BASE = 100, LEVEL_MULTIPLIER = 1.5
  IF level_num <= 1 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(100 * POWER(1.5, level_num - 2));
END;
$$ LANGUAGE plpgsql;

-- Create helper function to calculate total XP required for a level
CREATE OR REPLACE FUNCTION public.calculate_total_xp_for_level(target_level INTEGER)
RETURNS INTEGER AS $$
DECLARE
  total_xp INTEGER := 0;
  i INTEGER;
BEGIN
  IF target_level <= 1 THEN
    RETURN 0;
  END IF;
  
  FOR i IN 2..target_level LOOP
    total_xp := total_xp + calculate_xp_for_level(i);
  END LOOP;
  
  RETURN total_xp;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate level from total XP (matches ProgressionService logic)
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(total_xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_level INTEGER := 1;
  xp_required INTEGER := 0;
BEGIN
  IF total_xp <= 0 THEN
    RETURN 1;
  END IF;
  
  WHILE xp_required < total_xp LOOP
    xp_required := xp_required + calculate_xp_for_level(current_level);
    IF xp_required <= total_xp THEN
      current_level := current_level + 1;
    END IF;
  END LOOP;
  
  RETURN GREATEST(1, current_level - 1);
END;
$$ LANGUAGE plpgsql;

-- Update the add_xp_to_profile function to use the new calculation
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
  
  -- Calculate new level using the new function
  new_level := calculate_level_from_xp(new_total_xp);
  
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
    xp_amount,
    source,
    created_at
  ) VALUES (
    add_xp_to_profile.user_id,
    xp_amount,
    'task_completion',
    now()
  );
  
  -- Return result
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
END;
$$;

-- Update all existing profiles to use the correct level calculation
UPDATE profiles 
SET current_level = calculate_level_from_xp(total_xp)
WHERE total_xp > 0;

-- Test the new functions
SELECT 
  'Test Results' as test,
  calculate_level_from_xp(1037) as level_for_1037_xp,
  calculate_total_xp_for_level(6) as total_xp_for_level_6,
  calculate_xp_for_level(6) as xp_required_for_level_6;