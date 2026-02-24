import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { School, Loader2 } from "lucide-react";

export default function Login() {
  const { login, isLoggingIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    await login({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/50 blur-[100px] rounded-full" />

      <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-white/40 shadow-xl shadow-black/5 rounded-3xl p-8 relative z-10 hover-lift">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Colegio Mariscal Castilla</h1>
          <p className="text-muted-foreground mt-2">Inicia sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground/80 pl-1">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-base bg-white/50"
              placeholder="Ingrese su usuario"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground/80 pl-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base bg-white/50"
              placeholder="••••••••"
              required
            />
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
    </div>
  );
}
