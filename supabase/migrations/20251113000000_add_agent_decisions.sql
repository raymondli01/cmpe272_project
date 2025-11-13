-- Create table for agent decisions and audit log
CREATE TABLE IF NOT EXISTS agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  decision_type TEXT NOT NULL, -- 'leak_detection', 'isolation_sequence', 'energy_optimization'
  input_data JSONB NOT NULL, -- Sensor data and context used for decision
  reasoning TEXT NOT NULL, -- AI-generated explanation
  recommendation JSONB NOT NULL, -- The actual recommendation/action
  confidence FLOAT NOT NULL, -- 0.0 to 1.0
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'executed', 'rejected'
  executed_at TIMESTAMP WITH TIME ZONE,
  executed_by UUID REFERENCES profiles(id),
  result JSONB, -- Outcome of the decision if executed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_agent_decisions_agent_id ON agent_decisions(agent_id);
CREATE INDEX idx_agent_decisions_status ON agent_decisions(status);
CREATE INDEX idx_agent_decisions_created_at ON agent_decisions(created_at DESC);

-- Enable RLS
ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all decisions
CREATE POLICY "Allow authenticated users to read agent decisions"
  ON agent_decisions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role to manage agent decisions"
  ON agent_decisions
  FOR ALL
  TO service_role
  USING (true);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_agent_decision_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_agent_decisions_updated_at
BEFORE UPDATE ON agent_decisions
FOR EACH ROW
EXECUTE FUNCTION update_agent_decision_timestamp();

-- Enable realtime for agent decisions
ALTER PUBLICATION supabase_realtime ADD TABLE agent_decisions;
