import { useParams } from "wouter";
import { useAttendance } from "@/hooks/use-attendance";
import { useStudents } from "@/hooks/use-students";
import { PageHeader, Card, LoadingSpinner } from "@/components/ui-components";
import { Calendar, Clock, UserCheck, XCircle, ArrowLeft, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function StudentAttendance() {
  const params = useParams();
  const studentId = params.id;
  
  const { data: attendanceHistory, isLoading } = useAttendance({ studentId });
  const { data: students } = useStudents();
  
  // Encontrar el estudiante actual
  const currentStudent = students?.find((student: any) => student.id === studentId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentStudent) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full">
        <PageHeader 
          title="Estudiante no encontrado" 
          description="No se encontró información del estudiante."
          action={
            <button 
              onClick={() => window.history.back()}
              className="btn-outline flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          }
        />
        <Card>
          <div className="text-center py-8">
            <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">El estudiante solicitado no existe o fue eliminado.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full">
      <PageHeader 
        title={`Historial de Asistencia - ${currentStudent.nombre}`}
        description={`Ver el registro de asistencia de ${currentStudent.nombre} (DNI: ${currentStudent.dni})`}
        action={
          <button 
            onClick={() => window.history.back()}
            className="btn-outline flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        }
      />

      <Card>
        <div className="mb-6">
          <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{currentStudent.nombre}</h3>
              <p className="text-sm text-muted-foreground">DNI: {currentStudent.dni}</p>
              <p className="text-sm text-muted-foreground">
                Salón: {currentStudent.classroom?.nombre || 'Sin asignar'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="p-4 font-bold text-sm text-muted-foreground">Fecha</th>
                <th className="p-4 font-bold text-sm text-muted-foreground hidden sm:table-cell">Hora</th>
                <th className="p-4 font-bold text-sm text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    <div className="space-y-2">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p>No se encontraron registros de asistencia para este estudiante.</p>
                      <p className="text-sm">Este estudiante aún no tiene registros de asistencia.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                attendanceHistory?.map((record: any) => (
                  <tr key={record.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-4 font-medium text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {record.fecha && format(new Date(record.fecha + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: es })}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {record.timeRecord?.hora || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      {(record.estado || '').toString().toLowerCase() === 'presente' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Presente
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                          <XCircle className="w-3 h-3 mr-1" />
                          Ausente
                        </span>
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
