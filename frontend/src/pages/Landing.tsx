import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, Bot, Zap, Shield, TrendingDown, Activity } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <header className="container py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Droplets className="w-6 h-6 text-primary" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            A.W.A.R.E.
          </span>
        </div>
        <Link to="/auth">
          <Button variant="outline">Sign In</Button>
        </Link>
      </header>

      <section className="container py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Shield className="w-4 h-4" />
            <span>CMPE-272: Enterprise Software Platforms | SJSU Fall 2025</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="block">Agent for Water</span>
            <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Autonomy, Resilience & Efficiency
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A proactive, self-healing AI agent for municipal water utilities that couples a digital twin 
            with multi-agent decision systems to anticipate failures, orchestrate autonomous responses, 
            and optimize energy use.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                <Activity className="w-5 h-5" />
                Open Dashboard
              </Button>
            </Link>
            <Link to="/team">
              <Button size="lg" variant="outline" className="gap-2">
                <Shield className="w-5 h-5" />
                Meet the Team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Proactive Leak Detection</h3>
              <p className="text-muted-foreground">
                AI agents monitor acoustic patterns and pressure anomalies to detect leaks before they 
                become critical, with autonomous isolation capabilities.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-secondary/50 transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold">Energy Optimization</h3>
              <p className="text-muted-foreground">
                Dynamic pump scheduling optimizes energy consumption based on real-time pricing, 
                filling tanks during off-peak hours to maximize savings.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-accent/50 transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Reduce Non-Revenue Water</h3>
              <p className="text-muted-foreground">
                Comprehensive monitoring and rapid response minimize water loss, reducing non-revenue 
                water and operational costs across the network.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-bold">Ready to Transform Water Management?</h2>
          <p className="text-muted-foreground">
            Experience the future of intelligent water utility operations with autonomous 
            AI agents and digital twin technology.
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2 mt-4">
              Get Started
              <Activity className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="container py-8 border-t border-border/40">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2025 Team A.W.A.R.E. - San José State University</p>
          <p>Raymond Li • Sophia Atendido • Jack Liang • Dhruv Verma</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
