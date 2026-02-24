import { useState } from "react";
import { useTeachers, useCreateTeacher } from "@/hooks/use-teachers";
import { PageHeader, Card, Modal, LoadingSpinner } from "@/components/ui-components";
import { Plus, Mail } from "lucide-react";

export default function Teachers() {
  const { data: teachers, isLoading } = useTeachers();
  const createMutation = useCreateTeacher();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "", email: "", username: "", password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync(formData);
    setIsModalOpen(false);
    setFormData({ nombre: "", email: "", username: "", password: "" });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Profesores" 
        description="Administrar cuentas del personal docente."
        action={
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers?.map((teacher) => (
          <Card key={teacher.id} className="p-6 hover-lift">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-xl">
                {teacher.nombre.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg">{teacher.nombre}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="w-3 h-3" /> {teacher.email}
                </p>
              </div>
            </div>
          </Card>
        ))}
        {teachers?.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground bg-card border border-dashed rounded-2xl">
            No hay profesores registrados.
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agregar nuevo profesor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Nombre completo</label>
            <input required type="text" className="input-base" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Correo electrónico</label>
            <input required type="email" className="input-base" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-muted-foreground mb-3">Credenciales de acceso</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Username</label>
                <input required type="text" className="input-base" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Password</label>
                <input required type="text" className="input-base" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline">Cancelar</button>
            <button type="submit" disabled={createMutation.isLoading} className="btn-primary">
              {createMutation.isLoading ? "Creando..." : "Guardar profesor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
