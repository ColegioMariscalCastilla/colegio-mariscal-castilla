import { useAuth } from "@/hooks/use-auth";
import { useAttendance } from "@/hooks/use-attendance";
import { useStudents } from "@/hooks/use-students";
import { PageHeader, Card, LoadingSpinner } from "@/components/ui-components";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { UserCircle, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function StudentProfile() {
  const { user } = useAuth();
  // Determine the student's internal `students.id` by looking up students for this user
  const { data: allStudents } = useStudents();
  const myStudentRecord = allStudents?.find(s => s.userId === user?.id) as any | undefined;
  const studentIdParam = myStudentRecord ? myStudentRecord.id.toString() : undefined;
  const { data: attendanceHistory, isLoading } = useAttendance({ studentId: studentIdParam });

  if (isLoading) return <LoadingSpinner />;

  // Calculate stats
  const presentCount = attendanceHistory?.filter(a => (a.estado || '').toString().toLowerCase() === 'presente').length || 0;
  const absentCount = attendanceHistory?.filter(a => (a.estado || '').toString().toLowerCase() === 'ausente').length || 0;
  const totalCount = presentCount + absentCount;
  
  const chartData = [
    { name: 'Present', value: presentCount, color: 'hsl(142 76% 36%)' },
    { name: 'Absent', value: absentCount, color: 'hsl(0 84% 60%)' },
  ].filter(d => d.value > 0); // Only show segments with data

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Mi perfil" 
        description="Ver tus registros de asistencia y estadísticas."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="p-6 col-span-1 flex flex-col items-center justify-center text-center bg-gradient-to-b from-card to-secondary/30">
          <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <UserCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold font-display">{user?.nombre}</h2>
          <p className="text-muted-foreground mt-1">Cuenta de alumno</p>
          <div className="mt-6 w-full pt-6 border-t border-border/50 flex justify-between text-sm">
            <span className="font-bold text-muted-foreground">Total Classes</span>
            <span className="font-bold">{totalCount}</span>
          </div>
        </Card>

        <Card className="p-6 col-span-1 lg:col-span-2">
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="p-4 font-bold text-sm text-muted-foreground">Date</th>
                <th className="p-4 font-bold text-sm text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory?.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-muted-foreground">No history available.</td>
                </tr>
              ) : (
                attendanceHistory?.slice().reverse().map((record) => (
                  <tr key={record.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-4 font-medium flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(record.fecha), "dd 'de' MMMM, yyyy")}
                    </td>
                    <td className="p-4">
                            {(record.estado || '').toString().toLowerCase() === 'presente' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Presente</span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">Ausente</span>
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
