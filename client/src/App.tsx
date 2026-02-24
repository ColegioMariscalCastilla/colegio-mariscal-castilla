import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui-components";

// Pages
import Login from "@/pages/auth/login";
import AdminDashboard from "@/pages/admin/dashboard";
import Students from "@/pages/admin/students";
import Teachers from "@/pages/admin/teachers";
import Classrooms from "@/pages/admin/classrooms";
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
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><LoadingSpinner size="lg" /></div>;

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/" /> : <Login />}
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
