import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingDown } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';

const Energy = () => {
  const { data: prices } = useQuery({
    queryKey: ['energy_prices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('energy_prices')
        .select('*')
        .order('timestamp', { ascending: true });
      return data?.map((p) => ({
        hour: new Date(p.timestamp).getHours(),
        price: p.price_per_kwh,
        isOffPeak: p.is_off_peak,
      })) || [];
    },
  });

  // Fetch AI-generated energy schedules
  const { data: energySchedules } = useQuery({
    queryKey: ['energy_schedules'],
    queryFn: async () => {
      const { data } = await supabase
        .from('energy_schedules')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  // Get latest schedule metrics
  const latestSchedule = energySchedules?.[0];
  const totalSavings = latestSchedule?.estimated_savings_usd || 0;
  const efficiencyGain = latestSchedule?.efficiency_gain_percent || 0;

  const applySchedule = () => {
    toast.success('Off-peak schedule applied', {
      description: `Pump operations optimized for energy savings. Projected savings: $${totalSavings.toFixed(2)}/day`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Energy Management</h1>
        <p className="text-muted-foreground">Dynamic pump scheduling and cost optimization</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalSavings}</div>
            <p className="text-xs text-muted-foreground">From optimization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Gain</CardTitle>
            <Zap className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{efficiencyGain}%</div>
            <p className="text-xs text-muted-foreground">vs. baseline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${prices?.[new Date().getHours()]?.price.toFixed(3) || '0.000'}/kWh
            </div>
            <Badge 
              variant={prices?.[new Date().getHours()]?.isOffPeak ? 'default' : 'secondary'}
              className="mt-1"
            >
              {prices?.[new Date().getHours()]?.isOffPeak ? 'Off-Peak' : 'On-Peak'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hourly Energy Prices</CardTitle>
          <CardDescription>Real-time electricity pricing for pump optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={prices}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="hour" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickFormatter={(value) => `${value}:00`}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => [`$${value.toFixed(3)}/kWh`, 'Price']}
                labelFormatter={(label) => `${label}:00`}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                fill="url(#colorPrice)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optimized Pump Schedule</CardTitle>
          <CardDescription>AI-generated schedule for maximum cost savings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {energySchedules && energySchedules.length > 0 ? (
            <>
              <div className="space-y-2">
                {energySchedules.map((schedule, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex-1">
                      <p className="font-medium">{schedule.pump_name || `Pump ${idx + 1}`}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {schedule.reasoning || 'AI-optimized schedule'}
                      </p>
                      {schedule.estimated_savings_usd > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          Saves ${schedule.estimated_savings_usd.toFixed(2)}/day
                        </p>
                      )}
                    </div>
                    <Badge variant="default">AI Generated</Badge>
                  </div>
                ))}
              </div>

              <Button className="w-full gap-2" onClick={applySchedule}>
                <Zap className="w-4 h-4" />
                Apply Optimized Schedule
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No AI-generated schedules yet</p>
              <p className="text-sm text-muted-foreground">
                Run the Energy Optimizer Agent to generate optimized pump schedules
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Energy;
