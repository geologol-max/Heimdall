import React, { useState } from 'react';
import { InspectorUser, authenticateUser, fetchUsers, UserRole } from '../lib/supabase';
import { ShieldCheck, Lock, Mail, User, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: InspectorUser) => void;
  isMandatoryGate?: boolean;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess, isMandatoryGate = false }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await authenticateUser(email, password);

      if (user) {
        onLoginSuccess(user);
        if (!isMandatoryGate) onClose();
      } else {
        setError("Correo o contraseña incorrectos. Ingresa credenciales válidas asignadas por el Administrador.");
      }
    } catch (err) {
      setError("Error al verificar credenciales.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    const users = await fetchUsers();
    const demoUser = users.find(u => u.role === role);
    if (demoUser) {
      onLoginSuccess(demoUser);
      if (!isMandatoryGate) onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden text-left"
      >
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
              Acceso Restringido Heimdall
            </h3>
            <p className="text-xs text-slate-400">
              Ingresa tu usuario y contraseña para acceder a la plataforma
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-2 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="usuario@heimdall.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-slate-400 hover:text-white transition cursor-pointer"
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs uppercase py-3 rounded-xl transition cursor-pointer shadow-lg shadow-orange-500/20"
          >
            {loading ? 'Verificando...' : 'Entrar a la Aplicación'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-850 space-y-3">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-center">
            Demo Rápido (3 Perfiles)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('admin')}
              className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-amber-400 text-[9px] font-bold uppercase py-2 px-1 rounded-xl transition cursor-pointer text-center"
              title="Admin Único (admin@heimdall.org / admin123)"
            >
              👑 Admin Único
            </button>
            <button
              onClick={() => handleQuickDemoLogin('supervisor')}
              className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-indigo-400 text-[9px] font-bold uppercase py-2 px-1 rounded-xl transition cursor-pointer text-center"
              title="Supervisor (supervisor@heimdall.org / super123)"
            >
              👁️ Supervisor
            </button>
            <button
              onClick={() => handleQuickDemoLogin('inspector')}
              className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-emerald-400 text-[9px] font-bold uppercase py-2 px-1 rounded-xl transition cursor-pointer text-center"
              title="Inspector (inspector@heimdall.org / 123456)"
            >
              👷 Inspector
            </button>
          </div>
        </div>

        {!isMandatoryGate && (
          <button
            onClick={onClose}
            className="w-full text-slate-500 hover:text-slate-400 text-xs font-semibold pt-1 transition text-center"
          >
            Cancelar
          </button>
        )}
      </motion.div>
    </div>
  );
}
