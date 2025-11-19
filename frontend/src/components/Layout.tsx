import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { NavLink } from "./NavLink";
import {
  LayoutDashboard,
  Network,
  AlertCircle,
  Bot,
  Zap,
  Settings,
  Users,
  LogOut,
  Droplets,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, role, signOut, loading, initialize } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (
      !loading &&
      !user &&
      location.pathname !== "/auth" &&
      location.pathname !== "/"
    ) {
      navigate("/auth");
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Droplets className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading A.W.A.R.E. System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/network", icon: Network, label: "Network Twin" },
    { to: "/incidents", icon: AlertCircle, label: "Incidents" },
    { to: "/agents", icon: Bot, label: "Agents" },
    { to: "/energy", icon: Zap, label: "Energy" },
    ...(role === "admin"
      ? [{ to: "/admin", icon: Settings, label: "Admin" }]
      : []),
    { to: "/team", icon: Users, label: "Team" },
  ];

  const roleColors = {
    admin: "destructive",
    engineer: "secondary",
    operator: "default",
  } as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                A.W.A.R.E.
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
                    activeClassName="bg-muted text-foreground"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={roleColors[role as keyof typeof roleColors] || "default"}
            >
              {role || "operator"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">{children}</main>
    </div>
  );
};

export default Layout;
