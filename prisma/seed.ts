import { PrismaClient, Role, ClassStatus, DeviceStatus, ResolutionStatus, AttendanceStatus, AttendanceType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const permisos = await Promise.all([
    prisma.permiso.upsert({
      where: { codigo: "ver_dashboard" },
      update: {},
      create: { codigo: "ver_dashboard", nombre: "Ver Dashboard", modulo: "dashboard" },
    }),
    prisma.permiso.upsert({
      where: { codigo: "ver_calendario_docente" },
      update: {},
      create: { codigo: "ver_calendario_docente", nombre: "Ver Calendario Docente", modulo: "calendario" },
    }),
    prisma.permiso.upsert({
      where: { codigo: "ver_mi_calendario" },
      update: {},
      create: { codigo: "ver_mi_calendario", nombre: "Ver Mi Calendario", modulo: "calendario" },
    }),
    prisma.permiso.upsert({
      where: { codigo: "editar_asistencia" },
      update: {},
      create: { codigo: "editar_asistencia", nombre: "Editar Asistencia", modulo: "asistencia" },
    }),
    prisma.permiso.upsert({
      where: { codigo: "ver_salas" },
      update: {},
      create: { codigo: "ver_salas", nombre: "Ver Salas", modulo: "salas" },
    }),
    prisma.permiso.upsert({
      where: { codigo: "ver_dispositivos" },
      update: {},
      create: { codigo: "ver_dispositivos", nombre: "Ver Dispositivos", modulo: "dispositivos" },
    }),
    prisma.permiso.upsert({
      where: { codigo: "homologar_dispositivos" },
      update: {},
      create: { codigo: "homologar_dispositivos", nombre: "Homologar Dispositivos", modulo: "dispositivos" },
    }),
    prisma.permiso.upsert({
      where: { codigo: "ver_usuarios" },
      update: {},
      create: { codigo: "ver_usuarios", nombre: "Ver Usuarios", modulo: "usuarios" },
    }),
    prisma.permiso.upsert({
      where: { codigo: "editar_usuarios" },
      update: {},
      create: { codigo: "editar_usuarios", nombre: "Editar Usuarios", modulo: "usuarios" },
    }),
    prisma.permiso.upsert({
      where: { codigo: "ver_historial_errores" },
      update: {},
      create: { codigo: "ver_historial_errores", nombre: "Ver Historial Errores", modulo: "errores" },
    }),
    prisma.permiso.upsert({
      where: { codigo: "reportar_errores" },
      update: {},
      create: { codigo: "reportar_errores", nombre: "Reportar Errores", modulo: "errores" },
    }),
    prisma.permiso.upsert({
      where: { codigo: "gestionar_perfiles" },
      update: {},
      create: { codigo: "gestionar_perfiles", nombre: "Gestionar Perfiles", modulo: "perfiles" },
    }),
    prisma.permiso.upsert({
      where: { codigo: "ver_auditoria" },
      update: {},
      create: { codigo: "ver_auditoria", nombre: "Ver Auditoria", modulo: "auditoria" },
    }),
  ]);

  const permisoMap = Object.fromEntries(permisos.map(p => [p.codigo, p.id]));

  const adminPerfil = await prisma.perfil.upsert({
    where: { id: "perfil-admin" },
    update: {},
    create: {
      id: "perfil-admin",
      nombre: "Administrador",
      descripcion: "Acceso completo al sistema",
    },
  });

  for (const permiso of permisos) {
    await prisma.perfilPermiso.upsert({
      where: { perfilId_permisoId: { perfilId: adminPerfil.id, permisoId: permiso.id } },
      update: {},
      create: { perfilId: adminPerfil.id, permisoId: permiso.id },
    });
  }

  const coordinadorPerfil = await prisma.perfil.upsert({
    where: { id: "perfil-coordinador" },
    update: {},
    create: {
      id: "perfil-coordinador",
      nombre: "Coordinador",
      descripcion: "Gestion de calendario y dispositivos",
    },
  });

  const coordinadorPermisos = ["ver_dashboard", "ver_calendario_docente", "editar_asistencia", "ver_salas", "ver_dispositivos", "homologar_dispositivos", "ver_usuarios", "ver_historial_errores", "reportar_errores"];
  for (const codigo of coordinadorPermisos) {
    await prisma.perfilPermiso.upsert({
      where: { perfilId_permisoId: { perfilId: coordinadorPerfil.id, permisoId: permisoMap[codigo] } },
      update: {},
      create: { perfilId: coordinadorPerfil.id, permisoId: permisoMap[codigo] },
    });
  }

  const docentePerfil = await prisma.perfil.upsert({
    where: { id: "perfil-docente" },
    update: {},
    create: {
      id: "perfil-docente",
      nombre: "Docente",
      descripcion: "Acceso a calendario propio y asistencia",
    },
  });

  const docentePermisos = ["ver_dashboard", "ver_mi_calendario", "editar_asistencia", "ver_salas", "reportar_errores"];
  for (const codigo of docentePermisos) {
    await prisma.perfilPermiso.upsert({
      where: { perfilId_permisoId: { perfilId: docentePerfil.id, permisoId: permisoMap[codigo] } },
      update: {},
      create: { perfilId: docentePerfil.id, permisoId: permisoMap[codigo] },
    });
  }

  const sedeSantiago = await prisma.sede.upsert({
    where: { id: "sede-santiago" },
    update: {},
    create: { id: "sede-santiago", codigo: "STG", nombre: "Santiago Centro", timezone: "America/Santiago" },
  });

  const sedeValparaiso = await prisma.sede.upsert({
    where: { id: "sede-valparaiso" },
    update: {},
    create: { id: "sede-valparaiso", codigo: "VLP", nombre: "Valparaiso", timezone: "America/Santiago" },
  });

  const salaA101 = await prisma.sala.upsert({
    where: { id: "sala-a101" },
    update: {},
    create: { id: "sala-a101", codigo: "A101", nombre: "Sala A101", sedeId: sedeSantiago.id },
  });

  const salaA102 = await prisma.sala.upsert({
    where: { id: "sala-a102" },
    update: {},
    create: { id: "sala-a102", codigo: "A102", nombre: "Sala A102", sedeId: sedeSantiago.id },
  });

  const salaB201 = await prisma.sala.upsert({
    where: { id: "sala-b201" },
    update: {},
    create: { id: "sala-b201", codigo: "B201", nombre: "Laboratorio B201", sedeId: sedeSantiago.id },
  });

  const salaV101 = await prisma.sala.upsert({
    where: { id: "sala-v101" },
    update: {},
    create: { id: "sala-v101", codigo: "V101", nombre: "Sala V101", sedeId: sedeValparaiso.id },
  });

  const hashedPassword = await bcrypt.hash("123456", 10);

  const adminUser = await prisma.usuario.upsert({
    where: { rut: "11.111.111-1" },
    update: {},
    create: {
      rut: "11.111.111-1",
      nombre: "Administrador Sistema",
      email: "admin@gvclassroom.cl",
      password: hashedPassword,
      tipo: Role.SUPER_ADMIN,
      perfilId: adminPerfil.id,
      sedeId: sedeSantiago.id,
      activo: true,
    },
  });

  const profesor1 = await prisma.usuario.upsert({
    where: { rut: "12.345.678-9" },
    update: {},
    create: {
      rut: "12.345.678-9",
      nombre: "Maria Elena Gonzalez",
      email: "maria.gonzalez@gvclassroom.cl",
      password: hashedPassword,
      tipo: Role.PROFESOR,
      perfilId: docentePerfil.id,
      sedeId: sedeSantiago.id,
      activo: true,
    },
  });

  const profesor2 = await prisma.usuario.upsert({
    where: { rut: "13.456.789-0" },
    update: {},
    create: {
      rut: "13.456.789-0",
      nombre: "Carlos Alberto Munoz",
      email: "carlos.munoz@gvclassroom.cl",
      password: hashedPassword,
      tipo: Role.PROFESOR,
      perfilId: docentePerfil.id,
      sedeId: sedeSantiago.id,
      activo: true,
    },
  });

  const profesor3 = await prisma.usuario.upsert({
    where: { rut: "14.567.890-1" },
    update: {},
    create: {
      rut: "14.567.890-1",
      nombre: "Andrea Patricia Soto",
      email: "andrea.soto@gvclassroom.cl",
      password: hashedPassword,
      tipo: Role.PROFESOR,
      perfilId: docentePerfil.id,
      sedeId: sedeValparaiso.id,
      activo: true,
    },
  });

  const alumnos = [];
  for (let i = 1; i <= 10; i++) {
    const alumno = await prisma.usuario.upsert({
      where: { rut: `20.${String(i).padStart(3, "0")}.${String(i * 111).padStart(3, "0")}-${i % 10}` },
      update: {},
      create: {
        rut: `20.${String(i).padStart(3, "0")}.${String(i * 111).padStart(3, "0")}-${i % 10}`,
        nombre: `Alumno ${i} Apellido`,
        email: `alumno${i}@estudiante.cl`,
        password: hashedPassword,
        tipo: Role.ALUMNO,
        sedeId: i <= 7 ? sedeSantiago.id : sedeValparaiso.id,
        activo: true,
      },
    });
    alumnos.push(alumno);
  }

  const today = new Date();
  const clases = [];

  for (let d = -5; d <= 5; d++) {
    const fecha = new Date(today);
    fecha.setDate(fecha.getDate() + d);
    fecha.setHours(0, 0, 0, 0);

    if (fecha.getDay() !== 0 && fecha.getDay() !== 6) {
      const clase1 = await prisma.clase.upsert({
        where: { id: `clase-mat-${d + 5}` },
        update: {},
        create: {
          id: `clase-mat-${d + 5}`,
          codigo: `MAT101-${d + 5}`,
          asignatura: "Matematicas I",
          profesorId: profesor1.id,
          salaId: salaA101.id,
          fecha,
          horaInicio: "08:30",
          horaFin: "10:00",
          estado: d < 0 ? ClassStatus.COMPLETADA : ClassStatus.ACTIVA,
        },
      });
      clases.push(clase1);

      const clase2 = await prisma.clase.upsert({
        where: { id: `clase-fis-${d + 5}` },
        update: {},
        create: {
          id: `clase-fis-${d + 5}`,
          codigo: `FIS101-${d + 5}`,
          asignatura: "Fisica General",
          profesorId: profesor2.id,
          salaId: salaB201.id,
          fecha,
          horaInicio: "10:30",
          horaFin: "12:00",
          estado: d < 0 ? ClassStatus.COMPLETADA : ClassStatus.ACTIVA,
        },
      });
      clases.push(clase2);

      const clase3 = await prisma.clase.upsert({
        where: { id: `clase-prog-${d + 5}` },
        update: {},
        create: {
          id: `clase-prog-${d + 5}`,
          codigo: `INF101-${d + 5}`,
          asignatura: "Programacion I",
          profesorId: profesor1.id,
          salaId: salaA102.id,
          fecha,
          horaInicio: "14:00",
          horaFin: "15:30",
          estado: d < 0 ? ClassStatus.COMPLETADA : ClassStatus.ACTIVA,
        },
      });
      clases.push(clase3);
    }
  }

  const cancelledDate = new Date(today);
  cancelledDate.setDate(cancelledDate.getDate() + 2);
  await prisma.clase.upsert({
    where: { id: "clase-cancelada-1" },
    update: {},
    create: {
      id: "clase-cancelada-1",
      codigo: "QUI101-C",
      asignatura: "Quimica General",
      profesorId: profesor2.id,
      salaId: salaA101.id,
      fecha: cancelledDate,
      horaInicio: "16:00",
      horaFin: "17:30",
      estado: ClassStatus.CANCELADA,
    },
  });

  for (const clase of clases.slice(0, 5)) {
    for (const alumno of alumnos.slice(0, 5)) {
      await prisma.inscripcion.upsert({
        where: { claseId_alumnoId: { claseId: clase.id, alumnoId: alumno.id } },
        update: {},
        create: { claseId: clase.id, alumnoId: alumno.id },
      });
    }
  }

  const estados = [AttendanceStatus.PRESENTE, AttendanceStatus.PRESENTE, AttendanceStatus.PRESENTE, AttendanceStatus.TARDANZA, AttendanceStatus.AUSENTE];
  let marcajeIndex = 0;
  for (const clase of clases.slice(0, 3)) {
    for (let i = 0; i < alumnos.slice(0, 5).length; i++) {
      const alumno = alumnos[i];
      const estado = estados[i % estados.length];
      await prisma.marcaje.upsert({
        where: { id: `marcaje-${marcajeIndex}` },
        update: {},
        create: {
          id: `marcaje-${marcajeIndex}`,
          claseId: clase.id,
          alumnoId: alumno.id,
          fechaHora: new Date(clase.fecha),
          estado: estado,
          tipoMarcaje: AttendanceType.AUTO,
        },
      });
      marcajeIndex++;
    }
  }

  const dispositivo1 = await prisma.dispositivo.upsert({
    where: { serialNumber: "TAB-2024-001" },
    update: {},
    create: {
      serialNumber: "TAB-2024-001",
      tipo: "tablet",
      salaId: salaA101.id,
      sedeId: sedeSantiago.id,
      versionApp: "2.1.0",
      bateria: 85,
      estadoConexion: DeviceStatus.CONECTADO,
      ultimaConexion: new Date(),
    },
  });

  const dispositivo2 = await prisma.dispositivo.upsert({
    where: { serialNumber: "TAB-2024-002" },
    update: {},
    create: {
      serialNumber: "TAB-2024-002",
      tipo: "tablet",
      salaId: salaA102.id,
      sedeId: sedeSantiago.id,
      versionApp: "2.1.0",
      bateria: 62,
      estadoConexion: DeviceStatus.CONECTADO,
      ultimaConexion: new Date(),
    },
  });

  const dispositivo3 = await prisma.dispositivo.upsert({
    where: { serialNumber: "TAB-2024-003" },
    update: {},
    create: {
      serialNumber: "TAB-2024-003",
      tipo: "tablet",
      salaId: salaB201.id,
      sedeId: sedeSantiago.id,
      versionApp: "2.0.5",
      bateria: 15,
      estadoConexion: DeviceStatus.ADVERTENCIA,
      ultimaConexion: new Date(Date.now() - 3600000),
    },
  });

  const dispositivo4 = await prisma.dispositivo.upsert({
    where: { serialNumber: "PDA-2024-001" },
    update: {},
    create: {
      serialNumber: "PDA-2024-001",
      tipo: "pda",
      salaId: null,
      sedeId: sedeSantiago.id,
      versionApp: "2.1.0",
      bateria: null,
      estadoConexion: DeviceStatus.DESCONECTADO,
      ultimaConexion: new Date(Date.now() - 86400000 * 3),
    },
  });

  const dispositivo5 = await prisma.dispositivo.upsert({
    where: { serialNumber: "TAB-2024-004" },
    update: {},
    create: {
      serialNumber: "TAB-2024-004",
      tipo: "tablet",
      salaId: salaV101.id,
      sedeId: sedeValparaiso.id,
      versionApp: "2.1.0",
      bateria: 90,
      estadoConexion: DeviceStatus.CONECTADO,
      ultimaConexion: new Date(),
    },
  });

  await prisma.incidenciaDispositivo.upsert({
    where: { id: "incidencia-1" },
    update: {},
    create: {
      id: "incidencia-1",
      dispositivoId: dispositivo4.id,
      tipoIncidencia: "Sin conexion",
      descripcion: "El dispositivo no se ha conectado en 72 horas",
      sedeOriginal: sedeSantiago.nombre,
      salaOriginal: null,
      estadoResolucion: ResolutionStatus.PENDIENTE,
    },
  });

  await prisma.incidenciaDispositivo.upsert({
    where: { id: "incidencia-2" },
    update: {},
    create: {
      id: "incidencia-2",
      dispositivoId: dispositivo3.id,
      tipoIncidencia: "Bateria baja",
      descripcion: "Bateria por debajo del 20%",
      sedeOriginal: sedeSantiago.nombre,
      salaOriginal: salaB201.nombre,
      estadoResolucion: ResolutionStatus.PENDIENTE,
    },
  });

  await prisma.reporteError.upsert({
    where: { id: "reporte-1" },
    update: {},
    create: {
      id: "reporte-1",
      profesorId: profesor1.id,
      salaId: salaA101.id,
      sedeId: sedeSantiago.id,
      fecha: new Date(Date.now() - 86400000 * 2),
      comentario: "La tablet no reconoce correctamente las huellas de algunos estudiantes",
      estado: ResolutionStatus.PENDIENTE,
    },
  });

  await prisma.reporteError.upsert({
    where: { id: "reporte-2" },
    update: {},
    create: {
      id: "reporte-2",
      profesorId: profesor2.id,
      salaId: salaB201.id,
      sedeId: sedeSantiago.id,
      fecha: new Date(Date.now() - 86400000 * 5),
      comentario: "El dispositivo se reinicio durante la clase y se perdieron los marcajes",
      estado: ResolutionStatus.RESUELTO,
    },
  });

  await prisma.historialDispositivo.upsert({
    where: { id: "historial-1" },
    update: {},
    create: {
      id: "historial-1",
      dispositivoId: dispositivo1.id,
      accion: "asignacion",
      descripcion: "Dispositivo asignado a sala A101",
      sedeAnterior: null,
      salaAnterior: null,
      sedeNueva: sedeSantiago.nombre,
      salaNueva: salaA101.nombre,
      estadoAnterior: "sin_asignar",
      estadoNuevo: "conectado",
      actorId: adminUser.id,
    },
  });

  await prisma.historialDispositivo.upsert({
    where: { id: "historial-2" },
    update: {},
    create: {
      id: "historial-2",
      dispositivoId: dispositivo3.id,
      accion: "actualizacion",
      descripcion: "Version de app actualizada de 2.0.4 a 2.0.5",
      sedeAnterior: sedeSantiago.nombre,
      salaAnterior: salaB201.nombre,
      sedeNueva: sedeSantiago.nombre,
      salaNueva: salaB201.nombre,
      estadoAnterior: "conectado",
      estadoNuevo: "conectado",
      actorId: adminUser.id,
    },
  });

  await prisma.historialDispositivo.upsert({
    where: { id: "historial-3" },
    update: {},
    create: {
      id: "historial-3",
      dispositivoId: dispositivo4.id,
      accion: "desconexion",
      descripcion: "Dispositivo perdio conexion",
      sedeAnterior: sedeSantiago.nombre,
      salaAnterior: null,
      sedeNueva: sedeSantiago.nombre,
      salaNueva: null,
      estadoAnterior: "conectado",
      estadoNuevo: "desconectado",
      actorId: null,
    },
  });

  await prisma.auditLog.upsert({
    where: { id: "audit-1" },
    update: {},
    create: {
      id: "audit-1",
      actorId: adminUser.id,
      action: "CREATE",
      entity: "Usuario",
      entityId: profesor1.id,
      before: null,
      after: { rut: "12.345.678-9", nombre: "Maria Elena Gonzalez", tipo: "profesor" },
    },
  });

  await prisma.auditLog.upsert({
    where: { id: "audit-2" },
    update: {},
    create: {
      id: "audit-2",
      actorId: adminUser.id,
      action: "UPDATE",
      entity: "Dispositivo",
      entityId: dispositivo1.id,
      before: { salaId: null, estadoConexion: "desconectado" },
      after: { salaId: salaA101.id, estadoConexion: "conectado" },
    },
  });

  await prisma.auditLog.upsert({
    where: { id: "audit-3" },
    update: {},
    create: {
      id: "audit-3",
      actorId: adminUser.id,
      action: "UPDATE",
      entity: "Clase",
      entityId: "clase-cancelada-1",
      before: { estado: "activa" },
      after: { estado: "cancelada" },
    },
  });

  console.log("Seed completed successfully!");
  console.log("\nUsuarios creados:");
  console.log("  Admin: 11.111.111-1 / 123456");
  console.log("  Profesor: 12.345.678-9 / 123456");
  console.log("  Profesor: 13.456.789-0 / 123456");
  console.log("\nNuevos modelos:");
  console.log("  - 13 Permisos configurados");
  console.log("  - 3 Perfiles con permisos asignados");
  console.log("  - 3 registros de HistorialDispositivo");
  console.log("  - 3 registros de AuditLog");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
