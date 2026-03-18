import { useState } from "react";
import { useTeachers, useCreateTeacher, useDeleteTeacher } from "@/hooks/use-teachers";
import { useStudents } from "@/hooks/use-students";
import { PageHeader, Card, Modal, LoadingSpinner } from "@/components/ui-components";
import { Plus, Mail, Search, Eye, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Teachers() {
  const { data: teachers, isLoading } = useTeachers();
  const { data: students } = useStudents();
  const createMutation = useCreateTeacher();
  const deleteMutation = useDeleteTeacher();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<any>(null);
  const [emailError, setEmailError] = useState<string>("");
  const [formData, setFormData] = useState({
    nombre: "", email: "", username: "", password: ""
  });

  // Función para verificar si un correo ya está en uso
  const checkEmailDuplicate = (email: string) => {
    const emailLower = email.toLowerCase();
    
    // Verificar en profesores
    const teacherExists = teachers?.some(teacher => 
      teacher.email?.toLowerCase() === emailLower
    );
    
    // Verificar en alumnos
    const studentExists = students?.some(student => 
      student.email?.toLowerCase() === emailLower
    );
    
    return teacherExists || studentExists;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar correo duplicado
    if (checkEmailDuplicate(formData.email)) {
      setEmailError("Este correo ya está siendo utilizado por otro usuario");
      return;
    }
    
    setEmailError("");
    await createMutation.mutateAsync(formData);
    setIsModalOpen(false);
    setFormData({ nombre: "", email: "", username: "", password: "" });
  };

  const handleView = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (teacher: any) => {
    setTeacherToDelete(teacher);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!teacherToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(teacherToDelete.id);
      setIsDeleteModalOpen(false);
      setTeacherToDelete(null);
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const filteredTeachers = teachers?.filter(t => 
    t.nombre.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTeachers = filteredTeachers.slice(startIndex, endIndex);

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
        title="Profesores" 
        description="Administrar cuentas del personal docente."
        action={
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Añadir Profesor
          </button>
        }
      />

      <Card className="mb-6 p-4">
        <div className="flex items-center gap-3 max-w-md">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            className="input-base flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {currentTeachers.map((teacher) => (
          <Card key={teacher.id} className="p-4 sm:p-6 hover-lift relative">
              <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-sm sm:text-lg flex-shrink-0">
                {teacher.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm sm:text-lg truncate">{teacher.nombre}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1 truncate">
                  <Mail className="w-3 h-3" /> {teacher.email}
                </p>
                <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-3">
                  <button 
                    onClick={() => handleView(teacher)}
                    className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ver detalles"
                  >
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(teacher)}
                    className="p-1.5 sm:p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Eliminar profesor"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {currentTeachers.length === 0 && (
          <div className="col-span-full p-4 sm:p-8 text-center text-muted-foreground bg-card border border-dashed rounded-2xl text-xs sm:text-sm">
            {search ? "No se encontraron profesores que coincidan con la búsqueda." : "No hay profesores registrados."}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredTeachers.length)} de {filteredTeachers.length} profesores
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Añadir un nuevo profesor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Nombre completo</label>
            <input required type="text" className="input-base" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
            <h3 className="text-sm font-bold text-muted-foreground mb-3">Credenciales de acceso</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Usuario</label>
                <input required type="text" className="input-base" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Contraseña</label>
                <input required type="text" className="input-base" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => {
                setIsModalOpen(false);
                setEmailError("");
              }} 
              className="btn-outline"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending || !!emailError} 
              className="btn-primary"
            >
              {createMutation.isPending ? "Creando..." : "Guardar profesor"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Detalles Profesor */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalles del Profesor">
        {selectedTeacher && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center font-display font-bold text-3xl mx-auto mb-4">
                {selectedTeacher.nombre.charAt(0)}
              </div>
              <h3 className="text-xl font-bold">{selectedTeacher.nombre}</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">Email</label>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {selectedTeacher.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">ID de Usuario</label>
                <p className="font-medium">#{selectedTeacher.userId}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">ID de Profesor</label>
                <p className="font-medium">#{selectedTeacher.id}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Este profesor puede iniciar sesión con las credenciales asignadas durante su creación.
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setIsViewModalOpen(false)} className="btn-primary">
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de eliminación */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Eliminar Profesor">
        <div className="space-y-4">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-destructive">
              ¿Estás seguro de que deseas eliminar a este profesor?
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Esta acción no se puede deshacer y eliminará permanentemente el registro del profesor.
            </p>
          </div>
          
          {teacherToDelete && (
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="font-medium">{teacherToDelete.nombre}</p>
              <p className="text-sm text-muted-foreground">{teacherToDelete.email}</p>
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
