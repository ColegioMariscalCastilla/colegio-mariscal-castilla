import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

interface DayAttendance {
  day: string;
  totalPresent: number;
  attendanceRate: number;
}

// Función para convertir una fecha a formato YYYY-MM-DD local sin problemas de timezone
const toLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function useWeeklyAttendance() {
  return useQuery({
    queryKey: ['weekly-attendance'],
    queryFn: async () => {
      // Obtener datos de los últimos 5 días (Lunes a Viernes)
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Domingo, 1 = Lunes, etc.
      const weekData: DayAttendance[] = [];
      
      const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      
      // Calcular el lunes de esta semana
      const mondayOffset = currentDay === 0 ? -6 : (1 - currentDay); // Si es domingo, ir 6 días atrás, si no, ir al lunes
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      
      for (let i = 0; i < 5; i++) {
        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + i);
        
        const dateStr = toLocalDateString(currentDate);
        console.log(`Fetching attendance for ${daysOfWeek[i]} (${dateStr})`);
        
        try {
          const res = await fetch(`/api/attendance?date=${dateStr}`, { credentials: "include" });
          if (res.ok) {
            const attendanceData = await res.json();
            console.log(`Attendance data for ${daysOfWeek[i]}:`, attendanceData);
            const totalPresent = attendanceData.filter((a: any) => (a.estado || '').toString().toLowerCase() === 'presente').length;
            const totalStudents = attendanceData.length;
            const attendanceRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;
            
            weekData.push({
              day: daysOfWeek[i],
              totalPresent,
              attendanceRate
            });
          } else {
            console.log(`No attendance data for ${daysOfWeek[i]}, using zeros`);
            // Si no hay datos, usar ceros en lugar de valores simulados
            weekData.push({
              day: daysOfWeek[i],
              totalPresent: 0,
              attendanceRate: 0
            });
          }
        } catch (error) {
          console.error(`Error fetching attendance for ${daysOfWeek[i]}:`, error);
          // En caso de error, usar ceros
          weekData.push({
            day: daysOfWeek[i],
            totalPresent: 0,
            attendanceRate: 0
          });
        }
      }
      
      console.log('Final weekly data:', weekData);
      return weekData;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
