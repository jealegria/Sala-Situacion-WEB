import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {
        // Obtenemos la sesión en el primer render
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Nos suscribimos a cambios de estado de autenticación (login, logout)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#2f81f7]" size={48} />
            </div>
        );
    }

    if (!session) {
        // Redirige al login si no hay sesión
        return <Navigate to="/login" />;
    }

    // Si hay sesión, renderiza la app (el contenido envuelto)
    return children;
};

export default ProtectedRoute;
