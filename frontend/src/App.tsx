import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Network from "./pages/Network";
import Incidents from "./pages/Incidents";
import Agents from "./pages/Agents";
import Energy from "./pages/Energy";
import Admin from "./pages/Admin";
import Team from "./pages/Team";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/network" element={<Layout><Network /></Layout>} />
          <Route path="/incidents" element={<Layout><Incidents /></Layout>} />
          <Route path="/agents" element={<Layout><Agents /></Layout>} />
          <Route path="/energy" element={<Layout><Energy /></Layout>} />
          <Route path="/admin" element={<Layout><Admin /></Layout>} />
          <Route path="/team" element={<Layout><Team /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
