import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import toast from "react-hot-toast";

export function useAttendance(filters?: { date?: string, classroomId?: string, studentId?: string }) {
  return useQuery({
    queryKey: [api.attendance.list.path, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.date) params.append("date", filters.date);
      if (filters?.classroomId) params.append("classroomId", filters.classroomId);
      if (filters?.studentId) params.append("studentId", filters.studentId);
      
      const url = `${api.attendance.list.path}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json() as Promise<any[]>;
    },
  });
}

export function useAttendanceWithTime({ studentId }: { studentId?: string } = {}) {
  return useQuery({
    queryKey: [api.attendance.list.path + "-with-time", studentId],
    queryFn: async () => {
      const res = await fetch(api.attendance.list.path + "-with-time" + (studentId ? `?studentId=${studentId}` : ""), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch attendance with time");
      return res.json();
    },
  });
}

export function useSaveAttendanceBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { fecha: string, records: { studentId: number, estado: string }[] }) => {
      const res = await fetch(api.attendance.saveBatch.path, {
        method: api.attendance.saveBatch.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save attendance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.attendance.list.path] });
      queryClient.invalidateQueries({ queryKey: ['weekly-attendance'] });
      queryClient.invalidateQueries({ queryKey: [api.attendance.list.path + "-with-time"] });
      toast.success("Asistencia guardada con éxito", { icon: '✅' });
    },
    onError: (err: any) => toast.error(err.message || "Error al guardar la asistencia", { icon: '❌' }),
  });
}

export function useExportAttendance() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.attendance.export.path, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => toast.success("Exportación iniciada"),
    onError: (err: any) => toast.error(err.message || "Error al exportar la asistencia"),
  });
}

export function useDeleteAllAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attendance/cleanup", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete all attendance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ['weekly-attendance'] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-with-time"] });
      toast.success("Historial eliminado exitosamente", { icon: '✅' });
    },
    onError: (err: any) => toast.error(err.message || "Error al eliminar el historial", { icon: '❌' }),
  });
}

export function useDeleteStudentAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) => {
      const res = await fetch(`/api/attendance/student/${studentId}/delete`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete student attendance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ['weekly-attendance'] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-with-time"] });
      toast.success("Historial del estudiante eliminado exitosamente", { icon: '✅' });
    },
    onError: (err: any) => toast.error(err.message || "Error al eliminar el historial del estudiante", { icon: '❌' }),
  });
}
