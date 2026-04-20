import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, CalendarDays, Loader2, Activity } from 'lucide-react';

const ServiceStats = ({ title, dailyAvg, monthlyAvg, icon: Icon, colorClass }) => (
    <div className="bg-[#1c2128]/50 border border-[#30363d] rounded-2xl p-10 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#2f81f7]/50 group-hover:bg-[#2f81f7] transition-colors"></div>
        <div className="flex items-center gap-5 mb-12">
            <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10 shadow-inner`}>
                <Icon size={32} className={colorClass.replace('bg-', 'text-')} />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-[#e6edf3] font-ibm-plex">{title}</h2>
                <p className="text-sm text-[#7d8590] font-medium tracking-[0.2em] uppercase">Promedio Anual 2025</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-2">
                <p className="text-[#8b949e] text-xs font-bold uppercase tracking-widest opacity-70">Promedio Diario</p>
                <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-black text-[#e6edf3] tabular-nums">{Math.round(dailyAvg) || '0'}</span>
                    <span className="text-[#7d8590] text-lg font-medium">atenciones</span>
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-[#8b949e] text-xs font-bold uppercase tracking-widest opacity-70">Promedio Mensual</p>
                <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-black text-[#e6edf3] tabular-nums">{Math.round(monthlyAvg).toLocaleString() || '0'}</span>
                    <span className="text-[#7d8590] text-lg font-medium">atenciones</span>
                </div>
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        avg2025: {
            adultos: { daily: 0, monthly: 0 },
            pediatria: { daily: 0, monthly: 0 }
        },
        loading: true
    });
    const [conexion, setConexion] = useState(null);

    useEffect(() => {
        async function loadDashboardData() {
            setStats(s => ({ ...s, loading: true }));
            try {
                // Fetch 2025 Stats only
                const get2025Counts = async (serv) => {
                    const { count, error } = await supabase.from('registros_guardia')
                        .select('id', { count: 'exact', head: true })
                        .eq('servicio', serv)
                        .gte('fecha_de_ingreso', '2025-01-01')
                        .lt('fecha_de_ingreso', '2026-01-01');
                    
                    if (error) throw error;
                    return count || 0;
                };

                const [totalA2025, totalP2025] = await Promise.all([
                    get2025Counts('Adultos'),
                    get2025Counts('Pediatría')
                ]);

                setStats({
                    avg2025: {
                        adultos: { daily: totalA2025 / 365, monthly: totalA2025 / 12 },
                        pediatria: { daily: totalP2025 / 365, monthly: totalP2025 / 12 }
                    },
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

    if (stats.loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-[#2f81f7]" size={48} />
                <p className="text-[#7d8590] font-medium animate-pulse">Cargando métricas 2025...</p>
            </div>
        );
    }

    return (
        <div className="space-y-16 animate-in fade-in zoom-in-95 duration-1000 max-w-6xl mx-auto pb-20 px-4">
             {/* Simple Header */}
             <div className="flex flex-col items-center text-center gap-4 py-8">
                <div className="p-4 bg-[#2f81f7]/10 rounded-3xl mb-2">
                    <Activity className="text-[#2f81f7]" size={48} />
                </div>
                <h1 className="text-5xl font-black text-[#e6edf3] font-ibm-plex tracking-tight">
                    Sala de Situación HPN
                </h1>
                <div className="flex items-center gap-2 text-[#7d8590] text-sm font-semibold uppercase tracking-[0.3em]">
                    <span className={`w-2 h-2 rounded-full ${conexion === 'conectado' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {conexion === 'conectado' ? 'Dashboard Operativo' : 'Sin Conexión'}
                </div>
             </div>

            {/* Main Stats Section */}
            <div className="space-y-10">
                <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-12 bg-[#30363d]"></div>
                    <div className="flex items-center gap-3">
                        <CalendarDays className="text-[#2f81f7]" size={24} />
                        <h2 className="text-[#e6edf3] font-bold text-2xl tracking-widest uppercase">Atenciones 2025</h2>
                    </div>
                    <div className="h-px w-12 bg-[#30363d]"></div>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    <ServiceStats 
                        title="Sector Adultos" 
                        dailyAvg={stats.avg2025.adultos.daily} 
                        monthlyAvg={stats.avg2025.adultos.monthly} 
                        icon={Users} 
                        colorClass="bg-blue-500" 
                    />
                    <ServiceStats 
                        title="Sector Pediatría" 
                        dailyAvg={stats.avg2025.pediatria.daily} 
                        monthlyAvg={stats.avg2025.pediatria.monthly} 
                        icon={Users} 
                        colorClass="bg-purple-500" 
                    />
                </div>
            </div>
            
            {/* Footer Decoration */}
            <div className="pt-20 text-center">
                <p className="text-[#30363d] text-xs font-bold uppercase tracking-[0.5em]">Hospital Provincial Neuquén</p>
            </div>
        </div>
    );
};

export default Dashboard;
