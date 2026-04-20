import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Ambulance, Users, Clock, CalendarDays, Loader2, TrendingUp, Activity, Calendar } from 'lucide-react';

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
        <div className="flex items-center gap-4 mb-8">
            <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 shadow-inner`}>
                <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-[#e6edf3] font-ibm-plex">{title}</h2>
                <p className="text-xs text-[#7d8590] font-medium tracking-widest uppercase">Promedio Anual 2025</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
                <p className="text-[#8b949e] text-xs font-medium uppercase">Promedio Diario</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-[#e6edf3] tabular-nums">{dailyAvg || '0'}</span>
                    <span className="text-[#7d8590] text-sm">pac/día</span>
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[#8b949e] text-xs font-medium uppercase">Promedio Mensual</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-[#e6edf3] tabular-nums">{monthlyAvg || '0'}</span>
                    <span className="text-[#7d8590] text-sm">pac/mes</span>
                </div>
            </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#30363d] flex items-center justify-between">
            <span className="text-[#7d8590] text-xs flex items-center gap-1.5 font-medium italic">
                <Activity size={14} className="text-green-500" /> Basado en records totales 2025
            </span>
            <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-[#1c2128] bg-[#30363d] flex items-center justify-center text-[10px] text-[#7d8590]">
                        {i}
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [servicioFiltro, setServicioFiltro] = useState('General');
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
                // Fetch Totals from the KPI View
                const { data: totalsData, error: totalsError } = await supabase
                    .from('v_kpi_totales')
                    .select('*');

                if (totalsError) throw totalsError;

                const counts = { Adultos: 0, Pediatría: 0 };
                totalsData.forEach(r => {
                    if (r.servicio === 'Adultos') counts.Adultos = r.total;
                    if (r.servicio === 'Pediatría') counts.Pediatría = r.total;
                });

                // Fetch 2025 Stats
                const get2025Counts = async (serv) => {
                    const { count, error } = await supabase.from('registros_guardia')
                        .select('id', { count: 'exact', head: true })
                        .eq('servicio', serv)
                        .gte('fecha_de_ingreso', '2025-01-01')
                        .lt('fecha_de_ingreso', '2026-01-01');
                    if (error) {
                        console.error(`Error fetching 2025 counts for ${serv}:`, error);
                        return 0;
                    }
                    return count || 0;
                };

                const totalAdultos2025 = await get2025Counts('Adultos');
                const totalPed2025 = await get2025Counts('Pediatría');

                const avgA = {
                    daily: (totalAdultos2025 / 365).toFixed(1),
                    monthly: Math.round(totalAdultos2025 / 12).toLocaleString()
                };
                const avgP = {
                    daily: (totalPed2025 / 365).toFixed(1),
                    monthly: Math.round(totalPed2025 / 12).toLocaleString()
                };

                // Fetch Top Diagnoses filtered by service if needed
                let query = supabase.from('v_top_diagnosticos').select('*');
                if (servicioFiltro !== 'General') {
                    query = query.eq('servicio', servicioFiltro);
                }
                const { data: topData } = await query.limit(10);

                const totalFiltrado = servicioFiltro === 'General' 
                    ? (counts.Adultos + counts.Pediatría) 
                    : (servicioFiltro === 'Adultos' ? counts.Adultos : counts.Pediatría);

                setStats({
                    consultas: totalFiltrado.toLocaleString(),
                    adultosCount: counts.Adultos,
                    pediatriaCount: counts.Pediatría,
                    avg2025: {
                        adultos: avgA,
                        pediatria: avgP
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
    }, [servicioFiltro]);

    const filtrar = (serv) => setServicioFiltro(serv);

    return (
        <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
             {/* Header Section */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#30363d] pb-8">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-[#e6edf3] font-ibm-plex tracking-tight flex items-center gap-3">
                        <Activity className="text-[#2f81f7]" size={32} />
                        Sala de Situación HPN
                    </h1>
                    <div className="flex items-center gap-3">
                        <p className="text-[#7d8590] text-sm flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${conexion === 'conectado' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {conexion === 'conectado' ? `Activo: ${servicioFiltro}` : 'Desconectado'}
                        </p>
                        <span className="text-[#30363d]">|</span>
                        <p className="text-[#7d8590] text-xs font-mono uppercase tracking-widest bg-[#30363d]/30 px-2 py-0.5 rounded">Dashboard v2.0</p>
                    </div>
                </div>

                <div className="flex bg-[#1c2128] border border-[#30363d] p-1.5 rounded-2xl shadow-inner">
                    {['General', 'Adultos', 'Pediatría'].map((opt) => (
                        <button
                            key={opt}
                            onClick={() => filtrar(opt)}
                            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                servicioFiltro === opt 
                                ? 'bg-[#2f81f7] text-white shadow-xl shadow-[#2f81f7]/20 scale-105' 
                                : 'text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#30363d]'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
             </div>

            {/* Averages 2025 Section - REQUESTED COMPONENTS */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <CalendarDays className="text-[#2f81f7]" size={20} />
                    <h2 className="text-[#e6edf3] font-bold text-lg">Métricas de Atención 2025</h2>
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
                <KpiCard title="Atención Crítica" value="—" icon={TrendingUp} color="red" subtitle="Placeholder" />
            </div>

            {/* Data Insights Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Evolution Chart Placeholder */}
                <div className="lg:col-span-2 bg-[#1c2128] border border-[#30363d] rounded-2xl p-8 flex flex-col group hover:border-[#2f81f7]/30 transition-all shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-[#2f81f7]/10 rounded-lg">
                                <TrendingUp size={20} className="text-[#2f81f7]" />
                             </div>
                             <span className="text-[#e6edf3] font-bold text-lg font-ibm-plex">Tendencia de Atención</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#7d8590] bg-[#30363d]/50 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                            {servicioFiltro}
                        </div>
                    </div>
                    <div className="flex-1 min-h-[300px] border border-[#30363d] border-dashed rounded-2xl flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-[#30363d]/5">
                        <Clock size={48} className="text-[#30363d] mb-4" />
                        <p className="text-[#e6edf3] font-semibold text-xl mb-1">Visualización en Proceso</p>
                        <p className="text-[#7d8590] text-sm max-w-xs text-center font-medium">Integrando Recharts para mostrar la evolución diaria de consultas por sector.</p>
                        <button className="mt-6 px-4 py-1.5 rounded-lg border border-[#30363d] text-[#7d8590] text-xs font-bold uppercase hover:bg-[#30363d] hover:text-[#e6edf3] transition-all">Ver detalle completo</button>
                    </div>
                </div>

                {/* Top Diagnostics */}
                <div className="bg-[#1c2128] border border-[#30363d] rounded-2xl p-8 flex flex-col group hover:border-[#2f81f7]/30 transition-all shadow-sm">
                    <h3 className="text-[#e6edf3] font-bold text-lg font-ibm-plex mb-8 flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                            <Activity size={20} className="text-yellow-500" />
                        </div>
                        Top Diagnósticos
                    </h3>
                    <div className="flex-1 space-y-3 overflow-hidden">
                        {stats.loading ? (
                            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#2f81f7]" size={40} /></div>
                        ) : stats.topDiags.length > 0 ? (
                            <div className="space-y-4">
                                {stats.topDiags.map((item, idx) => (
                                    <div key={idx} className="group/item cursor-default flex flex-col gap-1.5 p-3 rounded-xl hover:bg-[#30363d]/30 transition-all">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#e6edf3] text-sm font-bold truncate uppercase tracking-tight group-hover/item:text-[#2f81f7] transition-colors">
                                                {item.diagnostico}
                                            </span>
                                            <span className="bg-[#30363d] px-2.5 py-0.5 rounded-full text-[10px] text-[#2f81f7] font-extrabold shadow-sm">
                                                {item.cantidad.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-bold text-[#7d8590]">
                                            <span className="flex items-center gap-1 uppercase tracking-widest underline decoration-[#30363d] underline-offset-4 decoration-2">
                                                {item.cie10_codigo || 'CIE10 NC'}
                                            </span>
                                            <div className="flex-1 mx-3 h-[2px] bg-[#30363d]/50 rounded-full relative overflow-hidden">
                                                <div className="absolute left-0 top-0 h-full bg-[#2f81f7]/40 w-[60%]"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                <Ambulance size={48} className="text-[#30363d] opacity-20" />
                                <p className="text-[#7d8590] text-sm font-medium italic">Sin datos registrados para esta selección.</p>
                            </div>
                        )}
                    </div>
                    <button className="mt-8 w-full py-2.5 bg-[#30363d]/50 hover:bg-[#30363d] text-[#e6edf3] text-xs font-bold rounded-xl transition-all uppercase tracking-widest">Descargar Reporte</button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
