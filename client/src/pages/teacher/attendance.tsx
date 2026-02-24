import { useState } from "react";
import { useClassrooms } from "@/hooks/use-classrooms";
import { useStudents } from "@/hooks/use-students";
import { useSaveAttendanceBatch } from "@/hooks/use-attendance";
import { PageHeader, Card, LoadingSpinner } from "@/components/ui-components";
import { Sun, Moon, Users, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function TeacherAttendance() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTurno, setSelectedTurno] = useState<string | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [attendanceState, setAttendanceState] = useState<Record<number, string>>({});

  const { data: classrooms, isLoading: loadingClassrooms } = useClassrooms();
  const { data: students, isLoading: loadingStudents } = useStudents(selectedClassroom || undefined);
  const saveMutation = useSaveAttendanceBatch();

  const handleTurnoSelect = (turno: string) => {
    // Normalize to lowercase tokens used in DB ('mañana'|'tarde')
    const normalized = turno.toString().toLowerCase().trim();
    setSelectedTurno(normalized);
    setSelectedClassroom(null);
    setStep(2);
  };

  const handleClassroomSelect = (classroomId: string) => {
    setSelectedClassroom(classroomId);
    setAttendanceState({}); // reset
    setStep(3);
  };

  const toggleStudent = (studentId: number, estado: 'presente' | 'ausente') => {
    setAttendanceState(prev => ({ ...prev, [studentId]: estado }));
  };

  const markAll = (estado: 'presente' | 'ausente') => {
    if (!students) return;
    const newState: Record<number, string> = {};
    students.forEach(s => newState[s.id] = estado);
    setAttendanceState(newState);
  };

  const handleSubmit = async () => {
    if (!students) return;
    
    // Check if all students are marked
    const unmarked = students.filter(s => !attendanceState[s.id]);
    if (unmarked.length > 0) {
      alert(`Por favor marca la asistencia para todos los alumnos. ${unmarked.length} restante(s).`);
      return;
    }

    const records = Object.entries(attendanceState).map(([studentId, estado]) => ({
      studentId: parseInt(studentId),
      estado
    }));

    await saveMutation.mutateAsync({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      records
    });

    // Reset flow
    setStep(1);
    setSelectedTurno(null);
    setSelectedClassroom(null);
    setAttendanceState({});
  };

  const filteredClassrooms = classrooms?.filter(c => {
    const turnoC = (c.turno || '').toString().toLowerCase();
    const sel = (selectedTurno || '').toString().toLowerCase();
    return turnoC === sel;
  }) || [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Tomar asistencia" 
        description={format(new Date(), "EEEE, MMMM do, yyyy")}
      />

      <div className="flex gap-4 mb-8 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -z-10" />
        {[1, 2, 3].map(num => (
          <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= num ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
            {num}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in slide-in-from-right-8">
          <button onClick={() => handleTurnoSelect('Mañana')} className="text-left group">
              <Card className="p-8 hover-lift border-2 border-transparent group-hover:border-amber-400/50 transition-all">
              <Sun className="w-12 h-12 text-amber-500 mb-4" />
              <h2 className="text-2xl font-bold">Turno Mañana</h2>
              <p className="text-muted-foreground mt-2">Clases del turno mañana</p>
            </Card>
          </button>
          <button onClick={() => handleTurnoSelect('Tarde')} className="text-left group">
              <Card className="p-8 hover-lift border-2 border-transparent group-hover:border-indigo-400/50 transition-all">
              <Moon className="w-12 h-12 text-indigo-500 mb-4" />
              <h2 className="text-2xl font-bold">Turno Tarde</h2>
              <p className="text-muted-foreground mt-2">Clases del turno tarde</p>
            </Card>
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="animate-in slide-in-from-right-8">
            <button onClick={() => setStep(1)} className="text-sm font-bold text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1">
            ← Volver a turnos
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingClassrooms ? <LoadingSpinner /> : filteredClassrooms.map(c => (
              <button key={c.id} onClick={() => handleClassroomSelect(c.id.toString())} className="text-left">
                <Card className="p-6 hover-lift hover:border-primary/50 transition-all">
                  <Users className="w-8 h-8 text-primary mb-3" />
                  <h3 className="text-xl font-bold">{c.nombre}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Seleccionar para tomar asistencia</p>
                </Card>
              </button>
            ))}
            {filteredClassrooms.length === 0 && !loadingClassrooms && (
                  <p className="col-span-full p-8 text-center text-muted-foreground border border-dashed rounded-2xl">No hay salones para este turno.</p>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-in slide-in-from-right-8">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setStep(2)} className="text-sm font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              ← Volver a salones
            </button>
            <div className="flex gap-2">
              <button onClick={() => markAll('presente')} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">Marcar todos presentes</button>
              <button onClick={() => markAll('ausente')} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors">Marcar todos ausentes</button>
            </div>
          </div>

          <Card>
            {loadingStudents ? <LoadingSpinner /> : (
              <ul className="divide-y divide-border">
                {students?.map(student => {
                  const status = attendanceState[student.id];
                  return (
                    <li key={student.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                      <div>
                        <p className="font-bold">{student.nombre}</p>
                        <p className="text-xs text-muted-foreground">DNI: {student.dni}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleStudent(student.id, 'presente')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${status === 'presente' ? 'bg-green-500 text-white shadow-sm shadow-green-500/30' : 'bg-secondary text-muted-foreground hover:bg-green-100 hover:text-green-700'}`}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Presente
                        </button>
                        <button 
                          onClick={() => toggleStudent(student.id, 'ausente')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${status === 'ausente' ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30' : 'bg-secondary text-muted-foreground hover:bg-rose-100 hover:text-rose-700'}`}
                        >
                          <XCircle className="w-4 h-4" /> Ausente
                        </button>
                      </div>
                    </li>
                  )
                })}
                {students?.length === 0 && (
                  <li className="p-8 text-center text-muted-foreground">No students in this classroom.</li>
                )}
              </ul>
            )}
          </Card>
          
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleSubmit} 
              disabled={saveMutation.isLoading || !students?.length}
              className="btn-primary w-full md:w-auto text-lg py-3 px-8"
            >
              {saveMutation.isLoading ? "Guardando..." : "Enviar asistencia"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
