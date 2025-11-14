-- Add fields to events table for AI-detected incidents

-- Add metadata JSONB field to store AI detection data
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add detected_by field to track which agent created the incident
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS detected_by TEXT;

-- Add confidence field to store AI confidence score (0.0 to 1.0)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS confidence FLOAT;

-- Add priority field for incident prioritization (0-100 score)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 50;

-- Create index on priority for faster sorting
CREATE INDEX IF NOT EXISTS idx_events_priority ON public.events(priority DESC);

-- Create index on confidence for faster filtering
CREATE INDEX IF NOT EXISTS idx_events_confidence ON public.events(confidence DESC);

-- Create index on detected_by for agent filtering
CREATE INDEX IF NOT EXISTS idx_events_detected_by ON public.events(detected_by);

COMMENT ON COLUMN public.events.metadata IS 'Stores AI detection details: sensor_indicators, reasoning, recommendations, valve sequences';
COMMENT ON COLUMN public.events.detected_by IS 'Name of AI agent that detected this incident (e.g., "Leak Preemption Agent")';
COMMENT ON COLUMN public.events.confidence IS 'AI confidence score (0.0 to 1.0) for this detection';
COMMENT ON COLUMN public.events.priority IS 'Priority score (0-100) for incident ranking, higher = more urgent';
