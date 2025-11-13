import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

const Incidents = () => {
  const queryClient = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
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
    onError: (error) => {
      toast.error(`Failed to update event: ${error.message}`);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
        <p className="text-muted-foreground">System events and alerts management</p>
      </div>

      <div className="grid gap-4">
        {events?.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription>{event.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
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
        ))}
      </div>
    </div>
  );
};

export default Incidents;
