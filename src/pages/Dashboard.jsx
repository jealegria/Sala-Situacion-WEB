import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const KpiCard = ({ title, value }) => (
    <div className="bg-[#1c2128] border border-[#30363d] rounded-xl p-6 hover:border-[#2f81f7]/50 transition-colors group">
        <h3 className="text-[#7d8590] text-sm font-medium mb-2 group-hover:text-[#2f81f7] transition-colors">
            {title}
        </h3>
        <p className="text-3xl font-bold text-[#e6edf3]">
            {value || '—'}
        </p>
    </div>
);

const Dashboard = () => {
    const [conexion, setConexion] = useState('Verificando conexión...');

    useEffect(() => {
        async function verificar() {
            try {
                // If URL is missing, catch it early
                if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'URL_AQUI') {
                    setConexion('Falta configurar credenciales en .env.local');
                    return;
                }

                const { error } = await supabase
                    .from('guardia_adultos')
                    .select('id')
                    .limit(1);

                if (error) {
                    setConexion('Sin conexión o tabla inexistente: ' + error.message);
                } else {
                    setConexion('Supabase conectado correctamente');
                }
            } catch (err) {
                 setConexion('Error de conexión: Verifica URL y Clave');
            }
        }
        verificar();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
             {/* Supabase Connection Status (Temporary) */}
            <div className={`p-4 rounded-xl border ${conexion.includes('correctamente') ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-yellow-900/20 border-yellow-500/50 text-yellow-500'}`}>
                {conexion}
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Internaciones" value="—" />
                <KpiCard title="Promedio de Estadía" value="—" />
                <KpiCard title="Consultas Guardia" value="—" />
                <KpiCard title="Turnos Agendados" value="—" />
            </div>

            {/* Main Content Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - 2/3 */}
                <div className="lg:col-span-2 h-[400px] bg-[#1c2128] border border-[#30363d] rounded-xl flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-[#7d8590] text-lg">Gráfico de internaciones por mes</p>
                        <p className="text-[#7d8590]/60 text-sm">próximamente</p>
                    </div>
                </div>

                {/* Right Panel - 1/3 */}
                <div className="h-[400px] bg-[#1c2128] border border-[#30363d] rounded-xl flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-[#7d8590] text-lg">Top diagnósticos</p>
                        <p className="text-[#7d8590]/60 text-sm">próximamente</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
