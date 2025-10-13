-- Create enum types for the application
CREATE TYPE public.archetype_type AS ENUM ('visionario', 'costruttore', 'sognatore', 'silenzioso', 'combattente');
CREATE TYPE public.energy_level AS ENUM ('bassa', 'media', 'alta');
CREATE TYPE public.task_type AS ENUM ('azione', 'riflessione', 'comunicazione', 'creativita', 'organizzazione');
CREATE TYPE public.daily_mood AS ENUM ('congelato', 'disorientato', 'in_flusso', 'ispirato');

-- Profiles table with archetype percentages
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  dominant_archetype archetype_type,
  visionario_percentage INTEGER DEFAULT 0 CHECK (visionario_percentage >= 0 AND visionario_percentage <= 100),
  costruttore_percentage INTEGER DEFAULT 0 CHECK (costruttore_percentage >= 0 AND costruttore_percentage <= 100),
  sognatore_percentage INTEGER DEFAULT 0 CHECK (sognatore_percentage >= 0 AND sognatore_percentage <= 100),
  silenzioso_percentage INTEGER DEFAULT 0 CHECK (silenzioso_percentage >= 0 AND silenzioso_percentage <= 100),
  combattente_percentage INTEGER DEFAULT 0 CHECK (combattente_percentage >= 0 AND combattente_percentage <= 100),
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 10),
  total_xp INTEGER DEFAULT 0,
  test_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test questions and answers
CREATE TABLE public.test_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_number INTEGER NOT NULL UNIQUE CHECK (question_number >= 1 AND question_number <= 10),
  question_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.test_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.test_questions(id) ON DELETE CASCADE,
  answer_letter CHAR(1) NOT NULL CHECK (answer_letter IN ('A', 'B', 'C', 'D', 'E')),
  answer_text TEXT NOT NULL,
  archetype archetype_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(question_id, answer_letter)
);

-- User test responses
CREATE TABLE public.user_test_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.test_questions(id) ON DELETE CASCADE,
  selected_answer_id UUID NOT NULL REFERENCES public.test_answers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Archetype levels with all the details from the specifications
CREATE TABLE public.archetype_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  archetype archetype_type NOT NULL,
  level_number INTEGER NOT NULL CHECK (level_number >= 1 AND level_number <= 10),
  level_name TEXT NOT NULL,
  description TEXT NOT NULL,
  emerging_quality TEXT NOT NULL,
  shadow_aspect TEXT NOT NULL,
  imaginal_object_name TEXT NOT NULL,
  xp_required INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(archetype, level_number)
);

-- Imaginal objects that users unlock
CREATE TABLE public.imaginal_objects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archetype_level_id UUID NOT NULL REFERENCES public.archetype_levels(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, archetype_level_id)
);

-- Mental inbox for free-form thoughts and ideas
CREATE TABLE public.mental_inbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'voice', 'image')),
  is_processed BOOLEAN DEFAULT FALSE,
  converted_to_task BOOLEAN DEFAULT FALSE,
  task_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Flexible task system
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  energy_required energy_level DEFAULT 'media',
  task_type task_type DEFAULT 'azione',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- JSON string for complex patterns
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  postponed_count INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 10,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'postponed', 'cancelled')),
  google_calendar_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily mood tracking and rituals
CREATE TABLE public.daily_moods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood daily_mood NOT NULL,
  suggested_ritual TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Traces tracking (progress tracking that values process over completion)
CREATE TABLE public.traces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  trace_type TEXT NOT NULL CHECK (trace_type IN ('inizio', 'avanzamento', 'contatto')),
  description TEXT,
  xp_gained INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- XP transactions for tracking all XP gains
CREATE TABLE public.xp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL, -- 'task_completion', 'trace', 'ritual', 'level_up'
  source_id UUID, -- Reference to the source (task_id, trace_id, etc.)
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archetype_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imaginal_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mental_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for test data (public read, user-specific write)
CREATE POLICY "Test questions are publicly readable" ON public.test_questions FOR SELECT USING (true);
CREATE POLICY "Test answers are publicly readable" ON public.test_answers FOR SELECT USING (true);
CREATE POLICY "Archetype levels are publicly readable" ON public.archetype_levels FOR SELECT USING (true);

-- RLS Policies for user-specific data
CREATE POLICY "Users can manage their test responses" ON public.user_test_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their imaginal objects" ON public.imaginal_objects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their mental inbox" ON public.mental_inbox FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their daily moods" ON public.daily_moods FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their traces" ON public.traces FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their XP transactions" ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create XP transactions" ON public.xp_transactions FOR INSERT WITH CHECK (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate XP required for each level (semi-logarithmic progression)
CREATE OR REPLACE FUNCTION public.calculate_xp_for_level(level_num INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Total XP should be ~11,500 for level 10, semi-logarithmic progression
  -- Level 1: 100, Level 2: 250, Level 3: 450, Level 4: 700, Level 5: 1000
  -- Level 6: 1350, Level 7: 1750, Level 8: 2200, Level 9: 2700, Level 10: 3200
  CASE level_num
    WHEN 1 THEN RETURN 100;
    WHEN 2 THEN RETURN 350;   -- 100 + 250
    WHEN 3 THEN RETURN 800;   -- 350 + 450
    WHEN 4 THEN RETURN 1500;  -- 800 + 700
    WHEN 5 THEN RETURN 2500;  -- 1500 + 1000
    WHEN 6 THEN RETURN 3850;  -- 2500 + 1350
    WHEN 7 THEN RETURN 5600;  -- 3850 + 1750
    WHEN 8 THEN RETURN 7800;  -- 5600 + 2200
    WHEN 9 THEN RETURN 10500; -- 7800 + 2700
    WHEN 10 THEN RETURN 11500; -- 10500 + 1000 (final level)
    ELSE RETURN 11500;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to handle profile creation when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();