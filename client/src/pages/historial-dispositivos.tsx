import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { History, Download, Tablet, Calendar, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { IncidenciaDispositivo, Sede, Sala, DispositivoConDetalles } from "@shared/schema";

interface IncidenciaHistorica extends IncidenciaDispositivo {
  dispositivo?: DispositivoConDetalles;
}

export default function HistorialDispositivosPage() {
  const [fechaDesde, setFechaDesde] = useState<Date>(subDays(new Date(), 30));
  const [fechaHasta, setFechaHasta] = useState<Date>(new Date());
  const [sedeFilter, setSedeFilter] = useState<string>("");
  const [salaFilter, setSalaFilter] = useState<string>("");

  const { data: incidencias, isLoading } = useQuery<IncidenciaHistorica[]>({
    queryKey: ["/api/incidencias-dispositivos/historial", {
      desde: format(fechaDesde, "yyyy-MM-dd"),
      hasta: format(fechaHasta, "yyyy-MM-dd"),
    }],
  });

  const { data: sedes } = useQuery<Sede[]>({
    queryKey: ["/api/sedes"],
  });

  const { data: salas } = useQuery<Sala[]>({
    queryKey: ["/api/salas", { sedeId: sedeFilter }],
    enabled: !!sedeFilter,
  });

  const filteredIncidencias = useMemo(() => {
    if (!incidencias) return [];
    return incidencias.filter((i) => {
      if (sedeFilter && i.sedeOriginal !== sedeFilter) return false;
      if (salaFilter && i.salaOriginal !== salaFilter) return false;
      return true;
    });
  }, [incidencias, sedeFilter, salaFilter]);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (sedeFilter) {
      const sede = sedes?.find((s) => s.id === sedeFilter);
      filters.push({ key: "sede", label: "Sede", value: sede?.nombre || sedeFilter });
    }
    if (salaFilter) {
      const sala = salas?.find((s) => s.id === salaFilter);
      filters.push({ key: "sala", label: "Sala", value: sala?.nombre || salaFilter });
    }
    return filters;
  }, [sedeFilter, salaFilter, sedes, salas]);

  const clearFilter = (key: string) => {
    if (key === "sede") { setSedeFilter(""); setSalaFilter(""); }
    if (key === "sala") setSalaFilter("");
  };

  const columns: Column<IncidenciaHistorica>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (i) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{format(new Date(i.createdAt), "d MMM yyyy HH:mm", { locale: es })}</span>
        </div>
      ),
    },
    {
      key: "dispositivo",
      header: "Dispositivo",
      render: (i) => (
        <div className="flex items-center gap-2">
          <Tablet className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-sm">{i.dispositivo?.serialNumber || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "tipoIncidencia",
      header: "Tipo",
      render: (i) => <span className="text-sm">{i.tipoIncidencia}</span>,
    },
    {
      key: "ubicacion",
      header: "Ubicacion Original",
      render: (i) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{i.salaOriginal || "-"}</span>
        </div>
      ),
    },
    {
      key: "homologacion",
      header: "Homologacion",
      render: (i) => (
        i.salaHomologada ? (
          <span className="text-sm">{i.salaHomologada}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (i) => <StatusBadge status={i.estadoResolucion} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de Dispositivos"
        description="Registro historico de incidencias de equipos de marcaje"
      >
        <Button variant="outline" data-testid="button-generar-reporte">
          <Download className="h-4 w-4 mr-2" />
          Generar Reporte
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <History className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredIncidencias.length}</p>
              <p className="text-xs text-muted-foreground">Incidencias en el periodo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <FilterBar
            activeFilters={activeFilters}
            onClearFilter={clearFilter}
            onClearAll={() => { setSedeFilter(""); setSalaFilter(""); }}
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
            <Select value={sedeFilter || "__all__"} onValueChange={(v) => { setSedeFilter(v === "__all__" ? "" : v); setSalaFilter(""); }}>
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
            <Select value={salaFilter || "__all__"} onValueChange={(v) => setSalaFilter(v === "__all__" ? "" : v)} disabled={!sedeFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="filter-sala">
                <SelectValue placeholder="Filtrar por sala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las salas</SelectItem>
                {salas?.map((sala) => (
                  <SelectItem key={sala.id} value={sala.id}>
                    {sala.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBar>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredIncidencias}
            isLoading={isLoading}
            emptyMessage="No hay incidencias en el periodo seleccionado"
            rowKey={(i) => i.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
