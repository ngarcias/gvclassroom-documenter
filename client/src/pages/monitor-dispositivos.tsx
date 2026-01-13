import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Tablet, Download, Wifi, WifiOff, AlertTriangle, Battery } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import { cn } from "@/lib/utils";
import type { DispositivoConDetalles, Sede, Sala } from "@shared/schema";

export default function MonitorDispositivosPage() {
  const [search, setSearch] = useState("");
  const [sedeFilter, setSedeFilter] = useState<string>("");
  const [salaFilter, setSalaFilter] = useState<string>("");
  const [estadoFilter, setEstadoFilter] = useState<string>("");

  const { data: dispositivos, isLoading } = useQuery<DispositivoConDetalles[]>({
    queryKey: ["/api/dispositivos"],
  });

  const { data: sedes } = useQuery<Sede[]>({
    queryKey: ["/api/sedes"],
  });

  const { data: salas } = useQuery<Sala[]>({
    queryKey: ["/api/salas", { sedeId: sedeFilter }],
    enabled: !!sedeFilter,
  });

  const filteredDispositivos = useMemo(() => {
    if (!dispositivos) return [];
    return dispositivos.filter((d) => {
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !d.serialNumber.toLowerCase().includes(searchLower) &&
          !d.sala?.nombre.toLowerCase().includes(searchLower) &&
          !d.sede?.nombre.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      if (sedeFilter && d.sedeId !== sedeFilter) return false;
      if (salaFilter && d.salaId !== salaFilter) return false;
      if (estadoFilter && d.estadoConexion !== estadoFilter) return false;
      return true;
    });
  }, [dispositivos, search, sedeFilter, salaFilter, estadoFilter]);

  const stats = useMemo(() => {
    if (!dispositivos) return { total: 0, conectados: 0, desconectados: 0, advertencia: 0 };
    return {
      total: dispositivos.length,
      conectados: dispositivos.filter((d) => d.estadoConexion === "conectado").length,
      desconectados: dispositivos.filter((d) => d.estadoConexion === "desconectado").length,
      advertencia: dispositivos.filter((d) => d.estadoConexion === "advertencia").length,
    };
  }, [dispositivos]);

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
    if (estadoFilter) {
      filters.push({ key: "estado", label: "Estado", value: estadoFilter });
    }
    return filters;
  }, [sedeFilter, salaFilter, estadoFilter, sedes, salas]);

  const clearFilter = (key: string) => {
    switch (key) {
      case "sede":
        setSedeFilter("");
        setSalaFilter("");
        break;
      case "sala":
        setSalaFilter("");
        break;
      case "estado":
        setEstadoFilter("");
        break;
    }
  };

  const columns: Column<DispositivoConDetalles>[] = [
    {
      key: "serialNumber",
      header: "S/N Dispositivo",
      render: (d) => (
        <span className="font-mono text-sm">{d.serialNumber}</span>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (d) => (
        <div className="flex items-center gap-2">
          <Tablet className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm capitalize">{d.tipo}</span>
        </div>
      ),
    },
    {
      key: "sede",
      header: "Sede",
      render: (d) => <span className="text-sm">{d.sede?.nombre || "-"}</span>,
    },
    {
      key: "sala",
      header: "Sala",
      render: (d) => <span className="text-sm">{d.sala?.nombre || "-"}</span>,
    },
    {
      key: "version",
      header: "Version App",
      render: (d) => (
        <span className="text-sm font-mono">{d.versionApp || "N/A"}</span>
      ),
    },
    {
      key: "bateria",
      header: "Bateria",
      render: (d) => (
        d.bateria !== null ? (
          <div className="flex items-center gap-1">
            <Battery className={cn(
              "h-3 w-3",
              d.bateria > 50 ? "text-emerald-500" :
              d.bateria > 20 ? "text-amber-500" : "text-red-500"
            )} />
            <span className="text-sm">{d.bateria}%</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (d) => <StatusBadge status={d.estadoConexion} />,
    },
    {
      key: "ultimaConexion",
      header: "Ultima Conexion",
      render: (d) => (
        <span className="text-sm text-muted-foreground">
          {d.ultimaConexion
            ? formatDistanceToNow(new Date(d.ultimaConexion), { addSuffix: true, locale: es })
            : "Nunca"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitor de Dispositivos"
        description="Estado y conexion de todos los dispositivos de marcaje"
      >
        <Button variant="outline" data-testid="button-export-general">
          <Download className="h-4 w-4 mr-2" />
          Exportar General
        </Button>
        <Button variant="outline" data-testid="button-export-historico">
          <Download className="h-4 w-4 mr-2" />
          Exportar Historico
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Dispositivos"
          value={stats.total}
          icon={<Tablet className="h-4 w-4" />}
        />
        <StatsCard
          title="Conectados"
          value={stats.conectados}
          icon={<Wifi className="h-4 w-4" />}
        />
        <StatsCard
          title="Desconectados"
          value={stats.desconectados}
          icon={<WifiOff className="h-4 w-4" />}
        />
        <StatsCard
          title="Con Advertencia"
          value={stats.advertencia}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <FilterBar
            activeFilters={activeFilters}
            onClearFilter={clearFilter}
            onClearAll={() => {
              setSedeFilter("");
              setSalaFilter("");
              setEstadoFilter("");
            }}
          >
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por S/N, sala, sede..."
              className="w-full sm:w-64"
            />
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
            <Select value={estadoFilter || "__all__"} onValueChange={(v) => setEstadoFilter(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-44" data-testid="filter-estado">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los estados</SelectItem>
                <SelectItem value="conectado">Conectado</SelectItem>
                <SelectItem value="desconectado">Desconectado</SelectItem>
                <SelectItem value="advertencia">Advertencia</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredDispositivos}
            isLoading={isLoading}
            emptyMessage="No se encontraron dispositivos"
            rowKey={(d) => d.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
