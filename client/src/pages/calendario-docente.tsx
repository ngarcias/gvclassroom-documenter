import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, MapPin, Users, Check, X, AlertCircle, GraduationCap } from "lucide-react";
import { GVPageLayout, GVFilterSection, GVFilterField, GVContentSection } from "@/components/ui/gv-page-layout";
import { GVDataTable, GVColumn } from "@/components/ui/gv-data-table";
import { GVDateRangePicker } from "@/components/ui/gv-date-range-picker";
import { GVSearchSelect } from "@/components/ui/gv-search-select";
import { GVModal } from "@/components/ui/gv-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Usuario } from "@shared/schema";
import { PERMISOS } from "@shared/schema";

interface MarcajeConAlumno {
  id: string;
  claseId: string;
  alumnoId: string;
  fechaHora: string;
  estado: string;
  tipoMarcaje: string;
  modificadoPor: string | null;
  alumno: {
    id: string;
    nombre: string;
    rut: string;
  };
  dispositivo?: {
    id: string;
    serialNumber: string;
  } | null;
}

interface ClaseDetallada {
  id: string;
  codigo: string;
  asignatura: string;
  profesorId: string;
  salaId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  profesor: {
    id: string;
    nombre: string;
    rut: string;
    email: string | null;
  };
  sala: {
    id: string;
    nombre: string;
    codigo: string;
    sede: {
      id: string;
      nombre: string;
    };
  };
  inscripciones: Array<{
    id: string;
    alumno: {
      id: string;
      nombre: string;
      rut: string;
    };
  }>;
  marcajes: MarcajeConAlumno[];
}

interface ClaseLista {
  id: string;
  asignatura: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  profesor?: { nombre: string } | null;
  sala?: { nombre: string; sede?: { nombre: string } } | null;
  marcajes?: Array<{ estado: string }>;
}

const ESTADOS_MARCAJE = [
  { value: "PRESENTE", label: "Presente" },
  { value: "AUSENTE", label: "Ausente" },
  { value: "TARDANZA", label: "Tardanza" },
  { value: "JUSTIFICADO", label: "Justificado" },
];

export default function CalendarioDocentePage() {
  const { hasPermission, user } = useAuth();
  const { toast } = useToast();
  
  const [selectedProfesorId, setSelectedProfesorId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [dateTo, setDateTo] = useState<Date>(endOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedClaseId, setSelectedClaseId] = useState<string | null>(null);
  const [editingMarcajeId, setEditingMarcajeId] = useState<string | null>(null);
  const [editingEstado, setEditingEstado] = useState<string>("");

  const canEditAttendance = hasPermission(PERMISOS.EDITAR_ASISTENCIA) || user?.tipo === "SUPER_ADMIN";

  const { data: profesores = [], isLoading: profesoresLoading } = useQuery<Usuario[]>({
    queryKey: ["/api/usuarios", { tipo: "profesor" }],
    queryFn: async () => {
      const res = await fetch("/api/usuarios?tipo=profesor");
      if (!res.ok) throw new Error("Error fetching profesores");
      return res.json();
    },
  });

  const clasesQueryUrl = selectedProfesorId 
    ? `/api/clases?profesorId=${selectedProfesorId}&desde=${format(dateFrom, "yyyy-MM-dd")}&hasta=${format(dateTo, "yyyy-MM-dd")}`
    : null;

  const { data: clases = [], isLoading: clasesLoading } = useQuery<ClaseLista[]>({
    queryKey: ["/api/clases", { profesorId: selectedProfesorId, desde: format(dateFrom, "yyyy-MM-dd"), hasta: format(dateTo, "yyyy-MM-dd") }],
    queryFn: async () => {
      if (!clasesQueryUrl) return [];
      const res = await fetch(clasesQueryUrl);
      if (!res.ok) throw new Error("Error fetching clases");
      return res.json();
    },
    enabled: !!selectedProfesorId,
  });

  const { data: claseDetalle, isLoading: detalleLoading } = useQuery<ClaseDetallada>({
    queryKey: ["/api/clases", selectedClaseId],
    queryFn: async () => {
      const res = await fetch(`/api/clases/${selectedClaseId}`);
      if (!res.ok) throw new Error("Error fetching clase detalle");
      return res.json();
    },
    enabled: !!selectedClaseId,
  });

  const updateMarcajeMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const response = await apiRequest("PATCH", `/api/marcajes/${id}`, { estado });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Marcaje actualizado",
        description: "El estado de asistencia ha sido modificado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clases", selectedClaseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/clases", { profesorId: selectedProfesorId }] });
      setEditingMarcajeId(null);
      setEditingEstado("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el marcaje",
        variant: "destructive",
      });
    },
  });

  const handleEditMarcaje = (marcaje: MarcajeConAlumno) => {
    setEditingMarcajeId(marcaje.id);
    setEditingEstado(marcaje.estado);
  };

  const originalMarcajeEstado = claseDetalle?.marcajes.find(m => m.id === editingMarcajeId)?.estado;
  const canSaveMarcaje = editingMarcajeId && editingEstado && editingEstado !== originalMarcajeEstado;

  const handleSaveMarcaje = () => {
    if (canSaveMarcaje) {
      updateMarcajeMutation.mutate({ id: editingMarcajeId, estado: editingEstado });
    }
  };

  const handleCancelEdit = () => {
    setEditingMarcajeId(null);
    setEditingEstado("");
  };

  const handleCloseModal = () => {
    setSelectedClaseId(null);
    handleCancelEdit();
  };

  const getEstadoLabel = (estado: string) => {
    const found = ESTADOS_MARCAJE.find(e => e.value === estado);
    return found?.label || estado;
  };

  const countMarcajes = (marcajes?: Array<{ estado: string }>) => {
    if (!marcajes || marcajes.length === 0) return { total: 0, presentes: 0, ausentes: 0 };
    const presentes = marcajes.filter(m => m.estado === "PRESENTE" || m.estado === "TARDANZA").length;
    const ausentes = marcajes.filter(m => m.estado === "AUSENTE").length;
    return { total: marcajes.length, presentes, ausentes };
  };

  const columns: GVColumn<ClaseLista>[] = useMemo(() => [
    {
      key: "fecha",
      header: "Fecha",
      sortable: true,
      render: (clase) => (
        <span className="font-medium">
          {format(new Date(clase.fecha), "EEE dd/MM", { locale: es })}
        </span>
      ),
    },
    {
      key: "asignatura",
      header: "Asignatura",
      sortable: true,
    },
    {
      key: "horario",
      header: "Horario",
      render: (clase) => (
        <span className="text-muted-foreground">
          {clase.horaInicio} - {clase.horaFin}
        </span>
      ),
    },
    {
      key: "sala",
      header: "Sala",
      render: (clase) => (
        <div>
          <span>{clase.sala?.nombre || "Sin sala"}</span>
          {clase.sala?.sede && (
            <span className="text-xs text-muted-foreground ml-1">
              ({clase.sala.sede.nombre})
            </span>
          )}
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (clase) => <StatusBadge status={clase.estado.toLowerCase()} />,
    },
    {
      key: "asistencia",
      header: "Asistencia",
      className: "text-center",
      render: (clase) => {
        const stats = countMarcajes(clase.marcajes);
        if (stats.total === 0) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="flex items-center justify-center gap-1 text-sm">
            <span className="text-emerald-600 font-medium">{stats.presentes}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-red-600 font-medium">{stats.ausentes}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{stats.total}</span>
          </div>
        );
      },
    },
    {
      key: "acciones",
      header: "",
      className: "text-right w-24",
      render: (clase) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedClaseId(clase.id);
          }}
          data-testid={`button-view-clase-${clase.id}`}
        >
          Ver detalle
        </Button>
      ),
    },
  ], []);

  return (
    <GVPageLayout
      title="Calendario Docente"
      subtitle="Buscar clases por profesor y rango de fechas, ver y editar asistencia"
    >
      <GVFilterSection>
        <GVFilterField label="Profesor" className="min-w-[280px]">
          <GVSearchSelect
            items={profesores}
            value={selectedProfesorId}
            onChange={setSelectedProfesorId}
            getItemValue={(p) => p.id}
            getItemLabel={(p) => p.nombre}
            getItemSubLabel={(p) => p.rut}
            placeholder="Seleccionar profesor..."
            searchPlaceholder="Buscar por nombre o RUT..."
            isLoading={profesoresLoading}
            testId="profesor"
          />
        </GVFilterField>

        <GVFilterField label="Rango de fechas">
          <GVDateRangePicker
            from={dateFrom}
            to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
          />
        </GVFilterField>
      </GVFilterSection>

      <GVContentSection
        title="Clases encontradas"
        actions={
          clases.length > 0 && (
            <Badge variant="secondary">{clases.length} clases</Badge>
          )
        }
      >
        {!selectedProfesorId ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <GraduationCap className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Selecciona un profesor</p>
            <p className="text-sm mt-1">Usa el selector de arriba para buscar clases</p>
          </div>
        ) : (
          <GVDataTable
            columns={columns}
            data={clases}
            isLoading={clasesLoading}
            rowKey={(clase) => clase.id}
            onRowClick={(clase) => setSelectedClaseId(clase.id)}
            emptyMessage="No hay clases en el rango de fechas seleccionado"
            emptyIcon={<AlertCircle className="h-12 w-12" />}
            striped
          />
        )}
      </GVContentSection>

      <GVModal
        open={!!selectedClaseId}
        onClose={handleCloseModal}
        title={claseDetalle?.asignatura || "Detalle de Clase"}
        description={claseDetalle ? format(new Date(claseDetalle.fecha), "EEEE d 'de' MMMM yyyy", { locale: es }) : undefined}
        size="lg"
      >
        {detalleLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : claseDetalle ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Horario</p>
                <p className="font-medium flex items-center gap-1.5 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {claseDetalle.horaInicio} - {claseDetalle.horaFin}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Sala</p>
                <p className="font-medium flex items-center gap-1.5 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {claseDetalle.sala?.nombre}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Sede</p>
                <p className="font-medium mt-1">{claseDetalle.sala?.sede?.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Estado</p>
                <div className="mt-1">
                  <StatusBadge status={claseDetalle.estado.toLowerCase()} />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Lista de Asistencia ({claseDetalle.marcajes.length} registros)
                </h4>
                {!canEditAttendance && (
                  <Badge variant="outline" className="text-xs">
                    Solo lectura
                  </Badge>
                )}
              </div>

              {claseDetalle.marcajes.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold text-xs uppercase">Alumno</TableHead>
                        <TableHead className="font-semibold text-xs uppercase">RUT</TableHead>
                        <TableHead className="font-semibold text-xs uppercase">Estado</TableHead>
                        <TableHead className="font-semibold text-xs uppercase">Tipo</TableHead>
                        {canEditAttendance && <TableHead className="font-semibold text-xs uppercase text-right">Editar</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claseDetalle.marcajes.map((marcaje) => (
                        <TableRow key={marcaje.id} data-testid={`row-marcaje-${marcaje.id}`}>
                          <TableCell className="font-medium">
                            {marcaje.alumno?.nombre || "Alumno desconocido"}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {marcaje.alumno?.rut || "-"}
                          </TableCell>
                          <TableCell>
                            {editingMarcajeId === marcaje.id ? (
                              <Select value={editingEstado} onValueChange={setEditingEstado}>
                                <SelectTrigger className="w-32 h-8" data-testid={`select-estado-${marcaje.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ESTADOS_MARCAJE.map((estado) => (
                                    <SelectItem key={estado.value} value={estado.value}>
                                      {estado.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "font-medium",
                                  marcaje.estado === "PRESENTE" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
                                  marcaje.estado === "AUSENTE" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                                  marcaje.estado === "TARDANZA" && "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                                  marcaje.estado === "JUSTIFICADO" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                )}
                              >
                                {getEstadoLabel(marcaje.estado)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "text-xs font-medium",
                              marcaje.tipoMarcaje === "MANUAL" ? "text-orange-600" : "text-muted-foreground"
                            )}>
                              {marcaje.tipoMarcaje === "MANUAL" ? "Manual" : "Auto"}
                            </span>
                          </TableCell>
                          {canEditAttendance && (
                            <TableCell className="text-right">
                              {editingMarcajeId === marcaje.id ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleSaveMarcaje}
                                    disabled={updateMarcajeMutation.isPending || !canSaveMarcaje}
                                    data-testid={`button-save-marcaje-${marcaje.id}`}
                                  >
                                    <Check className={cn("h-4 w-4", canSaveMarcaje ? "text-emerald-600" : "text-muted-foreground")} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleCancelEdit}
                                    data-testid={`button-cancel-marcaje-${marcaje.id}`}
                                  >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditMarcaje(marcaje)}
                                  data-testid={`button-edit-marcaje-${marcaje.id}`}
                                >
                                  Editar
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No hay registros de asistencia para esta clase</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </GVModal>
    </GVPageLayout>
  );
}
