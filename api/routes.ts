import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { db, pool } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import { users, students, teachers, classrooms, attendance, attendanceTime } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const { hashPassword } = setupAuth(app);

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.get(api.classrooms.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const result = await storage.getClassrooms();
    res.json(result);
  });

  app.post(api.classrooms.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = api.classrooms.create.input.parse(req.body);
    // Normalize turno values to match DB constraint (lowercase spanish tokens)
    const normalizeTurno = (t: string | undefined) => {
      if (!t) return t;
      const v = t.toLowerCase().trim();
      if (v === 'mañana' || v === 'manana' || v === 'manha' || v === 'ma¤ana') return 'mañana';
      if (v === 'tarde') return 'tarde';
      return v;
    };

    const payload = { ...parsed, turno: normalizeTurno(parsed.turno) || 'mañana' };
    try {
      const result = await storage.createClassroom(payload);
      res.status(201).json(result);
    } catch (err) {
      console.error('Error creating classroom', err);
      res.status(500).json({ 
        error: "Error interno del servidor",
        message: process.env.NODE_ENV === 'development' ? String(err) : undefined
      });
    }
  });

  app.patch(api.classrooms.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    console.log('Update classroom request - Params:', req.params);
    console.log('Update classroom request - Body:', req.body);
    
    try {
      const parsed = api.classrooms.update.input.parse(req.body);
      console.log('Parsed data:', parsed);
      
      // Normalize turno values to match DB constraint (lowercase spanish tokens)
      const normalizeTurno = (t: string | undefined) => {
        if (!t) return t;
        const v = t.toLowerCase().trim();
        if (v === 'mañana' || v === 'manana' || v === 'manha' || v === 'ma¤ana') return 'mañana';
        if (v === 'tarde') return 'tarde';
        return v;
      };

      const payload = parsed.turno ? { ...parsed, turno: normalizeTurno(parsed.turno) } : parsed;
      console.log('Final payload:', payload);
      
      const classroom = await storage.updateClassroom(Number(req.params.id), payload);
      console.log('Updated classroom:', classroom);
      res.json(classroom);
    } catch (err) {
      console.error('Error updating classroom:', err);
      res.status(500).json({ 
        error: "Error interno del servidor",
        message: process.env.NODE_ENV === 'development' ? String(err) : undefined
      });
    }
  });

  app.delete(api.classrooms.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteClassroom(Number(req.params.id));
    res.sendStatus(204);
  });

  app.get(api.teachers.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const result = await storage.getTeachers();
    res.json(result);
  });

  app.post(api.teachers.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Extending the schema at validation time to include password and username
    const parsed = api.teachers.create.input.extend({ password: z.string(), username: z.string() }).parse(req.body);
    
    // Verificar si el username ya existe
    const existingUser = await storage.getUserByUsername(parsed.username);
    if (existingUser) {
      return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
    }
    
    // Create user first
    const hashed = await hashPassword(parsed.password);
    const user = await storage.createUser({
      username: parsed.username,
      password: hashed,
      nombre: parsed.nombre,
      rol: 'profesor'
    });

    const teacher = await storage.createTeacher({
      nombre: parsed.nombre,
      email: parsed.email,
      userId: user.id
    });
    
    res.status(201).json(teacher);
  });

  app.delete(api.teachers.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteTeacher(Number(req.params.id));
    res.sendStatus(204);
  });

  app.get(api.students.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const classroomId = req.query.classroomId ? Number(req.query.classroomId) : undefined;
    const result = await storage.getStudents(classroomId);
    res.json(result);
  });

  app.post(api.students.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = api.students.create.input.extend({ 
      password: z.string(), 
      username: z.string()
    }).parse(req.body);

    // Verificar si el username ya existe
    const existingUser = await storage.getUserByUsername(parsed.username);
    if (existingUser) {
      return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
    }
    
    const hashed = await hashPassword(parsed.password);
    const user = await storage.createUser({
      username: parsed.username,
      password: hashed,
      nombre: parsed.nombre,
      rol: 'estudiante'
    });

    const student = await storage.createStudent({
      nombre: parsed.nombre,
      dni: parsed.dni,
      email: parsed.email,
      classroomId: parsed.classroomId,
      userId: user.id
    });

    res.status(201).json(student);
  });

  app.patch(api.students.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = api.students.update.input.parse(req.body);
    const student = await storage.updateStudent(Number(req.params.id), parsed);
    res.json(student);
  });

  app.delete(api.students.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteStudent(Number(req.params.id));
    res.sendStatus(204);
  });

  app.get(api.attendance.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { date, classroomId, studentId } = req.query;
    const result = await storage.getAttendances(date as string, classroomId ? parseInt(classroomId as string) : undefined, studentId ? parseInt(studentId as string) : undefined);
    res.json(result);
  });

  app.get(api.attendance.list.path + "-with-time", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { date, classroomId, studentId } = req.query;
    console.log('🕐 Fetching attendance with time:', { date, classroomId, studentId });
    const result = await storage.getAttendancesWithTime(date as string, classroomId ? parseInt(classroomId as string) : undefined, studentId ? parseInt(studentId as string) : undefined);
    console.log('📊 Attendance with time result:', result.length, 'records');
    if (result.length > 0) {
      console.log('🔍 Sample record:', result[0]);
    }
    res.json(result);
  });

  // Endpoint temporal para limpiar asistencia (solo para desarrollo)
  app.delete("/api/attendance/cleanup", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log('🧹 Cleaning up all attendance records...');
    
    try {
      // Contar registros antes de eliminar
      const attendanceCount = await db.select().from(attendance);
      const timeCount = await db.select().from(attendanceTime);
      console.log(`📊 Found ${attendanceCount.length} attendance records and ${timeCount.length} time records`);
      
      // Eliminar todos los registros de attendance_time
      await db.delete(attendanceTime);
      console.log('✅ Deleted all attendance_time records');
      
      // Eliminar todos los registros de attendance
      await db.delete(attendance);
      console.log('✅ Deleted all attendance records');
      
      res.json({ 
        success: true, 
        message: `Deleted ${attendanceCount.length} attendance records and ${timeCount.length} time records` 
      });
    } catch (error) {
      console.error('❌ Error cleaning up attendance:', error);
      res.status(500).json({ error: 'Failed to cleanup attendance' });
    }
  });

  // Endpoint automático de limpieza (sin autenticación para desarrollo)
  app.post("/api/dev/cleanup-attendance", async (req, res) => {
    console.log('🚨 AUTO CLEANUP: Cleaning up all attendance records...');
    
    try {
      // Contar registros antes de eliminar
      const attendanceCount = await db.select().from(attendance);
      const timeCount = await db.select().from(attendanceTime);
      console.log(`📊 Found ${attendanceCount.length} attendance records and ${timeCount.length} time records`);
      
      // Eliminar todos los registros de attendance_time
      await db.delete(attendanceTime);
      console.log('✅ Deleted all attendance_time records');
      
      // Eliminar todos los registros de attendance
      await db.delete(attendance);
      console.log('✅ Deleted all attendance records');
      
      res.json({ 
        success: true, 
        message: `Deleted ${attendanceCount.length} attendance records and ${timeCount.length} time records` 
      });
    } catch (error) {
      console.error('❌ Error cleaning up attendance:', error);
      res.status(500).json({ error: 'Failed to cleanup attendance' });
    }
  });

  app.post(api.attendance.saveBatch.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = api.attendance.saveBatch.input.parse(req.body);
    
    // En batch
    for (const record of parsed.records) {
      // Verificar si ya existe asistencia para este estudiante en esta fecha
      const existingAttendance = await storage.getAttendances(parsed.fecha, undefined, record.studentId);
      
      if (existingAttendance.length > 0) {
        console.log(`Attendance already exists for student ${record.studentId} on ${parsed.fecha}, skipping...`);
        continue; // Saltar este registro si ya existe
      }
      
      // Store fecha as a date-only string (YYYY-MM-DD) to avoid timezone mismatches
      // Normalize estado to lowercase values accepted by DB ('presente'|'ausente')
      const estadoNorm = record.estado ? record.estado.toString().toLowerCase().trim() : record.estado;
      
      console.log('Creating attendance record', { studentId: record.studentId, fecha: parsed.fecha, estado: estadoNorm, registradoPor: req.user!.id });
      const attendanceRecord = await storage.createAttendance({
        studentId: record.studentId,
        fecha: parsed.fecha,
        estado: estadoNorm,
        registradoPor: req.user!.id
      });

      // Guardar la hora exacta en la tabla separada
      const currentTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS format
      console.log('Creating attendance time record', { attendanceId: attendanceRecord.id, hora: currentTime });
      await storage.createAttendanceTime({
        attendanceId: attendanceRecord.id,
        hora: currentTime
      });
    }

    res.status(201).json({ success: true });
  });

  // Endpoint para eliminar historial individual de un estudiante
  app.delete("/api/attendance/student/:studentId/delete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { studentId } = req.params;
      console.log(`🗑️ Deleting attendance history for student ${studentId}`);
      
      // Contar registros antes de eliminar
      const attendanceRecords = await db.select().from(attendance).where(eq(attendance.studentId, parseInt(studentId)));
      console.log(`📊 Found ${attendanceRecords.length} attendance records for student ${studentId}`);
      
      // Eliminar registros de tiempo de asistencia primero
      const attendanceIds = attendanceRecords.map(record => record.id);
      if (attendanceIds.length > 0) {
        await db.delete(attendanceTime).where(inArray(attendanceTime.attendanceId, attendanceIds));
        console.log(`✅ Deleted ${attendanceIds.length} attendance_time records`);
      }
      
      // Eliminar registros de asistencia
      const deleteResult = await db.delete(attendance).where(eq(attendance.studentId, parseInt(studentId)));
      console.log(`✅ Deleted ${deleteResult.rowCount} attendance records`);
      
      res.json({ 
        success: true, 
        message: `Historial del estudiante eliminado correctamente`, 
        deletedCount: deleteResult.rowCount 
      });
    } catch (error) {
      console.error('❌ Error deleting student attendance:', error);
      res.status(500).json({ error: 'Error al eliminar el historial del estudiante' });
    }
  });

  app.get(api.attendance.export.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const data = await storage.getAttendances();
    const formatted = data.map(d => ({
      fecha: d.fecha,
      nombre_del_alumno: d.student.nombre,
      DNI: d.student.dni,
      asistencia: d.estado
    }));
    res.json(formatted);
  });

  app.get(api.dashboard.stats.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      console.log('🔄 Fetching dashboard stats...');
      
      // Usar los métodos del storage que ya funcionan
      const studentsList = await storage.getStudents();
      console.log(`📊 Found ${studentsList.length} students`);
      
      const teachersList = await storage.getTeachers();
      console.log(`👥 Found ${teachersList.length} teachers`);
      
      const classroomsList = await storage.getClassrooms();
      console.log(`🏫 Found ${classroomsList.length} classrooms`);
      
      const today = new Date().toISOString().split('T')[0];
      const attendanceToday = await storage.getAttendances(today);
      console.log(`✅ Found ${attendanceToday.length} attendance records for today`);

      const totalStudents = studentsList.length;
      const totalTeachers = teachersList.length;
      const totalClassrooms = classroomsList.length;
      const todayAttendance = attendanceToday.length;
      const absences = attendanceToday.filter(a => a.estado === 'Ausente').length;
      
      let absencePercentage = 0;
      if (todayAttendance > 0) {
        absencePercentage = Math.round((absences / todayAttendance) * 100);
      }

      const stats = {
        totalStudents,
        totalTeachers,
        totalClassrooms,
        todayAttendance,
        absencePercentage
      };
      
      console.log('📈 Dashboard stats:', stats);
      res.json(stats);
    } catch (error) {
      console.error('❌ Error in dashboard stats:', error);
      if (error instanceof Error) {
        console.error('❌ Stack trace:', error.stack);
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Seed - Create admin user if not exists
  try {
    console.log("Checking for admin user...");
    
    // Check if users table exists and has records
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log("No users found, creating admin user...");
      
      // Create admin user with environment variables
      const hashed = await hashPassword(process.env.ADMIN_PASSWORD || 'admin123');
      await storage.createUser({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: hashed,
        nombre: 'Directora Mariscal Castilla',
        rol: 'directora'
      });
      
      console.log('✅ Admin user created successfully');
      console.log(`   Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    } else {
      console.log("✅ Users already exist in database");
    }
  } catch (tableError) {
    console.log("⚠️ Database tables might not exist yet. Run: npm run db:push");
    console.error("Table error:", tableError);
  }

  console.log("🎉 Server setup completed successfully");

  return httpServer;
}