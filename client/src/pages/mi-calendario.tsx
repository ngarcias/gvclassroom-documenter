import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, MapPin, Users, Edit, CheckCircle, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import type { ClaseConDetalles } from "@shared/schema";

export default function MiCalendarioPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedClase, setSelectedClase] = useState<ClaseConDetalles | null>(null);

  const { data: clases, isLoading } = useQuery<ClaseConDetalles[]>({
    queryKey: ["/api/clases/mis-clases", {
      desde: format(startOfMonth(currentMonth), "yyyy-MM-dd"),
      hasta: format(endOfMonth(currentMonth), "yyyy-MM-dd"),
    }],
    enabled: !!user,
  });

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const clasesForDay = (day: Date) => {
    if (!clases) return [];
    return clases.filter((c) => isSameDay(new Date(c.fecha), day));
  };

  const selectedDayClases = selectedDate ? clasesForDay(selectedDate) : [];

  const totalClasesHoy = selectedDayClases.length;
  const clasesCompletadas = selectedDayClases.filter(c => c.estado === "completada").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Calendario"
        description={`Tus clases programadas, ${user?.nombre || "Profesor"}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalClasesHoy}</p>
                <p className="text-xs text-muted-foreground">Clases hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clasesCompletadas}</p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalClasesHoy - clasesCompletadas}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-lg font-medium capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDate(new Date());
                }}
                data-testid="button-today"
              >
                Hoy
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: (new Date(daysInMonth[0]).getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map((day) => {
                const dayClases = clasesForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square p-1 rounded-md text-sm relative hover-elevate",
                      !isSameMonth(day, currentMonth) && "text-muted-foreground opacity-50",
                      isToday && "bg-primary/10 font-semibold",
                      isSelected && "ring-2 ring-primary"
                    )}
                    data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                  >
                    <span className="block">{format(day, "d")}</span>
                    {dayClases.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                        <div className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                          {dayClases.length}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {selectedDate
                ? format(selectedDate, "EEEE d", { locale: es })
                : "Selecciona un dia"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : selectedDayClases.length > 0 ? (
              <div className="space-y-3">
                {selectedDayClases.map((clase) => (
                  <div
                    key={clase.id}
                    className="p-3 rounded-md border hover-elevate cursor-pointer"
                    onClick={() => setSelectedClase(clase)}
                    data-testid={`mi-clase-${clase.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{clase.asignatura}</p>
                      <StatusBadge status={clase.estado} />
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {clase.horaInicio} - {clase.horaFin}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {clase.sala?.nombre || "Sin sala"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tienes clases programadas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedClase} onOpenChange={() => setSelectedClase(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedClase?.asignatura}</DialogTitle>
            <DialogDescription>
              {selectedClase && format(new Date(selectedClase.fecha), "EEEE d 'de' MMMM", { locale: es })}
            </DialogDescription>
          </DialogHeader>
          {selectedClase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Horario</p>
                  <p className="font-medium">{selectedClase.horaInicio} - {selectedClase.horaFin}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sala</p>
                  <p className="font-medium">{selectedClase.sala?.nombre || "Sin sala"}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Asistencia ({selectedClase.inscripciones?.length || 0} alumnos)
                  </h4>
                  <Button size="sm" data-testid="button-pasar-asistencia">
                    <Edit className="h-3 w-3 mr-1" />
                    Pasar Asistencia
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Haz clic en "Pasar Asistencia" para registrar la asistencia de los alumnos
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
