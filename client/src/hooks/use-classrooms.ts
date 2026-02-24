import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
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
    onError: () => toast.error("Error creando el salón"),
  });
}
