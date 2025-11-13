import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Play } from 'lucide-react';
import { toast } from 'sonner';

const Agents = () => {
  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await supabase.from('agents').select('*');
      return data || [];
    },
  });

  const runSimulation = (agentName: string) => {
    toast.success(`Running simulation for ${agentName}`, {
      description: 'Analyzing current network state and generating recommendations...',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
        <p className="text-muted-foreground">Multi-agent decision system management</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents?.map((agent) => (
          <Card key={agent.id} className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <Badge variant={agent.status === 'enabled' ? 'default' : 'secondary'}>
                  {agent.status}
                </Badge>
              </div>
              <CardTitle className="mt-4">{agent.name}</CardTitle>
              <CardDescription className="capitalize">{agent.role.replace('-', ' ')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-medium">{((agent.confidence || 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(agent.confidence || 0) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Last Decision:</p>
                <p className="text-sm text-muted-foreground">{agent.last_decision}</p>
              </div>

              {agent.metrics && typeof agent.metrics === 'object' && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-sm font-medium">Metrics:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(agent.metrics as Record<string, any>).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="text-xs text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => runSimulation(agent.name)}
              >
                <Play className="w-4 h-4" />
                Run Simulation
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Agents;
