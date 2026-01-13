import { useQuery } from "@tanstack/react-query";
import { Users, Tablet, Calendar, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";

interface DashboardStats {
  totalUsuarios: number;
  usuariosActivos: number;
  totalDispositivos: number;
  dispositivosConectados: number;
  clasesHoy: number;
  incidenciasPendientes: number;
}

interface ClaseReciente {
  id: string;
  asignatura: string;
  profesor: string;
  sala: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: clasesRecientes, isLoading: clasesLoading } = useQuery<ClaseReciente[]>({
    queryKey: ["/api/dashboard/clases-recientes"],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido, ${user?.nombre?.split(" ")[0] || "Usuario"}`}
        description="Resumen general del sistema de control de asistencia"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatsCard
              title="Usuarios Activos"
              value={stats?.usuariosActivos ?? 0}
              description={`de ${stats?.totalUsuarios ?? 0} registrados`}
              icon={<Users className="h-4 w-4" />}
            />
            <StatsCard
              title="Dispositivos Conectados"
              value={stats?.dispositivosConectados ?? 0}
              description={`de ${stats?.totalDispositivos ?? 0} totales`}
              icon={<Tablet className="h-4 w-4" />}
            />
            <StatsCard
              title="Clases Hoy"
              value={stats?.clasesHoy ?? 0}
              description="programadas para hoy"
              icon={<Calendar className="h-4 w-4" />}
            />
            <StatsCard
              title="Incidencias Pendientes"
              value={stats?.incidenciasPendientes ?? 0}
              description="requieren atencion"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base font-medium">Clases Recientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {clasesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : clasesRecientes && clasesRecientes.length > 0 ? (
              <div className="space-y-1">
                {clasesRecientes.map((clase) => (
                  <div
                    key={clase.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    data-testid={`clase-reciente-${clase.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{clase.asignatura}</p>
                      <p className="text-xs text-muted-foreground">
                        {clase.profesor} - {clase.sala}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-xs text-muted-foreground font-mono">
                        {clase.horaInicio}
                      </span>
                      <StatusBadge status={clase.estado} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay clases recientes
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base font-medium">Actividad del Sistema</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Graficos de actividad disponibles proximamente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
