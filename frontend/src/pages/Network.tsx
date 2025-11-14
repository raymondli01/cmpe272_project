import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import NetworkMap from '@/components/NetworkMap';

interface Node {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  pressure: number | null;
}

interface Edge {
  id: string;
  name: string;
  status: string;
  from_node_id: string;
  to_node_id: string;
  active_incident_count?: number;
  highest_priority_incident?: any;
}

const Network = () => {
  const [center] = useState<[number, number]>([37.3365, -121.8815]);
  const [isolatedEdges, setIsolatedEdges] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);

  // Fetch network topology with incident status from backend API
  const { data: topology } = useQuery({
    queryKey: ['network-topology'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/network/topology');
      const data = await response.json();
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const nodes = topology?.nodes as Node[] || [];
  const edges = topology?.edges as Edge[] || [];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const channel = supabase
      .channel('network-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'edges',
        },
        (payload) => {
          console.log('Edge updated:', payload);
          if (payload.new.status === 'isolated') {
            setIsolatedEdges(prev => new Set(prev).add(payload.new.id));
            toast.warning(`Pipe ${payload.new.name} has been isolated`, {
              description: 'Autonomous isolation action triggered by AI agent',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMounted]);

  const getNodePosition = (nodeId: string): [number, number] | null => {
    const node = nodes?.find(n => n.id === nodeId);
    return node ? [node.x, node.y] : null;
  };

  const getEdgeColor = (edge: Edge) => {
    // Check for manual isolation first
    if (edge.status === 'isolated' || isolatedEdges.has(edge.id)) return '#ef4444';
    if (edge.status === 'closed') return '#6b7280';

    // Color based on incident severity (from API)
    const edgeData = edge as any; // Has additional fields from topology API
    if (edgeData.status === 'critical') return '#dc2626'; // Red - critical incident
    if (edgeData.status === 'high') return '#ea580c'; // Orange - high severity
    if (edgeData.status === 'medium') return '#ca8a04'; // Yellow - medium severity
    if (edgeData.status === 'low') return '#65a30d'; // Light green - low severity

    return '#0ea5e9'; // Blue - normal (no incidents)
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Network Twin</h1>
        <p className="text-muted-foreground">SJSU-West District - Digital Twin Visualization</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Network Map</CardTitle>
          <CardDescription>
            Real-time visualization with autonomous isolation monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border border-border" style={{ height: '600px' }}>
            {isMounted && (
              <NetworkMap
                center={center}
                nodes={nodes}
                edges={edges}
                isolatedEdges={isolatedEdges}
                getNodePosition={getNodePosition}
                getEdgeColor={getEdgeColor}
              />
            )}
            {!isMounted && (
              <div className="h-full w-full flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipe Status Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#0ea5e9]" />
              <span className="text-sm">Normal (No Incidents)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#dc2626]" />
              <span className="text-sm">Critical Incident</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#ea580c]" />
              <span className="text-sm">High Severity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#ca8a04]" />
              <span className="text-sm">Medium Severity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#65a30d]" />
              <span className="text-sm">Low Severity</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Network Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Nodes:</span>
              <span className="font-medium">{nodes?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Pipes:</span>
              <span className="font-medium">{edges?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active Incidents:</span>
              <span className="font-medium text-destructive">
                {topology?.incident_summary?.total_active_incidents || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pipes Affected:</span>
              <span className="font-medium text-orange-600">
                {topology?.incident_summary?.edges_with_active_incidents || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge variant="default" className="w-full justify-center">
              Real-time Updates Active
            </Badge>
            <p className="text-xs text-muted-foreground text-center">
              Autonomous visual isolation enabled
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Network;
