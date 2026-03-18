import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { School, Loader2, User, Lock } from "lucide-react";
import { Link } from "wouter";

export default function Login() {
  const { login, isLoggingIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    await login({ username, password, rememberMe });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo de imagen sin opacidad */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
        style={{
          backgroundImage: 'url(/login-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'scale(1.1)',
        }}
      />
      
      {/* Elementos decorativos sutiles */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[100px] rounded-full" />

      {/* Contenedor del formulario */}
      <div className="w-full max-w-md bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl shadow-black/10 rounded-3xl p-8 relative z-10 hover-lift">
        {/* Header del formulario */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Colegio Mariscal Castilla</h1>
          <p className="text-muted-foreground mt-2">Inicia sesión</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground/80 pl-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-base bg-white/70"
              placeholder="Ingrese su usuario"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground/80 pl-1 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base bg-white/70"
              placeholder="••••••"
              required
            />
          </div>
          
          {/* Opciones adicionales */}
          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-2 text-sm text-foreground/70">
              <input 
                type="checkbox" 
                className="rounded border-gray-300"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Recordarme en este dispositivo</span>
            </label>
            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoggingIn || !username || !password}
            className="w-full btn-primary flex items-center justify-center gap-2 mt-6"
          >
            {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Iniciar sesión"}
          </button>
        </form>
      </div>
      
      {/* Footer del formulario - AFUERA DEL LOGIN */}
      <div className="absolute bottom-4 left-0 right-0 text-center px-4">
        <div className="inline-block text-center space-y-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg">
          <p className="text-xs md:text-sm font-medium text-gray-900">©2026 Colegio Mariscal Castilla</p>
          <p className="text-xs md:text-sm font-medium text-gray-900">🔒 Plataforma segura - Acceso restringido</p>
        </div>
      </div>
    </div>
  );
}


