ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_seating_check;

UPDATE public.reservations
SET seating = CASE
  WHEN seating = 'indoor-non-smoking' THEN 'non-smoking'
  WHEN seating = 'outdoor-smoking' THEN 'outdoor'
  WHEN seating IN ('non-smoking', 'smoking', 'outdoor') THEN seating
  ELSE 'non-smoking'
END;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_seating_check
  CHECK (seating IN ('non-smoking', 'smoking', 'outdoor'));

ALTER TABLE public.reservations
  ALTER COLUMN seating SET DEFAULT 'non-smoking';