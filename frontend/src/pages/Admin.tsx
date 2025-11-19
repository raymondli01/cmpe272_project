import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Users, Settings, Trash2, Plus, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

interface SystemConfig {
  id: string;
  config_key: string;
  config_value: any;
  description: string;
  category: string;
  updated_at?: string;
  updated_by?: string | null;
}

interface ValvePump {
  id: string;
  name: string;
  kind: 'valve' | 'pump';
  status: 'open' | 'closed' | 'isolated';
  setpoint: number | null;
  edge_id: string;
}

interface EngineerOverview {
  totalEdges: number;
  isolatedEdges: number;
  totalSensors: number;
  sensorTypes: Record<string, number>;
  openIncidents: number;
  criticalIncidents: number;
}

const permissionCatalog = [
  {
    key: 'manage_users',
    label: 'Manage Users',
    description: 'Create, edit, and remove operator accounts',
  },
  {
    key: 'configure_system',
    label: 'Configure System',
    description: 'Adjust alert thresholds, agent settings, and automations',
  },
  {
    key: 'manage_network',
    label: 'Manage Network',
    description: 'Edit network twin assets (edges, valves, pumps)',
  },
  {
    key: 'manage_incidents',
    label: 'Manage Incidents',
    description: 'Acknowledge, resolve, and document incidents',
  },
  {
    key: 'view_dashboard',
    label: 'View Dashboard',
    description: 'Access real-time KPIs and analytics',
  },
  {
    key: 'view_ai_recommendations',
    label: 'AI Recommendations',
    description: 'View and act on AI-generated insights',
  },
] as const;

const permissionConfigKeys: Record<'admin' | 'engineer' | 'operator', string> = {
  admin: 'permissions_admin',
  engineer: 'permissions_engineer',
  operator: 'permissions_operator',
};

const defaultRolePermissions: Record<'admin' | 'engineer' | 'operator', string[]> = {
  admin: ['manage_users', 'configure_system', 'manage_network', 'view_dashboard', 'manage_incidents', 'view_ai_recommendations'],
  engineer: ['manage_network', 'view_dashboard', 'manage_incidents', 'view_ai_recommendations'],
  operator: ['view_dashboard', 'manage_incidents', 'view_ai_recommendations'],
};

const Admin = () => {
  const { role, user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = role === 'admin';
  const isEngineer = role === 'engineer';
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'engineer' | 'operator'>('operator');
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [rolePermissions, setRolePermissions] = useState<Record<'admin' | 'engineer' | 'operator', Set<string>> | null>(null);
  const [setpointDrafts, setSetpointDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAdmin && !isEngineer) {
      navigate('/dashboard');
    }
  }, [isAdmin, isEngineer, navigate]);

  // Fetch all users with their roles
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      if (rolesError) throw rolesError;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

      const usersWithRoles = new Map(
        userRoles?.map((ur: any) => {
          const profile = profileMap.get(ur.user_id);
          return [
            ur.user_id,
            {
              id: ur.user_id,
              email: `user-${ur.user_id.substring(0, 8)}@system.local`,
              display_name: profile?.display_name || null,
              role: ur.role,
              created_at: profile?.created_at || ur.created_at,
            } as UserWithRole,
          ];
        }) || []
      );

      profiles?.forEach((profile: any) => {
        if (!usersWithRoles.has(profile.id)) {
          usersWithRoles.set(profile.id, {
            id: profile.id,
            email: `user-${profile.id.substring(0, 8)}@system.local`,
            display_name: profile.display_name || null,
            role: 'operator',
            created_at: profile.created_at,
          } as UserWithRole);
        }
      });

      return Array.from(usersWithRoles.values());
    },
    enabled: isAdmin,
  });

  // Fetch system configuration
  const { data: systemConfig, isLoading: configLoading } = useQuery<SystemConfig[]>({
    queryKey: ['system-config'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('system_config')
        .select('*')
        .order('category', { ascending: true })
        .order('config_key', { ascending: true });
      if (error) throw error;

      // Initialize config values state
      const values: Record<string, string> = {};
      data?.forEach((config: SystemConfig) => {
        if (Array.isArray(config.config_value) || typeof config.config_value === 'object') {
          values[config.config_key] = JSON.stringify(config.config_value);
        } else {
          values[config.config_key] = String(config.config_value);
        }
      });
      setConfigValues(values);

      return (data as SystemConfig[]) || [];
    },
    enabled: isAdmin || isEngineer,
  });

  const { data: engineerOverview, isLoading: engineerOverviewLoading } = useQuery<EngineerOverview>({
    queryKey: ['engineer-overview'],
    enabled: isEngineer,
    queryFn: async () => {
      const [edgesRes, sensorsRes, eventsRes] = await Promise.all([
        (supabase as any).from('edges').select('id,status'),
        (supabase as any).from('sensors').select('id,type'),
        (supabase as any).from('events').select('id,severity,state').eq('state', 'open'),
      ]);

      if (edgesRes.error) throw edgesRes.error;
      if (sensorsRes.error) throw sensorsRes.error;
      if (eventsRes.error) throw eventsRes.error;

      const edges = edgesRes.data || [];
      const sensors = sensorsRes.data || [];
      const events = eventsRes.data || [];

      const sensorTypes = sensors.reduce((acc: Record<string, number>, sensor: any) => {
        const type = sensor.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEdges: edges.length,
        isolatedEdges: edges.filter((edge: any) => edge.status === 'isolated').length,
        totalSensors: sensors.length,
        sensorTypes,
        openIncidents: events.length,
        criticalIncidents: events.filter((event: any) => event.severity === 'critical').length,
      };
    },
  });

  const { data: valves, isLoading: valvesLoading } = useQuery<ValvePump[]>({
    queryKey: ['engineer-valves'],
    enabled: isEngineer,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('valves_pumps')
        .select('id,name,kind,status,setpoint,edge_id')
        .order('kind', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole as any })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  // Delete user role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role removed');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove role: ${error.message}`);
    },
  });

  // Add user role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role: userRole }: { userId: string; role: string }) => {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: userRole as any })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: userRole as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role assigned successfully');
      setIsAddUserDialogOpen(false);
      setNewUserId('');
      setNewUserRole('operator');
    },
    onError: (error: any) => {
      toast.error(`Failed to assign role: ${error.message}`);
    },
  });

  // Update system config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await (supabase as any)
        .from('system_config')
        .update({ 
          config_value: value,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('config_key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      toast.success('Configuration updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update configuration: ${error.message}`);
    },
  });

  const updateValveMutation = useMutation({
    mutationFn: async ({ id, status, setpoint }: { id: string; status?: 'open' | 'closed' | 'isolated'; setpoint?: number | null }) => {
      const updates: Record<string, any> = {};
      if (status) updates.status = status;
      if (setpoint !== undefined) updates.setpoint = setpoint;
      if (Object.keys(updates).length === 0) {
        return;
      }
      const { error } = await (supabase as any)
        .from('valves_pumps')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engineer-valves'] });
      toast.success('Control update applied');
    },
    onError: (error: any) => {
      toast.error(`Failed to update control: ${error.message}`);
    },
  });

  const runAgentsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:8000/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to run coordinated agents');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Coordinated agent analysis started');
    },
    onError: (error: any) => {
      toast.error(`Failed to run agents: ${error.message}`);
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, newRole });
  };

  const handleDeleteRole = (userId: string) => {
    if (confirm('Are you sure you want to remove this user\'s role? They will default to operator.')) {
      deleteRoleMutation.mutate(userId);
    }
  };

  const handleAddUser = () => {
    if (!newUserId) {
      toast.error('Please enter a user ID');
      return;
    }
    addRoleMutation.mutate({ userId: newUserId, role: newUserRole });
  };

  const handleConfigChange = (key: string, value: string) => {
    setConfigValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = (key: string) => {
    const value = configValues[key];
    if (value !== undefined) {
      const config = systemConfig?.find((c) => c.config_key === key);
      let parsedValue: any = value;
      if (config) {
        if (typeof config.config_value === 'number') {
          parsedValue = Number(value);
        } else if (typeof config.config_value === 'boolean') {
          parsedValue = value === 'true';
        } else if (Array.isArray(config.config_value)) {
          try {
            parsedValue = JSON.parse(value);
          } catch {
            parsedValue = config.config_value;
          }
        }
      }
      updateConfigMutation.mutate({ key, value: parsedValue });
    }
  };

  const handleValveStatusChange = (id: string, newStatus: 'open' | 'closed' | 'isolated') => {
    updateValveMutation.mutate({ id, status: newStatus });
  };

  const handleSetpointChange = (id: string, value: string) => {
    setSetpointDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleSetpointSave = (id: string) => {
    const draft = setpointDrafts[id];
    if (draft === undefined) return;
    if (draft === '') {
      updateValveMutation.mutate({ id, setpoint: null });
      return;
    }
    const numericValue = parseFloat(draft);
    if (Number.isNaN(numericValue)) {
      toast.error('Enter a valid numeric setpoint');
      return;
    }
    updateValveMutation.mutate({ id, setpoint: numericValue });
  };

  const handleRunAgents = () => {
    runAgentsMutation.mutate();
  };

  // Role permissions derived from config
  useEffect(() => {
    if (!isAdmin || !systemConfig) return;

    const permissionsState: Record<'admin' | 'engineer' | 'operator', Set<string>> = {
      admin: new Set(defaultRolePermissions.admin),
      engineer: new Set(defaultRolePermissions.engineer),
      operator: new Set(defaultRolePermissions.operator),
    };

    (Object.keys(permissionConfigKeys) as Array<'admin' | 'engineer' | 'operator'>).forEach((roleKey) => {
      const configKey = permissionConfigKeys[roleKey];
      const config = systemConfig.find((c) => c.config_key === configKey);
      if (config && Array.isArray(config.config_value)) {
        permissionsState[roleKey] = new Set(config.config_value);
      }
    });

    setRolePermissions(permissionsState);
  }, [systemConfig, isAdmin]);

  useEffect(() => {
    if (!valves) return;
    setSetpointDrafts((prev) => {
      const next = { ...prev };
      valves.forEach((valve) => {
        if (next[valve.id] === undefined) {
          next[valve.id] = valve.setpoint !== null && valve.setpoint !== undefined ? String(valve.setpoint) : '';
        }
      });
      return next;
    });
  }, [valves]);

  const handlePermissionToggle = (roleKey: 'admin' | 'engineer' | 'operator', permissionKey: string, allowed: boolean) => {
    if (!rolePermissions || !isAdmin) return;
    setRolePermissions((prev) => {
      if (!prev) return prev;
      const updated = new Set(prev[roleKey]);
      if (allowed) {
        updated.add(permissionKey);
      } else {
        updated.delete(permissionKey);
      }
      const next = { ...prev, [roleKey]: updated };
      updateConfigMutation.mutate({
        key: permissionConfigKeys[roleKey],
        value: Array.from(updated),
      });
      return next;
    });
  };

  const thresholdConfigs = systemConfig?.filter((c: SystemConfig) => c.category === 'thresholds') || [];
  const agentConfigs = systemConfig?.filter((c: SystemConfig) => c.category === 'agent_settings') || [];

  if (isEngineer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Engineer Console</h1>
            <p className="text-muted-foreground">Network maintenance, automation, and tuning tools</p>
          </div>
          <Badge variant="secondary">Engineer</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Network Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {engineerOverviewLoading ? '—' : engineerOverview?.totalEdges ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                {engineerOverview?.isolatedEdges || 0} isolated segments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Active Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-warning">
                {engineerOverviewLoading ? '—' : engineerOverview?.openIncidents ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                {engineerOverview?.criticalIncidents || 0} critical priority
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Sensor Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {engineerOverviewLoading ? '—' : engineerOverview?.totalSensors ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                {Object.entries(engineerOverview?.sensorTypes || {})
                  .map(([type, count]) => `${count} ${type}`)
                  .join(' • ') || 'No sensors registered'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Automation Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {agentConfigs.find((c) => c.config_key === 'autonomous_mode')?.config_value === true ? 'Autonomous' : 'Manual'}
              </p>
              <p className="text-sm text-muted-foreground">
                Approval required: {agentConfigs.find((c) => c.config_key === 'approval_required')?.config_value === true ? 'Yes' : 'No'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Valve & Pump Control</CardTitle>
              <CardDescription>Adjust network actuators during maintenance or incidents</CardDescription>
            </CardHeader>
            <CardContent>
              {valvesLoading ? (
                <div className="text-sm text-muted-foreground">Loading controls...</div>
              ) : valves && valves.length > 0 ? (
                <div className="space-y-4">
                  {valves.map((valve) => (
                    <div key={valve.id} className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{valve.name}</p>
                          <p className="text-xs text-muted-foreground uppercase">{valve.kind}</p>
                        </div>
                        <Select
                          value={valve.status}
                          onValueChange={(value) => handleValveStatusChange(valve.id, value as 'open' | 'closed' | 'isolated')}
                          disabled={updateValveMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="isolated">Isolated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {valve.kind === 'pump' && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="1"
                            className="w-32"
                            value={setpointDrafts[valve.id] ?? ''}
                            onChange={(e) => handleSetpointChange(valve.id, e.target.value)}
                            placeholder="Setpoint"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSetpointSave(valve.id)}
                            disabled={updateValveMutation.isPending}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No valves or pumps found.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Threshold Reference</CardTitle>
              <CardDescription>Current leak detection and safety thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {thresholdConfigs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No thresholds configured. Run the latest migration to seed configuration values.
                </p>
              ) : (
                thresholdConfigs.map((config) => (
                  <div key={config.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{config.config_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                    <Badge variant="outline">{config.config_value}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Automation Tools</CardTitle>
              <CardDescription>Trigger coordinated AI analysis or jump to agent controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleRunAgents} disabled={runAgentsMutation.isPending}>
                {runAgentsMutation.isPending ? 'Running Analysis...' : 'Run Coordinated Agents'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/agents')}>
                View Agent Status
              </Button>
              <p className="text-sm text-muted-foreground">
                Use coordinated agents to validate the current network state before applying manual overrides.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sensor Coverage</CardTitle>
              <CardDescription>Breakdown by sensor type</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(engineerOverview?.sensorTypes || {}).length === 0 ? (
                <p className="text-sm text-muted-foreground">No sensor data available.</p>
              ) : (
                Object.entries(engineerOverview?.sensorTypes || {}).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="capitalize">
                    {type}: {count}
                  </Badge>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const roleCounts = useMemo(() => {
    const counts: Record<'admin' | 'engineer' | 'operator', number> = {
      admin: 0,
      engineer: 0,
      operator: 0,
    };
    users?.forEach((u) => {
      if (u.role === 'admin' || u.role === 'engineer' || u.role === 'operator') {
        counts[u.role] += 1;
      }
    });
    return counts;
  }, [users]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">System administration and configuration</p>
      </div>

      <Tabs defaultValue="access-control" className="space-y-4">
        <TabsList>
          <TabsTrigger value="access-control">
            <Shield className="w-4 h-4 mr-2" />
            Access Control
          </TabsTrigger>
          <TabsTrigger value="user-management">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="system-config">
            <Settings className="w-4 h-4 mr-2" />
            System Configuration
          </TabsTrigger>
        </TabsList>

        {/* Access Control Tab */}
        <TabsContent value="access-control" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {(['admin', 'engineer', 'operator'] as const).map((roleKey) => (
              <Card key={roleKey}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{roleKey}</span>
                    <Badge variant={roleKey === 'admin' ? 'destructive' : roleKey === 'engineer' ? 'secondary' : 'default'}>
                      {roleCounts[roleKey]} users
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Default capabilities for {roleKey}s
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  {roleKey === 'admin' && (
                    <>
                      <p>• Full system access</p>
                      <p>• Configure network and agents</p>
                      <p>• Manage all users and roles</p>
                    </>
                  )}
                  {roleKey === 'engineer' && (
                    <>
                      <p>• Manage network assets</p>
                      <p>• View system analytics</p>
                      <p>• Handle incidents</p>
                    </>
                  )}
                  {roleKey === 'operator' && (
                    <>
                      <p>• Monitor alerts and sensors</p>
                      <p>• Review AI recommendations</p>
                      <p>• Respond to incidents</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>
                Toggle specific features each role can access. Updates apply immediately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rolePermissions ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      <TableHead className="text-center">Admin</TableHead>
                      <TableHead className="text-center">Engineer</TableHead>
                      <TableHead className="text-center">Operator</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissionCatalog.map((perm) => (
                      <TableRow key={perm.key}>
                        <TableCell>
                          <div className="font-medium">{perm.label}</div>
                          <p className="text-sm text-muted-foreground">{perm.description}</p>
                        </TableCell>
                        {(['admin', 'engineer', 'operator'] as const).map((roleKey) => (
                          <TableCell key={roleKey} className="text-center">
                            <Switch
                              checked={rolePermissions[roleKey]?.has(perm.key)}
                              onCheckedChange={(checked) => handlePermissionToggle(roleKey, perm.key, checked)}
                              disabled={updateConfigMutation.isPending}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Loading permissions...</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="user-management" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage system users and their roles</CardDescription>
                </div>
                <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Assign Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Role to User</DialogTitle>
                      <DialogDescription>
                        Assign a role to an existing user by their user ID (UUID). The user must have signed up first.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="userId">User ID (UUID)</Label>
                        <Input
                          id="userId"
                          type="text"
                          placeholder="00000000-0000-0000-0000-000000000000"
                          value={newUserId}
                          onChange={(e) => setNewUserId(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter the UUID of the user from Supabase auth.users table
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="operator">Operator</SelectItem>
                            <SelectItem value="engineer">Engineer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddUser} disabled={addRoleMutation.isPending}>
                        {addRoleMutation.isPending ? 'Assigning...' : 'Assign Role'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell className="font-medium">
                          {userData.display_name || 'No name'}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {userData.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Select
                            value={userData.role}
                            onValueChange={(newRole) => handleRoleChange(userData.id, newRole)}
                            disabled={userData.id === user?.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="operator">Operator</SelectItem>
                              <SelectItem value="engineer">Engineer</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(userData.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {userData.id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(userData.id)}
                              disabled={deleteRoleMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Configuration Tab */}
        <TabsContent value="system-config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>Configure thresholds for sensor alerts and leak detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configLoading && thresholdConfigs.length === 0 ? (
                <div className="text-sm text-muted-foreground">Loading configuration...</div>
              ) : (
                thresholdConfigs.map((config: SystemConfig) => (
                <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg gap-4">
                  <div className="flex-1">
                    <Label htmlFor={config.config_key} className="font-medium">
                      {config.config_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                    {config.updated_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {new Date(config.updated_at).toLocaleString()}
                        {config.updated_by && ` • by ${config.updated_by.substring(0, 8)}...`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id={config.config_key}
                      type="number"
                      className="w-32"
                      value={configValues[config.config_key] ?? String(config.config_value)}
                      onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveConfig(config.config_key)}
                      disabled={updateConfigMutation.isPending}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Settings</CardTitle>
              <CardDescription>Configure AI agent behavior and automation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {agentConfigs.map((config: SystemConfig) => {
                const isBoolean = typeof config.config_value === 'boolean' || config.config_value === 'true' || config.config_value === 'false';
                const currentValue = configValues[config.config_key] !== undefined 
                  ? configValues[config.config_key] 
                  : String(config.config_value);
                const boolValue = isBoolean ? String(currentValue) === 'true' : false;

                return (
                  <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor={config.config_key} className="font-medium">
                        {config.config_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBoolean ? (
                        <>
                          <Switch
                            id={config.config_key}
                            checked={boolValue}
                            onCheckedChange={(checked) => {
                              handleConfigChange(config.config_key, String(checked));
                              updateConfigMutation.mutate({ key: config.config_key, value: checked });
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <Input
                            id={config.config_key}
                            type="number"
                            step="0.1"
                            className="w-32"
                            value={currentValue}
                            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveConfig(config.config_key)}
                            disabled={updateConfigMutation.isPending}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
