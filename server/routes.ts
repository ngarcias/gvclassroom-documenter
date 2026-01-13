import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.SESSION_SECRET || "gvclassroom-secret-key";

const loginSchema = z.object({
  rut: z.string().min(1, "RUT es requerido"),
  password: z.string().min(1, "Contrasena es requerida"),
});

const usuarioSchema = z.object({
  rut: z.string().min(1),
  nombre: z.string().min(1),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6).optional(),
  tipo: z.string().min(1),
  perfilId: z.string().optional().nullable(),
  sedeId: z.string().optional().nullable(),
  timezone: z.string().default("America/Santiago"),
  activo: z.boolean().default(true),
});

const perfilSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional().nullable(),
  permisos: z.string(),
});

const homologarSchema = z.object({
  sedeId: z.string().min(1),
  salaId: z.string().min(1),
});

interface AuthRequest extends Request {
  user?: { id: string; tipo: string };
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; tipo: string };
    req.user = decoded;
  } catch {
  }
  next();
}

function handleError(res: Response, error: unknown, defaultMessage: string) {
  console.error(defaultMessage, error);
  if (error instanceof z.ZodError) {
    return res.status(400).json({ 
      error: "Datos invalidos", 
      details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
    });
  }
  res.status(500).json({ error: defaultMessage });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use(authMiddleware);

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const usuario = await prisma.usuario.findUnique({
        where: { rut: data.rut },
        include: { perfil: true, sede: true },
      });

      if (!usuario) {
        return res.status(401).json({ error: "RUT o contrasena incorrectos" });
      }

      const validPassword = await bcrypt.compare(data.password, usuario.password);
      if (!validPassword) {
        return res.status(401).json({ error: "RUT o contrasena incorrectos" });
      }

      if (!usuario.activo) {
        return res.status(403).json({ error: "Usuario desactivado" });
      }

      const token = jwt.sign({ id: usuario.id, tipo: usuario.tipo }, JWT_SECRET, { expiresIn: "7d" });
      const { password: _, ...userWithoutPassword } = usuario;
      
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      handleError(res, error, "Error de autenticacion");
    }
  });

  app.get("/api/dashboard/stats", async (_req: Request, res: Response) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [totalUsuarios, usuariosActivos, totalDispositivos, dispositivosConectados, clasesHoy, incidenciasPendientes] = await Promise.all([
        prisma.usuario.count(),
        prisma.usuario.count({ where: { activo: true } }),
        prisma.dispositivo.count(),
        prisma.dispositivo.count({ where: { estadoConexion: "conectado" } }),
        prisma.clase.count({
          where: {
            fecha: { gte: today, lt: tomorrow },
          },
        }),
        prisma.incidenciaDispositivo.count({ where: { estadoResolucion: "pendiente" } }),
      ]);

      res.json({ totalUsuarios, usuariosActivos, totalDispositivos, dispositivosConectados, clasesHoy, incidenciasPendientes });
    } catch (error) {
      handleError(res, error, "Error al obtener estadisticas");
    }
  });

  app.get("/api/dashboard/clases-recientes", async (_req: Request, res: Response) => {
    try {
      const clases = await prisma.clase.findMany({
        take: 5,
        orderBy: { fecha: "desc" },
        include: {
          profesor: { select: { nombre: true } },
          sala: { select: { nombre: true } },
        },
      });

      res.json(clases.map(c => ({
        id: c.id,
        asignatura: c.asignatura,
        profesor: c.profesor?.nombre || "Sin profesor",
        sala: c.sala?.nombre || "Sin sala",
        horaInicio: c.horaInicio,
        horaFin: c.horaFin,
        estado: c.estado,
      })));
    } catch (error) {
      handleError(res, error, "Error al obtener clases recientes");
    }
  });

  app.get("/api/sedes", async (_req: Request, res: Response) => {
    try {
      const sedes = await prisma.sede.findMany({ orderBy: { nombre: "asc" } });
      res.json(sedes);
    } catch (error) {
      handleError(res, error, "Error al obtener sedes");
    }
  });

  app.get("/api/salas", async (req: Request, res: Response) => {
    try {
      const { sedeId } = req.query;
      const salas = await prisma.sala.findMany({
        where: sedeId ? { sedeId: sedeId as string } : undefined,
        include: { sede: true },
        orderBy: { nombre: "asc" },
      });
      res.json(salas);
    } catch (error) {
      handleError(res, error, "Error al obtener salas");
    }
  });

  app.get("/api/usuarios", async (req: Request, res: Response) => {
    try {
      const { tipo } = req.query;
      const tipoUpper = tipo ? (tipo as string).toUpperCase() : undefined;
      const validRoles = ["SUPER_ADMIN", "SOPORTE", "PROFESOR", "ALUMNO", "VISUALIZADOR"];
      
      const usuarios = await prisma.usuario.findMany({
        where: tipoUpper && validRoles.includes(tipoUpper) 
          ? { tipo: tipoUpper as "SUPER_ADMIN" | "SOPORTE" | "PROFESOR" | "ALUMNO" | "VISUALIZADOR" } 
          : undefined,
        include: { perfil: true, sede: true },
        orderBy: { nombre: "asc" },
      });

      res.json(usuarios.map(({ password, ...u }) => u));
    } catch (error) {
      handleError(res, error, "Error al obtener usuarios");
    }
  });

  app.post("/api/usuarios", async (req: Request, res: Response) => {
    try {
      const data = usuarioSchema.parse(req.body);
      
      if (!data.password) {
        return res.status(400).json({ error: "Contrasena es requerida" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      const usuario = await prisma.usuario.create({
        data: {
          rut: data.rut,
          nombre: data.nombre,
          email: data.email || null,
          password: hashedPassword,
          tipo: data.tipo,
          perfilId: data.perfilId || null,
          sedeId: data.sedeId || null,
          timezone: data.timezone,
          activo: data.activo,
        },
        include: { perfil: true, sede: true },
      });

      const { password: _, ...result } = usuario;
      res.status(201).json(result);
    } catch (error) {
      handleError(res, error, "Error al crear usuario");
    }
  });

  app.patch("/api/usuarios/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = usuarioSchema.partial().parse(req.body);
      
      const updateData: Record<string, unknown> = { ...data };
      
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      } else {
        delete updateData.password;
      }

      const usuario = await prisma.usuario.update({
        where: { id },
        data: updateData,
        include: { perfil: true, sede: true },
      });

      const { password: _, ...result } = usuario;
      res.json(result);
    } catch (error) {
      handleError(res, error, "Error al actualizar usuario");
    }
  });

  app.get("/api/perfiles", async (_req: Request, res: Response) => {
    try {
      const perfiles = await prisma.perfil.findMany({ orderBy: { nombre: "asc" } });
      res.json(perfiles);
    } catch (error) {
      handleError(res, error, "Error al obtener perfiles");
    }
  });

  app.post("/api/perfiles", async (req: Request, res: Response) => {
    try {
      const data = perfilSchema.parse(req.body);
      const perfil = await prisma.perfil.create({ data });
      res.status(201).json(perfil);
    } catch (error) {
      handleError(res, error, "Error al crear perfil");
    }
  });

  app.patch("/api/perfiles/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = perfilSchema.partial().parse(req.body);
      const perfil = await prisma.perfil.update({ where: { id }, data });
      res.json(perfil);
    } catch (error) {
      handleError(res, error, "Error al actualizar perfil");
    }
  });

  app.get("/api/clases", async (req: Request, res: Response) => {
    try {
      const { profesorId, salaId, fecha, desde, hasta, estado } = req.query;
      
      const whereClause: Record<string, unknown> = {};
      if (profesorId) whereClause.profesorId = profesorId;
      if (salaId) whereClause.salaId = salaId;
      if (estado) whereClause.estado = estado;
      
      if (fecha) {
        const date = new Date(fecha as string);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        whereClause.fecha = { gte: date, lt: nextDay };
      } else if (desde && hasta) {
        whereClause.fecha = {
          gte: new Date(desde as string),
          lte: new Date(hasta as string),
        };
      }

      const clases = await prisma.clase.findMany({
        where: whereClause,
        include: {
          profesor: true,
          sala: { include: { sede: true } },
          inscripciones: { include: { alumno: true } },
          marcajes: true,
        },
        orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
      });

      res.json(clases.map(({ profesor, ...c }) => ({
        ...c,
        profesor: profesor ? { ...profesor, password: undefined } : null,
      })));
    } catch (error) {
      handleError(res, error, "Error al obtener clases");
    }
  });

  app.get("/api/clases/mis-clases", async (req: AuthRequest, res: Response) => {
    try {
      const { desde, hasta } = req.query;
      const whereClause: Record<string, unknown> = {};
      
      if (desde && hasta) {
        whereClause.fecha = {
          gte: new Date(desde as string),
          lte: new Date(hasta as string),
        };
      }

      if (req.user?.id) {
        whereClause.profesorId = req.user.id;
      }

      const clases = await prisma.clase.findMany({
        where: whereClause,
        include: {
          profesor: true,
          sala: { include: { sede: true } },
          inscripciones: { include: { alumno: true } },
        },
        orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
      });

      res.json(clases);
    } catch (error) {
      handleError(res, error, "Error al obtener mis clases");
    }
  });

  app.get("/api/clases/alumno", async (req: Request, res: Response) => {
    try {
      const { alumnoId, desde, hasta } = req.query;
      
      if (!alumnoId) {
        return res.json([]);
      }

      const inscripciones = await prisma.inscripcion.findMany({
        where: { alumnoId: alumnoId as string },
        include: {
          clase: {
            include: {
              profesor: true,
              sala: { include: { sede: true } },
            },
          },
        },
      });

      let clases = inscripciones.map(i => i.clase);
      
      if (desde && hasta) {
        const desdeDate = new Date(desde as string);
        const hastaDate = new Date(hasta as string);
        clases = clases.filter(c => {
          const fecha = new Date(c.fecha);
          return fecha >= desdeDate && fecha <= hastaDate;
        });
      }

      res.json(clases);
    } catch (error) {
      handleError(res, error, "Error al obtener clases del alumno");
    }
  });

  app.get("/api/clases/desactivadas", async (req: Request, res: Response) => {
    try {
      const { salaId, fecha } = req.query;
      
      const whereClause: Record<string, unknown> = {
        estado: "cancelada",
      };
      
      if (salaId) whereClause.salaId = salaId;
      
      if (fecha) {
        const date = new Date(fecha as string);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        whereClause.fecha = { gte: date, lt: nextDay };
      }

      const clases = await prisma.clase.findMany({
        where: whereClause,
        include: {
          profesor: true,
          sala: { include: { sede: true } },
        },
        orderBy: [{ fecha: "desc" }, { horaInicio: "asc" }],
      });

      res.json(clases.map(({ profesor, ...c }) => ({
        ...c,
        profesor: profesor ? { ...profesor, password: undefined } : null,
      })));
    } catch (error) {
      handleError(res, error, "Error al obtener clases desactivadas");
    }
  });

  app.get("/api/dispositivos", async (req: Request, res: Response) => {
    try {
      const { salaId, sedeId } = req.query;
      
      const whereClause: Record<string, unknown> = {};
      if (salaId) whereClause.salaId = salaId;
      if (sedeId) whereClause.sedeId = sedeId;

      const dispositivos = await prisma.dispositivo.findMany({
        where: whereClause,
        include: { sala: true, sede: true },
        orderBy: { serialNumber: "asc" },
      });

      res.json(dispositivos);
    } catch (error) {
      handleError(res, error, "Error al obtener dispositivos");
    }
  });

  app.get("/api/incidencias-dispositivos", async (_req: Request, res: Response) => {
    try {
      const incidencias = await prisma.incidenciaDispositivo.findMany({
        include: {
          dispositivo: {
            include: { sala: true, sede: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(incidencias);
    } catch (error) {
      handleError(res, error, "Error al obtener incidencias");
    }
  });

  app.post("/api/incidencias-dispositivos/:id/homologar", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = homologarSchema.parse(req.body);

      const sede = await prisma.sede.findUnique({ where: { id: data.sedeId } });
      const sala = await prisma.sala.findUnique({ where: { id: data.salaId } });

      if (!sede || !sala) {
        return res.status(404).json({ error: "Sede o sala no encontrada" });
      }

      const incidencia = await prisma.incidenciaDispositivo.update({
        where: { id },
        data: {
          sedeHomologada: sede.nombre,
          salaHomologada: sala.nombre,
          estadoResolucion: "resuelto",
        },
      });

      res.json(incidencia);
    } catch (error) {
      handleError(res, error, "Error al homologar dispositivo");
    }
  });

  app.get("/api/incidencias-dispositivos/historial", async (req: Request, res: Response) => {
    try {
      const { desde, hasta } = req.query;
      
      const whereClause: Record<string, unknown> = {};
      if (desde && hasta) {
        whereClause.createdAt = {
          gte: new Date(desde as string),
          lte: new Date(hasta as string),
        };
      }

      const incidencias = await prisma.incidenciaDispositivo.findMany({
        where: whereClause,
        include: {
          dispositivo: {
            include: { sala: true, sede: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(incidencias);
    } catch (error) {
      handleError(res, error, "Error al obtener historial");
    }
  });

  app.get("/api/reportes-error", async (req: Request, res: Response) => {
    try {
      const { desde, hasta, sedeId } = req.query;
      
      const whereClause: Record<string, unknown> = {};
      if (sedeId) whereClause.sedeId = sedeId;
      
      if (desde && hasta) {
        whereClause.fecha = {
          gte: new Date(desde as string),
          lte: new Date(hasta as string),
        };
      }

      const reportes = await prisma.reporteError.findMany({
        where: whereClause,
        include: { 
          profesor: {
            select: { id: true, nombre: true, rut: true, email: true }
          }
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(reportes);
    } catch (error) {
      handleError(res, error, "Error al obtener reportes");
    }
  });

  app.post("/api/reportes-error", async (req: AuthRequest, res: Response) => {
    try {
      const reporteSchema = z.object({
        salaId: z.string().optional().nullable(),
        sedeId: z.string().optional().nullable(),
        comentario: z.string().min(1),
      });

      const data = reporteSchema.parse(req.body);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: "No autenticado" });
      }

      const reporte = await prisma.reporteError.create({
        data: {
          profesorId: req.user.id,
          salaId: data.salaId || null,
          sedeId: data.sedeId || null,
          fecha: new Date(),
          comentario: data.comentario,
          estado: "pendiente",
        },
        include: { profesor: true },
      });

      res.status(201).json(reporte);
    } catch (error) {
      handleError(res, error, "Error al crear reporte");
    }
  });

  app.get("/api/clases/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const clase = await prisma.clase.findUnique({
        where: { id },
        include: {
          profesor: { select: { id: true, nombre: true, rut: true, email: true } },
          sala: { include: { sede: true } },
          inscripciones: {
            include: {
              alumno: { select: { id: true, nombre: true, rut: true } },
            },
          },
          marcajes: {
            include: {
              alumno: { select: { id: true, nombre: true, rut: true } },
              dispositivo: { select: { id: true, serialNumber: true } },
            },
            orderBy: { fechaHora: "desc" },
          },
        },
      });

      if (!clase) {
        return res.status(404).json({ error: "Clase no encontrada" });
      }

      res.json(clase);
    } catch (error) {
      handleError(res, error, "Error al obtener clase");
    }
  });

  app.get("/api/marcajes", async (req: Request, res: Response) => {
    try {
      const { claseId, alumnoId } = req.query;
      
      const whereClause: Record<string, unknown> = {};
      if (claseId) whereClause.claseId = claseId;
      if (alumnoId) whereClause.alumnoId = alumnoId;

      const marcajes = await prisma.marcaje.findMany({
        where: whereClause,
        include: {
          clase: true,
          alumno: { select: { id: true, nombre: true, rut: true } },
          dispositivo: { select: { id: true, serialNumber: true } },
        },
        orderBy: { fechaHora: "desc" },
      });

      res.json(marcajes);
    } catch (error) {
      handleError(res, error, "Error al obtener marcajes");
    }
  });

  app.post("/api/marcajes", async (req: AuthRequest, res: Response) => {
    try {
      const marcajeSchema = z.object({
        claseId: z.string().min(1),
        alumnoId: z.string().min(1),
        estado: z.string().min(1),
        tipoMarcaje: z.string().default("manual"),
      });

      const data = marcajeSchema.parse(req.body);
      
      const marcaje = await prisma.marcaje.create({
        data: {
          claseId: data.claseId,
          alumnoId: data.alumnoId,
          fechaHora: new Date(),
          estado: data.estado,
          tipoMarcaje: data.tipoMarcaje,
          modificadoPor: req.user?.id || null,
        },
      });

      res.status(201).json(marcaje);
    } catch (error) {
      handleError(res, error, "Error al crear marcaje");
    }
  });

  app.patch("/api/marcajes/:id", async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ") || !req.user?.id) {
        return res.status(401).json({ error: "Autenticacion requerida" });
      }

      const updateSchema = z.object({
        estado: z.enum(["PRESENTE", "AUSENTE", "TARDANZA", "JUSTIFICADO"]),
      });

      const parseResult = updateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Estado invalido. Valores permitidos: PRESENTE, AUSENTE, TARDANZA, JUSTIFICADO",
          details: parseResult.error.errors
        });
      }
      const data = parseResult.data;

      const usuario = await prisma.usuario.findUnique({
        where: { id: req.user.id },
        include: { 
          perfil: {
            include: {
              perfilPermisos: {
                include: { permiso: true }
              }
            }
          }
        },
      });

      if (!usuario) {
        return res.status(401).json({ error: "Usuario no encontrado" });
      }

      const perfilPermisos = (usuario as unknown as { perfil?: { perfilPermisos?: Array<{ permiso: { codigo: string } }> } }).perfil?.perfilPermisos;
      const tienePermiso = perfilPermisos?.some(
        (pp: { permiso: { codigo: string } }) => pp.permiso.codigo === "editar_asistencia" || pp.permiso.codigo === "*"
      );

      if (!tienePermiso && usuario.tipo !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "No tiene permiso para editar marcajes" });
      }

      const marcajeAnterior = await prisma.marcaje.findUnique({
        where: { id },
        include: { 
          alumno: { select: { id: true, nombre: true, rut: true } },
          clase: { select: { id: true, asignatura: true, fecha: true } },
        },
      });

      if (!marcajeAnterior) {
        return res.status(404).json({ error: "Marcaje no encontrado" });
      }

      const marcaje = await prisma.marcaje.update({
        where: { id },
        data: {
          estado: data.estado,
          tipoMarcaje: "MANUAL",
          modificadoPor: req.user.id,
        },
        include: {
          alumno: { select: { id: true, nombre: true, rut: true } },
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.user.id,
          action: "UPDATE",
          entity: "Marcaje",
          entityId: id,
          before: {
            id: marcajeAnterior.id,
            claseId: marcajeAnterior.claseId,
            alumnoId: marcajeAnterior.alumnoId,
            alumnoNombre: marcajeAnterior.alumno?.nombre,
            alumnoRut: marcajeAnterior.alumno?.rut,
            claseAsignatura: marcajeAnterior.clase?.asignatura,
            estado: marcajeAnterior.estado,
            tipoMarcaje: marcajeAnterior.tipoMarcaje,
            modificadoPor: marcajeAnterior.modificadoPor,
            fechaHora: marcajeAnterior.fechaHora,
          },
          after: {
            id: marcaje.id,
            claseId: marcaje.claseId,
            alumnoId: marcaje.alumnoId,
            alumnoNombre: marcaje.alumno?.nombre,
            alumnoRut: marcaje.alumno?.rut,
            estado: marcaje.estado,
            tipoMarcaje: marcaje.tipoMarcaje,
            modificadoPor: usuario.nombre,
            modificadoPorId: req.user.id,
          },
        },
      });

      res.json(marcaje);
    } catch (error) {
      handleError(res, error, "Error al actualizar marcaje");
    }
  });

  return httpServer;
}
