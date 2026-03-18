import { useState } from "react";
import { useStudents, useCreateStudent, useDeleteStudent, useUpdateStudent } from "@/hooks/use-students";
import { useClassrooms } from "@/hooks/use-classrooms";
import { useTeachers } from "@/hooks/use-teachers";
import { PageHeader, Card, Modal, LoadingSpinner } from "@/components/ui-components";
import { Plus, Trash2, Search, Edit, Eye, School } from "lucide-react";
import { Classroom } from "@shared/schema";

export default function Students() {
  const { data: students, isLoading } = useStudents();
  const { data: classrooms } = useClassrooms();
  const { data: teachers } = useTeachers();
  const deleteMutation = useDeleteStudent();
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [emailError, setEmailError] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  
  // Form State
  const [formData, setFormData] = useState({
    nombre: "", dni: "", classroomId: "", username: "", password: "", email: ""
  });
  const [editFormData, setEditFormData] = useState({
    nombre: "", dni: "", classroomId: "", email: ""
  });
  const [classroomSearch, setClassroomSearch] = useState("");
  const [showClassroomOptions, setShowClassroomOptions] = useState(false);
  const [editClassroomSearch, setEditClassroomSearch] = useState("");
  const [showEditClassroomOptions, setShowEditClassroomOptions] = useState(false);

  // Función para filtrar salones por nombre
  const getFilteredClassrooms = (search: string) => {
    if (!search || search.length < 1) return [];
    
    // Extraer el nombre del salón (eliminar el formato " (TURNO)")
    const cleanSearch = search.replace(/\s*\([^)]+\)\s*$/, '').toLowerCase();
    const filtered = classrooms?.filter(c => 
      c.nombre.toLowerCase().includes(cleanSearch)
    ) || [];
    
    // Agrupar por nombre y mostrar con turnos
    const grouped = filtered.reduce((acc, classroom) => {
      const name = classroom.nombre;
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(classroom);
      return acc;
    }, {} as Record<string, Classroom[]>);
    
    return Object.entries(grouped).map(([name, rooms]) => ({
      name,
      rooms: (rooms as Classroom[]).sort((a: Classroom, b: Classroom) => a.turno.localeCompare(b.turno))
    }));
  };

  // Función para verificar si ya se seleccionó un salón completo
  const isClassroomSelected = (search: string) => {
    return search && search.includes('(') && search.includes(')');
  };

  // Función para verificar si un correo ya está en uso
  const checkEmailDuplicate = (email: string, excludeStudentId?: number) => {
    const emailLower = email.toLowerCase();
    
    // Verificar en alumnos (directamente en student.email)
    const studentExists = students?.some(student => 
      student.email?.toLowerCase() === emailLower && 
      student.id !== excludeStudentId
    );
    
    // Verificar en profesores (directamente en teacher.email)
    const teacherExists = teachers?.some(teacher => 
      teacher.email?.toLowerCase() === emailLower
    );
    
    return studentExists || teacherExists;
  };

  // Función para verificar si un username ya está en uso
  const checkUsernameDuplicate = (username: string) => {
    const usernameLower = username.toLowerCase();
    
    console.log("Buscando username:", usernameLower);
    
    // Verificar en alumnos (a través de la relación user.username)
    const studentExists = students?.some(student => {
      console.log("Student:", student, "Username:", student.user?.username);
      return student.user?.username?.toLowerCase() === usernameLower;
    });
    
    // Verificar en profesores (a través de la relación user.username)
    const teacherExists = teachers?.some(teacher => {
      console.log("Teacher:", teacher, "Username:", teacher.user?.username);
      return teacher.user?.username?.toLowerCase() === usernameLower;
    });
    
    console.log("studentExists:", studentExists, "teacherExists:", teacherExists);
    
    return studentExists || teacherExists;
  };

  const handleClassroomSelect = (classroomId: string, classroomName: string) => {
    setFormData({...formData, classroomId});
    setClassroomSearch(classroomName);
    setShowClassroomOptions(false);
  };

  const handleEditClassroomSelect = (classroomId: string, classroomName: string) => {
    setEditFormData({...editFormData, classroomId});
    setEditClassroomSearch(classroomName);
    setShowEditClassroomOptions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar DNI exactamente 8 dígitos
    if (formData.dni.length !== 8) {
      return;
    }
    
    // Validar username duplicado
    console.log("Validando username:", formData.username);
    console.log("Students:", students);
    console.log("Teachers:", teachers);
    
    if (checkUsernameDuplicate(formData.username)) {
      console.log("Username duplicado detectado");
      setUsernameError("El nombre de usuario ya está en uso");
      return;
    }
    
    // Validar correo duplicado
    if (checkEmailDuplicate(formData.email)) {
      setEmailError("Este correo ya está en uso por otro usuario");
      return;
    }
    
    setEmailError("");
    setUsernameError("");
    await createMutation.mutateAsync({
      ...formData,
      classroomId: parseInt(formData.classroomId)
    });
    setIsModalOpen(false);
    setFormData({ nombre: "", dni: "", classroomId: "", username: "", password: "", email: "" });
    setClassroomSearch(""); // Limpiar búsqueda de salón
    setShowClassroomOptions(false); // Ocultar opciones de salón
  };

  const handleEdit = (student: any) => {
    setSelectedStudent(student);
    setEditFormData({
      nombre: student.nombre,
      dni: student.dni,
      classroomId: student.classroomId?.toString() || "",
      email: student.email || ""
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar DNI exactamente 8 dígitos
    if (editFormData.dni.length !== 8) {
      return;
    }
    
    // Validar correo duplicado
    if (checkEmailDuplicate(editFormData.email, selectedStudent.id)) {
      setEmailError("Este correo ya está en uso por otro usuario");
      return;
    }
    
    setEmailError("");
    await updateMutation.mutateAsync({
      id: selectedStudent.id,
      ...editFormData,
      classroomId: parseInt(editFormData.classroomId)
    });
    setIsEditModalOpen(false);
    setSelectedStudent(null);
    setEditFormData({ nombre: "", dni: "", classroomId: "", email: "" });
  };

  const handleView = (student: any) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (student: any) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (studentToDelete) {
      await deleteMutation.mutateAsync(studentToDelete.id);
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  };

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

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full">
      <PageHeader 
        title="Alumnos" 
        description="Administrar registros y asignaciones de alumnos."
        action={
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Agregar alumno
          </button>
        }
      />

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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[400px] sm:min-w-[600px]">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="p-1 sm:p-4 font-bold text-xs sm:text-sm text-muted-foreground w-1/3">Nombre</th>
                <th className="p-1 sm:p-4 font-bold text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">DNI</th>
                <th className="p-1 sm:p-4 font-bold text-xs sm:text-sm text-muted-foreground w-1/2 hidden sm:table-cell">Salón</th>
                <th className="p-1 sm:p-4 font-bold text-xs sm:text-sm text-muted-foreground text-right w-1/4 hidden sm:table-cell">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.length === 0 ? (
                <tr>
                    <td colSpan={4} className="p-4 sm:p-8 text-center text-muted-foreground text-xs sm:text-sm">No se encontraron alumnos.</td>
                  </tr>
              ) : (
                currentStudents.map((student) => (
                  <tr key={student.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-1 sm:p-4 font-medium text-xs sm:text-sm w-1/3">
                      <div className="flex flex-col gap-2">
                        <span className="truncate">{student.nombre}</span>
                        <div className="flex flex-col sm:hidden gap-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary truncate max-w-[120px] w-fit">
                            {student.classroom?.nombre || 'Sin asignar'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleView(student)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                              title="Ver detalles"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleEdit(student)}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors flex-shrink-0"
                              title="Editar alumno"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(student)}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
                              title="Eliminar alumno"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-1 sm:p-4 text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">{student.dni}</td>
                      <td className="p-1 sm:p-4 w-1/2 hidden sm:table-cell">
                      <span className="inline-flex items-center px-1 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary truncate max-w-[80px] sm:max-w-none">
                        {student.classroom?.nombre || 'Sin asignar'}
                      </span>
                    </td>
                    <td className="p-0.5 sm:p-2 pr-2 sm:pr-4 w-1/4 hidden sm:table-cell">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button 
                          onClick={() => handleView(student)}
                          className="p-0.5 sm:p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                          title="Ver detalles"
                        >
                          <Eye className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleEdit(student)}
                          className="p-0.5 sm:p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors flex-shrink-0"
                          title="Editar alumno"
                        >
                          <Edit className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(student)}
                          className="p-0.5 sm:p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
                          title="Eliminar alumno"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredStudents.length)} de {filteredStudents.length} alumnos
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

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setEmailError("");
        setUsernameError("");
        setClassroomSearch(""); // Limpiar búsqueda de salón
        setShowClassroomOptions(false); // Ocultar opciones de salón
      }} title="Agregar nuevo alumno">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Nombre completo</label>
            <input required type="text" className="input-base" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">DNI</label>
            <input 
              required 
              type="text" 
              className="input-base" 
              value={formData.dni} 
              onChange={e => {
                const value = e.target.value;
                // Solo permitir números y máximo 8 dígitos
                if (/^\d{0,8}$/.test(value)) {
                  setFormData({...formData, dni: value});
                }
              }}
              placeholder="8 dígitos"
              maxLength={8}
            />
            {formData.dni && formData.dni.length !== 8 && (
              <p className="text-xs text-destructive mt-1">El DNI debe tener exactamente 8 dígitos</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Email</label>
            <input 
              required 
              type="text" 
              className="input-base" 
              value={formData.email} 
              onChange={e => {
                setFormData({...formData, email: e.target.value});
                setEmailError(""); // Limpiar error al cambiar el email
              }}
              placeholder="correo@ejemplo.com"
            />
            {emailError && (
              <p className="text-xs text-destructive mt-1">{emailError}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Salón</label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-muted-absolute" />
                <input 
                  required 
                  type="text" 
                  className="input-base flex-1 uppercase" 
                  placeholder="Ej: 1B, 2A, 3C..." 
                  value={classroomSearch}
                  onChange={e => {
                    setClassroomSearch(e.target.value.toUpperCase());
                    setShowClassroomOptions(true);
                  }}
                  onFocus={() => setShowClassroomOptions(true)}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              {showClassroomOptions && !isClassroomSelected(classroomSearch) && getFilteredClassrooms(classroomSearch).length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {getFilteredClassrooms(classroomSearch).map(({ name, rooms }) => (
                    <div key={name} className="border-b border-border last:border-b-0">
                      <div className="px-3 py-2 text-xs font-bold text-muted-foreground bg-secondary/50">
                        {name}
                      </div>
                      {rooms.map((room: any) => (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => handleClassroomSelect(room.id.toString(), `${name} (${room.turno})`)}
                          className="w-full px-6 py-2 text-left hover:bg-secondary/50 transition-colors text-sm"
                        >
                          {name} ({room.turno})
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              
              {classroomSearch && !isClassroomSelected(classroomSearch) && getFilteredClassrooms(classroomSearch).length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg">
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No se encontraron salones con ese nombre
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-muted-foreground mb-3">Credenciales para Login del Alumno</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Usuario</label>
                <input 
                  required 
                  type="text" 
                  className={`input-base ${usernameError ? 'border-destructive focus:border-destructive' : ''}`}
                  value={formData.username} 
                  placeholder="DNI"
                  onChange={e => {
                    setFormData({...formData, username: e.target.value});
                    setUsernameError(""); // Limpiar error al cambiar el username
                  }} 
                />
                {usernameError && (
                  <p className="text-xs text-destructive mt-1">{usernameError}</p>
                )}
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
                setUsernameError("");
                setClassroomSearch(""); // Limpiar búsqueda de salón
                setShowClassroomOptions(false); // Ocultar opciones de salón
              }} 
              className="btn-outline"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending || !!emailError || !!usernameError} 
              className="btn-primary"
            >
              {createMutation.isPending ? "Creando..." : "Guardar alumno"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Alumno */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar alumno">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Nombre completo</label>
            <input required type="text" className="input-base" value={editFormData.nombre} onChange={e => setEditFormData({...editFormData, nombre: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">DNI</label>
            <input 
              required 
              type="text" 
              className="input-base" 
              value={editFormData.dni} 
              onChange={e => {
                const value = e.target.value;
                // Solo permitir números y máximo 8 dígitos
                if (/^\d{0,8}$/.test(value)) {
                  setEditFormData({...editFormData, dni: value});
                }
              }}
              placeholder="8 dígitos"
              maxLength={8}
            />
            {editFormData.dni && editFormData.dni.length !== 8 && (
              <p className="text-xs text-destructive mt-1">El DNI debe tener exactamente 8 dígitos</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Email</label>
            <input 
              required 
              type="text" 
              className="input-base" 
              value={editFormData.email} 
              onChange={e => {
                setEditFormData({...editFormData, email: e.target.value});
                setEmailError(""); // Limpiar error al cambiar el email
              }}
              placeholder="correo@ejemplo.com"
            />
            {emailError && (
              <p className="text-xs text-destructive mt-1">{emailError}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Salón</label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-muted-absolute" />
                <input 
                  required 
                  type="text" 
                  className="input-base flex-1 uppercase" 
                  placeholder="Ej: 1B, 2A, 3C..." 
                  value={editClassroomSearch}
                  onChange={e => {
                    setEditClassroomSearch(e.target.value.toUpperCase());
                    setShowEditClassroomOptions(true);
                  }}
                  onFocus={() => setShowEditClassroomOptions(true)}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              {showEditClassroomOptions && !isClassroomSelected(editClassroomSearch) && getFilteredClassrooms(editClassroomSearch).length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {getFilteredClassrooms(editClassroomSearch).map(({ name, rooms }) => (
                    <div key={name} className="border-b border-border last:border-b-0">
                      <div className="px-3 py-2 text-xs font-bold text-muted-foreground bg-secondary/50">
                        {name}
                      </div>
                      {rooms.map((room: any) => (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => handleEditClassroomSelect(room.id.toString(), `${name} (${room.turno})`)}
                          className="w-full px-6 py-2 text-left hover:bg-secondary/50 transition-colors text-sm"
                        >
                          {name} ({room.turno})
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              
              {editClassroomSearch && !isClassroomSelected(editClassroomSearch) && getFilteredClassrooms(editClassroomSearch).length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg">
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No se encontraron salones con ese nombre
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => {
                setIsEditModalOpen(false);
                setEmailError("");
              }} 
              className="btn-outline"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={updateMutation.isPending || !!emailError} 
              className="btn-primary"
            >
              {updateMutation.isPending ? "Actualizando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Detalles */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalles del alumno">
        {selectedStudent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">Nombre completo</label>
                <p className="font-medium">{selectedStudent.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">DNI</label>
                <p className="font-medium">{selectedStudent.dni}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">Salón asignado</label>
                <p className="font-medium">
                  {selectedStudent.classroom?.nombre || 'Sin asignar'} 
                  {selectedStudent.classroom?.turno && ` (${selectedStudent.classroom.turno})`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">ID de Usuario</label>
                <p className="font-medium">#{selectedStudent.userId}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Este alumno puede iniciar sesión con las credenciales asignadas durante su creación.
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

      {/* Modal Confirmar Eliminación */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Eliminación">
        {studentToDelete && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                ¿Estás seguro que deseas eliminar al alumno del sistema?
              </h3>
              <p className="text-muted-foreground mb-4">
                Esta acción eliminará permanentemente a <strong>{studentToDelete.nombre}</strong> 
                (DNI: {studentToDelete.dni}) del sistema.
              </p>
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                ⚠️ Esta acción no se puede deshacer
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-4">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="btn-outline"
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="btn-danger"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar Alumno"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
