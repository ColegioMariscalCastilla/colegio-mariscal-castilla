import { db, pool } from "./db";
import { eq, and } from "drizzle-orm";
import { users, classrooms, teachers, students, attendance, InsertUser, User, InsertClassroom, Classroom, InsertTeacher, Teacher, InsertStudent, Student, InsertAttendance, Attendance } from "@shared/schema";
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

  getTeachers(): Promise<Teacher[]>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;

  getStudents(classroomId?: number): Promise<(Student & { classroom: Classroom })[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: number): Promise<void>;

  getAttendances(date?: string, classroomId?: number, studentId?: number): Promise<(Attendance & { student: Student })[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
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

  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers);
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const [created] = await db.insert(teachers).values(teacher).returning();
    return created;
  }

  async getStudents(classroomId?: number): Promise<(Student & { classroom: Classroom })[]> {
    let query = db.select({
      student: students,
      classroom: classrooms,
    }).from(students).innerJoin(classrooms, eq(students.classroomId, classrooms.id));
    
    if (classroomId) {
      query = query.where(eq(students.classroomId, classroomId)) as any;
    }
    
    const results = await query;
    return results.map(r => ({ ...r.student, classroom: r.classroom }));
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
}

export const storage = new DatabaseStorage();
