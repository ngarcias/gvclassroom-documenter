import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarOff, Clock, MapPin, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sala, ClaseConDetalles, Sede } from "@shared/schema";

export default function ClasesDesactivadasPage() {
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

  const { data: clases, isLoading: clasesLoading } = useQuery<ClaseConDetalles[]>({
    queryKey: ["/api/clases/desactivadas", {
      salaId: selectedSalaId,
      fecha: format(selectedDate, "yyyy-MM-dd"),
    }],
    enabled: !!selectedSalaId,
  });

  const columns: Column<ClaseConDetalles>[] = [
    {
      key: "asignatura",
      header: "Asignatura",
      render: (clase) => (
        <div>
          <p className="font-medium">{clase.asignatura}</p>
          <p className="text-xs text-muted-foreground font-mono">{clase.codigo}</p>
        </div>
      ),
    },
    {
      key: "profesor",
      header: "Profesor",
      render: (clase) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{clase.profesor?.nombre || "Sin asignar"}</span>
        </div>
      ),
    },
    {
      key: "horario",
      header: "Horario",
      render: (clase) => (
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-mono">{clase.horaInicio} - {clase.horaFin}</span>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (clase) => <StatusBadge status={clase.estado} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clases Desactivadas"
        description="Consulta las clases canceladas o desactivadas por sala y fecha"
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

      {selectedSalaId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CalendarOff className="h-4 w-4" />
              Clases Desactivadas
              <span className="text-muted-foreground font-normal">
                ({clases?.length || 0} encontradas)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={clases || []}
              isLoading={clasesLoading}
              emptyMessage="No hay clases desactivadas para esta fecha y sala"
              rowKey={(clase) => clase.id}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <CalendarOff className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Selecciona una sede y sala para ver las clases desactivadas</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
