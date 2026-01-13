import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, MapPin, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Usuario, ClaseConDetalles } from "@shared/schema";

export default function CalendarioClasesPage() {
  const [searchAlumno, setSearchAlumno] = useState("");
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<string>("");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const { data: alumnos, isLoading: alumnosLoading } = useQuery<Usuario[]>({
    queryKey: ["/api/usuarios", { tipo: "alumno" }],
  });

  const { data: clases, isLoading: clasesLoading } = useQuery<ClaseConDetalles[]>({
    queryKey: ["/api/clases/alumno", {
      alumnoId: selectedAlumnoId,
      desde: format(weekStart, "yyyy-MM-dd"),
      hasta: format(addDays(weekStart, 6), "yyyy-MM-dd"),
    }],
    enabled: !!selectedAlumnoId,
  });

  const filteredAlumnos = useMemo(() => {
    if (!alumnos) return [];
    if (!searchAlumno) return alumnos.slice(0, 50);
    const search = searchAlumno.toLowerCase();
    return alumnos
      .filter((a) =>
        a.nombre.toLowerCase().includes(search) ||
        a.rut.toLowerCase().includes(search)
      )
      .slice(0, 50);
  }, [alumnos, searchAlumno]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const clasesForDay = (day: Date) => {
    if (!clases) return [];
    return clases.filter((c) => isSameDay(new Date(c.fecha), day));
  };

  const selectedAlumno = alumnos?.find((a) => a.id === selectedAlumnoId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendario de Clases"
        description="Consulta la programacion de clases por alumno"
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-72">
          <Select value={selectedAlumnoId} onValueChange={setSelectedAlumnoId}>
            <SelectTrigger data-testid="select-alumno">
              <SelectValue placeholder="Seleccionar alumno" />
            </SelectTrigger>
            <SelectContent>
              {alumnosLoading ? (
                <div className="p-2"><Skeleton className="h-8 w-full" /></div>
              ) : (
                filteredAlumnos.map((alumno) => (
                  <SelectItem key={alumno.id} value={alumno.id}>
                    {alumno.nombre}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <SearchInput
          value={searchAlumno}
          onChange={setSearchAlumno}
          placeholder="Buscar por nombre o RUT..."
          className="sm:w-64"
        />
      </div>

      {selectedAlumno && (
        <Card className="overflow-visible">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="font-medium">{selectedAlumno.nombre}</p>
                <p className="text-sm text-muted-foreground font-mono">{selectedAlumno.rut}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-lg font-medium">
            Semana del {format(weekStart, "d MMM", { locale: es })} al {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              data-testid="button-this-week"
            >
              Esta semana
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              data-testid="button-next-week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayClases = clasesForDay(day);
              const isToday = isSameDay(day, new Date());
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-32 p-2 rounded-md border",
                    isToday && "ring-2 ring-primary",
                    isWeekend && "bg-muted/30"
                  )}
                >
                  <div className="text-center mb-2">
                    <p className="text-xs text-muted-foreground capitalize">
                      {format(day, "EEE", { locale: es })}
                    </p>
                    <p className={cn(
                      "text-sm font-medium",
                      isToday && "text-primary"
                    )}>
                      {format(day, "d")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {clasesLoading ? (
                      <Skeleton className="h-8 w-full" />
                    ) : dayClases.length > 0 ? (
                      dayClases.map((clase) => (
                        <div
                          key={clase.id}
                          className="p-1.5 rounded bg-primary/10 text-xs"
                          data-testid={`clase-alumno-${clase.id}`}
                        >
                          <p className="font-medium truncate">{clase.asignatura}</p>
                          <p className="text-muted-foreground">{clase.horaInicio}</p>
                        </div>
                      ))
                    ) : !selectedAlumnoId ? null : (
                      <p className="text-[10px] text-muted-foreground text-center">Sin clases</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {!selectedAlumnoId && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Selecciona un alumno para ver su programacion de clases</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
