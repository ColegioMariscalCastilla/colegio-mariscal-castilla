import { z } from "zod";
import { insertUserSchema, insertClassroomSchema, updateClassroomSchema, insertTeacherSchema, insertStudentSchema, insertAttendanceSchema, users, classrooms, teachers, students, attendance } from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/login" as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout" as const,
      responses: {
        200: z.void(),
      }
    },
    me: {
      method: "GET" as const,
      path: "/api/user" as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  classrooms: {
    list: {
      method: "GET" as const,
      path: "/api/classrooms" as const,
      responses: {
        200: z.array(z.custom<typeof classrooms.$inferSelect>()),
      }
    },
    create: {
      method: "POST" as const,
      path: "/api/classrooms" as const,
      input: insertClassroomSchema,
      responses: {
        201: z.custom<typeof classrooms.$inferSelect>(),
      }
    },
    update: {
      method: "PATCH" as const,
      path: "/api/classrooms/:id" as const,
      input: updateClassroomSchema,
      responses: {
        200: z.custom<typeof classrooms.$inferSelect>(),
      }
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/classrooms/:id" as const,
      responses: {
        204: z.void(),
      }
    }
  },
  teachers: {
    list: {
      method: "GET" as const,
      path: "/api/teachers" as const,
      responses: {
        200: z.array(z.custom<typeof teachers.$inferSelect>()),
      }
    },
    create: {
      method: "POST" as const,
      path: "/api/teachers" as const,
      input: insertTeacherSchema.extend({ password: z.string(), username: z.string() }), 
      responses: {
        201: z.custom<typeof teachers.$inferSelect>(),
      }
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/teachers/:id" as const,
      responses: {
        204: z.void(),
      }
    }
  },
  students: {
    list: {
      method: "GET" as const,
      path: "/api/students" as const,
      input: z.object({ classroomId: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof students.$inferSelect & { classroom: typeof classrooms.$inferSelect }>()),
      }
    },
    create: {
      method: "POST" as const,
      path: "/api/students" as const,
      input: insertStudentSchema.extend({ password: z.string(), username: z.string() }),
      responses: {
        201: z.custom<typeof students.$inferSelect>(),
      }
    },
    update: {
      method: "PATCH" as const,
      path: "/api/students/:id" as const,
      input: insertStudentSchema.partial(),
      responses: {
        200: z.custom<typeof students.$inferSelect>(),
      }
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/students/:id" as const,
      responses: {
        204: z.void(),
      }
    }
  },
  attendance: {
    list: {
      method: "GET" as const,
      path: "/api/attendance" as const,
      input: z.object({ date: z.string().optional(), classroomId: z.string().optional(), studentId: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof attendance.$inferSelect & { student: typeof students.$inferSelect }>()),
      }
    },
    saveBatch: {
      method: "POST" as const,
      path: "/api/attendance/batch" as const,
      input: z.object({
        fecha: z.string(),
        records: z.array(z.object({
          studentId: z.number(),
          estado: z.string() // 'Presente', 'Ausente'
        }))
      }),
      responses: {
        201: z.object({ success: z.boolean() }),
      }
    },
    export: {
      method: "GET" as const,
      path: "/api/attendance/export" as const,
      responses: {
        200: z.any(),
      }
    }
  },
  dashboard: {
    stats: {
      method: "GET" as const,
      path: "/api/dashboard/stats" as const,
      responses: {
        200: z.object({
          totalStudents: z.number(),
          todayAttendance: z.number(),
          absencePercentage: z.number()
        })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
