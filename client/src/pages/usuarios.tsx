import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Plus, Edit, UserCheck, UserX } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UsuarioConDetalles, Sede, Perfil, InsertUsuario } from "@shared/schema";

const usuarioFormSchema = z.object({
  rut: z.string().min(1, "RUT es requerido"),
  nombre: z.string().min(1, "Nombre es requerido"),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  password: z.string().min(6, "Minimo 6 caracteres").optional(),
  tipo: z.string().min(1, "Tipo es requerido"),
  perfilId: z.string().optional(),
  sedeId: z.string().optional(),
  timezone: z.string().default("America/Santiago"),
  activo: z.boolean().default(true),
});

type UsuarioFormData = z.infer<typeof usuarioFormSchema>;

export default function UsuariosPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [perfilFilter, setPerfilFilter] = useState<string>("");
  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [editingUser, setEditingUser] = useState<UsuarioConDetalles | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: usuarios, isLoading } = useQuery<UsuarioConDetalles[]>({
    queryKey: ["/api/usuarios"],
  });

  const { data: sedes } = useQuery<Sede[]>({
    queryKey: ["/api/sedes"],
  });

  const { data: perfiles } = useQuery<Perfil[]>({
    queryKey: ["/api/perfiles"],
  });

  const form = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioFormSchema),
    defaultValues: {
      rut: "",
      nombre: "",
      email: "",
      password: "",
      tipo: "alumno",
      perfilId: "",
      sedeId: "",
      timezone: "America/Santiago",
      activo: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: UsuarioFormData) => apiRequest("POST", "/api/usuarios", data),
    onSuccess: () => {
      toast({ title: "Usuario creado", description: "El usuario ha sido creado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear el usuario", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UsuarioFormData & { id: string }) => 
      apiRequest("PATCH", `/api/usuarios/${data.id}`, data),
    onSuccess: () => {
      toast({ title: "Usuario actualizado", description: "Los cambios han sido guardados" });
      queryClient.invalidateQueries({ queryKey: ["/api/usuarios"] });
      setEditingUser(null);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el usuario", variant: "destructive" });
    },
  });

  const filteredUsuarios = useMemo(() => {
    if (!usuarios) return [];
    return usuarios.filter((u) => {
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !u.nombre.toLowerCase().includes(searchLower) &&
          !u.rut.toLowerCase().includes(searchLower) &&
          !(u.email?.toLowerCase().includes(searchLower))
        ) {
          return false;
        }
      }
      if (tipoFilter && u.tipo !== tipoFilter) return false;
      if (perfilFilter && u.perfilId !== perfilFilter) return false;
      if (estadoFilter === "activo" && !u.activo) return false;
      if (estadoFilter === "inactivo" && u.activo) return false;
      return true;
    });
  }, [usuarios, search, tipoFilter, perfilFilter, estadoFilter]);

  const stats = useMemo(() => {
    if (!usuarios) return { total: 0, profesores: 0, alumnos: 0, activos: 0 };
    return {
      total: usuarios.length,
      profesores: usuarios.filter((u) => u.tipo === "profesor").length,
      alumnos: usuarios.filter((u) => u.tipo === "alumno").length,
      activos: usuarios.filter((u) => u.activo).length,
    };
  }, [usuarios]);

  const openEditDialog = (user: UsuarioConDetalles) => {
    setEditingUser(user);
    form.reset({
      rut: user.rut,
      nombre: user.nombre,
      email: user.email || "",
      password: "",
      tipo: user.tipo,
      perfilId: user.perfilId || "",
      sedeId: user.sedeId || "",
      timezone: user.timezone,
      activo: user.activo,
    });
  };

  const onSubmit = (data: UsuarioFormData) => {
    if (editingUser) {
      updateMutation.mutate({ ...data, id: editingUser.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns: Column<UsuarioConDetalles>[] = [
    {
      key: "nombre",
      header: "Nombre",
      render: (u) => (
        <div>
          <p className="font-medium">{u.nombre}</p>
          <p className="text-xs text-muted-foreground font-mono">{u.rut}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (u) => <span className="text-sm">{u.email || "-"}</span>,
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (u) => <StatusBadge status={u.tipo} />,
    },
    {
      key: "perfil",
      header: "Perfil",
      render: (u) => <span className="text-sm">{u.perfil?.nombre || "-"}</span>,
    },
    {
      key: "sede",
      header: "Sede",
      render: (u) => <span className="text-sm">{u.sede?.nombre || "-"}</span>,
    },
    {
      key: "activo",
      header: "Estado",
      render: (u) => (
        u.activo ? (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm">
            <UserCheck className="h-3 w-3" /> Activo
          </span>
        ) : (
          <span className="flex items-center gap-1 text-slate-500 text-sm">
            <UserX className="h-3 w-3" /> Inactivo
          </span>
        )
      ),
    },
    {
      key: "acciones",
      header: "",
      className: "w-12",
      render: (u) => (
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); openEditDialog(u); }}
          data-testid={`button-edit-${u.id}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const activeFilters = useMemo(() => {
    const filters = [];
    if (tipoFilter) filters.push({ key: "tipo", label: "Tipo", value: tipoFilter });
    if (perfilFilter) {
      const perfil = perfiles?.find((p) => p.id === perfilFilter);
      filters.push({ key: "perfil", label: "Perfil", value: perfil?.nombre || perfilFilter });
    }
    if (estadoFilter) filters.push({ key: "estado", label: "Estado", value: estadoFilter });
    return filters;
  }, [tipoFilter, perfilFilter, estadoFilter, perfiles]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestiona profesores y alumnos del sistema"
      >
        <Button onClick={() => { form.reset(); setIsCreateOpen(true); }} data-testid="button-crear-usuario">
          <Plus className="h-4 w-4 mr-2" />
          Crear Usuario
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Usuarios" value={stats.total} icon={<Users className="h-4 w-4" />} />
        <StatsCard title="Profesores" value={stats.profesores} />
        <StatsCard title="Alumnos" value={stats.alumnos} />
        <StatsCard title="Activos" value={stats.activos} />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <FilterBar
            activeFilters={activeFilters}
            onClearFilter={(key) => {
              if (key === "tipo") setTipoFilter("");
              if (key === "perfil") setPerfilFilter("");
              if (key === "estado") setEstadoFilter("");
            }}
            onClearAll={() => { setTipoFilter(""); setPerfilFilter(""); setEstadoFilter(""); }}
          >
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nombre, RUT, email..."
              className="w-full sm:w-64"
            />
            <Select value={tipoFilter || "__all__"} onValueChange={(v) => setTipoFilter(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-40" data-testid="filter-tipo">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                <SelectItem value="profesor">Profesor</SelectItem>
                <SelectItem value="alumno">Alumno</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={perfilFilter || "__all__"} onValueChange={(v) => setPerfilFilter(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-40" data-testid="filter-perfil">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {perfiles?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={estadoFilter || "__all__"} onValueChange={(v) => setEstadoFilter(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-36" data-testid="filter-estado">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredUsuarios}
            isLoading={isLoading}
            emptyMessage="No se encontraron usuarios"
            rowKey={(u) => u.id}
          />
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen || !!editingUser} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditingUser(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Modifica los datos del usuario" : "Ingresa los datos del nuevo usuario"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="rut" render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT</FormLabel>
                  <FormControl><Input placeholder="12.345.678-9" data-testid="input-rut" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl><Input placeholder="Juan Perez" data-testid="input-nombre" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (opcional)</FormLabel>
                  <FormControl><Input type="email" placeholder="correo@ejemplo.com" data-testid="input-email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {!editingUser && (
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrasena</FormLabel>
                    <FormControl><Input type="password" placeholder="Minimo 6 caracteres" data-testid="input-password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-tipo"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="alumno">Alumno</SelectItem>
                        <SelectItem value="profesor">Profesor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="perfilId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-perfil"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {perfiles?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="sedeId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sede</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-sede"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {sedes?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {editingUser && (
                <FormField control={form.control} name="activo" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel className="text-sm font-normal">Usuario Activo</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-activo" />
                    </FormControl>
                  </FormItem>
                )} />
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setEditingUser(null); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-guardar">
                  {(createMutation.isPending || updateMutation.isPending) ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
