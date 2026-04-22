import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, CalendarDays, Loader2, Activity, Hash } from 'lucide-react';

const ServiceStats = ({ title, dailyAvg, monthlyAvg, totalYear, icon: Icon, colorClass }) => (
    <div className="bg-[#1c2128]/40 border border-[#30363d]/50 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group transition-all hover:border-[#444c56] hover:bg-[#1c2128]/60 shadow-xl">
        <div className={`absolute top-0 left-0 w-full h-[2px] ${colorClass} opacity-20 group-hover:opacity-100 transition-opacity`}></div>
        
        <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                <Icon size={18} className={colorClass.replace('bg-', 'text-')} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-[#e6edf3] font-ibm-plex leading-tight">{title}</h2>
                <p className="text-[9px] text-[#7d8590] font-bold tracking-[0.2em] uppercase opacity-50">Métricas Históricas 2025</p>
            </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 divide-x divide-[#30363d]/50">
            <div className="pr-2">
                <p className="text-[#8b949e] text-[8px] font-bold uppercase tracking-wider mb-1 opacity-60">Total Anual</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-[#e6edf3] font-ibm-plex">{totalYear.toLocaleString()}</span>
                </div>
            </div>
            <div className="px-3">
                <p className="text-[#8b949e] text-[8px] font-bold uppercase tracking-wider mb-1 opacity-60">Prom. Diario</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-[#e6edf3] font-ibm-plex">{Math.round(dailyAvg)}</span>
                    <span className="text-[#7d8590] text-[8px] font-medium uppercase">at/d</span>
                </div>
            </div>
            <div className="pl-3">
                <p className="text-[#8b949e] text-[8px] font-bold uppercase tracking-wider mb-1 opacity-60">Prom. Mensual</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-[#e6edf3] font-ibm-plex">{Math.round(monthlyAvg).toLocaleString()}</span>
                    <span className="text-[#7d8590] text-[8px] font-medium uppercase">at/m</span>
                </div>
            </div>
        </div>
    </div>
);


const Dashboard = () => {
    const [stats, setStats] = useState({
        avg2025: {
            adultos: { daily: 0, monthly: 0, total: 0 },
            pediatria: { daily: 0, monthly: 0, total: 0 }
        },
        loading: true
    });
    const [conexion, setConexion] = useState(null);

    useEffect(() => {
        async function loadDashboardData() {
            setStats(s => ({ ...s, loading: true }));
            try {
                const get2025Counts = async (serv) => {
                    const { count, error } = await supabase.from('registros_guardia')
                        .select('id', { count: 'exact', head: true })
                        .eq('servicio', serv)
                        .gte('fecha_de_ingreso', '2025-01-01')
                        .lt('fecha_de_ingreso', '2026-01-01');
                    
                    if (error) throw error;
                    return count || 0;
                };

                const [totalA, totalP] = await Promise.all([
                    get2025Counts('Adultos'),
                    get2025Counts('Pediatría')
                ]);

                setStats({
                    avg2025: {
                        adultos: { total: totalA, daily: totalA / 365, monthly: totalA / 12 },
                        pediatria: { total: totalP, daily: totalP / 365, monthly: totalP / 12 }
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
                <p className="text-[#7d8590] font-medium animate-pulse">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20 px-4">
             {/* Compact Header */}
             <div className="flex flex-col items-start gap-2 py-6 border-b border-[#30363d]">
                <h1 className="text-3xl font-black text-[#e6edf3] font-ibm-plex tracking-tight flex items-center gap-3">
                    <Activity className="text-[#2f81f7]" size={28} />
                    Sala de Situación HPN
                </h1>
                <div className="flex items-center gap-2 text-[#7d8590] text-[10px] font-bold uppercase tracking-widest">
                    <span className={`w-2 h-2 rounded-full ${conexion === 'conectado' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {conexion === 'conectado' ? 'Datos Online' : 'Offline'}
                </div>
             </div>

            {/* Main Stats Grid */}
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <CalendarDays className="text-[#2f81f7]" size={20} />
                    <h2 className="text-[#e6edf3] font-bold text-lg tracking-widest uppercase">Estadísticas 2025</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ServiceStats 
                        title="Sector Adultos" 
                        totalYear={stats.avg2025.adultos.total}
                        dailyAvg={stats.avg2025.adultos.daily} 
                        monthlyAvg={stats.avg2025.adultos.monthly} 
                        icon={Users} 
                        colorClass="bg-blue-500" 
                    />
                    <ServiceStats 
                        title="Sector Pediatría" 
                        totalYear={stats.avg2025.pediatria.total}
                        dailyAvg={stats.avg2025.pediatria.daily} 
                        monthlyAvg={stats.avg2025.pediatria.monthly} 
                        icon={Users} 
                        colorClass="bg-purple-500" 
                    />
                </div>
            </div>
            
            <div className="pt-20 text-center opacity-30">
                <p className="text-[#7d8590] text-[10px] font-bold uppercase tracking-[0.5em]">HPN • Centro de Datos</p>
            </div>
        </div>
    );
};

export default Dashboard;
