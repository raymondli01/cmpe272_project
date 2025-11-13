import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Github } from 'lucide-react';

const Team = () => {
  const teamMembers = [
    {
      name: 'Raymond Li',
      role: 'Team Lead & Backend Architect',
      bio: 'Specializing in distributed systems and AI agents',
    },
    {
      name: 'Sophia Atendido',
      role: 'Frontend Developer',
      bio: 'Expert in React and modern UI/UX design',
    },
    {
      name: 'Jack Liang',
      role: 'Data Engineer',
      bio: 'Focus on digital twin modeling and realtime analytics',
    },
    {
      name: 'Dhruv Verma',
      role: 'DevOps & Integration',
      bio: 'Cloud infrastructure and CI/CD pipeline specialist',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team A.W.A.R.E.</h1>
        <p className="text-muted-foreground">Meet the team behind the intelligent water management system</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>CMPE-272: Enterprise Software Platforms</CardTitle>
              <CardDescription>San José State University | Fall 2025</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            This project demonstrates the application of enterprise software engineering principles 
            to create a production-ready AI agent system for critical infrastructure management.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <Github className="w-4 h-4 text-muted-foreground" />
            <a 
              href="https://github.com/raymondli01/aware-water-agent" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              github.com/raymondli01/aware-water-agent
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {teamMembers.map((member) => (
          <Card key={member.name}>
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-primary">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <CardTitle>{member.name}</CardTitle>
              <CardDescription>{member.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{member.bio}</p>
              <Badge variant="outline" className="mt-3">SJSU</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Highlights</CardTitle>
          <CardDescription>Key technical achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Badge variant="default" className="mt-0.5">✓</Badge>
              <span>Multi-agent AI system with autonomous decision-making</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="default" className="mt-0.5">✓</Badge>
              <span>Digital twin with real-time network visualization</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="default" className="mt-0.5">✓</Badge>
              <span>Proactive leak detection with acoustic pattern analysis</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="default" className="mt-0.5">✓</Badge>
              <span>Dynamic energy optimization based on real-time pricing</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="default" className="mt-0.5">✓</Badge>
              <span>Role-based access control with secure authentication</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Team;
