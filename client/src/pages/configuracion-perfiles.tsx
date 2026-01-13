import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Plus, Edit, Shield, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PERMISOS, type Perfil } from "@shared/schema";

const perfilFormSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  descripcion: z.string().optional(),
  permisos: z.array(z.string()).min(1, "Selecciona al menos un permiso"),
});

type PerfilFormData = z.infer<typeof perfilFormSchema>;

const PERMISOS_LABELS: Record<string, { label: string; description: string; group: string }> = {
  ver_calendario_docente: { label: "Ver Calendario Docente", description: "Acceso al calendario de cualquier profesor", group: "Calendario" },
  editar_asistencia: { label: "Editar Asistencia", description: "Modificar registros de asistencia", group: "Calendario" },
  ver_salas: { label: "Ver Salas", description: "Acceso a informacion de salas", group: "Calendario" },
  ver_dispositivos: { label: "Ver Dispositivos", description: "Monitor de dispositivos", group: "Dispositivos" },
  homologar_dispositivos: { label: "Homologar Dispositivos", description: "Cambiar configuracion temporal de dispositivos", group: "Dispositivos" },
  ver_usuarios: { label: "Ver Usuarios", description: "Listado de usuarios del sistema", group: "Usuarios" },
  editar_usuarios: { label: "Editar Usuarios", description: "Modificar datos de usuarios", group: "Usuarios" },
  crear_usuarios: { label: "Crear Usuarios", description: "Crear nuevos usuarios", group: "Usuarios" },
  ver_historial_errores: { label: "Ver Historial Errores", description: "Reportes de errores", group: "Historiales" },
  reportar_errores: { label: "Reportar Errores", description: "Crear reportes de error", group: "Historiales" },
  ver_historial_dispositivos: { label: "Ver Historial Dispositivos", description: "Historial de incidencias de dispositivos", group: "Historiales" },
  gestionar_perfiles: { label: "Gestionar Perfiles", description: "Crear y editar perfiles", group: "Configuracion" },
  exportar_reportes: { label: "Exportar Reportes", description: "Descargar reportes del sistema", group: "General" },
};

export default function ConfiguracionPerfilesPage() {
  const { toast } = useToast();
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: perfiles, isLoading } = useQuery<Perfil[]>({
    queryKey: ["/api/perfiles"],
  });

  const form = useForm<PerfilFormData>({
    resolver: zodResolver(perfilFormSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      permisos: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PerfilFormData) => 
      apiRequest("POST", "/api/perfiles", { ...data, permisos: JSON.stringify(data.permisos) }),
    onSuccess: () => {
      toast({ title: "Perfil creado", description: "El perfil ha sido creado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/perfiles"] });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el perfil", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: PerfilFormData & { id: string }) => 
      apiRequest("PATCH", `/api/perfiles/${data.id}`, { ...data, permisos: JSON.stringify(data.permisos) }),
    onSuccess: () => {
      toast({ title: "Perfil actualizado", description: "Los cambios han sido guardados" });
      queryClient.invalidateQueries({ queryKey: ["/api/perfiles"] });
      setEditingPerfil(null);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el perfil", variant: "destructive" });
    },
  });

  const openEditDialog = (perfil: Perfil) => {
    setEditingPerfil(perfil);
    let permisos: string[] = [];
    try {
      permisos = JSON.parse(perfil.permisos);
    } catch {}
    form.reset({
      nombre: perfil.nombre,
      descripcion: perfil.descripcion || "",
      permisos,
    });
  };

  const onSubmit = (data: PerfilFormData) => {
    if (editingPerfil) {
      updateMutation.mutate({ ...data, id: editingPerfil.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const parsePermisos = (permisosStr: string): string[] => {
    try {
      return JSON.parse(permisosStr);
    } catch {
      return [];
    }
  };

  const groups = Object.entries(PERMISOS_LABELS).reduce((acc, [key, value]) => {
    if (!acc[value.group]) acc[value.group] = [];
    acc[value.group].push({ key, ...value });
    return acc;
  }, {} as Record<string, { key: string; label: string; description: string; group: string }[]>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuracion de Perfiles"
        description="Gestiona los perfiles de administracion y sus permisos"
      >
        <Button onClick={() => { form.reset(); setIsCreateOpen(true); }} data-testid="button-crear-perfil">
          <Plus className="h-4 w-4 mr-2" />
          Crear Perfil
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-5 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-3/4 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : perfiles && perfiles.length > 0 ? (
          perfiles.map((perfil) => {
            const permisos = parsePermisos(perfil.permisos);
            return (
              <Card key={perfil.id} className="overflow-visible" data-testid={`perfil-${perfil.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">{perfil.nombre}</CardTitle>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(perfil)}
                      data-testid={`button-edit-perfil-${perfil.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  {perfil.descripcion && (
                    <CardDescription className="text-xs">
                      {perfil.descripcion}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">Permisos ({permisos.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {permisos.slice(0, 5).map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]"
                      >
                        <Check className="h-2 w-2" />
                        {PERMISOS_LABELS[p]?.label || p}
                      </span>
                    ))}
                    {permisos.length > 5 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{permisos.length - 5} mas
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-16">
              <div className="text-center text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No hay perfiles configurados</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => { form.reset(); setIsCreateOpen(true); }}
                >
                  Crear primer perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isCreateOpen || !!editingPerfil} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditingPerfil(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPerfil ? "Editar Perfil" : "Crear Perfil"}</DialogTitle>
            <DialogDescription>
              {editingPerfil ? "Modifica el nombre y permisos del perfil" : "Define un nuevo perfil de administracion"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Perfil</FormLabel>
                  <FormControl><Input placeholder="Ej: Administrador de Sede" data-testid="input-nombre-perfil" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="descripcion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripcion (opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Describe las responsabilidades de este perfil..." className="resize-none" data-testid="input-descripcion-perfil" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="permisos" render={() => (
                <FormItem>
                  <FormLabel>Permisos</FormLabel>
                  <FormDescription>Selecciona los permisos que tendra este perfil</FormDescription>
                  <div className="space-y-4 mt-2">
                    {Object.entries(groups).map(([group, items]) => (
                      <div key={group} className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{group}</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {items.map((item) => (
                            <FormField
                              key={item.key}
                              control={form.control}
                              name="permisos"
                              render={({ field }) => (
                                <FormItem className="flex items-start space-x-2 space-y-0 rounded-md border p-3">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.key)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, item.key]);
                                        } else {
                                          field.onChange(current.filter((v) => v !== item.key));
                                        }
                                      }}
                                      data-testid={`checkbox-${item.key}`}
                                    />
                                  </FormControl>
                                  <div className="space-y-0.5 leading-none">
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {item.label}
                                    </FormLabel>
                                    <p className="text-xs text-muted-foreground">
                                      {item.description}
                                    </p>
                                  </div>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setEditingPerfil(null); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-guardar-perfil">
                  {(createMutation.isPending || updateMutation.isPending) ? "Guardando..." : "Guardar Perfil"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
