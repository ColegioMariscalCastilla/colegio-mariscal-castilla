import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui-components";

// Pages
import Login from "@/pages/auth/login";
import ForgotPassword from "@/pages/auth/forgot-password";
import AdminDashboard from "@/pages/admin/dashboard";
import Students from "@/pages/admin/students";
import Teachers from "@/pages/admin/teachers";
import Classrooms from "@/pages/admin/classrooms";
import AttendanceHistory from "@/pages/admin/attendance-history";
import StudentAttendance from "@/pages/admin/student-attendance";
import TeacherAttendance from "@/pages/teacher/attendance";
import StudentProfile from "@/pages/student/profile";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner size="lg" />;
  if (!user) return <Redirect to="/login" />;
  const role = (user.rol || '').toString().toUpperCase();
  const allowed = allowedRoles.map(r => r.toString().toUpperCase());
  if (!allowed.includes(role)) return <Redirect to="/" />;
  
  return <Component />;
}

function Router() {
  const { user, isLoading, error } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><LoadingSpinner size="lg" /></div>;
  
  // Si hay error de conexión, mostrar página de error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error de Conexión</h1>
          <p className="text-gray-600 mb-4">No se pudo conectar con el servidor</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {(user && user.id) ? <Redirect to="/" /> : <Login />}
      </Route>

      <Route path="/forgot-password">
        <ForgotPassword />
      </Route>

      <Route path="/">
        {!user ? <Redirect to="/login" /> : 
         (user.rol || '').toString().toUpperCase() === 'DIRECTORA' ? <AppLayout><AdminDashboard /></AppLayout> :
         (user.rol || '').toString().toUpperCase() === 'PROFESOR' ? <AppLayout><TeacherAttendance /></AppLayout> :
         <AppLayout><StudentProfile /></AppLayout>
        }
      </Route>

      {/* Admin Routes */}
      <Route path="/students">
        <AppLayout><ProtectedRoute component={Students} allowedRoles={['DIRECTORA']} /></AppLayout>
      </Route>
      <Route path="/teachers">
        <AppLayout><ProtectedRoute component={Teachers} allowedRoles={['DIRECTORA']} /></AppLayout>
      </Route>
      <Route path="/classrooms">
        <AppLayout><ProtectedRoute component={Classrooms} allowedRoles={['DIRECTORA']} /></AppLayout>
      </Route>
      <Route path="/attendance-history">
        <AppLayout><ProtectedRoute component={AttendanceHistory} allowedRoles={['DIRECTORA']} /></AppLayout>
      </Route>
      <Route path="/students/:id/attendance">
        <AppLayout><ProtectedRoute component={StudentAttendance} allowedRoles={['DIRECTORA']} /></AppLayout>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
          }
        }} 
      />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
