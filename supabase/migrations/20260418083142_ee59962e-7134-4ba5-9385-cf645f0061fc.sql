-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Reusable updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  party_size INT NOT NULL CHECK (party_size > 0),
  reservation_date DATE NOT NULL,
  reservation_time TEXT NOT NULL,
  deposit BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'no-show', 'seated', 'waitlist')),
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_date ON public.reservations(reservation_date);
CREATE INDEX idx_reservations_reminder ON public.reservations(reservation_date, reminder_sent_at)
  WHERE reminder_sent_at IS NULL;

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Public can create reservations (matches demo: open booking form)
CREATE POLICY "Anyone can create a reservation"
  ON public.reservations FOR INSERT
  WITH CHECK (true);

-- Public can read reservations (admin dashboard reads them; demo has no admin auth)
CREATE POLICY "Anyone can view reservations"
  ON public.reservations FOR SELECT
  USING (true);

-- Only signed-in users can update (admin marks no-show / seated)
CREATE POLICY "Authenticated users can update reservations"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete reservations"
  ON public.reservations FOR DELETE
  TO authenticated
  USING (true);

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reminder log
CREATE TABLE public.reminder_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  recipient_email TEXT,
  status TEXT NOT NULL CHECK (status IN ('dry-run', 'sent', 'failed', 'skipped')),
  channel TEXT NOT NULL DEFAULT 'email',
  error_message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminder_log_reservation ON public.reminder_log(reservation_id);
CREATE INDEX idx_reminder_log_created ON public.reminder_log(created_at DESC);

ALTER TABLE public.reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reminder log"
  ON public.reminder_log FOR SELECT
  USING (true);

-- No INSERT policy for clients — only service role (edge function) writes here.