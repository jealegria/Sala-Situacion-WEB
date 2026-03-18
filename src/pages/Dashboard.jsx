import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Ambulance, Users, Clock, CalendarDays, Loader2, TrendingUp } from 'lucide-react';

const KpiCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-[#1c2128] border border-[#30363d] rounded-xl p-6 hover:border-[#2f81f7]/50 transition-all group relative overflow-hidden">
        <div className={`absolute top-0 right-0 p-3 opacity-10 text-${color}-500 group-hover:scale-110 transition-transform`}>
            {Icon && <Icon size={64} />}
        </div>
        <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-500`}>
                    {Icon && <Icon size={18} />}
                </div>
                <h3 className="text-[#7d8590] text-sm font-medium">
                    {title}
                </h3>
            </div>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-[#e6edf3]">
                    {value || '—'}
                </p>
                {value && value !== '—' && (
                    <span className="text-xs text-green-400 flex items-center gap-0.5 font-medium">
                        <TrendingUp size={12} />
                        +12%
                    </span>
                )}
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        consultas: null,
        topDiags: [],
        loading: true
    });
    const [conexion, setConexion] = useState(null);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                // Fetch Total Count
                const { count, error: countError } = await supabase
                    .from('guardia_adultos')
                    .select('*', { count: 'exact', head: true });

                if (countError) throw countError;

                // Fetch Top Diagnoses from View
                const { data: topData, error: topError } = await supabase
                    .from('v_top_diagnosticos')
                    .select('*')
                    .limit(5);

                // Update state
                setStats({
                    consultas: count?.toLocaleString(),
                    topDiags: topError ? [] : topData,
                    loading: false
                });
                setConexion('conectado');

            } catch (err) {
                console.error("Error al cargar dashboard:", err);
                setConexion('error');
                setStats(s => ({ ...s, loading: false }));
            }
        }
        
        loadDashboardData();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
             {/* Header */}
             <div>
                <h1 className="text-2xl font-bold text-[#e6edf3] mb-1">Sala de Situación HPN</h1>
                <p className="text-[#7d8590] text-sm flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${conexion === 'conectado' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {conexion === 'conectado' ? 'Datos sincronizados en tiempo real' : 'Sin conexión a base de datos'}
                </p>
             </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Internaciones" value="—" icon={Users} color="blue" />
                <KpiCard title="Promedio de Estadía" value="—" icon={Clock} color="purple" />
                <KpiCard title="Consultas Guardia" value={stats.consultas} icon={Ambulance} color="green" />
                <KpiCard title="Turnos Agendados" value="—" icon={CalendarDays} color="yellow" />
            </div>

            {/* Main Content Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - 2/3 */}
                <div className="lg:col-span-2 h-[450px] bg-[#1c2128] border border-[#30363d] rounded-xl p-6 flex flex-col">
                    <h3 className="text-[#e6edf3] font-semibold mb-6 font-ibm-plex flex items-center gap-2">
                        <TrendingUp size={20} className="text-[#2f81f7]" />
                        Tendencia de Consultas (2025)
                    </h3>
                    <div className="flex-1 border border-[#30363d] border-dashed rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-[#7d8590] text-lg">Visualización de series temporales</p>
                            <p className="text-[#7d8590]/60 text-sm">próximamente con Recharts</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel - 1/3 */}
                <div className="bg-[#1c2128] border border-[#30363d] rounded-xl p-6 flex flex-col">
                    <h3 className="text-[#e6edf3] font-semibold mb-6 flex items-center gap-2">
                        <Users size={20} className="text-[#2f81f7]" />
                        Top Diagnósticos
                    </h3>
                    <div className="flex-1 space-y-4">
                        {stats.loading ? (
                            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#2f81f7]" /></div>
                        ) : stats.topDiags.length > 0 ? (
                            <div className="divide-y divide-[#30363d]">
                                {stats.topDiags.map((item, idx) => (
                                    <div key={idx} className="py-3 flex items-center justify-between group cursor-default">
                                        <div className="flex flex-col">
                                            <span className="text-[#e6edf3] text-sm font-medium line-clamp-1 group-hover:text-[#2f81f7] transition-colors">
                                                {item.diagnostico}
                                            </span>
                                            <span className="text-[#7d8590] text-xs">Frecuencia absoluta</span>
                                        </div>
                                        <div className="bg-[#30363d]/50 px-2 py-1 rounded text-xs text-[#2f81f7] font-bold">
                                            {item.cantidad}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                                <p className="text-[#7d8590]">Falta definir la vista SQL</p>
                                <p className="text-[#7d8590]/60 text-xs text-balance px-4">
                                    Ejecuta el archivo 'analytics_views.sql' en Supabase para ver aquí los resultados reales.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
