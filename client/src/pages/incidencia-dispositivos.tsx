import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Tablet, ArrowRight, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DispositivoConDetalles, IncidenciaDispositivo, Sede, Sala } from "@shared/schema";

interface IncidenciaConDispositivo extends IncidenciaDispositivo {
  dispositivo?: DispositivoConDetalles;
}

export default function IncidenciaDispositivosPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedIncidencia, setSelectedIncidencia] = useState<IncidenciaConDispositivo | null>(null);
  const [nuevaSede, setNuevaSede] = useState<string>("");
  const [nuevaSala, setNuevaSala] = useState<string>("");

  const { data: incidencias, isLoading } = useQuery<IncidenciaConDispositivo[]>({
    queryKey: ["/api/incidencias-dispositivos"],
  });

  const { data: sedes } = useQuery<Sede[]>({
    queryKey: ["/api/sedes"],
  });

  const { data: salas } = useQuery<Sala[]>({
    queryKey: ["/api/salas", { sedeId: nuevaSede }],
    enabled: !!nuevaSede,
  });

  const homologarMutation = useMutation({
    mutationFn: async (data: { incidenciaId: string; sedeId: string; salaId: string }) => {
      return apiRequest("POST", `/api/incidencias-dispositivos/${data.incidenciaId}/homologar`, {
        sedeId: data.sedeId,
        salaId: data.salaId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Dispositivo homologado",
        description: "La configuracion temporal ha sido aplicada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/incidencias-dispositivos"] });
      setSelectedIncidencia(null);
      setNuevaSede("");
      setNuevaSala("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo homologar el dispositivo",
        variant: "destructive",
      });
    },
  });

  const filteredIncidencias = useMemo(() => {
    if (!incidencias) return [];
    if (!search) return incidencias;
    const searchLower = search.toLowerCase();
    return incidencias.filter((i) =>
      i.dispositivo?.serialNumber.toLowerCase().includes(searchLower) ||
      i.tipoIncidencia.toLowerCase().includes(searchLower)
    );
  }, [incidencias, search]);

  const pendientes = filteredIncidencias.filter((i) => i.estadoResolucion === "pendiente").length;

  const columns: Column<IncidenciaConDispositivo>[] = [
    {
      key: "dispositivo",
      header: "Dispositivo",
      render: (i) => (
        <div className="flex items-center gap-2">
          <Tablet className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{i.dispositivo?.serialNumber || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "tipoIncidencia",
      header: "Tipo Incidencia",
      render: (i) => (
        <span className="text-sm">{i.tipoIncidencia}</span>
      ),
    },
    {
      key: "ubicacionOriginal",
      header: "Ubicacion Original",
      render: (i) => (
        <span className="text-sm">{i.salaOriginal || "Sin asignar"}</span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (i) => <StatusBadge status={i.estadoResolucion} />,
    },
    {
      key: "createdAt",
      header: "Reportado",
      render: (i) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(i.createdAt), { addSuffix: true, locale: es })}
        </span>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (i) => (
        i.estadoResolucion === "pendiente" && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIncidencia(i);
            }}
            data-testid={`button-homologar-${i.id}`}
          >
            Homologar
          </Button>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidencia de Dispositivos"
        description="Gestiona dispositivos con inconsistencias de conexion"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendientes}</p>
                <p className="text-xs text-muted-foreground">Incidencias pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filteredIncidencias.length - pendientes}
                </p>
                <p className="text-xs text-muted-foreground">Resueltas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por S/N o tipo..."
              className="sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredIncidencias}
            isLoading={isLoading}
            emptyMessage="No hay incidencias reportadas"
            rowKey={(i) => i.id}
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedIncidencia} onOpenChange={() => setSelectedIncidencia(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Homologar Dispositivo</DialogTitle>
            <DialogDescription>
              Asigna temporalmente el dispositivo a una nueva sede y sala mientras no tenga conexion con la plataforma.
            </DialogDescription>
          </DialogHeader>
          {selectedIncidencia && (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Tablet className="h-4 w-4" />
                  <span className="font-mono font-medium">
                    {selectedIncidencia.dispositivo?.serialNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{selectedIncidencia.salaOriginal || "Sin ubicacion"}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="text-foreground">Nueva ubicacion</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nueva Sede</label>
                  <Select value={nuevaSede} onValueChange={(v) => { setNuevaSede(v); setNuevaSala(""); }}>
                    <SelectTrigger data-testid="select-nueva-sede">
                      <SelectValue placeholder="Seleccionar sede" />
                    </SelectTrigger>
                    <SelectContent>
                      {sedes?.map((sede) => (
                        <SelectItem key={sede.id} value={sede.id}>
                          {sede.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nueva Sala</label>
                  <Select value={nuevaSala} onValueChange={setNuevaSala} disabled={!nuevaSede}>
                    <SelectTrigger data-testid="select-nueva-sala">
                      <SelectValue placeholder="Seleccionar sala" />
                    </SelectTrigger>
                    <SelectContent>
                      {salas?.map((sala) => (
                        <SelectItem key={sala.id} value={sala.id}>
                          {sala.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedIncidencia(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedIncidencia && nuevaSede && nuevaSala) {
                  homologarMutation.mutate({
                    incidenciaId: selectedIncidencia.id,
                    sedeId: nuevaSede,
                    salaId: nuevaSala,
                  });
                }
              }}
              disabled={!nuevaSede || !nuevaSala || homologarMutation.isPending}
              data-testid="button-confirmar-homologacion"
            >
              {homologarMutation.isPending ? "Procesando..." : "Confirmar Homologacion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
