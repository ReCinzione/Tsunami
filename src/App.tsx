import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import ArchetypesPage from "./pages/ArchetypesPage";
import ProjectsPage from "./pages/ProjectsPage";
import RoutinesPage from "./pages/RoutinesPage";
import { SettingsPage } from "./pages/SettingsPage";
import CharacterSheet from "./pages/CharacterSheet";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/inbox" element={<Index />} />
          <Route path="/personalita" element={<ArchetypesPage />} />
          <Route path="/progetti" element={<ProjectsPage />} />
          <Route path="/routine" element={<RoutinesPage />} />
          <Route path="/impostazioni" element={<SettingsPage />} />
          <Route path="/personaggio" element={<CharacterSheet />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
