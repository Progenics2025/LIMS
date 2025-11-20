import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RecycleProvider } from "@/contexts/RecycleContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { useState } from "react";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import LeadManagement from "@/pages/LeadManagement";
import ProcessMaster from "@/pages/ProcessMaster";
import SampleTracking from "@/pages/SampleTracking";
import LabProcessing from "@/pages/LabProcessing";
import FinanceManagement from "@/pages/FinanceManagement";
import ReportManagement from "@/pages/ReportManagement";
import AdminPanel from "@/pages/AdminPanel";
import GeneticCounselling from "@/pages/GeneticCounselling";
import Bioinformatics from "@/pages/Bioinformatics";
import Nutrition from "@/pages/Nutrition";
import RecycleBin from "@/pages/RecycleBin";
import NotFound from "@/pages/not-found";

function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72 flex flex-col min-h-screen">
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/leads">
        <ProtectedRoute roles={['sales', 'operations', 'manager', 'admin']}>
          <LeadManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/process-master">
        <ProtectedRoute roles={['sales', 'operations', 'manager', 'admin']}>
          <ProcessMaster />
        </ProtectedRoute>
      </Route>
      <Route path="/samples">
        <ProtectedRoute roles={['operations', 'lab', 'manager', 'admin']}>
          <SampleTracking />
        </ProtectedRoute>
      </Route>
      <Route path="/lab">
        <ProtectedRoute roles={['lab', 'bioinformatics', 'manager', 'admin']}>
          <LabProcessing />
        </ProtectedRoute>
      </Route>
      <Route path="/genetic-counselling">
        <ProtectedRoute roles={['genetic_counselling', 'manager', 'admin', 'reporting']}>
          <GeneticCounselling />
        </ProtectedRoute>
      </Route>
      <Route path="/bioinformatics">
        <ProtectedRoute roles={['bioinformatics', 'manager', 'admin', 'reporting']}>
          <Bioinformatics />
        </ProtectedRoute>
      </Route>
      <Route path="/nutrition">
        <ProtectedRoute roles={['nutrition', 'manager', 'admin']}>
          <Nutrition />
        </ProtectedRoute>
      </Route>
      <Route path="/finance">
        <ProtectedRoute roles={['finance', 'manager', 'admin']}>
          <FinanceManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute roles={['reporting', 'manager', 'admin']}>
          <ReportManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/recycle-bin">
        <ProtectedRoute roles={['manager', 'admin', 'operations', 'reporting']}>
          <RecycleBin />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute roles={['admin']}>
          <AdminPanel />
        </ProtectedRoute>
      </Route>
      {/* No additional redirect needed - root path is handled above */}
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <RecycleProvider>
              <AppLayout>
                <Router />
              </AppLayout>
              <Toaster />
            </RecycleProvider>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
