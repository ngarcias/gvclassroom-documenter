import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Building2, Tablet, Clock, MapPin, Wifi, WifiOff, Battery } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Sala, DispositivoConDetalles, ClaseConDetalles, Sede } from "@shared/schema";

export default function InformacionSalaPage() {
  const [selectedSedeId, setSelectedSedeId] = useState<string>("");
  const [selectedSalaId, setSelectedSalaId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: sedes, isLoading: sedesLoading } = useQuery<Sede[]>({
    queryKey: ["/api/sedes"],
  });

  const { data: salas, isLoading: salasLoading } = useQuery<Sala[]>({
    queryKey: ["/api/salas", { sedeId: selectedSedeId }],
    enabled: !!selectedSedeId,
  });

  const { data: dispositivos, isLoading: dispositivosLoading } = useQuery<DispositivoConDetalles[]>({
    queryKey: ["/api/dispositivos", { salaId: selectedSalaId }],
    enabled: !!selectedSalaId,
  });

  const { data: clases, isLoading: clasesLoading } = useQuery<ClaseConDetalles[]>({
    queryKey: ["/api/clases", {
      salaId: selectedSalaId,
      fecha: format(selectedDate, "yyyy-MM-dd"),
    }],
    enabled: !!selectedSalaId,
  });

  const selectedSala = salas?.find((s) => s.id === selectedSalaId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informacion de Sala"
        description="Consulta dispositivos y programacion por sala"
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64">
          <Select value={selectedSedeId} onValueChange={(v) => { setSelectedSedeId(v); setSelectedSalaId(""); }}>
            <SelectTrigger data-testid="select-sede">
              <SelectValue placeholder="Seleccionar sede" />
            </SelectTrigger>
            <SelectContent>
              {sedesLoading ? (
                <div className="p-2"><Skeleton className="h-8 w-full" /></div>
              ) : (
                sedes?.map((sede) => (
                  <SelectItem key={sede.id} value={sede.id}>
                    {sede.nombre}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedSalaId} onValueChange={setSelectedSalaId} disabled={!selectedSedeId}>
            <SelectTrigger data-testid="select-sala">
              <SelectValue placeholder="Seleccionar sala" />
            </SelectTrigger>
            <SelectContent>
              {salasLoading ? (
                <div className="p-2"><Skeleton className="h-8 w-full" /></div>
              ) : (
                salas?.map((sala) => (
                  <SelectItem key={sala.id} value={sala.id}>
                    {sala.nombre}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto justify-start" data-testid="button-date-picker">
              <Clock className="mr-2 h-4 w-4" />
              {format(selectedDate, "d MMM yyyy", { locale: es })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {selectedSala && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{selectedSala.nombre}</CardTitle>
                <p className="text-sm text-muted-foreground">Codigo: {selectedSala.codigo}</p>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Tablet className="h-4 w-4" />
                  Dispositivos Asociados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dispositivosLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : dispositivos && dispositivos.length > 0 ? (
                  <div className="space-y-3">
                    {dispositivos.map((dispositivo) => (
                      <div
                        key={dispositivo.id}
                        className="flex items-center justify-between p-3 rounded-md border"
                        data-testid={`dispositivo-${dispositivo.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-9 w-9 rounded-md flex items-center justify-center",
                            dispositivo.estadoConexion === "conectado"
                              ? "bg-emerald-100 dark:bg-emerald-900/30"
                              : "bg-slate-100 dark:bg-slate-800"
                          )}>
                            {dispositivo.estadoConexion === "conectado" ? (
                              <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <WifiOff className="h-4 w-4 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium font-mono">{dispositivo.serialNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {dispositivo.tipo} - v{dispositivo.versionApp || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {dispositivo.bateria !== null && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Battery className="h-3 w-3" />
                              {dispositivo.bateria}%
                            </div>
                          )}
                          <StatusBadge status={dispositivo.estadoConexion} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay dispositivos asociados a esta sala
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Programacion del Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clasesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : clases && clases.length > 0 ? (
                  <div className="space-y-3">
                    {clases
                      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                      .map((clase) => (
                        <div
                          key={clase.id}
                          className="flex items-center justify-between p-3 rounded-md border"
                          data-testid={`clase-sala-${clase.id}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{clase.asignatura}</p>
                            <p className="text-xs text-muted-foreground">
                              {clase.profesor?.nombre || "Sin profesor"}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 ml-3">
                            <span className="text-xs font-mono text-muted-foreground">
                              {clase.horaInicio} - {clase.horaFin}
                            </span>
                            <StatusBadge status={clase.estado} />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay clases programadas para este dia
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!selectedSalaId && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Selecciona una sede y sala para ver la informacion</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
