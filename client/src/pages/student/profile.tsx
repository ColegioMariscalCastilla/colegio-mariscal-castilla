import { useAuth } from "@/hooks/use-auth";
import { useAttendanceWithTime } from "@/hooks/use-attendance";
import { useStudents } from "@/hooks/use-students";
import { PageHeader, Card, LoadingSpinner } from "@/components/ui-components";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { UserCircle, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';

// Tipos para corregir errores de TypeScript
interface AttendanceRecord {
  id: number;
  studentId: number;
  fecha: string;
  estado: string;
  registradoPor: number;
  timeRecord?: {
    id: number;
    attendanceId: number;
    hora: string;
    createdAt: string;
  };
}

export default function StudentProfile() {
  const { user } = useAuth();
  // Determine the student's internal `students.id` by looking up students for this user
  const { data: allStudents } = useStudents();
  const myStudentRecord = allStudents?.find(s => s.userId === user?.id) as any | undefined;
  const studentIdParam = myStudentRecord ? myStudentRecord.id.toString() : undefined;
  const { data: attendanceHistory, isLoading } = useAttendanceWithTime({ studentId: studentIdParam });

  if (isLoading) return <LoadingSpinner />;

  // Calculate stats
  const presentCount = attendanceHistory?.filter((a: AttendanceRecord) => (a.estado || '').toString().toLowerCase() === 'presente').length || 0;
  const absentCount = attendanceHistory?.filter((a: AttendanceRecord) => (a.estado || '').toString().toLowerCase() === 'ausente').length || 0;
  const totalCount = presentCount + absentCount;
  
  const chartData = [
    { name: 'Presente', value: presentCount, color: 'hsl(142 76% 36%)' },
    { name: 'Ausente', value: absentCount, color: 'hsl(0 84% 60%)' },
  ].filter(d => d.value > 0); // Only show segments with data

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full">
      <PageHeader 
        title="Mi perfil" 
        description="Ver tus registros de asistencia y estadísticas."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 place-items-center lg:place-items-start">
        <Card className="p-6 col-span-1 flex flex-col items-center justify-center text-center bg-gradient-to-b from-card to-secondary/30 w-full max-w-sm lg:max-w-none">
          <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <UserCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold font-display">{user?.nombre}</h2>
          <p className="text-muted-foreground mt-1">Cuenta de alumno</p>
          <div className="mt-6 w-full pt-6 border-t border-border/50 flex justify-between text-sm">
            <span className="font-bold text-muted-foreground">Total de clases</span>
            <span className="font-bold">{totalCount}</span>
          </div>
        </Card>

        <Card className="p-6 col-span-1 lg:col-span-2 w-full max-w-md lg:max-w-none">
          <h3 className="font-bold text-lg mb-6">Resumen de asistencia</h3>
          {totalCount === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground border border-dashed rounded-xl">
              No se encontraron registros de asistencia.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="w-48 h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="p-4 rounded-xl bg-green-50/50 border border-green-100 flex justify-between items-center">
                  <div className="flex items-center gap-3 text-green-700 font-bold">
                    <CheckCircle2 className="w-5 h-5" /> Presente
                  </div>
                  <span className="text-2xl font-display font-bold text-green-700">{presentCount}</span>
                </div>
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 flex justify-between items-center">
                  <div className="flex items-center gap-3 text-rose-700 font-bold">
                    <XCircle className="w-5 h-5" /> Ausente
                  </div>
                  <span className="text-2xl font-display font-bold text-rose-700">{absentCount}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <h3 className="font-bold text-xl mb-4">Historial reciente</h3>
      <Card>
        <div className="w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="p-2 sm:p-4 font-bold text-xs sm:text-sm text-muted-foreground w-1/2">Fecha</th>
                <th className="p-2 sm:p-4 font-bold text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">Hora</th>
                <th className="p-2 sm:p-4 font-bold text-xs sm:text-sm text-muted-foreground w-1/2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 sm:p-8 text-center text-muted-foreground text-xs sm:text-sm">No hay historial disponible.</td>
                </tr>
              ) : (
                attendanceHistory?.slice().reverse().map((record: AttendanceRecord) => (
                  <tr key={record.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-2 sm:p-4 font-medium text-xs sm:text-sm w-1/2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                          {record.fecha && format(new Date(record.fecha + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: es })}
                        </div>
                        <div className="flex items-center gap-2 sm:hidden">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{record.timeRecord?.hora || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-4 text-xs sm:text-sm hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                        {record.timeRecord?.hora || 'N/A'}
                      </div>
                    </td>
                    <td className="p-2 sm:p-4 w-1/2">
                            {(record.estado || '').toString().toLowerCase() === 'presente' ? (
                              <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Presente</span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">Ausente</span>
                            )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
