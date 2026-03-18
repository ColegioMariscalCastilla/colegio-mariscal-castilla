import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  School, 
  LogOut, 
  Menu, 
  X, 
  ClipboardCheck, 
  UserCircle,
  Calendar
} from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  // Auto-ocultar sidebar en móvil al cambiar de página
  React.useEffect(() => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar && overlay) {
      // Solo ocultar en móvil (pantallas pequeñas)
      if (window.innerWidth < 1024) {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
        overlay.classList.add('hidden');
      }
    }
  }, [location]); // Se ejecuta al cambiar de ruta

  const adminLinks = [
    { href: "/", label: "Panel", icon: LayoutDashboard },
    { href: "/students", label: "Alumnos", icon: GraduationCap },
    { href: "/teachers", label: "Profesores", icon: Users },
    { href: "/classrooms", label: "Salones", icon: School },
    { href: "/attendance-history", label: "Historial de Asistencias", icon: Calendar },
  ];

  const teacherLinks = [
    { href: "/", label: "Tomar Asistencia", icon: ClipboardCheck },
  ];

  const studentLinks = [
    { href: "/profile", label: "Mi Perfil", icon: UserCircle },
  ];

  const role = (user.rol || '').toString().toLowerCase();
  const links = role === 'directora' ? adminLinks
              : role === 'profesor' || role === 'profesora' ? teacherLinks
              : studentLinks;

  const isActiveLink = (href: string) => location === href;

  return (
    <div className="bg-background flex">
      {/* Sidebar responsive */}
      <div className="w-64 sm:w-72 bg-card border-r border-border flex flex-col h-screen fixed left-0 top-0 z-50 transform lg:translate-x-0 -translate-x-full transition-transform duration-300" id="sidebar">
        <div className="p-4 sm:p-6 flex items-center gap-3 border-b border-border/50">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <School className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-sm sm:text-lg leading-tight truncate">Colegio Mariscal Castilla</h1>
            <p className="text-xs text-muted-foreground font-medium">{role === 'directora' ? 'directora' : role === 'profesor' ? 'profesor' : 'estudiante'}</p>
            {user.email && (
              <p className="text-xs text-muted-foreground truncate hidden sm:block">{user.email}</p>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 sm:p-4 space-y-1.5 overflow-y-auto">
          {links.map((link) => {
            const isActive = isActiveLink(link.href);
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`
                  flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' 
                    : 'text-foreground hover:bg-secondary/60 hover:text-primary'}
                `}
              >
                <link.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                <span className="text-sm sm:text-base">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout minimalista y bonito */}
        <div className="p-3 sm:p-6 border-t border-border/50">
          <button 
            onClick={() => logout()}
            className="w-full group flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-2xl font-medium transition-all duration-300 bg-gradient-to-r from-transparent to-transparent hover:from-destructive/5 hover:to-destructive/10 hover:border-destructive/20 border border-transparent hover:shadow-lg hover:shadow-destructive/5"
            title="Cerrar sesión"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-destructive/10 group-hover:bg-destructive/20 flex items-center justify-center transition-colors duration-300">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground group-hover:text-destructive transition-colors duration-300">Cerrar Sesión</span>
            </div>
            <div className="text-xs text-muted-foreground group-hover:text-destructive/70 transition-colors duration-300 hidden sm:block">
              {user.email}
            </div>
          </button>
        </div>
      </div>

      {/* Botón menú móvil */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
        onClick={() => {
          const sidebar = document.getElementById('sidebar');
          const overlay = document.getElementById('overlay');
          if (sidebar && overlay) {
            sidebar.classList.toggle('-translate-x-full');
            sidebar.classList.toggle('translate-x-0');
            overlay.classList.toggle('hidden');
          }
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Header móvil */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-40 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <School className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-sm truncate">Colegio Mariscal Castilla</h1>
            <p className="text-xs text-muted-foreground font-medium">{role === 'directora' ? 'directora' : role === 'profesor' ? 'profesor' : 'estudiante'}</p>
          </div>
        </div>
      </div>

      {/* Overlay para móvil */}
      <div 
        className="lg:hidden fixed inset-0 bg-black/50 z-40 hidden"
        onClick={() => {
          const sidebar = document.getElementById('sidebar');
          const overlay = document.getElementById('overlay');
          if (sidebar && overlay) {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
          }
        }}
        id="overlay"
      />

      {/* Main Content responsive */}
      <main className="flex-1 ml-0 lg:ml-72 bg-background min-h-screen">
        <div className="p-4 sm:p-8 pt-16 lg:pt-4 sm:pt-8 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
