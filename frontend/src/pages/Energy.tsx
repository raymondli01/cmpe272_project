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

  const applySchedule = () => {
    toast.success('Off-peak schedule applied', {
      description: 'Pump operations optimized for energy savings. Projected savings: $142.50/day',
    });
  };

  const totalSavings = 142.50;
  const efficiencyGain = 18.5;

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
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 rounded-lg bg-success/10 border border-success/20">
              <div>
                <p className="font-medium">Off-Peak Filling (00:00 - 06:00)</p>
                <p className="text-sm text-muted-foreground">Tank T1 to 90% capacity</p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50 border border-border">
              <div>
                <p className="font-medium">Maintenance Window (06:00 - 07:00)</p>
                <p className="text-sm text-muted-foreground">Minimal pumping</p>
              </div>
              <Badge variant="secondary">Scheduled</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div>
                <p className="font-medium">Peak Demand (17:00 - 21:00)</p>
                <p className="text-sm text-muted-foreground">Tank discharge mode</p>
              </div>
              <Badge variant="secondary">Scheduled</Badge>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-success/10 border border-success/20">
              <div>
                <p className="font-medium">Night Cycle (22:00 - 24:00)</p>
                <p className="text-sm text-muted-foreground">Top-up refill</p>
              </div>
              <Badge variant="default">Scheduled</Badge>
            </div>
          </div>

          <Button className="w-full gap-2" onClick={applySchedule}>
            <Zap className="w-4 h-4" />
            Apply Optimized Schedule
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Energy;
