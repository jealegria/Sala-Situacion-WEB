import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, CalendarDays, Loader2, Activity, Hash } from 'lucide-react';

const ComparisonItem = ({ label, current, previous, unit = "" }) => {
    const diff = current - previous;
    const percent = previous > 0 ? (diff / previous) * 100 : 0;
    const isIncrease = diff > 0;

    return (
        <div className="space-y-1">
            <p className="text-[#8b949e] text-[9px] font-bold uppercase tracking-wider opacity-60 leading-tight">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#e6edf3] font-ibm-plex">{current.toLocaleString()}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isIncrease ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {isIncrease ? '↑' : '↓'} {Math.abs(percent).toFixed(1)}%
                </span>
            </div>
            <p className="text-[9px] text-[#7d8590] opacity-50">vs {previous.toLocaleString()} en 2025</p>
        </div>
    );
};

const ServiceStats = ({ title, data, periodInfo, icon: Icon, colorClass }) => (
    <div className="bg-[#1c2128]/40 border border-[#30363d]/50 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group transition-all hover:border-[#444c56] hover:bg-[#1c2128]/60 shadow-xl">
        <div className={`absolute top-0 left-0 w-full h-[2px] ${colorClass} opacity-20 group-hover:opacity-100 transition-opacity`}></div>
        
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                    <Icon size={18} className={colorClass.replace('bg-', 'text-')} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-[#e6edf3] font-ibm-plex leading-tight">{title}</h2>
                    <p className="text-[9px] text-[#7d8590] font-bold tracking-[0.2em] uppercase opacity-50">Análisis Comparativo</p>
                </div>
            </div>
        </div>
        
        <div className="space-y-8">
            {/* Acumulado */}
            <ComparisonItem 
                label={`Acumulado (${periodInfo.acumuladoLabel})`}
                current={data.cum2026}
                previous={data.cum2025}
            />

            {/* Mes a Mes */}
            <div className="pt-6 border-t border-[#30363d]/50">
                <ComparisonItem 
                    label={`Mes Cerrado (${periodInfo.mesCerradoLabel})`}
                    current={data.last2026}
                    previous={data.last2025}
                />
            </div>

            {/* Promedios del periodo actual */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[#30363d]/50">
                <div>
                    <p className="text-[#8b949e] text-[9px] font-bold uppercase tracking-wider mb-1 opacity-60">Prom. Diario (2026)</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-[#e6edf3] font-ibm-plex">{Math.round(data.dailyAvg2026)}</span>
                        <span className="text-[#7d8590] text-[8px] font-medium uppercase">at/d</span>
                    </div>
                </div>
                <div>
                    <p className="text-[#8b949e] text-[9px] font-bold uppercase tracking-wider mb-1 opacity-60">Prom. Mensual (2026)</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-[#e6edf3] font-ibm-plex">{Math.round(data.monthlyAvg2026).toLocaleString()}</span>
                        <span className="text-[#7d8590] text-[8px] font-medium uppercase">at/m</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        adultos: { cum2026: 0, cum2025: 0, last2026: 0, last2025: 0, dailyAvg2026: 0, monthlyAvg2026: 0 },
        pediatria: { cum2026: 0, cum2025: 0, last2026: 0, last2025: 0, dailyAvg2026: 0, monthlyAvg2026: 0 },
        periodInfo: { acumuladoLabel: "", mesCerradoLabel: "" },
        loading: true
    });
    const [conexion, setConexion] = useState(null);

    useEffect(() => {
        async function loadDashboardData() {
            setStats(s => ({ ...s, loading: true }));
            try {
                // 1. Detectar última fecha
                const { data: latest } = await supabase.from('registros_guardia')
                    .select('fecha_de_ingreso')
                    .order('fecha_de_ingreso', { ascending: false })
                    .limit(1).single();

                if (!latest) throw new Error("No hay datos");

                const date = new Date(latest.fecha_de_ingreso);
                const limitMonth = date.getMonth(); // Ej: Marzo = 2
                const year = date.getFullYear();

                const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                const mesCerradoLabel = meses[limitMonth - 1];
                const acumuladoLabel = `Ene-${mesCerradoLabel.substring(0,3)}`;

                // Rangos
                const isoEnd = new Date(year, limitMonth, 1).toISOString().split('T')[0]; // '2026-03-01'
                const isoStartLast = new Date(year, limitMonth - 1, 1).toISOString().split('T')[0]; // '2026-02-01'
                
                const isoStart2025 = `2025-01-01`;
                const isoEnd2025 = `2025-${(limitMonth + 1).toString().padStart(2, '0')}-01`;
                const isoStartLast2025 = `2025-${limitMonth.toString().padStart(2, '0')}-01`;
                const isoEndLast2025 = isoEnd2025;

                const getCount = async (serv, start, end) => {
                    const { count, error } = await supabase.from('registros_guardia')
                        .select('id', { count: 'exact', head: true })
                        .eq('servicio', serv)
                        .gte('fecha_de_ingreso', start)
                        .lt('fecha_de_ingreso', end);
                    if (error) throw error;
                    return count || 0;
                };

                const [
                    aCum26, aCum25, aLast26, aLast25,
                    pCum26, pCum25, pLast26, pLast25
                ] = await Promise.all([
                    getCount('Adultos', `${year}-01-01`, isoEnd),
                    getCount('Adultos', isoStart2025, isoEnd2025),
                    getCount('Adultos', isoStartLast, isoEnd),
                    getCount('Adultos', isoStartLast2025, isoEndLast2025),
                    getCount('Pediatría', `${year}-01-01`, isoEnd),
                    getCount('Pediatría', isoStart2025, isoEnd2025),
                    getCount('Pediatría', isoStartLast, isoEnd),
                    getCount('Pediatría', isoStartLast2025, isoEndLast2025),
                ]);

                // Días transcurridos en meses cerrados (Ene + Feb = 59 o 60)
                const daysPassed = Math.round((new Date(year, limitMonth, 1) - new Date(year, 0, 1)) / (1000 * 60 * 60 * 24));

                setStats({
                    adultos: { 
                        cum2026: aCum26, cum2025: aCum25, 
                        last2026: aLast26, last2025: aLast25,
                        dailyAvg2026: aCum26 / daysPassed,
                        monthlyAvg2026: aCum26 / limitMonth
                    },
                    pediatria: { 
                        cum2026: pCum26, cum2025: pCum25, 
                        last2026: pLast26, last2025: pLast25,
                        dailyAvg2026: pCum26 / daysPassed,
                        monthlyAvg2026: pCum26 / limitMonth
                    },
                    periodInfo: { acumuladoLabel, mesCerradoLabel },
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
                <p className="text-[#7d8590] font-medium animate-pulse">Analizando periodos...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20 px-4 pt-8">
             {/* Simple Title instead of Sidebar Title */}
             <div className="flex flex-col items-start gap-2 py-4">
                <h1 className="text-3xl font-black text-[#e6edf3] font-ibm-plex tracking-tight flex items-center gap-3">
                    <Activity className="text-[#2f81f7]" size={28} />
                    Sala de Situación HPN
                </h1>
                <div className="flex items-center gap-2 text-[#7d8590] text-[10px] font-bold uppercase tracking-widest">
                    <span className={`w-2 h-2 rounded-full ${conexion === 'conectado' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {conexion === 'conectado' ? 'Datos Actualizados' : 'Error de Conexión'}
                </div>
             </div>

            {/* Main Stats Grid */}
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <CalendarDays className="text-[#2f81f7]" size={20} />
                    <h2 className="text-[#e6edf3] font-bold text-lg tracking-widest uppercase">Comparativa Interanual 2026 vs 2025</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ServiceStats 
                        title="Sector Adultos" 
                        data={stats.adultos}
                        periodInfo={stats.periodInfo}
                        icon={Users} 
                        colorClass="bg-blue-500" 
                    />
                    <ServiceStats 
                        title="Sector Pediatría" 
                        data={stats.pediatria}
                        periodInfo={stats.periodInfo}
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
