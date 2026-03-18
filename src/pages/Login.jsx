import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail, AlertCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            
            // Si el login es exitoso, redirigimos al dashboard
            navigate('/');
        } catch (err) {
            setError('Credenciales incorrectas o usuario no autorizado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-2xl p-8 space-y-8 animate-in fade-in duration-500 shadow-2xl">
                
                {/* Logo / Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-[#2f81f7] tracking-tight">
                        Sala de Situación <span className="text-[#e6edf3]">HPN</span>
                    </h1>
                    <p className="text-[#7d8590] text-sm">Acceso restingido al personal autorizado</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500 text-sm animate-in shake">
                        <AlertCircle size={18} />
                        <p>{error}</p>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#e6edf3] ml-1">Correo Electrónico</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7d8590]">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl py-2.5 pl-10 pr-4 text-[#e6edf3] focus:outline-none focus:border-[#2f81f7] focus:ring-1 focus:ring-[#2f81f7] transition-all"
                                placeholder="tu@hospital.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#e6edf3] ml-1">Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7d8590]">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl py-2.5 pl-10 pr-4 text-[#e6edf3] focus:outline-none focus:border-[#2f81f7] focus:ring-1 focus:ring-[#2f81f7] transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#2f81f7] hover:bg-[#2f81f7]/90 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-[#2f81f7]/20 flex justify-center items-center mt-2 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default Login;
