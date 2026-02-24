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
