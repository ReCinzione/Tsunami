-- Fix routine type for 'Studiare inglese' from daily to weekly
-- This routine has specific days configured but was saved as daily type

UPDATE routines 
SET type = 'weekly' 
WHERE name = 'Studiare inglese' 
  AND type = 'daily' 
  AND days_of_week IS NOT NULL 
  AND array_length(days_of_week, 1) > 0;

-- Verify the update
SELECT id, name, type, days_of_week, is_active 
FROM routines 
WHERE name = 'Studiare inglese';