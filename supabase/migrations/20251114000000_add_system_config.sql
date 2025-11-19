  -- Migration: Add System Configuration Table
  -- Purpose: Store system-wide configuration settings like alert thresholds and agent settings

  CREATE TABLE IF NOT EXISTS public.system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key TEXT NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_system_config_key ON public.system_config(config_key);
  CREATE INDEX idx_system_config_category ON public.system_config(category);

  -- Enable RLS
  ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

  -- RLS Policies
  CREATE POLICY "Admins can read system config" ON public.system_config FOR SELECT 
    TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'));

  CREATE POLICY "Admins can update system config" ON public.system_config FOR UPDATE 
    TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

  CREATE POLICY "Admins can insert system config" ON public.system_config FOR INSERT 
    TO authenticated 
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

  -- Insert default configuration values
  INSERT INTO public.system_config (config_key, config_value, description, category) VALUES
    ('pressure_low_threshold', to_jsonb(50), 'Pressure below this value (psi) triggers low pressure alert', 'thresholds'),
    ('pressure_high_threshold', to_jsonb(100), 'Pressure above this value (psi) triggers high pressure alert', 'thresholds'),
    ('pressure_critical_low', to_jsonb(30), 'Pressure below this value (psi) triggers critical alert', 'thresholds'),
    ('acoustic_leak_threshold', to_jsonb(5), 'Acoustic reading above this value (dB) indicates potential leak', 'thresholds'),
    ('flow_high_threshold', to_jsonb(110), 'Flow above this value (L/s) indicates potential leak', 'thresholds'),
    ('autonomous_mode', to_jsonb(true), 'Enable autonomous AI agent actions without manual approval', 'agent_settings'),
    ('approval_required', to_jsonb(false), 'Require manual approval for AI agent actions', 'agent_settings'),
    ('leak_confidence_threshold', to_jsonb(0.7), 'Minimum confidence score (0-1) for leak detection', 'agent_settings'),
    ('permissions_admin', '["manage_users","configure_system","manage_network","view_dashboard","manage_incidents"]'::jsonb, 'Feature access granted to admin role', 'access_control'),
    ('permissions_engineer', '["manage_network","view_dashboard","manage_incidents"]'::jsonb, 'Feature access granted to engineer role', 'access_control'),
    ('permissions_operator', '["view_dashboard","manage_incidents","view_ai_recommendations"]'::jsonb, 'Feature access granted to operator role', 'access_control')
  ON CONFLICT (config_key) DO NOTHING;


