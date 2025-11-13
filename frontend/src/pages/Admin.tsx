import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Admin = () => {
  const { role } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/dashboard');
    }
  }, [role, navigate]);

  if (role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">System administration and configuration</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <Shield className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Access Control</CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="destructive">Admin Only</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage system users</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">3 active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-2">
              <Settings className="w-6 h-6 text-warning" />
            </div>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>Thresholds and alert settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="default">Configured</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
