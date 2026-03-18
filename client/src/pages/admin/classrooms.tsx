import { useState } from "react";
import { useClassrooms, useCreateClassroom, useUpdateClassroom, useDeleteClassroom } from "@/hooks/use-classrooms";
import { useStudents } from "@/hooks/use-students";
import { PageHeader, Card, Modal, LoadingSpinner } from "@/components/ui-components";
import { Plus, Sun, Moon, Search, Eye, Users, Edit, Trash2 } from "lucide-react";

export default function Classrooms() {
  const { data: classrooms, isLoading } = useClassrooms();
  const { data: students } = useStudents();
  const createMutation = useCreateClassroom();
  const updateMutation = useUpdateClassroom();
  const deleteMutation = useDeleteClassroom();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState<any>(null);
  const [classroomToDelete, setClassroomToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({ nombre: "", turno: "mañana" });
  const [editFormData, setEditFormData] = useState({ nombre: "", turno: "mañana" });
  const [duplicateError, setDuplicateError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convertir nombre a mayúsculas
    const normalizedNombre = formData.nombre.toUpperCase().trim();
    
    // Verificar si ya existe un salón con el mismo nombre y turno
    const existingClassroom = classrooms?.find(
      c => c.nombre.toUpperCase() === normalizedNombre && c.turno === formData.turno
    );
    
    if (existingClassroom) {
      setDuplicateError(`El salón "${normalizedNombre}" ya existe en el turno de ${formData.turno === 'mañana' ? 'mañana' : 'tarde'}`);
      return;
    }
    
    setDuplicateError("");
    await createMutation.mutateAsync({ ...formData, nombre: normalizedNombre });
    setIsModalOpen(false);
    setFormData({ nombre: "", turno: "mañana" });
  };

  const handleView = (classroom: any) => {
    setSelectedClassroom(classroom);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (classroom: any) => {
    setClassroomToDelete(classroom);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!classroomToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(classroomToDelete.id);
      setIsDeleteModalOpen(false);
      setClassroomToDelete(null);
    } catch (error) {
      console.error('Error deleting classroom:', error);
    }
  };

  const handleEdit = (classroom: any) => {
    setSelectedClassroom(classroom);
    setEditFormData({
      nombre: classroom.nombre,
      turno: classroom.turno || "mañana"
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync({
      id: selectedClassroom.id,
      ...editFormData
    });
    setIsEditModalOpen(false);
    setSelectedClassroom(null);
    setEditFormData({ nombre: "", turno: "mañana" });
  };

  const getStudentCount = (classroomId: number) => {
    return students?.filter(s => s.classroomId === classroomId).length || 0;
  };

  const filteredClassrooms = classrooms?.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase()) || 
    c.turno.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredClassrooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClassrooms = filteredClassrooms.slice(startIndex, endIndex);

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

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full">
      <PageHeader 
        title="Salones" 
        description="Administrar aulas y turnos."
        action={
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Agregar salón
          </button>
        }
      />

      <Card className="mb-6 p-4">
        <div className="flex items-center gap-3 max-w-md">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o turno..." 
            className="input-base flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {currentClassrooms.map((classroom) => {
          const turnoNormalized = (classroom.turno || '').toString().toLowerCase();
          const isMorning = turnoNormalized === 'mañana' || turnoNormalized === 'manana';
          const studentCount = getStudentCount(classroom.id);
          return (
          <Card key={classroom.id} className={`p-4 sm:p-6 hover-lift border-l-4 relative ${isMorning ? 'border-l-amber-500' : 'border-l-indigo-500'}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-lg sm:text-2xl truncate">{classroom.nombre}</h3>
                <div className="flex items-center gap-1 sm:gap-1.5 mt-2 text-xs sm:text-sm font-medium text-muted-foreground">
                  {isMorning ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />}
                  Turno {isMorning ? 'Mañana' : 'Tarde'}
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-primary">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {studentCount} {studentCount === 1 ? 'alumno' : 'alumnos'}
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={() => handleEdit(classroom)}
                  className="p-1.5 sm:p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Editar salón"
                >
                  <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button 
                  onClick={() => handleView(classroom)}
                  className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Ver detalles"
                >
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteClick(classroom)}
                  className="p-1.5 sm:p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Eliminar salón"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </Card>
        )})}
        {currentClassrooms.length === 0 && (
          <div className="col-span-full p-4 sm:p-8 text-center text-muted-foreground bg-card border border-dashed rounded-2xl text-xs sm:text-sm">
            {search ? "No se encontraron salones que coincidan con la búsqueda." : "No hay salones configurados aún."}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredClassrooms.length)} de {filteredClassrooms.length} salones
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agregar nuevo salón">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Nombre del salón</label>
            <input 
              required 
              type="text" 
              className="input-base uppercase" 
              placeholder="ej., 1A, 2B, 3C" 
              value={formData.nombre} 
              onChange={e => setFormData({...formData, nombre: e.target.value})} 
              style={{ textTransform: 'uppercase' }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Turno</label>
            <select required className="input-base" value={formData.turno} onChange={e => setFormData({...formData, turno: e.target.value})}>
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
            </select>
          </div>
          {duplicateError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg text-sm">
              {duplicateError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => {
              setIsModalOpen(false);
              setDuplicateError("");
            }} className="btn-outline">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? "Creando..." : "Guardar salón"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Salón */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar salón">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Nombre del salón</label>
            <input 
              required 
              type="text" 
              className="input-base uppercase" 
              placeholder="ej., 1A, 2B, 3C" 
              value={editFormData.nombre} 
              onChange={e => setEditFormData({...editFormData, nombre: e.target.value})}
              style={{ textTransform: 'uppercase' }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Turno</label>
            <select required className="input-base" value={editFormData.turno} onChange={e => setEditFormData({...editFormData, turno: e.target.value})}>
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-outline">Cancelar</button>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
              {updateMutation.isPending ? "Actualizando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Detalles Salón */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalles del Salón">
        {selectedClassroom && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center font-display font-bold text-3xl mx-auto mb-4 ${
                selectedClassroom.turno?.toLowerCase() === 'mañana' || selectedClassroom.turno?.toLowerCase() === 'manana'
                  ? 'bg-amber-100 text-amber-600' 
                  : 'bg-indigo-100 text-indigo-600'
              }`}>
                {selectedClassroom.nombre}
              </div>
              <h3 className="text-xl font-bold">{selectedClassroom.nombre}</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">Turno</label>
                <p className="font-medium flex items-center gap-2">
                  {selectedClassroom.turno?.toLowerCase() === 'mañana' || selectedClassroom.turno?.toLowerCase() === 'manana' 
                    ? <><Sun className="w-4 h-4 text-amber-500" /> Mañana</>
                    : <><Moon className="w-4 h-4 text-indigo-500" /> Tarde</>
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">Total de Alumnos Matriculados</label>
                <p className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {getStudentCount(selectedClassroom.id)} {getStudentCount(selectedClassroom.id) === 1 ? 'alumno' : 'alumnos'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">ID del Salón</label>
                <p className="font-medium">#{selectedClassroom.id}</p>
              </div>
            </div>
            {getStudentCount(selectedClassroom.id) > 0 && (
              <div className="pt-4 border-t border-border">
                <h4 className="font-bold text-sm text-muted-foreground mb-3">Alumnos en este salón:</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {students?.filter(s => s.classroomId === selectedClassroom.id).map(student => (
                    <div key={student.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                      <span className="font-medium">{student.nombre}</span>
                      <span className="text-sm text-muted-foreground">DNI: {student.dni}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <button onClick={() => setIsViewModalOpen(false)} className="btn-primary">
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de eliminación */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Eliminar Salón">
        <div className="space-y-4">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-destructive">
              ¿Estás seguro de que deseas eliminar este salón?
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Esta acción no se puede deshacer y eliminará permanentemente el registro del salón.
            </p>
          </div>
          
          {classroomToDelete && (
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="font-medium">{classroomToDelete.nombre}</p>
              <p className="text-sm text-muted-foreground">Turno: {classroomToDelete.turno}</p>
            </div>
          )}
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="btn-danger"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
