-- Create mentoring_sessions table
CREATE TABLE public.mentoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL,
  student_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentoring_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consultants (full CRUD on their sessions)
CREATE POLICY "Consultants can view their own sessions"
ON public.mentoring_sessions
FOR SELECT
USING (auth.uid() = consultant_id);

CREATE POLICY "Consultants can create sessions"
ON public.mentoring_sessions
FOR INSERT
WITH CHECK (auth.uid() = consultant_id);

CREATE POLICY "Consultants can update their own sessions"
ON public.mentoring_sessions
FOR UPDATE
USING (auth.uid() = consultant_id);

CREATE POLICY "Consultants can delete their own sessions"
ON public.mentoring_sessions
FOR DELETE
USING (auth.uid() = consultant_id);

-- RLS Policy for students (view sessions where they are the student)
CREATE POLICY "Students can view sessions they are invited to"
ON public.mentoring_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invites i
    JOIN public.profiles p ON p.email = i.email
    WHERE p.id = auth.uid() AND i.registered_uid = mentoring_sessions.student_id
  )
  OR auth.uid() = student_id
);

-- Create trigger for updated_at
CREATE TRIGGER update_mentoring_sessions_updated_at
BEFORE UPDATE ON public.mentoring_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();