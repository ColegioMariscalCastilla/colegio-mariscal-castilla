import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { db, pool } from "./db";
import { users } from "@shared/schema";

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

    const payload = { ...parsed, turno: normalizeTurno(parsed.turno) };
    try {
      const result = await storage.createClassroom(payload);
      res.status(201).json(result);
    } catch (err) {
      console.error('Error creating classroom', err);
      res.status(500).send(String(err));
    }
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

  app.get(api.students.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const classroomId = req.query.classroomId ? Number(req.query.classroomId) : undefined;
    const result = await storage.getStudents(classroomId);
    res.json(result);
  });

  app.post(api.students.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = api.students.create.input.extend({ password: z.string(), username: z.string() }).parse(req.body);
    
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
    const date = req.query.date as string | undefined;
    const classroomId = req.query.classroomId ? Number(req.query.classroomId) : undefined;
    const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
    
    const result = await storage.getAttendances(date, classroomId, studentId);
    res.json(result);
  });

  app.post(api.attendance.saveBatch.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = api.attendance.saveBatch.input.parse(req.body);
    
    // En batch
    for (const record of parsed.records) {
      // Store fecha as a date-only string (YYYY-MM-DD) to avoid timezone mismatches
      // Normalize estado to lowercase values accepted by DB ('presente'|'ausente')
      const estadoNorm = record.estado ? record.estado.toString().toLowerCase().trim() : record.estado;
      console.log('Creating attendance record', { studentId: record.studentId, fecha: parsed.fecha, estadoNorm, registradoPor: req.user!.id });
      await storage.createAttendance({
        studentId: record.studentId,
        fecha: parsed.fecha,
        estado: estadoNorm,
        registradoPor: req.user!.id
      });
    }

    res.status(201).json({ success: true });
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
    const studentsList = await storage.getStudents();
    const today = new Date().toISOString().split('T')[0];
    const attendanceToday = await storage.getAttendances(today);

    const totalStudents = studentsList.length;
    const todayAttendance = attendanceToday.length;
    const absences = attendanceToday.filter(a => a.estado === 'Ausente').length;
    
    let absencePercentage = 0;
    if (todayAttendance > 0) {
      absencePercentage = Math.round((absences / todayAttendance) * 100);
    }

    res.json({
      totalStudents,
      todayAttendance,
      absencePercentage
    });
  });

  // Seed
  try {
    // Check that the users table has the expected `username` column before seeding.
    const columnCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='username'`
    );
    const hasUsername = columnCheck && columnCheck.rows && columnCheck.rows.length > 0;
    if (hasUsername) {
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length === 0) {
        const hashed = await hashPassword('admin123');
        await storage.createUser({
          username: 'admin',
          password: hashed,
          nombre: 'Directora Mariscal Castilla',
          rol: 'directora'
        });
      }
    } else {
      console.warn('Skipping DB seed: users.username column not present yet.');
    }
  } catch (error) {
    console.error("Error seeding DB (tables might not exist yet):", error);
  }

  return httpServer;
}