-- Add Google Calendar integration fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN google_calendar_access_token TEXT,
ADD COLUMN google_calendar_refresh_token TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.google_calendar_access_token IS 'Google Calendar OAuth access token for API calls';
COMMENT ON COLUMN public.profiles.google_calendar_refresh_token IS 'Google Calendar OAuth refresh token for token renewal';