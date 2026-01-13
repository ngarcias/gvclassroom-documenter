import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Calendar, User, MapPin, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ReporteError, Usuario, Sede } from "@shared/schema";

interface ReporteErrorConDetalles extends ReporteError {
  profesor?: Usuario;
}

export default function HistorialErroresPage() {
  const [fechaDesde, setFechaDesde] = useState<Date>(subDays(new Date(), 30));
  const [fechaHasta, setFechaHasta] = useState<Date>(new Date());
  const [sedeFilter, setSedeFilter] = useState<string>("");

  const { data: reportes, isLoading } = useQuery<ReporteErrorConDetalles[]>({
    queryKey: ["/api/reportes-error", {
      desde: format(fechaDesde, "yyyy-MM-dd"),
      hasta: format(fechaHasta, "yyyy-MM-dd"),
      sedeId: sedeFilter || undefined,
    }],
  });

  const { data: sedes } = useQuery<Sede[]>({
    queryKey: ["/api/sedes"],
  });

  const filteredReportes = useMemo(() => {
    if (!reportes) return [];
    if (!sedeFilter) return reportes;
    return reportes.filter((r) => r.sedeId === sedeFilter);
  }, [reportes, sedeFilter]);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (sedeFilter) {
      const sede = sedes?.find((s) => s.id === sedeFilter);
      filters.push({ key: "sede", label: "Sede", value: sede?.nombre || sedeFilter });
    }
    return filters;
  }, [sedeFilter, sedes]);

  const columns: Column<ReporteErrorConDetalles>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{format(new Date(r.fecha), "d MMM yyyy", { locale: es })}</span>
        </div>
      ),
    },
    {
      key: "profesor",
      header: "Reportado por",
      render: (r) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.profesor?.nombre || "Desconocido"}</span>
        </div>
      ),
    },
    {
      key: "sala",
      header: "Sala",
      render: (r) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.salaId || "-"}</span>
        </div>
      ),
    },
    {
      key: "comentario",
      header: "Descripcion",
      render: (r) => (
        <div className="max-w-md">
          <p className="text-sm truncate">{r.comentario}</p>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (r) => <StatusBadge status={r.estado} />,
    },
  ];

  const pendientes = filteredReportes.filter((r) => r.estado === "pendiente").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de Errores"
        description="Incidencias reportadas por los profesores"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredReportes.length}</p>
                <p className="text-xs text-muted-foreground">Total reportes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendientes}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredReportes.length - pendientes}</p>
                <p className="text-xs text-muted-foreground">Resueltos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <FilterBar
            activeFilters={activeFilters}
            onClearFilter={() => setSedeFilter("")}
            onClearAll={() => setSedeFilter("")}
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto" data-testid="button-fecha-desde">
                  <Calendar className="mr-2 h-4 w-4" />
                  Desde: {format(fechaDesde, "d MMM", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={fechaDesde}
                  onSelect={(d) => d && setFechaDesde(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto" data-testid="button-fecha-hasta">
                  <Calendar className="mr-2 h-4 w-4" />
                  Hasta: {format(fechaHasta, "d MMM", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={fechaHasta}
                  onSelect={(d) => d && setFechaHasta(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Select value={sedeFilter || "__all__"} onValueChange={(v) => setSedeFilter(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-48" data-testid="filter-sede">
                <SelectValue placeholder="Filtrar por sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las sedes</SelectItem>
                {sedes?.map((sede) => (
                  <SelectItem key={sede.id} value={sede.id}>
                    {sede.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredReportes}
            isLoading={isLoading}
            emptyMessage="No hay reportes de error en el periodo seleccionado"
            rowKey={(r) => r.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
