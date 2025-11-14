import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Brain, TrendingUp, Droplets, Gauge, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const Incidents = () => {
  const queryClient = useQueryClient();
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [showResolvedIncidents, setShowResolvedIncidents] = useState(false);

  // Fetch edges for name lookup
  const { data: edges } = useQuery({
    queryKey: ['edges'],
    queryFn: async () => {
      const { data } = await supabase
        .from('edges')
        .select('id, name');
      return data || [];
    },
  });

  // Create edge name lookup map
  const edgeNameMap = new Map(edges?.map(edge => [edge.id, edge.name]) || []);

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('events')
        .select('*')
        .order('priority', { ascending: false })  // Sort by priority (high to low)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, state }: { id: string; state: 'open' | 'acknowledged' | 'resolved' }) => {
      const { data, error } = await supabase
        .from('events')
        .update({ state })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event status updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update event: ${error.message}`);
    },
  });

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return 'text-red-600';
    if (priority >= 60) return 'text-orange-600';
    if (priority >= 40) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 80) return 'Critical Priority';
    if (priority >= 60) return 'High Priority';
    if (priority >= 40) return 'Medium Priority';
    return 'Low Priority';
  };

  // Separate active and resolved incidents
  const activeIncidents = events?.filter((event: any) => event.state !== 'resolved') || [];
  const resolvedIncidents = events?.filter((event: any) => event.state === 'resolved') || [];

  const renderIncidentCard = (event: any) => {
    const isAIDetected = !!event.detected_by;
    const metadata = event.metadata || {};
    const isExpanded = expandedIncident === event.id;

    // Extract pipe name - priority: metadata.edge_name > edge lookup via asset_ref > Unknown
    let pipeName = metadata.edge_name;
    if (!pipeName && event.asset_ref && event.asset_type === 'edge') {
      pipeName = edgeNameMap.get(event.asset_ref) || event.asset_ref?.substring(0, 8);
    }
    if (!pipeName) {
      pipeName = 'Unknown';
    }

    return (
      <Card key={event.id} className={isAIDetected ? 'border-l-4 border-l-primary' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{event.title}</CardTitle>
                {isAIDetected && (
                  <Badge variant="default" className="gap-1">
                    <Brain className="w-3 h-3" />
                    AI Detected
                  </Badge>
                )}
                {pipeName && pipeName !== 'Unknown' && (
                  <Badge variant="outline" className="gap-1 font-mono">
                    📍 {pipeName}
                  </Badge>
                )}
              </div>
              <CardDescription>{event.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {event.priority !== null && event.priority !== undefined && (
                <Badge variant="outline" className={getPriorityColor(event.priority)}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {event.priority}
                </Badge>
              )}
              <Badge
                variant={
                  event.severity === 'critical' || event.severity === 'high'
                    ? 'destructive'
                    : 'default'
                }
              >
                {event.severity}
              </Badge>
              <Badge
                variant={
                  event.state === 'resolved'
                    ? 'default'
                    : event.state === 'acknowledged'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {event.state}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* AI Explainability Panel */}
            {isAIDetected && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Detection Details
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedIncident(isExpanded ? null : event.id)}
                  >
                    {isExpanded ? 'Hide Details' : 'Show Details'}
                  </Button>
                </div>

                {/* Confidence Score */}
                {event.confidence && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Confidence:</span>
                    <Badge variant="secondary">{Math.round(event.confidence * 100)}%</Badge>
                  </div>
                )}

                {/* Priority Level */}
                {event.priority && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Priority Level:</span>
                    <span className={`text-sm font-bold ${getPriorityColor(event.priority)}`}>
                      {getPriorityLabel(event.priority)}
                    </span>
                  </div>
                )}

                {isExpanded && (
                  <div className="space-y-3 pt-2 border-t border-primary/20">
                    {/* Sensor Indicators */}
                    {metadata.sensor_indicators && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold">Sensor Indicators:</h5>
                        <div className="grid grid-cols-3 gap-2">
                          {metadata.sensor_indicators.acoustic && (
                            <div className="flex items-center gap-2 text-sm">
                              <Droplets className="w-4 h-4 text-blue-500" />
                              <div>
                                <p className="font-medium">Acoustic</p>
                                <p className="text-xs text-muted-foreground">
                                  {metadata.sensor_indicators.acoustic}
                                </p>
                              </div>
                            </div>
                          )}
                          {metadata.sensor_indicators.pressure && (
                            <div className="flex items-center gap-2 text-sm">
                              <Gauge className="w-4 h-4 text-orange-500" />
                              <div>
                                <p className="font-medium">Pressure</p>
                                <p className="text-xs text-muted-foreground">
                                  {metadata.sensor_indicators.pressure}
                                </p>
                              </div>
                            </div>
                          )}
                          {metadata.sensor_indicators.flow && (
                            <div className="flex items-center gap-2 text-sm">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <div>
                                <p className="font-medium">Flow</p>
                                <p className="text-xs text-muted-foreground">
                                  {metadata.sensor_indicators.flow}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI Reasoning */}
                    {metadata.reasoning && (
                      <div className="space-y-1">
                        <h5 className="text-sm font-semibold">AI Reasoning:</h5>
                        <p className="text-sm text-muted-foreground">{metadata.reasoning}</p>
                      </div>
                    )}

                    {/* Recommendations */}
                    {metadata.recommendation && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          Recommended Actions:
                        </h5>
                        <div className="space-y-1 text-sm">
                          {metadata.recommendation.action && (
                            <p>
                              <span className="font-medium">Action:</span>{' '}
                              {metadata.recommendation.action}
                            </p>
                          )}
                          {metadata.recommendation.valves_to_close && (
                            <p>
                              <span className="font-medium">Valves to close:</span>{' '}
                              {metadata.recommendation.valves_to_close.join(', ')}
                            </p>
                          )}
                          {metadata.recommendation.dispatch_crew && (
                            <p className="text-orange-600 font-medium">
                              ⚠️ Dispatch maintenance crew immediately
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Detected By */}
                    {event.detected_by && (
                      <p className="text-xs text-muted-foreground">
                        Detected by: {event.detected_by}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Timeline</p>
              <div className="space-y-2 pl-4 border-l-2 border-border">
                {Array.isArray(event.timeline) && event.timeline.map((item: any, idx: number) => (
                  <div key={idx} className="text-sm">
                    <p className="font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.actor} • {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {event.state === 'open' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateEventMutation.mutate({ id: event.id, state: 'acknowledged' })
                  }
                  disabled={updateEventMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Acknowledge
                </Button>
              </div>
            )}

            {event.state === 'acknowledged' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() =>
                    updateEventMutation.mutate({ id: event.id, state: 'resolved' })
                  }
                  disabled={updateEventMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Created: {new Date(event.created_at).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
        <p className="text-muted-foreground">System events and alerts management</p>
      </div>

      {/* Active Incidents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Active Incidents</h2>
          <Badge variant="outline">{activeIncidents.length} active</Badge>
        </div>

        {activeIncidents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No active incidents. All systems operating normally.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeIncidents.map((event: any) => renderIncidentCard(event))}
          </div>
        )}
      </div>

      {/* Resolved Incidents Section */}
      {resolvedIncidents.length > 0 && (
        <div className="space-y-4">
          <Card className="border-dashed">
            <CardHeader
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setShowResolvedIncidents(!showResolvedIncidents)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {showResolvedIncidents ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle className="text-lg">Resolved Incidents</CardTitle>
                    <CardDescription>
                      View history of {resolvedIncidents.length} resolved incident{resolvedIncidents.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">{resolvedIncidents.length} resolved</Badge>
              </div>
            </CardHeader>

            {showResolvedIncidents && (
              <CardContent className="pt-0">
                <div className="grid gap-4">
                  {resolvedIncidents.map((event: any) => renderIncidentCard(event))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Incidents;
