import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Circle, Polyline, Popup } from 'react-leaflet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';

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
}

const Network = () => {
  const [center] = useState<[number, number]>([37.3365, -121.8815]);
  const [isolatedEdges, setIsolatedEdges] = useState<Set<string>>(new Set());

  const { data: nodes } = useQuery({
    queryKey: ['nodes'],
    queryFn: async () => {
      const { data } = await supabase.from('nodes').select('*');
      return data as Node[] || [];
    },
  });

  const { data: edges } = useQuery({
    queryKey: ['edges'],
    queryFn: async () => {
      const { data } = await supabase
        .from('edges')
        .select('*');
      return data as Edge[] || [];
    },
  });

  useEffect(() => {
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
  }, []);

  const getNodePosition = (nodeId: string): [number, number] | null => {
    const node = nodes?.find(n => n.id === nodeId);
    return node ? [node.x, node.y] : null;
  };

  const getEdgeColor = (edge: Edge) => {
    if (edge.status === 'isolated' || isolatedEdges.has(edge.id)) return '#ef4444';
    if (edge.status === 'closed') return '#6b7280';
    return '#0ea5e9';
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
            <MapContainer
              center={center}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {nodes?.map((node) => (
                <Circle
                  key={node.id}
                  center={[node.x, node.y]}
                  radius={20}
                  pathOptions={{
                    fillColor: node.type === 'tank' ? '#22c55e' : 
                               node.type === 'reservoir' ? '#0ea5e9' : '#f59e0b',
                    fillOpacity: 0.8,
                    color: '#fff',
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-semibold">{node.name}</p>
                      <Badge variant="outline" className="mt-1">{node.type}</Badge>
                      {node.pressure && (
                        <p className="text-sm mt-2">
                          Pressure: {node.pressure.toFixed(1)} psi
                        </p>
                      )}
                    </div>
                  </Popup>
                </Circle>
              ))}

              {edges?.map((edge) => {
                const from = getNodePosition(edge.from_node_id);
                const to = getNodePosition(edge.to_node_id);
                if (!from || !to) return null;

                return (
                  <Polyline
                    key={edge.id}
                    positions={[from, to]}
                    pathOptions={{
                      color: getEdgeColor(edge),
                      weight: 4,
                      opacity: 0.8,
                      dashArray: edge.status === 'isolated' ? '10, 10' : undefined,
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold">{edge.name}</p>
                        <Badge 
                          variant={edge.status === 'isolated' ? 'destructive' : 'default'}
                          className="mt-1"
                        >
                          {edge.status}
                        </Badge>
                      </div>
                    </Popup>
                  </Polyline>
                );
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#0ea5e9]" />
              <span className="text-sm">Open Pipe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#ef4444]" />
              <span className="text-sm">Isolated Pipe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#f59e0b]" />
              <span className="text-sm">Junction</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#22c55e]" />
              <span className="text-sm">Tank</span>
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
              <span className="text-muted-foreground">Isolated:</span>
              <span className="font-medium text-destructive">
                {edges?.filter(e => e.status === 'isolated').length || 0}
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
