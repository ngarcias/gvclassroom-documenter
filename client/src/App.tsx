import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Download, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import CalendarioDocentePage from "@/pages/calendario-docente";
import MiCalendarioPage from "@/pages/mi-calendario";
import InformacionSalaPage from "@/pages/informacion-sala";
import CalendarioClasesPage from "@/pages/calendario-clases";
import ClasesDesactivadasPage from "@/pages/clases-desactivadas";
import MonitorDispositivosPage from "@/pages/monitor-dispositivos";
import IncidenciaDispositivosPage from "@/pages/incidencia-dispositivos";
import UsuariosPage from "@/pages/usuarios";
import HistorialErroresPage from "@/pages/historial-errores";
import HistorialDispositivosPage from "@/pages/historial-dispositivos";
import ConfiguracionPerfilesPage from "@/pages/configuracion-perfiles";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function AppHeader() {
  const { user } = useAuth();
  
  const getInitials = (nombre: string) => {
    return nombre
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="flex h-12 items-center justify-between gap-4 bg-background border-b px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
            GV
          </div>
          <span className="text-sm font-medium hidden sm:inline">Portal Docente</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden md:inline">powered by</span>
        <span className="text-xs font-medium text-primary hidden md:inline">GeoVictoria</span>
        <div className="h-6 w-px bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MapPin className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        {user && (
          <Avatar className="h-8 w-8 border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {getInitials(user.nombre)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </header>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties} defaultOpen={false}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader />
          <main className="flex-1 overflow-auto bg-background p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { user } = useAuth();
  const [location] = useLocation();

  if (location === "/login") {
    if (user) {
      return <Redirect to="/calendario-docente" />;
    }
    return <LoginPage />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/">
          <Redirect to="/calendario-docente" />
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute component={DashboardPage} />
        </Route>
        <Route path="/calendario-docente">
          <ProtectedRoute component={CalendarioDocentePage} />
        </Route>
        <Route path="/mi-calendario">
          <ProtectedRoute component={MiCalendarioPage} />
        </Route>
        <Route path="/informacion-sala">
          <ProtectedRoute component={InformacionSalaPage} />
        </Route>
        <Route path="/calendario-clases">
          <ProtectedRoute component={CalendarioClasesPage} />
        </Route>
        <Route path="/clases-desactivadas">
          <ProtectedRoute component={ClasesDesactivadasPage} />
        </Route>
        <Route path="/monitor-dispositivos">
          <ProtectedRoute component={MonitorDispositivosPage} />
        </Route>
        <Route path="/incidencia-dispositivos">
          <ProtectedRoute component={IncidenciaDispositivosPage} />
        </Route>
        <Route path="/usuarios">
          <ProtectedRoute component={UsuariosPage} />
        </Route>
        <Route path="/historial-errores">
          <ProtectedRoute component={HistorialErroresPage} />
        </Route>
        <Route path="/historial-dispositivos">
          <ProtectedRoute component={HistorialDispositivosPage} />
        </Route>
        <Route path="/configuracion-perfiles">
          <ProtectedRoute component={ConfiguracionPerfilesPage} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
