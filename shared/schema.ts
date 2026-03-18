import { pgTable, text, serial, integer, boolean, timestamp, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nombre: text("nombre").notNull(),
  rol: text("rol").notNull(), // 'DIRECTORA', 'PROFESOR', 'ESTUDIANTE'
});

export const classrooms = pgTable("classrooms", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  turno: text("turno").notNull(), // 'Mañana', 'Tarde'
});

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  nombre: text("nombre").notNull(),
  email: text("email").notNull(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  dni: text("dni").notNull().unique(),
  email: text("email").notNull(),
  classroomId: integer("classroom_id").references(() => classrooms.id),
  userId: integer("user_id").references(() => users.id), // for student login
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  fecha: date("fecha").notNull(), // YYYY-MM-DD
  estado: text("estado").notNull(), // 'Presente', 'Ausente'
  registradoPor: integer("registrado_por").references(() => users.id).notNull(),
});

// Tabla separada para registrar la hora exacta de la asistencia
export const attendanceTime = pgTable("attendance_time", {
  id: serial("id").primaryKey(),
  attendanceId: integer("attendance_id").references(() => attendance.id).notNull(),
  hora: time("hora").notNull(), // HH:MM:SS
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const classroomsRelations = relations(classrooms, ({ many }) => ({
  students: many(students),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [students.classroomId],
    references: [classrooms.id],
  }),
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  attendances: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one, many }) => ({
  student: one(students, {
    fields: [attendance.studentId],
    references: [students.id],
  }),
  registradoPor: one(users, {
    fields: [attendance.registradoPor],
    references: [users.id],
  }),
  timeRecords: many(attendanceTime),
}));

export const attendanceTimeRelations = relations(attendanceTime, ({ one }) => ({
  attendance: one(attendance, {
    fields: [attendanceTime.attendanceId],
    references: [attendance.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertClassroomSchema = createInsertSchema(classrooms).omit({ id: true });
export const updateClassroomSchema = insertClassroomSchema.partial();
export const insertTeacherSchema = createInsertSchema(teachers).omit({ id: true }).extend({
  email: z.string().regex(/^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Email inválido")
});
export const insertStudentSchema = createInsertSchema(students).omit({ id: true }).extend({
  email: z.string().regex(/^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Email inválido")
});
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertAttendanceTimeSchema = createInsertSchema(attendanceTime).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Classroom = typeof classrooms.$inferSelect;
export type InsertClassroom = z.infer<typeof insertClassroomSchema>;
export type UpdateClassroom = z.infer<typeof updateClassroomSchema>;

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type AttendanceTime = typeof attendanceTime.$inferSelect;
export type InsertAttendanceTime = z.infer<typeof insertAttendanceTimeSchema>;
