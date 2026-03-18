import { useDashboardStats } from "@/hooks/use-dashboard";
import { useExportAttendance } from "@/hooks/use-attendance";
import { useWeeklyAttendance } from "@/hooks/use-weekly-attendance";
import { PageHeader, Card, LoadingSpinner } from "@/components/ui-components";
import { Users, UserCheck, AlertTriangle, Download, School, GraduationCap, Home, RefreshCw } from "lucide-react";
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useDashboardStats() as any;
  const exportMutation = useExportAttendance();
  const { data: weeklyData, isLoading: isLoadingWeekly, refetch: refetchWeekly } = useWeeklyAttendance();
  
  // Obtener el día actual de la semana
  const getCurrentDay = () => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date().getDay()];
  };
  
  const currentDay = getCurrentDay();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full">
      <PageHeader 
        title="Panel" 
        description="Resumen de la asistencia y estadísticas del colegio."
        action={
          <button 
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="btn-outline flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {exportMutation.isPending ? "Exportando..." : "Exportar asistencia"}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="p-6 hover-lift bg-gradient-to-br from-card to-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">Total de alumnos</p>
              <h3 className="text-3xl font-display font-bold mt-1">{stats?.totalStudents || 0}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover-lift bg-gradient-to-br from-card to-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">Total de profesores</p>
              <h3 className="text-3xl font-display font-bold mt-1">{stats?.totalTeachers || 0}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover-lift bg-gradient-to-br from-card to-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">Total de salones</p>
              <h3 className="text-3xl font-display font-bold mt-1">{stats?.totalClassrooms || 0}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico Combinado de Asistencia Semanal */}
      <Card className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              Asistencia Semanal
              {currentDay === 'Lunes' || currentDay === 'Martes' || currentDay === 'Miércoles' || currentDay === 'Jueves' || currentDay === 'Viernes' ? (
                <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                  Hoy: {currentDay}
                </span>
              ) : null}
            </h3>
            <p className="text-sm text-muted-foreground">
              Barras: Total presentes por día | Línea: % de asistencia
            </p>
          </div>
          <button 
            onClick={() => refetchWeekly()}
            className="btn-outline flex items-center gap-2"
            title="Refrescar datos del gráfico"
          >
            <RefreshCw className="w-4 h-4" />
            Refrescar Gráfico
          </button>
        </div>
        
        {isLoadingWeekly ? (
          <div className="h-80 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="day" 
                axisLine={{ stroke: '#e5e7eb' }}
                tick={(props) => {
                  const { x, y, payload } = props;
                  const isCurrentDay = payload.value === currentDay;
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text 
                        x={0} 
                        y={0} 
                        dy={16} 
                        textAnchor="middle" 
                        fill={isCurrentDay ? '#3b82f6' : '#6b7280'}
                        fontSize={isCurrentDay ? 14 : 12}
                        fontWeight={isCurrentDay ? 'bold' : 'normal'}
                      >
                        {payload.value}
                      </text>
                      {isCurrentDay && (
                        <circle 
                          cx={0} 
                          cy={-5} 
                          r={3} 
                          fill="#3b82f6" 
                        />
                      )}
                    </g>
                  );
                }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                label={{ value: 'Total Presentes', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                label={{ value: '% Asistencia', angle: 90, position: 'insideRight', style: { fill: '#6b7280' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: any, name?: string) => {
                  if (name === 'attendanceRate') {
                    return [`${value}%`, '% Asistencia'];
                  }
                  return [value, 'Total Presentes'];
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => {
                  if (value === 'totalPresent') return 'Total Presentes';
                  if (value === 'attendanceRate') return '% Asistencia';
                  return value;
                }}
              />
              <Bar 
                yAxisId="left"
                dataKey="totalPresent" 
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
                name="totalPresent"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="attendanceRate" 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isCurrentDay = payload.day === currentDay;
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={isCurrentDay ? 8 : 6} 
                      fill="#ef4444"
                      stroke={isCurrentDay ? '#ffffff' : 'none'}
                      strokeWidth={isCurrentDay ? 2 : 0}
                    />
                  );
                }}
                activeDot={{ r: 10 }}
                name="attendanceRate"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}

