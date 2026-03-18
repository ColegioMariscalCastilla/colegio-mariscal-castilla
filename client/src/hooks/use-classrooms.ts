import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import toast from "react-hot-toast";

export function useClassrooms() {
  return useQuery({
    queryKey: [api.classrooms.list.path],
    queryFn: async () => {
      const res = await fetch(api.classrooms.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch classrooms");
      return res.json() as Promise<any[]>;
    },
  });
}

export function useCreateClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.classrooms.create.path, {
        method: api.classrooms.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create classroom");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classrooms.list.path] });
      toast.success("Salón creado correctamente");
    },
    onError: () => toast.error("Error al crear el salón"),
  });
}

export function useUpdateClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const url = buildUrl(api.classrooms.update.path, { id });
      const res = await fetch(url, {
        method: api.classrooms.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to update classroom");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classrooms.list.path] });
      toast.success("Salón actualizado correctamente");
    },
    onError: (error: Error) => {
      console.error("Update classroom error:", error);
      toast.error(error.message || "Error al actualizar el salón");
    },
  });
}

export function useDeleteClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.classrooms.delete.path, { id });
      const res = await fetch(url, {
        method: api.classrooms.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete classroom");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classrooms.list.path] });
      toast.success("Salón eliminado correctamente");
    },
    onError: () => toast.error("Error al eliminar el salón"),
  });
}
