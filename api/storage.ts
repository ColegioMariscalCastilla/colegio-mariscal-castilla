import { db, pool } from "./db.js";
import { eq, and } from "drizzle-orm";
import { users, classrooms, teachers, students, attendance, attendanceTime } from "../shared/schema.js";
import type { User, InsertUser, Classroom, InsertClassroom, Teacher, InsertTeacher, Student, InsertStudent, Attendance, InsertAttendance, AttendanceTime, InsertAttendanceTime } from "../shared/schema.js";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getClassrooms(): Promise<Classroom[]>;
  createClassroom(classroom: InsertClassroom): Promise<Classroom>;
  updateClassroom(id: number, classroom: Partial<InsertClassroom>): Promise<Classroom>;
  deleteClassroom(id: number): Promise<void>;

  getTeachers(): Promise<Teacher[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  deleteTeacher(id: number): Promise<void>;

  getStudents(classroomId?: number): Promise<(Student & { classroom: Classroom })[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: number): Promise<void>;

  getAttendances(date?: string, classroomId?: number, studentId?: number): Promise<(Attendance & { student: Student })[]>;
  getAttendancesWithTime(date?: string, classroomId?: number, studentId?: number): Promise<(Attendance & { student: Student; timeRecord?: AttendanceTime })[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  createAttendanceTime(attendanceTime: InsertAttendanceTime): Promise<AttendanceTime>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getClassrooms(): Promise<Classroom[]> {
    return await db.select().from(classrooms);
  }

  async createClassroom(classroom: InsertClassroom): Promise<Classroom> {
    const [created] = await db.insert(classrooms).values(classroom).returning();
    return created;
  }

  async updateClassroom(id: number, updateData: Partial<InsertClassroom>): Promise<Classroom> {
    const [updated] = await db.update(classrooms).set(updateData).where(eq(classrooms.id, id)).returning();
    return updated;
  }

  async deleteClassroom(id: number): Promise<void> {
    await db.delete(classrooms).where(eq(classrooms.id, id));
  }

  async getTeachers(): Promise<(Teacher & { user: User })[]> {
    return await db.select({
      teacher: teachers,
      user: users,
    }).from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .then(results => results.map(r => ({ ...r.teacher, user: r.user })));
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const [created] = await db.insert(teachers).values(teacher).returning();
    return created;
  }

  async deleteTeacher(id: number): Promise<void> {
    await db.delete(teachers).where(eq(teachers.id, id));
  }

  async getStudents(classroomId?: number): Promise<(Student & { classroom: Classroom, user: User })[]> {
    let query = db.select({
      student: students,
      classroom: classrooms,
      user: users,
    }).from(students)
      .innerJoin(classrooms, eq(students.classroomId, classrooms.id))
      .innerJoin(users, eq(students.userId, users.id));
    
    if (classroomId) {
      query = query.where(eq(students.classroomId, classroomId)) as any;
    }
    
    const results = await query;
    return results.map(r => ({ ...r.student, classroom: r.classroom, user: r.user }));
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await db.insert(students).values(student).returning();
    return created;
  }

  async updateStudent(id: number, updateData: Partial<InsertStudent>): Promise<Student> {
    const [updated] = await db.update(students).set(updateData).where(eq(students.id, id)).returning();
    return updated;
  }

  async deleteStudent(id: number): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  async getAttendances(date?: string, classroomId?: number, studentId?: number): Promise<(Attendance & { student: Student })[]> {
    let query = db.select({
      attendance: attendance,
      student: students,
    }).from(attendance).innerJoin(students, eq(attendance.studentId, students.id));

    const conditions = [];
    // Compare date-only strings (YYYY-MM-DD) to avoid timezone issues
    if (date) conditions.push(eq(attendance.fecha, date));
    if (studentId) conditions.push(eq(attendance.studentId, studentId));
    if (classroomId) conditions.push(eq(students.classroomId, classroomId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    return results.map(r => ({ ...r.attendance, student: r.student }));
  }

  async createAttendance(att: InsertAttendance): Promise<Attendance> {
    const [created] = await db.insert(attendance).values(att).returning();
    return created;
  }

  async createAttendanceTime(attendanceTimeData: InsertAttendanceTime): Promise<AttendanceTime> {
    const [created] = await db.insert(attendanceTime).values(attendanceTimeData).returning();
    return created;
  }

  async getAttendancesWithTime(date?: string, classroomId?: number, studentId?: number): Promise<(Attendance & { student: Student; timeRecord?: AttendanceTime })[]> {
    let query = db.select({
      attendance: attendance,
      student: students,
      timeRecord: attendanceTime
    }).from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .leftJoin(attendanceTime, eq(attendance.id, attendanceTime.attendanceId));

    const conditions = [];
    if (date) conditions.push(eq(attendance.fecha, date));
    if (studentId) conditions.push(eq(attendance.studentId, studentId));
    if (classroomId) conditions.push(eq(students.classroomId, classroomId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    return results.map(r => ({ 
      ...r.attendance, 
      student: r.student,
      timeRecord: r.timeRecord || undefined
    }));
  }
}

export const storage = new DatabaseStorage();
