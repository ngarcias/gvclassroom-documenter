import { useLocation, Link } from "wouter";
import {
  Calendar,
  CalendarDays,
  Building2,
  Users,
  Tablet,
  AlertTriangle,
  FileText,
  History,
  Settings,
  LogOut,
  GraduationCap,
  CalendarOff,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Calendario Docente", url: "/calendario-docente", icon: Calendar },
  { title: "Mi Calendario", url: "/mi-calendario", icon: CalendarDays },
  { title: "Informacion Sala", url: "/informacion-sala", icon: Building2 },
  { title: "Calendario Clases", url: "/calendario-clases", icon: GraduationCap },
  { title: "Clases Desactivadas", url: "/clases-desactivadas", icon: CalendarOff },
  { title: "Monitor Dispositivos", url: "/monitor-dispositivos", icon: Tablet },
  { title: "Incidencias", url: "/incidencia-dispositivos", icon: AlertTriangle },
  { title: "Usuarios", url: "/usuarios", icon: Users },
  { title: "Historial Errores", url: "/historial-errores", icon: FileText },
  { title: "Historial Dispositivos", url: "/historial-dispositivos", icon: History },
  { title: "Perfiles", url: "/configuracion-perfiles", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="py-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = location === item.url;
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className={cn(
                    "h-10 rounded-md justify-center group-data-[collapsible=icon]:px-0",
                    isActive && "bg-sidebar-accent"
                  )}
                  data-testid={`nav-${item.url.slice(1)}`}
                >
                  <Link href={item.url}>
                    <item.icon className="h-6 w-6 shrink-0" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Cerrar Sesion"
              onClick={logout}
              className="h-10 rounded-md justify-center group-data-[collapsible=icon]:px-0"
              data-testid="button-logout"
            >
              <LogOut className="h-6 w-6 shrink-0" />
              <span className="truncate group-data-[collapsible=icon]:hidden">Cerrar Sesion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
