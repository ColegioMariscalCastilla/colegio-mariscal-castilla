import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  LogOut, 
  School, 
  ClipboardCheck, 
  UserCircle 
} from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const adminLinks = [
    { href: "/", label: "Panel", icon: LayoutDashboard },
    { href: "/students", label: "Alumnos", icon: GraduationCap },
    { href: "/teachers", label: "Profesores", icon: Users },
    { href: "/classrooms", label: "Salones", icon: School },
  ];

  const teacherLinks = [
    { href: "/", label: "Tomar Asistencia", icon: ClipboardCheck },
  ];

  const studentLinks = [
    { href: "/", label: "Mi Perfil", icon: UserCircle },
  ];

  const role = (user.rol || '').toString().toLowerCase();
  const links = role === 'directora' ? adminLinks
              : role === 'profesor' || role === 'profesora' ? teacherLinks
              : studentLinks;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-card border-b md:border-b-0 md:border-r border-border flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">EduManage</h1>
            <p className="text-xs text-muted-foreground font-medium">{role === 'directora' ? 'directora' : role === 'profesor' ? 'profesor' : 'estudiante'}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {links.map((link) => {
            const isActive = location === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' 
                    : 'text-foreground hover:bg-secondary/60 hover:text-primary'}
                `}
              >
                <link.icon className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="mb-4 px-4 py-3 rounded-xl bg-secondary/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {user.nombre.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user.nombre}</p>
              <p className="text-xs text-muted-foreground truncate">{user.username}</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
