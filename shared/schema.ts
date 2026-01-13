import { z } from "zod";

export const TipoUsuario = {
  PROFESOR: "profesor",
  ALUMNO: "alumno",
  ADMIN: "admin",
} as const;

export const EstadoClase = {
  ACTIVA: "activa",
  CANCELADA: "cancelada",
  COMPLETADA: "completada",
} as const;

export const EstadoMarcaje = {
  PRESENTE: "presente",
  AUSENTE: "ausente",
  TARDANZA: "tardanza",
  JUSTIFICADO: "justificado",
} as const;

export const TipoMarcaje = {
  AUTOMATICO: "automatico",
  MANUAL: "manual",
} as const;

export const EstadoDispositivo = {
  CONECTADO: "conectado",
  DESCONECTADO: "desconectado",
  ADVERTENCIA: "advertencia",
} as const;

export const TipoDispositivo = {
  TABLET: "tablet",
  PDA: "pda",
} as const;

export const EstadoResolucion = {
  PENDIENTE: "pendiente",
  RESUELTO: "resuelto",
  EN_PROCESO: "en_proceso",
} as const;

export const sedeSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  timezone: z.string().default("America/Santiago"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertSedeSchema = sedeSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSede = z.infer<typeof insertSedeSchema>;
export type Sede = z.infer<typeof sedeSchema>;

export const salaSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  sedeId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertSalaSchema = salaSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSala = z.infer<typeof insertSalaSchema>;
export type Sala = z.infer<typeof salaSchema>;

export const perfilSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1),
  descripcion: z.string().nullable(),
  permisos: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertPerfilSchema = perfilSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPerfil = z.infer<typeof insertPerfilSchema>;
export type Perfil = z.infer<typeof perfilSchema>;

export const usuarioSchema = z.object({
  id: z.string().uuid(),
  rut: z.string().min(1),
  nombre: z.string().min(1),
  email: z.string().email().nullable(),
  password: z.string().min(6),
  tipo: z.string(),
  perfilId: z.string().uuid().nullable(),
  sedeId: z.string().uuid().nullable(),
  timezone: z.string().default("America/Santiago"),
  activo: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertUsuarioSchema = usuarioSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
export type Usuario = z.infer<typeof usuarioSchema>;

export const claseSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string().min(1),
  asignatura: z.string().min(1),
  profesorId: z.string().uuid(),
  salaId: z.string().uuid(),
  fecha: z.date(),
  horaInicio: z.string(),
  horaFin: z.string(),
  estado: z.string().default("activa"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertClaseSchema = claseSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClase = z.infer<typeof insertClaseSchema>;
export type Clase = z.infer<typeof claseSchema>;

export const inscripcionSchema = z.object({
  id: z.string().uuid(),
  claseId: z.string().uuid(),
  alumnoId: z.string().uuid(),
  createdAt: z.date(),
});

export const insertInscripcionSchema = inscripcionSchema.omit({ id: true, createdAt: true });
export type InsertInscripcion = z.infer<typeof insertInscripcionSchema>;
export type Inscripcion = z.infer<typeof inscripcionSchema>;

export const marcajeSchema = z.object({
  id: z.string().uuid(),
  claseId: z.string().uuid(),
  alumnoId: z.string().uuid(),
  fechaHora: z.date(),
  estado: z.string(),
  tipoMarcaje: z.string().default("automatico"),
  modificadoPor: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertMarcajeSchema = marcajeSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMarcaje = z.infer<typeof insertMarcajeSchema>;
export type Marcaje = z.infer<typeof marcajeSchema>;

export const dispositivoSchema = z.object({
  id: z.string().uuid(),
  serialNumber: z.string().min(1),
  tipo: z.string(),
  salaId: z.string().uuid().nullable(),
  sedeId: z.string().uuid().nullable(),
  versionApp: z.string().nullable(),
  bateria: z.number().int().min(0).max(100).nullable(),
  estadoConexion: z.string().default("desconectado"),
  ultimaConexion: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertDispositivoSchema = dispositivoSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDispositivo = z.infer<typeof insertDispositivoSchema>;
export type Dispositivo = z.infer<typeof dispositivoSchema>;

export const incidenciaDispositivoSchema = z.object({
  id: z.string().uuid(),
  dispositivoId: z.string().uuid(),
  tipoIncidencia: z.string(),
  descripcion: z.string().nullable(),
  sedeOriginal: z.string().nullable(),
  salaOriginal: z.string().nullable(),
  sedeHomologada: z.string().nullable(),
  salaHomologada: z.string().nullable(),
  estadoResolucion: z.string().default("pendiente"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertIncidenciaDispositivoSchema = incidenciaDispositivoSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIncidenciaDispositivo = z.infer<typeof insertIncidenciaDispositivoSchema>;
export type IncidenciaDispositivo = z.infer<typeof incidenciaDispositivoSchema>;

export const reporteErrorSchema = z.object({
  id: z.string().uuid(),
  profesorId: z.string().uuid(),
  salaId: z.string().nullable(),
  sedeId: z.string().nullable(),
  fecha: z.date(),
  comentario: z.string().min(1),
  estado: z.string().default("pendiente"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertReporteErrorSchema = reporteErrorSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReporteError = z.infer<typeof insertReporteErrorSchema>;
export type ReporteError = z.infer<typeof reporteErrorSchema>;

export const loginSchema = z.object({
  rut: z.string().min(1, "RUT es requerido"),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
});

export type LoginData = z.infer<typeof loginSchema>;

export interface ClaseConDetalles extends Clase {
  profesor?: Usuario;
  sala?: Sala & { sede?: Sede };
  inscripciones?: (Inscripcion & { alumno?: Usuario })[];
  marcajes?: Marcaje[];
}

export interface DispositivoConDetalles extends Dispositivo {
  sala?: Sala;
  sede?: Sede;
  incidencias?: IncidenciaDispositivo[];
}

export interface UsuarioConDetalles extends Usuario {
  perfil?: Perfil;
  sede?: Sede;
}

export const PERMISOS = {
  VER_CALENDARIO_DOCENTE: "ver_calendario_docente",
  EDITAR_ASISTENCIA: "editar_asistencia",
  VER_SALAS: "ver_salas",
  VER_DISPOSITIVOS: "ver_dispositivos",
  HOMOLOGAR_DISPOSITIVOS: "homologar_dispositivos",
  VER_USUARIOS: "ver_usuarios",
  EDITAR_USUARIOS: "editar_usuarios",
  CREAR_USUARIOS: "crear_usuarios",
  VER_HISTORIAL_ERRORES: "ver_historial_errores",
  REPORTAR_ERRORES: "reportar_errores",
  VER_HISTORIAL_DISPOSITIVOS: "ver_historial_dispositivos",
  GESTIONAR_PERFILES: "gestionar_perfiles",
  EXPORTAR_REPORTES: "exportar_reportes",
} as const;

export type Permiso = typeof PERMISOS[keyof typeof PERMISOS];
