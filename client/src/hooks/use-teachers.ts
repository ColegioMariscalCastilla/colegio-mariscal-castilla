import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import toast from "react-hot-toast";

export function useTeachers() {
  return useQuery({
    queryKey: [api.teachers.list.path],
    queryFn: async () => {
      const res = await fetch(api.teachers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json() as Promise<any[]>;
    },
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.teachers.create.path, {
        method: api.teachers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create teacher");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teachers.list.path] });
      toast.success("Profesor creado correctamente");
    },
    onError: () => toast.error("Error al crear el profesor"),
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.teachers.delete.path, { id });
      const res = await fetch(url, {
        method: api.teachers.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete teacher");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teachers.list.path] });
      toast.success("Profesor eliminado correctamente");
    },
    onError: () => toast.error("Error al eliminar el profesor"),
  });
}
