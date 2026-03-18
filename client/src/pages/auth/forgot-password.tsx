import { useState } from "react";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Por ahora solo simulamos el envío
      // TODO: Implementar llamada al backend
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulación
      
      setIsSubmitted(true);
    } catch (err) {
      setError("Error al enviar el correo de recuperación");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
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
              <Mail className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Correo Enviado</h1>
            <p className="text-muted-foreground mt-2">Revisa tu bandeja de entrada</p>
          </div>

          {/* Mensaje de éxito */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800 text-center">
              Hemos enviado un enlace de recuperación a tu correo electrónico asociado.
              <br />
              <span className="font-medium">Usuario: {username}</span>
            </p>
          </div>

          {/* Instrucciones */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-bold text-xs">1</span>
              </div>
              <p>Revisa tu correo electrónico (incluye la carpeta de spam)</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-bold text-xs">2</span>
              </div>
              <p>Haz clic en el enlace de recuperación que te enviamos</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-bold text-xs">3</span>
              </div>
              <p>Crea tu nueva contraseña</p>
            </div>
          </div>

          {/* Botón de regreso */}
          <Link href="/login">
            <button className="w-full btn-outline flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al Login
            </button>
          </Link>
        </div>
        
        {/* Footer del formulario - AFUERA DEL LOGIN */}
        <div className="absolute bottom-4 left-0 right-0 text-center px-4">
          <div className="inline-block text-center space-y-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg">
            <p className="text-xs md:text-sm font-medium text-gray-900">©2026 Colegio Mariscal Castilla</p>
            <p className="text-xs md:text-sm font-medium text-gray-900">🔒 Plataforma segura - Recuperación de contraseña</p>
          </div>
        </div>
      </div>
    );
  }

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
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">¿Olvidaste tu contraseña?</h1>
          <p className="text-muted-foreground mt-2">No te preocupes, te ayudaremos a recuperarla</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground/80 pl-1 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Usuario o DNI
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-base bg-white/70"
              placeholder="Ingrese su usuario o DNI"
              required
            />
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Información importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Importante:</span> Te enviaremos un enlace de recuperación al correo asociado a tu cuenta.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !username}
            className="w-full btn-primary flex items-center justify-center gap-2 mt-6"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar enlace de recuperación"}
          </button>
        </form>

        {/* Enlace de regreso */}
        <div className="text-center mt-6">
          <Link href="/login" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
      
      {/* Footer del formulario - AFUERA DEL LOGIN */}
      <div className="absolute bottom-4 left-0 right-0 text-center px-4">
        <div className="inline-block text-center space-y-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg">
          <p className="text-xs md:text-sm font-medium text-gray-900">©2026 Colegio Mariscal Castilla</p>
          <p className="text-xs md:text-sm font-medium text-gray-900">🔒 Plataforma segura - Recuperación de contraseña</p>
        </div>
      </div>
    </div>
  );
}
