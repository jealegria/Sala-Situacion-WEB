import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Ambulance, Users, Clock, CalendarDays, Loader2, TrendingUp, Activity } from 'lucide-react';

const KpiCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-[#1c2128] border border-[#30363d] rounded-xl p-6 hover:border-[#2f81f7]/50 transition-all group relative overflow-hidden shadow-sm hover:shadow-lg hover:shadow-[#2f81f7]/5">
        <div className={`absolute top-0 right-0 p-3 opacity-10 text-${color}-500 group-hover:scale-110 transition-transform group-hover:opacity-20`}>
            {Icon && <Icon size={64} />}
        </div>
        <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-500`}>
                    {Icon && <Icon size={18} />}
                </div>
                <h3 className="text-[#8b949e] text-sm font-semibold tracking-wide uppercase">
                    {title}
                </h3>
            </div>
            <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-[#e6edf3] font-ibm-plex">
                        {value || '—'}
                    </p>
                    {subtitle && (
                        <span className="text-xs text-[#7d8590] font-medium">
                            {subtitle}
                        </span>
                    )}
                </div>
                <div className="h-1 w-12 bg-[#2f81f7]/30 mt-2 rounded-full overflow-hidden">
                    <div className="h-full bg-[#2f81f7] w-1/2 group-hover:w-full transition-all duration-500"></div>
                </div>
            </div>
        </div>
    </div>
);

const ServiceStats = ({ title, dailyAvg, monthlyAvg, icon: Icon, colorClass }) => (
    <div className="bg-[#1c2128]/50 border border-[#30363d] rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#2f81f7]/50 group-hover:bg-[#2f81f7] transition-colors"></div>
        <div className="flex items-center gap-4 mb-10">
            <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 shadow-inner`}>
                <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-[#e6edf3] font-ibm-plex">{title}</h2>
                <p className="text-xs text-[#7d8590] font-medium tracking-widest uppercase">Promedio Anual 2025</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-1">
                <p className="text-[#8b949e] text-xs font-medium uppercase tracking-wider">Promedio Diario</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold text-[#e6edf3] tabular-nums">{Math.round(dailyAvg) || '0'}</span>
                    <span className="text-[#7d8590] text-sm font-medium">atenciones</span>
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[#8b949e] text-xs font-medium uppercase tracking-wider">Promedio Mensual</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold text-[#e6edf3] tabular-nums">{Math.round(monthlyAvg).toLocaleString() || '0'}</span>
                    <span className="text-[#7d8590] text-sm font-medium">atenciones</span>
                </div>
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        consultas: null,
        adultosCount: 0,
        pediatriaCount: 0,
        avg2025: {
            adultos: { daily: 0, monthly: 0 },
            pediatria: { daily: 0, monthly: 0 }
        },
        topDiags: [],
        loading: true
    });
    const [conexion, setConexion] = useState(null);

    useEffect(() => {
        async function loadDashboardData() {
            setStats(s => ({ ...s, loading: true }));
            try {
                // Fetch Totals
                const { data: totalsData, error: totalsError } = await supabase.from('v_kpi_totales').select('*');
                if (totalsError) throw totalsError;

                const counts = { Adultos: 0, Pediatría: 0 };
                totalsData.forEach(r => {
                    if (r.servicio === 'Adultos') counts.Adultos = r.total;
                    if (r.servicio === 'Pediatría') counts.Pediatría = r.total;
                });

                // Fetch 2025 Stats
                const get2025Counts = async (serv) => {
                    const { count } = await supabase.from('registros_guardia')
                        .select('id', { count: 'exact', head: true })
                        .eq('servicio', serv)
                        .gte('fecha_de_ingreso', '2025-01-01')
                        .lt('fecha_de_ingreso', '2026-01-01');
                    return count || 0;
                };

                const totalA2025 = await get2025Counts('Adultos');
                const totalP2025 = await get2025Counts('Pediatría');

                const totalConsultas = counts.Adultos + counts.Pediatría;

                // Fetch Top Diagnoses
                const { data: topData } = await supabase.from('v_top_diagnosticos').select('*').limit(10);

                setStats({
                    consultas: totalConsultas.toLocaleString(),
                    adultosCount: counts.Adultos,
                    pediatriaCount: counts.Pediatría,
                    avg2025: {
                        adultos: { daily: totalA2025 / 365, monthly: totalA2025 / 12 },
                        pediatria: { daily: totalP2025 / 365, monthly: totalP2025 / 12 }
                    },
                    topDiags: topData || [],
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
        <div className="space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12 px-4">
             {/* Header Section */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#30363d] pb-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold text-[#e6edf3] font-ibm-plex tracking-tight flex items-center gap-3">
                        <Activity className="text-[#2f81f7]" size={36} />
                        Sala de Situación HPN
                    </h1>
                    <div className="flex items-center gap-3">
                        <p className="text-[#7d8590] text-sm flex items-center gap-2 font-medium">
                            <span className={`w-2.5 h-2.5 rounded-full ${conexion === 'conectado' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {conexion === 'conectado' ? 'Conexión en tiempo real activa' : 'Error de conexión'}
                        </p>
                    </div>
                </div>
             </div>

            {/* Averages 2025 Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-3 mb-2">
                    <CalendarDays className="text-[#2f81f7]" size={24} />
                    <h2 className="text-[#e6edf3] font-bold text-xl tracking-tight uppercase">Métricas de Atención 2025</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

            {/* General KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Acumulado" value={stats.consultas} icon={Ambulance} color="green" subtitle="Todas las fechas" />
                <KpiCard title="Adultos (Total)" value={stats.adultosCount.toLocaleString()} icon={Users} color="blue" />
                <KpiCard title="Pediatría (Total)" value={stats.pediatriaCount.toLocaleString()} icon={Users} color="purple" />
                <KpiCard title="Atención Crítica" value="—" icon={TrendingUp} color="red" subtitle="Sin datos" />
            </div>

            {/* Bottom Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                <div className="lg:col-span-2 bg-[#1c2128] border border-[#30363d] rounded-2xl p-8 flex flex-col min-h-[400px]">
                    <h3 className="text-[#e6edf3] font-bold text-xl mb-8 flex items-center gap-3">
                        <TrendingUp size={24} className="text-[#2f81f7]" />
                        Tendencia de Atención
                    </h3>
                    <div className="flex-1 border border-[#30363d] border-dashed rounded-2xl flex flex-col items-center justify-center bg-[#0d1117]/30">
                        <Clock size={48} className="text-[#30363d] mb-4" />
                        <p className="text-[#e6edf3] font-semibold text-lg">Módulo de Gráficos</p>
                        <p className="text-[#7d8590] text-sm">Visualización temporal en desarrollo</p>
                    </div>
                </div>

                <div className="bg-[#1c2128] border border-[#30363d] rounded-2xl p-8 flex flex-col">
                    <h3 className="text-[#e6edf3] font-bold text-xl mb-8 flex items-center gap-3 font-ibm-plex">
                        <Activity size={24} className="text-yellow-500" />
                        Top Diagnósticos
                    </h3>
                    <div className="flex-1 space-y-4">
                        {stats.loading ? (
                            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#2f81f7]" size={40} /></div>
                        ) : stats.topDiags.length > 0 ? (
                            <div className="space-y-4">
                                {stats.topDiags.map((item, idx) => (
                                    <div key={idx} className="flex flex-col gap-1 p-2 rounded-lg hover:bg-[#30363d]/30 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#e6edf3] text-sm font-bold truncate uppercase">{item.diagnostico}</span>
                                            <span className="text-[#2f81f7] font-mono text-sm font-bold">{item.cantidad.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-[#0d1117] h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-[#2f81f7]/50 h-full w-[70%]"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[#7d8590] text-sm italic">Sin datos disponibles</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
