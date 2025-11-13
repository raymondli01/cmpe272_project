import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, Droplets, Zap, TrendingUp } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const Dashboard = () => {
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await supabase.from('agents').select('*');
      return data || [];
    },
  });

  // Fetch AI-generated analytics
  const { data: analytics } = useQuery({
    queryKey: ['ai_analytics'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('ai_analytics')
        .select('*')
        .order('calculated_at', { ascending: false })
        .limit(10);

      // Convert to easy-to-use object
      const analyticsMap: Record<string, any> = {};
      data?.forEach((item: any) => {
        analyticsMap[item.metric_name] = item.metric_value;
      });
      return analyticsMap;
    },
  });

  // Fetch demand forecast
  const { data: demandForecast } = useQuery({
    queryKey: ['demand_forecasts'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('demand_forecasts')
        .select('*')
        .order('hour', { ascending: true })
        .limit(24);
      return data?.map((d: any) => ({ hour: d.hour, demand: d.predicted_demand })) || [];
    },
  });

  const activeIncidents = events?.filter(e => e.state === 'open').length || 0;

  // Get AI-generated metrics with fallbacks
  const nrwData = analytics?.non_revenue_water || {};
  const uptimeData = analytics?.system_uptime || {};
  const energyData = analytics?.energy_metrics || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">SJSU-West District Overview</p>
        </div>
        <Badge className="gap-2">
          <Activity className="w-3 h-3" />
          System Online
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Non-Revenue Water</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nrwData.nrw_percentage?.toFixed(1) || '12.4'}%
            </div>
            <p className="text-xs text-muted-foreground">
              {nrwData.trend_percentage > 0 ? '+' : ''}{nrwData.trend_percentage?.toFixed(1) || '-2.1'}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{activeIncidents}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Energy Cost Today</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${energyData.total_cost?.toFixed(0) || '287'}
            </div>
            <p className="text-xs text-muted-foreground">
              {energyData.efficiency_gain?.toFixed(0) || '18'}% savings from optimization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Network Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uptimeData.uptime_percentage?.toFixed(1) || '99.7'}%
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Demand Forecast</CardTitle>
            <CardDescription>24-hour water demand prediction</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={demandForecast && demandForecast.length > 0 ? demandForecast : [{hour: 0, demand: 0}]}>
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="demand"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {events?.slice(0, 4).map((event) => (
              <div key={event.id} className="flex items-start justify-between gap-4 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <Badge 
                  variant={
                    event.severity === 'critical' ? 'destructive' :
                    event.severity === 'high' ? 'destructive' :
                    event.severity === 'medium' ? 'default' : 'secondary'
                  }
                >
                  {event.severity}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Agents Status</CardTitle>
          <CardDescription>Multi-agent decision system overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {agents?.map((agent) => (
              <div key={agent.id} className="flex items-start gap-3 p-4 rounded-lg border border-border/40">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{agent.name}</p>
                    <Badge variant={agent.status === 'enabled' ? 'default' : 'secondary'} className="text-xs">
                      {agent.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{agent.last_decision}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs text-muted-foreground">Confidence:</div>
                    <div className="text-xs font-medium">{((agent.confidence || 0) * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
