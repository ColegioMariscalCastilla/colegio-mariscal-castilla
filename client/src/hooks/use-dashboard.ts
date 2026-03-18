import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch(api.dashboard.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json() as Promise<{
        totalStudents: number, 
        todayAttendance: number, 
        absencePercentage: number,
        totalTeachers: number,
        totalClassrooms: number
      }>
    },
    staleTime: 0, // Siempre fresco
    refetchOnWindowFocus: true,
  });
}
