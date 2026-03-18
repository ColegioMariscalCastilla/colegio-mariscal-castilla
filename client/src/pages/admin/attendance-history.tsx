import { useStudents } from "@/hooks/use-students";
import { useAttendanceWithTime, useDeleteAllAttendance, useDeleteStudentAttendance } from "@/hooks/use-attendance";
import { PageHeader, Card, LoadingSpinner, Modal } from "@/components/ui-components";
import { Calendar, Eye, Users, Trash2, Clock, UserCheck, XCircle, User, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AttendanceHistory() {
  const { data: students, isLoading: isLoadingStudents } = useStudents();
  const [, setLocation] = useLocation();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const deleteAllMutation = useDeleteAllAttendance();
  const deleteStudentMutation = useDeleteStudentAttendance();

  const { data: attendanceHistory } = useAttendanceWithTime({ studentId: selectedStudent?.id });

  const filteredStudents = students?.filter(s => 
    s.nombre.toLowerCase().includes(search.toLowerCase()) || 
    s.dni.includes(search)
  ) || [];

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleDeleteAllHistory = async () => {
    await deleteAllMutation.mutateAsync();
  };

  const handleDeleteIndividualHistory = async () => {
    if (!selectedStudent) return;
    await deleteStudentMutation.mutateAsync(selectedStudent.id.toString());
  };

  const handleViewStudentHistory = (student: any) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  if (isLoadingStudents) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full">
      <PageHeader 
        title="Historial de Asistencias" 
        description="Ver y gestionar el historial de asistencia de todos los estudiantes."
        action={
          <button 
            onClick={handleDeleteAllHistory}
            disabled={deleteAllMutation.isPending}
            className="btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {deleteAllMutation.isPending ? "Eliminando..." : "Eliminar Todo"}
          </button>
        }
      />

      {/* Buscador */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-3 max-w-md">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o DNI..." 
            className="input-base flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card>

        <div className="mb-6 mt-4 px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            Total de estudiantes: {filteredStudents?.length || 0}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="p-4 font-bold text-sm text-muted-foreground">Nombre del Estudiante</th>
                <th className="p-4 font-bold text-sm text-muted-foreground hidden sm:table-cell">DNI</th>
                <th className="p-4 font-bold text-sm text-muted-foreground">Salón</th>
                <th className="p-4 font-bold text-sm text-muted-foreground text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    <div className="space-y-2">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p>No se encontraron estudiantes</p>
                      <p className="text-sm">{search ? "No hay estudiantes que coincidan con la búsqueda." : "No hay estudiantes registrados."}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentStudents?.map((student: any) => (
                  <tr key={student.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-4 font-medium text-sm">{student.nombre}</td>
                    <td className="p-4 text-muted-foreground text-sm hidden sm:table-cell">{student.dni}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {student.classroom?.nombre || 'Sin asignar'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        <button 
                          onClick={() => handleViewStudentHistory(student)}
                          className="btn-outline flex items-center gap-2 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Historial
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredStudents.length)} de {filteredStudents.length} estudiantes
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-border rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === page
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border hover:bg-secondary'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-border rounded-md hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal para ver historial del estudiante */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={`Historial de Asistencia - ${selectedStudent?.nombre || ''}`}
      >
        {selectedStudent && (
          <div className="space-y-4">
            {/* Información del estudiante */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedStudent.nombre}</h3>
                  <p className="text-sm text-muted-foreground">DNI: {selectedStudent.dni}</p>
                  <p className="text-sm text-muted-foreground">
                    Salón: {selectedStudent.classroom?.nombre || 'Sin asignar'}
                  </p>
                </div>
              </div>
              
              {/* Botón de eliminar historial individual */}
              <button
                onClick={handleDeleteIndividualHistory}
                disabled={deleteStudentMutation.isPending}
                className="btn-danger flex items-center justify-center gap-2 w-full py-3 text-base font-bold"
              >
                <Trash2 className="w-5 h-5" />
                {deleteStudentMutation.isPending ? "Eliminando..." : "Eliminar Historial de este Estudiante"}
              </button>
            </div>

            {/* Tabla de historial */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    <th className="p-3 font-bold text-sm text-muted-foreground">Fecha</th>
                    <th className="p-3 font-bold text-sm text-muted-foreground hidden sm:table-cell">Hora</th>
                    <th className="p-3 font-bold text-sm text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory?.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-muted-foreground">
                        <div className="space-y-2">
                          <Calendar className="w-10 h-10 mx-auto text-muted-foreground" />
                          <p className="text-sm">No se encontraron registros de asistencia.</p>
                          <p className="text-xs">Este estudiante aún no tiene registros.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    attendanceHistory?.map((record: any) => (
                      <tr key={record.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                        <td className="p-3 font-medium text-sm">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {record.fecha && format(new Date(record.fecha + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: es })}
                            </div>
                            <div className="flex items-center gap-2 sm:hidden">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{record.timeRecord?.hora || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground text-sm hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {record.timeRecord?.hora || 'N/A'}
                          </div>
                        </td>
                        <td className="p-3">
                          {(record.estado || '').toString().toLowerCase() === 'presente' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Presente
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
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
          </div>
        )}
      </Modal>
    </div>
  );
}
