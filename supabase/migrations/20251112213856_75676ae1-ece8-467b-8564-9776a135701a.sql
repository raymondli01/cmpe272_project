-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE node_type AS ENUM ('junction', 'tank', 'reservoir');
CREATE TYPE edge_status AS ENUM ('open', 'closed', 'isolated');
CREATE TYPE valve_kind AS ENUM ('valve', 'pump');
CREATE TYPE sensor_type AS ENUM ('pressure', 'flow', 'acoustic', 'quality');
CREATE TYPE event_kind AS ENUM ('leak', 'quality', 'energy', 'maintenance');
CREATE TYPE event_state AS ENUM ('open', 'acknowledged', 'resolved');
CREATE TYPE event_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE agent_role AS ENUM ('leak-preempt', 'energy-optimizer', 'safety');
CREATE TYPE agent_status AS ENUM ('enabled', 'disabled', 'running');
CREATE TYPE app_role AS ENUM ('operator', 'engineer', 'admin');

-- Nodes table (junctions, tanks, reservoirs)
CREATE TABLE public.nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  type node_type NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  elevation FLOAT NOT NULL DEFAULT 0,
  pressure FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Edges table (pipes)
CREATE TABLE public.edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  from_node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  length_m FLOAT NOT NULL,
  diameter_mm FLOAT NOT NULL,
  status edge_status NOT NULL DEFAULT 'open',
  flow_lps FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Valves and Pumps table
CREATE TABLE public.valves_pumps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  edge_id UUID NOT NULL REFERENCES public.edges(id) ON DELETE CASCADE,
  kind valve_kind NOT NULL,
  status edge_status NOT NULL DEFAULT 'open',
  setpoint FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sensors table
CREATE TABLE public.sensors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL,
  asset_type TEXT NOT NULL,
  type sensor_type NOT NULL,
  value FLOAT,
  unit TEXT NOT NULL,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind event_kind NOT NULL,
  severity event_severity NOT NULL,
  asset_ref UUID,
  asset_type TEXT,
  state event_state NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  description TEXT,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agents table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  role agent_role NOT NULL,
  status agent_status NOT NULL DEFAULT 'enabled',
  last_decision TEXT,
  confidence FLOAT DEFAULT 0,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Energy prices table
CREATE TABLE public.energy_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL,
  price_per_kwh FLOAT NOT NULL,
  is_off_peak BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valves_pumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies - Read access for authenticated users
CREATE POLICY "Authenticated users can read nodes" ON public.nodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read edges" ON public.edges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read valves_pumps" ON public.valves_pumps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read sensors" ON public.sensors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read agents" ON public.agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read energy_prices" ON public.energy_prices FOR SELECT TO authenticated USING (true);

-- Operators can acknowledge events
CREATE POLICY "Operators can update events" ON public.events FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Engineers can modify network assets
CREATE POLICY "Engineers can update edges" ON public.edges FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'engineer') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'engineer') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Engineers can update valves_pumps" ON public.valves_pumps FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'engineer') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'engineer') OR public.has_role(auth.uid(), 'admin'));

-- Admins have full access
CREATE POLICY "Admins can manage user_roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profile policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create trigger function for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger functions for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_nodes_updated_at BEFORE UPDATE ON public.nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_edges_updated_at BEFORE UPDATE ON public.edges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_valves_pumps_updated_at BEFORE UPDATE ON public.valves_pumps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sensors_updated_at BEFORE UPDATE ON public.sensors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.edges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;