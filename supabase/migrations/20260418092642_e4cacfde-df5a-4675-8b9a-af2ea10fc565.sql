-- Feedback submissions from guests
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('praise', 'complaint')),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (matches reservations pattern — app uses local auth) can submit feedback
CREATE POLICY "Anyone can create feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

-- Anyone can view (admin page reads it; matches existing reservations table policy)
CREATE POLICY "Anyone can view feedback"
  ON public.feedback FOR SELECT
  USING (true);

-- Authenticated can update / delete (admin marks resolved)
CREATE POLICY "Authenticated users can update feedback"
  ON public.feedback FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete feedback"
  ON public.feedback FOR DELETE
  TO authenticated
  USING (true);

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_feedback_created_at ON public.feedback (created_at DESC);
CREATE INDEX idx_feedback_type ON public.feedback (feedback_type);