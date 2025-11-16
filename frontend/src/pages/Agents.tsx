import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Play, Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AgentResult {
  status: string;
  [key: string]: any;
}

const Agents = () => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await supabase.from('agents').select('*');
      return data || [];
    },
  });

  const runAgentMutation = useMutation({
    mutationFn: async ({ agentName, agentId }: { agentName: string; agentId: string }) => {
      setRunningAgentId(agentId);

      // Map agent names/roles to API endpoints - more flexible matching
      let endpoint = '/ai/analyze'; // default fallback

      const nameLower = agentName.toLowerCase();
      if (nameLower.includes('leak')) {
        endpoint = '/ai/leak-detection';
      } else if (nameLower.includes('energy') || nameLower.includes('optimizer')) {
        endpoint = '/ai/energy-optimization';
      } else if (nameLower.includes('safety')) {
        endpoint = '/ai/safety-monitoring';
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to run agent');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      setAgentResult(data);
      setSelectedAgent(variables.agentName);
      setIsDialogOpen(true);
      setRunningAgentId(null);
      toast.success(`${variables.agentName} completed analysis`, {
        description: 'View results in the dialog',
      });
    },
    onError: (error, variables) => {
      setRunningAgentId(null);
      toast.error(`Failed to run ${variables.agentName}`, {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const runSimulation = (agentName: string, agentId: string) => {
    runAgentMutation.mutate({ agentName, agentId });
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
                onClick={() => runSimulation(agent.name, agent.id)}
                disabled={runningAgentId === agent.id}
              >
                {runningAgentId === agent.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              {selectedAgent} Results
            </DialogTitle>
            <DialogDescription>
              AI-generated analysis with reasoning and recommendations
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
            <div className="space-y-6 pb-4">
              {/* Status Alert */}
              {agentResult?.status && (
                <Alert variant={agentResult.status === 'success' ? 'default' : 'destructive'}>
                  {agentResult.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {agentResult.status === 'success' ? 'Analysis Complete' : 'Analysis Failed'}
                  </AlertTitle>
                  <AlertDescription>
                    {agentResult.error || `Status: ${agentResult.status}`}
                  </AlertDescription>
                </Alert>
              )}

              {/* Leak Detection Results (direct response) */}
              {agentResult?.leaks_detected && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Leaks Detected ({agentResult.leaks_detected.length})</h3>
                  {agentResult.leaks_detected.length === 0 ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertTitle>No Leaks Detected</AlertTitle>
                      <AlertDescription>All pipes are operating normally</AlertDescription>
                    </Alert>
                  ) : (
                    agentResult.leaks_detected.map((leak: any, idx: number) => (
                      <Card key={idx} className="border-orange-200">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-mono">Pipe: {leak.edge_name || leak.edge_id}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant={leak.urgency === 'immediate' ? 'destructive' : 'secondary'}>
                                {leak.urgency}
                              </Badge>
                              <Badge>{(leak.confidence * 100).toFixed(0)}% confidence</Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-1">Reasoning:</p>
                            <p className="text-sm text-muted-foreground">{leak.reasoning}</p>
                          </div>
                          {leak.recommendation && (
                            <div>
                              <p className="text-sm font-medium mb-1">Recommendation:</p>
                              <p className="text-sm text-muted-foreground">
                                Action: {leak.recommendation.action}
                                {leak.recommendation.valves_to_close && (
                                  <> - Close valves: {leak.recommendation.valves_to_close.join(', ')}</>
                                )}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Safety Monitoring Results */}
              {agentResult?.safety_status && (
                <div className="space-y-4">
                  <Alert variant={agentResult.safety_status === 'CRITICAL' ? 'destructive' : 'default'}>
                    {agentResult.safety_status === 'SAFE' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle>Safety Status: {agentResult.safety_status}</AlertTitle>
                    <AlertDescription>{agentResult.overall_assessment}</AlertDescription>
                  </Alert>

                  {agentResult.issues && agentResult.issues.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Safety Issues ({agentResult.issues.length})</h3>
                      {agentResult.issues.map((issue: any, idx: number) => (
                        <Card key={idx} className="mb-3">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{issue.category}</CardTitle>
                              <Badge variant={issue.severity === 'CRITICAL' ? 'destructive' : 'secondary'}>
                                {issue.severity}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p className="text-sm text-muted-foreground">{issue.reasoning}</p>
                            {issue.immediate_actions && (
                              <div>
                                <p className="text-sm font-medium">Immediate Actions:</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                  {issue.immediate_actions.map((action: string, i: number) => (
                                    <li key={i}>{action}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Energy Optimization Results */}
              {agentResult?.optimizations && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Energy Optimization</h3>
                    {agentResult.total_estimated_savings !== undefined && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        💰 Save ${agentResult.total_estimated_savings.toFixed(2)}/day
                      </Badge>
                    )}
                  </div>

                  {agentResult.overall_strategy && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-900">Optimization Strategy</AlertTitle>
                      <AlertDescription className="text-blue-800">
                        {agentResult.overall_strategy}
                      </AlertDescription>
                    </Alert>
                  )}

                  {agentResult.optimizations.length === 0 ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>No Optimizations Needed</AlertTitle>
                      <AlertDescription>
                        Current pump schedule is already optimal for energy costs
                      </AlertDescription>
                    </Alert>
                  ) : (
                    agentResult.optimizations.map((opt: any, idx: number) => (
                      <Card key={idx} className="border-green-200">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{opt.pump_name}</CardTitle>
                            {opt.estimated_daily_savings_usd && (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                ${opt.estimated_daily_savings_usd.toFixed(2)}/day
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {opt.reasoning && (
                            <div>
                              <p className="text-sm font-medium mb-1">Reasoning:</p>
                              <p className="text-sm text-muted-foreground">{opt.reasoning}</p>
                            </div>
                          )}
                          {opt.schedule && opt.schedule.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">24-Hour Schedule:</p>
                              <div className="grid grid-cols-6 gap-2">
                                {opt.schedule.slice(0, 24).map((s: any, i: number) => (
                                  <div
                                    key={i}
                                    className={`p-2 rounded text-center text-xs ${
                                      s.status === 'on'
                                        ? 'bg-green-100 text-green-800 border border-green-300'
                                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                                    }`}
                                  >
                                    <div className="font-bold">{s.hour}h</div>
                                    <div className="text-[10px]">{s.status?.toUpperCase()}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Summary Stats */}
              {agentResult && (
                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold text-sm mb-3 text-muted-foreground">Analysis Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Sensor counts from safety monitoring */}
                    {agentResult.sensor_counts && (
                      <>
                        {agentResult.sensor_counts.pressure && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Pressure Sensors</p>
                            <p className="text-2xl font-bold">{agentResult.sensor_counts.pressure}</p>
                          </div>
                        )}
                        {agentResult.sensor_counts.flow && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Flow Sensors</p>
                            <p className="text-2xl font-bold">{agentResult.sensor_counts.flow}</p>
                          </div>
                        )}
                        {agentResult.sensor_counts.acoustic && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Acoustic Sensors</p>
                            <p className="text-2xl font-bold">{agentResult.sensor_counts.acoustic}</p>
                          </div>
                        )}
                      </>
                    )}
                    {agentResult.sensor_count && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Sensors Analyzed</p>
                        <p className="text-2xl font-bold">{agentResult.sensor_count}</p>
                      </div>
                    )}
                    {agentResult.pipes_analyzed && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Pipes Analyzed</p>
                        <p className="text-2xl font-bold">{agentResult.pipes_analyzed}</p>
                      </div>
                    )}
                    {agentResult.total_estimated_savings !== undefined && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Est. Daily Savings</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${agentResult.total_estimated_savings.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {agentResult.confidence_threshold && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Confidence Threshold</p>
                        <p className="text-2xl font-bold">
                          {(agentResult.confidence_threshold * 100).toFixed(0)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agents;
